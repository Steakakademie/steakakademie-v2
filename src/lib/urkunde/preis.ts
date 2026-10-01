/**
 * Preis und Einwilligungstext der gedruckten Urkunde — EINE Stelle.
 *
 * Vorher stand „9,99 € + 4,99 € Porto" fuenfmal in der Bestellseite und
 * einmal als Knopfbeschriftung auf /diplome. Beim Wechsel auf einen
 * Gesamtpreis war genau das die Fehlerquelle: sechs Stellen, eine vergessen.
 *
 * Kalkulation (Stand 10.09.2026, Gelato-API abgefragt):
 *   Druck A4, 250 g/m² seidenmatt   3,51 €
 *   Versand UPS Standard (getrackt) 8,70 €
 *   ------------------------------------
 *   Selbstkosten                   12,21 €
 * Bei 17,99 € bleiben 5,78 € fuer Zahlungsgebuehren, Fehldrucke und Aufwand.
 * Keine Umsatzsteuer: Kleinunternehmerregelung nach § 19 UStG.
 *
 * Reine Daten, keine Server-Abhaengigkeit — auch aus Client-Komponenten
 * importierbar.
 */

export const URKUNDE_PREIS_CENTS = 1799;

export function urkundePreisText(): string {
  return `${(URKUNDE_PREIS_CENTS / 100).toFixed(2).replace('.', ',')} €`;
}

/** Preis mit dem Zusatz, der ueberall danebenstehen soll. */
export function urkundePreisMitVersand(): string {
  return `${urkundePreisText()} (Versand inklusive)`;
}

export const URKUNDE_CONSENT_TEXT =
  'Ich bin einverstanden, dass meine Angaben zur Bearbeitung dieser Bestellung ' +
  'gespeichert und für Druck und Versand an unseren Druckdienstleister Gelato ' +
  'übermittelt werden.';

/**
 * Widerrufshinweis fuer die Urkunde (§ 312g Abs. 2 Nr. 1 BGB): Sie wird mit dem
 * Namen des Bestellers bzw. Beschenkten angefertigt, also nach Kundenspezifikation.
 */
export const URKUNDE_WIDERRUF_HINWEIS =
  'Die Urkunde wird nach deinen Angaben individuell angefertigt (Name, Level). ' +
  'Für solche Waren besteht gemäß § 312g Abs. 2 Nr. 1 BGB kein Widerrufsrecht.';

/**
 * Länder, in die bestellt werden kann (ISO 3166-1 alpha-2).
 *
 * EINE Liste für beide Seiten: Das Auswahlfeld auf /diplome/urkunde rendert
 * sie, und das Zod-Schema in /api/urkunde/bestellen prüft gegen
 * URKUNDE_LAND_CODES darunter. Bis 11.09.2026 stand im Route-Handler eine
 * zweite, handgepflegte Kopie derselben zwölf Codes — inhaltsgleich, aber
 * ohne Kopplung: Ein hier ergänztes Land wäre im Formular wählbar gewesen
 * und hätte serverseitig einen unverständlichen 400er erzeugt.
 *
 * Bewusst ohne `: readonly { code: string; name: string }[]` — die
 * Annotation hätte die Literaltypen verbreitert, und dann wäre aus dem
 * Zod-Enum unten wieder ein beliebiges `string` geworden.
 */
export const URKUNDE_LAENDER = [
  { code: 'DE', name: 'Deutschland' },
  { code: 'AT', name: 'Österreich' },
  { code: 'CH', name: 'Schweiz' },
  { code: 'LU', name: 'Luxemburg' },
  { code: 'BE', name: 'Belgien' },
  { code: 'NL', name: 'Niederlande' },
  { code: 'DK', name: 'Dänemark' },
  { code: 'FR', name: 'Frankreich' },
  { code: 'IT', name: 'Italien' },
  { code: 'ES', name: 'Spanien' },
  { code: 'PL', name: 'Polen' },
  { code: 'CZ', name: 'Tschechien' },
] as const;

export type UrkundeLandCode = (typeof URKUNDE_LAENDER)[number]['code'];

/** Dieselben Codes als Tupel — die Form, die z.enum() im Route-Handler braucht. */
export const URKUNDE_LAND_CODES = URKUNDE_LAENDER.map((l) => l.code) as unknown as [
  UrkundeLandCode,
  ...UrkundeLandCode[],
];
