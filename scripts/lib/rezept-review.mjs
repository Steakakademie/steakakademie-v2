/**
 * Review-Hilfen fuer Agenten-PRs (Rezepte).
 *
 * Warum es das gibt: Beim Rote-Bete-Salsa-Rezept (PR #310, 05.10.2026) fand erst eine
 * Handpruefung, was der Agent nicht merkt — Garzeit im Schritt (5–6 Min./Seite) gegen
 * Fliesstext (2–3 Min./Seite), eine unbelegte „Physik"-Aussage, ein Bild, das nicht
 * zum Text passte. Das Review-Gate ist der Merge durch Uwe (Regel 4); diese Funktionen
 * lenken seinen Blick dorthin, wo die Fehler erfahrungsgemaess sitzen.
 *
 * Alles hier sind HINWEISE, keine Urteile. Die Heuristiken sind bewusst grob: lieber
 * ein Treffer zu viel zum Nachsehen als ein stiller Fehler. Sie blockieren nichts.
 */
import matter from 'gray-matter'

/** Normalisiert „2 - 3", „2–3", „2-3" zu „2–3". */
const bereich = (a, b) => (b ? `${a}–${b}` : `${a}`)

/** Saetze eines Textes (grob, an . ! ? gefolgt von Leerraum). */
function saetze (text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// Aussagen, die nach Fachbehauptung klingen und einen Beleg brauchen (Regel 7).
// Bewusst eng: „Stoff", „Prozent" und „%" kamen in rund der Haelfte aller Bestandsrezepte
// vor (Fettgehalt, Mengen) und haetten die Liste unbrauchbar laut gemacht. Die Marker hier
// stehen fuer Belegpflicht („Studie", „bewiesen") oder fuer Erklaer-Prosa, die der Agent
// gern erfindet („Das ist Physik", Geosmin-Satz im Rote-Bete-Rezept, 05.10.2026).
const BEHAUPTUNG = /\b(Studie|Studien|Physik|bewiesen|nachweislich|wissenschaftlich|erwiesen|Molekül|Moleküle|Enzym|Enzyme|chemisch|hitzebeständig|Geosmin)\b/i

// Zuordnung Hauptprodukt → Vorschlag fuer den Referenz-Schluessel. Nur ein Vorschlag
// zum Gegenpruefen, kein Urteil; die Referenz selbst bleibt data/kerntemperatur-referenz.yaml.
//
// REIHENFOLGE ZAEHLT (erster Treffer gilt): Geflügel/Ente/Gans zuerst (Hähnchenhack gehoert zu
// Geflügel, Mindestwert 72 °C), dann Hack und Wurst, erst danach die Teilstuecke. Vorher stand
// die Rind-Regel vor jeder Wurst-Regel: „Rindsbratwürste" bekamen beef_mr (52–55 °C) statt Hack
// (≥ 70 °C), und die Checkliste im Aussie-Snags-PR (#327, 05.10.2026) haette 72 °C als
// ausserhalb des Korridors erscheinen lassen. Im Bestand betraf es auch Adana-Kebab,
// Boerewors, Koefte, Smash-Burger (beef_mr), Wagyu-Burger (wagyu) und Schweinsbratwurst (pork_juicy).
const REFERENZ_VORSCHLAG = [
  [/ente/i, 'duck_breast'],
  [/gans/i, 'goose_whole'],
  [/h(?:ä|ae)hnchen|chicken|pute|truthahn|gefl(?:ü|ue)gel/i, 'poultry'],
  // Muster wie SICHERHEITS_MUSTER.hackfleisch in scripts/recipe-agent.mjs, plus „snag"
  [/hack|burger|w(?:u|ü|ue)rst|sausage|snag|\blinks\b|[cć]evap|kofta|k(?:ö|oe)fte|frikadell|tsukune/i, 'burger'],
  [/flank/i, 'beef_flank'],
  [/lamm/i, 'lamb_mr'],
  [/wagyu/i, 'wagyu'],
  [/schwein|pork|spareribs/i, 'pork_juicy'],
  [/brisket|short ?ribs/i, 'beef_lowslow'],
  [/steak|rind|ribeye|entrec|filet|roastbeef|tomahawk|porterhouse|t-bone|picanha/i, 'beef_mr'],
]

// Garphasen, an denen Kerntemperaturen haengen. Erkannt am Schritt-Titel oder im Satz.
// Reihenfolge = Prioritaet beim ersten Treffer.
const PHASEN = [
  // bewusst unter dem Zielwert — wird nicht verglichen. Eng gefasst: „das Fleisch zieht sich
  // zusammen" ist kein Ziehwert (stand im Montreal-Rezept im Daempf-Satz).
  ['Ziehwert', /ziehwert|ziehtemperatur|nachzieh|carry|vom (?:grill|feuer|smoker) (?:nehmen|ziehen)|(?:zieh|nimm|nehm)\w*[^.]{0,60}vom (?:grill|feuer|smoker)/i],
  ['Räuchern', /r(?:ä|ae)uch|raucht|smok/i],
  ['Dämpfen', /d(?:ä|ae)mpf|dampf|steam/i],
  ['Wickeln', /wickel|folie|crutch|butcher ?paper/i],
  ['Anbraten', /sear|anbrat|angrill/i],
  // „gemessen VOR dem Ruhen" gehoert zur Garphase davor, nicht zum Ruhen
  ['Ruhen', /(?<!vor dem )\bruh(?:e|en|t)\b|ruhezeit/i],
  ['Grillen', /grill/i],
]
// „Anbraten" steht beim Reverse Sear im selben Satz mit Zieh- UND Endwert (52 | 45 | 58 im
// Bestand): dort ist Verschiedenheit gewollt, ein Vergleich waere Rauschen (11 % Treffer).
const NICHT_VERGLEICHEN = new Set(['Ziehwert', 'Anbraten', 'ohne Zuordnung'])

function phaseVon (text) {
  const treffer = PHASEN.find(([, re]) => re.test(text))
  return treffer ? treffer[0] : null
}

/** „52–55" → [52, 55]; „54" → [54, 54]. */
function spanne (wert) {
  const [a, b] = String(wert).split('–').map(Number)
  return [a, Number.isFinite(b) ? b : a]
}

// Abstand, bis zu dem zwei Werte noch als derselbe Garpunkt gelten (74 vs 75 °C im Bestand).
const TOLERANZ_C = 2

/** Zwei Bereiche, die mehr als TOLERANZ_C auseinanderliegen. */
const ueberschneidungsfrei = (x, y) => {
  const [a, b] = spanne(x)
  const [c, d] = spanne(y)
  return b + TOLERANZ_C < c || d + TOLERANZ_C < a
}

/**
 * Kerntemperaturen nach Garphase getrennt. Hintergrund: Das Montreal-Smoked-Meat-Rezept
 * (05.10.2026) nannte als Ende des Raeucherns einmal 75–80 °C (Schritt) und einmal 70–72 °C
 * (Abschnitt). Eine flache Liste aller Werte zeigt das nicht; erst die Trennung nach Phase.
 * Nur Saetze mit „Kern" zaehlen — sonst kaemen Holzbrett- und Ofentemperaturen dazu.
 * Widerspruch = in derselben Phase zwei Werte OHNE Ueberschneidung (93 und 90–93 sind keiner).
 */
function kernNachPhase (schritte, content) {
  const segmente = []
  for (const s of schritte) {
    segmente.push({
      quelle: `Schritt „${s?.title ?? '?'}"`,
      phase: phaseVon(String(s?.title ?? '')),
      text: `${s?.description ?? ''} ${s?.tip ?? ''}`,
    })
  }
  // Fliesstext in Abschnitte an den Ueberschriften zerlegen
  let titel = 'Einleitung'
  let puffer = []
  const abschnitte = []
  for (const zeile of String(content).split('\n')) {
    const h = zeile.match(/^#{1,6}\s+(.*)$/)
    if (h) { abschnitte.push({ titel, text: puffer.join('\n') }); titel = h[1].trim(); puffer = [] } else puffer.push(zeile)
  }
  abschnitte.push({ titel, text: puffer.join('\n') })
  for (const a of abschnitte) {
    // Ueberschrift mit genau einer Phase („Räuchern und Dämpfen" hat zwei → keine Vorgabe)
    const phasen = PHASEN.filter(([, re]) => re.test(a.titel)).map(([p]) => p)
    segmente.push({ quelle: `Abschnitt „${a.titel}"`, phase: phasen.length === 1 ? phasen[0] : null, text: a.text })
  }

  const gruppen = new Map()
  for (const seg of segmente) {
    for (const satz of saetze(seg.text)) {
      if (!/Kern/i.test(satz)) continue
      const werte = [...satz.matchAll(/(\d{2,3})(?:\s?[–-]\s?(\d{2,3}))?\s?°\s?C/g)]
        .filter((m) => Number(m[1]) >= 40 && Number(m[1]) <= 99)
        .map((m) => bereich(m[1], m[2]))
      if (werte.length === 0) continue
      const phase = phaseVon(satz) ?? seg.phase ?? 'ohne Zuordnung'
      if (!gruppen.has(phase)) gruppen.set(phase, [])
      for (const wert of werte) {
        const liste = gruppen.get(phase)
        if (!liste.some((e) => e.wert === wert)) liste.push({ wert, quelle: seg.quelle })
      }
    }
  }

  return [...gruppen.entries()].map(([phase, werte]) => ({
    phase,
    werte,
    konflikt: !NICHT_VERGLEICHEN.has(phase)
      && werte.some((x, i) => werte.slice(i + 1).some((y) => ueberschneidungsfrei(x.wert, y.wert))),
  }))
}

/**
 * Analysiert ein Rezept-MDX und liefert Befunde zum Gegenpruefen.
 * @param {string} mdx  kompletter Dateiinhalt
 * @param {{referenz?: object}} [opt]  geparste kerntemperatur-referenz.yaml (optional)
 */
export function analysiere (mdx, opt = {}) {
  const { data: fm, content } = matter(mdx)
  const schritte = Array.isArray(fm.steps) ? fm.steps : []
  const volltext = [
    ...schritte.flatMap((s) => [s?.description ?? '', s?.tip ?? '']),
    content,
  ].join('\n')

  const auffaelligkeiten = []

  // 1. Garzeit pro Seite: mehrere verschiedene Angaben im selben Rezept?
  const proSeite = new Set()
  for (const m of volltext.matchAll(/(\d+)(?:\s?[–-]\s?(\d+))?\s*Minuten\s+(?:pro|je)\s+Seite/gi)) {
    proSeite.add(bereich(m[1], m[2]))
  }
  if (proSeite.size > 1) {
    auffaelligkeiten.push(`Garzeit „pro Seite" wird unterschiedlich angegeben: ${[...proSeite].join(' / ')} Min. — Schritt und Fliesstext abgleichen (auch ein Gegenbeispiel wie „keine 5 Minuten pro Seite" loest das aus)`)
  }

  // 2. Kerntemperaturen: alle Angaben im plausiblen Kernbereich sammeln
  const kern = new Set()
  for (const m of volltext.matchAll(/(\d{2,3})(?:\s?[–-]\s?(\d{2,3}))?\s?°\s?C/g)) {
    const von = Number(m[1])
    if (von >= 40 && von <= 99) kern.add(bereich(m[1], m[2]))
  }

  // 2b. Kerntemperaturen nach Garphase; gleiche Phase mit ueberschneidungsfreien Werten = Widerspruch
  const phasen = kernNachPhase(schritte, content)
  for (const p of phasen.filter((x) => x.konflikt)) {
    auffaelligkeiten.push(`Kerntemperatur in der Phase „${p.phase}" uneinheitlich: ${p.werte.map((w) => `${w.wert} °C (${w.quelle})`).join(' ↔ ')} — gemeint ist derselbe Garpunkt?`)
  }

  // 3. Aussagen, die nach Fachbehauptung klingen
  // Ueberschriften ausgenommen: „Warum … die Physik veraendert" steht allein in 46 Bestands-
  // rezepten als Abschnittstitel und ist Stil, keine Behauptung.
  const fliesstext = content.replace(/^#{1,6}\s.*$/gm, '')
  const behauptungen = saetze(fliesstext)
    .filter((s) => BEHAUPTUNG.test(s))
    .slice(0, 6)
    .map((s) => (s.length > 170 ? `${s.slice(0, 167)}…` : s))

  // 4. Bild: nur der Prompt wird angezeigt. Dass der imagePrompt fast immer ein „Not: …"
  // traegt (FLUX kennt keine Negativ-Prompts), ist ein Befund ueber den Agenten-Prompt, kein
  // Einzelfall — als Auffaelligkeit pro Rezept waere es in 86 von 131 Faellen Rauschen.
  const prompt = String(fm.imagePrompt ?? '')

  // 5. seoTitle: Laenge und Markenzusatz (validate() prueft das beim Erzeugen schon)
  const seo = String(fm.seoTitle ?? '')
  if (seo && /\|\s*Steakakademie\s*$/i.test(seo)) {
    auffaelligkeiten.push('seoTitle endet auf „| Steakakademie" — das Layout haengt es selbst an (doppelter Titel)')
  }

  // 6. Status: Agent schreibt published/reviewed vorab
  const vorabFreigabe = fm.status === 'published' && fm.reviewed === true

  // Referenz-Vorschlag
  let referenz = null
  const text = `${fm.meatType ?? ''} ${fm.title ?? ''}`
  const treffer = REFERENZ_VORSCHLAG.find(([re]) => re.test(text))
  if (treffer) {
    const badge = opt.referenz?.badges?.[treffer[1]]
    referenz = badge
      ? { schluessel: treffer[1], c: badge.c, range: badge.range, label: badge.label }
      : { schluessel: treffer[1] }
  }

  // 7. Fleisch-/Fischrezept ohne jede Kerntemperatur im Text (Regel 8c: Genauigkeit)
  if (referenz && kern.size === 0 && ['fleisch', 'fisch'].includes(fm.kategorie)) {
    auffaelligkeiten.push(`Keine Kerntemperatur im Text, obwohl die Referenz \`${referenz.schluessel}\` zugeordnet wurde — Garpunkt angegeben?`)
  }

  return {
    titel: fm.title ?? '',
    kategorie: fm.kategorie ?? '',
    bild: {
      pfad: fm.image ?? '',
      alt: fm.imageAlt ?? '',
      prompt: prompt.length > 220 ? `${prompt.slice(0, 217)}…` : prompt,
      ki: fm.imageAI === true,
    },
    kerntemperaturen: [...kern],
    kernNachPhase: phasen,
    referenz,
    behauptungen,
    auffaelligkeiten,
    vorabFreigabe,
  }
}

/** Markdown-Abschnitt fuer ein Rezept. */
export function rezeptAbschnitt (slug, a) {
  const z = []
  z.push(`### \`${slug}\` — ${a.titel}`)
  if (a.auffaelligkeiten.length) {
    z.push('')
    z.push('**⚠️ Auffälligkeiten (automatisch, bitte ansehen):**')
    for (const f of a.auffaelligkeiten) z.push(`- [ ] ${f}`)
  }
  z.push('')
  z.push('**Zahlen zum Gegenprüfen:**')
  if (a.kerntemperaturen.length) {
    const r = a.referenz
    const ref = r
      ? ` — Referenz-Vorschlag \`${r.schluessel}\`${r.range ? `: ${r.range[0]}–${r.range[1]} °C (Ziel ${r.c}, ${r.label})` : ''}, automatisch zugeordnet`
      : ' — keine Referenz zugeordnet, von Hand in `data/kerntemperatur-referenz.yaml` suchen'
    const phasen = a.kernNachPhase ?? []
    if (phasen.length) {
      z.push(`- Kerntemperaturen nach Phase${ref}:`)
      for (const p of phasen) {
        const werte = p.werte.map((w) => `${w.wert} °C`).join(' ↔ ')
        z.push(`  - [ ] **${p.phase}:** ${werte}${p.konflikt ? ' ⚠️ uneinheitlich' : ''}`)
      }
      // °C-Angaben im Kernbereich, die in keinem „Kern"-Satz stehen (Unterlage, Ofen …)
      const inPhasen = new Set(phasen.flatMap((p) => p.werte.map((w) => w.wert)))
      const uebrig = a.kerntemperaturen.filter((t) => !inPhasen.has(t))
      if (uebrig.length) z.push(`  - Weitere Angaben ohne Kern-Bezug: ${uebrig.map((t) => `${t} °C`).join(', ')}`)
    } else {
      z.push(`- [ ] Kerntemperaturen im Text: ${a.kerntemperaturen.map((t) => `${t} °C`).join(', ')}${ref}`)
    }
  } else {
    z.push('- Keine Kerntemperatur im Text gefunden.')
  }
  if (a.behauptungen.length) {
    z.push('')
    z.push('**Aussagen, die nach Fachbehauptung klingen (Beleg vorhanden?):**')
    for (const b of a.behauptungen) z.push(`- [ ] „${b}"`)
  }
  z.push('')
  z.push('**Hero-Bild:**')
  z.push(`- Datei: \`${a.bild.pfad}\`${a.bild.ki ? ' (KI-generiert)' : ''}`)
  if (a.bild.alt) z.push(`- Soll zeigen: ${a.bild.alt}`)
  z.push('- [ ] Zeigt das Bild genau das (Cut, Garstufe, Anrichtung, nichts Fremdes im Bild)?')
  return z.join('\n')
}

/** Gesamte Checkliste fuer den PR-Text. */
export function checklisteMarkdown (rezepte, { maxZeichen = 20000 } = {}) {
  if (rezepte.length === 0) return ''
  const kopf = [
    '## 🔎 Review-Checkliste (automatisch erzeugt)',
    '',
    'Hinweise aus festen Mustern, **keine Urteile** — sie zeigen, wo bei früheren Agenten-Rezepten Fehler saßen (Garzeit Schritt ↔ Text, unbelegte Fachaussagen, Bild ↔ Text). Quelle: `scripts/lib/rezept-review.mjs`.',
    '',
  ]
  const teile = rezepte.map(({ slug, analyse }) => rezeptAbschnitt(slug, analyse))
  const fuss = [
    '',
    '**Immer offen, nicht automatisch prüfbar:** fal.ai-Tarif und C2PA-Marker beim Bild (`data/bildregister.yaml`), Affiliate-Links, Herkunft des Gerichts. `reviewedAt` setzt Uwe von Hand.',
  ]
  const text = [...kopf, teile.join('\n\n---\n\n'), ...fuss].join('\n')
  return text.length > maxZeichen ? `${text.slice(0, maxZeichen)}\n\n… (gekürzt)` : text
}
