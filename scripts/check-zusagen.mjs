#!/usr/bin/env node
/**
 * Gate „keine Zusage ohne Beleg" (Wächter Schritt 1, 03.10.2026) — läuft in
 * `npm run check`, damit im Pflicht-Check „P0-Gates pruefen" auf jedem Pull Request.
 * NICHT im prebuild (das wäre eine Entscheidung des Inhabers, CLAUDE.md §4).
 *
 * Drei Prüfungen, in dieser Reihenfolge:
 *   1. REGISTER   data/zusagen.yaml hat die richtige Form, jede ID ist eindeutig,
 *                 jede Fundstelle (`wo`) gibt es und sie enthält ihr `muster`.
 *   2. BELEGE     Was ohne Netz prüfbar ist, wird geprüft: `code` und `zaehlung`.
 *                 Handbestätigungen (`mensch`) werden auf Ablauf angesehen.
 *                 Netz-Belege (http, loops, supabase) prüft der tägliche Lauf.
 *   3. SEITENTEXT Zusage-Muster in src/app, src/components und content/: Zeit und
 *                 Frequenz, Versand, Test und Prüfung, getippte Bestandszahlen,
 *                 Garantien. Ein Treffer ist in Ordnung, wenn ihn ein
 *                 Register-Eintrag deckt oder er in der Baseline steht.
 *
 * RATCHET: Was es beim Einführen schon gab, steht in data/zusagen-baseline.json
 * und blockiert nicht — NEUES schon. Die Baseline wird nur kleiner: Beleg
 * eintragen oder Satz ändern, dann `npm run check:zusagen:baseline`.
 *
 * Exitcodes: 0 = in Ordnung · 1 = Befund · 2 = Skriptfehler
 *
 * Aufruf:
 *   node scripts/check-zusagen.mjs                    # Gate
 *   node scripts/check-zusagen.mjs --alle             # auch Baseline-Treffer zeigen
 *   node scripts/check-zusagen.mjs --update-baseline  # Baseline neu schreiben
 *   node scripts/check-zusagen.mjs --ablauf-blockiert # abgelaufene Handbestätigung = Fehler
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  ROOT, REGISTER, BASELINE, KLASSEN, ONLINE_TYPEN, STATUS,
  ladeRegister, pruefeSchema, belegeVon, belegOffline,
  istSuchdatei, SUCHBAEUME, findeZusagen, fundstellen, istGedeckt, ladeBaseline, baueBaseline,
} from './lib/zusagen.mjs'
import { sichtbarerText, normalisiere, zeileVon } from './lib/zusagen-text.mjs'

/** Ab so vielen Resttagen wird eine Handbestätigung angekündigt. */
const VORWARNUNG_TAGE = 14

function alleDateien (root) {
  const out = []
  const lauf = (rel) => {
    for (const name of readdirSync(join(root, rel)).sort()) {
      const pfad = `${rel}/${name}`
      if (statSync(join(root, pfad)).isDirectory()) lauf(pfad)
      else if (istSuchdatei(pfad)) out.push(pfad)
    }
  }
  for (const baum of SUCHBAEUME) if (existsSync(join(root, baum))) lauf(baum)
  return out
}

/**
 * Der ganze Lauf als Funktion — der Test ruft sie mit einem Wegwerf-Verzeichnis.
 * Liefert alles, was die Ausgabe braucht; schreibt nichts.
 */
