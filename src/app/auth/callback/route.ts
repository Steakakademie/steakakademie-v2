import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code        = searchParams.get('code');
  const tokenHash   = searchParams.get('token_hash');
  const type        = searchParams.get('type');
  const redirectTo  = searchParams.get('next') ?? '/diplome/profil';
  // Supabase kann den Fehler direkt mitschicken (z.B. abgelaufener Link, Redirect-URL nicht erlaubt)
  const errParam    = searchParams.get('error_description') ?? searchParams.get('error');

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(reason)}`);

  if (errParam) return fail(errParam);

  const supabase = await createClient();

  // 1) Magic-Link / E-Mail-OTP (token_hash → verifyOtp; funktioniert geräteübergreifend, kein Code-Verifier nötig)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type: type as any, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${redirectTo}`);
    return fail(error.message);
  }

  // 2) PKCE-Code (OAuth / signInWithOtp vom Login-Formular — braucht den code_verifier-Cookie)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${redirectTo}`);
    return fail(error.message);
  }

  return fail('Kein gültiger Anmelde-Token im Link (weder token_hash noch code).');
}
