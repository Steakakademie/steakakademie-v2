#!/usr/bin/env node
/**
 * Steakakademie — Ops-Heartbeat (Totmannschalter für die Automation)
 *
 * Das Problem, das dieses Skript loest:
 * Ein GitHub-Workflow ist gruen, wenn er ohne Fehler endet — nicht, wenn er etwas
 * geleistet hat. recipe-grow lief vom 27.08. bis 13.09.2026 jeden Tag durch, gruen,
 * in 48 Sekunden, und erzeugte kein einziges Rezept. Die Seed-Liste war leer. Kein
 * Fehler, kein Alarm, siebzehn Tage Stillstand. Dieselbe Falle steht hinter jedem
 * anderen Agenten: „laeuft" und „liefert" sind zwei verschiedene Dinge.
 *
 * Der Heartbeat prueft deshalb nicht Laeufe, sondern ERGEBNISSE:
 *   typ "git"       — wann wurde dieser Pfad zuletzt veraendert?
 *   typ "supabase"  — wie alt ist der neueste Datensatz in dieser Tabelle?
 *   typ "workflow"  — wann ist dieser Workflow zuletzt ueberhaupt gestartet?
 *                     (GitHub schaltet geplante Workflows in ruhigen Repos ab.)
 *
 * Ist irgendein Punkt ueberfaellig, endet das Skript mit exit 1. Der Workflow wird
 * rot, GitHub verschickt die Fehlermail, und der aufrufende Workflow legt zusaetzlich
 * ein Jira-Ticket an. Ein stiller Ausfall ist damit kein stiller Ausfall mehr.
 *
 * Aufruf:
 *   node scripts/ops-heartbeat.mjs
 *   node scripts/ops-heartbeat.mjs --nur-bericht   # nie exit 1, nur Ausgabe
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, appendFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT   = join(__dirname, '..')
const CONFIG = join(ROOT, 'data', 'ops-heartbeat.json')

const NUR_BERICHT = process.argv.includes('--nur-bericht')

const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
}

const JETZT = Date.now()
const tageSeit = iso => (JETZT - new Date(iso).getTime()) / 86_400_000

// ─── PRUEFER ──────────────────────────────────────────────────────────────────

/** Letzte Aenderung eines Pfades. Braucht volle Historie (actions/checkout fetch-depth: 0). */
function letzteGitAenderung(pfad) {
  const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', pfad],
    { cwd: ROOT, encoding: 'utf-8' }).trim()
  if (!iso) throw new Error(`kein Commit fuer "${pfad}" gefunden — flacher Checkout? (fetch-depth: 0 noetig)`)
  return iso
}

/** Ein Zeitstempel aus einer Supabase-Tabelle ueber die REST-Schnittstelle (neuester oder aeltester). */
async function supabaseZeitstempel({ tabelle, spalte, filter, richtung = 'desc' }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  const ziel = new URL(`${url.replace(/\/$/, '')}/rest/v1/${tabelle}`)
  ziel.searchParams.set('select', spalte)
  ziel.searchParams.set('order', `${spalte}.${richtung}`)
  ziel.searchParams.set('limit', '1')
  const roh = filter ? `${ziel}&${filter}` : ziel.toString()

  const res = await fetch(roh, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const zeilen = await res.json()
  return Array.isArray(zeilen) && zeilen.length > 0 ? zeilen[0][spalte] : null
}

/**
 * Neuester Datensatz einer Supabase-Tabelle.
 *
 * `wennLeer` (optional): Liefert der Filter noch nie eine Zeile — etwa weil noch nie
 * ein Entwurf freigegeben wurde —, zaehlt stattdessen das Alter des AELTESTEN Datensatzes
 * aus `wennLeer.filter`. Vorher galt „keine Zeile" sofort als ueberfaellig, unabhaengig
 * von maxTage: Beim ersten Live-Lauf (14.09.2026) schlug „Content-Freigaben" an, obwohl
 * der aelteste wartende Entwurf erst 8 Tage alt war (Frist 21). Die Frist soll ab dem
 * Moment laufen, ab dem es etwas zu entscheiden gibt. Wartet nichts, gibt es auch
 * keinen Stau.
 */
async function letzterSupabaseDatensatz({ tabelle, spalte, filter, wennLeer }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { uebersprungen: 'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen' }
  }

  const iso = await supabaseZeitstempel({ tabelle, spalte, filter })
  if (iso) return { iso }

  const keineZeile = `Tabelle ${tabelle} liefert keine Zeile${filter ? ` (Filter: ${filter})` : ''}`
  if (!wennLeer) return { leer: keineZeile }

  const aeltester = await supabaseZeitstempel({
    tabelle, spalte: wennLeer.spalte, filter: wennLeer.filter, richtung: 'asc',
  })
  if (!aeltester) return { nichtsOffen: `${keineZeile}, aber auch nichts wartend (${wennLeer.filter})` }
  return { iso: aeltester, bezug: `noch nie — ältester wartender Datensatz (${wennLeer.filter})` }
}

