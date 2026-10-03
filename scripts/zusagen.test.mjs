/**
 * Wächter Schritt 1 — Zusagen-Register, Gate, tägliche Belegprüfung (03.10.2026).
 *
 * Was dieser Test zuhält:
 *   1. Die fünf Muster-Klassen treffen, was eine Zusage ist — und lassen Kommentare,
 *      Bezeichner, Pfade, Klassenlisten und Kochanweisungen in Ruhe.
 *   2. Ein Treffer gilt nur als gedeckt, wenn ein Register-Muster ihn ganz enthält.
 *   3. Die Baseline hängt am Satz, nicht an der Zeilennummer.
 *   4. Ein kaputtes Register meldet jeden Fehler mit ID und Anweisung.
 *   5. Belege: gedeckt · gebrochen · abgelaufen · nicht prüfbar — und „nicht prüfbar"
 *      ist nie grün.
 *
 * Kein Netz: `fetchFn` ist überall ein Nachbau.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import {
  KLASSEN, STATUS, ABTEILUNGEN, leseRegister, ladeRegister, pruefeSchema, belegOffline, belegOnline, menschBeleg,
  findeZusagen, fundstellen, istGedeckt, schluessel, baueBaseline, istSuchdatei, seitenText, zahlSchreibweisen, zaehleQuelle,
} from './lib/zusagen.mjs'
import { sichtbarerText, normalisiere } from './lib/zusagen-text.mjs'
import { pruefe } from './check-zusagen.mjs'
import { pruefeBelege, alsHeartbeat, fuerHeartbeat } from './zusagen-belege.mjs'
import { urteil, zusagenBelege } from './ops-heartbeat.mjs'

const JETZT = Date.parse('2026-10-03T12:00:00Z')

/** Treffer in einem Stück Quelltext: [{ klasse, treffer, satz }]. */
function treffer (quelle, datei = 'src/app/x/page.tsx') {
  const sicht = sichtbarerText(datei, quelle)
  return findeZusagen(datei, sicht, normalisiere(sicht.text))
}
const klassen = (quelle, datei) => treffer(quelle, datei).map((t) => t.klasse)
const jsx = (inhalt) => `export default function S() {\n  return (<p>${inhalt}</p>)\n}\n`

// ─── 1. Muster-Klassen ───────────────────────────────────────────────────────

describe('Zusage-Muster — Zeit und Frequenz', () => {
  it.each([
    ['Jeden Freitag ein Stück BBQ-Wissen.'],
    ['Datenquelle: OpenStreetMap, wöchentlich aktualisiert.'],
    ['Wechselt automatisch alle 2 Wochen.'],
    ['Jede Woche neu.'],
    ['Wir melden uns innerhalb von 24–48 Stunden bei dir.'],
    ['Montags im Postfach.'],
  ])('trifft: %s', (satz) => {
    expect(klassen(jsx(satz))).toContain('rhythmus')
  })

  it('trifft über ein Inline-Tag und einen Zeilenumbruch hinweg', () => {
    expect(klassen(jsx('Jeden <strong>Freitag</strong>\n      ein Stück Wissen.'))).toContain('rhythmus')
    expect(klassen(jsx('Wir schreiben\n      jeden\n      Montag.'))).toContain('rhythmus')
  })

  it('trifft nicht: Kommentar, Bezeichner, Vergleichswert, Klassenliste, Import', () => {
    const quelle = `import woechentlich from './jeden-freitag'
// jeden Freitag ein Newsletter — nur ein Kommentar
/* wöchentlich aktualisiert */
type Takt = 'täglich' | 'wöchentlich'
const taeglichWenden = (t: Takt) => t === 'monatlich'
export default function S() {
  {/* jeden Montag */}
  return <p className="jeden-freitag text-ink/60">Hallo</p>
}
`
    expect(treffer(quelle)).toEqual([])
  })

  it('„innerhalb von Minuten" ohne Zahl ist keine Frist', () => {
    expect(klassen(jsx('Der Zucker verbrennt innerhalb von Minuten.'))).toEqual([])
  })

  it('in content/ ist die Klasse aus — „täglich wenden" ist eine Kochanweisung', () => {
    const mdx = '---\ntitle: "Dry Aging"\n---\n\nDas Fleisch täglich wenden und alle 45 Minuten nachjustieren. Jeden Freitag frisch.\n'
    expect(klassen(mdx, 'content/rezepte/dry-aging.mdx')).toEqual([])
    expect(klassen(mdx, 'content/artikel/dry-aging.mdx')).toEqual([])
    // … im Seitenquelltext trifft derselbe Satz
    expect(klassen(jsx('Jeden Freitag frisch.'))).toEqual(['rhythmus'])
  })
})

describe('Zusage-Muster — Versand', () => {
  it.each([
    ['Wir schicken dir den Spickzettel.'],
    ['Danach senden wir dir die Rechnung.'],
    ['Du bekommst das Ergebnis per E-Mail.'],
    ['Die Urkunde kommt per Post.'],
    ['Die Diagnose landet in deinem Postfach.'],
    ['Den Plan bekommst du als PDF zugeschickt.'],
    ['Du erhältst eine Willkommens-E-Mail von uns.'],
    ['Wir melden uns, sobald es losgeht.'],
  ])('trifft: %s', (satz) => {
    expect(klassen(jsx(satz))).toContain('versand')
  })

  it('trifft nicht: der Besucher schreibt UNS („per E-Mail an …")', () => {
    expect(klassen(jsx('Widerruf per E-Mail an pitmaster@steakakademie.de.'))).toEqual([])
    expect(klassen(jsx('Bitte schick ihn per E-Mail an {ADRESSE}.'))).toEqual([])
  })

  it('auch in content/ aktiv', () => {
    expect(klassen('Den Code schicken wir dir per E-Mail.\n', 'content/rezepte/x.mdx')).toContain('versand')
  })
})

