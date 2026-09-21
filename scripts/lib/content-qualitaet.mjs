/**
 * Content-Qualität — gemeinsame Regeln für Gate UND Generatoren (21.09.2026)
 *
 * WARUM EINE LIB: Die Fehler des Semantik-Laufs (56 abgeschnittene Rezepte,
 * Ibérico als Rind, Fahrenheit-Reste, „Hot-Spots und Hot-Spots", Glossar-
 * Permutationen) entstehen beim Generieren und wurden erst Wochen später von Hand
 * gefunden. Dieselbe Regel läuft deshalb an zwei Stellen:
 *   1. VOR dem Schreiben im Agenten (recipe-agent, glossary-agent) → Entwurf wird
 *      verworfen, der nächste Lauf versucht es neu.
 *   2. Im Gate `scripts/check-content-qualitaet.mjs` (npm run check → CI) → fängt,
 *      was von Hand oder an den Agenten vorbei ins Repo kommt.
 *
 * BEWUSST NICHT im Vercel-Build (prebuild): Architektur-Audit 27.08.2026, Regel 5 —
 * „Inhalts-Gates nur in npm run check/CI". Ein Inhaltsbefund darf keinen Deploy
 * einer Code-Änderung blockieren.
 *
 * Jede Regel liefert Befunde { regel, schwere: 'fehler'|'warnung', text, auszug }.
 * Vokabular kommt ausschließlich aus data/taxonomie.yaml und
 * data/kerntemperatur-referenz.yaml — hier steht keine zweite Liste.
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import { toString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// ─── Vokabular laden ─────────────────────────────────────────────────────────

let _tax, _kern
export function taxonomie () {
  if (!_tax) _tax = yaml.load(readFileSync(join(ROOT, 'data', 'taxonomie.yaml'), 'utf8'))
  return _tax
}
export function kernReferenz () {
  if (!_kern) _kern = yaml.load(readFileSync(join(ROOT, 'data', 'kerntemperatur-referenz.yaml'), 'utf8'))
  return _kern
}

/** klein, ohne Akzente (ibérico → iberico), Umlaute bleiben. */
export function norm (s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[äöü]/g, m => ({ 'ä': '\u0001', 'ö': '\u0002', 'ü': '\u0003' })[m])
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[\u0001\u0002\u0003]/g, m => ({ '\u0001': 'ä', '\u0002': 'ö', '\u0003': 'ü' })[m])
}

function escapeRe (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function wortRe (begriff) {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(norm(begriff))}(?![\\p{L}\\p{N}])`, 'u')
}
function kommtVor (text, begriff) { return wortRe(begriff).test(norm(text)) }

// ─── Frontmatter + Body trennen ──────────────────────────────────────────────

export function zerlege (raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
  if (!m) return { data: {}, body: raw, fmFehler: null, fmZeilen: 0 }
  let data = {}, fmFehler = null
  try { data = yaml.load(m[1]) || {} } catch (e) { fmFehler = e.message.split('\n')[0] }
  return { data, body: m[2], fmFehler, fmZeilen: m[1].split('\n').length + 2 }
}

// ─── 1. AST: Parse-Fehler, Abbrüche, Wortdopplungen ─────────────────────────

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm)

const SATZENDE = /[.!?…:;)"'“”»«›‹\]*_`]$|\p{Extended_Pictographic}$/u

/** Textknoten ohne Code — Grundlage für Dopplungs- und Temperatur-Regeln. */
function fliesstextBloecke (tree) {
  const bloecke = []
  visit(tree, (node) => {
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'tableCell') {
      bloecke.push(toString(node))
      return 'skip'
    }
    if (node.type === 'code' || node.type === 'inlineCode' || node.type === 'mdxjsEsm') return 'skip'
  })
  return bloecke
}

