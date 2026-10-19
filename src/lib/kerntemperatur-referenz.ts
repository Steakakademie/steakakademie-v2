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

export interface Garstufe {
  range: [number, number];
  label: string;
}

export interface KernReferenz {
  meta: Record<string, string>;
  /** Garstufen-Skala Rind; der Schlüssel `bestaetigt` ist ein Vermerk, keine Stufe. */
  garstufen_rind: Record<string, Garstufe | boolean>;
  badges: Record<string, Badge>;
  sicherheit: Record<string, number>;
  /** Steak-Tabelle nach Teilstück (verbindlich seit 19.10.2026). */
  steak_tabelle: SteakZeile[];
}

export type SteakStufe = 'rare' | 'medium_rare' | 'medium' | 'well_done';
export const STEAK_STUFEN: SteakStufe[] = ['rare', 'medium_rare', 'medium', 'well_done'];

export interface SteakZeile {
  cut: string;
  tier: string;
  rare?: [number, number];
  medium_rare?: [number, number];
  medium?: [number, number];
  well_done?: [number, number];
  /** Badge mit Pflichthinweis, wenn Werte unter dem Sicherheitsminimum liegen. */
  badge?: string;
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
  return bereichText(badge(key).range);
}

/** „44–47 °C", „60 °C" oder — bei offener Obergrenze (99) — „ab 60 °C". */
export function bereichText([von, bis]: [number, number]): string {
  if (bis >= 99) return `ab ${von} °C`;
  return von === bis ? `${von} °C` : `${von}–${bis} °C`;
}

export function mindestwert(klasse: string): number {
  const m = kernReferenz().sicherheit[klasse];
  if (typeof m !== 'number') throw new Error(`Sicherheitswert „${klasse}" fehlt in data/kerntemperatur-referenz.yaml`);
  return m;
}

/** Steak-Tabelle nach Teilstück, in der Reihenfolge der Referenz. */
export function steakTabelle(): SteakZeile[] {
  const t = kernReferenz().steak_tabelle;
  if (!Array.isArray(t) || t.length === 0) throw new Error('steak_tabelle fehlt in data/kerntemperatur-referenz.yaml');
  return t;
}

/** „44–47 °C" bzw. „60 °C" für eine Zelle der Steak-Tabelle, „—" wenn leer. */
export function steakZelle(r?: [number, number]): string {
  if (!r) return '—';
  return bereichText(r);
}

/** Garstufen-Skala Rind (rare … well_done) in der Reihenfolge der Referenz. */
export function garstufenRind(): Record<string, Garstufe> {
  const roh = kernReferenz().garstufen_rind;
  if (!roh) throw new Error('garstufen_rind fehlt in data/kerntemperatur-referenz.yaml');
  const stufen: Record<string, Garstufe> = {};
  for (const [key, wert] of Object.entries(roh)) {
    if (typeof wert === 'object' && wert !== null && Array.isArray(wert.range)) stufen[key] = wert;
  }
  return stufen;
}