describe('Zusage-Muster — Test und Prüfung', () => {
  it.each([
    ['Selbst getestet, methodisch bewertet.'],
    ['Unsere Testsieger'],
    ['10 Level, strukturiertes Wissen, zertifiziert.'],
    ['Alle Inhalte werden fachlich geprüft.'],
    ['Siegel: Pitmaster-geprüft'],
    ['Alle getesteten Produkte wurden selbst gekauft.'],
  ])('trifft: %s', (satz) => {
    expect(klassen(jsx(satz))).toContain('pruefung')
  })

  it('trifft auch, wenn der Umlaut als Entity im Quelltext steht', () => {
    expect(klassen(jsx('Fachlich gepr&uuml;ft von der Redaktion.'))).toEqual(['pruefung'])
  })

  it('trifft nicht: Verneinung, Bezeichner, Pfad', () => {
    expect(klassen(jsx('Das ist ungeprüft und ungetestet.'))).toEqual([])
    expect(klassen('const istGetestet = true\nexport const x = istGetestet\n')).toEqual([])
    expect(klassen('export default () => <a href="/vergleich/thermometer-getestet">Zum Vergleich</a>\n')).toEqual([])
    expect(klassen('![Bild](/images/thermometer-getestet.webp)\n\nEin [Link](/vergleich/selbst-getestet) im Text.\n', 'content/artikel/x.mdx')).toEqual([])
  })

  it('YAML-Kommentar im Frontmatter ist kein Seitentext', () => {
    const mdx = '---\ntitle: "Stall"\n# gegen data/kerntemperatur-referenz.yaml geprüft\n---\n\nText.\n'
    expect(klassen(mdx, 'content/artikel/stall.mdx')).toEqual([])
  })
})

describe('Zusage-Muster — Bestandszahl', () => {
  it.each([
    ['Über 128 Rezepte vom Grill.', '128 Rezepte'],
    ['Mehr als 6.000 Höfe in deiner Nähe.', '6.000 Höfe'],
    ['39 fertige Lektionen in fünf Stufen.', '39 fertige Lektionen'],
    ['Grillmeister-Diplom: 10 Level', '10 Level'],
    ['Steak-Rettung: 6 Grillfehler', '6 Grillfehler'],
  ])('trifft: %s', (satz, erwartet) => {
    const t = treffer(jsx(satz)).filter((x) => x.klasse === 'bestandszahl')
    expect(t.map((x) => x.treffer)).toEqual([erwartet])
  })

  it('eine berechnete Zahl ist nicht getippt und trifft nicht', () => {
    expect(klassen(jsx('{rezepte.length} Rezepte und {n} Lektionen'))).toEqual([])
    expect(klassen('export const t = `${anzahl} Rezepte`\n')).toEqual([])
  })

  it('zwei Menüpunkte sind keine Zahl mit Beiwort', () => {
    const quelle = "export const NAV = ['Steak-Rettung: 6 Grillfehler', 'Alle Artikel', 'Messer']\n"
    expect(treffer(quelle).map((t) => t.treffer)).toEqual(['6 Grillfehler'])
  })

  it('ein großgeschriebenes Wort dazwischen ist kein Beiwort — Groß/Klein zählt', () => {
    expect(klassen(jsx('Dein Name · 2026 Hat Level 1 erreicht'))).toEqual([])
    expect(klassen(jsx('Umkreis 1 Nur Höfe mit Fleischangebot'))).toEqual([])
    expect(klassen(jsx('höchstens 500 zutaten.'))).toEqual([])
  })

  it('Teil einer größeren Zahl, Preis und Maß treffen nicht', () => {
    expect(klassen(jsx('Analyse von 56.498 Datensätzen, 2.000 Pixel breit, für 5.000 Euro.'))).toEqual([])
  })

  it('in content/ erst ab 10 — „in 2 Stufen garen" ist ein Arbeitsschritt', () => {
    expect(klassen('Das Fleisch in 2 Stufen garen, dazu 3 Rezepte.\n', 'content/rezepte/x.mdx')).toEqual([])
    expect(klassen('Die Sammlung umfasst 128 Rezepte.\n', 'content/artikel/x.mdx')).toEqual(['bestandszahl'])
  })
})

describe('Zusage-Muster — Garantie', () => {
  it.each([['30 Tage Geld-zurück-Garantie'], ['Geld zurück, wenn es nicht passt.'], ['Mit Zufriedenheitsgarantie.']])('trifft: %s', (satz) => {
    expect(klassen(jsx(satz))).toContain('garantie')
  })
  it('trifft nicht: „keine Garantie"', () => {
    expect(klassen(jsx('Drei Stunden sind ein Richtwert, keine Garantie.'))).toEqual([])
  })
})

describe('Welche Dateien das Gate liest', () => {
  it.each([
    ['src/app/page.tsx', true], ['src/components/layout/Footer.tsx', true], ['content/rezepte/x.mdx', true],
    ['src/app/api/kontakt/route.ts', true],
    ['content/_archiv/alt.mdx', false], ['src/__tests__/x.test.ts', false], ['src/components/x.test.tsx', false],
    ['src/app/admin/page.tsx', false], ['src/lib/doi.ts', false], ['scripts/x.mjs', false], ['src/types/x.d.ts', false],
  ])('%s → %s', (datei, erwartet) => {
    expect(istSuchdatei(datei)).toBe(erwartet)
  })
})

// ─── 2. Deckung durch das Register ───────────────────────────────────────────

describe('Deckung — ein Muster muss den Treffer ganz enthalten', () => {
  const quelle = jsx('Zu jedem Cut gehört eine Temperatur. Wir schicken dir den Link zum Spickzettel.')
  const sicht = sichtbarerText('src/app/cuts/page.tsx', quelle)
  const normal = normalisiere(sicht.text)
  const [fund] = findeZusagen('src/app/cuts/page.tsx', sicht, normal)

  it('gedeckt, wenn das Muster die Zusage-Worte enthält', () => {
    expect(istGedeckt(fund, fundstellen(normal.norm, 'Wir schicken dir den Link zum Spickzettel.'))).toBe(true)
  })
  it('nicht gedeckt, wenn das Muster nur den Nachbarsatz trifft', () => {
    expect(istGedeckt(fund, fundstellen(normal.norm, 'Zu jedem Cut gehört eine Temperatur.'))).toBe(false)
  })
  it('nicht gedeckt, wenn das Muster mitten in der Zusage endet', () => {
    expect(istGedeckt(fund, fundstellen(normal.norm, 'schicken dir den Link'))).toBe(false)
  })
  it('Leerraum im Muster ist egal, der Wortlaut nicht', () => {
    expect(fundstellen(normal.norm, 'Wir  schicken dir\n den Link')).toHaveLength(1)
    expect(fundstellen(normal.norm, 'Wir schicken Dir den Link')).toHaveLength(0)
  })
})

// ─── 3. + 4. Gate am Wegwerf-Verzeichnis ─────────────────────────────────────

