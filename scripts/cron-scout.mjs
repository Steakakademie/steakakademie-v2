#!/usr/bin/env node
/**
 * Steakakademie — Autonomer Content-Autopilot
 *
 * Vollständiger Pipeline-Zyklus:
 *   Scout → Content → Image → Publisher
 *
 * Usage:
 *   node scripts/cron-scout.mjs              # Vollständiger Lauf (Relevanz ≥ 8)
 *   node scripts/cron-scout.mjs --dry-run    # Ohne DB-Schreibzugriff
 *   node scripts/cron-scout.mjs --threshold 6 # Niedrigere Relevanz-Schwelle
 *   node scripts/cron-scout.mjs --source src_gbaev  # Nur eine Quelle
 *   node scripts/cron-scout.mjs --scout-only # Nur Scout-Phase
 */

import { createClient }  from '@supabase/supabase-js'
import Anthropic          from '@anthropic-ai/sdk'
import { readFile }       from 'fs/promises'
import { join, dirname }  from 'path'
import { fileURLToPath }  from 'url'
import dotenv             from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = join(__dirname, '..')

dotenv.config({ path: join(ROOT, '.env.local') })

// ─── Flags ────────────────────────────────────────────────────────────────────

const DRY_RUN    = process.argv.includes('--dry-run')
const SCOUT_ONLY = process.argv.includes('--scout-only')
const SOURCE_ID  = process.argv.includes('--source')
  ? process.argv[process.argv.indexOf('--source') + 1]
  : null
const THRESHOLD  = process.argv.includes('--threshold')
  ? parseFloat(process.argv[process.argv.indexOf('--threshold') + 1])
  : 3
// Frische-Filter (03.09.2026): Feeds liefern Altbestand mit — im Probelauf
// „DGM2022", einen Relaunch von 2023 und Personalien. Ohne Datumsgrenze ging
// jeder dieser Eintraege in die Opus-Generierung (Kosten) und in die
// Review-Warteschlange (Uwes Zeit). Eintraege ohne pubDate werden behalten.
const MAX_AGE_DAYS = process.argv.includes('--max-age')
  ? parseInt(process.argv[process.argv.indexOf('--max-age') + 1], 10)
  : 21

// ─── Farben ───────────────────────────────────────────────────────────────────

