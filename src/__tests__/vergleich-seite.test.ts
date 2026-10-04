/**
 * Produkte einer Vergleichsseite (03.10.2026).
 *
 * Anlass: Die Seitenleiste von /vergleich/grills und /vergleich/messer zeigte
 * Thermometer — für Seiten ohne eigene Zuordnung fiel die Kategorie auf
 * `thermometer` zurück. Die Zuordnung steht jetzt ausdrücklich je Slug in
 * src/lib/vergleich-seite.ts; einen Rückfall gibt es nicht mehr.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getProductById } from '@/lib/products';
import Methodenhinweis from '@/components/vergleich/Methodenhinweis';
import { METHODENSATZ, VERGLEICH_PRODUKTE, anzahlModelle, vergleichsProdukte } from '@/lib/vergleich-seite';

const DIR = join(process.cwd(), 'content', 'vergleich');
const SEITEN = readdirSync(DIR)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => ({ slug: f.replace(/\.mdx$/, ''), roh: readFileSync(join(DIR, f), 'utf8') }));

/** Welche Produkt-Kategorien auf welcher Seite stehen dürfen. */
const ERLAUBT: Record<string, string[]> = {
  'fleischthermometer': ['thermometer'],
  'premium-fleischthermometer': ['thermometer'],
  'grills': ['grill', 'smoker'],
  'messer': ['messer'],
  'oberhitzegrill-vergleich': ['oberhitzegrill'],
  'dry-aging-kuehlschrank-vergleich': ['dry-ager'],
  'kuechenmaschine-vergleich': ['kuechenmaschine'],
};

describe('vergleichsProdukte', () => {
  it('kennt jede Vergleichsseite (neue Seite → ERLAUBT ergänzen)', () => {
    expect(SEITEN.map((s) => s.slug).sort()).toEqual(Object.keys(ERLAUBT).sort());
  });

  it.each(SEITEN)('$slug zeigt nur Produkte der eigenen Kategorie', ({ slug, roh }) => {
    const produkte = vergleichsProdukte(slug, roh);
    expect(produkte.length, `${slug} hat keine Produkte`).toBeGreaterThan(0);
    for (const p of produkte) {
      expect(ERLAUBT[slug], `${slug} zeigt ${p.id} (${p.category})`).toContain(p.category);
    }
  });

  it('zeigt auf der Grill- und der Messer-Seite keine Thermometer mehr', () => {
    for (const slug of ['grills', 'messer']) {
      const roh = SEITEN.find((s) => s.slug === slug)!.roh;
      expect(vergleichsProdukte(slug, roh).map((p) => p.category)).not.toContain('thermometer');
    }
  });

  it('nimmt die Produkt-Bausteine des Textes, wenn es welche gibt', () => {
    const roh = '<MDXComparisonTable ids="beefer-pro-ii,caso-steakchef-1500" />\n<MDXProductCard id="beefer-pro-ii" />';
    expect(vergleichsProdukte('grills', roh).map((p) => p.id)).toEqual(['beefer-pro-ii', 'caso-steakchef-1500']);
    expect(anzahlModelle('grills', roh)).toBe(2);
  });

  it('kennt für eine unbekannte Seite ohne Bausteine keine Produkte — kein Rückfall', () => {
    expect(vergleichsProdukte('gibt-es-nicht', 'Nur Text.')).toEqual([]);
    expect(anzahlModelle('gibt-es-nicht', 'Nur Text.')).toBe(0);
  });
});

describe('Methodenhinweis', () => {
  const sichtbar = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  it('zeigt den Methodensatz als lesbaren Text', () => {
    const text = sichtbar(renderToStaticMarkup(createElement(Methodenhinweis, {})));
    expect(text).toContain(METHODENSATZ);
    expect(text).toContain('kein eigener Gerätetest');
  });

  it('nennt die Modellzahl nur, wenn eine gezählt wurde', () => {
    expect(sichtbar(renderToStaticMarkup(createElement(Methodenhinweis, { modelle: 4 })))).toContain('4 Modelle in dieser Übersicht');
    expect(sichtbar(renderToStaticMarkup(createElement(Methodenhinweis, { modelle: 0 })))).not.toMatch(/Modell/);
    expect(sichtbar(renderToStaticMarkup(createElement(Methodenhinweis, {})))).not.toMatch(/Modell/);
  });
});

describe('VERGLEICH_PRODUKTE', () => {
  it('nennt nur Produkte, die es in der Registry gibt', () => {
    for (const [slug, ids] of Object.entries(VERGLEICH_PRODUKTE)) {
      for (const id of ids) {
        expect(getProductById(id), `${slug}: ${id}`).toBeDefined();
      }
    }
  });

  it('nennt nur Produkte, die der Text der Seite behandelt', () => {
    // Ein Wort aus dem Produktnamen muss im Text der Seite vorkommen (Marke oder Modell).
    for (const [slug, ids] of Object.entries(VERGLEICH_PRODUKTE)) {
      const roh = (SEITEN.find((s) => s.slug === slug)?.roh ?? '').toLowerCase();
      for (const id of ids) {
        const marke = getProductById(id)!.brand.split(' ')[0].toLowerCase();
        expect(roh, `${slug}: ${id} (${marke}) kommt im Text nicht vor`).toContain(marke);
      }
    }
  });
});
