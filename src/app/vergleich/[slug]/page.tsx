import { use } from "react";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import BildCredit from '@/components/BildCredit';
import Link from 'next/link';
import { allVergleiches } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/affiliate/ProductCard';
import MDXProductCard from '@/components/mdx/MDXProductCard';
import MDXComparisonTable from '@/components/mdx/MDXComparisonTable';
import MDXBuyingGuideBlock from '@/components/mdx/MDXBuyingGuideBlock';
import { getProductsByCategory } from '@/lib/products';
import { articleSchema, breadcrumbSchema, comparisonPageSchema, faqSchema } from '@/lib/schema';
import { Calendar, ChevronRight, RotateCcw, FlaskConical } from 'lucide-react';
import BBQPairing from '@/components/article/BBQPairing';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allVergleiches.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const vergleich = allVergleiches.find((v) => v.slug === params.slug);
  if (!vergleich) return {};
  const title = vergleich.seoTitle ?? vergleich.title;
  const description = vergleich.seoDescription ?? vergleich.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `https://steakakademie.de${vergleich.url}` },
    openGraph: {
      title, description,
      url: `https://steakakademie.de${vergleich.url}`,
      images: [{ url: vergleich.image, alt: vergleich.imageAlt }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [vergleich.image],
    },
  };
}

const mdxComponents = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="font-serif text-2xl sm:text-3xl font-bold text-text-light mt-12 mb-5 leading-tight pb-3"
      style={{ borderBottom: '1px solid rgba(200,136,42,0.2)' }}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-serif text-xl font-bold text-text-light mt-9 mb-3" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="font-body text-[1.0625rem] leading-[1.85] text-text-light/75 mb-5" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem] text-text-light/75" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem] text-text-light/75" {...props}>{children}</ol>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-6 -mx-4 sm:mx-0">
      <table className="min-w-full border-collapse font-sans text-sm" {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead style={{ backgroundColor: '#0D0D0D' }} {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-4 py-3 text-left text-[11px] font-bold tracking-[0.1em] uppercase text-brand-gold" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-3 border-b border-border-subtle text-text-light/70" style={{ borderBottomColor: 'rgba(61,34,16,0.6)' }} {...props}>{children}</td>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="relative border-l-[3px] pl-6 my-8 font-body text-lg italic text-text-light/75"
      style={{
        borderLeftColor: '#C8882A',
        background: 'linear-gradient(135deg, rgba(200,136,42,0.06) 0%, transparent 70%)',
        padding: '1.5rem 1.5rem 1.5rem 2rem',
      }}
      {...props}
    >
      {children}
    </blockquote>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-text-light" {...props}>{children}</strong>
  ),
  hr: () => <hr style={{ borderColor: 'rgba(200,136,42,0.2)' }} className="my-10" />,
  BBQPairing,
  MDXProductCard,
  MDXComparisonTable,
  MDXBuyingGuideBlock,
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isAffiliate = href?.startsWith('/go/');
    return (
      <a
        href={href}
        rel={isAffiliate ? 'sponsored noopener' : undefined}
        className="text-brand-fire font-medium hover:text-brand-gold transition-colors"
        {...props}
      >
        {children}
      </a>
    );
  },
};

