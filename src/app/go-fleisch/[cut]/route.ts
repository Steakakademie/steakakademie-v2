import { NextRequest, NextResponse } from 'next/server';
import { getCutById } from '@/lib/cuts-catalog';
import { activeMeatPartner, buildMeatTargetUrl } from '@/lib/cut-affiliate';

/**
 * Fleisch-Affiliate-Redirect für den Cut-Generator.
 * Route: /go-fleisch/[cut]
 *
 * Spiegelt /go/[product-slug]: Plausible-Event (server-side, cookieless) + 302.
 * Ziel ist der aktive Fleischpartner (Primär falls live, sonst Amazon-Fallback).
 */
export async function GET(request: NextRequest, props0: { params: Promise<{ cut: string }> }) {
  const params = await props0.params;
  const cut = getCutById(params.cut);

  if (!cut) {
    return NextResponse.redirect(new URL('/cuts', request.url));
  }

  const partner = activeMeatPartner();
  const target = buildMeatTargetUrl(cut);

  try {
    const ip =
      request.headers.get('x-nf-client-connection-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      '';
    const ua = request.headers.get('user-agent') ?? '';
    const ref = request.headers.get('referer') ?? request.url;

    await fetch('https://plausible.io/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': ua,
        'X-Forwarded-For': ip,
      },
      body: JSON.stringify({
        name: 'Affiliate-Klick',
        domain: 'steakakademie.de',
        url: ref,
        props: { provider: partner.id, produkt: `cut-${cut.id}`, typ: 'fleisch' },
      }),
    });
  } catch {
    // Tracking-Fehler niemals Redirect blockieren
  }

  const response = NextResponse.redirect(target, { status: 302 });
  response.headers.set('Cache-Control', 'no-store, no-cache');
  response.headers.set('X-Cut-Id', cut.id);
  response.headers.set('X-Provider', partner.id);
  return response;
}