export function pruefeStruktur (body, { datei = '' } = {}) {
  const befunde = []
  let tree
  try {
    tree = parser.parse(body)
  } catch (e) {
    befunde.push({ regel: 'mdx-parse', schwere: 'fehler', text: `MDX nicht parsebar: ${e.reason || e.message}`, auszug: `Zeile ${e.line ?? '?'}` })
    return { befunde, tree: null, bloecke: [] }
  }

  // Letzter inhaltlicher Knoten: Absatz muss mit Satzzeichen enden, eine
  // Überschrift am Ende ist ein Abbruch. JSX-Komponenten, Listen, Tabellen am
  // Ende sind legitim (CTA-Boxen, Zutatenlisten).
  const kinder = tree.children.filter(n => !['mdxjsEsm', 'thematicBreak', 'html'].includes(n.type))
  const letzter = kinder[kinder.length - 1]
  if (!letzter) {
    befunde.push({ regel: 'abgeschnitten', schwere: 'fehler', text: 'Body ist leer', auszug: '' })
  } else if (letzter.type === 'heading') {
    befunde.push({ regel: 'abgeschnitten', schwere: 'fehler', text: 'Datei endet mit einer Überschrift ohne Inhalt', auszug: toString(letzter).slice(0, 60) })
  } else if (letzter.type === 'paragraph') {
    const t = toString(letzter).trim()
    if (t && !SATZENDE.test(t)) {
      befunde.push({ regel: 'abgeschnitten', schwere: 'fehler', text: 'Letzter Absatz endet ohne Satzzeichen — vermutlich abgeschnitten', auszug: `…${t.slice(-50)}` })
    }
  }

  const bloecke = fliesstextBloecke(tree)
  befunde.push(...pruefeWortdopplung(bloecke))
  return { befunde, tree, bloecke }
}

export function pruefeWortdopplung (bloecke) {
  const erlaubt = new Set((taxonomie().wortdopplung_erlaubt || []).map(norm))
  const befunde = []
  // Relativpronomen + Artikel: „Stärke, die die Brühe trübt", „bei der der Grill" — korrektes Deutsch.
  const FUNKTIONSWORT = new Set(['die', 'der', 'das', 'dem', 'den', 'des', 'sie', 'es', 'ob', 'zu'])
  const W = '[\\p{L}][\\p{L}\\p{N}\\-]'
  // „die die" direkt hintereinander (ab 3 Zeichen, Groß/klein egal)
  const direkt = new RegExp(`(?<![\\p{L}\\-])(${W}{2,})\\s+\\1(?![\\p{L}\\-])`, 'giu')
  // „Hot-Spots und Hot-Spots" (ab 4 Zeichen)
  const verbunden = new RegExp(`(?<![\\p{L}\\-])(${W}{3,})\\s+(und|oder|bzw\\.|sowie|&)\\s+\\1(?![\\p{L}\\-])`, 'giu')
  for (const b of bloecke) {
    for (const re of [direkt, verbunden]) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(b))) {
        if (erlaubt.has(norm(m[0]))) continue
        if (re === direkt && FUNKTIONSWORT.has(norm(m[1]))) continue
        befunde.push({ regel: 'wortdopplung', schwere: 'fehler', text: `Wortdopplung „${m[0]}"`, auszug: b.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30) })
      }
    }
  }
  return befunde
}

/** Kurztexte im Frontmatter, die als ganzer Satz auf der Seite stehen. */
export function pruefeFrontmatterSaetze (data) {
  const befunde = []
  for (const feld of ['description', 'shortDefinition', 'excerpt']) {
    const v = data?.[feld]
    if (typeof v !== 'string' || v.trim().length < 40) continue
    const t = v.trim()
    if (!SATZENDE.test(t)) befunde.push({ regel: 'abgeschnitten', schwere: 'fehler', text: `Frontmatter „${feld}" endet ohne Satzzeichen`, auszug: `…${t.slice(-50)}` })
  }
  return befunde
}

// ─── 2. Domänenregeln: Temperaturen ─────────────────────────────────────────

const LOWSLOW = /low\s*(&|and|und|n)\s*slow|smoker|räucher|geräuchert|pulled|brisket|niedrigtemperatur|konstant|indirekt/i
const HOCHHITZE = /oberfläche|platte|sear|anbraten|anrösten|oberhitze|beefer|pizza|direkt|scharf|kruste|glut|volle(r)? hitze|höchste(r)? stufe|backstein|flamme|salamander|infrarot|keramik.*°|plancha|wok|800|heißeste/i
// Wortanfang zwingend: „Zuc-kern", „Innenräume" sind keine Kerntemperatur.
const KERN = /(?<!\p{L})(kern|im inneren)/iu
const ZIEH = /zieh|vom (grill|rost)|runternehmen|herunternehmen|nachzieh|carry\s*-?over|ruhen|rast|steigt|abnehmen|nimm|dann|danach|anschließend|phase|führen/i

