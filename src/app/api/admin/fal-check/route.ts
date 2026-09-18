// Diagnose: zeigt (admin-geschützt) den in Vercel hinterlegten FAL_KEY in MASKIERTER
// Form, damit man prüfen kann, ob der RICHTIGE Wert gespeichert ist — ohne fal-Kosten.
// GET /api/admin/fal-check  (Auth: admin_auth Cookie === ADMIN_PASSWORD)

import { NextResponse } from 'next/server';
import { istAdminPasswort } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!istAdminPasswort((await cookies()).get('admin_auth')?.value)) {
    return NextResponse.json({ error: 'Unauthorized — erst /admin/login' }, { status: 401 });
  }
  const k = process.env.FAL_KEY ?? '';
  return NextResponse.json({
    present: k.length > 0,
    length: k.length,
    prefix: k.slice(0, 10),                       // z. B. "884f25dd-" (richtig) oder "sk_live_a1" (falsch)
    hasColon: k.includes(':'),                    // fal-Format key_id:secret → muss true sein
    looksLikeFal: /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(k), // UUID-Start = fal
    looksLikeStripe: k.startsWith('sk_'),         // sk_live/sk_test = falscher Dienst
    verdict:
      /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(k) && k.includes(':')
        ? '✅ Sieht nach gültigem fal.ai-Key aus'
        : k.startsWith('sk_')
        ? '❌ Falscher Key (Stripe-Format sk_…) — bitte ersetzen'
        : k.length === 0
        ? '❌ FAL_KEY ist leer/nicht gesetzt'
        : '⚠️ Unerwartetes Format — bitte prüfen',
  });
}
