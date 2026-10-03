#!/usr/bin/env node
/**
 * Social-Posting-Engine (MVP) — erzeugt Post-ENTWÜRFE aus Rezepten.
 * Claude schreibt je Rezept Caption + Hashtags (Brand-Voice) und wählt das Bild
 * (Hero bevorzugt). Schreibt eine reviewbare Markdown-Datei nach social-drafts/.
 *
 * KEIN Auto-Posten (extern/unumkehrbar + Account-Zugang nötig) — human-gated:
 * Uwe prüft, passt an, postet/plant manuell (z.B. via Postiz).
 *
 * Usage:
 *   node scripts/social-posts.mjs --only tomahawk-reverse-sear,cedar-plank-lachs
 *   node scripts/social-posts.mjs --limit 5
 *   node scripts/social-posts.mjs --plan      # nur die Auswahl zeigen, kein API-Aufruf
 * Env: ANTHROPIC_API_KEY (env zuerst, sonst .env.local)
 *
 * AUSWAHL (03.10.2026): Ohne --only bestimmt scripts/lib/social-auswahl.mjs, welche
 * Rezepte dran sind — Neues der letzten 7 Tage zuerst, der Rest aus einem Fenster,
 * das jede Woche weiterwandert. Vorher nahm das Skript die ersten `--limit` Dateien
 * aus readdir: jede Woche dieselben fuenf.
 *
 * EXITCODE (03.10.2026, CLAUDE.md Regel 10): 0 nur, wenn mindestens ein Entwurf
 * geschrieben wurde. Fehlender Schluessel, keine Auswahl oder lauter gescheiterte
 * Generierungen enden mit 1 — vorher war jeder dieser Faelle ein gruener Lauf.
 */
import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync, appendFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { callClaude, printCacheStats } from './lib/anthropic.mjs'
import { waehleRezepte } from './lib/social-auswahl.mjs'
process.on('exit', () => printCacheStats('  '))

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT    = join(__dirname, '..')
const REZEPTE = join(ROOT, 'content', 'rezepte')
const OUT     = join(ROOT, 'social-drafts')

const ONLY  = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',').map(s => s.trim()) : null
const LIMIT = process.argv.includes('--limit')
  ? parseInt(process.argv[process.argv.indexOf('--limit') + 1], 10) : (ONLY ? Infinity : 5)
const NUR_PLAN = process.argv.includes('--plan')

let KEY = process.env.ANTHROPIC_API_KEY
if (!KEY && existsSync(join(ROOT, '.env.local'))) {
  const m = (await readFile(join(ROOT, '.env.local'), 'utf8')).match(/^ANTHROPIC_API_KEY=(.+)$/m)
  if (m) KEY = m[1].trim()
}

