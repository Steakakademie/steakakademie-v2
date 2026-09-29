import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { foodpairingZutat } from './foodpairing-alias';

const zutaten = new Set(
  readFileSync(join(process.cwd(), 'data/foodpairing/ingr_info.tsv'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => l.split('\t')[1]),
);

describe('foodpairingZutat', () => {
  it('bildet Synonyme auf die eine Datenbank-Zutat ab', () => {
    expect(foodpairingZutat('Ribeye')).toBe('Rind');
    expect(foodpairingZutat('  steak ')).toBe('Rind');
    expect(foodpairingZutat('Entrecôte')).toBe('Rind');
    expect(foodpairingZutat('Hühnchen')).toBe('Hähnchen');
    expect(foodpairingZutat('Bacon')).toBe('Speck');
    expect(foodpairingZutat('Minze')).toBe('Grüne Minze');
    expect(foodpairingZutat('Gerösteter Knoblauch')).toBe('Röstknoblauch');
    expect(foodpairingZutat('Maple Syrup')).toBe('Ahornsirup');
  });

  it('lässt unbekannte Eingaben unverändert', () => {
    expect(foodpairingZutat('Lachs')).toBe('Lachs');
    expect(foodpairingZutat('Quark')).toBe('Quark');
  });

  it('jedes Alias-Ziel existiert in ingr_info.tsv', async () => {
    const mod = await import('./foodpairing-alias');
    const quelle = readFileSync(join(process.cwd(), 'src/lib/foodpairing-alias.ts'), 'utf8');
    const ziele = [...quelle.matchAll(/:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(mod).toBeTruthy();
    for (const z of ziele) expect(zutaten.has(z), `Alias-Ziel fehlt: ${z}`).toBe(true);
  });
});