export function pruefe ({ root = ROOT, jetzt = Date.now(), ablaufBlockiert = false } = {}) {
  const fehler = []      // { art, id?, datei?, zeile?, text }
  const warnungen = []
  if (!existsSync(join(root, REGISTER))) {
    return { fehler: [{ art: 'register', id: '(Datei)', text: `${REGISTER} fehlt` }], warnungen, neu: [], bekannt: [], gedeckt: [], behoben: [], funde: [], register: { zusagen: [], keine_zusage: [] }, dateien: 0 }
  }

  let register
  try { register = ladeRegister(root) } catch (e) {
    return { fehler: [{ art: 'register', id: '(Datei)', text: `${REGISTER} ist kein gültiges YAML — ${e.message.split('\n')[0]}` }], warnungen, neu: [], bekannt: [], gedeckt: [], behoben: [], funde: [], register: { zusagen: [], keine_zusage: [] }, dateien: 0 }
  }
  for (const f of pruefeSchema(register)) fehler.push({ art: 'register', ...f })
  const formOk = fehler.length === 0

  // Sichtbarer Text je Datei — einmal gelesen, für Fundstellen und Muster.
  const speicher = new Map()
  const sicht = (datei) => {
    if (!speicher.has(datei)) {
      const pfad = join(root, datei)
      if (!existsSync(pfad)) speicher.set(datei, null)
      else {
        const quelle = readFileSync(pfad, 'utf8')
        const lesbar = /\.(?:tsx?|jsx?|mdx?)$/.test(datei)
        const s = lesbar ? sichtbarerText(datei, quelle) : { text: quelle, segmente: [[0, quelle.length]] }
        speicher.set(datei, { quelle, s, n: normalisiere(s.text) })
      }
    }
    return speicher.get(datei)
  }

  // 1. Fundstellen: jede `wo.datei` gibt es und enthält ihr `muster`.
  const deckung = new Map()   // datei → [[von, bis], …]
  const merke = (datei, bereiche) => deckung.set(datei, [...(deckung.get(datei) ?? []), ...bereiche])
  if (formOk) {
    for (const e of register.zusagen) {
      for (const w of [].concat(e.wo)) {
        const d = sicht(w.datei)
        if (!d) { fehler.push({ art: 'register', id: e.id, datei: w.datei, text: `Fundstelle fehlt: die Datei ${w.datei} gibt es nicht (mehr). Steht die Zusage woanders, „wo" anpassen; ist sie weg, den Eintrag löschen.` }); continue }
        const stellen = fundstellen(d.n.norm, w.muster)
        if (!stellen.length) { fehler.push({ art: 'register', id: e.id, datei: w.datei, text: `Fundstelle passt nicht mehr: „${w.muster}" steht nicht im sichtbaren Text von ${w.datei}. Wurde der Satz geändert, „muster" nachziehen — und prüfen, ob der Beleg die neue Fassung noch deckt.` }); continue }
        merke(w.datei, stellen)
      }
    }
    for (const [i, k] of register.keine_zusage.entries()) {
      const d = sicht(k.datei)
      const stellen = d ? fundstellen(d.n.norm, k.muster) : []
      if (!stellen.length) { fehler.push({ art: 'register', id: `keine_zusage[${i + 1}]`, datei: k.datei, text: `„${k.muster}" steht nicht (mehr) in ${k.datei} — Eintrag löschen oder anpassen.` }); continue }
      merke(k.datei, stellen)
    }
  }

  // 2. Belege ohne Netz.
  const belege = { code: 0, zaehlung: 0, http: 0, loops: 0, supabase: 0, mensch: 0 }
  if (formOk) {
    for (const e of register.zusagen) {
      for (const b of belegeVon(e)) {
        belege[b.typ]++
        if (ONLINE_TYPEN.includes(b.typ)) continue
        const r = belegOffline(b, { root, jetzt })
        if (b.typ === 'mensch') {
          if (r.status === STATUS.abgelaufen) (ablaufBlockiert ? fehler : warnungen).push({ art: 'beleg', id: e.id, text: r.text })
          else if (r.status === STATUS.gebrochen) fehler.push({ art: 'beleg', id: e.id, text: r.text })
          else if (r.rest <= VORWARNUNG_TAGE) warnungen.push({ art: 'beleg', id: e.id, text: `Handbestätigung läuft in ${r.rest} Tag(en) ab: ${b.was}` })
          continue
        }
        if (r.status !== STATUS.gedeckt) fehler.push({ art: 'beleg', id: e.id, text: `Beleg (${b.typ}) hält nicht: ${r.text}. Entweder stimmt der Satz nicht mehr — dann ändern — oder der Beleg zeigt auf die falsche Stelle. Bei Bruch: ${e.bei_bruch}` })
      }
    }
  }

  // 3. Seitentext.
  const dateien = alleDateien(root)
  const funde = []
  for (const datei of dateien) {
    const d = sicht(datei)
    for (const f of findeZusagen(datei, d.s, d.n)) {
      funde.push({ ...f, datei, zeile: zeileVon(d.quelle, d.n.karte[f.von]), gedeckt: istGedeckt(f, deckung.get(datei) ?? []) })
    }
  }
  // Je Satz ein Befund: Treffen zwei Muster denselben Satz („erhältst du … per
  // E-Mail" und „per E-Mail"), ist das eine Zusage. Gedeckt ist der Satz nur, wenn
  // JEDER seiner Treffer in einem Register-Muster liegt.
  const saetze = new Map()
  for (const f of funde) {
    const s = saetze.get(f.id)
    if (!s) saetze.set(f.id, { ...f })
    else {
      s.gedeckt = s.gedeckt && f.gedeckt
      if (!s.treffer.split(' · ').includes(f.treffer)) s.treffer += ` · ${f.treffer}`
    }
  }
  const alle = [...saetze.values()]
  const offen = alle.filter((f) => !f.gedeckt)
  const bekanntIds = new Set(ladeBaseline(root).treffer.map((t) => t.id))
  const neu = offen.filter((f) => !bekanntIds.has(f.id))
  const bekannt = offen.filter((f) => bekanntIds.has(f.id))
  const offenIds = new Set(offen.map((f) => f.id))
  const behoben = ladeBaseline(root).treffer.filter((t) => !offenIds.has(t.id))

  return { fehler, warnungen, neu, bekannt, gedeckt: alle.filter((f) => f.gedeckt), behoben, funde: alle, offen, register, belege, dateien: dateien.length }
}

