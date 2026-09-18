#!/usr/bin/env node
/**
 * Steakakademie — Kochwissen-Ingest
 *
 * Liest eine CSV-Lieferung (Format der Wissensdatenbank, ; -getrennt) ein,
 * normalisiert sie, erzeugt Embeddings via Voyage AI und upsertet sie in die
 * Supabase-Tabelle `kochwissen`. Idempotent & inkrementell — beliebig oft
 * ausfuehrbar; neue Lieferungen ergaenzen den Bestand.
 *
 * Pipeline (siehe docs/wissensdatenbank-architektur.md):
 *   1. PARSEN     — CSV (Header-gesteuert; Inhalt = Rest hinter der 6. Spalte)
 *   2. NORMALISIEREN — titel_key (Dedup) + quelle_key (Anker) bilden
 *   3. MERGE      — vorhandenen (source,titel_key)-Eintrag ergaenzen statt duplizieren;
 *                   Index-Platzhalter ohne Inhalt wird mit spaeterem Volltext gefuellt
 *   4. EMBEDDING  — nur wenn Inhalt vorhanden (Platzhalter bleiben ohne Vektor)
 *   5. UPSERT     — nach Supabase (service_role)
 *
 * CSV-Spalten (Header, case-insensitive):
 *   Titel; Kategorie; Cut/Zutat; Schwierigkeit; Keywords; Quelle-Fundstelle; Inhalt_normalisiert
 *   (Die Inhaltsspalte darf fehlen -> reiner Index-/Platzhalter-Import.)
 *
 * Usage:
 *   node scripts/kochwissen-ingest.mjs --file daten/wissen2.csv --source modernist
 *   node scripts/kochwissen-ingest.mjs --file daten/wissen1.csv --source mcgee --dry-run
 *
 * Env (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { titelKey, quelleKey as ankerFuer } from './lib/kochwissen-schluessel.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
dotenv.config({ path: join(ROOT, '.env.local') })

// ─── CLI ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const flag = (name, def = undefined) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def
}
const FILE      = flag('file')
const MODEL     = flag('model', 'voyage-3.5')   // 1024 Dimensionen (passt zu vector(1024))
const DRY_RUN   = !!flag('dry-run', false)
// Gratis-Voyage (ohne Zahlungsmethode) drosselt auf 3 RPM / 10K TPM. Daher kleine
// Batches + Pause zwischen Requests; mit Zahlungsmethode: --batch 96 --throttle-ms 0
const BATCH       = parseInt(flag('batch', '16'), 10) || 16        // Voyage-Batchgroesse fuer Embeddings
const THROTTLE_MS = parseInt(flag('throttle-ms', '21000'), 10) || 0 // Pause zwischen Embedding-Requests (≤3 RPM)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

if (!FILE) {
  console.error('Fehlt: --file <csv>. Beispiel: --file daten/wissen2.csv --source modernist')
  process.exit(1)
}
const SOURCE = String(flag('source', basename(FILE, extname(FILE))))

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Schluessel-Normalisierung: scripts/lib/kochwissen-schluessel.mjs (getestet). Die
// fruehere lokale slug()-Funktion entfernte Diakritika vor dem Ausschreiben der Umlaute
// und erzeugte fuer "ä"/"ae"-Schreibweisen zwei Schluessel (Fix 15.09.2026).
const slug = titelKey

// Anker fuer spaeteres Aufloesen von Index-Platzhaltern (z.B. "S. 267" -> "modernist:s267")
const quelleKey = (quelle) => ankerFuer(SOURCE, quelle)

const splitKeywords = (s) =>
  (s || '').split(',').map((k) => k.trim()).filter(Boolean)

// CSV: Header-gesteuert; die Inhaltsspalte (letzte) darf ; -freien Fliesstext enthalten,
// wird aber sicherheitshalber als "Rest hinter der vorletzten Spalte" zusammengefuegt.
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const header = lines.shift().split(';').map((h) => h.trim().toLowerCase())
  const col = (re) => header.findIndex((h) => re.test(h))
  const idx = {
    titel:  col(/titel/),
    kat:    col(/kategorie/),
    cut:    col(/cut|zutat/),
    schw:   col(/schwierig/),
    keys:   col(/keyword/),
    quelle: col(/quelle|fundstelle/),
    inhalt: col(/inhalt/),
  }
  const lastFixed = Math.max(idx.titel, idx.kat, idx.cut, idx.schw, idx.keys, idx.quelle)

  return lines.map((line) => {
    const parts = line.split(';')
    // Inhalt = alles ab seiner Spalte wieder zusammengefuegt (falls ; im Text)
    const inhalt =
      idx.inhalt >= 0 && parts.length > idx.inhalt
        ? parts.slice(idx.inhalt).join(';').trim()
        : ''
    const at = (i) => (i >= 0 && i <= lastFixed && parts[i] != null ? parts[i].trim() : '')
    return {
      titel:        at(idx.titel),
      kategorie:    at(idx.kat) || null,
      cut_zutat:    at(idx.cut) || null,
      schwierigkeit: at(idx.schw) || null,
      keywords:     splitKeywords(at(idx.keys)),
      quelle:       at(idx.quelle) || null,
      inhalt:       inhalt || null,
    }
  }).filter((r) => r.titel)
}

// ─── Voyage Embeddings ────────────────────────────────────────────────────────
async function embedBatch(texts, attempt = 0) {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ input: texts, model: MODEL, input_type: 'document' }),
  })
  // 429 (Rate-Limit) / 5xx: mit Backoff erneut versuchen (Gratis-Tier: 3 RPM / 10K TPM)
  if ((res.status === 429 || res.status >= 500) && attempt < 6) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '', 10)
    const waitMs = Number.isFinite(retryAfter)
      ? retryAfter * 1000
      : Math.min(60000, 15000 * 2 ** attempt)
    console.log(`  ⏳ Voyage ${res.status} — warte ${Math.round(waitMs / 1000)}s (Versuch ${attempt + 1}/6)`)
    await sleep(waitMs)
    return embedBatch(texts, attempt + 1)
  }
  if (!res.ok) throw new Error(`Voyage ${res.status}: ${await res.text()}`)
  const json = await res.json()
  // Reihenfolge entspricht der Eingabe; nach index sortieren zur Sicherheit
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const csv = await readFile(join(ROOT, FILE), 'utf8')
  const rows = parseCsv(csv).map((r) => ({
    ...r,
    source: SOURCE,
    titel_key: slug(r.titel),
    quelle_key: quelleKey(r.quelle),
  }))

  const withText = rows.filter((r) => r.inhalt)
  console.log(
    `Geparst: ${rows.length} Eintraege aus ${FILE} (source=${SOURCE}) — ` +
    `${withText.length} mit Volltext, ${rows.length - withText.length} Index-Platzhalter`,
  )

  if (DRY_RUN) {
    console.log('[dry-run] Beispiel:', JSON.stringify(rows[0], null, 2))
    console.log('[dry-run] Keine API-Calls, kein Schreibzugriff.')
    return
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  )

  // 3./4. Embeddings nur fuer Volltext-Eintraege (Platzhalter bleiben ohne Vektor)
  const embeddings = new Map() // titel_key -> vector
  for (let i = 0; i < withText.length; i += BATCH) {
    const slice = withText.slice(i, i + BATCH)
    const vecs = await embedBatch(slice.map((r) => `${r.titel}\n\n${r.inhalt}`))
    slice.forEach((r, j) => embeddings.set(r.titel_key, vecs[j]))
    console.log(`  Embeddings ${Math.min(i + BATCH, withText.length)}/${withText.length}`)
    if (THROTTLE_MS > 0 && i + BATCH < withText.length) await sleep(THROTTLE_MS)
  }

  // 5. Merge-Upsert: vorhandene (source,titel_key) ergaenzen statt ueberschreiben
  const { data: existing } = await supabase
    .from('kochwissen')
    .select('titel_key, inhalt, keywords, quelle')
    .eq('source', SOURCE)
  const prev = new Map((existing || []).map((e) => [e.titel_key, e]))

  const payload = rows.map((r) => {
    const old = prev.get(r.titel_key)
    const inhalt = r.inhalt || old?.inhalt || null
    const keywords = Array.from(new Set([...(old?.keywords || []), ...r.keywords]))
    const emb = embeddings.get(r.titel_key) || null // nur fuer neu eingebettete vorhanden
    return {
      source: r.source,
      titel: r.titel,
      titel_key: r.titel_key,
      kategorie: r.kategorie,
      cut_zutat: r.cut_zutat,
      schwierigkeit: r.schwierigkeit,
      keywords,
      quelle: r.quelle || old?.quelle || null,
      quelle_key: r.quelle_key,
      inhalt,
      // embedding nur setzen, wenn wir gerade eines erzeugt haben (sonst altes erhalten)
      ...(emb ? { embedding: emb } : {}),
      updated_at: new Date().toISOString(),
    }
  })

  // Chunked upsert (onConflict = source,titel_key)
  let done = 0
  for (let i = 0; i < payload.length; i += 200) {
    const slice = payload.slice(i, i + 200)
    const { error } = await supabase
      .from('kochwissen')
      .upsert(slice, { onConflict: 'source,titel_key' })
    if (error) throw new Error(`Supabase upsert: ${error.message}`)
    done += slice.length
    console.log(`  Upsert ${done}/${payload.length}`)
  }

  console.log(`✅ Fertig: ${payload.length} Eintraege (source=${SOURCE}) in 'kochwissen'.`)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
