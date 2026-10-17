import { describe, expect, it } from 'vitest';
import { statSync } from 'node:fs';
import path from 'node:path';
import { vorschauBild, vorschauLayout, VORSCHAU_STUFEN } from '@/lib/urkunde/vorschau-layout';

/**
 * Waechter fuer die Web-Vorschau der gedruckten Urkunde (17.10.2026).
 *
 * Die Vorschau zeigt dasselbe Vorlagenbild wie der Druck; Name und Datum sitzen
 * an den Stellen aus vorlagen/boxen.json. Bricht die Vermessung oder fehlt ein
 * Bild, faellt es hier auf — nicht erst beim Besucher.
 */
describe('Urkunden-Vorschau', () => {
  it('liefert fuer jede Stufe ein Layout mit Anteilen zwischen 0 und 1', () => {
    for (const stufe of VORSCHAU_STUFEN) {
      const l = vorschauLayout(stufe);
      expect(l.seitenverhaeltnis).toBeCloseTo(1145.19 / 816.38, 2);
      for (const f of [l.name, l.datum]) {
        for (const wert of [f.left, f.width, f.baseline, f.fontSize]) {
          expect(wert).toBeGreaterThan(0);
          expect(wert).toBeLessThan(1);
        }
        expect(f.left + f.width).toBeLessThanOrEqual(1);
      }
    }
  });

  it('setzt den Namen in die rechte Textspalte, zentriert, in Playfair-Groesse', () => {
    const { name } = vorschauLayout(1);
    // Kasten 503,9–1076,5 px von 1145,2 px Breite (boxen.json, Stufe 1, 1z)
    expect(name.left).toBeCloseTo(0.44, 2);
    expect(name.width).toBeCloseTo(0.5, 2);
    expect(name.baseline).toBeCloseTo(0.42, 2);
    expect(name.fontSize).toBeCloseTo(0.0512, 3);
    expect(name.align).toBe('center');
  });

  it('kennt keine Stufe ausserhalb der Vorlagen', () => {
    expect(() => vorschauLayout(0)).toThrow(/Stufe 0/);
    expect(() => vorschauLayout(6)).toThrow(/Stufe 6/);
  });

  it('hat fuer jede Stufe ein Vorschaubild unter public/, klein genug fuer das Web', () => {
    for (const stufe of VORSCHAU_STUFEN) {
      const datei = path.join(process.cwd(), 'public', vorschauBild(stufe));
      const groesse = statSync(datei).size;
      expect(groesse).toBeGreaterThan(10_000);
      // Die 300-dpi-Vorlage hat 1,5 MB — die darf hier nie landen.
      expect(groesse).toBeLessThan(250_000);
    }
  });
});
