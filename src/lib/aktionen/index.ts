/**
 * Aktionsseiten laden (Server, Dateizugriff) — data/aktionen/*.yaml.
 * Form und Fensterlogik: ./typen.ts. Sichtbar ist eine Aktion nur in ihrem Fenster;
 * außerhalb antwortet die Seite mit 404 (und steht nicht in der Sitemap, siehe
 * next-sitemap.config.js, das dieselbe Fensterlogik in CommonJS nachbildet).
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { AktionSchema, heuteMMTT, imFenster, type Aktion } from './typen';

const ORDNER = path.join(process.cwd(), 'data', 'aktionen');

let _cache: Aktion[] | null = null;

/** Alle Aktionen, validiert. Eine fehlerhafte Datei wirft — besser rot als eine halbe Seite. */
export function alleAktionen(): Aktion[] {
  if (_cache) return _cache;
  if (!fs.existsSync(ORDNER)) return (_cache = []);
  const aktionen = fs
    .readdirSync(ORDNER)
    .filter((f) => /\.ya?ml$/.test(f))
    .sort()
    .map((f) => {
      const roh = yaml.load(fs.readFileSync(path.join(ORDNER, f), 'utf-8'));
      const r = AktionSchema.safeParse(roh);
      if (!r.success) {
        throw new Error(`data/aktionen/${f}: ${r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      }
      if (`${r.data.slug}.yaml` !== f && `${r.data.slug}.yml` !== f) {
        throw new Error(`data/aktionen/${f}: slug „${r.data.slug}" passt nicht zum Dateinamen`);
      }
      return r.data;
    });
  return (_cache = aktionen);
}

export function aktionBySlug(slug: string): Aktion | undefined {
  return alleAktionen().find((a) => a.slug === slug);
}

export function istAktiv(aktion: Aktion, jetzt: Date = new Date()): boolean {
  return imFenster(aktion.fenster, heuteMMTT(jetzt));
}

export function aktiveAktionen(jetzt: Date = new Date()): Aktion[] {
  return alleAktionen().filter((a) => istAktiv(a, jetzt));
}
