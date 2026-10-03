/**
 * Hofladen-Import: eine abgelehnte Zeile kostet diese Zeile, nicht den Lauf (03.10.2026).
 * Ohne Datenbank — `upsert` ist ein Nachbau von hoefe_import_upsert, der wie die
 * echte Funktion den ganzen Block ablehnt, sobald eine Zeile die Grenze verletzt.
 */
import { describe, it, expect } from 'vitest'
import { schreibeHoefe, istZeilenFehler, ablehnungsGrund, ablehnungenNachGrund } from './hoefe-schreiben.mjs'
import { hoefeMitBilanz, hoefeAusElementen } from './hoefe-osm.mjs'

const hof = (i, lng = 10) => ({ osm_id: `n${i}`, name: `Hof ${i}`, lat: 50, lng })

/** Datenbank mit der ALTEN Grenze lng <= 16 — der Zustand vom 21./28.09.2026. */
function alteDatenbank () {
  const geschrieben = []
  let aufrufe = 0
  const upsert = async (zeilen) => {
    aufrufe++
    if (zeilen.some((z) => z.lng > 16)) {
      return { data: null, error: { code: '23514', message: 'new row for relation "hoefe" violates check constraint "hoefe_lng_check"' } }
    }
    geschrieben.push(...zeilen.map((z) => z.osm_id))
    return { data: [{ eingefuegt: zeilen.length, aktualisiert: 0, uebersprungen: 0 }], error: null }
  }
  return { upsert, geschrieben, aufrufe: () => aufrufe }
}

describe('hoefe-schreiben', () => {
  it('ohne Ablehnung: ein Aufruf je Block, Zahlen summiert', async () => {
    const db = alteDatenbank()
    const r = await schreibeHoefe(Array.from({ length: 1200 }, (_, i) => hof(i)), db.upsert, { chunk: 500 })
    expect(r).toMatchObject({ eingefuegt: 1200, aktualisiert: 0, uebersprungen: 0, nachgefahreneBloecke: 0 })
    expect(r.abgelehnt).toEqual([])
    expect(db.aufrufe()).toBe(3)
  })

  it('eine abgelehnte Zeile kostet nur sich selbst — der Rest des Blocks kommt an', async () => {
    const db = alteDatenbank()
    const zeilen = Array.from({ length: 1200 }, (_, i) => hof(i))
    zeilen[700] = hof(700, 16.37) // Wien, im zweiten Block
    const r = await schreibeHoefe(zeilen, db.upsert, { chunk: 500 })
    expect(r.eingefuegt).toBe(1199)
    expect(r.nachgefahreneBloecke).toBe(1)
    expect(r.abgelehnt).toEqual([{ osm_id: 'n700', name: 'Hof 700', grund: 'hoefe_lng_check' }])
    expect(db.geschrieben).toHaveLength(1199)
    expect(db.geschrieben).not.toContain('n700')
    expect(new Set(db.geschrieben).size).toBe(1199) // keine Zeile doppelt geschrieben
  })

  it('Gegenprobe: das alte Verhalten (Abbruch beim ersten Block-Fehler) haette nichts geschrieben', async () => {
    const db = alteDatenbank()
    const zeilen = Array.from({ length: 1200 }, (_, i) => hof(i))
    zeilen[3] = hof(3, 16.37) // gleich im ersten Block, wie am 28.09.2026
    // So lief es bis 03.10.2026: erster Fehler = Ende.
    const alt = async () => {
      for (let i = 0; i < zeilen.length; i += 500) {
        const { error } = await db.upsert(zeilen.slice(i, i + 500))
        if (error) throw new Error(error.message)
      }
    }
    await expect(alt()).rejects.toThrow('hoefe_lng_check')
    expect(db.geschrieben).toHaveLength(0)

    const r = await schreibeHoefe(zeilen, db.upsert, { chunk: 500 })
    expect(r.eingefuegt).toBe(1199)
    expect(r.abgelehnt).toHaveLength(1)
  })

  it('ein Fehler, der alle Zeilen gleich trifft, bricht sofort ab (kein zeilenweises Nachfahren)', async () => {
    let aufrufe = 0
    const upsert = async () => { aufrufe++; return { data: null, error: { code: '42501', message: 'permission denied for function hoefe_import_upsert' } } }
    await expect(schreibeHoefe([hof(1), hof(2)], upsert)).rejects.toThrow('permission denied')
    expect(aufrufe).toBe(1)
  })

  it('scheitert beim Nachfahren eine Zeile an etwas anderem als ihren Daten, bricht der Lauf ab', async () => {
    let aufrufe = 0
    const upsert = async (zeilen) => {
      aufrufe++
      if (zeilen.length > 1) return { data: null, error: { code: '23514', message: 'violates check constraint "hoefe_lng_check"' } }
      return { data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } }
    }
    await expect(schreibeHoefe([hof(1), hof(2)], upsert, { parallel: 1 })).rejects.toThrow('statement timeout')
    expect(aufrufe).toBe(2)
  })

  it('istZeilenFehler: SQLSTATE 22/23 ja, Rechte/Netz/ohne Code nein', () => {
    expect(istZeilenFehler({ code: '23514' })).toBe(true)
    expect(istZeilenFehler({ code: '23502' })).toBe(true)
    expect(istZeilenFehler({ code: '22P02' })).toBe(true)
    expect(istZeilenFehler({ code: '42501' })).toBe(false)
    expect(istZeilenFehler({ code: 'PGRST202' })).toBe(false)
    expect(istZeilenFehler({ message: 'fetch failed' })).toBe(false)
    expect(istZeilenFehler(null)).toBe(false)
  })

  it('ablehnungsGrund nennt den Constraint, ablehnungenNachGrund zaehlt', () => {
    expect(ablehnungsGrund({ message: 'new row for relation "hoefe" violates check constraint "hoefe_lat_check"' })).toBe('hoefe_lat_check')
    expect(ablehnungsGrund({ message: 'invalid input syntax for type boolean: "ja"' })).toBe('invalid input syntax for type boolean: "ja"')
    expect(ablehnungenNachGrund([{ grund: 'a' }, { grund: 'b' }, { grund: 'b' }])).toEqual([['b', 2], ['a', 1]])
  })
})