function main () {
  const args = process.argv.slice(2)
  const t0 = Date.now()
  const e = pruefe({ ablaufBlockiert: args.includes('--ablauf-blockiert') })

  if (args.includes('--update-baseline')) {
    if (e.fehler.length) {
      console.error(`Baseline NICHT geschrieben — erst das Register in Ordnung bringen:\n${e.fehler.map((f) => `  [${f.id}] ${f.text}`).join('\n')}`)
      process.exit(1)
    }
    const neu = baueBaseline(e.offen)
    const vorher = ladeBaseline().treffer.length
    writeFileSync(join(ROOT, BASELINE), JSON.stringify(neu, null, 2) + '\n')
    const jeKlasse = Object.keys(KLASSEN).map((k) => `${KLASSEN[k].titel} ${neu.treffer.filter((t) => t.klasse === k).length}`).join(' · ')
    console.log(`Baseline geschrieben: ${neu.treffer.length} Treffer (vorher ${vorher}) — ${jeKlasse}`)
    process.exit(0)
  }

  const n = e.register.zusagen.length
  const typen = Object.entries(e.belege ?? {}).filter(([, z]) => z).map(([t, z]) => `${t} ${z}`).join(' · ')
  console.log(`Zusagen: ${n} im Register (${typen || 'keine Belege'}) · ${e.dateien} Dateien · ${e.funde.length} Muster-Treffer — ${e.gedeckt.length} gedeckt · ${e.bekannt.length} bekannt (Baseline) · ${e.neu.length} neu · ${((Date.now() - t0) / 1000).toFixed(1)} s`)

  if (e.fehler.length) {
    console.log('\n✗ REGISTER UND BELEGE (blockieren):')
    for (const f of e.fehler) console.log(`  ${REGISTER}  [${f.id}] ${f.text}`)
  }
  if (e.neu.length) {
    console.log('\n✗ NEUE ZUSAGE OHNE BELEG (blockiert):')
    for (const f of e.neu) console.log(`  ${f.datei}:${f.zeile}  [${KLASSEN[f.klasse].titel}] „${f.treffer}"\n      „${f.satz.slice(0, 220)}"`)
    console.log(`
  Zwei Auswege:
    1. Beleg eintragen — ein Eintrag in ${REGISTER}, dessen „wo.muster" den Satz enthält
       und dessen „beleg" zeigt, wovon die Zusage abhängt (Anleitung: docs/waechter.md).
    2. Umformulieren — den Satz so schreiben, dass er nichts verspricht, was niemand deckt.
  Ist der Satz gar keine Zusage (Kochanweisung, Zitat, Rechtsbegriff): unter
  „keine_zusage" in ${REGISTER} eintragen, mit Grund. Nie von Hand in die Baseline.`)
  }
  if (e.warnungen.length) console.log('\n⚠ Hinweise (blockieren nicht):\n' + e.warnungen.map((w) => `  [${w.id}] ${w.text}`).join('\n'))
  if (args.includes('--alle') && e.bekannt.length) console.log('\n· Bekannt aus Baseline:\n' + e.bekannt.map((f) => `  ${f.datei}:${f.zeile}  [${KLASSEN[f.klasse].titel}] „${f.satz.slice(0, 160)}"`).join('\n'))
  if (e.behoben.length) console.log(`\n✓ ${e.behoben.length} Baseline-Treffer erledigt (gedeckt oder Satz geändert) — Baseline verkleinern: npm run check:zusagen:baseline`)

  if (process.env.GITHUB_STEP_SUMMARY) {
    const md = ['### Zusagen', `${n} im Register · ${e.gedeckt.length} Treffer gedeckt · ${e.bekannt.length} bekannt · **${e.neu.length} neu** · ${e.fehler.length} Register-/Beleg-Fehler`,
      ...e.fehler.map((f) => `- ❌ \`${f.id}\` — ${f.text}`),
      ...e.neu.map((f) => `- ❌ \`${f.datei}:${f.zeile}\` **${KLASSEN[f.klasse].titel}** — „${f.treffer}"`)].join('\n')
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n')
  }
  process.exit(e.fehler.length || e.neu.length ? 1 : 0)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main() } catch (err) {
    console.error(`check-zusagen selbst fehlgeschlagen: ${err.stack ?? err.message}`)
    process.exit(2)
  }
}
