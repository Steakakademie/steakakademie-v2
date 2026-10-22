#!/usr/bin/env node
/**
 * Tagesfakten (M1 / C24, 22.10.2026): eine Zeile je Tag nach public.tagesfakten.
 *
 *   node scripts/tagesfakten.mjs                 # gestern (UTC)
 *   node scripts/tagesfakten.mjs --tag 2026-10-21
 *   node scripts/tagesfakten.mjs --dry-run       # zaehlen, nicht schreiben
 *
 * Quellen und ihre Grenzen (ehrlich, siehe docs/tagesfakten.md):
 *   kaeufe/erstattungen  digistore_orders (Supabase)      — immer
 *   widerrufe            widerrufe (Supabase)             — immer
 *   besucher             Plausible Stats API v2           — nur mit PLAUSIBLE_API_KEY
 *   produkt_klicks       Plausible-Ziel „Affiliate-Klick"  — nur mit PLAUSIBLE_API_KEY
 *   anmeldungen/bestaetigungen  Loops hat keine Tageszaehlung per API — NULL, bis eine
 *                        Quelle da ist (Plausible-Ziel oder Export)
 *   provisionen_cent     Awin/Amazon-Berichte — NULL, bis ein Berichtszugang da ist
 *
 * Regel 10 (CLAUDE.md): Fehlt die Tabelle oder scheitert das Schreiben, ist der
 * Lauf rot. NULL-Spalten sind kein Fehler — sie stehen mit Grund in `quellen`.
 */
import { createClient } from '@supabase/supabase-js'
import { appendFileSync } from 'node:fs'
import { zielTag, tagesFenster, zaehleBestellungen, baueZeile, bilanz } from './lib/tagesfakten.mjs'

const argv = process.argv.slice(2)
const DRY = argv.includes('--dry-run') || process.env.IN_DRY_RUN === 'true'
const tag = zielTag(argv)
const { von, bis } = tagesFenster(tag)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen')
  process.exit(1)
}
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function bestellungen () {
  const { data, error } = await db
    .from('digistore_orders').select('ds_event, processing_status')
    .gte('created_at', von).lt('created_at', bis)
  if (error) return { fehlt: `digistore_orders: ${error.message}` }
  const r = zaehleBestellungen(data)
  return { kaeufe: { wert: r.kaeufe, quelle: 'digistore_orders' }, erstattungen: { wert: r.erstattungen, quelle: 'digistore_orders' } }
}

async function widerrufe () {
  const { count, error } = await db
    .from('widerrufe').select('*', { count: 'exact', head: true })
    .gte('created_at', von).lt('created_at', bis)
  if (error) return { fehlt: `widerrufe: ${error.message}` }
  return { wert: count ?? 0, quelle: 'widerrufe' }
}

async function plausible (metrik, filters) {
  const apiKey = process.env.PLAUSIBLE_API_KEY
  if (!apiKey) return { fehlt: 'PLAUSIBLE_API_KEY fehlt' }
  const site = process.env.PLAUSIBLE_SITE_ID || 'steakakademie.de'
  try {
    const res = await fetch('https://plausible.io/api/v2/query', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id: site, metrics: [metrik], date_range: [tag, tag], ...(filters ? { filters } : {}) }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return { fehlt: `Plausible HTTP ${res.status}` }
    const j = await res.json()
    const v = j?.results?.[0]?.metrics?.[0]
    if (typeof v !== 'number') return { fehlt: 'Plausible: keine Zahl in der Antwort' }
    return { wert: v, quelle: `plausible:${metrik}${filters ? ':Affiliate-Klick' : ''}` }
  } catch (e) {
    return { fehlt: `Plausible: ${e.message}` }
  }
}

const b = await bestellungen()
const zeile = baueZeile(tag, {
  besucher: await plausible('visitors'),
  produkt_klicks: await plausible('events', [['is', 'event:goal', ['Affiliate-Klick']]]),
  anmeldungen: { fehlt: 'keine Tageszaehlung in Loops (docs/tagesfakten.md)' },
  bestaetigungen: { fehlt: 'keine Tageszaehlung in Loops (docs/tagesfakten.md)' },
  kaeufe: b.kaeufe ?? b,
  erstattungen: b.erstattungen ?? b,
  widerrufe: await widerrufe(),
  provisionen_cent: { fehlt: 'kein Awin/Amazon-Berichtszugang' },
})

const text = bilanz(zeile)
console.log(text)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n')

// Pflichtquellen: ohne Datenbankzahlen ist die Zeile wertlos — rot, nicht NULL.
if (String(zeile.quellen.kaeufe).startsWith('fehlt:') || String(zeile.quellen.widerrufe).startsWith('fehlt:')) {
  console.error('Pflichtquelle fehlt:', zeile.quellen.kaeufe, zeile.quellen.widerrufe)
  process.exit(1)
}

if (DRY) {
  console.log('(Trockenlauf — nichts geschrieben)')
  process.exit(0)
}

const { error } = await db.from('tagesfakten').upsert({ ...zeile, erfasst_at: new Date().toISOString() }, { onConflict: 'tag' })
if (error) {
  const hinweis = /tagesfakten/.test(error.message) && /not exist|schema cache/.test(error.message)
    ? ' — Tabelle fehlt: Migration 20261022210000_tagesfakten.sql anwenden.'
    : ''
  console.error(`Schreiben nach tagesfakten gescheitert: ${error.message}${hinweis}`)
  process.exit(1)
}
console.log(`Geschrieben: tagesfakten ${tag}`)
