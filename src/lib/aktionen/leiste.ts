/**
 * Saison-Leiste und Saison-Chip (Uwe, 11.10.2026: „Trotzdem muss die Steakakademie auch
 * Verkaufen" — Laufleiste oben und ein Chip im Kopfbereich, beides nur im Saisonfenster).
 *
 * Reine Logik ohne React, damit Tests sie direkt prüfen können. Einträge kommen aus
 * src/lib/aktionen/nav.ts (Aktionsseiten) plus dem Gutschein, wenn er kaufbar ist.
 */
import { AKTIONEN_NAV, aktiveAktionenNav, type AktionNav } from './nav';
import { mitVorschau } from './vorschau';

export interface LeistenEintrag {
  key: string;
  symbol: string;
  text: string;
  href: string;
}

/**
 * Einträge der Laufleiste. Leer = die Leiste zeigt den Spickzettel wie bisher.
 * @param vorschau   Vorschau-Schalter an: alle Aktionsseiten, Links mit ?vorschau=1
 * @param gutschein  Gutschein-Saison und mindestens ein Gutschein kaufbar
 */
export function leistenEintraege(
  { jetzt = new Date(), vorschau = false, gutschein = false }: { jetzt?: Date; vorschau?: boolean; gutschein?: boolean } = {},
  liste: readonly AktionNav[] = AKTIONEN_NAV,
): LeistenEintrag[] {
  const aktionen = vorschau ? [...liste] : aktiveAktionenNav(jetzt, liste);
  const eintraege: LeistenEintrag[] = aktionen.map((a) => ({
    key: a.slug,
    symbol: a.symbol,
    text: a.titel,
    href: vorschau ? mitVorschau(a.url) : a.url,
  }));
  if (eintraege.length > 0 && gutschein) {
    eintraege.push({ key: 'gutschein', symbol: '🎟️', text: 'Gutscheine der Steakakademie', href: '/gutschein' });
  }
  return eintraege;
}

/** Der Chip im Kopfbereich zeigt auf die erste laufende Aktion — oder nichts. */
export function chipEintrag(opts: { jetzt?: Date; vorschau?: boolean } = {}, liste: readonly AktionNav[] = AKTIONEN_NAV): LeistenEintrag | null {
  return leistenEintraege({ ...opts, gutschein: false }, liste)[0] ?? null;
}
