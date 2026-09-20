#!/usr/bin/env node
/**
 * Steakakademie Recipe Agent
 *
 * Generiert vollständige Rezept-MDX-Dateien via Claude und schreibt sie nach content/rezepte/.
 *
 * Pipeline:
 *   1. SEED     — Definierte Rezept-Liste als Startpunkt
 *   2. CACHE    — Bereits generierte Rezepte werden übersprungen
 *   3. GENERATE — Claude (Sonnet) generiert strukturiertes JSON für jedes Rezept
 *   4. WRITE    — MDX-Datei nach content/rezepte/<slug>.mdx
 *
 * Usage:
 *   node scripts/recipe-agent.mjs            # Nur neue Rezepte generieren
 *   node scripts/recipe-agent.mjs --dry-run  # Vorschau ohne Datei-Schreibzugriff
 *   node scripts/recipe-agent.mjs --force    # Alle Rezepte neu generieren
 *   node scripts/recipe-agent.mjs --slug brisket-low-slow  # Einzelnes Rezept
 */

import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { readFile, writeFile, mkdir, access } from 'fs/promises'
import { existsSync, appendFileSync, readFileSync } from 'fs'
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import dotenv from 'dotenv'
import yaml from 'js-yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT       = join(__dirname, '..')
const REZEPTE    = join(ROOT, 'content', 'rezepte')
const CACHE_FILE = join(REZEPTE, '.recipe-cache.json')
// Nachschub-Liste: wird von scripts/recipe-seeds.mjs gepflegt und liegt bewusst
// als Daten-Datei im Repo — die fest verdrahtete SEED_RECIPES-Liste unten war am
// 26.08.2026 abgearbeitet, danach lief recipe-grow 17 Tage grün und ohne Ergebnis.
const NACHSCHUB   = join(ROOT, 'data', 'rezept-seeds.json')

dotenv.config({ path: join(ROOT, '.env.local') })

const DRY_RUN    = process.argv.includes('--dry-run')
const FORCE      = process.argv.includes('--force')
const SLUG_ONLY  = process.argv.includes('--slug')
  ? process.argv[process.argv.indexOf('--slug') + 1]
  : null
// --limit N → max. N neue Rezepte pro Lauf (z. B. „täglich 1"). 0/fehlt = unbegrenzt.
const LIMIT = process.argv.includes('--limit')
  ? parseInt(process.argv[process.argv.indexOf('--limit') + 1], 10) || 0
  : 0

const TODAY = new Date().toISOString().split('T')[0]

// ─── FARB-UTILS ───────────────────────────────────────────────────────────────

const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
}

// ─── SEED-REZEPTE ─────────────────────────────────────────────────────────────
// Alle Rezepte die der Agent generieren soll. Neue Einträge werden automatisch
// beim nächsten Build/Dev aufgenommen.

