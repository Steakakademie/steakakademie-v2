#!/usr/bin/env node
/**
 * Steakakademie Hero Image Generator (FLUX.1 via fal.ai)
 *
 * Lücke, die dieses Skript schliesst (Befund 16.08.2026):
 *   cut-images.mjs    → public/images/cuts/<slug>.jpg      (rohe Cut-Poster)
 *   recipe-images.mjs → public/images/rezepte/<slug>.jpg   (Rezept-Fotos)
 *   ...aber für ARTIKEL- und METHODEN-Heroes gab es KEIN Skript. Folge: 4 Methoden-
 *   seiten teilten sich denselben Platzhalter /images/hero-ribeye.jpg und 3 weitere
 *   hotlinken bis heute live auf images.unsplash.com (kein lokales Asset, keine
 *   next/image-Optimierung, externer Request bei jedem Seitenaufruf).
 *
 * Dieses Skript arbeitet eine explizite BRIEFS-Tabelle ab — kein Auto-Scan. Heroes
 * sind Einzelstücke; jedes bekommt sein eigenes, handgeschriebenes Motiv-Briefing.
 *
 * Usage:
 *   node scripts/hero-images.mjs --dry-run                     # nur Prompts zeigen
 *   node scripts/hero-images.mjs                               # alle fehlenden
 *   node scripts/hero-images.mjs --only ribeye                 # gezielt
 *   node scripts/hero-images.mjs --only ribeye --force         # vorhandenes ersetzen
 *
 * Env: FAL_KEY (key_id:secret) — aus Umgebung oder .env.local.
 *
 * Prompt-Doktrin (CLAUDE.md): KEINE Wörter wie "photorealistic"/"4K"/"8k" — die
 * erzeugen den künstlichen Plastik-Look. Stattdessen Textur- und Kamerasprache.
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT   = join(__dirname, '..')
const PUBLIC = join(ROOT, 'public')

const DRY   = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const ONLY  = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',').map(s => s.trim())
  : null

let FAL_KEY = process.env.FAL_KEY
if (!FAL_KEY && existsSync(join(ROOT, '.env.local'))) {
  const m = (await readFile(join(ROOT, '.env.local'), 'utf8')).match(/^FAL_KEY=(.+)$/m)
  if (m) FAL_KEY = m[1].trim()
}

const c = { g: s => `\x1b[32m${s}\x1b[0m`, y: s => `\x1b[33m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, d: s => `\x1b[2m${s}\x1b[0m` }

// Hausstil-LoRA „Warm & Rustikal" (Trigger sa_foodstyle) — identisch zu recipe-images.mjs.
const FOODSTYLE_LORA = process.env.FAL_LORA_FOODSTYLE
  || 'https://v3b.fal.media/files/b/0a9cfb28/4f5c21hz9uGU5ia2PWRnR_pytorch_lora_weights.safetensors'

const NEG = 'no text, no watermark, no logo, no people, no hands'

// ─── Briefs ──────────────────────────────────────────────────────────────────
// scale: die LoRA ist auf RIND trainiert. Fleisch-geführte Motive vertragen 0.85,
// GERÄT-geführte Motive (Brenner, Plancha, Spiess) brauchen weniger, sonst frisst
// der Fleisch-Bias die Technik und alles wird wieder ein Steak-Close-up.
const BRIEFS = [
  // ── Serie „Fleischwissen" (03.09.2026) ─────────────────────────────────────
  // Bildstil-Ansage Uwe, 30.08.2026: „viel Weide, wenig Rind — Tiere klein im
  // Bild (~20–25 % Sichtpraesenz), Landschaft und goldenes Licht dominieren.
  // Kein Fleisch-, kein Theken-Motiv."
  //
  // Das laeuft dem Hausstil-LoRA direkt zuwider: der ist auf Hero-Steakfotos
  // trainiert und zieht jedes Motiv Richtung Fleisch-Close-up. Deshalb
  // scale 0.3 statt der ueblichen 0.5 — gerade genug fuer Lichtstimmung und
  // Farbwelt, zu wenig fuer den Fleisch-Bias. Und wie bei Ribeye/Plancha
  // gelernt: KEINE Verneinungen im Positiv-Prompt („no steak" schriebe
  // „steak" in die Konditionierung). Die Rinder werden stattdessen positiv
  // klein und fern beschrieben.
  //
  // Die drei Motive muessen unterscheidbar bleiben — sie liegen auf der
  // Uebersicht untereinander. Getrennt ueber Tageszeit und Blickachse:
  // Teil 1 Abend/Weite, Teil 2 Gegenlicht/Nahdistanz, Teil 3 Morgennebel/Weg.
  {
    id: 'fw-us-beef-vs-de',
    target: 'images/fleischwissen/us-beef-vs-de-hero.jpg',
    patch: { file: 'content/fleischwissen/us-beef-vs-deutsches-rindfleisch.mdx', field: 'image' },
    size: 'landscape_16_9',
    scale: 0.3,
    prompt: 'a wide open grassland plain at golden hour, warm low sunlight raking across the grass, '
      + 'a scattered herd of cattle far away on the horizon, the animals small in the frame, '
      + 'a long wooden fence line running into the distance, big open sky with soft haze, '
      + 'landscape photography, wide angle, 35mm lens, f/8, deep focus, warm amber tones, ' + NEG,
  },
  {
    id: 'fw-gras-vs-getreide',
    target: 'images/fleischwissen/gras-vs-getreide-hero.jpg',
    patch: { file: 'content/fleischwissen/gras-vs-getreide-was-steckt-im-fleisch.mdx', field: 'image' },
    size: 'landscape_16_9',
    scale: 0.3,
    prompt: 'a spring pasture photographed into the light, tall fresh grass blades sharp in the foreground filling the lower half of the frame, '
      + 'backlit seed heads glowing, a few cattle grazing small and softly out of focus in the middle distance, '
      + 'warm golden rim light, gentle lens flare, meadow landscape, 85mm lens, f/2.8, shallow foreground focus, ' + NEG,
  },
  {
    id: 'fw-schlachtstress',
    target: 'images/fleischwissen/schlachtstress-hero.jpg',
    patch: { file: 'content/fleischwissen/schlachtstress-dfd-fleischqualitaet.mdx', field: 'image' },
    size: 'landscape_16_9',
    scale: 0.3,
    // Der Artikel endet auf „Frag nicht nach der Herkunft. Frag nach dem Weg."
    // Der Feldweg ist deshalb das Bildmotiv, nicht eine Illustration der
    // Schlachtung — die waere weder markengerecht noch dem Thema angemessen.
    prompt: 'early morning mist lying low over a quiet pasture, cool light slowly turning golden, '
      + 'a calm herd of cattle standing far off in the fog, the animals small and dim in the distance, '
      + 'an empty dirt farm track curving out of the frame in the foreground, dew on the grass, '
      + 'still atmospheric landscape photography, 50mm lens, f/5.6, muted palette with warm highlights, ' + NEG,
  },
  // ── Content-Pipeline W2 (17.09.2026) ───────────────────────────────────────
  // Zwei Pillar-Artikel, die untereinander in derselben Kategorie stehen und
  // sich gegenseitig verlinken — die Motive muessen also klar unterscheidbar
  // sein. Getrennt ueber Ort und Zustand: Stall = Fleisch IM Smoker, halbdunkel,
  // Dampf; Crutch = Fleisch AUF dem Tisch, hell, Papier.
  //
  // Beide sind Fleisch-gefuehrte Motive, der Hausstil-LoRA passt hier also
  // grundsaetzlich. ABER: er ist auf Hero-STEAKfotos trainiert und zieht (Lehre
  // aus Runde 3 beim Ribeye) systematisch Richtung Steak-Close-up. Ein Brisket
  // ist das Gegenteil davon — ein grosses, laengliches Stueck. Deshalb wie beim
  // Ribeye scale 0.5 statt 0.85, und die Form wird positiv und geschlossen
  // beschrieben, damit kein formloser Klumpen entsteht (Trick aus dem
  // Rotisserie-Brief: expliziter Form-Anker).
  {
    id: 'art-stall-plateauphase',
    target: 'images/artikel/stall-plateauphase.jpg',
    patch: { file: 'content/artikel/stall-plateauphase-beim-smoken.mdx', field: 'image' },
    size: 'landscape_16_9',
    scale: 0.5,
    // Das Thema ist Verdunstungskuehlung — das Bild muss also FEUCHTIGKEIT
    // zeigen, nicht Hitze. Beschlagene Oberflaeche und aufsteigender Dunst sind
    // hier der eigentliche Bildinhalt, die dunkle Rinde nur der Traeger.
    prompt: 'a whole beef brisket resting on a steel grate inside a dark smoker chamber, '
      + 'the brisket is one long solid rectangular slab with a smooth closed outline and a rounded thicker end, '
      + 'its surface a deep mahogany-brown bark, densely beaded with glistening droplets of moisture, '
      + 'fine wisps of pale steam and thin blue smoke drifting upward off the surface into the dark, '
      + 'a single shaft of warm light raking across the meat from the side, the chamber behind falling into shadow, '
      + 'close three-quarter angle, 50mm lens, f/4, shallow depth of field, moody warm amber tones, ' + NEG,
  },
  {
    id: 'art-texas-crutch',
    target: 'images/artikel/texas-crutch.jpg',
    patch: { file: 'content/artikel/texas-crutch-folie-oder-butcher-paper.mdx', field: 'image' },
    size: 'landscape_16_9',
    scale: 0.4,
    // RUNDE 1 (17.09.2026) lieferte drei Fehler auf einmal — alle drei sind im
    // Skript bereits andernorts dokumentiert, ich bin trotzdem hineingelaufen:
    //   1. Eine PERSON im Bild (Oberkoerper, Hand) trotz „no people, no hands"
    //      in NEG. Derselbe Verneinungs-Effekt wie bei Plancha Runde 2. Die
    //      Lehre dort lautet: nicht verbieten, sondern durch den Ausschnitt
    //      ausschliessen. Runde 2 ist deshalb ein randloses Top-down-Flatlay —
    //      hinter der Kamera ist schlicht kein Bildraum mehr fuer jemanden.
    //   2. Ein KNOCHENGRIFF ragte aus dem Fleisch. Der LoRA zieht Richtung
    //      Tomahawk, sobald die Form nicht geschlossen beschrieben ist
    //      (Ribeye Runde 3). Das Wort steht hier nirgends; stattdessen wird die
    //      Silhouette positiv als rundum geschlossen beschrieben.
    //   3. Das Fleisch lag nur AUF dem Papier statt halb darin — also genau
    //      der Vorgang, um den es im Artikel geht, war nicht im Bild. Runde 2
    //      beschreibt die Faltung als Zustand des Papiers, nicht als Handlung.
    // scale zusaetzlich 0.45 → 0.4: das rosa Papier ist die halbe Bildaussage,
    // der Fleisch-Bias hatte es in Runde 1 an den Rand gedraengt.
    prompt: 'a whole smoked beef brisket on a large sheet of pink butcher paper, photographed from directly above as a clean top-down flat lay, '
      + 'the paper fills the entire frame from edge to edge and lies on a worn wooden surface, '
      + 'the brisket is one long rounded rectangular slab of meat with a smooth closed silhouette on every side, '
      + 'its surface an even dark mahogany bark, '
      + 'the near long edge of the paper is already folded up and over the meat and lies flat across the lower third of it, '
      + 'the rest of the brisket still uncovered, the paper creased along the fold and darkened translucent where the meat rests on it, '
      + 'a roll of aluminium foil lying flat along the right edge of the frame, '
      + 'bright soft daylight, clean uncluttered still life, 35mm lens, f/5.6, warm neutral tones, ' + NEG,
  },
  {
    id: 'ribeye',
    // ABGENOMMEN 16.08.2026 (Querformat, knochenlos, Fettrand umlaufend, zwei
    // aufgefaecherte Scheiben mit rosa Kern). Nach drei gescheiterten Generator-
    // Runden extern erzeugt und handverlesen. manual:true schuetzt vor --force.
    manual: true,
    // Bewusst DIESELBE Datei/Endung wie bisher: /images/articles/ribeye-premium-cut.webp
    // wird an 3 Stellen referenziert (page.tsx:37, usa-expedition/page.tsx:150,
    // content/cuts/ribeye.mdx:8). Gleicher Pfad = ein Tausch repariert alle drei.
    target: 'images/articles/ribeye-premium-cut.webp',
    size: 'landscape_4_3',
    // RUNDE 3: scale von 0.85 auf 0.5. Der Hausstil-LoRA ist auf Hero-Steakfotos
    // trainiert und zieht dort systematisch Richtung Knochen-Cuts (Tomahawk ist das
    // Hero-Motiv schlechthin). Bei 0.85 gewinnt dieser Bias gegen jede Prompt-Angabe.
    scale: 0.5,
    // RUNDE 3 — die eigentliche Lehre: In FLUX wirken Verneinungen im POSITIV-Prompt
    // nicht wie ein Negativ-Prompt. „no bone, not a tomahawk" schreibt die Tokens
    // „bone" und „tomahawk" in die Konditionierung — Runde 2 lieferte prompt einen
    // NOCH prominenteren Knochengriff als Runde 1. Deshalb steht das Wort Knochen
    // hier jetzt NIRGENDS mehr. Stattdessen: Form positiv und geschlossen beschreiben
    // (Oval mit umlaufendem Fettrand) und Top-down-Flatlay als Perspektive — die
    // Aufsicht ist genau die Perspektive, in der die Tomahawk-Komposition des LoRA
    // nicht funktioniert, weil ihr der seitliche Griff fehlt.
    prompt: 'a single grilled ribeye steak lying flat on a black slate board, photographed from directly above as a clean top-down flat lay, '
      + 'the steak is one solid oval slab of beef with a smooth closed outline and a golden rendered fat rim running all the way around its edge, '
      + 'in its centre the large round eye muscle, along the upper edge the separate crescent-shaped spinalis cap divided from it by a clear seam of fat, rich fine marbling, '
      + 'an even dark-brown seared crust with deep cross-hatch grill marks across the whole surface, '
      + 'two thick slices carved from one end and fanned out beside it, their cut faces showing a rosy medium-rare interior, '
      + 'coarse sea salt flakes scattered across the slate, glistening meat texture, warm directional light, dark moody background, '
      + '50mm lens, f/5.6, ' + NEG,
  },
  {
    id: 'oberhitze-grillen',
    target: 'images/methoden/oberhitze-grillen.jpg',
    patch: { file: 'content/methoden/oberhitze-grillen.mdx', field: 'image' },
    size: 'landscape_16_9',
    scale: 0.5,
    // ABGENOMMEN Runde 1 (16.08.2026) — nicht erneut generieren.
    prompt: 'a thick beef steak searing directly beneath a glowing orange-white ceramic infrared burner element mounted above it, '
      + 'the steak lying on a stainless steel grate inside a compact high-temperature broiler, intense radiant heat pouring down from above, '
      + 'a dark crust forming on the surface, fine smoke rising up toward the glowing burner, warm ember tones, dark workshop background, '
      + 'low three-quarter angle, sharp focus, shallow depth of field, ' + NEG,
  },
  {
    id: 'plancha-feuerplatte',
    // ECHTFOTO (Pexels), gesetzt 16.08.2026. Drei KI-Runden zeigten durchweg eine
    // GESCHLOSSENE Platte ohne Feueroeffnung — und damit das Gegenteil der
    // Zonenlogik, die der Artikel erklaert. Siehe docs/bildprogramm.md.
    manual: true,
    target: 'images/methoden/plancha-feuerplatte.jpg',
    patch: { file: 'content/methoden/plancha-feuerplatte.mdx', field: 'image' },
    size: 'landscape_16_9',
    scale: 0.5,
    // RUNDE 3: Runde 2 hatte trotz „no utensils, no spatula, no tongs" eine noch
    // GRÖSSERE Hand im Bild als Runde 1 — gleicher Verneinungs-Effekt wie beim
    // Ribeye. Alle Werkzeug-Verneinungen daher gestrichen. Die Hand wird jetzt
    // nicht verboten, sondern ausgeschlossen: Der Bildausschnitt lässt schlicht
    // keinen Platz mehr für sie (Platte füllt den Rahmen randlos).
    prompt: 'an extreme close-up of food searing on a large round solid steel griddle plate over an open wood fire, '
      + 'the black steel plate fills the entire frame from edge to edge, the camera low and close over the food, '
      + 'strips of beef with a dark caramelized seared crust, sliced onions and red peppers pushed to one side, '
      + 'oil shimmering across the hot steel and light steam rising, a narrow strip of flames and glowing embers visible below the front rim of the plate, '
      + 'warm golden-hour light, 35mm lens, f/4, ' + NEG,
  },
  {
    id: 'rotisserie-drehspiess',
    target: 'images/methoden/rotisserie-drehspiess.jpg',
    patch: { file: 'content/methoden/rotisserie-drehspiess.mdx', field: 'image' },
    size: 'landscape_16_9',
    scale: 0.55,
    // ABGENOMMEN Runde 2 (16.08.2026). Der Küchengarn-Form-Anker hat den formlosen
    // Klumpen aus Runde 1 behoben — Trick notiert für kuenftige Braten-Motive.
    prompt: 'a large cylindrical beef roast turning on a horizontal rotisserie spit above a bed of glowing charcoal embers, '
      + 'the roast is a smooth even cylinder neatly tied with butcher twine at regular intervals along its length, '
      + 'skewered through the centre on a stainless steel rod held at both ends by forked prongs, '
      + 'deep mahogany-brown evenly roasted crust, rendered fat dripping down into the coals and sending up light smoke, '
      + 'glowing orange embers below, dark rustic background, warm golden rim light, low three-quarter angle, 50mm lens, f/4, '
      + 'smooth even surface, ' + NEG,
  },
]

async function generateOnce(brief) {
  const res = await fetch('https://fal.run/fal-ai/flux-lora', {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `sa_foodstyle, ${brief.prompt}`,
      image_size: brief.size,
      num_images: 1,
      enable_safety_checker: true,
      loras: [{ path: FOODSTYLE_LORA, scale: brief.scale }],
    }),
  })
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 160)}`)
  const j = await res.json()
  const url = j.images?.[0]?.url
  if (!url) throw new Error('keine Bild-URL in fal-Antwort')
  const img = await fetch(url)
  return Buffer.from(await img.arrayBuffer())
}

// Retry gegen transiente Fehler (LoRA-Kaltstart) — gleiches Muster wie cut-images.mjs.
async function generate(brief, tries = 3) {
  let last
  for (let i = 1; i <= tries; i++) {
    try { return await generateOnce(brief) } catch (e) {
      last = e
      if (i < tries) await new Promise(r => setTimeout(r, i * 4000))
    }
  }
  throw last
}

async function main() {
  console.log(c.d('\n🖼  Hero Image Generator (Artikel + Methoden)\n'))
  if (!DRY && !FAL_KEY) { console.log(c.r('⚠ FAL_KEY fehlt — Abbruch.')); process.exit(1) }

  let done = 0, skipped = 0, failed = 0

  for (const brief of BRIEFS) {
    if (ONLY && !ONLY.includes(brief.id)) { skipped++; continue }

    // Handverlesene Bilder (manual) werden NIE generiert — auch nicht mit --force.
    // Schutz gegen versehentliches Ueberschreiben eines abgenommenen Motivs.
    if (brief.manual) {
      console.log(c.d(`◇ ${brief.id} — manuell gesetzt, wird nicht generiert`))
      skipped++; continue
    }

    const target  = join(PUBLIC, brief.target)
    const webPath = `/${brief.target}`

    if (!FORCE && existsSync(target)) {
      console.log(c.d(`◇ ${brief.id} — vorhanden, übersprungen (--force zum Ersetzen)`))
      skipped++; continue
    }

    if (DRY) {
      console.log(c.y(`◇ ${brief.id}  →  ${webPath}  [${brief.size}, LoRA ${brief.scale}]`))
      console.log(c.d(`  sa_foodstyle, ${brief.prompt}\n`))
      done++; continue
    }

    try {
      process.stdout.write(c.d(`◇ ${brief.id} … `))
      const raw = await generate(brief)
      await mkdir(dirname(target), { recursive: true })

      // .webp-Ziele werden konvertiert, damit der bestehende Pfad 1:1 erhalten
      // bleibt (fal liefert JPEG). sharp ist bereits Projekt-Dependency.
      if (brief.target.endsWith('.webp')) {
        const sharp = (await import('sharp')).default
        await writeFile(target, await sharp(raw).webp({ quality: 82 }).toBuffer())
      } else {
        await writeFile(target, raw)
      }

      // Frontmatter patchen (Regex, KEIN Re-Serialize — gleiches Muster wie recipe-images.mjs)
      if (brief.patch) {
        const p  = join(ROOT, brief.patch.file)
        const md = await readFile(p, 'utf8')
        const re = new RegExp(`^${brief.patch.field}:\\s*.*$`, 'm')
        if (re.test(md)) {
          // Platzhalter-TODO gleich mit entfernen, damit kein toter Hinweis stehenbleibt.
          const cleaned = md.replace(re, `${brief.patch.field}: "${webPath}"`)
                            .replace(/^\{\/\* TODO Bild:[\s\S]*?\*\/\}\n?/m, '')
          await writeFile(p, cleaned)
        }
      }

      console.log(c.g(`✓ ${webPath}`))
      done++
    } catch (e) {
      console.log(c.r(`✗ ${e.message}`))
      failed++
    }
  }

  console.log(c.d(`\n${done} erzeugt · ${skipped} übersprungen · ${failed} fehlgeschlagen\n`))
  if (failed) process.exit(1)
}

main().catch(e => { console.error(c.r(String(e))); process.exit(1) })
