import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, GitFork, Users } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allRecipes } from 'contentlayer/generated';
import { breadcrumbSchema } from '@/lib/schema';
import RecipeSubmitModal from '@/components/recipe/RecipeSubmitModal';
import RecipeExplorer from '@/components/recipe/RecipeExplorer';
import RecipeIndex from '@/components/recipe/RecipeIndex';
import { toCardData } from '@/lib/rezept/card-data';
import { ogImages } from '@/lib/og';
import { verantwortungsangabe } from '@/lib/pruefnachweis';
import { MUTTERREZEPTE, anzahlFrei } from '@/lib/mutterrezepte';

// 03.10.2026: Die Testbehauptungen („jedes Rezept mehrfach am Grill getestet") sind
// raus — ein Grilltest je Rezept ist nicht belegt. Es gilt, was unter jedem Rezept
// steht (AutorHinweis): KI-unterstützt erstellt, fachlich verantwortet. „Geprüft“
// sagt diese Übersicht nicht mehr: Die Aussage gibt es nur am einzelnen Rezept und
// nur mit Prüfdatum (src/lib/pruefnachweis.ts).
export const metadata: Metadata = {
  title: 'BBQ-Rezepte vom Grill — mit Portionsrechner und Koch-Coach',
  description: `Präzise BBQ-Rezepte mit Portionsrechner und Koch-Coach: Sous-Vide, Reverse Sear, Low & Slow — KI-unterstützt erstellt, ${verantwortungsangabe()}.`,
  alternates: { canonical: 'https://steakakademie.de/rezepte' },
  openGraph: {
    images: ogImages('BBQ-Rezepte'),
    title: 'BBQ-Rezepte',
    description: 'Grill-Rezepte mit interaktivem Koch-Coach und automatischer Portionsskalierung.',
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
                'Grill wie ein Akademiker — mit Portionsrechner und Schritt-für-Schritt Koch-Coach.',
            }}
          />
        </div>

        {/* ── Vollstaendiges Linkverzeichnis (serverseitig, crawlbar) ────── */}
        <RecipeIndex />

        {/* ── Mutterrezepte — ein Grundrezept, viele Einsätze (21.10.2026) ── */}
        <section className="border-t border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
              <GitFork size={12} /> Mutterrezepte
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-light mb-2">
              Ein Grundrezept, viele Einsätze
            </h2>
            <p className="font-body text-text-secondary leading-relaxed max-w-2xl mb-5">
              Eine Sauce in der Mitte, Äste nach Grillgut: als Dip, Spiegel, Dressing, Marinade oder warme Sauce — jede
              Idee mit Quelle und Link zum passenden Rezept.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MUTTERREZEPTE.map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/mutterrezepte/${m.slug}`}
                    className="block rounded-xl border border-border-subtle bg-surface-card p-5 transition-colors hover:border-brand-gold"
                  >
                    <span className="block font-serif text-xl font-bold text-text-light">{m.titel}</span>
                    <span className="mt-1 block font-sans text-xs text-text-muted">
                      {m.blaetter.length} Einsätze · {anzahlFrei(m)} davon gratis
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Community-Band — Austausch + eigenes Rezept einreichen ─────── */}
        <section className="border-t border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                  <Users size={12} /> Aus der Community
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-light mb-2">
                  Rezepte von Mitgliedern — KI-vorgeprüft, von Hand freigegeben
                </h2>
                <p className="font-body text-text-light/60 leading-relaxed max-w-xl mb-4">
                  Echte Kreationen zum Nachgrillen, eingereicht von der Akademie-Community.
                  Jede Einreichung prüft zuerst eine KI auf Sicherheit und Qualität —
                  veröffentlicht wird erst nach unserer Freigabe.
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
              Die Rezepte der Steakakademie entstehen KI-unterstützt auf Grundlage der kanonischen Temperatur- und
              Cut-Referenz und werden {verantwortungsangabe({ gruender: true })} —{' '}
              <Link href="/ki-disclaimer" className="text-brand-gold hover:text-brand-fire transition-colors underline underline-offset-2">
                mehr im KI-Disclaimer
              </Link>.
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
