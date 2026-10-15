// Beschaffbarkeit von Zutaten (CLAUDE.md, Regel 11 — Gaumen-Regel, 29.09.2026).
//
// Anlass: Die zuletzt erzeugten Rezepte verlangten Bananenblatt, Betelblatt, Rochen,
// Snoek und Ähnliches — für deutsche Griller kaum zu bekommen. Diese Liste nennt, was
// es im normalen deutschen Handel (Supermarkt, Metzger, Wochenmarkt) NICHT gibt.
//
// Ein Treffer verbietet die Küche nicht, sondern verlangt den Ersatz: Backpapier statt
// Bananenblatt, Briketts statt Binchotan, Makrele statt Snoek. Genutzt von
// scripts/recipe-agent.mjs (validate) und scripts/recipe-seeds.mjs (Seed-Prüfung).
// Neue Fälle hier eintragen, nicht in den Prompts.

export const SCHWER_ERHAELTLICH = [
  /binchotan/i, /bananenbl(?:a|ä|ae)tt[\wäöüß]*/i, /betelbl(?:a|ä|ae)tt[\wäöüß]*|\bla lot\b/i, /pandan/i,
  /kaffir/i, /galgant/i, /shiso/i, /yuzu/i, /\brochen[\wäöüß]*/i, /k(?:ä|ae)nguru/i, /\bsnoek[\wäöüß]*/i,
  /(?:schweine|lamm|kalbs)netz|netzfett/i, /garnelenpaste|shrimp ?paste|belacan|terasi/i,
  /achiote|annatto/i, /aji amarillo|ají amarillo/i, /dend(?:ê|e)|palm(?:ö|oe)l/i,
  /fermentierte? (?:reis)?wurst/i,
  // Regionale Würste, die es in Deutschland nicht zu kaufen gibt (Uwe, 15.10.2026, Anlass
  // PR #406 „Texas Hot Links"). Als gekaufte Zutat oder Hauptprodukt gesperrt — erlaubt nur
  // als Selbstmach-Rezept, und dann steht das im Titel (siehe hauptproduktFehler unten).
  /\bhot[- ]?links?\b/i, /texas[- ]?(?:wurst|w(?:ü|ue)rst|sausage)|texanische[nrs]? w(?:ü|ue)rst/i,
  /andouille/i, /\bboudin/i, /boerewors/i, /lingui(?:ç|c)a/i, /\bsai ua\b/i, /lap ?cheong/i,
  /(?:argentinische|chorizo) (?:chorizo|criollo|parrillero)|chorizo argentino/i,
]

/** Schwer erhältliche Begriffe in einem Text (eindeutig, kleingeschrieben). */
export function schwerImText (text = '') {
  const treffer = new Set()
  for (const muster of SCHWER_ERHAELTLICH) {
    const m = String(text).match(muster)
    if (m) treffer.add(m[0].toLowerCase())
  }
  return [...treffer]
}

/** Schwer erhältliche Zutaten einer geparsten Zutatenliste ({ name, note }). */
export function schwerErhaeltlich (zutaten = []) {
  const treffer = new Set()
  for (const z of zutaten) {
    for (const t of schwerImText(`${z?.name ?? ''} ${z?.note ?? ''}`)) treffer.add(t)
  }
  return [...treffer]
}

// Selbstmach-Rezepte (Uwe, 15.10.2026): Wurst, Bacon, Pastrami, Schinken entstehen erst in
// der Küche. Das muss der Titel sagen — sonst sucht der Leser die Wurst im Laden (Anlass:
// #406 hiess „Hot Links Texas – Geräucherte Schweine-Rind-Würstchen" und war ein Wurst-Rezept).
export const SELBST_IM_TITEL = /selbst ?(?:gemacht|wursten|machen|r(?:ä|ae)uchern|p(?:ö|oe)keln|beizen)|selber ?machen|hausgemacht/i

const SELBSTMACH_ZEICHEN = [
  /fleischwolf/i, /wurstf(?:ü|ue)ller|wurstspritze/i,
  /(?:natur|kunst|kollagen|saitling|schweine|rinder|schafs?)darm/i, /nitritp(?:ö|oe)kelsalz|p(?:ö|oe)kelsalz|curing salt|prague powder/i,
]

/** Ist das ein Rezept, dessen Hauptprodukt selbst hergestellt wird (Wurst, Gepökeltes)? */
export function istSelbstmachRezept ({ equipment = [], ingredients = [] } = {}) {
  const text = [...equipment, ...ingredients.map(z => `${z?.name ?? ''}`)].join(' ')
  return SELBSTMACH_ZEICHEN.some(m => m.test(text))
}

/**
 * Fehler zum Hauptprodukt eines Rezepts (Titel). Gesperrte Regionalwurst ist nur als
 * Selbstmach-Rezept erlaubt; jedes Selbstmach-Rezept sagt das im Titel.
 */
export function hauptproduktFehler ({ title = '', equipment = [], ingredients = [] } = {}) {
  const fehler = []
  const selbstTitel = SELBST_IM_TITEL.test(title)
  const schwer = schwerImText(title)
  if (schwer.length && !selbstTitel) fehler.push(`Hauptprodukt in Deutschland nicht zu kaufen: ${schwer.join(', ')} — nur als Selbstmach-Rezept mit „selbst wursten/selbst gemacht" im Titel`)
  else if (!selbstTitel && istSelbstmachRezept({ equipment, ingredients })) fehler.push('Selbstmach-Rezept (Fleischwolf, Darm oder Pökelsalz) ohne Hinweis im Titel — „selbst wursten", „selbst gemacht" o. ä. gehört in TITLE')
  return fehler
}
