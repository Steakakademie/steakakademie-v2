/**
 * IndexNow — Abbildung geänderter Dateien auf meldbare URLs (10.10.2026).
 *
 * Die Sitemap ist der Filter: Was dort nicht steht (noindex, Bezahl-Lektionen,
 * dynamische Routen ohne Treffer), darf nie gemeldet werden.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import {
  HOST,
  SCHLUESSEL,
  locsAus,
  meldung,
  routeAusAppDatei,
  slugAusContentDatei,
  urlsFuerAenderungen,
} from './indexnow-melden.mjs'

const B = `https://${HOST}`
const SITEMAP = [
  `${B}/`,
  `${B}/kerntemperatur-hackfleisch`,
  `${B}/temperatur-guide`,
  `${B}/rezepte/fleisch/chateaubriand-filet`,
  `${B}/rezepte/fleisch/wagyu-burger`,
  `${B}/glossar/hackfleisch`,
  `${B}/glossar/myoglobin`,
  `${B}/streitfaelle/myoglobin`,
  `${B}/cuts/ribeye`,
  `${B}/diplome/lernen/1/01-feuer-verstehen`,
]

describe('IndexNow — Datei → URL', () => {
  it('liest <loc>-Einträge aus Sitemap und Sitemap-Index', () => {
    const xml = `<urlset><url><loc>${B}/a</loc></url><url><loc> ${B}/b </loc></url></urlset>`
    expect(locsAus(xml)).toEqual([`${B}/a`, `${B}/b`])
  })

  it('statische App-Seiten werden zur Route, dynamische und private nicht', () => {
    expect(routeAusAppDatei('src/app/page.tsx')).toBe('/')
    expect(routeAusAppDatei('src/app/kerntemperatur-hackfleisch/page.tsx')).toBe('/kerntemperatur-hackfleisch')
    expect(routeAusAppDatei('src/app/(marketing)/ueber-uns/page.tsx')).toBe('/ueber-uns')
    expect(routeAusAppDatei('src/app/cuts/[slug]/page.tsx')).toBeNull()
    expect(routeAusAppDatei('src/app/kerntemperatur-hackfleisch/layout.tsx')).toBeNull()
    expect(routeAusAppDatei('src/components/Foo.tsx')).toBeNull()
  })

  it('Content-Dateien liefern ihren Slug', () => {
    expect(slugAusContentDatei('content/rezepte/wagyu-burger.mdx')).toBe('wagyu-burger')
    expect(slugAusContentDatei('content/diplom-lektionen/stufe-1/01-feuer-verstehen.mdx')).toBe('01-feuer-verstehen')
    expect(slugAusContentDatei('data/taxonomie.yaml')).toBeNull()
  })

  it('meldet nur URLs aus der Sitemap', () => {
    const urls = urlsFuerAenderungen(
      [
        'content/rezepte/wagyu-burger.mdx',
        'content/glossar/hackfleisch.mdx',
        'src/app/kerntemperatur-hackfleisch/page.tsx',
        'src/app/page.tsx',
        // nicht in der Sitemap → nicht melden
        'content/diplom-lektionen/stufe-2/03-schweine-cuts.mdx',
        'src/app/admin/page.tsx',
        'src/lib/seo-titel.ts',
      ],
      SITEMAP,
    )
    expect(urls).toEqual([
      `${B}/`,
      `${B}/glossar/hackfleisch`,
      `${B}/kerntemperatur-hackfleisch`,
      `${B}/rezepte/fleisch/wagyu-burger`,
    ])
  })

  it('gleicher Slug in zwei Bereichen: nur der Bereich der Datei', () => {
    expect(urlsFuerAenderungen(['content/streitfaelle/myoglobin.mdx'], SITEMAP)).toEqual([`${B}/streitfaelle/myoglobin`])
    expect(urlsFuerAenderungen(['content/glossar/myoglobin.mdx'], SITEMAP)).toEqual([`${B}/glossar/myoglobin`])
  })

  it('zusätzliche URLs nur, wenn sie in der Sitemap stehen', () => {
    const urls = urlsFuerAenderungen([], SITEMAP, [`${B}/cuts/ribeye`, `${B}/admin`, 'https://example.com/x'])
    expect(urls).toEqual([`${B}/cuts/ribeye`])
  })

  it('Windows-Pfade werden normalisiert', () => {
    expect(urlsFuerAenderungen(['content\\rezepte\\wagyu-burger.mdx'], SITEMAP)).toEqual([
      `${B}/rezepte/fleisch/wagyu-burger`,
    ])
  })
})

describe('IndexNow — Schlüssel', () => {
  it('die Schlüsseldatei liegt öffentlich und enthält genau den Schlüssel', () => {
    const datei = `public/${SCHLUESSEL}.txt`
    expect(existsSync(datei)).toBe(true)
    expect(readFileSync(datei, 'utf8').trim()).toBe(SCHLUESSEL)
  })

  it('die Meldung nennt Host, Schlüssel und Schlüsselort', () => {
    expect(meldung([`${B}/`])).toEqual({
      host: HOST,
      key: SCHLUESSEL,
      keyLocation: `${B}/${SCHLUESSEL}.txt`,
      urlList: [`${B}/`],
    })
  })
})