const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  blue:   s => `\x1b[34m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
}

// ─── Clients ──────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
)

// ─── Source-Registry (inline, da .ts nicht direkt importierbar) ───────────────

const SOURCES = [
  { id: 'src_texas_monthly',    name: 'Texas Monthly',         feed_url: 'https://www.texasmonthly.com/feed/',              language: 'en', hint: 'usa' },
  { id: 'src_amazing_ribs',     name: 'AmazingRibs',           feed_url: 'https://amazingribs.com/feed/',                   language: 'en', hint: 'general-bbq' },
  { id: 'src_serious_eats',     name: 'Serious Eats',          feed_url: 'https://www.seriouseats.com/feeds/all.xml',       language: 'en', hint: 'general-bbq' },
  { id: 'src_gbaev',            name: 'GBAEV',                 feed_url: 'https://www.gbaev.de/feed/',                      language: 'de', hint: 'championship-2026' },
  { id: 'src_bbqpit',           name: 'BBQ Pit',               feed_url: 'https://www.bbqpit.de/feed/',                     language: 'de', hint: 'deutschland' },
  { id: 'src_grillkameraden',   name: 'Grillkameraden',        feed_url: 'https://www.grillkameraden.de/feed/',             language: 'de', hint: 'deutschland' },
  { id: 'src_bbqlove',          name: 'BBQ Love',              feed_url: 'https://www.bbqlove.de/feed/',                    language: 'de', hint: 'general-bbq' },
  { id: 'src_die_frau_am_grill',name: 'Die Frau am Grill',     feed_url: 'https://www.die-frau-am-grill.de/feed/',          language: 'de', hint: 'queen-of-fire' },
]

// ─── RSS-Parser ───────────────────────────────────────────────────────────────

function parseRss(xml) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = itemRegex.exec(xml)) !== null) {
    const b = m[1]
    const get = tag => {
      const r = b.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
      return r ? (r[1] ?? r[2] ?? '').trim() : ''
    }
    items.push({
      title:   get('title'),
      link:    get('link'),
      summary: get('description').replace(/<[^>]+>/g, '').slice(0, 600),
      pub:     get('pubDate'),
    })
  }
  return items.slice(0, 8)
}

async function fetchFeed(source) {
  try {
    const res = await fetch(source.feed_url, {
      headers: { 'User-Agent': 'Steakakademie-Scout/1.0' },
      signal:  AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRss(xml).map(item => ({
      source_id: source.id,
      url: item.link,
      title: item.title,
      summary: item.summary,
      published_at: item.pub ? new Date(item.pub) : null,
      fetched_at: new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

const KEYWORDS = {
  championship: { words: ['meisterschaft', 'championship', 'competition', '2026', 'gbaev', 'bbq battle', 'weltmeisterschaft'], weight: 3.0 },
  qof:          { words: ['frau', 'women', 'hosting', 'eleganz', 'kulinarisch', 'sensorik', 'maillard', 'tischkultur', 'weinglas'], weight: 2.5 },
  plant:        { words: ['vegan', 'vegetarisch', 'plant-based', 'pflanzlich', 'tofu', 'halloumi', 'jackfruit', 'gemüse', 'portobello', 'blumenkohl'], weight: 2.5 },
  science:      { words: ['maillard', 'reverse sear', 'kerntemperatur', 'collagen', 'smoke ring', 'sous vide', 'gartemperatur'], weight: 2.5 },
  bbq_core:     { words: ['bbq', 'barbecue', 'grillrezept', 'smoker', 'pulled pork', 'spare ribs', 'rippchen', 'low and slow'], weight: 2.0 },
  recipe:       { words: ['rezept', 'recipe', 'zubereitung', 'marinade', 'rub', 'würzen', 'einreiben'], weight: 1.5 },
  country:      { words: ['asado', 'churrasco', 'yakiniku', 'galbi', 'braai', 'picanha', 'brisket', 'wagyu', 'texas', 'pitmaster'], weight: 2.0 },
  technique:    { words: ['grillen', 'smoken', 'räuchern', 'indirekt', 'direkt', 'holzkohle', 'feuer', 'glut'], weight: 1.0 },
}

// Quellen-Bonus: bestimmte Quellen erhalten Grundbonus wegen thematischer Relevanz
const SOURCE_BONUS = {
  src_die_frau_am_grill: 2.5, // QoF-Pipeline — auch Kuchen-Artikel können relevant sein
  src_gbaev:             3.0, // Meisterschaften — fast immer relevant
  src_grillkameraden:    1.5,
  src_bbqpit:            1.0,
  src_bbqlove:           1.0,
}

function score(article) {
  const text = `${article.title} ${article.summary}`.toLowerCase()
  let s = 0
  for (const { words, weight } of Object.values(KEYWORDS)) {
    s += words.filter(k => text.includes(k)).length * weight
  }
  // Quellen-Bonus
  s += SOURCE_BONUS[article.source_id] ?? 0
  return Math.min(10, Math.round(s * 10) / 10)
}

function detectCategory(article, hint) {
  const text = `${article.title} ${article.summary}`.toLowerCase()
  if (['meisterschaft','championship','2026','gbaev'].some(k => text.includes(k))) return 'championship-2026'
  if (['vegan','vegetarisch','pflanzlich','plant-based','tofu','jackfruit','portobello','halloumi'].some(k => text.includes(k))) return 'pflanzlich'
  if (hint === 'queen-of-fire' || ['maillard','sensorik','hosting'].filter(k => text.includes(k)).length >= 2) return 'queen-of-fire'
  for (const [country, signals] of Object.entries({
    usa:          ['texas','brisket','pitmaster'],
    argentinien:  ['asado','parrilla','gaucho'],
    brasilien:    ['churrasco','picanha','rodizio'],
    japan:        ['yakiniku','wagyu'],
    korea:        ['galbi','bulgogi','kbbq'],
    suedafrika:   ['braai','boerewors'],
    thailand:     ['satay','moo ping'],
    tuerkei:      ['mangal','kebab'],
    spanien:      ['chuletón','asador','txuleta'],
  })) {
    if (signals.some(s => text.includes(s))) return country
  }
  return hint === 'equipment' ? 'equipment' : 'general-bbq'
}

// ─── Frische-Filter ───────────────────────────────────────────────────────────

function isStale(article) {
  const d = article.published_at
  if (!(d instanceof Date) || isNaN(d.getTime())) return false   // kein Datum → behalten
  return (Date.now() - d.getTime()) > MAX_AGE_DAYS * 86_400_000
}

// ─── Discard-Filter (offensichtlich irrelevante Artikel) ─────────────────────

const DISCARD_PATTERNS = [
  /crossword/i, /word wrangler/i, /puzzle/i, /quiz/i,
  /gewinnspiel/i, /verlosung/i, /werbung/i,
  /obituary/i, /death notice/i, /nachruf/i,
]

// Produkttests fremder Redaktionen (29.09.2026): Aus Titel + Teaser entstand
// „… im Test" unter unserem Namen — ohne dass die Steakakademie je getestet
// hat (irreführend, UWG). Solche Eintraege gehen gar nicht erst in Opus.
const TEST_PATTERNS = [/\bim test\b/i, /\btest:/i, /testbericht/i, /\bim praxistest\b/i, /\breview\b/i]

// Grillbezug (29.09.2026): Der Quellen-Bonus (Die Frau am Grill 2,5) hob
// Grießnockerl, Zitronencreme und Brezelaufstrich allein über die Schwelle.
// Ohne mindestens ein Grill-/BBQ-Signal im Text kein Briefing.
const GRILL_SIGNALE = [
  ...KEYWORDS.bbq_core.words, ...KEYWORDS.technique.words, ...KEYWORDS.country.words,
  'grill', 'rotisserie', 'drehspieß', 'planke', 'dutch oven', 'feuerplatte', 'plancha',
]

function hatGrillbezug(article) {
  const text = `${article.title} ${article.summary}`.toLowerCase()
  return GRILL_SIGNALE.some(w => text.includes(w))
}

export function shouldDiscard(article) {
  if (DISCARD_PATTERNS.some(rx => rx.test(article.title))) return true
  if (TEST_PATTERNS.some(rx => rx.test(article.title))) return true
  return !hatGrillbezug(article)
}

// ─── HTML-Entity-Decoder ──────────────────────────────────────────────────────

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#038;/g, '&').replace(/&#124;/g, '|')
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

function toSlug(t) {
  return t.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').slice(0,80)
}

// ─── Content-Generierung ──────────────────────────────────────────────────────

const QOF_FORBIDDEN = ['Fleischporno','brutal','Macho','echte Männer','für Männer']
const QOF_THEMES    = ['Maillard','Sensorik','Hosting','Präzision','kulinarisch']

function systemPrompt(category, hint) {
  if (category === 'queen-of-fire') return `Du bist Chefredakteurin für das Premium-Editorial "Queen of Fire" auf steakakademie.de.
