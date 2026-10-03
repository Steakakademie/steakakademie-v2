// ─────────────────────────────────────────────────────────────────────────────
// Startseiten-Artikel — echter, wachsender Inhalt statt festverdrahteter Liste
//
// ANLASS (27.08.2026): Der Magazin-Aufmacher der Startseite kam aus einer
// hartkodierten Platzhalter-Liste. Deren erster Eintrag stand seit dem
// 20. Mai 2026 unveraendert oben — die Startseite sah drei Monate lang gleich
// aus, obwohl staendig neue Inhalte erschienen. Diese Datei zieht die
// Aufmacher-Artikel stattdessen aus Contentlayer: sortiert nach
// Veroeffentlichungsdatum, nur freigegebene Dokumente (Redaktionsvorbehalt),
// nur solche mit Bild. Sobald ein neuer Artikel/Cut/Methode/Vergleich
// veroeffentlicht wird, rotiert der Aufmacher OHNE manuellen Eingriff.
//
// Rezepte bleiben bewusst draussen — sie haben eigene Sektionen und wuerden
// den redaktionellen Aufmacher nach jedem Rezept-Lauf dominieren.
// ─────────────────────────────────────────────────────────────────────────────
import {
  allArtikels, allCuts, allMethodes, allVergleiches, allStreitfalls, allUsaBbqStyles, allRecipes,
} from 'contentlayer/generated';
import { nurVeroeffentlicht } from '@/lib/redaktion';
import bildHelligkeit from '../../data/bild-helligkeit.json';
import type { ArticleMeta } from '@/types';

type Doc = {
  type: string;
  title: string;
  excerpt?: string;
  image?: string;
  imageAlt?: string;
  author?: string;
  publishedAt: string;
  readingTime?: number;
  category?: string;
  url: string;
  slug?: string;
  status?: string | null;
  reviewed?: boolean | null;
};

const KATEGORIE: Record<string, { label: string; slug: string }> = {
  Cut:         { label: 'Cuts & Fleischkunde',   slug: 'cuts' },
  Methode:     { label: 'Grilltechniken',        slug: 'grilltechniken' },
  Vergleich:   { label: 'Ausrüstung',            slug: 'ausruestung' },
  Streitfall:  { label: 'Wissen & Wissenschaft', slug: 'wissen' },
  UsaBbqStyle: { label: 'USA-Expedition',        slug: 'usa-expedition' },
  Artikel:     { label: 'Wissen & Wissenschaft', slug: 'wissen' },
  Recipe:      { label: 'Rezepte',               slug: 'rezepte' },
};

// Artikel-Frontmatter darf eine eigene Kategorie tragen — auf die drei
// Startseiten-Rubriken abbilden, alles andere faellt auf "wissen" zurueck.
const ARTIKEL_KATEGORIE: Record<string, { label: string; slug: string }> = {
  grilltechniken: { label: 'Grilltechniken',      slug: 'grilltechniken' },
  cuts:           { label: 'Cuts & Fleischkunde', slug: 'cuts' },
};

function autorSlug(autor: string): string {
  const a = autor.toLowerCase();
  if (a.includes('jonas')) return 'jonas';
  if (a.includes('elena')) return 'elena';
  if (a.includes('uwe'))   return 'uwe-yendell';
  return 'marco';
}

const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
function datumDeutsch(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : `${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`;
}

function zuArticleMeta(doc: Doc): ArticleMeta | null {
  if (!doc.image || !doc.excerpt) return null;
  let kat = KATEGORIE[doc.type] ?? KATEGORIE.Artikel;
  if (doc.type === 'Artikel' && doc.category) {
    kat = ARTIKEL_KATEGORIE[doc.category.toLowerCase()] ?? kat;
  }
  const autor = doc.author || 'Marco, der Pitmaster';
  return {
    slug: doc.slug ?? doc.url.split('/').filter(Boolean).pop() ?? doc.url,
    url: doc.url,
    title: doc.title,
    excerpt: doc.excerpt,
    image: doc.image,
    imageAlt: doc.imageAlt || doc.title,
    category: kat.label,
    categorySlug: kat.slug,
    author: autor,
    authorSlug: autorSlug(autor),
    formattedDate: datumDeutsch(doc.publishedAt),
    ...(typeof doc.readingTime === 'number' ? { readingTime: doc.readingTime } : {}),
  };
}

