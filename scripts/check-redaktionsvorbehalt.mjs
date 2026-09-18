#!/usr/bin/env node
/**
 * Build-Gate Redaktionsvorbehalt.
 *
 * Grundlage ist compliance/ai-act-einstufung.md, Punkt 3 (Texte, Art. 50 Abs. 4):
 * Die Kennzeichnungspflicht fuer KI-Texte entfaellt, WEIL jeder Entwurf geprueft
 * und verantwortet wird (Uwe Yendell). Diese Befreiung haengt damit an einer
 * Tatsache, nicht an einer Absicht — wenn ungeprueft veroeffentlichter KI-Text
 * live geht, faellt die Begruendung fuer die gesamte Einstufung weg.
 *
 * Deshalb ist dieses Gate blockierend und laeuft VOR `next build`: Ein
 * postbuild-Check (wie validate-frontmatter) meldet den Defekt erst, wenn das
 * Artefakt bereits existiert und Vercel unter Umstaenden schon deployed hat.
 * Bei einer Rechtsposition ist das der falsche Zeitpunkt.
 *
 * Geprueft werden alle .mdx-Dateien unter content/:
 *
 *   1. HART, ueberall: `reviewed: false` bei etwas, das nicht `status: draft`
 *      ist. Das ist exakt der gefaehrliche Fall — das Dokument behauptet,
 *      veroeffentlichungsfaehig zu sein, und traegt zugleich, dass niemand es
 *      geprueft hat.
 *
 *   2. HART, in STRENGE_PFADE: `status` und `reviewed` muessen explizit
 *      dastehen. Ein fehlendes Feld ist hier kein Altbestand, sondern ein
 *      vergessener Schritt.
 *
 *   3. HART, strukturell: Entwuerfe duerfen im Repo liegen, aber nicht in den
 *      Build geraten. Sobald eine Seite eine der Collections aus
 *      GESCHUETZTE_COLLECTIONS roh abfragt, ohne durch nurVeroeffentlicht() zu
 *      gehen, wuerden Entwuerfe mitrendern. Check C faengt das statisch ab.
 *
 *   4. WARNUNG, Altbestand: Dokumente ohne beide Felder, die vor dem STICHTAG
 *      veroeffentlicht wurden, brechen den Build nicht. Der Bestand ist vor
 *      Einfuehrung dieser Konvention entstanden; ein hartes Gate haette den
 *      Build ab der ersten Minute rot gesetzt — dieselbe Abwaegung wie die
 *      Stichtagsregel in validate-frontmatter.mjs.
 *
 * Usage:
 *   node scripts/check-redaktionsvorbehalt.mjs
 *   node scripts/check-redaktionsvorbehalt.mjs --strict   # Warnungen zaehlen als Fehler
 *
 * Exit 1 bei mindestens einem Fehler.
 */

import { readdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname, relative, sep } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT    = join(__dirname, '..')
const CONTENT = join(ROOT, 'content')
const SRC     = join(ROOT, 'src')

const STRICT = process.argv.includes('--strict')

/** Ab diesem publishedAt sind status/reviewed ueberall Pflicht. */
const STICHTAG = '2026-08-20'

/**
 * Verzeichnisse unter content/, in denen die Felder IMMER Pflicht sind —
 * unabhaengig vom Datum. Hier entsteht Neues, hier gibt es keinen Altbestand.
 */
const STRENGE_PFADE = ['artikel']

/**
 * Collections, deren Dokumente einen Redaktionsstatus tragen und die deshalb nie
 * roh gerendert werden duerfen. allGlossars steht seit dem 21.08.2026 dabei: Der
 * Glossar-Agent committet taeglich ungepruefte Eintraege direkt auf main - ohne
 * Filter waeren sie mit demselben Push live.
 */
const GESCHUETZTE_COLLECTIONS = ['allArtikels', 'allGlossars', 'allStreitfalls']

const STATUS_WERTE = ['draft', 'review', 'published']

const c = {
  g: s => `\x1b[32m${s}\x1b[0m`, y: s => `\x1b[33m${s}\x1b[0m`,
  r: s => `\x1b[31m${s}\x1b[0m`, d: s => `\x1b[2m${s}\x1b[0m`, b: s => `\x1b[1m${s}\x1b[0m`,
}

/**
 * Frontmatter-Feld lesen. Zeilenbasiert wie die uebrigen Skripte im Projekt und
 * mit \r im Zeichensatz, weil im Repo CRLF-Dateien liegen (KAN-26) — sonst
 * liest `reviewed: false\r` als "false\r" und jeder Vergleich schlaegt fehl.
 */
function feld(raw, key) {
  const m = raw.match(new RegExp(`^${key}:[ \\t]*(.*?)[ \\t\\r]*$`, 'm'))
  if (!m) return null
  return m[1].replace(/^["']|["']$/g, '').trim()
}

async function walk(dir, ext, acc = []) {
  if (!existsSync(dir)) return acc
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) await walk(p, ext, acc)
    else if (e.name.endsWith(ext)) acc.push(p)
  }
  return acc
}

const fehler = []
const warnungen = []
const entwuerfe = []
const err  = (slug, text) => fehler.push({ slug, text })
const warn = (slug, text) => warnungen.push({ slug, text })

