import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Waechter: Provenienz der Rezeptbilder (Uwe, 16.10.2026: „die Sammeldatei je Bild
 * soll gepflegt werden").
 *
 * public/images/rezepte/CREDITS.md ist der Provenienznachweis fuer jedes Rezeptbild,
 * das auf einem ECHTEN Foto beruht — Stockfoto (Pexels, Unsplash, Pixabay, Foodiesfeed),
 * Collage daraus, KI-bearbeitetes Echtfoto oder Eigenfoto. Rein generative Bilder
 * (FLUX, Nano Banana ohne Vorlage, Firefly …) brauchen keine Zeile; sie sind dort
 * pauschal unter „Uebriger Bestand" ausgewiesen.
 *
 * Anlass: Elf Rezepte des Rezept-Agenten (22.09.–14.10.2026) trugen im Frontmatter
 * eine Stockfoto-Quelle, standen aber nicht in der Sammeldatei. Das Frontmatter allein
 * ist kein Nachweis, der ohne Build lesbar bleibt.
 *
 * Bewusst dateibasiert (kein contentlayer): „Unit-Tests pruefen" laeuft ohne Build.
 */
const REZEPTE = join(process.cwd(), 'content', 'rezepte');
const CREDITS = join(process.cwd(), 'public', 'images', 'rezepte', 'CREDITS.md');

/** Quellen, die ein echtes Foto bedeuten und deshalb eine Zeile verlangen. */
const ECHTFOTO = /pexels|unsplash|pixabay|foodiesfeed|echtfoto|eigenfoto/i;

type Rezept = { slug: string; imageAI: boolean | null; imageSource: string };

const rezepte: Rezept[] = readdirSync(REZEPTE)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => {
    const roh = readFileSync(join(REZEPTE, f), 'utf8');
    const ai = roh.match(/^imageAI:\s*(true|false)\s*$/m);
    const src = roh.match(/^imageSource:\s*"?([^"\n]*)"?\s*$/m);
    return {
      slug: f.replace(/\.mdx$/, ''),
      imageAI: ai ? ai[1] === 'true' : null,
      imageSource: src ? src[1].trim() : '',
    };
  });

/** Slugs, die in CREDITS.md eine Tabellenzeile haben (erste Spalte). */
function slugsInCredits(): Set<string> {
  const zeilen = readFileSync(CREDITS, 'utf8').split('\n');
  const slugs = new Set<string>();
  for (const z of zeilen) {
    // Slug beginnt mit Buchstabe/Ziffer — die Trennzeile |------| ist keiner.
    const m = z.match(/^\|\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*\|/);
    if (m) slugs.add(m[1]);
  }
  return slugs;
}

describe('rezeptbilder: Provenienz in CREDITS.md', () => {
  it('findet Rezepte und die Sammeldatei', () => {
    expect(rezepte.length).toBeGreaterThan(0);
    expect(slugsInCredits().size).toBeGreaterThan(0);
  });

  it('jedes Bild mit Echtfoto-Anteil oder imageAI:false hat eine Zeile in CREDITS.md', () => {
    const credits = slugsInCredits();
    const pflicht = rezepte.filter((r) => r.imageAI === false || ECHTFOTO.test(r.imageSource));
    const fehlen = pflicht.filter((r) => !credits.has(r.slug)).map((r) => `${r.slug}: ${r.imageSource}`);
    expect(fehlen, 'Zeile in public/images/rezepte/CREDITS.md nachtragen').toEqual([]);
  });

  it('keine Zeile in CREDITS.md zeigt auf ein Rezept, das es nicht gibt', () => {
    const vorhanden = new Set(rezepte.map((r) => r.slug));
    const verwaist = [...slugsInCredits()].filter((s) => !vorhanden.has(s));
    expect(verwaist).toEqual([]);
  });
});
