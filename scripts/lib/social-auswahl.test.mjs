/**
 * Social-Entwuerfe: die Auswahl wandert (03.10.2026).
 * Anlass und Regel: Kopf von scripts/lib/social-auswahl.mjs.
 */
import { describe, it, expect } from 'vitest'
import { waehleRezepte, wochenIndex, isoWoche, istVeroeffentlicht, ANKER_WOCHE } from './social-auswahl.mjs'

const tag = (iso) => new Date(`${iso}T10:00:00Z`)
const plusWochen = (datum, n) => new Date(datum.getTime() + n * 7 * 86_400_000)

/** 40 Rezepte, alle lange vor dem Stichtag erschienen: rezept-01 (aeltestes) … rezept-40. */
const BESTAND = Array.from({ length: 40 }, (_, i) => ({
  slug: `rezept-${String(i + 1).padStart(2, '0')}`,
  publishedAt: new Date(Date.UTC(2026, 5, 1 + i)).toISOString().slice(0, 10),
}))
const SONNTAG = tag('2026-10-04') // der erste Lauf mit dieser Auswahl

describe('social-auswahl — Wochenzaehlung', () => {
  it('wochenIndex wechselt am Montag, nicht am Sonntag', () => {
    expect(wochenIndex(tag('2026-10-04'))).toBe(wochenIndex(tag('2026-09-28'))) // So und Mo derselben Woche
    expect(wochenIndex(tag('2026-10-05'))).toBe(wochenIndex(tag('2026-10-04')) + 1)
    expect(wochenIndex(tag('2026-09-28'))).toBe(ANKER_WOCHE)
  })

  it('wochenIndex laeuft ueber den Jahreswechsel durch, die ISO-Woche springt auf 1', () => {
    expect(isoWoche(tag('2026-12-28'))).toEqual({ jahr: 2026, woche: 53 })
    expect(isoWoche(tag('2027-01-04'))).toEqual({ jahr: 2027, woche: 1 })
    expect(wochenIndex(tag('2027-01-04'))).toBe(wochenIndex(tag('2026-12-28')) + 1)
  })

  it('isoWoche: bekannte Stichtage', () => {
    expect(isoWoche(tag('2026-10-04'))).toEqual({ jahr: 2026, woche: 40 })
    expect(isoWoche(tag('2026-01-01'))).toEqual({ jahr: 2026, woche: 1 })
    expect(isoWoche(tag('2027-01-03'))).toEqual({ jahr: 2026, woche: 53 }) // Sonntag gehoert zur alten Woche
  })
})

