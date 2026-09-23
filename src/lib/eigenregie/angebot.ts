/**
 * Eigenregie — Angebot und Pilotfenster (Uwe, 19.09.2026).
 *
 * Regeln (KONZEPT-Eigenregie Abschnitt 3, Anhang zu § 3 Abs. 3 UWG Nr. 7, § 5 UWG):
 * - EIN fester Kalendertermin, serverseitig, für alle Besucher gleich.
 *   Kein Cookie, kein localStorage, kein Zähler pro Besucher.
 * - Nach Ablauf gilt der reguläre Preis wirklich — auf der Seite UND bei Digistore
 *   (Zahlplan 1507371 = 999 € aus, 1507372 = 1.497 € an).
 * - Begründung der Begrenzung ist echt: Pilotpreis für die ersten Käufer gegen Feedback-Fragebogen.
 *   KEINE persönliche Betreuung/Beantwortung von Fragen im Kurspreis (FernUSG, BGH III ZR 109/24;
 *   Entscheidung Uwe 23.09.2026). Coaching nur als eigenständiges, separat buchbares Produkt.
 */
export const DS_PRODUCT_ID = '695900';
export const CHECKOUT_URL = 'https://www.checkout-ds24.com/product/695900';

export const PILOT_PREIS = 999;
export const REGULAERER_PREIS = 1497;
export const PILOT_PLAETZE = 10;
/** Letzter Tag des Pilotfensters, 23:59:59 deutscher Zeit (MEZ, Zeitumstellung am 25.10.). */
export const PILOT_ENDE = new Date('2026-10-31T23:59:59+01:00');

export type Angebot = {
  preis: number;
  pilot: boolean;
  /** Freie Pilotplätze; null = unbekannt (DB nicht erreichbar) */
  freiePlaetze: number | null;
  ausverkauft: boolean;
};

export function angebotFuer(jetzt: Date, verkauft: number | null): Angebot {
  const imFenster = jetzt.getTime() <= PILOT_ENDE.getTime();
  const frei = verkauft === null ? null : Math.max(0, PILOT_PLAETZE - verkauft);
  if (!imFenster) return { preis: REGULAERER_PREIS, pilot: false, freiePlaetze: null, ausverkauft: false };
  if (frei === 0) return { preis: PILOT_PREIS, pilot: true, freiePlaetze: 0, ausverkauft: true };
  return { preis: PILOT_PREIS, pilot: true, freiePlaetze: frei, ausverkauft: false };
}

export function euro(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';
}
