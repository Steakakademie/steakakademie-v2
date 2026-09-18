#!/usr/bin/env node
/**
 * Kochwissen — Schluessel-Migration nach Aenderung von scripts/lib/kochwissen-schluessel.mjs
 *
 * Liest ALLE Zeilen der Tabelle `kochwissen` (nur lesend), berechnet titel_key und
 * quelle_key mit der aktuellen Normalisierung neu und
 *   - meldet, wie viele Schluessel sich je source aendern,
 *   - prueft Kollisionen gegen den Unique-Index (source, titel_key),
 *   - schreibt mit --sql <datei> eine SQL-Migration mit einem UPDATE je geaenderter
 *     Zeile, abgesichert ueber id UND den alten Schluessel (laeuft sie zweimal oder hat
 *     sich die Zeile inzwischen geaendert, passiert nichts).
 *
 * Schreibt NIE selbst in die Datenbank. Die SQL-Datei wird geprueft und eingespielt.
 *
 * Usage:
 *   node scripts/kochwissen-rekey.mjs                       # nur Bericht
 *   node scripts/kochwissen-rekey.mjs --sql supabase/migrations/<ts>_kochwissen_umlaut_schluessel.sql
 *
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { titelKey, quelleKey } from './lib/kochwissen-schluessel.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(ROOT, '.env.local'), quiet: true })

const args = process.argv.slice(2)
const SQL_OUT = args.includes('--sql') ? args[args.indexOf('--sql') + 1] : null

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

async function alleZeilen () {
  const zeilen = []
  for (let von = 0; ; von += 1000) {
    const { data, error } = await supabase
      .from('kochwissen')
      .select('id, source, titel, titel_key, quelle, quelle_key')
      .order('id')
      .range(von, von + 999)
    if (error) throw new Error(`Supabase select: ${error.message}`)
    zeilen.push(...data)
    if (data.length < 1000) return zeilen
  }
}

const sqlText = (v) => (v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)

const zeilen = await alleZeilen()
const plan = zeilen.map((z) => ({
  ...z,
  neu_titel_key: titelKey(z.titel),
  neu_quelle_key: quelleKey(z.source, z.quelle),
}))
const aenderungen = plan.filter((z) => z.neu_titel_key !== z.titel_key || z.neu_quelle_key !== z.quelle_key)

// Bericht je source
const jeSource = {}
for (const z of plan) {
  const s = (jeSource[z.source] ??= { zeilen: 0, titel_key: 0, quelle_key: 0 })
  s.zeilen++
  if (z.neu_titel_key !== z.titel_key) s.titel_key++
  if (z.neu_quelle_key !== z.quelle_key) s.quelle_key++
}
console.log(`Zeilen gesamt: ${zeilen.length} · zu aendern: ${aenderungen.length}`)
console.table(jeSource)

// Kollisionen: Endzustand muss (source, titel_key) eindeutig sein.
const endzustand = new Map()
for (const z of plan) {
  const k = `${z.source}|${z.neu_titel_key}`
  endzustand.set(k, [...(endzustand.get(k) ?? []), z])
}
const kollisionen = [...endzustand.values()].filter((g) => g.length > 1)
console.log(`Kollisionen im Endzustand: ${kollisionen.length}`)
for (const g of kollisionen) {
  console.log(`  ${g[0].source} | ${g[0].neu_titel_key}`)
  for (const z of g) console.log(`    - ${z.id} | "${z.titel}" | alt: ${z.titel_key}`)
}

// Reihenfolge-Konflikte: neuer Schluessel == ALTER Schluessel einer anderen Zeile derselben source.
const alteSchluessel = new Map(plan.map((z) => [`${z.source}|${z.titel_key}`, z.id]))
const zwischenkonflikte = aenderungen.filter((z) => {
  const belegt = alteSchluessel.get(`${z.source}|${z.neu_titel_key}`)
  return belegt && belegt !== z.id
})
console.log(`Reihenfolge-Konflikte (neuer Schluessel = alter Schluessel einer anderen Zeile): ${zwischenkonflikte.length}`)

if (SQL_OUT) {
  if (kollisionen.length) {
    console.error('Abbruch: Kollisionen im Endzustand — erst aufloesen, keine SQL-Datei geschrieben.')
    process.exit(1)
  }
  const kopf = [
    `-- Kochwissen: titel_key/quelle_key mit korrigierter Umlaut-Normalisierung neu berechnet.`,
    `-- Erzeugt von scripts/kochwissen-rekey.mjs am ${new Date().toISOString()} aus ${zeilen.length} Zeilen.`,
    `-- ${aenderungen.length} UPDATEs, je abgesichert ueber id + alten Schluessel (wiederholbar ohne Wirkung).`,
    `-- Kollisionen im Endzustand: 0 · Reihenfolge-Konflikte: ${zwischenkonflikte.length}.`,
    '',
  ]
  // Bei Reihenfolge-Konflikten erst auf eindeutige Zwischenwerte, dann auf den Endwert.
  const zwischen = zwischenkonflikte.length
    ? aenderungen.map((z) => `UPDATE public.kochwissen SET titel_key = ${sqlText(`rekey-${z.id}`)} WHERE id = ${sqlText(z.id)} AND titel_key = ${sqlText(z.titel_key)};`)
    : []
  const final = aenderungen.map((z) => {
    const altTitel = zwischenkonflikte.length ? `rekey-${z.id}` : z.titel_key
    return `UPDATE public.kochwissen SET titel_key = ${sqlText(z.neu_titel_key)}, quelle_key = ${sqlText(z.neu_quelle_key)} ` +
      `WHERE id = ${sqlText(z.id)} AND titel_key = ${sqlText(altTitel)} AND quelle_key IS NOT DISTINCT FROM ${sqlText(z.quelle_key)};`
  })
  await writeFile(join(ROOT, SQL_OUT), [...kopf, ...zwischen, ...(zwischen.length ? [''] : []), ...final, ''].join('\n'), 'utf8')
  console.log(`SQL geschrieben: ${SQL_OUT} (${final.length} UPDATEs${zwischen.length ? ` + ${zwischen.length} Zwischenschritte` : ''})`)
}
