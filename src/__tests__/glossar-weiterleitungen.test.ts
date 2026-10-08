/**
 * Glossar-Weiterleitungen (09.10.2026): data/taxonomie.yaml → glossar_weiterleitungen
 * ist die eine Liste fuer 301 (next.config.mjs), Neuanlage-Sperre (Gate, Agent)
 * und diesen Waechter. Was er haelt:
 *
 *   1. Kein weitergeleiteter Slug hat noch eine Datei — sonst ueberdeckt die
 *      Weiterleitung eine Seite, die es gibt (oder umgekehrt, je nach Reihenfolge).
 *   2. Jedes Ziel existiert als Inhaltsseite und ist nicht selbst weitergeleitet
 *      (keine Ketten, kein 404 hinter dem 301).
 *   3. Kein interner Link in content/ oder src/ zeigt noch auf den alten Slug —
 *      Google folgt dem 301, aber ein interner Link soll direkt ins Ziel zeigen.
 *   4. next.config.mjs liest die Liste wirklich (Marker), statt einer zweiten Kopie.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tax = yaml.load(readFileSync(join(ROOT, 'data', 'taxonomie.yaml'), 'utf8')) as {
  glossar_weiterleitungen?: Record<string, string>;
};
const karte = tax.glossar_weiterleitungen ?? {};
const eintraege = Object.entries(karte);

/** Inhaltsordner je URL-Praefix — alles andere muss eine App-Route sein. */
const INHALT: Record<string, string> = {
  glossar: 'glossar',
  methoden: 'methoden',
  cuts: 'cuts',
  vergleich: 'vergleich',
  fleischwissen: 'fleischwissen',
  streitfaelle: 'streitfaelle',
  artikel: 'artikel',
};

function zielExistiert(ziel: string): boolean {
  const [, bereich, ...rest] = ziel.split('/');
  const ordner = INHALT[bereich];
  if (ordner && rest.length === 1) return existsSync(join(ROOT, 'content', ordner, `${rest[0]}.mdx`));
  return existsSync(join(ROOT, 'src', 'app', ...ziel.split('/').filter(Boolean), 'page.tsx'));
}

function dateien(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === '_archiv' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) dateien(p, out);
    else if (['.mdx', '.md', '.ts', '.tsx'].includes(extname(e)) && !/\.test\.(ts|tsx)$/.test(e)) out.push(p);
  }
  return out;
}

describe('Glossar-Weiterleitungen (data/taxonomie.yaml)', () => {
  it('die Liste ist da und nicht leer', () => {
    expect(eintraege.length).toBeGreaterThan(0);
  });

  it('kein weitergeleiteter Slug hat noch eine Datei unter content/glossar', () => {
    const noch = eintraege.filter(([slug]) => existsSync(join(ROOT, 'content', 'glossar', `${slug}.mdx`)));
    expect(noch.map(([s]) => s)).toEqual([]);
  });

  it('jedes Ziel ist eine absolute, existierende Seite — und selbst nicht weitergeleitet', () => {
    for (const [slug, ziel] of eintraege) {
      expect(ziel, slug).toMatch(/^\/[a-z0-9/-]+$/);
      expect(zielExistiert(ziel), `${slug} → ${ziel} existiert nicht`).toBe(true);
      const zielSlug = ziel.startsWith('/glossar/') ? ziel.slice('/glossar/'.length) : null;
      if (zielSlug) expect(karte[zielSlug], `${slug} → ${ziel} ist selbst weitergeleitet (Kette)`).toBeUndefined();
    }
  });

  it('kein interner Link in content/ oder src/ zeigt noch auf einen alten Slug', () => {
    const treffer: string[] = [];
    const alle = [...dateien(join(ROOT, 'content')), ...dateien(join(ROOT, 'src'))];
    for (const f of alle) {
      const text = readFileSync(f, 'utf8');
      for (const [slug] of eintraege) {
        const re = new RegExp(`/glossar/${slug}(?![a-z0-9-])`);
        if (re.test(text)) treffer.push(`${f.slice(ROOT.length + 1)} → /glossar/${slug}`);
      }
    }
    expect(treffer).toEqual([]);
  });

  it('next.config.mjs baut die 301 aus dieser Liste', () => {
    const cfg = readFileSync(join(ROOT, 'next.config.mjs'), 'utf8');
    expect(cfg).toContain('glossar_weiterleitungen');
    expect(cfg).toContain('...glossarWeiterleitungen');
  });
});
