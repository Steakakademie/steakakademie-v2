// ── BBQ-News Datenquelle ─────────────────────────────────────────────────────
// Liest freigegebene Entwürfe (status='approved') aus Supabase `content_drafts`,
// gefiltert auf die /bbq-news zugeordneten Kategorien (siehe content-routing.ts).
//
// ISR-kompatibel: nutzt einen Cookie-freien Anon-Client (keine dynamische
// Server-Rendering-Erzwingung). RLS-Policy `read_approved` erlaubt anonymen
// SELECT auf status='approved'.
//
// 28.09.2026: Die frueheren FALLBACK_NEWS (sechs hartkodierte Meldungen vom
// Mai 2026) sind entfernt. Sie standen vier Monate unveraendert auf Startseite
// und /bbq-news, weil kein Scout-Entwurf freigegeben war. Jetzt wird der Strom
// immer mit den neuesten freigegebenen Plattform-Inhalten (Artikel, Cuts,
// Methoden, Rezepte …) zusammengefuehrt und nach Datum sortiert — die News
// laufen damit im selben Takt wie der Rest der Seite. Freigegebene Scout-News
// stehen dazwischen, sobald sie da sind; veraltete rutschen von selbst nach hinten.

import { createClient } from '@supabase/supabase-js';
import { ROUTE_CATEGORIES, type ContentCategory } from '@/lib/content-routing';
import { getRedaktionelleNeuzugaenge, type Neuzugang } from '@/lib/startseiten-artikel';

export type NewsRegion = 'USA' | 'Deutschland' | 'International';

export interface NewsItem {
  id: string;
  region: NewsRegion;
  category: string;
  title: string;
  summary: string;
  date: string;     // Anzeige, z.B. "27. Mai 2026"
  isoDate: string;  // ISO für Schema
  source?: string;
  href?: string;
  featured?: boolean;
  image?: string;   // optional — fehlt → markenkonformer Smoke-Placeholder
  /** Nur bei Live-Daten gesetzt: eigener Pfad unter /bbq-news/<slug>. */
  slug?: string;
}

/** Vollstaendiger News-Beitrag fuer die Detailseite /bbq-news/[slug]. */
export interface NewsArticle extends NewsItem {
  slug: string;
  /** Markdown aus content_drafts.content_body. */
  body: string;
}

const BBQ_NEWS_CATEGORIES = ROUTE_CATEGORIES['/bbq-news'] ?? [];

// Kategorie → Anzeige-Region
const CATEGORY_REGION: Partial<Record<ContentCategory, NewsRegion>> = {
  usa: 'USA',
  'championship-2026': 'Deutschland',
  'general-bbq': 'International',
  argentinien: 'International',
  brasilien: 'International',
  japan: 'International',
  korea: 'International',
  suedafrika: 'International',
  thailand: 'International',
  tuerkei: 'International',
  spanien: 'International',
};

// Kategorie → Anzeige-Label für den Chip
const CATEGORY_LABEL: Partial<Record<ContentCategory, string>> = {
  usa: 'USA',
  'championship-2026': 'Meisterschaft',
  'general-bbq': 'BBQ',
  argentinien: 'Argentinien',
  brasilien: 'Brasilien',
  japan: 'Japan',
  korea: 'Korea',
  suedafrika: 'Südafrika',
  thailand: 'Thailand',
  tuerkei: 'Türkei',
  spanien: 'Spanien',
};

const DE_DATE = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

interface DraftRow {
  id: string;
  category: string;
  title: string;
  slug: string;
  seo_description: string | null;
  content_body: string;
  generated_at: string;
}

