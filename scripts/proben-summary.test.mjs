/**
 * Funktionsproben — was sagt das Job-Summary, und wann ist der Lauf rot? (03.10.2026)
 *
 * Die Berichte unten sind der Form nachgebaut, die Playwright 1.60 tatsaechlich
 * schreibt (am 03.10.2026 an echten Laeufen abgelesen: 15 anonyme Proben gegen
 * die Live-Seite, 6 ausgesetzte angemeldete, dazu Kette mit Fehlschlag).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { auswertung, sammle } from './proben-summary.mjs'

const NICHT_EINGERICHTET = 'nicht eingerichtet: PROBE_EMAIL / PROBE_PASSWORD fehlen'
const TURNSTILE = 'Turnstile gab dem Probenbrowser kein Token — Anmeldung über das Formular nicht möglich'

/** Ein Test, wie er im Bericht steht. */
function probe (projekt, titel, status, { skip, fehler, annotationen = [] } = {}) {
  const ann = [...(skip ? [{ type: 'skip', description: skip }] : []), ...annotationen]
  return {
    title: titel,
    tests: [{
      projectName: projekt,
      status,
      annotations: ann,
      results: [{ status: status === 'expected' ? 'passed' : status === 'skipped' ? 'skipped' : 'failed', annotations: ann, ...(fehler ? { error: { message: fehler } } : {}) }],
    }],
  }
}

function bericht (anonym, angemeldet, dauerMs = 68_000) {
  return {
    stats: { duration: dauerMs },
    suites: [
      { title: 'anonym.spec.ts', specs: [], suites: [{ title: 'Kernseiten', specs: anonym }] },
      { title: 'angemeldet.spec.ts', specs: angemeldet.slice(0, 1), suites: [{ title: 'mit Sitzung', specs: angemeldet.slice(1) }] },
    ],
  }
}

const anonymGruen = (n = 15) => Array.from({ length: n }, (_, i) => probe('anonym', `Probe ${i + 1}`, 'expected'))
const angemeldetAus = () => ['Anmeldung', 'Meine Kurse', 'Profil', 'Aroma', 'Streitfall', 'Formular'].map((t) => probe('angemeldet', t, 'skipped', { skip: NICHT_EINGERICHTET }))

describe('proben-summary — sammle', () => {
  it('findet Tests auf jeder Ebene und merkt sich Projekt, Status und Annotationen', () => {
    const tests = sammle(bericht(anonymGruen(2), angemeldetAus()))
    expect(tests).toHaveLength(8)
    expect(tests.filter((t) => t.projekt === 'anonym')).toHaveLength(2)
    expect(tests.at(-1)).toMatchObject({ projekt: 'angemeldet', status: 'skipped' })
    expect(tests.at(-1).annotationen[0]).toEqual({ typ: 'skip', text: NICHT_EINGERICHTET })
  })
})