const SEED_RECIPES = [
  // ── FLEISCH ─────────────────────────────────────────────────────────────────
  {
    slug:          'brisket-low-slow',
    kategorie:     'fleisch',
    title:         'Texas Brisket Low & Slow: Das 14-Stunden-Protokoll',
    meatType:      'Brisket',
    cookingMethod: 'Low & Slow',
    difficulty:    'Fortgeschritten',
    concept:       'Klassisches Texas Brisket im Offset-Smoker. Packer Cut, 14h bei 110°C, Aaron Franklins Philosophie: nur Salz und Pfeffer. Bark-Bildung, Stall-Phase, Texas Crutch optional. Schwerpunkt: Kollagen-Umwandlung und Plateauphase.',
  },
  {
    slug:          'pulled-pork-boston-butt',
    kategorie:     'fleisch',
    title:         'Pulled Pork vom Smoker: 12 Stunden, kein Kompromiss',
    meatType:      'Schweineschulter',
    cookingMethod: 'Low & Slow',
    difficulty:    'Mittel',
    concept:       'Boston Butt (Schweineschulter ohne Knochen, ca. 2,5 kg) im Smoker bei 110°C. Overnight-Rub, Apfelessig-Spritz, Texas Crutch bei 74°C Kerntemperatur. Ziel 93°C. Methode zum Zerrupfen, Bone-Test.',
  },
  {
    slug:          'tomahawk-reverse-sear',
    kategorie:     'fleisch',
    title:         'Tomahawk Reverse Sear: 900-Grad-Finish oder Gusseisen',
    meatType:      'Tomahawk Steak',
    cookingMethod: 'Reverse Sear',
    difficulty:    'Mittel',
    concept:       '1 kg Tomahawk Steak, 5 cm Dicke. Reverse Sear: Backofen 100°C bis Kern 48°C, dann finales Sear in der Gusseisenpfanne oder Oberhitzegrill bei 900°C. Knochenhandling, Garadvantage durch Knochen als Isolator.',
  },
  {
    slug:          't-bone-direktgrill',
    kategorie:     'fleisch',
    title:         'T-Bone auf dem Direktgrill: 3-Zonen-Technik',
    meatType:      'T-Bone Steak',
    cookingMethod: 'Direktgrill',
    difficulty:    'Einfach',
    concept:       'T-Bone besitzt zwei unterschiedliche Muskeln (Filet + Rumpsteak) die verschiedene Garzeiten benötigen. 3-Zonen-Grill-Setup mit direkter und indirekter Hitze. Filetseite zur schwächeren Zone, Rumpsteak zur heißen.',
  },
  {
    slug:          'smash-burger',
    kategorie:     'fleisch',
    title:         'Smash Burger: Die Wissenschaft des perfekten Crusts',
    meatType:      'Rinderhackfleisch',
    cookingMethod: 'Smash-Technik',
    difficulty:    'Einfach',
    concept:       '80/20 Rinderhack (selbst gewolft oder Metzger). Gusseisenpfanne auf Maximum, keine Fettzugabe. Balls formen, flach drücken auf 1 cm, 90 Sekunden je Seite. American Cheese für den Melt. Das Gegenteil von "zartem Burger".',
  },
  // ── BEILAGEN ────────────────────────────────────────────────────────────────
  {
    slug:          'smoked-baked-potatoes',
    kategorie:     'beilagen',
    title:         'Smoked Baked Potatoes: Die Kartoffel aus dem Smoker',
    meatType:      'Kartoffel',
    cookingMethod: 'Smoker',
    difficulty:    'Einfach',
    concept:       'Festkochende Kartoffeln direkt in den Smoker, 2h bei 135°C mit Hickory-Holz. Keine Alufolie. Außen knusprig, innen weich, mit Rauchgeschmack durchzogen. Toppings: Saure Sahne, Schnittlauch, geriebenem Cheddar.',
  },
  {
    slug:          'texas-coleslaw',
    kategorie:     'beilagen',
    title:         'Texas Coleslaw: Der Klassiker ohne Süßlichkeit',
    meatType:      'Kohl',
    cookingMethod: 'Kalt mariniert',
    difficulty:    'Einfach',
    concept:       'Kein Zucker, kein Miracel Whip. Weißkohl fein hobeln, Salzziehen 30 Min., ausdrücken. Dressing: Apfelessig, Dijon, Mayonnaise, Sellerie-Salz, schwarzer Pfeffer. Muss 2h ziehen. Kontrastiert fette BBQ-Fleischgerichte.',
  },
  {
    slug:          'mac-and-cheese-smoker',
    kategorie:     'beilagen',
    title:         'Mac & Cheese vom Smoker: Cheddar-Kruste und Rauch',
    meatType:      'Pasta',
    cookingMethod: 'Smoker',
    difficulty:    'Mittel',
    concept:       'Selbstgemachte Käsesauce (Mehlschwitze, Vollmilch, Cheddar, Gruyère), Macaroni al dente. In Gusseisen im Smoker 45 Min. bei 150°C. Pankobrösel-Kruste. Leichter Hickory-Rauch als Tiefe.',
  },
  // ── SAUCEN & RUBS ───────────────────────────────────────────────────────────
  {
    slug:          'texas-dry-rub',
    kategorie:     'saucen-rubs',
    title:         'Texas Dry Rub: Die Franklin BBQ Formel',
    meatType:      'Gewürzmischung',
    cookingMethod: 'Kalt mischen',
    difficulty:    'Einfach',
    concept:       'Aaron Franklins Grundprinzip: 50% grobes Meersalz, 50% schwarzer Pfeffer (grob gemahlen). Kein Zucker, kein Paprika, kein Knoblauch. Erklärung warum die Einfachheit die Bark-Bildung maximiert. Variationen für Ribs und Chicken.',
  },
  {
    slug:          'kansas-city-bbq-sauce',
    kategorie:     'saucen-rubs',
    title:         'Kansas City BBQ Sauce: Die süß-rauchige Klassikerin',
    meatType:      'Sauce',
    cookingMethod: 'Einkochen',
    difficulty:    'Einfach',
    concept:       'Tomatenmark-Basis, brauner Zucker, Apfelessig, Worcestershire, Liquid Smoke, Chipotle. 20 Min. einkochen. Dickere Konsistenz als Carolina-Saucen. Klassisch für Ribs und Pulled Pork. Sterile Aufbewahrung 4 Wochen.',
  },
  {
    slug:          'carolina-mustard-sauce',
    kategorie:     'saucen-rubs',
    title:         'Carolina Mustard Sauce: Die gelbe BBQ-Säure',
    meatType:      'Sauce',
    cookingMethod: 'Einkochen',
    difficulty:    'Einfach',
    concept:       'Typisch South Carolina. Senf-Basis (gelber Senf + Dijon), Apfelessig, brauner Zucker, Worcestershire, Tabasco. 10 Min. köcheln. Keine Tomaten. Perfekt zu Pulled Pork und Ribs. Erklärt die regionale BBQ-Sauce-Geografie der USA.',
  },
  // ── DESSERTS ────────────────────────────────────────────────────────────────
  {
    slug:          'gegrillter-pfirsich-bourbon',
    kategorie:     'desserts',
    title:         'Gegrillter Pfirsich mit Bourbon-Karamell-Glasur',
    meatType:      'Pfirsich',
    cookingMethod: 'Direktgrill',
    difficulty:    'Einfach',
    concept:       'Reife Pfirsiche halbiert, Kernhöhle mit Bourbon-Butter-Honig füllen. Direktgrill 5 Min. bis Grill-Marks entstehen. Karamellisierung durch die Hitze. Vanilleeis dazu. Das klassische Abschluss-Dessert nach einem BBQ.',
  },
  // ── WINE & SPIRITS ──────────────────────────────────────────────────────────
  {
    slug:          'bourbon-brisket-pairing',
    kategorie:     'wine-spirits',
    title:         'Bourbon zum Brisket: Die Wissenschaft des Rauch-Pairings',
    meatType:      'Pairing-Guide',
    cookingMethod: 'Tasting',
    difficulty:    'Mittel',
    concept:       'Warum Bourbon und Brisket chemisch zusammenpassen: Vanillin aus Eichenfässern resoniert mit Rauch-Phenolen. Fünf konkrete Empfehlungen: Buffalo Trace bis Blanton\'s. Für jeden Budgetrahmen. Auch: Warum man Brisket nicht mit peated Whisky trinken sollte.',
  },

  // ── KATALOG-ALIGNED QUEUE (Otto Gourmet / Albers) — Premium-Cuts, je mit Herkunft ──
  { slug: 'entrecote-grillen', kategorie: 'fleisch', title: 'Entrecôte perfekt grillen', meatType: 'Entrecôte', cookingMethod: 'Heiß angrillen + indirekt', difficulty: 'Mittel', concept: 'Deutschland-Standard: Entrecôte (3,5–5 cm) bei 280–300 Grad direkt pro Seite 60–90 Sekunden angrillen, dann indirekt bei rund 160 Grad Deckel bis 54 Grad Kern, 5–7 Minuten auf vorgewaermtem Holzbrett rasten. Herkunft: Deutschland.' },
  { slug: 'porterhouse-grill', kategorie: 'fleisch', title: 'Porterhouse vom Grill', meatType: 'Porterhouse', cookingMethod: 'Direkt + indirekt', difficulty: 'Fortgeschritten', concept: 'US-Klassiker: Porterhouse vereint Filet und Roastbeef am T-Knochen. Filetseite kuehler positionieren, beide Muskeln gleichmaessig auf 54 Grad bringen. Herkunft: USA.' },
  { slug: 'roastbeef-reverse-sear', kategorie: 'fleisch', title: 'Roastbeef am Stueck — Reverse Sear', meatType: 'Roastbeef', cookingMethod: 'Reverse Sear', difficulty: 'Fortgeschritten', concept: 'Britischer Sonntagsbraten neu gedacht: Roastbeef am Stueck niedrig indirekt auf 52 Grad Kern, dann scharf angrillen. In duennen Scheiben quer zur Faser. Herkunft: Grossbritannien.' },
  { slug: 'chateaubriand-filet', kategorie: 'fleisch', title: 'Chateaubriand — das Filet im Ganzen', meatType: 'Rinderfilet', cookingMethod: 'Indirekt + Sear', difficulty: 'Fortgeschritten', concept: 'Franzoesische Hohe Schule: Filet-Mittelstueck im Ganzen indirekt auf 53 Grad, kurz scharf, ruhen. Magerster Cut, daher praezise Kerntemperatur entscheidend. Herkunft: Frankreich.' },
  { slug: 'flank-steak-grillen', kategorie: 'fleisch', title: 'Flank Steak richtig grillen', meatType: 'Flank Steak', cookingMethod: 'Heiss direkt', difficulty: 'Mittel', concept: 'US-Cut mit groberer Faser: heiss und kurz auf medium rare, dann unbedingt quer zur deutlich sichtbaren Faser in duenne Scheiben. Herkunft: USA.' },
  { slug: 'onglet-hanger-steak', kategorie: 'fleisch', title: 'Onglet (Hanger Steak) — der Metzgercut', meatType: 'Onglet', cookingMethod: 'Heiss direkt', difficulty: 'Mittel', concept: 'Franzoesischer Bistro-Klassiker, intensiver Geschmack: kurz heiss grillen, medium rare, gegen die Faser. Mittelsehne entfernen. Herkunft: Frankreich.' },
  { slug: 'picanha-churrasco', kategorie: 'fleisch', title: 'Picanha — brasilianischer Churrasco', meatType: 'Picanha', cookingMethod: 'Spiess / indirekt', difficulty: 'Mittel', concept: 'Brasilianischer Klassiker: Tafelspitzdeckel mit Fettkappe, in C-Form auf den Spiess oder indirekt, nur grobes Salz. Fettseite zuerst. Herkunft: Brasilien.' },
  { slug: 'tri-tip-santa-maria', kategorie: 'fleisch', title: 'Tri-Tip Santa Maria Style', meatType: 'Tri-Tip', cookingMethod: 'Indirekt + Holz', difficulty: 'Mittel', concept: 'Kalifornischer Santa-Maria-Stil: Tri-Tip ueber Rotholz indirekt auf 54 Grad, einfacher Rub aus Salz, Pfeffer, Knoblauch. Herkunft: USA.' },
  { slug: 'beef-short-ribs', kategorie: 'fleisch', title: 'Beef Short Ribs Low and Slow', meatType: 'Short Ribs', cookingMethod: 'Smoker, Low and Slow', difficulty: 'Fortgeschritten', concept: 'Texas-BBQ-Ikone: dicke Rinder-Short-Ribs 8–10 Stunden bei 110–120 Grad raeuchern bis 95 Grad Kern, Kollagen schmilzt zu Gelatine. Herkunft: USA.' },
  { slug: 'ochsenbaeckchen-geschmort', kategorie: 'fleisch', title: 'Ochsenbaeckchen geschmort-gegrillt', meatType: 'Ochsenbacke', cookingMethod: 'Dutch Oven / indirekt', difficulty: 'Fortgeschritten', concept: 'Schmorklassiker: Ochsenbaeckchen scharf angrillen, dann im Dutch Oven indirekt 3–4 Stunden butterzart schmoren. Viel Bindegewebe wird seidig. Herkunft: Deutschland.' },
  { slug: 'dry-aged-ribeye', kategorie: 'fleisch', title: 'Dry-Aged Ribeye — die Reifung schmecken', meatType: 'Dry-Aged Ribeye', cookingMethod: 'Reverse Sear', difficulty: 'Profi', concept: 'Premium-Cut: trockengereiftes Ribeye sanft indirekt auf 52 Grad, dann scharf fuer die Kruste. Nussig-reife Aromen, sparsam wuerzen. Herkunft: Irland.' },
  { slug: 'bavette-skirt-steak', kategorie: 'fleisch', title: 'Bavette / Skirt Steak vom Grill', meatType: 'Bavette', cookingMethod: 'Heiss direkt', difficulty: 'Mittel', concept: 'Aromatischer Duennsaum-Cut: sehr heiss, sehr kurz, medium rare, gegen die Faser. Ideal fuer Fajitas und Tagliata. Herkunft: USA.' },
  { slug: 'wagyu-steak-braten', kategorie: 'fleisch', title: 'Wagyu-Steak richtig braten', meatType: 'Wagyu', cookingMethod: 'Kurz, kontrolliert', difficulty: 'Profi', concept: 'Japanisches Wagyu nicht ruinieren: niedrigere Hitze als beim normalen Steak, kurze Garzeit, kein zusaetzliches Fett. Das intramuskulaere Fett ist der Star. Herkunft: Japan.' },
  { slug: 'wagyu-yakiniku', kategorie: 'fleisch', title: 'Wagyu Yakiniku am Tischgrill', meatType: 'Wagyu', cookingMethod: 'Tischgrill', difficulty: 'Mittel', concept: 'Japanische Tischgrill-Tradition: hauchduenn geschnittenes Wagyu Sekunden pro Seite, sofort essen. Tare-Dip dazu. Herkunft: Japan.' },
  { slug: 'burnt-ends', kategorie: 'fleisch', title: 'Burnt Ends — die Bonbons vom Brisket', meatType: 'Brisket Point', cookingMethod: 'Smoker, gewuerfelt', difficulty: 'Fortgeschritten', concept: 'Kansas-City-Spezialitaet: das Point-Stueck vom Brisket weiterraeuchern, wuerfeln, in BBQ-Sauce glasieren, nochmal in den Smoker. Herkunft: USA.' },
  { slug: 'beef-back-ribs', kategorie: 'fleisch', title: 'Beef Back Ribs (Dino Ribs)', meatType: 'Beef Ribs', cookingMethod: 'Low and Slow', difficulty: 'Fortgeschritten', concept: 'Maechtige Rinderrippen: 6–8 Stunden bei 120 Grad raeuchern bis 96 Grad Kern, simpler Salz-Pfeffer-Rub. Herkunft: USA.' },
  { slug: 'iberico-secreto', kategorie: 'fleisch', title: 'Iberico Secreto vom Grill', meatType: 'Secreto', cookingMethod: 'Heiss direkt', difficulty: 'Mittel', concept: 'Spanische Delikatesse: das versteckte Secreto vom Iberico-Schwein, stark marmoriert, kurz heiss grillen auf medium, niemals durch. Herkunft: Spanien.' },
  { slug: 'iberico-presa', kategorie: 'fleisch', title: 'Iberico Presa richtig grillen', meatType: 'Presa', cookingMethod: 'Direkt + Ruhen', difficulty: 'Mittel', concept: 'Spanischer Premium-Cut aus dem Schulterbereich des Iberico, fein marmoriert: heiss angrillen, kurz ruhen, medium. Herkunft: Spanien.' },
  { slug: 'iberico-pluma', kategorie: 'fleisch', title: 'Iberico Pluma vom Grill', meatType: 'Pluma', cookingMethod: 'Heiss, kurz', difficulty: 'Mittel', concept: 'Zarter, flacher Iberico-Cut: heiss und kurz grillen, saftig medium. Wenig wuerzen, der nussige Eigengeschmack traegt. Herkunft: Spanien.' },
  { slug: 'iberico-carrillera', kategorie: 'fleisch', title: 'Iberico Carrillera (Schweinebaeckchen) geschmort', meatType: 'Carrillera', cookingMethod: 'Geschmort', difficulty: 'Fortgeschritten', concept: 'Spanischer Schmorcut: Iberico-Schweinebaeckchen in Rotwein-Fond niedrig schmoren bis sie zerfallen. Herkunft: Spanien.' },
  { slug: 'spareribs-3-2-1', kategorie: 'fleisch', title: 'Spareribs nach der 3-2-1-Methode', meatType: 'Spareribs', cookingMethod: '3-2-1, Smoker', difficulty: 'Mittel', concept: 'US-BBQ-Standard mit Duroc-Ribs: 3 Stunden raeuchern, 2 Stunden gewickelt daempfen, 1 Stunde glasieren. Fall-off-the-bone. Herkunft: USA.' },
  { slug: 'krustenbraten-grill', kategorie: 'fleisch', title: 'Krustenbraten vom Grill mit knuspriger Schwarte', meatType: 'Schweineschulter', cookingMethod: 'Indirekt + Kruste', difficulty: 'Mittel', concept: 'Bayrischer Klassiker am Grill: Schweineschulter mit Schwarte indirekt garen, am Ende heiss aufpoppen fuer die Kruste. Herkunft: Deutschland.' },
  // ── Fisch & Meeresfruechte ──
  { slug: 'cedar-plank-lachs', kategorie: 'fisch', title: 'Cedar-Plank-Lachs vom Grill', meatType: 'Lachs', cookingMethod: 'Indirekt auf Zedernholz', difficulty: 'Mittel', concept: 'Lachsfilet mit Haut auf gewaessertem Zedernholzbrett, indirekt bei rund 180 Grad bis Kern 50–52 Grad (glasig-saftig, nie ueber 55). Das Brett raucht und gibt Holzaroma. Glasur aus Ahornsirup, Dijon und Sojasauce; Dill und Zitrone. Orange-rosa Fleisch mit parallelen weissen Fettlinien. Herkunft: Pacific Northwest USA/Kanada.' },
  { slug: 'thunfisch-steak-grill', kategorie: 'fisch', title: 'Thunfisch-Steak medium rare grillen', meatType: 'Thunfisch', cookingMethod: 'Sehr heiss, sehr kurz direkt', difficulty: 'Mittel', concept: 'Dickes Ahi-Thunfisch-Steak in Sushi-Qualitaet, mariniert in Sojasauce, Sesamoel und Ingwer, optional Sesamkruste. Sehr heiss direkt nur 60–90 Sekunden je Seite: aussen scharfe Gitterstreifen, Kern tiefrot und roh (medium rare). Niemals durchgaren, wird sonst grau und trocken. Quer zur Faser schneiden. Herkunft: mediterran/japanisch.' },
  { slug: 'ganze-dorade-grill', kategorie: 'fisch', title: 'Ganze Dorade vom Grill', meatType: 'Dorade', cookingMethod: 'Direkt in der Fischzange', difficulty: 'Mittel', concept: 'Ganze ausgenommene Dorade (Goldbrasse), Haut beidseitig eingeschnitten, Bauchhoehle mit Zitronenscheiben, Rosmarin und Knoblauch gefuellt. In der Fischzange direkt ueber mittlerer Glut rund 6–8 Minuten je Seite, bis die silbrig-goldene Haut blasig und knusprig ist und das Fleisch weiss und saftig. Olivenoel, Meersalz. Herkunft: Mittelmeer.' },
  { slug: 'schwertfisch-steak-grill', kategorie: 'fisch', title: 'Schwertfisch-Steak vom Grill', meatType: 'Schwertfisch', cookingMethod: 'Heiss direkt', difficulty: 'Mittel', concept: 'Dickes Schwertfisch-Steak, festes steakartiges Fleisch, eher mager. In Olivenoel, Zitrone und Knoblauch mariniert, heiss direkt 3–4 Minuten je Seite mit klaren Gitterstreifen, Kern gerade durch und saftig — nicht uebergaren, sonst trocken. Dazu Salsa Verde und Zitrone. Herkunft: Mittelmeer.' },
  { slug: 'ganze-makrele-grill', kategorie: 'fisch', title: 'Ganze Makrele vom Grill', meatType: 'Makrele', cookingMethod: 'Direkt in der Fischzange', difficulty: 'Einfach', concept: 'Ganze ausgenommene Makrele, Haut beidseitig eingeschnitten; fettreicher, kraeftiger Fisch mit blaeulich-silbriger Tigerstreifen-Haut. In der Fischzange direkt ueber mittlerer Glut 4–5 Minuten je Seite, bis die Haut knusprig und gebraeunt ist. Zitrone, Kraeuter. Herkunft: Nordsee/Mittelmeer.' },
  { slug: 'sardinen-vom-grill', kategorie: 'fisch', title: 'Sardinen vom Grill', meatType: 'Sardinen', cookingMethod: 'Sehr heiss ueber Glut', difficulty: 'Einfach', concept: 'Frische Sardinen im Ganzen, nur grobes Meersalz. Sehr heiss ueber direkter Glut 2–3 Minuten je Seite, bis die silbrige Haut knusprig gold-schwarz verkohlt ist. Mehrere nebeneinander auf dem Rost. Zitrone, Olivenoel. Herkunft: Mittelmeer/Portugal.' },
  { slug: 'mahi-mahi-grill', kategorie: 'fisch', title: 'Mahi-Mahi vom Grill mit Mango-Salsa', meatType: 'Mahi-Mahi', cookingMethod: 'Heiss direkt', difficulty: 'Mittel', concept: 'Festes Mahi-Mahi-Filet, helles grossblaettriges Fleisch, mager. In Limette, Koriander und Chili mariniert, direkt gegrillt mit klaren Grillstreifen, saftig medium (nicht durchgaren). Dazu frische Mango-Salsa. Herkunft: Karibik/Hawaii.' },
  { slug: 'rotbarbe-grill', kategorie: 'fisch', title: 'Rotbarbe (Rouget) vom Grill', meatType: 'Rotbarbe', cookingMethod: 'Direkt, im Ganzen', difficulty: 'Mittel', concept: 'Kleine ganze Rotbarbe (Rouget) mit charakteristisch roetlich-rosa Haut, im Ganzen gegrillt. Olivenoel, Meersalz, Zitrone, Thymian; Haut knusprig, zartes weisses Fleisch. Mehrere kleine Fische. Herkunft: Mittelmeer.' },
  // ── Veggie-Beilagen ──
  { slug: 'maiskolben-elote', kategorie: 'beilagen', title: 'Gegrillter Maiskolben Elote-Style', meatType: 'Mais', cookingMethod: 'Direkt gegrillt', difficulty: 'Einfach', concept: 'Maiskolben direkt grillen, bis die gelben Koerner gebraeunt und karamellisiert sind mit dunklen Roeststreifen. Dann mexikanischer Elote: duenne Schicht Crema/Mayo-Limette, kruemeliger Cotija oder Feta, Chilipulver, Koriander, ein Spritzer Limette. Herkunft: Mexiko/USA-Streetfood.' },
  { slug: 'gemuese-spiesse-grill', kategorie: 'beilagen', title: 'Bunte Gemuese-Spiesse vom Grill', meatType: 'Gemüse', cookingMethod: 'Direkt gegrillt', difficulty: 'Einfach', concept: 'Spiesse aus rot-gelber Paprika, Zucchini, roter Zwiebel und Champignons in Olivenoel-Kraeutermarinade. Gleichmaessige Stuecke fuer gleiche Garzeit. Direkt grillen bis die Kanten blistered und karamellisiert sind, innen bissfest. Dazu Chimichurri. Vegan. Herkunft: mediterran/Sommergrill.' },
  { slug: 'gruener-spargel-grill', kategorie: 'beilagen', title: 'Gruener Spargel vom Grill mit Parmesan', meatType: 'Grüner Spargel', cookingMethod: 'Direkt, quer zum Rost', difficulty: 'Einfach', concept: 'Gruener Spargel, holzige Enden entfernt, in Olivenoel gewendet, quer ueber den heissen Rost rund 4–6 Minuten mit klaren dunklen Grillstreifen, Spitzen leicht knusprig, Stangen bissfest. Parmesan-Spaene, Meersalz-Flocken, Zitrone. Herkunft: mediterran.' },
  { slug: 'lammkarree-grillen', kategorie: 'fleisch', title: 'Lammkarree / Lammkrone vom Grill', meatType: 'Lammkarree', cookingMethod: 'Indirekt + Sear', difficulty: 'Mittel', concept: 'Festtags-Cut: Lammkarree mit Fettdeckel indirekt auf 56 Grad, dann scharf. Mediterrane Kraeuterkruste. Herkunft: Schottland.' },
  { slug: 'lammkoteletts-mediterran', kategorie: 'fleisch', title: 'Lammkoteletts mediterran', meatType: 'Lammkoteletts', cookingMethod: 'Direkt, kurz', difficulty: 'Einfach', concept: 'Schnell und aromatisch: Lammkoteletts in Rosmarin-Knoblauch-Olivenoel marinieren, heiss kurz grillen auf medium. Herkunft: Schottland.' },
  { slug: 'lammkeule-drehspiess', kategorie: 'fleisch', title: 'Lammkeule am Drehspiess', meatType: 'Lammkeule', cookingMethod: 'Rotisserie', difficulty: 'Fortgeschritten', concept: 'Ganze Lammkeule am Rotisserie-Spiess gleichmaessig indirekt auf 70 Grad Kern (durchgegart), aussen knusprig. Herkunft: Neuseeland.' },
  { slug: 'beer-can-chicken', kategorie: 'fleisch', title: 'Beer Can Chicken', meatType: 'Ganzes Haehnchen', cookingMethod: 'Indirekt, aufrecht', difficulty: 'Einfach', concept: 'US-Grillklassiker: ganzes Haehnchen aufrecht auf einer halbvollen Bierdose indirekt garen bis 74 Grad Kern in der Brust, knusprige Haut. Herkunft: USA.' },
  { slug: 'spatchcock-haehnchen', kategorie: 'fleisch', title: 'Spatchcock-Haehnchen (Butterfly)', meatType: 'Ganzes Haehnchen', cookingMethod: 'Flach, indirekt', difficulty: 'Einfach', concept: 'Haehnchen flachgedrueckt (Rueckgrat entfernt) gart gleichmaessig und schneller, indirekt bis 74 Grad Kern. Herkunft: USA.' },
  { slug: 'pulled-chicken', kategorie: 'fleisch', title: 'Pulled Chicken vom Smoker', meatType: 'Haehnchenschenkel', cookingMethod: 'Low and Slow', difficulty: 'Einfach', concept: 'Saftige Alternative zu Pulled Pork: Haehnchenschenkel niedrig raeuchern bis 90 Grad, zupfen, in leichter Sauce. Herkunft: USA.' },
  { slug: 'ente-vom-grill', kategorie: 'fleisch', title: 'Ente vom Grill mit knuspriger Haut', meatType: 'Ganze Ente', cookingMethod: 'Indirekt, Fett ablassen', difficulty: 'Fortgeschritten', concept: 'Ganze Ente indirekt garen, Haut mehrfach einstechen damit Fett ausbraet und die Haut knusprig wird. Herkunft: Frankreich.' },
  { slug: 'asado-de-tira', kategorie: 'fleisch', title: 'Asado de Tira — argentinische Querrippe', meatType: 'Short Ribs (Tira)', cookingMethod: 'Asado, offen', difficulty: 'Fortgeschritten', concept: 'Argentinischer Asado-Klassiker: quer gesaegte Rinderrippe ueber offener Glut langsam garen, nur grobes Salz, Chimichurri dazu. Herkunft: Argentinien.' },
  { slug: 'korean-bbq-bulgogi', kategorie: 'fleisch', title: 'Korean BBQ Bulgogi', meatType: 'Rind (duenn)', cookingMethod: 'Mariniert, Tischgrill', difficulty: 'Einfach', concept: 'Koreanischer Klassiker: hauchduennes Rind in Sojasauce-Birne-Sesam-Marinade, am Tischgrill Sekunden braten. Herkunft: Korea.' },
  { slug: 'tagliata-di-manzo', kategorie: 'fleisch', title: 'Tagliata di Manzo', meatType: 'Roastbeef', cookingMethod: 'Heiss, in Scheiben', difficulty: 'Einfach', concept: 'Italienischer Klassiker: Roastbeef oder Entrecote heiss grillen, medium rare, in Scheiben auf Ruccola mit Parmesan und Olivenoel. Herkunft: Italien.' },
  { slug: 'wagyu-burger', kategorie: 'fleisch', title: 'Wagyu Burger', meatType: 'Wagyu-Hack', cookingMethod: 'Smash / Grill', difficulty: 'Mittel', concept: 'Luxus-Burger aus Wagyu-Hack: lockere Patties, hoher Fettanteil, kurz heiss, medium. Nicht plattdruecken bis trocken. Herkunft: Japan.' },
  { slug: 't-bone-fiorentina', kategorie: 'fleisch', title: 'T-Bone Bistecca alla Fiorentina', meatType: 'T-Bone', cookingMethod: 'Direkt, dick', difficulty: 'Fortgeschritten', concept: 'Toskanischer Klassiker: sehr dickes T-Bone (Chianina) sehr heiss direkt, aussen krustig, innen blutig-rosa, hochkant auf den Knochen gestellt. Nur Salz, Olivenoel, Zitrone. Herkunft: Italien.' },
  // ── SUEDAFRIKA — Braai ────────────────────────────────────────────────────
  { slug: 'boerewors-braai', kategorie: 'fleisch', title: 'Boerewors vom Braai', meatType: 'Rinderwurst', cookingMethod: 'Direkt', difficulty: 'Einfach', concept: 'Suedafrikanischer Braai-Klassiker: gewuerzte Rinderwurst (Boerewors = Bauernwurst) in einer Spirale ueber direkter Glut gegrillt. Gewuerzmix aus Koriander, Nelke, Muskat. Nie aufschneiden vor dem Grillen. Dazu Pap (Maismehlbrei) und Chakalaka-Relish. Herkunft: Suedafrika.' },
  { slug: 'sosaties-braai', kategorie: 'fleisch', title: 'Sosaties — Suedafrikanische BBQ-Spiesse', meatType: 'Lamm/Rind', cookingMethod: 'Spiess, direkt', difficulty: 'Mittel', concept: 'Kapmalaiische Fleischspiesse mit suess-saurer Aprikosen-Curry-Marinade. Lamm- oder Rindwuerfel abwechselnd mit Trockenaprikosen und Zwiebeln aufgespiesst. Mindestens 12 Stunden marinieren. Herkunft: Suedafrika.' },
  { slug: 'braaibroodjies', kategorie: 'beilagen', title: 'Braaibroodjies — Suedafrikanisches Grillbrot', meatType: 'vegetarisch', cookingMethod: 'Direkt', difficulty: 'Einfach', concept: 'Das unentbehrliche Brot zum Braai: Weissbrote mit Kaese, Tomate und Zwiebel belegt, auf dem Rost gegrillt bis die Kruste goldbraun und knusprig ist. Einfach, schnell, unverzichtbar. Herkunft: Suedafrika.' },
  { slug: 'lamb-chops-braai-sa', kategorie: 'fleisch', title: 'Lamb Chops vom Braai', meatType: 'Lammkoteletts', cookingMethod: 'Direkt, heiss', difficulty: 'Mittel', concept: 'Lammkoteletts sehr heiss und kurz ueber direkter Glut: aussen karamellisierte Kruste, innen rosa. Nur Salz, Pfeffer, etwas Rosmarin. Der suedafrikanische Braai dreht sich auch um Lammfleisch. Herkunft: Suedafrika.' },

  // ── AUSTRALIEN ────────────────────────────────────────────────────────────
  { slug: 'barramundi-grill', kategorie: 'fisch', title: 'Barramundi vom Grill', meatType: 'Barramundi', cookingMethod: 'Direkt, Holzkohle', difficulty: 'Mittel', concept: 'Australiens Lieblingsfisch: Barramundi-Filet mit Haut direkt ueber Holzkohle, Haut zuerst, bis sie knusprig ist. Zartes weisses Fleisch, milde Butter-Note. Dazu Macadamia-Salsa. Herkunft: Australien.' },
  { slug: 'aussie-lamb-leg-butterflied', kategorie: 'fleisch', title: 'Butterflied Leg of Lamb — Australisches Lammfest', meatType: 'Lammkeule', cookingMethod: 'Indirekt', difficulty: 'Fortgeschritten', concept: 'Australischer Klassiker: Lammkeule aufgeklappt (butterflied), mariniert in Knoblauch, Rosmarin, Olivenoel und Zitrone, indirekt gegrillt auf 70 Grad Kern (durchgegart). Gleichmaessige Garung, weniger Zeit als ganze Keule. Herkunft: Australien.' },
  { slug: 'australische-riesengarnelen-barbie', kategorie: 'fisch', title: 'Prawns on the Barbie', meatType: 'Riesengarnelen', cookingMethod: 'Direkt', difficulty: 'Einfach', concept: 'Australisches Kultsymbol: Riesengarnelen in der Schale direkt ueber heisser Glut 2-3 Minuten. Butter-Knoblauch-Glasur, Zitrone. Schnell, einfach, spektakulaer. Herkunft: Australien.' },

  // ── TUERKEI — Mangal/Kebab ────────────────────────────────────────────────
  { slug: 'adana-kebab', kategorie: 'fleisch', title: 'Adana Kebab vom Mangal', meatType: 'Rinderhackfleisch', cookingMethod: 'Spiess, Mangal', difficulty: 'Fortgeschritten', concept: 'Der Koenig der tuerkischen Kebabs aus Adana: Rinderhackfleisch mit Lammfettschwanz, scharfen Flocken (Pul Biber) und Gewuerzen auf breiten Metallspiessen geformt und ueber Holzkohle gegrillt. Fleisch muss ausreichend geknetet werden damit es am Spiess haelt. Herkunft: Tuerkei, Adana.' },
  { slug: 'sis-kebab-tuerkisch', kategorie: 'fleisch', title: 'Sis Kebab — Tuerkischer Fleischspiess', meatType: 'Lamm/Rind', cookingMethod: 'Spiess, direkt', difficulty: 'Mittel', concept: 'Wuerfelfoermige Lamm- oder Rindwuerfel in Joghurt-Zwiebel-Gewuerzmarinade, mindestens 4 Stunden marinieren, dann auf Metallspiessen ueber dem Mangal. Gleichmaessige Stuecke fuer gleichmaessige Garung. Herkunft: Tuerkei.' },
  { slug: 'kofte-mangal', kategorie: 'fleisch', title: 'Koefte vom Mangal', meatType: 'Rinderhack', cookingMethod: 'Spiess, Mangal', difficulty: 'Einfach', concept: 'Geformte Hackfleischballs aus gewuerztem Rinderhack mit Zwiebel, Petersilie, Pul Biber. Auf Metallspiesse geformt oder direkt auf den Rost, ueber dem Mangal gegrillt. Das Streetfood-Herz der tuerkischen Grillkueche. Herkunft: Tuerkei.' },
  { slug: 'tavuk-sis-kebab', kategorie: 'fleisch', title: 'Tavuk Sis — Tuerkischer Haehnchenspiess', meatType: 'Haehnchen', cookingMethod: 'Spiess, direkt', difficulty: 'Einfach', concept: 'Haehnchenwuerfel (Brust und Oberschenkel) in Joghurt-Paprika-Olivenoel-Marinade, ueber Nacht marinieren, dann auf Spiessen ueber dem Mangal. Saftig durch Joghurt-Marinade. Herkunft: Tuerkei.' },

  // ── THAILAND ──────────────────────────────────────────────────────────────
  { slug: 'moo-ping', kategorie: 'fleisch', title: 'Moo Ping — Thailaendische Schweinefleisch-Spiesse', meatType: 'Schweinenacken', cookingMethod: 'Spiess, direkt', difficulty: 'Mittel', concept: 'Bangkoks ultimatives Strassenessen: duenn geschnittener Schweinenacken in Kokos-Fischsauce-Zucker-Marinade, auf Holzspiesse aufgereiht, ueber Holzkohle langsam gegrillt mit staendigem Wenden und Beglasen. Suesser Karamell-Rauch-Geschmack. Herkunft: Thailand.' },
  { slug: 'gai-yang-isaan', kategorie: 'fleisch', title: 'Gai Yang Isaan — Gegrilltes Haehnchen Nordost-Thailand', meatType: 'Haehnchen', cookingMethod: 'Indirekt + direkt', difficulty: 'Mittel', concept: 'Das Nationalgericht Isaans: halbes Haehnchen in Zitronengras-Knoblauch-Koriander-Fischsauce-Marinade. Zuerst indirekt langsam garen, dann scharfer direkter Finish. Dazu Nam Jim Jaew (scharfe Dip-Sauce). Herkunft: Thailand, Isaan-Region.' },
  { slug: 'pla-pao-salzkruste', kategorie: 'fisch', title: 'Pla Pao — Fisch in Salzkruste vom Holzkohlegrill', meatType: 'Tilapia/Barsch', cookingMethod: 'Salzkruste, direkt', difficulty: 'Fortgeschritten', concept: 'Thailaendischer Ganzen-Fisch-Klassiker: Tilapia oder Barsch komplett mit grobem Salz ummantelt, direkt ueber Holzkohle gegrillt bis die Salzkruste hart ist. Das Salz versiegelt den Fisch, haelt ihn saftig. Dazu Seafood-Dip. Herkunft: Thailand.' },

  // ── VIETNAM ────────────────────────────────────────────────────────────────
  { slug: 'bun-cha-hanoi', kategorie: 'fleisch', title: 'Bun Cha Ha Noi — Gegrilltes Schweinefleisch Hanoi-Stil', meatType: 'Schweinehack/-bauch', cookingMethod: 'Holzkohle, direkt', difficulty: 'Mittel', concept: 'Hanois Mittagessen-Ikone: Schweinehack-Patties und Bauchscheiben ueber Holzkohle gegrillt bis leicht verkohlt. In einem suess-sauren Fischsauce-Dip mit Reisnudeln und frischen Kraeutern serviert. Herkunft: Vietnam, Hanoi.' },
  { slug: 'thit-nuong-vietnam', kategorie: 'fleisch', title: 'Thit Nuong — Vietnamesisches Zitronengras-Grillschwein', meatType: 'Schweinekotelett', cookingMethod: 'Direkt', difficulty: 'Einfach', concept: 'Duenne Schweinekoteletts mariniert in Zitronengras, Knoblauch, Zucker, Fischsauce und Sesamoel. Direkt ueber Holzkohle scharf gegrillt, leicht karamellisiert. Serviert mit Reisnudeln und Nuoc Cham. Herkunft: Vietnam.' },
  { slug: 'ca-nuong-bananenblatt', kategorie: 'fisch', title: 'Ca Nuong La Chuoi — Fisch im Bananenblatt', meatType: 'Wels/Snapper', cookingMethod: 'Bananenblatt, Holzkohle', difficulty: 'Mittel', concept: 'Vietnamesischer Wels oder Snapper in Bananenblatt eingewickelt mit Zitronengras, Chili und Dill. Direkt auf den Holzkohlegrill gelegt: das Blatt daempft, gibt Aroma ab und verbrennt leicht aussen. Zartes, aromatisches Fleisch. Herkunft: Vietnam.' },

  // ── SINGAPUR ──────────────────────────────────────────────────────────────
  { slug: 'singapore-satay', kategorie: 'fleisch', title: 'Singapore Satay — Klassische Satay-Spiesse', meatType: 'Haehnchen/Rind/Lamm', cookingMethod: 'Spiess, Holzkohle', difficulty: 'Mittel', concept: 'Singapurs Hawker-Centre-Klassiker: Fleisch auf Bambusspiessen in Kurkuma-Koriander-Zitronengras-Marinade, ueber Holzkohle mit staendigem Faechern gegrillt. Dazu Erdnuss-Sauce und Ketupat-Reiskuchen. Herkunft: Singapur.' },
  { slug: 'ikan-bakar-singapur', kategorie: 'fisch', title: 'Ikan Bakar — Singapurischer Grillfisch', meatType: 'Stingray/Snapper', cookingMethod: 'Bananenblatt, direkt', difficulty: 'Mittel', concept: 'Singapurs beruehmt-beruechtigter Grillfisch: Rochen (Stingray) oder Snapper mit Sambal Belacan eingerieben, auf Bananenblatt direkt gegrillt bis das Blatt verkohlt. Intensiv wuerzig-scharf, typisches Hawker-Centre-Gericht. Herkunft: Singapur.' },

  // ── ARGENTINIEN ───────────────────────────────────────────────────────────
  { slug: 'chorizo-argentino-choripan', kategorie: 'fleisch', title: 'Chorizo Argentino — Choripan vom Asado', meatType: 'Schweinsbratwurst', cookingMethod: 'Parrilla, direkt', difficulty: 'Einfach', concept: 'Der Asado-Opener: frische argentinische Chorizo auf der Parrilla langsam gegrillt bis die Haut knusprig aufplatzt. Im aufgeschnittenen Brot mit Chimichurri = Choripan. Das Pflichtgericht zu Beginn jedes Asados. Herkunft: Argentinien.' },
  { slug: 'entrana-asado-argentino', kategorie: 'fleisch', title: 'Entrana — Argentinisches Skirt Steak vom Asado', meatType: 'Skirt Steak', cookingMethod: 'Parrilla, direkt', difficulty: 'Mittel', concept: 'Argentiniens beliebtester Asado-Cut: Entrana (Skirt Steak / Zwerchfell), stark marmoriert, intensiv aromatisch. Auf der Parrilla direkt heiss gegrillt, nur grobes Salz. Medium rare, quer zur Faser schneiden. Chimichurri dazu. Herkunft: Argentinien.' },
  { slug: 'mollejas-asado', kategorie: 'fleisch', title: 'Mollejas — Argentinische Kalbsbries vom Asado', meatType: 'Kalbsbries', cookingMethod: 'Parrilla, langsam', difficulty: 'Fortgeschritten', concept: 'Die Delikatesse des argentinischen Asados: Kalbsbries auf der Parrilla sehr langsam bei moderater Hitze bis aussen knusprig-kross und innen cremig-weich. Vorher blanchieren und haeutige Hüllen entfernen. Herkunft: Argentinien.' },

  // ── BRASILIEN ─────────────────────────────────────────────────────────────
  { slug: 'costela-gaucha-churrasco', kategorie: 'fleisch', title: 'Costela Gaucha — Rinderippe Gaucho-Stil', meatType: 'Rinderrippe', cookingMethod: 'Indirektes Feuer, langsam', difficulty: 'Fortgeschritten', concept: 'Rio Grande do Suls groesstes Churrasco-Statement: massige Rinderrippen auf dem Kreuzgalgen oder Spiess viele Stunden bei indirekter Hitze. Nur grobes Salz. Das Kollagen schmilzt, Fleisch loest sich vom Knochen. Gauchos Stolz. Herkunft: Brasilien, Rio Grande do Sul.' },
  { slug: 'frango-churrasco-brasil', kategorie: 'fleisch', title: 'Frango Churrasco — Brasilianisches Grillhaehnchen', meatType: 'Haehnchen', cookingMethod: 'Spiess, direkt', difficulty: 'Einfach', concept: 'Brasilianisches Churrascaria-Haehnchen auf dem Spiess: halbe Haehnen mit Knoblauch-Olivenoel-Limetten-Marinade gespiesst und rotierend gegrillt. Saftiges Fleisch, knusprige Haut. Standard in jedem Churrascaria-Rodizio. Herkunft: Brasilien.' },

  // ── KANADA ────────────────────────────────────────────────────────────────
  { slug: 'maple-glazed-spareribs-kanada', kategorie: 'fleisch', title: 'Maple-Glazed Spareribs — Kanadische Ahornsirup-Ribs', meatType: 'Schweinerippchen', cookingMethod: 'Indirekt, low & slow', difficulty: 'Fortgeschritten', concept: 'Kanadas BBQ-Signatur: Spareribs niedrig und langsam indirekt gegart, in den letzten 30 Minuten mit echtem kanadischem Ahornsirup glasiert. Suesser Karamell-Abschluss, der mit dem Rauch harmoniert. Herkunft: Kanada.' },
  { slug: 'smoked-arctic-char-kanada', kategorie: 'fisch', title: 'Smoked Arctic Char — Kanadischer Geraeucherter Seesaibling', meatType: 'Seesaibling', cookingMethod: 'Kaltrauch + Heissrauch', difficulty: 'Fortgeschritten', concept: 'Kanadas arktischer Edelfisch: Seesaibling erst kalt geraeuchert unter 30 Grad, dann heiss bei 65-70 Grad bis Kern 62 Grad. Lachs-aehnlicher Geschmack, rosaes Fleisch, eleganter Rauchgeschmack. Herkunft: Kanada.' },
]

