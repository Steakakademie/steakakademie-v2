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
 *                     Mit "nurNeueDateien": true zaehlt nur ein Commit, der dort eine
 *                     Datei HINZUGEFUEGT hat (siehe letzteGitAenderung).
 *   typ "supabase"  — wie alt ist der neueste Datensatz in dieser Tabelle?
 *   typ "artefakt"  — wann hat ein Workflow zuletzt dieses Artefakt hochgeladen?
 *                     Fuer Agenten, die weder ins Repo noch in die Datenbank liefern.
 *   typ "workflow"  — wann ist dieser Workflow zuletzt ueberhaupt gestartet?
 *                     (GitHub schaltet geplante Workflows in ruhigen Repos ab.)
 *   typ "http"      — antwortet die Live-Seite?
 *
 * Ist irgendein Punkt ueberfaellig, endet das Skript mit exit 1. Der Workflow wird
 * rot, GitHub verschickt die Fehlermail, und der aufrufende Workflow legt zusaetzlich
 * ein Jira-Ticket an. Ein stiller Ausfall ist damit kein stiller Ausfall mehr.
 *
 * NICHT GEPRUEFT IST NICHT GESUND (03.10.2026): Fehlt einer Pruefung ihr Zugang
 * (Supabase-Secrets, GitHub-Token), meldete sie bisher SKIP — und SKIP zaehlte wie
 * OK. Drei von zehn Pruefungen konnten so stumm wegfallen, der Lauf blieb gruen und
 * das Summary sagte „Automation lebt". Jetzt ist „nicht geprueft" ein eigener
 * Zustand: eigene Zeile, eigene Ueberschrift, und der Lauf endet mit exit 1. Ein
 * Waechter, der nicht hinsehen kann, darf nicht „alles in Ordnung" melden.
 *
 * ZUSAGEN-BELEGE (03.10.2026, Waechter Schritt 1): Nach den Bereichen aus
 * data/ops-heartbeat.json laufen die Belege aus data/zusagen.yaml mit — fuer jede
 * Zusage auf der Seite die Frage, ob das, wovon sie abhaengt, noch steht
 * (scripts/zusagen-belege.mjs, docs/waechter.md). Gleiches Urteil, gleicher Meldeweg.
 *
 * Aufruf:
 *   node scripts/ops-heartbeat.mjs
 *   node scripts/ops-heartbeat.mjs --nur-bericht   # nie exit 1, nur Ausgabe
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, appendFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

// ─── PRUEFER ──────────────────────────────────────────────────────────────────

/**
 * Letzte Aenderung eines Pfades. Braucht volle Historie (actions/checkout fetch-depth: 0).
 *
 * `nurNeueDateien` (03.10.2026): Ohne die Option zaehlt JEDER Commit im Pfad — auch
 * ein Tippfehler-Fix von Hand. Fuer einen Agenten, der neue Dateien liefern soll, ist
 * das die falsche Frage: Am 02.10.2026 meldete der Heartbeat „Glossar: vor 8,8 Tagen"
 * und meinte damit den Hand-Fix 3fa51a2 vom 23.09. Die letzte Lieferung des Agenten
 * war der 19.09. (PR #143). Jede redaktionelle Korrektur stellte die Uhr zurueck und
 * verdeckte den Stillstand. Mit der Option zaehlt nur ein Commit, der im Pfad eine
 * Datei HINZUGEFUEGT hat (`--diff-filter=A`; Umbenennungen sind R, nicht A).
 * Was bleibt: Legt ein Mensch eine neue Datei an, zaehlt auch das.
 *
 * Flacher Klon: An der Schnittkante sieht jede Datei „hinzugefuegt" aus. Das Ergebnis
 * waere dann ein falsches Datum statt eines Fehlers — deshalb bricht die Pruefung ab.
 */
