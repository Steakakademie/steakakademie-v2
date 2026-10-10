/**
 * Search-Console-Abruf — Zeitraum, JWT, CSV und Schlüsselschutz (10.10.2026).
 * Kein Netz: die API wird durch eine Attrappe ersetzt.
 */
import { describe, it, expect } from 'vitest'
import { createPublicKey, createVerify, generateKeyPairSync } from 'node:crypto'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ABRUFE,
  ZEILEN_JE_SEITE,
  anfrage,
  holeToken,
  holeZeilen,
  jwt,
  leseDienstkonto,
  schluesselOrtErlaubt,
  zeilenZuCsv,
  zeitraum,
} from './gsc-abruf.mjs'

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
})

describe('zeitraum', () => {
  it('endet drei Tage vor heute und umfasst genau N Tage', () => {
    expect(zeitraum({ heute: new Date('2026-10-10T12:00:00Z'), tage: 90 })).toEqual({ von: '2026-07-10', bis: '2026-10-07' })
    expect(zeitraum({ heute: new Date('2026-10-10T12:00:00Z'), tage: 1 })).toEqual({ von: '2026-10-07', bis: '2026-10-07' })
  })
  it('--von/--bis gelten wörtlich, nur zusammen und in richtiger Reihenfolge', () => {
    expect(zeitraum({ von: '2026-09-10', bis: '2026-10-09' })).toEqual({ von: '2026-09-10', bis: '2026-10-09' })
    expect(() => zeitraum({ von: '2026-09-10' })).toThrow('zusammen')
    expect(() => zeitraum({ von: '2026-10-09', bis: '2026-09-10' })).toThrow('nach')
    expect(() => zeitraum({ von: '10.09.2026', bis: '2026-10-09' })).toThrow('JJJJ-MM-TT')
  })
  it('lehnt unsinnige --tage ab', () => {
    expect(() => zeitraum({ tage: 0 })).toThrow()
    expect(() => zeitraum({ tage: 9999 })).toThrow()
  })
})

describe('jwt', () => {
  it('trägt Aussteller, Scope, Ziel und eine gültige RS256-Signatur', () => {
    const token = jwt({ clientEmail: 'sa@projekt.iam.gserviceaccount.com', privateKey, jetzt: Date.UTC(2026, 9, 10) })
    const [kopf, anspruch, signatur] = token.split('.')
    expect(JSON.parse(Buffer.from(kopf, 'base64url').toString())).toEqual({ alg: 'RS256', typ: 'JWT' })
    const a = JSON.parse(Buffer.from(anspruch, 'base64url').toString())
    expect(a.iss).toBe('sa@projekt.iam.gserviceaccount.com')
    expect(a.scope).toBe('https://www.googleapis.com/auth/webmasters.readonly')
    expect(a.aud).toBe('https://oauth2.googleapis.com/token')
    expect(a.exp - a.iat).toBe(3600)
    const ok = createVerify('RSA-SHA256')
      .update(`${kopf}.${anspruch}`)
      .verify(createPublicKey(publicKey), Buffer.from(signatur, 'base64url'))
    expect(ok).toBe(true)
  })
})

describe('CSV', () => {
  const zeilen = [
    { keys: ['kerntemperatur hackfleisch'], clicks: 3, impressions: 881, ctr: 0.0034, position: 10.1534 },
    { keys: ['=HYPERLINK(x)'], clicks: 0, impressions: 2, ctr: 0, position: 4 },
    { keys: ['mit, komma'], clicks: 1, impressions: 1, ctr: 1, position: 1 },
  ]
  const csv = zeilenZuCsv(['query'], zeilen).split('\n')
  it('Kopf, CTR in Prozent, Position gerundet', () => {
    expect(csv[0]).toBe('query,Klicks,Impressionen,CTR,Position')
    expect(csv[1]).toBe('kerntemperatur hackfleisch,3,881,0.34%,10.15')
  })
  it('entschärft Formeln und maskiert Kommas', () => {
    expect(csv[2].startsWith("'=HYPERLINK(")).toBe(true)
    expect(csv[3]).toBe('"mit, komma",1,1,100.00%,1')
  })
})

