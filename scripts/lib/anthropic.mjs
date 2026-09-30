/**
 * scripts/lib/anthropic.mjs — zentraler Anthropic-Client der Steakakademie.
 *
 * Zweck: Automatisches Prompt-Caching (auch in mehrstufigen Konversationen)
 * an EINER Stelle, statt in jedem Skript einzeln.
 *
 * Automatisches Caching = ein `cache_control`-Feld auf TOP-LEVEL des Requests.
 * Die API setzt den Cache-Breakpoint selbst auf den letzten cachebaren Block und
 * schiebt ihn mit wachsender Konversation automatisch weiter. Es müssen KEINE
 * cache_control-Marker in einzelne Content-Blöcke gesetzt werden.
 * Doku: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
 *
 * WICHTIG (Regel 7 / epistemische Ehrlichkeit): Prompts unterhalb der
 * Modell-Mindestlänge werden STILL nicht gecacht — kein Fehler, keine Meldung.
 * Deshalb loggt dieses Modul die usage-Felder und warnt, wenn nichts greift.
 *
 * Stand der Mindestwerte: 20.08.2026 (Anthropic-Doku).
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const API_URL     = 'https://api.anthropic.com/v1/messages'
const API_VERSION = '2023-06-01'

/* ── Mindest-Prefix je Modell (Tokens). Darunter cached die API nicht. ───── */
export const CACHE_MIN_TOKENS = {
  'claude-opus-5':     512,
  'claude-fable-5':    512,
  'claude-mythos-5':   512,
  'claude-opus-4-8':   1024,
  'claude-opus-4-7':   2048,
  'claude-opus-4-6':   4096,
  'claude-opus-4-5':   4096,
  'claude-sonnet-5':   1024,
  'claude-sonnet-4-6': 1024,
  'claude-sonnet-4-5': 1024,
  'claude-haiku-4-5':  4096,
}

export function cacheMinFor (model = '') {
  const hit = Object.keys(CACHE_MIN_TOKENS)
    .sort((a, b) => b.length - a.length)
    .find(k => model.startsWith(k))
  return hit ? CACHE_MIN_TOKENS[hit] : null
}

/** Grobe Token-Schätzung für deutsche/englische Prompts (~3.5 Zeichen/Token). */
export const estTokens = str => Math.round(String(str || '').length / 3.5)

/* ── API-Key: env zuerst, sonst .env.local ───────────────────────────────── */
let _key = null
export async function resolveApiKey () {
  if (_key) return _key
  if (process.env.ANTHROPIC_API_KEY) return (_key = process.env.ANTHROPIC_API_KEY)
  const envFile = join(ROOT, '.env.local')
  if (existsSync(envFile)) {
    const m = (await readFile(envFile, 'utf8')).match(/^\s*ANTHROPIC_API_KEY\s*=\s*"?([^"\r\n]+)"?/m)
    if (m) return (_key = m[1].trim())
  }
  return null
}

/* ── Telemetrie ──────────────────────────────────────────────────────────── */
const STATS = { calls: 0, input: 0, output: 0, cacheWrite: 0, cacheRead: 0, byLabel: {} }
export const cacheStats = () => JSON.parse(JSON.stringify(STATS))

function record (label, usage) {
  const w = usage?.cache_creation_input_tokens || 0
  const r = usage?.cache_read_input_tokens     || 0
  STATS.calls++
  STATS.input      += usage?.input_tokens  || 0
  STATS.output     += usage?.output_tokens || 0
  STATS.cacheWrite += w
  STATS.cacheRead  += r
  const b = (STATS.byLabel[label] ||= { calls: 0, cacheWrite: 0, cacheRead: 0 })
  b.calls++; b.cacheWrite += w; b.cacheRead += r
}

/** Kurz-Report am Skript-Ende. Zeigt ehrlich an, wenn Caching NICHT greift. */
export function printCacheStats (prefix = '  ') {
  if (!STATS.calls) return
  const { calls, input, output, cacheWrite, cacheRead } = STATS
  console.log(`${prefix}Cache: ${calls} Call(s) · gelesen ${cacheRead} Tok · geschrieben ${cacheWrite} Tok · ungecacht ${input} Tok · Output ${output} Tok`)
  if (calls > 1 && cacheRead === 0 && cacheWrite === 0) {
    console.log(`${prefix}⚠ Kein Cache aktiv — Prompt-Prefix liegt unter der Modell-Mindestlänge (siehe CACHE_MIN_TOKENS).`)
  }
}

/* ── Kern-Call ───────────────────────────────────────────────────────────── */
/**
 * @param {object}  o
 * @param {string}  o.model
 * @param {string|Array} [o.system]      String oder Content-Block-Array
 * @param {Array}   o.messages
 * @param {number}  [o.max_tokens=1024]
 * @param {number}  [o.temperature]
 * @param {object}  [o.thinking]
 * @param {boolean} [o.cache=true]       Automatisches Caching an/aus
 * @param {'5m'|'1h'|null} [o.ttl]       null = Default 5 Minuten
 * @param {string}  [o.label]            Für die Statistik
 * @param {number}  [o.retries=2]
 * @returns {Promise<{text:string, json:any, usage:object, raw:object}>}
 */
