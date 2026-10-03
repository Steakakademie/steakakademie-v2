#!/usr/bin/env node
/**
 * Wächter — tägliche Belegprüfung (Schritt 1, 03.10.2026)
 *
 * Das Gate (scripts/check-zusagen.mjs) prüft im Pull Request, was ohne Netz geht.
 * Ob die Willkommensstrecke in Loops noch sendet, ob der Hofladen-Import diese
 * Woche geschrieben hat, ob die Spickzettel-Seite antwortet — das ändert sich,
 * ohne dass jemand einen Commit macht. Deshalb läuft diese Prüfung täglich im
 * Ops-Heartbeat und wertet JEDEN Beleg aus data/zusagen.yaml aus.
 *
 * Vier Zustände je Beleg (CLAUDE.md §2 Regel 10 — Grün ist kein Ergebnis):
 *   gedeckt        der Beleg hält
 *   gebrochen      der Beleg hält nicht → die Zusage steht ohne Deckung auf der Seite
 *   abgelaufen     eine Handbestätigung ist älter als ihre Frist
 *   nicht prüfbar  Zugang fehlt (Secret, Dienst nicht erreichbar) — NIE grün
 *
 * Meldeweg: kein eigener. `fuerHeartbeat()` liefert Zeilen in der Form des
 * Ops-Heartbeats; der macht daraus Job-Summary, roten Lauf, Issue und Jira-Ticket.
 *
 * Netz: nur lesende GET-Aufrufe. `fetchFn` und `env` kommen von außen, damit die
 * Tests ohne Netz laufen (scripts/zusagen.test.mjs).
 *
 * Aufruf:
 *   node scripts/zusagen-belege.mjs                # alle Belege, Exit 1 bei Befund
 *   node scripts/zusagen-belege.mjs --nur-offline  # ohne Netz (code, zaehlung, mensch)
 *   node scripts/zusagen-belege.mjs --nur-bericht  # nie Exit 1
 */

import { pathToFileURL } from 'node:url'
import {
  ROOT, STATUS, ONLINE_TYPEN, BELEG_TYPEN,
  ladeRegister, pruefeSchema, belegeVon, belegOffline, belegOnline,
} from './lib/zusagen.mjs'

/**
 * Wertet jeden Beleg aus. Liefert je Beleg
 * { id, typ, status, text, grund?, bei_bruch, abteilung, zusage }.
 */
export async function pruefeBelege ({ register, root = ROOT, fetchFn = globalThis.fetch, env = process.env, jetzt = Date.now(), nurOffline = false, pauseMs } = {}) {
  const ergebnisse = []
  const cache = {}
  for (const e of register.zusagen) {
    for (const b of belegeVon(e)) {
      const basis = { id: e.id, typ: b.typ, bei_bruch: e.bei_bruch, abteilung: e.abteilung, zusage: e.zusage }
      let r
      try {
        if (!ONLINE_TYPEN.includes(b.typ)) r = belegOffline(b, { root, jetzt })
        else if (nurOffline) r = { status: STATUS.blind, text: 'Lauf ohne Netz', grund: 'Lauf ohne Netz (--nur-offline)' }
        else r = await belegOnline(b, { fetchFn, env, jetzt, cache, pauseMs })
      } catch (err) {
        // Ein Fehler in der Prüfung selbst ist kein Befund über die Zusage.
        r = { status: STATUS.blind, text: `Prüfung abgebrochen: ${err.message}`, grund: 'Prüfung abgebrochen' }
      }
      ergebnisse.push({ ...basis, ...r })
    }
  }
  return ergebnisse
}

const einzeilig = (s) => String(s).replace(/\s*\|\s*/g, ' / ').replace(/\s+/g, ' ').trim()

/**
 * Belege → Zeilen für den Ops-Heartbeat (Status: ok · ueberfaellig · uebersprungen)
 * plus ein eigener Abschnitt fürs Job-Summary.
 *
 * Gruppiert, damit der Heartbeat lesbar bleibt: EINE Zeile für alles Gedeckte,
 * eine je gebrochener Zusage (mit dem, was zu tun ist), eine je Grund für
 * „nicht prüfbar" — fehlt ein Secret, ist das eine Zeile, nicht sieben.
 */
