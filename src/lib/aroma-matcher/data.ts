/**
 * Smart-Pairing-Engine — Datenzugriff auf die kuratierten Cuts.
 *
 * Quelle: data/aroma-matcher/cuts.json (Koch-Kuration, statisch im Repo —
 * 10 Datensätze brauchen keine Tabelle). Die Cut-Liste (ohne Cluster) ist
 * öffentlich; das vollständige Pairing gibt es nur über /api/aroma-matcher
 * gegen das Freikontingent oder als festes Teaser-Beispiel.
 */

import raw from '../../../data/aroma-matcher/cuts.json';

export const FREE_LIMIT = 5;

export type AromaFamilyKey =
  | 'maillard_roast'
  | 'pyrazines_nutty'
  | 'lactones_creamy'
  | 'phenols_smoke'
  | 'terpenes_citrus';

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

type Seed = {
  familien: Record<AromaFamilyKey, string>;
  cuts: Cut[];
};

const seed = raw as unknown as Seed;

export const FAMILY_LABELS: Record<AromaFamilyKey, string> = seed.familien;

export const FAMILY_ORDER: AromaFamilyKey[] = [
  'maillard_roast',
  'pyrazines_nutty',
  'lactones_creamy',
  'phenols_smoke',
  'terpenes_citrus',
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
