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
import { ohneVerneinung, zeitFehler, zutatOhneNameFehler, korrekturBlock, SEO_TITLE_MAX, ohneMarkenzusatz, parseStructuredText, validate, alleSeeds, sicherheitsKlasse, systemPrompt, slugsInOffenenRezeptPRs, buildMdx, seedStil, ordneNachRotation, schwerErhaeltlich, gaumenBlock } from './recipe-agent.mjs'
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

// ─── Gaumen-Rotation + Beschaffbarkeit (Regel 11, 29.09.2026) ────────────────
// Anlass: Die letzten Rezepte waren zu fremd, die Zutaten kaum zu bekommen.

const mk = (slug, stil) => ({ slug, stil })

describe('ordneNachRotation — jedes zweite Rezept trifft den deutschen Geschmack', () => {
  const offen = [mk('o1', 'original'), mk('o2', 'original'), mk('o3', 'original'), mk('v1', 'vertraut'), mk('v2', 'vertraut'), mk('v3', 'vertraut')]

  it('beginnt bei Gleichstand mit vertraut und wechselt strikt ab', () => {
    expect(ordneNachRotation(offen, []).map(s => s.slug)).toEqual(['v1', 'o1', 'v2', 'o2', 'v3', 'o3'])
  })

  it('setzt nach einem vertrauten Rezept mit original fort', () => {
    expect(ordneNachRotation(offen, [mk('x', 'vertraut')])[0].slug).toBe('o1')
  })

  it('zaehlt Altbestand ohne stil nicht mit', () => {
    expect(ordneNachRotation(offen, [{ slug: 'alt' }, { slug: 'alt2' }])[0].slug).toBe('v1')
  })

  it('laeuft mit dem anderen Stil weiter, wenn einer aufgebraucht ist — verliert nichts', () => {
    const r = ordneNachRotation([mk('o1', 'original'), mk('o2', 'original')], [])
    expect(r.map(s => s.slug)).toEqual(['o1', 'o2'])
  })

  it('behandelt Seeds ohne stil als original', () => {
    expect(seedStil({ slug: 'a' })).toBe('original')
    expect(seedStil({ slug: 'a', stil: 'vertraut' })).toBe('vertraut')
  })
})

describe('Beschaffbarkeit', () => {
  it.each([
    ['Bananenblätter', ['bananenblätter']],
    ['Betelblatt', ['betelblatt']],
    ['Rochenflügel', ['rochenflügel']],
    ['Binchotan-Kohle', ['binchotan']],
  ])('erkennt %s als schwer erhältlich', (name, erwartet) => {
    expect(schwerErhaeltlich([{ name }])).toEqual(erwartet)
  })

  it('haelt gebrochenen Pfeffer nicht fuer Rochen', () => {
    expect(schwerErhaeltlich([{ name: 'gebrochener schwarzer Pfeffer' }])).toEqual([])
  })

  it('laesst Alltagszutaten durch', () => {
    expect(schwerErhaeltlich([{ name: 'Hähnchenschenkel' }, { name: 'Sojasauce' }, { name: 'Senf' }, { name: 'Honig' }])).toEqual([])
  })

  const zutaten = (...namen) => namen.map(name => ({ amount: 1, unit: 'Stk', name }))
  const kopfMit = (extra) => KOPF.replace('LAND: Japan', `LAND: Japan\n${extra}`)
  const SEED_V = { ...SEED, stil: 'vertraut' }

  it('vertraut: lehnt eine schwer erhaeltliche Zutat ab', () => {
    const d = datensatz(kopfMit('BESCHAFFUNG: Supermarkt'), SEED_V)
    d.ingredients = zutaten('Hähnchenschenkel', 'Bananenblätter', 'Sojasauce', 'Mirin', 'Zucker')
    expect(validate(d, SEED_V).join(' ')).toMatch(/Schwer erhältliche Zutat.*bananenblätter/)
  })

  it('vertraut: verlangt BESCHAFFUNG und lehnt Asia-Laden/Online ab', () => {
    const ohne = datensatz(KOPF, SEED_V)
    expect(validate(ohne, SEED_V)).toContain('Pflichtfeld fehlt: BESCHAFFUNG (Rezept für den deutschen Geschmack)')
    const asia = datensatz(kopfMit('BESCHAFFUNG: Supermarkt + Asia-Laden/Online'), SEED_V)
    expect(validate(asia, SEED_V).join(' ')).toMatch(/nicht alltagstauglich/)
  })

  it('vertraut: Supermarkt + Metzger ohne Spezialzutat besteht', () => {
    const d = datensatz(kopfMit('BESCHAFFUNG: Supermarkt + Metzger'), SEED_V)
    expect(validate(d, SEED_V)).toEqual([])
  })

  it('original: eine Spezialzutat ist erlaubt, zwei nicht', () => {
    const eine = datensatz(KOPF, SEED); eine.ingredients = zutaten('Hähnchen', 'Bananenblätter', 'Salz', 'Pfeffer', 'Öl')
    expect(validate(eine, SEED)).toEqual([])
    const zwei = datensatz(KOPF, SEED); zwei.ingredients = zutaten('Hähnchen', 'Bananenblätter', 'Pandan', 'Salz', 'Öl')
    expect(validate(zwei, SEED).join(' ')).toMatch(/Zu viele schwer erhältliche Zutaten/)
  })

  it('der Gaumen-Block unterscheidet die Stile', () => {
    expect(gaumenBlock(SEED_V)).toMatch(/DEUTSCHER GESCHMACK/)
    expect(gaumenBlock(SEED)).toMatch(/NAH AM ORIGINAL/)
  })
})

