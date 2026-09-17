import { use } from "react";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AutorHinweis from '@/components/AutorHinweis';
import { allMethodes } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { Clock, Calendar, ChevronRight, RotateCcw, Flame } from 'lucide-react';
import BBQPairing from '@/components/article/BBQPairing';
import { Schnelluebersicht, Achtung, ProTipp, TempBox } from '@/components/mdx/Callouts';
import { getMethodZones } from '@/lib/affiliate-zones';
import { authorSchemaRef } from '@/lib/schema';
import HeroRecommendation from '@/components/affiliate/HeroRecommendation';
import EquipmentFooter from '@/components/affiliate/EquipmentFooter';
import InlineAffiliate from '@/components/affiliate/InlineAffiliate';
import BildCredit from '@/components/BildCredit';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allMethodes.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const methode = allMethodes.find((m) => m.slug === params.slug);
  if (!methode) return {};
  const title = methode.seoTitle ?? methode.title;
  const description = methode.seoDescription ?? methode.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `https://steakakademie.de${methode.url}` },
    openGraph: {
      title,
      description,
      url: `https://steakakademie.de${methode.url}`,
      images: [{ url: methode.image, alt: methode.imageAlt }],
      type: 'article',
    },
  };
}

const difficultyColor: Record<string, string> = {
  Einfach: 'text-green-700 bg-green-50 border-green-200',
  Mittel: 'text-brand-fire bg-orange-50 border-orange-200',
  Fortgeschritten: 'text-red-700 bg-red-50 border-red-200',
};