const EINTRAG = `  - id: spickzettel-per-mail
    zusage: Nach der Bestätigung kommt der Spickzettel-Link per Mail.
    wo:
      - datei: src/app/cuts/page.tsx
        muster: "Wir schicken dir den Link zum Spickzettel."
    beleg:
      typ: code
      datei: src/lib/doi.ts
      regex: "TOKEN_MAX_AGE_MS"
    bei_bruch: Den Satz herausnehmen, bis die Strecke wieder sendet.
    abteilung: Wachstum
    seit: "2026-10-03"
`

describe('Gate — Register, Baseline, neue Treffer', () => {
  let root
  const schreibe = (datei, inhalt) => { mkdirSync(dirname(join(root, datei)), { recursive: true }); writeFileSync(join(root, datei), inhalt) }
  const baseline = () => schreibe('data/zusagen-baseline.json', JSON.stringify(baueBaseline(pruefe({ root, jetzt: JETZT }).offen)))

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'zusagen-'))
    schreibe('src/lib/doi.ts', 'export const TOKEN_MAX_AGE_MS = 1\n')
    schreibe('src/app/cuts/page.tsx', jsx('Wir schicken dir den Link zum Spickzettel.'))
    schreibe('src/app/news/page.tsx', jsx('Jeden Freitag ein Stück BBQ-Wissen.'))
    schreibe('data/zusagen.yaml', `zusagen:\n${EINTRAG}`)
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('ein Treffer ohne Eintrag und ohne Baseline ist NEU — mit Datei, Zeile, Klasse', () => {
    const e = pruefe({ root, jetzt: JETZT })
    expect(e.fehler).toEqual([])
    expect(e.gedeckt.map((f) => f.datei)).toEqual(['src/app/cuts/page.tsx'])
    expect(e.neu).toHaveLength(1)
    expect(e.neu[0]).toMatchObject({ datei: 'src/app/news/page.tsx', zeile: 2, klasse: 'rhythmus', treffer: 'Jeden Freitag' })
  })

  it('steht der Treffer in der Baseline, blockiert er nicht', () => {
    baseline()
    const e = pruefe({ root, jetzt: JETZT })
    expect(e.neu).toEqual([])
    expect(e.bekannt).toHaveLength(1)
  })

  it('die Baseline hängt am Satz: Zeilen darüber einfügen macht nichts neu', () => {
    baseline()
    schreibe('src/app/news/page.tsx', `// neu\n// neu\nconst x = 1\n${jsx('Jeden Freitag ein Stück BBQ-Wissen.')}`)
    const e = pruefe({ root, jetzt: JETZT })
    expect(e.neu).toEqual([])
    expect(e.bekannt[0].zeile).toBe(5)
  })

  it('ein Nachbarsatz darf sich ändern, die Zusage selbst nicht', () => {
    schreibe('src/app/news/page.tsx', jsx('Hallo. Jeden Freitag ein Stück BBQ-Wissen.'))
    baseline()
    schreibe('src/app/news/page.tsx', jsx('Guten Tag zusammen. Jeden Freitag ein Stück BBQ-Wissen.'))
    expect(pruefe({ root, jetzt: JETZT }).neu).toEqual([])
    schreibe('src/app/news/page.tsx', jsx('Hallo. Jeden Freitag und jeden Montag ein Stück BBQ-Wissen.'))
    expect(pruefe({ root, jetzt: JETZT }).neu).toHaveLength(1)
  })

  it('ein neuer Satz neben einem Baseline-Satz ist trotzdem neu', () => {
    baseline()
    schreibe('src/app/shop/page.tsx', jsx('Mit Geld-zurück-Garantie.'))
    const e = pruefe({ root, jetzt: JETZT })
    expect(e.neu.map((f) => f.klasse)).toEqual(['garantie'])
  })

  it('wird ein Baseline-Satz ins Register aufgenommen, gilt er als erledigt', () => {
    baseline()
    schreibe('data/zusagen.yaml', `zusagen:\n${EINTRAG}${EINTRAG.replace('spickzettel-per-mail', 'freitags-brief').replace('src/app/cuts/page.tsx', 'src/app/news/page.tsx').replace('Wir schicken dir den Link zum Spickzettel.', 'Jeden Freitag ein Stück BBQ-Wissen.')}`)
    const e = pruefe({ root, jetzt: JETZT })
    expect(e.fehler).toEqual([])
    expect(e.neu).toEqual([])
    expect(e.bekannt).toEqual([])
    expect(e.behoben).toHaveLength(1)
  })

  it('keine_zusage nimmt einen Fehltreffer heraus — nur mit Grund', () => {
    schreibe('data/zusagen.yaml', `zusagen:\n${EINTRAG}keine_zusage:\n  - datei: src/app/news/page.tsx\n    muster: "Jeden Freitag ein Stück BBQ-Wissen."\n    grund: Zitat aus einem Fremdtext, keine eigene Zusage.\n`)
    expect(pruefe({ root, jetzt: JETZT }).neu).toEqual([])
    schreibe('data/zusagen.yaml', `zusagen:\n${EINTRAG}keine_zusage:\n  - datei: src/app/news/page.tsx\n    muster: "Jeden Freitag ein Stück BBQ-Wissen."\n`)
    expect(pruefe({ root, jetzt: JETZT }).fehler.map((f) => f.text).join()).toContain('„grund" fehlt')
  })

  it('Fundstelle weg: Datei fehlt oder Satz geändert → Fehler mit ID und Anweisung', () => {
    schreibe('src/app/cuts/page.tsx', jsx('Wir schicken dir den Link zur Druckseite.'))
    const e = pruefe({ root, jetzt: JETZT })
    expect(e.fehler).toHaveLength(1)
    expect(e.fehler[0]).toMatchObject({ id: 'spickzettel-per-mail', datei: 'src/app/cuts/page.tsx' })
    expect(e.fehler[0].text).toContain('„muster" nachziehen')
    // … und der geänderte Satz ist jetzt eine Zusage ohne Beleg
    expect(e.neu.map((f) => f.datei)).toContain('src/app/cuts/page.tsx')

    rmSync(join(root, 'src/app/cuts/page.tsx'))
    expect(pruefe({ root, jetzt: JETZT }).fehler[0].text).toContain('gibt es nicht (mehr)')
  })

  it('ein gebrochener Offline-Beleg blockiert — und nennt, was zu tun ist', () => {
    schreibe('src/lib/doi.ts', 'export const ANDERS = 1\n')
    const e = pruefe({ root, jetzt: JETZT })
    expect(e.fehler).toHaveLength(1)
    expect(e.fehler[0].text).toContain('Beleg (code) hält nicht')
    expect(e.fehler[0].text).toContain('Den Satz herausnehmen')
  })

  it('abgelaufene Handbestätigung: im Gate ein Hinweis, auf Wunsch ein Fehler', () => {
    schreibe('data/zusagen.yaml', `zusagen:\n${EINTRAG.replace(/typ: code\n\s+datei: src\/lib\/doi\.ts\n\s+regex: "TOKEN_MAX_AGE_MS"/, 'typ: mensch\n      was: "Variable im Hosting gesetzt"\n      geprueft_am: "2026-06-01"\n      gueltig_tage: 90')}`)
    const e = pruefe({ root, jetzt: JETZT })
    expect(e.fehler).toEqual([])
    expect(e.warnungen[0].text).toContain('abgelaufen')
    expect(pruefe({ root, jetzt: JETZT, ablaufBlockiert: true }).fehler[0].text).toContain('abgelaufen')
  })

  it('kaputtes YAML und fehlendes Register sind Fehler, kein Absturz', () => {
    schreibe('data/zusagen.yaml', 'zusagen:\n  - id: [unfertig\n')
    expect(pruefe({ root }).fehler[0].text).toContain('kein gültiges YAML')
    rmSync(join(root, 'data/zusagen.yaml'))
    expect(pruefe({ root }).fehler[0].text).toContain('fehlt')
  })

  it('die Baseline ist deterministisch: gleiche Quelle, byte-gleiche Datei', () => {
    schreibe('src/app/a/page.tsx', jsx('Selbst getestet. Wir schicken dir alles per Post.'))
    const a = JSON.stringify(baueBaseline(pruefe({ root, jetzt: JETZT }).offen))
    const b = JSON.stringify(baueBaseline([...pruefe({ root, jetzt: JETZT + 86_400_000 }).offen].reverse()))
    expect(a).toBe(b)
    expect(a).not.toMatch(/"stand"|2026-/)
    expect(JSON.parse(a).treffer.map((t) => t.datei)).toEqual(['src/app/a/page.tsx', 'src/app/a/page.tsx', 'src/app/news/page.tsx'])
  })

  it('der Schlüssel kennt keine Zeile, keine Großschreibung, keine Satzzeichen', () => {
    expect(schluessel('versand', 'a.tsx', 'Wir schicken dir den Link.')).toBe(schluessel('versand', 'a.tsx', 'wir schicken dir — den Link'))
    expect(schluessel('versand', 'a.tsx', 'Wir schicken dir den Link.')).not.toBe(schluessel('versand', 'b.tsx', 'Wir schicken dir den Link.'))
    expect(schluessel('versand', 'a.tsx', 'x')).not.toBe(schluessel('rhythmus', 'a.tsx', 'x'))
  })
})

