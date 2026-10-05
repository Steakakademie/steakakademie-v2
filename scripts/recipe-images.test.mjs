// Tests fuer den Bild-Prompt in scripts/recipe-images.mjs.
//
// Anlass (05.10.2026): Der Standardzusatz „plated on a rustic warm wooden board … a subtle grill
// and glowing ember atmosphere … a little fresh herb garnish" ueberschrieb, was der Agent im
// imagePrompt beschrieben hatte — Rucola und Cherrytomate im Bild, eine Flamme hinter dem
// gedaempften Montreal Smoked Meat, ein Holzbrett statt des weissen Tellers (Nuea Yang).
// Mit Briefing entfallen diese Zusaetze; ohne Briefing (Fallback) bleiben sie als Hausstil.
//
// recipe-images.mjs startet beim Import main() und ist nicht importierbar; getestet wird deshalb
// der vorhandene Trockenlauf (--dry-run --force --only <slug>), der den Prompt ausgibt, ohne fal.ai
// aufzurufen. Die Rezepte kommen aus dem Bestand, nicht aus festen Namen.
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SKRIPT = join(ROOT, 'scripts', 'recipe-images.mjs')
const DIR = join(ROOT, 'content', 'rezepte')

const rezepte = readdirSync(DIR).filter((f) => f.endsWith('.mdx'))
const mitBriefing = rezepte.find((f) => /^imagePrompt:/m.test(readFileSync(join(DIR, f), 'utf8')))
const ohneBriefing = rezepte.find((f) => !/^imagePrompt:/m.test(readFileSync(join(DIR, f), 'utf8')))

function prompt(datei) {
  const slug = datei.replace(/\.mdx$/, '')
  const aus = execFileSync(process.execPath, [SKRIPT, '--dry-run', '--force', '--only', slug], {
    cwd: ROOT, encoding: 'utf8', env: { ...process.env, FAL_KEY: '' },
  })
  // ANSI-Farben raus; der Prompt steht in der Zeile nach „◇ <slug>"
  const zeilen = aus.replace(/\x1b\[[0-9;]*m/g, '').split('\n')
  const i = zeilen.findIndex((z) => z.startsWith('◇'))
  return zeilen[i + 1].trim()
}

describe('recipe-images — Bild-Prompt', () => {
  it('der Bestand enthaelt beide Faelle (sonst prueft dieser Test nichts)', () => {
    expect(mitBriefing).toBeDefined()
  })

  it('mit imagePrompt: kein Holzbrett-, Glut- und Kraeuterzusatz', () => {
    const p = prompt(mitBriefing)
    expect(p).not.toMatch(/rustic warm wooden board/)
    expect(p).not.toMatch(/glowing ember/)
    expect(p).not.toMatch(/herb garnish/)
  })

  it('mit imagePrompt: Licht, Stil und Technik bleiben', () => {
    const p = prompt(mitBriefing)
    expect(p).toMatch(/the whole dish in frame, soft warm natural daylight, clean and appetizing, subtle steam/)
    expect(p).toMatch(/50mm lens/)
  })

  it.skipIf(!ohneBriefing)('ohne imagePrompt (Fallback): der Hausstil bleibt unveraendert', () => {
    const p = prompt(ohneBriefing)
    expect(p).toMatch(/plated on a rustic warm wooden board/)
    expect(p).toMatch(/a subtle grill and glowing ember atmosphere softly blurred in the background/)
    expect(p).toMatch(/a little fresh herb garnish/)
  })
})
