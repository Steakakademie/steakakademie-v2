import {
  allRecipes, allGlossars, allDiplomLektions, allMethodes,
} from 'contentlayer/generated';
import { getCutsBySpecies } from './cuts-catalog';
import { nurVeroeffentlicht } from './redaktion';

// Server-berechneter „Plattform-Puls": echte, automatisch wachsende Content-Zahlen
// + die zuletzt dazugekommenen Inhalte. Kein Cold-Start-0-Problem (Content existiert),
// wächst automatisch mit der Glossar-/Rezept-Pipeline.

export type PulsItem = { title: string; url: string; kind: string; date: string };
export type PulsData = {
  counts: { label: string; value: number }[];
  latest: PulsItem[];
};

/**
 * Zahl der Diplom-Lektionen aus dem Bestand — eine Quelle fuer jede Stelle, die
 * sie nennt. 03.10.2026: getippt stand „35 Lektionen" (Startseite, Relaunch)
 * und „sieben Lektionen" (Stufe 1) neben den hier berechneten 39 bzw. 11.
 */
export function anzahlDiplomLektionen(stufe?: number): number {
  return stufe === undefined
    ? allDiplomLektions.length
    : allDiplomLektions.filter((l) => l.stufe === stufe).length;
}

export function getPlattformPuls(): PulsData {
  // Zaehler UND "zuletzt dazugekommen" laufen ueber dieselbe gefilterte Liste:
  // Ein noch nicht freigegebener Glossar-Entwurf darf weder mitzaehlen noch als
  // Neuzugang auf der Startseite auftauchen.
  const glossar = nurVeroeffentlicht(allGlossars);

  const map = (arr: { title: string; url: string; publishedAt?: string }[], kind: string): PulsItem[] =>
    arr.map((d) => ({ title: d.title, url: d.url, kind, date: d.publishedAt ?? '' }));

  const pool: PulsItem[] = [
    ...map(allRecipes as never[], 'Rezept'),
    ...map(allDiplomLektions as never[], 'Lektion'),
    ...map(allMethodes as never[], 'Methode'),
    ...map(glossar as never[], 'Begriff'),
  ];

  const latest = pool
    .filter((x) => x.date)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 6);

  return {
    // Conversion-Regel: Zähler unter 10 wirken wie „Beta" und untergraben die
    // großen Zahlen daneben. Kategorien erscheinen automatisch wieder, sobald
    // sie zweistellig sind — kein manueller Eingriff nötig.
    counts: [
      { label: 'Rezepte', value: allRecipes.length },
      { label: 'Glossar-Begriffe', value: glossar.length },
      { label: 'Diplom-Lektionen', value: anzahlDiplomLektionen() },
      { label: 'Grilltechniken', value: allMethodes.length },
      // Cuts aus dem ATLAS-Katalog zaehlen, nicht die MDX-Artikel (das waren 3
      // und lieferte den absurden "3 Cuts"-Zaehler, Design-Audit 16.08.2026).
      // Nur Rind: Schwein ist im Atlas ausgeblendet (Bildrechte, SHOW_PORK) —
      // die Zahl muss zeigen, was der Nutzer wirklich klicken kann. Sobald
      // Schwein live geht: + getCutsBySpecies('schwein').length.
      { label: 'Cuts im Atlas', value: getCutsBySpecies('rind').length },
    ].filter((c) => c.value >= 10),
    latest,
  };
}
