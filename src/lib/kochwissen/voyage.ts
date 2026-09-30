/**
 * Query-Embedding für die Kochwissen-Datenbank.
 *
 * Modell `voyage-4` → 1024 Dimensionen, passend zu `vector(1024)` in der
 * kochwissen-Tabelle. Das Modell MUSS zum Korpus passen: gleiche Dimension,
 * aber ein anderes Modell liefert unpassende Vektoren — ohne Fehlermeldung,
 * nur mit stillschweigend schlechteren Treffern.
 *
 * Geschichte: bis 22.08.2026 voyage-3.5, dann Re-Embed auf voyage-4
 * (scripts/kochwissen-reembed.mjs). Die Query-Seite blieb auf dem Fallback
 * 'voyage-3.5', weil VOYAGE_MODEL im Vercel-Projekt fehlte (geprüft 30.09.2026),
 * und ein Ingest am 15.09. hat 114 Rezepte mit dem alten Default wieder als
 * voyage-3.5 eingebettet. Seit 30.09.2026 ist voyage-4 der Default auf BEIDEN
 * Seiten (hier und scripts/kochwissen-ingest.mjs); der Wächter
 * src/__tests__/voyage-modell.test.ts bricht, wenn sie auseinanderlaufen.
 *
 * Transport läuft über den zentralen Client (Retry bei 429/5xx).
 */

import { embedQuery as clientEmbedQuery } from '@/lib/voyage/client';

export const KOCHWISSEN_MODELL_DEFAULT = 'voyage-4';
const VOYAGE_MODEL = process.env.VOYAGE_MODEL ?? KOCHWISSEN_MODELL_DEFAULT;

/** Bettet eine Suchanfrage ein (input_type 'query'). */
export async function embedQuery(text: string): Promise<number[]> {
  return clientEmbedQuery(text, VOYAGE_MODEL);
}
