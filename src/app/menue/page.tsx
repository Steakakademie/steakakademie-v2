import type { Metadata } from 'next';
import { UtensilsCrossed } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allRecipes } from 'contentlayer/generated';
import MenueComposer, { type MenuRezept } from '@/components/menue/MenueComposer';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'Menü-Planer — BBQ-Menü mit Einkaufsliste',
  description:
    'Stelle dein Grill-Menü aus Rezepten zusammen: Hauptgang, Beilagen, Saucen, Dessert. Personenzahl wählen — die Einkaufsliste rechnet alle Mengen automatisch um.',
  alternates: { canonical: 'https://steakakademie.de/menue' },
  openGraph: {
    images: ogImages('Menü-Planer'),
    title: 'Menü-Planer',
    description: 'BBQ-Menü zusammenstellen, Personenzahl wählen, fertige Einkaufsliste kopieren.',
    url: 'https://steakakademie.de/menue',
    type: 'website',
  },
};

export default function MenuePage() {
  // Schlanke Datenbasis für den Client: nur was der Composer braucht.
  const rezepte: MenuRezept[] = allRecipes
    .map((r) => ({
      slug: r.slug ?? r._raw.flattenedPath.replace(/^rezepte\//, ''),
      title: r.title,
      kategorie: r.kategorie ?? 'fleisch',
      meatType: r.meatType ?? '',
      servings: r.servings ?? 4,
      totalTime: r.totalTime ?? '',
      ingredients: (r.ingredients ?? []) as MenuRezept['ingredients'],
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'de'));

  return (
    <>
      <Header />
      <main className="bg-surface-dark min-h-screen">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-fire">
              <UtensilsCrossed size={12} /> Menü-Planer
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-light mt-2 mb-3">
              Dein Grill-Menü — mit fertiger Einkaufsliste
            </h1>
            <p className="font-body text-base text-text-secondary max-w-2xl leading-relaxed">
              Wie in der Grillakademie: Gänge kombinieren, Gästezahl wählen, einkaufen, grillen.
              Alle Mengen werden pro Person exakt umgerechnet — Kerntemperaturen bleiben, was sie sind.
            </p>
          </div>
          <MenueComposer rezepte={rezepte} />
        </div>
      </main>
      <Footer />
    </>
  );
}
