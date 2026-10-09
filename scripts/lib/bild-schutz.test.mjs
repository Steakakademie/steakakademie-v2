import { describe, it, expect } from 'vitest'
import { istHandgewaehlt } from './bild-schutz.mjs'

const fm = zeilen => `---\ntitle: Test\n${zeilen}\n---\nText`

describe('istHandgewaehlt — schuetzt gewaehlte Bilder vor recipe-images --force', () => {
  it('eigene fal.ai-Bilder duerfen neu erzeugt werden', () => {
    expect(istHandgewaehlt(fm('imageAI: true\nimageSource: "KI-generiert (FLUX.1 dev via fal.ai, scripts/recipe-images.mjs)"'))).toBe(false)
    expect(istHandgewaehlt(fm('imageAI: true\nimageSource: "KI-generiert (FLUX via fal.ai, C2PA-belegt)"'))).toBe(false)
  })
  it('Altbestand ohne geklaerte Herkunft darf neu erzeugt werden', () => {
    expect(istHandgewaehlt(fm('imageAI: true\nimageSource: "KI-generiert (visuell klassifiziert, Metadaten entfernt)"'))).toBe(false)
    expect(istHandgewaehlt(fm('image: "/images/rezepte/x.jpg"'))).toBe(false)
  })
  it('echte Fotos bleiben (imageAI: false)', () => {
    expect(istHandgewaehlt(fm('imageAI: false\nimageSource: "Pexels (Nano Erdozain, Foto-ID 29101366), Web-Zuschnitt 4:3/-Kompression"'))).toBe(true)
    expect(istHandgewaehlt(fm('imageAI: false'))).toBe(true)
  })
  it('KI-Bilder aus einem anderen Werkzeug bleiben', () => {
    expect(istHandgewaehlt(fm('imageAI: true\nimageSource: "KI-generiert (Google-KI-Modell, von Uwe geliefert)"'))).toBe(true)
  })
  it('von Hand bearbeitete Fotos bleiben, auch mit KI-Kennzeichnung', () => {
    expect(istHandgewaehlt(fm('imageAI: true\nimageSource: "Echtfoto-Basis (Pexels: Mohamed  Olwy), KI-bearbeitet (Nano Banana)"'))).toBe(true)
  })
})
