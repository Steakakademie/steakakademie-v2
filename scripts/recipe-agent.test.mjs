// Regressionstest fuer den Rezept-Agenten.
//
// Anlass: Lauf #100 (14.09.2026) scheiterte an „Zu wenige Schritte". Der
// Schritt-Parser trennte mit split(' | ') und verlangte damit Leerzeichen um
// die Pipe; schrieb das Modell 'Titel|Dauer|Text', fiel der Schritt weg. Die
// Zutaten daneben wurden schon immer mit split('|') gelesen — dieselbe Datei,
// zwei Strenge-Grade, ein stiller Ausfall der Tagesproduktion.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'
import { parseStructuredText, validate, alleSeeds, sicherheitsKlasse, systemPrompt } from './recipe-agent.mjs'

const KOPF = `TITLE: Yakitori Negima
DESCRIPTION: Testbeschreibung fuer den Parser
IMAGE_ALT: Spiesse ueber Glut
IMAGE_PROMPT: Yakitori skewers of chicken thigh cubes alternating with leek on bamboo sticks over glowing binchotan charcoal. Not: whole chicken legs, no bones.
LAND: Japan
CORE_TEMP: 74
PREP_TIME: PT25M
COOK_TIME: PT10M
TOTAL_TIME: PT35M
SERVINGS: 4

INGREDIENTS:
- 600 | g | Haehnchenschenkel | gewuerfelt
- 4 | Stangen | Negi-Lauch
- 100 | ml | Sojasauce
- 100 | ml | Mirin
- 2 | EL | Zucker

STEPS:
`

const SCHRITT_FORMATE = {
  'Leerzeichen um die Pipe':   '1. Tare | 15 Min | Einkochen bis sirupartig. | Rest aufheben\n2. Spiesse | 10 Min | Abwechselnd aufziehen. | Wassern',
  'ohne Leerzeichen':          '1. Tare|15 Min|Einkochen bis sirupartig.|Rest aufheben\n2. Spiesse|10 Min|Abwechselnd aufziehen.|Wassern',
  'gemischte Abstaende':       '1. Tare |15 Min| Einkochen bis sirupartig.  |Rest aufheben\n2. Spiesse   |  10 Min |Abwechselnd aufziehen.',
  'Klammer-Nummerierung':      '1) Tare | 15 Min | Einkochen bis sirupartig.\n2) Spiesse | 10 Min | Abwechselnd aufziehen.',
  // Lauf #101: „Zu wenige Schritte" trotz Trennzeichen-Fix. Seitdem entscheidet
  // nicht mehr die Nummerierung, ob eine Zeile ein Schritt ist, sondern die Pipes.
  'Spiegelstriche':            '- Tare | 15 Min | Einkochen bis sirupartig.\n- Spiesse | 10 Min | Abwechselnd aufziehen.',
  'Sternchen':                 '* Tare | 15 Min | Einkochen bis sirupartig.\n* Spiesse | 10 Min | Abwechselnd aufziehen.',
  'ganz ohne Aufzaehlung':     'Tare | 15 Min | Einkochen bis sirupartig.\nSpiesse | 10 Min | Abwechselnd aufziehen.',
}

const SEED = {
  slug: 'yakitori-negima', kategorie: 'fleisch', difficulty: 'Mittel',
  meatType: 'Haehnchenschenkel', cookingMethod: 'Direkt',
}

describe('parseStructuredText — Schritte', () => {
  for (const [name, steps] of Object.entries(SCHRITT_FORMATE)) {
    it(`liest ${name}`, () => {
      const daten = parseStructuredText(KOPF + steps)
      expect(daten.steps).toHaveLength(2)
      expect(daten.steps[0].title).toBe('Tare')
      expect(daten.steps[0].duration).toBe('15 Min')
      expect(daten.steps[0].description).toBe('Einkochen bis sirupartig.')
    })
  }

  // Lauf #102: vier von fuenf Titeln kamen als "2. Spiesse bestuecken" an.
  it('streift Nummern und Fettmarkierung vom Titel — auch mehrfach', () => {
    const daten = parseStructuredText(KOPF +
      '1. Tare | 15 Min | Einkochen.\n' +
      '- 2. Spiesse | 10 Min | Aufziehen.\n' +
      '3. **3. Grillen** | 6 Min | Wenden.\n' +
      '**4.** Ruhen | 2 Min | Warten. | Tipp mit 5 Minuten')
    expect(daten.steps.map(s => s.title)).toEqual(['Tare', 'Spiesse', 'Grillen', 'Ruhen'])
    expect(daten.steps[3].tip).toBe('Tipp mit 5 Minuten')
  })

  it('haelt ein | im Tipp zusammen, statt es abzuschneiden', () => {
    const daten = parseStructuredText(KOPF + '1. Tare | 15 Min | Einkochen. | Variante A | Variante B\n2. Spiesse | 10 Min | Aufziehen.')
    expect(daten.steps[0].tip).toBe('Variante A | Variante B')
  })

  it('liest Zutaten unabhaengig vom Pipe-Abstand', () => {
    const daten = parseStructuredText(KOPF + SCHRITT_FORMATE['ohne Leerzeichen'])
    expect(daten.ingredients).toHaveLength(5)
    expect(daten.ingredients[0]).toMatchObject({ amount: 600, unit: 'g', name: 'Haehnchenschenkel' })
  })
})