const c = { g: s => `\x1b[32m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, d: s => `\x1b[2m${s}\x1b[0m` }
const fm = (raw, k) => { const m = raw.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, 'm')); return m ? m[1] : '' }

const SYSTEM = `Du bist Social Media Senior Director der Steakakademie — Deutschlands premium BBQ-Wissensplattform. Du trägst die strategische und redaktionelle Verantwortung für alle Social-Media-Kanäle. Stimme: premium, autoritativ, direkt, leidenschaftlich; deutsche Präzision trifft Texas-Seele. KEIN Clickbait, kein Emoji-Spam (maximal 1-2 gezielt). CTA führt zu steakakademie.de und der Identität "SteakAdemiker". Schreibe auf Deutsch.

TIKTOK STORY-HIGHLIGHTS (Reichweiten-Taktik, verankert 16.06.2026): TikTok bevorzugt Nutzer, die neue Plattform-Funktionen (wie Story-Highlights) aktiv nutzen, und belohnt dies mit mehr Reichweite. Bei Bedarf einsetzen: Profil → "Story-Highlights erstellen" → Highlights immer benennen (z.B. "Cuts", "Kerntemps", "Technik", "Rezepte", "Tools"), damit Zuschauer den Inhalt sofort erkennen.

WERBEKENNZEICHNUNG (dauerhaft verankerte Pflicht, LG Köln 12.05.2026): Werbliche, bezahlte, gesponserte oder Affiliate-Posts müssen das Wort "Werbung" oder "Anzeige" bereits sichtbar im Grid/Vorschaubild (Cover/Titelbild) tragen — VOR dem ersten Klick. Ein Hinweis nur in der Caption ist zu spät und rechtswidrig (Abmahnfalle); das englische "Ad" zählt NICHT. Bei solchen Posts beginnt die Caption mit "Werbung:" bzw. "Anzeige:", und der Bild-/Cover-Hinweis fordert das Label sichtbar im Vorschaubild. Rein redaktionelle/organische Rezept-Posts (kein bezahlter Inhalt) brauchen kein Label.

Gib AUSSCHLIESSLICH gültiges JSON zurück — kein Markdown, kein Vorwort.

Format exakt:
{"hook":"starke erste Zeile, max 80 Zeichen","caption":"2-4 Sätze mit echtem Mehrwert (eine präzise Erkenntnis aus dem Rezept) + CTA am Ende","hashtags":["10-12 Tags, Mix breit (#bbq #grillen #steak) und Nische (Cut/Methode/Herkunft), deutsch und englisch"],"tiktok_hook":"kurzer gesprochener Aufhänger für ein 30-60s Video","image":"hero"}`

async function gen(title, desc, meat, kat) {
  const user = `Rezept: ${title}\nKategorie: ${kat}\nHauptzutat: ${meat}\nBeschreibung: ${desc}`
  const r = await callClaude({
    model: 'claude-haiku-4-5-20251001', max_tokens: 700, temperature: 0.7,
    system: SYSTEM, messages: [{ role: 'user', content: user }], label: 'social-posts',
  })
  return r.json()
}

/** Zahlen ins Job-Summary — auch (und gerade) wenn nichts herauskam. */
function summary (zeilen) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, zeilen.join('\n') + '\n')
}

async function main() {
  console.log(c.d('\n📣 Social-Posting-Engine (Entwürfe)\n'))

  // Erst lesen, dann auswaehlen: die Auswahl braucht Datum und Status aller Rezepte.
  const rezepte = []
  for (const file of (await readdir(REZEPTE)).filter(f => f.endsWith('.mdx')).sort()) {
    const raw = await readFile(join(REZEPTE, file), 'utf8')
    rezepte.push({
      slug: file.replace(/\.mdx$/, ''), raw,
      publishedAt: fm(raw, 'publishedAt'), status: fm(raw, 'status'),
      reviewed: fm(raw, 'reviewed') === 'false' ? false : undefined,
    })
  }

  let dran, kopf
  if (ONLY) {
    dran = rezepte.filter(r => ONLY.includes(r.slug)).slice(0, LIMIT)
    kopf = `--only: ${dran.length} von ${ONLY.length} genannten Rezepten gefunden`
  } else {
    const w = waehleRezepte(rezepte, { limit: LIMIT })
    dran = w.auswahl
    kopf = `KW ${w.woche.woche}/${w.woche.jahr} · ${w.verfuegbar} veröffentlichte Rezepte · neu: ${w.frisch.join(', ') || '–'} · Bestand: ${w.bestand.join(', ') || '–'}`
  }
  console.log(c.d(`Auswahl — ${kopf}\n`))
  if (NUR_PLAN) return

  if (!KEY) {
    summary(['## 📣 Social-Media-Entwürfe', '', '**🔴 0 Entwürfe — ANTHROPIC_API_KEY fehlt.**'])
    throw new Error('ANTHROPIC_API_KEY fehlt — kein Entwurf erzeugt.')
  }

  await mkdir(OUT, { recursive: true })
  const blocks = []
  const fehler = []
  let done = 0
  // Genau die Auswahl, nicht mehr: Scheitert eine Generierung, rueckt kein anderes
  // Rezept nach. Vorher lief die Schleife bei Fehlern durch den ganzen Bestand.
  for (const { slug, raw } of dran) {
    const title = fm(raw, 'title'), desc = fm(raw, 'description'), meat = fm(raw, 'meatType'), kat = fm(raw, 'kategorie')
    const url  = `/rezepte/${kat}/${slug}`
    const hero = `/images/rezepte/${slug}-hero.jpg`, card = `/images/rezepte/${slug}.jpg`
    try {
      process.stdout.write(c.d(`◇ ${slug} … `))
      const p = await gen(title, desc, meat, kat)
      const img = (p.image === 'hero' && existsSync(join(ROOT, 'public', hero))) ? hero : card
      blocks.push(
        `## ${title}\n` +
        `- **Slug:** \`${slug}\` · **Link:** ${url}\n` +
        `- **Bild:** \`${img}\`\n` +
        `- **Hook:** ${p.hook}\n` +
        `- **Caption (IG/FB):**\n  > ${String(p.caption).replace(/\n+/g, ' ')}\n` +
        `- **TikTok-Hook:** ${p.tiktok_hook}\n` +
        `- **Hashtags:** ${(p.hashtags || []).join(' ')}\n`
      )
      console.log(c.g('✓')); done++
    } catch (e) { console.log(c.r(`✗ ${e.message}`)); fehler.push(`${slug}: ${e.message}`) }
  }

  const bilanz = [
    '## 📣 Social-Media-Entwürfe', '',
    `**${done ? '✅' : '🔴'} ${done} von ${dran.length} Entwürfen erzeugt**${fehler.length ? ` · ${fehler.length} fehlgeschlagen` : ''}`, '',
    `Auswahl — ${kopf}`,
    ...(fehler.length ? ['', ...fehler.map(f => `- ✗ ${f.slice(0, 200)}`)] : []),
  ]
  if (!blocks.length) {
    summary(bilanz)
    throw new Error(dran.length ? `alle ${dran.length} Generierungen fehlgeschlagen — kein Entwurf.` : 'keine Rezepte in der Auswahl — kein Entwurf.')
  }
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const path  = join(OUT, `drafts-${stamp}.md`)
  await writeFile(path, `# Social-Post-Entwürfe — ${stamp}\n\n> Human-gated. Prüfen, anpassen, dann manuell posten/planen (z.B. Postiz). KEIN Auto-Posten.\n>\n> Auswahl — ${kopf}\n\n${blocks.join('\n---\n\n')}`, 'utf8')
  summary(bilanz)
  console.log(`\n${c.g(`✓ ${done} Entwürfe`)} → ${c.d(path.replace(ROOT, '.'))}\n`)
}

main().catch(e => {
  console.error(c.r(`\n✗ Social-Entwürfe fehlgeschlagen: ${e.message}\n`))
  process.exit(1)
})
