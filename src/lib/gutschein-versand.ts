/**
 * Versand eines Geschenkgutscheins an die beschenkte Person (Uwe, 11.10.2026).
 *
 * Zwei Wege rufen das hier auf:
 *   - `/api/gutschein/personalisieren` bei „Sofort" (direkt nach dem Speichern)
 *   - `/api/gutschein/versand` — stündlich über .github/workflows/gutschein-versand.yml
 *
 * Ablauf je Gutschein: übernehmen (geplant → in_arbeit, nur wenn noch geplant —
 * zwei gleichzeitige Läufe schicken nie doppelt) → Mail über Loops → versendet,
 * Adresse löschen, maskierten Hinweis behalten. Scheitert der Versand, geht der
 * Gutschein zurück auf „geplant"; nach MAX_VERSAND_VERSUCHE auf „fehlgeschlagen".
 *
 * Nur serverseitig (Service-Role, Loops-Schlüssel).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { gueltigBisText } from '@/lib/gutschein-gueltigkeit';
import { MAX_VERSAND_VERSUCHE, MOTIVE, motivOderStandard } from '@/lib/gutschein-personalisierung';

/** Ohne diese Vorlage bietet die Geschenkseite den Mail-Versand gar nicht an. */
export function mailVersandVerfuegbar(): boolean {
  return Boolean(process.env.LOOPS_API_KEY && process.env.LOOPS_VOUCHER_GIFT_TEMPLATE_ID);
}

export type VersandErgebnis = 'versendet' | 'uebersprungen' | 'erneut-geplant' | 'fehlgeschlagen';

interface VersandZeile {
  id: string;
  code: string;
  status: string;
  valid_until: string;
  empfaenger_email: string | null;
  empfaenger_hinweis: string | null;
  empfaenger_name: string | null;
  schenker_name: string | null;
  gift_message: string | null;
  motiv: string | null;
  versand_versuche: number;
  courses: { title: string } | null;
}

const SPALTEN =
  'id, code, status, valid_until, empfaenger_email, empfaenger_hinweis, empfaenger_name, schenker_name, gift_message, motiv, versand_versuche, courses(title)';

async function sendeGeschenkMail(z: VersandZeile): Promise<void> {
  const apiKey = process.env.LOOPS_API_KEY;
  const templateId = process.env.LOOPS_VOUCHER_GIFT_TEMPLATE_ID;
  if (!apiKey || !templateId) throw new Error('LOOPS_API_KEY or LOOPS_VOUCHER_GIFT_TEMPLATE_ID not set');
  if (!z.empfaenger_email) throw new Error('keine Empfänger-Adresse');

  const motiv = MOTIVE[motivOderStandard(z.motiv)];
  const resp = await fetch('https://app.loops.so/api/v1/transactional', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionalId: templateId,
      email: z.empfaenger_email,
      // Alle Variablen immer mitschicken (auch leer) — die Vorlage in Loops erwartet
      // genau diese Namen (docs/gutschein-sichtbarkeit-konzept.md, „Loops-Vorlage").
      dataVariables: {
        empfaenger_name: z.empfaenger_name ?? '',
        schenker_name: z.schenker_name ?? '',
        nachricht: z.gift_message ?? '',
        anlass: motiv.ueberschrift ?? '',
        course_title: z.courses?.title ?? 'Steakakademie',
        voucher_code: z.code,
        // Ohne Schlüssel: Die beschenkte Person sieht die Geschenkseite, nicht das Formular.
        voucher_url: `https://steakakademie.de/gutschein/${encodeURIComponent(z.code)}`,
        gueltig_bis: gueltigBisText(z.valid_until),
      },
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`loops gift email failed (${resp.status}): ${text.slice(0, 300)}`);
  }
}

/**
 * Versendet einen fälligen Gutschein. Übernimmt ihn nur, wenn er noch „geplant" ist —
 * sonst `uebersprungen` (anderer Lauf war schneller, abgesagt, eingelöst).
 */
