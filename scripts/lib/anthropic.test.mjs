import { describe, it, expect } from 'vitest'
import { parseJson, maskiereSteuerzeichen } from './anthropic.mjs'

// KAN-84: saison-grow brach am 26.09.2026 mit
// „Bad control character in string literal in JSON at position 1023" ab —
// das Modell hatte Markdown mit echten Zeilenumbrüchen in content_body geschrieben.
describe('parseJson', () => {
  it('liest sauberes JSON', () => {
    expect(parseJson('{"a":1}')).toEqual({ a: 1 })
  })

  it('entfernt ```json-Fences und Vorwort', () => {
    expect(parseJson('```json\n{"a":"b"}\n```')).toEqual({ a: 'b' })
    expect(parseJson('Hier ist das Ergebnis:\n{"a":"b"}')).toEqual({ a: 'b' })
  })

  it('verträgt rohe Zeilenumbrüche und Tabs in Strings (KAN-84)', () => {
    const roh = '{"title":"Weihnachtsmenü","content_body":"## Vorspeise\nZeile zwei\n\tEingerückt"}'
    expect(() => JSON.parse(roh)).toThrow(/control character/i)
    const r = parseJson(roh)
    expect(r.title).toBe('Weihnachtsmenü')
    expect(r.content_body).toBe('## Vorspeise\nZeile zwei\n\tEingerückt')
  })

  it('verträgt rohe Umbrüche auch mit Vorwort', () => {
    expect(parseJson('Klar:\n{"x":"a\nb"}').x).toBe('a\nb')
  })

  it('lässt maskierte Anführungszeichen und Backslashes in Ruhe', () => {
    const r = parseJson('{"t":"Er sagte \\"Glut\\"\nund ging","p":"C:\\\\Dev"}')
    expect(r.t).toBe('Er sagte "Glut"\nund ging')
    expect(r.p).toBe('C:\\Dev')
  })

  it('wirft bei Antwort ganz ohne JSON', () => {
    expect(() => parseJson('Tut mir leid, das kann ich nicht.')).toThrow('Kein JSON in der Antwort')
  })

  it('wirft bei abgeschnittenem JSON statt Unsinn zu liefern', () => {
    expect(() => parseJson('{"title":"x","content_body":"abgeschn')).toThrow()
  })
})

describe('maskiereSteuerzeichen', () => {
  it('ändert nichts außerhalb von Strings', () => {
    const t = '{\n  "a": 1,\n  "b": [1, 2]\n}'
    expect(maskiereSteuerzeichen(t)).toBe(t)
  })
})
