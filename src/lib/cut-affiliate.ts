// Fleisch-Affiliate-Brücke für den Cut-Generator.
//
// Strategie (config-driven, Burggraben + ROADMAP): Premium-Fleischversand als
// Primärpartner. STAND 10.10.2026: **noch keiner.** Die vorgesehenen Händler Don Carne
// und Albers haben nicht geantwortet; meatshop.de ruft Uwe am Montag, 12.10.2026, an.
// BOS FOOD (AWIN, zugelassen) ist ausdrücklich NICHT der Fleischpartner: Uwe sieht ihn
// für Spezialitäten (Trüffel, Öle, Kaviar …) vor (10.10.2026). Dass der Shop auch Fleisch
// führt, ändert das nicht.
// Solange kein Partner feststeht, greift ein SAUBERER FALLBACK auf die Amazon-Suche mit
// aktivem Partner-Tag — exakt das Muster der Grill-/Thermometer-Produkte (registry.yaml).
//
// START mit Partner: PRIMARY unten setzen (id, name, buildUrl — AWIN-Link über
// src/lib/awin.ts oder der Partnerlink des Händlers), status 'active', und den Eintrag
// in products/affiliate-programs.yaml auf `active`. Nicht vor dem 01.11.2026
// (Einstiegsgeld, siehe docs/affiliate-strategie-2026.md, „Ein Haken"). Der Rest (UI,
// Tracking-Route) bleibt unverändert.

import type { Cut } from './cuts-catalog';

export const AMAZON_TAG = 'steakakademie-21';

type PartnerStatus = 'planned' | 'active';

interface MeatPartner {
  id: string;
  name: string;
  status: PartnerStatus;
  /** baut die Ziel-URL für einen Cut (Suche oder Deeplink) */
  buildUrl: (cut: Cut) => string;
}

// Primärpartner — hochpreisiger Fleischversand (hoher €-Betrag/Sale). Offen, siehe oben.
const PRIMARY: MeatPartner | null = null;

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
  return PRIMARY?.status === 'active' ? PRIMARY : FALLBACK;
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
  const premiumActive = PRIMARY?.status === 'active';
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
