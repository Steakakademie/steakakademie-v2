// Regressionstest fuer die Kochwissen-Lieferung aus den eigenen Rezepten.
//
// Anlass (15.09.2026): Die Quelle-Fundstelle lautete "/rezepte/<slug>". Die
// Rezeptseiten liegen aber unter "/rezepte/<kategorie>/<slug>"
// (src/app/rezepte/[slug]/[recipe]/page.tsx) — jeder Link, den die
// Rezept-Schmiede aus diesen Quellen anbietet (src/components/home/ToolBoxes.tsx),
// fuehrte auf eine 404-Seite. Getestet wird die eingecheckte CSV, weil sie es
// ist, die nach Supabase ingestiert wird.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import matter from 'gray-matter'

const ROOT = join(import.meta.dirname, '..')
const CSV = readFileSync(join(ROOT, 'data', 'kochwissen', 'steakakademie-rezepte-1.csv'), 'utf8')
const REZEPTE_DIR = join(ROOT, 'content', 'rezepte')

// Route jeder Rezeptseite, wie generateStaticParams sie erzeugt: kategorie + Dateiname.
const ROUTEN = new Set(
  readdirSync(REZEPTE_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const { data } = matter(readFileSync(join(REZEPTE_DIR, f), 'utf8'))
      return data?.title ? `/rezepte/${data.kategorie}/${basename(f, '.mdx')}` : null
    })
    .filter(Boolean),
)

const ZEILEN = CSV.split('\n').slice(1).filter((z) => z.trim())
const LINKS = ZEILEN.map((z) => z.match(/; Steakakademie-Rezept: (\S+?);/)?.[1] ?? null)

describe('Kochwissen-CSV aus den Rezepten', () => {
  it('jede Zeile traegt genau eine Steakakademie-Rezept-Quelle', () => {
    const ohne = ZEILEN.filter((_, i) => !LINKS[i]).map((z) => z.slice(0, 60))
    expect(ohne).toEqual([])
  })

  it('jede Quelle zeigt auf eine existierende Rezeptseite /rezepte/<kategorie>/<slug>', () => {
    const tot = LINKS.filter((l) => l && !ROUTEN.has(l))
    expect(tot).toEqual([])
  })

  it('jedes Rezept ist in der Lieferung enthalten', () => {
    const fehlend = [...ROUTEN].filter((r) => !LINKS.includes(r))
    expect(fehlend).toEqual([])
  })
})
