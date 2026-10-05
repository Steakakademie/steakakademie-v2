// Tests fuer die Review-Hilfen der Agenten-PRs (scripts/lib/rezept-review.mjs).
//
// Anlass: Beim Rote-Bete-Salsa-Rezept (PR #310) fand erst eine Handpruefung einen
// Garzeit-Widerspruch (Schritt 5–6 Min./Seite, Text 2–3), eine unbelegte „Physik"-Aussage
// und einen Geosmin-Satz. Die Fixtures unten bilden genau diese Muster nach.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { analysiere, checklisteMarkdown, rezeptAbschnitt, rezeptLesbar, dauerLesbar } from './rezept-review.mjs'

function mdx ({ schritt = 'Grillen.', text = 'Kern 54 °C.', fm = '' } = {}) {
  return `---
title: Testrezept
kategorie: fleisch
meatType: Flank Steak
image: /images/rezepte/test.jpg
imageAI: true
imageAlt: Flank Steak auf Tortilla
status: "published"
reviewed: true
${fm}
steps:
  - title: Grillen
    description: "${schritt}"
  - title: Servieren
    description: "Anrichten."
---

${text}
`
}

describe('analysiere — Garzeit pro Seite', () => {
  it('meldet unterschiedliche Angaben (Schritt gegen Fliesstext)', () => {
    const a = analysiere(mdx({
      schritt: 'Je 5–6 Minuten pro Seite grillen.',
      text: 'Die Methode: heisse Flamme, 2–3 Minuten pro Seite, bis die Kerntemperatur stimmt.',
    }))
    expect(a.auffaelligkeiten.join(' ')).toMatch(/unterschiedlich angegeben: 5–6 \/ 2–3/)
  })
  it('schweigt bei einheitlicher Angabe (auch mit anderer Schreibweise des Bindestrichs)', () => {
    const a = analysiere(mdx({
      schritt: 'Je 2-3 Minuten pro Seite grillen.',
      text: 'Nach 2 – 3 Minuten pro Seite wenden, Kern 54 °C.',
    }))
    expect(a.auffaelligkeiten).toEqual([])
  })
})

describe('analysiere — Fachaussagen', () => {
  it('markiert die Erklaer-Prosa aus dem Rote-Bete-Rezept', () => {
    const a = analysiere(mdx({
      text: 'Rote Bete liefert Erdigkeit: Geosmin ist hitzebeständig und bleibt präsent.\n\nDas ist kein Stilmittel — es ist Physik.',
    }))
    expect(a.behauptungen).toHaveLength(2)
    expect(a.behauptungen.join(' ')).toMatch(/Geosmin/)
    expect(a.behauptungen.join(' ')).toMatch(/Physik/)
  })
  it('ignoriert Ueberschriften („Die Physik des Grillens" steht in 46 Bestandsrezepten)', () => {
    const a = analysiere(mdx({ text: '## Warum Butterflying die Physik verändert\n\nEine Keule ist ein geometrisches Problem.' }))
    expect(a.behauptungen).toEqual([])
  })
  it('ignoriert alltaegliche Woerter (Stoff, Prozent) — sonst waere die Liste in jedem PR laut', () => {
    const a = analysiere(mdx({ text: 'Der Stoff ist dicht. Rund 20 Prozent Fett und 5 % Salz.' }))
    expect(a.behauptungen).toEqual([])
  })
  it('kuerzt lange Saetze und liefert hoechstens 6', () => {
    const satz = `Das ist Physik ${'x '.repeat(200)}.`
    const a = analysiere(mdx({ text: Array.from({ length: 9 }, () => satz).join(' ') }))
    expect(a.behauptungen).toHaveLength(6)
    expect(a.behauptungen[0].length).toBeLessThanOrEqual(171)
  })
})

