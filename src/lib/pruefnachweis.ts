/**
 * Prüfnachweis — die eine Quelle für jede Aussage „geprüft“ (03.10.2026).
 *
 * ANLASS: Ein Prüfdatum (`reviewedAt`) trug nur ein kleiner Teil des Bestands.
 * Der Rest lief über den Vorgabewert `reviewed: true` aus contentlayer.config.ts,
 * und die Seite sagte pauschal „geprüft“ — unter jedem Rezept, auf der
 * Autorenseite, in Meta-Beschreibungen. Ein Vorgabewert ist aber kein Nachweis;
 * er sagt nur, dass niemand das Feld gesetzt hat.
 *
 * ENTSCHEIDUNG (Uwe, 03.10.2026): Die Aussage „geprüft“ gibt es nur noch mit
 * `reviewedAt`. Der Altbestand wird in Tranchen von Hand nachgeprüft
 * (`npm run pruefstand` zeigt, was offen ist).
 *
 * Was hier NICHT geregelt wird: die Sichtbarkeit. Ob ein Dokument erscheint,
 * entscheidet weiter allein src/lib/redaktion.ts (`nurVeroeffentlicht`) über
 * `status`, `reviewed` und `publishedAt`. `reviewed` ist damit ein Schalter für
 * die Veröffentlichung, kein Beleg für eine Prüfung — dieses Modul liest es nur,
 * um bei ausdrücklichem `reviewed: false` nie eine Prüfung zu behaupten.
 *
 * `reviewedAt` setzt ausschließlich Uwe von Hand (CLAUDE.md §2 Regel 4). Kein
 * Agent, kein Skript und keine Vorgabe trägt es ein — sonst wäre der Nachweis
 * wieder eine Annahme.
 *
 * Kein `'use client'`: gemeinsam genutzte Logik gehört nie in ein Client-Modul
 * (CLAUDE.md Abschnitt A, 06.09.2026) — ein Server-Bauteil bekäme von dort
 * keine Funktion, sondern einen Client-Verweis.
 */

export interface Pruefbar {
  /** Frontmatter `reviewedAt` — Contentlayer liefert es als ISO-Zeitstempel. */
  reviewedAt?: string | null;
  /** Frontmatter `reviewed` — nur ein ausdrückliches `false` zählt hier. */
  reviewed?: boolean | null;
}

/** Der Mensch, der die Inhalte fachlich verantwortet (CLAUDE.md §2 Regel 3). */
export const FACHLICH_VERANTWORTLICH = 'Uwe Yendell';

/** JJJJ-MM-TT, wahlweise mit Uhrzeit dahinter. Alles andere ist kein Prüfdatum. */
const ISO_DATUM = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/;

/** Der heutige Kalendertag in Deutschland als JJJJ-MM-TT. */
function heuteInDeutschland(jetzt: Date): string {
  const teile = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(jetzt);
  const teil = (typ: string) => teile.find((t) => t.type === typ)?.value ?? '';
  return `${teil('year')}-${teil('month')}-${teil('day')}`;
}

/**
 * Das Prüfdatum eines Dokuments — oder null, wenn es keines gibt.
 *
 * Streng, weil an diesem Wert eine öffentliche Aussage hängt:
 *   - nur ISO-Schreibweise. `new Date('03.09.2026')` liest den 9. März — ein von
 *     Hand deutsch getipptes Datum würde also ein falsches Prüfdatum anzeigen.
 *   - der Kalendertag muss existieren (`2026-02-31` rollt sonst still in den März).
 *   - nicht in der Zukunft: eine Prüfung, die noch nicht stattgefunden hat, ist
 *     keine. Verglichen wird der Kalendertag in Deutschland, nicht die Uhrzeit —
 *     ein heute gesetztes Datum gilt ab Mitternacht hiesiger Zeit.
 *   - `reviewed: false` schlägt jedes Datum.
 *
 * Zurück kommt der Kalendertag um 00:00 UTC; die Uhrzeit trägt keine Aussage.
 */
