// ═══════════════════════════════════════════════════════════════════════════
// Lader für data/angebote.yaml — die eine Liste der eigenen Angebote.
// Nur serverseitig (liest von der Platte). Die Form wird beim Laden geprüft:
// ein Tippfehler im Register bricht den Build, statt still einen Hinweis zu
// verlieren. Auswahl-Logik: ./auswahl.ts.
//
// Dynamische Routen, die das Register zur Laufzeit lesen, brauchen einen Eintrag
// in next.config.mjs → outputFileTracingIncludes (wie die Kerntemperatur-
// Referenz). Rezept, Glossar und Temperatur-Guide werden statisch gebaut.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { hinweisImText, regal } from './auswahl';
import { RegisterSchema, type Angebot, type Hinweis, type Seitenkontext } from './typen';

let cache: Angebot[] | null = null;

export function angebote(): Angebot[] {
  if (!cache) {
    const raw = readFileSync(join(process.cwd(), 'data', 'angebote.yaml'), 'utf8');
    const parsed = RegisterSchema.safeParse(yaml.load(raw));
    if (!parsed.success) {
      const erste = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ');
      throw new Error(`data/angebote.yaml ist fehlerhaft — ${erste}`);
    }
    cache = parsed.data.angebote;
  }
  return cache;
}

export function angebot(id: string): Angebot {
  const a = angebote().find((x) => x.id === id);
  if (!a) throw new Error(`Angebot „${id}" fehlt in data/angebote.yaml`);
  return a;
}

/** Hinweis im Text und Regal für eine Seite — zusammen, damit nichts doppelt steht. */
export function hinweiseFuer(kontext: Seitenkontext): { imText: Hinweis | null; regal: Hinweis[] } {
  const liste = angebote();
  const imText = hinweisImText(liste, kontext);
  return { imText, regal: regal(liste, kontext, { ohne: imText?.id }) };
}