export function letzteGitAenderung(pfad, { nurNeueDateien = false, cwd = ROOT } = {}) {
  const git = (args) => execFileSync('git', args, { cwd, encoding: 'utf-8' }).trim()
  if (nurNeueDateien && git(['rev-parse', '--is-shallow-repository']) === 'true') {
    throw new Error(`flacher Checkout — „neue Datei unter ${pfad}" ist so nicht bestimmbar (fetch-depth: 0 noetig)`)
  }
  const iso = git(['log', '-1', '--format=%cI', ...(nurNeueDateien ? ['--diff-filter=A'] : []), '--', pfad])
  if (!iso) {
    throw new Error(nurNeueDateien
      ? `kein Commit gefunden, der unter "${pfad}" eine Datei hinzufuegt`
      : `kein Commit fuer "${pfad}" gefunden — flacher Checkout? (fetch-depth: 0 noetig)`)
  }
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

/**
 * Juengstes Artefakt dieses Namens (03.10.2026).
 *
 * Fuer Agenten, deren Ergebnis weder im Repo noch in der Datenbank landet: social-grow
 * laedt seine Entwuerfe als Artefakt „social-drafts" hoch (social-drafts/ ist
 * gitignored). Ohne Entwuerfe entsteht kein Artefakt (`if-no-files-found: warn`) —
 * das Alter des juengsten ist damit die ehrliche Frage „wann kam zuletzt etwas heraus".
 * `minBytes` haelt eine leere Huelle draussen. Abgelaufene Artefakte zaehlen nicht.
 * Braucht `actions: read` (im Workflow gesetzt).
 */
async function letztesArtefakt({ artefakt, minBytes = 1 }) {
  const repo  = process.env.GITHUB_REPOSITORY
  const token = process.env.GITHUB_TOKEN
  if (!repo || !token) return { uebersprungen: 'GITHUB_REPOSITORY / GITHUB_TOKEN fehlen (läuft nur in Actions)' }

  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/artifacts?name=${encodeURIComponent(artefakt)}&per_page=30`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return juengstesArtefakt((await res.json()).artifacts, { artefakt, minBytes })
}

/** Auswahl aus der API-Antwort — getrennt, damit sie ohne Netz testbar ist. */
export function juengstesArtefakt(artefakte, { artefakt, minBytes = 1 }) {
  const brauchbar = (artefakte ?? [])
    .filter(a => a.name === artefakt && !a.expired && a.size_in_bytes >= minBytes)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  if (!brauchbar.length) return { leer: `kein Artefakt "${artefakt}" mit mindestens ${minBytes} Bytes vorhanden` }
  return { iso: brauchbar[0].created_at }
}

// ─── BEWERTUNG ────────────────────────────────────────────────────────────────

/** Rohergebnis einer Pruefung → Status. Reine Funktion (scripts/ops-heartbeat.test.mjs). */
export function bewerte(eintrag, ergebnis, jetzt = Date.now()) {
  const basis = { name: eintrag.name, maxTage: eintrag.maxTage, hinweis: eintrag.hinweis }

  if (ergebnis.uebersprungen) return { ...basis, status: 'uebersprungen', text: ergebnis.uebersprungen }
  if (ergebnis.leer)          return { ...basis, status: 'ueberfaellig', text: ergebnis.leer, alter: null }
  if (ergebnis.nichtsOffen)   return { ...basis, status: 'ok', text: ergebnis.nichtsOffen, alter: null }
  // Erreichbarkeit kennt kein Alter — die Seite ist da oder sie ist weg.
  if (ergebnis.erreichbar)    return { ...basis, status: 'ok', text: ergebnis.erreichbar, alter: null }
  if (ergebnis.unerreichbar)  return { ...basis, status: 'ueberfaellig', text: ergebnis.unerreichbar, alter: null }

  const alter = (jetzt - new Date(ergebnis.iso).getTime()) / 86_400_000
  const was   = eintrag.typ === 'git' && eintrag.nurNeueDateien ? 'zuletzt neue Datei vor' : 'zuletzt vor'
  const wann  = ergebnis.bezug ? `${ergebnis.bezug}: vor` : was
  return {
    ...basis,
    status: alter > eintrag.maxTage ? 'ueberfaellig' : 'ok',
    alter,
    iso: ergebnis.iso,
    text: `${wann} ${alter.toFixed(1)} Tagen (${ergebnis.iso.slice(0, 10)}), erlaubt: ${eintrag.maxTage}`,
  }
}

/**
 * Alle Ergebnisse → ein Urteil. Drei Zustaende, nicht zwei (03.10.2026):
 *   steht  — ueberfaellig oder Pruefung gescheitert
 *   blind  — nicht geprueft (Zugang fehlt). Zaehlt NICHT als gesund.
 *   lebt   — nur wenn jeder Bereich geprueft wurde und liefert
 */
export function urteil(ergebnisse) {
  const kaputt = ergebnisse.filter(r => r.status === 'ueberfaellig' || r.status === 'fehler')
  const blind  = ergebnisse.filter(r => r.status === 'uebersprungen')
  const ok     = ergebnisse.filter(r => r.status === 'ok')
  const zustand = kaputt.length ? 'steht' : blind.length ? 'blind' : 'lebt'

  const titel = {
    steht: '🔴 Automation steht',
    blind: `🟡 Wächter blind — ${blind.length} Bereich(e) nicht geprüft`,
    lebt:  '✅ Automation lebt',
  }[zustand]

  const zeichen = { ok: '✅', ueberfaellig: '🔴', fehler: '⚠️', uebersprungen: '🟡' }
  const markdown = [
    `## ${titel}`, '',
    `**${ok.length} liefern · ${kaputt.length} ohne Ergebnis · ${blind.length} nicht geprüft** (von ${ergebnisse.length})`, '',
    '| | Bereich | Befund |', '| --- | --- | --- |',
    ...ergebnisse.map(r => `| ${zeichen[r.status]} | ${r.name} | ${r.status === 'uebersprungen' ? `NICHT GEPRÜFT — ${r.text}` : r.text} |`),
  ]
  if (kaputt.length) {
    markdown.push('', '### Was jetzt zu tun ist', '')
    for (const r of kaputt) markdown.push(`**${r.name}** — ${r.text}`, '', `> ${r.hinweis ?? ''}`, '')
  }
  if (blind.length) {
    markdown.push('', '### Nicht geprüft — kein OK', '',
      'Diese Bereiche konnte der Wächter nicht ansehen. Ob sie liefern, ist unbekannt:', '',
      ...blind.map(r => `- **${r.name}** — ${r.text}`), '')
  }

  // Kurzfassung für den Jira-/Issue-Schritt im Workflow. Ein nicht geprüfter Bereich
  // trägt den Zusatz im Namen, damit Issue und Ticket ihn nicht als Stillstand lesen.
  const gemeldet = [
    ...kaputt.map(r => ({ name: r.name, text: `${r.name}: ${r.text}${r.hinweis ? ` — ${r.hinweis}` : ''}` })),
    ...blind.map(r => ({ name: `${r.name} (nicht geprüft)`, text: `${r.name}: NICHT GEPRÜFT — ${r.text}` })),
  ]
  return {
    zustand, titel, kaputt, blind, ok,
    markdown: markdown.join('\n') + '\n',
    ausgabe: `still=${gemeldet.length}\nbetroffen=${gemeldet.map(g => g.name).join(', ')}\nbericht=${gemeldet.map(g => g.text).join(' | ').replace(/\n/g, ' ')}\n`,
    exitCode: zustand === 'lebt' ? 0 : 1,
  }
}

