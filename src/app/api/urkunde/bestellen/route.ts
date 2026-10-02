export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { guardRequest, jsonError, isAdminRequest, userIdFromRequest } from '@/lib/api/guard';
import { stufeOfLevel, LEVELS } from '@/lib/diplome/stufen';
import { dienstClient } from '@/lib/urkunde/produktion';
import { meldeBestellung, bestaetigeBestellung } from '@/lib/urkunde/benachrichtigung';
import { urkundeBestellbar, urkundeFehlendeKonfiguration } from '@/lib/urkunde/bestellbar';
import { URKUNDE_CONSENT_TEXT, URKUNDE_LAND_CODES, URKUNDE_WIDERRUF_HINWEIS, URKUNDE_PREIS_CENTS, urkundePreisText } from '@/lib/urkunde/preis';

/**
 * POST /api/urkunde/bestellen — Bestellung einer gedruckten Urkunde.
 *
 * Vorher lief das ueber /api/kontakt: Die Bestellung ging als Freitext-Mail
 * raus und landete in kontaktanfragen. Es gab keinen Status, keine Nummer und
 * keinen Weg zur Druckerei; gedruckt und kuvertiert wurde von Hand.
 *
 * Jetzt entsteht eine Zeile in urkunden_bestellungen mit Status „neu". Den
 * Rest (Nummer, Druck, Versand) macht die Freigabe unter /admin/urkunden.
 *
 * Bestellbar ist nur eine Stufe, die im Konto als bestanden steht — geprueft
 * wird serverseitig gegen course_progress, nicht gegen das, was der Browser
 * mitschickt. Adressfelder sind auf die Laengen der Gelato-Order-API
 * begrenzt; laenger anzunehmen hiesse, die Bestellung erst beim Druckdienst
 * scheitern zu lassen.
 */

const Body = z.object({
  levelId: z.number().int().min(1).max(10),
  nameAufUrkunde: z.string().trim().min(2).max(60),
  vorname: z.string().trim().min(1).max(25),
  nachname: z.string().trim().min(1).max(25),
  strasse: z.string().trim().min(1).max(35),
  adresszusatz: z.string().trim().max(35).optional(),
  plz: z.string().trim().min(1).max(15),
  ort: z.string().trim().min(1).max(30),
  land: z.enum(URKUNDE_LAND_CODES),
  consent: z.literal(true),
});

const NICHT_BESTELLBAR = 'Die gedruckte Urkunde ist gerade nicht bestellbar. Die digitale Urkunde bleibt kostenlos.';

/**
 * GET /api/urkunde/bestellen — sagt der Bestellseite, ob sie das Formular
 * zeigen darf. Gibt nur ja/nein heraus, nie die Namen fehlender Variablen.
 */
export async function GET() {
  return Response.json({ bestellbar: urkundeBestellbar() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  // Vor allem anderen: Ohne verschickbare Bestaetigung und ohne Druckdienst
  // wird keine verbindliche Bestellung angenommen (src/lib/urkunde/bestellbar.ts).
  if (!urkundeBestellbar()) {
    console.warn('[urkunde/bestellen] abgelehnt, Konfiguration fehlt:', urkundeFehlendeKonfiguration().join(', '));
    return jsonError(503, NICHT_BESTELLBAR);
  }

  const guard = await guardRequest(req, {
    key: 'urkunde-bestellen',
    rate: { limit: 5, windowMs: 60 * 60 * 1000 },
    schema: Body,
    auth: 'user-or-admin',
  });
  if (!guard.ok) return guard.response;

  const b = guard.body;
  const level = LEVELS.find((l) => l.id === b.levelId);
  const stufe = stufeOfLevel(b.levelId);
  if (!level || !stufe) return jsonError(400, 'Unbekanntes Level.');

  const userId = await userIdFromRequest(req);
  const admin = await isAdminRequest(req);
  if (!userId && !admin) return jsonError(401, 'Für die Bestellung musst du angemeldet sein.');

  const db = dienstClient();
  if (!db) return jsonError(503, 'Bestellung derzeit nicht möglich.');

  // Berechtigung: Die Stufe muss im Konto als bestanden stehen. Ohne diese
  // Pruefung koennte sich jeder eine Meister-Urkunde drucken lassen.
  let email = '';
  if (userId) {
    const { data: fortschritt } = await db
      .from('course_progress')
      .select('status')
      .eq('user_id', userId)
      .eq('stufe', stufe.nr)
      .eq('status', 'bestanden')
      .maybeSingle();
    if (!fortschritt && !admin) return jsonError(403, 'Diese Stufe steht in deinem Konto nicht als bestanden.');

    const { data: konto } = await db.auth.admin.getUserById(userId);
    email = konto?.user?.email ?? '';
  }
  if (!email) return jsonError(400, 'Zu deinem Konto ist keine E-Mail-Adresse hinterlegt.');

  const jetzt = new Date().toISOString();
  const { data: zeile, error } = await db
    .from('urkunden_bestellungen')
    .insert({
      user_id: userId,
      email,
      stufe: stufe.nr,
      level_id: level.id,
      name_auf_urkunde: b.nameAufUrkunde,
      vorname: b.vorname,
      nachname: b.nachname,
      strasse: b.strasse,
      adresszusatz: b.adresszusatz || null,
      plz: b.plz,
      ort: b.ort,
      land: b.land,
      preis_cents: URKUNDE_PREIS_CENTS,
      status: 'neu',
      consent: true,
      consent_at: jetzt,
      consent_text: URKUNDE_CONSENT_TEXT,
    })
    .select('id')
    .maybeSingle();

  if (error || !zeile) {
    console.error('[urkunde/bestellen] insert', error?.message);
    return jsonError(500, 'Die Bestellung konnte nicht gespeichert werden.');
  }

  await meldeBestellung(
    [
      `Neue Bestellung einer gedruckten Urkunde (${urkundePreisText()})`,
      '',
      `Name auf der Urkunde: ${b.nameAufUrkunde}`,
      `Level ${level.id} — ${level.name} (Stufe ${stufe.nr}, ${stufe.cert})`,
      '',
      'Versandadresse:',
      `${b.vorname} ${b.nachname}`,
      b.strasse,
      b.adresszusatz ?? '',
      `${b.plz} ${b.ort}`,
      b.land,
      '',
      `Freigeben unter /admin/urkunden — Bestell-ID ${zeile.id}`,
    ].filter(Boolean).join('\n'),
    email,
  );

  await bestaetigeBestellung(email, {
    stufeName: `Level ${level.id} — ${level.name} (Stufe ${stufe.nr}, ${stufe.cert})`,
    nameAufUrkunde: b.nameAufUrkunde,
    preis: `${urkundePreisText()} (Versand inklusive, ohne Umsatzsteuer nach § 19 UStG)`,
    bestellId: zeile.id,
    adresse: [`${b.vorname} ${b.nachname}`, b.strasse, b.adresszusatz ?? '', `${b.plz} ${b.ort}`, b.land].filter(Boolean).join(', '),
    widerrufHinweis: URKUNDE_WIDERRUF_HINWEIS,
  });

  return Response.json({ ok: true, id: zeile.id });
}
