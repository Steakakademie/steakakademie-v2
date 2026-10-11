import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chipEintrag, leistenEintraege } from '@/lib/aktionen/leiste';
import { AKTIONEN_NAV } from '@/lib/aktionen/nav';
import SaisonLeiste from '@/components/layout/SaisonLeiste';
import SaisonChip from '@/components/home/SaisonChip';

/**
 * Saison-Leiste und Saison-Chip (Uwe, 11.10.2026). Außerhalb des Fensters bleibt alles
 * wie vorher (Spickzettel-Leiste, kein Chip); im Fenster laufen die Aktionsseiten; in der
 * Vorschau alle, mit ?vorschau=1. Der Server rendert immer den Stand ohne Vorschau.
 */
describe('leistenEintraege', () => {
  it('außerhalb des Fensters: leer', () => {
    expect(leistenEintraege({ jetzt: new Date('2026-10-11T12:00:00Z'), gutschein: true })).toEqual([]);
  });

  it('im Fenster: laufende Aktionsseiten, dazu der Gutschein, wenn kaufbar', () => {
    const e = leistenEintraege({ jetzt: new Date('2026-11-20T12:00:00Z'), gutschein: true });
    expect(e.map((x) => x.key)).toEqual(['geschenke', 'weihnachtsmenue', 'gutschein']);
    expect(e[0]).toMatchObject({ href: '/geschenke', text: 'Geschenke für Grillfans' });
    expect(e[0].symbol.length).toBeGreaterThan(0);
    expect(leistenEintraege({ jetzt: new Date('2026-11-20T12:00:00Z'), gutschein: false }).map((x) => x.key)).toEqual(['geschenke', 'weihnachtsmenue']);
  });

  it('Vorschau: alle Aktionsseiten, Links mit ?vorschau=1', () => {
    const e = leistenEintraege({ jetzt: new Date('2026-10-11T12:00:00Z'), vorschau: true });
    expect(e.map((x) => x.key)).toEqual(AKTIONEN_NAV.map((a) => a.slug));
    for (const x of e) expect(x.href).toContain('vorschau=1');
  });

  it('chipEintrag: erste laufende Aktion, nie der Gutschein', () => {
    expect(chipEintrag({ jetzt: new Date('2026-10-11T12:00:00Z') })).toBeNull();
    expect(chipEintrag({ jetzt: new Date('2026-11-05T12:00:00Z') })).toMatchObject({ key: 'geschenke', href: '/geschenke' });
    expect(chipEintrag({ jetzt: new Date('2026-10-11T12:00:00Z'), vorschau: true })).toMatchObject({ key: 'geschenke', href: '/geschenke?vorschau=1' });
  });
});

describe('Server-Render', () => {
  it('SaisonLeiste rendert ohne Browser die Spickzettel-Leiste', () => {
    const markup = renderToStaticMarkup(createElement(SaisonLeiste));
    expect(markup).toContain('Kerntemperatur-Spickzettel');
    expect(markup).toContain('href="/kerntemperatur-spickzettel"');
    expect(markup).not.toContain('sa-lauf');
  });

  it('SaisonChip rendert nichts ohne Server-Eintrag und den Eintrag mit', () => {
    expect(renderToStaticMarkup(createElement(SaisonChip, { server: null }))).toBe('');
    const markup = renderToStaticMarkup(createElement(SaisonChip, { server: { key: 'geschenke', symbol: '🎁', text: 'Geschenke für Grillfans', href: '/geschenke' } }));
    expect(markup).toContain('href="/geschenke"');
    expect(markup).toContain('Geschenke für Grillfans');
    expect(markup).toContain('sa-gluehen');
  });
});
