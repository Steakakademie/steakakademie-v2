/**
 * Social-Entwuerfe — welche Rezepte sind diese Woche dran? (03.10.2026)
 *
 * Anlass: scripts/social-posts.mjs nahm die ersten `--limit` Dateien aus readdir.
 * Das Ergebnis war jede Woche dasselbe: adana-kebab, alabama-white-sauce,
 * asado-de-tira, aussie-lamb-leg-butterflied, australische-riesengarnelen-barbie —
 * belegt fuer die Laeufe vom 30.08., 13.09., 20.09. und 27.09.2026. Fuenfzehn gruene
 * Laeufe, ein einziger Inhalt.
 *
 * Die Auswahl ist jetzt eine reine Funktion des Datums — kein Zustand, keine Datei,
 * die jemand pflegen muss, und derselbe Tag liefert immer dieselbe Auswahl:
 *
 *   1. FRISCH: was in den letzten 7 Tagen erschienen ist, neueste zuerst — hoechstens
 *      die Haelfte der Plaetze (aufgerundet). Neue Rezepte kommen so sofort dran.
 *   2. BESTAND: die uebrigen Plaetze fuellt ein Fenster, das jede Woche um `limit`
 *      weiterwandert — durch den aelteren Bestand, aeltestes zuerst, und am Ende
 *      wieder von vorn.
 *
 * Warum der Bestand AUFSTEIGEND sortiert ist: neue Rezepte haengen sich hinten an,
 * die Plaetze davor bleiben, wo sie sind. Absteigend sortiert wuerde jedes neue
 * Rezept alle anderen um eins verschieben — das Fenster traefe dann Woche fuer Woche
 * teils dieselben Rezepte. Aus demselben Grund zaehlt das Fenster ab einer festen
 * Ankerwoche und nicht ab 1970: `woche * limit mod anzahl` springt, sobald sich die
 * Anzahl aendert.
 *
 * Kein I/O — getestet in scripts/lib/social-auswahl.test.mjs.
 */

const TAG = 86_400_000;
const FRISCH_TAGE = 7;

const utcTag = (datum) => Math.floor(Date.UTC(datum.getUTCFullYear(), datum.getUTCMonth(), datum.getUTCDate()) / TAG);

/**
 * Fortlaufende Wochennummer. Wochen beginnen montags wie in ISO 8601, gezaehlt wird
 * aber ohne Neustart zum Jahreswechsel — die ISO-Kalenderwoche springt von 52/53
 * auf 1, und das Fenster spraenge mit.
 */
export function wochenIndex (datum) {
  // Der 01.01.1970 war ein Donnerstag; der Montag derselben Woche liegt 3 Tage davor.
  return Math.floor((utcTag(datum) + 3) / 7);
}

/** ISO-Kalenderwoche fuer die Beschriftung („KW 40/2026"). */
export function isoWoche (datum) {
  const d = new Date(Date.UTC(datum.getUTCFullYear(), datum.getUTCMonth(), datum.getUTCDate()));
  const wochentag = d.getUTCDay() || 7;            // Mo = 1 … So = 7
  d.setUTCDate(d.getUTCDate() + 4 - wochentag);    // auf den Donnerstag dieser Woche
  const jahr = d.getUTCFullYear();
  const woche = Math.ceil(((d - Date.UTC(jahr, 0, 1)) / TAG + 1) / 7);
  return { jahr, woche };
}

// Montag, 28.09.2026 — die Woche des ersten Laufs mit dieser Auswahl (So 04.10.2026).
export const ANKER_WOCHE = wochenIndex(new Date(Date.UTC(2026, 8, 28)));

/**
 * Gleiche Regel wie nurVeroeffentlicht() in src/lib/redaktion.ts: kein Entwurf, nicht
 * ausdruecklich ungeprueft, nicht erst kuenftig faellig. Ein Rezept ohne `status`
 * (der Altbestand) gilt als veroeffentlicht.
 */
export function istVeroeffentlicht (r, datum) {
  if (r.status === 'draft' || r.status === 'review' || r.reviewed === false) return false;
  if (r.publishedAt) {
    const t = new Date(r.publishedAt).getTime();
    if (!Number.isNaN(t) && t > datum.getTime()) return false;
  }
  return true;
}

const nachDatum = (a, b) => String(a.publishedAt ?? '').localeCompare(String(b.publishedAt ?? '')) || a.slug.localeCompare(b.slug);

/**
 * @param {{slug: string, publishedAt?: string, status?: string, reviewed?: boolean}[]} rezepte
 * @param {{limit?: number, datum?: Date}} [o]
 * @returns {{auswahl: object[], frisch: string[], bestand: string[], woche: {jahr: number, woche: number}, verfuegbar: number}}
 */
export function waehleRezepte (rezepte, { limit = 5, datum = new Date() } = {}) {
  const woche = isoWoche(datum);
  const alle = rezepte.filter((r) => istVeroeffentlicht(r, datum)).sort(nachDatum);
  if (limit <= 0 || alle.length === 0) return { auswahl: [], frisch: [], bestand: [], woche, verfuegbar: alle.length };

  const grenze = datum.getTime() - FRISCH_TAGE * TAG;
  const istFrisch = (r) => {
    const t = r.publishedAt ? new Date(r.publishedAt).getTime() : NaN;
    return !Number.isNaN(t) && t > grenze;
  };

  const neue = alle.filter(istFrisch).reverse();
  const archiv = alle.filter((r) => !istFrisch(r));
  // Die Haelfte der Plaetze fuer Neues — mehr nur, wenn der Bestand sie nicht fuellt.
  const frisch = neue.slice(0, Math.max(Math.ceil(limit / 2), limit - archiv.length));

  const plaetze = Math.min(limit - frisch.length, archiv.length);
  const n = archiv.length;
  const start = n ? ((((wochenIndex(datum) - ANKER_WOCHE) * limit) % n) + n) % n : 0;
  const bestand = Array.from({ length: plaetze }, (_, i) => archiv[(start + i) % n]);

  return {
    auswahl: [...frisch, ...bestand],
    frisch: frisch.map((r) => r.slug),
    bestand: bestand.map((r) => r.slug),
    woche,
    verfuegbar: alle.length,
  };
}
