#!/usr/bin/env node
/**
 * Pinterest-Pins aus den Rezepten planen (20.10.2026).
 *
 * Liest content/rezepte/*.mdx, ordnet jedes Rezept einer Pinnwand zu und baut je Pin:
 * Titel, Beschreibung, Rezeptlink (mit UTM) und die Hochformat-Grafik von /api/og/pin.
 * Geplant/veröffentlicht wird NICHT hier, sondern über Metricool (Claude-Connector) —
 * das Skript liefert nur die nächsten Pins und führt Buch, welche schon eingeplant sind.
 *
 * AUFRUF:  node scripts/pinterest/pins.mjs                       → Übersicht je Pinnwand
 *          node scripts/pinterest/pins.mjs --naechste 7          → nächste 7 Pins als JSON
 *          node scripts/pinterest/pins.mjs --erledigt <slug>[,<slug>…] [--post <id>]
 * STATUS:  privat/pinterest/status.json (gitignored) — { slug: { geplantAm, postId } }
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import yaml from 'js-yaml';

export const WEBSITE = 'https://steakakademie.de';
export const PINNWAENDE = [
  'Rind vom Grill',
  'Low & Slow BBQ',
  'Schwein & Iberico',
  'Geflügel vom Grill',
  'Lamm vom Grill',
  'Fisch vom Grill',
  'Beilagen, Saucen & Rubs',
];

const wurzel = () => process.env.SA_WURZEL ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Frontmatter eines MDX-Texts als Objekt (leer, wenn keins da ist). */
export function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return m ? yaml.load(m[1]) ?? {} : {};
}

/** Pinnwand für ein Rezept — null, wenn es nicht auf Pinterest gehört. */
export function pinnwand(fm) {
  const kat = fm.kategorie;
  if (kat === 'fisch') return 'Fisch vom Grill';
  if (['beilagen', 'saucen-rubs', 'desserts'].includes(kat)) return 'Beilagen, Saucen & Rubs';
  if (kat !== 'fleisch') return null;
  const methode = String(fm.cookingMethod ?? '');
  const fleisch = String(fm.meatType ?? '');
  if (/low|smok|räucher|rauch|langsam|3-2-1/i.test(methode)) return 'Low & Slow BBQ';
  if (/hähnchen|huhn|pute|ente|geflügel|chicken|yakitori/i.test(fleisch)) return 'Geflügel vom Grill';
  if (/^lamm/i.test(fleisch)) return 'Lamm vom Grill';
  if (/schwein|iberico|secreto|pluma|presa|spareribs|bacon|bauch/i.test(fleisch)) return 'Schwein & Iberico';
  return 'Rind vom Grill';
}

/** ISO-Dauer (PT150M, PT2H30M) → „2½ Std.“ bzw. „45 Min.“ */
export function zeit(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(String(iso ?? ''));
  if (!m) return null;
  const min = Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
  if (!min) return null;
  if (min < 60) return `${min} Min.`;
  if (min >= 600) return 'über Nacht'; // Marinier-/Pökelzeit steckt in totalTime
  const halbe = Math.round(min / 30) / 2;
  const ganz = Math.floor(halbe);
  return `${ganz || ''}${halbe % 1 ? '½' : ''} Std.`;
}

/** „Asado de Tira – Argentinische Rinder-Rippen …“ → ['Asado de Tira', 'Argentinische Rinder-Rippen …'] */
export function titelTeile(titel) {
  const i = titel.search(/\s[–—|-]\s/);
  if (i <= 0) return [titel.trim(), null];
  const rest = titel.slice(i + 3).trim();
  return [titel.slice(0, i).trim(), rest.charAt(0).toUpperCase() + rest.slice(1)];
}

/**
 * Bis die Kerntemperatur-Referenz geklärt ist (docs/youtube-anbindung.md, „Offen“), werden Rezepte
 * mit bekanntem Widerspruch nicht beworben — und Pin-Texte enthalten keine °C-Angaben.
 */
export const GESPERRT = [
  'lammkoteletts-mediterran', 'lammkarree-grillen', 'lammkeule-drehspiess', 'krustenbraten-grill', 'ente-vom-grill',
  'iberico-secreto', 'iberico-pluma', 'schwertfisch-steak-grill', 'thunfisch-steak-grill',
];

/** Sätze mit Temperaturangaben entfernen (Kerntemperaturen gehören nur auf die Rezeptseite). */
export function ohneTemperaturen(text) {
  return String(text ?? '')
    .split(/(?<=[.!?])\s+/)
    .filter((satz) => !/\d\s*°\s*C/i.test(satz) && !/kerntemperatur/i.test(satz))
    .join(' ')
    .trim();
}

const kuerze = (text, max) => (text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text);