export function alsHeartbeat (ergebnisse, { zusagen = new Set(ergebnisse.map((r) => r.id)).size } = {}) {
  const von = (status) => ergebnisse.filter((r) => r.status === status)
  const gedeckt = von(STATUS.gedeckt)
  const kaputt = [...von(STATUS.gebrochen), ...von(STATUS.abgelaufen)]
  const blind = von(STATUS.blind)
  const zeilen = []

  if (gedeckt.length) zeilen.push({ name: 'Zusagen-Belege', status: 'ok', text: `${gedeckt.length} von ${ergebnisse.length} Belegen gedeckt (${zusagen} Zusagen im Register)` })

  const jeZusage = new Map()
  for (const r of kaputt) jeZusage.set(r.id, [...(jeZusage.get(r.id) ?? []), r])
  for (const [id, liste] of jeZusage) {
    zeilen.push({
      name: `Zusage ${id}`,
      status: 'ueberfaellig',
      text: einzeilig(liste.map((r) => `${r.status} (${r.typ}): ${r.text}`).join(' · ')),
      hinweis: einzeilig(`Auf der Seite steht: „${liste[0].zusage}" — ${liste[0].bei_bruch}`),
    })
  }

  const jeGrund = new Map()
  for (const r of blind) jeGrund.set(r.grund ?? r.text, [...(jeGrund.get(r.grund ?? r.text) ?? []), r])
  for (const [grund, liste] of jeGrund) {
    const ids = [...new Set(liste.map((r) => r.id))]
    zeilen.push({
      name: `Zusagen-Belege (${einzeilig(grund)})`,
      status: 'uebersprungen',
      text: einzeilig(`${liste.length} Beleg(e) nicht prüfbar — ${grund}: ${ids.join(', ')}`),
    })
  }

  const zahlen = { gedeckt: gedeckt.length, gebrochen: von(STATUS.gebrochen).length, abgelaufen: von(STATUS.abgelaufen).length, blind: blind.length, gesamt: ergebnisse.length, zusagen }
  const jeTyp = BELEG_TYPEN.map((t) => [t, ergebnisse.filter((r) => r.typ === t)]).filter(([, l]) => l.length)
  const md = [
    '', '## Zusagen-Belege', '',
    `**${zahlen.gedeckt} gedeckt · ${zahlen.gebrochen} gebrochen · ${zahlen.abgelaufen} abgelaufen · ${zahlen.blind} nicht prüfbar** (${zahlen.gesamt} Belege zu ${zusagen} Zusagen, data/zusagen.yaml)`, '',
    '| Beleg-Typ | gedeckt | gebrochen | abgelaufen | nicht prüfbar |', '| --- | --- | --- | --- | --- |',
    ...jeTyp.map(([t, l]) => `| ${t} | ${l.filter((r) => r.status === STATUS.gedeckt).length} | ${l.filter((r) => r.status === STATUS.gebrochen).length} | ${l.filter((r) => r.status === STATUS.abgelaufen).length} | ${l.filter((r) => r.status === STATUS.blind).length} |`),
  ]
  const offen = [...kaputt, ...blind]
  if (offen.length) {
    md.push('', '| Zusage | Beleg | Zustand | Befund |', '| --- | --- | --- | --- |',
      ...offen.map((r) => `| \`${r.id}\` | ${r.typ} | ${r.status === STATUS.blind ? 'NICHT PRÜFBAR' : r.status} | ${einzeilig(r.text)} |`))
  }
  return { zeilen, zahlen, markdown: md.join('\n') + '\n' }
}

/** Der ganze Lauf für den Heartbeat. Wirft nie — ein kaputtes Register ist ein Befund. */
export async function fuerHeartbeat (optionen = {}) {
  let register
  try { register = optionen.register ?? ladeRegister(optionen.root ?? ROOT) } catch (err) {
    return { zeilen: [{ name: 'Zusagen-Register', status: 'fehler', text: einzeilig(`data/zusagen.yaml nicht lesbar: ${err.message.split('\n')[0]}`), hinweis: 'npm run check:zusagen zeigt die Stelle.' }], zahlen: null, markdown: '' }
  }
  const form = pruefeSchema(register)
  if (form.length) {
    return { zeilen: [{ name: 'Zusagen-Register', status: 'fehler', text: einzeilig(`${form.length} Formfehler, erster: [${form[0].id}] ${form[0].text}`), hinweis: 'npm run check:zusagen zeigt alle.' }], zahlen: null, markdown: '' }
  }
  return alsHeartbeat(await pruefeBelege({ ...optionen, register }), { zusagen: register.zusagen.length })
}

async function main () {
  const args = process.argv.slice(2)
  const h = await fuerHeartbeat({ nurOffline: args.includes('--nur-offline') })
  const zeichen = { ok: 'OK   ', ueberfaellig: 'BRUCH', fehler: 'FEHL ', uebersprungen: 'BLIND' }
  console.log('\n  Steakakademie — Zusagen-Belege\n')
  for (const z of h.zeilen) console.log(`  ${zeichen[z.status]} ${z.name}\n        ${z.text}${z.hinweis ? `\n        → ${z.hinweis}` : ''}`)
  if (h.zahlen) console.log(`\n  ${h.zahlen.gedeckt} gedeckt · ${h.zahlen.gebrochen} gebrochen · ${h.zahlen.abgelaufen} abgelaufen · ${h.zahlen.blind} nicht prüfbar (von ${h.zahlen.gesamt})\n`)
  const gruen = h.zeilen.every((z) => z.status === 'ok')
  if (!gruen && !args.includes('--nur-bericht')) process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error(`\n  Belegprüfung selbst fehlgeschlagen: ${err.stack ?? err.message}\n`); process.exit(1) })
}
