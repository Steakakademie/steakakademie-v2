#!/usr/bin/env node
/**
 * Prüfstand — welche veröffentlichten Dokumente tragen ein Prüfdatum? (03.10.2026)
 *
 * WOZU: Die Aussage „geprüft“ gibt es auf der Seite nur noch mit `reviewedAt`
 * (src/lib/pruefnachweis.ts). Der Altbestand trägt das Feld überwiegend nicht
 * und wird in Tranchen von Hand nachgeprüft. Dieses Werkzeug zeigt je Sammlung,
 * was schon ein Prüfdatum hat und was noch offen ist — die Arbeitsliste dafür.
 *
 * KEIN GATE: Das Skript endet immer mit 0, sobald es die Zahlen liefern konnte.
 * Es hängt in keinem Build und in keinem Check. Eine offene Liste ist der
 * erwartete Zustand, kein Fehler.
 *
 * Gelesen wird das Frontmatter direkt aus content/ — ohne Contentlayer-Build,
 * damit das Werkzeug auch im Arbeitsbaum ohne gebaute Kopie läuft. Zwei Regeln
 * sind deshalb hier gespiegelt und per Test an die Quelle gebunden
 * (scripts/pruefstand.test.mjs):
 *   - „veröffentlicht“  = nurVeroeffentlicht() aus src/lib/redaktion.ts, mit den
 *     Vorgabewerten je Sammlung aus contentlayer.config.ts (VORGABEN unten).
 *   - „gültiges Prüfdatum“ = pruefdatum() aus src/lib/pruefnachweis.ts.
 *
 * `reviewedAt` trägt dieses Skript NIE ein. Das Datum setzt nur Uwe von Hand,
 * nachdem er das Dokument gelesen hat (CLAUDE.md §2 Regel 4).
 *
 * Usage:
 *   npm run pruefstand                          # Zahlen + Liste ohne Prüfdatum
 *   npm run pruefstand -- --sammlung rezepte    # nur eine Sammlung
 *   npm run pruefstand -- --json                # maschinenlesbar
 *   npm run pruefstand -- --nur-zahlen          # Tabelle ohne Liste
 */

import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { istVeroeffentlicht } from './lib/social-auswahl.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT    = join(__dirname, '..')
const CONTENT = join(ROOT, 'content')

/** Unter content/ ausgenommen — wie `contentDirExclude` in contentlayer.config.ts. */
export const AUSGENOMMEN = ['_archiv']

/**
 * Vorgabewerte von `status`/`reviewed` je Sammlung (Ordner unter content/), wie
 * contentlayer.config.ts sie setzt. Nicht genannte Sammlungen: published/true —
 * bzw. gar kein Redaktionsstatus, was auf dasselbe hinausläuft.
 */
export const VORGABEN = {
  eigenregie: { status: 'draft', reviewed: false },
}

/** Frontmatter-Block einer .mdx-Datei (ohne die ---Zeilen) — oder '' ohne Block. */
export function frontmatterBlock (raw) {
  const m = /^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(raw)
  return m ? m[1] : ''
}

/**
 * Ein Feld der obersten Ebene lesen. Zeilenbasiert wie die übrigen Skripte und
 * mit \r im Zeichensatz (im Repo liegen CRLF-Dateien). Gesucht wird nur im
 * Frontmatter — ein „status:“ im Fließtext zählt nicht.
 */
