import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Waechter (Z4, 15.10.2026, Ahrefs "Image broken" auf /persoenlichkeiten).
 *
 * Alle 14 Persoenlichkeiten verwiesen im Frontmatter auf /images/persoenlichkeiten/
 * <slug>.jpg — kein einziges dieser Bilder lag in public/. Die Seiten rendern das
 * Feld ohnehin nicht (Index und Detail zeigen einen festen Platzhalter), der Pfad
 * war also ein toter Zeiger. Entscheidung laut Arbeitsplan: Feld leeren statt Bilder
 * beschaffen (0 EUR). Analog zum Cuts-Fix (cuts-katalog-bilder.test.ts).
 *
 * Regel seitdem: image ist entweder ein Pfad auf eine VORHANDENE Datei oder "".
 * contentlayer verlangt das Feld (required), der leere String erfuellt das.
 *
 * Bewusst dateibasiert (kein Import aus contentlayer/generated): der CI-Job
 * "Unit-Tests pruefen" laeuft ohne vorherigen Build.
 */
const DIR = join(process.cwd(), 'content', 'persoenlichkeiten');
const PUBLIC = join(process.cwd(), 'public');

type Eintrag = { slug: string; image: string | null };

const eintraege: Eintrag[] = readdirSync(DIR)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => {
    const roh = readFileSync(join(DIR, f), 'utf8');
    // image: "..." aus der Frontmatter; null = Schluessel fehlt ganz.
    const treffer = roh.match(/^image:\s*"([^"]*)"\s*$/m);
    return { slug: f.replace(/\.mdx$/, ''), image: treffer ? treffer[1] : null };
  });

describe('persoenlichkeiten: Fotos', () => {
  it('findet die Inhalte', () => {
    expect(eintraege.length).toBeGreaterThan(0);
  });

  it('das image-Feld ist gesetzt (contentlayer required) — leer ist erlaubt', () => {
    const ohneFeld = eintraege.filter((e) => e.image === null).map((e) => e.slug);
    expect(ohneFeld).toEqual([]);
  });

  it('jeder gesetzte image-Pfad zeigt auf eine vorhandene Datei', () => {
    const fehlend = eintraege
      .filter((e) => e.image && !existsSync(join(PUBLIC, e.image.replace(/^\//, ''))))
      .map((e) => e.slug);
    expect(fehlend).toEqual([]);
  });

  it('liegt zu einer Persoenlichkeit eine <slug>.jpg vor, ist sie auch gesetzt', () => {
    const vergessen = eintraege
      .filter(
        (e) =>
          !e.image &&
          existsSync(join(PUBLIC, 'images', 'persoenlichkeiten', `${e.slug}.jpg`)),
      )
      .map((e) => e.slug);
    expect(vergessen).toEqual([]);
  });
});
