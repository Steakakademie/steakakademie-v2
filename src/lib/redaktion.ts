/**
 * Redaktionsvorbehalt — der Filter, an dem die KI-Kennzeichnungsbefreiung haengt.
 *
 * compliance/ai-act-einstufung.md, Punkt 3 (Art. 50 Abs. 4): Die Text-Kennzeich-
 * nungspflicht entfaellt, WEIL jeder KI-Entwurf geprueft und verantwortet wird.
 * Diese Begruendung traegt nur, solange ungeprueftes Material die Seite nicht
 * erreicht. Genau das ist die Aufgabe dieser Funktion.
 *
 * Bewusst eine einzelne, zentrale Stelle statt eines `.filter()` pro Seite:
 * Das Gate scripts/check-redaktionsvorbehalt.mjs sucht statisch nach rohen
 * Collection-Zugriffen und verlangt, dass sie durch `nurVeroeffentlicht` laufen.
 * Ein handgeschriebener Inline-Filter waere fuer das Gate unsichtbar — und damit
 * genau die Zeile, die beim naechsten Refactor unbemerkt verschwindet.
 *
 * Die Bedingung ist absichtlich negativ formuliert (`!== 'draft'` statt
 * `=== 'published'`): Ein Dokument ohne `status` — der gesamte Altbestand — soll
 * sichtbar bleiben. Ein neuer, unbekannter Status-Wert wuerde bei positiver
 * Formulierung dagegen still alles ausblenden; das Gate faengt unbekannte Werte
 * ohnehin vorher ab.
 */

export interface Redaktionsstatus {
  status?: string | null;
  reviewed?: boolean | null;
  publishedAt?: string | null;
}

/**
 * True, wenn `publishedAt` gesetzt, parsebar und noch in der Zukunft ist.
 *
 * 22.09.2026: `nurVeroeffentlicht` pruefte bisher nur status/reviewed — ein
 * freigegebener Artikel mit zukuenftigem `publishedAt` (fuer den gestaffelten
 * Rollout, 2 Artikel/Woche ab 01.10.2026) ging deshalb sofort live statt am
 * vorgesehenen Datum. Gleiches Prinzip wie oben: fehlt das Feld oder ist es
 * nicht parsebar, gilt das Dokument als faellig (Altbestand ohne Datum bleibt
 * sichtbar) — der teurere Fehler waere, still gar nichts mehr zu zeigen.
 */
function nochNichtFaellig(d: Redaktionsstatus): boolean {
  if (!d.publishedAt) return false;
  const datum = new Date(d.publishedAt).getTime();
  return !Number.isNaN(datum) && datum > Date.now();
}

/** True, wenn dieses Dokument nur wegen der Entwicklungsumgebung sichtbar ist. */
export function istEntwurf<T extends Redaktionsstatus>(doc: T): boolean {
  return doc.status === 'draft' || doc.status === 'review' || doc.reviewed === false || nochNichtFaellig(doc);
}

/** Alles, was nicht Entwurf, nicht ausdruecklich ungeprueft und nicht erst kuenftig faellig ist. */
export function nurVeroeffentlicht<T extends Redaktionsstatus>(docs: readonly T[]): T[] {
  return docs.filter((d) => !istEntwurf(d));
}

/** Gegenstueck fuer Vorschau-/Redaktionsansichten. */
export function nurEntwuerfe<T extends Redaktionsstatus>(docs: readonly T[]): T[] {
  return docs.filter((d) => istEntwurf(d));
}

/**
 * Entwuerfe in der Entwicklung sichtbar machen, in Produktion nicht.
 *
 * Bewusst so herum formuliert, dass PRODUKTION der strikte Pfad ist: Wenn die
 * Umgebungserkennung je fehlschlaegt oder jemand die Bedingung umbaut, faellt das
 * Ergebnis auf nurVeroeffentlicht() zurueck — also auf „zu wenig anzeigen"
 * statt auf „ungeprueften KI-Text ausliefern". Der teurere Fehler ist hier der
 * zweite (siehe compliance/ai-act-einstufung.md Punkt 3).
 *
 * next build setzt NODE_ENV auf 'production', next dev auf 'development'.
 */
export function sichtbareArtikel<T extends Redaktionsstatus>(docs: readonly T[]): T[] {
  return process.env.NODE_ENV === 'production' ? nurVeroeffentlicht(docs) : [...docs];
}
