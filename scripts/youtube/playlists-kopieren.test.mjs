/**
 * Playlist-Kopie — reine Funktionen ohne Netz (24.10.2026).
 */
import { describe, it, expect } from 'vitest'
import { istVorbedingungsfehler, nichtKopierbar, offeneVideos, unsichtbar } from './playlists-kopieren.mjs'

describe('Fehlerklassen beim Einfügen', () => {
  it('Kontingentfehler stoppen den Lauf, auch als 403', () => {
    expect(nichtKopierbar('HTTP 403 quotaExceeded')).toBe(false)
    expect(nichtKopierbar('HTTP 404 videoNotFound')).toBe(true)
  })
  it('failedPrecondition wird erkannt, aber nicht pauschal übersprungen', () => {
    const msg = 'POST playlistItems: HTTP 400 failedPrecondition Precondition check failed.'
    expect(istVorbedingungsfehler(msg)).toBe(true)
    expect(nichtKopierbar(msg)).toBe(false)
  })
  it('unsichtbar nur, wenn videos.list das Video nicht liefert', () => {
    expect(unsichtbar({ items: [] }, 'x')).toBe(true)
    expect(unsichtbar({}, 'x')).toBe(true)
    expect(unsichtbar({ items: [{ id: 'x' }] }, 'x')).toBe(false)
  })
})

describe('offeneVideos', () => {
  it('lässt erledigte und übersprungene weg', () => {
    expect(offeneVideos(['a', 'b', 'c'], { erledigt: ['a'], uebersprungen: ['c'] })).toEqual(['b'])
  })
})