/**
 * Antwortet die Live-Seite?
 *
 * Nachgeruestet am 14.09.2026: An diesem Tag lieferte steakakademie.de ueber
 * Stunden HTTP 402 (x-vercel-error: DEPLOYMENT_DISABLED) — der Vercel-Account war
 * gesperrt, samtliche Deployments abgeschaltet. Der Heartbeat prueft bis dahin nur,
 * ob Inhalte NACHWACHSEN, nicht ob sie noch ERREICHBAR sind. Der Ausfall fiel
 * deshalb nur zufaellig auf, als ein roter Vercel-Check an einem Pull Request
 * auftauchte. Ein Waechter, der die Content-Produktion ueberwacht, aber nicht
 * merkt, dass die Website weg ist, hat die falsche Reihenfolge.
 *
 * Zweiter Anlauf vor dem Alarm: Einzelne Routen antworten nach einem Kaltstart
 * gelegentlich gar nicht (am 14.09. bei /hoefe beobachtet — erster Versuch
 * abgebrochen, zweiter 200 in 0,6 s). Ein Waechter, der bei jedem Zucken
 * anschlaegt, wird nach drei Fehlalarmen ignoriert.
 */
async function pruefeErreichbarkeit({ basis, pfade = ['/'], erlaubt = [200] }) {
  const kaputt = []

  for (const pfad of pfade) {
    const url = new URL(pfad, basis).toString()
    let letzter = null

    for (let versuch = 1; versuch <= 2; versuch++) {
      try {
        const res = await fetch(url, {
          redirect: 'follow',
          headers: { 'user-agent': 'steakakademie-ops-heartbeat' },
          signal: AbortSignal.timeout(20_000),
        })
        if (erlaubt.includes(res.status)) { letzter = null; break }
        // Der Fehlercode-Header von Vercel benennt die Ursache direkt.
        const grund = res.headers.get('x-vercel-error')
        letzter = `HTTP ${res.status}${grund ? ` (${grund})` : ''}`
      } catch (err) {
        letzter = err.name === 'TimeoutError' ? 'Zeitueberschreitung (20 s)' : err.message
      }
      if (versuch === 1) await new Promise(r => setTimeout(r, 3000))
    }

    if (letzter) kaputt.push(`${pfad}: ${letzter}`)
  }

  if (kaputt.length) return { unerreichbar: `${basis} — ${kaputt.join(' · ')}` }
  return { erreichbar: `${pfade.length} Route(n) antworten mit ${erlaubt.join('/')}` }
}

