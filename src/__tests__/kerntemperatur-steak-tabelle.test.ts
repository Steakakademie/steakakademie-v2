/**
 * Verbindliche Steak-Tabelle — Uwe, 19.10.2026, im Chat (Tabelle + Grafik „Kerntemperatur Steak
 * auf einen Blick"; Well done = „ab X °C" → range [X, 99]):
 * „gleiche wirklich ALLES an diese hier geposteten an, so dass es dazu nie mehr
 * Diskussionen geben kann."
 *
 * Die erwarteten Werte stehen hier ABSICHTLICH wörtlich. Wer eine Zahl in
 * data/kerntemperatur-referenz.yaml ändert, bricht diesen Test — geändert werden
 * darf er nur auf ausdrückliche Anweisung von Uwe (mit Datum im Kommentar).
 */
import { describe, it, expect } from 'vitest';
import { badge, garstufenRind, kernReferenz, steakTabelle } from '@/lib/kerntemperatur-referenz';

type R = [number, number];
const RIND_A = { rare: [44, 47] as R, medium_rare: [48, 54] as R, medium: [55, 59] as R, well_done: [60, 99] as R };
const RIND_B = { rare: [44, 47] as R, medium_rare: [48, 55] as R, medium: [56, 59] as R, well_done: [60, 99] as R };

const SOLL: Record<string, Partial<Record<'rare' | 'medium_rare' | 'medium' | 'well_done', R>>> = {
  'Rindersteak': RIND_A, 'Rumpsteak': RIND_A, 'Entrecote': RIND_A, 'Rib Eye Steak': RIND_A,
  'Tomahawk Steak': RIND_A, 'Rinderkotelett': RIND_A, 'T-Bone Steak': RIND_A, 'Porterhouse Steak': RIND_A,
  'Nackensteak': { rare: [44, 47], medium_rare: [48, 54], medium: [56, 59], well_done: [60, 99] },
  'Flat Iron Steak': RIND_B, 'Hüftsteak': RIND_B, 'Spider Steak': RIND_B, 'Flank Steak': RIND_B,
  'Kalbssteak': { medium: [55, 57], well_done: [60, 99] },
  'Kalbskotelett': { medium: [55, 57], well_done: [60, 99] },
  'Schweinesteak': { medium: [58, 62], well_done: [65, 99] },
  'Schweinekotelett': { medium: [58, 62], well_done: [65, 99] },
  'Lammsteak': { medium_rare: [58, 60], medium: [61, 64], well_done: [65, 99] },
  'Lammkotelett': { medium_rare: [58, 60], medium: [61, 64], well_done: [65, 99] },
  'Rehsteak': { medium: [55, 59], well_done: [60, 99] },
  'Hirschsteak': { medium: [60, 64], well_done: [65, 99] },
  'Wildschweinsteak': { medium: [64, 66], well_done: [67, 99] },
};

describe('Steak-Tabelle (verbindlich, 19.10.2026)', () => {
  it('Referenz enthält genau die 22 Teilstücke mit genau diesen Werten', () => {
    const ist = steakTabelle();
    expect(ist.map((z) => z.cut)).toEqual(Object.keys(SOLL));
    for (const z of ist) {
      const soll = SOLL[z.cut];
      for (const k of ['rare', 'medium_rare', 'medium', 'well_done'] as const) {
        expect(z[k], `${z.cut} ${k}`).toEqual(soll[k]);
      }
    }
  });

  it('Garstufen-Skala Rind = Zeile Rindersteak; Medium Well gibt es nicht', () => {
    const g = garstufenRind();
    expect(Object.keys(g)).toEqual(['rare', 'medium_rare', 'medium', 'well_done']);
    expect(g.rare.range).toEqual([44, 47]);
    expect(g.medium_rare.range).toEqual([48, 54]);
    expect(g.medium.range).toEqual([55, 59]);
    expect(g.well_done.range[0]).toBe(60);
  });

  it('abgeleitete Badges folgen der Tabelle', () => {
    expect(badge('beef_mr')).toMatchObject({ c: 54, range: [48, 54] });
    expect(badge('beef_flank').range).toEqual([48, 55]);
    expect(badge('lamb_mr').range).toEqual([58, 60]);
    expect(badge('lamb_steak_medium').range).toEqual([61, 64]);
    expect(badge('lamb_steak_done').range).toEqual([65, 99]);
    expect(badge('veal_steak').range).toEqual([55, 57]);
    expect(badge('reh_steak').range).toEqual([55, 59]);
    expect(badge('hirsch_steak').range).toEqual([60, 64]);
    expect(badge('pork_steak_rosa').range).toEqual([58, 62]);
    expect(badge('pork_steak_durch').range).toEqual([65, 99]);
    expect(badge('boar_steak').range).toEqual([64, 66]);
    expect(badge('boar_steak_done').range).toEqual([67, 99]);
  });

  it('Zeilen unter Sicherheitsminimum verweisen auf einen Badge mit Pflichthinweis', () => {
    const sich = kernReferenz().sicherheit;
    for (const z of steakTabelle()) {
      const min = z.tier === 'schwein' ? sich.schwein : z.tier === 'wildschwein' ? sich.wildschwein : undefined;
      if (min === undefined) continue;
      const tiefster = Math.min(...[z.medium_rare, z.medium].filter(Boolean).map((r) => r![0]));
      if (tiefster >= min) continue;
      expect(z.badge, z.cut).toBeTruthy();
      expect(badge(z.badge!).unter_sicherheit, z.cut).toBe(true);
      expect((badge(z.badge!).hinweis ?? '').length, z.cut).toBeGreaterThan(20);
    }
  });
});
