// ── Rezept-Deckel für den BBQ-News-Strom (Magazin) ───────────────────────────
// Uwe, 19.10.2026: „Wenn ich das Magazin aufrufe erscheinen Rezepte." Ursache: Der
// Strom füllt mit den neuesten Plattform-Inhalten auf, und seit dem 21.09. kam keine
// freigegebene News mehr dazu — der Rezept-Agent liefert fast täglich, also bestand
// das Magazin nur noch aus Rezepten. Uwe: „Ja, Schritt 2 umsetzen" (höchstens zwei
// Rezepte). Eigenes Modul ohne Contentlayer-Import, damit der Test ohne Build läuft.

/** Höchstens so viele Rezepte stehen im News-Strom, egal wie viele neu sind. */
export const MAX_REZEPTE_IM_STROM = 2;

/** Contentlayer-Typ der Rezepte (siehe contentlayer.config: defineDocumentType Recipe). */
export const REZEPT_TYP = 'Recipe';

/**
 * Lässt von den (nach Datum absteigend sortierten) Einträgen nur die ersten `max`
 * Rezepte stehen; alle anderen Inhaltsarten bleiben unverändert und in Reihenfolge.
 */
export function deckeleRezepte<T extends { type: string }>(
  eintraege: T[],
  max: number = MAX_REZEPTE_IM_STROM,
): T[] {
  let rezepte = 0;
  return eintraege.filter((e) => {
    if (e.type !== REZEPT_TYP) return true;
    rezepte += 1;
    return rezepte <= max;
  });
}
