import type { Product } from '@/types';
import { getProgramByProvider } from '@/lib/affiliate-programs';
import { awinLink, type AwinAdvertiser } from '@/lib/awin';

/**
 * Der eine Schalter für den Start (docs/affiliate-strategie-2026.md, „Technik — morgen“, 5):
 * Ein Produkt mit `partnerZiele` geht zum Netzwerk-Partner, SOBALD dessen Programm im
 * Programmregister auf `status: active` steht — vorher bleibt `affiliateUrl` (Amazon).
 * Am Starttag (01.11.2026 bzw. nach Zusage des Jobcenters) wird nur der Status
 * umgestellt; Register, /go/ und die Geräte-Links folgen automatisch.
 *
 * Kein Datum im Code: Der Start hängt an einer Entscheidung, nicht am Kalender.
 */

export interface AktivesZiel {
  advertiser: AwinAdvertiser;
  /** Produktseite beim Händler (ohne Tracking). */
  zielUrl: string;
}

/** Das erste Partnerziel, dessen Programm live ist — sonst `null`. */
export function aktivesPartnerziel(product: Pick<Product, 'partnerZiele'>): AktivesZiel | null {
  for (const z of product.partnerZiele ?? []) {
    const programm = getProgramByProvider(z.advertiser);
    if (programm?.status === 'active') return { advertiser: z.advertiser, zielUrl: z.url };
  }
  return null;
}

/**
 * Wohin /go/<id> weiterleitet: Trackinglink des aktiven Partners (mit clickref = Platz
 * auf der Seite, für die AWIN-Auswertung) oder die bisherige affiliateUrl.
 */
export function weiterleitungsZiel(
  product: Pick<Product, 'id' | 'affiliateUrl' | 'partnerZiele'>,
  platz?: string | null,
): { url: string; partner: AwinAdvertiser | null } {
  const ziel = aktivesPartnerziel(product);
  if (!ziel) return { url: product.affiliateUrl, partner: null };
  const clickref = platz && /^[a-z0-9_-]{1,50}$/.test(platz) ? platz : product.id;
  return { url: awinLink(ziel.advertiser, ziel.zielUrl, clickref), partner: ziel.advertiser };
}
