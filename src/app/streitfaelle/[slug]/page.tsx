import { use } from "react";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { allStreitfalls } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { getAuthorBySlug } from '@/lib/authors';
import StreitfallUmfrage from '@/components/streitfaelle/StreitfallUmfrage';
import AutorHinweis from '@/components/AutorHinweis';
// 03.09.2026: siehe Kommentar in src/app/artikel/[slug]/page.tsx — dieselbe
// Luecke. Bewusst nur AffiliateBox, KEIN DiplomCTA: ein Streitfall ist kurz,
// und die Seite spielt aus dem Frontmatter schon Merksatz-, Entscheidungs-
// und FAQ-Box aus. Ein zweiter Conversion-Block waere einer zu viel.
import AffiliateBox from '@/components/mdx/AffiliateBox';
import { sichtbareArtikel } from '@/lib/redaktion';
import { Calendar, ChevronRight, RotateCcw, Scale, AlertTriangle, Sparkles } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

// sichtbareArtikel statt roher Collection (03.09.2026, Redaktionsvorbehalt).
// In Produktion erzeugt generateStaticParams damit fuer einen Entwurf gar keine
// Route — er liefert 404 statt ungepruefter KI-Text. Lokal bleibt er lesbar,
// damit Uwe ihn vor der Freigabe auf der Seite pruefen kann.
const sichtbare = () => sichtbareArtikel(allStreitfalls);

export async function generateStaticParams() {
  return sichtbare().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const doc = sichtbare().find((s) => s.slug === params.slug);
  if (!doc) return {};
  const title = doc.seoTitle ?? doc.title;
  const description = doc.seoDescription ?? doc.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `https://steakakademie.de${doc.url}` },
    openGraph: {
      title,
      description,
      url: `https://steakakademie.de${doc.url}`,
      images: [{ url: doc.image, alt: doc.imageAlt }],
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title, description, images: [doc.image] },
  };
}

