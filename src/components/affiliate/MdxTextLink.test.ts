import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MdxTextLink, { istPartnerlink } from './MdxTextLink';

/**
 * Waechter (03.10.2026): Ein Markdown-Link auf /go/<id> im Fliesstext ist ein
 * Partnerlink und traegt das lesbare Wort „Anzeige“ direkt am Link.
 */
function html(href: string, text: string) {
  return renderToStaticMarkup(createElement(MdxTextLink, { href }, text));
}

describe('istPartnerlink', () => {
  it('erkennt nur /go/-Ziele', () => {
    expect(istPartnerlink('/go/meater-plus')).toBe(true);
    for (const href of ['/glossar/reverse-sear', '/gold/x', 'https://example.com/go/x', '', undefined, null]) {
      expect(istPartnerlink(href), String(href)).toBe(false);
    }
  });
});

describe('MdxTextLink', () => {
  it('setzt bei /go/-Links rel=sponsored und das lesbare Etikett', () => {
    const markup = html('/go/meater-plus', 'MEATER Plus auf Amazon');
    expect(markup).toMatch(/<a [^>]*href="\/go\/meater-plus"[^>]*rel="sponsored nofollow noopener"/);
    // Das Wort steht als Text neben dem Link — nicht nur in title/aria-label.
    expect(markup.replace(/<[^>]+>/g, '|')).toContain('|Anzeige|');
    expect(markup).not.toMatch(/(title|aria-label)="Anzeige"/);
  });

  it('laesst gewoehnliche Links unveraendert', () => {
    const markup = html('/glossar/reverse-sear', 'Reverse Sear');
    expect(markup).not.toContain('Anzeige');
    expect(markup).not.toContain('rel=');
    expect(markup).toContain('>Reverse Sear</a>');
  });
});