describe('Register — Form', () => {
  const gut = () => leseRegister(`zusagen:\n${EINTRAG}`)
  const mit = (aendern) => { const r = gut(); aendern(r.zusagen[0], r); return pruefeSchema(r).map((f) => f.text).join(' | ') }

  it('ein vollständiger Eintrag hat keine Fehler', () => {
    expect(pruefeSchema(gut())).toEqual([])
  })
  it('Datum bleibt Text — unabhängig von der Zeitzone', () => {
    expect(leseRegister('zusagen:\n  - seit: 2026-10-03\n').zusagen[0].seit).toBe('2026-10-03')
  })
  it.each([
    ['id fehlt', (e) => { delete e.id }, 'kebab-case'],
    ['id nicht kebab-case', (e) => { e.id = 'Spickzettel_Mail' }, 'kebab-case'],
    ['doppelte id', (e, r) => { r.zusagen.push({ ...e }) }, 'doppelt'],
    ['zusage fehlt', (e) => { delete e.zusage }, '„zusage" fehlt'],
    ['wo fehlt', (e) => { delete e.wo }, '„wo" fehlt'],
    ['wo ohne muster', (e) => { e.wo = [{ datei: 'a.tsx' }] }, 'ohne „muster"'],
    ['beleg fehlt', (e) => { delete e.beleg }, '„beleg" fehlt'],
    ['unbekannter Typ', (e) => { e.beleg = { typ: 'gefuehl' } }, 'ist unbekannt'],
    ['kaputte Regex', (e) => { e.beleg.regex = '(' }, 'ist ungültig'],
    ['bei_bruch fehlt', (e) => { delete e.bei_bruch }, '„bei_bruch" fehlt'],
    ['sechste Abteilung', (e) => { e.abteilung = 'Vertrieb' }, 'keine der fünf'],
    ['seit kein Datum', (e) => { e.seit = 'Oktober' }, '„seit" fehlt'],
    ['http ohne https', (e) => { e.beleg = { typ: 'http', url: 'http://steakakademie.de' } }, 'https://'],
    ['loops ohne art', (e) => { e.beleg = { typ: 'loops', id: 'cmt1wxrmn07uo0j0aofqglkmv' } }, 'workflow oder transactional'],
    ['supabase ohne Erwartung', (e) => { e.beleg = { typ: 'supabase', tabelle: 'hoefe' } }, 'braucht eine Erwartung'],
    ['supabase-Tabelle mit Sonderzeichen', (e) => { e.beleg = { typ: 'supabase', tabelle: 'hoefe?select=*', min_zeilen: 1 } }, '„tabelle"'],
    ['mensch ohne Frist', (e) => { e.beleg = { typ: 'mensch', was: 'Variable im Hosting gesetzt', geprueft_am: '2026-10-03' } }, 'gueltig_tage'],
    ['mensch ohne Datum', (e) => { e.beleg = { typ: 'mensch', was: 'Variable im Hosting gesetzt', gueltig_tage: 90 } }, 'geprueft_am'],
    ['zaehlung ohne Quelle', (e) => { e.beleg = { typ: 'zaehlung', zahl: 5 } }, 'braucht „quelle"'],
  ])('%s', (_name, aendern, erwartet) => {
    expect(mit(aendern)).toContain(erwartet)
  })

  it('zaehlung: die Zahl im Register muss die Zahl im Text sein', () => {
    const fehler = (muster, beleg) => mit((e) => { e.wo = [{ datei: 'a.tsx', muster }]; e.beleg = { typ: 'zaehlung', quelle: { glob: 'content/*.mdx' }, ...beleg } })
    expect(fehler('39 Lektionen', { zahl: 39 })).toBe('')
    expect(fehler('35 Lektionen', { zahl: 39 })).toContain('steht nicht im muster')
    expect(fehler('139 Lektionen', { zahl: 39 })).toContain('steht nicht im muster')
    expect(fehler('über 6.000 Höfe', { zahl: 6000 })).toBe('')
    expect(fehler('Sechs Module', { zahl: 6 })).toContain('steht nicht im muster')
    expect(fehler('Sechs Module', { zahl: 6, im_text: ['6', 'Sechs'] })).toBe('')
    expect(zahlSchreibweisen(6000)).toEqual(['6000', '6.000'])
  })

  it('das echte Register ist in Form, jede Abteilung ist eine der fünf', () => {
    const r = ladeRegister()
    expect(pruefeSchema(r)).toEqual([])
    expect(r.zusagen.length).toBeGreaterThanOrEqual(40)
    for (const e of r.zusagen) expect(ABTEILUNGEN).toContain(e.abteilung)
  })
})

