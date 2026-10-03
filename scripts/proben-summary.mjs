#!/usr/bin/env node
/**
 * Funktionsproben — Auswertung für das Job-Summary (03.10.2026).
 *
 * Liest den JSON-Bericht von Playwright (playwright.proben.config.ts →
 * playwright-report/proben-results.json) und sagt mit Zahlen, was herauskam:
 * je Gruppe „bestanden / gesamt". Grün ohne Zahl wäre kein Ergebnis
 * (CLAUDE.md §2 Regel 10).
 *
 * Drei Zustände der angemeldeten Proben, die NICHT rot sind, aber sichtbar:
 *   - nicht eingerichtet  → die Secrets PROBE_EMAIL / PROBE_PASSWORD fehlen
 *   - Turnstile           → die Login-Seite gab dem Probenbrowser kein Token;
 *                           die Anmeldung über das Formular war nicht möglich
 *   - gelaufen            → Zahlen
 * Die ersten beiden kommen als `::warning::` in den Lauf — sonst sähe ein Lauf
 * ohne angemeldete Proben genauso aus wie einer mit.
 *
 * Rot (Exit 1) ist der Lauf, wenn eine Probe scheitert, wenn keine einzige
 * anonyme Probe gelaufen ist oder wenn der Bericht fehlt.
 *
 * Aufruf:  node scripts/proben-summary.mjs [pfad-zum-bericht]
 * Umgebung: BASE_URL (nur für die Überschrift), PROBE_EMAIL (wird aus
 *           Fehlertexten entfernt — das Repo und seine Läufe sind öffentlich).
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const STANDARD_BERICHT = 'playwright-report/proben-results.json'
const ANSI = /\u001b\[[0-9;]*m/g

/** Alle Tests des Berichts als flache Liste. */
export function sammle (report) {
  const liste = []
  const lauf = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        const letzter = t.results?.[t.results.length - 1]
        const annotationen = [...(t.annotations ?? []), ...(t.results ?? []).flatMap((r) => r.annotations ?? [])]
          .map((a) => ({ typ: a.type, text: a.description ?? '' }))
        liste.push({
          projekt: t.projectName ?? '',
          titel: spec.title,
          status: t.status, // expected | unexpected | flaky | skipped
          annotationen,
          fehler: (letzter?.error?.message ?? letzter?.errors?.[0]?.message ?? '').replace(ANSI, '').split('\n')[0].slice(0, 200),
        })
      }
    }
    for (const kind of suite.suites ?? []) lauf(kind)
  }
  for (const s of report.suites ?? []) lauf(s)
  return liste
}

function gruppe (tests) {
  const hat = (t, re) => t.annotationen.some((a) => a.typ === 'skip' && re.test(a.text))
  const ausgesetzt = tests.filter((t) => t.status === 'skipped' && t.annotationen.some((a) => a.typ === 'skip'))
  const z = {
    gesamt: tests.length,
    bestanden: tests.filter((t) => t.status === 'expected' || t.status === 'flaky').length,
    fehlgeschlagen: tests.filter((t) => t.status === 'unexpected').length,
    wackelig: tests.filter((t) => t.status === 'flaky').length,
    ausgesetzt: ausgesetzt.length,
    // Nach einem Fehlschlag in einer Kette laufen die folgenden Proben nicht mehr.
    nichtGelaufen: tests.filter((t) => t.status === 'skipped' && !t.annotationen.some((a) => a.typ === 'skip')).length,
  }
  if (z.gesamt === 0) z.zustand = 'fehlt'
  else if (z.fehlgeschlagen === 0 && z.bestanden === 0 && tests.some((t) => hat(t, /nicht eingerichtet/i))) z.zustand = 'nicht-eingerichtet'
  else if (z.fehlgeschlagen === 0 && tests.some((t) => hat(t, /Turnstile/))) z.zustand = 'turnstile'
  else z.zustand = 'gelaufen'
  return z
}

/**
 * @param {object|null} report  JSON-Bericht von Playwright, oder null, wenn er fehlt
 * @param {{ baseUrl?: string, schwaerzen?: string[] }} [opts]
 */
