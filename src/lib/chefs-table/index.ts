/**
 * Chefs' Table laden (Server, Dateizugriff) — data/chefs-table/*.yaml.
 * Form: ./typen.ts.
 *
 * Sichtbarkeit (Uwe, 25.10.2026: „Versteckt, bis der erste Partner zugesagt hat"):
 * Solange OEFFENTLICH false ist, tragen alle Seiten noindex, stehen nicht im Menü und
 * nicht in der Sitemap (next-sitemap.config.js) und sind nur per Link erreichbar.
 * Platzhalter-Einträge sind dann sichtbar, damit das Layout gegengelesen werden kann.
 *
 * Umschalten auf öffentlich = OEFFENTLICH auf true UND die beiden Zeilen
 * '/chefs-table' und '/chefs-table/*' aus der Sitemap-Ausschlussliste nehmen UND den
 * Menüpunkt setzen. Ab dann rendern nur noch freigegebene Porträte (istFreigegeben),
 * Platzhalter antworten mit 404 — Wächter: src/__tests__/chefs-table.test.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { PartnerSchema, istFreigegeben, type Partner } from './typen';

export const OEFFENTLICH = false as boolean;

const ORDNER = path.join(process.cwd(), 'data', 'chefs-table');

let _cache: Partner[] | null = null;

/** Alle Partner-Einträge, validiert. Eine fehlerhafte Datei wirft — besser rot als eine halbe Seite. */
export function allePartner(): Partner[] {
  if (_cache) return _cache;
  if (!fs.existsSync(ORDNER)) return (_cache = []);
  const partner = fs
    .readdirSync(ORDNER)
    .filter((f) => /\.ya?ml$/.test(f))
    .sort()
    .map((f) => {
      const roh = yaml.load(fs.readFileSync(path.join(ORDNER, f), 'utf-8'));
      const r = PartnerSchema.safeParse(roh);
      if (!r.success) {
        throw new Error(`data/chefs-table/${f}: ${r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      }
      if (`${r.data.slug}.yaml` !== f && `${r.data.slug}.yml` !== f) {
        throw new Error(`data/chefs-table/${f}: slug „${r.data.slug}" passt nicht zum Dateinamen`);
      }
      return r.data;
    });
  return (_cache = partner);
}

/** Partner, die auf der Übersicht und unter /chefs-table/<slug> erscheinen dürfen. */
export function sichtbarePartner(): Partner[] {
  return allePartner().filter((p) => (OEFFENTLICH ? istFreigegeben(p) : true));
}

export function partnerBySlug(slug: string): Partner | undefined {
  return sichtbarePartner().find((p) => p.slug === slug);
}

/** Für Tests: Cache leeren. */
export function _resetCache(): void {
  _cache = null;
}
