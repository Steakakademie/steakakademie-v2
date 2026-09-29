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