export function auswertung (report, opts = {}) {
  const baseUrl = opts.baseUrl || 'https://steakakademie.de'
  const schwaerzen = (opts.schwaerzen ?? []).filter(Boolean)
  const sauber = (text) => schwaerzen.reduce((t, geheim) => t.split(geheim).join('[Testkonto]'), text)

  if (!report) {
    const markdown = [
      `## Funktionsproben gegen ${baseUrl}`,
      '',
      '**Kein Ergebnisbericht** — die Proben sind nicht gelaufen (Installation oder Browser-Start gescheitert?).',
      '',
    ].join('\n')
    return { exitCode: 1, rot: true, warnungen: [], markdown, betroffen: 'Proben nicht gelaufen', bericht: 'Kein Ergebnisbericht — die Proben sind nicht gelaufen.', gruppen: null }
  }

  const tests = sammle(report)
  const anonym = gruppe(tests.filter((t) => t.projekt === 'anonym'))
  const angemeldet = gruppe(tests.filter((t) => t.projekt === 'angemeldet'))
  const gescheitert = tests.filter((t) => t.status === 'unexpected')
  const wackelig = tests.filter((t) => t.status === 'flaky')
  const turnstile = tests.flatMap((t) => t.annotationen).find((a) => a.typ === 'turnstile')?.text ?? null
  const dauerSek = Math.round((report.stats?.duration ?? 0) / 1000)

  const warnungen = []
  const zeile = (name, z) => {
    if (z.zustand === 'fehlt') return `| ${name} | nicht im Bericht | | | |`
    if (z.zustand === 'nicht-eingerichtet') return `| ${name} | **nicht eingerichtet** (Secrets PROBE_EMAIL/PROBE_PASSWORD fehlen) | | | ${z.ausgesetzt} |`
    if (z.zustand === 'turnstile') return `| ${name} | **nicht ausführbar** — Turnstile gab dem Probenbrowser kein Token | | | ${z.ausgesetzt} |`
    return `| ${name} | ${z.bestanden} / ${z.gesamt} | ${z.fehlgeschlagen} | ${z.wackelig} | ${z.ausgesetzt + z.nichtGelaufen} |`
  }

  if (angemeldet.zustand === 'nicht-eingerichtet' || angemeldet.zustand === 'fehlt') {
    warnungen.push('Angemeldete Proben nicht eingerichtet (Secrets PROBE_EMAIL/PROBE_PASSWORD fehlen) — geprüft wurde nur, was ein anonymer Besucher sieht.')
  }
  if (angemeldet.zustand === 'turnstile') {
    warnungen.push('Angemeldete Proben nicht ausführbar: Turnstile gab dem Probenbrowser kein Token, die Anmeldung über das Formular war nicht möglich.')
  }

  const markdown = [
    `## Funktionsproben gegen ${baseUrl}`,
    '',
    '| Gruppe | bestanden / gesamt | fehlgeschlagen | wackelig | nicht gelaufen |',
    '|---|---|---:|---:|---:|',
    zeile('anonym', anonym),
    zeile('angemeldet', angemeldet),
    '',
    `Dauer: ${dauerSek} s`,
    '',
    ...(turnstile ? [`Turnstile und automatisierter Browser (Beobachtung auf der Login-Seite): ${turnstile}`, ''] : []),
    ...(warnungen.length ? [...warnungen.map((w) => `> ⚠️ ${w}`), ''] : []),
    ...(gescheitert.length
      ? ['### Gescheitert', '', ...gescheitert.map((t) => `- **${t.titel}** (${t.projekt})${t.fehler ? ` — ${sauber(t.fehler)}` : ''}`), '']
      : []),
    ...(wackelig.length
      ? ['### Wackelig (erst im zweiten Anlauf bestanden)', '', ...wackelig.map((t) => `- ${t.titel} (${t.projekt})`), '']
      : []),
  ].join('\n')

  const anonymGelaufen = anonym.bestanden + anonym.fehlgeschlagen
  const gruende = []
  if (gescheitert.length) gruende.push(`${gescheitert.length} Probe(n) gescheitert`)
  if (anonymGelaufen === 0) gruende.push('keine einzige anonyme Probe gelaufen')
  const rot = gruende.length > 0

  return {
    exitCode: rot ? 1 : 0,
    rot,
    warnungen,
    markdown,
    gruppen: { anonym, angemeldet },
    dauerSek,
    turnstile,
    betroffen: gescheitert.length ? gescheitert.map((t) => t.titel).join(' · ').slice(0, 300) : gruende.join(' · '),
    bericht: rot
      ? `${gruende.join(', ')}. Anonym ${anonym.bestanden}/${anonym.gesamt}, angemeldet ${angemeldet.zustand === 'gelaufen' ? `${angemeldet.bestanden}/${angemeldet.gesamt}` : angemeldet.zustand}.`
      : '',
  }
}

function main () {
  const pfad = process.argv[2] || STANDARD_BERICHT
  const report = existsSync(pfad) ? JSON.parse(readFileSync(pfad, 'utf-8')) : null
  const a = auswertung(report, { baseUrl: process.env.BASE_URL, schwaerzen: [process.env.PROBE_EMAIL] })

  console.log(a.markdown)
  for (const w of a.warnungen) console.log(`::warning title=Funktionsproben::${w}`)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, a.markdown + '\n')
  if (process.env.GITHUB_OUTPUT) {
    // Einzeilig je Schlüssel — GITHUB_OUTPUT trennt an Zeilenumbrüchen.
    const eineZeile = (s) => String(s).replace(/[\r\n]+/g, ' ')
    appendFileSync(process.env.GITHUB_OUTPUT, `rot=${a.rot ? '1' : '0'}\nbetroffen=${eineZeile(a.betroffen)}\nbericht=${eineZeile(a.bericht)}\n`)
  }
  if (a.rot) console.error(`::error title=Funktionsproben::${a.bericht}`)
  process.exit(a.exitCode)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
