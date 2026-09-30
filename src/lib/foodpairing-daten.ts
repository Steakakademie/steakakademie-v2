// ═══════════════════════════════════════════════════════════════════════════
// Foodpairing — Build-Zeit-Lader für das eigene Aroma-Dataset (data/foodpairing).
// Nur serverseitig nutzen (node:fs). Die Seite /foodpairing ist statisch; alle
// Zahlen auf ihr kommen aus diesen Dateien — keine hart kodierte Molekül-Zahl kann
// still von den Belegen abweichen (Lehre aus der v1-Demo „Kaffee · 7 Moleküle").
//
// Zählweise identisch mit der RPC match_foodpairing (Migration 20260615):
// geteilte Aromastoffe zweier Zutaten, Partner derselben Kategorie ausgeblendet.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Zutat = { id: string; name: string; kategorie: string };
export type Stoff = { id: string; name: string; note: string | null };
export type Paarung = { a: string; b: string; stoffe: Stoff[] };
export type RadPartner = { name: string; kategorie: string; stoffe: Stoff[] };
export type Rad = { zentrum: string; kategorie: string; partner: RadPartner[] };

/**
 * Geruchsnoten der häufigsten Schlüssel-Aromastoffe — gängige Deskriptoren der
 * Aromaforschung, sprachlich für Grill-Leser übersetzt. Stoffe ohne Eintrag
 * erscheinen nur mit Namen (lieber keine Note als eine geratene).
 */
export const AROMA_NOTE: Record<string, string> = {
  Furaneol: 'karamellig',
  Homofuraneol: 'karamellig',
  Methional: 'Kartoffel/Brühe',
  'β-Damascenon': 'Kochapfel/fruchtig',
  '3-Methylbutanal': 'malzig',
  '2-Methylbutanal': 'malzig',
  '2-Methylpropanal': 'malzig',
  '(E,E)-2,4-Decadienal': 'frittiert/fettig',
  '(E)-2-Nonenal': 'talgig',
  Linalool: 'blumig',
  Dimethyltrisulfid: 'schwefelig/Kohl',
  Dimethylsulfid: 'Kohl/Mais',
  Methanthiol: 'schwefelig',
  Hexanal: 'grasig-grün',
  '(Z)-3-Hexenal': 'frisch-grün',
  '(E)-2-Hexenal': 'grüner Apfel',
  '2-Acetyl-1-pyrrolin': 'röstig/Popcorn',
  '2-Propionyl-1-pyrrolin': 'röstig/Popcorn',
  '2-Acetylthiazolin': 'röstig/Popcorn',
  '2-Ethyl-3,5-dimethylpyrazin': 'röstig/erdig',
  '2,3-Diethyl-5-methylpyrazin': 'röstig/erdig',
  '3-Ethyl-2,5-dimethylpyrazin': 'röstig',
  '2-Isobutyl-3-methoxypyrazin': 'grüne Paprika',
  '2-Isopropyl-3-methoxypyrazin': 'erdig',
  '2-Methyl-3-furanthiol': 'fleischig',
  '2-Furfurylthiol': 'Röstkaffee',
  '1,8-Cineol': 'Eukalyptus',
  '2,3-Butandion': 'butterig',
  Ethylbutanoat: 'fruchtig',
  'Ethyl-2-methylbutanoat': 'fruchtig/Apfel',
  'Ethyl-2-methylpropanoat': 'fruchtig',
  Guaiacol: 'rauchig',
  '4-Methylguaiacol': 'rauchig',
  '4-Vinylguaiacol': 'nelkig-rauchig',
  Eugenol: 'Nelke',
  '(E)-Isoeugenol': 'Nelke',
  Vanillin: 'Vanille',
  Sotolon: 'würzig/Liebstöckel',
  Nonanal: 'wachsig/Zitrus',
  Octanal: 'Zitrusschale',
  Decanal: 'Zitrusschale',
  Heptanal: 'fettig-grün',
  '1-Octen-3-ol': 'pilzig',
  '1-Octen-3-on': 'pilzig',
  Buttersäure: 'käsig',
  '3-Methylbuttersäure': 'käsig',
  Essigsäure: 'säuerlich',
  Phenylacetaldehyd: 'Honig',
  Phenylessigsäure: 'Honig',
  '2-Phenylethanol': 'Rose',
  Geraniol: 'Rose',
  Geranial: 'Zitrone',
  'δ-Decalacton': 'sahnig/Pfirsich',
  'γ-Decalacton': 'Pfirsich',
  'β-Ionon': 'Veilchen',
  Myrcen: 'harzig-krautig',
  'α-Pinen': 'Kiefer',
  'β-Pinen': 'Kiefer',
  'β-Caryophyllen': 'holzig-würzig',
  'trans-4,5-Epoxy-(E)-2-decenal': 'metallisch',
  '(E,Z)-2,6-Nonadienal': 'Gurke',
};

