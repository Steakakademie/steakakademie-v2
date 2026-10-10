/**
 * Messung — Gruppen über Suchanfragen, damit Ausgangswert und Messung dieselbe Menge meinen (10.10.2026).
 */
import { describe, it, expect } from 'vitest'
import { GRUPPEN, gruppiere, leseCsv, seitenWerte, tage } from './gsc-messung.mjs'

const CSV = [
  'query,page,Klicks,Impressionen,CTR,Position',
  'kerntemperatur frikadellen,https://steakakademie.de/temperatur-guide,1,100,1.00%,8',
  'kerntemperatur frikadellen,https://steakakademie.de/kerntemperatur-hackfleisch,2,50,4.00%,4',
  'kerntemperatur steak,https://steakakademie.de/temperatur-guide,0,60,0.00%,30',
  'chateaubriand steak,https://steakakademie.de/rezepte/fleisch/chateaubriand-filet,0,40,0.00%,11',
  '"steak, medium",https://steakakademie.de/temperatur-guide,0,20,0.00%,20',
  'kerntemperatur schnitzel,https://steakakademie.de/temperatur-guide,0,10,0.00%,8',
  'bbq,https://steakakademie.de/,0,5,0.00%,70',
].join('\n')

describe('gruppiere', () => {
  const g = Object.fromEntries(gruppiere(leseCsv(CSV)).map((x) => [x.name, x]))

  it('jede Anfrage zählt nur in der ersten passenden Gruppe', () => {
    expect(g['Hackfleisch / Frikadellen / Burger'].impressionen).toBe(150)
    // „chateaubriand steak" gehört zu Chateaubriand, nicht zu Steak; „kerntemperatur schnitzel" zu Schnitzel
    expect(g['Chateaubriand'].impressionen).toBe(40)
    expect(g['Schnitzel'].impressionen).toBe(10)
    expect(g['Steak / Rind / Ribeye / Filet'].impressionen).toBe(80)
  })

  it('Anfragen zählt je Suchanfrage, nicht je Seite; Position ist nach Impressionen gewichtet', () => {
    expect(g['Hackfleisch / Frikadellen / Burger'].anfragen).toBe(1)
    expect(g['Hackfleisch / Frikadellen / Burger'].position).toBeCloseTo((100 * 8 + 50 * 4) / 150, 6)
    expect(g['Hackfleisch / Frikadellen / Burger'].klicks).toBe(3)
  })

  it('rankende Seiten mit Anteil', () => {
    expect(g['Hackfleisch / Frikadellen / Burger'].seiten).toBe('/temperatur-guide 67 %, /kerntemperatur-hackfleisch 33 %')
  })

  it('Anfragen mit Komma in Anführungszeichen bleiben eine Anfrage', () => {
    expect(g['Steak / Rind / Ribeye / Filet'].anfragen).toBe(2)
  })

  it('Anfragen ohne Gruppe tauchen nirgends auf, leere Gruppen haben keine Position', () => {
    const summe = Object.values(g).reduce((a, x) => a + x.impressionen, 0)
    expect(summe).toBe(280) // 285 gesamt, „bbq" (5) gehört in keine Gruppe
    expect(g['Spanferkel'].position).toBeNull()
  })

  it('die Reihenfolge der Gruppen ist festgelegt (Teil der Definition)', () => {
    expect(GRUPPEN.map((x) => x[0]).slice(0, 2)).toEqual(['Hackfleisch / Frikadellen / Burger', 'Chateaubriand'])
  })
})

describe('seitenWerte und tage', () => {
  it('Seiten ohne Impressionen stehen mit 0 da', () => {
    const s = seitenWerte(leseCsv('page,Klicks,Impressionen,CTR,Position\nhttps://steakakademie.de/temperatur-guide,5,500,1.00%,9'))
    expect(s.find((x) => x.seite === '/temperatur-guide')).toMatchObject({ impressionen: 500, klicks: 5, position: 9 })
    expect(s.find((x) => x.seite === '/kerntemperatur-steak')).toMatchObject({ impressionen: 0, position: null })
  })

  it('Tage inklusive beider Enden', () => {
    expect(tage('2026-09-11', '2026-10-08')).toBe(28)
    expect(tage('2026-10-14', '2026-10-27')).toBe(14)
  })
})
