import { use } from "react";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BildCredit from '@/components/BildCredit';
import DiplomCTA from '@/components/mdx/DiplomCTA';
import AffiliateBox from '@/components/mdx/AffiliateBox';
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { getAuthorBySlug } from '@/lib/authors';
import { serie, teilBySlug, nachbarn } from '@/lib/fleischwissen';
import { Calendar, Clock, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

// Alle drei Teile sind live und indexierbar. Eine frueher hier gebaute
// Erscheinungssperre (noindex + Sitemap-Ausschluss bis zum jeweiligen Datum)
// ist auf Uwes Ansage vom 30.08.2026 ausgebaut — siehe src/lib/fleischwissen.ts.
export async function generateStaticParams() {
  return serie().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const doc = teilBySlug(params.slug);
  if (!doc) return {};

  const title = doc.seoTitle ?? doc.title;
  const description = doc.seoDescription ?? doc.excerpt;
  // Hero-Motive fehlen noch (Auftrag Punkt 7). Solange kein `image` gesetzt
  // ist, greift das dynamische Standard-OG-Bild der Seite.
  const ogBild = doc.image ?? '/api/og';

  return {
    title,
    description,
    alternates: { canonical: `https://steakakademie.de${doc.url}` },
    openGraph: {
      title,
      description,
      url: `https://steakakademie.de${doc.url}`,
      images: [{ url: ogBild, alt: doc.imageAlt ?? doc.title }],
      type: 'article',
      publishedTime: doc.publishedAt,
      modifiedTime: doc.updatedAt ?? doc.publishedAt,
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogBild] },
  };
}

const mdxComponents = {
  DiplomCTA,
  AffiliateBox,
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
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} className="text-brand-fire font-medium hover:text-brand-gold transition-colors" {...props}>
      {children}
    </a>
  ),
};