/**
 * Seed-Liste = fest verdrahtete Startliste + Nachschub aus data/rezept-seeds.json.
 * Der Nachschub wird von scripts/recipe-seeds.mjs aufgefuellt und durchlaeuft
 * denselben PR-Review wie die Rezepte selbst. Kaputte oder unvollstaendige
 * Eintraege werden uebersprungen statt den Lauf abzubrechen.
 */
const SEED_PFLICHT = ['slug', 'kategorie', 'title', 'meatType', 'cookingMethod', 'difficulty', 'concept']

function ladeNachschub() {
  if (!existsSync(NACHSCHUB)) return []
  let roh
  try {
    roh = JSON.parse(readFileSync(NACHSCHUB, 'utf-8'))
  } catch (err) {
    console.warn(`  ⚠ data/rezept-seeds.json ist kein gueltiges JSON (${err.message}) — Nachschub ignoriert.`)
    return []
  }
  if (!Array.isArray(roh)) {
    console.warn('  ⚠ data/rezept-seeds.json enthaelt kein Array — Nachschub ignoriert.')
    return []
  }
  const ok = []
  for (const eintrag of roh) {
    const fehlend = SEED_PFLICHT.filter(f => !eintrag?.[f])
    if (fehlend.length) {
      console.warn(`  ⚠ Nachschub-Seed uebersprungen (fehlt: ${fehlend.join(', ')}): ${eintrag?.slug ?? '???'}`)
      continue
    }
    ok.push(eintrag)
  }
  return ok
}

