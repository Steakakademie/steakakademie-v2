import { defineDocumentType, makeSource } from 'contentlayer2/source-files';
import remarkGfm from 'remark-gfm';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

// ── ARTIKEL ──────────────────────────────────────────────────────────────────

export const Artikel = defineDocumentType(() => ({
  name: 'Artikel',
  filePathPattern: 'artikel/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    excerpt: { type: 'string', required: true },
    publishedAt: { type: 'date', required: true },
    updatedAt: { type: 'date' },
    author: { type: 'string', required: true },
    authorSlug: { type: 'string', required: true },
    category: { type: 'string', required: true },
    categorySlug: { type: 'string', required: true },
    image: { type: 'string', required: true },
    imageAlt: { type: 'string', required: true },
    // Bildherkunft und KI-Kennzeichnung (analog Recipe/Streitfall, KAN-64).
    // imageSource: Klartext-Herkunft. imageAI: steuert die sichtbare Kennzeichnung
    // nach EU AI Act Art. 50 Abs. 4.
    imageSource: { type: 'string' },
    imageAI: { type: 'boolean', default: false },
    tags: { type: 'list', of: { type: 'string' } },
    featured: { type: 'boolean', default: false },
    readingTime: { type: 'number' }, // in minutes
    seoTitle: { type: 'string' },
    seoDescription: { type: 'string' },
    noindex: { type: 'boolean', default: false },
    // Frage-Antwort-Paare fuer den FAQ-Block und das FAQPage-Schema.
    // Nachgezogen am 03.09.2026: Cut, Vergleich, Streitfall und Fleischwissen
    // hatten das Feld, Artikel nicht — ein Artikel mit FAQ-Abschnitt lieferte
    // die Paare deshalb nur als Fliesstext, ohne Schema. Fuer AI-Suchen ist
    // genau dieses Format die zitierfaehige Einheit (docs/geo-llm-ranking-
    // factors.md), der Verlust war also kein kosmetischer.
    // Optional: Artikel ohne FAQ rendern den Block einfach nicht.
    faq: { type: 'json' },
    // ── Redaktionsvorbehalt (AI Act Art. 50 Abs. 4) ──────────────────────────
    // Die Befreiung von der KI-Kennzeichnungspflicht haengt daran, dass jeder
    // Entwurf geprueft und verantwortet wird. Damit das im Code pruefbar ist
    // und nicht nur in compliance/ai-act-einstufung.md steht, tragen Artikel
    // den Zustand selbst. Defaults sind bewusst „veroeffentlicht/geprueft":
    // der Altbestand kennt die Felder nicht und darf sich nicht veraendern.
    // Durchgesetzt von scripts/check-redaktionsvorbehalt.mjs (prebuild).
    status:   { type: 'enum', options: ['draft', 'review', 'published'], default: 'published' },
    reviewed: { type: 'boolean', default: true },
    // Wird beim Review gesetzt (docs/redaktionsplan-startseite.md, Prozess Schritt 2)
    // und dokumentiert, WANN geprueft wurde — fuer den Redaktionsvorbehalt der
    // relevante Nachweis neben dem WER (author).
    reviewedAt: { type: 'date' },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace('artikel/', ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/artikel/${doc._raw.flattenedPath.replace('artikel/', '')}`,
    },
    formattedDate: {
      type: 'string',
      resolve: (doc) =>
        format(parseISO(doc.publishedAt), 'd. MMMM yyyy', { locale: de }),
    },
  },
}));

// ── CUTS ─────────────────────────────────────────────────────────────────────

export const Cut = defineDocumentType(() => ({
  name: 'Cut',
  filePathPattern: 'cuts/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    excerpt: { type: 'string', required: true },
    publishedAt: { type: 'date', required: true },
    updatedAt: { type: 'date' },
    author: { type: 'string', required: true },
    authorSlug: { type: 'string', required: true },
    image: { type: 'string', required: true },
    imageAlt: { type: 'string', required: true },
    // Bildherkunft und KI-Kennzeichnung (analog Recipe/Streitfall, KAN-64).
    // imageSource: Klartext-Herkunft. imageAI: steuert die sichtbare Kennzeichnung
    // nach EU AI Act Art. 50 Abs. 4.
    imageSource: { type: 'string' },
    imageAI: { type: 'boolean', default: false },
    seoTitle: { type: 'string' },
    seoDescription: { type: 'string' },
    schemaType: { type: 'string', default: 'Article' },
    // Optional: FAQ-Paare {question, answer} für FAQPage-Schema (GEO/Rich Results).
    // Optional gehalten, damit bestehende Cuts ohne faq nicht brechen.
    faq: { type: 'json' },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace('cuts/', ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/cuts/${doc._raw.flattenedPath.replace('cuts/', '')}`,
    },
    formattedDate: {
      type: 'string',
      resolve: (doc) =>
        format(parseISO(doc.publishedAt), 'd. MMMM yyyy', { locale: de }),
    },
  },
}));

