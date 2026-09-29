/**
 * Foodpairing — Eingabe-Aliase (v2, 28.09.2026)
 *
 * Die Aroma-Datenbank führt jede Zutat genau EINMAL (data/foodpairing/ingr_info.tsv).
 * v1 hatte „Rind", „Ribeye" und „Steak" als drei Zutaten mit identischen Stoffen —
 * Folge: Bei „Hähnchen" waren die drei besten Partner Ribeye, Rind und Schwein,
 * also zweimal dasselbe. Deshalb leben Synonyme hier und nicht als Datenbank-Zeilen.
 *
 * Regel: Ein Alias zeigt nur auf eine Zutat, deren Belege den Alias sachlich decken
 * (Ribeye = gebratenes Rind ✓). Keine Aliase „auf gut Glück".
 */

const ALIASE: Record<string, string> = {
  // Rind (Belege: gebraten, Steak auf heißer Platte, Schmorsaft)
  ribeye: 'Rind', steak: 'Rind', rindfleisch: 'Rind', entrecote: 'Rind', rumpsteak: 'Rind',
  filet: 'Rind', rinderfilet: 'Rind', huftsteak: 'Rind', 'tomahawk': 'Rind', 't-bone': 'Rind',
  // Schwein
  schweinefleisch: 'Schwein', schweinebauch: 'Schwein', schweinenacken: 'Schwein', kotelett: 'Schwein',
  // Lamm
  lammfleisch: 'Lamm', lammkarree: 'Lamm', lammkeule: 'Lamm',
  // Geflügel
  huhn: 'Hähnchen', huhnchen: 'Hähnchen', hahnchenbrust: 'Hähnchen', chicken: 'Hähnchen',
  // Speck
  bacon: 'Speck', raucherspeck: 'Speck',
  // Meer
  garnelen: 'Garnele', shrimps: 'Garnele', shrimp: 'Garnele', scampi: 'Garnele',
  // Käse
  gorgonzola: 'Blauschimmelkäse', roquefort: 'Blauschimmelkäse', parmigiano: 'Parmesan', 'parmigiano reggiano': 'Parmesan',
  // Gemüse, Pilze
  champignons: 'Champignon', tomaten: 'Tomate', pommes: 'Kartoffel', 'pommes frites': 'Kartoffel',
  kartoffeln: 'Kartoffel', 'gebratene zwiebel': 'Röstzwiebel', zwiebeln: 'Zwiebel', paprikaschote: 'Paprika',
  'schwarzer truffel': 'Trüffel',
  'black garlic': 'Schwarzer Knoblauch', schwarzknoblauch: 'Schwarzer Knoblauch', 'fermentierter knoblauch': 'Schwarzer Knoblauch',
  // Kräuter, Gewürze
  minze: 'Grüne Minze', koriander: 'Koriandergrün', 'schwarzer pfeffer': 'Pfeffer', pfefferkorner: 'Pfeffer',
  gewurznelke: 'Nelke', 'paprika edelsuss': 'Paprikapulver', 'paprikapulver edelsuss': 'Paprikapulver', nelken: 'Nelke', senf: 'Senfsaat', lorbeerblatt: 'Lorbeer',
  // Getränke, Würzen, Süßes
  scotch: 'Whisky', whiskey: 'Whisky', schokolade: 'Kakao', 'dunkle schokolade': 'Kakao',
  'balsamico-essig': 'Balsamico', balsamessig: 'Balsamico', 'aceto balsamico': 'Balsamico', 'soja-sauce': 'Sojasauce',
  // Obst
  feige: 'Feige (getrocknet)', feigen: 'Feige (getrocknet)', erdbeeren: 'Erdbeere', kirschen: 'Kirsche',
  himbeeren: 'Himbeere',
};

/** Kleinschreibung, Umlaute/Akzente weg, Leerraum vereinheitlicht — nur für den Alias-Vergleich. */
function schluessel(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Liefert den Datenbanknamen zur Eingabe; unbekannte Eingaben unverändert (getrimmt). */
export function foodpairingZutat(eingabe: string): string {
  const s = eingabe.trim();
  return ALIASE[schluessel(s)] ?? s;
}