Tonalität: kulinarische Präzision, Maillard-Reaktion, Sensorik, Hosting.
VERBOTEN: ${QOF_FORBIDDEN.join(', ')}.
PFLICHT: mind. 2 Themen aus: ${QOF_THEMES.join(', ')}.`

  if (category === 'championship-2026') return `Du bist BBQ-Wettkampf-Redakteur auf steakakademie.de. Schreibe strukturierte Event-Berichte über Meisterschaften 2026. Ton: enthusiastisch, community-nah.`

  if (category === 'pflanzlich') return `Du bist Redakteur für pflanzliches & veganes Grillen auf steakakademie.de.
Tonalität: Technik statt Beilagen-Denken — Gemüse, Pilze, Tofu, Halloumi, Jackfruit als eigenständige Hauptrollen.
PFLICHT: konkrete Temperaturen, direkte vs. indirekte Hitze, Röstaromen. Kennzeichne klar, ob vegan oder vegetarisch.`

  return `Du bist Senior-Redakteur für BBQ & Grill auf steakakademie.de. Ton: direkt, leidenschaftlich, expertenhaft. Immer Temperaturen und Techniken einbauen.`
}

const GATE_REGELN = [
  ['fahrenheit',   /\d\s?°\s?F\b|\bFahrenheit\b/],
  ['imperial',     /\d\s?(Pfund|lbs?|oz|Unzen|Zoll|inch(es)?)\b/i],
  ['ich-form',     /(^|[\s„"(])(ich|mir|mich|mein(e|en|em|er)?)\b/i],
  ['testbehauptung', /\b(im test|getestet|unser test|testergebnis|im praxistest|testurteil)\b/i],
]

export function pruefeEntwurf(text) {
  return GATE_REGELN.filter(([, rx]) => rx.test(text)).map(([name]) => name)
}

async function generateContent(briefing) {
  const cat = briefing.category
  const regeln = `HARTE REGELN (verletzt = Entwurf wird verworfen):
