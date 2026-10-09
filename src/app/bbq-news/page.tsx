import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Globe } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BuyingGuideBlock from '@/components/affiliate/BuyingGuideBlock';
import { getNewsItems, getScoutNews, type NewsItem, type NewsRegion } from '@/lib/bbq-news';
import { getRecommendedProducts } from '@/lib/products';
import { verantwortungsangabe } from '@/lib/pruefnachweis';
import {
  FeatureHero,
  SecondaryFeature,
  CompactItem,
  TopicBand,
} from '@/components/news/NewsLayout';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'BBQ-News — Aktuelles aus der Grillszene',
  description:
    'Frische News aus der Grillwelt: Trends aus den USA, Entwicklungen in Deutschland, neue Techniken, Wettbewerbe und Produkte. Kuratiert von der Steakakademie.',
  alternates: { canonical: 'https://steakakademie.de/bbq-news' },
  openGraph: {
    title: 'BBQ-News — Grillszene USA & Deutschland',
    description:
      'Trends, Techniken und Produkte aus der internationalen BBQ-Welt — kuratiert und eingeordnet.',
    url: 'https://steakakademie.de/bbq-news',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', creator: '@steakakademie' },
};

function buildItemListSchema(items: NewsItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'BBQ-News — Grillszene USA & Deutschland',
    itemListElement: items.map((n, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        // Nur Scout-Meldungen (eigene /bbq-news/<slug>-Seite) sind NewsArticle;
        // eingestreute Plattform-Inhalte (Rezept, Cut, Artikel) sind Article.
        '@type': n.slug ? 'NewsArticle' : 'Article',
        headline: n.title,
        ...(n.href ? { url: `https://steakakademie.de${n.href}` } : {}),
        datePublished: n.isoDate,
        description: n.summary,
        author: { '@type': 'Organization', name: 'Steakakademie' },
      },
    })),
  };
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://steakakademie.de' },
    { '@type': 'ListItem', position: 2, name: 'BBQ-News', item: 'https://steakakademie.de/bbq-news' },
  ],
};

const REGION_ORDER: NewsRegion[] = ['USA', 'Deutschland', 'International'];