describe('proben-summary — auswertung', () => {
  it('anonym grün, angemeldet nicht eingerichtet: Exit 0, Zahlen, deutliche Warnung', () => {
    const a = auswertung(bericht(anonymGruen(), angemeldetAus()))
    expect(a.exitCode).toBe(0)
    expect(a.gruppen.anonym).toMatchObject({ gesamt: 15, bestanden: 15, fehlgeschlagen: 0 })
    expect(a.gruppen.angemeldet.zustand).toBe('nicht-eingerichtet')
    expect(a.markdown).toContain('| anonym | 15 / 15 | 0 | 0 | 0 |')
    expect(a.markdown).toContain('**nicht eingerichtet** (Secrets PROBE_EMAIL/PROBE_PASSWORD fehlen)')
    expect(a.markdown).toContain('Dauer: 68 s')
    expect(a.warnungen).toHaveLength(1)
    expect(a.warnungen[0]).toContain('PROBE_EMAIL/PROBE_PASSWORD')
  })

  it('beide Gruppen grün: Exit 0, keine Warnung', () => {
    const angemeldet = ['Anmeldung', 'Meine Kurse', 'Profil', 'Aroma', 'Streitfall', 'Formular'].map((t) => probe('angemeldet', t, 'expected'))
    const a = auswertung(bericht(anonymGruen(), angemeldet))
    expect(a.exitCode).toBe(0)
    expect(a.warnungen).toEqual([])
    expect(a.markdown).toContain('| angemeldet | 6 / 6 | 0 | 0 | 0 |')
  })

  it('eine anonyme Probe scheitert: rot, mit Namen und erster Fehlerzeile', () => {
    const anonym = [...anonymGruen(14), probe('anonym', 'Aroma-Matcher: Status-Abfrage antwortet', 'unexpected', { fehler: 'Error: Status-Abfrage /api/aroma-matcher\n\nExpected: 200\nReceived: 500' })]
    const a = auswertung(bericht(anonym, angemeldetAus()))
    expect(a.exitCode).toBe(1)
    expect(a.rot).toBe(true)
    expect(a.markdown).toContain('| anonym | 14 / 15 | 1 | 0 | 0 |')
    expect(a.markdown).toContain('- **Aroma-Matcher: Status-Abfrage antwortet** (anonym) — Error: Status-Abfrage /api/aroma-matcher')
    expect(a.betroffen).toBe('Aroma-Matcher: Status-Abfrage antwortet')
    expect(a.bericht).toContain('1 Probe(n) gescheitert')
  })

  it('der Fall vom September: Aroma-Abfrage mit Sitzung antwortet 401 → rot, die übrigen der Kette zählen als nicht gelaufen', () => {
    const angemeldet = [
      probe('angemeldet', 'Anmeldung', 'expected'),
      probe('angemeldet', 'Meine Kurse', 'expected'),
      probe('angemeldet', 'Profil', 'expected'),
      probe('angemeldet', 'Aroma-Matcher: Abfrage als angemeldeter Nutzer', 'unexpected', { fehler: 'Error: Cut-Abfrage mit gültiger Sitzung\nExpected: 200\nReceived: 401' }),
      probe('angemeldet', 'Streitfall', 'skipped'),
      probe('angemeldet', 'Formular', 'skipped'),
    ]
    const a = auswertung(bericht(anonymGruen(), angemeldet))
    expect(a.exitCode).toBe(1)
    expect(a.gruppen.angemeldet).toMatchObject({ zustand: 'gelaufen', bestanden: 3, fehlgeschlagen: 1, nichtGelaufen: 2 })
    expect(a.markdown).toContain('| angemeldet | 3 / 6 | 1 | 0 | 2 |')
  })

  it('Turnstile lässt den Probenbrowser nicht durch: nicht rot, aber Warnung und eigener Zustand', () => {
    const angemeldet = ['Anmeldung', 'Meine Kurse', 'Profil', 'Aroma', 'Streitfall', 'Formular'].map((t) => probe('angemeldet', t, 'skipped', { skip: TURNSTILE }))
    const a = auswertung(bericht(anonymGruen(), angemeldet))
    expect(a.exitCode).toBe(0)
    expect(a.gruppen.angemeldet.zustand).toBe('turnstile')
    expect(a.markdown).toContain('**nicht ausführbar** — Turnstile gab dem Probenbrowser kein Token')
    expect(a.warnungen[0]).toContain('Turnstile')
  })

  it('die Turnstile-Beobachtung der anonymen Login-Probe steht im Summary', () => {
    const anonym = [...anonymGruen(14), probe('anonym', 'Login-Seite', 'expected', { annotationen: [{ type: 'turnstile', description: 'kein Token — der Anmelde-Knopf blieb bei „Sicherheitsprüfung …"' }] })]
    const a = auswertung(bericht(anonym, angemeldetAus()))
    expect(a.turnstile).toContain('kein Token')
    expect(a.markdown).toContain('Turnstile und automatisierter Browser (Beobachtung auf der Login-Seite): kein Token')
  })

  it('wackelig zählt als bestanden, wird aber beim Namen genannt', () => {
    const anonym = [...anonymGruen(14), probe('anonym', 'Hofladen-Radar', 'flaky')]
    const a = auswertung(bericht(anonym, angemeldetAus()))
    expect(a.exitCode).toBe(0)
    expect(a.markdown).toContain('| anonym | 15 / 15 | 0 | 1 | 0 |')
    expect(a.markdown).toContain('- Hofladen-Radar (anonym)')
  })

  it('keine anonyme Probe gelaufen: rot — grün ohne Ergebnis gibt es nicht', () => {
    const a = auswertung(bericht([], angemeldetAus()))
    expect(a.exitCode).toBe(1)
    expect(a.bericht).toContain('keine einzige anonyme Probe gelaufen')
  })

  it('kein Bericht: rot, mit Klartext', () => {
    const a = auswertung(null, { baseUrl: 'https://steakakademie.de' })
    expect(a.exitCode).toBe(1)
    expect(a.markdown).toContain('Kein Ergebnisbericht')
  })

  it('die Adresse des Testkontos erscheint nie im Summary', () => {
    const angemeldet = [probe('angemeldet', 'Anmeldung', 'unexpected', { fehler: 'Error: Anmeldung nicht gelungen für probe@steakakademie.de' })]
    const a = auswertung(bericht(anonymGruen(), angemeldet), { schwaerzen: ['probe@steakakademie.de', undefined] })
    expect(a.markdown).not.toContain('probe@steakakademie.de')
    expect(a.markdown).toContain('[Testkonto]')
  })

  it('BASE_URL steht in der Überschrift', () => {
    expect(auswertung(bericht(anonymGruen(), angemeldetAus()), { baseUrl: 'https://vorschau.example' }).markdown)
      .toContain('## Funktionsproben gegen https://vorschau.example')
  })
})

describe('proben-summary — Anschluss an die Proben', () => {
  const spec = readFileSync(new URL('../tests/proben/angemeldet.spec.ts', import.meta.url), 'utf-8')

  it('die Aussetz-Gründe im Spec sind die, an denen die Auswertung die Zustände erkennt', () => {
    expect(spec).toContain(`'${NICHT_EINGERICHTET}'`)
    expect(spec).toContain(`'${TURNSTILE}'`)
  })

  it('der Workflow ruft diese Auswertung mit dem Bericht aus der Proben-Konfiguration auf', () => {
    const config = readFileSync(new URL('../playwright.proben.config.ts', import.meta.url), 'utf-8')
    const workflow = readFileSync(new URL('../.github/workflows/funktionsproben.yml', import.meta.url), 'utf-8')
    expect(config).toContain("outputFile: 'playwright-report/proben-results.json'")
    expect(workflow).toContain('node scripts/proben-summary.mjs')
    expect(workflow).toContain('node-version-file: .nvmrc')
  })
})
