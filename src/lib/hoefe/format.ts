/** Reine Helfer fuer den Hofladen-Radar — ohne I/O, ohne 'use client' (Regel: geteilte Logik in src/lib). */
import { DACH_GRENZEN } from './grenzen';

export const FLEISCHART_LABEL: Record<string, string> = {
  rind: 'Rind',
  schwein: 'Schwein',
  lamm: 'Lamm',
  gefluegel: 'Geflügel',
  wild: 'Wild',
  wurst: 'Wurst & Schinken',
};

export function fleischartenLabel(arten: string[]): string[] {
  return arten.map((a) => FLEISCHART_LABEL[a] ?? a);
}

export function entfernungLabel(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

export function adresseZeile(h: { strasse: string | null; plz: string | null; ort: string | null }): string {
  const ortsteil = [h.plz, h.ort].filter(Boolean).join(' ');
  return [h.strasse, ortsteil].filter(Boolean).join(', ');
}

/** Status-Text fuer das Fleisch-Flag — ehrlich, nie behauptend. */
export function fleischStatus(v: boolean | null): { text: string; belegt: boolean } {
  if (v === true) return { text: 'Fleisch belegt', belegt: true };
  if (v === false) return { text: 'Kein Fleisch', belegt: false };
  return { text: 'Angebot nicht bestätigt', belegt: false };
}

/** Sichere Zahl aus einem Query-Parameter, sonst Fallback. */
export function zahlAusParam(v: string | null, fallback: number, min: number, max: number): number {
  const n = v == null ? NaN : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Breite oder Laenge aus einem Query-Parameter, auf den DACH-Rahmen geklemmt.
 * Fehlt der Parameter oder ist er keine Zahl: NaN — die Route faellt dann auf
 * die Ortssuche zurueck. Die Grenzen kommen aus ./grenzen.ts (03.10.2026); vorher
 * standen 47–56 / 5–16 hart in der Route, und ein Standort in Wien (16,37° O) oder
 * Genf (46,2° N) wurde still an den Rand der alten Deutschland-Box verschoben.
 */
export function koordinateAusParam(v: string | null, achse: 'lat' | 'lng'): number {
  return achse === 'lat'
    ? zahlAusParam(v, NaN, DACH_GRENZEN.latMin, DACH_GRENZEN.latMax)
    : zahlAusParam(v, NaN, DACH_GRENZEN.lngMin, DACH_GRENZEN.lngMax);
}

/** Nur http(s)-Links, Rest wird nicht verlinkt (OSM-Tags sind Freitext). */
export function sichereUrl(u: string | null): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function hostAusUrl(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
}