export default async function BbqNewsPage() {
  const [newsItems, scoutNews] = await Promise.all([getNewsItems(), getScoutNews()]);
  // Nur die Meldungen, die oben nicht ohnehin stehen — sonst doppelt verlinkt.
  const imStrom = new Set(newsItems.map((n) => n.href).filter(Boolean));
  const archiv = scoutNews.filter((n) => n.href && !imStrom.has(n.href));

  const featured = newsItems.find((n) => n.featured) ?? newsItems[0];
  const rest = newsItems.filter((n) => n.id !== featured?.id);

  const mixedMain = rest[0];
  const mixedList = rest.slice(1, 4);   // Rail „Weitere Meldungen" (kein Lesezaehler vorhanden)
  const bandItems = rest.slice(4);

  const affiliate = getRecommendedProducts(1)[0];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildItemListSchema(newsItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Header />

      <main>
        {/* ── Page-Header ─────────────────────────────────────────────── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <nav className="text-xs font-sans text-text-muted mb-5 flex items-center gap-1.5">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={12} />
            <span className="text-text-secondary">BBQ-News</span>
          </nav>
          <span className="category-label mb-3 block">Aktuelles aus der Grillszene</span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-text-light leading-[1.1] mb-4">
            BBQ-News
          </h1>
          <p className="font-body text-lg text-text-secondary max-w-2xl leading-relaxed">
            Was bewegt die Grillwelt? Trends aus den USA, Entwicklungen in Deutschland,
            neue Techniken und Produkte — kuratiert, eingeordnet, ohne Clickbait.
          </p>
          {/* 03.10.2026: Der Strom mischt freigegebene Scout-News mit Plattform-
              Inhalten (Artikel, Cuts, Rezepte …). Fuer diese Mischung gibt es
              keinen gemeinsamen Pruefnachweis — die Zeile nennt deshalb die
              Verantwortung, nicht eine Pruefung (src/lib/pruefnachweis.ts). */}
          <p className="font-sans text-xs text-text-muted mt-3 max-w-2xl">
            Hinweis: Beiträge werden KI-gestützt erstellt und aufbereitet und {verantwortungsangabe()}.
          </p>
        </section>

        {/* ── Aufmacher ──────────────────────────────────────────────── */}
        {featured && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <FeatureHero item={featured} />
          </section>
        )}

        {/* ── Mixed-Density: Sekundär-Feature + Rail „Weitere Meldungen" ─ */}
        {mixedMain && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-14">
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12">
              <SecondaryFeature item={mixedMain} />
              {mixedList.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-[3px] bg-brand-fire" />
                    {/* 03.10.2026: hiess „Meistgelesen" — die Liste ist rest.slice(1, 4), ein Aufrufzaehler existiert nicht. */}
                    <h2 className="font-serif text-xl font-bold text-text-light">Weitere Meldungen</h2>
                  </div>
                  <div className="section-divider mb-2" />
                  {mixedList.map((it, i) => <CompactItem key={it.id} item={it} rank={i + 1} />)}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Nativer Affiliate-Block ────────────────────────────────── */}
        {affiliate && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-14">
            <p className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-text-muted mb-3">
              Empfehlung der Redaktion
            </p>
            <BuyingGuideBlock
              product={affiliate}
              title={`Passend zur Saison: ${affiliate.name}`}
              summary="Worauf es bei der Anschaffung wirklich ankommt — unsere Einordnung für ambitionierte Griller."
            />
          </section>
        )}

        {/* ── Themen-Bänder nach Region ──────────────────────────────── */}
        {REGION_ORDER.map((region, i) => (
          <TopicBand
            key={region}
            region={region}
            items={bandItems.filter((n) => n.region === region)}
            alt={i % 2 === 1}
          />
        ))}

        {/* ── Archiv: alle Meldungen mit eigener Seite ───────────────────
            Haelt jede /bbq-news/<slug>-Seite intern verlinkt, auch wenn der
            Strom oben laengst von neueren Plattform-Inhalten gefuellt ist
            (SEO-Audit 08.10.2026: vier Meldungen ohne einen einzigen Link). */}
        {archiv.length > 0 && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-14" aria-labelledby="bbq-news-archiv">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-[3px] bg-brand-gold" />
              <h2 id="bbq-news-archiv" className="font-serif text-xl font-bold text-text-light">Alle Meldungen der Redaktion</h2>
            </div>
            <div className="section-divider mb-4" />
            <ul className="divide-y divide-border-subtle">
              {archiv.map((n) => (
                <li key={n.id} className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
                  <span className="font-sans text-xs text-text-muted shrink-0 sm:w-28">{n.date}</span>
                  <Link href={n.href!} className="font-serif text-base font-semibold text-text-light hover:text-brand-gold transition-colors">
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Hinweis / GEO-Transparenz ──────────────────────────────── */}
        <section className="bg-surface-base py-12" style={{ borderTop: '1px solid rgba(200,136,42,0.15)' }}>
          <div className="max-w-content mx-auto px-4 sm:px-6 text-center">
            <Globe size={22} className="text-brand-gold mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-bold text-text-light mb-3">Kuratiert, nicht kopiert</h2>
            <p className="font-body text-text-secondary leading-relaxed mb-6">
              Wir fassen Entwicklungen aus der internationalen Grillszene in eigenen Worten zusammen
              und ordnen sie für den deutschen Markt ein. Quellen werden genannt — Volltexte
              verlinken wir, statt sie zu kopieren.
            </p>
            <Link href="/diplome" className="btn-gold text-xs font-bold tracking-widest uppercase">
              Zum Grillmeister-Diplom
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
