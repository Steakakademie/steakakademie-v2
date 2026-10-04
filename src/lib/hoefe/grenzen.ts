/**
 * Der Rahmen des Hofladen-Radars: Deutschland, Oesterreich, Schweiz (03.10.2026).
 *
 * EINE Quelle fuer die Zahlen — `grenzen.json` in diesem Ordner. Sie wird gelesen von
 *   - dieser Datei (Suche: /api/hoefe, Geocoding),
 *   - scripts/lib/hoefe-osm.mjs (Wochenimport),
 * und sie muss zu den CHECK-Constraints der Tabelle `hoefe` passen
 * (supabase/migrations/20261003074310_hoefe_grenzen_dach.sql). Den Gleichstand
 * erzwingt src/__tests__/hoefe-grenzen.test.ts.
 *
 * Warum das zaehlt: Bis hierher standen die Grenzen an vier Stellen mit zwei
 * verschiedenen Werten. Der Import liess seit dem 19.09.2026 Hoefe bis 17,5° Ost
 * durch, die Tabelle erlaubte nur bis 16° — der erste Hof oestlich davon (Wien liegt
 * bei 16,37°) liess den ganzen Wochenlauf scheitern. Und /api/hoefe klemmte einen
 * Standort in Wien still auf 16,0° — die Suche lief dann rund 28 km zu weit westlich.
 *
 * Tatsaechliche Extrempunkte, auf die der Rahmen gelegt ist:
 *   Breite  45,82° N (Chiasso, CH)        … 55,06° N (List auf Sylt, DE)
 *   Laenge   5,87° O (Isenbruch, DE)      … 17,16° O (Deutsch Jahrndorf, AT)
 * Der Rahmen laesst ringsum rund ein Drittel Grad Luft. Er ist eine grobe Box, kein
 * Grenzverlauf: genau filtert die Overpass-Abfrage ueber die Landesflaechen.
 */
import grenzen from './grenzen.json';

export const DACH_GRENZEN: Readonly<{ latMin: number; latMax: number; lngMin: number; lngMax: number }> = grenzen;

/** Liegt die Koordinate im Rahmen DE + AT + CH? */
export function imDachRaum(lat: number, lng: number): boolean {
  return (
    lat >= DACH_GRENZEN.latMin && lat <= DACH_GRENZEN.latMax &&
    lng >= DACH_GRENZEN.lngMin && lng <= DACH_GRENZEN.lngMax
  );
}