type Daten = {
  zutaten: Map<string, Zutat>; // key: name
  stoffe: Map<string, Stoff>; // key: id
  kanten: Map<string, Set<string>>; // zutat-id → stoff-ids
  studien: number;
};

let cache: Daten | null = null;

function zeilen(datei: string): string[][] {
  return readFileSync(join(process.cwd(), 'data', 'foodpairing', datei), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => l.split('\t'));
}

function daten(): Daten {
  if (cache) return cache;
  const zutaten = new Map<string, Zutat>();
  for (const [id, name, kategorie] of zeilen('ingr_info.tsv')) zutaten.set(name, { id, name, kategorie });
  const stoffe = new Map<string, Stoff>();
  for (const [id, name] of zeilen('comp_info.tsv')) stoffe.set(id, { id, name, note: AROMA_NOTE[name] ?? null });
  const kanten = new Map<string, Set<string>>();
  for (const [zid, sid] of zeilen('ingr_comp.tsv')) {
    if (!kanten.has(zid)) kanten.set(zid, new Set());
    kanten.get(zid)!.add(sid);
  }
  // belege.tsv: Kopfzeile „zutat …" überspringen; Spalte 7 = DOI
  const dois = new Set(
    zeilen('belege.tsv')
      .filter((z) => z[0] !== 'zutat')
      .map((z) => (z[6] ?? '').trim())
      .filter(Boolean),
  );
  cache = { zutaten, stoffe, kanten, studien: dois.size };
  return cache;
}

function zutat(name: string): Zutat {
  const z = daten().zutaten.get(name);
  if (!z) throw new Error(`Foodpairing: Zutat „${name}" fehlt in data/foodpairing/ingr_info.tsv`);
  return z;
}

function geteilt(a: Zutat, b: Zutat): Stoff[] {
  const d = daten();
  const sb = d.kanten.get(b.id) ?? new Set<string>();
  return [...(d.kanten.get(a.id) ?? [])]
    .filter((s) => sb.has(s))
    .map((s) => d.stoffe.get(s)!)
    .sort((x, y) => Number(!!y.note) - Number(!!x.note) || x.name.localeCompare(y.name, 'de'));
}

export function istImDatensatz(name: string): boolean {
  return daten().zutaten.has(name);
}

/** Geteilte Schlüssel-Aromastoffe zweier Zutaten (wirft, wenn eine fehlt). */
export function paarung(a: string, b: string): Paarung {
  return { a, b, stoffe: geteilt(zutat(a), zutat(b)) };
}

/** Aroma-Rad: die stärksten Partner einer Zutat, fremde Kategorien, absteigend. */
export function rad(zentrum: string, max = 12): Rad {
  const z = zutat(zentrum);
  const partner: RadPartner[] = [];
  daten().zutaten.forEach((p) => {
    if (p.name === z.name || p.kategorie === z.kategorie) return;
    const stoffe = geteilt(z, p);
    if (stoffe.length) partner.push({ name: p.name, kategorie: p.kategorie, stoffe });
  });
  partner.sort((x, y) => y.stoffe.length - x.stoffe.length || x.name.localeCompare(y.name, 'de'));
  return { zentrum: z.name, kategorie: z.kategorie, partner: partner.slice(0, max) };
}

export function statistik() {
  const d = daten();
  let kanten = 0;
  const genutzt = new Set<string>();
  d.kanten.forEach((s) => {
    kanten += s.size;
    s.forEach((x) => genutzt.add(x));
  });
  return { zutaten: d.zutaten.size, stoffe: genutzt.size, kanten, studien: d.studien };
}

/** „a, b und c" — für Fließtext. */
export function aufzaehlen(teile: string[]): string {
  return teile.length < 2 ? teile.join('') : `${teile.slice(0, -1).join(', ')} und ${teile[teile.length - 1]}`;
}