describe('data/rezept-seeds.json — Gaumen-Regel', () => {
  const seeds = JSON.parse(readFileSync(new URL('../data/rezept-seeds.json', import.meta.url), 'utf-8'))
  const offen = seeds.filter(s => s.stil && !s.pausiert)

  it('jeder Seed mit stil hat einen gueltigen Wert', () => {
    for (const s of seeds) if (s.stil) expect(['vertraut', 'original']).toContain(s.stil)
  })

  it('pausierte Seeds nennen einen Grund', () => {
    for (const s of seeds.filter(x => x.pausiert)) expect(String(s.pausiert).length).toBeGreaterThan(10)
  })

  it('kein offener Seed haengt an einer schwer erhaeltlichen Zutat im Titel', () => {
    for (const s of offen) expect(schwerErhaeltlich([{ name: `${s.title} ${s.meatType}` }])).toEqual([])
  })
})

describe('seoTitle — Markenzusatz', () => {
  // layout.tsx haengt '| Steakakademie' selbst an; im seoTitle waere es doppelt.
  it('entfernt „| Steakakademie" am Ende', () => {
    expect(ohneMarkenzusatz('Flank Steak mit Rote-Bete-Salsa | Steakakademie')).toBe('Flank Steak mit Rote-Bete-Salsa')
  })
  it('entfernt auch Gedankenstrich-Varianten und Gross-/Kleinschreibung', () => {
    expect(ohneMarkenzusatz('Damper-Brot – steakakademie')).toBe('Damper-Brot')
    expect(ohneMarkenzusatz('Damper-Brot|Steakakademie  ')).toBe('Damper-Brot')
  })
  it('laesst innere Trenner und Titel ohne Marke unveraendert', () => {
    expect(ohneMarkenzusatz('Fraldinha Churrasco | Brasilien-Spiess')).toBe('Fraldinha Churrasco | Brasilien-Spiess')
    expect(ohneMarkenzusatz('Steakakademie-Klassiker vom Grill')).toBe('Steakakademie-Klassiker vom Grill')
  })
  it('der Parser wendet es auf SEO_TITLE an', () => {
    const daten = parseStructuredText(KOPF + 'SEO_TITLE: Yakitori Negima Rezept | Steakakademie\n')
    expect(daten.seoTitle).toBe('Yakitori Negima Rezept')
  })
  // Die Zeile SEO_TITLE steht in generateRecipe() (ruft die API auf), nicht im
  // System-Prompt — deshalb wird der Quelltext gelesen, wie pruefstand.test.mjs es tut.
  it('der Anfrage-Prompt verlangt keinen Markenzusatz und nennt die Konstante', () => {
    const quelle = readFileSync(new URL('./recipe-agent.mjs', import.meta.url), 'utf8')
    const zeile = quelle.split('\n').find((z) => z.startsWith('SEO_TITLE:'))
    expect(zeile).toBeDefined()
    expect(zeile).toContain('${SEO_TITLE_MAX}')
    expect(zeile).toMatch(/OHNE Markenzusatz/)
    expect(zeile).not.toMatch(/\|\s*Steakakademie\]/)
  })
})

