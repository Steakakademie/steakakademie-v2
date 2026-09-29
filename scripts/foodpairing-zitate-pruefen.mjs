#!/usr/bin/env node
/**
 * Steakakademie — Foodpairing: Zitat-Prüfung (29.09.2026)
 *
 * Prüft jede Zeile von data/foodpairing/zitate.tsv (oder einer Recherche-Lieferung im selben
 * Format) gegen den Quelltext, der hinter `url` steht:
 *   1. das Zitat steht wörtlich im Quelltext (neutralisiert werden nur Leerraum, Bindestrich-
 *      Varianten, HTML-Entities und Inline-Tags wie <i>/<sub> mitten im Stoffnamen)
 *      — Auslassungen nur als „ … " (Tabellentitel … Tabellenzeile): Teilstücke in Reihenfolge, nah beieinander
 *   2. `stoff_im_zitat` steht im Zitat
 *   3. (nur für die Repo-Datei) zu jeder Zeile gibt es den Beleg in belege.tsv (zutat + stoff + doi)
 *
 * Spalten: zutat  stoff  stoff_im_zitat  doi  url  fundstelle  zitat
 * `url` darf sein: Europe-PMC-Suche (JSON) oder -Volltext (fullTextXML), PubMed efetch,
 * Crossref- oder OpenAlex-Werk, oder ein frei zugängliches PDF (braucht `pdftotext` aus poppler).
 * Andere Seiten werden als Rohtext verglichen.
 *
 * Braucht Netz → bewusst NICHT in `npm run check` (Builds nie durch Netz/Inhalt blockieren).
 * Hinter einem Proxy: NODE_USE_ENV_PROXY=1 setzen.
 *
 * Usage:
 *   npm run foodpairing:zitate                         # data/foodpairing/zitate.tsv
 *   npm run foodpairing:zitate -- --datei lieferung.tsv
 */

import { readFileSync } from 'fs'
import { execFileSync } from 'child_process'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'data', 'foodpairing')
const i = process.argv.indexOf('--datei')
const DATEI = i > 0 ? resolve(process.argv[i + 1]) : join(DIR, 'zitate.tsv')
const REPO_DATEI = DATEI === join(DIR, 'zitate.tsv')

function tsv(pfad) {
  const zeilen = readFileSync(pfad, 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'))
  const kopf = zeilen.shift().split('\t')
  return zeilen.map((l) => Object.fromEntries(l.split('\t').map((v, n) => [kopf[n], (v ?? '').trim()])))
}

const INLINE = '(?:i|b|u|em|strong|sup|sub|sc|italic|bold|underline|span|jats:italic|jats:bold|jats:sup|jats:sub|jats:sc|inline-formula|mml:[a-z]+)'
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', minus: '−', thinsp: ' ', hairsp: ' ', prime: '′' }
function entkleide(t) {
  t = t.replace(new RegExp(`<${INLINE}(\\s[^>]*)?/?>`, 'gi'), '').replace(new RegExp(`</${INLINE}\\s*>`, 'gi'), '')
  t = t.replace(/<[^>]+>/g, ' ')
  for (let n = 0; n < 2; n++)
    t = t
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m)
  return t
}
function norm(t) {
  return entkleide(t)
    .normalize('NFKC')
    .replace(/[‐-—−﹣－]/g, '-')
    .replace(/­/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}
const kompakt = (t) => norm(t).replace(/\s+/g, '')

const cache = new Map()
async function hole(url) {
  if (cache.has(url)) return cache.get(url)
  let text = ''
  for (let versuch = 0; versuch < 3 && !text; versuch++) {
    await new Promise((r) => setTimeout(r, 400 + 2000 * versuch))
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'steakakademie-foodpairing-zitate/1.0' } })
      if (res.status === 404) break
      if (res.ok) text = /\.pdf($|\?)/i.test(url) ? pdfText(Buffer.from(await res.arrayBuffer())) : await res.text()
    } catch {
      /* nächster Versuch */
    }
  }
  const quelltext = extrahiere(url, text)
  cache.set(url, quelltext)
  return quelltext
}

/**
 * PDF (z. B. Dissertation auf mediaTUM) → Text über `pdftotext` (poppler). Silbentrennung am
 * Zeilenende wird zurückgenommen („Methylpro-\npanal" → „Methylpropanal"), echte Bindestriche vor
 * Ziffern/Großbuchstaben bleiben. Ohne pdftotext: leer → Meldung „Quelltext nicht abrufbar".
 */
