#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// Saison-Generator — erzeugt alle 5 Tage EINEN saisonalen Bericht-Draft.
//
// Quelle:   data/saison-kalender.yaml (Fenster + Themen mit Vorlauf)
// Ziel:     content_drafts (human-gated — Freigabe in /admin/review, Regel 4)
// Rhythmus: .github/workflows/saison-grow.yml (alle 5 Tage) oder manuell:
//           node scripts/saison-grow.mjs [--dry-run]
//
// Auswahl-Logik:
//   1. Alle heute aktiven Fenster (von ≤ heute ≤ bis, Jahresgrenzen-sicher)
//   2. Fenster mit dem nächstliegenden Anlass zuerst (Dringlichkeit)
//   3. Erstes Thema, das noch nicht als Draft existiert (Dedupe über Slug)
//   → genau EIN Draft pro Lauf; kein aktives Fenster → sauberer No-Op.
//
// Doktrin: Regel 8c (keine geratenen Temperaturen — Verweis auf
// /temperatur-guide), Regel 8d (Bild-Prompts ohne "photorealistic"/"4K",
// Look "Warm & Rustikal"), Werbekennzeichnung bleibt Sache des Templates.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { callClaude, parseJson, printCacheStats } from './lib/anthropic.mjs'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
dotenv.config({ path: join(ROOT, '.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_ROLE || !ANTHROPIC_KEY)) {
  console.error('Fehlende Env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ANTHROPIC_API_KEY')
  process.exit(1)
}

const supabase = (SUPABASE_URL && SERVICE_ROLE) ? createClient(SUPABASE_URL, SERVICE_ROLE) : null
const MODELL = 'claude-opus-4-7'
const VERSUCHE = 3   // KAN-84: unlesbare Modellantwort → neu erzeugen statt Lauf abbrechen

// ─── Kalender ────────────────────────────────────────────────────────────────

function mmddToDayOfYearRef(mmdd, refYear) {
  const [mm, dd] = mmdd.split('-').map(Number)
  return new Date(Date.UTC(refYear, mm - 1, dd))
}

/** Ist `today` im Fenster von..bis? (Jahresgrenzen-sicher, z. B. 12-01..01-06) */
function inWindow(today, von, bis) {
  const y = today.getUTCFullYear()
  const t = Date.UTC(y, today.getUTCMonth(), today.getUTCDate())
  let start = mmddToDayOfYearRef(von, y).getTime()
  let end = mmddToDayOfYearRef(bis, y).getTime()
  if (start <= end) return t >= start && t <= end
  // Fenster über den Jahreswechsel
  return t >= start || t <= end
}

/** Tage bis zum Anlass (immer vorwärts gerechnet). */
function daysUntil(today, mmdd) {
  const y = today.getUTCFullYear()
  const t = Date.UTC(y, today.getUTCMonth(), today.getUTCDate())
  let a = mmddToDayOfYearRef(mmdd, y).getTime()
  if (a < t) a = mmddToDayOfYearRef(mmdd, y + 1).getTime()
  return Math.round((a - t) / 86400000)
}

function toSlug(title) {
  return title.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

// ─── Dedupe: existiert das Thema schon als Draft? ────────────────────────────

async function draftExists(slug) {
  if (!supabase) return false
  const { data, error } = await supabase
    .from('content_drafts').select('slug').eq('slug', slug).limit(1)
  if (error) { console.error('  Dedupe-Fehler:', error.message); return false }
  return (data?.length ?? 0) > 0
}

// ─── Generierung ─────────────────────────────────────────────────────────────

async function generate(fenster, thema, tageBisAnlass) {
  const prompt = `Du bist Redakteur der Steakakademie (steakakademie.de) — Deutschlands methodisch tiefste BBQ-Plattform. Ton: direkt, ehrlich, präzise, Premium-Magazin ("deutsche Präzision trifft Texas-Seele"). Kein Clickbait, kein Marketing-Sprech.

SAISON-AUFTRAG (${fenster.label}, noch ${tageBisAnlass} Tage bis zum Anlass):
Schreibe einen Bericht zum Thema:
"${thema}"

Saison-Kontext: ${String(fenster.kontext || '').trim()}

HARTE REGELN:
- Kerntemperaturen, Garzeiten und Reifungs-Fakten NIEMALS raten. Wo ein Wert nötig wäre, verweise stattdessen auf den Temperatur-Guide der Steakakademie (Link: /temperatur-guide) oder formuliere methodisch ("bis zur gewünschten Kerntemperatur, siehe Temperatur-Guide").
- Keine erfundenen Studien, Zahlen oder Zitate.
- Deutsch, 600–1000 Wörter, Markdown mit Zwischenüberschriften (##).
- Interne Verweise wo passend: /temperatur-guide, /methoden/..., /rezepte, /gutschein (nur wenn der Kontext es nennt), /diplome.

Antworte NUR mit JSON:
{"title":"...","content_body":"... (600-1000 Wörter, Markdown)","seo_title":"... (max 60 Zeichen)","seo_description":"... (max 160 Zeichen)","image_prompt_en":"... (englischer Bild-Prompt: appetizing professional food photograph, warm rustic wooden board, soft natural light, the whole dish in frame, 50mm lens — KEINE Wörter wie photorealistic/4K/8k/macro)"}`

  // Zentraler Client (CLAUDE.md §4 Prompt-Caching) + toleranter Parser.
  // Scheitert das Lesen trotzdem (abgeschnitten, Pflichtfeld fehlt), wird neu erzeugt.
  let parsed
  let letzterFehler
  for (let versuch = 1; versuch <= VERSUCHE; versuch++) {
    try {
      const { text, raw } = await callClaude({
        model: MODELL,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
        label: 'saison-grow',
      })
      if (raw?.stop_reason === 'max_tokens') throw new Error('Antwort bei max_tokens abgeschnitten')
      const kandidat = parseJson(text)
      const fehlend = ['title', 'content_body', 'seo_title', 'seo_description']
        .filter(k => typeof kandidat?.[k] !== 'string' || !kandidat[k].trim())
      if (fehlend.length) throw new Error(`Pflichtfeld(er) fehlen: ${fehlend.join(', ')}`)
      parsed = kandidat
      break
    } catch (err) {
      letzterFehler = err
      console.error(`  Versuch ${versuch}/${VERSUCHE} unbrauchbar: ${err.message}`)
    }
  }
  if (!parsed) throw new Error(`Keine verwertbare Modellantwort nach ${VERSUCHE} Versuchen — ${letzterFehler?.message}`)

  // Regel 8d-Wache: verbotene Wörter aus dem Bild-Prompt filtern
  const banned = /\b(photorealistic|photo-realistic|4k|8k|high detail|macro)\b/gi
  const imagePrompt = String(parsed.image_prompt_en || '').replace(banned, '').replace(/\s{2,}/g, ' ').trim()

  return {
    id: `saison_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    source_briefing_id: `saison:${fenster.id}`,
    category: 'saison',
    title: parsed.title,
    slug: toSlug(parsed.title),
    content_body: parsed.content_body,
    seo_title: parsed.seo_title,
    seo_description: parsed.seo_description,
    image_prompt_en: imagePrompt,
    tone_check_passed: true,
    tone_violations: [],
    status: 'draft',                          // human-gated: Freigabe in /admin/review
    generated_at: new Date().toISOString(),
  }
}

function imageBrief(draft) {
  return {
    image_negative_prompt_en: 'raw bloody meat, messy, dark moody slate, plastic look, visible muscle fibers',
    image_aspect_ratio: '16:9',
    image_style_preset: 'warm-rustikal',
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const today = new Date()
  const kalender = yaml.load(await readFile(join(ROOT, 'data', 'saison-kalender.yaml'), 'utf8'))

  const aktiv = (kalender.fenster || [])
    .filter(f => inWindow(today, f.von, f.bis))
    .map(f => ({ ...f, tage: daysUntil(today, f.anlass) }))
    .sort((a, b) => a.tage - b.tage)

  console.log(`Saison-Generator ${today.toISOString().slice(0, 10)} — aktive Fenster: ${aktiv.map(f => `${f.id}(${f.tage}d)`).join(', ') || 'keine'}`)
  if (!aktiv.length) { console.log('Kein aktives Saison-Fenster — nichts zu tun.'); return }

  for (const fenster of aktiv) {
    for (const thema of fenster.themen || []) {
      const slug = toSlug(thema)
      if (await draftExists(slug)) continue
      // Auch Titel-Slug nach Generierung kann abweichen — der Themen-Slug dient als Vorab-Dedupe;
      // der generierte Draft wird unter seinem eigenen Slug upserted (onConflict).
      console.log(`Thema gewählt [${fenster.label}]: ${thema}`)
      if (DRY_RUN) { console.log('(dry-run — keine Generierung, kein Insert)'); return }

      const draft = await generate(fenster, thema, fenster.tage)
      // Zweiter Dedupe auf den echten Titel-Slug
      if (await draftExists(draft.slug)) { console.log(`Draft existiert bereits (${draft.slug}) — überspringe.`); continue }

      const { error } = await supabase.from('content_drafts').upsert(
        { ...draft, ...imageBrief(draft) }, { onConflict: 'slug' })
      if (error) throw new Error(`Insert fehlgeschlagen: ${error.message}`)

      // Dedupe-Anker: Themen-Slug zusätzlich reservieren, falls Titel stark abweicht
      if (draft.slug !== slug) {
        await supabase.from('content_drafts').upsert({
          id: `saison_anchor_${Date.now()}`,
          source_briefing_id: `saison:${fenster.id}:anchor`,
          category: 'saison',
          title: `[Anker] ${thema}`,
          slug,
          content_body: `Themen-Anker — Inhalt liegt unter Slug "${draft.slug}".`,
          seo_title: '', seo_description: '', image_prompt_en: '',
          tone_check_passed: true, tone_violations: [],
          status: 'anchor',
          generated_at: new Date().toISOString(),
        }, { onConflict: 'slug' })
      }

      await supabase.from('pipeline_runs').upsert({
        run_id: `saison_${today.toISOString().slice(0, 10)}`,
        completed_at: new Date().toISOString(),
        status: 'completed',
        drafts_generated: 1,
      }, { onConflict: 'run_id' })

      console.log(`✅ Draft angelegt: "${draft.title}" (${draft.slug}) — wartet in /admin/review`)
      printCacheStats()
      return   // genau EIN Draft pro Lauf
    }
  }
  console.log('Alle Themen der aktiven Fenster sind bereits generiert — nichts zu tun.')
}

main().catch(err => { console.error('Fehler:', err.message); process.exit(1) })