// ─── 5. Belege ───────────────────────────────────────────────────────────────

describe('Belege ohne Netz', () => {
  let root
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'belege-'))
    mkdirSync(join(root, 'content/lektionen'), { recursive: true })
    writeFileSync(join(root, 'stufen.ts'), "export const ERSTE_BEZAHLSTUFE = 2\nconst STEPS = ['a', 'b', 'c'] as const\n")
    writeFileSync(join(root, 'content/lektionen/01.mdx'), '---\nstatus: published\nlevel: 1\n---\nText\n')
    writeFileSync(join(root, 'content/lektionen/02.mdx'), '---\nstatus: published\nlevel: 2\n---\nText\n')
    writeFileSync(join(root, 'content/lektionen/03.mdx'), '---\nstatus: draft\nlevel: 1\n---\nText\n')
    writeFileSync(join(root, 'quellen.tsv'), 'a\t10.1000/abc\tx\nb\t10.1000/abc\ty\nc\t10.1000/def\tz\n')
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('code: Datei da und Regex trifft → gedeckt; sonst gebrochen', () => {
    expect(belegOffline({ typ: 'code', datei: 'stufen.ts', regex: 'ERSTE_BEZAHLSTUFE = 2' }, { root }).status).toBe(STATUS.gedeckt)
    expect(belegOffline({ typ: 'code', datei: 'stufen.ts' }, { root }).status).toBe(STATUS.gedeckt)
    expect(belegOffline({ typ: 'code', datei: 'stufen.ts', regex: 'ERSTE_BEZAHLSTUFE = 3' }, { root })).toMatchObject({ status: STATUS.gebrochen })
    expect(belegOffline({ typ: 'code', datei: 'weg.ts' }, { root }).text).toContain('fehlt')
    expect(belegOffline({ typ: 'code', alle: [{ datei: 'stufen.ts' }, { datei: 'weg.ts' }] }, { root }).status).toBe(STATUS.gebrochen)
  })

  it('zaehlung: Glob, Frontmatter-Filter, Regex, eindeutige Treffer', () => {
    expect(zaehleQuelle({ glob: 'content/lektionen/*.mdx' }, root)).toBe(3)
    expect(zaehleQuelle({ glob: 'content/lektionen/*.mdx', frontmatter: { status: 'published' } }, root)).toBe(2)
    expect(zaehleQuelle({ glob: 'content/lektionen/*.mdx', frontmatter: { status: 'published', level: 1 } }, root)).toBe(1)
    expect(zaehleQuelle({ datei: 'stufen.ts', regex: "(?<=^const STEPS = \\[[^\\]]*)'[a-z]+'" }, root)).toBe(3)
    expect(zaehleQuelle({ datei: 'quellen.tsv', regex: '\\t(10\\.\\d+/[^\\t]+)\\t' }, root)).toBe(3)
    expect(zaehleQuelle({ datei: 'quellen.tsv', regex: '\\t(10\\.\\d+/[^\\t]+)\\t', eindeutig: true }, root)).toBe(2)
  })

  it('zaehlung: Text und Quelle müssen übereinstimmen — der Fall „7 Lektionen" bei 11', () => {
    const quelle = { glob: 'content/lektionen/*.mdx' }
    expect(belegOffline({ typ: 'zaehlung', zahl: 3, quelle }, { root }).status).toBe(STATUS.gedeckt)
    const r = belegOffline({ typ: 'zaehlung', zahl: 7, quelle }, { root })
    expect(r.status).toBe(STATUS.gebrochen)
    expect(r.text).toContain('Text nennt genau 7, die Quelle zählt 3')
    expect(belegOffline({ typ: 'zaehlung', zahl: 2, vergleich: 'mindestens', quelle }, { root }).status).toBe(STATUS.gedeckt)
    expect(belegOffline({ typ: 'zaehlung', zahl: 4, vergleich: 'mindestens', quelle }, { root }).status).toBe(STATUS.gebrochen)
    expect(belegOffline({ typ: 'zaehlung', zahl: 3, quelle: { datei: 'weg.ts', regex: 'x' } }, { root }).status).toBe(STATUS.gebrochen)
  })

  it('mensch: gilt bis zum Ablauf, danach abgelaufen', () => {
    const b = { typ: 'mensch', was: 'Variable im Hosting gesetzt', geprueft_am: '2026-10-03', gueltig_tage: 90 }
    expect(menschBeleg(b, JETZT)).toMatchObject({ status: STATUS.gedeckt, rest: 89 })
    expect(menschBeleg(b, JETZT + 89 * 86_400_000).status).toBe(STATUS.gedeckt)
    const spaeter = menschBeleg(b, JETZT + 91 * 86_400_000)
    expect(spaeter.status).toBe(STATUS.abgelaufen)
    expect(spaeter.text).toContain('neu nachsehen')
    expect(menschBeleg({ ...b, geprueft_am: '2027-01-01' }, JETZT).status).toBe(STATUS.gebrochen)
  })
})

