/**
 * Urkunden-Kennung = Nummer + Prüfcode, z. B. „SA-2026-0001-K7Q2XM".
 *
 * Die Nummer (SA-<Jahr>-<4 Stellen>) zählt fortlaufend und ist damit erratbar.
 * Erst der Prüfcode (6 Zeichen, ohne verwechselbare 0/O/1/I) macht die
 * öffentliche Prüfseite /urkunde/<kennung> sicher: Wer nur die Nummer kennt,
 * kann keine Absolventen-Namen abrufen. Datenbank: public.urkunden,
 * Funktion urkunde_pruefen(nr, code) — Migration 20261017094922.
 *
 * Reine Funktionen, keine Server-Abhängigkeit (Client und Server).
 */

const KENNUNG = /^(SA-\d{4}-\d{4,})-([A-HJ-NP-Z2-9]{6})$/;

export type Kennung = { nr: string; code: string };

export function kennungAus(nr: string, code: string): string {
  return `${nr}-${code}`;
}

/** Nimmt auch Kleinschreibung und Leerzeichen; gibt null für alles Unpassende. */
export function zerlegeKennung(eingabe: string | null | undefined): Kennung | null {
  const s = (eingabe ?? '').trim().toUpperCase().replace(/\s+/g, '');
  const m = KENNUNG.exec(s);
  return m ? { nr: m[1], code: m[2] } : null;
}

export function pruefPfad(nr: string, code: string): string {
  return `/urkunde/${kennungAus(nr, code)}`;
}

/** Zeile, die auf der Urkunde selbst steht. */
export function urkundenZeile(nr: string, code: string): string {
  return `Urkunden-Nr. ${kennungAus(nr, code)}`;
}
