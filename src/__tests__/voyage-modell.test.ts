import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { KOCHWISSEN_MODELL_DEFAULT } from '@/lib/kochwissen/voyage';

// Anfrage und Korpus müssen mit demselben Voyage-Modell eingebettet sein, sonst
// liefert die Kochwissen-Suche still schlechtere Treffer (30.09.2026: Query auf
// voyage-3.5, Korpus auf voyage-4, dazu 114 Rezepte per Ingest wieder auf 3.5).
const root = join(__dirname, '..', '..');
const lies = (p: string) => readFileSync(join(root, p), 'utf8');

describe('Voyage-Modell Kochwissen', () => {
  it('Query-Default ist voyage-4', () => {
    expect(KOCHWISSEN_MODELL_DEFAULT).toBe('voyage-4');
  });

  it.each(['scripts/kochwissen-ingest.mjs', 'scripts/kochwissen-resolve-anchors.mjs'])(
    '%s nutzt denselben Default wie die Query-Seite',
    (datei) => {
      const zeile = lies(datei).split('\n').find((z) => /const MODEL\s*=/.test(z)) ?? '';
      expect(zeile).toContain(`'${KOCHWISSEN_MODELL_DEFAULT}'`);
      expect(zeile).not.toContain('voyage-3.5');
    },
  );
});
