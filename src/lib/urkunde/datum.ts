/**
 * „10. September 2026" — so steht das Datum auf der Urkunde.
 *
 * Eigene Datei ohne 'server-only', weil die Web-Vorschau
 * (src/components/diplome/UrkundeVorschau.tsx) dasselbe Format im Browser
 * braucht wie render.ts im Druck. Eine Quelle, zwei Abnehmer.
 */
export function urkundenDatum(d: Date = new Date()): string {
  const monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  return `${d.getDate()}. ${monate[d.getMonth()]} ${d.getFullYear()}`;
}
