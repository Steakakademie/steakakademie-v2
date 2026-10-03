import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Siegel, { STUFEN } from './Siegel';
import { ERSTE_BEZAHLSTUFE, STUFEN as DIPLOM_STUFEN } from '@/lib/diplome/stufen';

/**
 * Wächter (03.10.2026): Die Siegel des Relaunches nennen die Grade der
 * Diplom-Bibliothek — nicht eigene. Vorher standen hier „Basis-Zertifikat",
 * „Fortgeschrittenes Zertifikat", „Profi-Zertifikat", „Experten-Zertifikat" und
 * „Offizielles Akademie-Diplom"; so heißt kein Abschluss der Ausbildung
 * (src/lib/diplome/stufen.ts: Grillmeister Bronze … Meisterklasse).
 */
describe('Siegel: Stufen aus der Diplom-Bibliothek', () => {
  it('fünf Stufen, in der Reihenfolge der Bibliothek', () => {
    expect(STUFEN.map((s) => s.nr)).toEqual(DIPLOM_STUFEN.map((s) => s.nr));
  });

  it('Titel und Grad jeder Stufe stammen aus der Bibliothek', () => {
    for (const s of STUFEN) {
      const quelle = DIPLOM_STUFEN[s.nr - 1];
      expect(s.name, `Stufe ${s.nr}: Titel`).toBe(quelle.title);
      expect(s.unter, `Stufe ${s.nr}: Grad`).toBe(quelle.cert);
    }
  });

  it('kein Grad heißt „Zertifikat" oder „Akademie-Diplom", keiner trägt eine Lektionszahl', () => {
    for (const s of STUFEN) {
      expect(s.unter).not.toMatch(/Zertifikat|Akademie-Diplom|Lektion/);
      expect(s.unter).toMatch(/^Grillmeister /);
    }
  });

  it('frei ist genau, was vor der ersten Bezahlstufe liegt', () => {
    expect(STUFEN.filter((s) => s.frei).map((s) => s.nr)).toEqual(
      DIPLOM_STUFEN.filter((s) => s.nr < ERSTE_BEZAHLSTUFE).map((s) => s.nr),
    );
  });

  it('die Umlaufschrift trägt den Stufentitel in Großbuchstaben, Umlaute inklusive', () => {
    expect(STUFEN[1].umlauf).toBe('STEAKAKADEMIE · STUFE 2 · DIE FLAMME BEZÄHMEN ·');
    const markup = renderToStaticMarkup(createElement(Siegel, { nr: 4 }));
    expect(markup).toContain('STEAKAKADEMIE · STUFE 4 · PRÄZISION &amp; GESCHMACK ·');
  });
});
