/**
 * Glossar-Agent: Was ist ein gruener Lauf? (03.10.2026, CLAUDE.md Regel 10)
 *
 * Anlass: 13 Tage lang jeden Tag gruen mit „0 neue Begriffe (191 bereits
 * verarbeitet, 191 gesamt)" — ohne Zahl im Summary, und ein Absturz haette
 * ebenfalls mit exit 0 geendet.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { laufBilanz } from './glossary-agent.mjs'

const basis = { quellDateien: 45, gesamt: 191 }

describe('glossary-agent — laufBilanz', () => {
  it('Vorrat leer: gruen, aber benannt — mit Zahl, nicht mit Prosa', () => {
    const b = laufBilanz({ ...basis, offen: 0 })
    expect(b.zustand).toBe('vorrat-leer')
    expect(b.exitCode).toBe(0)
    expect(b.titel).toContain('0 von 191')
    expect(b.markdown).toContain('| Vorrat (offen vor dem Lauf) | 0 |')
    expect(b.markdown).toContain('| davon bereits verarbeitet | 191 |')
    expect(b.markdown).toContain('SEED_TERMS')
  })

  it('geliefert: gruen mit Anzahl', () => {
    const b = laufBilanz({ ...basis, gesamt: 194, offen: 3, created: 2, dubletten: 1 })
    expect(b.zustand).toBe('geliefert')
    expect(b.exitCode).toBe(0)
    expect(b.titel).toContain('2 neue')
    expect(b.markdown).toContain('| Dublette, nicht angelegt | 1 |')
  })

  it('kein Eintrag erstellt, obwohl Generierungen fehlschlugen: rot', () => {
    const b = laufBilanz({ ...basis, gesamt: 194, offen: 3, created: 0, errors: 3 })
    expect(b.zustand).toBe('ausfall')
    expect(b.exitCode).toBe(1)
  })

  it('ein Fehler neben einem Erfolg bleibt gruen — es kam etwas heraus', () => {
    const b = laufBilanz({ ...basis, gesamt: 194, offen: 3, created: 1, errors: 2 })
    expect(b.zustand).toBe('geliefert')
    expect(b.exitCode).toBe(0)
    expect(b.markdown).toContain('| Fehler | 2 |')
  })

  it('offene Begriffe, aber kein Schluessel: Ausfall', () => {
    const b = laufBilanz({ ...basis, gesamt: 194, offen: 3, ohneSchluessel: true })
    expect(b.zustand).toBe('ausfall')
    expect(b.exitCode).toBe(1)
    expect(b.titel).toContain('ANTHROPIC_API_KEY')
  })

  it('kein Schluessel, aber auch nichts offen: das ist der leere Vorrat, kein Ausfall', () => {
    expect(laufBilanz({ ...basis, offen: 0, ohneSchluessel: true }).zustand).toBe('vorrat-leer')
  })

  it('alles Offene bewusst verworfen (Dublette, Temperatur, Gate): gruen, aber nicht „geliefert"', () => {
    const b = laufBilanz({ ...basis, gesamt: 194, offen: 3, dubletten: 1, tempAbgelehnt: 1, gateAbgelehnt: 1 })
    expect(b.zustand).toBe('nichts-angelegt')
    expect(b.exitCode).toBe(0)
  })
})

describe('glossary-agent — Absturz ist rot', () => {
  const quelle = readFileSync(new URL('./glossary-agent.mjs', import.meta.url), 'utf-8')

  it('der Fangblock endet nicht mehr mit exit 0', () => {
    const fang = quelle.slice(quelle.lastIndexOf('main().catch'))
    expect(fang).toContain('process.exit(1)')
    expect(fang).not.toContain('process.exit(0)')
  })

  it('der Import dieser Datei startet keinen Lauf (Schutz fuer genau diesen Test)', () => {
    expect(quelle).toContain('import.meta.url === pathToFileURL(process.argv[1]).href')
  })
})
