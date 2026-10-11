/**
 * Vorschau-Schalter für Teaser und Menü der Aktionsseiten (Uwe, 11.10.2026: „bau den
 * Vorschau-Schalter für Teaser und Menü").
 *
 * Teaser und Menüpunkt erscheinen sonst nur im Saisonfenster. Zum Gegenlesen vorher:
 * `https://steakakademie.de/?vorschau=1` schaltet die Vorschau für diese Browser-Sitzung
 * ein (sessionStorage), `?vorschau=0` schaltet sie aus. In der Vorschau zeigen Teaser und
 * Menü ALLE Aktionsseiten, deren Links tragen `?vorschau=1`, damit auch die Seiten selbst
 * außerhalb des Fensters öffnen (src/app/aktionen/[slug]/page.tsx).
 *
 * Läuft nur im Browser, nach dem Hydrieren: Das vorgerenderte HTML bleibt der echte Stand,
 * die Startseite bleibt statisch (kein searchParams/cookies im Server-Baum). Die Vorschau
 * zeigt nichts, was nicht ohnehin öffentlich wäre — nur früher.
 */
export const VORSCHAU_KEY = 'sa-vorschau';

type Speicher = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Liest den Schalter aus der URL (`vorschau=1|0`), merkt ihn in der Sitzung und gibt den
 * aktuellen Stand zurück. Ohne Parameter gilt der gemerkte Stand.
 */
export function liesVorschau(search: string, speicher: Speicher | null = sitzung()): boolean {
  const wert = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('vorschau');
  try {
    if (wert === '1') { speicher?.setItem(VORSCHAU_KEY, '1'); return true; }
    if (wert === '0') { speicher?.removeItem(VORSCHAU_KEY); return false; }
    return speicher?.getItem(VORSCHAU_KEY) === '1';
  } catch {
    return wert === '1';
  }
}

/** Hängt `?vorschau=1` an eine interne Adresse. */
export function mitVorschau(url: string): string {
  return url.includes('?') ? `${url}&vorschau=1` : `${url}?vorschau=1`;
}

function sitzung(): Speicher | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}
