/**
 * Steakakademie Schema.org Library
 * Typsichere Generatoren für alle verwendeten Schema-Typen.
 * Verknüpft mit Silo-Architektur: /vergleich/, /wissen/, /cuts/, /methoden/
 */

import { getAuthorBySlug } from '@/lib/authors';

const BASE_URL = 'https://steakakademie.de';

// ── Kanonische Entitäts-IDs ──────────────────────────────────────────────────
// EINE Entität pro realer Sache. Jede Seite, die Uwe oder die Organisation
// erwähnt, referenziert diese @id statt eine zweite Entität zu erzeugen —
// sonst zerfällt das E-E-A-T-Signal auf mehrere halbe Entitäten.

export const ORGANIZATION_ID = `${BASE_URL}/#organization`;
export const FOUNDER_ID = `${BASE_URL}/ueber-uns#person`;

// ── Organisation & Website ───────────────────────────────────────────────────

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Steakakademie',
    url: BASE_URL,
    // Masse aus der Datei gelesen (03.10.2026, sharp + JPEG-Kopf): 896 × 1152.
    // Vorher stand hier 512 × 512. Wird public/images/logo-barrel.jpg ersetzt,
    // aendert sich diese Zeile mit — Waechter: src/__tests__/schema-produkt.test.ts.
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/images/logo-barrel.jpg`,
      width: 896,
      height: 1152,
    },
    sameAs: [
      'https://www.wikidata.org/wiki/Q140455747',
      'https://www.instagram.com/steakakademie',
      'https://www.youtube.com/@steakakademie',
      'https://www.tiktok.com/@steakakademie',
      'https://www.facebook.com/steakakademie.de',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'pitmaster@steakakademie.de',
      contactType: 'customer service',
      availableLanguage: 'German',
    },
    // E-E-A-T: verknüpft die Marke maschinenlesbar mit dem realen Gründer.
    // Ohne diese Kante bleibt "Steakakademie" für Google/LLMs eine namenlose
    // Website und "Uwe Yendell" eine unverbundene Person.
    founder: {
      '@type': 'Person',
      '@id': FOUNDER_ID,
      name: 'Uwe Yendell',
      url: `${BASE_URL}/ueber-uns`,
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    url: BASE_URL,
    name: 'Steakakademie',
    description:
      'Deutschlands methodisch tiefste BBQ-Wissensplattform — Fleischkunde, Grilltechniken, Ausrüstungs-Vergleiche und Grillmeister-Diplome.',
    publisher: { '@id': `${BASE_URL}/#organization` },
    inLanguage: 'de-DE',
  };
}

// ── Breadcrumb ───────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: BASE_URL },
      ...items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: item.name,
        item: `${BASE_URL}${item.url}`,
      })),
    ],
  };
}

// ── Autor-Referenz: Person NUR für reale Autoren (KI-Personas → Organization;
//    Konsistenz mit /autoren-Fix vom 07.07.2026) ─────────────────────────────

export function authorSchemaRef(authorSlug: string) {
  const a = getAuthorBySlug(authorSlug);
  if (a?.realPerson) {
    // Reale Autoren zeigen auf ihre kanonische @id (aktuell nur Uwe), damit
    // Artikel-Autorschaft auf DIESELBE Entität einzahlt wie founder + /ueber-uns.
    return {
      '@type': 'Person' as const,
      ...(a.slug === 'uwe-yendell' ? { '@id': FOUNDER_ID } : {}),
      name: a.name,
      url: `${BASE_URL}/autoren/${a.slug}`,
    };
  }
  return { '@type': 'Organization' as const, '@id': ORGANIZATION_ID, name: 'Steakakademie', url: BASE_URL };
}

// ── Pruefvermerk: fachlich geprueft von Uwe ──────────────────────────────────
// `reviewedAt` im Frontmatter setzt nur Uwe von Hand (CLAUDE.md §2 Regel 4) —
// es ist der datierte Nachweis, dass ein Mensch den Text geprueft hat. Bis
// 02.10.2026 stand dieser Nachweis nur im Fliesstext; im strukturierten Teil
// der Seite fehlte er, obwohl er das einzige E-E-A-T-Signal eines echten
// Menschen ist. schema.org fuehrt `reviewedBy`/`lastReviewed` an der WebPage,
// nicht am Article — deshalb haengen die Felder an mainEntityOfPage.
// Ohne `reviewedAt` gibt es KEINE Felder: Ein Pruefvermerk ohne Pruefung waere
// eine Falschaussage.

