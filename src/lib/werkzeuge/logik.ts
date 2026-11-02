/**
 * Reine Logik des Werkzeuge-Bento-Grids (Startseite) — bewusst OHNE 'use client',
 * damit Server-Bauteile und Tests sie direkt nutzen koennen (CLAUDE.md § A:
 * gemeinsam genutzte Logik nie in ein Client-Modul legen).
 */

import type { CutAromaProfile, WoodDosage, WoodProfile } from './typen';

export type Intensitaetsstufe = 'Mild' | 'Ausgewogen' | 'Kräftig';

/** Naechster Cut in der Reihenfolge der Datenbasis; nach dem letzten wieder der erste. */
export function naechsterCut(cuts: readonly CutAromaProfile[], aktuelleId: string): CutAromaProfile {
  if (cuts.length === 0) throw new Error('Keine Cuts in der Datenbasis.');
  const index = cuts.findIndex((c) => c.id === aktuelleId);
  return cuts[(index + 1) % cuts.length];
}

/** Regler 0–100 → sprachliche Stufe (Schwellen wie im Entwurf: 40 / 75). */
export function intensitaetsStufe(wert: number): Intensitaetsstufe {
  if (wert < 40) return 'Mild';
  if (wert < 75) return 'Ausgewogen';
  return 'Kräftig';
}

/**
 * Dosierung fuer die Regler-Stellung: linear zwischen der milden und der kraeftigen
 * Angabe des Holzes interpoliert, auf ganze Stuecke gerundet. Ohne Dosierungsangabe
 * (z. B. ungeeignetes Holz) gibt es keine Empfehlung — null, nie ein erfundener Wert.
 */
export function dosierungFuer(
  wood: WoodProfile,
  intensitaet: number,
  grillSystem: WoodDosage['grillSystem'] = 'smoker',
): { menge: number; einheit: WoodDosage['unit']; hinweis: string } | null {
  if (wood.safety.isUnsuitable) return null;
  const dosage = wood.dosages.find((d) => d.grillSystem === grillSystem) ?? wood.dosages[0];
  if (!dosage) return null;
  const anteil = Math.min(100, Math.max(0, intensitaet)) / 100;
  const menge = Math.round(dosage.mildChunksCount + (dosage.strongChunksCount - dosage.mildChunksCount) * anteil);
  return { menge, einheit: dosage.unit, hinweis: dosage.applicationNote };
}

/** Hoelzer, die laut Datenbasis nicht in den Grill gehoeren — fuer die Warnliste. */
export function ungeeigneteHoelzer(woods: readonly WoodProfile[]): WoodProfile[] {
  return woods.filter((w) => w.safety.isUnsuitable);
}