export default function VergleichPage(props: Props) {
  const params = use(props.params);
  const vergleich = allVergleiches.find((v) => v.slug === params.slug);
  if (!vergleich) notFound();

  const MDXContent = useMDXComponent(vergleich.body.code);

  const slugCategoryMap: Record<string, Parameters<typeof getProductsByCategory>[0]> = {
    'premium-fleischthermometer': 'thermometer',
    'oberhitzegrill-vergleich':   'oberhitzegrill',
    'dry-aging-kuehlschrank-vergleich': 'dry-ager',
    'kuechenmaschine-vergleich':  'kuechenmaschine',
  };
  const pageCategory = slugCategoryMap[params.slug] ?? 'thermometer';
  const sidebarProducts = getProductsByCategory(pageCategory);

  const articleSch = articleSchema({
    headline: vergleich.title,
    description: vergleich.excerpt,
    image: vergleich.image,
    datePublished: vergleich.publishedAt,
    dateModified: vergleich.updatedAt ?? vergleich.publishedAt,
    authorName: vergleich.author,
    authorSlug: vergleich.authorSlug,
    url: vergleich.url,
  });

  const comparisonSch = comparisonPageSchema({
    pageTitle: vergleich.title,
    pageUrl: vergleich.url,
    products: sidebarProducts.map((p) => ({
      name: p.name,
      description: p.description ?? '',
      brand: p.brand,
      sku: p.amazonAsin,
      price: p.price,
      affiliateUrl: p.affiliateUrl,
      rating: p.rating,
      ratingCount: p.ratingCount,
      badge: p.badge,
      pros: p.pros,
      cons: p.cons,
    })),
  });

  const breadcrumbSch = breadcrumbSchema([
    { name: 'Vergleiche', url: '/vergleich' },
    { name: vergleich.title.split(':')[0], url: vergleich.url },
  ]);

  const faqSch = vergleich.faq
    ? faqSchema(vergleich.faq as Array<{ question: string; answer: string }>)
    : null;

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />
      {faqSch && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSch) }} />}

      <main>
        {/* Breadcrumb */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/45" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={12} />
            <Link href="/vergleich" className="hover:text-brand-gold transition-colors">Vergleiche</Link>
            <ChevronRight size={12} />
            <span className="text-text-light/65">{vergleich.title.split(':')[0]}</span>
          </nav>
        </div>

        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">

            <article>
              {/* Article header */}
              <header className="mb-10">
                <span className="category-label">Vergleich &amp; Test</span>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-light mt-3 mb-5 leading-tight">
                  {vergleich.title}
                </h1>
                <p className="font-body text-lg text-text-light/75 leading-relaxed mb-6">
                  {vergleich.excerpt}
                </p>

                {/* Test-Metadata — Redaktionelle Gold-Karte */}
                {(vergleich.testedCount || vergleich.testDuration) && (
                  <div
                    className="flex flex-wrap gap-6 mb-6 p-5"
                    style={{
                      background: 'linear-gradient(135deg, rgba(200,136,42,0.09) 0%, rgba(232,80,24,0.03) 100%)',
                      border: '1px solid rgba(200,136,42,0.22)',
                    }}
                  >
                    {vergleich.testedCount && (
                      <div className="flex items-center gap-3 text-sm font-sans">
                        <FlaskConical size={18} className="text-brand-gold" />
                        <div>
                          <span className="text-text-light/50 text-xs block tracking-wide">Getestet</span>
                          <span className="font-bold text-text-light text-base">{vergleich.testedCount} Modelle</span>
                        </div>
                      </div>
                    )}
                    {vergleich.testDuration && (
                      <div className="flex items-center gap-3 text-sm font-sans">
                        <Calendar size={18} className="text-brand-gold" />
                        <div>
                          <span className="text-text-light/50 text-xs block tracking-wide">Testdauer</span>
                          <span className="font-bold text-text-light text-base">{vergleich.testDuration}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Author meta */}
                <div
                  className="flex flex-wrap items-center gap-4 text-xs font-sans text-text-light/45 pb-6"
                  style={{ borderBottom: '1px solid rgba(200,136,42,0.15)' }}
                >
                  <Link href={`/autoren/${vergleich.authorSlug}`} className="flex items-center gap-2 hover:text-brand-gold transition-colors">
                    <div className="w-6 h-6 rounded-full" style={{ background: 'rgba(200,136,42,0.2)' }} />
                    {vergleich.author}
                  </Link>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {vergleich.formattedDate}
                  </span>
                  {vergleich.updatedAt && (
                    <span className="flex items-center gap-1.5 text-brand-gold font-medium">
                      <RotateCcw size={12} />
                      Aktualisiert: {new Date(vergleich.updatedAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </header>

              {/* Hero image — Cinéma */}
              <div className="cinema-frame mb-3 aspect-[16/9]">
                <Image
                  src={vergleich.image}
                  alt={vergleich.imageAlt}
                  width={800}
                  height={500}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <p className="text-xs font-sans text-text-light/40 mb-1 italic">
                {vergleich.imageAlt}
              </p>
              {/* Bildnachweis unter der Bildunterschrift — diese Seite hat keinen
                  Full-Bleed-Hero, deshalb die Inline-Variante statt des Badges. */}
              <div className="mb-10">
                <BildCredit source={vergleich.imageSource} ai={vergleich.imageAI} variant="inline" />
              </div>

              {/* MDX content */}
              <div className="max-w-content">
                <MDXContent components={mdxComponents} />
              </div>

              {/* Author box */}
              <div
                className="mt-12 p-6 flex gap-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(200,136,42,0.06) 0%, transparent 70%)',
                  border: '1px solid rgba(200,136,42,0.15)',
                }}
              >
                <div className="w-14 h-14 rounded-full shrink-0" style={{ background: 'rgba(200,136,42,0.15)' }} />
                <div>
                  <Link
                    href={`/autoren/${vergleich.authorSlug}`}
                    className="font-sans font-bold text-sm text-text-light hover:text-brand-gold transition-colors"
                  >
                    {vergleich.author}
                  </Link>
                  <p className="text-xs font-sans text-text-light/55 mt-1.5 leading-relaxed">
                    Alle getesteten Produkte wurden selbst gekauft und über mehrere Wochen im Praxiseinsatz getestet.
                  </p>
                </div>
              </div>
            </article>

            {/* Sidebar — Redaktionelle Karten */}
            <aside className="space-y-6">
              {sidebarProducts.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} variant="sidebar" />
              ))}

              <div className="bg-surface-card border border-border-subtle p-5">
                <div className="border-t-2 border-brand-gold -mt-5 mb-4 pt-4">
                  <h3 className="font-sans font-bold text-sm text-text-primary">Verwandte Guides</h3>
                </div>
                <ul>
                  {[
                    { label: 'Kerntemperaturen Guide', href: '/temperatur-guide' },
                    { label: 'Reverse Sear Methode',   href: '/methoden/reverse-sear' },
                    { label: 'Ribeye Guide',            href: '/cuts/ribeye' },
                    { label: 'Brisket Guide',           href: '/cuts/brisket' },
                  ].map(({ label, href }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="flex items-center justify-between text-sm font-sans text-text-secondary hover:text-brand-fire transition-colors group py-3 border-b border-border-subtle/50 last:border-0"
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
