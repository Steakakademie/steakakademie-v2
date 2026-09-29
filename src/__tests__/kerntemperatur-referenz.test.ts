// Wächter für data/kerntemperatur-referenz.yaml (Regel 2 / 8c) — seit 29.09.2026.
//
// Anlass: Temperatur-Guide und Referenz nannten für Krustenbraten, Gans und
// Wildschwein verschiedene Werte, weil der Guide hart kodiert war. Seitdem
// ziehen Guide und Spickzettel diese Werte aus der Referenz. Dieser Test hält
// das fest: jede Zahl liegt über dem Sicherheitswert ihrer Tierart — oder ist
// ausdrücklich als Ausnahme mit Pflichthinweis markiert —, und jeder Schlüssel,
// den eine Seite anfragt, existiert.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { kernReferenz } from '@/lib/kerntemperatur-referenz';

const ref = kernReferenz();

// Präfix des Badge-Schlüssels → Sicherheitsklasse
const KLASSE: [RegExp, string][] = [
  [/^pork_/, 'schwein'],
  [/^(poultry|goose_|duck_)/, 'gefluegel'],
  [/^boar_/, 'wildschwein'],
  [/^burger$/, 'hackfleisch'],
];

describe('Kerntemperatur-Referenz', () => {
  it('jeder Badge hat einen geordneten Korridor, c liegt darin', () => {
    for (const [key, b] of Object.entries(ref.badges)) {
      const [von, bis] = b.range;
      expect(von, key).toBeLessThanOrEqual(bis);
      expect(b.c, key).toBeGreaterThanOrEqual(von);
      expect(b.c, key).toBeLessThanOrEqual(bis);
    }
  });

  it('kein Wert unter dem Sicherheitsminimum — außer markierte Ausnahmen mit Hinweis', () => {
    for (const [key, b] of Object.entries(ref.badges)) {
      const klasse = KLASSE.find(([re]) => re.test(key))?.[1];
      if (!klasse) continue;
      const min = ref.sicherheit[klasse];
      if (b.range[0] >= min) continue;
      expect(b.unter_sicherheit, `${key}: ${b.range[0]} °C < ${klasse} ${min} °C ohne unter_sicherheit`).toBe(true);
      expect((b.hinweis ?? '').length, `${key}: Ausnahme ohne hinweis`).toBeGreaterThan(20);
    }
  });

  it('jeder Schlüssel, den Guide und Spickzettel anfragen, existiert', () => {
    const quellen = ['src/app/temperatur-guide/page.tsx', 'src/app/kerntemperatur-spickzettel/page.tsx'];
    const keys = new Set<string>();
    for (const q of quellen) {
      const src = readFileSync(join(process.cwd(), q), 'utf8');
      for (const m of src.matchAll(/(?:spanne|badge|ca)\('([a-z_]+)'\)|key: '([a-z_]+)'/g)) keys.add(m[1] ?? m[2]);
    }
    const bekannt = new Set([...Object.keys(ref.badges), ...Object.keys(ref.sicherheit)]);
    const fehlend = [...keys].filter((k) => !bekannt.has(k));
    expect(fehlend).toEqual([]);
  });
});
