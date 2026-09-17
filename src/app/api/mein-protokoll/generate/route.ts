/**
 * POST /api/mein-protokoll/generate
 *
 * Gate: eingeloggt + aktive Booking auf Course "mein-protokoll".
 * Nimmt Fragebogen-Antworten, generiert 8-Wochen-Plan via Claude,
 * speichert in protokolle (Service-Role), gibt { ok, id } zurück.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { AnswersSchema, PlanSchema } from '@/lib/mein-protokoll/schema';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/mein-protokoll/prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

const COURSE_SLUG = 'mein-protokoll';

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY fehlt.' }, { status: 500 });
  }

  // 1) Auth — eingeloggter Nutzer
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 });
  }

  // 2) Booking-Gate — aktive Buchung auf mein-protokoll
  const { data: course } = await supabase
    .from('courses').select('id').eq('slug', COURSE_SLUG).maybeSingle();
  if (!course) {
    return NextResponse.json({ error: 'Produkt nicht gefunden.' }, { status: 403 });
  }
  const { data: booking } = await supabase
    .from('bookings').select('id').eq('course_id', course.id).maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: 'Kein Zugang. Bitte zuerst kaufen.' }, { status: 403 });
  }

  // 3) Antworten validieren
  let answers;
  try {
    answers = AnswersSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Ungültige Fragebogen-Daten.' }, { status: 400 });
  }

  // 4) Plan generieren
  let plan;
  try {
    const result = await generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: PlanSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(answers),
      maxTokens: 12000,
      temperature: 0.5,
    });
    plan = result.object;
  } catch (err: any) {
    console.error('[mein-protokoll] generation failed', err);
    return NextResponse.json({ error: 'Plan-Generierung fehlgeschlagen. Bitte erneut versuchen.' }, { status: 502 });
  }

  // 5) Speichern (Service-Role — umgeht RLS für Insert)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: row, error: insErr } = await admin
    .from('protokolle')
    .insert({ user_id: user.id, answers, plan })
    .select('id')
    .single();

  if (insErr) {
    console.error('[mein-protokoll] insert failed', insErr);
    return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: row.id });
}