describe('analysiere — Zahlen, Referenz, Titel, Status', () => {
  it('sammelt Kerntemperaturen im Kernbereich, nicht die Grilltemperatur', () => {
    const a = analysiere(mdx({ schritt: 'Grill auf 250 °C heizen, Kern 52–55 °C.', text: 'Ziel 54 °C, Holzbrett 85 °C.' }))
    expect(a.kerntemperaturen.sort()).toEqual(['52–55', '54', '85'].sort())
  })
  it('schlaegt den Referenz-Schluessel vor und zeigt dessen Korridor', () => {
    const referenz = { badges: { beef_flank: { c: 54, range: [52, 55], label: 'Medium Rare' } } }
    const a = analysiere(mdx({ text: 'Ziel ist 54 °C Kerntemperatur.' }), { referenz })
    expect(a.referenz).toEqual({ schluessel: 'beef_flank', c: 54, range: [52, 55], label: 'Medium Rare' })
    expect(rezeptAbschnitt('x', a)).toMatch(/Referenz-Vorschlag `beef_flank`: 52–55 °C \(Ziel 54/)
  })
  it('meldet ein Fleischrezept ganz ohne Kerntemperatur (Regel 8c)', () => {
    const a = analysiere(mdx({ text: 'Einfach grillen, bis es gut aussieht.' }))
    expect(a.auffaelligkeiten.join(' ')).toMatch(/Keine Kerntemperatur im Text, obwohl die Referenz `beef_flank`/)
  })
  it('meldet das NICHT bei Beilagen und nicht, wenn eine Temperatur genannt ist', () => {
    const beilage = mdx({ text: 'Mais grillen.' }).replace('kategorie: fleisch', 'kategorie: beilagen').replace('meatType: Flank Steak', 'meatType: Mais')
    expect(analysiere(beilage).auffaelligkeiten).toEqual([])
    expect(analysiere(mdx({ text: 'Kern 54 °C.' })).auffaelligkeiten).toEqual([])
  })
  it('meldet einen seoTitle mit Markenzusatz', () => {
    const a = analysiere(mdx({ fm: 'seoTitle: "Flank Steak | Steakakademie"' }))
    expect(a.auffaelligkeiten.join(' ')).toMatch(/doppelter Titel/)
  })
  it('erkennt die vorab gesetzte Freigabe (Merge macht sie wahr)', () => {
    expect(analysiere(mdx()).vorabFreigabe).toBe(true)
  })
  it('meldet den „Not:"-Prompt NICHT pro Rezept (stand in 86 von 131 Bestandsrezepten: Rauschen)', () => {
    const a = analysiere(mdx({ fm: 'imagePrompt: "Sliced steak. Not: whole steak, no char marks."' }))
    expect(a.auffaelligkeiten).toEqual([])
  })
})

// Kerntemperaturen nach Garphase. Anlass: Montreal Smoked Meat (05.10.2026) nannte als Ende des
// Raeucherns 75–80 °C im Schritt und 70–72 °C im Abschnitt; eine flache Liste zeigt das nicht.
describe('analysiere — Kerntemperaturen nach Phase', () => {
  function rezept (schritte, text = 'Fliesstext.') {
    const steps = schritte.map(([titel, beschr]) => `  - title: ${titel}\n    description: "${beschr}"`).join('\n')
    return `---
title: Phasenrezept
kategorie: fleisch
meatType: Brisket
image: /images/rezepte/test.jpg
status: "published"
reviewed: true
steps:
${steps}
---

${text}
`
  }

  it('meldet denselben Garpunkt mit abweichenden Werten (Schritt gegen Abschnitt)', () => {
    const a = analysiere(rezept(
      [['Räuchern', 'Das Fleisch räuchert, bis die Kerntemperatur 75–80 °C erreicht.']],
      '## Das Räuchern\n\nDas Brisket raucht, bis es eine Kerntemperatur von 70–72 °C erreicht.',
    ))
    const raeuchern = a.kernNachPhase.find((p) => p.phase === 'Räuchern')
    expect(raeuchern.werte.map((w) => w.wert)).toEqual(['75–80', '70–72'])
    expect(raeuchern.konflikt).toBe(true)
    expect(a.auffaelligkeiten.join(' ')).toMatch(/Phase „Räuchern" uneinheitlich: 75–80 °C \(Schritt „Räuchern"\) ↔ 70–72 °C \(Abschnitt „Das Räuchern"\)/)
  })
  it('weist Werte ohne Satzbezug ueber den Schritt-Titel der richtigen Phase zu', () => {
    const a = analysiere(rezept([['Dämpfen', 'Nach dieser Zeit sollte eine Kerntemperatur von 93 °C erreicht sein.']]))
    expect(a.kernNachPhase).toEqual([{ phase: 'Dämpfen', werte: [{ wert: '93', quelle: 'Schritt „Dämpfen"' }], konflikt: false }])
  })
  it('93 und 90–93 sind kein Widerspruch (Ueberschneidung), 74 und 75 auch nicht (Toleranz 2 °C)', () => {
    const a = analysiere(rezept(
      [['Dämpfen', 'Kerntemperatur 93 °C.']],
      '## Das Dämpfen\n\nDie Kerntemperatur am Ende des Dämpfens: 90–93 °C. Beim Wickeln liegt die Kerntemperatur bei 74 °C, laut Schritt bei 75 °C.',
    ))
    expect(a.kernNachPhase.every((p) => !p.konflikt)).toBe(true)
    expect(a.auffaelligkeiten.join(' ')).not.toMatch(/uneinheitlich/)
  })
  it('„zieht sich zusammen" ist kein Ziehwert; „vom Grill nehmen" schon', () => {
    const a = analysiere(rezept([['Dämpfen', 'Die Kerntemperatur am Ende: 90–93 °C, dann zieht sich das Fleisch kaum noch zusammen.'], ['Grillen', 'Bei einer Kerntemperatur von 51 °C vom Grill nehmen.']]))
    expect(a.kernNachPhase.find((p) => p.phase === 'Dämpfen').werte[0].wert).toBe('90–93')
    expect(a.kernNachPhase.find((p) => p.phase === 'Ziehwert').werte[0].wert).toBe('51')
  })
  it('vergleicht Zieh- und Endwert nicht gegeneinander', () => {
    const a = analysiere(rezept([['Grillen', 'Ziel ist eine Kerntemperatur von 54 °C. Bei einer Kerntemperatur von 51 °C vom Grill nehmen.']]))
    expect(a.auffaelligkeiten.join(' ')).not.toMatch(/uneinheitlich/)
  })
  it('„gemessen vor dem Ruhen" gehoert nicht zur Phase Ruhen', () => {
    const a = analysiere(rezept([['Grillen', 'Die Kerntemperatur von 54 °C gemessen VOR dem Ruhen.']]))
    expect(a.kernNachPhase.find((p) => p.phase === 'Ruhen')).toBeUndefined()
  })
  it('Reverse Sear (Anbraten) wird nicht verglichen — Zieh- und Endwert stehen dort gewollt nebeneinander', () => {
    const a = analysiere(rezept([['Anbraten', 'Erst bei 45 °C Kerntemperatur indirekt, dann sear bis eine Kerntemperatur von 52 °C erreicht ist.']]))
    expect(a.kernNachPhase.find((p) => p.phase === 'Anbraten').konflikt).toBe(false)
  })
  it('zaehlt nur Saetze mit „Kern": Holzbrett und Ofen gehoeren nicht dazu', () => {
    const a = analysiere(rezept([['Ruhen', 'Auf dem vorgewaermten Holzbrett (85 °C) ruhen lassen. Der Ofen steht auf 70 °C.']]))
    expect(a.kernNachPhase).toEqual([])
    expect(a.kerntemperaturen.sort()).toEqual(['70', '85'])
  })
  it('Abschnitt zeigt die Phasen und markiert den Widerspruch', () => {
    const a = analysiere(rezept(
      [['Räuchern', 'Kerntemperatur 75–80 °C.']],
      '## Das Räuchern\n\nDas Brisket raucht bis zu einer Kerntemperatur von 70–72 °C.',
    ))
    const t = rezeptAbschnitt('x', a)
    expect(t).toMatch(/Kerntemperaturen nach Phase/)
    expect(t).toMatch(/\*\*Räuchern:\*\* 75–80 °C ↔ 70–72 °C ⚠️ uneinheitlich/)
  })
})

// Referenz-Vorschlag nach Hauptprodukt. Anlass: Im ersten Agenten-PR mit der Checkliste (#327, Aussie
// Snags, 05.10.2026) bekamen „Rindsbratwürste" beef_mr (52–55 °C) statt Hack (70–72 °C), weil „Rind"
// vor jeder Wurst-Regel stand. Die Reihenfolge der Regeln ist Teil des Vertrags.
describe('analysiere — Referenz-Vorschlag nach Hauptprodukt', () => {
  const referenz = {
    badges: {
      burger: { c: 70, range: [70, 72], label: 'durchgegart' },
      beef_mr: { c: 54, range: [52, 55], label: 'Medium Rare' },
    },
  }
  function schluessel(meatType, title = 'Testrezept') {
    const text = `---
title: ${title}
kategorie: fleisch
meatType: ${meatType}
image: /images/rezepte/test.jpg
steps:
  - title: Grillen
    description: "Kerntemperatur 72 °C."
  - title: Servieren
    description: "Anrichten."
---

Kern 72 °C.
`
    return analysiere(text, { referenz }).referenz?.schluessel ?? null
  }

  it.each([
    ['Rindsbratwürste', 'burger'],
    ['Rinderhackfleisch', 'burger'],
    ['Rinderwurst', 'burger'],
    ['Schweinsbratwurst', 'burger'],
    ['Wagyu-Hack', 'burger'],
    ['Lammköfte', 'burger'],
    ['Smash Burger Patty', 'burger'],
  ])('%s → %s (Hack und Wurst sind durchzugaren)', (meatType, erwartet) => {
    expect(schluessel(meatType)).toBe(erwartet)
  })

  it('Geflügelhack bleibt bei Geflügel (Mindestwert 72 °C, nicht 70)', () => {
    expect(schluessel('Hähnchenhack')).toBe('poultry')
  })
  it('Teilstuecke ohne Hack/Wurst bleiben unveraendert', () => {
    expect(schluessel('Rinderfilet')).toBe('beef_mr')
    expect(schluessel('Flank Steak')).toBe('beef_flank')
    expect(schluessel('Lammkarree')).toBe('lamb_mr')
    expect(schluessel('Schweinenacken')).toBe('pork_juicy')
    expect(schluessel('Brisket')).toBe('beef_lowslow')
  })
  it('die Checkliste zeigt bei Wurst den Hack-Korridor, nicht Medium Rare', () => {
    const a = analysiere(`---
title: Aussie Snags
kategorie: fleisch
meatType: Rindsbratwürste
image: /images/rezepte/test.jpg
steps:
  - title: Grillen
    description: "Kerntemperatur von 72 °C erreichen."
---

Text.
`, { referenz })
    const t = rezeptAbschnitt('aussie-snags', a)
    expect(t).toMatch(/Referenz-Vorschlag `burger`: 70–72 °C/)
    expect(t).not.toMatch(/beef_mr/)
  })
})

describe('checklisteMarkdown', () => {
  const a = analysiere(mdx({ text: 'Das ist Physik.' }))

  it('ist leer, wenn es keine Rezepte gibt', () => {
    expect(checklisteMarkdown([])).toBe('')
  })
  it('enthaelt Kopf, Slug, Checkboxen und den Hinweis auf offene Punkte', () => {
    const t = checklisteMarkdown([{ slug: 'test-rezept', analyse: a }])
    expect(t).toContain('## 🔎 Review-Checkliste')
    expect(t).toContain('`test-rezept`')
    expect(t).toContain('- [ ] Zeigt das Bild genau das')
    expect(t).toMatch(/fal\.ai-Tarif und C2PA/)
    expect(t).toMatch(/reviewedAt/)
  })
  it('kuerzt auf maxZeichen (PR-Text hat eine Obergrenze)', () => {
    const t = checklisteMarkdown([{ slug: 'a', analyse: a }, { slug: 'b', analyse: a }], { maxZeichen: 300 })
    expect(t.length).toBeLessThan(330)
    expect(t).toMatch(/gekürzt/)
  })
})

describe('Einbau in den Workflow recipe-grow', () => {
  const wf = readFileSync(new URL('../../.github/workflows/recipe-grow.yml', import.meta.url), 'utf8')

  it('erzeugt die Checkliste VOR dem PR-Schritt (danach ist der Arbeitsbaum sauber)', () => {
    const iCheck = wf.indexOf('recipe-review-checkliste.mjs')
    const iPr = wf.indexOf('uses: ./.github/actions/pr-statt-push')
    expect(iCheck).toBeGreaterThan(-1)
    expect(iCheck).toBeLessThan(iPr)
  })
  it('reicht den Text in die PR-Beschreibung', () => {
    expect(wf).toContain('steps.checkliste.outputs.text')
  })
})

// GitHub zeigt das Frontmatter als Tabelle; ingredients und steps (verschachtelte Listen) werden
// darin unlesbar breit — Uwe sah am 05.10.2026 „keine Mengen, keine Zubereitung". Der PR-Text
// gibt beides deshalb als Liste wieder.
describe('rezeptLesbar — Zutaten und Zubereitung im PR-Text', () => {
  const fixture = `---
title: Testrezept
kategorie: fleisch
meatType: Flank Steak
servings: 4
ingredients:
  - amount: 2
    unit: kg
    name: Rinderbrust
    note: "vom Metzger"
  - amount: 35
    unit: g
    name: Meersalz
steps:
  - title: Pökellauge ansetzen
    description: "Wasser und Salz aufkochen."
    duration: PT15M
    tip: "Profi-Tipp: Kalt abkühlen lassen."
  - title: Brisket pökeln
    description: "Mindestens 7 Tage kühlen."
    duration: PT168H
---

Text.
`
  const ohneListen = `---
title: Leer
kategorie: fleisch
meatType: Flank Steak
---

Text.
`

  it('wandelt ISO-Dauern in Lesefassung', () => {
    expect(dauerLesbar('PT15M')).toBe('15 Min.')
    expect(dauerLesbar('PT3H')).toBe('3 Std.')
    expect(dauerLesbar('PT1H30M')).toBe('1 Std. 30 Min.')
    expect(dauerLesbar('PT168H')).toBe('168 Std.')
    expect(dauerLesbar(undefined)).toBe('')
    expect(dauerLesbar('irgendwas')).toBe('irgendwas')
  })

  it('listet Zutaten mit Menge, Einheit und Hinweis', () => {
    const t = rezeptLesbar(analysiere(fixture))
    expect(t).toContain('**Zutaten (Basis 4 Portionen):**')
    expect(t).toContain('- 2 kg Rinderbrust _(vom Metzger)_')
    expect(t).toContain('- 35 g Meersalz')
  })

  it('nummeriert die Schritte mit Dauer, Text und Tipp', () => {
    const t = rezeptLesbar(analysiere(fixture))
    expect(t).toContain('1. **Pökellauge ansetzen** (15 Min.) — Wasser und Salz aufkochen.')
    expect(t).toContain('   - Profi-Tipp: Kalt abkühlen lassen.')
    expect(t).toContain('2. **Brisket pökeln** (168 Std.) — Mindestens 7 Tage kühlen.')
  })

  it('warnt sichtbar, wenn Zutaten oder Schritte fehlen (statt still zu schweigen)', () => {
    const t = rezeptLesbar(analysiere(ohneListen))
    expect(t).toMatch(/Zutaten:\*\* ⚠️ keine/)
    expect(t).toMatch(/Zubereitung:\*\* ⚠️ keine/)
  })

  it('steht im Rezeptabschnitt der Checkliste, nicht nur als Funktion', () => {
    const t = checklisteMarkdown([{ slug: 'x', analyse: analysiere(fixture) }])
    expect(t).toContain('<details open>')
    expect(t).toContain('Rezept lesbar: Zutaten und Zubereitung')
    expect(t).toContain('- 35 g Meersalz')
    expect(t).toContain('2. **Brisket pökeln**')
  })

  it('Echtfall: das Montreal-Rezept aus dem Bestand zeigt alle Zutaten und alle Schritte', () => {
    const quelle = readFileSync(new URL('../../content/rezepte/montreal-smoked-meat.mdx', import.meta.url), 'utf8')
    const a = analysiere(quelle)
    const t = rezeptLesbar(a)
    expect(a.zutaten.length).toBeGreaterThan(15)
    expect(a.schritte.length).toBe(7)
    expect(t).toMatch(/- 2 kg Rinderbrust/)
    expect(t).toMatch(/Pökelsalz \(Nitritpökelsalz\)/)
    expect(t).toMatch(/7\. \*\*Ruhen und schneiden\*\*/)
  })
})