- Du kennst NUR Titel und Teaser der Quelle, nicht den Artikel. Schreibe deshalb
  KEINEN Bericht über den Quellartikel, sondern einen eigenständigen Wissensartikel
  der Steakakademie zum Thema. Keine Aussagen über konkrete Betriebe, Personen,
  Produkte, Preise oder Ereignisse, die nicht wörtlich im Teaser stehen.
- Keine Ich- oder Wir-Form, keine Erlebnisse, keine Besuche, keine Verkostungen.
- Keine Test-, Prüf- oder Vergleichsbehauptungen („im Test", „getestet", „unser Fazit
  nach X Stunden") — die Steakakademie hat nichts davon selbst geprüft.
- Kerntemperaturen, Garzeiten und Reifungs-Fakten NIE raten: verweise auf den
  Temperatur-Guide (/temperatur-guide) statt Zahlen zu nennen.
- Nur metrische Einheiten und °C. Kein °F, keine Pfund, Unzen, Zoll.`
  const msg = await anthropic.messages.create({
    model:      'claude-opus-4-7',
    max_tokens: 3072,
    // Automatisches Prompt-Caching (Breakpoint setzt/verschiebt die API selbst)
    cache_control: { type: 'ephemeral' },
    thinking:   { type: 'adaptive' },
    system:     systemPrompt(cat),
    messages: [{
      role: 'user',
      content: `Briefing:
Titel: ${briefing.article.title}
Zusammenfassung: ${briefing.article.summary}
Kategorie: ${cat}

${regeln}

Antworte NUR als JSON:
{"title":"...","content_body":"... (600-1000 Wörter, Markdown)","seo_title":"... (max 60)","seo_description":"... (max 160)","image_prompt_en":"... (englischer Bild-Prompt)"}`
    }],
  })

  const text = msg.content.find(b => b.type === 'text')?.text ?? ''
  const m    = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('Kein JSON in Antwort')
  const parsed = JSON.parse(m[0])

  // Qualitäts-Gate (29.09.2026): Was die Regeln bricht, landet nicht in der
  // Review-Warteschlange — Uwe soll entscheiden, nicht aussortieren.
  const gate = pruefeEntwurf(`${parsed.title}\n${parsed.content_body}`)
  if (gate.length) throw new Error(`Gate: ${gate.join(', ')}`)

  // QoF Ton-Check
  const lower = parsed.content_body.toLowerCase()
  const violations = cat === 'queen-of-fire'
    ? QOF_FORBIDDEN.filter(k => lower.includes(k.toLowerCase()))
    : []

  return {
    id:                   `draft_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    source_briefing_id:   briefing.article.url,
    category:             cat,
    title:                parsed.title,
    slug:                 toSlug(parsed.title),
    content_body:         parsed.content_body,
    seo_title:            parsed.seo_title,
    seo_description:      parsed.seo_description,
    image_prompt_en:      parsed.image_prompt_en,
    tone_check_passed:    violations.length === 0,
    tone_violations:      violations,
    status:               (cat === 'championship-2026' || violations.length) ? 'review' : 'draft',
    generated_at:         new Date().toISOString(),
  }
}

// ─── Image-Prompt ─────────────────────────────────────────────────────────────