describe('API-Abruf', () => {
  it('Anfrage: Zeitraum, Dimensionen, Suchtyp, endgültige Daten', () => {
    expect(anfrage({ von: '2026-07-10', bis: '2026-10-07', dimensionen: ['query', 'page'], suchtyp: 'web', startRow: 25000 })).toEqual({
      startDate: '2026-07-10',
      endDate: '2026-10-07',
      dimensions: ['query', 'page'],
      type: 'web',
      rowLimit: ZEILEN_JE_SEITE,
      startRow: 25000,
      dataState: 'final',
    })
  })

  it('blättert, bis eine Seite nicht mehr voll ist', async () => {
    const aufrufe = []
    const seite = (n) => Array.from({ length: n }, (_, i) => ({ keys: [`q${i}`], clicks: 0, impressions: 1, ctr: 0, position: 1 }))
    const attrappe = async (url, opt) => {
      const body = JSON.parse(opt.body)
      aufrufe.push(body.startRow)
      return { ok: true, status: 200, json: async () => ({ rows: seite(body.startRow === 0 ? ZEILEN_JE_SEITE : 7) }) }
    }
    const zeilen = await holeZeilen(
      { token: 't', property: 'sc-domain:steakakademie.de', von: 'a', bis: 'b', dimensionen: ['query'], suchtyp: 'web' },
      attrappe,
    )
    expect(aufrufe).toEqual([0, ZEILEN_JE_SEITE])
    expect(zeilen).toHaveLength(ZEILEN_JE_SEITE + 7)
  })

  it('403 nennt die wahrscheinliche Ursache, ohne das Token zu zeigen', async () => {
    const attrappe = async () => ({ ok: false, status: 403, json: async () => ({}) })
    const fehler = await holeZeilen({ token: 'geheim', property: 'p', von: 'a', bis: 'b', dimensionen: ['query'] }, attrappe).catch((e) => e)
    expect(fehler.message).toMatch(/als Nutzer eingetragen/)
    expect(fehler.message).not.toMatch(/geheim/)
  })

  it('Token-Fehler verrät den Schlüssel nicht', async () => {
    const attrappe = async () => ({ ok: false, status: 400, json: async () => ({}) })
    const fehler = await holeToken({ clientEmail: 'x', privateKey }, attrappe).catch((e) => e)
    expect(fehler.message).toContain('HTTP 400')
    expect(fehler.message).not.toMatch(/PRIVATE KEY/)
  })

  it('ruft sechs Auswertungen ab', () => {
    expect(ABRUFE.map((a) => a.datei)).toEqual(['suchanfragen', 'seiten', 'suchanfrage-seite', 'laender', 'geraete', 'verlauf'])
  })
})

describe('Schlüsselschutz', () => {
  const wurzel = join(tmpdir(), 'sa-repo')
  it('erlaubt nur Orte außerhalb des Repos oder unter privat/', () => {
    expect(schluesselOrtErlaubt(join(wurzel, 'schluessel.json'), wurzel)).toBe(false)
    expect(schluesselOrtErlaubt(join(wurzel, 'src', 'x.json'), wurzel)).toBe(false)
    expect(schluesselOrtErlaubt(join(wurzel, 'privat', 'gsc-key.json'), wurzel)).toBe(true)
    expect(schluesselOrtErlaubt(join(tmpdir(), 'anderswo', 'key.json'), wurzel)).toBe(true)
  })
  it('prüft den Dateiinhalt: nur Dienstkonto-Schlüssel', () => {
    const ordner = mkdtempSync(join(tmpdir(), 'gsc-'))
    const gut = join(ordner, 'gut.json')
    writeFileSync(gut, JSON.stringify({ type: 'service_account', client_email: 'a@b', private_key: privateKey }))
    expect(leseDienstkonto(gut, join(ordner, 'repo'))).toEqual({ clientEmail: 'a@b', privateKey })
    const falsch = join(ordner, 'falsch.json')
    writeFileSync(falsch, JSON.stringify({ type: 'authorized_user' }))
    expect(() => leseDienstkonto(falsch, join(ordner, 'repo'))).toThrow('Dienstkonto')
    expect(() => leseDienstkonto(undefined)).toThrow('GSC_DIENSTKONTO_PFAD')
  })
})
