import { describe, expect, it } from 'vitest';
import { articleSchema, authorSchemaRef, FOUNDER_ID, pruefvermerkSchema } from '@/lib/schema';

/**
 * Waechter fuer zwei Zusagen im strukturierten Teil der Seiten (02.10.2026):
 *   1. Ein Pruefvermerk (reviewedBy/lastReviewed) erscheint NUR, wenn das
 *      Frontmatter ein reviewedAt traegt — das setzt allein Uwe von Hand.
 *   2. KI-Personas werden nie als Person ausgezeichnet.
 */
const BASIS = {
  headline: 'Titel',
  description: 'Beschreibung',
  image: '/bild.jpg',
  datePublished: '2026-09-01',
  authorName: 'Marco',
  authorSlug: 'marco',
  url: '/fleischwissen/test',
};

describe('pruefvermerkSchema', () => {
  it('liefert ohne reviewedAt nichts', () => {
    expect(pruefvermerkSchema(undefined)).toEqual({});
    expect(pruefvermerkSchema(null)).toEqual({});
    expect(pruefvermerkSchema('')).toEqual({});
    expect(pruefvermerkSchema('kein-datum')).toEqual({});
  });

  it('nennt Uwe als Pruefer und das Datum ohne Uhrzeit', () => {
    const s = pruefvermerkSchema('2026-09-03T00:00:00.000Z');
    expect(s).toMatchObject({
      lastReviewed: '2026-09-03',
      reviewedBy: { '@type': 'Person', '@id': FOUNDER_ID, name: 'Uwe Yendell' },
    });
  });
});

describe('articleSchema', () => {
  it('haengt den Pruefvermerk an die WebPage, nicht an den Article', () => {
    const s = articleSchema({ ...BASIS, reviewedAt: '2026-09-03T00:00:00.000Z' });
    expect(s.mainEntityOfPage).toMatchObject({ '@type': 'WebPage', lastReviewed: '2026-09-03' });
    expect(s).not.toHaveProperty('reviewedBy');
  });

  it('ohne reviewedAt kein Pruefvermerk', () => {
    const s = articleSchema(BASIS);
    expect(s.mainEntityOfPage).not.toHaveProperty('reviewedBy');
    expect(s.mainEntityOfPage).not.toHaveProperty('lastReviewed');
  });
});

describe('authorSchemaRef', () => {
  it('zeichnet KI-Personas als Organisation aus, nie als Person', () => {
    for (const slug of ['marco', 'elena', 'jonas']) {
      expect(authorSchemaRef(slug)['@type']).toBe('Organization');
    }
  });
});