const IMAGE_STYLES = {
  'queen-of-fire':     { style: 'editorial food photography, bright natural daylight, clean marble, elegant minimal', negative: 'dark, bloody, raw meat, aggressive, messy, masculine', ratio: '4:5' },
  'championship-2026': { style: 'BBQ competition event photography, outdoor, trophy, team aprons',                   negative: 'studio, empty, no people',                          ratio: '16:9' },
  pflanzlich:          { style: 'vibrant plant-based grill photography, charred vegetables, fresh herbs, natural light, appetizing', negative: 'raw meat, blood, dark, dull',          ratio: '16:9' },
  default:             { style: 'professional BBQ food photography, grill marks, perfect sear, natural light',        negative: 'raw bloody meat, messy, dark',                      ratio: '16:9' },
}

function buildImageBrief(draft) {
  const s = IMAGE_STYLES[draft.category] ?? IMAGE_STYLES.default
  return {
    draft_id:              draft.id,
    prompt_en:             `${draft.image_prompt_en}, ${s.style}, 4K, photorealistic, professional photography`,
    negative_prompt_en:    s.negative,
    image_style_preset:    draft.category,
    image_aspect_ratio:    s.ratio,
    generated_at:          new Date().toISOString(),
  }
}

// ─── Publisher ────────────────────────────────────────────────────────────────

async function publish(draft, image) {
  if (DRY_RUN) return { success: true, dry: true }
  const { error } = await supabase.from('content_drafts').upsert({
    ...draft,
    image_negative_prompt_en: image.negative_prompt_en,
    image_aspect_ratio:       image.image_aspect_ratio,
    image_style_preset:       image.image_style_preset,
  }, { onConflict: 'slug' })
  return { success: !error, error: error?.message }
}

async function logRun(runId, stats) {
  if (DRY_RUN) return
  await supabase.from('pipeline_runs').upsert({
    run_id:           runId,
    completed_at:     new Date().toISOString(),
    status:           'completed',
    ...stats,
  }, { onConflict: 'run_id' })
}

// ─── Haupt-Pipeline ───────────────────────────────────────────────────────────

