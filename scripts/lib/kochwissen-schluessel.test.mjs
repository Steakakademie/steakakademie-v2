// Schluessel der Tabelle `kochwissen`: titel_key (unique je source) und quelle_key (Anker).
//
// Anlass (15.09.2026): slug() in kochwissen-ingest.mjs entfernte ZUERST die
// Diakritika (NFKD) und ersetzte ERST DANACH ä→ae. Aus "ä" wurde so "a", aus
// ausgeschriebenem "ae" aber "ae": "Spießhähnchen" und "Spiesshaehnchen" ergaben
// zwei Schluessel, der Ingest legte eine zweite Zeile an, die alte blieb mit
// totem Link stehen (Frango Churrasco).
import { describe, it, expect } from 'vitest'
import { titelKey, quelleKey } from './kochwissen-schluessel.mjs'

describe('titelKey', () => {
  it.each([
    ['Frango Churrasco – Brasilianisches Spießhähnchen', 'frango-churrasco-brasilianisches-spiesshaehnchen'],
    ['Frango Churrasco – Brasilianisches Spiesshaehnchen', 'frango-churrasco-brasilianisches-spiesshaehnchen'],
    ['Hähnchen', 'haehnchen'],
    ['Öl und Grüße', 'oel-und-gruesse'],
    ['ÄÖÜ', 'aeoeue'],
    ['Hähnchen (zerlegtes ä)', 'haehnchen-zerlegtes-ae'],
    ['Bavette Steak – Heiß gegrillt', 'bavette-steak-heiss-gegrillt'],
    ['Crème brûlée', 'creme-brulee'],
    ['Jalapeño-Butter', 'jalapeno-butter'],
    ['  --Rinder-Tacos vom günstigen Cut!-- ', 'rinder-tacos-vom-guenstigen-cut'],
  ])('%s → %s', (titel, erwartet) => {
    expect(titelKey(titel)).toBe(erwartet)
  })

  it('leerer Titel ergibt leeren Schluessel', () => {
    expect(titelKey(null)).toBe('')
    expect(titelKey('')).toBe('')
  })
})

describe('quelleKey', () => {
  it('Seitenangabe wird zum Seiten-Anker', () => {
    expect(quelleKey('modernist', 'S. 267')).toBe('modernist:s267')
    expect(quelleKey('mcgee', 's267')).toBe('mcgee:s267')
  })

  it('sonst normalisierte Quelle — mit denselben Umlaut-Regeln wie titelKey', () => {
    expect(quelleKey('foods-oa', 'Rüben-Kapitel')).toBe('foods-oa:rueben-kapitel')
    expect(quelleKey('foods-oa', 'Rueben-Kapitel')).toBe('foods-oa:rueben-kapitel')
  })

  it('ohne Quelle kein Anker', () => {
    expect(quelleKey('modernist', null)).toBeNull()
    expect(quelleKey('modernist', '')).toBeNull()
  })
})
