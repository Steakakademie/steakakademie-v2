#!/usr/bin/env node
/**
 * Steakakademie Recipe Image Generator (FLUX.1 dev via fal.ai)
 *
 * Generiert für Rezepte OHNE vorhandenes Hero-Bild ein markenkonformes,
 * NATÜRLICH getuntes Food-Foto, speichert es nach public/images/rezepte/<slug>.jpg
 * und patcht das `image:`-Feld im Frontmatter. Idempotent (überspringt vorhandene).
 *
 * Usage:
 *   FAL_KEY=... node scripts/recipe-images.mjs            # alle fehlenden
 *   FAL_KEY=... node scripts/recipe-images.mjs --limit 3  # nur N
 *   node scripts/recipe-images.mjs --dry-run              # nur Prompts zeigen
 *   FAL_KEY=... node scripts/recipe-images.mjs --force    # auch vorhandene neu
 *
 * Env: FAL_KEY (key_id:secret). In CI als GitHub-Secret gesetzt.
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT     = join(__dirname, '..')
const REZEPTE  = join(ROOT, 'content', 'rezepte')
const IMG_DIR  = join(ROOT, 'public', 'images', 'rezepte')

const DRY   = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const LIMIT = process.argv.includes('--limit')
  ? parseInt(process.argv[process.argv.indexOf('--limit') + 1], 10) : Infinity
// --only slug1,slug2 → nur diese Rezepte (gezielte Regenerierung)
const ONLY = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',').map(s => s.trim())
  : null
// --look warm|dramatic → dramatic = Hero-Eyecatcher (dunkel/Flammen), Output <slug>-hero.jpg + heroImage:
const LOOK = process.argv.includes('--look')
  ? (process.argv[process.argv.indexOf('--look') + 1] || 'warm').trim()
  : 'warm'
const DRAMATIC = LOOK === 'dramatic'

// FAL_KEY robust: env zuerst, sonst .env.local manuell (dotenv-Quirk umgehen)
let FAL_KEY = process.env.FAL_KEY
if (!FAL_KEY && existsSync(join(ROOT, '.env.local'))) {
  const m = (await readFile(join(ROOT, '.env.local'), 'utf8')).match(/^FAL_KEY=(.+)$/m)
  if (m) FAL_KEY = m[1].trim()
}

const c = { g: s => `\x1b[32m${s}\x1b[0m`, y: s => `\x1b[33m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, d: s => `\x1b[2m${s}\x1b[0m` }

function fm(raw, key) {
  const m = raw.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, 'm'))
  return m ? m[1] : ''
}

// Anatomisch präzise Cut-Beschreibungen → FLUX rendert den RICHTIGEN Schnitt.
// Schlüssel werden als Teilstring im lowercased meatType/slug gesucht.
const CUT_ANATOMY = {
  'porterhouse': 'a single thick porterhouse steak with a clearly visible T-shaped bone running down the center, a large striploin muscle on one side and a LARGE round tenderloin filet on the other side of the bone',
  't-bone':      'a single thick T-bone steak with a clearly visible T-shaped bone, a striploin muscle on one side and a small round tenderloin filet on the other',
  'tomahawk':    'a thick tomahawk steak: a ribeye with the large round central eye muscle and crescent fat cap, attached to a long frenched (cleaned) rib bone handle',
  'ribeye':      'a single thick boneless ribeye steak showing the large round central eye muscle (longissimus) with the distinctive crescent-shaped spinalis fat cap on top and rich fine marbling',
  'rib-eye':     'a single thick boneless ribeye steak showing the large round central eye muscle with the crescent-shaped spinalis fat cap and rich marbling',
  'entrecôte':   'a single thick entrecôte (ribeye) steak with the round central eye muscle, fat cap and fine marbling',
  'entrecote':   'a single thick entrecôte (ribeye) steak with the round central eye muscle, fat cap and fine marbling',
  'flank':       'a flat, long flank steak with clearly visible long parallel muscle fibers',
  'onglet':      'a single hanger steak (onglet), a thick rope-like muscle with coarse grain and a central sinew',
  'brisket':     'a sliced smoked beef brisket showing a dark peppery bark, a pink smoke ring just under the surface, and visible fat cap',
  'short rib':   'thick beef short ribs on the bone with a dark smoky bark',
  'roastbeef':   'a thick striploin / roastbeef steak with a firm fat rim along one edge',
  'wagyu':       'a single wagyu beef steak with extreme dense web-like marbling throughout the bright red meat',
}

function cutAnatomy(meat, slug) {
  const hay = `${meat} ${slug}`.toLowerCase()
  for (const [k, v] of Object.entries(CUT_ANATOMY)) if (hay.includes(k)) return v
  return ''
}

// Nicht-Rind-Proteine: explizite ENGLISCHE Motiv-Anker → FLUX rendert das RICHTIGE Tier.
// (Deutscher Alt-Text im englischen Prompt erzeugte sonst generische Braten = Huhn statt Ente.)
// Spezifische Schlüssel ZUERST — der erste Teilstring-Treffer gewinnt.
const PROTEIN_SUBJECT = {
  'lammkarree':        'a grilled rack of lamb with frenched rib bones, a dark charred herb crust and a rosy-pink juicy interior',
  'lammkeule':         'a whole roasted leg of lamb, charred herb crust outside, sliced to show a rosy-pink juicy interior',
  'lammkotelett':      'several grilled lamb chops with charred fat edges and rosy-pink centres',
  'lamm':              'grilled lamb with a dark charred herb crust and a rosy-pink juicy interior',
  'haehnchenschenkel': 'grilled chicken legs and thighs with golden-brown crispy skin, juicy',
  'hähnchenschenkel':  'grilled chicken legs and thighs with golden-brown crispy skin, juicy',
  'haehnchen':         'a whole roast chicken with golden-brown crispy skin',
  'hähnchen':          'a whole roast chicken with golden-brown crispy skin',
  'chicken':           'a whole roast chicken with golden-brown crispy skin',
  'ente':              'a whole roasted duck with crispy lacquered mahogany-brown skin, a plump rounded body and dark rich meat — clearly a DUCK, not a chicken',
  'duck':              'a whole roasted duck with crispy lacquered mahogany-brown skin, a plump rounded body and dark rich meat — clearly a DUCK, not a chicken',
  'gans':              'a whole roasted goose with deep golden-brown crispy skin and dark poultry meat',
  'pute':              'a roasted turkey portion with golden-brown crispy skin and juicy meat',
  'lachs':             'a grilled salmon fillet with flaky coral-pink flesh and crisp browned skin',
  'salmon':            'a grilled salmon fillet with flaky coral-pink flesh and crisp browned skin',
  'forelle':           'a whole grilled trout with crisp charred skin and moist white flaky flesh',
  'thunfisch':         'a seared tuna steak with a dark crust and a deep-red rare centre',
  'garnele':           'grilled prawns with lightly charred shells, juicy',
  'fisch':             'a whole grilled fish with lightly charred crisp skin and moist flaky white flesh',
  'presa':             'a grilled Iberico pork presa with a dark seared crust, fine marbling and a juicy just-cooked interior',
  'pluma':             'a grilled Iberico pork pluma with a seared crust and a juicy just-cooked interior',
  'secreto':           'a grilled Iberico pork secreto, a thin marbled cut, charred and juicy',
  'carrillera':        'braised Iberico pork cheeks with a dark glossy glaze, fork-tender',
  'schweineschulter':  'pulled pork from a slow-smoked pork shoulder, dark bark and shredded juicy strands',
}

function proteinSubject(meat, slug) {
  const hay = `${meat} ${slug}`.toLowerCase()
  for (const [k, v] of Object.entries(PROTEIN_SUBJECT)) if (hay.includes(k)) return v
  return ''
}

// Bild-Prompt-Doktrin (siehe CLAUDE.md): KEINE Wörter wie "photorealistic"/"4K"/"8k"
// (erzeugen den künstlichen Plastik-Look). Stattdessen Textur- + Kamera-Sprache und
// der "sliced"-Trick. Klassifizierung wählt die richtige Fleisch-Doktrin.
const STEAK_RE   = /\b(ribeye|rib-?eye|entrecote|entrecôte|t-?bone|tomahawk|porterhouse|rumpsteak|sirloin|striploin|roastbeef|picanha|wagyu|flank|onglet|hanger|rindersteak|beef steak|steak)\b/i
const SMOKED_RE  = /\b(brisket|pulled pork|spare ?ribs|baby ?back|ribs|rippchen|short ?rib|smoked|pastrami)\b/i
const POULTRY_RE = /\b(ente|duck|gans|goose|h(?:ä|ae)hnchen|chicken|pute|turkey|geflügel|poultry)\b/i
const FISH_RE    = /\b(lachs|salmon|forelle|trout|thunfisch|tuna|fisch|fish|dorade|wolfsbarsch|garnele|shrimp|prawn)\b/i
const LAMB_RE    = /\b(lamm|lamb)\b/i
const PORK_RE    = /\b(presa|pluma|secreto|carrillera|iberico|schweineschulter|pork)\b/i
const VEG_RE     = /\b(mais|corn|spargel|asparagus|zucchini|paprika|pepper|portobello|pilz|mushroom|gem(?:ü|ue)se|vegetable|halloumi|grillkäse|avocado|s(?:ü|ue)ßkartoffel|sweet potato|spie(?:ß|ss)|skewer)\b/i

function styleClause(text) {
  if (SMOKED_RE.test(text))
    return 'cut into clean slices showing a dark, heavily seasoned bark crust and a vivid pink smoke ring, tender and juicy, resting on peach butcher paper'
  if (POULTRY_RE.test(text))
    return 'with crispy golden-brown skin and juicy, fully-cooked tender meat (NO pink centre, NO red meat)'
  if (FISH_RE.test(text))
    return 'with moist, flaky, tender flesh and lightly crisp charred skin (NO red meat, NO beef-pink centre)'
  if (LAMB_RE.test(text))
    return 'sliced to reveal a rosy-pink juicy interior under a dark charred herb crust'
  if (PORK_RE.test(text))
    return 'with a dark seared crust and a juicy, just-cooked interior, glistening with natural juices'
  if (STEAK_RE.test(text))
    return 'cut into clean thick slices, the rosy medium-rare colour visible ONLY on the exposed cut faces, the outer surface an even dark-brown seared crust, fully cooked browned exterior, no raw red patches on the outside and no bloody juices, a few coarse sea salt flakes'
  if (VEG_RE.test(text))
    return 'with caramelized charred edges, lightly blistered skin, a glossy sheen of oil and clear dark grill marks, vibrant fresh colours (not raw and cold, not burnt black)'
  return 'glistening with natural juices (not oily), lightly charred where grilled, fresh and appetizing'
}

// Perspektiven-Rotation (deterministisch je Rezept) → Vielfalt statt Einheits-Close-up.
const PERSPECTIVES = [
  'shot from directly above, clean top-down flat lay on a wooden board',
  'shot from a 45-degree angle on a wooden serving board',
  'shot from a low three-quarter angle at plate level',
  'slightly elevated three-quarter angle showing the whole plating on a dark slate',
]
function pickPerspective(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return PERSPECTIVES[h % PERSPECTIVES.length]
}

// Zwei Looks: warm (Hausstil, Galerie/Karten) vs. dramatic (Hero-Eyecatcher, dunkel/Flammen).
function buildPrompt(raw, slug = '', look = 'warm') {
  const alt    = fm(raw, 'imageAlt') || fm(raw, 'title')
  const meat   = fm(raw, 'meatType')
  const method = fm(raw, 'cookingMethod')
  const brief  = fm(raw, 'imagePrompt')          // Selbst-Briefing (Priorität #1, von Claude verfasst)
  const anatomy = brief ? '' : cutAnatomy(meat, slug)
  const protein = (brief || anatomy) ? '' : proteinSubject(meat, slug)
  const lead = brief || anatomy || protein
  // Selbst-Briefing > Cut-Anatomie > Protein-Anker > Alt/Titel.
  const subject = lead
    ? `${lead}${(method && !brief) ? `, ${method}` : ''}`
    : [alt, meat && `(${meat})`, method].filter(Boolean).join(', ')
  const dramatic = look === 'dramatic'
  // Im Drama-Look führt das Motiv (Brief/Anatomie); die Sliced-Doktrin (Teller) entfällt.
  const clause = (brief || dramatic) ? '' : styleClause(`${meat} ${slug} ${alt}`)

  const head = `appetizing professional food photograph of ${subject}, `
    + (anatomy ? `anatomically accurate cut of meat, ` : ``)
    + (protein ? `the dish must clearly and unmistakably show exactly this animal, ` : ``)
    + (clause ? `${clause}, ` : ``)

  if (dramatic) {
    // Eyecatcher: präzise physikalische Sprache (Flux-stark), Form bleibt diktiert.
    return head
      + `shown whole and sizzling on a hot cast-iron grill grate, intense orange flames licking the edges from below, thick volumetric white smoke billowing around it, glowing embers visible through the grate, deep dark cross-hatch grill marks seared into the surface, warm golden-hour rim light, dark moody atmospheric background, cinematic lighting, glistening meat texture, sharp focus with a shallow depth of field, close three-quarter perspective, no text, no watermark, no people`
  }
  return head
    + `the whole dish in frame, plated on a rustic warm wooden board, soft warm natural daylight, a subtle grill and glowing ember atmosphere softly blurred in the background, a little fresh herb garnish, clean and appetizing, subtle steam, `
    + `${pickPerspective(slug || alt)}, `
    + `50mm lens, f/5.6, balanced focus, appetizing, no text, no watermark, no people`
}

// Steakakademie-Hausstil-LoRA „Warm & Rustikal" (Trigger sa_foodstyle)
const FOODSTYLE_LORA = process.env.FAL_LORA_FOODSTYLE
  || 'https://v3b.fal.media/files/b/0a9cfb28/4f5c21hz9uGU5ia2PWRnR_pytorch_lora_weights.safetensors'

// Die LoRA ist auf RIND trainiert → bei Geflügel/Fisch zieht sie das Motiv Richtung
// Fleisch/Huhn. Dort Stil-Stärke senken (Stil bleibt, korrektes Tier gewinnt).
function loraScale(raw, slug) {
  const t = `${fm(raw, 'meatType')} ${slug} ${fm(raw, 'imageAlt') || fm(raw, 'title')} ${fm(raw, 'kategorie')}`
  if (STEAK_RE.test(t) || SMOKED_RE.test(t) || PORK_RE.test(t) || LAMB_RE.test(t)) return 0.9
  if (POULTRY_RE.test(t) || FISH_RE.test(t)) return 0.55
  return 0.6 // Beilagen/Saucen/Desserts: Stil ja, Fleisch-Bias nein
}

async function generate(prompt, scale = 0.9, size = 'landscape_4_3') {
  const res = await fetch('https://fal.run/fal-ai/flux-lora', {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `sa_foodstyle, ${prompt}`,
      image_size: size,
      num_images: 1,
      enable_safety_checker: true,
      loras: [{ path: FOODSTYLE_LORA, scale }],
    }),
  })
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 160)}`)
  const j = await res.json()
  const url = j.images?.[0]?.url
  if (!url) throw new Error('keine Bild-URL in fal-Antwort')
  const img = await fetch(url)
  return Buffer.from(await img.arrayBuffer())
}

// ─── BILDREGISTER ─────────────────────────────────────────────────────────────
// data/bildregister.yaml ist der Lizenznachweis fuer JEDES Bild unter public/;
// scripts/legal-guard.mjs bricht ohne Eintrag ab (Regel 6 in
// compliance/website-rechtscheck.yaml). Der Rezept-Agent hat nie eingetragen —
// am 14.09.2026 fiel PR #99 deshalb im Legal-Guard durch. Textbasiert, KEIN
// Re-Serialisieren: Die Datei traegt Kommentare, die js-yaml verlieren wuerde.
const REGISTER = join(ROOT, 'data', 'bildregister.yaml')

async function registerEintragen(webPath, slug) {
  const key = webPath.replace(/^\//, '')                 // images/rezepte/<slug>.jpg
  const heute = new Date().toISOString().slice(0, 10)
  const block =
`  ${key}:
    status: ki
    quelle: fal.ai (FLUX.1 dev), Prompt aus imagePrompt in content/rezepte/${slug}.mdx, scripts/recipe-images.mjs
    urheber: Steakakademie (Uwe Yendell)
    namensnennung: false
    erworben_am: ${heute}
    hinweis: Kommerzielle Nutzung ueber den fal.ai-Tarif; C2PA-Marker nicht geprueft
`
  let raw = await readFile(REGISTER, 'utf8')
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Bestehenden Eintrag ersetzen — einzeilig ({ status: offen }) oder als Block
  // (bis zur naechsten Zeile mit zwei Leerzeichen Einzug + Schluessel oder EOF).
  const vorhanden = new RegExp(`^  ${esc}:(?:[^\\n]*\\n(?:    [^\\n]*\\n)*)`, 'm')
  if (vorhanden.test(raw)) {
    raw = raw.replace(vorhanden, block)
  } else {
    if (!raw.endsWith('\n')) raw += '\n'
    raw += block
  }
  await writeFile(REGISTER, raw, 'utf8')
}

async function main() {
  console.log(c.d('\n🖼  Recipe Image Generator (FLUX.1 dev)\n'))
  // exit 1, nicht 0 (13.09.2026): Ohne Bild landet ein frisch erzeugtes Rezept mit
  // einem image-Pfad im PR, zu dem keine Datei existiert. Frueher endete der Lauf
  // hier still und gruen — der Defekt fiel erst am Content-Gate auf, ohne dass
  // irgendwo stand, warum. Dieses Skript wird nur aus Workflows gerufen; ein
  // fehlender Key ist dort ein Ausfall, kein Normalzustand.
  if (!DRY && !FAL_KEY) { console.log(c.r('⚠ FAL_KEY fehlt — Abbruch.')); process.exit(1) }
  await mkdir(IMG_DIR, { recursive: true })

  const files = (await readdir(REZEPTE)).filter(f => f.endsWith('.mdx'))
  let done = 0, skipped = 0, failed = 0

  for (const file of files) {
    if (done >= LIMIT) break
    const slug = file.replace(/\.mdx$/, '')
    if (ONLY && !ONLY.includes(slug)) { skipped++; continue }
    const path = join(REZEPTE, file)
    const raw  = await readFile(path, 'utf8')
    // Drama-Look (Flammen/Grill) nur für Grillgut — Beilagen/Saucen/Rubs/Desserts überspringen.
    if (DRAMATIC) {
      const kat = (fm(raw, 'kategorie') || '').toLowerCase()
      if (['beilagen', 'saucen-rubs', 'desserts', 'wine-spirits'].includes(kat)) { skipped++; continue }
    }
    const suffix = DRAMATIC ? '-hero' : ''
    const target = join(IMG_DIR, `${slug}${suffix}.jpg`)
    const webPath = `/images/rezepte/${slug}${suffix}.jpg`

    if (!FORCE && existsSync(target)) { skipped++; continue }

    const prompt = buildPrompt(raw, slug, LOOK)
    if (DRY) { console.log(c.y(`◇ ${slug}${suffix}`)); console.log(c.d(`  ${prompt}\n`)); done++; continue }

    try {
      process.stdout.write(c.d(`◇ ${slug}${suffix} … `))
      const buf = await generate(prompt, DRAMATIC ? 0.4 : loraScale(raw, slug), DRAMATIC ? 'landscape_16_9' : 'landscape_4_3')
      await writeFile(target, buf)
      await registerEintragen(webPath, slug)
      // Frontmatter patchen (regex, KEIN Re-Serialize): warm → image:, dramatic → heroImage:
      const field = DRAMATIC ? 'heroImage' : 'image'
      const fieldRe = new RegExp(`^${field}:\\s*.*$`, 'm')
      const patched = raw.match(fieldRe)
        ? raw.replace(fieldRe, `${field}: "${webPath}"`)
        : raw.replace(/^---\n/, `---\n${field}: "${webPath}"\n`)
      if (patched !== raw) await writeFile(path, patched, 'utf8')
      console.log(c.g(`✓ ${(buf.length / 1024).toFixed(0)} KB`))
      done++
    } catch (e) {
      console.log(c.r(`✗ ${e.message}`))
      failed++
    }
  }

  console.log(`\n${c.g(`✓ ${done} generiert`)} · ${c.d(`${skipped} vorhanden`)} · ${failed ? c.r(`${failed} Fehler`) : '0 Fehler'}\n`)

  // Ein fehlgeschlagenes Bild ist ein fehlendes Bild. Vorher lief der Schritt
  // trotzdem gruen weiter und der PR trug einen toten Bildpfad.
  if (failed > 0) process.exitCode = 1
}

main().catch(e => { console.error(c.r(e.stack || e.message)); process.exit(1) })
