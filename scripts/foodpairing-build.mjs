#!/usr/bin/env node
/**
 * Steakakademie — Foodpairing-Build (v2, 28.09.2026)
 *
 * Erzeugt data/foodpairing/ingr_comp.tsv aus den Belegen. EINE Quelle der Wahrheit:
 *
 *   belege.tsv     Zutat → Aromastoff, eine Zeile je Fachquelle (DOI + geöffnete URL)
 *   ingr_info.tsv  stabile Zutaten-IDs (von Hand gepflegt)
 *   comp_info.tsv  stabile Stoff-IDs, CAS, Hub-Rolle (von Hand gepflegt)
 *        ↓
 *   ingr_comp.tsv  Kanten (generiert) — ingredient_id  compound_id  evidenz  quellen
 *
 * Neue Zutat/neuer Stoff: Zeile(n) in belege.tsv, ID in ingr_info/comp_info, dann
 * `npm run foodpairing:build`. Nichts in ingr_comp.tsv von Hand ändern.
 *
 * Prüft (bricht mit Exit 1 ab):
 *   - jede Belegzeile verweist auf eine bekannte Zutat und einen bekannten Stoff
 *   - jede Belegzeile hat Quelle und geöffnete URL; Evidenz ist A oder B
 *   - jede Zutat und jeder Stoff hat mindestens eine Kante
 *   - jede Zutat dockt an mindestens einen Hub an (Regel aroma_ingredient_ohne_hub)
 *   - CAS-Nummern haben das Format NNNNNNN-NN-N
 *
 * Usage:
 *   node scripts/foodpairing-build.mjs          # schreibt ingr_comp.tsv
 *   node scripts/foodpairing-build.mjs --check  # prüft nur, ob ingr_comp.tsv aktuell ist
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'data', 'foodpairing')
const CHECK = process.argv.includes('--check')

function rows(file) {
  return readFileSync(join(DIR, file), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => l.split('\t').map((c) => c.trim()))
}

const fehler = []

const zutaten = new Map() // name -> id
for (const [id, name] of rows('ingr_info.tsv')) zutaten.set(name, Number(id))

const stoffe = new Map() // name -> { id, hub }
for (const [id, name, cas = '', hub = ''] of rows('comp_info.tsv')) {
  if (cas && !/^\d{2,7}-\d{2}-\d$/.test(cas)) fehler.push(`CAS-Format ungültig: ${name} (${cas})`)
  stoffe.set(name, { id: Number(id), hub: !!hub })
}

const [kopf, ...belege] = rows('belege.tsv')
const spalte = Object.fromEntries(kopf.map((k, i) => [k, i]))
const kanten = new Map() // "iid\tcid" -> { evidenz:Set, quellen:Set }

belege.forEach((b, n) => {
  const zeile = n + 1
  const z = b[spalte.zutat], s = b[spalte.stoff], ev = b[spalte.evidenz]
  const quelle = b[spalte.quelle], url = b[spalte.url]
  if (!zutaten.has(z)) fehler.push(`Beleg ${zeile}: unbekannte Zutat „${z}"`)
  if (!stoffe.has(s)) fehler.push(`Beleg ${zeile}: unbekannter Stoff „${s}"`)
  if (!quelle || !url) fehler.push(`Beleg ${zeile}: Quelle oder URL fehlt (${z} / ${s})`)
  if (ev !== 'A' && ev !== 'B') fehler.push(`Beleg ${zeile}: Evidenz „${ev}" ist weder A noch B`)
  if (!zutaten.has(z) || !stoffe.has(s)) return
  const key = `${zutaten.get(z)}\t${stoffe.get(s).id}`
  const k = kanten.get(key) ?? { evidenz: new Set(), quellen: new Set() }
  k.evidenz.add(ev)
  k.quellen.add(quelle)
  kanten.set(key, k)
})

const mitKante = new Set([...kanten.keys()].map((k) => Number(k.split('\t')[0])))
const stoffMitKante = new Set([...kanten.keys()].map((k) => Number(k.split('\t')[1])))
const hubIds = new Set([...stoffe.values()].filter((s) => s.hub).map((s) => s.id))
const mitHub = new Set(
  [...kanten.keys()].map((k) => k.split('\t').map(Number)).filter(([, c]) => hubIds.has(c)).map(([i]) => i),
)
for (const [name, id] of zutaten) {
  if (!mitKante.has(id)) fehler.push(`Zutat ohne Beleg: ${name}`)
  else if (!mitHub.has(id)) fehler.push(`Zutat dockt an keinen Hub an: ${name}`)
}
for (const [name, { id }] of stoffe) if (!stoffMitKante.has(id)) fehler.push(`Stoff ohne Beleg: ${name}`)

if (fehler.length) {
  console.error(`✖ Foodpairing-Build: ${fehler.length} Fehler`)
  for (const f of fehler) console.error('  - ' + f)
  process.exit(1)
}

const sortiert = [...kanten.entries()].sort(([a], [b]) => {
  const [ai, ac] = a.split('\t').map(Number), [bi, bc] = b.split('\t').map(Number)
  return ai - bi || ac - bc
})
const text =
  '# Kanten Zutat→Aromastoff — GENERIERT von scripts/foodpairing-build.mjs aus belege.tsv. Nicht von Hand ändern.\n' +
  '# ingredient_id\tcompound_id\tevidenz (A/B, bestes)\tquellen\n' +
  sortiert
    .map(([key, k]) => `${key}\t${k.evidenz.has('A') ? 'A' : 'B'}\t${[...k.quellen].sort().join('; ')}`)
    .join('\n') +
  '\n'

const ziel = join(DIR, 'ingr_comp.tsv')
if (CHECK) {
  if (readFileSync(ziel, 'utf8') !== text) {
    console.error('✖ ingr_comp.tsv ist nicht aktuell — `npm run foodpairing:build` ausführen.')
    process.exit(1)
  }
  console.log(`✅ Foodpairing: ${zutaten.size} Zutaten · ${stoffe.size} Stoffe · ${kanten.size} Kanten · ${belege.length} Belege — aktuell.`)
} else {
  writeFileSync(ziel, text)
  console.log(`✅ ingr_comp.tsv geschrieben: ${zutaten.size} Zutaten · ${stoffe.size} Stoffe · ${kanten.size} Kanten aus ${belege.length} Belegen.`)
}