async function main() {
  const runId   = `run_${Date.now()}`
  const started = Date.now()

  console.log(c.bold('\n🥩 Steakakademie — Content-Autopilot'))
  console.log(c.dim(`Run-ID: ${runId}`))
  if (DRY_RUN)    console.log(c.yellow('⚠  DRY-RUN — kein DB-Schreibzugriff'))
  if (SCOUT_ONLY) console.log(c.yellow('⚠  SCOUT-ONLY — kein Content generiert'))
  console.log(c.dim(`Relevanz-Schwelle: ${THRESHOLD}/10\n`))

  const sources = SOURCE_ID
    ? SOURCES.filter(s => s.id === SOURCE_ID)
    : SOURCES

  // ── PHASE 1: Scout ──────────────────────────────────────────────────────────

  console.log(c.blue('━━ Phase 1: Scout '))
  const briefings = []
  let stale = 0

  for (const source of sources) {
    process.stdout.write(c.dim(`  Fetch ${source.name}... `))
    const articles = await fetchFeed(source)

    for (const raw of articles) {
      const article = { ...raw, title: decodeEntities(raw.title), summary: decodeEntities(raw.summary) }
      if (shouldDiscard(article)) continue
      if (isStale(article)) { stale++; continue }
      const relevance = score(article)
      if (relevance < THRESHOLD) continue

      const category = detectCategory(article, source.hint)
      if (category === 'championship-2026') continue  // Event-Content raus (Abmahn-Grauzone, fremde Recherche)
      briefings.push({
        article,
        relevance_score: relevance,
        category,
        championship_detected: category === 'championship-2026',
      })
    }
    console.log(c.green(`${articles.length} Artikel (${briefings.length} relevant)`))
  }

  console.log(c.bold(`\n  Scout: ${briefings.length} Briefings erstellt\n`))
  briefings.forEach(b => {
    const icon = b.category === 'queen-of-fire' ? '👸' : b.championship_detected ? '🏆' : '📄'
    console.log(`  ${icon} [${b.relevance_score.toFixed(1)}] ${b.article.title.slice(0,70)}`)
    console.log(c.dim(`     → ${b.category}`))
  })

  if (stale > 0) console.log(c.dim(`  ${stale} Eintrag/Eintraege aelter als ${MAX_AGE_DAYS} Tage uebersprungen`))

  // Dedupe (03.09.2026): Was schon einmal generiert wurde, wird nicht erneut
  // durch Opus geschickt. Schluessel ist die Quell-URL (source_briefing_id),
  // nicht der Slug — der entsteht erst aus dem generierten Titel und waere
  // beim zweiten Lauf ein anderer. Ohne diesen Schritt haette jeder
  // Wochenlauf dieselben Feed-Eintraege noch einmal bezahlt und als neue
  // Entwuerfe in die Warteschlange gelegt.
  if (!DRY_RUN && briefings.length > 0) {
    const urls = briefings.map(b => b.article.url).filter(Boolean)
    const { data: known, error } = await supabase
      .from('content_drafts')
      .select('source_briefing_id')
      .in('source_briefing_id', urls)
    if (!error && known?.length) {
      const seen = new Set(known.map(k => k.source_briefing_id))
      const before = briefings.length
      for (let i = briefings.length - 1; i >= 0; i--) {
        if (seen.has(briefings[i].article.url)) briefings.splice(i, 1)
      }
      console.log(c.dim(`  ${before - briefings.length} bereits vorhandene Quelle(n) uebersprungen`))
    }
  }

  if (SCOUT_ONLY || briefings.length === 0) {
    console.log(c.yellow('\n  Scout-Only-Modus oder keine Briefings. Fertig.'))
    return
  }

  // ── PHASE 2 & 3: Content + Image ────────────────────────────────────────────

  console.log(c.blue('\n━━ Phase 2: Content + Image '))
  const pairs = []
  let generated = 0, skipped = 0

  for (const briefing of briefings) {
    process.stdout.write(c.dim(`  Generiere: ${briefing.article.title.slice(0,50)}... `))
    try {
      const draft = await generateContent(briefing)
      const image = buildImageBrief(draft)
      pairs.push({ draft, image })
      generated++

      const toneIcon = draft.tone_check_passed ? c.green('✓') : c.yellow('⚠ REVIEW')
      console.log(`${toneIcon} ${draft.title.slice(0,50)}`)
      if (!draft.tone_check_passed) {
        console.log(c.yellow(`    Ton-Verletzungen: ${draft.tone_violations.join(', ')}`))
      }
    } catch (err) {
      console.log(c.red(`✗ Fehler: ${err.message.slice(0,60)}`))
      skipped++
    }
  }

  // ── PHASE 4: Publisher ───────────────────────────────────────────────────────

  console.log(c.blue('\n━━ Phase 3: Publisher '))
  let published = 0, failed = 0

  for (const { draft, image } of pairs) {
    const result = await publish(draft, image)
    if (result.success) {
      published++
      console.log(c.green(`  ✓ ${draft.slug}`))
    } else {
      failed++
      console.log(c.red(`  ✗ ${draft.slug}: ${result.error}`))
    }
  }

  // ── Report ────────────────────────────────────────────────────────────────

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  const stats = {
    articles_fetched:  sources.length * 8,
    briefings_created: briefings.length,
    drafts_generated:  generated,
    drafts_published:  published,
    errors:            [],
  }

  await logRun(runId, stats)

  console.log(c.bold('\n━━ Ergebnis '))
  console.log(`  Briefings erstellt : ${c.green(briefings.length)}`)
  console.log(`  Drafts generiert   : ${c.green(generated)}`)
  console.log(`  Publiziert         : ${c.green(published)}`)
  console.log(`  Fehler             : ${failed > 0 ? c.red(failed) : c.dim(failed)}`)
  console.log(`  Laufzeit           : ${elapsed}s`)
  if (DRY_RUN) console.log(c.yellow('\n  DRY-RUN — nichts wurde in DB geschrieben'))
  console.log()
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch(err => {
  console.error(c.red(`\n✗ Pipeline-Fehler: ${err.message}`))
  process.exit(1)
})
