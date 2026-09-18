import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Clock, Users, ChefHat, Award, Sparkles } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GenerateImageButton from '@/components/recipe/GenerateImageButton';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PITMASTER_SEAL = 85; // quality_score-Schwelle für das Gold-Siegel

type Zutat = { menge: string; einheit: string; name: string };
type Schritt = { beschreibung: string };
type CommunityRecipe = {
  slug: string;
  title: string;
  description: string;
  portions: string | null;
  prep_time: string | null;
  ingredients: Zutat[];
  steps: Schritt[];
  image_url: string | null;
  author_name: string;
  quality_score: number | null;
  published_at: string | null;
};

async function getRecipe(slug: string): Promise<CommunityRecipe | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_recipes')
    .select('slug, title, description, portions, prep_time, ingredients, steps, image_url, author_name, quality_score, published_at')
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();
  return (data as CommunityRecipe | null) ?? null;
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const r = await getRecipe(params.slug);
  if (!r) return { title: 'Rezept nicht gefunden' };
  return {
    title: `${r.title} — Community-Rezept`,
    description: r.description,
    alternates: { canonical: `https://steakakademie.de/rezepte/community/${r.slug}` },
    openGraph: {
      title: r.title,
      description: r.description,
      url: `https://steakakademie.de/rezepte/community/${r.slug}`,
      type: 'article',
      ...(r.image_url ? { images: [{ url: r.image_url }] } : {}),
    },
  };
}

export default async function CommunityRecipePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const r = await getRecipe(params.slug);
  if (!r) notFound();

  const recipeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.title,
    description: r.description,
    author: { '@type': 'Person', name: r.author_name },
    ...(r.published_at ? { datePublished: r.published_at } : {}),
    ...(r.image_url ? { image: [r.image_url] } : {}),
    ...(r.prep_time ? { totalTime: r.prep_time } : {}),
    ...(r.portions ? { recipeYield: r.portions } : {}),
    recipeIngredient: r.ingredients.map((z) => `${z.menge} ${z.einheit} ${z.name}`.trim()),
    recipeInstructions: r.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: s.beschreibung,
    })),
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeSchema) }}
      />
      <main className="bg-surface-base min-h-screen">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-6" aria-label="Breadcrumb">
            <Link href="/rezepte" className="hover:text-brand-gold transition-colors">Rezepte</Link>
            <ChevronRight size={12} />
            <Link href="/rezepte/community" className="hover:text-brand-gold transition-colors">Community</Link>
            <ChevronRight size={12} />
            <span className="text-text-primary">{r.title}</span>
          </nav>

          {/* Community-Badge */}
          <div className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
            <ChefHat size={12} /> Community-Rezept
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary mb-3 leading-tight">
            {r.title}
          </h1>
          <p className="font-body text-lg text-text-secondary leading-relaxed mb-5">{r.description}</p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-sans text-text-muted mb-8 pb-8 border-b border-border-subtle">
            <span>von <strong className="text-brand-gold">{r.author_name}</strong></span>
            {r.portions && <span className="flex items-center gap-1.5"><Users size={13} /> {r.portions} Portionen</span>}
            {r.prep_time && <span className="flex items-center gap-1.5"><Clock size={13} /> {r.prep_time}</span>}
            {(r.quality_score ?? 0) >= PITMASTER_SEAL && (
              <span className="inline-flex items-center gap-1.5 text-brand-gold font-bold">
                <Award size={13} /> Pitmaster-geprüft
              </span>
            )}
          </div>

          {/* Bild (Phase 2) */}
          {r.image_url ? (
            <div className="relative w-full aspect-[16/9] mb-10 overflow-hidden rounded-sm border border-border-subtle">
              <Image src={r.image_url} alt={`${r.title} — KI-generiertes Symbolbild`} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" unoptimized />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-sans font-bold tracking-[0.1em] uppercase px-2.5 py-1 bg-surface-dark/90 backdrop-blur-sm border border-border-subtle text-brand-gold">
                <ChefHat size={11} /> {r.author_name}
              </span>
              {/* KI-Kennzeichnung (EU-AI-Act Art. 50 / § 5 UWG): das Bild ist KI-generiert, nicht das echte Gericht */}
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.1em] uppercase px-2 py-1 bg-black/65 backdrop-blur-sm border border-white/15 text-zinc-200">
                <Sparkles size={10} /> KI-Symbolbild
              </span>
              {(r.quality_score ?? 0) >= PITMASTER_SEAL && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 text-[11px] font-sans font-bold tracking-[0.1em] uppercase px-2.5 py-1 backdrop-blur-sm border"
                  style={{ background: 'rgba(200,136,42,0.9)', color: '#1a1206', borderColor: 'rgba(255,255,255,0.25)' }}>
                  <Award size={11} /> Pitmaster-geprüft
                </span>
              )}
            </div>
          ) : (
            <GenerateImageButton slug={r.slug} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
            {/* Zutaten */}
            <aside>
              <h2 className="font-serif text-xl font-bold text-text-primary mb-4">Zutaten</h2>
              <ul className="space-y-2">
                {r.ingredients.map((z, i) => (
                  <li key={i} className="flex gap-2 text-sm font-body text-text-secondary border-b border-border-subtle/60 pb-2">
                    <span className="font-bold text-text-primary shrink-0 min-w-[64px]">{z.menge} {z.einheit}</span>
                    <span>{z.name}</span>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Zubereitung */}
            <div>
              <h2 className="font-serif text-xl font-bold text-text-primary mb-4">Zubereitung</h2>
              <ol className="space-y-5">
                {r.steps.map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="shrink-0 w-7 h-7 flex items-center justify-center font-serif text-sm font-bold rounded-full"
                      style={{ background: 'rgba(200,136,42,0.12)', color: '#C8882A' }}>
                      {i + 1}
                    </span>
                    <p className="font-body text-[1.0625rem] leading-[1.8] text-text-primary pt-0.5">{s.beschreibung}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Footer-Hinweis */}
          <div className="mt-12 pt-6 border-t border-border-subtle">
            <p className="text-xs font-sans text-text-muted">
              Von einem Mitglied der Steakakademie eingereicht und KI-geprüft.{' '}
              {r.image_url && <>Das Beitragsbild ist ein KI-generiertes Symbolbild und kann vom tatsächlichen Gericht abweichen.{' '}</>}
              <Link href="/rezepte/community" className="text-brand-gold hover:underline">Mehr Community-Rezepte →</Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
