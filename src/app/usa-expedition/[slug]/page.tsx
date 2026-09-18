import { use } from "react";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import BildCredit from '@/components/BildCredit';
import Link from 'next/link';
import { allUsaBbqStyles } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ChevronRight, MapPin, Flame } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allUsaBbqStyles.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const entry = allUsaBbqStyles.find((s) => s.slug === params.slug);
  if (!entry) return {};

  const title = entry.seoTitle ?? entry.title;
  const description = entry.seoDescription ?? entry.excerpt;

  return {
    title,
    description,
    alternates: { canonical: `https://steakakademie.de${entry.url}` },
    openGraph: {
      title,
      description,
      url: `https://steakakademie.de${entry.url}`,
      images: [{ url: entry.image, alt: entry.imageAlt }],
      type: 'article',
    },
  };
}

// ── MDX-Komponenten ───────────────────────────────────────────────────────────

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
    <p className="text-text-secondary leading-relaxed mb-5" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-outside pl-6 space-y-2 mb-5 text-text-secondary" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-outside pl-6 space-y-2 mb-5 text-text-secondary" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props}>{children}</li>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-text-primary" {...props}>{children}</strong>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote
      className="border-l-4 border-brand-fire pl-6 py-1 my-6 italic text-text-secondary bg-surface-raised/30"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-sm border-collapse" {...props}>{children}</table>
    </div>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="bg-surface-raised px-4 py-2 text-left font-semibold text-text-primary border border-border-subtle" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-2 border border-border-subtle text-text-secondary" {...props}>
      {children}
    </td>
  ),
  hr: () => <hr className="border-border-subtle my-8" />,
};

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function UsaExpeditionSlugPage(props: Props) {
  const params = use(props.params);
  const entry = allUsaBbqStyles.find((s) => s.slug === params.slug);
  if (!entry) notFound();

  const MDXContent = useMDXComponent(entry.body.code);

  // Schema.org
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entry.title,
    description: entry.excerpt,
    image: entry.image,
    datePublished: entry.publishedAt,
    author: { '@type': 'Person', name: entry.author },
    publisher: {
      '@type': 'Organization',
      name: 'Steakakademie',
      url: 'https://steakakademie.de',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://steakakademie.de' },
      { '@type': 'ListItem', position: 2, name: 'USA Expedition', item: 'https://steakakademie.de/usa-expedition' },
      { '@type': 'ListItem', position: 3, name: entry.title, item: `https://steakakademie.de${entry.url}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Header />

      <main className="min-h-screen bg-surface-base">
        {/* ── Hero ── */}
        <div className="relative h-[55vh] min-h-[400px] w-full overflow-hidden">
          <Image
            src={entry.image}
            alt={entry.imageAlt}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/60 to-transparent" />
          {/* Rendert nur, was Pflicht ist: Attributionszeile bei lizenzpflichtigen
              Quellen, KI-Badge bei imageAI. Siehe BildCredit.tsx. */}
          <BildCredit source={entry.imageSource} ai={entry.imageAI} />

          {/* Breadcrumb */}
          <div className="absolute top-6 left-0 right-0 px-6">
            <nav className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-white/70">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/usa-expedition" className="hover:text-white transition-colors">USA Expedition</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white/90">{entry.region}</span>
            </nav>
          </div>

          {/* Title block */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-10">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center gap-1.5 text-xs font-sans font-bold tracking-widest uppercase text-brand-fire">
                  <MapPin className="w-3.5 h-3.5" />
                  {entry.region}
                </span>
                {entry.signatureDish && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="flex items-center gap-1.5 text-xs font-sans text-white/60">
                      <Flame className="w-3.5 h-3.5" />
                      {entry.signatureDish}
                    </span>
                  </>
                )}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                {entry.title}
              </h1>
              <p className="mt-3 text-white/70 text-lg leading-relaxed max-w-2xl">
                {entry.excerpt}
              </p>
            </div>
          </div>
        </div>

        {/* ── Artikel-Body ── */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="prose-steakakademie">
            <MDXContent components={mdxComponents} />
          </div>

          {/* ── Footer Nav ── */}
          <div className="mt-16 pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link
              href="/usa-expedition"
              className="flex items-center gap-2 text-sm text-text-muted hover:text-brand-fire transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Zurück zur USA Expedition
            </Link>
            <p className="text-xs text-text-muted font-sans">
              {entry.formattedDate} · von {entry.author}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
