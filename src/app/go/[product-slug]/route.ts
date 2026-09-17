import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/products';

/**
 * Affiliate-Redirect Layer
 * Route: /go/[product-slug]
 *
 * Flow:
 * 1. Produkt im Registry nachschlagen
 * 2. Plausible-Event feuern (server-side, cookieless — kein GA4, kein Consent nötig)
 * 3. 302 Redirect zur Affiliate-URL
 */
export async function GET(
  request: NextRequest,
  props0: { params: Promise<{ 'product-slug': string }> }
) {
  const params = await props0.params;
  const productId = params['product-slug'];
  const product = getProductById(productId);

  if (!product) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Server-side Plausible-Event — gleicher Name/Props wie Client-Tag (Dashboard mergt)
  try {
    const ip =
      request.headers.get('x-nf-client-connection-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      '';
    const ua  = request.headers.get('user-agent') ?? '';
    const ref = request.headers.get('referer') ?? request.url;

    await fetch('https://plausible.io/api/event', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'User-Agent':      ua,
        'X-Forwarded-For': ip,
      },
      body: JSON.stringify({
        name:   'Affiliate-Klick',
        domain: 'steakakademie.de',
        url:    ref,
        props:  { provider: product.provider, produkt: product.id },
      }),
    });
  } catch {
    // Tracking-Fehler niemals Redirect blockieren
  }

  // 302 Redirect mit Cache-Buster-Header
  const response = NextResponse.redirect(product.affiliateUrl, { status: 302 });
  response.headers.set('Cache-Control', 'no-store, no-cache');
  response.headers.set('X-Product-Id', product.id);
  response.headers.set('X-Provider', product.provider);

  return response;
}
