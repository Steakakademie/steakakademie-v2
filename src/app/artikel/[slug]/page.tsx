import { use } from "react";
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Clock } from 'lucide-react';
import { allArtikels } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { sichtbareArtikel, istEntwurf } from '@/lib/redaktion';
// 03.09.2026: Diese Route registrierte bisher NUR HTML-Overrides. Ein MDX mit
// <DiplomCTA> oder <AffiliateBox> unter content/artikel/ hat den Build mit
// "Expected component to be defined" gebrochen — aufgefallen an einem
// Pipeline-Entwurf, der beide Bloecke platziert hatte. /fleischwissen hatte
// sie laengst, /artikel nicht: derselbe Bezeichner-Fehler wie 7f19d67, nur
// aus der anderen Richtung (Komponente existiert, Route kennt sie nicht).
// Das MDX-Gate faengt das NICHT: es prueft gegen die Vereinigung aller
// bekannten Namen, nicht pro Route (CLAUDE.md §4, MDX-Komponenten-Gate).
import DiplomCTA from '@/components/mdx/DiplomCTA';
import AffiliateBox from '@/components/mdx/AffiliateBox';
// 19.09.2026: Callouts registriert — der Pökel-Artikel nutzt <Schnelluebersicht>/<Achtung>;
// als Entwurf unsichtbar, nach Freigabe brach der Vercel-Build (Expected component `Achtung`).
import { Schnelluebersicht, Achtung, ProTipp, TempBox, Leitfrage, Handgriff } from '@/components/mdx/Callouts';
import { faqSchema } from '@/lib/schema';

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Nur sichtbare Artikel bekommen eine Seite. Im Produktions-Build sind das
 * ausschliesslich veroeffentlichte — Entwuerfe existieren dort schlicht nicht,
 * tauchen deshalb auch nicht im Prerender-Manifest und damit nicht in der
 * Sitemap auf (next-sitemap liest genau dieses Manifest).
 */
export async function generateStaticParams() {
  return sichtbareArtikel(allArtikels).map((a) => ({ slug: a.slug }));
}

/**
 * Entscheidend fuer die Anforderung „in Produktion nicht gerendert":
 * Ohne dies wuerde Next.js einen nicht gelisteten Slug on demand serverseitig
 * rendern — ein Entwurf waere per direkter URL erreichbar, obwohl er nirgends
 * verlinkt ist. false laesst unbekannte Slugs sauber auf 404 laufen.
 */
export const dynamicParams = false;

/** JSON-LD sicher einbetten: verhindert das Ausbrechen aus dem script-Tag. */
const ldJson = (obj: unknown) =>
  JSON.stringify(obj).replace(/</g, '\\u003c');

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const artikel = sichtbareArtikel(allArtikels).find((a) => a.slug === params.slug);
  if (!artikel) return {};

  const entwurf = istEntwurf(artikel);

  return {
    title: artikel.seoTitle || artikel.title,
    description: artikel.seoDescription || artikel.excerpt,
    alternates: { canonical: `https://steakakademie.de${artikel.url}` },
    // Doppelter Boden: sollte ein Entwurf je ausgeliefert werden, dann
    // wenigstens nicht indexiert.
    robots: entwurf || artikel.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      title: artikel.seoTitle || artikel.title,
      description: artikel.seoDescription || artikel.excerpt,
      url: `https://steakakademie.de${artikel.url}`,
      publishedTime: artikel.publishedAt,
      ...(artikel.updatedAt && { modifiedTime: artikel.updatedAt }),
      authors: [artikel.author],
      images: artikel.image ? [{ url: artikel.image }] : undefined,
    },
    twitter: { card: 'summary_large_image', creator: '@steakakademie' },
  };
}

// ── MDX-Komponenten Override ──────────────────────────────────────────────────

const mdxComponents = {
  DiplomCTA,
  AffiliateBox,
  Schnelluebersicht,
  Achtung,
  ProTipp,
  TempBox,
  Leitfrage,
  Handgriff,
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
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-text-primary" {...props}>
      {children}
    </strong>
  ),
  // Ohne diesen Override rendern die Serien-Querverlinkungen als
  // Browser-Standardlinks — blau, unterstrichen, ausserhalb des Farbschemas.
  a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const extern = !!href && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        className="text-brand-fire underline underline-offset-4 decoration-1 hover:decoration-2 transition-[text-decoration-thickness]"
        {...(extern ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-[3px] border-brand-gold pl-4 my-6 font-body text-[1.0625rem] leading-[1.8] text-text-primary/90 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    // Breite Tabellen scrollen in ihrem eigenen Container, damit die Seite
    // auf schmalen Viewports nicht horizontal laeuft.
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-left font-body text-[0.9375rem] border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border-b border-border-subtle py-2 pr-4 font-sans text-xs font-bold tracking-wide uppercase text-brand-gold"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border-b border-border-subtle/50 py-2 pr-4 align-top text-text-primary" {...props}>
      {children}
    </td>
  ),
};