function alleSeeds() {
  const gesehen = new Set()
  const zusammen = []
  for (const seed of [...SEED_RECIPES, ...ladeNachschub()]) {
    if (gesehen.has(seed.slug)) continue
    gesehen.add(seed.slug)
    zusammen.push(seed)
  }
  return zusammen
}

// ─── SLUGS AUS OFFENEN REZEPT-PRS ─────────────────────────────────────────────
//
// Der Lauf sieht sonst nur main: Der Cache (content/rezepte/.recipe-cache.json)
// und die fertige .mdx werden im PR-Branch geschrieben, nicht in main. Solange
// ein Rezept-PR auf Freigabe wartet, gilt sein Rezept beim naechsten Lauf also
// als "noch nicht erzeugt" — und wird noch einmal erzeugt.
//
// Genau das ist am 15.-18.09.2026 passiert: vier Naechte hintereinander wurde
// dasselbe Rezept (tsukune-yakitori) erzeugt, weil der PR vom 15.09. offen lag.
// Ergebnis: vier PRs mit demselben Slug, drei davon mit Merge-Konflikt, und vier
// mal FLUX-Bildkosten fuer ein einziges Rezept.
//
// Deshalb: vor der Auswahl nachsehen, welche Rezepte bereits in einem OFFENEN
// PR auf Freigabe warten.
//
// Gefragt wird die GitHub-API, nicht die Branch-Liste. Der Unterschied ist
// wichtig: Ein geschlossener PR laesst seinen Branch stehen (am 18.09.2026 lagen
// vier bot/rezept-*-Branches auf origin, deren PRs alle erledigt waren). Wer
// Branches liest, haelt so ein abgelehntes Rezept fuer "wartet noch auf
// Freigabe" — und erzeugt es nie wieder. Die API kennt den Unterschied, und
// /pulls/<n>/files liefert genau die Dateien, die der PR NEU bringt.
//
// Faellt das aus (kein Netz, Rate-Limit, privates Repo ohne Token), bleibt es
// beim alten Verhalten mit Warnung — eine nicht erreichbare Gegenprobe darf die
// Produktion nicht anhalten.
const REZEPT_BRANCH_PREFIX = 'bot/rezept'

