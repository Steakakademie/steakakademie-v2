import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deckeleRezepte, MAX_REZEPTE_IM_STROM, REZEPT_TYP } from '@/lib/news-mix';

/**
 * Magazin (/bbq-news) darf keine Rezeptliste werden (Uwe, 19.10.2026).
 * Anlass: Seit dem 21.09. keine freigegebene News, der Strom bestand nur noch aus Rezepten.
 */
const e = (id: string, type: string) => ({ id, type });

describe('deckeleRezepte', () => {
  it('lässt höchstens zwei Rezepte stehen — die neuesten', () => {
    const strom = [
      e('r1', REZEPT_TYP), e('r2', REZEPT_TYP), e('r3', REZEPT_TYP),
      e('a1', 'Artikel'), e('r4', REZEPT_TYP), e('c1', 'Cut'),
    ];
    const ergebnis = deckeleRezepte(strom);
    expect(ergebnis.filter((x) => x.type === REZEPT_TYP).map((x) => x.id)).toEqual(['r1', 'r2']);
    expect(ergebnis.map((x) => x.id)).toEqual(['r1', 'r2', 'a1', 'c1']);
  });

  it('der Deckel steht bei zwei', () => {
    expect(MAX_REZEPTE_IM_STROM).toBe(2);
  });

  it('andere Inhaltsarten bleiben vollständig und in Reihenfolge', () => {
    const strom = [e('a1', 'Artikel'), e('m1', 'Methode'), e('u1', 'UsaBbqStyle')];
    expect(deckeleRezepte(strom)).toEqual(strom);
  });

  it('getNewsItems nutzt den Deckel', () => {
    const quelle = readFileSync(join(process.cwd(), 'src/lib/bbq-news.ts'), 'utf8');
    expect(quelle).toMatch(/deckeleRezepte\(getRedaktionelleNeuzugaenge\(/);
  });
});
