/**
 * POST /api/gutschein/redeem   { code }
 *
 * Löst einen produktspezifischen Geschenkgutschein ein: prüft + schaltet den
 * zugehörigen Kurs für den eingeloggten Nutzer frei (redeem_voucher → grant_course_access).
 * Login-Pflicht (der Zugang gehört dem Beschenkten). Race-sicher in der DB-Funktion.
 */
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NEXT_BY_SLUG: Record<string, string> = {
  'bbq-grundkurs':  '/bbq-grundkurs',
  'mein-protokoll': '/mein-protokoll/fragebogen',
  'steak-beichte':  '/steak-beichte/diagnose',
};

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Bitte melde dich an oder registriere dich, um den Gutschein einzulösen.', needsLogin: true },
      { status: 401 },
    );
  }

  let code: string;
  try {
    const body = await req.json();
    code = String(body.code ?? '').trim();
    if (!code) throw new Error('no code');
  } catch {
    return NextResponse.json({ error: 'Bitte gib einen Gutschein-Code ein.' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await admin.rpc('redeem_voucher', { p_code: code, p_user_id: user.id });
  if (error) {
    console.error('[gutschein] redeem rpc failed', error);
    return NextResponse.json({ error: 'Einlösung fehlgeschlagen. Bitte versuch es später erneut.' }, { status: 500 });
  }

  const status = (data as any)?.status as string;
  if (status === 'ok') {
    const slug = (data as any).course_slug as string;
    return NextResponse.json({
      ok: true,
      course_title: (data as any).course_title ?? 'deinem Produkt',
      redirect: NEXT_BY_SLUG[slug] ?? '/mein-system',
    });
  }

  const MESSAGES: Record<string, string> = {
    not_found:         'Diesen Gutschein-Code kennen wir nicht — bitte prüfe die Schreibweise.',
    already_redeemed:  'Dieser Gutschein wurde bereits eingelöst.',
    revoked:           'Dieser Gutschein ist nicht mehr gültig.',
    expired:           'Dieser Gutschein ist leider abgelaufen.',
  };
  return NextResponse.json({ error: MESSAGES[status] ?? 'Gutschein ungültig.' }, { status: 200 });
}
