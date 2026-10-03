/**
 * Wächter — Zusagen-Register und Belege (03.10.2026)
 *
 * Konzept: claude.ai-Projekt „Steakakademie", konzept_waechter_2026-10-02
 * (Freigabe Uwe). Abteilung: Systems & Ops. Doku: docs/waechter.md.
 *
 * WARUM: Die Erstinventur vom 03.10.2026 fand 431 Zusagen im Seitentext, von denen
 * 150 nichts deckte — „jeden Freitag" ohne eine versendete Kampagne, „7 Lektionen"
 * bei 11, eine Montags-Erinnerung ohne Workflow. Keiner der vorhandenen Wächter
 * prüft eine Zusage gegen das, wovon sie abhängt. Dieses Modul tut das.
 *
 * Eine Lib, zwei Aufrufer — damit Gate und tägliche Prüfung nie auseinanderlaufen:
 *   1. scripts/check-zusagen.mjs   → npm run check → Pflicht-Check „P0-Gates pruefen".
 *      Register-Form, Fundstellen, Offline-Belege, und: kein Zusage-Muster im
 *      Seitentext ohne Eintrag (Ratchet über data/zusagen-baseline.json).
 *   2. scripts/zusagen-belege.mjs  → ops-heartbeat, täglich. Wertet JEDEN Beleg aus,
 *      auch die, die Netz brauchen (http, loops, supabase).
 *
 * Diese Datei kommt ohne `typescript` aus — den sichtbaren Text liefert
 * scripts/lib/zusagen-text.mjs, und nur das Gate lädt ihn.
 */

