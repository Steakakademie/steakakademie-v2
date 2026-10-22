/**
 * Wochenstapel Social Media — reine Funktionen (21.10.2026).
 */
import { describe, it, expect } from 'vitest'
import { baueStapel, facebookPost, hashtags, instagramPost, kalenderwoche, naechste, plusTage, pruefe } from './wochenstapel.mjs'

const rezept = (slug, fm = {}) => ({ slug, fm: { title: `${slug} – Test`, image: `/images/rezepte/${slug}.jpg`, kategorie: 'fleisch', description: 'Saftig vom Rost. Kerntemperatur 54 °C halten.', meatType: 'Rind', imageAI: true, ...fm } })
const alle = Array.from({ length: 30 }, (_, i) => rezept(`r${String(i).padStart(2, '0')}`))

describe('Datum', () => {
  it('rechnet Kalenderwoche und Tage', () => {
    expect(kalenderwoche('2026-10-27')).toBe(44)
    expect(kalenderwoche('2027-01-01')).toBe(53)
    expect(plusTage('2026-10-27', 6)).toBe('2026-11-02')
  })
})

describe('Texte', () => {
  it('Facebook: ohne °C, mit UTM, mit KI-Satz', () => {
    const p = facebookPost(alle[0].fm, 'r00', 44)
    expect(p.text).not.toMatch(/°C|Kerntemperatur/)
    expect(p.text).toMatch(/utm_source=facebook&utm_medium=social&utm_campaign=wochenstapel-kw44/)
    expect(p.text).toMatch(/Bild KI-generiert\./)
    expect(pruefe(p)).toEqual([])
  })
  it('Instagram: kein Link, Verweis auf die Bio, Bild-URL absolut', () => {
    const p = instagramPost(alle[0].fm, 'r00')
    expect(p.text).not.toMatch(/https?:\/\//)
    expect(p.text).toMatch(/Link in der Bio/)
    expect(p.bild).toBe('https://steakakademie.de/images/rezepte/r00.jpg')
  })
  it('Hashtags: höchstens 8, Marke immer dabei', () => {
    const h = hashtags({ kategorie: 'fleisch', cookingMethod: 'Smoker, low', meatType: 'Spareribs' }).split(' ')
    expect(h.length).toBeLessThanOrEqual(8)
    expect(h).toContain('#steakakademie')
    expect(h).toContain('#lowandslow')
    expect(hashtags({ kategorie: 'fleisch', title: 'Smash Burger', meatType: 'Rinderhack' })).toMatch(/#burger/)
  })
})

describe('pruefe', () => {
  it('meldet °C, fehlenden KI-Hinweis, fehlendes UTM und Kurzlinks', () => {
    expect(pruefe({ kanal: 'instagram', text: 'Bei 54 °C ziehen.', ki: false })).toContain('°C-Angabe ohne Referenzbindung')
    expect(pruefe({ kanal: 'instagram', text: 'Lecker.', ki: true })).toContain('KI-Hinweis fehlt')
    expect(pruefe({ kanal: 'facebook', text: 'https://steakakademie.de/x', ki: false })).toContain('UTM fehlt')
    expect(pruefe({ kanal: 'facebook', text: 'https://mtr.cool/abc utm_source=facebook', ki: false })).toContain('Kurzlink statt Direktlink')
  })
  it('erlaubt °C in Videos mit Referenzbindung', () => {
    expect(pruefe({ kanal: 'tiktok', text: 'Mindestens 70 °C. KI-Stimme', ki: true, referenzwerte: true })).toEqual([])
  })
})

describe('naechste', () => {
  it('nimmt zuerst Offene und beginnt danach von vorn (Evergreen)', () => {
    const l = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }]
    expect(naechste(l, ['a'], 2).map((x) => x.slug)).toEqual(['b', 'c'])
    expect(naechste(l, ['a', 'b', 'c'], 2).map((x) => x.slug)).toEqual(['a', 'b'])
  })
})

describe('baueStapel', () => {
  it('7 Pins, 3 Facebook, 3 Instagram — ohne Überschneidung in derselben Woche, regelkonform', () => {
    const s = baueStapel({ start: '2026-10-27', alle })
    const zahl = (k) => s.posts.filter((p) => p.kanal === k).length
    expect([zahl('pinterest'), zahl('facebook'), zahl('instagram')]).toEqual([7, 3, 3])
    const slugs = s.posts.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(s.fehler).toEqual([])
    expect(s.posts.every((p) => p.datum >= '2026-10-27T00:00:00' && p.datum <= '2026-11-02T23:59:59')).toBe(true)
  })
  it('Videos werden Reel + TikTok, höchstens 3 pro Woche', () => {
    const videos = Array.from({ length: 5 }, (_, i) => ({ id: `v${i}`, url: `https://x/v${i}.mp4`, instagram: 'Text. KI-Stimme', tiktok: 'Text. KI-Stimme' }))
    const s = baueStapel({ start: '2026-10-27', alle, videos, verlauf: { video: ['v0'] } })
    const reels = s.posts.filter((p) => p.typ === 'REEL')
    expect(reels.map((p) => p.id)).toEqual(['v1', 'v2', 'v3'])
    expect(s.posts.filter((p) => p.kanal === 'tiktok')).toHaveLength(3)
  })
})