// ── METHODEN ─────────────────────────────────────────────────────────────────

export const Methode = defineDocumentType(() => ({
  name: 'Methode',
  filePathPattern: 'methoden/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    excerpt: { type: 'string', required: true },
    publishedAt: { type: 'date', required: true },
    updatedAt: { type: 'date' },
    author: { type: 'string', required: true },
    authorSlug: { type: 'string', required: true },
    image: { type: 'string', required: true },
    imageAlt: { type: 'string', required: true },
    // Bildherkunft und KI-Kennzeichnung (analog Recipe/Streitfall, KAN-64).
    // imageSource: Klartext-Herkunft. imageAI: steuert die sichtbare Kennzeichnung
    // nach EU AI Act Art. 50 Abs. 4.
    imageSource: { type: 'string' },
    imageAI: { type: 'boolean', default: false },
    difficulty: { type: 'enum', options: ['Einfach', 'Mittel', 'Fortgeschritten'], required: true },
    timeMinutes: { type: 'number' },
    seoTitle: { type: 'string' },
    seoDescription: { type: 'string' },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace('methoden/', ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/methoden/${doc._raw.flattenedPath.replace('methoden/', '')}`,
    },
    formattedDate: {
      type: 'string',
      resolve: (doc) =>
        format(parseISO(doc.publishedAt), 'd. MMMM yyyy', { locale: de }),
    },
  },
}));

// ── VERGLEICHE ────────────────────────────────────────────────────────────────

export const Vergleich = defineDocumentType(() => ({
  name: 'Vergleich',
  filePathPattern: 'vergleich/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    excerpt: { type: 'string', required: true },
    publishedAt: { type: 'date', required: true },
    updatedAt: { type: 'date' },
    author: { type: 'string', required: true },
    authorSlug: { type: 'string', required: true },
    image: { type: 'string', required: true },
    imageAlt: { type: 'string', required: true },
    // Bildherkunft und KI-Kennzeichnung (analog Recipe/Streitfall, KAN-64).
    // imageSource: Klartext-Herkunft. imageAI: steuert die sichtbare Kennzeichnung
    // nach EU AI Act Art. 50 Abs. 4.
    imageSource: { type: 'string' },
    imageAI: { type: 'boolean', default: false },
    testedCount: { type: 'number' },
    testDuration: { type: 'string' },
    seoTitle: { type: 'string' },
    seoDescription: { type: 'string' },
    faq: { type: 'json' },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace('vergleich/', ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/vergleich/${doc._raw.flattenedPath.replace('vergleich/', '')}`,
    },
    formattedDate: {
      type: 'string',
      resolve: (doc) =>
        format(parseISO(doc.publishedAt), 'd. MMMM yyyy', { locale: de }),
    },
  },
}));

// ── PERSOENLICHKEITEN ─────────────────────────────────────────────────────────

