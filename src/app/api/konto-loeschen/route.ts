/**
 * POST /api/konto-loeschen   (application/json)
 *
 * Konto-Löschung auf eigenen Wunsch — DSGVO Art. 17 (Recht auf Löschung).
 *
 * Was gelöscht wird (unwiderruflich):
 *  - das Konto selbst (auth.users, inkl. E-Mail-Adresse und Login-Identitäten)
 *  - Profil / Grillmeister-Vita        (profiles)
 *  - Lernfortschritt                   (course_progress)
 *  - Streitfall-Abstimmungen           (streitfall_votes)
 *  - Streitfall-Erfahrungsberichte     (streitfall_beitraege)
 *  - Grill-Protokolle                  (protokolle)
 *  - Steak-Diagnosen + Credit-Konto    (diagnosen, diagnose_credits)
 *
 * Was NICHT gelöscht, sondern ANONYMISIERT wird — user_recipes:
 *  Community-Rezepte bleiben bestehen. Sie sind veröffentlichter Inhalt der
 *  Seite mit eigenem Community- und SEO-Wert; ein Löschen würde Rezeptseiten
 *  reißen, auf die intern und extern verlinkt wird. Personenbezogen ist an
 *  einem Rezept allein der Anzeigename, nicht das Rezept selbst. Deshalb:
 *    1. author_name wird VOR der Konto-Löschung auf 'Ehemaliges Mitglied'
 *       überschrieben,
 *    2. user_id räumt danach der FK ON DELETE SET NULL automatisch weg.
 *  Danach besteht keine Verknüpfung zur Person mehr — dem Löschanspruch aus
 *  Art. 17 ist damit genügt, ohne den Bestand zu beschädigen.
 *
 *  REIHENFOLGE IST KRITISCH: Das author_name-Update muss laufen, SOLANGE
 *  user_id noch gesetzt ist. Nach deleteUser() hat ON DELETE SET NULL die
 *  Spalte geleert — die Zeilen wären über user_id nicht mehr auffindbar und
 *  trügen den Klarnamen dauerhaft weiter.
 *
 * Die gelöschten Tabellen referenzieren auth.users(id) mit ON DELETE CASCADE
 * (siehe supabase/migrations/). Wir löschen sie trotzdem VORHER explizit per
 * Service-Role — defensiv, falls der Live-Stand einer Tabelle vom
 * Migrations-Stand abweicht (Ledger-Diskrepanzen gab es schon). Reihenfolge:
 * erst abhängige Inhalte, zuletzt profiles, danach der Auth-Account.
 *
 * Käufe/Buchungen (bookings) — bewusst NICHT explizit angefasst:
 *  - Rechnungs- und Zahlungsdaten unterliegen der Aufbewahrungspflicht
 *    (§ 257 HGB, § 147 AO). Die eigentliche Kauf-/Audit-Spur liegt in
 *    digistore_orders (Schlüssel: Digistore-Order-ID + E-Mail, KEIN
 *    user_id-Verweis auf auth.users) und bleibt daher von der Konto-Löschung
 *    unberührt — die Aufbewahrungspflicht ist darüber abgedeckt.
 *  - bookings selbst ist nur die Zugangs-Zuordnung Nutzer↔Kurs. user_id ist
 *    dort NOT NULL (auf NULL setzen unmöglich). Nach 001_initial_schema.sql
 *    trägt der FK ON DELETE CASCADE — die Zeilen fallen also mit deleteUser
 *    automatisch weg. OFFENER PUNKT: In 20260528_digistore_webhook.sql ist
 *    bookings ohne FK definiert (CREATE IF NOT EXISTS, greift nur bei frischer
 *    DB); je nach Live-Stand blieben dann verwaiste bookings-Zeilen zurück.
 *    Das ist unkritisch (keine personenbezogenen Daten außer der toten UUID),
 *    wird hier aber bewusst nicht "repariert".
 *
 * Weiterer offener Punkt: diagnosen.image_path zeigt auf Storage-Objekte;
 * hochgeladene Diagnose-Bilder im Storage-Bucket werden hier noch nicht
 * mitgelöscht (separates Storage-API, Bucket-Name nicht in den Migrations).
 *
 * Flow:
 *  1. Auth — nur der eingeloggte Nutzer kann SEIN Konto löschen (401 sonst)
 *  2. Body-Validierung (Zod): { bestaetigung: 'LÖSCHEN' } — exakt
 *  3. Service-Role: Community-Rezepte anonymisieren (vor allem anderen)
 *  4. Service-Role: Nutzerdaten tabellenweise löschen (defensiv)
 *  5. admin.auth.admin.deleteUser(user.id)
 *  6. Session-Cookies beenden (signOut, best effort)
 *  7. Antwort { ok: true }
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const InputSchema = z.object({
  bestaetigung: z.literal('LÖSCHEN'),
});

/** Ersetzt den Anzeigenamen an allen Rezepten des gelöschten Kontos. */
const ANONYMER_AUTOR = 'Ehemaliges Mitglied';

