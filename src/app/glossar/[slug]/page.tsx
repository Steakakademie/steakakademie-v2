import { use } from "react";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, BookOpen, ArrowLeft } from 'lucide-react';
import { allGlossars } from 'contentlayer/generated';
import { sichtbareArtikel } from '@/lib/redaktion';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Schnelluebersicht, Achtung, ProTipp, TempBox } from '@/components/mdx/Callouts';
import { breadcrumbSchema, definedTermSchema } from '@/lib/schema';
import { ogImages } from '@/lib/og';

interface Props {
  params: Promise<{ slug: string }>;
}

// Eine Liste fuer alles auf dieser Seite — statische Pfade, Metadaten, Inhalt
// und "Verwandte Begriffe". Ein Entwurf bekommt in Produktion damit weder eine
// Route noch einen Link von einem anderen Begriff aus.
const sichtbareBegriffe = sichtbareArtikel(allGlossars);

export async function generateStaticParams() {
  return sichtbareBegriffe.map(g => ({ slug: g.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const entry = sichtbareBegriffe.find(g => g.slug === params.slug);
  if (!entry) return {};
  const title = entry.seoTitle ?? `${entry.title} — BBQ-Glossar`;
  const description = entry.seoDescription ?? entry.shortDefinition;
  return {
    title,
    description,
    alternates: { canonical: `https://steakakademie.de${entry.url}` },
    openGraph: {
      images: ogImages(entry.title),
      title,
      description,
      url: `https://steakakademie.de${entry.url}`,
      type: 'article',
    },
  };
}

const mdxComponents = {
  // Callouts wie in Rezepten, Methoden und Diplom-Lektionen. Ohne die
  // Registrierung bricht MDX ab, sobald ein Glossar-Eintrag einen Callout
  // benutzt — und gerade Warnhinweise gehoeren ins Glossar (Regel 8c).
  Schnelluebersicht, Achtung, ProTipp, TempBox,
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="font-serif text-2xl font-bold text-text-light mt-10 mb-4 pb-3 leading-tight"
      style={{ borderBottom: '1px solid rgba(200,136,42,0.2)' }}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-serif text-xl font-bold text-text-light mt-8 mb-3" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="font-body text-[1.0625rem] leading-[1.85] text-text-light/75 mb-5" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem] text-text-light/75" {...props}>{children}</ul>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-text-light" {...props}>{children}</strong>
  ),
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      className="text-brand-fire font-medium hover:text-brand-gold transition-colors"
      {...props}
    >
      {children}
    </a>
  ),
};

export default function GlossarEntryPage(props: Props) {
  const params = use(props.params);
  const entry = sichtbareBegriffe.find(g => g.slug === params.slug);
  if (!entry) notFound();

  const MDXContent = useMDXComponent(entry.body.code);

  const related = sichtbareBegriffe
    .filter(g => g.slug !== entry.slug && g.category === entry.category)
    .slice(0, 4);

  const breadcrumbSch = breadcrumbSchema([
    { name: 'Glossar', url: '/glossar' },
    { name: entry.title, url: entry.url },
  ]);

  const definitionSch = definedTermSchema({
    title: entry.title,
    url: entry.url,
    shortDefinition: entry.shortDefinition,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(definitionSch) }} />
      <Header />
      <main className="min-h-screen" style={{ backgroundColor: '#0D0D0D' }}>

        {/* Hero */}
        <section className="border-b border-border-subtle">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs font-sans text-text-muted mb-8">
              <Link href="/" className="hover:text-brand-gold transition-colors">Startseite</Link>
              <ChevronRight size={12} className="opacity-40" />
              <Link href="/glossar" className="hover:text-brand-gold transition-colors">Glossar</Link>
              <ChevronRight size={12} className="opacity-40" />
              <span className="text-text-secondary">{entry.title}</span>
            </nav>

            {/* Category badge */}
            <div className="mb-4">
              <span
                className="inline-block font-sans text-[11px] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(200,136,42,0.1)',
                  border: '1px solid rgba(200,136,42,0.25)',
                  color: '#C8882A',
                }}
              >
                {entry.category}
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-text-light leading-tight mb-5">
              {entry.title}
            </h1>

            {/* Short definition callout */}
            <blockquote
              className="font-body text-lg text-text-light/80 leading-relaxed pl-5"
              style={{ borderLeft: '3px solid #C8882A' }}
            >
              {entry.shortDefinition}
            </blockquote>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <article className="prose-custom">
            <MDXContent components={mdxComponents} />
          </article>

          {/* Related glossary entries */}
          {related.length > 0 && (
            <div className="mt-14 pt-10 border-t border-border-subtle">
              <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted mb-5">
                Verwandte Begriffe — {entry.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map(r => (
                  <Link
                    key={r.slug}
                    href={r.url}
                    className="group flex items-start gap-3 p-4 rounded-lg"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <BookOpen size={14} className="text-brand-gold/50 group-hover:text-brand-gold shrink-0 mt-0.5 transition-colors" />
                    <div>
                      <span className="font-sans font-semibold text-sm text-text-light group-hover:text-brand-gold transition-colors block">
                        {r.title}
                      </span>
                      <span className="font-body text-xs text-text-muted mt-1 line-clamp-1 block">
                        {r.shortDefinition}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-border-subtle">
            <Link
              href="/glossar"
              className="inline-flex items-center gap-2 font-sans text-sm text-text-secondary hover:text-brand-gold transition-colors"
            >
              <ArrowLeft size={14} />
              Zurück zum BBQ-Glossar
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