async function main() {
  console.log(c.b('\n  Build-Gate: Redaktionsvorbehalt (AI Act Art. 50 Abs. 4)\n'))

  const dateien = await walk(CONTENT, '.mdx')
  console.log(c.d(`  ${dateien.length} Dokumente unter content/\n`))

  // ── Check A + B: Frontmatter-Vertrag ───────────────────────────────────────
  for (const datei of dateien) {
    const rel  = relative(ROOT, datei).split(sep).join('/')
    const slug = rel.replace(/^content\//, '').replace(/\.mdx$/, '')
    const raw  = await readFile(datei, 'utf8')

    const status      = feld(raw, 'status')
    const reviewedRoh = feld(raw, 'reviewed')
    const published   = feld(raw, 'publishedAt')
    const streng      = STRENGE_PFADE.some(p => rel.startsWith(`content/${p}/`))

    if (status !== null && !STATUS_WERTE.includes(status)) {
      err(slug, `status: "${status}" ist unbekannt (erlaubt: ${STATUS_WERTE.join(', ')})`)
      continue
    }
    if (reviewedRoh !== null && !['true', 'false'].includes(reviewedRoh)) {
      err(slug, `reviewed: "${reviewedRoh}" ist weder true noch false`)
      continue
    }
    const reviewed = reviewedRoh === null ? null : reviewedRoh === 'true'

    // Regel 1 — der gefaehrliche Fall, ueberall hart.
    if (reviewed === false && status !== 'draft') {
      err(slug, `reviewed: false, aber status: ${status ?? '(fehlt)'} — ungeprueft und trotzdem veroeffentlichungsfaehig`)
      continue
    }

    // Regel 2 — in strengen Pfaden sind beide Felder Pflicht.
    if (streng) {
      if (status === null)   err(slug, `status fehlt (Pflicht unter content/${STRENGE_PFADE.join('/, content/')}/)`)
      if (reviewed === null) err(slug, `reviewed fehlt (Pflicht unter content/${STRENGE_PFADE.join('/, content/')}/)`)
    } else if (status === null && reviewed === null) {
      // Regel 4 — Altbestand vor dem Stichtag: Warnung statt Fehler.
      if (published && published >= STICHTAG) {
        err(slug, `ab ${STICHTAG} veroeffentlicht, aber ohne status/reviewed`)
      } else {
        warn(slug, 'status/reviewed fehlen (Altbestand)')
      }
    }

    if (status === 'draft' || status === 'review') entwuerfe.push({ slug, status })
  }

  // ── Check C: Entwuerfe duerfen den Build nicht erreichen ────────────────────
  //
  // Ein Entwurf im Repo ist harmlos, solange keine Seite ihn rendert. Gefaehrlich
  // wird er, sobald eine Collection roh abgefragt wird — dann haengt die
  // Rechtsposition an einer Zeile, die niemand mehr liest. Deshalb statisch:
  // jede Verwendung von allArtikels muss durch nurVeroeffentlicht() oder
  // sichtbareArtikel() laufen. Beide liegen in src/lib/redaktion.ts; die zweite
  // faellt in Produktion auf die erste zurueck und ist deshalb gleichwertig.
  const quellen = await walk(SRC, '.tsx')
  await walk(SRC, '.ts', quellen)
  for (const q of quellen) {
    const raw = await readFile(q, 'utf8')
    const gefiltert = /\b(nurVeroeffentlicht|sichtbareArtikel)\b/.test(raw)
    for (const coll of GESCHUETZTE_COLLECTIONS) {
      if (!new RegExp(`\\b${coll}\\b`).test(raw)) continue
      if (gefiltert) continue
      err(
        relative(ROOT, q).split(sep).join('/'),
        `greift ${coll} roh ab — Entwuerfe wuerden mitrendern. nurVeroeffentlicht()/sichtbareArtikel() verwenden.`
      )
    }
  }

  // ── Bericht ────────────────────────────────────────────────────────────────
  if (fehler.length) {
    console.log(c.r(`  ✗ ${fehler.length} Fehler:\n`))
    for (const f of fehler) console.log(`    ${c.r('•')} ${f.slug.padEnd(46)} ${f.text}`)
    console.log()
  } else {
    console.log(c.g('  ✓ Keine Fehler.\n'))
  }

  if (entwuerfe.length) {
    console.log(c.d(`  ${entwuerfe.length} Entwurf/Entwuerfe im Repo (nicht veroeffentlicht, kein Fehler):`))
    for (const e of entwuerfe) console.log(c.d(`    · ${e.slug.padEnd(46)} status: ${e.status}`))
    console.log()
  }

  if (warnungen.length) {
    console.log(c.y(`  ⚠ ${warnungen.length} Warnungen (Altbestand vor ${STICHTAG}):\n`))
    console.log(c.d('    Diese Dokumente sind vor Einfuehrung des Redaktionsvorbehalts'))
    console.log(c.d(`    entstanden und brechen den Build nicht.`))
    console.log(c.d(`    STICHTAG IST KEIN KALENDERDATUM: hart geprueft wird jedes Dokument mit`))
    console.log(c.d(`    publishedAt >= ${STICHTAG} — unabhaengig davon, welcher Tag heute ist.`))
    console.log(c.d(`    Diese Warnungen verschwinden also nicht "wenn der Stichtag vorbei ist",`))
    console.log(c.d(`    sondern erst, wenn die Altdokumente status/reviewed bekommen.`))
    console.log(c.d('    Vollstaendige Liste mit --strict.\n'))
    if (STRICT) {
      for (const w of warnungen) console.log(`    ${c.y('·')} ${w.slug.padEnd(46)} ${w.text}`)
      console.log()
    }
  }

  const rot = fehler.length > 0 || (STRICT && warnungen.length > 0)
  if (rot) { console.log(c.r('  Build-Gate: FEHLGESCHLAGEN\n')); process.exit(1) }
  console.log(c.g('  Build-Gate: bestanden\n'))
}

main().catch(e => { console.error(e.stack || e.message); process.exit(1) })