/** Sätze aus Blöcken (grob, reicht für Temperaturkontext). */
function saetze (bloecke) {
  return bloecke.flatMap(b => b.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„"])/u))
}

/**
 * °C-Werte mit Nahkontext. `vor`/`nach` = 40/30 Zeichen um den Wert — ein Satz
 * nennt oft Garraum UND Kern („bei 110 °C smoken, bis 93 °C Kerntemperatur");
 * der Satzkontext allein ordnet den falschen Wert zu (Kalibrierung 21.09.2026).
 */
function celsiusWerte (satz) {
  const werte = []
  const re = /(\d{2,3})(?:\s*(?:[–—-]|bis)\s*(\d{2,3}))?\s*°\s*C(?![a-z])/gi
  let m
  while ((m = re.exec(satz))) {
    werte.push({
      von: +m[1], bis: m[2] ? +m[2] : +m[1],
      vor: satz.slice(Math.max(0, m.index - 40), m.index),
      nach: satz.slice(m.index + m[0].length, m.index + m[0].length + 30),
    })
  }
  return werte
}
const UMGEBUNG = /kammer|garraum|grill|rost|smoker|ofen|oberfläche|platte|hitze|glut|luft|wasser|öl|fett|pfanne|zone|deckel|temperatur(en)? (von|zwischen)/i
/** Ist dieser Wert eine Kerntemperatur? Kern-Wort in der Nähe, kein Garraum-Wort davor. */
function istKernwert (w) {
  const davor = w.vor.slice(-25)
  if (KERN.test(davor) && !UMGEBUNG.test(davor)) return true      // „bis der Kern 75 °C"
  return /^[\s)]*(kern|im kern)/i.test(w.nach)                     // „58–62 °C Kerntemperatur"
}

export function pruefeTemperaturen (bloecke, { tierart = null } = {}) {
  const befunde = []
  const sicher = kernReferenz().sicherheit || {}
  const minimum = tierart && ({ schwein: sicher.schwein, gefluegel: sicher.gefluegel, hack: sicher.hackfleisch, wildschwein: sicher.wildschwein })[tierart]

  for (const s of saetze(bloecke)) {
    // a) Fahrenheit ohne Celsius-Angabe im selben Satz
    if (/\d\s*°\s*F(?![a-zäöü])/.test(s) && !/°\s*C/.test(s)) {
      befunde.push({ regel: 'fahrenheit', schwere: 'fehler', text: 'Fahrenheit-Wert ohne °C im selben Satz', auszug: s.slice(0, 140) })
    }
    const werte = celsiusWerte(s)
    if (!werte.length) continue

    // b) Kerntemperatur über 100 °C ist physikalisch unmöglich → Einheitenfehler
    if (werte.some(w => w.bis > 100 && istKernwert(w))) {
      befunde.push({ regel: 'fahrenheit-verdacht', schwere: 'fehler', text: 'Kerntemperatur > 100 °C — Einheit prüfen (°F statt °C?)', auszug: s.slice(0, 140) })
    }
    // c) Low & Slow mit > 200 °C ohne Hochhitze-Kontext → typischer °F-Rest (225 °F → „225 °C")
    // Nur wenn der GANZE Bereich über 200 liegt: „80–260 °C" (Pelletgrill-Spanne)
    // ist legitim, „225–250 °C räuchern" ist ein °F-Rest.
    if (LOWSLOW.test(s) && !HOCHHITZE.test(s) && werte.some(w => w.von > 200)) {
      befunde.push({ regel: 'fahrenheit-verdacht', schwere: 'fehler', text: 'Low-&-Slow-Kontext mit über 200 °C — Celsius/Fahrenheit-Verwechslung?', auszug: s.slice(0, 140) })
    }
    // d) Kerntemperatur unter dem Sicherheits-Minimum der Tierart
    if (minimum && KERN.test(s)) {
      const zuNiedrig = werte.filter(w => w.bis < minimum && w.von >= 40 && istKernwert(w))
      if (zuNiedrig.length) {
        const ziehwert = ZIEH.test(s)
        befunde.push({
          regel: 'kerntemperatur-sicherheit',
          schwere: ziehwert ? 'warnung' : 'fehler',
          text: `${tierart}: ${zuNiedrig.map(w => w.von === w.bis ? w.von : `${w.von}–${w.bis}`).join(', ')} °C unter Minimum ${minimum} °C${ziehwert ? ' (als Ziehwert formuliert — Carryover prüfen)' : ''}`,
          auszug: s.slice(0, 140),
        })
      }
    }
  }
  return befunde
}

