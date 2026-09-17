// ── Rezept-Moderation API (Community-Einreichungen) ──────────────────────────
// GET   → listet zu prüfende User-Rezepte (status needs_review|pending)
// PATCH → setzt status approved|rejected  (Body: { id, status })
// Auth: admin_auth Cookie === ADMIN_PASSWORD. Schreibt mit Service-Role.

import { NextResponse } from 'next/server';
import { istAdminPasswort } from '@/lib/admin-auth';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { generateRecipeImage } from '@/lib/rezept/generate-image';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

async function authed(): Promise<boolean> {
  return istAdminPasswort((await cookies()).get('admin_auth')?.value);
}

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function GET() {
  if (!(await authed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = service();
  const { data, error } = await supabase
    .from('user_recipes')
    .select('id, slug, title, description, author_name, status, quality_score, moderation, ingredients, steps, created_at')
    .in('status', ['needs_review', 'pending'])
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recipes: data ?? [] });
}

export async function PATCH(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const supabase = service();
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'approved') patch.published_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('user_recipes').update(patch).eq('id', id).select('slug').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-Bild bei Freigabe (best-effort — die Freigabe gilt auch ohne Bild)
  let image_url: string | null = null;
  if (status === 'approved' && updated?.slug) {
    try {
      const r = await generateRecipeImage(updated.slug);
      image_url = r.image_url ?? null;
      if (r.error) console.error('[admin] auto-image:', r.error);
    } catch (e) {
      console.error('[admin] auto-image failed', e);
    }
  }
  return NextResponse.json({ ok: true, image_url });
}