/**
 * Reihenfolge: erst Inhalte, zuletzt das Profil.
 * bookings fehlt hier absichtlich — siehe Kopfkommentar (HGB/AO).
 * user_recipes fehlt hier absichtlich — wird anonymisiert, nicht gelöscht.
 */
const TABELLEN_MIT_USER_ID = [
  'streitfall_votes',
  'streitfall_beitraege',
  'course_progress',
  'protokolle',
  'diagnosen',
  'diagnose_credits',
  'profiles',
] as const;

export async function POST(req: Request) {
  // 1) Auth
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Bitte melde dich an, um dein Konto zu löschen.' },
      { status: 401 },
    );
  }

  // 2) Bestätigung prüfen
  try {
    const body = await req.json();
    InputSchema.parse(body);
  } catch {
    return NextResponse.json(
      { error: 'Bestätigung fehlt. Bitte gib exakt „LÖSCHEN" ein.' },
      { status: 400 },
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('[konto-loeschen] Service-Role-Konfiguration fehlt');
    return NextResponse.json(
      { error: 'Die Konto-Löschung ist momentan nicht möglich. Bitte versuche es später erneut.' },
      { status: 500 },
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 3) Community-Rezepte anonymisieren — MUSS vor deleteUser laufen, solange
  //    user_id noch gesetzt ist (danach hat ON DELETE SET NULL sie geleert).
  //    Schlägt das fehl, brechen wir ab: lieber ein weiterhin bestehendes
  //    Konto als Rezepte, die den Klarnamen behalten.
  {
    const { error } = await admin
      .from('user_recipes')
      .update({ author_name: ANONYMER_AUTOR })
      .eq('user_id', user.id);
    if (error) {
      console.error('[konto-loeschen] Anonymisieren von user_recipes fehlgeschlagen', error);
      return NextResponse.json(
        { error: 'Die Löschung konnte nicht abgeschlossen werden. Dein Konto besteht weiter — bitte versuche es später erneut oder melde dich über das Kontaktformular.' },
        { status: 500 },
      );
    }
  }

  // 4) Nutzerdaten tabellenweise löschen (defensiv — Cascade fängt den Rest)
  for (const tabelle of TABELLEN_MIT_USER_ID) {
    const { error } = await admin.from(tabelle).delete().eq('user_id', user.id);
    if (error) {
      // Kein interner Detail-Leak nach außen — Details nur ins Server-Log.
      console.error(`[konto-loeschen] Löschen aus ${tabelle} fehlgeschlagen`, error);
      return NextResponse.json(
        { error: 'Die Löschung konnte nicht abgeschlossen werden. Dein Konto besteht weiter — bitte versuche es später erneut oder melde dich über das Kontaktformular.' },
        { status: 500 },
      );
    }
  }

  // 5) Auth-Account löschen (entfernt E-Mail + Identitäten; Cascade räumt Reste,
  //    ON DELETE SET NULL trennt die anonymisierten Rezepte vom Konto)
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error('[konto-loeschen] deleteUser fehlgeschlagen', delErr);
    return NextResponse.json(
      { error: 'Die Löschung konnte nicht abgeschlossen werden. Bitte versuche es später erneut oder melde dich über das Kontaktformular.' },
      { status: 500 },
    );
  }

  // 6) Session-Cookies beenden (best effort — das Konto ist bereits weg)
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignorieren — Session ist serverseitig ohnehin ungültig */
  }

  // 7) Fertig
  return NextResponse.json({ ok: true });
}
