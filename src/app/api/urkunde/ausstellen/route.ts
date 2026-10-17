export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { guardRequest, jsonError, userIdFromRequest } from '@/lib/api/guard';
import { createClient } from '@/lib/supabase/server';
import { kennungAus, pruefPfad } from '@/lib/urkunde/kennung';

/**
 * POST /api/urkunde/ausstellen — stellt die (kostenlose, digitale) Urkunde für
 * eine bestandene Stufe aus. Entscheidung Uwe 17.10.2026: ein Name pro Konto.
 *
 * Die ganze Logik liegt in der Datenbankfunktion urkunde_ausstellen()
 * (Migration 20261017094922): Sie prüft „bestanden" gegen course_progress,
 * nimmt einen schon festgelegten Namen IMMER vor dem mitgeschickten, legt ihn
 * beim ersten Mal fest und vergibt Nummer + Prüfcode. Ein zweiter Aufruf für
 * dieselbe Stufe liefert dieselbe Urkunde. Der Browser kann daran nichts
 * drehen — er ruft die Funktion mit seinem eigenen Token auf.
 */

const Body = z.object({
  stufe: z.number().int().min(1).max(5),
  name: z.string().trim().min(2).max(60).optional(),
});

const FEHLER: Record<string, [number, string]> = {
  name_fehlt: [400, 'Bitte gib den Namen an, der auf deinen Urkunden stehen soll (2 bis 60 Zeichen).'],
  nicht_bestanden: [403, 'Diese Stufe steht in deinem Konto nicht als bestanden.'],
  nicht_angemeldet: [401, 'Bitte melde dich an.'],
  stufe_ungueltig: [400, 'Unbekannte Stufe.'],
};

export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    key: 'urkunde-ausstellen',
    rate: { limit: 20, windowMs: 60 * 60 * 1000 },
    schema: Body,
    auth: 'user-or-admin',
  });
  if (!guard.ok) return guard.response;
  // Admin-Cookie zählt hier nicht als Konto: Die Urkunde gehört immer der eingeloggten Person.
  const userId = guard.principal.kind === 'user' ? guard.principal.userId : await userIdFromRequest(req);
  if (!userId) return jsonError(401, 'Urkunden gibt es nur für angemeldete Konten.');

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('urkunde_ausstellen', {
    p_stufe: guard.body.stufe,
    p_name: guard.body.name ?? null,
  });

  if (error) {
    const bekannt = Object.keys(FEHLER).find((k) => error.message.includes(k));
    if (bekannt) {
      const [status, text] = FEHLER[bekannt];
      return jsonError(status, text);
    }
    console.error('[urkunde/ausstellen]', error.message);
    return jsonError(500, 'Die Urkunde konnte gerade nicht ausgestellt werden.');
  }

  const zeile = (Array.isArray(data) ? data[0] : data) as
    | { nr: string; pruefcode: string; name: string; stufe: number; ausgestellt_am: string; neu: boolean }
    | null;
  if (!zeile) return jsonError(500, 'Die Urkunde konnte gerade nicht ausgestellt werden.');

  return Response.json({
    nr: zeile.nr,
    kennung: kennungAus(zeile.nr, zeile.pruefcode),
    name: zeile.name,
    stufe: zeile.stufe,
    ausgestelltAm: zeile.ausgestellt_am,
    neu: zeile.neu,
    pruefPfad: pruefPfad(zeile.nr, zeile.pruefcode),
  });
}
