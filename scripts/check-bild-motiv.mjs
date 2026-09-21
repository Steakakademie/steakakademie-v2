#!/usr/bin/env node
/**
 * Bild-Motiv-Check per Vision (21.09.2026) — die Stufe, die Text-Regeln nicht leisten.
 *
 * WARUM: oberhitzegrill-vergleich zeigte eine Seebrücke, kuechenmaschine-vergleich
 * das Meer — beide mit einem Alt-Text, der das richtige Gerät BEHAUPTET. Alt-Text-
 * und Dateinamen-Checks sehen so etwas nie. Nur ein Blick aufs Bild.
 *
 * WIE: Jedes geprüfte Bild wird (auf 512 px verkleinert) mit Seitentitel und Alt-Text
 * an Claude Haiku geschickt; Antwort als JSON { passt, motiv, grund }.
 * Kosten: ~0,1 Cent pro Bild. Im CI nur die Bilder, die der PR ändert/neu verlinkt.
 *
 * REPORT-ONLY per Default (Exit 0): ein Modellurteil ist kein Beweis. Mit --strict
 * Exit 1 bei „passt: false" — erst scharf schalten, wenn die Trefferquote belegt ist.
 *
 * Usage:
 *   node scripts/check-bild-motiv.mjs --geaendert [--basis origin/main]   # CI
 *   node scripts/check-bild-motiv.mjs --bereich vergleich                 # ganzer Ordner
 *   node scripts/check-bild-motiv.mjs content/vergleich/grills.mdx        # einzelne Seiten
 *   … --dry-run                                                          # nur auflisten, kein API-Call
 */

import { readFileSync, readdirSync, existsSync, appendFileSync, writeFileSync } from 'fs'
import { join, dirname, relative, sep } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import sharp from 'sharp'
import { callClaude } from './lib/anthropic.mjs'
import { zerlege } from './lib/content-qualitaet.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MODEL = 'claude-haiku-4-5-20251001' // dieselbe ID wie recipe-agent/glossary-agent
const args = process.argv.slice(2)
const wert = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d }
const STRICT = args.includes('--strict')
const DRY = args.includes('--dry-run')

function seitenAusGit (basis) {
  let diff = ''
  try { diff = execSync(`git diff --name-only ${basis}...HEAD`, { cwd: ROOT, encoding: 'utf8' }) } catch { return [] }
  const geaendert = diff.split('\n').filter(Boolean)
  const seiten = new Set(geaendert.filter(p => /^content\/.+\.mdx?$/.test(p)))
  // Geänderte Bilddatei → alle Seiten, die sie verlinken
  const bilder = geaendert.filter(p => /^public\/.+\.(jpe?g|png|webp)$/i.test(p)).map(p => p.replace(/^public/, ''))
  if (bilder.length) {
    for (const s of alleSeiten()) {
      const raw = readFileSync(join(ROOT, s), 'utf8')
      if (bilder.some(b => raw.includes(b))) seiten.add(s)
    }
  }
  return [...seiten]
}
function alleSeiten (bereich) {
  const out = []
  for (const b of bereich ? [bereich] : readdirSync(join(ROOT, 'content'))) {
    const d = join(ROOT, 'content', b)
    try { for (const f of readdirSync(d)) if (/\.mdx?$/.test(f)) out.push(`content/${b}/${f}`) } catch { /* Datei statt Ordner */ }
  }
  return out
}

const seiten = args.includes('--geaendert') ? seitenAusGit(wert('--basis', 'origin/main'))
  : wert('--bereich') ? alleSeiten(wert('--bereich'))
  : args.filter(a => a.startsWith('content/'))

if (!process.env.ANTHROPIC_API_KEY && !DRY) {
  console.log('Bild-Motiv-Check übersprungen: ANTHROPIC_API_KEY fehlt (z. B. Fork-PR).')
  process.exit(0)
}

const ergebnisse = []
for (const seite of seiten) {
  const { data } = zerlege(readFileSync(join(ROOT, seite), 'utf8'))
  for (const feld of ['image', 'heroImage']) {
    const pfad = data?.[feld]
    if (typeof pfad !== 'string' || !pfad.startsWith('/')) continue
    const datei = join(ROOT, 'public', pfad)
    if (!existsSync(datei)) continue // fehlende Dateien meldet validate-frontmatter
    const png = await sharp(datei).resize(512, 512, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer()
    const titel = data.title || data.seoTitle || seite
    if (DRY) { console.log(`· ${seite}  ${pfad}  (${png.length} Bytes an Vision)`); continue }
    const { text } = await callClaude({
      model: MODEL, max_tokens: 200, temperature: 0, label: 'bild-motiv', cache: false,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: png.toString('base64') } },
        { type: 'text', text: `Seite: „${titel}". Alt-Text: „${data.imageAlt ?? ''}".\nPasst das Bild inhaltlich zur Seite (Grillen, Fleisch, Gerät, Zutat des Themas)? Ein Strand, Meer, Stadtansicht oder fachfremdes Stockfoto passt NICHT, auch wenn der Alt-Text etwas anderes behauptet.\nAntworte NUR mit JSON: {"passt": true|false, "motiv": "was wirklich zu sehen ist, max 12 Wörter", "grund": "max 15 Wörter"}` },
      ] }],
    })
    let urteil
    try { urteil = JSON.parse(text.match(/\{[\s\S]*\}/)[0]) } catch { urteil = { passt: null, motiv: '?', grund: `unlesbare Antwort: ${text.slice(0, 60)}` } }
    ergebnisse.push({ seite, bild: pfad, ...urteil })
    console.log(`${urteil.passt === false ? '✗' : urteil.passt ? '✓' : '?'} ${seite}  ${pfad}\n    Motiv: ${urteil.motiv} — ${urteil.grund}`)
  }
}

const falsch = ergebnisse.filter(e => e.passt === false)
console.log(`\nBild-Motiv: ${ergebnisse.length} geprüft · ${falsch.length} unpassend`)
writeFileSync(join(ROOT, 'data', 'bild-motiv-report.json'), JSON.stringify(ergebnisse, null, 2) + '\n')
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, [`### Bild-Motiv (Vision, nur Bericht)`, `${ergebnisse.length} geprüft · ${falsch.length} unpassend`,
    ...falsch.map(e => `- ⚠️ \`${e.seite}\` ${e.bild} — zeigt: ${e.motiv}`)].join('\n') + '\n')
}
process.exit(STRICT && falsch.length ? 1 : 0)