const mdxComponents = {
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

export default function StreitfallPage(props: Props) {
  const params = use(props.params);
  const doc = sichtbare().find((s) => s.slug === params.slug);
  if (!doc) notFound();

  const MDXContent = useMDXComponent(doc.body.code);

  // Die Qualifikation unter der Entscheidung kommt aus dem Autorendatensatz und
  // ist NICHT fest verdrahtet. Eine Entscheidung aus 30 Jahren Praxis darf nur
  // unter dem Namen stehen, der sie tatsaechlich getroffen hat — nicht unter
  // einer Redaktionspersona.
  const autor = getAuthorBySlug(doc.authorSlug);

  const articleSch = articleSchema({
    headline: doc.title,
    description: doc.excerpt,
    image: doc.image,
    datePublished: doc.publishedAt,
    dateModified: doc.updatedAt ?? doc.publishedAt,
    authorName: doc.author,
    authorSlug: doc.authorSlug,
    url: doc.url,
  });

  const breadcrumbSch = breadcrumbSchema([
    { name: 'Streitfälle', url: '/streitfaelle' },
    { name: doc.streitfrage, url: doc.url },
  ]);

  // Die Streitfrage selbst gehoert ins FAQ-Schema — sie ist die Frage, mit der
  // Nutzer suchen. Antwort ist die Entscheidung, nicht der Merksatz: Der Merksatz
  // ist die Merkhilfe, die Entscheidung ist die Aussage mit Bedingung.
  const faqItems = [
    ...(doc.entscheidung
      ? [{ question: doc.streitfrage, answer: doc.entscheidung }]
      : []),
    ...((doc.faq as Array<{ question: string; answer: string }> | undefined) ?? []),
  ];
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
            <Link href="/streitfaelle" className="hover:text-brand-gold transition-colors">Streitfälle</Link>
            <ChevronRight size={12} />
            <span className="text-text-light/65">{doc.streitfrage}</span>
          </nav>
        </div>

        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <article className="max-w-content mx-auto">
            <header className="mb-10">
              <span className="category-label">Streitfall</span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-light mt-3 mb-5 leading-tight">
                {doc.title}
              </h1>
              <p className="font-body text-lg text-text-light/75 leading-relaxed mb-6">{doc.excerpt}</p>

              {doc.istMythos && (
                <div
                  className="flex items-start gap-3 p-4 mb-6"
                  style={{ background: 'rgba(232,80,24,0.08)', border: '1px solid rgba(232,80,24,0.3)' }}
                >
                  <AlertTriangle size={18} className="text-brand-fire shrink-0 mt-0.5" />
                  <p className="font-sans text-sm text-text-light/80 leading-relaxed">
                    In diesem Fall hat <strong className="text-text-light">nicht</strong> jede Seite recht.
                    Eine der beiden Behauptungen ist widerlegt — und wir sagen welche.
                  </p>
                </div>
              )}

              <div
                className="flex flex-wrap items-center gap-4 text-xs font-sans text-text-light/45 pb-6"
                style={{ borderBottom: '1px solid rgba(200,136,42,0.15)' }}
              >
                <Link href={`/autoren/${doc.authorSlug}`} className="flex items-center gap-2 hover:text-brand-gold transition-colors">
                  <div className="w-6 h-6 rounded-full" style={{ background: 'rgba(200,136,42,0.2)' }} />
                  {doc.author}
                </Link>
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {doc.formattedDate}
                </span>
                {doc.updatedAt && (
                  <span className="flex items-center gap-1.5 text-brand-gold font-medium">
                    <RotateCcw size={12} />
                    Aktualisiert: {new Date(doc.updatedAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </header>

            <div className="cinema-frame mb-3 aspect-[16/9]">
              <Image src={doc.image} alt={doc.imageAlt} width={800} height={500} className="w-full h-full object-cover" priority />
            </div>
            <p className="text-xs font-sans text-text-light/40 mb-10 italic">
              {doc.imageAlt}
              {doc.imageAI && ' · KI-generiert'}
            </p>

            <MDXContent components={mdxComponents} />

            {/* Die Entscheidung — das eigentliche Produkt dieser Seite.
                Steht im Frontmatter, damit sie auch in der Uebersicht und im
                FAQ-Schema ausgespielt werden kann. Fehlt sie, ist der Beitrag ein
                Entwurf — dann zeigen wir das offen an, statt die Luecke zu kaschieren. */}
            <section className="mt-14">
              {doc.entscheidung ? (
                <div
                  className="p-7"
                  style={{
                    background: 'linear-gradient(135deg, rgba(200,136,42,0.12) 0%, rgba(232,80,24,0.04) 100%)',
                    border: '1px solid rgba(200,136,42,0.35)',
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <Scale size={18} className="text-brand-gold" />
                    <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-brand-gold">
                      Die Entscheidung
                    </span>
                  </div>
                  <p className="font-body text-xl leading-[1.7] text-text-light">{doc.entscheidung}</p>
                  <p className="font-sans text-xs text-text-light/50 mt-5">
                    {doc.author}{autor?.statsLabel ? ` — ${autor.statsLabel}` : ''}
                  </p>
                </div>
              ) : (
                <div className="p-7" style={{ border: '1px dashed rgba(200,136,42,0.4)' }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <Scale size={18} className="text-text-light/40" />
                    <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-text-light/40">
                      Die Entscheidung folgt
                    </span>
                  </div>
                  <p className="font-body text-base text-text-light/60 leading-relaxed">
                    Dieser Streitfall ist recherchiert, aber noch nicht entschieden. Die Einordnung
                    aus der Praxis wird nachgetragen.
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-start gap-3 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <Sparkles size={17} className="text-brand-gold shrink-0 mt-0.5" />
                <div>
                  <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-text-light/45 block mb-1.5">
                    Wenn du nur einen Satz mitnimmst
                  </span>
                  <p className="font-body text-lg text-text-light leading-relaxed">{doc.merksatz}</p>
                </div>
              </div>
            </section>

            {/* Umfrage steht bewusst UNTER der Entscheidung. Der Nutzer soll erst
                die Antwort aus der Praxis lesen und dann sagen, wie er es selbst
                macht — nicht ueber die Wahrheit abstimmen. */}
            {doc.umfrage ? (
              <StreitfallUmfrage
                slug={doc.slug}
                frage={(doc.umfrage as { frage: string }).frage}
                optionen={(doc.umfrage as { optionen: { key: string; label: string }[] }).optionen}
              />
            ) : null}

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

            {/* KI-Kennzeichnung (Art. 50 KI-VO) — siehe Kommentar in der
                Relaunch-Vorlage. */}
            <div className="mt-10 pt-6 border-t border-border-subtle">
              <AutorHinweis authorSlug={doc.authorSlug} />
            </div>

            <div className="mt-12">
              <Link
                href="/streitfaelle"
                className="inline-flex items-center gap-2 font-sans text-sm font-bold text-brand-gold hover:opacity-80 transition-opacity"
              >
                Alle Streitfälle <ChevronRight size={15} />
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