// ── Hero-Tauglichkeit (27.08.2026) ──────────────────────────────────────────
// Anlass: Der erste automatische Aufmacher (holz-waessern.jpg) hat ein Motiv,
// dessen linkes Drittel — genau dort liegt die Textspalte des Heros — fast
// reines Schwarz ist (Luminanz 22/255). Mit dem Lesbarkeits-Overlay darueber
// sah die Startseite aus, als haette sie sich gar nicht geoeffnet.
// data/bild-helligkeit.json haelt die gemessene mittlere Luminanz je Bild
// (gesamt + linkes Drittel). Ein Bild traegt den Vollbild-Hero nur, wenn die
// Textzone sichtbare Zeichnung hat. Referenz: das bewaehrte alte Hero-Bild
// (hero-ribeye.jpg) misst 48/43 — die Schwellen liegen knapp darunter.
// UNBEKANNTE Bilder (noch nicht gemessen) gelten als tauglich: die Automatik
// darf nicht an einer fehlenden Messung verhungern; dunkle Neuzugaenge werden
// bei der naechsten Messrunde aussortiert. Dunkle Motive fliegen nicht raus —
// sie erscheinen in der Artikel-Reihe (kleine Karten), nur nicht als Vollbild.
const HELLIGKEIT: Record<string, { gesamt: number; links: number }> =
  (bildHelligkeit as { werte: Record<string, { gesamt: number; links: number }> }).werte;
const MIN_GESAMT = 45;
const MIN_LINKS = 35;

function heroTauglich(image: string): boolean {
  const h = HELLIGKEIT[image];
  if (!h) return true; // nicht gemessen -> nicht blockieren
  return h.gesamt >= MIN_GESAMT && h.links >= MIN_LINKS;
}

/**
 * Aufmacher-Liste der Startseite: neueste veroeffentlichte Inhalte zuerst.
 * Position 1 (Vollbild-Hero) bekommt der neueste Inhalt mit hero-tauglichem
 * Bild; zu dunkle Motive ruecken in die Artikel-Reihe.
 * `fallback` (die fruehere Platzhalter-Liste) fuellt nur auf, falls der echte
 * Bestand einmal zu duenn ist — Eintraege mit bereits vorhandener URL werden
 * dabei uebersprungen, damit nichts doppelt erscheint.
 */
export function getStartseitenArtikel(fallback: ArticleMeta[], mindestens = 8): ArticleMeta[] {
  const docs = [
    ...allArtikels, ...allCuts, ...allMethodes,
    ...allVergleiches, ...allStreitfalls, ...allUsaBbqStyles,
  ] as unknown as Doc[];

  const echt = nurVeroeffentlicht(docs)
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .map(zuArticleMeta)
    .filter((a): a is ArticleMeta => a !== null);

  // Hero-Auswahl: erster Eintrag mit tragfaehigem Bild nach vorn
  const heroIdx = echt.findIndex((a) => heroTauglich(a.image));
  if (heroIdx > 0) {
    const [hero] = echt.splice(heroIdx, 1);
    echt.unshift(hero);
  }

  const urls = new Set(echt.map((a) => a.url));
  const out = [...echt];
  for (const f of fallback) {
    if (out.length >= Math.max(mindestens, echt.length)) break;
    if (!urls.has(f.url)) { out.push(f); urls.add(f.url); }
  }
  return out;
}

/** Ein freigegebener Neuzugang mit ISO-Datum — Rohstoff fuer den BBQ-News-Strom. */
export interface Neuzugang {
  article: ArticleMeta;
  /** yyyy-mm-dd aus publishedAt */
  isoDate: string;
  /** Contentlayer-Typ (Artikel, Cut, Recipe, UsaBbqStyle, …) */
  type: string;
}