import { readFileSync, existsSync, globSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import yaml from 'js-yaml'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const REGISTER = 'data/zusagen.yaml'
export const BASELINE = 'data/zusagen-baseline.json'

export const ABTEILUNGEN = ['Systems & Ops', 'Studio', 'Redaktion', 'Wachstum', 'Kanzlei']
export const BELEG_TYPEN = ['code', 'zaehlung', 'http', 'loops', 'supabase', 'mensch']
/** Belege, die das Netz brauchen — nur in der täglichen Prüfung. */
export const ONLINE_TYPEN = ['http', 'loops', 'supabase']

const DATUM = /^\d{4}-\d{2}-\d{2}$/
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TAG_MS = 86_400_000

// ─── Register laden und prüfen ───────────────────────────────────────────────

/**
 * CORE_SCHEMA: Datumsangaben bleiben Zeichenketten („2026-10-03"), statt je nach
 * Zeitzone zu einem Date zu werden.
 */
export function leseRegister (text) {
  const roh = yaml.load(text, { schema: yaml.CORE_SCHEMA }) ?? {}
  return {
    zusagen: Array.isArray(roh.zusagen) ? roh.zusagen : [],
    keine_zusage: Array.isArray(roh.keine_zusage) ? roh.keine_zusage : [],
    _form: roh,
  }
}

export function ladeRegister (root = ROOT) {
  return leseRegister(readFileSync(join(root, REGISTER), 'utf8'))
}

/** Ein Beleg oder mehrere — nach außen immer eine Liste. */
export function belegeVon (eintrag) {
  if (Array.isArray(eintrag?.beleg)) return eintrag.beleg
  return eintrag?.beleg && typeof eintrag.beleg === 'object' ? [eintrag.beleg] : []
}

const istText = (v, min = 1) => typeof v === 'string' && v.trim().length >= min
const istZahl = (v) => typeof v === 'number' && Number.isFinite(v)
const liste = (v) => (v == null ? [] : Array.isArray(v) ? v : [v])

function regexFehler (quelle) {
  try { new RegExp(quelle, 'mu'); return null } catch (e) { return e.message }
}

/** Wie eine Zahl im Text stehen kann: „6000", „6.000". */
export function zahlSchreibweisen (zahl) {
  const glatt = String(zahl)
  return [...new Set([glatt, glatt.replace(/\B(?=(\d{3})+(?!\d))/g, '.')])]
}

function pruefeBelegForm (b, wo) {
  const f = []
  if (!b || typeof b !== 'object') return ['beleg fehlt oder ist kein Objekt']
  if (!BELEG_TYPEN.includes(b.typ)) return [`beleg.typ „${b.typ}" ist unbekannt — erlaubt: ${BELEG_TYPEN.join(', ')}`]

  if (b.typ === 'code') {
    const teile = b.alle ? liste(b.alle) : [b]
    if (!teile.length) f.push('beleg.alle ist leer')
    for (const t of teile) {
      if (!istText(t?.datei)) f.push('code-Beleg braucht „datei"')
      if (t?.regex != null) {
        if (!istText(t.regex)) f.push('code-Beleg: „regex" muss Text sein')
        else if (regexFehler(t.regex)) f.push(`code-Beleg: regex „${t.regex}" ist ungültig — ${regexFehler(t.regex)}`)
      }
    }
  }

  if (b.typ === 'zaehlung') {
    if (!Number.isInteger(b.zahl) || b.zahl < 0) f.push('zaehlung-Beleg braucht „zahl" (ganze Zahl, wie sie im Text steht)')
    if (b.vergleich != null && !['gleich', 'mindestens', 'hoechstens'].includes(b.vergleich)) f.push('zaehlung-Beleg: „vergleich" ist gleich, mindestens oder hoechstens')
    const q = b.quelle
    if (!q || typeof q !== 'object') f.push('zaehlung-Beleg braucht „quelle"')
    else if (istText(q.glob)) {
      if (q.frontmatter != null && (typeof q.frontmatter !== 'object' || Array.isArray(q.frontmatter))) f.push('zaehlung-Beleg: quelle.frontmatter ist eine Zuordnung Feld → Wert')
    } else if (istText(q.datei) && istText(q.regex)) {
      if (regexFehler(q.regex)) f.push(`zaehlung-Beleg: quelle.regex ist ungültig — ${regexFehler(q.regex)}`)
    } else f.push('zaehlung-Beleg: quelle braucht „glob" (optional mit frontmatter) oder „datei" + „regex"')
    if (Number.isInteger(b.zahl)) {
      // Die Zahl im Register muss die Zahl im Text sein — sonst prüft der Beleg
      // etwas, das niemand liest.
      const formen = b.im_text != null ? liste(b.im_text).map(String) : zahlSchreibweisen(b.zahl)
      for (const w of wo) {
        if (!istText(w?.muster)) continue
        const trifft = formen.some((form) => new RegExp(`(?<![\\d.,])${form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\d])`, 'u').test(w.muster))
        if (!trifft) f.push(`zaehlung-Beleg: die Zahl ${formen.map((x) => `„${x}"`).join(' / ')} steht nicht im muster „${w.muster}" — Text und Register müssen dieselbe Zahl nennen (abweichende Schreibweise: „im_text")`)
      }
    }
  }

  if (b.typ === 'http') {
    if (!istText(b.url) || !/^https:\/\//.test(b.url)) f.push('http-Beleg braucht „url" (https://…)')
    if (b.status != null && !Number.isInteger(b.status)) f.push('http-Beleg: „status" ist eine Zahl')
    for (const feld of ['enthaelt', 'enthaelt_nicht']) for (const t of liste(b[feld])) if (!istText(t)) f.push(`http-Beleg: „${feld}" enthält einen leeren Eintrag`)
  }

  if (b.typ === 'loops') {
    if (!['workflow', 'transactional'].includes(b.art)) f.push('loops-Beleg: „art" ist workflow oder transactional')
    if (!istText(b.id, 8)) f.push('loops-Beleg braucht „id"')
  }

  if (b.typ === 'supabase') {
    if (!istText(b.tabelle) || !/^[a-z_][a-z0-9_]*$/.test(b.tabelle ?? '')) f.push('supabase-Beleg braucht „tabelle" (Kleinbuchstaben, Ziffern, Unterstrich)')
    const hatZahl = b.min_zeilen != null || b.max_zeilen != null
    const hatAlter = b.max_alter_tage != null
    if (!hatZahl && !hatAlter) f.push('supabase-Beleg braucht eine Erwartung: min_zeilen, max_zeilen oder max_alter_tage (mit spalte)')
    for (const feld of ['min_zeilen', 'max_zeilen']) if (b[feld] != null && (!Number.isInteger(b[feld]) || b[feld] < 0)) f.push(`supabase-Beleg: „${feld}" ist eine ganze Zahl`)
    if (hatAlter && (!istZahl(b.max_alter_tage) || b.max_alter_tage <= 0)) f.push('supabase-Beleg: „max_alter_tage" ist eine positive Zahl')
    if (hatAlter && !istText(b.spalte)) f.push('supabase-Beleg: max_alter_tage braucht „spalte" (Zeitstempel)')
    if (b.spalte != null && !/^[a-z_][a-z0-9_]*$/.test(b.spalte)) f.push('supabase-Beleg: „spalte" ist ein Spaltenname')
  }

  if (b.typ === 'mensch') {
    if (!istText(b.was, 10)) f.push('mensch-Beleg braucht „was" — was genau wurde nachgesehen (mindestens 10 Zeichen)')
    if (!istText(b.geprueft_am) || !DATUM.test(b.geprueft_am) || Number.isNaN(Date.parse(b.geprueft_am))) f.push('mensch-Beleg braucht „geprueft_am" (JJJJ-MM-TT)')
    if (!Number.isInteger(b.gueltig_tage) || b.gueltig_tage < 1) f.push('mensch-Beleg braucht „gueltig_tage" (ganze Zahl ab 1)')
  }
  return f
}

/**
 * Form des Registers. Liefert Fehler als { id, text } — nie eine Ausnahme, damit
 * ein kaputter Eintrag die übrigen nicht verdeckt.
 */
export function pruefeSchema (register) {
  const fehler = []
  const gesehen = new Map()
  if (!Array.isArray(register?._form?.zusagen ?? register?.zusagen)) fehler.push({ id: '(Datei)', text: 'oberster Schlüssel „zusagen" fehlt oder ist keine Liste' })

  register.zusagen.forEach((e, i) => {
    const id = istText(e?.id) ? e.id : `(Eintrag ${i + 1})`
    const f = (text) => fehler.push({ id, text })
    if (!e || typeof e !== 'object') return f('Eintrag ist kein Objekt')
    if (!istText(e.id) || !KEBAB.test(e.id)) f('„id" fehlt oder ist nicht kebab-case (klein, Ziffern, Bindestrich)')
    else if (gesehen.has(e.id)) f(`„id" ist doppelt (auch Eintrag ${gesehen.get(e.id)})`)
    else gesehen.set(e.id, i + 1)
    if (!istText(e.zusage, 10)) f('„zusage" fehlt — ein Satz in eigenen Worten')
    const wo = liste(e.wo)
    if (!wo.length) f('„wo" fehlt — mindestens eine Fundstelle (datei + muster)')
    for (const w of wo) {
      if (!istText(w?.datei)) f('„wo": Eintrag ohne „datei"')
      if (!istText(w?.muster, 4)) f(`„wo": Eintrag ohne „muster" (${w?.datei ?? '?'}) — das Textstück, das an der Stelle steht`)
    }
    const belege = belegeVon(e)
    if (!belege.length) f('„beleg" fehlt')
    belege.forEach((b) => pruefeBelegForm(b, wo).forEach(f))
    if (!istText(e.bei_bruch, 10)) f('„bei_bruch" fehlt — was ist zu tun, wenn der Beleg nicht mehr hält')
    if (!ABTEILUNGEN.includes(e.abteilung)) f(`„abteilung" ist keine der fünf (${ABTEILUNGEN.join(' · ')})`)
    if (!istText(e.seit) || !DATUM.test(e.seit)) f('„seit" fehlt (JJJJ-MM-TT)')
  })

  register.keine_zusage.forEach((k, i) => {
    const id = `keine_zusage[${i + 1}]`
    if (!istText(k?.datei)) fehler.push({ id, text: '„datei" fehlt' })
    if (!istText(k?.muster, 4)) fehler.push({ id, text: '„muster" fehlt' })
    if (!istText(k?.grund, 10)) fehler.push({ id, text: '„grund" fehlt — warum ist das keine Zusage (mindestens 10 Zeichen)' })
  })
  return fehler
}

// ─── Belege auswerten ────────────────────────────────────────────────────────
// Ergebnis jedes Belegs: { status, text } mit status aus
//   gedeckt · gebrochen · nicht prüfbar · abgelaufen

export const STATUS = { gedeckt: 'gedeckt', gebrochen: 'gebrochen', blind: 'nicht prüfbar', abgelaufen: 'abgelaufen' }
const gedeckt = (text) => ({ status: STATUS.gedeckt, text })
const gebrochen = (text) => ({ status: STATUS.gebrochen, text })
const blind = (text, grund = text) => ({ status: STATUS.blind, text, grund })

function frontmatter (text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!m) return {}
  try { return yaml.load(m[1], { schema: yaml.CORE_SCHEMA }) ?? {} } catch { return {} }
}

function passt (wert, soll) {
  if (Array.isArray(soll)) return soll.some((s) => passt(wert, s))
  if (Array.isArray(wert)) return wert.some((w) => passt(w, soll))
  return String(wert) === String(soll)
}

/** Wie viele Dinge zählt die Quelle? */
export function zaehleQuelle (quelle, root = ROOT) {
  if (quelle.glob) {
    const dateien = globSync(quelle.glob, { cwd: root }).sort()
    if (!quelle.frontmatter) return dateien.length
    return dateien.filter((d) => {
      const fm = frontmatter(readFileSync(join(root, d), 'utf8'))
      return Object.entries(quelle.frontmatter).every(([feld, soll]) => passt(fm[feld], soll))
    }).length
  }
  const pfad = join(root, quelle.datei)
  if (!existsSync(pfad)) throw new Error(`Datei ${quelle.datei} fehlt`)
  const treffer = [...readFileSync(pfad, 'utf8').matchAll(new RegExp(quelle.regex, 'gmu'))]
  // `eindeutig`: gleiche Fundstücke zählen einmal (erste Klammergruppe, sonst der ganze Treffer).
  return quelle.eindeutig ? new Set(treffer.map((m) => m[1] ?? m[0])).size : treffer.length
}

function codeBeleg (b, root) {
  const teile = b.alle ? liste(b.alle) : [b]
  for (const t of teile) {
    const pfad = join(root, t.datei)
    if (!existsSync(pfad)) return gebrochen(`Datei ${t.datei} fehlt`)
    if (t.regex && !new RegExp(t.regex, 'mu').test(readFileSync(pfad, 'utf8'))) return gebrochen(`${t.datei} enthält /${t.regex}/ nicht mehr`)
  }
  return gedeckt(teile.map((t) => t.datei).join(' · '))
}

function zaehlBeleg (b, root) {
  let ist
  try { ist = zaehleQuelle(b.quelle, root) } catch (e) { return gebrochen(e.message) }
  const art = b.vergleich ?? 'gleich'
  const ok = art === 'gleich' ? ist === b.zahl : art === 'mindestens' ? ist >= b.zahl : ist <= b.zahl
  const woher = b.quelle.glob ?? `${b.quelle.datei} /${b.quelle.regex}/`
  const wort = { gleich: 'genau', mindestens: 'mindestens', hoechstens: 'höchstens' }[art]
  return ok
    ? gedeckt(`Text nennt ${b.zahl}, Quelle zählt ${ist} (${woher})`)
    : gebrochen(`Text nennt ${wort} ${b.zahl}, die Quelle zählt ${ist} (${woher})`)
}

/** Ablauf einer Handbestätigung. `rest` = verbleibende Tage (negativ = überfällig). */
export function menschBeleg (b, jetzt = Date.now()) {
  const start = Date.parse(`${b.geprueft_am}T00:00:00Z`)
  const rest = Math.floor((start + b.gueltig_tage * TAG_MS - jetzt) / TAG_MS)
  if (start > jetzt + TAG_MS) return { ...gebrochen(`geprueft_am ${b.geprueft_am} liegt in der Zukunft`), rest }
  if (rest < 0) return { status: STATUS.abgelaufen, text: `Handbestätigung vom ${b.geprueft_am} ist seit ${-rest} Tag(en) abgelaufen (gültig ${b.gueltig_tage} Tage) — „${b.was}" neu nachsehen und geprueft_am setzen`, rest }
  return { ...gedeckt(`von Hand bestätigt am ${b.geprueft_am}, gilt noch ${rest} Tag(e): ${b.was}`), rest }
}

/** code · zaehlung · mensch — ohne Netz. */
export function belegOffline (b, { root = ROOT, jetzt = Date.now() } = {}) {
  if (b.typ === 'code') return codeBeleg(b, root)
  if (b.typ === 'zaehlung') return zaehlBeleg(b, root)
  if (b.typ === 'mensch') return menschBeleg(b, jetzt)
  throw new Error(`Beleg-Typ „${b.typ}" braucht das Netz`)
}

/** HTML → lesbarer Text: Skripte, Stile, Kommentare und Tags raus, Entities auf. */
export function seitenText (html) {
  return String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, '')          // React trennt Text und Wert mit <!-- -->
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;|&#xa0;/gi, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
}

/**
 * Ein lesender Abruf (immer GET). Zweiter Anlauf vor dem Urteil — eine kalte Route
 * darf keinen Alarm auslösen (gleiche Überlegung wie pruefeErreichbarkeit im
 * Heartbeat). `pauseMs` ist die Wartezeit dazwischen; die Tests setzen 0.
 */
async function hole (fetchFn, url, { pauseMs = 3000, ...init } = {}, versuche = 2) {
  let fehler
  for (let v = 1; v <= versuche; v++) {
    try {
      const res = await fetchFn(url, { ...init, method: 'GET', signal: AbortSignal.timeout(20_000) })
      if (res.status < 500 || v === versuche) return res
      fehler = new Error(`HTTP ${res.status}`)
    } catch (e) { fehler = e }
    if (v < versuche) await new Promise((r) => setTimeout(r, pauseMs))
  }
  throw fehler
}

async function httpBeleg (b, { fetchFn, pauseMs }) {
  const soll = b.status ?? 200
  let res
  try {
    res = await hole(fetchFn, b.url, { redirect: 'manual', headers: { 'user-agent': 'steakakademie-waechter' }, pauseMs })
  } catch (e) {
    return gebrochen(`${b.url} antwortet nicht: ${e.name === 'TimeoutError' ? 'Zeitüberschreitung (20 s)' : e.message}`)
  }
  if (res.status !== soll) {
    const grund = res.headers?.get?.('x-vercel-error')
    return gebrochen(`${b.url} antwortet mit ${res.status}${grund ? ` (${grund})` : ''}, erwartet ${soll}`)
  }
  if (b.location_enthaelt) {
    const ziel = res.headers?.get?.('location') ?? ''
    if (!ziel.includes(b.location_enthaelt)) return gebrochen(`${b.url} leitet auf „${ziel}" statt auf „${b.location_enthaelt}"`)
  }
  const muss = liste(b.enthaelt)
  const darfNicht = liste(b.enthaelt_nicht)
  if (muss.length || darfNicht.length) {
    const text = seitenText(await res.text())
    for (const t of muss) if (!text.includes(t)) return gebrochen(`${b.url} zeigt „${t}" nicht mehr`)
    for (const t of darfNicht) if (text.includes(t)) return gebrochen(`${b.url} zeigt „${t}" — das sollte dort nicht stehen`)
  }
  return gedeckt(`${b.url} → ${res.status}${muss.length ? `, Text vorhanden (${muss.length})` : ''}`)
}

const LOOPS = 'https://app.loops.so/api/v1'

async function loopsBeleg (b, { fetchFn, env, cache, pauseMs }) {
  const key = env.LOOPS_API_KEY
  if (!key) return blind('LOOPS_API_KEY fehlt')
  const kopf = { Authorization: `Bearer ${key}`, Accept: 'application/json' }

  if (b.art === 'workflow') {
    let res
    try { res = await hole(fetchFn, `${LOOPS}/workflows/${encodeURIComponent(b.id)}`, { headers: kopf, pauseMs }) } catch (e) { return blind(`Loops antwortet nicht: ${e.message}`, 'Loops nicht erreichbar') }
    if (res.status === 401 || res.status === 403) return blind(`Loops lehnt den Schlüssel ab (HTTP ${res.status})`, 'LOOPS_API_KEY ungültig')
    if (res.status === 404 || res.status === 400) return gebrochen(`Loops-Workflow ${b.id} gibt es nicht (HTTP ${res.status})`)
    if (!res.ok) return blind(`Loops antwortet mit HTTP ${res.status}`, 'Loops nicht erreichbar')
    const w = await res.json()
    // „Sending" ist der einzige Zustand, in dem ein Workflow Mails verschickt
    // (Loops-Spezifikation: Draft · Sending · Paused · PausedAndQueueing).
    if (w.status !== 'Sending') return gebrochen(`Loops-Workflow „${w.name ?? b.id}" steht auf „${w.status}", nicht auf „Sending"`)
    if (b.betreff) {
      const betreffs = Object.values(w.nodes ?? {}).filter((n) => n?.typeName === 'SendEmailAction').map((n) => String(n.subject ?? ''))
      if (!betreffs.some((s) => s.includes(b.betreff))) return gebrochen(`Loops-Workflow „${w.name ?? b.id}" sendet, aber keine Mail mit „${b.betreff}" im Betreff`)
    }
    return gedeckt(`Loops-Workflow „${w.name ?? b.id}" sendet${b.betreff ? ` (Mail mit „${b.betreff}" im Betreff)` : ''}`)
  }

  // Veröffentlichte Transaktionsmails: eine Liste für alle Belege des Laufs.
  if (!cache.loopsTransactional) {
    cache.loopsTransactional = (async () => {
      const alle = []
      let cursor = null
      for (let seite = 0; seite < 20; seite++) {
        const url = `${LOOPS}/transactional?perPage=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
        const res = await hole(fetchFn, url, { headers: kopf, pauseMs })
        if (res.status === 401 || res.status === 403) return { blind: blind(`Loops lehnt den Schlüssel ab (HTTP ${res.status})`, 'LOOPS_API_KEY ungültig') }
        if (!res.ok) return { blind: blind(`Loops antwortet mit HTTP ${res.status}`, 'Loops nicht erreichbar') }
        const daten = await res.json()
        alle.push(...(daten.data ?? []))
        cursor = daten.pagination?.nextCursor ?? null
        if (!cursor) break
      }
      return { alle }
    })().catch((e) => ({ blind: blind(`Loops antwortet nicht: ${e.message}`, 'Loops nicht erreichbar') }))
  }
  const liste_ = await cache.loopsTransactional
  if (liste_.blind) return liste_.blind
  const mail = liste_.alle.find((m) => m.id === b.id)
  if (!mail) return gebrochen(`Loops-Transaktionsmail ${b.id} ist nicht veröffentlicht (oder gelöscht)`)
  for (const v of liste(b.variablen)) if (!(mail.dataVariables ?? []).includes(v)) return gebrochen(`Loops-Transaktionsmail „${mail.name}" kennt die Variable „${v}" nicht mehr`)
  return gedeckt(`Loops-Transaktionsmail „${mail.name}" ist veröffentlicht`)
}

async function supabaseBeleg (b, { fetchFn, env, jetzt, pauseMs }) {
  const basis = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!basis || !key) return blind('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen')
  const kopf = { apikey: key, Authorization: `Bearer ${key}` }
  const tabelle = `${basis.replace(/\/$/, '')}/rest/v1/${b.tabelle}`
  const filter = b.filter ? `&${b.filter}` : ''
  const teile = []

  if (b.min_zeilen != null || b.max_zeilen != null) {
    let res
    try { res = await hole(fetchFn, `${tabelle}?select=*&limit=1${filter}`, { headers: { ...kopf, Prefer: 'count=exact' }, pauseMs }) } catch (e) { return blind(`Supabase antwortet nicht: ${e.message}`, 'Supabase nicht erreichbar') }
    if (res.status === 401 || res.status === 403) return blind(`Supabase lehnt den Schlüssel ab (HTTP ${res.status})`, 'Supabase-Schlüssel ungültig')
    if (!res.ok) return gebrochen(`Supabase ${b.tabelle}: HTTP ${res.status}`)
    const zahl = Number(/\/(\d+)$/.exec(res.headers?.get?.('content-range') ?? '')?.[1])
    if (!Number.isFinite(zahl)) return blind(`Supabase ${b.tabelle}: Zeilenzahl nicht lesbar`, 'Supabase-Antwort ohne Zeilenzahl')
    const was = `${b.tabelle}${b.filter ? ` (${b.filter})` : ''}`
    if (b.min_zeilen != null && zahl < b.min_zeilen) return gebrochen(`${was}: ${zahl} Zeilen, erwartet mindestens ${b.min_zeilen}`)
    if (b.max_zeilen != null && zahl > b.max_zeilen) return gebrochen(`${was}: ${zahl} Zeilen, erwartet höchstens ${b.max_zeilen}`)
    teile.push(`${was}: ${zahl} Zeilen`)
  }

  if (b.max_alter_tage != null) {
    const url = `${tabelle}?select=${b.spalte}&order=${b.spalte}.desc&limit=1&${b.spalte}=not.is.null${filter}`
    let res
    try { res = await hole(fetchFn, url, { headers: kopf, pauseMs }) } catch (e) { return blind(`Supabase antwortet nicht: ${e.message}`, 'Supabase nicht erreichbar') }
    if (res.status === 401 || res.status === 403) return blind(`Supabase lehnt den Schlüssel ab (HTTP ${res.status})`, 'Supabase-Schlüssel ungültig')
    if (!res.ok) return gebrochen(`Supabase ${b.tabelle}: HTTP ${res.status}`)
    const iso = (await res.json())?.[0]?.[b.spalte]
    if (!iso) return gebrochen(`${b.tabelle}.${b.spalte}: kein einziger Zeitstempel`)
    const alter = (jetzt - Date.parse(iso)) / TAG_MS
    if (alter > b.max_alter_tage) return gebrochen(`${b.tabelle}.${b.spalte}: zuletzt vor ${alter.toFixed(1)} Tagen (${String(iso).slice(0, 10)}), erlaubt ${b.max_alter_tage}`)
    teile.push(`${b.tabelle}.${b.spalte}: zuletzt vor ${alter.toFixed(1)} Tagen`)
  }
  return gedeckt(teile.join(' · '))
}

/** http · loops · supabase — `fetchFn` und `env` kommen von außen (Tests ohne Netz). */
export async function belegOnline (b, { fetchFn = globalThis.fetch, env = process.env, jetzt = Date.now(), cache = {}, pauseMs } = {}) {
  if (b.typ === 'http') return httpBeleg(b, { fetchFn, pauseMs })
  if (b.typ === 'loops') return loopsBeleg(b, { fetchFn, env, cache, pauseMs })
  if (b.typ === 'supabase') return supabaseBeleg(b, { fetchFn, env, jetzt, pauseMs })
  throw new Error(`Beleg-Typ „${b.typ}" ist kein Netz-Beleg`)
}

// ─── Zusage-Muster ───────────────────────────────────────────────────────────

const L = '(?<![\\p{L}\\p{N}_])'
const R = '(?![\\p{L}\\p{N}_])'
const WOCHENTAG = '(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonnabend|Sonntag)'
const ZAHLWORT = '(?:\\d+(?:[–-]\\d+)?|ein(?:e[mnr]?)?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|zwölf|vierzehn|wenigen)'
/** „du bekommst …" und „… bekommst du" — Hauptsatz und Umstellung. */
const DU_BEKOMMST = '(?:du\\s+(?:bekommst|erhältst|kriegst)|(?:bekommst|erhältst|kriegst)\\s+du)'
const FUELLWORT ='(?:mit|bei|von|vom|in|im|zu|zum|zur|und|oder|bis|pro|je|für|aus|auf|an|am|als|der|die|das|den|dem|des|dieser|diese|solcher|x)'
const BESTAND = '(?:Rezepte[n]?|Lektionen|Höfe[n]?|Hofläden|Cuts|Glossar-Einträge[n]?|Einträge[n]?|Begriffe[n]?|Artikel[n]?|Module[n]?|Stufen|Level[ns]?|Kurse[n]?|Profile[n]?|Porträts|Persönlichkeiten|Streitfälle[n]?|Methoden|Techniken|Grilltechniken|Teilstücke[n]?|Länder[n]?|Produkte[n]?|Lernziele[n]?|Mitglieder[n]?|Absolventen|Videos|Werkzeuge[n]?|Tools|Prüfungsfragen|Quizfragen|Fragen|Fachstudien|Studien|Zutaten|Regionen|Grillfehler|Messer|Rubriken|Fleischkategorien|Gargrade)'

/**
 * Fünf Klassen. Jede Zeile ist ein Muster auf dem zusammengezogenen sichtbaren
 * Text; Groß/Klein egal, Wortgrenzen Unicode-fest (ein „ü" beendet kein Wort —
 * die Lektion aus check-mdx-komponenten.mjs).
 */
export const KLASSEN = {
  rhythmus: {
    titel: 'Zeit/Frequenz',
    muster: [
      `${L}jede[nrs]?\\s+(?:${WOCHENTAG}|Woche|Tag|Monat|Morgen|Abend|Wochenende|Quartal|Jahr)${R}`,
      `${L}${WOCHENTAG}s${R}`,
      `${L}(?:wöchentlich|täglich|monatlich|vierzehntägig|zweiwöchentlich|jährlich|stündlich)(?:e[mnrs]?)?${R}`,
      `${L}alle\\s+${ZAHLWORT}\\s+(?:Minuten|Stunden|Tage|Wochen|Monate|Jahre)${R}`,
      `${L}(?:ein|zwei|drei)mal\\s+(?:pro|die|im|in\\s+der|am)\\s+(?:Woche|Monat|Tag|Jahr)${R}`,
      `${L}(?:innerhalb|binnen)\\s+(?:von\\s+)?(?:(?:nur|maximal|höchstens)\\s+)?${ZAHLWORT}\\s*(?:Minuten|Stunden|h|Tagen|Werktagen|Wochen|Monaten)${R}`,
    ],
  },
  versand: {
    titel: 'Versand',
    muster: [
      `${L}per\\s+(?:E-?Mail|Mail|Post|SMS|Brief)${R}(?!\\s+an\\s+(?:\\S+@|[.,]))`,
      `${L}(?:schicken|senden|mailen)\\s+wir\\s+(?:dir|euch|Ihnen)${R}`,
      `${L}wir\\s+(?:schicken|senden|mailen)\\s+(?:dir|euch|Ihnen)${R}`,
      `${L}${DU_BEKOMMST}${R}[^.!?]{0,100}?${L}(?:zugeschickt|zugesandt|zugestellt)${R}`,
      `${L}${DU_BEKOMMST}${R}[^.!?]{0,80}?${L}[\\p{L}-]*(?:E-?Mails?|Mail)${R}`,
      `${L}(?:in|ins)\\s+dein(?:em)?\\s+(?:E-?Mail-)?Postfach${R}`,
      `${L}wir\\s+melden\\s+uns${R}`,
      `${L}melden\\s+wir\\s+uns${R}`,
    ],
  },
  pruefung: {
    titel: 'Test/Prüfung',
    muster: [
      `${L}(?!un)[\\p{L}-]*getestet(?:e[mnrs]?)?${R}`,
      `${L}(?!un)[\\p{L}-]*geprüft(?:e[mnrs]?)?${R}`,
      `${L}[\\p{L}-]*zertifiziert(?:e[mnrs]?)?${R}`,
      `${L}[\\p{L}-]*Testsieger(?:in|n|s)?${R}`,
    ],
  },
  bestandszahl: {
    titel: 'Bestandszahl',
    // Groß/Klein zählt hier: Das Bestandswort ist ein Hauptwort, die Beiwörter
    // davor sind klein. Sonst träfe „6 Grillfehler Alle Artikel" (zwei Menüpunkte).
    flags: 'gu',
    muster: [
      // Getippte Zahl vor einem Bestandswort, dazwischen höchstens zwei Beiwörter:
      // „128 Rezepte", „6.000 Höfe", „39 fertige Lektionen". Eine berechnete Zahl
      // ({n} Rezepte) steht nicht im sichtbaren Text und trifft deshalb nicht.
      `(?<![\\p{L}\\p{N}_.,/])(?<zahl>\\d{1,3}(?:\\.\\d{3})+|\\d+)\\+?\\s+(?:(?!${FUELLWORT}\\s)[\\p{Ll}][\\p{L}-]*\\s+){0,2}?${BESTAND}${R}`,
    ],
  },
  garantie: {
    titel: 'Garantie',
    muster: [
      `(?<!keine\\s)(?<!kein\\s)(?<!ohne\\s)${L}[\\p{L}-]*[Gg]arantie${R}`,
      `${L}Geld[\\s-]+zurück${R}`,
    ],
  },
}

/** Kochtext und Weltbeschreibung: „täglich wenden" ist eine Anweisung, keine Zusage. */
const OHNE_RHYTHMUS = /^content\//
/** In Inhalten zählen kleine Zahlen Arbeitsschritte („in 2 Stufen garen"), keinen Bestand. */
const BESTAND_AB_IN_INHALTEN = 10

export function klassenFuer (datei) {
  return Object.keys(KLASSEN).filter((k) => !(k === 'rhythmus' && OHNE_RHYTHMUS.test(datei)))
}

/** Welche Dateien das Gate liest. */
export const SUCHBAEUME = ['src/app', 'src/components', 'content']
export function istSuchdatei (datei) {
  if (!/\.(?:tsx?|jsx?|mdx?)$/.test(datei) || /\.d\.ts$/.test(datei)) return false
  if (/\.test\.[jt]sx?$|(?:^|\/)__tests__\//.test(datei)) return false
  if (/^content\/_archiv\//.test(datei)) return false
  if (/^src\/app\/admin\//.test(datei)) return false       // intern, kein Besuchertext
  return SUCHBAEUME.some((b) => datei.startsWith(`${b}/`))
}

function satzUm (norm, von, bis, grenzen) {
  // Erst auf das Segment (JSX-Textstück, Zeichenkette, Absatz) begrenzen, dann auf
  // den Satz. So ändert eine Korrektur am Nachbarsatz den Schlüssel nicht.
  let a = 0
  let e = norm.length
  for (const [s, t] of grenzen) {
    if (s <= von && von < t) a = s
    if (s < bis && bis <= t) { e = t; break }
  }
  const davor = norm.slice(a, von)
  const schnitt = Math.max(davor.lastIndexOf('. '), davor.lastIndexOf('! '), davor.lastIndexOf('? '), davor.lastIndexOf('… '), davor.lastIndexOf(' | '))
  if (schnitt >= 0) a += schnitt + 2
  const danach = /[.!?…](?=\s|$)|\s\|\s/u.exec(norm.slice(bis, e))
  if (danach) e = bis + danach.index + 1
  return norm.slice(a, e).trim()
}

export function schluessel (klasse, datei, satz) {
  const kern = satz.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 160)
  return createHash('sha1').update(`${klasse}|${datei}|${kern}`).digest('hex').slice(0, 16)
}

/**
 * Zusage-Muster im sichtbaren Text einer Datei.
 * `sicht` = { text, segmente } aus zusagen-text.mjs, `normal` = { norm, karte }.
 * Liefert je Fundstelle { klasse, von, bis, treffer, satz, id } in norm-Koordinaten.
 */
export function findeZusagen (datei, sicht, normal) {
  const { norm, karte } = normal
  // Segmentgrenzen in norm-Koordinaten.
  const grenzen = []
  let i = 0
  for (const [s, t] of sicht.segmente) {
    while (i < karte.length && karte[i] < s) i++
    const a = i
    while (i < karte.length && karte[i] < t) i++
    if (i > a) grenzen.push([a, i])
  }
  const funde = []
  for (const klasse of klassenFuer(datei)) {
    for (const quelle of KLASSEN[klasse].muster) {
      const re = new RegExp(quelle, KLASSEN[klasse].flags ?? 'giu')
      for (let m; (m = re.exec(norm));) {
        if (m[0].length === 0) { re.lastIndex++; continue }
        if (klasse === 'bestandszahl' && datei.startsWith('content/') && Number(m.groups.zahl.replace(/\./g, '')) < BESTAND_AB_IN_INHALTEN) continue
        const satz = satzUm(norm, m.index, m.index + m[0].length, grenzen)
        funde.push({ klasse, von: m.index, bis: m.index + m[0].length, treffer: m[0], satz, id: schluessel(klasse, datei, satz) })
      }
    }
  }
  return funde.sort((a, b) => a.von - b.von || ordne(a.klasse, b.klasse))
}

/** Alle Stellen, an denen `muster` im zusammengezogenen Text steht: [von, bis). */
export function fundstellen (norm, muster) {
  const nadel = String(muster).replace(/[\s  ]+/g, ' ').trim()
  const out = []
  if (!nadel) return out
  for (let i = norm.indexOf(nadel); i >= 0; i = norm.indexOf(nadel, i + 1)) out.push([i, i + nadel.length])
  return out
}

/** Deckt einer der Bereiche den Treffer ganz ab? */
export function istGedeckt (fund, bereiche) {
  return bereiche.some(([a, e]) => a <= fund.von && fund.bis <= e)
}

// ─── Baseline ────────────────────────────────────────────────────────────────

export function ladeBaseline (root = ROOT) {
  const pfad = join(root, BASELINE)
  return existsSync(pfad) ? JSON.parse(readFileSync(pfad, 'utf8')) : { treffer: [] }
}

/** Deterministisch: gleiche Quelle → byte-gleiche Datei. Kein Datum, feste Reihenfolge. */
export function baueBaseline (funde) {
  const eindeutig = new Map()
  for (const f of funde) if (!eindeutig.has(f.id)) eindeutig.set(f.id, { id: f.id, klasse: f.klasse, datei: f.datei, satz: f.satz.slice(0, 200) })
  return {
    hinweis: 'Zusage-Muster, die es beim Einführen des Gates schon gab und die noch kein Register-Eintrag deckt. Nicht von Hand ergänzen — Beleg ins Register eintragen oder den Satz ändern. Neu schreiben: npm run check:zusagen:baseline',
    // Vergleich nach Codepunkten, nicht nach Locale — sonst sortiert CI anders als der Laptop.
    treffer: [...eindeutig.values()].sort((a, b) => ordne(a.datei, b.datei) || ordne(a.klasse, b.klasse) || ordne(a.id, b.id)),
  }
}

function ordne (a, b) { return a < b ? -1 : a > b ? 1 : 0 }
