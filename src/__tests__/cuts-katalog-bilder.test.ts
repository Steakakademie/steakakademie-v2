import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_CUTS } from '@/lib/cuts-catalog';

/**
 * Waechter (12.10.2026, Ahrefs "Image broken: 8 URLs" auf /cuts).
 *
 * Im Juli 2026 wurden 16 Cut-Fotos entfernt, der Katalog verwies weiter auf die
 * Dateien. Der Platzhalter griff erst im Browser per onError — Crawler sahen im
 * HTML ein <img> mit 404. Regel seitdem: image ist entweder ein Pfad auf eine
 * VORHANDENE Datei oder '' (dann rendert CutImage den Platzhalter ohne <img>).
 */
const PUBLIC = join(process.cwd(), 'public');

describe('cuts-catalog: Fotos', () => {
  it('jeder gesetzte image-Pfad zeigt auf eine vorhandene Datei', () => {
    const fehlend = ALL_CUTS.filter((c) => c.image && !existsSync(join(PUBLIC, c.image))).map((c) => c.id);
    expect(fehlend).toEqual([]);
  });

  it('ohne Foto ist image leer, nicht ein toter Pfad', () => {
    const tot = ALL_CUTS.filter((c) => c.image && !c.image.startsWith('/images/cuts/')).map((c) => c.id);
    expect(tot).toEqual([]);
  });

  it('liegt zu einem Cut eine <slug>.jpg vor, ist sie auch im Katalog gesetzt', () => {
    const vergessen = ALL_CUTS.filter(
      (c) => !c.image && existsSync(join(PUBLIC, 'images', 'cuts', `${c.slug}.jpg`)),
    ).map((c) => c.id);
    expect(vergessen).toEqual([]);
  });
});
