import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allRecipes } from 'contentlayer/generated';
import { breadcrumbSchema } from '@/lib/schema';
import RecipeSubmitModal from '@/components/recipe/RecipeSubmitModal';
import RecipeExplorer from '@/components/recipe/RecipeExplorer';
import RecipeIndex from '@/components/recipe/RecipeIndex';
import { toCardData } from '@/lib/rezept/card-data';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'BBQ-Rezepte — Geprüfte Rezepte vom Grill',
  description:
    'Präzise BBQ-Rezepte mit interaktivem Portionsrechner und Schritt-für-Schritt Koch-Coach. Sous-Vide, Reverse Sear, Low & Slow — jedes Rezept mehrfach getestet.',
  alternates: { canonical: 'https://steakakademie.de/rezepte' },
  openGraph: {
    images: ogImages('BBQ-Rezepte'),
    title: 'BBQ-Rezepte',
    description: 'Geprüfte Grill-Rezepte mit interaktivem Koch-Coach und automatischer Portionsskalierung.',
    url: 'https://steakakademie.de/rezepte',
    type: 'website',
  },
};

export default function RezepteIndexPage() {
  const recipes = allRecipes
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .map(toCardData);

  const breadcrumbSch = breadcrumbSchema([{ name: 'Rezepte', url: '/rezepte' }]);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'BBQ-Rezepte der Steakakademie',
    itemListElement: recipes.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://steakakademie.de${r.url}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <Header />

      <main>
        {/* ── Schmale Leiste: Breadcrumb + Menü-Planer ────────────────────── */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">Rezepte</span>
            </nav>
            <Link
              href="/menue"
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-sans font-bold tracking-widest uppercase text-brand-gold hover:text-brand-fire transition-colors"
            >
              Menü-Planer mit Einkaufsliste <ChevronRight size={13} />
            </Link>
          </div>
        </section>

        {/* ── TM-Hero (Foto + zentrierte Suche) + helle Editorial-Zone ───── */}
        <div className="reading-light">
          <RecipeExplorer
            recipes={recipes}
            hero={{
              image: '/images/rezepte/dry-aged-ribeye-hero.jpg',
              imageAlt: 'Dry-Aged Ribeye auf dem Grill — Titelbild der Rezept-Sammlung',
              title: 'Rezepte',
              subtitle:
                'Grill wie ein Akademiker — jedes Rezept mehrfach am Grill getestet, mit Portionsrechner und Schritt-für-Schritt Koch-Coach.',
            }}
          />
        </div>

        {/* ── Vollstaendiges Linkverzeichnis (serverseitig, crawlbar) ────── */}
        <RecipeIndex />

        {/* ── Community-Band — Austausch + eigenes Rezept einreichen ─────── */}
        <section className="border-t border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                  <Users size={12} /> Aus der Community
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-light mb-2">
                  Rezepte von Mitgliedern — KI-geprüft, freigegeben
                </h2>
                <p className="font-body text-text-light/60 leading-relaxed max-w-xl mb-4">
                  Echte Kreationen zum Nachgrillen, eingereicht von der Akademie-Community.
                  Jede Einreichung wird von einer KI auf Sicherheit und Qualität geprüft —
                  gute Rezepte gehen sofort live.
                </p>
                <Link
                  href="/rezepte/community"
                  className="inline-flex items-center gap-1.5 text-xs font-sans font-bold tracking-widest uppercase text-brand-gold hover:text-brand-fire transition-colors"
                >
                  Alle Community-Rezepte <ChevronRight size={14} />
                </Link>
              </div>
              <RecipeSubmitModal />
            </div>
          </div>
        </section>

        {/* ── E-E-A-T-Hinweis ────────────────────────────────────────────── */}
        <section>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
            <p className="font-body text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
              Alle Rezepte der Steakakademie werden vor Veröffentlichung mehrfach am Grill getestet und auf Reproduzierbarkeit geprüft.
              Affiliate-Links sind klar gekennzeichnet —{' '}
              <Link href="/affiliate-disclosure" className="text-brand-gold hover:text-brand-fire transition-colors underline underline-offset-2">
                Offenlegung
              </Link>.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
