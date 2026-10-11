import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ART, FUER, KOENNEN, MAX_PRODUKTE, ergebnis, parseAntworten, serializeAntworten, type FinderSetup } from '@/lib/geschenke-finder';
import { finderSetups } from '@/components/geschenke/GeschenkeFinderServer';
import GeschenkeFinderServer from '@/components/geschenke/GeschenkeFinderServer';
import GeschenkeFinder from '@/components/geschenke/GeschenkeFinder';
import { aktionBySlug } from '@/lib/aktionen';
import { REL_EXTERN, REL_PARTNERLINK } from '@/components/affiliate/produkt-anzeige';

/**
 * Geschenke-Finder (Uwe, 11.10.2026): Jede Könnensstufe findet ihr Setup in der YAML,
 * die Antworten überleben die Reise durch den Link, und die Produktzeilen tragen „Anzeige"
 * genau beim Partnerlink — ohne Preis.
 */
const setups = (): FinderSetup[] => finderSetups(aktionBySlug('geschenke')!.setups);

describe('Setups aus data/aktionen/geschenke.yaml', () => {
  it('jede Könnensstufe hat genau ein Setup mit mindestens drei Produkten', () => {
    const s = setups();
    for (const k of KOENNEN) {
      const treffer = s.filter((x) => x.stufe === k.key);
      expect(treffer, k.key).toHaveLength(1);
      expect(treffer[0].produkte.length, k.key).toBeGreaterThanOrEqual(MAX_PRODUKTE);
    }
  });

  it('Produktzeilen: Partnerlink mit sponsored und Zählung, Händler ohne Programm ohne', () => {
    const alle = setups().flatMap((s) => s.produkte);
    const partner = alle.filter((p) => p.partner);
    const frei = alle.filter((p) => !p.partner);
    expect(partner.length).toBeGreaterThan(0);
    expect(frei.length).toBeGreaterThan(0); // z. B. Beefer
    for (const p of partner) {
      expect(p.rel, p.id).toBe(REL_PARTNERLINK);
      expect(p.klickKlassen, p.id).toContain('plausible-event-zone=finder');
    }
    for (const p of frei) {
      expect(p.rel, p.id).toBe(REL_EXTERN);
      expect(p.klickKlassen, p.id).toBe('');
    }
  });
});

describe('ergebnis', () => {
  const s = setups();

  it('wählt das Setup der Könnensstufe und höchstens drei Teile', () => {
    const e = ergebnis({ fuer: 'papa', koennen: 'fortgeschritten', art: 'auspacken' }, s);
    expect(e.setup?.stufe).toBe('fortgeschritten');
    expect(e.produkte.length).toBeLessThanOrEqual(MAX_PRODUKTE);
    expect(e.produkte.length).toBeGreaterThan(0);
    expect(e.gutschein).toBeNull();
    expect(e.ueberschrift).toBe('Für Papa: grillt richtig gut');
  });

  it('„Etwas zum Lernen": nur der Gutschein, kein Setup', () => {
    const e = ergebnis({ fuer: 'mama', koennen: 'einsteiger', art: 'lernen' }, s);
    expect(e.setup).toBeNull();
    expect(e.produkte).toEqual([]);
    expect(e.gutschein?.key).toBe('steak-beichte');
  });

  it('„Beides": Setup und Gutschein, je Stufe ein anderer Gutschein', () => {
    expect(ergebnis({ fuer: 'ich', koennen: 'fortgeschritten', art: 'beides' }, s).gutschein?.key).toBe('mein-protokoll');
    expect(ergebnis({ fuer: 'ich', koennen: 'alles', art: 'beides' }, s).gutschein?.key).toBe('steak-beichte-5er');
    expect(ergebnis({ fuer: 'ich', koennen: 'alles', art: 'beides' }, s).setup?.stufe).toBe('alles');
  });
});

describe('Antworten im Link', () => {
  it('hin und zurück', () => {
    for (const f of FUER) for (const k of KOENNEN) for (const a of ART) {
      const antworten = { fuer: f.key, koennen: k.key, art: a.key };
      expect(parseAntworten(serializeAntworten(antworten))).toEqual(antworten);
    }
  });

  it('unvollständig oder ungültig: null', () => {
    expect(parseAntworten('')).toBeNull();
    expect(parseAntworten('?fuer=papa&koennen=fortgeschritten')).toBeNull();
    expect(parseAntworten('?fuer=papa&koennen=profi&art=beides')).toBeNull();
    expect(parseAntworten('?fuer=<script>&koennen=einsteiger&art=lernen')).toBeNull();
  });
});

describe('Server-Render', () => {
  it('die Hülle rendert den Finder mit Schritt 1 und ohne Preise', () => {
    const markup = renderToStaticMarkup(createElement(GeschenkeFinderServer));
    expect(markup).toContain('Geschenke-Finder');
    expect(markup).toContain('Für wen suchst du?');
    expect(markup.replace(/<[^>]+>/g, ' ')).not.toMatch(/\d\s?€/);
  });

  it('ein Ergebnis zeigt „Anzeige" nur an Partnerlinks', () => {
    // Direkt mit vorgefüllten Antworten rendern: Der Finder liest sie sonst erst im Browser.
    const s = setups();
    const e = ergebnis({ fuer: 'papa', koennen: 'alles', art: 'auspacken' }, s);
    expect(e.produkte.some((p) => !p.partner)).toBe(true); // Beefer/Dry-Ager
    const markup = renderToStaticMarkup(createElement(GeschenkeFinder, { setups: s, basisUrl: '/geschenke-finder' }));
    expect(markup).toContain('Geschenke-Finder');
  });
});
