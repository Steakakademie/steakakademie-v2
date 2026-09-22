#!/usr/bin/env node
/**
 * Bild-Motiv-Check per Vision (21.09.2026) — die Stufe, die Text-Regeln nicht leisten.
 *
 * WARUM: oberhitzegrill-vergleich zeigte eine Seebrücke, kuechenmaschine-vergleich
 * das Meer — beide mit einem Alt-Text, der das richtige Gerät BEHAUPTET. Alt-Text-
 * und Dateinamen-Checks sehen so etwas nie. Nur ein Blick aufs Bild.
 *
 * WIE: zwei Stufen, und die Trennung ist der ganze Punkt.
 *   1. BLIND: nur das Bild (auf 512 px verkleinert) an Claude Haiku — ohne Titel,
 *      ohne Alt-Text. Frage: was ist zu sehen? Rückgabe { motiv, merkmale }.
 *   2. ABGLEICH: reiner Text-Aufruf mit dieser Beschreibung PLUS Titel und
 *      Alt-Text, gegenläufig gefragt („was spricht DAGEGEN?"). Daraus { passt, grund }.
 * Kosten: ~0,15 Cent pro Bild (zweiter Aufruf ist reiner Text). Im CI nur die
 * Bilder, die der PR ändert/neu verlinkt.
 *
 * WARUM ZWEI STUFEN (21.09.2026, gyutan-sendai.jpg): Die erste Fassung schickte
 * Bild, Titel UND Alt-Text in einem Aufruf und fragte „passt das?". Das Modell
 * hat die Behauptung zurückgespiegelt, statt sie zu prüfen — Urteil wörtlich:
 * „Zeigt Gyutan-Gericht authentisch, passt perfekt". Auf dem Bild lagen
 * Steakscheiben mit Fettkante; Rinderzunge hat keine. Ein Prüfer, der die zu
 * prüfende Behauptung vorher liest, bestätigt sie. In Stufe 1 kennt das Modell
 * sie nicht und kann sie nicht zurückspiegeln.
 *
 * REPORT-ONLY per Default (Exit 0): ein Modellurteil ist kein Beweis. Mit --strict
 * Exit 1 bei „passt: false" — erst scharf schalten, wenn die Trefferquote belegt ist.
 * Der Gyutan-Fall zeigt beide Richtungen: das Urteil kann falsch negativ sein,
 * und es war hier falsch positiv.
 *
 * WANN --strict (Entscheidung Uwe, 21.09.2026): einschalten, sobald der Check
 * ueber mindestens ZEHN geaenderte Bilder gelaufen ist und die Trefferquote
 * belegt ist — insbesondere ohne falsch positive Ablehnungen. Ein Gate, das auf
 * einer Stichprobe von eins scharf geschaltet wird, blockiert beim ersten
 * Fehlurteil einen berechtigten PR.
 *
 * ACHTUNG, der Nachweis geht NICHT aus data/bild-motiv-report.json: Die Datei
 * ist gitignored (.gitignore:189) und wird bei jedem Lauf ueberschrieben — sie
 * haelt immer nur den letzten Lauf, in der CI lebt sie nur im Job-Container.
 * Zehn Laeufe sammeln sich dort nirgends an. Zwei gangbare Wege:
 *   a) Stichprobe in EINEM Lauf erzeugen, seit dem .env.local-Fix lokal moeglich:
 *        node scripts/check-bild-motiv.mjs --bereich rezepte
 *      Danach data/bild-motiv-report.json auswerten und jede Ablehnung von Hand
 *      gegenpruefen — das ist die Trefferquote, und sie ist in einem Zug da.
 *   b) den Report in der CI als Artefakt hochladen und ueber mehrere PRs sammeln.
 * Erst wenn einer der beiden Wege die Quote belegt, gehoert --strict in
 * .github/workflows/content-gates.yml.
 *
 * BELEGTE LAEUFE (21.09.2026, Weg a): Lauf 1 (10 Bilder, --bereich vergleich +
 * --bereich cuts, jede Ablehnung von Hand am Originalbild gegengeprueft) — 5
 * von 7 Ablehnungen falsch positiv, u. a. ein Stufe-2-Selbstwiderspruch bei
 * messer.mdx (das Modell "widerlegte" eine Behauptung, die der Alt-Text gar
 * nicht enthielt). Lauf 2 (167 Bilder, --bereich rezepte) — 134 Ablehnungen
 * (80 %), Stichprobe von 8 gegengeprueft: 8 von 8 falsch positiv. Zwei
 * strukturelle Ursachen ueber beide Laeufe belegt: Stufe-2-Context-Pollution
 * (Seitentitel statt reinem Alt-Text als Erwartungsquelle) und Stufe-1-
 * Negativ-Fehlschluss (Nicht-Erwaehnung eines Merkmals gilt als dessen
 * Abwesenheit). Recall ueber alle bekannten echten Faelle (inkl. des historisch
 * unter der alten Einstufen-Fassung verpassten gyutan-sendai.jpg) ist 2/3 —
 * ACHTUNG, dieser Treffer ist selbst kein sauberer Fund: Lauf 3 (22.09.2026,
 * gyutan-sendai.jpg wiederholt bei identischem Input UND temperature: 0)
 * belegt sowohl Nicht-Determinismus (1x passt, 5x unpassend in sechs
 * Wiederholungen derselben Sitzung) als auch ein fachlich umgekehrtes
 * Stufe-2-Argument (das Modell erwartet eine Fettkante bei Rinderzunge, die
 * anatomisch keine hat). Nicht-Determinismus bei temperature: 0 ist ein
 * eigenstaendiges, von der Praezision unabhaengiges Argument gegen --strict:
 * ein Gate darf bei gleichem Input nicht zwischen passt/unpassend wechseln.
 * Bedingung fuer --strict NICHT erfuellt, bleibt deshalb aus. Vollstaendige
 * Tabellen und Einordnung: docs/bild-motiv-check-log.md — dort auch jeder
 * weitere Beleg-Lauf ergaenzt.
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
import { callClaude, resolveApiKey } from './lib/anthropic.mjs'
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

// Dieselbe Aufloesung wie der Wrapper: env ODER .env.local. Vorher stand hier nur
// process.env.ANTHROPIC_API_KEY — lokal stieg der Check deshalb mit „Key fehlt" aus,
// obwohl callClaude den Schluessel aus .env.local gelesen haette. Der Check lief
// damit ausschliesslich in der CI; wer ihn vor dem Commit selbst ansehen wollte,
// musste die Variable von Hand exportieren und wusste das nicht (bemerkt 21.09.2026).
if (!(await resolveApiKey()) && !DRY) {
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
    // STUFE 1 — blind. Weder Titel noch Alt-Text gehen in diesen Aufruf: Was das
    // Modell hier nicht kennt, kann es nicht zurueckspiegeln.
    const { text: rohText } = await callClaude({
      model: MODEL, max_tokens: 300, temperature: 0, label: 'bild-motiv-blind', cache: false,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: png.toString('base64') } },
        { type: 'text', text: `Beschreibe sachlich, was auf diesem Bild zu sehen ist. Rate nicht, welchem Zweck es dient — beschreibe nur.\nBei Fleisch nenne unter "merkmale" ausdruecklich die sichtbaren Unterscheidungsmerkmale: Schnittdicke, Faserverlauf, Garzustand (rosa/durchgegart), vorhandene oder fehlende Fettkante, Panade, Knochen, Beilagen, Geschirr.\nAntworte NUR mit JSON: {"motiv": "was zu sehen ist, max 15 Woerter", "merkmale": ["kurzes Merkmal", "..."]}` },
      ] }],
    })
    let blind
    try { blind = JSON.parse(rohText.match(/\{[\s\S]*\}/)[0]) } catch { blind = { motiv: '?', merkmale: [] } }
    const merkmale = Array.isArray(blind.merkmale) ? blind.merkmale : []

    // STUFE 2 — Abgleich, gegenlaeufig gefragt. Kein Bild mehr, nur die Beschreibung
    // aus Stufe 1 gegen die Behauptung der Seite. "Was spricht dagegen?" statt
    // "passt das?": Zustimmung ist die billigere Antwort, Widerspruch muss belegt werden.
    const { text: abgleichText } = await callClaude({
      model: MODEL, max_tokens: 200, temperature: 0, label: 'bild-motiv-abgleich', cache: false,
      messages: [{ role: 'user', content:
        `Ein Bild wurde unabhaengig beschrieben, ohne dass der Beschreiber wusste, wofuer es steht.\n\n` +
        `BESCHREIBUNG: ${blind.motiv}\nMERKMALE: ${merkmale.join(' · ') || '(keine genannt)'}\n\n` +
        `Die Seite behauptet:\nSeite: „${titel}"\nAlt-Text: „${data.imageAlt ?? ''}"\n\n` +
        `Frage: Welche der Merkmale sprechen GEGEN diese Behauptung? Pruefe besonders, ob das ` +
        `beschriebene Motiv eine ANDERE Sache zeigt, die aehnlich aussieht (anderer Cut, anderes ` +
        `Gericht, anderes Geraet). Ein fachfremdes Motiv (Strand, Stadt, Landschaft) spricht immer dagegen.\n` +
        `Nur wenn nichts dagegen spricht, ist passt=true.\n` +
        `Antworte NUR mit JSON: {"passt": true|false, "grund": "max 20 Woerter, nenne das entscheidende Merkmal"}`,
      }],
    })
    let urteil
    try { urteil = JSON.parse(abgleichText.match(/\{[\s\S]*\}/)[0]) } catch { urteil = { passt: null, grund: `unlesbare Antwort: ${abgleichText.slice(0, 60)}` } }
    urteil.motiv = blind.motiv
    ergebnisse.push({ seite, bild: pfad, ...urteil, merkmale })
    console.log(`${urteil.passt === false ? '✗' : urteil.passt ? '✓' : '?'} ${seite}  ${pfad}\n    Motiv: ${urteil.motiv} — ${urteil.grund}`)
    if (merkmale.length) console.log(`    Merkmale: ${merkmale.join(' · ')}`)
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