export const Persoenlichkeit = defineDocumentType(() => ({
  name: 'Persoenlichkeit',
  filePathPattern: 'persoenlichkeiten/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    excerpt: { type: 'string', required: true },
    publishedAt: { type: 'date', required: true },
    updatedAt: { type: 'date' },
    author: { type: 'string', required: true },
    authorSlug: { type: 'string', required: true },
    nationality: { type: 'string', required: true },
    category: { type: 'string', required: true },
    born: { type: 'string' },
    claim: { type: 'string', required: true },
    image: { type: 'string', required: true },
    imageAlt: { type: 'string', required: true },
    // Bildherkunft und KI-Kennzeichnung (analog Recipe/Streitfall, KAN-64).
    // imageSource: Klartext-Herkunft. imageAI: steuert die sichtbare Kennzeichnung
    // nach EU AI Act Art. 50 Abs. 4.
    imageSource: { type: 'string' },
    imageAI: { type: 'boolean', default: false },
    website: { type: 'string' },
    instagram: { type: 'string' },
    tags: { type: 'list', of: { type: 'string' } },
    featured: { type: 'boolean', default: false },
    sortOrder: { type: 'number', default: 99 },
    seoTitle: { type: 'string' },
    seoDescription: { type: 'string' },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace('persoenlichkeiten/', ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/persoenlichkeiten/${doc._raw.flattenedPath.replace('persoenlichkeiten/', '')}`,
    },
    formattedDate: {
      type: 'string',
      resolve: (doc) =>
        format(parseISO(doc.publishedAt), 'd. MMMM yyyy', { locale: de }),
    },
  },
}));

// ── GLOSSAR ───────────────────────────────────────────────────────────────────

export const Glossar = defineDocumentType(() => ({
  name: 'Glossar',
  filePathPattern: 'glossar/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title:           { type: 'string', required: true },
    slug:            { type: 'string', required: true },
    category:        { type: 'string', required: true },
    shortDefinition: { type: 'string', required: true },
    publishedAt:     { type: 'date',   required: true },
    seoTitle:        { type: 'string' },
    seoDescription:  { type: 'string' },
    // Wie beim Artikel-Typ: Defaults halten die 182 Altbestands-Begriffe
    // sichtbar, die die Felder nicht tragen. Neu erzeugte Eintraege schreibt
    // scripts/glossary-agent.mjs ausdruecklich als draft/false.
    status:          { type: 'enum', options: ['draft', 'review', 'published'], default: 'published' },
    reviewed:        { type: 'boolean', default: true },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (doc) => `/glossar/${doc._raw.flattenedPath.replace('glossar/', '')}`,
    },
    formattedDate: {
      type: 'string',
      resolve: (doc) =>
        format(parseISO(doc.publishedAt), 'd. MMMM yyyy', { locale: de }),
    },
  },
}));

// ── USA BBQ STILE ─────────────────────────────────────────────────────────────

export const UsaBbqStyle = defineDocumentType(() => ({
  name: 'UsaBbqStyle',
  filePathPattern: 'usa/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title:         { type: 'string', required: true },
    region:        { type: 'string', required: true },
    style:         { type: 'string', required: true },
    signatureDish: { type: 'string' },
    author:        { type: 'string', required: true },
    authorSlug:    { type: 'string', required: true },
    publishedAt:   { type: 'date',   required: true },
    excerpt:       { type: 'string', required: true },
    image:         { type: 'string', required: true },
    imageAlt:      { type: 'string', required: true },
    // Bildherkunft und KI-Kennzeichnung (analog Recipe/Streitfall, KAN-64).
    imageSource:   { type: 'string' },
    imageAI:       { type: 'boolean', default: false },
    seoTitle:      { type: 'string' },
    seoDescription:{ type: 'string' },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace('usa/', ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/usa-expedition/${doc._raw.flattenedPath.replace('usa/', '')}`,
    },
    formattedDate: {
      type: 'string',
      resolve: (doc) =>
        format(parseISO(doc.publishedAt), 'd. MMMM yyyy', { locale: de }),
    },
  },
}));