/** Nachbau von fetch: Liste aus [Muster, Antwort]; zählt Aufrufe. */
function netz (regeln) {
  const aufrufe = []
  const fetchFn = async (url, init) => {
    aufrufe.push({ url: String(url), init })
    for (const [muster, antwort] of regeln) {
      if (!String(url).includes(muster)) continue
      const a = typeof antwort === 'function' ? antwort(aufrufe.length) : antwort
      if (a instanceof Error) throw a
      const kopf = new Map(Object.entries(a.kopf ?? {}))
      return { status: a.status ?? 200, ok: (a.status ?? 200) < 400, headers: { get: (k) => kopf.get(k.toLowerCase()) ?? null }, text: async () => a.text ?? '', json: async () => a.json }
    }
    throw new Error(`kein Nachbau für ${url}`)
  }
  return { fetchFn, aufrufe }
}
const online = (beleg, regeln, env = {}) => belegOnline(beleg, { ...netz(regeln), env, jetzt: JETZT, pauseMs: 0, cache: {} })

describe('Belege mit Netz — http', () => {
  const seite = '<html><body><h1>Spickzettel</h1><p>11<!-- --> Lektionen &amp; <b>Spickzettel</b> drucken</p><script>var geheim = "nur im Skript"</script></body></html>'
  const url = 'https://steakakademie.de/kerntemperatur-spickzettel'

  it('200 und Text vorhanden → gedeckt', async () => {
    expect((await online({ typ: 'http', url, enthaelt: ['Spickzettel drucken', '11 Lektionen &'] }, [[url, { text: seite }]])).status).toBe(STATUS.gedeckt)
  })
  it('seitenText: React-Kommentare, Tags und Skripte fallen heraus', () => {
    expect(seitenText(seite)).toContain('11 Lektionen & Spickzettel drucken')
    expect(seitenText(seite)).not.toContain('nur im Skript')
  })
  it('Text fehlt, verbotener Text da, falscher Status → gebrochen', async () => {
    expect((await online({ typ: 'http', url, enthaelt: ['Jeden Freitag'] }, [[url, { text: seite }]])).text).toContain('zeigt „Jeden Freitag" nicht mehr')
    expect((await online({ typ: 'http', url, enthaelt_nicht: ['Spickzettel drucken'] }, [[url, { text: seite }]])).status).toBe(STATUS.gebrochen)
    const r = await online({ typ: 'http', url }, [[url, { status: 402, kopf: { 'x-vercel-error': 'DEPLOYMENT_DISABLED' } }]])
    expect(r).toMatchObject({ status: STATUS.gebrochen })
    expect(r.text).toContain('402 (DEPLOYMENT_DISABLED)')
  })
  it('Zugangstor: 307 auf die Anmeldung', async () => {
    const tor = { typ: 'http', url: 'https://steakakademie.de/meine-kurse', status: 307, location_enthaelt: '/auth/login' }
    expect((await online(tor, [['/meine-kurse', { status: 307, kopf: { location: 'https://steakakademie.de/auth/login?redirectTo=%2Fmeine-kurse' } }]])).status).toBe(STATUS.gedeckt)
    expect((await online(tor, [['/meine-kurse', { status: 200, text: 'offen' }]])).status).toBe(STATUS.gebrochen)
    expect((await online(tor, [['/meine-kurse', { status: 307, kopf: { location: 'https://steakakademie.de/' } }]])).text).toContain('leitet auf')
  })
  it('erst 503, dann 200: zweiter Anlauf vor dem Urteil', async () => {
    const n = netz([[url, (nr) => (nr === 1 ? { status: 503 } : { text: seite })]])
    expect((await belegOnline({ typ: 'http', url }, { ...n, pauseMs: 0 })).status).toBe(STATUS.gedeckt)
    expect(n.aufrufe).toHaveLength(2)
  })
  it('keine Antwort → gebrochen, nur lesend', async () => {
    const n = netz([[url, new Error('ECONNRESET')]])
    const r = await belegOnline({ typ: 'http', url }, { ...n, pauseMs: 0 })
    expect(r.status).toBe(STATUS.gebrochen)
    expect(n.aufrufe.every((a) => (a.init.method ?? 'GET') === 'GET')).toBe(true)
  })
})

describe('Belege mit Netz — loops', () => {
  const env = { LOOPS_API_KEY: 'test-key' }
  const workflow = { typ: 'loops', art: 'workflow', id: 'cmt1wxrmn07uo0j0aofqglkmv', betreff: 'Spickzettel' }
  const antwort = (status, subject = 'Dein Spickzettel: alle Kerntemperaturen') => ({ json: { id: workflow.id, name: 'Willkommenssequenz', status, nodes: { n1: { typeName: 'SignupTrigger' }, n4: { typeName: 'SendEmailAction', subject } } } })

  it('ohne Schlüssel: nicht prüfbar — nie gedeckt', async () => {
    const r = await online(workflow, [], {})
    expect(r).toMatchObject({ status: STATUS.blind, grund: 'LOOPS_API_KEY fehlt' })
  })
  it('Workflow sendet und hat die Mail → gedeckt', async () => {
    const n = netz([['/workflows/', antwort('Sending')]])
    const r = await belegOnline(workflow, { ...n, env, pauseMs: 0, cache: {} })
    expect(r.status).toBe(STATUS.gedeckt)
    expect(n.aufrufe[0].url).toBe('https://app.loops.so/api/v1/workflows/cmt1wxrmn07uo0j0aofqglkmv')
    expect(n.aufrufe[0].init.headers.Authorization).toBe('Bearer test-key')
  })
  it.each([['Draft'], ['Paused'], ['PausedAndQueueing']])('Workflow steht auf %s → gebrochen', async (status) => {
    const r = await online(workflow, [['/workflows/', antwort(status)]], env)
    expect(r.status).toBe(STATUS.gebrochen)
    expect(r.text).toContain(`„${status}"`)
  })
  it('Workflow sendet, aber die zugesagte Mail fehlt → gebrochen', async () => {
    expect((await online(workflow, [['/workflows/', antwort('Sending', 'Willkommen')]], env)).text).toContain('keine Mail mit „Spickzettel"')
  })
  it('Workflow gelöscht → gebrochen; Schlüssel abgelehnt oder Dienst weg → nicht prüfbar', async () => {
    expect((await online(workflow, [['/workflows/', { status: 404 }]], env)).status).toBe(STATUS.gebrochen)
    expect((await online(workflow, [['/workflows/', { status: 401 }]], env)).status).toBe(STATUS.blind)
    expect((await online(workflow, [['/workflows/', { status: 503 }]], env)).status).toBe(STATUS.blind)
    expect((await online(workflow, [['/workflows/', new Error('ETIMEDOUT')]], env)).status).toBe(STATUS.blind)
  })

  const seite1 = { json: { data: [{ id: 'tpl-doi', name: 'DOI', dataVariables: ['confirmUrl'] }], pagination: { nextCursor: 'c2' } } }
  const seite2 = { json: { data: [{ id: 'tpl-widerruf', name: 'Widerruf', dataVariables: ['datum'] }], pagination: { nextCursor: null } } }
  const liste = [['cursor=c2', seite2], ['/transactional', seite1]]

  it('Transaktionsmail: veröffentlicht (auch auf Seite 2), Variablen vorhanden', async () => {
    expect((await online({ typ: 'loops', art: 'transactional', id: 'tpl-doi', variablen: ['confirmUrl'] }, liste, env)).status).toBe(STATUS.gedeckt)
    expect((await online({ typ: 'loops', art: 'transactional', id: 'tpl-widerruf' }, liste, env)).status).toBe(STATUS.gedeckt)
  })
  it('Transaktionsmail fehlt oder Variable fehlt → gebrochen', async () => {
    expect((await online({ typ: 'loops', art: 'transactional', id: 'tpl-urkunde' }, liste, env)).text).toContain('nicht veröffentlicht')
    expect((await online({ typ: 'loops', art: 'transactional', id: 'tpl-doi', variablen: ['voucher_code'] }, liste, env)).text).toContain('„voucher_code"')
  })
  it('die Liste wird je Lauf einmal geholt, nicht je Beleg', async () => {
    const n = netz(liste)
    const cache = {}
    for (const id of ['tpl-doi', 'tpl-widerruf', 'tpl-urkunde']) await belegOnline({ typ: 'loops', art: 'transactional', id }, { ...n, env, cache, pauseMs: 0 })
    expect(n.aufrufe).toHaveLength(2)
  })
})

