// ── Content-Routing — Single Source of Truth ────────────────────────────────
// Verbindet die autonome Content-Pipeline (scripts/cron-scout.mjs → Supabase
// `content_drafts`) mit den Ziel-Seiten der Website.
//
// JEDER Agent taggt seinen Output mit einer `category`. Diese Datei bestimmt,
// WO dieser Content erscheint. Pipeline-Skript und Next.js-Seiten lesen
// dieselbe Map — so weiß jeder Agent, wohin er liefern soll.
//
// Status-Flow in `content_drafts`: draft → review → approved → (live)

export type ContentCategory =
  | 'championship-2026'
  | 'queen-of-fire'
  | 'pflanzlich'
  | 'usa'
  | 'argentinien'
  | 'brasilien'
  | 'japan'
  | 'korea'
  | 'suedafrika'
  | 'thailand'
  | 'tuerkei'
  | 'spanien'
  | 'equipment'
  | 'general-bbq'
  | 'saison';

export interface RouteTarget {
  /** Ziel-Seite, auf der dieser Content erscheint. */
  route: string;
  /** Menschlich lesbares Label für Redaktion/Logs. */
  label: string;
  /** Welcher Agent/welche Pipeline-Rolle liefert hierher. */
  agent: 'news-scout' | 'queen-of-fire' | 'pflanzlich' | 'equipment';
}

// Kategorie → Ziel-Seite. Mehrere Kategorien dürfen auf dieselbe Seite zeigen.
export const CATEGORY_ROUTES: Record<ContentCategory, RouteTarget> = {
  // ── BBQ-News (USA/Deutschland/International) ──────────────────────────────
  'championship-2026': { route: '/bbq-news', label: 'Meisterschaften 2026', agent: 'news-scout' },
  'general-bbq':       { route: '/bbq-news', label: 'BBQ allgemein',         agent: 'news-scout' },
  usa:                 { route: '/bbq-news', label: 'USA',                   agent: 'news-scout' },
  argentinien:         { route: '/bbq-news', label: 'Argentinien',           agent: 'news-scout' },
  brasilien:           { route: '/bbq-news', label: 'Brasilien',             agent: 'news-scout' },
  japan:               { route: '/bbq-news', label: 'Japan',                 agent: 'news-scout' },
  korea:               { route: '/bbq-news', label: 'Korea',                 agent: 'news-scout' },
  suedafrika:          { route: '/bbq-news', label: 'Südafrika',             agent: 'news-scout' },
  thailand:            { route: '/bbq-news', label: 'Thailand',              agent: 'news-scout' },
  tuerkei:             { route: '/bbq-news', label: 'Türkei',                agent: 'news-scout' },
  spanien:             { route: '/bbq-news', label: 'Spanien',               agent: 'news-scout' },
  // Saison-Berichte (scripts/saison-grow.mjs). Bis 29.09.2026 fehlte die Kategorie
  // hier — freigegebene Saison-Beitraege erschienen auf keiner Seite.
  saison:              { route: '/bbq-news', label: 'Saison',                agent: 'news-scout' },

  // ── Grillstil — Frauen & Lifestyle ───────────────────────────────────────
  'queen-of-fire':     { route: '/grillstil', label: 'Queen of Fire',        agent: 'queen-of-fire' },

  // ── Pflanzlich & Vegan ───────────────────────────────────────────────────
  pflanzlich:          { route: '/pflanzlich', label: 'Pflanzlich & Vegan',  agent: 'pflanzlich' },

  // ── Ausrüstung / Tests ───────────────────────────────────────────────────
  equipment:           { route: '/kategorie/ausruestung', label: 'Ausrüstung', agent: 'equipment' },
};

// Umgekehrte Sicht: Seite → akzeptierte Kategorien (für Supabase-Queries der Seite).
export const ROUTE_CATEGORIES: Record<string, ContentCategory[]> = Object.entries(
  CATEGORY_ROUTES,
).reduce((acc, [cat, target]) => {
  (acc[target.route] ??= []).push(cat as ContentCategory);
  return acc;
}, {} as Record<string, ContentCategory[]>);

/** Ziel-Route für eine Kategorie (Fallback: BBQ-News). */
export function routeForCategory(category: string): string {
  return CATEGORY_ROUTES[category as ContentCategory]?.route ?? '/bbq-news';
}
