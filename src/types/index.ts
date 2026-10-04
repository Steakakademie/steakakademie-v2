// ── NAVIGATION ───────────────────────────────────────────────────────────────

export interface NavCategory {
  name: string;
  slug: string;
  subcategories?: { name: string; slug: string }[];
}

// ── PRODUCTS / AFFILIATE ─────────────────────────────────────────────────────

export type AffiliateProvider =
  | 'amazon'
  | 'otto-gourmet'
  | 'santosgrills'
  | 'grillfuerst'
  | 'ankerkraut'
  | 'albers'
  | 'meater-direct'
  | 'dreisechzig-bbq'
  | 'grill-experte'
  | 'banggood'
  | 'burnhard'
  | 'other';

// ── AFFILIATE-PROGRAMME ──────────────────────────────────────────────────────
// Partnerprogramme als first-class Entität. Produkte verweisen über ihr
// provider-Feld auf das Programm (program.providers). Quelle: products/affiliate-programs.yaml
export type AffiliateProgramStatus =
  | 'planned'   // geplant — noch nicht beworben
  | 'applied'   // beworben — Freigabe ausstehend
  | 'active';   // freigegeben & live im Einsatz

export interface AffiliateProgram {
  id: string;
  name: string;
  /** Abrechnungs-/Vermittlungsnetzwerk, z.B. "AWIN", "TradeTracker", "eigenes Programm" */
  network: string;
  /** AffiliateProvider-IDs, die zu diesem Programm gehören */
  providers: AffiliateProvider[];
  commission: string;        // z.B. "bis 8 %"
  cookie: string;            // z.B. "30 Tage"
  avgCartEur?: number | null;
  status: AffiliateProgramStatus;
  applyUrl?: string;         // Bewerbungs-/Programm-URL
  focus?: string;            // Sortiment/Schwerpunkt
  /** Erlaubte Kanäle laut Programmregeln */
  channels?: { blog?: boolean; socialOrganic?: boolean; paidAds?: boolean | 'regeln-pruefen' };
  note?: string;
  disclosureNote?: string;   // Pflicht-Hinweistext für die Disclosure-Seite
}

export type ProductCategory =
  | 'thermometer'
  | 'grill'
  | 'smoker'
  | 'messer'
  | 'zubehoer'
  | 'fleisch'
  | 'gewuerze'
  | 'sous-vide'
  | 'buecher'
  | 'oberhitzegrill'
  | 'dry-ager'
  | 'kuechenmaschine';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number; // EUR
  priceMin?: number;
  priceMax?: number;
  affiliateUrl: string;
  provider: AffiliateProvider;
  amazonAsin?: string;
  rating?: number;
  ratingCount?: number;
  image?: string;
  /** Von PA-API oder Hersteller geladene Bild-URL (via products/images.json) */
  imageUrl?: string;
  /**
   * "official"   = Lizenziertes Bild (Hersteller/PA-API/eigenes Foto) — keine Kennzeichnung
   * "symbolic"   = KI-generiertes oder generisches Symbolbild — "Symbolbild"-Badge wird angezeigt
   * Default wenn ungesetzt: "official"
   */
  imageType?: 'official' | 'symbolic';
  imageAlt?: string;
  description?: string;
  pros?: string[];
  cons?: string[];
  /** Redaktionelle Einordnung nach Datenlage, z. B. "Unsere Auswahl",
   *  "Preis-Leistung" — nie ein Testurteil (kein „…sieger“). */
  badge?: string;
  /** Für Messer-Kategorie: premium | damast | mittelklasse | bbq-spezial */
  segment?: string;
  lastChecked: string; // ISO date
  recommended?: boolean;
}

// ── AUTHORS ──────────────────────────────────────────────────────────────────

export interface Author {
  name: string;
  slug: string;
  avatar: string;
  bio: string;
  shortBio: string;
  expertise: string[];
  statsLabel?: string; // "15+ Jahre Grillpraxis"
  linkedIn?: string;
  jobTitle?: string;        // E-E-A-T: echte Rolle (z.B. "Gründer & Profi-Koch")
  credential?: string;      // E-E-A-T: Qualifikation → schema hasCredential
  sameAs?: string[];        // verifizierende Profile (Person)
  realPerson?: boolean;     // echte Person (vs. Avatar-Persona)
}

// ── ARTICLE CARD ─────────────────────────────────────────────────────────────

export type ArticleCardVariant = 'hero' | 'medium' | 'small' | 'horizontal';

export interface ArticleMeta {
  slug: string;
  url: string;
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  category: string;
  categorySlug: string;
  author: string;
  authorSlug: string;
  formattedDate: string;
  readingTime?: number;
  featured?: boolean;
}
