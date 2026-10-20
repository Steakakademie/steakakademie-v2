/**
 * YouTube-Anbindung — reine Funktionen ohne Netz (20.10.2026).
 */
import { describe, it, expect } from 'vitest'
import { hatKapitel, istShort, neuesSnippet, pruefeKanal, pruefeVideo, sekunden, token } from './lib.mjs'
import { baueMetadaten } from './upload.mjs'
import { offen } from './kommentare.mjs'
import { diff } from './metadaten.mjs'
import { zeitraum } from './analytics.mjs'
import { abgleich } from './playlists.mjs'
import { nichtKopierbar, offeneVideos } from './playlists-kopieren.mjs'

describe('sekunden / istShort', () => {
  it('parst ISO-8601-Dauern', () => {
    expect(sekunden('PT16S')).toBe(16)
    expect(sekunden('PT1H2M3S')).toBe(3723)
    expect(sekunden('P1DT1S')).toBe(86401)
    expect(sekunden('quatsch')).toBe(0)
  })
  it('Shorts bis 3 Minuten', () => {
    expect(istShort(16)).toBe(true)
    expect(istShort(180)).toBe(true)
    expect(istShort(181)).toBe(false)
    expect(istShort(0)).toBe(false)
  })
})

describe('hatKapitel', () => {
  it('erkennt gültige Kapitel (ab 0:00, mind. 3, je 10 s)', () => {
    expect(hatKapitel('0:00 Intro\n1:20 Anheizen\n4:05 Sear')).toBe(true)
  })
  it('lehnt fehlendes 0:00 und zu enge Abstände ab', () => {
    expect(hatKapitel('0:05 Intro\n1:20 A\n4:05 B')).toBe(false)
    expect(hatKapitel('0:00 Intro\n0:05 A\n4:05 B')).toBe(false)
    expect(hatKapitel('0:00 Intro\n1:00 A')).toBe(false)
  })
})

const basisVideo = (snippet = {}, status = {}, dauer = 'PT16S') => ({
  id: 'x',
  snippet: {
    title: 'Picanha Churrasco – Brasilianischer Klassiker vom Grill 🔥',
    description: 'Picanha am Spieß. '.repeat(12) + '\nRezept: https://steakakademie.de/rezepte/fleisch/picanha-churrasco\nHinweis: Das Rezeptbild wurde mit KI erzeugt. #steakakademie',
    tags: ['Picanha'],
    categoryId: '26',
    defaultLanguage: 'de',
    defaultAudioLanguage: 'de',
    ...snippet,
  },
  status: { privacyStatus: 'public', embeddable: true, ...status },
  contentDetails: { duration: dauer },
  statistics: { viewCount: '12' },
})

describe('pruefeVideo', () => {
  it('sauberes Video ohne Befund', () => {
    expect(pruefeVideo(basisVideo()).befunde).toEqual([])
  })
  it('findet die Juli-Fehler der Schablonen-Shorts', () => {
    const codes = pruefeVideo(basisVideo({
      title: 'Warum dein Ganze Rotbarbe vom Grill bisher zäh wurde – und wie es perfekt wird. 🔥',
      tags: undefined,
      categoryId: '22',
      defaultAudioLanguage: undefined,
      description: 'kurz',
    })).befunde.map((b) => b.code)
    expect(codes).toEqual(expect.arrayContaining(['titel-lang', 'keine-tags', 'kategorie', 'keine-audiosprache', 'beschreibung-duenn', 'kein-website-link', 'kein-ki-hinweis']))
  })
  it('verlangt Kapitel erst bei langen Videos', () => {
    expect(pruefeVideo(basisVideo({}, {}, 'PT9M')).befunde.map((b) => b.code)).toContain('keine-kapitel')
    expect(pruefeVideo(basisVideo({}, {}, 'PT50S')).befunde.map((b) => b.code)).not.toContain('keine-kapitel')
  })
})

describe('pruefeKanal', () => {
  it('meldet Superlativ, fehlenden Link und fehlende Sprache', () => {
    const codes = pruefeKanal({ brandingSettings: { channel: { description: 'Deutschlands erste Diplom-Akademie', keywords: 'bbq' } } }).map((b) => b.code)
    expect(codes).toEqual(expect.arrayContaining(['kanal-superlativ', 'kanal-kein-link', 'kanal-keine-sprache', 'kanal-beschreibung-kurz']))
  })
})

describe('neuesSnippet', () => {
  const alt = { title: 'Alt', description: 'd', categoryId: '22', tags: ['a'], defaultLanguage: 'de' }
  it('behält nicht geänderte Felder (videos.update überschreibt das ganze snippet)', () => {
    const s = neuesSnippet(alt, { categoryId: '26' })
    expect(s).toEqual({ title: 'Alt', description: 'd', categoryId: '26', tags: ['a'], defaultLanguage: 'de' })
  })
  it('lehnt unzulässige Werte ab', () => {
    expect(() => neuesSnippet(alt, { title: 'x'.repeat(101) })).toThrow()
    expect(() => neuesSnippet(alt, { description: 'a < b' })).toThrow()
    expect(() => neuesSnippet(alt, { tags: Array.from({ length: 60 }, (_, i) => `schlagwort${i}`) })).toThrow()
  })
})

