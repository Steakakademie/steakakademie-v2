// Fleisch-Affiliate-Brücke für den Cut-Generator.
//
// Strategie (config-driven, Burggraben + ROADMAP): Premium-Fleischversand als
// Primärpartner. Seit 10.10.2026 ist das BOS FOOD (AWIN, zugelassen am 02.10.2026;
// docs/affiliate-strategie-2026.md) — vorher stand hier Otto Gourmet ohne Zulassung.
// BOS FOOD führt die Otto-Gourmet-Produkte ohnehin im Sortiment.
// Solange der Partner nicht live ist, greift ein SAUBERER FALLBACK auf die
// Amazon-Suche mit aktivem Partner-Tag — exakt das Muster der Grill-/Thermometer-
// Produkte (registry.yaml).
//
// START: `status: 'active'` in PRIMARY setzen UND in products/affiliate-programs.yaml
// den Eintrag bos-food auf `active` — ein PR. Vorgesehen ab 01.11.2026 (Einstiegsgeld,
// siehe docs/affiliate-strategie-2026.md, „Ein Haken"). Der Rest (UI, Tracking-Route)
// bleibt unverändert.

import type { Cut } from './cuts-catalog';
import { awinLink } from './awin';

export const AMAZON_TAG = 'steakakademie-21';

type PartnerStatus = 'planned' | 'active';

interface MeatPartner {
  id: string;
  name: string;
  status: PartnerStatus;
  /** baut die Ziel-URL für einen Cut (Suche oder Deeplink) */
  buildUrl: (cut: Cut) => string;
}

// Kategorien im BOS-FOOD-Shop (Seiten am 10.10.2026 aufgerufen, alle 200). Eine Suche
// gibt es per URL nicht — der Shop leitet `/suche?q=…` auf die Startseite —, deshalb
// führt der Link auf die Kategorie der Tierart. Cutspezifische Ziele (z. B. Ribeye)
// setzt, wer im AWIN-Backend die Produktseiten geprüft hat.
const BOS_FOOD_KATEGORIE: Record<Cut['species'], string> = {
  rind: 'https://www.bosfood.de/shop-detail/kategorie/schinken-wurst-fleisch/subkategorie/rindfleisch.html',
  schwein: 'https://www.bosfood.de/shop-detail/kategorie/schinken-wurst-fleisch/subkategorie/schweinefleisch.html',
};

/** AWIN-Deeplink auf die BOS-FOOD-Kategorie der Tierart, Platz „cut-<id>" für die AWIN-Auswertung. */
export function bosFoodUrl(cut: Cut): string {
  const clickref = `cut-${cut.id}`.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 50);
  return awinLink('bos-food', BOS_FOOD_KATEGORIE[cut.species], clickref);
}

// Primärpartner — hochpreisiger Fleischversand (hoher €-Betrag/Sale).
const PRIMARY: MeatPartner = {
  id: 'bos-food',
  name: 'BOS FOOD',
  status: 'planned', // ← auf 'active' setzen, sobald die Platzierung live gehen darf (ab 01.11.2026)
  buildUrl: bosFoodUrl,
};

// Fallback — Amazon-Suche mit aktivem Partner-Tag (immer verfügbar).
const FALLBACK: MeatPartner = {
  id: 'amazon',
  name: 'Amazon',
  status: 'active',
  buildUrl: (cut) =>
    `https://www.amazon.de/s?k=${encodeURIComponent(`${cut.nameDE} ${cut.nameEN} Fleisch`)}&tag=${AMAZON_TAG}`,
};

/** Aktiver Partner: Primär falls live, sonst Fallback. */
export function activeMeatPartner(): MeatPartner {
  return PRIMARY.status === 'active' ? PRIMARY : FALLBACK;
}

/** Externe Ziel-URL (für die Redirect-Route /go-fleisch/[cut]). */
export function buildMeatTargetUrl(cut: Cut): string {
  return activeMeatPartner().buildUrl(cut);
}

export interface MeatOffer {
  href: string; // interner Redirect (getrackt)
  partnerName: string;
  label: string;
  disclosure: string;
  /** true = Premium-Partner aktiv; false = Fallback (Hinweis anzeigen) */
  premiumActive: boolean;
}

/** UI-Sicht: Button-Daten für „Diesen Cut kaufen". */
export function getMeatOffer(cut: Cut): MeatOffer {
  const premiumActive = PRIMARY.status === 'active';
  const partner = activeMeatPartner();
  return {
    href: `/go-fleisch/${cut.id}`,
    partnerName: partner.name,
    label: premiumActive ? `${cut.nameDE} bei ${partner.name} kaufen` : `${cut.nameDE} kaufen`,
    disclosure:
      'Affiliate-Link: Kaufst du über diesen Link, erhalten wir eine Provision — ohne Mehrkosten für dich.',
    premiumActive,
  };
}