// ─── HAUPTLAUF ────────────────────────────────────────────────────────────────

async function pruefe(eintrag) {
  try {
    let ergebnis
    if (eintrag.typ === 'git')            ergebnis = { iso: letzteGitAenderung(eintrag.pfad, { nurNeueDateien: eintrag.nurNeueDateien === true }) }
    else if (eintrag.typ === 'supabase')  ergebnis = await letzterSupabaseDatensatz(eintrag)
    else if (eintrag.typ === 'workflow')  ergebnis = await letzterWorkflowLauf(eintrag.datei)
    else if (eintrag.typ === 'artefakt')  ergebnis = await letztesArtefakt(eintrag)
    else if (eintrag.typ === 'http')      ergebnis = await pruefeErreichbarkeit(eintrag)
    else throw new Error(`unbekannter Typ "${eintrag.typ}"`)
    return bewerte(eintrag, ergebnis)
  } catch (err) {
    return { name: eintrag.name, maxTage: eintrag.maxTage, hinweis: eintrag.hinweis, status: 'fehler', text: err.message }
  }
}

/**
 * Zusagen-Belege (Wächter Schritt 1, 03.10.2026) als Heartbeat-Zeilen.
 *
 * Bewusst per `import()` und im try: Die Belegprüfung liest YAML (js-yaml), der
 * Heartbeat selbst kommt mit Node-Bordmitteln aus. Fehlt die Abhängigkeit — etwa
 * weil `npm ci` im Workflow gescheitert ist —, prüft der Heartbeat seine eigenen
 * Bereiche trotzdem und meldet die Belege als NICHT GEPRÜFT. Das ist rot, aber es
 * reißt den Wächter nicht mit.
 */