export function pruefdatum(doc?: Pruefbar | null, jetzt: Date = new Date()): Date | null {
  if (!doc || doc.reviewed === false) return null;
  if (typeof doc.reviewedAt !== 'string') return null;
  const treffer = ISO_DATUM.exec(doc.reviewedAt.trim());
  if (!treffer) return null;
  const [, jahr, monat, tag] = treffer;
  const kalendertag = new Date(Date.UTC(Number(jahr), Number(monat) - 1, Number(tag)));
  if (
    kalendertag.getUTCFullYear() !== Number(jahr) ||
    kalendertag.getUTCMonth() !== Number(monat) - 1 ||
    kalendertag.getUTCDate() !== Number(tag)
  ) {
    return null;
  }
  if (`${jahr}-${monat}-${tag}` > heuteInDeutschland(jetzt)) return null;
  return kalendertag;
}

/** True nur mit gültigem `reviewedAt` — der Vorgabewert `reviewed: true` genügt nicht. */
export function hatPruefnachweis(doc?: Pruefbar | null, jetzt?: Date): boolean {
  return pruefdatum(doc, jetzt) !== null;
}

/** Prüfdatum als JJJJ-MM-TT (für `<time dateTime>` und JSON-LD) — oder null. */
export function pruefdatumIso(doc?: Pruefbar | null, jetzt?: Date): string | null {
  const datum = pruefdatum(doc, jetzt);
  return datum ? datum.toISOString().slice(0, 10) : null;
}

/** Prüfdatum als TT.MM.JJJJ (für den sichtbaren Text) — oder null. */
export function pruefdatumText(doc?: Pruefbar | null, jetzt?: Date): string | null {
  const iso = pruefdatumIso(doc, jetzt);
  if (!iso) return null;
  const [jahr, monat, tag] = iso.split('-');
  return `${tag}.${monat}.${jahr}`;
}

export interface HinweisOptionen {
  /** „von Gründer Uwe Yendell“ statt „von Uwe Yendell“ — wie es die Stelle bisher schrieb. */
  gruender?: boolean;
  /** Nur für Tests: der Zeitpunkt, gegen den „nicht in der Zukunft“ geprüft wird. */
  jetzt?: Date;
}

function verantwortlicher(o: HinweisOptionen): string {
  return `${o.gruender ? 'Gründer ' : ''}${FACHLICH_VERANTWORTLICH}`;
}

/**
 * Die neutrale Verantwortungs-Angabe. Gilt für jeden Inhalt und behauptet keine
 * Prüfung — das ist der Wortlaut für pauschale Sätze (Übersichten, Meta-
 * Beschreibungen) und für Dokumente ohne Prüfdatum.
 */
export function verantwortungsangabe(o: HinweisOptionen = {}): string {
  return `fachlich verantwortet von ${verantwortlicher(o)}`;
}

/**
 * Die Prüf-Aussage mit Datum — oder null, wenn das Dokument keinen Nachweis
 * trägt. Es gibt bewusst keine Variante ohne Datum.
 */
export function pruefangabe(doc?: Pruefbar | null, o: HinweisOptionen = {}): string | null {
  const datum = pruefdatumText(doc, o.jetzt);
  return datum ? `fachlich geprüft am ${datum} von ${verantwortlicher(o)}` : null;
}

/**
 * Der Hinweistext für eine Stelle, die bisher pauschal „geprüft“ sagte.
 * Mit Nachweis: Prüf-Aussage mit Datum. Ohne: die Verantwortungs-Angabe.
 * In beiden Fällen bleibt genannt, wer fachlich verantwortet.
 */
export function pruefhinweis(doc?: Pruefbar | null, o: HinweisOptionen = {}): string {
  const datum = pruefdatumText(doc, o.jetzt);
  return datum
    ? `fachlich geprüft am ${datum} und verantwortet von ${verantwortlicher(o)}`
    : verantwortungsangabe(o);
}

/**
 * Ganzer Satz für die Stelle unter einem einzelnen Dokument — nur mit Nachweis.
 * `subjekt` benennt das Dokument („Dieses Rezept“, „Dieser Beitrag“).
 */
export function pruefsatz(
  doc?: Pruefbar | null,
  subjekt = 'Dieser Beitrag',
  o: HinweisOptionen = {},
): string | null {
  const datum = pruefdatumText(doc, o.jetzt);
  return datum ? `${subjekt} wurde am ${datum} von ${verantwortlicher(o)} fachlich geprüft.` : null;
}

/** Erster Buchstabe groß — für Hinweise, die einen Satz eröffnen. */
export function alsSatzanfang(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
