/**
 * GET /api/hoefe?lat=&lng=&km=&fleisch=1      → Umkreissuche (RPC hoefe_im_umkreis)
 * GET /api/hoefe?ort=Wuppertal&km=30          → erst Geocoding (serverseitig), dann Umkreis
 *
 * Oeffentlich, nur Lesen, nur anon-Sicht. Rate-Limit pro IP, weil das
 * Geocoding einen Fremddienst kostet (MapTiler-Kontingent).
 */
import { NextResponse } from 'next/server';
import { RateLimiter, clientIp, isSameOrigin, jsonError, rateLimitHeaders } from '@/lib/api/guard';
import { hoefeImUmkreis } from '@/lib/hoefe/db';
import { geocode, normalisiereOrt } from '@/lib/hoefe/geocode';
import { koordinateAusParam, zahlAusParam } from '@/lib/hoefe/format';

export const dynamic = 'force-dynamic';

const limiter = new RateLimiter();
const RATE = { limit: 60, windowMs: 60_000 };

export async function GET(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, 'Nur same-origin');
  const verdict = limiter.check(`hoefe:${clientIp(request)}`, RATE);
  if (!verdict.allowed) return jsonError(429, 'Zu viele Anfragen', rateLimitHeaders(RATE, verdict));

  const p = new URL(request.url).searchParams;
  const km = zahlAusParam(p.get('km'), 30, 5, 100);
  const nurFleisch = p.get('fleisch') === '1';

  // Rahmen DE + AT + CH aus src/lib/hoefe/grenzen.ts — dieselben Zahlen wie Import
  // und Tabelle. Bis 03.10.2026 stand hier die alte Deutschland-Box (47–56 / 5–16).
  let lat = koordinateAusParam(p.get('lat'), 'lat');
  let lng = koordinateAusParam(p.get('lng'), 'lng');
  let ortLabel: string | null = null;

  const ort = p.get('ort');
  if (ort && (!Number.isFinite(lat) || !Number.isFinite(lng))) {
    const q = normalisiereOrt(ort);
    if (q.length < 2) return jsonError(400, 'Ort zu kurz');
    const g = await geocode(q);
    if (!g) return NextResponse.json({ error: 'Ort nicht gefunden', treffer: [] }, { status: 404 });
    lat = g.lat;
    lng = g.lng;
    ortLabel = g.label;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return jsonError(400, 'lat/lng oder ort fehlt');

  const treffer = await hoefeImUmkreis({ lat, lng, km, nurFleisch }, 200);
  return NextResponse.json(
    { mittelpunkt: { lat, lng, label: ortLabel }, km, nurFleisch, treffer },
    { headers: { 'Cache-Control': 'private, max-age=60', ...rateLimitHeaders(RATE, verdict) } },
  );
}
