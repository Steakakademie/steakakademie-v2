import { describe, expect, it } from 'vitest';
import { absoluteUrl, articleSchema } from '@/lib/schema';

/**
 * Wächter für absolute Bild-URLs in strukturierten Daten (04.10.2026).
 * Anlass: /artikel/* und /usa-expedition/* gaben `Article.image` als `/images/…`
 * aus — für einen Crawler, der das JSON-LD ohne Seitenkontext liest, keine Adresse.
 */
describe('absoluteUrl', () => {
  it('ergänzt die Domain vor einem Frontmatter-Pfad', () => {
    expect(absoluteUrl('/images/usa/texas-style.jpg')).toBe('https://steakakademie.de/images/usa/texas-style.jpg');
  });
  it('ergänzt den fehlenden Schrägstrich', () => {
    expect(absoluteUrl('images/a.jpg')).toBe('https://steakakademie.de/images/a.jpg');
  });
  it('lässt absolute URLs unverändert', () => {
    expect(absoluteUrl('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
  });
});

describe('articleSchema', () => {
  const schema = articleSchema({
    headline: 'Titel',
    description: 'Text',
    image: '/images/cuts/ribeye.jpg',
    datePublished: '2026-05-23',
    authorName: 'Marco',
    authorSlug: 'marco',
    url: '/cuts/ribeye',
  });
  it('gibt das Bild absolut aus', () => {
    expect(schema.image.url).toBe('https://steakakademie.de/images/cuts/ribeye.jpg');
  });
  it('setzt dateModified auch ohne Änderungsdatum', () => {
    expect(schema.dateModified).toBe('2026-05-23');
  });
  it('verweist auf die eine Organisations-Entität', () => {
    expect(schema.publisher).toEqual({ '@id': 'https://steakakademie.de/#organization' });
  });
});
