// Regressionstest fuer den Rezept-Agenten.
//
// Anlass: Lauf #100 (14.09.2026) scheiterte an „Zu wenige Schritte". Der
// Schritt-Parser trennte mit split(' | ') und verlangte damit Leerzeichen um
// die Pipe; schrieb das Modell 'Titel|Dauer|Text', fiel der Schritt weg. Die
// Zutaten daneben wurden schon immer mit split('|') gelesen — dieselbe Datei,
// zwei Strenge-Grade, ein stiller Ausfall der Tagesproduktion.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'
import { parseStructuredText, validate, alleSeeds, sicherheitsKlasse, systemPrompt, slugsInOffenenRezeptPRs, buildMdx } from './recipe-agent.mjs'
import { pruefeDokument } from './lib/content-qualitaet.mjs'

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

  // Anlass (21.09.2026): 54 von 115 Rezepten endeten mitten im Satz, weil das
  // Token-Budget fuer den Artikeltext bei 1800 lag. Ab jetzt faellt so ein
  // Entwurf durch die Validierung, statt als fertiges Rezept live zu gehen.
  const vollstaendig = () => {
    const daten = parseStructuredText(KOPF + SCHRITT_FORMATE['ohne Leerzeichen'])
    daten.image = '/images/rezepte/yakitori-negima.jpg'
    daten.kategorie = SEED.kategorie
    daten.meatType = SEED.meatType
    daten.cookingMethod = SEED.cookingMethod
    daten.difficulty = SEED.difficulty
    return daten
  }

  it('meldet einen abgeschnittenen Artikeltext ueber finishReason', () => {
    const daten = vollstaendig()
    daten.body = 'Ein vollstaendiger Satz.'
    daten.__bodyFinishReason = 'length'
    expect(validate(daten, SEED)).toContain('Artikeltext abgeschnitten (finishReason=length)')
  })

  it('meldet einen Artikeltext, der ohne Satzzeichen endet', () => {
    const daten = vollstaendig()
    daten.body = '## Variationen\n\n**Gemischte Masse** aus Rind und Lamm ist in manchen Regionen'
    const fehler = validate(daten, SEED)
    expect(fehler.some(f => f.startsWith('Artikeltext endet ohne Satzzeichen'))).toBe(true)
  })

  it('laesst einen Artikeltext mit sauberem Satzende durch', () => {
    const daten = vollstaendig()
    daten.body = '## Variationen\n\n**Gemischte Masse** aus Rind und Lamm funktioniert in vielen Regionen.'
    daten.__bodyFinishReason = 'stop'
    expect(validate(daten, SEED)).toEqual([])
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

// ─────────────────────────────────────────────────────────────────────────────
// Dublettenpruefung gegen offene Rezept-PRs.
//
// Anlass (15.-18.09.2026): Der naechtliche Lauf erzeugte vier Mal dasselbe
// Rezept (tsukune-yakitori), weil Cache und .mdx nur im PR-Branch entstehen,
// der CI-Lauf aber main auscheckt. Vier PRs mit demselben Slug, drei davon mit
// Merge-Konflikt, vier Mal FLUX-Bildkosten.
//
// Geprueft wird gegen einen gestubbten fetch, damit der Test ohne Netz und ohne
// GitHub-Rate-Limit laeuft und das Verhalten im Fehlerfall festnagelbar ist.
describe('slugsInOffenenRezeptPRs', () => {
  const echterFetch = globalThis.fetch
  const echtesRepo = process.env.GITHUB_REPOSITORY

  const stub = (routen) => {
    globalThis.fetch = async (url) => {
      const pfad = String(url).replace('https://api.github.com/repos/Steakakademie/steakakademie-v2', '')
      const treffer = Object.entries(routen).find(([p]) => pfad.startsWith(p))
      if (!treffer) return { ok: false, status: 404, json: async () => ({}) }
      const wert = treffer[1]
      if (wert instanceof Error) throw wert
      if (typeof wert === 'number') return { ok: false, status: wert, json: async () => ({}) }
      return { ok: true, status: 200, json: async () => wert }
    }
  }

  beforeEach(() => { process.env.GITHUB_REPOSITORY = 'Steakakademie/steakakademie-v2' })
  afterEach(() => {
    globalThis.fetch = echterFetch
    if (echtesRepo === undefined) delete process.env.GITHUB_REPOSITORY
    else process.env.GITHUB_REPOSITORY = echtesRepo
  })

  it('meldet den Slug, der in einem offenen Rezept-PR liegt', async () => {
    stub({
      '/pulls?state=open': [{ number: 116, head: { ref: 'bot/rezept-20260916-0847' } }],
      '/pulls/116/files': [
        { filename: 'content/rezepte/tsukune-yakitori.mdx' },
        { filename: 'public/images/rezepte/tsukune-yakitori.jpg' },
        { filename: 'data/bildregister.yaml' },
      ],
    })
    expect([...await slugsInOffenenRezeptPRs()]).toEqual(['tsukune-yakitori'])
  })

  // Die Dateiliste enthaelt hier bewusst eine Rezept-MDX: sonst bliebe der Test
  // auch dann gruen, wenn der Branch-Filter fehlt (per Mutationstest geprueft).
  // Ein Hand-PR, der ein bestehendes Rezept korrigiert, ist kein Bot-Nachschub.
  it('ignoriert PRs, die keine Rezept-PRs sind — auch wenn sie ein Rezept anfassen', async () => {
    stub({
      '/pulls?state=open': [{ number: 142, head: { ref: 'fix/kochwissen-csv-nachziehen' } }],
      '/pulls/142/files': [{ filename: 'content/rezepte/tsukune-yakitori.mdx' }],
    })
    expect((await slugsInOffenenRezeptPRs()).size).toBe(0)
  })

  // Der eigentliche Grund fuer die API statt der Branch-Liste: ein geschlossener
  // PR laesst seinen Branch stehen. Wer Branches liest, haelt dessen Rezept fuer
  // ewig "in Arbeit" und erzeugt es nie wieder. state=open kennt den Unterschied.
  it('meldet nichts, wenn kein Rezept-PR offen ist (geschlossene Branches zaehlen nicht)', async () => {
    stub({ '/pulls?state=open': [] })
    expect((await slugsInOffenenRezeptPRs()).size).toBe(0)
  })

  it('gibt bei API-Fehler eine leere Menge zurueck, statt den Lauf abzubrechen', async () => {
    stub({ '/pulls?state=open': 503 })
    await expect(slugsInOffenenRezeptPRs()).resolves.toEqual(new Set())
  })

  it('faengt auch einen Netzwerkfehler ab', async () => {
    stub({ '/pulls?state=open': new Error('getaddrinfo ENOTFOUND') })
    await expect(slugsInOffenenRezeptPRs()).resolves.toEqual(new Set())
  })

  it('uebergeht einen PR, dessen Dateiliste nicht lesbar ist, und wertet die anderen aus', async () => {
    stub({
      '/pulls?state=open': [
        { number: 116, head: { ref: 'bot/rezept-20260916-0847' } },
        { number: 121, head: { ref: 'bot/rezept-20260917-0849' } },
      ],
      '/pulls/116/files': 500,
      '/pulls/121/files': [{ filename: 'content/rezepte/saba-shioyaki.mdx' }],
    })
    expect([...await slugsInOffenenRezeptPRs()]).toEqual(['saba-shioyaki'])
  })
})

// Quality-Gate im Agenten (21.09.2026): buildMdx muss auf einem validierten
// Kandidaten laufen und parsebares MDX liefern — sonst verwirft der Agent jedes
// Rezept am Gate statt an echten Inhaltsfehlern.
describe('Quality-Gate auf dem gebauten MDX', () => {
  const kandidat = () => {
    const d = parseStructuredText(KOPF + '1. Tare | 15 Min | Einkochen bis sirupartig.\n2. Spiesse | 10 Min | Abwechselnd aufziehen.')
    Object.assign(d, SEED, { author: 'Marco', authorSlug: 'marco', image: '/images/rezepte/x.jpg',
      body: 'Yakitori lebt von der Glut. Die Schenkel bleiben saftig, wenn sie bei 74 °C Kerntemperatur vom Rost kommen.' })
    return d
  }
  it('sauberer Kandidat: keine Gate-Fehler', () => {
    const fehler = pruefeDokument(buildMdx(kandidat()), { bereich: 'rezepte', slug: SEED.slug }).filter(b => b.schwere === 'fehler')
    expect(fehler).toEqual([])
  })
  it('abgeschnittener Body und Fahrenheit werden am Gate gefangen', () => {
    const d = kandidat()
    d.body = 'Grill auf 225°F bringen. Die Tare aus Yuzu-'
    const regeln = pruefeDokument(buildMdx(d), { bereich: 'rezepte', slug: SEED.slug }).map(b => b.regel)
    expect(regeln).toContain('fahrenheit')
    expect(regeln).toContain('abgeschnitten')
  })
})
