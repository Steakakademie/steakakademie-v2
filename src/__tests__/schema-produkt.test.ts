import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  comparisonPageSchema,
  itemListProdukte,
  organizationSchema,
  productSchema,
  produktIdsImVergleichstext,
} from '@/lib/schema';
import { getProductById } from '@/lib/products';

/**
 * Waechter fuer den Produkt-Teil der strukturierten Daten (03.10.2026).
 * Das Schema darf nichts behaupten, was die Seite nicht belegt:
 *   1. keine fremden Sterne als Bewertung der Steakakademie (`review`,
 *      `aggregateRating`),
 *   2. keine Lieferbarkeit und kein errechnetes Gueltigkeitsdatum im Angebot,
 *   3. keine ItemList aus Produkten, die nicht zur Seite gehoeren,
 *   4. Logo-Masse wie in der Datei.
 */
const PRODUKT = {
  name: 'MEATER Plus',
  description: 'Funk-Thermometer',
  brand: 'MEATER',
  sku: 'B07VBK2D44',
  price: 129,
  affiliateUrl: 'https://www.amazon.de/s?k=MEATER+Plus&tag=steakakademie-21',
};

describe('productSchema', () => {
  it('gibt weder review noch aggregateRating aus — auch nicht, wenn Bewertungsfelder mitkommen', () => {
    // So rief die Vergleichsseite die Funktion bis 03.10.2026 auf.
    const alt = { ...PRODUKT, rating: 4.5, ratingCount: 8420, pros: ['kabellos'], cons: ['App noetig'] };
    const json = JSON.stringify(productSchema(alt));
    expect(json).not.toMatch(/review|aggregateRating|ratingValue|Rating/);
  });

  it('behauptet im Angebot weder Lieferbarkeit noch ein Gueltigkeitsdatum', () => {
    const s = productSchema(PRODUKT);
    expect(s.offers).toEqual({
      '@type': 'Offer',
      price: '129.00',
      priceCurrency: 'EUR',
      url: PRODUKT.affiliateUrl,
    });
    expect(JSON.stringify(s)).not.toMatch(/availability|InStock|priceValidUntil/);
  });

  it('laesst das Angebot weg, wenn kein Einzelpreis uebergeben wird', () => {
    expect(productSchema({ ...PRODUKT, price: null })).not.toHaveProperty('offers');
    expect(productSchema({ ...PRODUKT, price: undefined })).not.toHaveProperty('offers');
    expect(productSchema({ ...PRODUKT, price: 0 })).not.toHaveProperty('offers');
  });
});

describe('comparisonPageSchema', () => {
  it('liefert ohne Produkte keine ItemList', () => {
    expect(comparisonPageSchema({ pageTitle: 'Grillmesser Vergleich', pageUrl: '/vergleich/messer', products: [] })).toBeNull();
  });

  it('zaehlt genau die uebergebenen Produkte', () => {
    const s = comparisonPageSchema({ pageTitle: 'Titel', pageUrl: '/vergleich/x', products: [PRODUKT, PRODUKT] });
    expect(s).toMatchObject({ '@type': 'ItemList', numberOfItems: 2 });
    expect(s?.itemListElement.map((e) => e.position)).toEqual([1, 2]);
  });
});

describe('produktIdsImVergleichstext', () => {
  it('liest id und ids aus den Produkt-Bausteinen, in Reihenfolge, ohne Dubletten', () => {
    const mdx = [
      'Text mit [Link](/go/thermapen-one).',
      '<MDXComparisonTable ids="meater-plus, meater-2-plus,thermapen-one" />',
      '<MDXProductCard id="meater-plus" rank={1} />',
      '<MDXBuyingGuideBlock',
      '  id="inkbird-ibbq-4t"',
      '  title="Titel"',
      '  summary="Zusammenfassung"',
      '/>',
    ].join('\n');
    expect(produktIdsImVergleichstext(mdx)).toEqual(['meater-plus', 'meater-2-plus', 'thermapen-one', 'inkbird-ibbq-4t']);
  });

  it('findet in Text ohne Produkt-Bausteine nichts', () => {
    expect(produktIdsImVergleichstext('## Ueberschrift\n\n| Modell | Preis |\n<Achtung id="x">Hinweis</Achtung>')).toEqual([]);
  });

  // Gegen den echten Inhalt: Was die ItemList einer Vergleichsseite speist,
  // muss in der Registry stehen und zu EINER Kategorie gehoeren. Genau das war
  // bei /vergleich/grills und /vergleich/messer nicht der Fall (Thermometer).
  const ordner = path.join(process.cwd(), 'content', 'vergleich');
  const dateien = readdirSync(ordner).filter((f) => f.endsWith('.mdx'));

  it('liefert fuer jede Vergleichsseite nur bekannte Produkte einer Kategorie', () => {
    expect(dateien.length).toBeGreaterThan(0);
    for (const datei of dateien) {
      const ids = produktIdsImVergleichstext(readFileSync(path.join(ordner, datei), 'utf8'));
      const produkte = ids.map((id) => getProductById(id));
      expect(produkte.every(Boolean), `${datei}: unbekannte Produkt-ID in ${ids.join(', ')}`).toBe(true);
      const kategorien = new Set(produkte.map((p) => p!.category));
      expect(kategorien.size, `${datei}: ${[...kategorien].join(', ')}`).toBeLessThanOrEqual(1);
    }
  });

  it('findet in grills.mdx und messer.mdx keine Produkte — dort gibt es keine ItemList', () => {
    for (const datei of ['grills.mdx', 'messer.mdx']) {
      expect(produktIdsImVergleichstext(readFileSync(path.join(ordner, datei), 'utf8')), datei).toEqual([]);
    }
  });
});

describe('itemListProdukte', () => {
  const registry: Record<string, { id: string }> = { a: { id: 'a' }, b: { id: 'b' } };
  const finde = (id: string) => registry[id];
  const seitenleiste = [{ id: 's1' }, { id: 's2' }];

  it('nimmt die Produkte aus dem Text und nicht die Seitenleiste', () => {
    const mdx = '<MDXComparisonTable ids="a,unbekannt,b" />';
    expect(itemListProdukte(mdx, finde, seitenleiste)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('faellt ohne Produkt-Bausteine auf die Seitenleiste zurueck — wenn es eine gibt', () => {
    expect(itemListProdukte('Nur Text.', finde, seitenleiste)).toEqual(seitenleiste);
  });

  it('liefert ohne Bausteine und ohne zugeordnete Kategorie nichts', () => {
    // /vergleich/grills und /vergleich/messer: keine Bausteine, keine Zuordnung.
    expect(itemListProdukte('Nur Text.', finde, null)).toEqual([]);
  });
});

describe('organizationSchema', () => {
  /** Breite und Hoehe aus dem JPEG-Kopf (SOF-Marker), ohne Bildbibliothek. */
  function jpegMasse(datei: string) {
    const b = readFileSync(datei);
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = b[i + 1];
      const sof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (sof) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
    throw new Error(`Kein SOF-Marker in ${datei}`);
  }

  it('nennt die Logo-Masse der Datei', () => {
    const { logo } = organizationSchema();
    const datei = path.join(process.cwd(), 'public', new URL(logo.url).pathname);
    expect({ width: logo.width, height: logo.height }).toEqual(jpegMasse(datei));
  });
});