// ─── 3. Entitäten: Tierart-Konflikte ────────────────────────────────────────

/** Tierarten, deren EINDEUTIGE Begriffe im Text vorkommen. */
export function eindeutigeTierarten (text) {
  const treffer = new Map()
  for (const [tier, begriffe] of Object.entries(taxonomie().tierart || {})) {
    const b = begriffe.find(x => kommtVor(text, x))
    if (b) treffer.set(tier, b)
  }
  return treffer
}
function signalTierarten (text) {
  const out = new Set()
  for (const [tier, woerter] of Object.entries(taxonomie().tierart_signale || {})) {
    if (woerter.some(w => kommtVor(text, w) || norm(text).includes(norm(w)))) out.add(tier)
  }
  return out
}

/**
 * Konflikt, wenn die Angabe (meatType, Kategorie-Text) eine ANDERE Tierart nennt
 * als der eindeutige Begriff — und die eigene gar nicht.
 * Beispiel 21.09.: Glossar „presa" mit „Teilstück vom Rind".
 */
export function pruefeTierart ({ begriffsText, angabeText }) {
  const befunde = []
  if (!angabeText) return befunde
  const eindeutig = eindeutigeTierarten(begriffsText)
  if (eindeutig.size !== 1) return befunde // Mischgerichte (Surf & Turf) nicht bewerten
  const [[tier, begriff]] = [...eindeutig]
  const signale = signalTierarten(angabeText)
  if (signale.size && !signale.has(tier)) {
    befunde.push({ regel: 'tierart-konflikt', schwere: 'fehler', text: `„${begriff}" ist ${tier}, die Angabe nennt ${[...signale].join('/')}`, auszug: String(angabeText).slice(0, 140) })
  }
  return befunde
}

/** Tierart eines Rezepts für die Sicherheitsregel (nur wenn eindeutig). */
export function rezeptTierart (data) {
  const t = norm(`${data?.meatType ?? ''} ${data?.title ?? ''}`)
  if (/wildschwein/.test(t)) return 'wildschwein'
  // Kebab allein ist KEIN Hack (Şiş Kebab = Stücke) — nur die Hackformen.
  if (/hack|burger|köfte|kofta|adana|cevapcici|ćevapčići|frikadelle|bratwurst|wurst|kafta/.test(t)) return 'hack'
  const eindeutig = eindeutigeTierarten(t)
  const signale = signalTierarten(t)
  const alle = new Set([...eindeutig.keys(), ...signale])
  if (alle.size !== 1) return null
  const [tier] = alle
  return ['schwein', 'gefluegel'].includes(tier) ? tier : null
}

/** Glossar-Begriff mit eindeutiger Tierart (presa, secreto) → Sicherheitsregel greift. */
export function glossarTierart (text) {
  const e = eindeutigeTierarten(text)
  if (e.size !== 1) return null
  const [tier] = e.keys()
  return ['schwein', 'gefluegel'].includes(tier) ? tier : null
}

// ─── 4. Taxonomie: Glossar-Dubletten ────────────────────────────────────────

/**
 * Prüft einen (neuen) Glossar-Slug gegen den Bestand.
 * @returns {{kanonisch: string|null, grund: string}|null}  null = unbedenklich
 */
