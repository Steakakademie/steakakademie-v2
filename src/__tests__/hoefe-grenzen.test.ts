/**
 * Waechter fuer den Rahmen des Hofladen-Radars (03.10.2026).
 *
 * Anlass: Die Grenzen standen an vier Stellen mit zwei verschiedenen Werten — der
 * Import liess Hoefe bis 17,5° Ost durch, die Tabelle nur bis 16°. Zwei Wochenlaeufe
 * scheiterten daran komplett. Dieser Test haelt Code und Migration zusammen.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DACH_GRENZEN, imDachRaum } from '@/lib/hoefe/grenzen';
import { koordinateAusParam } from '@/lib/hoefe/format';
// .mjs ohne eigene Typen — tsc erlaubt den Import (allowJs), vitest laedt es direkt
import { DACH_GRENZEN as GRENZEN_IMPORT, imDachRaum as imDachRaumImport } from '../../scripts/lib/hoefe-osm.mjs';

const ROOT = join(__dirname, '..', '..');
const lies = (pfad: string) => readFileSync(join(ROOT, pfad), 'utf-8');

// Aeusserste Punkte der drei Laender — der Rahmen muss sie alle enthalten.
const EXTREMPUNKTE: [string, number, number][] = [
  ['List auf Sylt (DE, Norden)', 55.06, 8.42],
  ['Isenbruch (DE, Westen)', 51.05, 5.87],
  ['Neisseaue (DE, Osten)', 51.27, 15.04],
  ['Chiasso (CH, Sueden)', 45.82, 9.03],
  ['Genf (CH, Westen)', 46.2, 6.14],
  ['Deutsch Jahrndorf (AT, Osten)', 48.01, 17.16],
  ['Wien (AT)', 48.21, 16.37],
  ['Eisenkappel (AT, Sueden)', 46.37, 14.56],
];

describe('hoefe/grenzen', () => {
  it('umfasst Deutschland, Oesterreich und die Schweiz ganz', () => {
    for (const [ort, lat, lng] of EXTREMPUNKTE) {
      expect(imDachRaum(lat, lng), ort).toBe(true);
    }
  });

  it('laesst Nachbarn ausserhalb draussen', () => {
    expect(imDachRaum(47.5, 19.04), 'Budapest').toBe(false);
    expect(imDachRaum(48.86, 2.35), 'Paris').toBe(false);
    expect(imDachRaum(41.9, 12.5), 'Rom').toBe(false);
    expect(imDachRaum(59.33, 18.07), 'Stockholm').toBe(false);
  });

  it('Import (scripts/lib) und Suche (src/lib) rechnen mit denselben Zahlen', () => {
    expect(GRENZEN_IMPORT).toEqual(DACH_GRENZEN);
    for (const [, lat, lng] of EXTREMPUNKTE) expect(imDachRaumImport(lat, lng)).toBe(imDachRaum(lat, lng));
    expect(imDachRaumImport(47.5, 19.04)).toBe(false);
  });

  it('die Migration setzt genau diese Grenzen', () => {
    const sql = lies('supabase/migrations/20261003074310_hoefe_grenzen_dach.sql');
    const lat = /ADD CONSTRAINT hoefe_lat_check CHECK \(lat BETWEEN ([\d.]+) AND ([\d.]+)\)/.exec(sql);
    const lng = /ADD CONSTRAINT hoefe_lng_check CHECK \(lng BETWEEN ([\d.]+) AND ([\d.]+)\)/.exec(sql);
    expect(lat?.slice(1, 3).map(Number)).toEqual([DACH_GRENZEN.latMin, DACH_GRENZEN.latMax]);
    expect(lng?.slice(1, 3).map(Number)).toEqual([DACH_GRENZEN.lngMin, DACH_GRENZEN.lngMax]);
    // Idempotent: die alten Constraints muessen vor dem ADD fallen.
    expect(sql).toContain('DROP CONSTRAINT IF EXISTS hoefe_lat_check');
    expect(sql).toContain('DROP CONSTRAINT IF EXISTS hoefe_lng_check');
  });

  it('Gegenprobe: die alte Deutschland-Box (47–56 / 5–16) haette Wien, Genf und Chiasso abgelehnt', () => {
    const alt = (lat: number, lng: number) => lat >= 47 && lat <= 56 && lng >= 5 && lng <= 16;
    expect(alt(48.21, 16.37)).toBe(false);
    expect(alt(46.2, 6.14)).toBe(false);
    expect(alt(45.82, 9.03)).toBe(false);
  });
});

describe('hoefe/format — koordinateAusParam', () => {
  it('laesst einen Standort in Wien, Genf und im Tessin unveraendert', () => {
    expect(koordinateAusParam('16.37', 'lng')).toBe(16.37);
    expect(koordinateAusParam('46.2', 'lat')).toBe(46.2);
    expect(koordinateAusParam('45.82', 'lat')).toBe(45.82);
  });

  it('klemmt auf den Rahmen und liefert NaN, wenn der Parameter fehlt oder keine Zahl ist', () => {
    expect(koordinateAusParam('60', 'lat')).toBe(DACH_GRENZEN.latMax);
    expect(koordinateAusParam('2.35', 'lng')).toBe(DACH_GRENZEN.lngMin);
    expect(koordinateAusParam(null, 'lat')).toBeNaN();
    expect(koordinateAusParam('abc', 'lng')).toBeNaN();
  });

  it('die Route nennt keine eigenen Grenzen mehr', () => {
    const route = lies('src/app/api/hoefe/route.ts');
    expect(route).toContain("koordinateAusParam(p.get('lat'), 'lat')");
    expect(route).toContain("koordinateAusParam(p.get('lng'), 'lng')");
    expect(route).not.toMatch(/zahlAusParam\(p\.get\('(lat|lng)'\)/);
  });
});
