import { describe, it, expect } from 'vitest'
import { pruefeDokument, pruefeWortdopplung, pruefeTemperaturen, glossarDublette, pruefeTierart, rezeptTierart } from './content-qualitaet.mjs'

const regeln = bs => bs.filter(b => b.schwere === 'fehler').map(b => b.regel)
const mdx = (fm, body) => `---\n${fm}\n---\n\n${body}\n`

describe('Abbruch-Erkennung', () => {
  it('erkennt abgeschnittenen letzten Absatz (Fall smoked-baked-potatoes)', () => {
    expect(regeln(pruefeDokument(mdx('title: X', 'Satz eins.\n\nDie Kombination ist kaum zu übertreffen. BBQ-'), {}))).toContain('abgeschnitten')
  })
  it('erkennt Überschrift am Dateiende', () => {
    expect(regeln(pruefeDokument(mdx('title: X', 'Text.\n\n## Variationen'), {}))).toContain('abgeschnitten')
  })
  it('lässt Liste, Komponente und sauberen Satz durch', () => {
    expect(regeln(pruefeDokument(mdx('title: X', 'Text.\n\n- Salz\n- Pfeffer'), {}))).toEqual([])
    expect(regeln(pruefeDokument(mdx('title: X', 'Text.\n\n<DiplomCTA stufe={1} />'), {}))).toEqual([])
  })
  it('meldet kaputtes MDX', () => {
    expect(regeln(pruefeDokument(mdx('title: X', 'Text mit <Offen ohne Ende.'), {}))).toContain('mdx-parse')
  })
})

describe('Wortdopplung', () => {
  it('„Hot-Spots und Hot-Spots"', () => {
    expect(pruefeWortdopplung(['Achte auf Hot-Spots und Hot-Spots am Rand.'])).toHaveLength(1)
  })
  it('direkte Dopplung „Grill Grill"', () => {
    expect(pruefeWortdopplung(['Stell den Grill Grill an.'])).toHaveLength(1)
  })
  it('Relativpronomen und feste Wendungen sind korrekt', () => {
    expect(pruefeWortdopplung(['Stärke, die die Brühe trübt, bei der der Grill mehr und mehr Glut hat.'])).toEqual([])
  })
})

describe('Temperaturen', () => {
  it('Fahrenheit ohne Celsius', () => {
    expect(regeln(pruefeTemperaturen(['Räuchern bei 225°F.']))).toContain('fahrenheit')
    expect(regeln(pruefeTemperaturen(['Räuchern bei 225 °F (107 °C).']))).toEqual([])
  })
  it('Low & Slow über 200 °C = °F-Verdacht (Fall bark-aussagen)', () => {
    expect(regeln(pruefeTemperaturen(['Das Fleisch bei konstanter Temperatur (225-250°C) räuchern.']))).toContain('fahrenheit-verdacht')
  })
  it('Pelletgrill-Spanne und Sear sind legitim', () => {
    expect(regeln(pruefeTemperaturen(['Pelletgrills ermöglichen konstante Temperaturen zwischen 80–260 °C.']))).toEqual([])
    expect(regeln(pruefeTemperaturen(['Erst indirekt bei 110 °C, dann Sear bei 280–300 °C.']))).toEqual([])
  })
  it('Kerntemperatur über 100 °C', () => {
    expect(regeln(pruefeTemperaturen(['Ziehen bis 203 °C Kerntemperatur.']))).toContain('fahrenheit-verdacht')
    expect(regeln(pruefeTemperaturen(['Bei 110°C räuchern, bis der Kern 75°C zeigt.']))).toEqual([])
  })
  it('Schwein unter 63 °C = Fehler, als Ziehwert = Warnung', () => {
    expect(regeln(pruefeTemperaturen(['Zieltemperatur: 58–62 °C Kerntemperatur.'], { tierart: 'schwein' }))).toContain('kerntemperatur-sicherheit')
    const ziehen = pruefeTemperaturen(['Bei 60–62 °C Kerntemperatur vom Rost nehmen, es zieht auf 63 °C nach.'], { tierart: 'schwein' })
    expect(ziehen.map(b => b.schwere)).toEqual(['warnung'])
  })
})

describe('Tierart', () => {
  it('Presa als Rind = Konflikt', () => {
    expect(regeln(pruefeTierart({ begriffsText: 'Presa', angabeText: 'Ein Teilstück vom Rind aus der Schulter.' }))).toContain('tierart-konflikt')
    expect(pruefeTierart({ begriffsText: 'Presa Ibérica', angabeText: 'Schulterstück vom Iberico-Schwein.' })).toEqual([])
  })
  it('Rezept-Tierart', () => {
    expect(rezeptTierart({ title: 'Iberico Secreto', meatType: 'Secreto' })).toBe('schwein')
    expect(rezeptTierart({ title: 'Wagyu Burger', meatType: 'Wagyu-Hack' })).toBe('hack')
    expect(rezeptTierart({ title: 'Şiş Kebab', meatType: 'Lamm' })).toBe(null)
  })
})

describe('Glossar-Dubletten', () => {
  const bestand = new Set(['kerntemperatur', 'stall', 'packer-brisket', 'kollagen-anteil'])
  it('Füllwort, Synonym, Plural', () => {
    expect(glossarDublette('kerntemperatur-wissen', bestand)?.kanonisch).toBe('kerntemperatur')
    expect(glossarDublette('plateauphase', bestand)?.kanonisch).toBe('stall')
    expect(glossarDublette('packer-cut', bestand)?.kanonisch).toBe('packer-brisket')
    expect(glossarDublette('kollagen-anteile', bestand)?.kanonisch).toBe('kollagen-anteil')
  })
  it('echter neuer Begriff', () => {
    expect(glossarDublette('kerntemperatur-geflügel', bestand)).toBe(null)
    expect(glossarDublette('picanha', bestand)).toBe(null)
  })
})
