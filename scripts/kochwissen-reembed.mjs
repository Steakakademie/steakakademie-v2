#!/usr/bin/env node
/**
 * Steakakademie — Kochwissen-Re-Embed (Modellwechsel ohne CSV-Replay)
 *
 * Liest alle kochwissen-Zeilen MIT Volltext direkt aus Supabase, erzeugt neue
 * Voyage-Embeddings (Default: voyage-4) und schreibt NUR die embedding-Spalte
 * zurueck. Inhalte, Keywords, Quellen bleiben unangetastet — deshalb ist das
 * sicherer als ein erneuter CSV-Ingest (der Merge-Zustand der Tabelle ist die
 * Wahrheit, nicht die Original-Lieferungen).
 *
 * Embedding-Text identisch zum Ingest: `${titel}\n\n${inhalt}` (input_type
 * 'document'). Idempotent — Abbruch + Neustart ist unkritisch.
 *
 * Usage:
 *   node scripts/kochwissen-reembed.mjs                    # voyage-4, 3-RPM-Drossel
 *   node scripts/kochwissen-reembed.mjs --dry-run          # nur zaehlen
 *   node scripts/kochwissen-reembed.mjs --batch 96 --throttle-ms 0   # mit Zahlungsmethode
 *
 * DANACH (Reihenfolge wichtig, sonst sucht die Query mit dem falschen Modell):
 *   1. VOYAGE_MODEL=voyage-4 in .env.local aktiv (macht dieses Skript-Setup bereits)
 *   2. Vercel-Env VOYAGE_MODEL=voyage-4 + Redeploy (Produktion laeuft auf Vercel)
 *
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(ROOT, '.env.local') })

const args = process.argv.slice(2)
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def
}
const MODEL       = String(flag('model', 'voyage-4'))
const DRY_RUN     = !!flag('dry-run', false)
const BATCH       = parseInt(flag('batch', '16'), 10) || 16
const THROTTLE_MS = parseInt(flag('throttle-ms', '21000'), 10) || 0
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

for (const k of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'VOYAGE_API_KEY']) {
  if (!process.env[k]) { console.error(`❌ ${k} fehlt (.env.local)`); process.exit(1) }
}

async function embedBatch(texts, attempt = 1) {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: texts, model: MODEL, input_type: 'document' }),
  })
  if ((res.status === 429 || res.status >= 500) && attempt < 8) {
    const waitMs = 22000 * attempt
    console.log(`  ⏳ ${res.status} — warte ${Math.round(waitMs / 1000)}s (Versuch ${attempt})`)
    await sleep(waitMs)
    return embedBatch(texts, attempt + 1)
  }
  if (!res.ok) throw new Error(`voyage ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = await res.json()
  return json.data.map((d) => d.embedding)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

// Alle Volltext-Zeilen holen (728 gesamt, ~621 mit Inhalt — Platzhalter bleiben vektorlos)
const { data: rows, error } = await supabase
  .from('kochwissen')
  .select('id, titel, inhalt')
  .not('inhalt', 'is', null)
  .order('id')
if (error) { console.error('❌ Supabase:', error.message); process.exit(1) }

console.log(`\n🔁 Re-Embed kochwissen → ${MODEL}: ${rows.length} Eintraege` +
  `${DRY_RUN ? ' (dry-run, keine Calls)' : ''}\n`)
if (DRY_RUN) process.exit(0)

const startedAt = new Date().toISOString()
let done = 0
for (let i = 0; i < rows.length; i += BATCH) {
  const slice = rows.slice(i, i + BATCH)
  const vecs = await embedBatch(slice.map((r) => `${r.titel}\n\n${r.inhalt}`))
  for (let j = 0; j < slice.length; j++) {
    const { error: upErr } = await supabase
      .from('kochwissen')
      .update({ embedding: vecs[j], updated_at: new Date().toISOString() })
      .eq('id', slice[j].id)
    if (upErr) throw new Error(`Update ${slice[j].id}: ${upErr.message}`)
  }
  done += slice.length
  console.log(`  ${done}/${rows.length}`)
  if (THROTTLE_MS > 0 && i + BATCH < rows.length) await sleep(THROTTLE_MS)
}

console.log(`\n🏁 Fertig: ${done} Embeddings auf ${MODEL} (seit ${startedAt}).`)
console.log('   Naechster Schritt: VOYAGE_MODEL im Vercel-Projekt setzen + Redeploy.\n')
