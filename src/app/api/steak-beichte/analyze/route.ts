/**
 * POST /api/steak-beichte/analyze   (multipart/form-data)
 *
 * Felder: problem (text, pflicht), cut?, grillType?, image? (Datei, optional)
 *
 * Flow:
 *  1. Auth — eingeloggter Nutzer
 *  2. consume_diagnose_credit (atomar) — kein Credit → 402, KEIN LLM-Call
 *  3. optional: Foto → Supabase Storage (privat) + Bytes an Vision
 *  4. Claude Vision generateObject → Report
 *  5. Insert diagnosen (Service-Role), return { ok, id }
 *
 * Wenn der LLM-Call NACH dem Credit-Verbrauch fehlschlägt, wird der Credit
 * zurückerstattet (revoke mit Negativ-Betrag via grant), damit der Nutzer
 * nichts für eine fehlgeschlagene Diagnose bezahlt.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { DiagnoseInputSchema, ReportSchema } from '@/lib/steak-beichte/schema';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/steak-beichte/prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY fehlt.' }, { status: 500 });
  }

  // 1) Auth
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 });
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

  // Ab hier: bei jedem Fehler Credit zurückerstatten.
  const refund = async () => {
    await admin.rpc('grant_diagnose_credits', { p_user_id: user.id, p_amount: 1 });
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
    await refund();
    return NextResponse.json(
      { error: 'Diagnose fehlgeschlagen — dein Guthaben wurde nicht belastet. Bitte erneut versuchen.' },
      { status: 502 },
    );
  }
}