// ── REZEPTE ───────────────────────────────────────────────────────────────────

export const Recipe = defineDocumentType(() => ({
  name: 'Recipe',
  filePathPattern: 'rezepte/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title:          { type: 'string',  required: true },
    description:    { type: 'string',  required: true },
    publishedAt:    { type: 'date',    required: true },
    updatedAt:      { type: 'date' },
    author:         { type: 'string',  required: true },
    authorSlug:     { type: 'string',  required: true },
    image:          { type: 'string',  required: true },
    imageAlt:       { type: 'string',  required: true },
    // Redaktionsvorbehalt — gleiche Felder und Defaults wie Artikel/Streitfall.
    // Die Defaults halten den gesamten Altbestand (118 Rezepte ohne diese Felder)
    // unveraendert sichtbar; der Rezept-Agent setzt sie ab 13.09.2026 explizit.
    status:         { type: 'enum', options: ['draft', 'review', 'published'], default: 'published' },
    reviewed:       { type: 'boolean', default: true },
    reviewedAt:     { type: 'date' },
    heroImage:      { type: 'string' },   // optional: dramatischer Hero-Look (Eyecatcher); Galerie/Karten nutzen image
    imagePrompt:    { type: 'string' },   // DEPRECATED: Relikt der rein generativen Bild-Pipeline.
                                          // Nicht mehr befuellen — Bildherkunft gehoert in imageSource.
    // Bildherkunft und KI-Kennzeichnung. Ersetzt imagePrompt: Nicht mehr "wie das
    // Bild erzeugt werden soll", sondern "woher es stammt und was daran erzeugt ist".
    // Grundlage fuer die pruefbare Aussage: Cut-Fotos ausnahmslos echt.
    imageSource:    { type: 'string' },
    imageAI:        { type: 'boolean', default: false },
    // Verweis auf den Cut-Slug aus src/lib/cuts-catalog.ts — verbindet Rezept
    // und Cut-Atlas und ist die Grundlage fuer den geplanten Cut-Berater.
    cut:            { type: 'string' },
    // Freitext-Anzeige der Garmethode ("Parrilla, direkt"). Gefiltert und sortiert
    // wird ueber cookingMethod, gelesen wird cookingDetail. Siehe
    // docs/cookingmethod-normalisierung.md
    cookingDetail:  { type: 'string' },
    prepTime:       { type: 'string',  required: true },
    cookTime:       { type: 'string',  required: true },
    totalTime:      { type: 'string',  required: true },
    servings:       { type: 'number',  required: true },
    calories:       { type: 'number' },
    kategorie:      { type: 'enum',    options: ['fleisch', 'fisch', 'beilagen', 'saucen-rubs', 'desserts', 'wine-spirits'], required: true },
    meatType:       { type: 'string',  required: true },
    cookingMethod:  { type: 'string',  required: true },
    land:           { type: 'string' },   // Herkunft/Land (strukturiert, für Schema.org + Filter)
    video:          { type: 'string' },   // optional: Video-URL — Zukunftssicherung (Short-Video)
    difficulty:     { type: 'enum',    options: ['Einfach', 'Mittel', 'Fortgeschritten', 'Profi'], required: true },
    keywords:       { type: 'list',    of: { type: 'string' } },
    equipment:      { type: 'list',    of: { type: 'string' } },
    ingredients:    { type: 'json',    required: true },
    steps:          { type: 'json',    required: true },
    seoTitle:       { type: 'string' },
    seoDescription: { type: 'string' },
    whiskeyName:    { type: 'string' },
    whiskeyType:    { type: 'string' },
    whiskeyProfile: { type: 'string' },
    whiskeyLink:    { type: 'string' },
    wineName:       { type: 'string' },
    wineType:       { type: 'string' },
    wineProfile:    { type: 'string' },
    wineLink:       { type: 'string' },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => {
        const parts = doc._raw.flattenedPath.split('/');
        return parts[parts.length - 1];
      },
    },
    url: {
      type: 'string',
      resolve: (doc) => {
        const parts = doc._raw.flattenedPath.split('/');
        const filename = parts[parts.length - 1];
        return `/rezepte/${doc.kategorie}/${filename}`;
      },
    },
    formattedDate: {
      type: 'string',
      resolve: (doc) =>
        format(parseISO(doc.publishedAt), 'd. MMMM yyyy', { locale: de }),
    },
  },
}));