describe('validate — seoTitle-Laenge', () => {
  function datensatz(seoTitle) {
    const daten = parseStructuredText(KOPF + SCHRITT_FORMATE['ohne Leerzeichen'])
    daten.image = '/images/rezepte/yakitori-negima.jpg'
    daten.kategorie = SEED.kategorie
    daten.meatType = SEED.meatType
    daten.cookingMethod = SEED.cookingMethod
    daten.difficulty = SEED.difficulty
    daten.seoTitle = seoTitle
    return daten
  }

  it('die Grenze ist 60 minus Layout-Suffix (16 Zeichen)', () => {
    expect(SEO_TITLE_MAX).toBe(44)
  })
  it('laesst genau SEO_TITLE_MAX Zeichen durch', () => {
    expect(validate(datensatz('x'.repeat(SEO_TITLE_MAX)), SEED)).toEqual([])
  })
  it('meldet einen seoTitle ueber der Grenze', () => {
    const fehler = validate(datensatz('x'.repeat(SEO_TITLE_MAX + 1)), SEED)
    expect(fehler).toHaveLength(1)
    expect(fehler[0]).toMatch(/^seoTitle zu lang: 45 Zeichen \(max\. 44/)
  })
  it('ein fehlender seoTitle ist kein Fehler (optionales Feld)', () => {
    expect(validate(datensatz(undefined), SEED)).toEqual([])
    expect(validate(datensatz(''), SEED)).toEqual([])
  })
})

describe('Retry mit Fehler-Rueckmeldung', () => {
  const quelle = readFileSync(new URL('./recipe-agent.mjs', import.meta.url), 'utf8')

  it('korrekturBlock ist leer, solange es keine Ablehnung gab', () => {
    expect(korrekturBlock([])).toBe('')
    expect(korrekturBlock(undefined)).toBe('')
    expect(korrekturBlock(['', '   '])).toBe('')
  })
  it('korrekturBlock nennt jeden Ablehnungsgrund', () => {
    const block = korrekturBlock(['seoTitle zu lang: 51 Zeichen', 'Zu wenige Schritte'])
    expect(block).toContain('KORREKTUR')
    expect(block).toContain('- seoTitle zu lang: 51 Zeichen')
    expect(block).toContain('- Zu wenige Schritte')
  })
  it('korrekturBlock kappt Laenge und Anzahl und glaettet Zeilenumbrueche', () => {
    const viele = Array.from({ length: 12 }, (_, i) => `Fehler ${i}`)
    expect(korrekturBlock(viele).split('\n').filter((z) => z.startsWith('- '))).toHaveLength(8)
    const lang = korrekturBlock(['x'.repeat(1000)])
    expect(lang.split('\n')[1].length).toBeLessThanOrEqual(302)
    expect(korrekturBlock(['a\nb\n\nc'])).toContain('- a b c')
  })
  it('die Schleife reicht die Validierungsfehler an den naechsten Versuch weiter', () => {
    expect(quelle).toContain('generateRecipe(seed, rueckmeldung)')
    expect(quelle).toMatch(/letzteFehler = errors\s+rueckmeldung = errors/)
  })
  it('ein API-Fehler wird NICHT als Rueckmeldung ans Modell gegeben', () => {
    expect(quelle).not.toMatch(/rueckmeldung = \[err\.message\]/)
    expect(quelle).toMatch(/letzteFehler = \[err\.message\]/)
  })
  it('beide Prompts (Metadaten und Artikel) tragen den Block, der System-Prompt nicht', () => {
    expect(quelle.match(/\$\{korrektur\}/g)).toHaveLength(2)
    expect(systemPrompt()).not.toContain('KORREKTUR')
  })
})

describe('Zeitfelder — Tage als Stunden (Lauf vom 05.10.2026, montreal-smoked-meat)', () => {
  // Das Modell schrieb P7DT12H20M (gueltiges ISO 8601, aber die Anzeige liest nur PT…H…M)
  // und wiederholte es im zweiten Versuch, weil die Meldung nur „kein ISO 8601" sagte.
  const quelle = readFileSync(new URL('./recipe-agent.mjs', import.meta.url), 'utf8')

  function datensatz(zeiten) {
    const daten = parseStructuredText(KOPF + SCHRITT_FORMATE['ohne Leerzeichen'])
    daten.image = '/images/rezepte/yakitori-negima.jpg'
    daten.kategorie = SEED.kategorie
    daten.meatType = SEED.meatType
    daten.cookingMethod = SEED.cookingMethod
    daten.difficulty = SEED.difficulty
    Object.assign(daten, zeiten)
    return daten
  }

  it('lehnt eine Dauer mit Tagen weiter ab — die Anzeige koennte sie nicht lesen', () => {
    const fehler = validate(datensatz({ totalTime: 'P7DT12H20M' }), SEED)
    expect(fehler).toHaveLength(1)
    expect(fehler[0]).toMatch(/^totalTime muss mit PT beginnen/)
  })
  it('nimmt dieselbe Dauer in Stunden an', () => {
    expect(validate(datensatz({ totalTime: 'PT180H20M' }), SEED)).toEqual([])
  })
  it('die Meldung nennt die Loesung, und sie erreicht das Modell ueber korrekturBlock', () => {
    const fehler = validate(datensatz({ totalTime: 'P7DT12H20M' }), SEED)
    expect(fehler[0]).toContain('PT168H')
    expect(korrekturBlock(fehler)).toContain('PT168H')
    expect(korrekturBlock(fehler)).toContain('P7DT12H20M')
  })
  it('gilt fuer alle drei Zeitfelder', () => {
    for (const feld of ['prepTime', 'cookTime', 'totalTime']) {
      const fehler = validate(datensatz({ [feld]: 'P1D' }), SEED)
      expect(fehler.join(' ')).toContain(`${feld} muss mit PT beginnen`)
    }
    expect(zeitFehler('cookTime', 'P2D')).toMatch(/^cookTime muss mit PT beginnen .* war: P2D$/)
  })
  it('der Anfrage-Prompt verlangt PT…H…M auch bei Tagen', () => {
    const zeile = quelle.split('\n').find((z) => z.startsWith('TOTAL_TIME:'))
    expect(zeile).toBeDefined()
    expect(zeile).toContain('PT168H')
    expect(zeile).toMatch(/nie P7D/)
  })
})

// imagePrompt ohne Verneinung. FLUX kennt keine Negativ-Prompts und zeichnet das Genannte eher
// ein: „Not: … no coleslaw" brachte Krautsalat, „whole brisket in background" Grillstreifen und
// Flamme ins Montreal-Bild (05.10.2026). Der Prompt verlangte das „Not:" sogar ausdruecklich.
describe('imagePrompt — keine Verneinung', () => {
  const quelle = readFileSync(new URL('./recipe-agent.mjs', import.meta.url), 'utf8')

  it('entfernt den „Not:"-Schwanz und schliesst mit einem Punkt', () => {
    expect(ohneVerneinung('Sliced flank steak on a tortilla. Not: whole steak, no char marks.'))
      .toBe('Sliced flank steak on a tortilla.')
    expect(ohneVerneinung('Sliced steak on a board, Not: whole steak')).toBe('Sliced steak on a board,.')
  })
  it('laesst einen Prompt ohne Verneinung unveraendert (und ergaenzt nur den Schlusspunkt)', () => {
    expect(ohneVerneinung('Thin slices of beef on rye bread.')).toBe('Thin slices of beef on rye bread.')
    expect(ohneVerneinung('Thin slices of beef on rye bread')).toBe('Thin slices of beef on rye bread.')
  })
  it('der Parser wendet es auf IMAGE_PROMPT an', () => {
    const daten = parseStructuredText(KOPF)
    expect(KOPF).toMatch(/IMAGE_PROMPT:.*Not:/)       // die Fixture traegt die Verneinung noch
    expect(daten.imagePrompt).not.toMatch(/Not:/i)
    expect(daten.imagePrompt).toMatch(/^Yakitori skewers of chicken thigh cubes/)
  })
  it('der Anfrage-Prompt verlangt keine Verneinung mehr, sondern verbietet sie', () => {
    const zeile = quelle.split('\n').find((z) => z.startsWith('IMAGE_PROMPT:'))
    expect(zeile).toBeDefined()
    expect(zeile).not.toMatch(/zwingend "Not:"/)
    expect(zeile).toMatch(/NIE Verneinungen/)
    expect(zeile).toMatch(/kein "Not:"/)
  })
})

// ─────────────────────────────────────────────────
// Zutat ohne Namen (06.10.2026).
//
// Anlass: Nuea Yang Nam Tok (Lauf 37422864297) kam mit zwei Zutaten durch, deren Name leer war
// („1 nach Geschmack", „1 frisch gemahlen" ohne Zutat). validate() kannte keine Namenspruefung;
// aufgefallen ist es erst im Review-Text des PR. Jetzt lehnt validate() das ab, der Text geht
// beim Retry ans Modell. Die Rohzeile aus dem Lauf liegt nicht vor; getestet werden die beiden
// moeglichen Formen (leeres Namensfeld mit und ohne Anmerkung).
describe('validate — Zutat ohne Namen', () => {
  function datensatz (zutatenZeilen) {
    const text = KOPF.replace(/INGREDIENTS:[\s\S]*?\n\nSTEPS:\n/, `INGREDIENTS:\n${zutatenZeilen}\n\nSTEPS:\n`)
    const daten = parseStructuredText(text + SCHRITT_FORMATE['ohne Leerzeichen'])
    daten.image = '/images/rezepte/yakitori-negima.jpg'
    daten.meatType = SEED.meatType
    daten.cookingMethod = SEED.cookingMethod
    return daten
  }
  const GUT = '- 600 | g | Haehnchenschenkel | gewuerfelt\n- 4 | Stangen | Negi-Lauch\n- 100 | ml | Sojasauce\n- 100 | ml | Mirin\n- 2 | EL | Zucker'

  it('lehnt eine Zeile mit leerem Namensfeld ab und nennt die Nummer', () => {
    const fehler = validate(datensatz(`${GUT}\n- 1 | nach Geschmack |`), SEED)
    expect(fehler.some((f) => /^Zutat 6 hat keinen Namen \(Menge\/Einheit: 1 nach Geschmack\)/.test(f))).toBe(true)
  })

  it('lehnt auch ein leeres Namensfeld mit Anmerkung ab', () => {
    const fehler = validate(datensatz(`${GUT}\n- 1 | frisch gemahlen | | schwarzer Pfeffer`), SEED)
    expect(fehler.some((f) => /^Zutat 6 hat keinen Namen/.test(f))).toBe(true)
  })

  it('lehnt einen Namen aus reinem Leerraum ab', () => {
    const daten = datensatz(GUT)
    daten.ingredients[2].name = '   '
    expect(validate(daten, SEED).some((f) => /^Zutat 3 hat keinen Namen/.test(f))).toBe(true)
  })

  it('meldet jede betroffene Zeile einzeln', () => {
    const fehler = validate(datensatz(`${GUT}\n- 1 | nach Geschmack |\n- 1 | frisch gemahlen |`), SEED)
    expect(fehler.filter((f) => /hat keinen Namen/.test(f))).toHaveLength(2)
  })

  it('laesst die vorgesehene Schreibweise fuer Salz ohne Menge durch', () => {
    const fehler = validate(datensatz(`${GUT}\n- 1 | Prise | Salz | nach Geschmack`), SEED)
    expect(fehler.filter((f) => /Zutat/.test(f))).toEqual([])
  })

  it('der Fehlertext nennt die Loesung (er geht beim Retry ans Modell)', () => {
    expect(zutatOhneNameFehler(2, { amount: 1, unit: 'Prise', name: '' })).toMatch(/1 \| Prise \| Salz \| nach Geschmack/)
  })

  // Der Prompt steckt in generateRecipe() (ruft die API) und ist nicht einzeln aufrufbar —
  // deshalb Quelltext-Ebene: Der Hinweis muss im Zutaten-Abschnitt stehen, nicht irgendwo.
  it('der Prompt nennt im Zutaten-Abschnitt die Schreibweise fuer Zutaten ohne feste Menge', () => {
    const quelle = readFileSync(new URL('./recipe-agent.mjs', import.meta.url), 'utf8')
    const von = quelle.indexOf('\nINGREDIENTS:\n- [Menge]')
    const bis = quelle.indexOf('\nSTEPS:\n1. [Schritt-Titel]')
    expect(von).toBeGreaterThan(-1)
    expect(bis).toBeGreaterThan(von)
    const abschnitt = quelle.slice(von, bis)
    expect(abschnitt).toContain('Jede Zutat braucht einen Namen')
    expect(abschnitt).toContain('- 1 | Prise | Salz | nach Geschmack')
  })
})
