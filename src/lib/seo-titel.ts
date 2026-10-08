/**
 * Seitentitel mit oder ohne Markenzusatz (SEO-Audit 08.10.2026).
 *
 * Das Root-Layout haengt an jeden Titel „ | Steakakademie" an (title.template).
 * Google zeigt in der Ergebnisliste rund 60 Zeichen — bei 46 Seiten war der
 * Titel mit Zusatz 66 bis 113 Zeichen lang, der Zusatz wurde also nie gezeigt
 * und hat nur den eigentlichen Titel verdraengt. Diese Funktion gibt den Titel
 * ohne Zusatz zurueck (`absolute`), sobald beides zusammen die Grenze reisst.
 * Kurze Titel behalten die Marke.
 *
 * Der Zusatz steht hier und im Root-Layout — der Waechter
 * src/__tests__/seo-titel.test.ts haelt beide zusammen.
 */
export const SEO_TITEL_ZUSATZ = ' | Steakakademie';
export const SEO_TITEL_MAX = 65;

export function seoTitel(titel: string): string | { absolute: string } {
  return titel.length + SEO_TITEL_ZUSATZ.length > SEO_TITEL_MAX ? { absolute: titel } : titel;
}
