// ── Review-Workflow API ──────────────────────────────────────────────────────
// GET   → listet offene Entwürfe (status draft|review)
// PATCH → setzt status auf approved|rejected  (Body: { id, status })
// Auth: signiertes Sitzungs-Token im Cookie admin_auth (src/lib/admin-auth.ts). Schreibt mit Service-Role.

import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, istAdminCookie } from '@/lib/admin-auth';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function authed(): Promise<boolean> {
  return istAdminCookie((await cookies()).get(ADMIN_COOKIE)?.value);
}

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  if (!(await authed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = service();
  const { data, error } = await supabase
    .from('content_drafts')
    .select('id, category, title, slug, seo_description, content_body, status, generated_at')
    .in('status', ['draft', 'review'])
    .order('generated_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drafts: data ?? [] });
}

export async function PATCH(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const supabase = service();
  const { error } = await supabase
    .from('content_drafts')
    .update({ status })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
