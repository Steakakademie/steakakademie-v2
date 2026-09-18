import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CutGenerator from '@/components/cuts/CutGenerator';
import { getCutsBySpecies, getCutById, ALL_CUTS } from '@/lib/cuts-catalog';
import { buildCutRecipeMap } from '@/lib/cut-recipes';

interface PageProps {
  searchParams: Promise<{ cut?: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const cut = searchParams.cut ? getCutById(searchParams.cut) : undefined;
  const title = cut
    ? `Mein perfekter Cut: ${cut.nameDE}`
    : 'Cut-Generator — finde deinen Steak-Cut';
  const description = cut
    ? `${cut.nameDE} (${cut.nameEN}) — ${cut.blurb} Finde mit dem Cut-Generator deinen perfekten Steak-Cut.`
    : 'Beantworte 4 Fragen und der Cut-Generator findet deinen perfekten Rinder-Cut — mit Cut-DNA, passendem Rezept und Bezugsquelle. Teilbar für Social Media.';
  const ogImage = cut ? `/api/og/cut?cut=${cut.id}` : '/api/og/cut';

  return {
    title,
    description,
    alternates: { canonical: 'https://steakakademie.de/cut-generator' },
    openGraph: {
      title: cut ? `Mein perfekter Cut: ${cut.nameDE} 🥩` : 'Cut-Generator — Welcher Steak-Cut bist du?',
      description,
      url: 'https://steakakademie.de/cut-generator',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', creator: '@steakakademie' },
  };
}

export default function CutGeneratorPage() {
  const bySpecies = {
    rind: getCutsBySpecies('rind'),
    schwein: getCutsBySpecies('schwein'),
  };
  const recipeMap = buildCutRecipeMap(ALL_CUTS);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/cuts" className="hover:text-brand-gold transition-colors">Cut-Atlas</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Cut-Generator</span>
            </nav>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="max-w-2xl">
                <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                  Steakakademie · Cut-Generator
                </span>
                <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-4">
                  Welcher Cut passt zu dir?
                </h1>
                <p className="font-body text-lg text-text-light/70 leading-relaxed">
                  Vier Fragen — ein perfekter Cut. Inklusive Cut-DNA, passendem Rezept und Bezugsquelle.
                  Dein Ergebnis kannst du teilen.
                </p>
              </div>
              <div className="relative">
                <Image
                  src="/images/cut-atlas-stier.jpg"
                  alt="Kräftiger schwarzer Stier in Glut-Atmosphäre — Wahrzeichen des Steakakademie Cut-Generators"
                  width={1264}
                  height={842}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="w-full h-auto rounded-lg ring-1 ring-brand-gold/15 shadow-2xl shadow-black/40"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <CutGenerator bySpecies={bySpecies} recipeMap={recipeMap} />

          <p className="text-center text-text-light/40 text-sm font-sans mt-8">
            Lieber selbst stöbern?{' '}
            <Link href="/cuts" className="text-brand-gold hover:underline">Zum vollständigen Cut-Atlas →</Link>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
