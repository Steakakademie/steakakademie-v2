import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LEKTIONS_CHECK, alleCheckFragen, checkFragen } from '@/lib/diplome/lektions-fragen';
import { FRAGEN } from '@/lib/diplome/fragen';
import { STUFEN_ORDER } from '@/lib/diplome/stufen';

/**
 * Der Riegel zwischen Lern-Check und Stufenpruefung (09.09.2026).
 *
 * Beide Fragensaetze behandeln denselben Stoff — es ist deshalb nur eine Frage
 * der Zeit, bis jemand eine Frage aus Bequemlichkeit von der einen in die
 * andere Datei kopiert. Genau dann waere die Pruefung entwertet: Wer elf
 * Lektions-Checks durchlaufen hat, kennt jede Antwort, und die 80-%-Huerde
 * misst nur noch Erinnerung.
 *
 * Der erste Test hier faellt in dem Moment um. Er ist der Grund, warum es diese
 * Datei gibt.
 */

const normalisiere = (s: string) =>
  s
    .toLowerCase()
    .replace(/[„“”"'’]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]/g, '')
    .trim();

describe('Lern-Check und Stufenpruefung bleiben getrennt', () => {
  it('kein Fragentext kommt in beiden Saetzen vor', () => {
    const pruefung = new Set(
      STUFEN_ORDER.flatMap((modul) => FRAGEN[modul].map((f) => normalisiere(f.q))),
    );
    for (const f of alleCheckFragen()) {
      expect(pruefung.has(normalisiere(f.q)), `"${f.q}" steht auch im Pruefungspool`).toBe(false);
    }
  });

  it('keine id kollidiert zwischen den Saetzen', () => {
    const pruefungIds = new Set(STUFEN_ORDER.flatMap((m) => FRAGEN[m].map((f) => f.id)));
    for (const f of alleCheckFragen()) {
      expect(pruefungIds.has(f.id), `id ${f.id} doppelt`).toBe(false);
      expect(f.id.startsWith('c-'), `id ${f.id} ohne Praefix c-`).toBe(true);
    }
  });
});

describe('Lern-Check: Aufbau', () => {
  it('jede Frage hat eine eindeutige id, gueltigen correct-Index und eine Erklaerung', () => {
    const ids = new Set<string>();
    for (const f of alleCheckFragen()) {
      expect(ids.has(f.id), `doppelte id ${f.id}`).toBe(false);
      ids.add(f.id);
      expect(f.options.length).toBeGreaterThanOrEqual(3);
      expect(new Set(f.options).size, `doppelte Option in ${f.id}`).toBe(f.options.length);
      expect(f.correct).toBeGreaterThanOrEqual(0);
      expect(f.correct).toBeLessThan(f.options.length);
      expect(f.explain.length, `${f.id} ohne Erklaerung`).toBeGreaterThan(20);
    }
  });

  it('jede Lektion im Check hat genau drei Fragen', () => {
    for (const [slug, fragen] of Object.entries(LEKTIONS_CHECK)) {
      expect(fragen.length, slug).toBe(3);
    }
  });

  it('unbekannte Slugs liefern ein leeres Array statt zu werfen', () => {
    expect(checkFragen('gibt-es-nicht')).toEqual([]);
  });
});

describe('Lern-Check ↔ Lektionen', () => {
  const root = join(process.cwd(), 'content', 'diplom-lektionen');

  function slugsDerStufe(nr: number): Set<string> {
    const set = new Set<string>();
    for (const file of readdirSync(join(root, `stufe-${nr}`))) {
      if (!file.endsWith('.mdx')) continue;
      const m = readFileSync(join(root, `stufe-${nr}`, file), 'utf8').match(
        /^lektionSlug:\s*"([^"]+)"/m,
      );
      if (m) set.add(m[1]);
    }
    return set;
  }

  it('jeder Check-Slug zeigt auf eine existierende Lektion', () => {
    const alle = new Set([1, 2, 3, 4, 5].flatMap((nr) => Array.from(slugsDerStufe(nr))));
    for (const slug of Object.keys(LEKTIONS_CHECK)) {
      expect(alle.has(slug), `${slug} hat keine Lektion`).toBe(true);
    }
  });

  it('alle elf Lektionen der Stufe 1 haben einen Check', () => {
    const stufe1 = slugsDerStufe(1);
    expect(stufe1.size).toBe(11);
    for (const slug of Array.from(stufe1)) {
      expect(checkFragen(slug).length, `${slug} ohne Check`).toBe(3);
    }
  });
});