export async function versendeGutschein(admin: SupabaseClient, id: string): Promise<VersandErgebnis> {
  const { data: zeile, error: claimErr } = await admin
    .from('vouchers')
    .update({ versand_status: 'in_arbeit' })
    .eq('id', id)
    .eq('versand_status', 'geplant')
    .select(SPALTEN)
    .maybeSingle();
  if (claimErr) throw new Error(`claim failed: ${claimErr.message}`);
  if (!zeile) return 'uebersprungen';
  const z = zeile as unknown as VersandZeile;

  // Zurückgenommen (Erstattung) oder schon eingelöst: nichts mehr verschicken.
  if (z.status !== 'issued') {
    await admin.from('vouchers').update({ versand_status: 'keiner', empfaenger_email: null, versand_am: null }).eq('id', id);
    return 'uebersprungen';
  }

  try {
    await sendeGeschenkMail(z);
    await admin
      .from('vouchers')
      .update({
        versand_status: 'versendet',
        versendet_am: new Date().toISOString(),
        empfaenger_email: null,
        versand_fehler: null,
      })
      .eq('id', id);
    return 'versendet';
  } catch (err) {
    // Adressen nicht ins Log/die Datenbank (Fehlertexte von Loops können sie enthalten).
    const fehler = String((err as Error)?.message ?? err).replace(/[^\s@:<>()"]+@[^\s@<>()"]+/g, '<email>').slice(0, 500);
    const versuche = (z.versand_versuche ?? 0) + 1;
    const endgueltig = versuche >= MAX_VERSAND_VERSUCHE;
    await admin
      .from('vouchers')
      .update({
        versand_status: endgueltig ? 'fehlgeschlagen' : 'geplant',
        versand_versuche: versuche,
        versand_fehler: fehler,
      })
      .eq('id', id);
    console.error('[gutschein-versand] Versand gescheitert', { code: z.code, versuche, fehler });
    return endgueltig ? 'fehlgeschlagen' : 'erneut-geplant';
  }
}

export interface LaufBericht {
  faellig: number;
  versendet: number;
  uebersprungen: number;
  erneutGeplant: number;
  fehlgeschlagen: number;
  /** Gutscheine, die schon „fehlgeschlagen" stehen — der Lauf bleibt rot, bis jemand hinsieht. */
  offeneFehler: number;
  /** „in_arbeit" seit über einer Stunde: ein Lauf ist mittendrin abgebrochen. */
  haengend: number;
}

/** Ein Lauf: alle fälligen Gutscheine versenden und Bericht zurückgeben. */
export async function verarbeiteFaellige(admin: SupabaseClient, jetzt: Date = new Date()): Promise<LaufBericht> {
  const bericht: LaufBericht = { faellig: 0, versendet: 0, uebersprungen: 0, erneutGeplant: 0, fehlgeschlagen: 0, offeneFehler: 0, haengend: 0 };

  const { data: faellige, error } = await admin
    .from('vouchers')
    .select('id')
    .eq('versand_status', 'geplant')
    .lte('versand_am', jetzt.toISOString())
    .order('versand_am', { ascending: true })
    .limit(50);
  if (error) throw new Error(`faellige lesen: ${error.message}`);

  bericht.faellig = faellige?.length ?? 0;
  for (const { id } of faellige ?? []) {
    const e = await versendeGutschein(admin, id as string);
    if (e === 'versendet') bericht.versendet++;
    else if (e === 'uebersprungen') bericht.uebersprungen++;
    else if (e === 'erneut-geplant') bericht.erneutGeplant++;
    else bericht.fehlgeschlagen++;
  }

  const { count: offen } = await admin
    .from('vouchers')
    .select('id', { count: 'exact', head: true })
    .eq('versand_status', 'fehlgeschlagen')
    .eq('status', 'issued');
  bericht.offeneFehler = offen ?? 0;

  const { count: haengend } = await admin
    .from('vouchers')
    .select('id', { count: 'exact', head: true })
    .eq('versand_status', 'in_arbeit')
    .lte('versand_am', new Date(jetzt.getTime() - 3_600_000).toISOString());
  bericht.haengend = haengend ?? 0;

  return bericht;
}

/** Rot, sobald irgendetwas nicht zugestellt ist oder hängt (CLAUDE.md §2 Regel 10). */
export function laufIstRot(b: LaufBericht): boolean {
  return b.fehlgeschlagen > 0 || b.erneutGeplant > 0 || b.offeneFehler > 0 || b.haengend > 0;
}
