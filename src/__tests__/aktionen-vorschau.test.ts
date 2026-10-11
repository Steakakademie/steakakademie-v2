import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { liesVorschau, mitVorschau, VORSCHAU_KEY } from '@/lib/aktionen/vorschau';
import AktionsTeaserVorschau from '@/components/home/AktionsTeaserVorschau';

/**
 * Vorschau-Schalter (Uwe, 11.10.2026): `?vorschau=1` schaltet ein und merkt sich das in
 * der Sitzung, `?vorschau=0` schaltet aus; ohne Parameter gilt der gemerkte Stand. Auf dem
 * Server rendert die Vorschau nichts — das vorgerenderte HTML bleibt der echte Stand.
 */
function speicher() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
    map: m,
  };
}

describe('liesVorschau', () => {
  it('?vorschau=1 schaltet ein und merkt es sich', () => {
    const s = speicher();
    expect(liesVorschau('?vorschau=1', s)).toBe(true);
    expect(s.map.get(VORSCHAU_KEY)).toBe('1');
    expect(liesVorschau('', s)).toBe(true);
    expect(liesVorschau('?x=y', s)).toBe(true);
  });

  it('?vorschau=0 schaltet aus', () => {
    const s = speicher();
    liesVorschau('?vorschau=1', s);
    expect(liesVorschau('?vorschau=0', s)).toBe(false);
    expect(liesVorschau('', s)).toBe(false);
  });

  it('ohne Parameter und ohne Merker: aus', () => {
    expect(liesVorschau('', speicher())).toBe(false);
    expect(liesVorschau('', null)).toBe(false);
  });

  it('ohne Speicher gilt nur der Parameter', () => {
    expect(liesVorschau('?vorschau=1', null)).toBe(true);
    expect(liesVorschau('?vorschau=0', null)).toBe(false);
  });

  it('mitVorschau hängt den Parameter an', () => {
    expect(mitVorschau('/geschenke')).toBe('/geschenke?vorschau=1');
    expect(mitVorschau('/aktionen/weihnachtsmenue?x=1')).toBe('/aktionen/weihnachtsmenue?x=1&vorschau=1');
  });
});

describe('AktionsTeaserVorschau', () => {
  it('rendert auf dem Server nichts', () => {
    expect(renderToStaticMarkup(createElement(AktionsTeaserVorschau))).toBe('');
  });
});
