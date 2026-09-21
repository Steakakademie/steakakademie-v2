#!/usr/bin/env node
/**
 * Content-Quality-Gate (21.09.2026) — läuft in `npm run check`, damit im
 * Workflow „Content-Gates" auf jedem Pull Request. NICHT im prebuild
 * (Architektur-Audit 27.08.2026, Regel 5: Inhalts-Gates nur in check/CI).
 *
 * Prüft alle MDX unter content/ mit den Regeln aus scripts/lib/content-qualitaet.mjs:
 *   mdx-parse · frontmatter-parse · abgeschnitten · wortdopplung · fahrenheit ·
 *   fahrenheit-verdacht · kerntemperatur-sicherheit · tierart-konflikt ·
 *   glossar-dublette · bild-motiv
 *
 * RATCHET statt Big Bang: Befunde, die es beim Einführen schon gab, stehen in
 * data/content-qualitaet-baseline.json und blockieren nicht — NEUE schon.
 * Ein Befund verschwindet aus der Baseline nur durch Beheben + `--update-baseline`.
 * Damit wird der Bestand nie schlechter, und jede Korrektur ist dauerhaft.
 *
 * Exitcodes: 0 = keine neuen Fehler · 1 = neue Fehler · 2 = Skriptfehler
 * Warnungen (schwere: warnung) blockieren nie.
 *
 * Usage:
 *   node scripts/check-content-qualitaet.mjs                    # Gate
 *   node scripts/check-content-qualitaet.mjs --alle             # auch Baseline-Befunde zeigen
 *   node scripts/check-content-qualitaet.mjs --update-baseline  # Baseline neu schreiben (nur nach Review!)
 *   node scripts/check-content-qualitaet.mjs content/rezepte/x.mdx  # nur diese Dateien
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, appendFileSync } from 'fs'
import { join, dirname, relative, basename, sep } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'
import { pruefeDokument, glossarDublette } from './lib/content-qualitaet.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'content')
const BASELINE = join(ROOT, 'data', 'content-qualitaet-baseline.json')
const args = process.argv.slice(2)
const ALLE = args.includes('--alle')
const UPDATE = args.includes('--update-baseline')
const nurDateien = args.filter(a => !a.startsWith('--'))

// _archiv wird nicht ausgeliefert; terms.json/.processed.json sind keine Seiten.
const AUSGENOMMEN = new Set(['_archiv'])

function alleDateien () {
  const out = []
  for (const bereich of readdirSync(CONTENT)) {
    const dir = join(CONTENT, bereich)
    if (AUSGENOMMEN.has(bereich) || !statSync(dir).isDirectory()) continue
    for (const f of readdirSync(dir)) if (/\.mdx?$/.test(f)) out.push(join(dir, f))
  }
  return out.sort()
}

function fingerprint (b) {
  // Ohne Zeilennummer: Einfügungen weiter oben dürfen einen Baseline-Befund
  // nicht zu einem „neuen" machen. Auszug normalisiert auf Wortzeichen.
  const auszug = String(b.auszug || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 80)
  return createHash('sha1').update(`${b.regel}|${b.datei}|${auszug}`).digest('hex').slice(0, 16)
}

const glossarBestand = new Set(
  readdirSync(join(CONTENT, 'glossar')).filter(f => f.endsWith('.mdx')).map(f => f.replace(/\.mdx$/, '')),
)

const dateien = nurDateien.length ? nurDateien.map(p => join(ROOT, p)) : alleDateien()
const befunde = []
for (const abs of dateien) {
  if (!existsSync(abs)) continue
  const datei = relative(ROOT, abs).split(sep).join('/')
  const bereich = datei.split('/')[1] || ''
  const slug = basename(abs).replace(/\.mdx?$/, '')
  for (const b of pruefeDokument(readFileSync(abs, 'utf8'), { bereich, slug })) befunde.push({ ...b, datei })
  if (bereich === 'glossar') {
    const rest = new Set(glossarBestand); rest.delete(slug)
    const d = glossarDublette(slug, rest)
    if (d) befunde.push({ regel: 'glossar-dublette', schwere: 'fehler', text: d.grund, auszug: `${slug} → ${d.kanonisch}`, datei })
  }
}
for (const b of befunde) b.id = fingerprint(b)

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : { befunde: [] }
const bekannt = new Set(baseline.befunde.map(b => b.id))
const fehler = befunde.filter(b => b.schwere === 'fehler')

if (UPDATE) {
  if (nurDateien.length) { console.error('--update-baseline nur ohne Dateiliste (sonst fällt der Rest raus).'); process.exit(2) }
  const neu = {
    hinweis: 'Bekannte Befunde beim Einführen des Gates. Nicht von Hand ergänzen — beheben statt eintragen. Neu schreiben: node scripts/check-content-qualitaet.mjs --update-baseline',
    stand: new Date().toISOString().slice(0, 10),
    befunde: fehler.map(({ id, regel, datei, text }) => ({ id, regel, datei, text })).sort((a, b) => (a.datei + a.regel).localeCompare(b.datei + b.regel)),
  }
  writeFileSync(BASELINE, JSON.stringify(neu, null, 2) + '\n')
  console.log(`Baseline geschrieben: ${neu.befunde.length} Befunde (vorher ${baseline.befunde.length}).`)
  process.exit(0)
}

const neueFehler = fehler.filter(b => !bekannt.has(b.id))
const altFehler = fehler.filter(b => bekannt.has(b.id))
const warnungen = befunde.filter(b => b.schwere === 'warnung')
const gefunden = new Set(fehler.map(b => b.id))
const behoben = nurDateien.length ? [] : baseline.befunde.filter(b => !gefunden.has(b.id))

const zeile = b => `  ${b.datei}  [${b.regel}] ${b.text}${b.auszug ? `\n      „${b.auszug}"` : ''}`
console.log(`Content-Qualität: ${dateien.length} Dateien · ${neueFehler.length} neue Fehler · ${altFehler.length} bekannt (Baseline) · ${warnungen.length} Warnungen`)
if (neueFehler.length) console.log('\n✗ NEUE FEHLER (blockieren):\n' + neueFehler.map(zeile).join('\n'))
if (warnungen.length) console.log('\n⚠ Warnungen (blockieren nicht):\n' + warnungen.map(zeile).join('\n'))
if (ALLE && altFehler.length) console.log('\n· Bekannt aus Baseline:\n' + altFehler.map(zeile).join('\n'))
if (behoben.length) console.log(`\n✓ ${behoben.length} Baseline-Befund(e) behoben — Baseline verkleinern: node scripts/check-content-qualitaet.mjs --update-baseline\n` + behoben.map(b => `  ${b.datei}  [${b.regel}]`).join('\n'))

// GitHub-Job-Summary: Ergebnis sichtbar, ohne das Log zu öffnen.
if (process.env.GITHUB_STEP_SUMMARY) {
  const md = [`### Content-Qualität`, `${neueFehler.length} neue Fehler · ${altFehler.length} bekannt · ${warnungen.length} Warnungen · ${behoben.length} behoben`,
    ...neueFehler.map(b => `- ❌ \`${b.datei}\` **${b.regel}** — ${b.text}`)].join('\n')
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n')
}
process.exit(neueFehler.length ? 1 : 0)