describe('social-auswahl — waehleRezepte', () => {
  it('derselbe Tag liefert dieselbe Auswahl (kein Zustand, kein Zufall)', () => {
    const a = waehleRezepte(BESTAND, { limit: 5, datum: SONNTAG })
    const b = waehleRezepte([...BESTAND].reverse(), { limit: 5, datum: tag('2026-10-04') })
    expect(a.auswahl.map((r) => r.slug)).toEqual(b.auswahl.map((r) => r.slug))
    expect(a.auswahl).toHaveLength(5)
  })

  it('das Fenster wandert: aufeinanderfolgende Wochen ueberschneiden sich nicht', () => {
    const w1 = waehleRezepte(BESTAND, { limit: 5, datum: SONNTAG }).bestand
    const w2 = waehleRezepte(BESTAND, { limit: 5, datum: plusWochen(SONNTAG, 1) }).bestand
    const w3 = waehleRezepte(BESTAND, { limit: 5, datum: plusWochen(SONNTAG, 2) }).bestand
    expect(w1).toEqual(['rezept-01', 'rezept-02', 'rezept-03', 'rezept-04', 'rezept-05'])
    expect(w2).toEqual(['rezept-06', 'rezept-07', 'rezept-08', 'rezept-09', 'rezept-10'])
    expect(w3).toEqual(['rezept-11', 'rezept-12', 'rezept-13', 'rezept-14', 'rezept-15'])
  })

  it('nach einem Durchgang war jedes Rezept genau einmal dran, dann geht es von vorn los', () => {
    const gesehen = []
    for (let w = 0; w < 8; w++) gesehen.push(...waehleRezepte(BESTAND, { limit: 5, datum: plusWochen(SONNTAG, w) }).bestand)
    expect(gesehen).toHaveLength(40)
    expect(new Set(gesehen).size).toBe(40)
    expect(waehleRezepte(BESTAND, { limit: 5, datum: plusWochen(SONNTAG, 8) }).bestand[0]).toBe('rezept-01')
  })

  it('Gegenprobe: die alte Auswahl (die ersten fuenf Dateien) war jede Woche dieselbe', () => {
    const alt = () => BESTAND.map((r) => r.slug).sort().slice(0, 5)
    const wochen = [0, 1, 2, 3].map(() => alt().join())
    expect(new Set(wochen).size).toBe(1)
    const neu = [0, 1, 2, 3].map((w) => waehleRezepte(BESTAND, { limit: 5, datum: plusWochen(SONNTAG, w) }).bestand.join())
    expect(new Set(neu).size).toBe(4)
  })

  it('Neues der letzten 7 Tage kommt zuerst, neueste vorn — hoechstens die Haelfte der Plaetze', () => {
    const neu = ['2026-09-28', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03'].map((d, i) => ({ slug: `neu-${i + 1}`, publishedAt: d }))
    const r = waehleRezepte([...BESTAND, ...neu], { limit: 5, datum: SONNTAG })
    expect(r.frisch).toEqual(['neu-5', 'neu-4', 'neu-3'])
    expect(r.bestand).toEqual(['rezept-01', 'rezept-02'])
    expect(r.auswahl.map((x) => x.slug)).toEqual(['neu-5', 'neu-4', 'neu-3', 'rezept-01', 'rezept-02'])
  })

  it('neue Rezepte verschieben das Fenster im Bestand nicht', () => {
    const ohne = waehleRezepte(BESTAND, { limit: 5, datum: plusWochen(SONNTAG, 3) }).bestand
    const neu = [{ slug: 'neu-a', publishedAt: '2026-10-24' }, { slug: 'neu-b', publishedAt: '2026-10-23' }]
    const mit = waehleRezepte([...BESTAND, ...neu], { limit: 5, datum: plusWochen(SONNTAG, 3) })
    expect(mit.frisch).toEqual(['neu-a', 'neu-b'])
    expect(mit.bestand).toEqual(ohne.slice(0, 3)) // dieselbe Stelle, nur weniger Plaetze
  })

  it('Entwuerfe, Ungeprueftes und kuenftig Faelliges werden nie ausgewaehlt', () => {
    const r = waehleRezepte([
      { slug: 'entwurf', publishedAt: '2026-06-01', status: 'draft' },
      { slug: 'in-pruefung', publishedAt: '2026-06-02', status: 'review' },
      { slug: 'ungeprueft', publishedAt: '2026-06-03', reviewed: false },
      { slug: 'kuenftig', publishedAt: '2026-11-01' },
      { slug: 'altbestand-ohne-status', publishedAt: '2026-06-04' },
      { slug: 'freigegeben', publishedAt: '2026-06-05', status: 'published' },
    ], { limit: 5, datum: SONNTAG })
    expect(r.auswahl.map((x) => x.slug)).toEqual(['altbestand-ohne-status', 'freigegeben'])
    expect(r.verfuegbar).toBe(2)
  })

  it('weniger Rezepte als Plaetze: jedes hoechstens einmal', () => {
    const r = waehleRezepte(BESTAND.slice(0, 3), { limit: 5, datum: plusWochen(SONNTAG, 1) })
    expect(r.auswahl).toHaveLength(3)
    expect(new Set(r.auswahl.map((x) => x.slug)).size).toBe(3)
  })

  it('gibt es nur Neues, fuellt Neues alle Plaetze', () => {
    const neu = Array.from({ length: 6 }, (_, i) => ({ slug: `neu-${i}`, publishedAt: '2026-10-02' }))
    expect(waehleRezepte(neu, { limit: 5, datum: SONNTAG }).auswahl).toHaveLength(5)
  })

  it('leerer Bestand oder limit 0: leere Auswahl, kein Absturz', () => {
    expect(waehleRezepte([], { limit: 5, datum: SONNTAG }).auswahl).toEqual([])
    expect(waehleRezepte(BESTAND, { limit: 0, datum: SONNTAG }).auswahl).toEqual([])
  })

  it('istVeroeffentlicht folgt der Regel aus src/lib/redaktion.ts', () => {
    expect(istVeroeffentlicht({ slug: 'a' }, SONNTAG)).toBe(true)
    expect(istVeroeffentlicht({ slug: 'a', status: '' }, SONNTAG)).toBe(true)
    expect(istVeroeffentlicht({ slug: 'a', publishedAt: 'kein-datum' }, SONNTAG)).toBe(true)
    expect(istVeroeffentlicht({ slug: 'a', status: 'draft' }, SONNTAG)).toBe(false)
  })
})