/** Letzter Start eines Workflows — deckt auf, wenn GitHub den Cron abgeschaltet hat. */
async function letzterWorkflowLauf(datei) {
  const repo  = process.env.GITHUB_REPOSITORY
  const token = process.env.GITHUB_TOKEN
  if (!repo || !token) return { uebersprungen: 'GITHUB_REPOSITORY / GITHUB_TOKEN fehlen (läuft nur in Actions)' }

  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${datei}/runs?per_page=1`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const daten = await res.json()
  const lauf  = daten.workflow_runs?.[0]
  if (!lauf) return { leer: `Workflow ${datei} hat noch nie gelaufen` }
  return { iso: lauf.created_at }
}

// ─── HAUPTLAUF ────────────────────────────────────────────────────────────────

async function pruefe(eintrag) {
  const basis = { name: eintrag.name, maxTage: eintrag.maxTage, hinweis: eintrag.hinweis }
  try {
    let ergebnis
    if (eintrag.typ === 'git')            ergebnis = { iso: letzteGitAenderung(eintrag.pfad) }
    else if (eintrag.typ === 'supabase')  ergebnis = await letzterSupabaseDatensatz(eintrag)
    else if (eintrag.typ === 'workflow')  ergebnis = await letzterWorkflowLauf(eintrag.datei)
    else if (eintrag.typ === 'http')      ergebnis = await pruefeErreichbarkeit(eintrag)
    else return { ...basis, status: 'fehler', text: `unbekannter Typ "${eintrag.typ}"` }

    if (ergebnis.uebersprungen) return { ...basis, status: 'uebersprungen', text: ergebnis.uebersprungen }
    if (ergebnis.leer)          return { ...basis, status: 'ueberfaellig', text: ergebnis.leer, alter: null }
    if (ergebnis.nichtsOffen)   return { ...basis, status: 'ok', text: ergebnis.nichtsOffen, alter: null }
    // Erreichbarkeit kennt kein Alter — die Seite ist da oder sie ist weg.
    if (ergebnis.erreichbar)    return { ...basis, status: 'ok', text: ergebnis.erreichbar, alter: null }
    if (ergebnis.unerreichbar)  return { ...basis, status: 'ueberfaellig', text: ergebnis.unerreichbar, alter: null }

    const alter = tageSeit(ergebnis.iso)
    const wann  = ergebnis.bezug ? `${ergebnis.bezug}: vor` : 'zuletzt vor'
    return {
      ...basis,
      status: alter > eintrag.maxTage ? 'ueberfaellig' : 'ok',
      alter,
      iso: ergebnis.iso,
      text: `${wann} ${alter.toFixed(1)} Tagen (${ergebnis.iso.slice(0, 10)}), erlaubt: ${eintrag.maxTage}`,
    }
  } catch (err) {
    return { ...basis, status: 'fehler', text: err.message }
  }
}

async function main() {
  if (!existsSync(CONFIG)) {
    console.error(c.red(`  data/ops-heartbeat.json fehlt.`))
    process.exit(1)
  }
  const eintraege = JSON.parse(readFileSync(CONFIG, 'utf-8'))

  console.log(c.bold('\n  Steakakademie — Ops-Heartbeat\n'))

  const ergebnisse = []
  for (const e of eintraege) ergebnisse.push(await pruefe(e))

  const symbol = { ok: c.green('OK   '), ueberfaellig: c.red('STILL'), fehler: c.red('FEHL '), uebersprungen: c.dim('SKIP ') }
  for (const r of ergebnisse) console.log(`  ${symbol[r.status]} ${r.name.padEnd(34)} ${c.dim(r.text)}`)

  const kaputt = ergebnisse.filter(r => r.status === 'ueberfaellig' || r.status === 'fehler')

  // Job-Summary — die Tabelle, die man im Actions-Tab sofort sieht.
  if (process.env.GITHUB_STEP_SUMMARY) {
    const zeichen = { ok: '✅', ueberfaellig: '🔴', fehler: '⚠️', uebersprungen: '⏭️' }
    const zeilen = [
      `## ${kaputt.length ? '🔴 Automation steht' : '✅ Automation lebt'}`, '',
      '| | Bereich | Befund |', '| --- | --- | --- |',
      ...ergebnisse.map(r => `| ${zeichen[r.status]} | ${r.name} | ${r.text} |`),
    ]
    if (kaputt.length) {
      zeilen.push('', '### Was jetzt zu tun ist', '')
      for (const r of kaputt) zeilen.push(`**${r.name}** — ${r.text}`, '', `> ${r.hinweis ?? ''}`, '')
    }
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, zeilen.join('\n') + '\n')
  }

  // Kurzfassung für den Jira-/Issue-Schritt im Workflow.
  if (process.env.GITHUB_OUTPUT) {
    const text = kaputt.map(r => `${r.name}: ${r.text}${r.hinweis ? ` — ${r.hinweis}` : ''}`).join(' | ')
    appendFileSync(process.env.GITHUB_OUTPUT,
      `still=${kaputt.length}\nbetroffen=${kaputt.map(r => r.name).join(', ')}\nbericht=${text.replace(/\n/g, ' ')}\n`)
  }

  if (kaputt.length === 0) {
    console.log(c.green('\n  Alle Bereiche liefern.\n'))
    return
  }

  console.log(c.red(`\n  ${kaputt.length} Bereich(e) ohne Ergebnis:`))
  for (const r of kaputt) console.log(c.red(`   • ${r.name}`) + (r.hinweis ? c.dim(`\n     ${r.hinweis}`) : ''))
  console.log()

  if (!NUR_BERICHT) process.exit(1)
}

main().catch(err => {
  console.error(c.red(`\n  Heartbeat selbst fehlgeschlagen: ${err.message}\n`))
  process.exit(1)
})