// ── DIPLOM-LEKTIONEN (Grillmeister-Ausbildung) ───────────────────────────────

export const DiplomLektion = defineDocumentType(() => ({
  name: 'DiplomLektion',
  filePathPattern: 'diplom-lektionen/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title:          { type: 'string', required: true },
    stufe:          { type: 'number', required: true },   // 1–5
    level:          { type: 'number', required: true },   // konkretes Diplom-Level (1–10)
    order:          { type: 'number', required: true },   // Reihenfolge innerhalb der Stufe
    lektionSlug:    { type: 'string', required: true },
    excerpt:        { type: 'string', required: true },
    merksatz:       { type: 'string', required: true },   // prüfungsrelevant, 1 Satz
    publishedAt:    { type: 'date',   required: true },
    seoTitle:       { type: 'string' },
    seoDescription: { type: 'string' },
    // Redaktionsvorbehalt (08.09.2026): Lektionen entstehen als KI-Entwurf und
    // sind erst veroeffentlichungsfaehig, wenn Uwe sie gelesen hat — daran haengt
    // die AI-Act-Einstufung (Art. 50 Abs. 4, compliance/ai-act-einstufung.md).
    // Defaults published/true, damit die 30 Altlektionen unveraendert bleiben;
    // Neues traegt status: draft + reviewed: false, bis die Freigabe da ist.
    status:     { type: 'enum', options: ['draft', 'review', 'published'], default: 'published' },
    reviewed:   { type: 'boolean', default: true },
    reviewedAt: { type: 'date' },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => {
        const parts = doc._raw.flattenedPath.split('/');
        return parts[parts.length - 1];
      },
    },
    url: {
      type: 'string',
      resolve: (doc) => `/diplome/lernen/stufe-${doc.stufe}/${doc.lektionSlug}`,
    },
    formattedDate: {
      type: 'string',
      resolve: (doc) =>
        format(parseISO(doc.publishedAt), 'd. MMMM yyyy', { locale: de }),
    },
  },
}));

// ── SOURCE ────────────────────────────────────────────────────────────────────

// ── GRÜNDUNG-SPRINT MODULE (GF3 „Das ehrliche System" — Lehrinhalt) ───────────