describe('validate', () => {
  it('laesst einen vollstaendigen Datensatz durch', () => {
    const daten = parseStructuredText(KOPF + SCHRITT_FORMATE['ohne Leerzeichen'])
    daten.image = '/images/rezepte/yakitori-negima.jpg'
    daten.kategorie = SEED.kategorie
    daten.meatType = SEED.meatType
    daten.cookingMethod = SEED.cookingMethod
    daten.difficulty = SEED.difficulty
    // Zweiter Schritt reicht der Mindestanforderung; mehr braucht validate nicht.
    expect(validate(daten, SEED)).toEqual([])
  })

  it('meldet fehlendes imagePrompt — ohne Briefing malt FLUX den Protein-Anker (Lauf #102)', () => {
    const daten = parseStructuredText(KOPF.replace(/^IMAGE_PROMPT:.*\n/m, '') + SCHRITT_FORMATE['ohne Leerzeichen'])
    daten.image = '/images/rezepte/x.jpg'
    expect(validate(daten, SEED)).toContain('Pflichtfeld fehlt: imagePrompt')
  })

  it('meldet fehlendes land — Pflichtfeld seit Stichtag 18.08.2026', () => {
    const daten = parseStructuredText(KOPF.replace('LAND: Japan\n', '') + SCHRITT_FORMATE['ohne Leerzeichen'])
    daten.image = '/images/rezepte/x.jpg'
    expect(validate(daten, SEED)).toContain('Pflichtfeld fehlt: land')
  })

  it('meldet zu wenige Schritte — der Fehler aus Lauf #100', () => {
    const daten = parseStructuredText(KOPF + '1. Tare | 15 Min | Einkochen.')
    daten.image = '/images/rezepte/x.jpg'
    expect(validate(daten, SEED)).toContain('Zu wenige Schritte')
  })
})

// Regel 8c: Kerntemperaturen kommen aus data/kerntemperatur-referenz.yaml.
// Anlass (15.09.2026): Der Agent las die Referenz nie, validate() pruefte keine
// Temperatur, und zwei offene Seeds lagen unter den Sicherheits-Mindestwerten
// (Putenbrust 71 °C, Schweinelachs 62 °C) — sie waeren unveraendert erzeugt worden.
const REFERENZ = yaml.load(readFileSync(new URL('../data/kerntemperatur-referenz.yaml', import.meta.url), 'utf8'))

function datensatz (kopf, seed) {
  const daten = parseStructuredText(kopf + SCHRITT_FORMATE['ohne Leerzeichen'])
  daten.image = `/images/rezepte/${seed.slug}.jpg`
  daten.kategorie = seed.kategorie
  daten.meatType = seed.meatType
  daten.cookingMethod = seed.cookingMethod
  daten.difficulty = seed.difficulty
  return daten
}

const PUTE    = { slug: 'pute', kategorie: 'fleisch', difficulty: 'Mittel', meatType: 'Putenbrust', cookingMethod: 'Indirekt', title: 'Putenbrust' }
const SCHWEIN = { slug: 'bacon', kategorie: 'fleisch', difficulty: 'Mittel', meatType: 'Schweinelachs / Kotelettstrang', cookingMethod: 'Direkt', title: 'Peameal Bacon' }
const BEILAGE = { slug: 'kartoffeln', kategorie: 'beilagen', difficulty: 'Einfach', meatType: 'Kartoffeln', cookingMethod: 'Smoker', title: 'Smoked Potatoes' }

describe('parseStructuredText — CORE_TEMP', () => {
  it.each([
    ['74', 74],
    ['74 °C', 74],
    ['72°C', 72],
    ['keine', null],
  ])('liest "%s" als %s', (roh, erwartet) => {
    const daten = parseStructuredText(KOPF.replace('CORE_TEMP: 74', `CORE_TEMP: ${roh}`) + SCHRITT_FORMATE['ohne Leerzeichen'])
    expect(daten.coreTemp).toBe(erwartet)
  })
})

