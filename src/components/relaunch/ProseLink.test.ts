import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProseLink from './ProseLink';
import MdxTextLink from '@/components/affiliate/MdxTextLink';

/**
 * Wächter (03.10.2026): Im Lesetext des Relaunches ist ein Markdown-Link auf
 * /go/<id> ein Partnerlink — mit demselben `rel` und demselben lesbaren Wort
 * „Anzeige" wie auf den Alt-Seiten. Vorher lief er als interner Link durch.
 */
function html(href: string, text: string) {
  return renderToStaticMarkup(createElement(ProseLink, { href }, text));
}

/** Was der gemeinsame Baustein für denselben Link ausgibt — die Bezugsgröße. */
function referenz(href: string, text: string) {
  return renderToStaticMarkup(createElement(MdxTextLink, { href }, text));
}

describe('ProseLink', () => {
  it('ein /go/-Link trägt rel und das lesbare Etikett', () => {
    const markup = html('/go/meater-plus', 'MEATER Plus auf Amazon');
    expect(markup).toMatch(/<a [^>]*href="\/go\/meater-plus"/);
    expect(markup).toMatch(/<a [^>]*rel="[^"]*sponsored[^"]*"/);
    expect(markup).toMatch(/<a [^>]*rel="[^"]*nofollow[^"]*"/);
    // Das Wort steht als Text neben dem Link — nicht nur in title/aria-label.
    expect(markup.replace(/<[^>]+>/g, '|')).toContain('|Anzeige|');
    expect(markup).not.toMatch(/(title|aria-label)="Anzeige"/);
  });

  it('rel und Etikett sind die des gemeinsamen Bausteins, nicht eine zweite Fassung', () => {
    const rel = (markup: string) => markup.match(/<a [^>]*rel="([^"]*)"/)?.[1];
    const etikett = (markup: string) => markup.replace(/<a [\s\S]*?<\/a>/, '').replace(/<[^>]+>/g, '').trim();
    const eigen = html('/go/meater-plus', 'MEATER Plus');
    const gemeinsam = referenz('/go/meater-plus', 'MEATER Plus');
    expect(rel(eigen)).toBe(rel(gemeinsam));
    expect(etikett(eigen)).toBe(etikett(gemeinsam));
    expect(etikett(eigen)).not.toBe('');
  });

  it('der Partnerlink behält die Linkklasse der hellen Ebene und sitzt in der Hülle fürs Etikett', () => {
    const markup = html('/go/meater-plus', 'MEATER Plus');
    expect(markup).toMatch(/^<span class="sk-prose__partner">/);
    expect(markup).toMatch(/<a [^>]*class="sk-prose__a"/);
  });

  it('gewöhnliche interne Links bleiben ohne rel und ohne Etikett', () => {
    const markup = html('/glossar/reverse-sear', 'Reverse Sear');
    expect(markup).toMatch(/<a [^>]*href="\/glossar\/reverse-sear"/);
    expect(markup).not.toContain('Anzeige');
    expect(markup).not.toContain('sponsored');
    expect(markup).not.toContain('sk-prose__partner');
  });

  it('ein Pfad, der nur mit „/go" beginnt, ist kein Partnerlink', () => {
    expect(html('/gold/barren', 'Gold')).not.toContain('Anzeige');
  });

  it('externe Links bleiben rel=noopener ohne Etikett', () => {
    const markup = html('https://example.com/go/x', 'Extern');
    expect(markup).toMatch(/<a [^>]*rel="noopener"/);
    expect(markup).not.toContain('Anzeige');
  });
});
