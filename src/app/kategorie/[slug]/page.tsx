import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allCuts, allMethodes, allVergleiches } from 'contentlayer/generated';
import { collectionPageSchema, breadcrumbSchema } from '@/lib/schema';

interface Props {
  params: Promise<{ slug: string }>;
}

type CategoryConfig = {
  title: string;
  description: string;
  label: string;
  canonical: string;
};

const CATEGORIES: Record<string, CategoryConfig> = {
  cuts: {
    title: 'Cuts & Fleischkunde',
    description: 'Ribeye, Brisket, Pulled Pork und mehr — alles über Cuts, Anatomie und optimale Zubereitung.',
    label: 'Cuts & Fleischkunde',
    canonical: 'https://steakakademie.de/kategorie/cuts',
  },
  grilltechniken: {
    title: 'Grilltechniken',
    description: 'Reverse Sear, Low & Slow, Direct Heat — alle Grilltechniken methodisch erklärt.',
    label: 'Grilltechniken',
    canonical: 'https://steakakademie.de/kategorie/grilltechniken',
  },
  ausruestung: {
    title: 'Ausrüstung & Tests',
    description: 'Thermometer, Grills, Messer — praxiserprobte Produktvergleiche ohne Werbung.',
    label: 'Ausrüstung & Tests',
    canonical: 'https://steakakademie.de/kategorie/ausruestung',
  },
};

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({ slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const cat = CATEGORIES[params.slug];
  if (!cat) return {};
  return {
    title: cat.title,
    description: cat.description,
    alternates: { canonical: cat.canonical },
  };
}

type ArticleItem = {
  title: string;
  excerpt: string;
  url: string;
  image: string;
  imageAlt: string;
  formattedDate: string;
  categoryLabel: string;
};

function getArticles(slug: string): ArticleItem[] {
  switch (slug) {
    case 'cuts':
      return allCuts.map((c) => ({
        title: c.title,
        excerpt: c.excerpt,
        url: c.url,
        image: c.image,
        imageAlt: c.imageAlt,
        formattedDate: c.formattedDate,
        categoryLabel: 'Cuts & Fleischkunde',
      }));
    case 'grilltechniken':
      return allMethodes.map((m) => ({
        title: m.title,
        excerpt: m.excerpt,
        url: m.url,
        image: m.image,
        imageAlt: m.imageAlt,
        formattedDate: m.formattedDate,
        categoryLabel: 'Grilltechniken',
      }));
    case 'ausruestung':
      return allVergleiches.map((v) => ({
        title: v.title,
        excerpt: v.excerpt,
        url: v.url,
        image: v.image,
        imageAlt: v.imageAlt,
        formattedDate: v.formattedDate,
        categoryLabel: 'Ausrüstung & Tests',
      }));
    default:
      return [];
  }
}

export default async function KategoriePage(props: Props) {
  const params = await props.params;
  const cat = CATEGORIES[params.slug];
  if (!cat) notFound();

  const articles = getArticles(params.slug);

  const collectionSchema = collectionPageSchema(cat.label, `/kategorie/${params.slug}`, cat.description);
  const breadcrumb = breadcrumbSchema([{ name: cat.label, url: `/kategorie/${params.slug}` }]);

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className="min-h-screen bg-surface-base">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={12} />
            <span>Kategorien</span>
            <ChevronRight size={12} />
            <span>{cat.label}</span>
          </nav>

          {/* Header */}
          <div className="mb-12 pb-10 border-b-2 border-text-primary">
            <p className="text-xs font-sans font-bold tracking-widest uppercase text-brand-fire mb-3">Kategorie</p>
            <h1 className="font-serif text-4xl font-bold text-text-primary mb-4">{cat.label}</h1>
            <p className="font-body text-text-secondary max-w-content">{CATEGORIES[params.slug].description}</p>
          </div>

          {/* Article grid */}
          {articles.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2">
              {articles.map((article) => (
                <Link
                  key={article.url}
                  href={article.url}
                  className="group block border border-border-subtle hover:border-brand-fire transition-colors"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-surface-elevated">
                    <Image
                      src={article.image}
                      alt={article.imageAlt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <p className="text-xs font-sans font-bold tracking-widest uppercase text-brand-fire mb-2">
                      {article.categoryLabel}
                    </p>
                    <h2 className="font-serif text-xl font-bold text-text-primary group-hover:text-brand-fire transition-colors mb-2 leading-snug">
                      {article.title}
                    </h2>
                    <p className="font-body text-sm text-text-secondary line-clamp-2 mb-3">
                      {article.excerpt}
                    </p>
                    <p className="text-xs font-sans text-text-muted">{article.formattedDate}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="font-body text-text-secondary mb-2">Noch keine Artikel in dieser Kategorie.</p>
              <p className="text-sm font-sans text-text-muted">Bald verfügbar — wir arbeiten daran.</p>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
