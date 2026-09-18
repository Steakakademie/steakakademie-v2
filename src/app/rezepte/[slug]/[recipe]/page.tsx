import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { allRecipes } from 'contentlayer/generated';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RecipeTemplate from '@/components/RecipeTemplate';
import { getAllProducts } from '@/lib/products';
import type { ProductCategory } from '@/types';

interface Props {
  params: Promise<{ slug: string; recipe: string }>;
}

const EQUIPMENT_CATEGORY: Partial<Record<string, ProductCategory>> = {
  thermometer:    'thermometer',
  'sous-vide':    'sous-vide',
  grill:          'grill',
  smoker:         'smoker',
  oberhitzegrill: 'oberhitzegrill',
  'dry-ager':     'dry-ager',
  messer:         'messer',
  zubehoer:       'zubehoer',
};

export async function generateStaticParams() {
  return allRecipes.map((r) => ({ slug: r.kategorie, recipe: r.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const recipe = allRecipes.find(
    (r) => r.kategorie === params.slug && r.slug === params.recipe
  );
  if (!recipe) return {};

  const title       = recipe.seoTitle       ?? recipe.title;
  const description = recipe.seoDescription ?? recipe.description;

  return {
    title,
    description,
    keywords: recipe.keywords?.join(', '),
    alternates: { canonical: `https://steakakademie.de${recipe.url}` },
    openGraph: {
      title,
      description,
      url:    `https://steakakademie.de${recipe.url}`,
      images: [{ url: recipe.image, alt: recipe.imageAlt }],
      type:   'article',
    },
  };
}

export default async function RecipePage(props: Props) {
  const params = await props.params;
  const recipe = allRecipes.find(
    (r) => r.kategorie === params.slug && r.slug === params.recipe
  );
  if (!recipe) notFound();

  const categories = [
    ...(recipe.equipment ?? [])
      .map((tag) => EQUIPMENT_CATEGORY[tag])
      .filter((c): c is ProductCategory => !!c),
    'thermometer' as ProductCategory,
  ];

  const hardwareProducts = getAllProducts()
    .filter((p) => Array.from(new Set(categories)).includes(p.category))
    .sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0))
    .slice(0, 3);

  // Schema.org JSON-LD — nur BreadcrumbList.
  // Das Recipe-Schema liefert bereits die RecipeTemplate-Komponente; hier KEIN
  // zweites Recipe erzeugen (Duplikat verwirrt Google). Breadcrumb fehlt dort → ergänzen.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://steakakademie.de' },
      { '@type': 'ListItem', position: 2, name: 'Rezepte', item: 'https://steakakademie.de/rezepte' },
      { '@type': 'ListItem', position: 3, name: recipe.kategorie, item: `https://steakakademie.de/rezepte/${recipe.kategorie}` },
      { '@type': 'ListItem', position: 4, name: recipe.title, item: `https://steakakademie.de${recipe.url}` },
    ],
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main>
        <RecipeTemplate recipe={recipe} hardwareProducts={hardwareProducts} />
      </main>
      <Footer />
    </>
  );
}
