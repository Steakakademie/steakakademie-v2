/**
 * POST /api/mein-protokoll/generate
 *
 * Erstellt ein Protokoll (8-Wochen-Plan) oder dessen eine kostenlose Korrektur.
 *
 * Schutz, in dieser Reihenfolge:
 *   1. guardRequest   — same-origin, Rate-Limit, Body-Schema
 *   2. Login + aktive Buchung auf Kurs "mein-protokoll"
 *   3. Guthaben       — modus 'neu' braucht ein freies, bezahltes Protokoll;
 *                       modus 'korrektur' ein Protokoll ohne Korrektur
 *   4. Erzeugung      — gegen generierungsSchema(); danach pruefePlan() gegen
 *                       die Kerntemperatur-Referenz. Ein Verstoß verwirft den
 *                       Plan; EIN zweiter Versuch mit den Verstößen im Prompt.
 *   5. Speichern      — DB-Funktion protokoll_speichern prüft das Guthaben in
 *                       derselben Transaktion noch einmal (Race-sicher).
 *
 * Scheitert Schritt 4 oder 5, wird nichts gespeichert und nichts verbraucht.
 *
 * Bis 02.10.2026: kein Rate-Limit, unbegrenzt wiederholbar, Kerntemperaturen
 * ungeprüft aus einem Prompt mit eigenen, von der Referenz abweichenden Werten.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { guardRequest } from '@/lib/api/guard';
import { AnswersSchema, AuftragSchema, type Plan } from '@/lib/mein-protokoll/schema';
import { generierungsSchema, pruefePlan, zuAnzeige } from '@/lib/mein-protokoll/generierung';
import { buildKorrekturPrompt, buildUserPrompt, systemPrompt } from '@/lib/mein-protokoll/prompts';
import { ladeStand, planVon } from '@/lib/mein-protokoll/stand';
import { BESTAETIGUNG_KORREKTUR, BESTAETIGUNG_NEU } from '@/lib/mein-protokoll/texte';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Zwei Versuche à max. 140 s plus Speichern. Vercel Pro erlaubt 300 s.
export const maxDuration = 300;

const COURSE_SLUG = 'mein-protokoll';
const VERSUCH_TIMEOUT_MS = 140_000;
// Ein Kauf braucht einen Aufruf, die Korrektur einen zweiten. Sechs je Stunde
// lassen Raum für Fehlversuche und halten eine Skript-Schleife klein.
const RATE = { limit: 6, windowMs: 60 * 60 * 1_000 };

function fehler(status: number, error: string, code?: string) {
  return NextResponse.json({ error, ...(code ? { code } : {}) }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const guard = await guardRequest(req, { key: 'mein-protokoll-generate', rate: RATE, schema: AuftragSchema });
  if (!guard.ok) return guard.response;
  const auftrag = guard.body;

  // 2) Login + Buchung
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fehler(401, 'Nicht eingeloggt.');

  const { data: course } = await supabase
    .from('courses').select('id').eq('slug', COURSE_SLUG).maybeSingle();
  if (!course) return fehler(403, 'Kein Zugang. Bitte zuerst kaufen.');

  const { data: booking } = await supabase
    .from('bookings').select('id')
    .eq('course_id', course.id)
    .is('revoked_at', null)
    .in('status', ['active', 'confirmed', 'pending'])
    .maybeSingle();
  if (!booking) return fehler(403, 'Kein Zugang. Bitte zuerst kaufen.');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[mein-protokoll] ANTHROPIC_API_KEY fehlt');
    return fehler(503, 'Die Plan-Erstellung ist gerade nicht verfügbar. Bitte versuch es später erneut.');
  }

  // 3) Guthaben
  const stand = await ladeStand(supabase, user.id);
  if (!stand.verfuegbar) {
    console.error('[mein-protokoll] Guthaben nicht lesbar — Migration mein_protokoll_guthaben angewendet?');
    return fehler(503, 'Die Plan-Erstellung ist gerade nicht verfügbar. Bitte versuch es später erneut.');
  }
  const { guthaben } = stand;

  let korrekturVon: string | null = null;
  let vorgaenger: Plan | null = null;
  let korrekturPlan: Plan | null = null;

  if (auftrag.modus === 'korrektur') {
    const ziel = auftrag.korrekturVon
      ? guthaben.protokolle.find((p) => p.basisId === auftrag.korrekturVon)
      : guthaben.korrigierbar;
    if (!ziel) return fehler(409, 'Dieses Protokoll gibt es nicht.', 'nicht_korrigierbar');
    if (ziel.korrigiert) return fehler(409, 'Die kostenlose Korrektur für dieses Protokoll ist bereits verbraucht.', 'korrektur_verbraucht');
    korrekturVon = ziel.basisId;
    korrekturPlan = planVon(stand, ziel.basisId);
  } else {
    if (guthaben.frei <= 0) {
      return fehler(409, 'Dein Guthaben ist verbraucht. Für ein weiteres Protokoll brauchst du einen neuen Kauf.', 'kein_guthaben');
    }
    const letztes = guthaben.protokolle[guthaben.protokolle.length - 1];
    vorgaenger = letztes ? planVon(stand, letztes.aktuellId) : null;
  }

  // 4) Erzeugen + prüfen
  const answers = AnswersSchema.parse(auftrag);
  const schema = generierungsSchema();
  const basisPrompt = buildUserPrompt(answers, {
    vorgaenger,
    korrektur: korrekturPlan ? { plan: korrekturPlan, hinweis: auftrag.hinweis } : null,
  });

  let plan: Plan | null = null;
  let verstoesse: string[] = [];

  for (let versuch = 1; versuch <= 2 && !plan; versuch++) {
    try {
      const result = await generateObject({
        model: anthropic('claude-sonnet-4-5'),
        schema,
        system: systemPrompt(),
        prompt: verstoesse.length ? `${basisPrompt}\n\n${buildKorrekturPrompt(verstoesse)}` : basisPrompt,
        maxTokens: 12000,
        temperature: 0.5,
        abortSignal: AbortSignal.timeout(VERSUCH_TIMEOUT_MS),
      });
      verstoesse = pruefePlan(result.object);
      if (verstoesse.length === 0) {
        plan = zuAnzeige(result.object);
      } else {
        console.warn('[mein-protokoll] Plan verworfen', { versuch, anzahl: verstoesse.length, erste: verstoesse.slice(0, 3) });
      }
    } catch (err) {
      console.error('[mein-protokoll] Erzeugung gescheitert', { versuch, err });
    }
  }

  if (!plan) {
    return fehler(502, 'Der Plan konnte gerade nicht in der geforderten Qualität erstellt werden. Es wurde nichts verbraucht — bitte versuch es noch einmal.');
  }

  // 5) Speichern — Guthaben wird in der DB-Funktion erneut geprüft.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await admin.rpc('protokoll_speichern', {
    p_user_id:       user.id,
    p_answers:       answers,
    p_plan:          plan,
    p_korrektur_von: korrekturVon,
    p_bestaetigung:  korrekturVon ? BESTAETIGUNG_KORREKTUR : BESTAETIGUNG_NEU,
  });

  if (error) {
    console.error('[mein-protokoll] protokoll_speichern gescheitert', error);
    return fehler(500, 'Speichern fehlgeschlagen. Es wurde nichts verbraucht — bitte versuch es noch einmal.');
  }

  const status = (data as { status?: string; id?: string } | null)?.status;
  if (status !== 'ok') {
    const text: Record<string, string> = {
      kein_guthaben:        'Dein Guthaben ist verbraucht. Für ein weiteres Protokoll brauchst du einen neuen Kauf.',
      korrektur_verbraucht: 'Die kostenlose Korrektur für dieses Protokoll ist bereits verbraucht.',
      nicht_korrigierbar:   'Dieses Protokoll lässt sich nicht korrigieren.',
    };
    return fehler(409, text[status ?? ''] ?? 'Speichern nicht möglich.', status);
  }

  return NextResponse.json({ ok: true, id: (data as { id: string }).id }, { headers: { 'Cache-Control': 'no-store' } });
}
