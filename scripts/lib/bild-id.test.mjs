import { describe, it, expect } from 'vitest'
import { leseId } from './bild-id.mjs'

describe('leseId — Unsplash', () => {
  it('liest die ID aus dem Download-Namen <fotograf>-<ID>-unsplash', () => {
    expect(leseId('rodrigo-rodrigues-wolf-r-t-8fUbsnvyTWU-unsplash', 'unsplash')).toBe('8fUbsnvyTWU')
  })

  it('ignoriert eine vorangestellte eigene Beschreibung', () => {
    expect(leseId('Leberspieß - janet-ganbold-xlf1tNGcBH0-unsplash', 'unsplash')).toBe('xlf1tNGcBH0')
    expect(leseId('churrasco spieß 2 - rodrigo-rodrigues-wolf-r-t-qcSPyVordpg-unsplash', 'unsplash')).toBe('qcSPyVordpg')
  })

  it('behaelt Bindestriche innerhalb der ID', () => {
    expect(leseId('kyle-mackie-W-M0h1FJD0M-unsplash', 'unsplash')).toBe('W-M0h1FJD0M')
    expect(leseId('kyle-mackie-MEnlQv-EQvY-unsplash', 'unsplash')).toBe('MEnlQv-EQvY')
  })

  it('nimmt einen nackten ID-Namen (Ablage durch --hole) unveraendert', () => {
    expect(leseId('TDwxg8i8lfE', 'unsplash')).toBe('TDwxg8i8lfE')
  })

  it('liefert null statt einer geratenen ID bei freiem Namen', () => {
    expect(leseId('churrasco spieß', 'unsplash')).toBeNull()
  })
})

describe('leseId — Zahlen-IDs (unveraendert)', () => {
  it('Pexels: letzte Zahlengruppe, nicht die Fotografen-ID', () => {
    expect(leseId('pexels-nano-erdozain-120534369-27642997', 'pexels')).toBe('27642997')
  })

  it('fuehrende Zahl, sonst erste Gruppe ab 6 Ziffern', () => {
    expect(leseId('5252598-grill-holzkohle', 'pixabay')).toBe('5252598')
    expect(leseId('cskkkk-meat-7696816_1920', 'pixabay')).toBe('7696816')
  })
})
