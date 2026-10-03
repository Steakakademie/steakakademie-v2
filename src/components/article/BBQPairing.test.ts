import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BBQPairing, { pairingLink, pairingWert } from './BBQPairing';

/**
 * Waechter fuer den Pairing-Block auf Rezeptseiten (03.10.2026):
 *   1. Werbekennzeichnung — die Links sind Amazon-Suchlinks mit Partner-Tag.
 *      „Anzeige“ steht lesbar an der Karte, `rel` traegt `sponsored`.
 *   2. Platzhalter — `whiskeyName: Leer` im Frontmatter darf keine Karte
 *      „Leer“ mit totem Knopf erzeugen.
 */
const AMAZON = 'https://www.amazon.de/s?k=Malbec&tag=steakakademie-21';

function html(props: Record<string, unknown>) {
  return renderToStaticMarkup(createElement(BBQPairing, { meatType: 'Ribeye', ...props }));
}

/** Sichtbarer Text ohne Tags — so, wie ihn ein Leser sieht. */
function sichtbar(markup: string) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

describe('pairingWert', () => {
  it('gibt echte Werte getrimmt zurueck', () => {
    expect(pairingWert('  Malbec ')).toBe('Malbec');
    expect(pairingWert('Keine Angst vor Tannin')).toBe('Keine Angst vor Tannin');
  });

  it('behandelt leere Werte und Platzhalter als nicht vorhanden', () => {
    for (const wert of ['', '   ', 'Leer', 'leer', ' LEER ', '-', '–', '—', 'n/a', 'N/A', 'keine', 'Keine']) {
      expect(pairingWert(wert), JSON.stringify(wert)).toBeNull();
    }
    expect(pairingWert(undefined)).toBeNull();
    expect(pairingWert(null)).toBeNull();
    expect(pairingWert(42)).toBeNull();
  });
});

describe('pairingLink', () => {
  it('laesst nur https-Links gelten', () => {
    expect(pairingLink(AMAZON)).toBe(AMAZON);
    expect(pairingLink(` ${AMAZON} `)).toBe(AMAZON);
    for (const wert of ['Leer', '', 'http://www.amazon.de/x', '/go/meater-plus', 'www.amazon.de', 'javascript:alert(1)', undefined]) {
      expect(pairingLink(wert), JSON.stringify(wert)).toBeNull();
    }
  });
});

describe('BBQPairing', () => {
  const beide = {
    whiskeyName: 'Buffalo Trace',
    whiskeyType: 'Bourbon',
    whiskeyProfile: 'Vanille und Karamell.',
    affiliateLinkWhiskey: 'https://www.amazon.de/s?k=Buffalo+Trace&tag=steakakademie-21',
    wineName: 'Malbec',
    wineType: 'Rotwein',
    wineProfile: 'Dunkle Frucht.',
    affiliateLinkWine: AMAZON,
  };

  it('kennzeichnet jede Karte mit Link als Anzeige und setzt rel=sponsored', () => {
    const markup = html(beide);
    expect(sichtbar(markup).match(/Anzeige/g)).toHaveLength(2);
    const rels = [...markup.matchAll(/<a [^>]*rel="([^"]*)"/g)].map((m) => m[1]);
    expect(rels).toHaveLength(2);
    for (const rel of rels) {
      expect(rel.split(' ')).toEqual(expect.arrayContaining(['sponsored', 'nofollow', 'noopener']));
    }
    // Das Etikett steht im Markup VOR dem jeweiligen Knopf.
    expect(markup.indexOf('Anzeige')).toBeLessThan(markup.indexOf('<a '));
    expect(markup).toContain('Affiliate-Links');
  });

  it('rendert fuer den Platzhalter „Leer“ keine Karte und keinen toten Link', () => {
    const markup = html({
      ...beide,
      whiskeyName: 'Leer',
      whiskeyType: 'Leer',
      whiskeyProfile: 'Leer',
      affiliateLinkWhiskey: 'Leer',
    });
    expect(sichtbar(markup)).not.toMatch(/\bLeer\b/);
    expect(markup).not.toContain('href="Leer"');
    expect(markup).not.toContain('Spirituosen-Tipp');
    expect(markup).toContain('Malbec');
    expect([...markup.matchAll(/<a /g)]).toHaveLength(1);
  });

  it('zeigt eine Karte ohne gueltigen Link ohne Knopf, ohne Etikett und ohne Fusszeile', () => {
    const markup = html({ wineName: 'Tempranillo', wineProfile: 'Dunkle Frucht.', affiliateLinkWine: '' });
    expect(markup).toContain('Tempranillo');
    expect(markup).not.toContain('<a ');
    expect(sichtbar(markup)).not.toContain('Anzeige');
    expect(markup).not.toContain('Affiliate-Links');
  });

  it('rendert ohne jeden Namen gar nichts', () => {
    expect(html({ whiskeyName: 'Leer', wineName: ' ' })).toBe('');
  });
});
