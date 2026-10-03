/**
 * Gemeinsame Konstanten des Kontaktformulars (KAN-70).
 *
 * Der Einwilligungstext steht hier und nicht zweimal: Das Formular zeigt ihn,
 * die Route speichert ihn als Nachweis nach Art. 5 Abs. 2 DSGVO. Zwei Kopien
 * wuerden frueher oder spaeter auseinanderlaufen — und dann belegt die
 * Datenbank eine Einwilligung, die so nie auf dem Bildschirm stand.
 */

export const CONSENT_TEXT =
  'Ich bin damit einverstanden, dass meine Angaben zur Beantwortung meiner Anfrage ' +
  'gespeichert und verarbeitet werden. Die Einwilligung kann jederzeit per E-Mail ' +
  'an pitmaster@steakakademie.de widerrufen werden.';

/** Zieladresse aller Kontaktnachrichten. Begruendung siehe /api/kontakt. */
export const KONTAKT_EMPFAENGER = 'pitmaster@steakakademie.de';

/**
 * Auswahlfeld des Formulars → Betreff-Präfix. Die Gmail-Filter des Postfachs
 * sortieren danach — das ist die einzige Weiche, seit alle Post an EINE Adresse
 * geht. Die Liste stand bis 03.10.2026 in der Route; hier, damit auch die
 * Mail-Links der Seiten (kontaktMailto) dieselben Präfixe tragen.
 */
export function betreffTag(subject: string): string {
  switch (subject) {
    case 'presse':      return '[Presse]';
    case 'kooperation': return '[Kooperation]';
    case 'rezept':      return '[Rezept-Idee]';
    case 'urkunde':     return '[Urkunde]';      // Bestellung gedruckte Urkunde (/diplome/urkunde)
    case 'hofladen':    return '[Hofladen]';     // Hof melden/bestaetigen (/hoefe)
    case 'baukasten':   return '[Baukasten]';    // Projekt-Anamnese (tuwasduwillst.de/projekt-anamnese)
    default:            return '[Allgemein]';   // diplom, feedback, sonstiges, leer
  }
}

/**
 * Mail-Link an das Postfach, mit demselben Betreff-Präfix wie das Formular.
 *
 * Bis 03.10.2026 standen auf den Seiten drei weitere Adressen (Diplom-Fragen,
 * allgemeiner Kontakt, Rezept-Ideen), für die es keinen Zustellnachweis gibt
 * (siehe /api/kontakt). Sie sind durch diese eine ersetzt; die Sortierung, die
 * die Adressen leisten sollten, übernimmt das Präfix. `betreff` ist ein
 * optionaler Zusatz hinter dem Präfix.
 */
export function kontaktMailto(thema = '', betreff = ''): string {
  const zeile = [betreffTag(thema), betreff.trim()].filter(Boolean).join(' ');
  return `mailto:${KONTAKT_EMPFAENGER}?subject=${encodeURIComponent(zeile)}`;
}
