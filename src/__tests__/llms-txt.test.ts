import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * public/llms.txt gegen den Bestand (03.10.2026).
 *
 * WARUM ES DIESEN TEST GIBT: Die Datei ist statisch und kann nicht rechnen. Dort
 * stand „35 Lektionen", waehrend der Bestand 39 hatte — niemand merkt das, bis
 * eine KI-Suche die falsche Zahl zitiert. Wer eine Diplom-Lektion hinzufuegt
 * oder entfernt, zieht die Zahl in public/llms.txt nach; dieser Test sagt es ihm.
 */

function lektionenImBestand(): number {
  const wurzel = join(process.cwd(), 'content', 'diplom-lektionen');
  return readdirSync(wurzel, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .reduce((n, e) => n + readdirSync(join(wurzel, e.name)).filter((f) => f.endsWith('.mdx')).length, 0);
}

describe('public/llms.txt', () => {
  const text = readFileSync(join(process.cwd(), 'public', 'llms.txt'), 'utf8');

  it('nennt die Zahl der Diplom-Lektionen, die im Bestand liegt', () => {
    const genannt = /(\d+) Lektionen/.exec(text);
    expect(genannt, 'llms.txt nennt keine Lektionszahl mehr — Test anpassen').not.toBeNull();
    expect(Number(genannt![1])).toBe(lektionenImBestand());
  });
});
