#!/usr/bin/env node
/**
 * Wochenstapel Social Media (21.10.2026) — ein Stapel pro Woche, eine Freigabe am Montag.
 *
 * Baut aus den Rezepten (content/rezepte) und optional fertigen Kurzvideos den Plan für eine Woche:
 *   Pinterest  7 Pins      täglich 12:00          (Logik und Texte aus scripts/pinterest/pins.mjs)
 *   Facebook   3 Linkposts Di · Do · Sa 18:30     (Vorschaukarte kommt aus og:image der Rezeptseite)
 *   Instagram  3 Bildposts Mi · Fr · So 18:30     (Rezeptbild, „Link in der Bio“)
 *   Videos     je Video Instagram-Reel + TikTok   Di · Do · Sa 12:30 (nur wenn ein Video-Manifest übergeben wird)
 *
 * Veröffentlicht wird NICHT hier. Der Stapel geht als Entwurf nach Metricool (Claude-Connector),
 * öffentlich erst nach Uwes Freigabe (ein Klick pro Woche). Doku: docs/social-wochenstapel.md
 *
 * AUFRUF:  node scripts/social/wochenstapel.mjs --start 2026-10-27 [--verlauf verlauf.json] [--videos videos.json]
 *          node scripts/social/wochenstapel.mjs --pruefen stapel.json   (fertigen Stapel gegen die Regeln prüfen)
 *          verlauf.json: { "pinterest": [slug…], "facebook": [slug…], "instagram": [slug…], "video": [id…] }
 *          videos.json:  [{ "id", "url", "titel", "instagram", "tiktok", "ki": true }]
 * AUSGABE: JSON auf stdout — { kw, start, posts: [{ kanal, typ, datum, slug|id, text, … }] }
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GESPERRT, WEBSITE, ZUERST, frontmatter, ohneTemperaturen, pin, reihum, titelTeile } from '../pinterest/pins.mjs';

const wurzel = () => process.env.SA_WURZEL ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** ISO-Kalenderwoche eines Datums (YYYY-MM-DD). */
export function kalenderwoche(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  const tag = (d.getUTCDay() + 6) % 7; // Mo = 0
  d.setUTCDate(d.getUTCDate() - tag + 3);
  const erster = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d - erster) / 864e5 - 3 + ((erster.getUTCDay() + 6) % 7)) / 7);
}