describe('diff', () => {
  it('listet nur geänderte Felder', () => {
    expect(diff({ title: 'a', tags: ['x'] }, { title: 'b', tags: ['x'] })).toEqual([{ feld: 'title', alt: 'a', neu: 'b' }])
  })
})

describe('baueMetadaten (Upload)', () => {
  it('lädt privat hoch, setzt Kategorie/Sprache, hängt den Website-Link an', () => {
    const m = baueMetadaten({ titel: 'Ribeye', beschreibung: 'Text', ki: 'nein' })
    expect(m.status.privacyStatus).toBe('private')
    expect(m.status.containsSyntheticMedia).toBe(false)
    expect(m.snippet.categoryId).toBe('26')
    expect(m.snippet.defaultAudioLanguage).toBe('de')
    expect(m.snippet.description).toContain('https://steakakademie.de')
  })
  it('verweigert Upload ohne KI-Angabe und Termine in der Vergangenheit', () => {
    expect(() => baueMetadaten({ titel: 'R', beschreibung: '' })).toThrow(/--ki/)
    expect(() => baueMetadaten({ titel: 'R', beschreibung: '', ki: 'ja', veroeffentlichenAm: '2020-01-01T00:00:00Z' })).toThrow(/Zukunft/)
  })
})

describe('offen (Kommentare)', () => {
  const t = (autor, antworten = [], datum = '2026-10-10T00:00:00Z') => ({
    snippet: { videoId: 'v', topLevelComment: { snippet: { authorChannelId: { value: autor }, publishedAt: datum } } },
    replies: { comments: antworten.map((a) => ({ snippet: { authorChannelId: { value: a } } })) },
  })
  it('zeigt nur fremde Kommentare ohne Kanal-Antwort', () => {
    const liste = offen([t('fan'), t('fan', ['KANAL']), t('KANAL'), t('fan', ['anderer'])], 'KANAL')
    expect(liste).toHaveLength(2)
  })
})

describe('abgleich (Playlists)', () => {
  it('nutzt vorhandene Playlist gleichen Titels und ergänzt nur Fehlendes', () => {
    const plan = [{ titel: 'Fisch vom Grill', videos: ['a', 'b'] }, { titel: 'Lamm vom Grill', videos: ['c'] }]
    const vorhanden = [{ id: 'PL1', snippet: { title: 'Fisch vom Grill' } }]
    const erg = abgleich(plan, vorhanden, { PL1: ['a'] })
    expect(erg[0]).toMatchObject({ id: 'PL1', fehlend: ['b'] })
    expect(erg[1]).toMatchObject({ id: null, fehlend: ['c'] })
  })
})

describe('Playlist-Umzug', () => {
  it('lässt erledigte und übersprungene Videos aus, Reihenfolge bleibt', () => {
    expect(offeneVideos(['a', 'b', 'c', 'd'], { erledigt: ['a'], uebersprungen: ['c'] })).toEqual(['b', 'd'])
    expect(offeneVideos(['a'], undefined)).toEqual(['a'])
  })
  it('überspringt nicht kopierbare Videos statt abzubrechen', () => {
    expect(nichtKopierbar('POST playlistItems: HTTP 404 videoNotFound')).toBe(true)
    expect(nichtKopierbar('POST playlistItems: HTTP 403 forbidden')).toBe(true)
    expect(nichtKopierbar('POST playlistItems: HTTP 403 quotaExceeded')).toBe(false)
    expect(nichtKopierbar('POST playlistItems: HTTP 500 backendError')).toBe(false)
  })
})

describe('zeitraum (Analytics)', () => {
  it('endet zwei Tage vor heute', () => {
    expect(zeitraum(7, new Date('2026-10-20T12:00:00Z'))).toEqual({ startDate: '2026-10-12', endDate: '2026-10-18' })
  })
})

describe('token', () => {
  it('Fehlertext ohne Geheimnisse bei widerrufenem Token', async () => {
    const f = async () => ({ ok: false, status: 400, json: async () => ({ error: 'invalid_grant' }) })
    await expect(token({ clientId: 'id', clientSecret: 'GEHEIM', refreshToken: 'RT' }, f)).rejects.toThrow(/widerrufen/)
    await token({ clientId: 'id', clientSecret: 'GEHEIM', refreshToken: 'RT' }, f).catch((e) => expect(e.message).not.toMatch(/GEHEIM|RT/))
  })
})