export const SprintModul = defineDocumentType(() => ({
  name: 'SprintModul',
  filePathPattern: 'gruender-schmiede/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title:          { type: 'string', required: true },
    order:          { type: 'number', required: true },   // Reihenfolge in der Modulreihe
    excerpt:        { type: 'string', required: true },
    dauer:          { type: 'string', required: true },   // z. B. "6 Min"
    publishedAt:    { type: 'date',   required: true },
    seoTitle:       { type: 'string' },
    seoDescription: { type: 'string' },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace('gruender-schmiede/', ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/gruender-schmiede/lernen/${doc._raw.flattenedPath.replace('gruender-schmiede/', '')}`,
    },
  },
}));


// ── EIGENREGIE (19.09.2026, Konzept freigegeben) ─────────────────────────────
// Kurs hinter requireCourseAccess('eigenregie') — Digistore 695900.
export const EigenregieModul = defineDocumentType(() => ({
  name: 'EigenregieModul',
  filePathPattern: 'eigenregie/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title:       { type: 'string', required: true },
    order:       { type: 'number', required: true },
    excerpt:     { type: 'string', required: true },
    dauer:       { type: 'string', required: true },
    lernziel:    { type: 'string', required: true },
    ergebnis:    { type: 'string', required: true },
    publishedAt: { type: 'date',   required: true },
    // Redaktionsvorbehalt: Verkauf erst, wenn ALLE Module published + reviewed (src/app/eigenregie/page.tsx).
    status:      { type: 'enum', options: ['draft', 'review', 'published'], default: 'draft' },
    reviewed:    { type: 'boolean', default: false },
    reviewedAt:  { type: 'date' },
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath.replace('eigenregie/', '') },
    url:  { type: 'string', resolve: (doc) => `/eigenregie/lernen/${doc._raw.flattenedPath.replace('eigenregie/', '')}` },
  },
}));

// ── STREITFAELLE ──────────────────────────────────────────────────────────────
// Wiederkehrendes Format fuer strittige Grillfragen. Kern des Typs sind die drei
// Felder `streitfrage`, `entscheidung` und `merksatz`: Sie stehen bewusst im
// Frontmatter und nicht im Fliesstext, damit die Entscheidung auf der
// Uebersichtsseite, im Schema-Markup und in Verweisen aus Rezepten wiederverwendet
// werden kann. Ein Streitfall ohne `entscheidung` ist ein Entwurf — die Detailseite
// zeigt an der Stelle einen sichtbaren Platzhalter statt stillschweigend nichts.
export const Streitfall = defineDocumentType(() => ({
  name: 'Streitfall',
  filePathPattern: 'streitfaelle/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    excerpt: { type: 'string', required: true },
    publishedAt: { type: 'date', required: true },
    updatedAt: { type: 'date' },
    author: { type: 'string', required: true },
    authorSlug: { type: 'string', required: true },
    image: { type: 'string', required: true },
    imageAlt: { type: 'string', required: true },
    imageSource: { type: 'string' },
    imageAI: { type: 'boolean', default: false },
    streitfrage: { type: 'string', required: true },
    entscheidung: { type: 'string' },
    merksatz: { type: 'string', required: true },
    istMythos: { type: 'boolean', default: false },
    // Optionale Umfrage unter dem Beitrag: { frage, optionen: [{ key, label }] }.
    // Fehlt das Feld, erscheint kein Block — nicht jeder Streitfall braucht einen.
    umfrage: { type: 'json' },
    seoTitle: { type: 'string' },
    seoDescription: { type: 'string' },
    faq: { type: 'json' },
    // ── Redaktionsvorbehalt (AI Act Art. 50 Abs. 4) ──────────────────────────
    // Nachgezogen am 03.09.2026. Streitfaelle hatten diese Felder nicht — ein
    // KI-Entwurf, der in content/streitfaelle/ landet, waere damit SOFORT live
    // gewesen: kein Gate haelt ihn zurueck, und es gibt keinen Ort, an dem die
    // menschliche Pruefung dokumentiert wird. Genau daran haengt aber die
    // Befreiung von der KI-Kennzeichnungspflicht fuer Texte
    // (compliance/ai-act-einstufung.md Punkt 3). Aufgefallen an einem
    // Pipeline-Entwurf fuer Frage #11, der als erster Streitfall aus der
    // automatisierten Content-Pipeline kam.
    // Defaults wie bei Artikel und Fleischwissen bewusst
    // „veroeffentlicht/geprueft": die acht bestehenden Streitfaelle kennen die
    // Felder nicht und duerfen sich nicht veraendern.
    status:   { type: 'enum', options: ['draft', 'review', 'published'], default: 'published' },
    reviewed: { type: 'boolean', default: true },
    reviewedAt: { type: 'date' },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace('streitfaelle/', ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/streitfaelle/${doc._raw.flattenedPath.replace('streitfaelle/', '')}`,
    },
    formattedDate: {
      type: 'string',
      resolve: (doc) =>
        format(parseISO(doc.publishedAt), 'd. MMMM yyyy', { locale: de }),
    },
  },
}));

