/**
 * Datenzugriff auf die Werkzeuge-Datenbasis (Aroma-Matcher-Vorschau, Räucherholz-
 * Finder-Vorschau) des Bento-Grids auf der Startseite.
 *
 * Quelle: data/werkzeuge/steakakademie-tools.json — statisch im Repo, wie
 * data/aroma-matcher/cuts.json. Der JSON-Import ist zur Bauzeit nur grob typisiert
 * (Literal-Unions werden zu string), deshalb prueft `pruefeWerkzeugDaten` die
 * Struktur einmal beim Laden und wirft bei Abweichung — ein Tippfehler in der
 * JSON faellt so im Build auf, nicht erst beim Besucher.
 */

import raw from '../../../data/werkzeuge/steakakademie-tools.json';
import type { SteakakademieToolsDatabase } from './typen';

const DRINK_CATEGORIES = new Set(['wine', 'beer', 'cocktail', 'non-alcoholic']);
const FLAVOR_PROFILES = new Set(['mild', 'sweet', 'fruity', 'medium', 'strong', 'heavy']);
const GRILL_SYSTEMS = new Set(['smoker', 'kugelgrill', 'oberhitze', 'plancha']);
const UNITS = new Set(['chunks', 'chips', 'logs']);
const DANGER_LEVELS = new Set(['low', 'medium', 'high', 'critical']);

function fehler(pfad: string, grund: string): never {
  throw new Error(`Werkzeuge-Datenbasis ungueltig (${pfad}): ${grund}`);
}

function eindeutig(ids: string[], pfad: string): void {
  const doppelt = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (doppelt.length) fehler(pfad, `doppelte id ${doppelt.join(', ')}`);
}

/** Prueft die Datenbasis gegen die Typen in ./typen.ts und gibt sie typisiert zurueck. */
export function pruefeWerkzeugDaten(daten: unknown): SteakakademieToolsDatabase {
  const db = daten as SteakakademieToolsDatabase;
  if (!db || typeof db !== 'object') fehler('', 'kein Objekt');
  if (typeof db.version !== 'string' || !db.version) fehler('version', 'fehlt');
  if (Number.isNaN(Date.parse(db.lastUpdated))) fehler('lastUpdated', 'kein Datum');

  const cuts = db.aromaMatcher?.cuts;
  if (!Array.isArray(cuts) || cuts.length === 0) fehler('aromaMatcher.cuts', 'leer');
  if (!Number.isInteger(db.aromaMatcher.totalStudiesReferenced)) fehler('aromaMatcher.totalStudiesReferenced', 'keine ganze Zahl');
  eindeutig(cuts.map((c) => c.id), 'aromaMatcher.cuts');
  cuts.forEach((cut, i) => {
    const p = `aromaMatcher.cuts[${i}]`;
    if (!cut.id || !cut.name) fehler(p, 'id oder name fehlt');
    if (!Array.isArray(cut.keyAromas) || cut.keyAromas.length === 0) fehler(p, 'keyAromas leer');
    if (!Array.isArray(cut.recommendedWoods) || cut.recommendedWoods.length === 0) fehler(p, 'recommendedWoods leer');
    if (!Array.isArray(cut.recommendedRubs)) fehler(p, 'recommendedRubs fehlt');
    if (!Array.isArray(cut.pairings?.food) || !Array.isArray(cut.pairings?.drinks)) fehler(p, 'pairings unvollstaendig');
    cut.pairings.drinks.forEach((d, j) => {
      if (!DRINK_CATEGORIES.has(d.category)) fehler(`${p}.pairings.drinks[${j}]`, `unbekannte category ${d.category}`);
    });
  });

  const woods = db.woodFinder?.woods;
  if (!Array.isArray(woods) || woods.length === 0) fehler('woodFinder.woods', 'leer');
  eindeutig(woods.map((w) => w.id), 'woodFinder.woods');
  woods.forEach((wood, i) => {
    const p = `woodFinder.woods[${i}]`;
    if (!wood.id || !wood.name) fehler(p, 'id oder name fehlt');
    if (!FLAVOR_PROFILES.has(wood.flavorProfile)) fehler(p, `unbekanntes flavorProfile ${wood.flavorProfile}`);
    if (!DANGER_LEVELS.has(wood.safety?.dangerLevel)) fehler(p, 'safety.dangerLevel unbekannt');
    if (typeof wood.safety.isUnsuitable !== 'boolean' || !wood.safety.reason) fehler(p, 'safety unvollstaendig');
    if (!wood.safety.isUnsuitable && wood.dosages.length === 0) fehler(p, 'geeignetes Holz ohne Dosierung');
    wood.dosages.forEach((d, j) => {
      const q = `${p}.dosages[${j}]`;
      if (!GRILL_SYSTEMS.has(d.grillSystem)) fehler(q, `unbekanntes grillSystem ${d.grillSystem}`);
      if (!UNITS.has(d.unit)) fehler(q, `unbekannte unit ${d.unit}`);
      if (!(d.mildChunksCount >= 0) || !(d.strongChunksCount >= d.mildChunksCount)) fehler(q, 'Dosierung unplausibel');
    });
  });

  return db;
}

/** Die geprüfte Datenbasis — Server-Bauteile reichen sie als Prop ans Bento-Grid. */
export const STEAKAKADEMIE_TOOLS: SteakakademieToolsDatabase = pruefeWerkzeugDaten(raw);