/** Kompletter Pin für Metricool aus Frontmatter + Slug. */
export function pin(fm, slug) {
  const brett = pinnwand(fm);
  if (!brett || !fm.title || !fm.image || GESPERRT.includes(slug)) return null;
  const [kopf, rest] = titelTeile(fm.title);
  const land = String(fm.land ?? '').split('·')[0].trim();
  const meta = [land, fm.difficulty, zeit(fm.totalTime)].filter(Boolean).join(' · ');
  const q = new URLSearchParams({ img: fm.image, title: kopf });
  if (rest) q.set('sub', rest);
  if (meta) q.set('meta', meta);
  if (fm.imageAI) q.set('ki', '1');
  const stichworte = (fm.keywords ?? []).filter((k) => !/kerntemperatur|°\s*C/i.test(k)).slice(0, 5).join(' · ');
  const beschreibung = kuerze(
    [ohneTemperaturen(fm.description), 'Rezept mit Zutatenliste, Schritt-für-Schritt-Anleitung und Profi-Tipps auf steakakademie.de.', stichworte, fm.imageAI ? 'Bild KI-generiert.' : '']
      .filter(Boolean)
      .join('\n\n'),
    500,
  );
  return {
    slug,
    pinnwand: brett,
    titel: kuerze(fm.title, 100),
    beschreibung,
    link: `${WEBSITE}/rezepte/${fm.kategorie}/${slug}?utm_source=pinterest&utm_medium=social&utm_campaign=rezept-pins`,
    bild: `${WEBSITE}/api/og/pin?${q.toString()}`,
    alt: kuerze(String(fm.imageAlt ?? kopf), 500),
    ki: Boolean(fm.imageAI),
  };
}

/**
 * Klassiker mit hohem Suchvolumen in DACH zuerst (Uwe-Freigabe 20.10.2026) — der erste Eindruck
 * einer Pinnwand entscheidet, ob Leute folgen. Reihenfolge innerhalb der Liste = Priorität.
 */
export const ZUERST = [
  'picanha-churrasco', 'dry-aged-ribeye', 'tomahawk-reverse-sear', 'smash-burger', 'entrecote-grillen', 'flank-steak-grillen', 'roastbeef-reverse-sear',
  'pulled-pork-boston-butt', 'spareribs-3-2-1', 'brisket-low-slow', 'burnt-ends', 'beef-short-ribs', 'pulled-chicken',
  'iberico-secreto', 'krustenbraten-grill', 'iberico-pluma', 'iberico-presa', 'schweinekarree-honig-rosmarin',
  'spatchcock-haehnchen', 'beer-can-chicken', 'ente-vom-grill', 'haehnchenschenkel-bier-senf-glasur',
  'lammkarree-grillen', 'lammkoteletts-mediterran', 'lammkeule-drehspiess', 'aussie-lamb-leg-butterflied',
  'cedar-plank-lachs', 'ganze-dorade-grill', 'thunfisch-steak-grill', 'australische-riesengarnelen-barbie', 'sardinen-vom-grill',
  'faecherkartoffeln-grill', 'maiskolben-elote', 'texas-dry-rub', 'kansas-city-bbq-sauce', 'provoleta-parrilla', 'gemuese-spiesse-grill', 'chili-kraeuterbutter',
];

/** Reihenfolge: reihum über die Pinnwände, damit jede gleichmäßig wächst; innerhalb erst ZUERST, dann neueste. */
export function reihum(pins) {
  const nachBrett = new Map(PINNWAENDE.map((b) => [b, []]));
  for (const p of pins) nachBrett.get(p.pinnwand)?.push(p);
  const rang = (slug) => { const i = ZUERST.indexOf(slug); return i < 0 ? Infinity : i; };
  for (const liste of nachBrett.values()) liste.sort((a, b) => rang(a.slug) - rang(b.slug) || String(b.datum ?? '').localeCompare(String(a.datum ?? '')));
  const aus = [];
  for (let runde = 0; aus.length < pins.length; runde++) {
    for (const liste of nachBrett.values()) if (liste[runde]) aus.push(liste[runde]);
    if (runde > pins.length) break;
  }
  return aus;
}

function alleRezepte() {
  const ordner = join(wurzel(), 'content', 'rezepte');
  return readdirSync(ordner)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const fm = frontmatter(readFileSync(join(ordner, f), 'utf8'));
      if (fm.status && fm.status !== 'published') return null;
      const p = pin(fm, f.replace(/\.mdx$/, ''));
      return p && { ...p, datum: fm.publishedAt };
    })
    .filter(Boolean);
}

function main() {
  const args = process.argv.slice(2);
  const wert = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
  const statusDatei = join(wurzel(), 'privat', 'pinterest', 'status.json');
  const status = existsSync(statusDatei) ? JSON.parse(readFileSync(statusDatei, 'utf8')) : {};

  if (wert('erledigt')) {
    for (const slug of wert('erledigt').split(',')) status[slug.trim()] = { geplantAm: new Date().toISOString(), postId: wert('post') ?? null };
    mkdirSync(dirname(statusDatei), { recursive: true });
    writeFileSync(statusDatei, JSON.stringify(status, null, 1));
    console.log(`${Object.keys(status).length} Pins als eingeplant vermerkt.`);
    return;
  }

  const offen = reihum(alleRezepte()).filter((p) => !status[p.slug]);
  if (wert('naechste')) {
    console.log(JSON.stringify(offen.slice(0, Number(wert('naechste'))).map(({ datum, ...p }) => p), null, 1));
    return;
  }
  const zaehler = Object.fromEntries(PINNWAENDE.map((b) => [b, 0]));
  for (const p of offen) zaehler[p.pinnwand]++;
  console.log(`${offen.length} Rezepte noch ohne Pin (${Object.keys(status).length} eingeplant):`);
  for (const [b, n] of Object.entries(zaehler)) console.log(`  ${b}: ${n}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
