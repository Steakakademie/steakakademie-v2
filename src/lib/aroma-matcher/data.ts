/**
 * Smart-Pairing-Engine — Datenzugriff auf die kuratierten Cuts.
 *
 * Quelle: data/aroma-matcher/cuts.json (Koch-Kuration, statisch im Repo —
 * 10 Datensätze brauchen keine Tabelle). Die Cut-Liste (ohne Cluster) ist
 * öffentlich; das vollständige Pairing gibt es nur über /api/aroma-matcher
 * gegen das Freikontingent oder als festes Teaser-Beispiel.
 *
 * Kuration v1 (Uwe, 17.09.2026): Die JSON-Datei ist ein reines Array der Cuts.
 * Vier Aromenfamilien statt fünf — Rauch (entsteht erst beim Räuchern, steht im
 * Cluster „Wood & Smoke") und Zitrus/Terpene (kaum im Rindfleisch) sind aus dem
 * Profil raus. Profile bleiben relative Gewichtungen (0–100), keine Messwerte.
 */

import raw from '../../../data/aroma-matcher/cuts.json';

export const FREE_LIMIT = 5;

export type AromaFamilyKey =
  | 'maillard_roast'
  | 'aged_nutty'
  | 'lactones_creamy'
  | 'umami_metallic';

export type ClusterKey = 'rubs_and_glazes' | 'wood_and_smoke' | 'drinks_and_sides';

export type PairingItem = { item: string; reason: string };

export type Cut = {
  id: string;
  name: string;
  description: string;
  aroma_profile: Record<AromaFamilyKey, number>;
  key_compounds: Array<{ name: string; family: string }>;
  clusters: Record<ClusterKey, PairingItem[]>;
};

/** Öffentlicher Ausschnitt für den Cut-Picker — ohne Pairing-Ergebnis. */
export type CutSummary = Pick<Cut, 'id' | 'name' | 'description'>;

const seed = { cuts: raw as unknown as Cut[] };

export const FAMILY_LABELS: Record<AromaFamilyKey, string> = {
  maillard_roast: 'Röst & Maillard',
  aged_nutty: 'Nussig & Reifung',
  lactones_creamy: 'Cremig & Lactone',
  umami_metallic: 'Umami & Metallisch',
};

export const FAMILY_ORDER: AromaFamilyKey[] = [
  'maillard_roast',
  'aged_nutty',
  'lactones_creamy',
  'umami_metallic',
];

export const CLUSTER_LABELS: Record<ClusterKey, string> = {
  rubs_and_glazes: 'Rubs & Glazes',
  wood_and_smoke: 'Wood & Smoke',
  drinks_and_sides: 'Drinks & Sides',
};

export const CLUSTER_ORDER: ClusterKey[] = ['rubs_and_glazes', 'wood_and_smoke', 'drinks_and_sides'];

const byId = new Map<string, Cut>();
seed.cuts.forEach((c) => byId.set(c.id, c));

export function allCutSummaries(): CutSummary[] {
  return seed.cuts.map(({ id, name, description }) => ({ id, name, description }));
}

export function cutById(id: string): Cut | null {
  return byId.get(id) ?? null;
}

export function cutIds(): string[] {
  return seed.cuts.map((c) => c.id);
}

/** Festes Beispiel für den anonymen Teaser (Screen 1). */
export const TEASER_CUT_ID = 'ribeye-dry-aged';

export function teaserCut(): Cut {
  const cut = byId.get(TEASER_CUT_ID);
  if (!cut) throw new Error(`Teaser-Cut ${TEASER_CUT_ID} fehlt im Seed.`);
  return cut;
}