function repoSlug() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY
  try {
    const url = execSync('git remote get-url origin', {
      cwd: ROOT, encoding: 'utf-8', timeout: 10_000, stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return url.match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1] ?? null
  } catch {
    return null
  }
}

async function slugsInOffenenRezeptPRs() {
  const repo = repoSlug()
  if (!repo) {
    console.warn('  ⚠ Kein GitHub-Repo ermittelbar — offene Rezept-PRs werden nicht geprueft.')
    return new Set()
  }

  const kopf = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'steakakademie-recipe-agent',
  }
  // Optional: hebt das Rate-Limit von 60/h auf 5000/h und erlaubt private Repos.
  if (process.env.GITHUB_TOKEN) kopf.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const hole = async (pfad) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${pfad}`, {
      headers: kopf, signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const daten = await res.json()
    if (!Array.isArray(daten)) throw new Error('unerwartete Antwort (kein Array)')
    return daten
  }

  let offene
  try {
    offene = await hole('/pulls?state=open&per_page=100')
  } catch (err) {
    console.warn(`  ⚠ Offene Rezept-PRs nicht pruefbar (${err.message}) — nur main als Grundlage.`)
    return new Set()
  }

  const rezeptPRs = offene.filter(pr => pr?.head?.ref?.startsWith(REZEPT_BRANCH_PREFIX))
  if (rezeptPRs.length === 0) return new Set()

  const slugs = new Set()
  for (const pr of rezeptPRs) {
    try {
      for (const datei of await hole(`/pulls/${pr.number}/files?per_page=100`)) {
        const treffer = datei?.filename?.match(/^content\/rezepte\/(.+)\.mdx$/)
        if (treffer) slugs.add(treffer[1])
      }
    } catch (err) {
      console.warn(`  ⚠ Dateiliste von PR #${pr.number} nicht lesbar (${err.message}) — uebergangen.`)
    }
  }
  return slugs
}

// ─── CACHE ────────────────────────────────────────────────────────────────────

async function loadCache() {
  try { return JSON.parse(await readFile(CACHE_FILE, 'utf-8')) } catch { return {} }
}

async function saveCache(cache) {
  if (!DRY_RUN) await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
}

// ─── YAML-HELPER (kein js-yaml nötig) ────────────────────────────────────────
// Einfaches YAML-Serialisieren für Rezept-Felder.

