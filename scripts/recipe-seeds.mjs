#!/usr/bin/env node
/**
 * Steakakademie — Rezept-Seed-Nachschub
 *
 * Warum es das gibt: Bis zum 26.08.2026 kam jedes neue Rezept aus einer fest
 * verdrahteten Liste in scripts/recipe-agent.mjs. Als die Liste abgearbeitet war,
 * lief recipe-grow weiter taeglich durch — gruen, in 48 Sekunden, ohne ein einziges
 * Rezept. Siebzehn Tage lang fiel das niemandem auf. Dieses Skript haelt die
 * Nachschub-Liste data/rezept-seeds.json gefuellt, damit der Vorrat nicht mehr
 * lautlos auslaufen kann.
 *
 * Ablauf:
 *   1. Bestand zaehlen  — welche Seeds haben noch KEINE .mdx-Datei? Getrennt nach Stil
 *                         (vertraut / original), pausierte Seeds zaehlen nicht.
 *   2. Schwelle pruefen — je Stil genug Vorrat? Dann exit 0, kein API-Aufruf, keine Kosten.
 *   3. Nachlegen        — Claude schlaegt je fehlendem Stil neue Gerichte vor, unter
 *                         Ausschluss aller vorhandenen Slugs und Titel. Regel 11: JEDES
 *                         ZWEITE Rezept trifft den deutschen Geschmack (Stil `vertraut`),
 *                         deshalb wird dieser Vorrat genauso gefuellt wie der `original`e.
 *   4. Pruefen          — Pflichtfelder, erlaubte Kategorie/Schwierigkeit, keine Dubletten.
 *   5. Anhaengen        — data/rezept-seeds.json. Geht als Teil des Rezept-PRs durch Review.
 *
 * Aufruf:
 *   node scripts/recipe-seeds.mjs                  # nachlegen, wenn Vorrat < 10
 *   node scripts/recipe-seeds.mjs --min 20         # andere Schwelle
 *   node scripts/recipe-seeds.mjs --anzahl 12      # feste Zahl neuer Seeds erzwingen
 *   node scripts/recipe-seeds.mjs --dry-run        # nur zeigen, nichts schreiben
 */

import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { readFile, writeFile, readdir } from 'fs/promises'
import { existsSync, appendFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { schwerImText } from './lib/beschaffbarkeit.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = join(__dirname, '..')
const REZEPTE   = join(ROOT, 'content', 'rezepte')
const NACHSCHUB = join(ROOT, 'data', 'rezept-seeds.json')

dotenv.config({ path: join(ROOT, '.env.local') })

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return fallback
  const v = parseInt(process.argv[i + 1], 10)
  return Number.isFinite(v) ? v : fallback
}
const DRY_RUN = process.argv.includes('--dry-run')
const MIN     = arg('min', 10)      // Zielvorrat je Stil; nachgelegt wird unter MIN/2 je Stil
const ZIEL    = arg('anzahl', 0)    // 0 = automatisch je Stil auf MIN auffuellen; sonst gesamt, halb/halb

const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
}

// Die 11 BBQ-Hochburgen aus dem Master-Systemprompt. Rezepte kommen ausschliesslich
// aus diesen Laendern — plus dem deutschen Standardrepertoire des Altbestands.
// Regel 11: jedes zweite Rezept muss zusaetzlich den deutschen Geschmack treffen.
const LAENDER = ['USA', 'Argentinien', 'Brasilien', 'Suedafrika', 'Australien', 'Kanada',
                 'Thailand', 'Vietnam', 'Singapur', 'Tuerkei', 'Japan']

const STILE = ['vertraut', 'original']

const KATEGORIEN   = new Set(['fleisch', 'fisch', 'beilagen', 'saucen-rubs', 'desserts', 'wine-spirits'])
const SCHWIERIGKEIT = new Set(['Einfach', 'Mittel', 'Fortgeschritten', 'Profi'])
const PFLICHT = ['slug', 'kategorie', 'title', 'meatType', 'cookingMethod', 'difficulty', 'concept']

