/**
 * Geschenke-Finder (Uwe, 11.10.2026: „bau den Geschenke-Finder") — reine Logik, client-sicher.
 *
 * Drei Fragen, ein Ergebnis: Für wen? Wie gut grillt die Person? Was soll es sein? Daraus
 * ein Setup der Aktionsseite „Geschenke" (data/aktionen/geschenke.yaml, Feld `stufe` je
 * Setup) und ein passender Gutschein. Bewusst KEINE Budget-Frage: Preise zeigen wir erst
 * mit einem Händler-Feed (Konzept, Abschnitt 5); eine Budget-Einordnung nach den
 * Registry-Preisen vom Mai wäre eine Preisaussage, die wir nicht halten können.
 *
 * Das Ergebnis ist als Link teilbar: /geschenke-finder?fuer=papa&koennen=fortgeschritten&art=beides
 */

export const FUER = [
  { key: 'papa', label: 'Papa', titel: 'Für Papa' },
  { key: 'mama', label: 'Mama', titel: 'Für Mama' },
  { key: 'partner', label: 'Partner/in', titel: 'Für deine bessere Hälfte' },
  { key: 'freund', label: 'Freund/in', titel: 'Für einen Grill-Freund' },
  { key: 'kollege', label: 'Kolleg/in', titel: 'Für die Kollegin oder den Kollegen' },
  { key: 'ich', label: 'Mich selbst', titel: 'Für dich selbst' },
] as const;
export type FuerKey = (typeof FUER)[number]['key'];

export const KOENNEN = [
  { key: 'einsteiger', label: 'Grillt seit kurzem', hinweis: 'Würstchen und Steak nach Gefühl, noch kein Thermometer.' },
  { key: 'fortgeschritten', label: 'Grillt richtig gut', hinweis: 'Kennt Reverse Sear und Ruhezeit, will die letzten Grad.' },
  { key: 'alles', label: 'Hat schon alles', hinweis: 'Voller Schrank — es fehlt nur noch eine neue Technik.' },
] as const;
export type KoennenKey = (typeof KOENNEN)[number]['key'];

export const ART = [
  { key: 'auspacken', label: 'Etwas zum Auspacken', hinweis: 'Ein Teil fürs Regal oder den Grill.' },
  { key: 'lernen', label: 'Etwas zum Lernen', hinweis: 'Ein Gutschein der Steakakademie — mit Nachricht und Motiv.' },
  { key: 'beides', label: 'Beides', hinweis: 'Ein Teil plus Gutschein.' },
] as const;
export type ArtKey = (typeof ART)[number]['key'];

export interface Antworten {
  fuer: FuerKey;
  koennen: KoennenKey;
  art: ArtKey;
}

/** Eine Produktzeile, vom Server vorbereitet (Link und Kennzeichnung aus produkt-anzeige.ts). */
export interface ProduktZeile {
  id: string;
  name: string;
  brand: string;
  warum: string;
  href: string;
  rel: string;
  partner: boolean;
  klickKlassen: string;
}

export interface FinderSetup {
  titel: string;
  fuer: string;
  stufe: KoennenKey;
  produkte: ProduktZeile[];
}

export interface GutscheinTipp {
  key: 'steak-beichte' | 'mein-protokoll' | 'steak-beichte-5er';
  titel: string;
  warum: string;
}

const GUTSCHEIN: Record<KoennenKey, GutscheinTipp> = {
  einsteiger: {
    key: 'steak-beichte',
    titel: 'Steak-Beichte',
    warum: 'Das nächste misslungene Steak wird zur Diagnose: Was war es — Hitze, Zeit, Ruhe? Der Einstieg ins Verstehen.',
  },
  fortgeschritten: {
    key: 'mein-protokoll',
    titel: 'Mein Protokoll',
    warum: 'Acht Wochen gezielt besser grillen, mit Korrektur — für alle, die nicht mehr raten wollen.',
  },
  alles: {
    key: 'steak-beichte-5er',
    titel: 'Steak-Beichte 5er',
    warum: 'Wer oft am Grill steht, hat öfter eine Frage. Fünf Diagnosen für die Fälle, in denen es trotzdem schiefging.',
  },
};

export interface Ergebnis {
  ueberschrift: string;
  setup: FinderSetup | null;
  produkte: ProduktZeile[];
  gutschein: GutscheinTipp | null;
}

/** Höchstens so viele Teile zeigt das Ergebnis — mehr ist Katalog, nicht Empfehlung. */
export const MAX_PRODUKTE = 3;

export function ergebnis(a: Antworten, setups: FinderSetup[]): Ergebnis {
  const fuer = FUER.find((f) => f.key === a.fuer) ?? FUER[0];
  const koennen = KOENNEN.find((k) => k.key === a.koennen) ?? KOENNEN[0];
  const setup = a.art === 'lernen' ? null : (setups.find((s) => s.stufe === koennen.key) ?? null);
  return {
    ueberschrift: `${fuer.titel}: ${koennen.label.toLowerCase()}`,
    setup,
    produkte: setup ? setup.produkte.slice(0, MAX_PRODUKTE) : [],
    gutschein: a.art === 'auspacken' ? null : GUTSCHEIN[koennen.key],
  };
}

/** Antworten aus einem Suchstring — nur vollständig und gültig, sonst null. */
export function parseAntworten(search: string): Antworten | null {
  const p = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const fuer = p.get('fuer');
  const koennen = p.get('koennen');
  const art = p.get('art');
  if (!FUER.some((f) => f.key === fuer)) return null;
  if (!KOENNEN.some((k) => k.key === koennen)) return null;
  if (!ART.some((x) => x.key === art)) return null;
  return { fuer: fuer as FuerKey, koennen: koennen as KoennenKey, art: art as ArtKey };
}

export function serializeAntworten(a: Antworten): string {
  return `?${new URLSearchParams({ fuer: a.fuer, koennen: a.koennen, art: a.art }).toString()}`;
}