function yamlStr(val) {
  if (val === null || val === undefined) return '""'
  const s = String(val)
  // Zahl ohne Anführungszeichen wenn möglich
  if (/^\d+$/.test(s)) return s
  // Anführungszeichen wenn Sonderzeichen oder leer
  const needsQuote = /[:"#&*?|{}\[\]>!%@`,]/.test(s) || s.includes('\n') || s.trim() !== s || s === ''
  if (needsQuote) return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  return s
}

function serializeIngredients(ingredients) {
  return ingredients.map(ing => {
    let line = `  - amount: ${ing.amount}\n    unit: ${yamlStr(ing.unit)}\n    name: ${yamlStr(ing.name)}`
    if (ing.note) line += `\n    note: ${yamlStr(ing.note)}`
    return line
  }).join('\n')
}

function serializeSteps(steps) {
  return steps.map(step => {
    let block = `  - title: ${yamlStr(step.title)}\n    description: ${yamlStr(step.description)}`
    if (step.duration) block += `\n    duration: ${yamlStr(step.duration)}`
    if (step.tip)      block += `\n    tip: ${yamlStr(step.tip)}`
    return block
  }).join('\n')
}

function serializeList(items) {
  return items.map(i => `  - ${yamlStr(i)}`).join('\n')
}

function buildMdx(data) {
  const fm = [
    `title: ${yamlStr(data.title)}`,
    `description: ${yamlStr(data.description)}`,
    `publishedAt: "${TODAY}"`,
    `author: ${yamlStr(data.author)}`,
    `authorSlug: ${yamlStr(data.authorSlug)}`,
    `image: ${yamlStr(data.image)}`,
    `imageAI: true`,
    `imageSource: ${yamlStr(IMAGE_SOURCE)}`,
    `imageAlt: ${yamlStr(data.imageAlt)}`,
    // Bild-Briefing fuer scripts/recipe-images.mjs — dort Prioritaet 1, vor dem
    // Protein-Anker. Ohne dieses Feld gewinnt der Anker: Lauf #102 (14.09.2026)
    // lieferte fuer Yakitori (meatType "Haehnchenschenkel") ein Bild ganzer
    // gegrillter Haehnchenkeulen — der Alt-Text sprach von Spiessen, das Bild
    // zeigte keinen einzigen. 85 der 113 Bestandsrezepte tragen das Feld; der
    // Agent hat es bis heute nie gesetzt.
    data.imagePrompt ? `imagePrompt: ${yamlStr(data.imagePrompt)}` : null,
    // Redaktionsvorbehalt (Art. 50 Abs. 4 KI-VO, compliance/ai-act-einstufung.md).
    // Entscheidung Uwe 13.09.2026: Bei Rezepten IST der PR-Merge die Freigabe.
    // Auto-Merge ist in recipe-grow.yml ausdruecklich aus — ein Rezept kann main
    // nicht erreichen, ohne dass Uwe den PR von Hand mergt; der Merge-Commit ist
    // der datierte Pruefnachweis. `reviewedAt` setzt weiterhin NUR Uwe von Hand.
    `status: "published"`,
    `reviewed: true`,
    `prepTime: ${yamlStr(data.prepTime)}`,
    `cookTime: ${yamlStr(data.cookTime)}`,
    `totalTime: ${yamlStr(data.totalTime)}`,
    `servings: ${data.servings}`,
    data.calories ? `calories: ${data.calories}` : null,
    `kategorie: ${data.kategorie}`,
    `meatType: ${yamlStr(data.meatType)}`,
    `cookingMethod: ${yamlStr(data.cookingMethod)}`,
    data.land ? `land: ${yamlStr(data.land)}` : null,
    `difficulty: ${yamlStr(data.difficulty)}`,
    data.keywords?.length
      ? `keywords:\n${serializeList(data.keywords)}`
      : null,
    data.equipment?.length
      ? `equipment:\n${serializeList(data.equipment)}`
      : null,
    `ingredients:\n${serializeIngredients(data.ingredients)}`,
    `steps:\n${serializeSteps(data.steps)}`,
    data.seoTitle       ? `seoTitle: ${yamlStr(data.seoTitle)}`           : null,
    data.seoDescription ? `seoDescription: ${yamlStr(data.seoDescription)}` : null,
    data.whiskeyName    ? `whiskeyName: ${yamlStr(data.whiskeyName)}`     : null,
    data.whiskeyType    ? `whiskeyType: ${yamlStr(data.whiskeyType)}`     : null,
    data.whiskeyProfile ? `whiskeyProfile: ${yamlStr(data.whiskeyProfile)}` : null,
    data.whiskeyLink    ? `whiskeyLink: ${yamlStr(data.whiskeyLink)}`     : null,
    data.wineName       ? `wineName: ${yamlStr(data.wineName)}`           : null,
    data.wineType       ? `wineType: ${yamlStr(data.wineType)}`           : null,
    data.wineProfile    ? `wineProfile: ${yamlStr(data.wineProfile)}`     : null,
    data.wineLink       ? `wineLink: ${yamlStr(data.wineLink)}`           : null,
  ].filter(Boolean).join('\n')

  return `---\n${fm}\n---\n\n${data.body.trim()}\n`
}

// ─── GENERATION ───────────────────────────────────────────────────────────────

const SYSTEM = `Du bist Marco, der Chefautor von Steakakademie.de — Deutschlands autoritativster BBQ-Wissensplattform.
Ton: direkt, präzise, leidenschaftlich. Kein Fülltext. Kein Clickbait. Echter Substanz-Anspruch.
Zielgruppe: ambitionierte BBQ-Enthusiasten, 30–55 Jahre, die wissen wollen WARUM etwas funktioniert.
Sprache: Deutsch. Fachbegriffe englisch wenn üblich (Bark, Stall, Sear etc.).`

// ─── KERNTEMPERATUR-REFERENZ (Regel 8c) ──────────────────────────────────────
// Bis 15.09.2026 las der Agent die Referenz nie: Die Temperaturen kamen aus den
// Seed-Konzepten und aus dem Modell, validate() pruefte keine einzige. Zwei offene
// Seeds lagen dadurch unter den Sicherheits-Mindestwerten (Putenbrust 71 °C,
// Schweinelachs 62 °C) und waeren unveraendert erzeugt worden.
const REFERENZ_PFAD = join(ROOT, 'data', 'kerntemperatur-referenz.yaml')
let referenzCache = null
function referenz () {
  if (!referenzCache) {
    const text = readFileSync(REFERENZ_PFAD, 'utf-8')
    referenzCache = { text: text.trim(), daten: yaml.load(text) }
  }
  return referenzCache
}

/**
 * System-Prompt MIT der kompletten Referenz. Wortgleich bei jedem Aufruf, damit
 * das Praefix cachebar bleibt — nichts Veraenderliches hier hinein.
 */
function systemPrompt () {
  return `${SYSTEM}

KERNTEMPERATUREN (verbindlich, Regel 8c): Nenne Kerntemperaturen ausschließlich gemäß der folgenden Referenz. Die Werte unter "sicherheit" sind Mindestwerte und dürfen nie unterschritten werden — auch dann nicht, wenn das Rezept-Konzept einen niedrigeren Wert nennt. Deckt die Referenz ein Lebensmittel nicht ab, nenne den üblichen Wert und keine Garstufe, die ihm widerspricht.

### QUELLE: data/kerntemperatur-referenz.yaml
${referenz().text}`
}

// Welche Sicherheits-Mindestwerte der Referenz ein Seed beruehrt. Treffen mehrere
// zu (Haehnchenhack = Gefluegel UND Hack), gilt der hoechste. Ente/Gans bewusst
// nicht als Gefluegel: Die Referenz erlaubt Entenbrust rosa (duck_breast).
const SICHERHEITS_MUSTER = {
  gefluegel:   /h(?:ä|ae)hnchen|huhn|h(?:ü|ue)hner|chicken|pute|truthahn|turkey|gefl(?:ü|ue)gel|wachtel|stubenk(?:ü|ue)ken|poularde/,
  schwein:     /schwein|pork|spare ?ribs|(?<!lamm|kalbs|kalb)kotelett|porchetta|kassler|spanferkel/,
  hackfleisch: /hack|burger|w(?:u|ü|ue)rst|sausage|\blinks\b|[cć]evap|kofta|k(?:ö|oe)fte|frikadell|tsukune/,
  wildschwein: /wildschwein|wild boar/,
}

function sicherheitsKlasse (seed) {
  const text = `${seed.meatType ?? ''} ${seed.title ?? ''}`.toLowerCase()
  const minima = referenz().daten.sicherheit
  let treffer = null
  for (const [klasse, muster] of Object.entries(SICHERHEITS_MUSTER)) {
    if (!muster.test(text) || typeof minima[klasse] !== 'number') continue
    if (!treffer || minima[klasse] > treffer.min) treffer = { klasse, min: minima[klasse] }
  }
  return treffer
}

// ─── STRUKTURIERTES TEXT-FORMAT PARSER ───────────────────────────────────────
// Kein JSON-Parsing — Schlüssel:Wert-Format ist 100% zuverlässig

/** Aufzaehlungs-Praefixe und Fettmarkierung am Titelanfang entfernen — wiederholt. */
function entnummeriere(titel) {
  let t = titel
  for (let i = 0; i < 4; i++) {
    const vorher = t
    t = t.replace(/^\s*(?:\*\*|__)?\s*(?:\d+[.)]|[-*•])\s*(?:\*\*|__)?\s*/, '')
    if (t === vorher) break
  }
  return t.replace(/^(?:\*\*|__)/, '').replace(/(?:\*\*|__)$/, '').trim()
}