function toSlug(s) {
  return String(s).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function ladeNachschub() {
  if (!existsSync(NACHSCHUB)) return []
  try {
    const daten = JSON.parse(await readFile(NACHSCHUB, 'utf-8'))
    return Array.isArray(daten) ? daten : []
  } catch (err) {
    console.error(c.red(`  data/rezept-seeds.json ist kaputt: ${err.message}`))
    process.exit(1)
  }
}

/** Slugs, die es als Rezept schon gibt (Datei) — das ist die harte Dubletten-Sperre. */
async function vorhandeneSlugs() {
  try {
    return new Set((await readdir(REZEPTE)).filter(f => f.endsWith('.mdx')).map(f => f.slice(0, -4)))
  } catch {
    return new Set()
  }
}

/** Titel des Altbestands — damit das Modell nicht dasselbe Gericht neu benennt. */
async function vorhandeneTitel() {
  const titel = []
  try {
    for (const f of await readdir(REZEPTE)) {
      if (!f.endsWith('.mdx')) continue
      const t = (await readFile(join(REZEPTE, f), 'utf-8')).match(/^title:\s*"?(.+?)"?\s*$/m)
      if (t) titel.push(t[1])
    }
  } catch { /* Ordner noch leer */ }
  return titel
}

/** Blockformat statt JSON — dieselbe Entscheidung wie in recipe-agent.mjs, aus demselben Grund. */
function parseBloecke(text, stil) {
  const seeds = []
  for (const block of text.split(/\n(?=SLUG:)/)) {
    if (!/^SLUG:/m.test(block)) continue
    const feld = name => (block.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1] ?? '').trim()
    seeds.push({
      slug:          toSlug(feld('SLUG')),
      kategorie:     feld('KATEGORIE').toLowerCase(),
      title:         feld('TITEL'),
      meatType:      feld('HAUPTPRODUKT'),
      cookingMethod: feld('METHODE'),
      difficulty:    feld('SCHWIERIGKEIT'),
      concept:       feld('KONZEPT'),
      stil,
    })
  }
  return seeds
}

function pruefe(seed, belegt) {
  const fehler = []
  if (!STILE.includes(seed.stil)) fehler.push(`Stil ungueltig: ${seed.stil}`)
  // Beschaffbarkeit (Regel 11): schon im Seed abfangen, bevor ein Rezept daraus entsteht.
  const schwer = schwerImText(`${seed.title} ${seed.meatType} ${seed.concept}`)
  if (seed.stil === 'vertraut' && schwer.length) fehler.push(`schwer erhaeltlich fuer den deutschen Geschmack: ${schwer.join(', ')}`)
  if (seed.stil === 'original' && schwerImText(`${seed.title} ${seed.meatType}`).length) fehler.push(`Hauptprodukt schwer erhaeltlich: ${schwerImText(`${seed.title} ${seed.meatType}`).join(', ')}`)
  for (const f of PFLICHT) if (!seed[f]) fehler.push(`${f} fehlt`)
  if (seed.kategorie && !KATEGORIEN.has(seed.kategorie)) fehler.push(`Kategorie ungueltig: ${seed.kategorie}`)
  if (seed.difficulty && !SCHWIERIGKEIT.has(seed.difficulty)) fehler.push(`Schwierigkeit ungueltig: ${seed.difficulty}`)
  if (seed.concept && seed.concept.length < 120) fehler.push('Konzept zu duenn (< 120 Zeichen)')
  if (seed.slug && belegt.has(seed.slug)) fehler.push('Slug bereits vergeben')
  return fehler
}

