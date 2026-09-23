#!/usr/bin/env node
/**
 * Schreibt den Befund von spell-check.mjs in die GitHub-Job-Summary.
 *
 * Warum es das gibt: seit dd4fa72 laeuft die Rechtschreibpruefung nicht mehr im
 * postbuild, sondern als CI-Job mit `|| true`. Sie kann damit nichts mehr rot
 * machen — der Befund lag nur noch im Artefakt, das niemand oeffnet. Eine
 * Pruefung, deren Ergebnis niemand sieht, ist abgeschaltet, ohne dass es je
 * jemand entschieden hat. Diese Zusammenfassung macht die Zahl sichtbar,
 * ohne zu blockieren.
 *
 * Beendet sich IMMER mit Exit 0. Ein Fehler beim Zusammenfassen darf den Job
 * nicht faerben — er hat mit dem Zustand der Inhalte nichts zu tun.
 *
 * Lokal ohne GitHub: `node scripts/spell-check-summary.mjs` schreibt nach stdout.
 */

import { readFile, appendFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = process.cwd()
const REPORT = join(ROOT, 'data', 'spell-check-report.json')
const OUT = process.env.GITHUB_STEP_SUMMARY

/** Pipes und Zeilenumbrueche zerlegen sonst die Markdown-Tabelle. */
const zelle = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()

const schreibe = async (md) => {
  if (OUT) await appendFile(OUT, md + '\n')
  else process.stdout.write(md + '\n')
}

let daten
try {
  daten = JSON.parse(await readFile(REPORT, 'utf8'))
} catch {
  // Kein Report heisst NICHT "keine Fehler". Es heisst, der Lauf kam nicht
  // durch — LanguageTool nicht erreichbar, Abbruch, Rate-Limit. Genau dieser
  // Fall darf nicht wie ein gruener Lauf aussehen.
  await schreibe(
    '## 🔤 Rechtschreibprüfung\n\n' +
      '> [!WARNING]\n' +
      '> Kein Report gefunden (`data/spell-check-report.json`).\n' +
      '> Der Lauf ist nicht durchgekommen — das ist **nicht** dasselbe wie „keine Funde".\n' +
      '> Übliche Ursache: LanguageTool-API nicht erreichbar oder Rate-Limit.'
  )
  process.exit(0)
}

const funde = Array.isArray(daten.funde) ? daten.funde : []
const stand = daten.stand ? new Date(daten.stand).toISOString().replace('T', ' ').slice(0, 16) : 'unbekannt'
const kopf = `## 🔤 Rechtschreibprüfung\n\nStand ${stand} · Modus: ${daten.modus ?? 'unbekannt'}${daten.umfang ? ` · Umfang: ${daten.umfang}` : ''}`

if (funde.length === 0) {
  await schreibe(`${kopf}\n\n✅ **Keine Funde.**`)
  process.exit(0)
}

const proDatei = new Map()
for (const f of funde) proDatei.set(f.file, (proDatei.get(f.file) ?? 0) + 1)
const topDateien = [...proDatei].sort((a, b) => b[1] - a[1]).slice(0, 10)

const teile = [
  kopf,
  '',
  `**${funde.length} Fund(e)** in ${proDatei.size} Datei(en).`,
  '',
  '> [!NOTE]',
  '> Report-only — dieser Job blockiert weder Build noch Deploy.',
  '> Fehlalarm? Begriff in `data/rechtschreib-whitelist.txt` eintragen.',
  '> **Achtung:** Treffer, die wie ein Bezeichner aussehen (`<Schnelluebersicht>`),',
  '> werden gemeldet, nicht korrigiert — siehe CLAUDE.md §4.',
  '',
  '### Dateien mit den meisten Funden',
  '',
  '| Datei | Funde |',
  '| --- | ---: |',
  ...topDateien.map(([d, n]) => `| \`${zelle(d)}\` | ${n} |`),
]

const woerter = (daten.haeufigste_unbekannte_woerter ?? []).slice(0, 15)
if (woerter.length) {
  teile.push(
    '',
    '### Häufigste unbekannte Wörter',
    '',
    woerter.map(([w, n]) => `\`${zelle(w)}\` ×${n}`).join(' · ')
  )
}

teile.push(
  '',
  '<details><summary>Erste 20 Funde im Detail</summary>',
  '',
  '| Datei | Kontext | Vorschlag |',
  '| --- | --- | --- |',
  ...funde.slice(0, 20).map(
    (f) => `| \`${zelle(f.file)}\` | ${zelle(f.kontext)} | ${zelle(f.vorschlag) || '—'} |`
  ),
  '',
  '</details>',
  '',
  'Vollständig im Artefakt **rechtschreib-report**.'
)

await schreibe(teile.join('\n'))
process.exit(0)
