/**
 * Bilder-Regel Mutterrezepte (C5, Uwe 22.10.2026): genau EIN Bild je Mutterrezept,
 * die Blätter (Einsätze) bleiben unbebildert. Das Bild liegt unter
 * /public/images/mutterrezepte/, hat einen Alt-Text und eine Quelle; ein
 * KI-Bild sagt das (ki: true), ein Echtfoto braucht eine Zeile in
 * public/images/rezepte/CREDITS.md (Provenienz-Regel, CLAUDE.md § 4).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MUTTERREZEPTE } from '@/lib/mutterrezepte';

const PUBLIC = path.join(process.cwd(), 'public');
const CREDITS = fs.readFileSync(path.join(PUBLIC, 'images', 'rezepte', 'CREDITS.md'), 'utf-8');

describe('Mutterrezepte — genau ein Bild, Blätter ohne Bild', () => {
  it('es gibt Mutterrezepte', () => {
    expect(MUTTERREZEPTE.length).toBeGreaterThan(0);
  });

  it.each(MUTTERREZEPTE.map((m) => m.slug))('%s: ein Hauptbild mit Datei, Alt-Text und Quelle', (slug) => {
    const m = MUTTERREZEPTE.find((x) => x.slug === slug)!;
    const bild = (m as unknown as { bild?: unknown }).bild;
    expect(bild, 'bild fehlt').toBeTruthy();
    expect(Array.isArray(bild), 'bild ist eine Liste — erlaubt ist genau eines').toBe(false);
    expect(m.bild.src).toMatch(/^\/images\/mutterrezepte\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/);
    expect(fs.existsSync(path.join(PUBLIC, m.bild.src)), `Datei fehlt: public${m.bild.src}`).toBe(true);
    expect(m.bild.alt.trim().length, 'Alt-Text zu kurz').toBeGreaterThanOrEqual(20);
    expect(m.bild.quelle.trim().length, 'Quelle fehlt').toBeGreaterThan(0);
    expect(typeof m.bild.ki).toBe('boolean');
    if (!m.bild.ki) {
      expect(CREDITS, `Echtfoto ohne Zeile in CREDITS.md: ${slug}`).toContain(slug);
    }
  });

  it.each(MUTTERREZEPTE.map((m) => m.slug))('%s: kein Blatt trägt ein Bild', (slug) => {
    const m = MUTTERREZEPTE.find((x) => x.slug === slug)!;
    for (const b of m.blaetter) {
      const keys = Object.keys(b);
      expect(keys.some((k) => /^(bild|image|foto|img)/i.test(k)), `Blatt ${b.id} trägt ein Bildfeld`).toBe(false);
    }
  });

  it('kein zweites Mutterrezept-Bild liegt verwaist im Ordner', () => {
    const dir = path.join(PUBLIC, 'images', 'mutterrezepte');
    if (!fs.existsSync(dir)) return;
    const dateien = fs.readdirSync(dir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
    const benutzt = new Set(MUTTERREZEPTE.map((m) => path.basename(m.bild.src)));
    const verwaist = dateien.filter((f) => !benutzt.has(f));
    expect(verwaist, 'Bilder ohne Mutterrezept (Rohmaterial gehört nach bild-austausch/)').toEqual([]);
  });
});