export async function callClaude (o) {
  const {
    model, system, messages, max_tokens = 1024, temperature, thinking,
    cache = true, ttl = process.env.ANTHROPIC_CACHE_TTL || null,
    label = model, retries = 2, signal,
  } = o

  const key = await resolveApiKey()
  if (!key) throw new Error('ANTHROPIC_API_KEY fehlt (env oder .env.local)')

  const body = { model, max_tokens, messages }
  if (system      !== undefined) body.system      = system
  if (temperature !== undefined) body.temperature = temperature
  if (thinking)                  body.thinking    = thinking

  // ── Das ist das automatische Caching. Ein Feld, top-level. ──
  if (cache) body.cache_control = ttl ? { type: 'ephemeral', ttl } : { type: 'ephemeral' }

  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        signal,
        headers: { 'x-api-key': key, 'anthropic-version': API_VERSION, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.status === 429 || res.status >= 500) throw new Error(`anthropic ${res.status}`)
      if (!res.ok) throw Object.assign(new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`), { fatal: true })

      const raw   = await res.json()
      const text  = (raw.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim()
      record(label, raw.usage)
      return { text, json: () => parseJson(text), usage: raw.usage, raw }
    } catch (err) {
      lastErr = err
      if (err.fatal || attempt === retries) break
      await new Promise(r => setTimeout(r, 800 * (attempt + 1)))
    }
  }
  throw lastErr
}

/**
 * Maskiert rohe Steuerzeichen INNERHALB von JSON-Strings (Zeilenumbruch, Tab …).
 * Modelle schreiben Markdown-Felder oft mit echten Zeilenumbrüchen statt \n —
 * JSON.parse bricht dann mit „Bad control character in string literal" ab
 * (KAN-84, saison-grow 26.09.2026). Außerhalb von Strings bleibt alles unverändert.
 */
export function maskiereSteuerzeichen (t) {
  let out = ''
  let inString = false
  let escaped = false
  for (const ch of String(t)) {
    if (inString) {
      if (escaped) { out += ch; escaped = false; continue }
      if (ch === '\\') { out += ch; escaped = true; continue }
      if (ch === '"') { out += ch; inString = false; continue }
      const code = ch.charCodeAt(0)
      if (code < 0x20) {
        out += ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : ch === '\t' ? '\\t'
          : '\\u' + code.toString(16).padStart(4, '0')
        continue
      }
      out += ch
    } else {
      if (ch === '"') inString = true
      out += ch
    }
  }
  return out
}

/** Toleranter JSON-Parser für Modell-Antworten (```json-Fences, Vorwort, rohe Zeilenumbrüche in Strings). */
export function parseJson (text) {
  const t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const m = t.match(/[{[][\s\S]*[}\]]/)
  const versuche = [t, maskiereSteuerzeichen(t)]
  if (m) versuche.push(m[0], maskiereSteuerzeichen(m[0]))
  let letzterFehler
  for (const v of versuche) {
    try { return JSON.parse(v) } catch (e) { letzterFehler = e }
  }
  if (!m) throw new Error('Kein JSON in der Antwort')
  throw letzterFehler
}

/* ── Mehrstufige Konversation ────────────────────────────────────────────── */
/**
 * Hält den Verlauf und schickt ihn bei jedem Turn komplett mit.
 * Das automatische Caching schiebt den Breakpoint dabei selbstständig weiter:
 * Turn 2 liest alles bis Turn 1 aus dem Cache, schreibt nur das Neue.
 *
 *   const chat = new Conversation({ model: 'claude-opus-5', system: SYSTEM })
 *   await chat.ask('Mein Name ist Alex.')
 *   const r = await chat.ask('Was habe ich gesagt?')
 *   console.log(r.text, chat.lastUsage)
 */
export class Conversation {
  constructor (opts = {}) {
    const { messages = [], ...rest } = opts
    this.opts      = rest
    this._msgs     = [...messages]
    this.lastUsage = null
  }

  get messages () { return [...this._msgs] }
  get turns ()    { return this._msgs.length }

  push (role, content) { this._msgs.push({ role, content }); return this }

  async ask (content, override = {}) {
    this._msgs.push({ role: 'user', content })
    const res = await callClaude({ ...this.opts, ...override, messages: this._msgs })
    this._msgs.push({ role: 'assistant', content: res.text })
    this.lastUsage = res.usage
    return res
  }

  /** Verlauf kürzen, ohne das gecachte Präfix zu zerstören: nur vom Ende her. */
  reset (keepSystem = true) { this._msgs = []; if (!keepSystem) this.opts.system = undefined; return this }
}

/* ── Stabiles Präfix aus Repo-Dateien (Marken-DNA, Fakten-Referenz) ──────── */
/**
 * Lädt Dateien als EINEN stabilen Kontextblock. Sinn: das Präfix über die
 * Modell-Mindestlänge heben, damit Caching bei Schleifen über viele Items
 * überhaupt greift — und die Antworten gleichzeitig markentreu/faktentreu machen.
 * Reihenfolge NICHT ändern — sonst neuer Cache-Hash.
 */
export async function loadSharedContext (...relPaths) {
  const parts = []
  for (const rel of relPaths) {
    const p = join(ROOT, rel)
    if (!existsSync(p)) continue
    parts.push(`### QUELLE: ${rel}\n${(await readFile(p, 'utf8')).trim()}`)
  }
  return parts.join('\n\n')
}

export default { callClaude, Conversation, parseJson, loadSharedContext, printCacheStats, cacheStats, cacheMinFor, estTokens, resolveApiKey }
