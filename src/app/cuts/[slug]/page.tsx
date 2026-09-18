import { use } from "react";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AutorHinweis from '@/components/AutorHinweis';
import { allCuts } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/affiliate/ProductCard';
import { getProductsByCategory, getProductById } from '@/lib/products';
import { authorSchemaRef } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { Clock, Calendar, ChevronRight, RotateCcw } from 'lucide-react';
import BBQPairing from '@/components/article/BBQPairing';
import BildCredit from '@/components/BildCredit';
import HofladenHinweis from '@/components/hoefe/HofladenHinweis';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allCuts.map((cut) => ({ slug: cut.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const cut = allCuts.find((c) => c.slug === params.slug);
  if (!cut) return {};

  const title = cut.seoTitle ?? cut.title;
  const description = cut.seoDescription ?? cut.excerpt;

  return {
    title,
    description,
    alternates: { canonical: `https://steakakademie.de${cut.url}` },
    openGraph: {
      title,
      description,
      url: `https://steakakademie.de${cut.url}`,
      images: [{ url: cut.image, alt: cut.imageAlt }],
      type: 'article',
    },
  };
}

// ── MDX-Komponenten Override ──────────────────────────────────────────────────

const mdxComponents = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="font-serif text-2xl sm:text-3xl font-bold text-text-primary mt-10 mb-4 leading-tight border-b border-border-subtle pb-3"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="font-serif text-xl font-bold text-text-primary mt-8 mb-3"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="font-body text-[1.0625rem] leading-[1.8] text-text-primary mb-5" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem]" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem]" {...props}>
      {children}
    </ol>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-6 -mx-4 sm:mx-0">
      <table
        className="min-w-full border-collapse font-sans text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-text-muted text-white" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="px-4 py-3 text-left text-[11px] font-bold tracking-[0.1em] uppercase"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="px-4 py-3 border-b border-border-subtle text-text-secondary"
      {...props}
    >
      {children}
    </td>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-brand-gold pl-5 my-6 font-body text-lg italic text-text-secondary"
      {...props}
    >
      {children}
    </blockquote>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-text-primary" {...props}>
      {children}
    </strong>
  ),
  hr: () => <hr className="border-border-subtle my-10" />,
  BBQPairing,
};

