export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js';
import { guardRequest, jsonError, isAdminRequest, userIdFromRequest } from '@/lib/api/guard';
import { bewerte } from '@/lib/diplome/fragen';
import { pruefeZiehung, tokenSecret } from '@/lib/diplome/pruefung-token';
import {
  DIPLOM_COURSE_SLUG,
  ERSTE_BEZAHLSTUFE,
  QUIZ_FRAGEN_PRO_PRUEFUNG,
  isStufeKey,
  stufeByKey,
} from '@/lib/diplome/stufen';

/**
 * /api/diplome/pruefung — die einzige Stelle, die eine Pruefung stellt und
 * ein Ergebnis verbindlich feststellt.
 *
 * Die Ziehung stellt /api/diplome/pruefung/ziehung (POST { modul }) — sie gibt
 * Fragen OHNE Loesung zurueck und ein signiertes Token fuer genau diese Ziehung.
 * POST { modul, token, antworten[] } → prueft das Token, bewertet genau die
 *                           gezogenen Fragen, schreibt bei Bestehen in
 *                           course_progress (service_role).
 *
 * Warum es diese Route gibt (Audit 06.09.2026, Showstopper S1):
 *  - Vorher bewertete der Browser und schrieb selbst in course_progress —
 *    mit `status: 'bestanden'` unabhaengig vom Ergebnis. Jedes Konto konnte
 *    sich „Master of Steak" eintragen.
 * Jetzt: Server bewertet, Server prueft die Berechtigung, Server schreibt.
 *
 * Warum Ziehung + Token (Rahmenlehrplan §8, 08.09.2026):
 *  - Die Pruefung zieht 10 aus einem Pool von 33 (Stufe 1). Wuerde der Browser
 *    ziehen, koennte er sich die Fragen aussuchen. Also zieht der Server und
 *    signiert die ids; der POST gilt nur fuer genau diese Ziehung.
 *  - Der Browser bekommt die Fragen ohne `correct` und `explain`. Vorher lag
 *    die komplette Fragenbank samt Loesungen im Client-Bundle.
 *  - Das Token ist zustandslos (HMAC), 30 Minuten gueltig — kein Tabelleneintrag
 *    pro Ziehung, kein Aufraeumen.
 *
 * Antwort POST: { score, gesamt, grenze, bestanden, badge, ergebnisse[],
 * gespeichert, hinweis? } — gespeichert=false + hinweis, wenn kein Login
 * (Stufe 1 darf anonym geuebt werden, aber nichts wird eingetragen).
 */

const PostBody = z.object({
  modul: z.string().min(1).max(32),
  token: z.string().min(16).max(4096),
  antworten: z.array(z.number().int().min(-1).max(16)).min(1).max(QUIZ_FRAGEN_PRO_PRUEFUNG),
});

export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    key: 'diplome-pruefung',
    rate: { limit: 30, windowMs: 10 * 60 * 1000 },
    schema: PostBody,
    auth: 'none',
  });
  if (!guard.ok) return guard.response;

  const { modul, token, antworten } = guard.body;
  if (!isStufeKey(modul)) return jsonError(400, 'Unbekanntes Modul.');
  const stufe = stufeByKey(modul)!;

  const secret = tokenSecret();
  if (!secret) return jsonError(503, 'Prüfung derzeit nicht verfügbar.');
  const ziehung = pruefeZiehung(token, secret);
  if (!ziehung || ziehung.m !== modul) return jsonError(400, 'Prüfung ungültig oder abgelaufen — bitte neu starten.');
  if (ziehung.ids.length !== antworten.length) return jsonError(400, 'Antworten passen nicht zur Prüfung.');

  const admin = isAdminRequest(req);
  const userId = await userIdFromRequest(req);
  const bezahlstufe = stufe.nr >= ERSTE_BEZAHLSTUFE;

  // Berechtigung fuer Stufe 2–5: Admin oder aktive Buchung.
  if (bezahlstufe && !admin) {
    if (!userId) return jsonError(401, 'Für diese Prüfung musst du angemeldet sein.');
    const adminDb = adminClient();
    if (!adminDb) return jsonError(503, 'Prüfung derzeit nicht verfügbar.');
    const zugang = await hatDiplomBuchung(adminDb, userId);
    if (!zugang) return jsonError(403, 'diplom_erforderlich');
  }

  const ergebnis = bewerte(modul, ziehung.ids, antworten);

  let gespeichert = false;
  let hinweis: string | undefined;

  if (!userId) {
    hinweis = 'Ohne Anmeldung wird das Ergebnis nicht gespeichert.';
  } else if (ergebnis.bestanden) {
    const adminDb = adminClient();
    if (!adminDb) {
      hinweis = 'Ergebnis konnte nicht gespeichert werden.';
    } else {
      const { error } = await adminDb.from('course_progress').upsert(
        {
          user_id: userId,
          modul,
          stufe: stufe.nr,
          status: 'bestanden',
          quiz_score: ergebnis.score,
          badge: stufe.badge,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,modul' },
      );
      if (error) {
        console.error('[diplome/pruefung] upsert fehlgeschlagen:', error.message);
        hinweis = 'Ergebnis konnte nicht gespeichert werden.';
      } else {
        gespeichert = true;
      }
    }
  }

  return Response.json({
    score: ergebnis.score,
    gesamt: ergebnis.gesamt,
    grenze: ergebnis.grenze,
    bestanden: ergebnis.bestanden,
    badge: ergebnis.bestanden ? stufe.badge : null,
    ergebnisse: ergebnis.ergebnisse,
    gespeichert,
    hinweis,
  });
}

// ── Supabase ────────────────────────────────────────────────────────────────

function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function hatDiplomBuchung(db: SupabaseClient, userId: string): Promise<boolean> {
  const { data: course } = await db.from('courses').select('id').eq('slug', DIPLOM_COURSE_SLUG).maybeSingle();
  const courseId = (course as { id?: string } | null)?.id;
  if (!courseId) return false;
  const { data: booking } = await db
    .from('bookings')
    .select('status')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle();
  const status = (booking as { status?: string } | null)?.status;
  return status === 'active' || status === 'confirmed';
}
