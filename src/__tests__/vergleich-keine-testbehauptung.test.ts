/**
 * Wächter: Die Vergleichsseiten behaupten keinen eigenen Produkttest (03.10.2026).
 *
 * WARUM ES DIESEN TEST GIBT: Alle sieben Vergleichsseiten schilderten eigene
 * Gerätetests mit Dauer, Stückzahl und Messwerten, in Ich-Form unter einer
 * KI-Persona; dazu kamen Siegel und Etiketten, die ein Testergebnis ausgaben.
 * Einen Testbeleg gibt es nicht. Entscheidung Uwe, 03.10.2026: Die Seiten sind
 * eine Marktübersicht nach Herstellerangaben und öffentlich zugänglichen Daten
 * — und sagen das offen.
 *
 * Geprüft wird:
 *   1. content/vergleich/*.mdx — keine Testaussage, keine Ich-Erfahrung, keine
 *      Notenskala, kein Preis ohne Stand, keine Test-Felder im Frontmatter.
 *   2. Seiten, Bausteine und Navigation rund um den Vergleich — keine
 *      Testaussage im Quelltext (Kommentare zählen nicht).
 *   3. Die Etiketten der Produkt-Registry — kein „…sieger“, kein „Test“.
 *   4. Der Methodensatz steht auf jeder der drei Vergleichs-Vorlagen.
 *   5. Die gerenderten Produkt-Bausteine tragen kein Test-Siegel.
 *
 * Einzige Ausnahme vom Wort „Test“: der offene Methodensatz
 * („… kein eigener Gerätetest“).
 *
 * Bewusst über Dateien und gerenderte Bausteine, nicht über die Seiten selbst:
 * die Seiten importieren contentlayer/generated (gibt es im Test nicht).
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import type { Product } from '@/types';
import BuyingGuideBlock from '@/components/affiliate/BuyingGuideBlock';
import ComparisonTable from '@/components/affiliate/ComparisonTable';
import ProductCard from '@/components/affiliate/ProductCard';

// Wurzel aus dem Ort dieser Datei, nicht aus process.cwd(): So prüft der Test
// den Stand, in dem er liegt — auch wenn er für eine Gegenprobe in einer Kopie
// eines älteren Standes läuft (vitest --root <kopie>).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const lies = (pfad: string) => readFileSync(join(ROOT, pfad), 'utf8');
const REGISTRY = yaml.load(lies('products/registry.yaml')) as Product[];

/** Der Methodensatz darf das Wort enthalten — und nur er. */
const AUSNAHME = /kein(?:e|en)? eigene[rn]? Gerätetests?/g;
const ohneAusnahme = (text: string) => text.replace(AUSNAHME, '');

interface Treffer { zeile: number; regel: string; text: string }