function parseStructuredText(text) {
  const data = {
    author: 'Marco', authorSlug: 'marco',
    keywords: [], equipment: [], ingredients: [], steps: [],
    whiskeyName: '', whiskeyType: '', whiskeyProfile: '', whiskeyLink: '',
    wineName: '', wineType: '', wineProfile: '', wineLink: '',
  }

  const lines = text.split('\n')
  let section = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue

    // Section-Headers
    if (line === 'KEYWORDS:')    { section = 'keywords';    continue }
    if (line === 'EQUIPMENT:')   { section = 'equipment';   continue }
    if (line === 'INGREDIENTS:') { section = 'ingredients'; continue }
    if (line === 'STEPS:')       { section = 'steps';       continue }
    if (line === 'BODY:')        { section = 'body';        continue }

    // Einfache KEY: value Felder
    const kv = line.match(/^([A-Z_]+):\s*(.+)$/)
    if (kv && section !== 'body') {
      const key = kv[1], val = kv[2].trim()
      const map = {
        TITLE: 'title', DESCRIPTION: 'description', IMAGE_ALT: 'imageAlt', IMAGE_PROMPT: 'imagePrompt', LAND: 'land',
        PREP_TIME: 'prepTime', COOK_TIME: 'cookTime', TOTAL_TIME: 'totalTime',
        SERVINGS: 'servings', CALORIES: 'calories',
        SEO_TITLE: 'seoTitle', SEO_DESCRIPTION: 'seoDescription',
        WHISKEY_NAME: 'whiskeyName', WHISKEY_TYPE: 'whiskeyType',
        WHISKEY_PROFILE: 'whiskeyProfile', WHISKEY_LINK: 'whiskeyLink',
        WINE_NAME: 'wineName', WINE_TYPE: 'wineType',
        WINE_PROFILE: 'wineProfile', WINE_LINK: 'wineLink',
      }
      if (map[key]) {
        data[map[key]] = ['SERVINGS', 'CALORIES'].includes(key) ? Number(val) : val
        section = null
      } else if (key === 'CORE_TEMP') {
        // Ziel-Kerntemperatur fuer validate(); "keine" bei Beilagen & Co. Wird nicht
        // ins MDX geschrieben (buildMdx liest nur benannte Felder).
        const grad = val.match(/\d{2,3}/)
        data.coreTemp = grad ? Number(grad[0]) : null
        section = null
      }
      continue
    }

    // Listen-Items (- text)
    if (line.startsWith('- ') && ['keywords', 'equipment'].includes(section)) {
      data[section].push(line.slice(2).trim())
      continue
    }

    // Zutaten: - Menge | Einheit | Name | Notiz(optional)
    if (line.startsWith('- ') && section === 'ingredients') {
      const parts = line.slice(2).split('|').map(s => s.trim())
      if (parts.length >= 3) {
        data.ingredients.push({
          amount: parseFloat(parts[0]) || 1,
          unit:   parts[1],
          name:   parts[2],
          note:   parts[3] || undefined,
        })
      }
      continue
    }

    // Schritte: N. Titel | Dauer | Beschreibung | Tipp(optional)
    //
    // Trennung an '|' OHNE erzwungene Leerzeichen (14.09.2026). Vorher stand hier
    // split(' | '): schrieb das Modell 'Titel|Dauer|Text' statt 'Titel | Dauer | Text',
    // ergab das EIN Teil, der Schritt fiel weg und die Validierung brach mit
    // „Zu wenige Schritte" ab — Lauf #100 genau daran gescheitert. Die Zutaten
    // daneben wurden schon immer mit split('|') gelesen und kamen deshalb durch;
    // dieselbe Datei, zwei Strenge-Grade, ein stiller Ausfall.
    // Ebenfalls erlaubt: '1)' statt '1.'. Ein '|' im Tipp bleibt erhalten, weil
    // alles ab dem vierten Teil wieder zusammengefügt wird.
    // Lauf #101 (14.09.2026) scheiterte erneut an „Zu wenige Schritte", obwohl der
    // Trennzeichen-Fix drin war. Deshalb haengt die Erkennung jetzt NICHT mehr an
    // der Nummerierung: Innerhalb der STEPS-Sektion gilt jede Zeile mit mindestens
    // zwei Pipes als Schritt — ob sie mit '1.', '1)', '- ', '*' oder gar nichts
    // beginnt. Das Format, das das Modell waehlt, darf die Produktion nicht mehr
    // entscheiden.
    if (section === 'steps' && line.split('|').length >= 3) {
      const parts = line.split('|').map(t => t.trim())
      // Lauf #102 (14.09.2026), das erste gelieferte Rezept: vier von fuenf
      // Schritt-Titeln kamen als "2. Spiesse bestuecken" an — die Nummer klebte am
      // Titel, und CookCoach.tsx setzt davor noch "Schritt 2". Also: Praefixe so
      // lange abstreifen, bis keins mehr da ist (auch "- 2." oder "**3.**"), und
      // zwar nur am Titel — in Beschreibung und Tipp sind Zahlen Inhalt.
      parts[0] = entnummeriere(parts[0])
      if (parts.length >= 3) {
        data.steps.push({
          title:       parts[0],
          duration:    parts[1],
          description: parts[2],
          tip:         parts.slice(3).join(' | ').trim() || undefined,
        })
      }
      continue
    }

    // Body: alles nach BODY: sammeln
    if (section === 'body') {
      data.body = (data.body ? data.body + '\n' : '') + raw
    }
  }

  return data
}

async function generateRecipe(seed) {
  // Phase 1: Strukturiertes Textformat — kein JSON, kein Parsing-Problem
  const metaPrompt = `Generiere strukturierte Rezept-Metadaten für steakakademie.de.
Antworte EXAKT in diesem Format (Groß-/Kleinschreibung beachten):

TITLE: [Titel max. 70 Zeichen]
DESCRIPTION: [Meta-Beschreibung 120-155 Zeichen]
IMAGE_ALT: [Was auf dem Bild zu sehen ist, max. 80 Zeichen]
IMAGE_PROMPT: [ENGLISCH, 1-2 Sätze für den Bildgenerator: das FERTIGE Gericht — Form (Spieße? Scheiben? ganzes Stück?), Anrichtung, Garzustand, typische Beilage. Danach zwingend "Not:" + was NICHT zu sehen sein darf (z. B. "Not: whole chicken legs, no bones visible"). Konkret, keine Stimmung.]
LAND: [Herkunftsland/Region des Gerichts, z.B. "USA · Texas", "Spanien", "Argentinien", "Italien" — bei deutschem Standard "Deutschland"]
CORE_TEMP: [Ziel-Kerntemperatur des Hauptprodukts in °C als Zahl, gemessen vor dem Ruhen, gemäß Kerntemperatur-Referenz — bei Beilagen, Saucen, Desserts und Getränken: keine]
PREP_TIME: [ISO8601, z.B. PT20M]
COOK_TIME: [ISO8601]
TOTAL_TIME: [ISO8601]
SERVINGS: [Zahl]
CALORIES: [Zahl]
SEO_TITLE: [max. 60 Zeichen | Steakakademie]
SEO_DESCRIPTION: [150-160 Zeichen]
WHISKEY_NAME: [Passender Whisky oder leer lassen]
WHISKEY_TYPE: [z.B. Bourbon]
WHISKEY_PROFILE: [Beschreibung und Pairing-Grund]
WHISKEY_LINK: [https://www.amazon.de/s?k=Name&tag=steakakademie-21 oder leer]
WINE_NAME: [Passender Wein oder leer lassen]
WINE_TYPE: [z.B. Rotwein]
WINE_PROFILE: [Beschreibung und Pairing-Grund]
WINE_LINK: [https://www.amazon.de/s?k=Name&tag=steakakademie-21 oder leer]

KEYWORDS:
- [keyword 1]
- [keyword 2]
- [keyword 3]
- [keyword 4]

EQUIPMENT:
- [equipment 1]
- [equipment 2]

INGREDIENTS:
- [Menge] | [Einheit] | [Name] | [Anmerkung optional]
- [Menge] | [Einheit] | [Name]
(mind. 5 Zutaten)

STEPS:
1. [Schritt-Titel] | [Dauer] | [Ausführliche Beschreibung: WARUM dieser Schritt wichtig ist. Mindestens 2 vollständige Sätze.] | [Profi-Tipp optional]
2. [Schritt-Titel] | [Dauer] | [Beschreibung] | [Tipp]
(mind. 4 Schritte, max. 7)

---
Rezept-Kontext:
- Slug: ${seed.slug}
- Konzept: ${seed.concept}
- Kategorie: ${seed.kategorie}
- Schwierigkeit: ${seed.difficulty}
- Fleisch/Hauptprodukt: ${seed.meatType}
- Methode: ${seed.cookingMethod}

Wichtig: Keine Markdown-Formatierung innerhalb der Felder. Kein JSON. Kein Kommentar außerhalb des Formats.`

  const metaResp = await generateText({
    model:    anthropic('claude-haiku-4-5-20251001'),
    // 4000 statt 2000 (14.09.2026): Der Block endet mit STEPS. Reisst der Deckel
    // vorher, fehlt genau der Teil, den die Validierung braucht — die teuerste
    // Stelle fuer eine Kuerzung. Ausgeschoepft wird das Budget ohnehin nicht.
    maxTokens: 4000,
    system:   systemPrompt(),
    messages: [{ role: 'user', content: metaPrompt }],
  })

  const data = parseStructuredText(metaResp.text)
  // Rohantwort mitführen: Scheitert die Validierung, stand im Log bisher nur
  // „Zu wenige Schritte" — ohne die Modellantwort war nicht zu sehen, ob das
  // Modell gepatzt hat oder der Parser. Wird nie ins MDX geschrieben
  // (buildMdx liest ausschließlich benannte Felder).
  data.__rohantwort = metaResp.text
  data.__finishReason = metaResp.finishReason
  // Muss der Konvention des Bestands folgen UND dem, was scripts/recipe-images.mjs
  // erzeugt (public/images/rezepte/<slug>.jpg). Vorher stand hier
  // /images/articles/<slug>.webp — ein Pfad, den nichts erzeugt. Der
  // Frontmatter-Validator haette jedes neue Rezept deshalb hart abgelehnt.
  data.image     = `/images/rezepte/${seed.slug}.jpg`
  data.kategorie = seed.kategorie
  data.meatType  = seed.meatType
  data.cookingMethod = seed.cookingMethod
  data.difficulty    = seed.difficulty

  // Phase 2: Artikeltext separat (kein JSON-Escaping-Problem)
  const promptBody = `Schreibe den Artikel-Text für ein Rezept auf steakakademie.de.

Rezept: ${data.title}
Konzept: ${seed.concept}

Format: Reines Markdown, keine Frontmatter, kein JSON.
Struktur:
- Intro (2-3 Sätze: Warum ist dieses Gericht besonders)
- ## [Sinnvoller Abschnitt 1] (Wissenschaft/Hintergrund)
- ## [Sinnvoller Abschnitt 2] (Profi-Wissen oder Equipment)
- ## Häufige Fehler
- Optional: ## Variationen

Mindestens 500 Wörter. Kein Titel als erster Satz. Keine Floskeln wie "In diesem Rezept...".`

  const bodyResp = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    // 4000 statt 1800 (21.09.2026): Der Prompt verlangt mindestens 500 Woerter in
    // vier bis fuenf Abschnitten. Deutscher Fliesstext liegt bei rund 1,7 Token je
    // Wort — 1800 Token reichten dafuer nie. Folge: 54 von 115 Rezepten brachen
    // mitten im letzten Abschnitt ab, meist in "## Variationen", teils mitten im
    // Wort. Gemeldet vom Semantik-Lauf am 21.09.2026.
    maxTokens: 4000,
    system: systemPrompt(),
    messages: [{ role: 'user', content: promptBody }],
  })

  data.body = bodyResp.text.trim()
  // Zweite Absicherung neben dem groesseren Budget: Reisst der Deckel trotzdem,
  // darf der Entwurf NICHT geschrieben werden. validate() macht daraus einen
  // Fehler, der Versuchs-Loop erzeugt das Rezept neu.
  data.__bodyFinishReason = bodyResp.finishReason
  return data
}

// ─── VALIDIERUNG ──────────────────────────────────────────────────────────────