export function glossarDublette (slug, bestand) {
  const tax = taxonomie()
  const vorhanden = bestand instanceof Set ? bestand : new Set(bestand)
  const syn = tax.glossar_synonyme || {}
  if (syn[slug] && vorhanden.has(syn[slug]) && syn[slug] !== slug) {
    return { kanonisch: syn[slug], grund: `Synonym von „${syn[slug]}" (data/taxonomie.yaml)` }
  }
  // Singular/Plural-Varianten: anteil/anteile, rub/rubs, steak/steaks
  for (const v of [slug.replace(/(e|s|n|en)$/, ''), `${slug}e`, `${slug}s`, `${slug}n`]) {
    if (v !== slug && v.length > 3 && vorhanden.has(v)) return { kanonisch: v, grund: `Singular/Plural-Variante von „${v}"` }
  }
  const m = /^(.+)-([a-zäöü]+)$/.exec(slug)
  if (m && vorhanden.has(m[1]) && (tax.glossar_fuellwort_suffixe || []).includes(m[2])) {
    return { kanonisch: m[1], grund: `Füllwort-Permutation von „${m[1]}" (-${m[2]})` }
  }
  return null
}

// ─── 5. Bilder: Motiv-Plausibilität (Text-Ebene) ────────────────────────────

/**
 * Nur die billige Text-Ebene: Alt-Text muss mindestens ein Sachwort des Titels
 * oder der Kategorie tragen. Fängt „Strand"-Alt-Texte, NICHT einen Alt-Text,
 * der das falsche Motiv schönredet (oberhitzegrill-vergleich: Alt sagt Beefer,
 * Bild zeigt Seebrücke). Das kann nur der Vision-Check (check-bild-motiv.mjs).
 */
const FREMDMOTIV = /\b(strand|meer|seebrücke|see|berg|gebirge|wald|stadt|skyline|büro|laptop|gemüsestand|blumen|hund|katze|sonnenuntergang)\b/i
export function pruefeBildAlt (data) {
  const befunde = []
  const alt = data?.imageAlt
  if (typeof alt !== 'string' || !alt.trim()) return befunde // Pflichtfeld prüft validate-frontmatter
  if (FREMDMOTIV.test(alt) && !/grill|fleisch|steak|feuer|glut|fisch|garnele|rost/i.test(alt)) {
    befunde.push({ regel: 'bild-motiv', schwere: 'fehler', text: 'Alt-Text beschreibt ein Motiv ohne Grill-/Fleischbezug', auszug: alt.slice(0, 140) })
  }
  return befunde
}

// ─── Gesamtprüfung eines Dokuments ──────────────────────────────────────────

/**
 * @param {string} raw        komplette MDX-Datei
 * @param {object} o
 * @param {string} o.bereich  Unterordner von content/ (rezepte, glossar, …)
 * @param {string} o.slug
 */
export function pruefeDokument (raw, { bereich = '', slug = '' } = {}) {
  const { data, body, fmFehler } = zerlege(raw)
  const befunde = []
  if (fmFehler) befunde.push({ regel: 'frontmatter-parse', schwere: 'fehler', text: `Frontmatter-YAML defekt: ${fmFehler}`, auszug: '' })

  const { befunde: struktur, bloecke } = pruefeStruktur(body)
  befunde.push(...struktur)
  befunde.push(...pruefeFrontmatterSaetze(data))

  const faqTexte = Array.isArray(data?.faq) ? data.faq.map(f => `${f?.question ?? ''} ${f?.answer ?? ''}`) : []
  const tierart = bereich === 'rezepte' ? rezeptTierart(data)
    : bereich === 'glossar' ? glossarTierart(`${data?.title ?? ''} ${slug}`)
    : null
  befunde.push(...pruefeTemperaturen([...bloecke, ...faqTexte], { tierart }))

  if (bereich === 'rezepte') {
    befunde.push(...pruefeTierart({ begriffsText: `${data.title ?? ''} ${slug}`, angabeText: data.meatType }))
  }
  if (bereich === 'glossar') {
    befunde.push(...pruefeTierart({ begriffsText: `${data.title ?? ''} ${slug}`, angabeText: data.shortDefinition }))
  }
  befunde.push(...pruefeBildAlt(data))
  return befunde
}
