/**
 * Ops-Heartbeat — der Waechter prueft Ergebnisse, nicht Laeufe (03.10.2026).
 *
 * Drei Luecken, die dieser Test zuhaelt:
 *   1. typ "git" zaehlte jeden Commit — ein Hand-Fix verdeckte den Stillstand eines Agenten.
 *   2. SKIP zaehlte als gesund.
 *   3. Hofladen-Import und Social-Entwuerfe hatten keinen Eintrag.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { letzteGitAenderung, juengstesArtefakt, bewerte, urteil } from './ops-heartbeat.mjs'

const TAG = 86_400_000
const JETZT = new Date('2026-10-03T12:00:00Z').getTime()

// ─── 1. git: nur NEUE Dateien ────────────────────────────────────────────────

describe('ops-heartbeat — letzteGitAenderung', () => {
  let repo
  const git = (args, datum) => execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', ...args], {
    cwd: repo, encoding: 'utf-8',
    env: { ...process.env, ...(datum ? { GIT_AUTHOR_DATE: datum, GIT_COMMITTER_DATE: datum } : {}) },
  })
  const commit = (datei, inhalt, datum, text) => {
    writeFileSync(join(repo, datei), inhalt)
    git(['add', datei])
    git(['commit', '-q', '-m', text], datum)
  }

  beforeAll(() => {
    // Eigenes Wegwerf-Repo: der Test haengt nicht an der Historie dieses Klons.
    repo = mkdtempSync(join(tmpdir(), 'heartbeat-'))
    git(['init', '-q', '-b', 'main'])
    mkdirSync(join(repo, 'content', 'glossar'), { recursive: true })
    commit('LIESMICH.md', 'x', '2026-09-01T10:00:00+00:00', 'Start')
    // 19.09.: der Agent liefert einen neuen Eintrag …
    commit('content/glossar/bark.mdx', 'Bark', '2026-09-19T10:00:00+00:00', 'Glossar-Agent: neue Begriffe')
    // … 23.09.: ein Mensch korrigiert ihn. Keine neue Datei.
    commit('content/glossar/bark.mdx', 'Bark, korrigiert', '2026-09-23T21:07:08+00:00', 'fix(fakten): Kerntemperaturen auf den Kanon')
  })
  afterAll(() => rmSync(repo, { recursive: true, force: true }))

  it('ohne Option zaehlt der Hand-Fix — genau die Luecke vom 02.10.2026', () => {
    expect(letzteGitAenderung('content/glossar', { cwd: repo })).toMatch(/^2026-09-23/)
  })

  it('mit nurNeueDateien zaehlt die letzte Lieferung, nicht die Korrektur', () => {
    expect(letzteGitAenderung('content/glossar', { nurNeueDateien: true, cwd: repo })).toMatch(/^2026-09-19/)
  })

  it('eine Umbenennung ist keine neue Datei', () => {
    git(['mv', 'content/glossar/bark.mdx', 'content/glossar/bark-kruste.mdx'])
    git(['commit', '-q', '-m', 'fix(glossar): umbenannt'], '2026-09-25T10:00:00+00:00')
    expect(letzteGitAenderung('content/glossar', { nurNeueDateien: true, cwd: repo })).toMatch(/^2026-09-19/)
    expect(letzteGitAenderung('content/glossar', { cwd: repo })).toMatch(/^2026-09-25/)
  })

  it('eine wirklich neue Datei stellt die Uhr vor', () => {
    commit('content/glossar/stall.mdx', 'Stall', '2026-09-30T10:00:00+00:00', 'Glossar-Agent: neue Begriffe')
    expect(letzteGitAenderung('content/glossar', { nurNeueDateien: true, cwd: repo })).toMatch(/^2026-09-30/)
  })

  it('kein passender Commit: Fehler statt eines erfundenen Datums', () => {
    expect(() => letzteGitAenderung('content/gibt-es-nicht', { nurNeueDateien: true, cwd: repo })).toThrow('kein Commit gefunden')
  })

  it('flacher Klon: die Pruefung bricht ab, statt die Schnittkante als Lieferung zu werten', () => {
    const flach = mkdtempSync(join(tmpdir(), 'heartbeat-flach-'))
    try {
      execFileSync('git', ['clone', '-q', '--depth', '1', `file://${repo}`, flach], { encoding: 'utf-8' })
      expect(() => letzteGitAenderung('content/glossar', { nurNeueDateien: true, cwd: flach })).toThrow('flacher Checkout')
    } finally {
      rmSync(flach, { recursive: true, force: true })
    }
  })
})

// ─── 2. Bewertung und Urteil ─────────────────────────────────────────────────

describe('ops-heartbeat — bewerte', () => {
  const eintrag = { name: 'Glossar', typ: 'git', nurNeueDateien: true, maxTage: 14, hinweis: 'h' }

  it('innerhalb der Frist: ok, mit Alter und Datum im Text', () => {
    const r = bewerte(eintrag, { iso: new Date(JETZT - 5 * TAG).toISOString() }, JETZT)
    expect(r.status).toBe('ok')
    expect(r.text).toContain('zuletzt neue Datei vor 5.0 Tagen')
    expect(r.text).toContain('erlaubt: 14')
  })

  it('ueber der Frist: ueberfaellig', () => {
    expect(bewerte(eintrag, { iso: new Date(JETZT - 14.5 * TAG).toISOString() }, JETZT).status).toBe('ueberfaellig')
  })

  it('der Glossar-Fall: Lieferung 19.09. ist am 04.10. ueberfaellig — der Hand-Fix vom 23.09. waere es nicht', () => {
    const am0410 = new Date('2026-10-04T15:00:00Z').getTime()
    expect(bewerte(eintrag, { iso: '2026-09-19T10:00:00Z' }, am0410).status).toBe('ueberfaellig')
    expect(bewerte(eintrag, { iso: '2026-09-23T21:07:08Z' }, am0410).status).toBe('ok')
  })

  it('uebersprungen bleibt uebersprungen — es wird kein OK daraus', () => {
    expect(bewerte(eintrag, { uebersprungen: 'Secrets fehlen' }, JETZT).status).toBe('uebersprungen')
  })

  it('leer und unerreichbar sind ueberfaellig, nichtsOffen und erreichbar sind ok', () => {
    expect(bewerte(eintrag, { leer: 'keine Zeile' }, JETZT).status).toBe('ueberfaellig')
    expect(bewerte(eintrag, { unerreichbar: 'HTTP 402' }, JETZT).status).toBe('ueberfaellig')
    expect(bewerte(eintrag, { nichtsOffen: 'nichts wartend' }, JETZT).status).toBe('ok')
    expect(bewerte(eintrag, { erreichbar: '4 Routen' }, JETZT).status).toBe('ok')
  })
})

describe('ops-heartbeat — urteil', () => {
  const ok = (name) => ({ name, status: 'ok', text: 'zuletzt vor 1.0 Tagen' })
  const blind = (name) => ({ name, status: 'uebersprungen', text: 'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen' })
  const still = (name) => ({ name, status: 'ueberfaellig', text: 'zuletzt vor 18.0 Tagen', hinweis: 'Migration anwenden' })

  it('alles geprueft, alles liefert: lebt, exit 0', () => {
    const u = urteil([ok('A'), ok('B')])
    expect(u.zustand).toBe('lebt')
    expect(u.exitCode).toBe(0)
    expect(u.markdown).toContain('✅ Automation lebt')
    expect(u.ausgabe).toContain('still=0')
  })

  it('SKIP ist kein OK: ein nicht geprüfter Bereich macht den Lauf rot und steht eigens im Summary', () => {
    const u = urteil([ok('A'), blind('Wissensindex')])
    expect(u.zustand).toBe('blind')
    expect(u.exitCode).toBe(1)
    expect(u.markdown).not.toContain('Automation lebt')
    expect(u.markdown).toContain('🟡 Wächter blind — 1 Bereich(e) nicht geprüft')
    expect(u.markdown).toContain('**1 liefern · 0 ohne Ergebnis · 1 nicht geprüft** (von 2)')
    expect(u.markdown).toContain('| 🟡 | Wissensindex | NICHT GEPRÜFT —')
    expect(u.markdown).toContain('### Nicht geprüft — kein OK')
    expect(u.ausgabe).toContain('still=1')
    expect(u.ausgabe).toContain('betroffen=Wissensindex (nicht geprüft)')
  })

  it('Gegenprobe: nach der alten Regel (nur ueberfaellig/fehler zaehlt) waere derselbe Lauf gruen gewesen', () => {
    const ergebnisse = [blind('A'), blind('B'), blind('C')]
    const altKaputt = ergebnisse.filter((r) => r.status === 'ueberfaellig' || r.status === 'fehler')
    expect(altKaputt).toHaveLength(0)            // alt: „Automation lebt", exit 0
    expect(urteil(ergebnisse).exitCode).toBe(1)  // neu: blind
    expect(urteil(ergebnisse).ok).toHaveLength(0)
  })

  it('Stillstand geht vor: steht, mit Hinweis — und der blinde Bereich bleibt sichtbar', () => {
    const u = urteil([ok('A'), still('Hofladen-Import'), blind('Wissensindex'), { name: 'X', status: 'fehler', text: 'GitHub API 500' }])
    expect(u.zustand).toBe('steht')
    expect(u.exitCode).toBe(1)
    expect(u.markdown).toContain('🔴 Automation steht')
    expect(u.markdown).toContain('> Migration anwenden')
    expect(u.markdown).toContain('### Nicht geprüft — kein OK')
    expect(u.ausgabe).toContain('still=3')
    expect(u.ausgabe).toContain('betroffen=Hofladen-Import, X, Wissensindex (nicht geprüft)')
  })

  it('die Ausgabe bleibt einzeilig je Schluessel (GITHUB_OUTPUT)', () => {
    const u = urteil([{ name: 'A', status: 'fehler', text: 'Zeile 1\nZeile 2' }])
    expect(u.ausgabe.trimEnd().split('\n')).toHaveLength(3)
  })
})

// ─── 3. Artefakt und Konfiguration ───────────────────────────────────────────

describe('ops-heartbeat — juengstesArtefakt', () => {
  const liste = [
    { name: 'social-drafts', size_in_bytes: 2178, expired: false, created_at: '2026-09-27T09:56:58Z' },
    { name: 'social-drafts', size_in_bytes: 2058, expired: false, created_at: '2026-09-20T09:13:14Z' },
  ]

  it('nimmt das juengste, unabhaengig von der Reihenfolge der Antwort', () => {
    expect(juengstesArtefakt([...liste].reverse(), { artefakt: 'social-drafts', minBytes: 300 })).toEqual({ iso: '2026-09-27T09:56:58Z' })
  })

  it('abgelaufene, zu kleine und fremde Artefakte zaehlen nicht', () => {
    const r = juengstesArtefakt([
      { name: 'social-drafts', size_in_bytes: 2178, expired: true, created_at: '2026-10-04T10:00:00Z' },
      { name: 'social-drafts', size_in_bytes: 120, expired: false, created_at: '2026-10-03T10:00:00Z' },
      { name: 'playwright-report', size_in_bytes: 99999, expired: false, created_at: '2026-10-02T10:00:00Z' },
      ...liste,
    ], { artefakt: 'social-drafts', minBytes: 300 })
    expect(r).toEqual({ iso: '2026-09-27T09:56:58Z' })
  })

  it('gar keines: leer → ueberfaellig', () => {
    const r = juengstesArtefakt([], { artefakt: 'social-drafts', minBytes: 300 })
    expect(r.leer).toContain('social-drafts')
    expect(bewerte({ name: 'Social-Entwürfe', maxTage: 9 }, r, JETZT).status).toBe('ueberfaellig')
    expect(juengstesArtefakt(undefined, { artefakt: 'x' }).leer).toBeTruthy()
  })
})

describe('data/ops-heartbeat.json', () => {
  const eintraege = JSON.parse(readFileSync(new URL('../data/ops-heartbeat.json', import.meta.url), 'utf-8'))
  const nach = (name) => eintraege.find((e) => e.name === name)

  it('jeder Eintrag hat Name, bekannten Typ, Frist und Hinweis', () => {
    for (const e of eintraege) {
      expect(e.name, JSON.stringify(e)).toBeTruthy()
      expect(['git', 'supabase', 'workflow', 'artefakt', 'http'], e.name).toContain(e.typ)
      expect(typeof e.maxTage, e.name).toBe('number')
      expect(e.hinweis?.length ?? 0, e.name).toBeGreaterThan(20)
    }
    expect(new Set(eintraege.map((e) => e.name)).size).toBe(eintraege.length)
  })

  it('Agenten-Bereiche zaehlen nur neu hinzugefuegte Dateien', () => {
    expect(nach('Rezept-Produktion')).toMatchObject({ typ: 'git', pfad: 'content/rezepte', nurNeueDateien: true })
    // Gilt fuer jeden Eintrag, der einen ORDNER beobachtet: dort ist „irgendein
    // Commit" nie eine Lieferung.
    for (const e of eintraege.filter((x) => x.typ === 'git' && !/\.[a-z]+$/.test(x.pfad))) {
      expect(e.nurNeueDateien, e.name).toBe(true)
    }
  })

  // Am 03.10.2026 sind Automationen entfernt worden. Ein Eintrag, der auf etwas
  // zeigt, das es nicht mehr gibt, meldet entweder dauerhaft Stillstand oder —
  // schlimmer — bleibt gruen, weil irgendein Commit den Pfad beruehrt.
  it('kein Eintrag zeigt auf einen Workflow oder Pfad, den es nicht mehr gibt', () => {
    const da = (rel) => existsSync(new URL(`../${rel}`, import.meta.url))
    for (const e of eintraege) {
      if (e.typ === 'workflow') expect(da(`.github/workflows/${e.datei}`), `${e.name}: ${e.datei}`).toBe(true)
      if (e.typ === 'git') expect(da(e.pfad), `${e.name}: ${e.pfad}`).toBe(true)
    }
  })

  it('entfernte Automationen haben keinen Eintrag mehr', () => {
    expect(nach('Ideen-Radar')).toBeUndefined()
  })

  // Der Glossar-Agent ist seit 03.10.2026 pausiert (Vorrat leer). Zeitplan und
  // Waechter-Eintrag gehoeren zusammen: Ein Eintrag ohne Zeitplan meldet ab dem
  // 14. Tag jeden Tag Stillstand, den niemand beheben soll — ein Zeitplan ohne
  // Eintrag laeuft wieder unbemerkt leer (so war es vom 19.09. bis 03.10.2026).
  it('Glossar-Agent: Zeitplan und Waechter-Eintrag gibt es nur gemeinsam', () => {
    const workflow = readFileSync(new URL('../.github/workflows/glossary-grow.yml', import.meta.url), 'utf-8')
    const ohneKommentare = workflow.split('\n').filter((z) => !/^\s*#/.test(z)).join('\n')
    const hatZeitplan = /^\s*schedule:/m.test(ohneKommentare)
    const hatEintrag = eintraege.some((e) => e.pfad === 'content/glossar' || e.datei === 'glossary-grow.yml')
    expect(hatEintrag).toBe(hatZeitplan)
    expect(ohneKommentare).toContain('workflow_dispatch')
  })

  it('Hofladen-Import: juengster letzter_import, 9 Tage', () => {
    expect(nach('Hofladen-Import')).toMatchObject({ typ: 'supabase', tabelle: 'hoefe', spalte: 'letzter_import', maxTage: 9 })
  })

  it('Social-Entwürfe: Artefakt social-drafts, 9 Tage — derselbe Name wie im Workflow', () => {
    expect(nach('Social-Entwürfe')).toMatchObject({ typ: 'artefakt', artefakt: 'social-drafts', maxTage: 9 })
    const workflow = readFileSync(new URL('../.github/workflows/social-grow.yml', import.meta.url), 'utf-8')
    expect(workflow).toContain('name: social-drafts')
  })
})