export default function CutPage(props: Props) {
  const params = use(props.params);
  const cut = allCuts.find((c) => c.slug === params.slug);
  if (!cut) notFound();

  const MDXContent = useMDXComponent(cut.body.code);
  const relatedProducts = getProductsByCategory('thermometer').slice(0, 3);

  // Schema.org JSON-LD — Article + BreadcrumbList (GEO/Burggraben 3)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cut.title,
    description: cut.excerpt,
    image: cut.image.startsWith('http') ? cut.image : `https://steakakademie.de${cut.image}`,
    inLanguage: 'de-DE',
    articleSection: 'Cuts & Fleischkunde',
    datePublished: cut.publishedAt,
    dateModified: cut.updatedAt ?? cut.publishedAt,
    author: authorSchemaRef(cut.authorSlug),
    publisher: { '@id': 'https://steakakademie.de/#organization' },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://steakakademie.de${cut.url}`,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://steakakademie.de' },
      { '@type': 'ListItem', position: 2, name: 'Cuts & Fleischkunde', item: 'https://steakakademie.de/kategorie/cuts' },
      { '@type': 'ListItem', position: 3, name: cut.title.split(':')[0], item: `https://steakakademie.de${cut.url}` },
    ],
  };

  const faqItems = (Array.isArray(cut.faq) ? cut.faq : []) as Array<{ question: string; answer: string }>;
  const faqSchema = faqItems.length > 0
    ? {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [articleSchema, breadcrumbSchema, ...(faqSchema ? [faqSchema] : [])],
  };

  return (
    <>
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main>
        {/* ── HERO — Full-Bleed 65vh ──────────────────────────────────────── */}
        <div className="hero-fullbleed" style={{ height: '65vh', minHeight: '480px' }}>
          <Image
            src={cut.image}
            alt={cut.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover hero-fullbleed-image"
          />
          <div className="hero-fullbleed-overlay" />
          {/* Rendert nur, was Pflicht ist: Attributionszeile bei lizenzpflichtigen
              Quellen, KI-Badge bei imageAI. Siehe BildCredit.tsx. */}
          <BildCredit source={cut.imageSource} ai={cut.imageAI} />
          <div className="hero-fullbleed-content">
            {/* Breadcrumb — oben */}
            <div className="absolute top-0 left-0 right-0">
              <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40" aria-label="Breadcrumb">
                  <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
                  <ChevronRight size={12} />
                  <Link href="/kategorie/cuts" className="hover:text-brand-gold transition-colors">Cuts &amp; Fleischkunde</Link>
                  <ChevronRight size={12} />
                  <span className="text-text-light/60">{cut.title.split(':')[0]}</span>
                </nav>
              </div>
            </div>
            {/* Titel + Meta — unten */}
            <div className="max-w-editorial mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 lg:pb-16">
              <span className="category-label mb-3 block">Cuts &amp; Fleischkunde</span>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-text-light leading-[1.1] mb-4 max-w-3xl">
                {cut.title}
              </h1>
              <p className="font-body text-lg text-text-light/60 leading-relaxed mb-5 max-w-2xl">
                {cut.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-text-light/40">
                <Link href={`/autoren/${cut.authorSlug}`} className="hover:text-brand-gold transition-colors">
                  {cut.author}
                </Link>
                <span className="text-brand-gold/30">·</span>
                <span className="flex items-center gap-1"><Calendar size={12} />{cut.formattedDate}</span>
                {cut.updatedAt && (
                  <span className="flex items-center gap-1 text-brand-fire/70">
                    <RotateCcw size={12} />
                    Aktualisiert
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Article layout: content + sidebar */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">

            {/* Main content */}
            <article>

              {/* MDX Content */}
              <div className="max-w-content">
                <MDXContent components={mdxComponents} />
              </div>

              {/* Author box */}
              <div className="mt-10 p-5 bg-surface-base border border-border-subtle flex gap-4">
                <div className="w-14 h-14 bg-border-subtle rounded-full shrink-0" />
                <div>
                  <Link
                    href={`/autoren/${cut.authorSlug}`}
                    className="font-sans font-bold text-sm text-text-primary hover:text-brand-fire transition-colors"
                  >
                    {cut.author}
                  </Link>
                  <AutorHinweis authorSlug={cut.authorSlug} />
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Inhaltsverzeichnis */}
              <div className="bg-surface-elevated border border-border-subtle p-5 sticky top-24">
                <div className="border-t-2 border-text-primary -mt-5 mb-4 pt-4">
                  <h3 className="font-sans font-bold text-sm text-text-primary">
                    Inhalt
                  </h3>
                </div>
                <ul className="space-y-2 text-sm font-sans text-text-secondary">
                  <li>
                    <a href="#was-ist-ein-ribeye-überhaupt" className="hover:text-brand-fire transition-colors">
                      Was ist ein Ribeye?
                    </a>
                  </li>
                  <li>
                    <a href="#marmorierung-was-die-zahlen-bedeuten" className="hover:text-brand-fire transition-colors">
                      Marmorierung verstehen
                    </a>
                  </li>
                  <li>
                    <a href="#kerntemperaturen-für-ribeye" className="hover:text-brand-fire transition-colors">
                      Kerntemperaturen
                    </a>
                  </li>
                  <li>
                    <a href="#drei-zubereitungsmethoden" className="hover:text-brand-fire transition-colors">
                      Zubereitungsmethoden
                    </a>
                  </li>
                  <li>
                    <a href="#einkauf-worauf-achten" className="hover:text-brand-fire transition-colors">
                      Einkaufstipps
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-brand-fire transition-colors">FAQ</a>
                  </li>
                </ul>
              </div>

              {/* Produkt-Empfehlung */}
              {relatedProducts[0] && (
                <ProductCard product={relatedProducts[0]} variant="sidebar" />
              )}

              {/* Hofladen-Radar: Cut direkt vom Erzeuger (kein Affiliate) */}
              <HofladenHinweis cut={cut.title.split(':')[0].trim()} />

              {/* Verwandte Guides */}
              <div className="bg-surface-elevated border border-border-subtle p-5">
                <div className="border-t-2 border-brand-gold -mt-5 mb-4 pt-4">
                  <h3 className="font-sans font-bold text-sm text-text-primary">
                    Weiterlernen
                  </h3>
                </div>
                <ul className="space-y-2">
                  {[
                    { label: 'Reverse Sear Methode', href: '/methoden/reverse-sear' },
                    { label: 'Kerntemperaturen Guide', href: '/temperatur-guide' },
                    { label: 'Thermometer Vergleich', href: '/vergleich/fleischthermometer' },
                    { label: 'Brisket Guide', href: '/cuts/brisket' },
                  ].map(({ label, href }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="flex items-center justify-between text-sm font-sans text-text-secondary hover:text-brand-fire transition-colors group py-1.5 border-b border-border-subtle/50"
                      >
                        {label}
                        <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-fire" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
