#!/usr/bin/env node
/**
 * Steakakademie — Kochwissen: Anker-Auflösung
 *
 * Index-Platzhalter (Eintraege ohne Volltext, z.B. aus wissensdatenbank-1 mit
 * Seitenzahl "S. 267") werden ueber ihren `quelle_key`-Anker mit spaeter
 * gelieferten Volltexten DERSELBEN Quelle zusammengefuehrt.
 *
 * Sicherheit: Es wird nur innerhalb derselben `source` und bei ausreichender
 * Titel-Aehnlichkeit (Token-Jaccard) gemerged — kein Vermischen verschiedener
 * Buecher. Default ist Report-only; erst `--apply` schreibt.
 *
 * Vorgehen pro Platzhalter (inhalt IS NULL, quelle_key gesetzt):
 *   1. Kandidaten = Volltext-Eintraege mit gleicher (source, quelle_key)
 *   2. besten Kandidaten nach Titel-Aehnlichkeit waehlen
 *   3. --apply & score>=min: inhalt + keywords uebernehmen, Embedding neu (Voyage)
 *
 * Usage:
 *   node scripts/kochwissen-resolve-anchors.mjs                 # Report
 *   node scripts/kochwissen-resolve-anchors.mjs --apply         # Zusammenfuehren
 *   node scripts/kochwissen-resolve-anchors.mjs --source mcgee --min-score 0.4 --apply
 *
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
dotenv.config({ path: join(ROOT, '.env.local') })

const args = process.argv.slice(2)
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d
}
const APPLY     = !!flag('apply', false)
const SOURCE    = flag('source', null)
const MIN_SCORE = parseFloat(flag('min-score', '0.5'))
const MODEL     = flag('model', process.env.VOYAGE_MODEL ?? 'voyage-4')   // wie kochwissen-ingest.mjs

// ─── Titel-Aehnlichkeit (Token-Jaccard) ───────────────────────────────────────
const STOP = new Set(['der','die','das','und','oder','mit','ohne','fuer','von','bei','im','in','am','zum','zur','des','ein','eine'])
const tokens = (s) =>
  new Set(
    (s || '')
      .toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3 && !STOP.has(t)),
  )
const jaccard = (a, b) => {
  const A = tokens(a), B = tokens(b)
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  return inter / (A.size + B.size - inter)
}

// ─── Voyage-Embedding (fuer den gemergten Eintrag) ────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function embed(text, attempt = 0) {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` },
    body: JSON.stringify({ input: [text], model: MODEL, input_type: 'document' }),
  })
  // 429 (Rate-Limit) / 5xx: mit Backoff erneut versuchen (Gratis-Tier: 3 RPM / 10K TPM)
  if ((res.status === 429 || res.status >= 500) && attempt < 6) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '', 10)
    const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : Math.min(60000, 15000 * 2 ** attempt)
    console.log(`  ⏳ Voyage ${res.status} — warte ${Math.round(waitMs / 1000)}s (Versuch ${attempt + 1}/6)`)
    await sleep(waitMs)
    return embed(text, attempt + 1)
  }
  if (!res.ok) throw new Error(`Voyage ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return json.data[0].embedding
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  )

  let phQ = supabase.from('kochwissen')
    .select('id, source, titel, quelle, quelle_key, keywords')
    .is('inhalt', null)
    .not('quelle_key', 'is', null)
  if (SOURCE) phQ = phQ.eq('source', SOURCE)
  const { data: placeholders, error: e1 } = await phQ
  if (e1) throw new Error(`Platzhalter laden: ${e1.message}`)

  let ftQ = supabase.from('kochwissen')
    .select('id, source, titel, quelle_key, inhalt, keywords')
    .not('inhalt', 'is', null)
    .not('quelle_key', 'is', null)
  if (SOURCE) ftQ = ftQ.eq('source', SOURCE)
  const { data: fulltexts, error: e2 } = await ftQ
  if (e2) throw new Error(`Volltexte laden: ${e2.message}`)

  // Index: (source|quelle_key) -> Volltext-Kandidaten
  const byAnchor = new Map()
  for (const f of fulltexts) {
    const k = `${f.source}|${f.quelle_key}`
    if (!byAnchor.has(k)) byAnchor.set(k, [])
    byAnchor.get(k).push(f)
  }

  console.log(
    `Platzhalter mit Anker: ${placeholders.length}` +
    (SOURCE ? ` (source=${SOURCE})` : '') +
    ` | Volltexte mit Anker: ${fulltexts.length} | min-score=${MIN_SCORE} | ${APPLY ? 'APPLY' : 'REPORT'}`,
  )

  let resolved = 0, noCand = 0, lowScore = 0
  for (const p of placeholders) {
    const cands = byAnchor.get(`${p.source}|${p.quelle_key}`) || []
    if (cands.length === 0) { noCand++; continue }

    let best = null, bestScore = -1
    for (const c of cands) {
      const s = jaccard(p.titel, c.titel)
      if (s > bestScore) { best = c; bestScore = s }
    }

    const mark = bestScore >= MIN_SCORE ? '✓' : '·'
    console.log(`  ${mark} [${bestScore.toFixed(2)}] "${p.titel}" (${p.quelle})  ⇐  "${best.titel}"`)

    if (bestScore < MIN_SCORE) { lowScore++; continue }

    if (APPLY) {
      const keywords = Array.from(new Set([...(p.keywords || []), ...(best.keywords || [])]))
      const embedding = await embed(`${p.titel}\n\n${best.inhalt}`)
      const { error } = await supabase.from('kochwissen')
        .update({ inhalt: best.inhalt, keywords, embedding, updated_at: new Date().toISOString() })
        .eq('id', p.id)
      if (error) throw new Error(`Update ${p.id}: ${error.message}`)
    }
    resolved++
  }

  console.log(
    `\n${APPLY ? '✅ Aufgeloest' : 'Aufloesbar'}: ${resolved} | ` +
    `unsichere Treffer (<min): ${lowScore} | ohne Kandidat: ${noCand}`,
  )
  if (!APPLY && resolved > 0) console.log('   → mit --apply ausfuehren, um zusammenzufuehren.')
}

main().catch((e) => { console.error('❌', e.message); process.exit(1) })