export async function zusagenBelege(lade = () => import('./zusagen-belege.mjs')) {
  try {
    const { fuerHeartbeat } = await lade()
    return await fuerHeartbeat()
  } catch (err) {
    return {
      markdown: '',
      zeilen: [{
        name: 'Zusagen-Belege',
        status: 'uebersprungen',
        text: `Belegprüfung nicht ladbar (${String(err.message).split('\n')[0]}) — Schritt „npm ci" im Workflow prüfen`,
      }],
    }
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

  // Wächter Schritt 1: die Belege aus data/zusagen.yaml laufen im selben Urteil mit —
  // ein Summary, ein Issue, ein Ticket (docs/waechter.md).
  const zusagen = await zusagenBelege()
  ergebnisse.push(...zusagen.zeilen)

  const symbol = { ok: c.green('OK   '), ueberfaellig: c.red('STILL'), fehler: c.red('FEHL '), uebersprungen: c.yellow('BLIND') }
  for (const r of ergebnisse) console.log(`  ${symbol[r.status]} ${r.name.padEnd(34)} ${c.dim(r.text)}`)

  const u = urteil(ergebnisse)

  // Job-Summary — die Tabelle, die man im Actions-Tab sofort sieht.
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, u.markdown + zusagen.markdown)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, u.ausgabe)

  if (u.zustand === 'lebt') {
    console.log(c.green('\n  Alle Bereiche geprüft, alle liefern.\n'))
    return
  }

  if (u.kaputt.length) {
    console.log(c.red(`\n  ${u.kaputt.length} Bereich(e) ohne Ergebnis:`))
    for (const r of u.kaputt) console.log(c.red(`   • ${r.name}`) + (r.hinweis ? c.dim(`\n     ${r.hinweis}`) : ''))
  }
  if (u.blind.length) {
    console.log(c.yellow(`\n  ${u.blind.length} Bereich(e) NICHT GEPRÜFT — das ist kein OK:`))
    for (const r of u.blind) console.log(c.yellow(`   • ${r.name}`) + c.dim(` — ${r.text}`))
  }
  console.log()

  if (!NUR_BERICHT) process.exit(u.exitCode)
}

// Nur beim direkten Aufruf laufen lassen — sonst startet schon der Import im Test
// einen echten Lauf. Gleiches Muster wie scripts/recipe-agent.mjs.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error(c.red(`\n  Heartbeat selbst fehlgeschlagen: ${err.message}\n`))
    process.exit(1)
  })
}
