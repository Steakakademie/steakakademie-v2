import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ChevronRight, Globe } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
// Markdown wird hier im Server Component gerendert: react-markdown ist ein
// reiner Funktions-Renderer ohne Hooks. Ueber LazyMarkdownRenderer ('use client')
// wuerden ~40 kB Parser als Client-JS ausgeliefert — fuer statischen Text ohne
// jede Interaktion. Serverseitig kommt nur HTML beim Leser an.
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { breadcrumbSchema } from '@/lib/schema';
import { getNewsBySlug, getNewsItems, getNewsSlugs } from '@/lib/bbq-news';
import { REGION_ACCENT, CompactItem } from '@/components/news/NewsLayout';

// ─────────────────────────────────────────────────────────────────────────────
// /bbq-news/[slug] — Detailseite je News-Beitrag (03.09.2026)
//
// Vorher existierte nur die Hub-Seite. Die Beitraege aus content_drafts hatten
// keine eigene URL, standen nicht in der Sitemap und waren fuer Google und
// AI-Suche unsichtbar (Sitemap: 397 URLs, davon genau eine unter /bbq-news).
//
// Redaktionsvorbehalt: Es wird ausschliesslich status='approved' gelesen —
// das ist die manuelle Freigabe in /admin/review. Nichts erscheint hier, was
// nicht ein Mensch freigegeben hat (AI Act Art. 50 Abs. 4, compliance/
// ai-act-einstufung.md). Die redaktionellen FALLBACK_NEWS haben keinen
// Textkoerper und deshalb bewusst keine Detailseite.
//
// ISR: 1 h wie die Hub-Seite. Unbekannte Slugs werden zur Laufzeit geprueft
// (dynamicParams), damit ein Beitrag, der nach dem Build freigegeben wird,
// ohne Redeploy erreichbar ist.
// ─────────────────────────────────────────────────────────────────────────────

export const revalidate = 3600;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getNewsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const item = await getNewsBySlug(params.slug);
  if (!item) return {};
  const url = `https://steakakademie.de/bbq-news/${item.slug}`;
  return {
    title: `${item.title} — BBQ-News`,
    description: item.summary,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: item.title,
      description: item.summary,
      url,
      publishedTime: item.isoDate,
      images: [{ url: item.image ?? '/api/og', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', creator: '@steakakademie' },
  };
}

export default async function BbqNewsDetailPage(props: Props) {
  const params = await props.params;
  const item = await getNewsBySlug(params.slug);
  if (!item) notFound();

  const url = `https://steakakademie.de/bbq-news/${item.slug}`;
  const accent = REGION_ACCENT[item.region];

  // Weitere Beitraege — ohne den aktuellen, max. 4.
  const weitere = (await getNewsItems()).filter((n) => n.slug && n.slug !== item.slug).slice(0, 4);

  const newsSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    headline: item.title,
    description: item.summary,
    datePublished: item.isoDate,
    dateModified: item.isoDate,
    inLanguage: 'de-DE',
    mainEntityOfPage: url,
    image: item.image ? `https://steakakademie.de${item.image}` : 'https://steakakademie.de/api/og',
    author: { '@type': 'Organization', name: 'Steakakademie', url: 'https://steakakademie.de' },
    publisher: { '@type': 'Organization', name: 'Steakakademie', url: 'https://steakakademie.de' },
    articleSection: item.category,
  };

  const breadcrumbSch = breadcrumbSchema([
    { name: 'BBQ-News', url: '/bbq-news' },
    { name: item.title, url: `/bbq-news/${item.slug}` },
  ]);

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />

      <main>
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/45" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link href="/bbq-news" className="hover:text-brand-gold transition-colors">BBQ-News</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-text-light/70 truncate max-w-[60vw]">{item.title}</span>
          </nav>
        </div>

        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-5 font-sans text-[11px] font-bold tracking-[0.14em] uppercase">
              <span className="inline-flex items-center gap-1.5" style={{ color: accent.color }}>
                <Globe size={12} aria-hidden="true" />
                {accent.label}
              </span>
              <span className="text-text-muted">·</span>
              <span className="text-brand-gold">{item.category}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-text-light leading-[1.12] mb-5">
              {item.title}
            </h1>

            <p className="font-body text-lg leading-relaxed text-text-light/70 mb-6">{item.summary}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-text-light/50">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} aria-hidden="true" />
                <time dateTime={item.isoDate}>{item.date}</time>
              </span>
              {item.source && <span>{item.source}</span>}
            </div>
          </header>

          <div className="prose-steak font-body text-[1.0625rem] leading-[1.85] text-text-light/80 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-text-light [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-text-light [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-5 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-5 [&_li]:mb-1.5 [&_a]:text-brand-gold [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-text-light [&_blockquote]:border-l-2 [&_blockquote]:border-brand-gold/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:py-2 [&_td]:py-2 [&_td]:border-t [&_td]:border-white/10">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Externe Links oeffnen im neuen Tab ohne Referrer-Leck;
                // interne bleiben normale Navigation.
                a: ({ href, children }) =>
                  href && /^https?:\/\//.test(href) ? (
                    <a href={href} target="_blank" rel="noopener nofollow">{children}</a>
                  ) : (
                    <Link href={href ?? '#'}>{children}</Link>
                  ),
              }}
            >
              {item.body}
            </ReactMarkdown>
          </div>

          {/* Transparenz-Hinweis. Der Beitrag entsteht in der Content-Pipeline
              (scripts/content-grow) und wird vor Veroeffentlichung in
              /admin/review von der Redaktion freigegeben. Der Satz beschreibt
              genau das — nicht mehr, nicht weniger. */}
          <p className="mt-12 pt-5 border-t border-white/10 font-sans text-xs text-text-light/45 leading-relaxed">
            Dieser Beitrag wurde mit KI-Unterstützung recherchiert und verfasst und vor der Veröffentlichung
            redaktionell geprüft und freigegeben. Mehr dazu im{' '}
            <Link href="/ki-disclaimer" className="underline hover:text-brand-gold transition-colors">KI-Hinweis</Link>.
          </p>
        </article>

        {weitere.length > 0 && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-20" aria-labelledby="weitere-news">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-3 mb-6">
              <h2 id="weitere-news" className="font-serif text-2xl font-bold text-text-light">Weitere BBQ-News</h2>
              <Link
                href="/bbq-news"
                className="text-xs font-sans font-bold uppercase tracking-wider text-text-muted hover:text-brand-gold transition-colors inline-flex items-center gap-1"
              >
                Alle News <ChevronRight size={12} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {weitere.map((n) => (
                <CompactItem key={n.id} item={n} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