describe('hoefe-osm — Bilanz der aussortierten Elemente', () => {
  const elemente = [
    { type: 'node', id: 1, lat: 52.2, lon: 10.5, tags: { name: 'Hofladen Bosse' } },
    { type: 'node', id: 2, lat: 48.21, lon: 16.37, tags: { name: 'Hof Wien' } },        // AT, jenseits der alten Grenze
    { type: 'node', id: 3, lat: 45.9, lon: 8.95, tags: { name: 'Fattoria Ticino' } },   // CH, Tessin
    { type: 'node', id: 4, lat: 47.5, lon: 19.04, tags: { name: 'Budapest' } },         // ausserhalb
    { type: 'node', id: 5, lat: 0, lon: 0, tags: { name: 'Null-Insel' } },              // ausserhalb
    { type: 'way', id: 6, tags: { name: 'Ohne Mittelpunkt' } },                         // ohne Koordinate
    { type: 'node', id: 7, lat: 50, lon: 8, tags: {} },                                 // ohne Name
    { type: 'node', id: 1, lat: 52.2, lon: 10.5, tags: { name: 'Hofladen Bosse' } },    // doppelt
  ]

  it('zaehlt je Grund und laesst die brauchbaren durch', () => {
    const { hoefe, bilanz } = hoefeMitBilanz(elemente)
    expect(hoefe.map((h) => h.osm_id)).toEqual(['n1', 'n2', 'n3'])
    expect(bilanz).toEqual({ elemente: 8, ohneKoordinate: 1, ausserhalb: 2, ohneName: 1, doppelt: 1 })
  })

  it('die Zahlen gehen auf: brauchbar + aussortiert = Elemente', () => {
    const { hoefe, bilanz } = hoefeMitBilanz(elemente)
    expect(hoefe.length + bilanz.ohneKoordinate + bilanz.ausserhalb + bilanz.ohneName + bilanz.doppelt).toBe(bilanz.elemente)
  })

  it('hoefeAusElementen liefert dieselben Zeilen wie bisher', () => {
    expect(hoefeAusElementen(elemente)).toEqual(hoefeMitBilanz(elemente).hoefe)
  })
})