/** Eine Leserfrage („Brauche ich wirklich …?“) ist keine Ich-Erfahrung der Redaktion. */
const LESERFRAGE = /\?[*"”“]*\s*$/;

function pruefe(text: string, regeln: readonly (readonly [string, RegExp])[]): Treffer[] {
  const treffer: Treffer[] = [];
  ohneAusnahme(text).split('\n').forEach((zeile, i) => {
    for (const [regel, muster] of regeln) {
      if (regel === 'Ich-Erfahrung' && LESERFRAGE.test(zeile)) continue;
      if (muster.test(zeile)) treffer.push({ zeile: i + 1, regel, text: zeile.trim().slice(0, 140) });
    }
  });
  return treffer;
}

const bericht = (datei: string, treffer: Treffer[]) =>
  treffer.map((t) => `${datei}:${t.zeile} [${t.regel}] ${t.text}`).join('\n');

// ── 1) Inhalte ───────────────────────────────────────────────────────────────

/**
 * Im Inhalt ist das Wort „Test“ in jeder Form gesperrt (auch „getestet“,
 * „Testsieger“, „Praxistest“, „testen“) — es gibt dort keinen Grund dafür.
 * Bewusst drei Muster statt /test/: „du musstest“ und „du arbeitest“ enden
 * auch auf „-test“ und sind keine Aussage über einen Test.
 */
const INHALT_REGELN = [
  // Wortanfang, auch nach Bindestrich: Test, Tests, Testsieger, testen, Smoker-Test
  ['Testaussage', /(?<!\p{L})[Tt]est/u],
  ['Testaussage', /getestet/i],
  // Zusammengesetztes Substantiv: Praxistest, Drucktest, Produkttests
  ['Testaussage', /(?<!\p{L})\p{Lu}\p{L}*tests?(?!\p{L})/u],
  ['Kauf-/Leihbehauptung', /selbst gekauft|Leihger|Leihgabe|Sponsor-Exemplar|Eigenexemplar/i],
  ['eigene Dauer', /\b\d+\s+(?:Wochen|Monate[n]?)\b|wochenlang|monatelang/i],
  ['eigener Messwert', /gemessen|\bMessung(?:en)?\b|Datenlogger|geblindet|Eiskalibrierung/i],
  ['Ich-Erfahrung', /(?<![\p{L}-])(?:ich|mein(?:e[mnrs]?)?|mir|mich)(?![\p{L}-])/iu],
  // Die Verneinung ist erlaubt — sie ist der Methodensatz in eigenen Worten
  // („Wir haben die Geräte nicht selbst betrieben“).
  ['Wir-haben-Erfahrung', /\bwir haben\b(?![^.]*\b(?:nicht|kein(?:e[mnrs]?)?)\b)[^.]*\b(?:ausprobiert|gekauft|betrieben|gegrillt|gereift|gebacken|geknetet|gewolft)/i],
  ['Notenskala', /\d(?:,\d)?\s*\/\s*10\b/],
  ['Rangfolge als Ergebnis', /^#{1,6}\s*Platz\s+\d/],
] as const;

/** Ein Preis im Text braucht seinen Stand in derselben Zeile. */
const PREIS = /€\s?\d|\d\s?€|\d\s?Euro\b/;
const STAND = /Stand\s+(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+20\d\d/;

const VERGLEICH_DIR = join(ROOT, 'content', 'vergleich');
const INHALTE = readdirSync(VERGLEICH_DIR).filter((f) => f.endsWith('.mdx')).sort();

describe('content/vergleich: Marktübersicht statt Testbericht', () => {
  it('umfasst die sieben Vergleichsseiten (sonst prüft dieser Test nichts)', () => {
    expect(INHALTE).toHaveLength(7);
  });

  it.each(INHALTE)('%s behauptet keinen eigenen Test und keine Ich-Erfahrung', (datei) => {
    const treffer = pruefe(readFileSync(join(VERGLEICH_DIR, datei), 'utf8'), INHALT_REGELN);
    expect(treffer, bericht(datei, treffer)).toEqual([]);
  });

  it.each(INHALTE)('%s nennt keinen Preis ohne Stand', (datei) => {
    const ohneStand = readFileSync(join(VERGLEICH_DIR, datei), 'utf8')
      .split('\n')
      .map((text, i) => ({ zeile: i + 1, regel: 'Preis ohne Stand', text }))
      .filter((z) => PREIS.test(z.text) && !STAND.test(z.text))
      .map((z) => ({ ...z, text: z.text.trim().slice(0, 140) }));
    expect(ohneStand, bericht(datei, ohneStand)).toEqual([]);
  });

  it.each(INHALTE)('%s führt keine Test-Felder im Frontmatter', (datei) => {
    const roh = readFileSync(join(VERGLEICH_DIR, datei), 'utf8');
    const frontmatter = roh.slice(0, roh.indexOf('\n---', 3));
    expect(frontmatter).not.toMatch(/^testedCount:/m);
    expect(frontmatter).not.toMatch(/^testDuration:/m);
  });
});

// ── 2) Seiten, Bausteine, Navigation ─────────────────────────────────────────

/** Kommentare zählen nicht — sie dürfen sagen, was früher hier stand. */
function ohneKommentare(quelle: string): string {
  return quelle
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ''))
    .replace(/(^|[\s;{}()])\/\/[^\n]*/g, '$1');
}

/**
 * Im Quelltext ist das Substantiv gesperrt (Großschreibung — `.test(` und
 * `data-testid` sind Code), dazu die Zusammensetzungen und Verbformen.
 */
const QUELLTEXT_REGELN = [
  ['Test als Wort', /\bTests?\b/],
  ['Test-Zusammensetzung', /Test(?:sieger|bericht|ergebnis|methodik|dauer|betrieb|kategorie|feld|protokoll|urteil)/i],
  ['Testaussage', /getestet|Praxistest|Produkttest|Vergleichstest|testen wir|wir testen/i],
  // Großschreibung: der Bildpfad „thermometer-test-steak-grill-1.webp“ ist keine Aussage.
  ['Testaussage', /Thermometer-Tests?\b/],
  ['Kauf-/Leihbehauptung', /selbst gekauft|Leihger|Leihgabe/i],
  ['Praxisbehauptung', /praxiserprobt|im Praxiseinsatz|unter Echtbedingungen/i],
] as const;

const QUELLEN = [
  // Vergleichs-Vorlagen
  'src/app/vergleich/page.tsx',
  'src/app/vergleich/[slug]/page.tsx',
  'src/app/relaunch/vergleich/[slug]/page.tsx',
  'src/lib/vergleich-seite.ts',
  'src/components/vergleich/Methodenhinweis.tsx',
  // Produkt-Bausteine
  'src/components/affiliate/BuyingGuideBlock.tsx',
  'src/components/affiliate/ComparisonTable.tsx',
  'src/components/affiliate/EquipmentFooter.tsx',
  'src/components/affiliate/HeroRecommendation.tsx',
  'src/components/affiliate/InlineAffiliate.tsx',
  'src/components/affiliate/PreisMitStand.tsx',
  'src/components/affiliate/ProductCard.tsx',
  'src/components/mdx/MDXBuyingGuideBlock.tsx',
  'src/components/mdx/MDXComparisonTable.tsx',
  'src/components/mdx/MDXProductCard.tsx',
  // Navigation, Teaser, Metadaten, die auf die Vergleiche zeigen
  'src/components/layout/Header.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/relaunch/Footer.tsx',
  'src/components/diplome/KontextRail.tsx',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/home-b/page.tsx',
  'src/app/kategorie/[slug]/page.tsx',
  'src/app/methoden/page.tsx',
  'src/app/ausruestung/messer/page.tsx',
  'src/app/relaunch/rezepte/[kategorie]/[slug]/page.tsx',
  'src/app/relaunch/suche/page.tsx',
  'src/app/relaunch/ueber-uns/page.tsx',
  'src/lib/startseiten-artikel.ts',
  'src/lib/suche.ts',
  'src/lib/schema.ts',
];

describe('Seiten, Bausteine und Navigation rund um den Vergleich', () => {
  it.each(QUELLEN)('%s enthält keine Testaussage', (datei) => {
    expect(existsSync(join(ROOT, datei)), `${datei} fehlt — Liste QUELLEN anpassen`).toBe(true);
    const treffer = pruefe(ohneKommentare(lies(datei)), QUELLTEXT_REGELN);
    expect(treffer, bericht(datei, treffer)).toEqual([]);
  });

  it('content/methoden verweist ohne Testaussage auf die Vergleiche', () => {
    const dir = join(ROOT, 'content', 'methoden');
    for (const datei of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
      const verweise = readFileSync(join(dir, datei), 'utf8')
        .split('\n')
        .filter((zeile) => zeile.includes('/vergleich/'));
      for (const zeile of verweise) {
        expect(zeile, datei).not.toMatch(/getestet|Testsieger|im Test\b/i);
      }
    }
  });
});

// ── 3) Etiketten der Registry ────────────────────────────────────────────────

describe('products/registry.yaml: Etiketten', () => {
  it('sind eine Einordnung, kein Testurteil', () => {
    const verdaechtig = REGISTRY
      .filter((p) => typeof p.badge === 'string' && /sieger|test/i.test(p.badge))
      .map((p) => `${p.id}: ${p.badge}`);
    expect(verdaechtig).toEqual([]);
  });
});

// ── 4) Methodensatz ──────────────────────────────────────────────────────────

describe('Methodensatz', () => {
  it('sagt offen, dass es kein Gerätetest ist', () => {
    const quelle = lies('src/lib/vergleich-seite.ts');
    const satz = /METHODENSATZ\s*=\s*'([^']+)'/.exec(quelle)?.[1] ?? '';
    expect(satz).toMatch(/Marktübersicht/);
    expect(satz).toMatch(/Herstellerangaben/);
    expect(satz).toMatch(/kein eigener Gerätetest/);
  });

  it('steht auf der Detailseite, der Relaunch-Detailseite und der Übersicht', () => {
    // Die Detailseite rendert ihn über <Methodenhinweis>, die beiden anderen direkt.
    expect(lies('src/app/vergleich/[slug]/page.tsx')).toMatch(/<Methodenhinweis\b/);
    expect(lies('src/components/vergleich/Methodenhinweis.tsx')).toMatch(/\{METHODENSATZ\}/);
    expect(lies('src/app/relaunch/vergleich/[slug]/page.tsx')).toMatch(/\{METHODENSATZ\}/);
    expect(lies('src/app/vergleich/page.tsx')).toMatch(/\{METHODENSATZ\}/);
  });
});

// ── 5) Gerenderte Bausteine ──────────────────────────────────────────────────

function sichtbar(markup: string) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

describe('Produkt-Bausteine, gerendert', () => {
  const produkte = REGISTRY;

  it('tragen bei keinem Produkt ein Test-Siegel', () => {
    for (const product of produkte) {
      const bausteine = [
        renderToStaticMarkup(createElement(BuyingGuideBlock, { product, title: 'Titel', summary: 'Zusammenfassung' })),
        renderToStaticMarkup(createElement(ComparisonTable, { products: [product] })),
        renderToStaticMarkup(createElement(ProductCard, { product })),
        renderToStaticMarkup(createElement(ProductCard, { product, variant: 'sidebar' })),
        renderToStaticMarkup(createElement(ProductCard, { product, variant: 'compact' })),
      ];
      for (const markup of bausteine) {
        expect(sichtbar(markup), product.id).not.toMatch(/getestet|Testsieger|\bTests?\b/);
      }
    }
  });
});
