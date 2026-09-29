// ═══════════════════════════════════════════════════════════════════════════
// Lader für data/kerntemperatur-referenz.yaml — die einzige Quelle für
// Kerntemperaturen (CLAUDE.md §2 Regel 2 / 8c). Nur serverseitig nutzen.
//
// Seiten ziehen ihre Werte über badge()/spanne()/mindestwert() statt sie
// hart zu kodieren. Ein fehlender Schlüssel wirft beim Build — eine Zahl kann
// so nicht still von der Referenz abweichen (Anlass 29.09.2026: Guide und
// Referenz nannten für Krustenbraten, Gans und Wildschwein verschiedene Werte).
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

export interface Badge {
  c: number;
  range: [number, number];
  label: string;
  /** Wert liegt bewusst unter dem Sicherheits-Minimum der Tierart (Entscheidung Uwe). */
  unter_sicherheit?: boolean;
  /** Pflichttext, wo unter_sicherheit gesetzt ist. */
  hinweis?: string;
}

export interface KernReferenz {
  meta: Record<string, string>;
  badges: Record<string, Badge>;
  sicherheit: Record<string, number>;
}

let cache: KernReferenz | null = null;

export function kernReferenz(): KernReferenz {
  if (!cache) {
    const raw = readFileSync(join(process.cwd(), 'data', 'kerntemperatur-referenz.yaml'), 'utf8');
    cache = yaml.load(raw) as KernReferenz;
  }
  return cache;
}

export function badge(key: string): Badge {
  const b = kernReferenz().badges[key];
  if (!b) throw new Error(`Kerntemperatur-Badge „${key}" fehlt in data/kerntemperatur-referenz.yaml`);
  return b;
}

/** „75–79 °C" bzw. „70 °C" — der Korridor eines Badges. */
export function spanne(key: string): string {
  const [von, bis] = badge(key).range;
  return von === bis ? `${von} °C` : `${von}–${bis} °C`;
}

export function mindestwert(klasse: string): number {
  const m = kernReferenz().sicherheit[klasse];
  if (typeof m !== 'number') throw new Error(`Sicherheitswert „${klasse}" fehlt in data/kerntemperatur-referenz.yaml`);
  return m;
}
