/**
 * Konvertiert die redaktionellen MDX-Rezepte (content/rezepte/**.mdx) in eine
 * Kochwissen-CSV-Lieferung (data/kochwissen/steakakademie-rezepte-1.csv), damit
 * die Rezept-Schmiede auch auf UNSEREN erprobten Rezepten gründet (Flywheel).
 *
 * Format wie alle Lieferungen (siehe data/kochwissen/README.md):
 *   Titel; Kategorie; Cut/Zutat; Schwierigkeit; Keywords; Quelle-Fundstelle; Inhalt_normalisiert
 *
 * - Quelle-Fundstelle = "Steakakademie-Rezept: /rezepte/<kategorie>/<slug>" → der Generator
 *   kann auf die eigene Rezeptseite verweisen.
 * - Zutaten werden mit ihrer Basis-Personenzahl (servings) aufgenommen; die
 *   Pro-Person-Umrechnung passiert im UI (PortionCalculator / Rezept-Schmiede).
 * - Inhalt wird auf ~2800 Zeichen gekappt (Satzgrenze) — fokussierte Embeddings
 *   und schonend fürs Voyage-Token-Limit (10K TPM Gratis-Tier).
 *
 * Aufruf:  node scripts/rezepte-to-kochwissen.mjs
 * Rein lokal/deterministisch — keine API-Calls, kein DB-Zugriff.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = join(ROOT, 'content', 'rezepte')
const OUT = join(ROOT, 'data', 'kochwissen', 'steakakademie-rezepte-1.csv')
const MAX_CONTENT = 2800

async function mdxFiles(dir) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await mdxFiles(p)))
    else if (e.name.endsWith('.mdx')) out.push(p)
  }
  return out.sort()
}

// Feste Spalten dürfen kein ';' und keinen Zeilenumbruch enthalten.
const cell = (s) => String(s ?? '').replace(/[;\r\n]+/g, ',').replace(/\s+/g, ' ').trim()

// Fließtext → einzeilig, ohne Markdown-Deko; ';' bleibt erlaubt (letzte Spalte).
function flatten(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')          // Codeblöcke raus
    .replace(/<[^>\n]{1,120}>/g, ' ')          // JSX/HTML-Tags raus
    .replace(/^#{1,6}\s*(.+)$/gm, '§ $1:')     // Überschriften als Abschnittsmarker
    .replace(/[*_`>]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')   // Links → Linktext
    .replace(/\s+/g, ' ')
    .trim()
}

function clip(text, max) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  return (end > max * 0.6 ? cut.slice(0, end + 1) : cut).trim()
}

function isoDauer(s) {
  const m = String(s ?? '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return null
  const min = (parseInt(m[1] ?? 0, 10) * 60) + parseInt(m[2] ?? 0, 10)
  return min > 0 ? `${min} Min` : null
}

const files = await mdxFiles(SRC_DIR)
const rows = []
for (const file of files) {
  const raw = await readFile(file, 'utf8')
  const { data: fm, content } = matter(raw)
  if (!fm?.title) continue
  const slug = basename(file, '.mdx')

  const zutaten = Array.isArray(fm.ingredients)
    ? fm.ingredients
        .map((i) => [i.amount, i.unit, i.name].filter(Boolean).join(' ') + (i.note ? ` (${i.note})` : ''))
        .join(', ')
    : ''

  const kopf = [
    fm.description,
    fm.servings ? `Basis: ${fm.servings} Personen (Mengen linear pro Person umrechenbar).` : '',
    fm.cookingMethod ? `Methode: ${fm.cookingMethod}.` : '',
    isoDauer(fm.totalTime) ? `Gesamtzeit: ${isoDauer(fm.totalTime)}.` : '',
    zutaten ? `Zutaten (für ${fm.servings ?? '?'} Personen): ${zutaten}.` : '',
  ].filter(Boolean).join(' ')

  const inhalt = clip(`${kopf} ${flatten(content)}`.replace(/\s+/g, ' ').trim(), MAX_CONTENT)

  rows.push([
    cell(fm.title),
    'Rezept',
    cell(fm.meatType ?? fm.kategorie ?? ''),
    cell(fm.difficulty ?? ''),
    cell(Array.isArray(fm.keywords) ? fm.keywords.join(', ') : fm.keywords ?? ''),
    // Route wie src/app/rezepte/[slug]/[recipe] — MIT Kategorie. Bis 15.09.2026 fehlte
    // sie; jeder Link der Rezept-Schmiede (ToolBoxes.tsx) fuehrte auf eine 404-Seite.
    cell(`Steakakademie-Rezept: /rezepte/${fm.kategorie}/${slug}`),
    inhalt,
  ].join('; '))
}

const csv = ['Titel; Kategorie; Cut/Zutat; Schwierigkeit; Keywords; Quelle-Fundstelle; Inhalt_normalisiert', ...rows].join('\n') + '\n'

// --check: nichts schreiben, nur vergleichen. Haengt in `npm run check` (und damit im
// Pflicht-Check „P0-Gates pruefen"): ein neues oder geaendertes Rezept ohne neu erzeugte
// CSV bricht dort ab, statt erst im Unit-Test der CI (PR #310, 05.10.2026).
if (process.argv.includes('--check')) {
  const norm = (s) => s.replace(/\r\n/g, '\n')
  const vorhanden = await readFile(OUT, 'utf8').catch(() => '')
  if (norm(vorhanden) === norm(csv)) {
    console.log(`✅ Kochwissen-CSV aktuell (${rows.length} Rezepte)`)
    process.exit(0)
  }
  const alt = new Set(norm(vorhanden).split('\n'))
  const neu = new Set(norm(csv).split('\n'))
  const geaendert = [...neu].filter((z) => z && !alt.has(z)).map((z) => z.split(';')[0])
  const entfernt  = [...alt].filter((z) => z && !neu.has(z)).map((z) => z.split(';')[0])
  console.error('✗ Kochwissen-CSV ist nicht aktuell — die Rezepte weichen von data/kochwissen/steakakademie-rezepte-1.csv ab.')
  if (geaendert.length) console.error(`  neu oder geaendert (${geaendert.length}): ${geaendert.slice(0, 5).join(' | ')}${geaendert.length > 5 ? ' …' : ''}`)
  if (entfernt.length)  console.error(`  nicht mehr vorhanden (${entfernt.length}): ${entfernt.slice(0, 5).join(' | ')}${entfernt.length > 5 ? ' …' : ''}`)
  console.error('  Abhilfe: node scripts/rezepte-to-kochwissen.mjs  — und die CSV mit-committen.')
  process.exit(1)
}

await writeFile(OUT, csv, 'utf8')
console.log(`✅ ${rows.length} Rezepte → ${OUT}`)
