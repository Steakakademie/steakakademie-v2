/**
 * Prüfstand — das Arbeitswerkzeug für die Nachprüfung in Tranchen (03.10.2026).
 *
 * Das Skript spiegelt zwei Regeln, die im Seitencode liegen. Dieser Test bindet
 * die Spiegel an ihre Quelle — läuft eine Seite auseinander, wird er rot:
 *   - „gültiges Prüfdatum“  ↔ pruefdatum()          in src/lib/pruefnachweis.ts
 *   - „veröffentlicht“      ↔ nurVeroeffentlicht()  in src/lib/redaktion.ts
 *   - Vorgabewerte          ↔ contentlayer.config.ts
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  AUSGENOMMEN,
  VORGABEN,
  alsText,
  bewertePruefdatum,
  feld,
  frontmatterBlock,
  leseDokumente,
  leseStatus,
  pruefstand,
} from './pruefstand.mjs'
import { istVeroeffentlicht } from './lib/social-auswahl.mjs'
import { pruefdatumIso } from '../src/lib/pruefnachweis.ts'
import { nurVeroeffentlicht } from '../src/lib/redaktion.ts'

const JETZT = new Date('2026-10-03T12:00:00Z')
const WURZEL = process.cwd()

describe('pruefstand — Frontmatter lesen', () => {
  const MDX = [
    '---',
    'title: "Ein Titel: mit Doppelpunkt"',
    'publishedAt: 2026-09-08',
    '# Von Hand gelesen.',
    'status: published',
    'reviewed: true',
    'reviewedAt: "2026-09-09"   # Kommentar dahinter',
    '---',
    '',
    'Fließtext.',
    'status: draft',
    'reviewedAt: 1999-01-01',
  ].join('\n')

  it('liest nur das Frontmatter — ein „status:“ im Fließtext zählt nicht', () => {
    const block = frontmatterBlock(MDX)
    expect(block).not.toContain('Fließtext')
    expect(feld(block, 'status')).toBe('published')
    expect(feld(block, 'reviewedAt')).toBe('2026-09-09')
  });

  it('verwechselt reviewed nicht mit reviewedAt', () => {
    const block = frontmatterBlock('---\nreviewedAt: 2026-09-09\n---\n')
    expect(feld(block, 'reviewed')).toBeNull()
    expect(feld(block, 'reviewedAt')).toBe('2026-09-09')
  })

  it('kommt mit CRLF-Dateien zurecht', () => {
    const s = leseStatus('---\r\nstatus: draft\r\nreviewed: false\r\nreviewedAt: 2026-09-09\r\n---\r\nText\r\n', 'rezepte')
    expect(s).toEqual({ status: 'draft', reviewed: false, publishedAt: undefined, reviewedAt: '2026-09-09' })
  })

  it('fehlende Felder bekommen die Vorgabe der Sammlung', () => {
    const leer = '---\ntitle: x\n---\n'
    expect(leseStatus(leer, 'rezepte')).toMatchObject({ status: 'published', reviewed: true, reviewedAt: null })
    expect(leseStatus(leer, 'eigenregie')).toMatchObject({ status: 'draft', reviewed: false, reviewedAt: null })
  })

  it('eine Datei ohne Frontmatter liefert die Vorgaben statt eines Absturzes', () => {
    expect(leseStatus('Nur Text\nstatus: draft\n', 'rezepte')).toMatchObject({ status: 'published', reviewedAt: null })
  })
})

describe('pruefstand — Vorgabewerte stimmen mit contentlayer.config.ts', () => {
  // Je Dokumenttyp: Ordner aus filePathPattern, Vorgaben aus den Feldern status/reviewed.
  const config = readFileSync(join(WURZEL, 'contentlayer.config.ts'), 'utf8')
  const typen = config.split(/defineDocumentType\(/).slice(1).map((block) => ({
    ordner: /filePathPattern:\s*'([^/']+)\//.exec(block)?.[1],
    status: /^\s*status:\s*\{[^}]*default:\s*'(\w+)'/m.exec(block)?.[1] ?? 'published',
    reviewed: (/^\s*reviewed:\s*\{[^}]*default:\s*(true|false)/m.exec(block)?.[1] ?? 'true') === 'true',
  }))

  it('findet alle Dokumenttypen', () => {
    expect(typen.length).toBeGreaterThanOrEqual(13)
    expect(typen.every((t) => t.ordner)).toBe(true)
  })

  it('jede Sammlung hat im Skript dieselben Vorgaben wie in der Konfiguration', () => {
    for (const t of typen) {
      const imSkript = VORGABEN[t.ordner] ?? { status: 'published', reviewed: true }
      expect(imSkript, t.ordner).toEqual({ status: t.status, reviewed: t.reviewed })
    }
  })

  it('reviewedAt hat in keiner Sammlung einen Vorgabewert', () => {
    expect(config).not.toMatch(/reviewedAt:\s*\{[^}]*default/)
  })
})

describe('pruefstand — die gespiegelten Regeln stimmen mit dem Seitencode', () => {
  const FAELLE = [
    undefined, null, '', '2026-09-03', '2026-09-03T00:00:00.000Z', '2026-10-03', '2026-10-04',
    '03.09.2026', 'kein-datum', '2026-02-31', '2026-13-01', '2026-9-3', 'true',
  ]

  it('gültiges Prüfdatum: Skript und src/lib/pruefnachweis.ts urteilen gleich', () => {
    for (const reviewed of [true, false, undefined]) {
      for (const reviewedAt of FAELLE) {
        const skript = bewertePruefdatum({ reviewedAt, reviewed }, JETZT)
        const seite = pruefdatumIso({ reviewedAt, reviewed }, JETZT)
        expect(skript.gueltig ? skript.datum : null, `${reviewedAt} / reviewed ${reviewed}`).toBe(seite)
      }
    }
  })

  it('nennt bei einem unbrauchbaren Datum den Grund, bei einem fehlenden keinen', () => {
    expect(bewertePruefdatum({ reviewedAt: null }, JETZT)).toEqual({ gueltig: false, grund: null })
    expect(bewertePruefdatum({ reviewedAt: '03.09.2026' }, JETZT).grund).toMatch(/JJJJ-MM-TT/)
    expect(bewertePruefdatum({ reviewedAt: '2026-10-04' }, JETZT).grund).toMatch(/Zukunft/)
    expect(bewertePruefdatum({ reviewedAt: '2026-02-31' }, JETZT).grund).toMatch(/gibt es nicht/)
    expect(bewertePruefdatum({ reviewedAt: '2026-09-03', reviewed: false }, JETZT).grund).toMatch(/reviewed: false/)
  })

  it('veröffentlicht: dieselbe Menge wie nurVeroeffentlicht() aus src/lib/redaktion.ts', () => {
    const docs = []
    for (const status of ['published', 'draft', 'review', undefined]) {
      for (const reviewed of [true, false, undefined]) {
        for (const publishedAt of ['2026-01-01', '2999-01-01', 'kein-datum', undefined]) {
          docs.push({ id: `${status}|${reviewed}|${publishedAt}`, status, reviewed, publishedAt })
        }
      }
    }
    const seite = nurVeroeffentlicht(docs).map((d) => d.id)
    const skript = docs.filter((d) => istVeroeffentlicht(d, new Date())).map((d) => d.id)
    expect(skript).toEqual(seite)
    expect(seite.length).toBeGreaterThan(0)
    expect(seite.length).toBeLessThan(docs.length)
  })
})

describe('pruefstand — zählen', () => {
  const doc = (pfad, sammlung, rest = {}) => ({ pfad, sammlung, status: 'published', reviewed: true, publishedAt: '2026-08-01', reviewedAt: null, ...rest })
  const DOCS = [
    doc('content/rezepte/a.mdx', 'rezepte'),
    doc('content/rezepte/b.mdx', 'rezepte', { reviewedAt: '2026-09-03' }),
    doc('content/rezepte/c.mdx', 'rezepte', { reviewedAt: '03.09.2026' }),
    doc('content/rezepte/entwurf.mdx', 'rezepte', { status: 'draft', reviewed: false }),
    doc('content/rezepte/kuenftig.mdx', 'rezepte', { publishedAt: '2999-01-01', reviewedAt: '2026-09-03' }),
    doc('content/glossar/x.mdx', 'glossar'),
  ]

  it('zählt nur veröffentlichte Dokumente und trennt mit/ohne Prüfdatum', () => {
    const e = pruefstand(DOCS, { jetzt: JETZT })
    const rezepte = e.sammlungen.find((s) => s.name === 'rezepte')
    expect(rezepte).toMatchObject({ gesamt: 5, veroeffentlicht: 3, mitPruefdatum: 1, ohnePruefdatum: 2, ungueltig: 1 })
    expect(rezepte.ohne.map((d) => d.pfad)).toEqual(['content/rezepte/a.mdx', 'content/rezepte/c.mdx'])
    expect(e.summe).toEqual({ gesamt: 6, veroeffentlicht: 4, mitPruefdatum: 1, ohnePruefdatum: 3, ungueltig: 1 })
    expect(e.stand).toBe('2026-10-03')
  })

  it('ein unbrauchbares Datum zählt als „ohne“ und steht mit Grund in der Liste', () => {
    const e = pruefstand(DOCS, { jetzt: JETZT })
    const c = e.sammlungen.find((s) => s.name === 'rezepte').ohne.find((d) => d.pfad.endsWith('c.mdx'))
    expect(c.grund).toMatch(/JJJJ-MM-TT/)
    expect(alsText(e)).toContain('content/rezepte/c.mdx   ← ')
  })

  it('--sammlung beschränkt Tabelle, Liste und Summe', () => {
    const e = pruefstand(DOCS, { jetzt: JETZT, sammlung: 'glossar' })
    expect(e.sammlungen.map((s) => s.name)).toEqual(['glossar'])
    expect(e.summe).toMatchObject({ veroeffentlicht: 1, ohnePruefdatum: 1 })
  })

  it('der Textbericht nennt Zahlen und Liste; --nur-zahlen lässt die Liste weg', () => {
    const e = pruefstand(DOCS, { jetzt: JETZT })
    expect(alsText(e)).toContain('content/glossar/x.mdx')
    expect(alsText(e)).toMatch(/Summe\s+4\s+1\s+3/)
    expect(alsText(e, { liste: false })).not.toContain('content/glossar/x.mdx')
    expect(alsText(e, { liste: false })).toMatch(/Summe\s+4\s+1\s+3/)
  })
})

describe('pruefstand — gegen den echten Bestand', () => {
  it('erfasst jede .mdx unter content/ außer dem Archiv', async () => {
    const dokumente = await leseDokumente()
    const zaehle = (dir) => readdirSync(dir, { withFileTypes: true }).reduce(
      (n, e) => n + (e.isDirectory() ? zaehle(join(dir, e.name)) : e.name.endsWith('.mdx') ? 1 : 0), 0)
    const erwartet = readdirSync(join(WURZEL, 'content'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !AUSGENOMMEN.includes(e.name))
      .reduce((n, e) => n + zaehle(join(WURZEL, 'content', e.name)), 0)
    expect(dokumente.length).toBe(erwartet)
    // Untergrenze gegen einen leer laufenden Scanner — kein Bestandsziel. Stand
    // 09.10.2026 sind es nach der Glossar-Konsolidierung (29 Permutationen
    // weniger) genau 400; die alte Grenze „> 400" war daran kalibriert.
    expect(dokumente.length).toBeGreaterThan(300)
    expect(dokumente.every((d) => !d.pfad.includes('_archiv'))).toBe(true)
  })

  // Contentlayer liest ein Datumsfeld mit new Date() und reicht der Seite danach
  // einen sauberen ISO-Zeitstempel weiter. Ein deutsch getipptes „03.09.2026“
  // käme dort als März an — die Seite zeigte ein falsches Prüfdatum, ohne dass
  // src/lib/pruefnachweis.ts es noch erkennen könnte. Abfangen lässt sich das nur
  // hier, am rohen Frontmatter. Gilt für jedes Dokument, auch für Entwürfe.
  it('jedes reviewedAt im Bestand ist ein gültiges Prüfdatum (JJJJ-MM-TT, nicht in der Zukunft)', async () => {
    const unbrauchbar = (await leseDokumente())
      .filter((d) => d.reviewedAt !== null && d.reviewedAt !== '')
      .map((d) => ({ pfad: d.pfad, urteil: bewertePruefdatum({ reviewedAt: d.reviewedAt }) }))
      .filter(({ urteil }) => !urteil.gueltig)
      .map(({ pfad, urteil }) => `${pfad}: ${urteil.grund}`)
    expect(unbrauchbar).toEqual([])
  })

  it('die Summe geht auf: veröffentlicht = mit + ohne Prüfdatum', async () => {
    const e = pruefstand(await leseDokumente())
    expect(e.summe.veroeffentlicht).toBe(e.summe.mitPruefdatum + e.summe.ohnePruefdatum)
    for (const s of e.sammlungen) {
      expect(s.veroeffentlicht, s.name).toBe(s.mitPruefdatum + s.ohnePruefdatum)
      expect(s.ohne.length, s.name).toBe(s.ohnePruefdatum)
    }
  })
})
