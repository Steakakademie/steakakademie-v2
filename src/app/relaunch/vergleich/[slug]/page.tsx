import { use } from "react";
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allVergleiches } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import { getProductsByCategory } from '@/lib/products';
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import type { Product } from '@/types';
import { skMdx, Crumbs, Faq } from '@/components/relaunch/Prose';

/**
 * Werkzeug / Vergleichstest (Handoff, Ansicht 6): Breite 1100px, Titel auf
 * 16ch, Lead auf 64ch mit Affiliate-Hinweis, darunter die getesteten Modelle
 * als Karten (Testsieger dunkel mit Akzentrahmen), dann der Testbericht.
 *
 * Produkte kommen aus products/registry.yaml (dieselbe Zuordnung Slug →
 * Kategorie wie live). Jede Karte trägt „Anzeige" sichtbar VOR dem Klick
 * (LG Köln 12.05.2026, CLAUDE.md § 2 Regel 1), Links laufen über /go/[id]
 * (Tracking-Redirect) mit rel="sponsored nofollow noopener".
 *
 * Die drei Infokästen „So haben wir getestet / Was zählt / Transparenz" des
 * Prototyps enthalten konkrete Methodik-Behauptungen, die in den Inhalten nicht
 * belegt sind — sie werden nicht erfunden. testedCount/testDuration aus dem
 * Frontmatter stehen im Kicker.
 */
type Props = { params: Promise<{ slug: string }> };

const SLUG_KATEGORIE: Record<string, Parameters<typeof getProductsByCategory>[0]> = {
  'fleischthermometer': 'thermometer',
  'premium-fleischthermometer': 'thermometer',
  'oberhitzegrill-vergleich': 'oberhitzegrill',
  'dry-aging-kuehlschrank-vergleich': 'dry-ager',
  'kuechenmaschine-vergleich': 'kuechenmaschine',
  'messer': 'messer',
  'grills': 'grill',
};

export function generateStaticParams() {
  return allVergleiches.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const v = allVergleiches.find((x) => x.slug === params.slug);
  if (!v) return {};
  return { title: v.seoTitle ?? v.title, description: v.seoDescription ?? v.excerpt };
}

function preis(p: Product) {
  if (p.priceMin && p.priceMax && p.priceMin !== p.priceMax) return `ab ${Math.round(p.priceMin)} €`;
  return `${Math.round(p.price)} €`;
}

export default function VergleichSeite(props: Props) {
  const params = use(props.params);
  const v = allVergleiches.find((x) => x.slug === params.slug);
  if (!v) notFound();
  const MDXContent = useMDXComponent(v.body.code);
  const produkte = SLUG_KATEGORIE[v.slug] ? getProductsByCategory(SLUG_KATEGORIE[v.slug]).slice(0, 3) : [];
  const faq = (v.faq as Array<{ question: string; answer: string }> | undefined) ?? [];
  const schemas = [
    articleSchema({
      headline: v.title, description: v.excerpt, image: v.image,
      datePublished: v.publishedAt, dateModified: v.updatedAt ?? v.publishedAt,
      authorName: v.author, authorSlug: v.authorSlug, url: v.url,
    }),
    breadcrumbSchema([{ name: 'Vergleiche', url: '/vergleich' }, { name: v.title, url: v.url }]),
    ...(faq.length ? [faqSchema(faq)] : []),
  ];

  return (
    <div className="sk-mid">
      {schemas.map((s, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />)}
      <Crumbs items={[{ label: 'Start', href: '/relaunch' }, { label: 'Ausrüstung', href: '/vergleich' }, { label: 'Tests' }]} />
      <div className="sk-kicker sk-kicker--accent" style={{ marginBottom: 14 }}>
        Vergleich · Selbst getestet{v.testedCount ? ` · ${v.testedCount} Modelle` : ''}{v.testDuration ? ` · ${v.testDuration}` : ''}
      </div>
      <h1 className="sk-h sk-h--page" style={{ maxWidth: '16ch' }}>{v.title}</h1>
      <p className="sk-lead" style={{ marginTop: 20, maxWidth: '64ch' }}>
        {v.excerpt} <span className="sk-meta sk-meta--14" style={{ display: 'inline' }}>Affiliate-Links gekennzeichnet, Preis für dich unverändert.</span>
      </p>

      {produkte.length > 0 && (
        <div className="sk-produkte">
          {produkte.map((p, i) => {
            const sieger = i === 0;
            const bild = p.imageUrl || p.image;
            return (
              <article key={p.id} className={`sk-produkt${sieger ? ' sk-produkt--sieger' : ''}`}>
                <div className="sk-produkt__top">
                  <span className={sieger ? 'sk-kicker--warm' : 'sk-kicker--accent'}>{p.badge ?? (sieger ? 'Testsieger' : 'Im Test')}</span>
                  <span className="sk-produkt__anzeige">Anzeige</span>
                </div>
                <div className="sk-produkt__bild">
                  {bild ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bild} alt={p.imageAlt ?? p.name} loading="lazy" />
                  ) : (
                    <span>Produktfoto folgt</span>
                  )}
                  {p.imageType === 'symbolic' && <span className="sk-produkt__symbol">Symbolbild</span>}
                </div>
                <div className="sk-h sk-h--sub">{p.name}</div>
                <div className="sk-meta sk-meta--14">
                  {p.rating ? `${p.rating.toFixed(1).replace('.', ',')}${p.ratingCount ? ` · ${p.ratingCount.toLocaleString('de-DE')} Bewertungen` : ''}` : 'Modell aus dem Test'}
                </div>
                {p.pros?.length ? <ul className="sk-produkt__pros">{p.pros.slice(0, 3).map((x) => <li key={x}>{x}</li>)}</ul> : null}
                <div className="sk-produkt__foot">
                  <span className="sk-produkt__preis">{preis(p)}</span>
                  <a href={`/go/${p.id}`} rel="sponsored nofollow noopener" target="_blank" className={`sk-btn ${sieger ? 'sk-btn--primary' : 'sk-btn--outline'}`}>
                    {p.provider === 'amazon' ? 'Bei Amazon ansehen' : 'Zum Angebot'}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="sk-prose" style={{ marginTop: 48, maxWidth: '66ch' }}>
        <MDXContent components={skMdx} />
      </div>

      <Faq items={faq} />

      <div className="sk-grid" style={{ ['--min' as string]: '280px', marginTop: 56, gap: 14 }}>
        <Link href="/relaunch/rezepte" className="sk-card" style={{ gap: 6 }}>
          <span className="sk-kicker sk-kicker--13 sk-kicker--muted">Zurück ans Feuer</span>
          <span className="sk-h sk-h--card">Rezepte, die eine Methode lehren</span>
          <span className="sk-meta sk-meta--14">Acht Rezepte, acht Techniken — mit Portionsrechner.</span>
        </Link>
        <Link href="/relaunch/diplome" className="sk-card sk-card--dark" style={{ gap: 6, border: 0 }}>
          <span className="sk-kicker sk-kicker--13 sk-kicker--warm">Weiter im Diplom</span>
          <span className="sk-h sk-h--card">Stufe 1 · Der Funke</span>
          <span className="sk-meta sk-meta--14">Sieben Lektionen, ohne Login.</span>
        </Link>
      </div>
    </div>
  );
}