/** Prompt je Stil. Gemeinsam: Grill, keine Dubletten, belegbar, BESCHAFFBAR. */
function baueSeedPrompt (stil, anzahl, titel) {
  const verboten = 'Bananenblatt, Betelblatt, Pandan, Binchotan, Rochen, Kaenguru, Snoek, Netzfett, fermentierte Wurst, Garnelenpaste, Achiote'
  const kopf = stil === 'vertraut'
    ? `Schlage ${anzahl} NEUE Grillgerichte vor, die den DEUTSCHEN GESCHMACK treffen und deren Zutaten leicht zu beschaffen sind (Regel 11: jedes zweite Rezept).`
    : `Schlage ${anzahl} NEUE Grillgerichte vor, die nah am Original bleiben.`

  const herkunft = stil === 'vertraut'
    ? `1. Jedes Gericht stammt aus einer dieser BBQ-Hochburgen: ${LAENDER.join(', ')}. Ob Suedafrika, USA oder Asien ist egal — entscheidend ist die Auswahl: nur Gerichte, die deutsche Griller (auch Hardcore-Griller ohne Experimentierlust) sofort ansprechen. Hauptgeschmack aus Fleisch, Rauch, Salz, Pfeffer, Paprika, Knoblauch, Zwiebel, Senf, Honig, Zitrone, Kraeutern. Keine Innereien-Spezialitaeten, kein Fermentiertes oder stark Suess-Saures als Hauptgeschmack.
   Verteile die Vorschlaege moeglichst gleichmaessig ueber die Laender; bevorzuge Laender, die in der Bestandsliste unten selten vorkommen.`
    : `1. Jedes Gericht stammt aus einer dieser BBQ-Hochburgen: ${LAENDER.join(', ')}.
   Verteile moeglichst gleichmaessig; bevorzuge Laender, die in der Bestandsliste unten selten vorkommen.
   Bevorzuge Gerichte, die deutsche Griller ohne grosse Gewoehnung essen.`

  return `Du planst die Rezept-Bibliothek von steakakademie.de (DACH-Markt, Grillen und BBQ).

${kopf} Regeln:

${herkunft}
2. Jedes Gericht wird ueber Feuer, Glut, Rauch oder Grillplatte zubereitet. Keine reinen Schmor-, Pfannen- oder Ofengerichte.
3. Keine Dublette und keine Variante eines Gerichts aus der Bestandsliste.
4. Authentisch und belegbar: existierende, benennbare Gerichte — nichts Erfundenes.
5. BESCHAFFBARKEIT (hart): Jede Zutat gibt es im deutschen Supermarkt, beim Metzger oder auf dem Wochenmarkt.${stil === 'vertraut' ? ' Keine einzige Spezialzutat.' : ' Hoechstens eine Spezialzutat, mit handelsueblichem Ersatz im Konzept.'} Nicht vorschlagen: ${verboten} und Vergleichbares. Beruht ein Gericht auf so einer Zutat, waehle ein anderes.

Antworte AUSSCHLIESSLICH in diesem Blockformat, ein Block je Gericht, Bloecke durch Leerzeile getrennt:

SLUG: [kleingeschrieben, nur a-z 0-9 und Bindestriche, ohne Umlaute]
TITEL: [deutscher Titel, max. 70 Zeichen]
KATEGORIE: [genau eines von: fleisch, fisch, beilagen, saucen-rubs, desserts, wine-spirits]
HAUPTPRODUKT: [z. B. "Rinderbrust", "Makrele", "Schweinenacken"]
METHODE: [z. B. "Indirekt, low & slow", "Direkt, mittlere Glut"]
SCHWIERIGKEIT: [genau eines von: Einfach, Mittel, Fortgeschritten, Profi]
KONZEPT: [3-4 Saetze: was das Gericht ausmacht, welcher Schritt ueber Gelingen oder Scheitern entscheidet, und welche fachliche Frage der Artikel beantwortet. Mindestens 200 Zeichen. Endet mit "Herkunft: <Land>."]

Kein Vorwort, kein Nachwort, keine Nummerierung, keine Markdown-Formatierung.

BESTANDSLISTE (nicht wiederholen):
${titel.map(t => `- ${t}`).join('\n')}`
}