export function pruefvermerkSchema(reviewedAt?: string | null) {
  if (!reviewedAt) return {};
  const datum = new Date(reviewedAt);
  if (Number.isNaN(datum.getTime())) return {};
  return {
    lastReviewed: datum.toISOString().slice(0, 10),
    reviewedBy: {
      '@type': 'Person' as const,
      '@id': FOUNDER_ID,
      name: 'Uwe Yendell',
      url: `${BASE_URL}/ueber-uns`,
    },
  };
}

// ── Artikel / Fachbeitrag ────────────────────────────────────────────────────

export interface ArticleSchemaInput {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorSlug: string;
  url: string;
  keywords?: string[];
  /** Frontmatter `reviewedAt` — nur gesetzt, wenn Uwe den Text geprueft hat. */
  reviewedAt?: string | null;
}

export function articleSchema(input: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${BASE_URL}${input.url}#article`,
    headline: input.headline,
    description: input.description,
    image: { '@type': 'ImageObject', url: input.image.startsWith('http') ? input.image : `${BASE_URL}${input.image}` },
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    keywords: input.keywords?.join(', '),
    author: authorSchemaRef(input.authorSlug),
    publisher: { '@id': `${BASE_URL}/#organization` },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}${input.url}`,
      ...pruefvermerkSchema(input.reviewedAt),
    },
    inLanguage: 'de-DE',
  };
}

// ── Produkt ──────────────────────────────────────────────────────────────────
// Das Schema sagt nichts, was die Seite nicht belegt (03.10.2026). Entfernt:
//   - `review` mit Autor Steakakademie und `reviewRating` = `rating` aus der
//     Registry. Diese Zahl ist ein von Hand eingetragener Amazon-Durchschnitt,
//     sichtbar steht sie als „(Ø Amazon)“ — im Schema war sie die Bewertung der
//     Steakakademie. Aus denselben Zahlen entsteht auch kein `aggregateRating`.
//   - `availability: InStock` (Lieferbarkeit wird nirgends geprueft) und
//     `priceValidUntil` (war Bauzeit + 30 Tage, kein Haendlerwert).
// Ein `Offer` gibt es nur mit `price`, und `price` setzt der Aufrufer nur, wenn
// die sichtbare Karte genau diesen Einzelpreis zeigt (keine Spanne) — siehe
// `einzelpreis()` in src/components/affiliate/produkt-anzeige.ts. Ein Product
// ohne `offers` ist gueltiges schema.org; Google zeigt dafuer nur kein
// Produkt-Snippet. Das ist gewollt und kein Grund, wieder etwas zu behaupten.

export interface ProductSchemaInput {
  name: string;
  description: string;
  brand: string;
  sku?: string;
  image?: string;
  /** Nur setzen, wenn die sichtbare Karte genau diesen Preis zeigt. */
  price?: number | null;
  affiliateUrl: string;
}

export function productSchema(product: ProductSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand },
  };

  if (typeof product.price === 'number' && product.price > 0) {
    schema.offers = {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'EUR',
      url: product.affiliateUrl,
    };
  }

  if (product.image) {
    schema.image = product.image.startsWith('http')
      ? product.image
      : `${BASE_URL}${product.image}`;
  }
  if (product.sku) schema.sku = product.sku;

  return schema;
}

// ── Vergleichsseite: ItemList ────────────────────────────────────────────────

/**
 * Produkt-IDs, die ein Vergleichstext ueber seine Produkt-Bausteine sichtbar
 * zeigt (`<MDXProductCard id>`, `<MDXComparisonTable ids>`,
 * `<MDXBuyingGuideBlock id>`), in der Reihenfolge des ersten Auftretens, ohne
 * Dubletten (03.10.2026).
 *
 * Warum: Die ItemList einer Vergleichsseite kam bis dahin aus der Kategorie
 * der Seite, mit Rueckfall auf `thermometer`. /vergleich/grills und
 * /vergleich/messer gaben so sechs Thermometer als Grill- bzw. Messer-Liste
 * aus, und „Die 5 besten …“ listete sechs. Massgeblich ist, was der Text zeigt.
 *
 * `<MDXComparisonTable category="…">` wird nicht ausgewertet (im Inhalt nicht
 * verwendet). Kaeme es dazu, fehlten diese Produkte in der Liste — zu wenig
 * ist hier die sichere Seite.
 */
export function produktIdsImVergleichstext(mdxRoh: string): string[] {
  const ids: string[] = [];
  const baustein = /<MDX(?:ProductCard|ComparisonTable|BuyingGuideBlock)\b([^>]*)/g;
  for (const treffer of mdxRoh.matchAll(baustein)) {
    const attribut = /\bids?\s*=\s*["']([^"']*)["']/.exec(treffer[1]);
    if (!attribut) continue;
    for (const roh of attribut[1].split(',')) {
      const id = roh.trim();
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

/**
 * Welche Produkte gehoeren in die ItemList einer Vergleichsseite? (03.10.2026)
 *   1. Zeigt der Text Produkt-Bausteine, sind genau diese die Liste
 *      (unbekannte IDs fallen weg — die Karte rendert dann auch nicht).
 *   2. Sonst die Karten der Seitenleiste. Der Aufrufer uebergibt sie NUR, wenn
 *      die Kategorie der Seite ausdruecklich zugeordnet ist — sonst `null`.
 *   3. Sonst keine: `comparisonPageSchema` gibt dann keine ItemList aus.
 */
export function itemListProdukte<T>(
  mdxRoh: string,
  findeProdukt: (id: string) => T | undefined,
  seitenleiste: readonly T[] | null,
): T[] {
  const ids = produktIdsImVergleichstext(mdxRoh);
  if (ids.length > 0) {
    return ids.flatMap((id) => {
      const produkt = findeProdukt(id);
      return produkt === undefined ? [] : [produkt];
    });
  }
  return seitenleiste ? [...seitenleiste] : [];
}

export interface ComparisonSchemaInput {
  pageTitle: string;
  pageUrl: string;
  products: ProductSchemaInput[];
}

/** Ohne Produkte gibt es keine ItemList (`null`) — eine leere Liste oder eine
 *  mit fremden Produkten waere eine Falschaussage. */
export function comparisonPageSchema(input: ComparisonSchemaInput) {
  if (input.products.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: input.pageTitle,
    url: `${BASE_URL}${input.pageUrl}`,
    numberOfItems: input.products.length,
    itemListElement: input.products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      item: productSchema(p),
    })),
  };
}

// ── FAQ ──────────────────────────────────────────────────────────────────────

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

// ── HowTo ────────────────────────────────────────────────────────────────────

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

export interface HowToSchemaInput {
  name: string;
  description: string;
  image?: string;
  totalTime?: string; // ISO 8601 duration, e.g. "PT45M"
  steps: HowToStep[];
  url: string;
}

export function howToSchema(input: HowToSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    ...(input.image && { image: `${BASE_URL}${input.image}` }),
    ...(input.totalTime && { totalTime: input.totalTime }),
    url: `${BASE_URL}${input.url}`,
    step: input.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.image && { image: `${BASE_URL}${s.image}` }),
    })),
  };
}

// ── CollectionPage (Silo-Index) ──────────────────────────────────────────────

export function collectionPageSchema(name: string, url: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${BASE_URL}${url}`,
    publisher: { '@id': `${BASE_URL}/#organization` },
    inLanguage: 'de-DE',
  };
}