/**
 * KI-Kennzeichnung des Hero-Bildes. `imageAI` und `imageSource` sind seit dem
 * Stichtag 18.08.2026 harte Pflichtfelder (scripts/validate-frontmatter.mjs) und
 * zugleich die Offenlegung nach Art. 50 KI-VO. Der Agent hat sie nie gesetzt —
 * jedes neu erzeugte Rezept waere am Content-Gate gescheitert.
 *
 * Bewusst NICHT "C2PA-belegt" wie beim geprueften Altbestand: Diese Zusage stammt
 * aus einem Metadaten-Scan (docs/bild-audit-rezepte-2026-08-18.md), der hier nicht
 * laeuft. Wir nennen, was wir wissen — nicht, was plausibel klingt.
 */
const IMAGE_SOURCE = 'KI-generiert (FLUX.1 dev via fal.ai, scripts/recipe-images.mjs)'

const REQUIRED = ['title', 'description', 'author', 'authorSlug', 'image', 'imageAlt',
  'land', 'imagePrompt', 'prepTime', 'cookTime', 'totalTime', 'servings', 'kategorie',
  'meatType', 'cookingMethod', 'difficulty', 'ingredients', 'steps']

const VALID_KATEGORIEN = new Set(['fleisch', 'fisch', 'beilagen', 'saucen-rubs', 'desserts', 'wine-spirits'])
const VALID_DIFFICULTY = new Set(['Einfach', 'Mittel', 'Fortgeschritten', 'Profi'])

function validate(data, seed) {
  const errors = []
  for (const field of REQUIRED) {
    if (!data[field]) errors.push(`Pflichtfeld fehlt: ${field}`)
  }
  if (!VALID_KATEGORIEN.has(data.kategorie)) errors.push(`Ungültige Kategorie: ${data.kategorie}`)
  if (!VALID_DIFFICULTY.has(data.difficulty)) errors.push(`Ungültige Schwierigkeit: ${data.difficulty}`)
  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) errors.push('Keine Zutaten')
  if (!Array.isArray(data.steps) || data.steps.length < 2) errors.push('Zu wenige Schritte')
  if (!/^PT/.test(data.prepTime || '')) errors.push(`prepTime kein ISO 8601: ${data.prepTime}`)
  if (!/^PT/.test(data.cookTime  || '')) errors.push(`cookTime kein ISO 8601: ${data.cookTime}`)
  if (!/^PT/.test(data.totalTime || '')) errors.push(`totalTime kein ISO 8601: ${data.totalTime}`)
  const sicherheit = sicherheitsKlasse(seed)
  if (sicherheit) {
    if (!Number.isFinite(data.coreTemp)) {
      errors.push(`Kerntemperatur fehlt (CORE_TEMP) — Pflicht bei ${sicherheit.klasse}`)
    } else if (data.coreTemp < sicherheit.min) {
      errors.push(`Kerntemperatur ${data.coreTemp} °C liegt unter dem Sicherheits-Mindestwert ${sicherheit.klasse} (${sicherheit.min} °C, data/kerntemperatur-referenz.yaml)`)
    }
  }
  // Abgeschnittener Artikeltext (21.09.2026). Zwei unabhaengige Signale, weil
  // finishReason je nach Provider-Pfad fehlen kann: der gemeldete Abbruchgrund und
  // das Satzende. Ein Body, der nicht auf Satzzeichen endet, ist im Bestand immer
  // ein Abbruch gewesen — nie eine Stilentscheidung.
  if (data.__bodyFinishReason === 'length') {
    errors.push('Artikeltext abgeschnitten (finishReason=length)')
  } else if (typeof data.body === 'string' && data.body.trim()) {
    const ende = data.body.trim().slice(-1)
    if (!'.!?:»"\u201c\u201d)'.includes(ende)) {
      errors.push(`Artikeltext endet ohne Satzzeichen ("...${data.body.trim().slice(-40)}") — vermutlich abgeschnitten`)
    }
  }

  // Kategorie aus Seed erzwingen (Modell weicht manchmal ab)
  data.kategorie = seed.kategorie
  data.difficulty = seed.difficulty
  return errors
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(c.bold('\n┌─────────────────────────────────────────────┐'))
  console.log(c.bold('│  Steakakademie — Recipe Agent               │'))
  console.log(c.bold('└─────────────────────────────────────────────┘\n'))

  if (DRY_RUN) console.log(c.yellow('  Dry-run — keine Dateien werden geschrieben\n'))

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(c.yellow('  ⚠ ANTHROPIC_API_KEY fehlt — Recipe-Agent wird übersprungen.\n'))
    process.exit(0)
  }

  if (!DRY_RUN) await mkdir(REZEPTE, { recursive: true })

  const cache   = await loadCache()
  let seeds = alleSeeds()

  if (SLUG_ONLY) {
    seeds = seeds.filter(s => s.slug === SLUG_ONLY)
    if (seeds.length === 0) {
      console.error(c.red(`  ✗ Kein Seed mit slug="${SLUG_ONLY}" gefunden.\n`))
      process.exit(1)
    }
  }

  // Wartet ein Rezept schon als PR auf Freigabe, darf es nicht noch einmal
  // erzeugt werden (siehe slugsInOffenenRezeptPRs). Nur im echten Wachstums-Lauf
  // nachsehen — --force/--slug/--dry-run sollen kein Netz brauchen.
  const inOffenenPRs = (FORCE || SLUG_ONLY || DRY_RUN) ? new Set() : await slugsInOffenenRezeptPRs()
  if (inOffenenPRs.size > 0) {
    console.log(`  ${inOffenenPRs.size} Rezept(e) warten in offenen PRs auf Freigabe — werden uebersprungen`)
  }

  let toGenerate = FORCE
    ? seeds
    : seeds.filter(s => {
        const outFile = join(REZEPTE, `${s.slug}.mdx`)
        // Cache ODER existierende Datei ODER offener PR → skip
        return !cache[s.slug] && !existsSync(outFile) && !inOffenenPRs.has(s.slug)
      })
  const pendingTotal = toGenerate.length
  if (LIMIT > 0) toGenerate = toGenerate.slice(0, LIMIT)   // „täglich 1" etc.

  // Seed-Liste trockengelaufen → Signal für CI-Benachrichtigung (Jira),
  // damit Uwe neue Cuts nachlegt. Nur im echten Wachstums-Lauf (nicht --force/--slug).
  if (!FORCE && !SLUG_ONLY && process.env.GITHUB_OUTPUT) {
    // pendingTotal = wie viele Seeds noch unerledigt sind. Wird im Workflow zur
    // Vorwarnung genutzt — nicht erst bei null, sondern schon bei knappem Vorrat.
    appendFileSync(process.env.GITHUB_OUTPUT, `seeds_remaining=${pendingTotal}\n`)
    if (pendingTotal === 0) appendFileSync(process.env.GITHUB_OUTPUT, 'seeds_exhausted=true\n')
  }

  console.log(`  ${seeds.length} Rezepte in Seed-Liste`)
  console.log(`  ${seeds.length - toGenerate.length} bereits generiert (Cache)`)
  console.log(`  ${c.yellow(toGenerate.length + '')} neu zu generieren\n`)

  if (toGenerate.length === 0) {
    console.log(c.green('  Alle Rezepte aktuell — nichts zu tun.\n'))
    return
  }

  let success = 0, failed = 0

  // Zwei Anläufe je Seed. Das Modell ist nicht deterministisch: Lauf #100
  // (14.09.2026) scheiterte an einer einzelnen Antwort, die das Schritt-Format
  // verfehlte — und damit fiel die Tagesproduktion komplett aus. Ein zweiter
  // Versuch kostet ein paar Sekunden und rettet genau diesen Fall.
  const VERSUCHE = 2

  for (const seed of toGenerate) {
    let data = null
    let letzteFehler = []

    for (let versuch = 1; versuch <= VERSUCHE; versuch++) {
      const anlauf = versuch > 1 ? c.dim(` (Versuch ${versuch}/${VERSUCHE})`) : ''
      process.stdout.write(`  Generiere: ${c.bold(seed.slug)}${anlauf}... `)

      let kandidat
      try {
        kandidat = await generateRecipe(seed)
      } catch (err) {
        console.log(c.red('FEHLER'))
        console.error(c.dim(`    ${err.message}`))
        letzteFehler = [err.message]
        continue
      }

      const errors = validate(kandidat, seed)
      if (errors.length === 0) { data = kandidat; break }

      console.log(c.yellow('VALIDIERUNGSFEHLER'))
      errors.forEach(e => console.error(c.dim(`    ✗ ${e}`)))
      letzteFehler = errors
      // Nur beim letzten Anlauf ausgeben — sonst flutet es das Log.
      if (versuch === VERSUCHE) {
        // Der Kopf der Antwort half bei Lauf #101 nicht weiter: Die 1500 Zeichen
        // waren nach dem Metadaten-Block aufgebraucht, und genau das Ende — wo
        // STEPS steht — fehlte. Deshalb: Abbruchgrund, Laenge, und das ENDE.
        const roh = kandidat.__rohantwort ?? ''
        console.error(c.dim(`    ── Modellantwort: ${roh.length} Zeichen, finishReason=${kandidat.__finishReason ?? '?'} ──`))
        console.error(c.dim(`    Enthält "STEPS:": ${roh.includes('STEPS:')}`))
        console.error(c.dim('    ── letzte 1800 Zeichen ──'))
        console.error(c.dim(roh.slice(-1800) || '(keine)'))
        console.error(c.dim('    ─────────────────────────'))
      }
    }

    if (!data) {
      console.error(c.red(`  ✗ ${seed.slug} nach ${VERSUCHE} Versuchen aufgegeben: ${letzteFehler.join('; ')}`))
      failed++
      continue
    }

    const mdx     = buildMdx(data)
    const outFile = join(REZEPTE, `${seed.slug}.mdx`)

    if (!DRY_RUN) {
      await writeFile(outFile, mdx, 'utf-8')
    }

    console.log(c.green('OK'))
    console.log(c.dim(`    → ${seed.kategorie} | ${data.difficulty} | ${data.servings} Portionen`))

    cache[seed.slug] = { at: TODAY, title: data.title }
    success++
  }

  await saveCache(cache)

  console.log(c.bold('\n  ─────────────────────────────────────────────'))
  if (success > 0) console.log(c.green(`  ✓ ${success} Rezept(e) generiert`))
  if (failed  > 0) console.log(c.red(  `  ✗ ${failed} Fehler`))
  console.log()

  // Kein einziges Rezept durchgekommen, obwohl welche anstanden → das ist ein
  // Ausfall, kein Normalzustand. Vorher endete der Lauf hier gruen und still.
  if (success === 0 && failed > 0) {
    console.error(c.red(`  Alle ${failed} Generierungen fehlgeschlagen — Lauf wird als Fehler gewertet.`))
    process.exitCode = 1
  }
}

// Nur beim direkten Aufruf laufen lassen — sonst startet schon der Import im Test
// einen echten Generierungslauf. Gleiches Muster wie scripts/ops-alert-to-jira.mjs.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error(c.red(`\n  Agent-Fehler: ${err.message}\n`))
    process.exit(1)
  })
}

// Für scripts/recipe-agent.test.mjs. Reine Funktionen, keine Nebenwirkungen.
export { parseStructuredText, validate, alleSeeds, sicherheitsKlasse, systemPrompt, slugsInOffenenRezeptPRs }
