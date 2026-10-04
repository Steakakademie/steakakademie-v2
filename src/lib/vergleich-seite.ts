import type { Product } from '@/types';
import { getProductById } from '@/lib/products';
import { produktIdsImVergleichstext } from '@/lib/schema';

/**
 * Was eine Vergleichsseite über sich sagt und welche Produkte sie zeigt
 * (03.10.2026) — eine Quelle für /vergleich, /vergleich/[slug] und
 * /relaunch/vergleich/[slug].
 *
 * Anlass: Die sieben Vergleichsseiten behaupteten eigene Gerätetests mit Dauer,
 * Stückzahl und Messwerten, dazu Siegel und Etiketten, die ein Testergebnis
 * ausgaben. Einen Testbeleg gibt es nicht. Entscheidung Uwe, 03.10.2026: Die
 * Seiten sind eine Marktübersicht — und sagen das offen. Wächter:
 * src/__tests__/vergleich-keine-testbehauptung.test.ts.
 */

/** Der offene Methodensatz. Steht sichtbar oben auf jeder Vergleichsseite. */
export const METHODENSATZ =
  'Marktübersicht nach Herstellerangaben und öffentlich zugänglichen Daten — kein eigener Gerätetest.';

/** Ergänzung zum Methodensatz: was die Einordnungen und Preise sind. */
export const METHODEN_ERLAEUTERUNG =
  'Technische Angaben stammen aus den Produktdaten der Hersteller und Händler; wir haben sie nicht nachgemessen. Empfehlungen sind eine redaktionelle Einordnung nach dieser Datenlage. Angaben und Preise ändern sich — maßgeblich ist, was beim Anbieter steht.';

/**
 * Produkte einer Vergleichsseite OHNE Produkt-Bausteine im Text, ausdrücklich je
 * Slug. Kein Rückfall auf eine fremde Kategorie: Bis 03.10.2026 zeigte die
 * Seitenleiste von /vergleich/grills und /vergleich/messer Thermometer
 * (`?? 'thermometer'`). Genannt sind nur Produkte, die der Text der Seite
 * selbst behandelt. Für die Pelletgrills aus /vergleich/grills führt die
 * Registry kein Produkt — deshalb stehen dort zwei Karten, nicht drei.
 */
export const VERGLEICH_PRODUKTE: Record<string, readonly string[]> = {
  fleischthermometer: ['meater-plus', 'thermapen-one', 'inkbird-ibt-4xs'],
  grills: ['weber-master-touch-57', 'kamado-joe-classic-iii'],
  messer: ['victorinox-fibrox-20', 'wuesthof-classic-kochmesser-20', 'kai-shun-classic-20'],
};

function finde(ids: readonly string[]): Product[] {
  return ids.flatMap((id) => {
    const produkt = getProductById(id);
    return produkt ? [produkt] : [];
  });
}

/**
 * Die Produkte, die zu einer Vergleichsseite gehören:
 *   1. die Produkt-Bausteine im Text (in der Reihenfolge des Auftretens),
 *   2. sonst die ausdrücklich zugeordneten (VERGLEICH_PRODUKTE),
 *   3. sonst keine.
 */
export function vergleichsProdukte(slug: string, mdxRoh: string): Product[] {
  const imText = finde(produktIdsImVergleichstext(mdxRoh));
  if (imText.length > 0) return imText;
  return finde(VERGLEICH_PRODUKTE[slug] ?? []);
}

/** Anzahl der Modelle einer Seite — gezählt, nicht behauptet. */
export function anzahlModelle(slug: string, mdxRoh: string): number {
  return vergleichsProdukte(slug, mdxRoh).length;
}