// ── Kurs (Google Course-Richtlinien: Course + hasCourseInstance) ─────────────

export interface CourseSchemaInput {
  name: string;
  description: string;
  url: string;
  image?: string;
  price?: number;          // NUR setzen wenn wirklich kaufbar
  courseWorkload?: string; // ISO 8601
  teaches?: string[];
}

export function courseSchema(input: CourseSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${BASE_URL}${input.url}#course`,
    name: input.name,
    description: input.description,
    url: `${BASE_URL}${input.url}`,
    ...(input.image && {
      image: input.image.startsWith('http') ? input.image : `${BASE_URL}${input.image}`,
    }),
    provider: { '@id': `${BASE_URL}/#organization` },
    inLanguage: 'de-DE',
    ...(input.teaches && { teaches: input.teaches }),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      ...(input.courseWorkload && { courseWorkload: input.courseWorkload }),
    },
    ...(input.price != null && {
      offers: {
        '@type': 'Offer',
        price: input.price.toFixed(2),
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: `${BASE_URL}${input.url}`,
      },
    }),
  };
}

// ── Glossar: DefinedTermSet + DefinedTerm ────────────────────────────────────

export const GLOSSAR_SET_ID = `${BASE_URL}/glossar#termset`;

export interface DefinedTermInput {
  title: string;
  url: string;
  shortDefinition?: string;
}

export function definedTermSetSchema(terms: { title: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': GLOSSAR_SET_ID,
    name: 'Steakakademie BBQ-Glossar',
    url: `${BASE_URL}/glossar`,
    inLanguage: 'de-DE',
    hasDefinedTerm: terms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.title,
      url: `${BASE_URL}${t.url}`,
    })),
  };
}

export function definedTermSchema(term: DefinedTermInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': `${BASE_URL}${term.url}#term`,
    name: term.title,
    ...(term.shortDefinition && { description: term.shortDefinition }),
    url: `${BASE_URL}${term.url}`,
    inDefinedTermSet: { '@id': GLOSSAR_SET_ID },
    inLanguage: 'de-DE',
  };
}
