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

// ── Partnerlink oder gewoehnlicher Link (03.10.2026) ─────────────────────────
// Bis dahin lief JEDE Produktkarte ueber /go/<id>, trug „Anzeige“ und den Satz
// „Wir erhalten eine Provision“ — auch bei Produkten, deren Link ohne
// Partner-Parameter zum Hersteller oder zu einem Haendler fuehrt (beefer.de,
// dry-ager.com, otto.de). Fuer diese Ziele ist in
// products/affiliate-programs.yaml kein Programm verdrahtet (aktiv: Amazon).
// Regel seitdem:
//   - Partnerlink = der Link traegt einen Partner-Parameter. Heute ist das
//     ausschliesslich ein Amazon-Link mit `tag=`. Er laeuft weiter ueber
//     /go/<id>, traegt „Anzeige“ und rel="sponsored nofollow noopener".
//   - Kein Partnerlink = gewoehnlicher externer Link direkt zum Anbieter,
//     rel="noopener noreferrer", OHNE „Anzeige“ und OHNE Provisions-Satz.
// Kommt ein weiteres Programm dazu, wird es HIER eingetragen. Massgeblich ist
// die URL, nicht `provider` (siehe hatAmazonLink).

/** Traegt der Haendler-Link des Produkts einen Partner-Parameter? */
export function hatPartnerlink(product: Pick<Product, 'affiliateUrl'>): boolean {
  if (!hatAmazonLink(product)) return false;
  try {
    const tag = new URL(product.affiliateUrl).searchParams.get('tag');
    return typeof tag === 'string' && tag.trim().length > 0;
  } catch {
    return false;
  }
}

export const REL_PARTNERLINK = 'sponsored nofollow noopener';
export const REL_EXTERN = 'noopener noreferrer';

export interface ProduktLink {
  /** Ziel des Buttons: /go/<id> beim Partnerlink, sonst die Anbieter-URL. */
  href: string;
  rel: string;
  /** true → „Anzeige“ und Provisions-Hinweis; false → keines von beiden. */
  partner: boolean;
}

export function produktLink(product: Pick<Product, 'id' | 'affiliateUrl'>): ProduktLink {
  return hatPartnerlink(product)
    ? { href: `/go/${product.id}`, rel: REL_PARTNERLINK, partner: true }
    : { href: product.affiliateUrl, rel: REL_EXTERN, partner: false };
}

/** Tracking-Klassen fuer den Button — nur beim Partnerlink ein Affiliate-Klick. */
export function klickKlassen(
  product: Pick<Product, 'id' | 'affiliateUrl' | 'provider'>,
  zone?: string,
): string {
  if (!hatPartnerlink(product)) return '';
  return [
    'plausible-event-name=Affiliate-Klick',
    zone ? `plausible-event-zone=${zone}` : '',
    `plausible-event-provider=${product.provider}`,
    `plausible-event-produkt=${product.id}`,
  ].filter(Boolean).join(' ');
}

// ── Preis mit Stand (03.10.2026) ─────────────────────────────────────────────
// Die Preise der Registry sind von Hand eingetragen (`lastChecked`), nicht live
// vom Haendler. Ein Preis ohne Datum liest sich als aktueller Preis — deshalb
// steht der Stand an jeder Preisangabe der Karten. Fehlt `lastChecked` oder ist
// es kein Datum, gibt es KEINEN Stand; die Karte zeigt dann auch keinen Preis,
// sondern „Preis beim Anbieter prüfen“.

const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
] as const;

/** „Stand Mai 2026“ aus `lastChecked` (ISO-Datum) — oder `null`. */
export function preisStand(product: Pick<Product, 'lastChecked'>): string | null {
  const treffer = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(product.lastChecked ?? ''));
  if (!treffer) return null;
  const monat = Number(treffer[2]);
  if (monat < 1 || monat > 12) return null;
  return `Stand ${MONATE[monat - 1]} ${treffer[1]}`;
}

export const PREIS_OHNE_STAND = 'Preis beim Anbieter prüfen';

export interface PreisAnzeige {
  /** „799 €“ oder „849–1099 €“ — `null`, wenn kein belegter Stand vorliegt. */
  preis: string | null;
  /** „Stand Mai 2026“ — oder `null`. */
  stand: string | null;
}

/** Preis und Stand einer Karte. Ohne Stand kein Preis. */
export function preisAnzeige(
  product: Pick<Product, 'price' | 'priceMin' | 'priceMax' | 'lastChecked'>,
): PreisAnzeige {
  const stand = preisStand(product);
  if (!stand) return { preis: null, stand: null };
  if (product.priceMin && product.priceMax) {
    return { preis: `${product.priceMin}–${product.priceMax} €`, stand };
  }
  if (typeof product.price === 'number' && product.price > 0) {
    return { preis: `${product.price} €`, stand };
  }
  return { preis: null, stand: null };
}
