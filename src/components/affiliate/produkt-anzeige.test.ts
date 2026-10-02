import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Product } from '@/types';
import { getAllProducts, getProductById } from '@/lib/products';
import ProductCard from './ProductCard';
import ComparisonTable from './ComparisonTable';
import HeroRecommendation from './HeroRecommendation';
import { amazonBewertung, einzelpreis, hatAmazonLink } from './produkt-anzeige';

/**
 * Waechter (03.10.2026): `rating`/`ratingCount` der Registry sind von Hand
 * eingetragene Amazon-Durchschnitte. Sie erscheinen nur bei Produkten, deren
 * Link tatsaechlich zu Amazon fuehrt, und nie ohne Quellenangabe.
 */
const BASIS: Product = {
  id: 'test',
  name: 'Testprodukt',
  brand: 'Marke',
  category: 'thermometer',
  price: 129,
  affiliateUrl: 'https://www.amazon.de/dp/B000TEST/?tag=steakakademie-21',
  provider: 'amazon',
  rating: 4.5,
  ratingCount: 8420,
  lastChecked: '2026-05-22',
};

function sichtbar(markup: string) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

describe('hatAmazonLink', () => {
  it('erkennt Amazon an der URL, nicht am provider', () => {
    expect(hatAmazonLink({ affiliateUrl: 'https://www.amazon.de/s?k=x&tag=steakakademie-21' })).toBe(true);
    expect(hatAmazonLink({ affiliateUrl: 'https://amazon.de/dp/B0' })).toBe(true);
    expect(hatAmazonLink({ affiliateUrl: 'https://amzn.to/abc' })).toBe(true);
  });

  it('lehnt andere Haendler, Nachbauten und kaputte Werte ab', () => {
    for (const url of [
      'https://beefer.de/produkt/x',
      'https://www.dry-ager.com/x',
      'https://www.otto.de/p/x',
      'https://www.otto-gourmet.de/x',
      'https://amazon.de.example.com/x',
      'https://notamazon.de/x',
      'Leer',
      '',
    ]) {
      expect(hatAmazonLink({ affiliateUrl: url }), url).toBe(false);
    }
  });
});

describe('amazonBewertung', () => {
  it('liefert Sterne und Anzahl nur bei Amazon-Link', () => {
    expect(amazonBewertung(BASIS)).toEqual({ rating: 4.5, ratingCount: 8420 });
    expect(amazonBewertung({ ...BASIS, affiliateUrl: 'https://beefer.de/x' })).toBeNull();
  });

  it('liefert ohne Bewertung nichts und laesst eine fehlende Anzahl weg', () => {
    expect(amazonBewertung({ ...BASIS, rating: undefined })).toBeNull();
    expect(amazonBewertung({ ...BASIS, rating: 0 })).toBeNull();
    expect(amazonBewertung({ ...BASIS, ratingCount: undefined })).toEqual({ rating: 4.5 });
  });
});

describe('einzelpreis', () => {
  it('nennt den Preis nur, wenn die Karte eine einzelne Zahl zeigt', () => {
    expect(einzelpreis({ price: 129 })).toBe(129);
    expect(einzelpreis({ price: 999, priceMin: 849, priceMax: 1099 })).toBeNull();
    expect(einzelpreis({ price: 0 })).toBeNull();
  });
});

describe('Registry: Produkte ohne Amazon-Link', () => {
  const ohneAmazon = getAllProducts().filter((p) => !hatAmazonLink(p));

  it('enthaelt die bekannten Faelle (sonst prueft dieser Test nichts)', () => {
    const ids = ohneAmazon.map((p) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining(['beefer-pro-ii', 'beefer-xl-ii', 'dry-ager-dx500', 'dry-ager-dx1000', 'otto-gourmet-wagyu-box']),
    );
  });

  it('zeigt bei keinem davon Sterne oder das Wort Amazon — in keiner Karte', () => {
    for (const product of ohneAmazon) {
      const karten = [
        renderToStaticMarkup(createElement(ProductCard, { product })),
        renderToStaticMarkup(createElement(ProductCard, { product, variant: 'sidebar' })),
        renderToStaticMarkup(createElement(ProductCard, { product, variant: 'compact' })),
        renderToStaticMarkup(createElement(ComparisonTable, { products: [product] })),
        renderToStaticMarkup(createElement(HeroRecommendation, { productId: product.id, pitch: 'Pitch' })),
      ];
      for (const markup of karten) {
        expect(markup, product.id).not.toContain('lucide-star');
        expect(sichtbar(markup), product.id).not.toMatch(/Amazon/);
      }
    }
  });
});

describe('Karten: Produkte mit Amazon-Link', () => {
  const product = getProductById('meater-plus')!;

  it('zeigen die Sterne immer mit Quelle', () => {
    expect(hatAmazonLink(product)).toBe(true);
    const karten = [
      renderToStaticMarkup(createElement(ProductCard, { product })),
      renderToStaticMarkup(createElement(ProductCard, { product, variant: 'sidebar' })),
      renderToStaticMarkup(createElement(ComparisonTable, { products: [product] })),
      renderToStaticMarkup(createElement(HeroRecommendation, { productId: product.id, pitch: 'Pitch' })),
    ];
    for (const markup of karten) {
      expect(markup).toContain('lucide-star');
      expect(sichtbar(markup)).toMatch(/Ø Amazon|Amazon-Bewertungen/);
    }
  });
});