function pdfText(buf) {
  try {
    const t = execFileSync('pdftotext', ['-layout', '-', '-'], { input: buf, maxBuffer: 64 * 1024 * 1024 }).toString('utf8')
    // „<"/„>" im Fließtext (z. B. „OAV > 1") würden sonst von der Tag-Entfernung als Tag gelesen
    return t.replace(/-\n\s*(?=\p{Ll})/gu, '').replace(/</g, '‹').replace(/>/g, '›')
  } catch {
    return ''
  }
}

function extrahiere(url, text) {
  if (!text) return ''
  try {
    if (url.includes('europepmc') && url.includes('/search')) {
      return JSON.parse(text).resultList.result.map((r) => `${r.title ?? ''} ${r.abstractText ?? ''}`).join(' ')
    }
    if (url.includes('api.crossref.org')) {
      const m = JSON.parse(text).message
      return `${(m.title ?? []).join(' ')} ${m.abstract ?? ''}`
    }
    if (url.includes('api.openalex.org')) {
      const w = JSON.parse(text)
      const pos = []
      for (const [wort, stellen] of Object.entries(w.abstract_inverted_index ?? {})) for (const p of stellen) pos[p] = wort
      return `${w.title ?? ''} ${pos.filter((x) => x !== undefined).join(' ')}`
    }
    if (url.includes('eutils.ncbi.nlm.nih.gov')) {
      return [...text.matchAll(/<(ArticleTitle|AbstractText)[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]).join(' ')
    }
  } catch {
    return ''
  }
  return text // Volltext-XML oder sonstige Seite
}

/**
 * Zitat im Quelltext? Ein Zitat darf mit „ … " Auslassungen enthalten (z. B. Tabellentitel … Tabellenzeile):
 * dann muss jedes Teilstück wörtlich und in dieser Reihenfolge im SELBEN Block stehen — Block = eine
 * Tabelle (<table-wrap>) bzw. ein Absatz (<p>) des Volltext-XML; ein Abstract ist ein Block. So kann ein
 * Tabellentitel nicht mit einer Zeile aus der nächsten Tabelle kombiniert werden.
 */
function bloecke(quelle) {
  if (!/<table-wrap|<p[\s>]/.test(quelle)) return [quelle]
  const tabellen = quelle.match(/<table-wrap[\s>][\s\S]*?<\/table-wrap>/g) ?? []
  const rest = quelle.replace(/<table-wrap[\s>][\s\S]*?<\/table-wrap>/g, '</p>')
  return [...tabellen, ...rest.split(/<\/p>/)]
}
function stehtIm(quelle, zitat) {
  const teile = zitat.split(' … ').map(kompakt).filter(Boolean)
  return bloecke(quelle).some((block) => {
    const q = norm(block).replace(/\s+/g, '')
    let pos = 0
    for (const t of teile) {
      const p = q.indexOf(t, pos)
      if (p === -1) return false
      pos = p + t.length
    }
    return true
  })
}

const belege = REPO_DATEI ? new Set(tsv(join(DIR, 'belege.tsv')).map((b) => `${b.zutat}|${b.stoff}|${b.doi}`)) : null
const zeilen = tsv(DATEI)
let fehler = 0
for (const [n, z] of zeilen.entries()) {
  const befunde = []
  const quelle = await hole(z.url)
  if (!quelle) befunde.push('Quelltext nicht abrufbar')
  else if (!stehtIm(quelle, z.zitat)) befunde.push('Zitat steht nicht im Quelltext')
  if (!z.stoff_im_zitat || !kompakt(z.zitat).includes(kompakt(z.stoff_im_zitat))) befunde.push('Stoffname fehlt im Zitat')
  if (belege && !belege.has(`${z.zutat}|${z.stoff}|${z.doi}`)) befunde.push('kein passender Beleg in belege.tsv')
  if (befunde.length) fehler++
  console.log(`${befunde.length ? '✖' : '✓'} ${String(n + 1).padStart(3)} ${z.zutat} · ${z.stoff} · ${z.doi}${befunde.length ? '  → ' + befunde.join('; ') : ''}`)
}
console.log(`\n${zeilen.length - fehler}/${zeilen.length} Zitate bestätigt.`)
process.exit(fehler ? 1 : 0)
