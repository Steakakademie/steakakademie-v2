/**
 * POST /api/steak-beichte/analyze   (multipart/form-data)
 *
 * Felder: problem (text, pflicht), cut?, grillType?, image? (Datei, optional)
 *
 * Flow:
 *  0. Rate-Limit je IP (vor Auth), danach je Nutzer — seit 03.10.2026
 *  1. Auth — eingeloggter Nutzer
 *  2. consume_diagnose_credit (atomar) — kein Credit → 402, KEIN LLM-Call
 *  3. optional: Foto → Supabase Storage (privat) + Bytes an Vision
 *  4. Claude Vision generateObject → Report
 *  5. Insert diagnosen (Service-Role), return { ok, id }
 *
 * Wenn der LLM-Call NACH dem Credit-Verbrauch fehlschlägt, wird der Credit
 * zurückerstattet (grant_diagnose_credits mit +1), damit der Nutzer nichts für
 * eine fehlgeschlagene Diagnose bezahlt.
 *
 * Seit 03.10.2026 wird das Ergebnis der Rückbuchung ausgewertet. Vorher sagte
 * die Antwort immer „dein Guthaben wurde nicht belastet“ — auch wenn die
 * Rückbuchung selbst gescheitert war (supabase-js wirft bei Datenbankfehlern
 * nicht, es liefert `{ error }`). Scheitert sie, geht eine Meldung an Sentry
 * und die Antwort behauptet die Rückbuchung nicht mehr.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { DiagnoseInputSchema, ReportSchema } from '@/lib/steak-beichte/schema';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/steak-beichte/prompts';
import { RateLimiter, jsonError, rateLimitHeaders, rateLimitRequest } from '@/lib/api/guard';
import { KONTAKT_EMPFAENGER } from '@/lib/kontakt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

// Rate-Limit (03.10.2026): Login und Guthaben waren da, eine Bremse nicht. Ohne
// Login kostet jeder Aufruf eine Sitzungspruefung; mit Login liest er bis zu
// 8 MB Formulardaten und fragt das Guthaben ab — auch wenn keins da ist. Beides
// ging beliebig oft. guardRequest passt nicht (erwartet JSON, hier kommt
// multipart), also nur der Zaehler: erst je IP, nach der Anmeldung je Nutzer.
// Der zweite haengt an der Nutzer-ID statt an der IP, damit ein Adresswechsel
// ihn nicht umgeht. Beide Zaehler leben im Prozess (Grenze: src/lib/api/guard.ts).
const RATE = { limit: 10, windowMs: 10 * 60_000 };
const nutzerLimiter = new RateLimiter();

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY fehlt.' }, { status: 500 });
  }

  // 0) Rate-Limit je IP — vor Auth und vor dem Lesen des Bodys
  const ipLimit = rateLimitRequest(req, 'steak-beichte-analyze', RATE);
  if (!ipLimit.ok) return ipLimit.response;

  // 1) Auth
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 });
  }

  // 1b) Rate-Limit je Nutzer — gilt auch, wenn die IP wechselt
  const nutzerVerdict = nutzerLimiter.check(user.id, RATE);
  if (!nutzerVerdict.allowed) {
    return jsonError(
      429,
      `Zu viele Anfragen — bitte in ${nutzerVerdict.retryAfterSecs} s erneut versuchen.`,
      rateLimitHeaders(RATE, nutzerVerdict),
    );
  }

  // 2) Input parsen
  let input;
  let file: File | null = null;
  try {
    const form = await req.formData();
    input = DiagnoseInputSchema.parse({
      problem:   form.get('problem'),
      cut:       form.get('cut')       || undefined,
      grillType: form.get('grillType') || undefined,
    });
    const f = form.get('image');
    if (f && f instanceof File && f.size > 0) file = f;
  } catch {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 });
  }

  if (file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Bildformat nicht unterstützt (JPEG, PNG, WebP, HEIC).' }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Bild zu groß (max. 8 MB).' }, { status: 400 });
    }
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 3) Credit atomar verbrauchen — VOR dem teuren LLM-Call
  const { data: consumed, error: consumeErr } = await admin.rpc('consume_diagnose_credit', {
    p_user_id: user.id,
  });
  if (consumeErr) {
    console.error('[steak-beichte] consume failed', consumeErr);
    return NextResponse.json({ error: 'Credit-Prüfung fehlgeschlagen.' }, { status: 500 });
  }
  if (!consumed) {
    return NextResponse.json({ error: 'Kein Diagnose-Guthaben. Bitte zuerst kaufen.' }, { status: 402 });
  }

  // Ab hier: bei jedem Fehler Credit zurückerstatten. Liefert, ob die
  // Rückbuchung angekommen ist — wirft nie (steht selbst im catch-Zweig).
  const refund = async (): Promise<boolean> => {
    let fehler: string;
    try {
      const { error } = await admin.rpc('grant_diagnose_credits', { p_user_id: user.id, p_amount: 1 });
      if (!error) return true;
      fehler = error.message;
    } catch (e) {
      fehler = e instanceof Error ? e.message : String(e);
    }
    // Zurückgegebene Fehler erreichen Sentry nicht von selbst (nur geworfene).
    // Ein verbrauchtes Guthaben ohne Diagnose ist bezahlt und nicht geliefert —
    // das darf nicht still bleiben. Nur die Konto-ID, keine Eingaben, keine Adresse.
    console.error('[steak-beichte] refund failed', { userId: user.id, fehler });
    Sentry.captureMessage('Steak-Beichte: Guthaben verbraucht, Diagnose gescheitert, Rückbuchung gescheitert — von Hand gutschreiben', {
      level: 'error',
      fingerprint: ['steak-beichte', 'refund-gescheitert'],
      tags: { route: 'steak-beichte/analyze' },
      extra: { userId: user.id, fehler },
    });
    return false;
  };

  try {
    // 4) Optionales Foto → Bytes (Vision) + Storage
    let imageBytes: Uint8Array | null = null;
    let imagePath: string | null = null;
    if (file) {
      imageBytes = new Uint8Array(await file.arrayBuffer());
      const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      imagePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await admin.storage
        .from('diagnose-images')
        .upload(imagePath, imageBytes, { contentType: file.type, upsert: false });
      if (upErr) {
        console.error('[steak-beichte] upload failed', upErr);
        imagePath = null; // Upload-Fehler darf Diagnose nicht blockieren
      }
    }

    // 5) Claude Vision → Report
    const userText = buildUserPrompt(input, !!imageBytes);
    const content: any[] = [{ type: 'text', text: userText }];
    if (imageBytes) content.push({ type: 'image', image: imageBytes });

    const { object: report } = await generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: ReportSchema,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
      maxTokens: 3500,
      temperature: 0.3,
    });

    // 6) Speichern
    const { data: row, error: insErr } = await admin
      .from('diagnosen')
      .insert({ user_id: user.id, input, image_path: imagePath, report })
      .select('id')
      .single();
    if (insErr) throw new Error(`insert failed: ${insErr.message}`);

    return NextResponse.json({ ok: true, id: row.id });
  } catch (err: any) {
    console.error('[steak-beichte] analyze failed', err);
    const zurueckgebucht = await refund();
    return NextResponse.json(
      {
        error: zurueckgebucht
          ? 'Diagnose fehlgeschlagen — dein Guthaben wurde nicht belastet. Bitte erneut versuchen.'
          : `Diagnose fehlgeschlagen. Dein Guthaben konnte dabei nicht automatisch zurückgebucht werden — bitte schreib uns an ${KONTAKT_EMPFAENGER}, damit wir es korrigieren.`,
      },
      { status: 502 },
    );
  }
}
