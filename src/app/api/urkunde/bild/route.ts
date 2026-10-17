export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { jsonError, RateLimiter, rateLimitHeaders } from '@/lib/api/guard';
import { createClient } from '@/lib/supabase/server';
import { rendereUrkunde, urkundenDatum } from '@/lib/urkunde/render';
import { zerlegeKennung, urkundenZeile } from '@/lib/urkunde/kennung';

/**
 * GET /api/urkunde/bild?k=<Kennung> — die digitale Urkunde als PNG (300 dpi,
 * dieselbe Vorlage wie der Druck). Nur für die eigene Urkunde: gelesen wird
 * mit dem Nutzer-Token, RLS (urkunden_select_own) lässt nur eigene Zeilen
 * durch. Name kommt aus der Datenbank, nie aus der Anfrage.
 */
// Ein 300-dpi-Rendering kostet spürbar Rechenzeit — 10 Abrufe je Konto und Stunde reichen jedem.
const limiter = new RateLimiter();
const REGEL = { limit: 10, windowMs: 60 * 60 * 1000 };

export async function GET(req: Request) {
  const kennung = zerlegeKennung(new URL(req.url).searchParams.get('k'));
  if (!kennung) return jsonError(400, 'Unbekannte Urkunden-Nummer.');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError(401, 'Bitte melde dich an.');

  const urteil = limiter.check(`urkunde-bild:${user.id}`, REGEL);
  if (!urteil.allowed) {
    return jsonError(429, 'Zu viele Abrufe — bitte später noch einmal.', rateLimitHeaders(REGEL, urteil));
  }

  const { data, error } = await supabase
    .from('urkunden')
    .select('nr, pruefcode, name, stufe, ausgestellt_am, widerrufen_am')
    .eq('nr', kennung.nr)
    .eq('pruefcode', kennung.code)
    .maybeSingle();
  if (error) {
    console.error('[urkunde/bild]', error.message);
    return jsonError(500, 'Die Urkunde konnte gerade nicht geladen werden.');
  }
  const u = data as { nr: string; pruefcode: string; name: string; stufe: number; ausgestellt_am: string; widerrufen_am: string | null } | null;
  if (!u || u.widerrufen_am) return jsonError(404, 'Diese Urkunde gibt es in deinem Konto nicht.');

  try {
    const { png } = await rendereUrkunde({
      stufe: u.stufe,
      name: u.name,
      datum: urkundenDatum(new Date(u.ausgestellt_am)),
      nr: urkundenZeile(u.nr, u.pruefcode),
    });
    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="steakakademie-urkunde-${u.nr}.png"`,
      },
    });
  } catch (e) {
    console.error('[urkunde/bild] render', e instanceof Error ? e.message : e);
    return jsonError(500, 'Die Urkunde konnte gerade nicht erzeugt werden.');
  }
}