function rowToNewsItem(row: DraftRow): NewsItem {
  const cat = row.category as ContentCategory;
  const d = new Date(row.generated_at);
  const summary =
    (row.seo_description && row.seo_description.trim()) ||
    `${row.content_body.replace(/[#*_>`\n]/g, ' ').trim().slice(0, 180)}…`;
  return {
    id: row.id,
    region: CATEGORY_REGION[cat] ?? 'International',
    category: CATEGORY_LABEL[cat] ?? 'BBQ',
    title: row.title,
    summary,
    date: DE_DATE.format(d),
    isoDate: d.toISOString().slice(0, 10),
    source: 'Steakakademie Redaktion',
    // Eigene URL je Beitrag (03.09.2026). Bis dahin lebten die News nur auf der
    // Hub-Seite — fuer Google und AI-Suche unsichtbar, die Sitemap fuehrte genau
    // eine /bbq-news-URL. Der Fallback unten bekommt bewusst KEINEN href: er hat
    // keinen Textkoerper, eine Detailseite waere leer.
    slug: row.slug,
    href: row.slug ? `/bbq-news/${row.slug}` : undefined,
  };
}

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || BBQ_NEWS_CATEGORIES.length === 0) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Ein freigegebener Beitrag ueber seinen Slug — oder null (404). */
export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  const supabase = anonClient();
  if (!supabase || !slug) return null;
  try {
    const { data, error } = await supabase
      .from('content_drafts')
      .select('id, category, title, slug, seo_description, content_body, generated_at')
      .eq('status', 'approved')
      .eq('slug', slug)
      .in('category', BBQ_NEWS_CATEGORIES)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as DraftRow;
    return { ...rowToNewsItem(row), slug: row.slug, body: row.content_body ?? '' };
  } catch {
    return null;
  }
}

/** Alle freigegebenen Slugs — fuer generateStaticParams und die Sitemap. */
export async function getNewsSlugs(limit = 200): Promise<string[]> {
  const supabase = anonClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('content_drafts')
      .select('slug')
      .eq('status', 'approved')
      .in('category', BBQ_NEWS_CATEGORIES)
      .not('slug', 'is', null)
      .order('generated_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((r) => (r as { slug: string }).slug).filter(Boolean);
  } catch {
    return [];
  }
}

/** Freigegebene Scout-News aus Supabase — [] ohne Env, bei Fehler oder ohne Daten. */
async function getLiveNews(limit: number): Promise<NewsItem[]> {
  const supabase = anonClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('content_drafts')
      .select('id, category, title, slug, seo_description, content_body, generated_at')
      .eq('status', 'approved')
      .in('category', BBQ_NEWS_CATEGORIES)
      .order('generated_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => rowToNewsItem(row as DraftRow));
  } catch {
    return [];
  }
}

/** Plattform-Neuzugang → News-Eintrag. Link fuehrt auf den Inhalt selbst, keine /bbq-news-Detailseite. */
function neuzugangToNewsItem(n: Neuzugang): NewsItem {
  const a = n.article;
  return {
    id: `neu-${n.type}-${a.slug}`,
    region: n.type === 'UsaBbqStyle' ? 'USA' : 'Deutschland',
    category: a.category,
    title: a.title,
    summary: a.excerpt,
    date: a.formattedDate,
    isoDate: n.isoDate,
    source: 'Steakakademie Redaktion',
    href: a.url,
    image: a.image,
  };
}

export interface NewsOptionen {
  /** URLs, die auf der aufrufenden Seite schon stehen (Startseite: Aufmacher, Puls) — nicht doppelt zeigen. */
  ausschliessen?: (string | undefined)[];
  /** Maximale Anzahl Eintraege (Default 12). */
  limit?: number;
}

/**
 * BBQ-News-Strom: freigegebene Scout-News + neueste freigegebene Plattform-Inhalte,
 * gemeinsam nach Datum sortiert (neueste zuerst). Der erste Eintrag ist `featured`.
 * Bei gleichem Datum stehen Scout-News vor Plattform-Inhalten (stabile Sortierung).
 */
export async function getNewsItems(optionen: NewsOptionen = {}): Promise<NewsItem[]> {
  const limit = optionen.limit ?? 12;
  const raus = new Set(optionen.ausschliessen?.filter(Boolean) as string[] | undefined);

  const live = await getLiveNews(limit);
  const neu = getRedaktionelleNeuzugaenge(limit + raus.size)
    .map(neuzugangToNewsItem)
    .filter((n) => !n.href || !raus.has(n.href));

  return [...live, ...neu]
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate))
    .slice(0, limit)
    .map((n, i) => ({ ...n, featured: i === 0 }));
}