export default function FleischwissenArtikel(props: Props) {
  const params = use(props.params);
  const doc = teilBySlug(params.slug);
  if (!doc) notFound();

  const MDXContent = useMDXComponent(doc.body.code);
  const autor = getAuthorBySlug(doc.authorSlug);
  const { vorheriger, naechster } = nachbarn(doc);

  const faqItems = (doc.faq as Array<{ question: string; answer: string }> | undefined) ?? [];

  const articleSch = articleSchema({
    headline: doc.title,
    description: doc.excerpt,
    image: doc.image ?? '/api/og',
    datePublished: doc.publishedAt,
    dateModified: doc.updatedAt ?? doc.publishedAt,
    authorName: doc.author,
    authorSlug: doc.authorSlug,
    url: doc.url,
  });

  const breadcrumbSch = breadcrumbSchema([
    { name: 'Wissen', url: '/wissen' },
    { name: 'Fleischwissen', url: '/fleischwissen' },
    { name: doc.title, url: doc.url },
  ]);

  const faqSch = faqItems.length > 0 ? faqSchema(faqItems) : null;

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />
      {faqSch && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSch) }} />}

      <main>
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/45" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={12} />
            <Link href="/wissen" className="hover:text-brand-gold transition-colors">Wissen</Link>
            <ChevronRight size={12} />
            <Link href="/fleischwissen" className="hover:text-brand-gold transition-colors">Fleischwissen</Link>
          </nav>
        </div>

        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <article className="max-w-content mx-auto">
            <header className="mb-10">
              <span className="category-label">
                Fleischwissen · Teil {doc.serieTeil} von {doc.serieGesamt}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-light mt-3 mb-5 leading-tight">
                {doc.title}
              </h1>
              <p className="font-body text-lg text-text-light/75 leading-relaxed mb-6">{doc.excerpt}</p>

              <div
                className="flex flex-wrap items-center gap-4 text-xs font-sans text-text-light/45 pb-6"
                style={{ borderBottom: '1px solid rgba(200,136,42,0.15)' }}
              >
                <Link href={`/autoren/${doc.authorSlug}`} className="hover:text-brand-gold transition-colors">
                  {doc.author}
                </Link>
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {doc.formattedDate}
                </span>
                {doc.readingTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {doc.readingTime} Min. Lesezeit
                  </span>
                )}
                {doc.updatedAt && doc.updatedAt !== doc.publishedAt && (
                  <span className="flex items-center gap-1.5 text-brand-gold font-medium">
                    <RotateCcw size={12} />
                    Aktualisiert: {new Date(doc.updatedAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </header>

            {/* Hero nur, wenn es eines gibt. Die Motive liefert Uwe nach; bis
                dahin startet der Artikel direkt mit dem Text, statt eine leere
                Bildflaeche zu reservieren. */}
            {doc.image && (
              <>
                <div className="cinema-frame mb-3 aspect-[16/9]">
                  <Image
                    src={doc.image}
                    alt={doc.imageAlt ?? doc.title}
                    width={800}
                    height={500}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <div className="mb-10">
                  <BildCredit source={doc.imageSource} ai={doc.imageAI} />
                </div>
              </>
            )}

            <MDXContent components={mdxComponents} />

            {faqItems.length > 0 && (
              <section className="mt-14">
                <h2
                  className="font-serif text-2xl font-bold text-text-light mb-6 pb-3"
                  style={{ borderBottom: '1px solid rgba(200,136,42,0.2)' }}
                >
                  Häufige Fragen
                </h2>
                <dl className="space-y-5">
                  {faqItems.map((item) => (
                    <div key={item.question} className="pb-5" style={{ borderBottom: '1px solid rgba(200,136,42,0.1)' }}>
                      <dt className="font-sans font-bold text-text-light mb-2">{item.question}</dt>
                      <dd className="font-body text-text-light/70 leading-relaxed">{item.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {/* Autorenbox — bewusst OHNE Foto (Auftrag Punkt 4). Die Autoritaet
                traegt der Credentials-Text der Autorenseite, nicht ein Portrait. */}
            {autor && (
              <section className="mt-14 p-6" style={{ border: '1px solid rgba(200,136,42,0.18)', background: 'rgba(255,255,255,0.02)' }}>
                <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-brand-gold block mb-3">
                  Über den Autor
                </span>
                <Link
                  href={`/autoren/${autor.slug}`}
                  className="font-serif text-xl font-bold text-text-light hover:text-brand-gold transition-colors"
                >
                  {autor.name}
                </Link>
                <p className="font-body text-text-light/70 leading-relaxed mt-2">{autor.shortBio}</p>
                {autor.statsLabel && (
                  <p className="font-sans text-xs text-text-light/50 mt-3 leading-relaxed">{autor.statsLabel}</p>
                )}
              </section>
            )}

            {/* Serien-Navigation. Alle Teile sind live, also ist jeder Nachbar
                ein Link. Fehlt ein Nachbar (Teil 1 hat keinen Vorgaenger), bleibt
                der Platz auf breiten Viewports leer, damit der vorhandene Link
                nicht ueber die volle Breite springt. */}
            <nav className="mt-12 grid gap-4 sm:grid-cols-2" aria-label="Serien-Navigation">
              {[
                { doc: vorheriger, richtung: 'zurueck' as const },
                { doc: naechster, richtung: 'vor' as const },
              ].map(({ doc: nachbar, richtung }) => {
                if (!nachbar) return <div key={richtung} className="hidden sm:block" />;
                const label = richtung === 'zurueck' ? 'Vorheriger Teil' : 'Nächster Teil';

                return (
                  <Link
                    key={richtung}
                    href={nachbar.url}
                    className="block p-5 transition-colors hover:border-brand-gold/40"
                    style={{ border: '1px solid rgba(200,136,42,0.18)', background: 'rgba(255,255,255,0.02)' }}
                  >
                    <span className="flex items-center gap-1.5 font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-brand-gold mb-2">
                      {richtung === 'zurueck' && <ChevronLeft size={12} />}
                      {label} · Teil {nachbar.serieTeil}
                      {richtung === 'vor' && <ChevronRight size={12} />}
                    </span>
                    <span className="font-serif text-base font-bold leading-snug block text-text-light">
                      {nachbar.title}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-10">
              <Link
                href="/fleischwissen"
                className="inline-flex items-center gap-2 font-sans text-sm font-bold text-brand-gold hover:opacity-80 transition-opacity"
              >
                Zur Serienübersicht <ChevronRight size={15} />
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
