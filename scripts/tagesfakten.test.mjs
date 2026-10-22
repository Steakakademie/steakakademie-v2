import { describe, it, expect } from 'vitest'
import { zielTag, tagesFenster, zaehleBestellungen, baueZeile, bilanz } from './lib/tagesfakten.mjs'

describe('tagesfakten — Zeitraum', () => {
  it('nimmt gestern (UTC), nicht den laufenden Tag', () => {
    expect(zielTag([], new Date('2026-10-22T00:30:00Z'))).toBe('2026-10-21')
    expect(zielTag([], new Date('2026-11-01T23:59:00Z'))).toBe('2026-10-31')
  })
  it('--tag ueberstimmt, muss aber ein Datum sein', () => {
    expect(zielTag(['--tag', '2026-10-01'])).toBe('2026-10-01')
    expect(() => zielTag(['--tag', 'gestern'])).toThrow(/YYYY-MM-DD/)
  })
  it('Fenster ist [00:00, 24:00) UTC', () => {
    expect(tagesFenster('2026-10-21')).toEqual({ von: '2026-10-21T00:00:00.000Z', bis: '2026-10-22T00:00:00.000Z' })
  })
})

describe('tagesfakten — Bestellungen', () => {
  it('zaehlt nur verarbeitete Zahlungen als Kauf, refund als Erstattung, failed gar nicht', () => {
    const r = zaehleBestellungen([
      { ds_event: 'payment', processing_status: 'processed' },
      { ds_event: 'on_payment', processing_status: 'processed' },
      { ds_event: 'payment', processing_status: 'failed' },
      { ds_event: 'refund', processing_status: 'processed' },
      { ds_event: 'refund', processing_status: 'failed' },
    ])
    expect(r).toEqual({ kaeufe: 2, erstattungen: 1 })
  })
  it('leer ist 0, nicht NULL — es gab belegt keine Bestellung', () => {
    expect(zaehleBestellungen([])).toEqual({ kaeufe: 0, erstattungen: 0 })
  })
})

describe('tagesfakten — Zeile', () => {
  const zeile = baueZeile('2026-10-21', {
    besucher: { fehlt: 'PLAUSIBLE_API_KEY fehlt' },
    produkt_klicks: { fehlt: 'PLAUSIBLE_API_KEY fehlt' },
    anmeldungen: { fehlt: 'keine Tageszaehlung in Loops' },
    bestaetigungen: { fehlt: 'keine Tageszaehlung in Loops' },
    kaeufe: { wert: 1, quelle: 'digistore_orders' },
    erstattungen: { wert: 0, quelle: 'digistore_orders' },
    widerrufe: { wert: 0, quelle: 'widerrufe' },
    provisionen_cent: { fehlt: 'kein Awin-Berichtszugang' },
  })
  it('fehlende Quelle wird NULL mit Grund, nie 0', () => {
    expect(zeile.besucher).toBeNull()
    expect(zeile.quellen.besucher).toBe('fehlt: PLAUSIBLE_API_KEY fehlt')
    expect(zeile.kaeufe).toBe(1)
    expect(zeile.quellen.kaeufe).toBe('digistore_orders')
  })
  it('Bilanz nennt die Luecken beim Namen', () => {
    const b = bilanz(zeile)
    expect(b).toContain('Tagesfakten 2026-10-21')
    expect(b).toContain('besucher (PLAUSIBLE_API_KEY fehlt)')
    expect(b).toContain('| — | — | — | — | 1 | 0 | 0 | — |')
  })
})
