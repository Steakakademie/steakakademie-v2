/**
 * /kerntemperatur-steak — die Seite haengt an der Referenz (Regel 8c), 10.10.2026.
 *
 * Die Seite berechnet alle Garstufen-Korridore aus data/kerntemperatur-referenz.yaml.
 * Zwei Saetze stehen aber woertlich im Code, weil die Referenz sie nur als Fliesstext
 * fuehrt: der Medium-Rare-Ziehwert „50–51 °C" und die Faustregel „ca. 3 °C vor Ziel".
 * Aendert jemand diesen Text in der Referenz, muss die Seite mit — dieser Test faellt dann auf.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { badge, garstufenRind, kernReferenz, spanne } from '@/lib/kerntemperatur-referenz';

const seite = readFileSync('src/app/kerntemperatur-steak/page.tsx', 'utf8');

describe('/kerntemperatur-steak ↔ Kerntemperatur-Referenz', () => {
  it('die fünf Garstufen der Seite gibt es in der Referenz', () => {
    const stufen = garstufenRind();
    for (const k of ['rare', 'medium_rare', 'medium', 'medium_well', 'well_done']) {
      expect(stufen[k], k).toBeTruthy();
    }
  });

  it('Medium Rare folgt dem Standard-Badge und dessen Korridor', () => {
    const mr = badge('beef_mr');
    expect(garstufenRind().medium_rare.range).toEqual(mr.range);
    expect(spanne('beef_mr')).toBe(`${mr.range[0]}–${mr.range[1]} °C`);
  });

  it('der Ziehwert 50–51 °C steht noch in meta.ziehtemperatur', () => {
    const meta = kernReferenz().meta.ziehtemperatur;
    expect(meta).toMatch(/Medium Rare: bei 50-51 °C ziehen/);
    expect(seite).toContain("const MR_ZIEHEN = '50–51 °C'");
  });

  it('die Faustregel „ca. 3 °C vor Ziel" gilt noch (meta.carryover)', () => {
    expect(kernReferenz().meta.carryover).toContain('ca. 3 °C vor Ziel');
    expect(seite).toContain('etwa 3 °C vor dem Zielwert');
  });

  it('keine Temperatur im Seitentext, die nicht aus der Referenz kommt (Ausnahmen: Ziehwert, Faustregel, Reverse-Sear-Anhebung)', () => {
    // Alle Zahlen mit °C im Quelltext entfernen, die wir bewusst woertlich fuehren.
    const erlaubt = [/50–51 °C/g, /ca\. 3 °C vor Ziel/g, /etwa 3 °C vor dem Zielwert/g, /um 2–3 °C hebt/g, /„ca\. 3 °C vor Ziel“/g, /\{MR\.c\} °C/g];
    let rest = seite;
    for (const re of erlaubt) rest = rest.replace(re, '');
    // Kommentare duerfen Werte nennen (Herkunftsangaben).
    rest = rest.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const hart = rest.match(/\d+(?:[–-]\d+)? ?°C/g) ?? [];
    expect(hart, `hart kodierte Temperaturen: ${hart.join(', ')}`).toEqual([]);
  });
});