export function feld (block, key) {
  const m = block.match(new RegExp(`^${key}:[ \\t]*(.*?)[ \\t\\r]*$`, 'm'))
  if (!m) return null
  return m[1].replace(/[ \t]+#.*$/, '').replace(/^["']|["']$/g, '').trim()
}

/** Die Felder, an denen Sichtbarkeit und Prüfnachweis hängen. */
export function leseStatus (raw, sammlung) {
  const block = frontmatterBlock(raw)
  const vorgabe = VORGABEN[sammlung] ?? { status: 'published', reviewed: true }
  const reviewedRoh = feld(block, 'reviewed')
  return {
    status: feld(block, 'status') ?? vorgabe.status,
    reviewed: reviewedRoh === null ? vorgabe.reviewed : reviewedRoh === 'true',
    publishedAt: feld(block, 'publishedAt') ?? undefined,
    reviewedAt: feld(block, 'reviewedAt'),
  }
}

/** JJJJ-MM-TT, wahlweise mit Uhrzeit dahinter. */
const ISO_DATUM = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/

/** Der Kalendertag in Deutschland als JJJJ-MM-TT. */
export function tagInDeutschland (datum) {
  const teile = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(datum)
  const teil = (typ) => teile.find((t) => t.type === typ)?.value ?? ''
  return `${teil('year')}-${teil('month')}-${teil('day')}`
}

/**
 * Prüfdatum bewerten — dieselbe Regel wie pruefdatum() in src/lib/pruefnachweis.ts.
 * @returns {{ gueltig: true, datum: string } | { gueltig: false, grund: string | null }}
 *          `grund: null` heißt: es steht gar kein Datum da.
 */
export function bewertePruefdatum ({ reviewedAt, reviewed }, jetzt = new Date()) {
  if (reviewedAt === null || reviewedAt === undefined || String(reviewedAt).trim() === '') {
    return { gueltig: false, grund: null }
  }
  const wert = String(reviewedAt).trim()
  if (reviewed === false) return { gueltig: false, grund: 'reviewed: false schlägt das Datum' }
  const m = ISO_DATUM.exec(wert)
  if (!m) return { gueltig: false, grund: `„${wert}“ ist kein Datum in der Schreibweise JJJJ-MM-TT` }
  const [, jahr, monat, tag] = m
  const d = new Date(Date.UTC(Number(jahr), Number(monat) - 1, Number(tag)))
  if (d.getUTCFullYear() !== Number(jahr) || d.getUTCMonth() !== Number(monat) - 1 || d.getUTCDate() !== Number(tag)) {
    return { gueltig: false, grund: `den Kalendertag ${wert.slice(0, 10)} gibt es nicht` }
  }
  const iso = `${jahr}-${monat}-${tag}`
  if (iso > tagInDeutschland(jetzt)) return { gueltig: false, grund: `${iso} liegt in der Zukunft` }
  return { gueltig: true, datum: iso }
}

/**
 * @param {{ pfad: string, sammlung: string, status?: string, reviewed?: boolean, publishedAt?: string, reviewedAt?: string | null }[]} dokumente
 * @param {{ jetzt?: Date, sammlung?: string }} [o]
 */
export function pruefstand (dokumente, { jetzt = new Date(), sammlung } = {}) {
  const nachSammlung = new Map()
  for (const d of dokumente) {
    if (sammlung && d.sammlung !== sammlung) continue
    if (!nachSammlung.has(d.sammlung)) {
      nachSammlung.set(d.sammlung, { name: d.sammlung, gesamt: 0, veroeffentlicht: 0, mitPruefdatum: 0, ohnePruefdatum: 0, ungueltig: 0, ohne: [] })
    }
    const s = nachSammlung.get(d.sammlung)
    s.gesamt++
    if (!istVeroeffentlicht(d, jetzt)) continue
    s.veroeffentlicht++
    const urteil = bewertePruefdatum(d, jetzt)
    if (urteil.gueltig) { s.mitPruefdatum++; continue }
    s.ohnePruefdatum++
    if (urteil.grund) s.ungueltig++
    s.ohne.push({ pfad: d.pfad, publishedAt: d.publishedAt ?? null, ...(urteil.grund ? { grund: urteil.grund } : {}) })
  }
  const sammlungen = [...nachSammlung.values()].sort((a, b) => a.name.localeCompare(b.name))
  for (const s of sammlungen) s.ohne.sort((a, b) => a.pfad.localeCompare(b.pfad))
  const summe = sammlungen.reduce(
    (z, s) => ({
      gesamt: z.gesamt + s.gesamt,
      veroeffentlicht: z.veroeffentlicht + s.veroeffentlicht,
      mitPruefdatum: z.mitPruefdatum + s.mitPruefdatum,
      ohnePruefdatum: z.ohnePruefdatum + s.ohnePruefdatum,
      ungueltig: z.ungueltig + s.ungueltig,
    }),
    { gesamt: 0, veroeffentlicht: 0, mitPruefdatum: 0, ohnePruefdatum: 0, ungueltig: 0 },
  )
  return { stand: tagInDeutschland(jetzt), sammlungen, summe }
}

/** Bericht als Text. `liste: false` lässt die Dokumentliste weg. */
export function alsText (ergebnis, { liste = true } = {}) {
  const z = []
  const zeile = (name, s) =>
    `  ${name.padEnd(20)}${String(s.veroeffentlicht).padStart(8)}${String(s.mitPruefdatum).padStart(10)}${String(s.ohnePruefdatum).padStart(8)}`
  z.push('')
  z.push(`  Prüfstand — veröffentlichte Dokumente mit und ohne Prüfdatum (Stand ${ergebnis.stand})`)
  z.push('')
  z.push(`  ${'Sammlung'.padEnd(20)}${'veröff.'.padStart(8)}${'mit Datum'.padStart(10)}${'ohne'.padStart(8)}`)
  z.push(`  ${'-'.repeat(46)}`)
  for (const s of ergebnis.sammlungen) z.push(zeile(s.name, s))
  z.push(`  ${'-'.repeat(46)}`)
  z.push(zeile('Summe', ergebnis.summe))
  z.push('')
  if (ergebnis.summe.ungueltig > 0) {
    z.push(`  ${ergebnis.summe.ungueltig} Dokument(e) tragen ein reviewedAt, das nicht als Prüfdatum zählt — Grund steht in der Liste.`)
    z.push('')
  }
  if (liste) {
    for (const s of ergebnis.sammlungen) {
      if (s.ohne.length === 0) continue
      z.push(`  ${s.name} — ${s.ohne.length} ohne Prüfdatum:`)
      for (const d of s.ohne) z.push(`    ${d.pfad}${d.grund ? `   ← ${d.grund}` : ''}`)
      z.push('')
    }
  }
  z.push('  „Geprüft“ steht auf der Seite nur an Dokumenten mit Prüfdatum. reviewedAt setzt Uwe von Hand.')
  z.push('')
  return z.join('\n')
}

async function walk (dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) await walk(p, acc)
    else if (e.name.endsWith('.mdx')) acc.push(p)
  }
  return acc
}

