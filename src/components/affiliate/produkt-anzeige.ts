import type { Product } from '@/types';

/**
 * Was eine Produktkarte ueber Bewertung und Preis sagen darf (03.10.2026).
 *
 * `rating`/`ratingCount` in products/registry.yaml sind von Hand eingetragene
 * Amazon-Durchschnitte (PA-API nicht angebunden) — keine Bewertung der
 * Steakakademie. Die Karten nannten sie „Amazon-Bewertungen“, auch bei
 * Produkten, deren Link gar nicht zu Amazon fuehrt (Beefer, DRY AGER,
 * Ankarsrum, Otto Gourmet). Regel seitdem: Sterne nur, wenn der Link des
 * Produkts tatsaechlich zu Amazon geht, und immer mit Quellenangabe.
 *
 * Bewusst eine eigene Datei ohne JSX: die Karten UND der Schema-Teil der
 * Vergleichsseite fragen hier nach, damit beide dasselbe sagen.
 */

const AMAZON_HOST = /(^|\.)amazon\.de$/;
const AMAZON_KURZLINK = new Set(['amzn.to', 'amzn.eu']);

/** Fuehrt der Haendler-Link des Produkts zu Amazon? Massgeblich ist die URL,
 *  nicht `provider` — der E-Beefer hat `provider: other` und einen Amazon-Link,
 *  der Ankarsrum eine ASIN und einen Link zu otto.de. */
export function hatAmazonLink(product: Pick<Product, 'affiliateUrl'>): boolean {
  try {
    const host = new URL(product.affiliateUrl).hostname.toLowerCase();
    return AMAZON_HOST.test(host) || AMAZON_KURZLINK.has(host);
  } catch {
    return false;
  }
}

export interface AmazonBewertung {
  rating: number;
  ratingCount?: number;
}

/** Die Amazon-Bewertung eines Produkts — oder `null`, wenn es keine zeigen darf. */
export function amazonBewertung(
  product: Pick<Product, 'affiliateUrl' | 'rating' | 'ratingCount'>,
): AmazonBewertung | null {
  if (!hatAmazonLink(product)) return null;
  if (typeof product.rating !== 'number' || !(product.rating > 0)) return null;
  const anzahl =
    typeof product.ratingCount === 'number' && product.ratingCount > 0 ? product.ratingCount : undefined;
  return { rating: product.rating, ...(anzahl !== undefined && { ratingCount: anzahl }) };
}

/**
 * Der Preis, den die Karte als EINE Zahl zeigt — oder `null`, wenn sie eine
 * Spanne zeigt („849–1099 €“). Gleiche Bedingung wie in den Karten
 * (`priceMin && priceMax`). Das Schema nennt nur dann einen Angebotspreis,
 * wenn die Karte denselben Preis nennt; eine Spanne ist kein Angebotspreis.
 */
export function einzelpreis(product: Pick<Product, 'price' | 'priceMin' | 'priceMax'>): number | null {
  if (product.priceMin && product.priceMax) return null;
  return typeof product.price === 'number' && product.price > 0 ? product.price : null;
}
