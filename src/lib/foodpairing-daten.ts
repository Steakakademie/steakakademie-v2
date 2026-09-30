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
/** Verwandte Note: dieselbe Duftfamilie, aber verschiedene Moleküle auf beiden Seiten. */
export type Verwandt = { familie: string; a: string[]; b: string[] };
export type Paarung = { a: string; b: string; stoffe: Stoff[]; verwandt: Verwandt[] };
export type RadPartner = { name: string; kategorie: string; stoffe: Stoff[]; verwandt: Verwandt[] };
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
  '2-Acetyltetrahydropyridin': 'röstig/Cracker',
  '2-Methyl-3-propylpyrazin': 'röstig',
  '12-Methyltridecanal': 'talgig/rindtypisch',
  'γ-Octalacton': 'kokosartig',
  Mesifuran: 'karamellig',
};

/**
 * Duftfamilien für „verwandte Noten" — bewusst ENG gefasst: nur Stoffklassen, deren
 * Vertreter ähnlich riechen und in der Aromaforschung gemeinsam beschrieben werden
 * (z. B. Röstnote: Alkylpyrazine, Acetylpyrrolin, Acetylthiazolin — alle aus der
 * Maillard-Reaktion). Breite, uneinheitliche Klassen (Schwefelstoffe, Methoxypyrazine,
 * Terpene quer durch) zählen NICHT, sonst wäre am Ende alles „verwandt".
 * Reihenfolge zählt: die erste passende Regel gewinnt.
 */
export const DUFTFAMILIEN: { familie: string; muster: RegExp }[] = [
  { familie: 'röstig', muster: /^(?![\s\S]*[Mm]ethoxy)[\s\S]*pyrazin|pyrrolin|thiazolin|tetrahydropyridin|Furfurylthiol/ },
  { familie: 'Vanille', muster: /Vanill/ },
  { familie: 'rauchig', muster: /guaiacol|Guaiacol/ },
  { familie: 'karamellig', muster: /^Furaneol$|^Homofuraneol$|^Mesifuran$|^Sotolon$/ },
  { familie: 'Honig', muster: /^Phenylacetaldehyd$|^Phenylessigsäure$/ },
  { familie: 'käsig', muster: /^Buttersäure$|^2-Methylbuttersäure$|^3-Methylbuttersäure$/ },
  { familie: 'fruchtig (Ester)', muster: /^(Ethyl|Methyl)[\w-]*oat$/ },
  { familie: 'sahnig-fruchtig (Lacton)', muster: /lacton$/ },
  { familie: 'malzig', muster: /^[23]-Methylbutanal$|^2-Methylpropanal$/ },
  { familie: 'grasig-grün', muster: /^Hexanal$|Hexenal$/ },
  { familie: 'fettig', muster: /dienal$|-2-Nonenal$|-2-Decenal$|Methyltridecanal/ },
  { familie: 'pilzig', muster: /^1-Octen-3-o[ln]$/ },
  { familie: 'butterig', muster: /^2,3-Butandion$|^2,3-Pentandion$/ },
  { familie: 'zitrusartig', muster: /^(Octanal|Nonanal|Decanal|Geranial|Neral|Limonen|Citronellal)$/ },
];

export function duftfamilie(stoff: string): string | null {
  return DUFTFAMILIEN.find((f) => f.muster.test(stoff))?.familie ?? null;
}

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

function familien(z: Zutat): Map<string, string[]> {
  const d = daten();
  const m = new Map<string, string[]>();
  (d.kanten.get(z.id) ?? new Set<string>()).forEach((sid) => {
    const name = d.stoffe.get(sid)!.name;
    const f = duftfamilie(name);
    if (f) m.set(f, [...(m.get(f) ?? []), name].sort((x, y) => x.localeCompare(y, 'de')));
  });
  return m;
}

/** Familien, die beide tragen — ohne jene, die schon ein gemeinsames Molekül abdeckt. */
function verwandt(a: Zutat, b: Zutat, gleich: Stoff[]): Verwandt[] {
  const schon = new Set(gleich.map((s) => duftfamilie(s.name)).filter(Boolean));
  const fa = familien(a);
  const fb = familien(b);
  const out: Verwandt[] = [];
  fa.forEach((stoffeA, familie) => {
    const stoffeB = fb.get(familie);
    if (stoffeB && !schon.has(familie)) out.push({ familie, a: stoffeA, b: stoffeB });
  });
  return out.sort((x, y) => x.familie.localeCompare(y.familie, 'de'));
}

export function istImDatensatz(name: string): boolean {
  return daten().zutaten.has(name);
}

/** Geteilte Schlüssel-Aromastoffe zweier Zutaten (wirft, wenn eine fehlt). */
export function paarung(a: string, b: string): Paarung {
  const za = zutat(a);
  const zb = zutat(b);
  const stoffe = geteilt(za, zb);
  return { a, b, stoffe, verwandt: verwandt(za, zb, stoffe) };
}

/** Aroma-Rad: die stärksten Partner einer Zutat, fremde Kategorien, absteigend. */
export function rad(zentrum: string, max = 12): Rad {
  const z = zutat(zentrum);
  const partner: RadPartner[] = [];
  daten().zutaten.forEach((p) => {
    if (p.name === z.name || p.kategorie === z.kategorie) return;
    const stoffe = geteilt(z, p);
    if (stoffe.length) partner.push({ name: p.name, kategorie: p.kategorie, stoffe, verwandt: verwandt(z, p, stoffe) });
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

export type Urteil = 'Starke Brücke' | 'Brücke' | 'Schwache Brücke' | 'Keine Brücke';

/**
 * Aroma-Urteil aus beiden Ebenen: gleiche Moleküle zählen voll, verwandte Noten halb.
 * ≥3 → stark, ≥2 → Brücke, >0 → schwach. Kontrast (Geschmack, Textur) ist eine
 * eigene, redaktionelle Ebene und fließt hier bewusst nicht ein.
 */
export function aromaUrteil(p: Pick<Paarung, 'stoffe' | 'verwandt'>): Urteil {
  const punkte = p.stoffe.length + p.verwandt.length * 0.5;
  if (punkte >= 3) return 'Starke Brücke';
  if (punkte >= 2) return 'Brücke';
  if (punkte > 0) return 'Schwache Brücke';
  return 'Keine Brücke';
}