/**
 * Neueste freigegebene Inhalte inkl. Rezepte, neueste zuerst (28.09.2026).
 *
 * Anlass: Der BBQ-News-Bereich (Startseite + /bbq-news) zeigte bis 28.09.2026
 * eine hartkodierte Liste vom Mai 2026 — derselbe Fehler, den getStartseitenArtikel
 * am 27.08. fuer den Magazin-Aufmacher behoben hat. Solange keine freigegebenen
 * Scout-News vorliegen oder sie aelter sind als der Rest der Plattform, fuellt
 * dieser Strom auf. Er waechst im selben Takt wie Rezepte (taeglich), Artikel-
 * Rollout (2/Woche ab 01.10.) und Plattform-Puls.
 *
 * Bewusst pro Aufruf berechnet, nicht als Modul-Konstante: nurVeroeffentlicht()
 * blendet kuenftig datierte Dokumente aus — das muss bei jedem ISR-Lauf neu
 * gegen die aktuelle Uhrzeit laufen, sonst erscheint ein faelliger Artikel erst
 * nach dem naechsten Deploy.
 */
export function getRedaktionelleNeuzugaenge(limit = 24): Neuzugang[] {
  const rezepte = (allRecipes as unknown as (Doc & { description?: string })[])
    .map((r) => ({ ...r, excerpt: r.excerpt ?? r.description }));
  const docs = [
    ...allArtikels, ...allCuts, ...allMethodes,
    ...allVergleiches, ...allStreitfalls, ...allUsaBbqStyles,
  ] as unknown as Doc[];

  return nurVeroeffentlicht([...docs, ...rezepte])
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .map((d) => {
      const article = zuArticleMeta(d);
      return article ? { article, isoDate: String(d.publishedAt).slice(0, 10), type: d.type } : null;
    })
    .filter((n): n is Neuzugang => n !== null)
    .slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// Daten-Exporte fuer / und /home-b — EINE Datenquelle fuer beide Startseiten.
// Liegen hier und nicht in page.tsx: App-Router-Seitenmodule duerfen nur die
// bekannten Next-Exporte (default, metadata, revalidate, …) tragen.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_ARTICLES: ArticleMeta[] = [
  {
    slug: 'ribeye-guide-der-perfekte-cut',
    url: '/cuts/ribeye',
    title: 'Ribeye: Alles über Deutschlands beliebtesten Premium-Cut',
    excerpt:
      'Vom Longissimus dorsi bis zum Spinalis — wir erklären, was ein Ribeye ausmacht, wie Marmorierung bewertet wird und wie du ihn perfekt auf den Punkt bringst.',
    image: '/images/articles/ribeye-premium-cut.webp',
    imageAlt: 'Perfekt gebratenes Ribeye Steak auf schwarzem Schieferbrett, aufgeschnitten mit rosa Kern und sichtbarem Fettdeckel',
    category: 'Cuts & Fleischkunde',
    categorySlug: 'cuts',
    author: 'Marco, der Pitmaster',
    authorSlug: 'marco',
    formattedDate: '20. Mai 2026',
    readingTime: 12,
    featured: true,
  },
  {
    // 03.10.2026: Titel und Auszug an die Seite angeglichen. Vorher: „Test 2026:
    // Wir haben 8 Modelle verglichen“, „mit kalibriertem Referenzgerät gemessen“,
    // Autor Jonas, 18. Mai — die Seite vergleicht drei Modelle nach
    // Herstellerangaben, zeichnet Marco und ist vom 22. Mai.
    slug: 'fleischthermometer-vergleich-2026',
    url: '/vergleich/fleischthermometer',
    title: 'Fleischthermometer im Vergleich: MEATER Plus, Thermapen ONE und Inkbird',
    excerpt:
      'Drei Fleischthermometer, drei Bauarten: Funk-Sonde, Sofortlesegerät und Mehrkanal-Bluetooth. Marktübersicht nach Herstellerangaben — mit Einordnung, welche Bauart zu welchem Grillstil passt.',
    image: '/images/articles/thermometer-test-steak-grill-1.webp',
    imageAlt: 'Fleischthermometer-Sonde im Ribeye Steak auf dem Grill',
    category: 'Ausrüstung',
    categorySlug: 'ausruestung',
    author: 'Marco, der Pitmaster',
    authorSlug: 'marco',
    formattedDate: '22. Mai 2026',
    readingTime: 15,
    featured: true,
  },
  {
    slug: 'reverse-sear-methode',
    url: '/methoden/reverse-sear',
    title: 'Reverse Sear: Warum diese Methode alles andere schlägt',
    excerpt:
      'Erst niedrig garen, dann kurz scharf anbraten — Reverse Sear erzeugt die perfekte Kruste bei exakter Kerntemperatur. Schritt für Schritt erklärt.',
    image: '/images/articles/reverse-sear-cast-iron-steak.webp',
    imageAlt: 'Steak in gusseiserner Pfanne mit Flammen — Reverse Sear Methode',
    category: 'Grilltechniken',
    categorySlug: 'grilltechniken',
    author: 'Marco, der Pitmaster',
    authorSlug: 'marco',
    formattedDate: '15. Mai 2026',
    readingTime: 10,
    featured: false,
  },
  {
    slug: 'brisket-anleitung-komplett',
    url: '/cuts/brisket',
    title: 'Brisket: Die komplette Anleitung für Low & Slow BBQ',
    excerpt:
      'Brisket ist die Königsdisziplin des BBQ. Wir erklären Flat vs. Point, Bark-Aufbau, den Stall und warum Texas-Style kein Zufall ist.',
    image: '/images/articles/brisket-texas-smoked.webp',
    imageAlt: 'Aufgeschnittenes Texas Brisket mit dunkler Bark-Kruste auf Schneidebrett',
    category: 'Cuts & Fleischkunde',
    categorySlug: 'cuts',
    author: 'Jonas — Der Enthusiast',
    authorSlug: 'jonas',
    formattedDate: '12. Mai 2026',
    readingTime: 18,
    featured: false,
  },
  {
    slug: 'dry-aged-beef-zu-hause',
    url: '/aging',
    title: 'Dry Aged Beef zu Hause: Was wirklich funktioniert',
    excerpt:
      'Trockengereiftes Fleisch ist kein Mythos — aber es braucht Kontrolle. Wir zeigen, was mit einem Dry-Ager für Zuhause realistisch möglich ist.',
    image: '/images/articles/dry-aged-beef-reifeschrank.webp',
    imageAlt: 'Dry Aged Beef im Reifeschrank — dunkle Kruste sichtbar',
    category: 'Wissen',
    categorySlug: 'wissen',
    author: 'Elena — Die Stimme',
    authorSlug: 'elena',
    formattedDate: '10. Mai 2026',
    readingTime: 9,
    featured: false,
  },
  {
    slug: 'kerntemperaturen-guide',
    url: '/temperatur-guide',
    title: 'Kerntemperaturen: Die vollständige Tabelle für jedes Fleisch',
    excerpt:
      'Von Rare bis Well Done, von Rind bis Geflügel — alle Kerntemperaturen auf einen Blick, mit Erklärung der Prozesse dahinter.',
    image: '/images/articles/thermometer-test-steak-grill-2.webp',
    imageAlt: 'Digitales Fleischthermometer misst Kerntemperatur im Steak',
    category: 'Wissen',
    categorySlug: 'wissen',
    author: 'Marco, der Pitmaster',
    authorSlug: 'marco',
    formattedDate: '8. Mai 2026',
    readingTime: 7,
    featured: false,
  },
];

// Echte, wachsende Aufmacher-Liste (27.08.2026): neueste veroeffentlichte
// Inhalte zuerst, Redaktionsvorbehalt beruecksichtigt; die Platzhalter-Liste
// oben fuellt nur noch auf.
export const STARTSEITEN_ARTIKEL: ArticleMeta[] = getStartseitenArtikel(FALLBACK_ARTICLES);
