export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { guardRequest, jsonError } from '@/lib/api/guard';
import { zieheFragen, fragenFuerClient } from '@/lib/diplome/fragen';
import { isStufeKey } from '@/lib/diplome/stufen';
import { signiereZiehung, tokenSecret, TOKEN_TTL_MS } from '@/lib/diplome/pruefung-token';

/**
 * POST /api/diplome/pruefung/ziehung { modul } — stellt eine Pruefung.
 *
 * Zieht bis zu QUIZ_FRAGEN_PRO_PRUEFUNG Fragen aus dem Pool der Stufe
 * (hoechstens eine je Lektion) und gibt sie OHNE Loesung zurueck, dazu ein
 * signiertes Token fuer genau diese Ziehung. Die Bewertung nimmt
 * /api/diplome/pruefung nur mit diesem Token an.
 *
 * POST statt GET, weil der API-Guard (Same-Origin, Rate-Limit, Zod) fuer
 * JSON-Bodies gebaut ist — derselbe Riegel wie bei der Bewertung.
 *
 * Anonym erlaubt: Stufe 1 darf ohne Konto geuebt werden. Die Berechtigung fuer
 * die Bezahlstufen prueft die Bewertung, nicht die Ziehung — eine Frage zu
 * sehen ist kein Zugang zum Lernstoff.
 */

const Body = z.object({ modul: z.string().min(1).max(32) });

export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    key: 'diplome-pruefung-ziehung',
    rate: { limit: 60, windowMs: 10 * 60 * 1000 },
    schema: Body,
    auth: 'none',
  });
  if (!guard.ok) return guard.response;

  const { modul } = guard.body;
  if (!isStufeKey(modul)) return jsonError(400, 'Unbekanntes Modul.');

  const secret = tokenSecret();
  if (!secret) return jsonError(503, 'Prüfung derzeit nicht verfügbar.');

  const ids = zieheFragen(modul);
  const exp = Date.now() + TOKEN_TTL_MS;

  return Response.json({
    token: signiereZiehung({ m: modul, ids, exp }, secret),
    exp,
    fragen: fragenFuerClient(modul, ids),
  });
}