describe('sicherheitsKlasse', () => {
  it.each([
    [{ meatType: 'Putenbrust' },                              'gefluegel',   72],
    [{ meatType: 'Haehnchenschenkel' },                       'gefluegel',   72],
    [{ meatType: 'Hähnchenhack', title: 'Tsukune — Japanische Hähnchen-Hackspieße' }, 'gefluegel', 72],
    [{ meatType: 'Schweinelachs / Kotelettstrang' },          'schwein',     63],
    [{ meatType: 'Schweine- und Rindfleisch', title: 'Texas Hot Links — Scharfe Grobwurst aus dem Smoker' }, 'hackfleisch', 70],
    [{ meatType: 'Rinderhack', title: 'Smash Burger' },       'hackfleisch', 70],
    [{ meatType: 'Wildschweinkeule' },                        'wildschwein', 70],
  ])('%o → %s ab %i °C', (seed, klasse, min) => {
    expect(sicherheitsKlasse(seed)).toEqual({ klasse, min })
  })

  it.each([
    [{ meatType: 'Entrecôte' }],
    [{ meatType: 'Entenbrust' }],   // Sonderfall der Referenz: darf rosa bleiben (duck_breast 56–62)
    [{ meatType: 'Lammkoteletts' }], // "kotelett" allein heisst nicht Schwein
    [{ meatType: 'Lachs' }],
    [{ meatType: 'Kartoffeln' }],
  ])('%o hat keinen Sicherheits-Mindestwert', (seed) => {
    expect(sicherheitsKlasse(seed)).toBeNull()
  })
})

describe('validate — Kerntemperatur gegen die Referenz', () => {
  it('lehnt Gefluegel unter 72 °C ab', () => {
    const fehler = validate(datensatz(KOPF.replace('CORE_TEMP: 74', 'CORE_TEMP: 71'), PUTE), PUTE)
    expect(fehler).toContain('Kerntemperatur 71 °C liegt unter dem Sicherheits-Mindestwert gefluegel (72 °C, data/kerntemperatur-referenz.yaml)')
  })

  it('laesst Gefluegel mit genau 72 °C durch', () => {
    expect(validate(datensatz(KOPF.replace('CORE_TEMP: 74', 'CORE_TEMP: 72'), PUTE), PUTE)).toEqual([])
  })

  it('lehnt Schwein unter 63 °C ab', () => {
    const fehler = validate(datensatz(KOPF.replace('CORE_TEMP: 74', 'CORE_TEMP: 62'), SCHWEIN), SCHWEIN)
    expect(fehler).toContain('Kerntemperatur 62 °C liegt unter dem Sicherheits-Mindestwert schwein (63 °C, data/kerntemperatur-referenz.yaml)')
  })

  it('verlangt eine Kerntemperatur, wenn die Referenz einen Mindestwert fuehrt', () => {
    const fehler = validate(datensatz(KOPF.replace('CORE_TEMP: 74\n', ''), SCHWEIN), SCHWEIN)
    expect(fehler).toContain('Kerntemperatur fehlt (CORE_TEMP) — Pflicht bei schwein')
  })

  it('verlangt keine Kerntemperatur bei Beilagen', () => {
    expect(validate(datensatz(KOPF.replace('CORE_TEMP: 74\n', ''), BEILAGE), BEILAGE)).toEqual([])
  })
})

describe('Seed-Daten gegen die Referenz', () => {
  // Kern-Bezug wie in den Konzepten formuliert: "bis 74 Grad Kern", "Kern 48°C", "Ziel 93°C"
  const KERN = /(?:(?:Kern(?:temperatur)?|Ziel|auf|bis)\s*(\d{2,3})\s*(?:°C|Grad)(?:\s*Kern)?|(\d{2,3})\s*(?:°C|Grad)\s*(?:Kern(?:temperatur)?|in der Brust))/gi

  it('keine Seed-Idee nennt eine Kerntemperatur unter dem Sicherheits-Mindestwert', () => {
    const verstoesse = []
    for (const seed of alleSeeds()) {
      const sicherheit = sicherheitsKlasse(seed)
      if (!sicherheit) continue
      for (const m of (seed.concept || '').matchAll(KERN)) {
        const grad = Number(m[1] || m[2])
        if (grad < sicherheit.min) verstoesse.push(`${seed.slug}: ${grad} °C < ${sicherheit.klasse} ${sicherheit.min} °C`)
      }
    }
    expect(verstoesse).toEqual([])
  })
})

describe('systemPrompt', () => {
  it('traegt die Sicherheits-Mindestwerte der Referenz ins Modell', () => {
    const prompt = systemPrompt()
    for (const [klasse, grad] of Object.entries(REFERENZ.sicherheit)) {
      expect(prompt).toContain(`${klasse}: ${grad}`)
    }
  })
})
