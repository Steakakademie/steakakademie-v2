/**
 * Hofladen-Radar — reine Abbildung OSM-Element → hoefe-Zeile.
 * Kein I/O, damit vitest die Regeln prueft (src/__tests__/hoefe.test.ts).
 *
 * Datenquelle: OpenStreetMap, Lizenz ODbL — Attribution auf jeder Seite, die
 * diese Daten zeigt (© OpenStreetMap-Mitwirkende), ist Pflicht.
 */

// Overpass: nwr = node + way + relation, out center liefert fuer Flaechen den
// Mittelpunkt. Regex-Flag fuer "case-insensitive" ist bei Overpass `,i` als
// Suffix — `(?i)` ist dort ein statischer Fehler (am 13.09.2026 belegt).
export const OVERPASS_QUERY = `
[out:json][timeout:180];
area["ISO3166-1"~"^(DE|AT|CH)$"][admin_level=2]->.dach;
(
  nwr["shop"="farm"](area.dach);
);
out center tags;
`.trim();

const FLEISCH_MUSTER = [
  ['rind',      /\b(beef|rind|rindfleisch|cattle|angus|galloway|wagyu|ochse|bulle|kalb|veal)\b/i],
  ['schwein',   /\b(pork|schwein|schweinefleisch|pig|wollschwein|bunte? bentheimer|duroc)\b/i],
  ['lamm',      /\b(lamb|lamm|lammfleisch|sheep|schaf|mutton|hammel)\b/i],
  ['gefluegel', /\b(poultry|chicken|huhn|hühner|huehner|haehnchen|hähnchen|gefluegel|geflügel|pute|puten|turkey|ente|enten|duck|gans|gänse|gaense|goose)\b/i],
  // "wild" allein nicht: haeufiger Nachname ("Hof Wild") und Adjektiv.
  ['wild',      /\b(wildfleisch|wildbret|hirsch|rehfleisch|wildschwein|damwild|rotwild|venison)\b/i],
  ['wurst',     /\b(sausage|wurst|salami|schinken|ham|bratwurst)\b/i],
];
const FLEISCH_ALLGEMEIN = /\b(meat|fleisch|butcher|metzger|schlachter|fleischerei|hofschlachtung|direktvermarkt\w*)\b/i;
const KEIN_FLEISCH = /\b(vegan|vegetarian|vegetarisch)\b/i;

/**
 * Leitet aus den OSM-Tags ab, ob und welches Fleisch der Hof verkauft.
 * Rueckgabe: { verkauft_fleisch: true|false|null, fleischarten: string[] }
 * null = kein Hinweis in den Tags (nicht "kein Fleisch").
 */
export function fleischAusTags(tags = {}) {
  const felder = ['produce', 'product', 'products', 'description', 'description:de',
                  'note', 'cuisine', 'name', 'butcher', 'shop:meat', 'meat'];
  const text = felder.map((k) => tags[k] ?? '').filter(Boolean).join(' | ');
  if (!text) return { verkauft_fleisch: null, fleischarten: [] };

  const arten = FLEISCH_MUSTER.filter(([, re]) => re.test(text)).map(([art]) => art);
  if (arten.length > 0 || FLEISCH_ALLGEMEIN.test(text)) {
    return { verkauft_fleisch: true, fleischarten: arten };
  }
  // Ein produce-Tag ohne jedes Fleisch-Wort ist ein schwaches Signal — wir
  // markieren nur dann "kein Fleisch", wenn der Hof sich selbst so beschreibt.
  if (KEIN_FLEISCH.test(text)) return { verkauft_fleisch: false, fleischarten: [] };
  return { verkauft_fleisch: null, fleischarten: [] };
}

/**
 * Grobe Bounding-Box DE + AT + CH (inkl. Liechtenstein, das mittendrin liegt).
 * DE 47,3–55,1 N / 5,9–15,0 E · AT 46,4–49,0 N / 9,5–17,2 E · CH 45,8–47,8 N / 6,0–10,5 E.
 * Genauer filtert die Overpass-Abfrage (Landesgrenzen); das hier faengt nur Ausreisser.
 */
export function imDachRaum(lat, lng) {
  return lat >= 45.5 && lat <= 55.5 && lng >= 5.5 && lng <= 17.5;
}

export function slugAusName(name, osmId) {
  const basis = String(name)
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return `${basis || 'hofladen'}-${String(osmId).replace(/^[nwr]/, '')}`;
}

function bioAusTags(tags) {
  const o = (tags.organic ?? '').toLowerCase();
  return o === 'yes' || o === 'only';
}

function normUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(s)) return `https://${s}`;
  return null;
}

/** OSM-Element (Overpass JSON) → Zeile fuer hoefe_import_upsert. null = unbrauchbar. */
export function hofAusElement(el) {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!imDachRaum(lat, lng)) return null;

  // Ohne Namen ist ein Hof im Radar wertlos (kein Profil, keine Suche).
  const name = (tags.name ?? tags['name:de'] ?? '').trim();
  if (!name) return null;

  const osmId = `${el.type[0]}${el.id}`;
  const { verkauft_fleisch, fleischarten } = fleischAusTags(tags);

  return {
    osm_id: osmId,
    name,
    slug: slugAusName(name, osmId),
    beschreibung: tags['description:de'] ?? tags.description ?? null,
    bio: bioAusTags(tags),
    bio_zertifikat: tags['organic:certification'] ?? null,
    verkauft_fleisch,
    fleischarten,
    oeffnungszeiten: tags.opening_hours ?? null,
    website: normUrl(tags.website ?? tags['contact:website'] ?? tags.url),
    telefon: tags.phone ?? tags['contact:phone'] ?? null,
    email: tags.email ?? tags['contact:email'] ?? null,
    lat,
    lng,
    strasse: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') || null,
    plz: tags['addr:postcode'] ?? null,
    ort: tags['addr:city'] ?? null,
    osm_tags: tags,
  };
}

/** Sortiert unbrauchbare Elemente aus und entdoppelt Slugs (letzter gewinnt nicht — erster bleibt). */
export function hoefeAusElementen(elements) {
  const gesehen = new Set();
  const out = [];
  for (const el of elements) {
    const h = hofAusElement(el);
    if (!h || gesehen.has(h.slug)) continue;
    gesehen.add(h.slug);
    out.push(h);
  }
  return out;
}
