#!/usr/bin/env node
/**
 * Taxonomie-Linter (21.09.2026) — läuft in `npm run check`, damit im Workflow
 * „Content-Gates" auf jedem Pull Request.
 *
 * data/taxonomie.yaml ist die Single Source of Truth für Glossar-Hauptbegriffe
 * (`glossar_synonyme`: Variante → kanonischer Slug). Dieses Skript gleicht
 * docs/glossar-konsolidierung-kandidaten.md dagegen ab und bricht ab, wenn die
 * Kandidatenliste der Taxonomie in einem OFFENEN Vorschlag widerspricht:
 *
 *   • kanonisch-als-kandidat — ein Slug, den die Taxonomie als Hauptbegriff
 *     führt, steht noch als `pruefen` (Cluster-Tabelle) bzw. als „301 von"
 *     (Paar-Tabelle), soll also wegkonsolidiert werden.
 *   • variante-als-hub — der vorgeschlagene Hub ist in der Taxonomie nur eine
 *     Variante eines anderen Hauptbegriffs (Muster: packer-cut vs.
 *     packer-brisket vor dem 21.09.2026).
 *
 * KEIN Konflikt: Eine Variante aus `glossar_synonyme`, die in der Liste noch
 * offen steht. Der Synonym-Eintrag verhindert nur Neuanlagen; die
 * Zusammenlegung selbst wartet laut taxonomie.yaml bewusst auf GSC-Daten.
 *
 * Erledigte Zeilen (durchgestrichen ~~…~~, ✅, „erledigt") werden übersprungen.
 *
 * Exitcodes: 0 = kein Konflikt · 1 = Konflikt · 2 = Skriptfehler
 *
 * Usage: node scripts/check-taxonomy.mjs
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TAXONOMIE = 'data/taxonomie.yaml'
const KANDIDATEN = 'docs/glossar-konsolidierung-kandidaten.md'

let synonyme, kandidatenText
try {
  const tax = yaml.load(readFileSync(join(ROOT, TAXONOMIE), 'utf8'))
  synonyme = tax?.glossar_synonyme
  if (!synonyme || typeof synonyme !== 'object') throw new Error(`${TAXONOMIE}: glossar_synonyme fehlt`)
  kandidatenText = readFileSync(join(ROOT, KANDIDATEN), 'utf8')
} catch (e) {
  console.error(`✗ check-taxonomy: ${e.message}`)
  process.exit(2)
}

// Hauptbegriff → Varianten, damit die Meldung zeigt, woher der Status kommt
const kanonisch = new Map()
for (const [variante, haupt] of Object.entries(synonyme)) {
  if (!kanonisch.has(haupt)) kanonisch.set(haupt, [])
  kanonisch.get(haupt).push(variante)
}

const istErledigt = zeile => /~~|✅|erledigt/i.test(zeile)
const slugs = text => [...text.matchAll(/`([a-z0-9-]+)`/g)].map(m => m[1])
const zellen = zeile => zeile.trim().replace(/^\||\|$/g, '').split('|').map(z => z.trim())

const konflikte = []
const melde = (zeileNr, slug, art, text) => konflikte.push({ zeileNr, slug, art, text })

// Hub eines Clusters: taxonomisch eine Variante?
const pruefeHub = (zeileNr, hub) => {
  if (hub in synonyme) {
    melde(zeileNr, hub, 'variante-als-hub',
      `als Hub vorgeschlagen, laut ${TAXONOMIE} aber Variante von \`${synonyme[hub]}\``)
  }
}
// Slug soll wegkonsolidiert werden: taxonomisch ein Hauptbegriff?
const pruefeKandidat = (zeileNr, slug) => {
  if (kanonisch.has(slug)) {
    const von = kanonisch.get(slug).map(v => `\`${v}\``).join(', ')
    melde(zeileNr, slug, 'kanonisch-als-kandidat',
      `noch als Zusammenlege-Kandidat offen, ist laut ${TAXONOMIE} aber Hauptbegriff (für ${von})`)
  }
}

let kopf = null
kandidatenText.split(/\r?\n/).forEach((zeile, i) => {
  const nr = i + 1
  if (!zeile.trim().startsWith('|')) { kopf = null; return }
  const z = zellen(zeile)
  if (!kopf) { kopf = z.map(s => s.toLowerCase()); return }
  if (z.every(s => /^:?-+:?$/.test(s))) return
  if (istErledigt(zeile)) return

  const vorschlagIdx = kopf.indexOf('vorschlag')
  if (vorschlagIdx < 0) return
  const vorschlag = z[vorschlagIdx] ?? ''

  if (kopf[0] === 'slug') {
    // Cluster-Tabelle: | `slug` | … | **Hub** / pruefen |
    const [slug] = slugs(z[0])
    if (!slug) return
    if (/\bhub\b/i.test(vorschlag)) pruefeHub(nr, slug)
    else if (/pruefen|prüfen/i.test(vorschlag)) pruefeKandidat(nr, slug)
  } else if (kopf[0] === 'paar') {
    // Paar-Tabelle: Vorschlag „Hub: `x` … 301 von `y`"
    const hub = vorschlag.match(/Hub:?\**\s*`([a-z0-9-]+)`/i)?.[1]
    const weg = vorschlag.match(/301 von\s*`([a-z0-9-]+)`/i)?.[1]
    if (hub) pruefeHub(nr, hub)
    if (weg) pruefeKandidat(nr, weg)
  }
})

if (konflikte.length) {
  console.error(`✗ check-taxonomy: ${konflikte.length} Widerspruch/Widersprüche zwischen ${TAXONOMIE} und ${KANDIDATEN}\n`)
  for (const k of konflikte) {
    console.error(`  ${KANDIDATEN}:${k.zeileNr}  [${k.art}]  \`${k.slug}\` ${k.text}`)
  }
  console.error(`\n  ${TAXONOMIE} ist maßgeblich. Entweder die Kandidatenzeile angleichen/erledigen`)
  console.error(`  oder — wenn die Taxonomie falsch ist — dort korrigieren.`)
  process.exit(1)
}

console.log(`✓ check-taxonomy: Kandidatenliste widerspricht ${TAXONOMIE} nicht (${kanonisch.size} Hauptbegriffe, ${Object.keys(synonyme).length} Varianten)`)
