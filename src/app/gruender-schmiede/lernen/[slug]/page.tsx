import { use } from "react";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Clock, ArrowRight } from 'lucide-react';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allSprintModuls } from 'contentlayer/generated';
import { breadcrumbSchema } from '@/lib/schema';
import BuerokratieHinweis from '@/components/gruendung/BuerokratieHinweis';
import { Schnelluebersicht, Achtung, ProTipp, TempBox } from '@/components/mdx/Callouts';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return allSprintModuls.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const m = allSprintModuls.find((x) => x.slug === params.slug);
  if (!m) return {};
  return {
    robots: { index: false, follow: false }, // Gruender-Bereich ausgebaut, 02.09.2026
    title: m.seoTitle ?? `${m.title} | Gründer-Schmiede`,
    description: m.seoDescription ?? m.excerpt,
    alternates: { canonical: `https://steakakademie.de${m.url}` },
  };
}

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
    <h3 className="font-serif text-xl font-bold text-text-primary mt-8 mb-3" {...props}>
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
  a: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-brand-fire underline hover:no-underline" {...props}>
      {children}
    </a>
  ),
  hr: () => <hr className="border-border-subtle my-10" />,
  Schnelluebersicht,
  Achtung,
  ProTipp,
  TempBox,
};

export default function SprintModulPage(props: Props) {
  const params = use(props.params);
  const modul = allSprintModuls.find((m) => m.slug === params.slug);
  if (!modul) notFound();

  const MDXContent = useMDXComponent(modul.body.code);
  const sorted = allSprintModuls.slice().sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((m) => m.slug === modul.slug);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const isLast = idx === sorted.length - 1;

  const learningSchema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: modul.title,
    description: modul.excerpt,
    learningResourceType: 'Lesson',
    educationalLevel: 'Gründer-Schmiede',
    datePublished: modul.publishedAt,
    inLanguage: 'de-DE',
    isPartOf: {
      '@type': 'Course',
      name: 'KI-Projektsteuerung',
      provider: { '@type': 'Organization', name: 'Steakakademie', url: 'https://steakakademie.de' },
    },
  };
  const breadcrumb = breadcrumbSchema([
    { name: 'Gründer-Schmiede', url: '/gruender-schmiede' },
    { name: 'KI-Projektsteuerung', url: '/gruender-schmiede/lernen' },
    { name: modul.title, url: modul.url },
  ]);

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(learningSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <main className="bg-surface-base min-h-screen">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12">
            {/* Main */}
            <article className="max-w-content">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-6" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-brand-fire transition-colors">Start</Link>
                <ChevronRight size={12} />
                <Link href="/gruender-schmiede/lernen" className="hover:text-brand-fire transition-colors">
                  KI-Projektsteuerung
                </Link>
                <ChevronRight size={12} />
                <span className="text-text-primary">Modul {modul.order}</span>
              </nav>

              {/* Module header */}
              <p className="text-xs font-sans font-bold tracking-widest uppercase text-brand-fire mb-3">
                Modul {modul.order} von {sorted.length}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary mb-4 leading-tight">
                {modul.title}
              </h1>
              <p className="font-body text-lg text-text-secondary leading-relaxed mb-4">{modul.excerpt}</p>
              <span className="inline-flex items-center gap-1 text-xs font-sans text-text-muted">
                <Clock size={12} />
                {modul.dauer}
              </span>

              <hr className="border-border-subtle my-8" />

              {/* MDX body */}
              <MDXContent components={mdxComponents} />

              {/* End-CTA — nur im letzten Modul, sanft Richtung GF3 (kein Live-Checkout) */}
              {isLast && (
                <div className="mt-12 p-6 bg-surface-elevated border border-brand-gold/30">
                  <p className="font-serif text-xl font-bold text-text-primary mb-2">Geschafft — alle {sorted.length} Module durch.</p>
                  <p className="font-body text-sm text-text-secondary mb-4">
                    Chef-Prinzip, ein mitwachsendes Backbone und der tägliche Arbeits-Loop — das ist das Fundament
                    von „Das ehrliche System&quot;: zeigen, wie du arbeitest, nicht nur was du verkaufst.
                  </p>
                  <Link
                    href="/ehrliches-system"
                    className="inline-flex items-center gap-2 font-sans font-bold text-sm text-brand-fire hover:gap-3 transition-[gap]"
                  >
                    Weiter zu „Das ehrliche System&quot; <ArrowRight size={16} />
                  </Link>
                </div>
              )}

              {/* Prev / Next */}
              <div className="mt-10 pt-6 border-t border-border-subtle flex justify-between gap-4">
                {prev ? (
                  <Link
                    href={prev.url}
                    className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-brand-fire transition-colors"
                  >
                    <ChevronLeft size={16} /> Modul {prev.order}
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={next.url}
                    className="flex items-center gap-2 text-sm font-sans font-bold text-text-primary hover:text-brand-fire transition-colors ml-auto text-right"
                  >
                    Modul {next.order}: {next.title.split(':')[0]} <ChevronRight size={16} />
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </article>

            {/* Sidebar — Modul-Navigator */}
            <aside>
              <div className="bg-surface-elevated border border-border-subtle p-5 sticky top-24">
                <div className="border-t-2 border-text-primary -mt-5 mb-4 pt-4">
                  <h2 className="font-sans font-bold text-sm text-text-primary">Modulreihe</h2>
                </div>
                <ol className="space-y-2">
                  {sorted.map((m) => (
                    <li key={m.slug}>
                      <Link
                        href={m.url}
                        className={`flex gap-2 text-sm font-sans py-1.5 transition-colors ${
                          m.slug === modul.slug ? 'text-brand-fire font-bold' : 'text-text-secondary hover:text-brand-fire'
                        }`}
                      >
                        <span className="text-text-muted">{m.order}.</span>
                        <span>{m.title.split(':')[0].split('—')[0].trim()}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Bürokratie-Hinweis — holt Gründungs-Neulinge ab */}
              <div className="mt-4">
                <BuerokratieHinweis variant="inline" />
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