describe('Belege mit Netz — supabase', () => {
  const env = { NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co/', SUPABASE_SERVICE_ROLE_KEY: 'key' }
  it('ohne Zugang: nicht prüfbar', async () => {
    expect((await online({ typ: 'supabase', tabelle: 'hoefe', min_zeilen: 1 }, [], {})).status).toBe(STATUS.blind)
  })
  it('Zeilenzahl aus content-range', async () => {
    const regeln = [['/rest/v1/hoefe', { kopf: { 'content-range': '0-0/6069' }, json: [{}] }]]
    expect((await online({ typ: 'supabase', tabelle: 'hoefe', min_zeilen: 5000 }, regeln, env)).status).toBe(STATUS.gedeckt)
    expect((await online({ typ: 'supabase', tabelle: 'hoefe', min_zeilen: 7000 }, regeln, env)).text).toContain('6069 Zeilen, erwartet mindestens 7000')
    expect((await online({ typ: 'supabase', tabelle: 'hoefe', max_zeilen: 10 }, regeln, env)).status).toBe(STATUS.gebrochen)
  })
  it('Frische: der Hofladen-Import vom 15.09. ist am 03.10. zu alt', async () => {
    const beleg = { typ: 'supabase', tabelle: 'hoefe', spalte: 'letzter_import', max_alter_tage: 9 }
    const n = netz([['/rest/v1/hoefe', { json: [{ letzter_import: '2026-09-15T04:00:00Z' }] }]])
    const r = await belegOnline(beleg, { ...n, env, jetzt: JETZT, pauseMs: 0 })
    expect(r.status).toBe(STATUS.gebrochen)
    expect(r.text).toContain('2026-09-15')
    expect(n.aufrufe[0].url).toBe('https://x.supabase.co/rest/v1/hoefe?select=letzter_import&order=letzter_import.desc&limit=1&letzter_import=not.is.null')
    expect((await online(beleg, [['/rest/v1/hoefe', { json: [{ letzter_import: '2026-09-29T04:00:00Z' }] }]], env)).status).toBe(STATUS.gedeckt)
    expect((await online(beleg, [['/rest/v1/hoefe', { json: [] }]], env)).status).toBe(STATUS.gebrochen)
  })
  it('Schlüssel abgelehnt → nicht prüfbar; Tabelle weg → gebrochen', async () => {
    expect((await online({ typ: 'supabase', tabelle: 'hoefe', min_zeilen: 1 }, [['/rest/v1/', { status: 401 }]], env)).status).toBe(STATUS.blind)
    expect((await online({ typ: 'supabase', tabelle: 'hoefe', min_zeilen: 1 }, [['/rest/v1/', { status: 404 }]], env)).status).toBe(STATUS.gebrochen)
  })
})

// ─── Tägliche Prüfung → Heartbeat ────────────────────────────────────────────

describe('Tägliche Belegprüfung — Meldung über den Heartbeat', () => {
  const eintrag = (id, beleg) => ({ id, zusage: `Zusage ${id} steht auf der Seite`, wo: [{ datei: 'a.tsx', muster: 'Text hier' }], beleg, bei_bruch: `Satz zu ${id} herausnehmen.`, abteilung: 'Wachstum', seit: '2026-10-03' })
  const register = {
    keine_zusage: [],
    zusagen: [
      eintrag('strecke', { typ: 'loops', art: 'workflow', id: 'wf-12345678' }),
      eintrag('doi', [{ typ: 'loops', art: 'transactional', id: 'tpl-doi' }, { typ: 'mensch', was: 'Variable im Hosting gesetzt', geprueft_am: '2026-10-03', gueltig_tage: 90 }]),
      eintrag('seite', { typ: 'http', url: 'https://steakakademie.de/hoefe', enthaelt: ['OpenStreetMap'] }),
      eintrag('import', { typ: 'supabase', tabelle: 'hoefe', spalte: 'letzter_import', max_alter_tage: 9 }),
    ],
  }
  const regeln = [
    ['/workflows/', { json: { name: 'Willkommen', status: 'Paused', nodes: {} } }],
    ['/transactional', { json: { data: [{ id: 'tpl-doi', name: 'DOI', dataVariables: [] }], pagination: { nextCursor: null } } }],
    ['steakakademie.de/hoefe', { text: '<p>© OpenStreetMap-Mitwirkende</p>' }],
  ]

  it('vier Zustände, gezählt — und ohne Supabase-Zugang ist der Import NICHT gedeckt', async () => {
    const ergebnisse = await pruefeBelege({ register, ...netz(regeln), env: { LOOPS_API_KEY: 'k' }, jetzt: JETZT + 100 * 86_400_000, pauseMs: 0 })
    expect(ergebnisse.map((r) => `${r.id}:${r.typ}:${r.status}`)).toEqual([
      'strecke:loops:gebrochen', 'doi:loops:gedeckt', 'doi:mensch:abgelaufen', 'seite:http:gedeckt', 'import:supabase:nicht prüfbar',
    ])
    const h = alsHeartbeat(ergebnisse, { zusagen: register.zusagen.length })
    expect(h.zahlen).toEqual({ gedeckt: 2, gebrochen: 1, abgelaufen: 1, blind: 1, gesamt: 5, zusagen: 4 })
    expect(h.zeilen.map((z) => `${z.status}:${z.name}`)).toEqual([
      'ok:Zusagen-Belege',
      'ueberfaellig:Zusage strecke',
      'ueberfaellig:Zusage doi',
      'uebersprungen:Zusagen-Belege (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen)',
    ])
    expect(h.zeilen[1].hinweis).toContain('Satz zu strecke herausnehmen.')
    expect(h.markdown).toContain('**2 gedeckt · 1 gebrochen · 1 abgelaufen · 1 nicht prüfbar**')
    expect(h.markdown).toContain('| `import` | supabase | NICHT PRÜFBAR |')
    // Die Zeilen gehen durch `still=…|betreff=…` im Workflow: kein Trenner, kein Umbruch.
    for (const z of h.zeilen) expect(`${z.text}${z.hinweis ?? ''}`).not.toMatch(/\||\n/)

    // Im Urteil des Heartbeats: rot, und „nicht geprüft" steht getrennt von „steht".
    const u = urteil(h.zeilen)
    expect(u.exitCode).toBe(1)
    expect(u.kaputt.map((r) => r.name)).toEqual(['Zusage strecke', 'Zusage doi'])
    expect(u.blind).toHaveLength(1)
    expect(u.markdown).toContain('Auf der Seite steht: „Zusage strecke steht auf der Seite"')
  })

  it('ein fehlendes Secret ist EINE Zeile, nicht eine je Beleg', async () => {
    const viele = { keine_zusage: [], zusagen: ['a', 'b', 'c'].map((id) => eintrag(id, { typ: 'loops', art: 'workflow', id: 'wf-12345678' })) }
    const h = alsHeartbeat(await pruefeBelege({ register: viele, ...netz([]), env: {}, jetzt: JETZT }))
    expect(h.zeilen).toHaveLength(1)
    expect(h.zeilen[0]).toMatchObject({ status: 'uebersprungen', name: 'Zusagen-Belege (LOOPS_API_KEY fehlt)' })
    expect(h.zeilen[0].text).toContain('3 Beleg(e) nicht prüfbar')
    expect(urteil(h.zeilen)).toMatchObject({ zustand: 'blind', exitCode: 1 })
  })

  it('alles gedeckt: eine grüne Zeile mit Zahl', async () => {
    const gut = { keine_zusage: [], zusagen: [register.zusagen[2]] }
    const h = alsHeartbeat(await pruefeBelege({ register: gut, ...netz(regeln), env: {}, jetzt: JETZT, pauseMs: 0 }))
    expect(h.zeilen).toEqual([{ name: 'Zusagen-Belege', status: 'ok', text: '1 von 1 Belegen gedeckt (1 Zusagen im Register)' }])
    expect(urteil(h.zeilen).exitCode).toBe(0)
  })

  it('ein Fehler in der Prüfung selbst ist kein Urteil über die Zusage', async () => {
    const kaputt = async () => { throw new Error('nur einmal') }
    const [r] = await pruefeBelege({ register: { zusagen: [eintrag('x', { typ: 'unbekannt' })], keine_zusage: [] }, fetchFn: kaputt, env: {}, jetzt: JETZT })
    expect(r.status).toBe(STATUS.blind)
  })

  it('kaputtes Register: eine Fehlerzeile, kein Absturz', async () => {
    const h = await fuerHeartbeat({ register: leseRegister('zusagen:\n  - id: Falsch\n') })
    expect(h.zeilen).toHaveLength(1)
    expect(h.zeilen[0]).toMatchObject({ name: 'Zusagen-Register', status: 'fehler' })
    expect(urteil(h.zeilen).exitCode).toBe(1)
  })

  it('--nur-offline wertet Netz-Belege nicht als gedeckt', async () => {
    const ergebnisse = await pruefeBelege({ register, nurOffline: true, jetzt: JETZT, fetchFn: async () => { throw new Error('darf nicht laufen') } })
    expect(ergebnisse.filter((r) => r.typ !== 'mensch').every((r) => r.status === STATUS.blind)).toBe(true)
  })

  it('Heartbeat: ist die Belegprüfung nicht ladbar, meldet er NICHT GEPRÜFT statt abzustürzen', async () => {
    const h = await zusagenBelege(async () => { throw new Error("Cannot find package 'js-yaml'") })
    expect(h.zeilen).toHaveLength(1)
    expect(h.zeilen[0].status).toBe('uebersprungen')
    expect(h.zeilen[0].text).toContain("Cannot find package 'js-yaml'")
    expect(urteil(h.zeilen).exitCode).toBe(1)
  })
})

describe('Klassen', () => {
  it('fünf Klassen, jede mit Titel und Mustern', () => {
    expect(Object.keys(KLASSEN)).toEqual(['rhythmus', 'versand', 'pruefung', 'bestandszahl', 'garantie'])
    for (const k of Object.values(KLASSEN)) { expect(k.titel).toBeTruthy(); expect(k.muster.length).toBeGreaterThan(0) }
  })
  it('die Baseline im Repo nennt nur bekannte Klassen und ist sortiert', () => {
    const b = JSON.parse(readFileSync(new URL('../data/zusagen-baseline.json', import.meta.url), 'utf8'))
    expect(b.treffer.every((t) => t.klasse in KLASSEN && /^[0-9a-f]{16}$/.test(t.id))).toBe(true)
    const schluesselReihe = b.treffer.map((t) => `${t.datei}\u0000${t.klasse}\u0000${t.id}`)
    expect(new Set(b.treffer.map((t) => t.id)).size).toBe(b.treffer.length)
    expect(schluesselReihe.length).toBeGreaterThan(0)
  })
})