export default function ArtikelDetailPage(props: Props) {
  const params = use(props.params);
  const artikel = sichtbareArtikel(allArtikels).find((a) => a.slug === params.slug);
  if (!artikel) notFound();

  const entwurf = istEntwurf(artikel);
  const MDXContent = useMDXComponent(artikel.body.code);

  // Article-Schema nur fuer veroeffentlichte Artikel — ein Entwurf gehoert
  // nicht in strukturierte Daten, auch lokal nicht.
  const articleSchema = entwurf
    ? null
    : {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: artikel.title,
        description: artikel.excerpt,
        datePublished: artikel.publishedAt,
        ...(artikel.updatedAt && { dateModified: artikel.updatedAt }),
        author: { '@type': 'Person', name: artikel.author },
        mainEntityOfPage: `https://steakakademie.de${artikel.url}`,
        ...(artikel.image && { image: artikel.image }),
      };

  // FAQPage-Schema (03.09.2026). Gleiche Grenze wie beim Article-Schema: ein
  // Entwurf gehoert nicht in strukturierte Daten. Der sichtbare FAQ-Block
  // unten steht bewusst NICHT unter dieser Bedingung — beim Korrekturlesen
  // will Uwe die Fragen sehen, Google soll sie nur nicht auswerten.
  const faqItems = (artikel.faq as Array<{ question: string; answer: string }> | undefined) ?? [];
  const faqSch = !entwurf && faqItems.length > 0 ? faqSchema(faqItems) : null;

  return (
    <>
      <Header />
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(articleSchema) }}
        />
      )}
      {faqSch && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(faqSch) }}
        />
      )}

      <main className="min-h-screen bg-surface-base">
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/artikel" className="hover:text-brand-gold transition-colors">Artikel</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">{artikel.title}</span>
            </nav>

            {entwurf && (
              <div className="mb-5 px-4 py-3 border border-brand-fire bg-brand-fire/10">
                <p className="font-sans text-xs font-bold tracking-[0.12em] uppercase text-brand-fire mb-1">
                  Entwurf — nicht veröffentlicht
                </p>
                <p className="font-body text-sm text-text-light/70">
                  Diese Seite ist nur in der Entwicklungsumgebung erreichbar. Nach der
                  redaktionellen Prüfung <code>reviewed: true</code> setzen.
                </p>
              </div>
            )}

            <div className="max-w-3xl">
              {artikel.category && (
                <span className="inline-block mb-3 font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-brand-gold">
                  {artikel.category}
                </span>
              )}
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-4">
                {artikel.title}
              </h1>
              <p className="font-body text-base sm:text-lg text-text-light/70 leading-relaxed mb-5">
                {artikel.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-3 font-sans text-xs text-text-light/50">
                <Link href={`/autoren/${artikel.authorSlug}`} className="hover:text-brand-gold transition-colors">
                  {artikel.author}
                </Link>
                <span aria-hidden="true">·</span>
                <span>{artikel.formattedDate}</span>
                {artikel.readingTime ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} aria-hidden="true" />
                      {artikel.readingTime} Min. Lesezeit
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <article className="max-w-content">
            <MDXContent components={mdxComponents} />

            {/* FAQ-Block aus dem Frontmatter (03.09.2026). Wer die Fragen
                zusaetzlich im MDX ausschreibt, bekommt sie doppelt — der
                Block hier ist die eine Quelle. Layout wie /fleischwissen,
                nur auf hellem Grund. */}
            {faqItems.length > 0 && (
              <section className="mt-14">
                <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 pb-3 border-b border-border-subtle">
                  Häufige Fragen
                </h2>
                <dl className="space-y-5">
                  {faqItems.map((item) => (
                    <div key={item.question} className="pb-5 border-b border-border-subtle/60">
                      <dt className="font-sans font-bold text-text-primary mb-2">{item.question}</dt>
                      <dd className="font-body text-text-secondary leading-relaxed">{item.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {artikel.tags && artikel.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border-subtle flex flex-wrap gap-2">
                {artikel.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 font-sans text-xs border border-border-subtle text-text-secondary"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-10">
              <Link
                href="/artikel"
                className="font-sans text-sm font-bold text-brand-fire hover:underline underline-offset-4"
              >
                ← Alle Artikel
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </>
  );
}
