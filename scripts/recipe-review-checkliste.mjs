#!/usr/bin/env node
/**
 * Review-Checkliste fuer den Rezept-PR des Agenten.
 *
 * Findet die neuen/geaenderten Rezepte im Arbeitsbaum (noch vor dem PR-Schritt, solange
 * sie uncommittet sind), analysiert sie mit scripts/lib/rezept-review.mjs und gibt eine
 * Markdown-Checkliste aus. Blockiert nie: Fehler hier duerfen den Rezept-Lauf nicht
 * kippen (Regel „Werkzeuge werden nie blockiert").
 *
 * Aufruf:
 *   node scripts/recipe-review-checkliste.mjs                 # Arbeitsbaum → stdout
 *   node scripts/recipe-review-checkliste.mjs --github-output # zusaetzlich in $GITHUB_OUTPUT (text)
 *   node scripts/recipe-review-checkliste.mjs --dateien content/rezepte/a.mdx content/rezepte/b.mdx
 */
import { readFileSync, appendFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import yaml from 'js-yaml'
import { analysiere, checklisteMarkdown } from './lib/rezept-review.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)

function geaenderteRezepte () {
  const i = argv.indexOf('--dateien')
  if (i >= 0) return argv.slice(i + 1).filter((a) => !a.startsWith('--'))
  const out = execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--', 'content/rezepte'], {
    cwd: ROOT, encoding: 'utf8',
  })
  return out.split('\n')
    .map((z) => z.slice(3).trim().replace(/^"|"$/g, ''))
    .filter((p) => p.endsWith('.mdx'))
}

function main () {
  let referenz = null
  try { referenz = yaml.load(readFileSync(join(ROOT, 'data', 'kerntemperatur-referenz.yaml'), 'utf8')) } catch { /* ohne Referenz-Vorschlag weiter */ }

  const rezepte = []
  for (const datei of geaenderteRezepte()) {
    const pfad = existsSync(datei) ? datei : join(ROOT, datei)
    if (!existsSync(pfad)) continue
    try {
      rezepte.push({ slug: basename(datei, '.mdx'), analyse: analysiere(readFileSync(pfad, 'utf8'), { referenz }) })
    } catch (e) {
      console.error(`⚠ ${datei}: Analyse nicht moeglich (${e.message})`)
    }
  }

  const text = checklisteMarkdown(rezepte)
  console.log(text || '(keine neuen oder geaenderten Rezepte — keine Checkliste)')

  if (argv.includes('--github-output') && process.env.GITHUB_OUTPUT) {
    // Mehrzeiliger Output mit zufaelligem Begrenzer, damit der Text ihn nicht vorwegnehmen kann.
    const grenze = `EOF_${randomBytes(8).toString('hex')}`
    appendFileSync(process.env.GITHUB_OUTPUT, `text<<${grenze}\n${text}\n${grenze}\nanzahl=${rezepte.length}\n`)
  }
}

try { main() } catch (e) {
  // Nie den Lauf kippen.
  console.error(`⚠ Review-Checkliste nicht erzeugt: ${e.message}`)
  process.exit(0)
}
