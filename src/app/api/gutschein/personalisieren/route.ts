/**
 * POST /api/gutschein/personalisieren
 *
 * Der Schenkende macht seinen Gutschein persönlich (Name, Nachricht, Motiv) und
 * entscheidet, ob er ihn selbst weitergibt oder ob wir ihn per Mail an die
 * beschenkte Person schicken — sofort oder zum Wunschtermin (Uwe, 11.10.2026).
 *
 * Berechtigung: Gutschein-Code UND Schlüssel (`k`). Der Schlüssel steht nur im Link
 * der Käufer-Mail; der Code allein (den der Beschenkte hat) reicht nicht.
 * Kein Login: Der Käufer hat bei einem Gutschein bewusst kein Konto (Webhook).
 *
 * Gesperrt, sobald der Gutschein verschickt, eingelöst oder zurückgenommen ist.
 * Rate-Limit: 20 Speichervorgänge / IP / Stunde.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { guardRequest } from '@/lib/api/guard';
import {
  PersonalisierungSchema,
  berlinZuUtc,
  maskiereEmail,
  pruefeTermin,
  schluesselGleich,
  versandZeitText,
} from '@/lib/gutschein-personalisierung';
import { mailVersandVerfuegbar, versendeGutschein } from '@/lib/gutschein-versand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE = { limit: 20, windowMs: 60 * 60 * 1_000 };

function fehler(text: string, status = 400) {
  return NextResponse.json({ error: text }, { status });
}

export async function POST(req: Request) {
  const guard = await guardRequest(req, { key: 'gutschein-personalisieren', rate: RATE, schema: PersonalisierungSchema });
  if (!guard.ok) return guard.response;
  const e = guard.body;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: v, error: leseFehler } = await admin
    .from('vouchers')
    .select('id, status, valid_until, schenker_token, versand_status')
    .eq('code', e.code.toUpperCase())
    .maybeSingle();
  if (leseFehler) {
    console.error('[gutschein-personalisieren] lesen', leseFehler);
    return fehler('Speichern hat nicht geklappt. Bitte versuch es gleich noch einmal.', 500);
  }
  // Gleiche Antwort für „Code unbekannt" und „Schlüssel falsch": nichts verraten.
  if (!v || !schluesselGleich(String(v.schenker_token ?? ''), e.k)) {
    return fehler('Dieser Link ist nicht gültig. Nutze den Link aus deiner Gutschein-Mail.', 403);
  }
  if (v.status !== 'issued') return fehler('Der Gutschein ist schon eingelöst oder nicht mehr gültig.', 409);
  if (v.versand_status === 'versendet' || v.versand_status === 'in_arbeit') {
    return fehler('Der Gutschein ist schon unterwegs — ändern geht jetzt nicht mehr.', 409);
  }

  const basis = {
    empfaenger_name: e.empfaengerName,
    schenker_name: e.schenkerName,
    gift_message: e.nachricht,
    motiv: e.motiv,
  };

  // ── Selbst weitergeben: geplanten Versand (falls vorhanden) absagen ──
  if (e.versand === 'selbst') {
    const { error } = await admin
      .from('vouchers')
      .update({
        ...basis,
        versand_status: 'keiner',
        empfaenger_email: null,
        empfaenger_hinweis: null,
        versand_am: null,
        versand_versuche: 0,
        versand_fehler: null,
      })
      .eq('id', v.id);
    if (error) {
      console.error('[gutschein-personalisieren] speichern', error);
      return fehler('Speichern hat nicht geklappt. Bitte versuch es gleich noch einmal.', 500);
    }
    return NextResponse.json({ ok: true, versand: 'selbst' });
  }

  // ── Per Mail an die beschenkte Person ──
  if (!mailVersandVerfuegbar()) {
    return fehler('Der Mail-Versand ist gerade nicht eingerichtet. Gib den Gutschein selbst weiter.', 503);
  }

  const jetzt = new Date();
  const termin = e.zeitpunkt === 'sofort' ? jetzt : berlinZuUtc(e.datum!, e.stunde!);
  if (e.zeitpunkt === 'termin') {
    const problem = pruefeTermin(termin, new Date(v.valid_until as string), jetzt);
    if (problem) return fehler(problem);
  }

  const email = e.empfaengerEmail!.toLowerCase();
  const { error } = await admin
    .from('vouchers')
    .update({
      ...basis,
      versand_status: 'geplant',
      empfaenger_email: email,
      empfaenger_hinweis: maskiereEmail(email),
      versand_am: termin.toISOString(),
      versand_versuche: 0,
      versand_fehler: null,
    })
    .eq('id', v.id);
  if (error) {
    console.error('[gutschein-personalisieren] speichern', error);
    return fehler('Speichern hat nicht geklappt. Bitte versuch es gleich noch einmal.', 500);
  }

  if (e.zeitpunkt === 'sofort') {
    const ergebnis = await versendeGutschein(admin, v.id as string).catch((err) => {
      console.error('[gutschein-personalisieren] sofort-versand', err);
      return 'erneut-geplant' as const;
    });
    if (ergebnis === 'versendet') return NextResponse.json({ ok: true, versand: 'versendet' });
    // Bleibt geplant: Der stündliche Lauf versucht es erneut.
    return NextResponse.json({
      ok: true,
      versand: 'geplant',
      hinweis: 'Der Versand hat nicht sofort geklappt — wir versuchen es in der nächsten Stunde erneut.',
    });
  }

  return NextResponse.json({ ok: true, versand: 'geplant', termin: versandZeitText(termin) });
}
