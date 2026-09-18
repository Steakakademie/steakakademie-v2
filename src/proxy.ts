/**
 * Proxy (bis Next 16: src/middleware.ts) — 17.09.2026 umbenannt
 * ==============================================================
 * Next 16 hat die Datei-Konvention `middleware` zu `proxy` umbenannt (Export
 * `proxy` statt `middleware`); sie laeuft jetzt in der Node-Runtime, nicht mehr
 * auf der Edge. Inhalt unveraendert: A/B-Cookie fuer die Startseite, 401-Gate
 * fuer Admin-/Pipeline-APIs, Supabase-Session-Refresh + Login-Gate. Der
 * Helfer @/lib/supabase/middleware behaelt seinen Namen — er ist kein
 * Next-Konventionsdateiname.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { istAdminPasswort } from '@/lib/admin-auth';
import { updateSession } from '@/lib/supabase/middleware';

const IS_CRAWLER =
  /bot|crawler|spider|crawling|slurp|googlebot|bingbot|duckduckbot|baiduspider|yandex|applebot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-searchbot|anthropic-ai|perplexitybot|perplexity-user|ccbot|bytespider|amazonbot|google-extended|lighthouse|pagespeed|ahrefs|semrush|screaming frog/i;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A/B-Test Startseite: 50/50-Zuteilung per Cookie, Variante B wird intern
  // auf /home-b (Editorial Ember) rewritet — die URL bleibt "/". Zuteilung
  // ist sticky (90 Tage), damit Besucher konsistent EINE Variante sehen.
  // Messung: /api/newsletter liest dasselbe Cookie (source-Suffix "-vb").
  if (pathname === '/') {
    // SEO-SCHUTZ (26.08.2026): Suchmaschinen und Answer-Engines werden vom
    // Test AUSGENOMMEN und sehen immer Variante A. Grund: der Rewrite auf
    // /home-b liefert dessen Metadaten unter der Adresse "/" aus — inklusive
    // `robots: { index: false }`. Ohne diese Ausnahme bekam jeder zweite
    // Googlebot-Abruf der Startseite ein noindex, was die wichtigste Seite
    // der Domain aus dem Index werfen kann. Bots bekommen ausserdem kein
    // Cookie, damit die 50/50-Messung unter Menschen sauber bleibt.
    if (IS_CRAWLER.test(request.headers.get('user-agent') ?? '')) {
      return NextResponse.next();
    }

    // NOT-AUS (26.08.2026): Der Test laeuft nur, wenn AB_HOME_ENABLED === '1'.
    // Standard ist AUS. Grund: Variante B ist in der ausgelieferten Fassung
    // optisch defekt — .theme-ember dreht die Text-Utilities auf Tinte (#1C1512),
    // waehrend Abschnitte mit dunklem Verlauf oder Foto-Hintergrund dunkel
    // bleiben (Hero-Radial-Verlauf, Ribeye-Aufmacher) und Kopf/Navigation
    // weiterhin text-white auf nun hellem bg-surface-dark setzen. Gemessene
    // Kontraste auf der Startseite: Navigation 1,05:1 · Topbar 1,18:1 ·
    // Hero-Absatz 1,18:1 · Gold-Wortmarke 2,86:1 (WCAG AA verlangt 4,5:1,
    // Grosstext 3:1). Wieder einschalten, wenn B abgenommen ist.
    if (process.env.AB_HOME_ENABLED !== '1') {
      return NextResponse.next();
    }

    const existing = request.cookies.get('sa_ab_home')?.value;
    const variant = existing === 'a' || existing === 'b'
      ? existing
      : (Math.random() < 0.5 ? 'a' : 'b');
    const res = variant === 'b'
      ? NextResponse.rewrite(new URL('/home-b', request.url))
      : NextResponse.next();
    if (existing !== variant) {
      res.cookies.set('sa_ab_home', variant, {
        maxAge: 60 * 60 * 24 * 90,
        path: '/',
        sameSite: 'lax',
      });
    }
    return res;
  }

  // Admin-UI: ungültiges/fehlendes Cookie → zur Login-Seite
  if (pathname.startsWith('/admin')) {
    if (pathname !== '/admin/login') {
      const auth = request.cookies.get('admin_auth');
      if (!istAdminPasswort(auth?.value)) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }
    return NextResponse.next();
  }

  // Geschützte Admin-/Pipeline-APIs (Login-Endpoint ausgenommen) → 401 JSON
  if (
    (pathname.startsWith('/api/admin') && pathname !== '/api/admin/auth') ||
    pathname.startsWith('/api/pm-agent')
  ) {
    const auth = request.cookies.get('admin_auth');
    if (!istAdminPasswort(auth?.value)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Login-Gate für Nutzerbereiche (Supabase-Session refreshen + prüfen)
  const { response, user } = await updateSession(request);
  const PROTECTED = ['/meine-kurse', '/profil', '/steuer-matrix/rechner', '/mein-system'];
  if (!user && PROTECTED.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }
  return response;
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/pm-agent/:path*',
    '/meine-kurse/:path*',
    '/profil/:path*',
    '/steuer-matrix/rechner/:path*',
    '/mein-system/:path*',
  ],
};