// Heller Lese-Layer: dunkle Schrift auf warmem Pergament (.reading-light).
const mdxComponents = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C140D] mt-10 mb-4 leading-tight border-b border-[#C3AB80] pb-3" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-serif text-xl font-bold text-[#1C140D] mt-8 mb-3" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="font-body text-[1.0625rem] leading-[1.8] text-[#2C2218] mb-5" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem] text-[#2C2218]" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem] text-[#2C2218]" {...props}>{children}</ol>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-6 -mx-4 sm:mx-0 rounded-md ring-1 ring-[#C3AB80]">
      <table className="min-w-full border-collapse font-sans text-sm bg-[#E8D8B4]" {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-[#2D2218] text-[#F0E8D8]" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-4 py-3 text-left text-[11px] font-bold tracking-[0.1em] uppercase" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-3 border-b border-[#C3AB80] text-[#3A2E22]" {...props}>{children}</td>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-brand-gold pl-5 my-6 font-body text-lg italic text-[#4A3C2E]" {...props}>{children}</blockquote>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-[#1C140D]" {...props}>{children}</strong>
  ),
  hr: () => <hr className="border-[#C3AB80] my-10" />,
  BBQPairing,
  Schnelluebersicht, Achtung, ProTipp, TempBox,
  InlineAffiliate,
};

export default function MethodePage(props: Props) {
  const params = use(props.params);
  const methode = allMethodes.find((m) => m.slug === params.slug);
  if (!methode) notFound();

  const MDXContent = useMDXComponent(methode.body.code);
  const zones = getMethodZones(methode.slug);

  const articleSchema = {
    '@type': 'Article',
    headline: methode.title,
    description: methode.excerpt,
    image: methode.image.startsWith('http') ? methode.image : `https://steakakademie.de${methode.image}`,
    inLanguage: 'de-DE',
    datePublished: methode.publishedAt,
    dateModified: methode.updatedAt ?? methode.publishedAt,
    author: authorSchemaRef(methode.authorSlug),
    publisher: { '@id': 'https://steakakademie.de/#organization' },
  };

  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://steakakademie.de' },
      { '@type': 'ListItem', position: 2, name: 'Methoden', item: 'https://steakakademie.de/methoden' },
      { '@type': 'ListItem', position: 3, name: methode.title, item: `https://steakakademie.de${methode.url}` },
    ],
  };

  const schema = { '@context': 'https://schema.org', '@graph': [articleSchema, breadcrumbSchema] };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <main>
        {/* ── HERO — Full-Bleed 65vh ──────────────────────────────────────── */}
        <div className="hero-fullbleed" style={{ height: '65vh', minHeight: '480px' }}>
          <Image
            src={methode.image}
            alt={methode.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover hero-fullbleed-image"
          />
          <div className="hero-fullbleed-overlay" />
          {/* Bildnachweis und KI-Kennzeichnung. Rendert nur, was Pflicht ist:
              Attributionszeile bei lizenzpflichtigen Quellen, KI-Badge bei
              erzeugten oder wesentlich veraenderten Bildern. Siehe BildCredit.tsx. */}
          <BildCredit source={methode.imageSource} ai={methode.imageAI} />
          <div className="hero-fullbleed-content">
            {/* Breadcrumb — oben */}
            <div className="absolute top-0 left-0 right-0">
              <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40" aria-label="Breadcrumb">
                  <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
                  <ChevronRight size={12} />
                  <Link href="/methoden" className="hover:text-brand-gold transition-colors">Grilltechniken</Link>
                  <ChevronRight size={12} />
                  <span className="text-text-light/60">{methode.title.split(':')[0]}</span>
                </nav>
              </div>
            </div>
            {/* Titel + Meta — unten */}
            <div className="max-w-editorial mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 lg:pb-16">
              <span className="category-label mb-3 block">Grilltechniken</span>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-text-light leading-[1.1] mb-4 max-w-3xl">
                {methode.title}
              </h1>
              <p className="font-body text-lg text-text-light/60 leading-relaxed mb-5 max-w-2xl">
                {methode.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-text-light/40">
                <Link href={`/autoren/${methode.authorSlug}`} className="hover:text-brand-gold transition-colors">
                  {methode.author}
                </Link>
                <span className="text-brand-gold/30">·</span>
                <span className="flex items-center gap-1"><Calendar size={12} />{methode.formattedDate}</span>
                {methode.difficulty && (
                  <span className="flex items-center gap-1">
                    <Flame size={12} className="text-brand-fire/70" />
                    {methode.difficulty}
                  </span>
                )}
                {methode.timeMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {methode.timeMinutes} Min.
                  </span>
                )}
                {methode.updatedAt && (
                  <span className="flex items-center gap-1 text-brand-fire/70">
                    <RotateCcw size={12} />
                    Aktualisiert
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="reading-light">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
              <article>

                <div className="max-w-content">
                  <MDXContent components={mdxComponents} />
                </div>

                {zones.footer && (
                  <EquipmentFooter title={zones.footer.title} productIds={zones.footer.productIds} />
                )}

                <div className="mt-10 p-5 bg-[#E4D2AC] border border-[#C3AB80] rounded-md flex gap-4 shadow-sm">
                  <div className="w-14 h-14 bg-[#EDE3D2] rounded-full shrink-0" />
                  <div>
                    <Link href={`/autoren/${methode.authorSlug}`} className="font-sans font-bold text-sm text-[#1C140D] hover:text-brand-fire transition-colors">
                      {methode.author}
                    </Link>
                    <AutorHinweis
                      authorSlug={methode.authorSlug}
                      className="text-xs font-sans text-[#6B5A48] mt-1 leading-relaxed"
                    />
                  </div>
                </div>
              </article>

              <aside className="space-y-6">
                {zones.hero && (
                  <HeroRecommendation productId={zones.hero.productId} pitch={zones.hero.pitch} />
                )}

                <div className="bg-[#E4D2AC] border border-[#C3AB80] rounded-md p-5 shadow-sm">
                  <div className="border-t-2 border-brand-fire -mt-5 mb-4 pt-4">
                    <h3 className="font-sans font-bold text-sm text-[#1C140D] flex items-center gap-2">
                      <Flame size={14} className="text-brand-fire" /> Methoden-Info
                    </h3>
                  </div>
                  <dl className="space-y-3 text-sm font-sans">
                    {methode.difficulty && (
                      <div>
                        <dt className="text-[#6B5A48] text-xs uppercase tracking-wide mb-0.5">Schwierigkeit</dt>
                        <dd className="font-bold text-[#1C140D]">{methode.difficulty}</dd>
                      </div>
                    )}
                    {methode.timeMinutes && (
                      <div>
                        <dt className="text-[#6B5A48] text-xs uppercase tracking-wide mb-0.5">Zeitaufwand</dt>
                        <dd className="font-bold text-[#1C140D]">{methode.timeMinutes} Minuten</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-[#E4D2AC] border border-[#C3AB80] rounded-md p-5 shadow-sm">
                  <div className="border-t-2 border-brand-gold -mt-5 mb-4 pt-4">
                    <h3 className="font-sans font-bold text-sm text-[#1C140D]">Weiterlernen</h3>
                  </div>
                  <ul className="space-y-2">
                    {[
                      { label: 'Ribeye Guide', href: '/cuts/ribeye' },
                      { label: 'Kerntemperaturen Guide', href: '/temperatur-guide' },
                      { label: 'Brisket Guide', href: '/cuts/brisket' },
                      { label: 'Thermometer Vergleich', href: '/vergleich/fleischthermometer' },
                    ].map(({ label, href }) => (
                      <li key={href}>
                        <Link href={href} className="flex items-center justify-between text-sm font-sans text-[#4A3C2E] hover:text-brand-fire transition-colors group py-1.5 border-b border-[#C3AB80]">
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
        </div>
      </main>
      <Footer />
    </>
  );
}
