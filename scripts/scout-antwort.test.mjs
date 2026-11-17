import { describe, it, expect } from 'vitest'
import { leseAntwort, istTechnischerFehler, laufGescheitert, SCOUT_MAX_TOKENS } from './lib/scout-antwort.mjs'

const antwort = (text, stop_reason = 'end_turn') => ({ stop_reason, content: [{ type: 'thinking', thinking: '…' }, { type: 'text', text }] })

describe('leseAntwort', () => {
  it('liest das JSON-Objekt, auch mit Text davor und danach', () => {
    expect(leseAntwort(antwort('Hier:\n{"title":"A","content_body":"B"}\nFertig.'))).toEqual({ title: 'A', content_body: 'B' })
  })

  it('nennt max_tokens als Ursache, statt „Kein JSON" zu melden', () => {
    expect(() => leseAntwort(antwort('{"title":"A","content_body":"abgeschn', 'max_tokens'))).toThrow(/max_tokens abgeschnitten/)
  })

  it('meldet fehlendes JSON mit stop_reason und Laenge', () => {
    expect(() => leseAntwort(antwort('Das kann ich so nicht schreiben.'))).toThrow(/Kein JSON in Antwort \(stop_reason=end_turn, 32 Zeichen Text\)/)
  })

  it('haelt eine Antwort ohne Textblock aus', () => {
    expect(() => leseAntwort({ stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '…' }] })).toThrow(/Kein JSON/)
    expect(() => leseAntwort(undefined)).toThrow(/Kein JSON/)
  })

  it('meldet kaputtes JSON als solches', () => {
    expect(() => leseAntwort(antwort('{"title": A}'))).toThrow(/JSON nicht lesbar/)
  })
})

describe('Lauf-Bewertung', () => {
  it('Gate-Verwurf ist kein technischer Fehler', () => {
    expect(istTechnischerFehler('Gate: Ich-Form')).toBe(false)
    expect(istTechnischerFehler('Kein JSON in Antwort (stop_reason=?, 0 Zeichen Text)')).toBe(true)
  })

  it.each([
    [{ briefings: 6, generiert: 0, technisch: 6 }, true],   // 15.11.2026
    [{ briefings: 4, generiert: 0, technisch: 4 }, true],   // 08.11.2026
    [{ briefings: 5, generiert: 1, technisch: 4 }, false],  // ein Entwurf kam durch: kein Ausfall
    [{ briefings: 4, generiert: 0, technisch: 0 }, false],  // alles vom Gate verworfen
    [{ briefings: 0, generiert: 0, technisch: 0 }, false],
  ])('%o → gescheitert: %s', (lage, erwartet) => {
    expect(laufGescheitert(lage)).toBe(erwartet)
  })

  it('laesst Platz fuer 1000 Woerter JSON plus Denkanteil', () => {
    expect(SCOUT_MAX_TOKENS).toBeGreaterThanOrEqual(6000)
  })
})