/** Alle Dokumente unter content/ mit den Feldern für den Prüfstand. */
export async function leseDokumente (contentDir = CONTENT, root = ROOT) {
  const dokumente = []
  for (const e of await readdir(contentDir, { withFileTypes: true })) {
    if (!e.isDirectory() || AUSGENOMMEN.includes(e.name)) continue
    for (const datei of await walk(join(contentDir, e.name))) {
      const raw = await readFile(datei, 'utf8')
      dokumente.push({
        pfad: relative(root, datei).split(sep).join('/'),
        sammlung: e.name,
        ...leseStatus(raw, e.name),
      })
    }
  }
  return dokumente
}

function argument (name) {
  const i = process.argv.indexOf(name)
  return i === -1 ? undefined : process.argv[i + 1]
}

async function main () {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('\n  npm run pruefstand [-- --sammlung <name>] [--json] [--nur-zahlen]\n')
    return
  }
  const dokumente = await leseDokumente()
  const namen = [...new Set(dokumente.map((d) => d.sammlung))].sort()
  const sammlung = argument('--sammlung')
  if (process.argv.includes('--sammlung') && (!sammlung || !namen.includes(sammlung))) {
    console.error(`\n  Sammlung „${sammlung ?? ''}“ gibt es nicht. Vorhanden: ${namen.join(', ')}\n`)
    process.exitCode = 2
    return
  }
  const ergebnis = pruefstand(dokumente, { sammlung })
  if (process.argv.includes('--json')) console.log(JSON.stringify(ergebnis, null, 2))
  else console.log(alsText(ergebnis, { liste: !process.argv.includes('--nur-zahlen') }))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.stack || e.message); process.exitCode = 1 })
}
