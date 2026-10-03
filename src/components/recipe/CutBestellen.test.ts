import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CutBestellen from './CutBestellen';

/**
 * Waechter (03.10.2026): Der Hinweis nennt die Shops nicht „Partner“, solange
 * die Links keine Partner-Kennung tragen — und sagt, dass keine Provision
 * fliesst. Wird ein Link zum Partnerlink, muss dieser Test mit dem Text fallen.
 */
describe('CutBestellen', () => {
  const markup = renderToStaticMarkup(createElement(CutBestellen, { cut: 'Rib Eye', kategorie: 'fleisch' }));
  const sichtbar = markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  it('behauptet keine Partnerschaft und keine Lieferzusage', () => {
    expect(sichtbar).not.toMatch(/partner/i);
    expect(sichtbar).not.toMatch(/Premium|gekühlt|geliefert/);
    expect(sichtbar).toContain('keine Provision');
  });

  it('verlinkt nur in die Shop-Suche, ohne weitere Parameter', () => {
    const ziele = [...markup.matchAll(/href="([^"]+)"/g)].map((m) => new URL(m[1].replace(/&amp;/g, '&')));
    expect(ziele.map((u) => u.hostname)).toEqual(['www.otto-gourmet.de', 'www.albersfoodshop.de']);
    for (const ziel of ziele) {
      expect([...ziel.searchParams.keys()]).toHaveLength(1);
      expect([...ziel.searchParams.values()]).toEqual(['Rib Eye']);
    }
  });

  it('rendert ohne Fleisch-Kategorie oder ohne Cut nichts', () => {
    expect(renderToStaticMarkup(createElement(CutBestellen, { cut: 'Rib Eye', kategorie: 'fisch' }))).toBe('');
    expect(renderToStaticMarkup(createElement(CutBestellen, { cut: '—', kategorie: 'fleisch' }))).toBe('');
  });
});