// ── FLEISCHWISSEN ─────────────────────────────────────────────────────────────
// Dreiteilige Serie zur Fleischherkunft (Produktionssysteme, Fuetterung,
// Schlachtstress). Eigener Typ statt `Artikel` wegen der Position in der
// Reihenfolge (`serieTeil`/`serieGesamt`) fuer die Vor/Zurueck-Navigation.
//
// ALLE DREI TEILE SIND SOFORT LIVE (Uwe, 30.08.2026). Eine frueher gebaute
// Staffelung nach `publishedAt` ist auf seine ausdrueckliche Ansage hin wieder
// ausgebaut worden. `newsletterAt` haelt nur fest, wann der jeweilige Teil als
// Newsletter-Aufmacher rausgeht — es ist DOKUMENTATION, kein Schalter. Wer
// daraus eine Sichtbarkeitslogik baut, dreht die Entscheidung still zurueck.
//
// `image`/`imageAlt` sind hier OPTIONAL, anders als bei Artikel/Cut/Methode:
// Die Hero-Motive liefert Uwe nach. Ein Pflichtfeld haette entweder einen
// erfundenen Pfad oder eine kaputte Kachel erzwungen. Layout und OG-Bild
// haben deshalb einen Fallback.
export const Fleischwissen = defineDocumentType(() => ({
  name: 'Fleischwissen',
  filePathPattern: 'fleischwissen/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    excerpt: { type: 'string', required: true },
    publishedAt: { type: 'date', required: true },
    updatedAt: { type: 'date' },
    // Rein dokumentarisch: Newsletter-Aufmacher-Termin. KEIN Sichtbarkeitsfilter.
    newsletterAt: { type: 'date' },
    author: { type: 'string', required: true },
    authorSlug: { type: 'string', required: true },
    // Optional — siehe Kommentar oben.
    image: { type: 'string' },
    imageAlt: { type: 'string' },
    imageSource: { type: 'string' },
    imageAI: { type: 'boolean', default: false },
    serieTeil: { type: 'number', required: true },
    serieGesamt: { type: 'number', required: true },
    tags: { type: 'list', of: { type: 'string' } },
    readingTime: { type: 'number' },
    seoTitle: { type: 'string' },
    seoDescription: { type: 'string' },
    faq: { type: 'json' },
    // Redaktionsvorbehalt wie bei Artikel (AI Act Art. 50 Abs. 4).
    status: { type: 'enum', options: ['draft', 'review', 'published'], default: 'published' },
    reviewed: { type: 'boolean', default: true },
    reviewedAt: { type: 'date' },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace('fleischwissen/', ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/fleischwissen/${doc._raw.flattenedPath.replace('fleischwissen/', '')}`,
    },
    formattedDate: {
      type: 'string',
      resolve: (doc) =>
        format(parseISO(doc.publishedAt), 'd. MMMM yyyy', { locale: de }),
    },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  // Datendateien (kein Document-Typ) von der Doc-Klassifizierung ausnehmen,
  // sonst meldet Contentlayer sie als "problem" → Warn-Rauschen, das echte
  // Build-Fehler verdeckt (siehe KAN-26: 33 stille Rezept-404s).
  contentDirExclude: ['glossar/terms.json', '_archiv'],
  documentTypes: [Artikel, Cut, Methode, Vergleich, Streitfall, Fleischwissen, Persoenlichkeit, Glossar, UsaBbqStyle, Recipe, DiplomLektion, SprintModul, EigenregieModul],
  mdx: {
    // GitHub Flavored Markdown — sonst rendern Markdown-Tabellen als roher
    // Pipe-Text statt als <table> (KAN-28). Aktiviert auch Task-Lists/Autolinks.
    remarkPlugins: [remarkGfm],
  },
});