async function main() {
  console.log(c.bold('\n  Steakakademie — Rezept-Seed-Nachschub\n'))

  const nachschub = await ladeNachschub()
  const dateien   = await vorhandeneSlugs()

  // Unerledigt = im Nachschub, aber noch keine .mdx-Datei, nicht pausiert. Das ist der
  // echte Vorrat. Ohne `stil` gilt ein Seed als original (Altbestand).
  const offen = nachschub.filter(s => !dateien.has(s.slug) && !s.pausiert)
  const stilVon = s => (s.stil === 'vertraut' ? 'vertraut' : 'original')
  const vorrat  = Object.fromEntries(STILE.map(st => [st, offen.filter(s => stilVon(s) === st).length]))
  const schwelle = Math.ceil(MIN / 2)

  console.log(`  ${dateien.size} Rezepte im Bestand`)
  console.log(`  ${nachschub.length} Seeds in data/rezept-seeds.json, davon ${c.bold(offen.length + '')} offen (${vorrat.vertraut} vertraut · ${vorrat.original} original)`)
  console.log(`  Schwelle: unter ${schwelle} je Stil wird auf ${MIN} aufgefuellt\n`)

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `vorrat=${offen.length}\nvorrat_deutsch=${vorrat.vertraut}\nvorrat_international=${vorrat.original}\n`)
  }

  // Bedarf je Stil. --anzahl N: N insgesamt, halb/halb (vertraut rundet auf).
  const bedarf = ZIEL > 0
    ? { vertraut: Math.ceil(ZIEL / 2), original: Math.floor(ZIEL / 2) }
    : Object.fromEntries(STILE.map(st => [st, vorrat[st] < schwelle ? Math.max(0, MIN - vorrat[st]) : 0]))

  if (STILE.every(st => bedarf[st] === 0)) {
    console.log(c.green(`  Vorrat reicht (${vorrat.vertraut} vertraut, ${vorrat.original} original, je >= ${schwelle}) — kein Nachschub noetig.\n`))
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(c.red('  ANTHROPIC_API_KEY fehlt — Nachschub kann nicht generiert werden.\n'))
    process.exit(1)
  }

  const belegt = new Set([...dateien, ...nachschub.map(s => s.slug)])
  const titel  = [...await vorhandeneTitel(), ...nachschub.map(s => s.title)]

  const neu = []
  for (const stil of STILE) {
    const anzahl = bedarf[stil]
    if (anzahl === 0) continue
    console.log(`  Generiere ${anzahl} neue Seeds (${stil})...\n`)

    const antwort = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      maxTokens: 8000,
      messages: [{ role: 'user', content: baueSeedPrompt(stil, anzahl, [...new Set(titel)]) }],
    })

    const vorschlaege = parseBloecke(antwort.text, stil)
    if (vorschlaege.length === 0) {
      console.error(c.red(`  Keine verwertbaren Bloecke (${stil}) — Format verfehlt.\n`))
      console.error(c.dim(antwort.text.slice(0, 500)))
      continue
    }

    for (const seed of vorschlaege) {
      const fehler = pruefe(seed, belegt)
      if (fehler.length) {
        console.log(`  ${c.yellow('verworfen')} ${seed.slug || '???'} — ${fehler.join('; ')}`)
        continue
      }
      belegt.add(seed.slug)
      titel.push(seed.title)
      neu.push(seed)
      console.log(`  ${c.green('ok')} ${seed.slug} ${c.dim(`(${stil} / ${seed.kategorie} / ${seed.difficulty})`)}`)
    }
  }

  if (neu.length === 0) {
    console.error(c.red('\n  Kein einziger Vorschlag hat die Pruefung bestanden.\n'))
    process.exit(1)
  }

  if (DRY_RUN) {
    console.log(c.yellow(`\n  Dry-run — ${neu.length} Seeds NICHT geschrieben.\n`))
    return
  }

  await writeFile(NACHSCHUB, JSON.stringify([...nachschub, ...neu], null, 2) + '\n', 'utf-8')
  console.log(c.green(`\n  ${neu.length} neue Seeds in data/rezept-seeds.json — Vorrat jetzt ${offen.length + neu.length}.\n`))

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## 🌱 Rezept-Seeds nachgelegt\n\n${neu.length} neue Gerichte (${neu.filter(s => s.stil === 'vertraut').length} vertraut), Vorrat jetzt **${offen.length + neu.length}**.\n\n` +
      neu.map(s => `- \`${s.slug}\` [${s.stil}] — ${s.title}`).join('\n') + '\n')
  }
}

main().catch(err => {
  console.error(c.red(`\n  Seed-Nachschub fehlgeschlagen: ${err.message}\n`))
  process.exit(1)
})
