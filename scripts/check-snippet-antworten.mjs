#!/usr/bin/env node
/**
 * Snippet-Antworten (Position 0) — Bericht, kein Gate (12.10.2026).
 *
 * Regel: Jede Frage im `faq`-Frontmatter steht im sichtbaren Text als
 * Ueberschrift (## oder ###), und ihre Antwort hat 40–60 Woerter. Das ist die
 * Laenge, die Google fuer Antwortboxen (Featured Snippets) bevorzugt, und eine
 * direkte Antwort direkt unter der Frage ist das Format, das auch KI-Suchen
 * zitieren. Die Fragen kommen aus echter Nachfrage (Google-Vorschlaege,
 * „Aehnliche Fragen"), nicht aus dem Bauch.
 *
 * Bewusst nur Bericht: Inhalt blockiert keinen Build (ARCHITEKTUR-AUDIT
 * 2026-08-27, Abschnitt 3.2, Regel 5). Daher nicht in `npm run check`.
 *
 * Woerter = Zeichenketten mit mindestens einem Buchstaben oder einer Ziffer;
 * ein freistehender Gedankenstrich zaehlt nicht.
 *
 * Aufruf:
 *   node scripts/check-snippet-antworten.mjs           # Bericht, Exit 0
 *   node scripts/check-snippet-antworten.mjs --strict  # Exit 1 bei Befund
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

export const MIN_WOERTER = 40;
export const MAX_WOERTER = 60;

/**
 * Inhaltstypen, deren Seitenvorlage die `faq`-Eintraege selbst als h3 unter
 * „Häufige Fragen" rendert (src/app/<typ>/[slug]/page.tsx, seit 12.10.2026).
 * Dort muss die Frage NICHT zusaetzlich im MDX stehen. Alle anderen Typen
 * (cuts, vergleich …) zeigen das `faq`-Feld nur im Schema — die sichtbare
 * Frage muss dann als ## oder ### im MDX stehen.
 */
export const VORLAGE_RENDERT_FAQ = new Set(['artikel', 'fleischwissen', 'streitfaelle']);

export function zaehleWoerter(text) {
  return (String(text).match(/\S*[\p{L}\p{N}]\S*/gu) ?? []).length;
}

function normalisiere(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Prueft eine MDX-Datei. Liefert null, wenn sie kein `faq` hat. */
export function pruefeMdx(quelltext, { vorlageRendertFaq = false } = {}) {
  const m = quelltext.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = yaml.load(m[1]) ?? {};
  const faq = Array.isArray(fm.faq) ? fm.faq : [];
  if (faq.length === 0) return null;
  const ueberschriften = new Set(
    [...m[2].matchAll(/^#{2,3}\s+(.+?)\s*$/gm)].map((t) => normalisiere(t[1])),
  );
  return faq.map(({ question, answer }) => {
    const woerter = zaehleWoerter(answer);
    return {
      frage: question,
      woerter,
      laengeOk: woerter >= MIN_WOERTER && woerter <= MAX_WOERTER,
      alsUeberschrift: vorlageRendertFaq || ueberschriften.has(normalisiere(question)),
    };
  });
}

function mdxDateien(ordner) {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    if (statSync(pfad).isDirectory()) return name === '_archiv' ? [] : mdxDateien(pfad);
    return pfad.endsWith('.mdx') ? [pfad] : [];
  });
}

function main() {
  const wurzel = fileURLToPath(new URL('..', import.meta.url));
  const strikt = process.argv.includes('--strict');
  let seiten = 0;
  let fragen = 0;
  let befunde = 0;
  for (const datei of mdxDateien(join(wurzel, 'content'))) {
    const typ = relative(join(wurzel, 'content'), datei).split(/[\\/]/)[0];
    const ergebnis = pruefeMdx(readFileSync(datei, 'utf8'), {
      vorlageRendertFaq: VORLAGE_RENDERT_FAQ.has(typ),
    });
    if (!ergebnis) continue;
    seiten += 1;
    fragen += ergebnis.length;
    const schlecht = ergebnis.filter((e) => !e.laengeOk || !e.alsUeberschrift);
    if (schlecht.length === 0) continue;
    befunde += schlecht.length;
    console.log(`\n${relative(wurzel, datei)}  (${ergebnis.length - schlecht.length}/${ergebnis.length} in Ordnung)`);
    for (const e of schlecht) {
      const gruende = [];
      if (!e.laengeOk) gruende.push(`${e.woerter} Woerter`);
      if (!e.alsUeberschrift) gruende.push('keine Ueberschrift');
      console.log(`  - ${e.frage}  [${gruende.join(', ')}]`);
    }
  }
  console.log(
    `\nSnippet-Antworten: ${seiten} Seiten mit FAQ, ${fragen} Fragen, ` +
      `${fragen - befunde} in Ordnung, ${befunde} mit Befund ` +
      `(Ziel: Frage als ## oder ###, Antwort ${MIN_WOERTER}–${MAX_WOERTER} Woerter).`,
  );
  if (strikt && befunde > 0) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