/** Datum + n Tage als YYYY-MM-DD. */
export function plusTage(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const EINSTIEG = {
  fleisch: (k) => `🔥 Heute auf dem Rost: ${k}`,
  fisch: (k) => `🌊 Fisch vom Grill: ${k}`,
  beilagen: (k) => `🥔 Die Beilage, die allen schmeckt: ${k}`,
  'saucen-rubs': (k) => `🧂 Selbst gemacht schmeckt's besser: ${k}`,
  desserts: (k) => `🍑 Süßes vom Grill: ${k}`,
};

/** Hashtags für DACH-Hobbygriller: Basis + Thema. Höchstens 8 (Instagram belohnt wenige, passende). */
export function hashtags(fm) {
  const basis = ['#grillen', '#bbq', '#grillrezepte'];
  const t = [];
  const fleisch = String(fm.meatType ?? '').toLowerCase();
  const methode = String(fm.cookingMethod ?? '').toLowerCase();
  if (fm.kategorie === 'fisch') t.push('#fischvomgrill');
  if (fm.kategorie === 'beilagen') t.push('#grillbeilagen');
  if (fm.kategorie === 'saucen-rubs') t.push('#bbqsauce', '#rub');
  if (fm.kategorie === 'desserts') t.push('#grilldessert');
  if (/low|smok|räucher|3-2-1/.test(methode)) t.push('#lowandslow', '#smoker');
  if (/hähnchen|huhn|pute|ente|chicken/.test(fleisch)) t.push('#hähnchen');
  else if (/lamm/.test(fleisch)) t.push('#lamm');
  else if (/schwein|iberico|spareribs|bauch|secreto|pluma|presa/.test(fleisch)) t.push('#schwein');
  else if (/burger|hack|köfte|kebab|frikadell|patty/i.test(`${fm.title} ${fleisch}`)) t.push('#burger', '#hackfleisch');
  else if (fm.kategorie === 'fleisch') t.push('#rindfleisch', '#steak');
  return [...basis, ...t, '#steakakademie'].slice(0, 8).join(' ');
}

const KI_SATZ = 'Bild KI-generiert.';
const utm = (quelle, kw) => `utm_source=${quelle}&utm_medium=social&utm_campaign=wochenstapel-kw${kw}`;

/** Facebook-Linkpost aus Frontmatter. Keine °C, KI-Satz bei KI-Bild, Link mit UTM. */
export function facebookPost(fm, slug, kw) {
  const [kopf] = titelTeile(fm.title);
  const einstieg = (EINSTIEG[fm.kategorie] ?? EINSTIEG.fleisch)(kopf);
  const link = `${WEBSITE}/rezepte/${fm.kategorie}/${slug}?${utm('facebook', kw)}`;
  const text = [einstieg, ohneTemperaturen(fm.description), `👉 Zum Rezept mit Zutatenliste und Schritt-für-Schritt-Anleitung: ${link}`,
    hashtags(fm), fm.imageAI ? KI_SATZ : ''].filter(Boolean).join('\n\n');
  return { kanal: 'facebook', typ: 'POST', slug, text, link, ki: Boolean(fm.imageAI) };
}

/** Instagram-Bildpost: Rezeptbild, kein Link im Text (Instagram verlinkt nicht), Verweis auf die Bio. */
export function instagramPost(fm, slug) {
  const [kopf] = titelTeile(fm.title);
  const einstieg = (EINSTIEG[fm.kategorie] ?? EINSTIEG.fleisch)(kopf);
  const text = [einstieg, ohneTemperaturen(fm.description), 'Rezept mit Zutatenliste und Schritt-für-Schritt-Anleitung: Link in der Bio 👆',
    hashtags(fm), fm.imageAI ? KI_SATZ : ''].filter(Boolean).join('\n\n');
  return { kanal: 'instagram', typ: 'POST', slug, text, bild: `${WEBSITE}${fm.image}`, alt: String(fm.imageAlt ?? kopf), ki: Boolean(fm.imageAI) };
}

/** Prüft einen fertigen Post gegen die Social-Regeln (docs/social-wochenstapel.md). Liefert Fehlerliste. */
export function pruefe(p) {
  const f = [];
  const text = String(p.text ?? '');
  if (p.kanal !== 'video' && /\d\s*°\s*C/i.test(text) && !p.referenzwerte) f.push('°C-Angabe ohne Referenzbindung');
  if (p.ki && !/KI-generiert|KI-Stimme|KI-Unterstützung/i.test(text)) f.push('KI-Hinweis fehlt');
  if (p.kanal === 'facebook' && !/utm_source=facebook/.test(text)) f.push('UTM fehlt');
  if (/mtr\.cool/.test(text)) f.push('Kurzlink statt Direktlink');
  if (p.kanal === 'instagram' && text.length > 2200) f.push('Instagram-Text zu lang');
  if (p.kanal === 'pinterest' && text.length > 500) f.push('Pin-Text zu lang');
  return f;
}

function rezepte() {
  const ordner = join(wurzel(), 'content', 'rezepte');
  return readdirSync(ordner)
    .filter((d) => d.endsWith('.mdx'))
    .map((d) => ({ slug: d.replace(/\.mdx$/, ''), fm: frontmatter(readFileSync(join(ordner, d), 'utf8')) }))
    .filter(({ slug, fm }) => (!fm.status || fm.status === 'published') && fm.title && fm.image && fm.kategorie && fm.kategorie !== 'wine-spirits' && !GESPERRT.includes(slug));
}

/** Reihenfolge für Facebook/Instagram: DACH-Klassiker zuerst, dann neueste — wie bei Pinterest. */
export function rangfolge(liste) {
  const rang = (s) => { const i = ZUERST.indexOf(s); return i < 0 ? Infinity : i; };
  return [...liste].sort((a, b) => rang(a.slug) - rang(b.slug) || String(b.fm.publishedAt ?? '').localeCompare(String(a.fm.publishedAt ?? '')));
}

/** Nächste n Einträge, die im Verlauf fehlen; ist alles durch, beginnt die Runde von vorn (Evergreen). */
export function naechste(liste, verlauf, n, schluessel = (x) => x.slug) {
  const offen = liste.filter((x) => !verlauf.includes(schluessel(x)));
  const quelle = offen.length >= n ? offen : [...offen, ...liste.filter((x) => verlauf.includes(schluessel(x)))];
  return quelle.slice(0, n);
}

export function baueStapel({ start, verlauf = {}, videos = [], alle = rezepte() }) {
  const kw = kalenderwoche(start);
  const posts = [];
  const um = (tag, zeit) => `${plusTage(start, tag)}T${zeit}:00`;

  // Pinterest: 7 Pins reihum über die Pinnwände
  const pins = reihum(alle.map(({ slug, fm }) => { const p = pin(fm, slug); return p && { ...p, datum: fm.publishedAt }; }).filter(Boolean));
  naechste(pins, verlauf.pinterest ?? [], 7).forEach((p, i) => {
    const { datum, beschreibung, ...rest } = p;
    posts.push({ ...rest, kanal: 'pinterest', typ: 'PIN', text: beschreibung, datum: um(i, '12:00') });
  });
  const pinSlugs = new Set(posts.map((p) => p.slug));

  // Facebook und Instagram: andere Rezepte als Pinterest in derselben Woche, und untereinander verschieden
  const geordnet = rangfolge(alle);
  const fb = naechste(geordnet.filter((r) => !pinSlugs.has(r.slug)), verlauf.facebook ?? [], 3);
  fb.forEach(({ slug, fm }, i) => posts.push({ ...facebookPost(fm, slug, kw), datum: um([0, 2, 4][i], '18:30') }));
  const belegt = new Set([...pinSlugs, ...fb.map((r) => r.slug)]);
  const ig = naechste(geordnet.filter((r) => !belegt.has(r.slug)), verlauf.instagram ?? [], 3);
  ig.forEach(({ slug, fm }, i) => posts.push({ ...instagramPost(fm, slug), datum: um([1, 3, 5][i], '18:30') }));

  // Videos: je Video Reel + TikTok, höchstens 3 pro Woche
  naechste(videos, verlauf.video ?? [], Math.min(3, videos.length), (v) => v.id).forEach((v, i) => {
    const datum = um([0, 2, 4][i], '12:30');
    posts.push({ kanal: 'instagram', typ: 'REEL', id: v.id, video: v.url, text: v.instagram, ki: v.ki !== false, referenzwerte: true, datum });
    posts.push({ kanal: 'tiktok', typ: 'VIDEO', id: v.id, video: v.url, text: v.tiktok, ki: v.ki !== false, referenzwerte: true, datum });
  });

  const fehler = posts.flatMap((p) => pruefe(p).map((f) => `${p.kanal} ${p.slug ?? p.id}: ${f}`));
  return { kw, start, posts: posts.sort((a, b) => a.datum.localeCompare(b.datum)), fehler };
}

function main() {
  const args = process.argv.slice(2);
  const wert = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
  if (wert('pruefen')) {
    // Nach dem Feinschliff der Texte (Claude im Wochenlauf) den ganzen Stapel erneut gegen die Regeln prüfen.
    const stapel = JSON.parse(readFileSync(wert('pruefen'), 'utf8'));
    const fehler = stapel.posts.flatMap((p) => pruefe(p).map((f) => `${p.kanal} ${p.slug ?? p.id}: ${f}`));
    console.log(fehler.length ? `Regelverstöße:\n${fehler.join('\n')}` : `OK: ${stapel.posts.length} Posts regelkonform.`);
    if (fehler.length) process.exitCode = 1;
    return;
  }
  const start = wert('start');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start ?? '')) throw new Error('--start YYYY-MM-DD (erster Sendetag, ein Dienstag) ist Pflicht');
  const lies = (f) => (f && existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : undefined);
  const stapel = baueStapel({ start, verlauf: lies(wert('verlauf')) ?? {}, videos: lies(wert('videos')) ?? [] });
  console.log(JSON.stringify(stapel, null, 1));
  if (stapel.fehler.length) { console.error(`Regelverstöße:\n${stapel.fehler.join('\n')}`); process.exitCode = 1; }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
