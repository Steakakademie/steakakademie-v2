import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, FlaskConical, Info } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AromaMatcher from '@/components/aroma-matcher/AromaMatcher';
import { allCutSummaries, FREE_LIMIT, teaserCut } from '@/lib/aroma-matcher/data';
import { ogImages } from '@/lib/og';

// Statisch gerendert — Login-Status kommt im Client. Kein cookies() hier,
// sonst fällt die Seite aus dem statischen Manifest (Lehre vom 27.08.).
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Aroma-Matcher: Smart-Pairing für Steak-Cuts',
  description:
    'Welcher Rub, welches Holz, welcher Wein passt zu deinem Cut? Der Aroma-Matcher der Steakakademie kombiniert nach prägenden Schlüsselaromen — Ribeye, Brisket, Flank und mehr.',
  alternates: { canonical: 'https://steakakademie.de/aroma-matcher' },
  openGraph: {
    images: ogImages('Aroma-Matcher — Smart-Pairing für Steak-Cuts'),
    title: 'Aroma-Matcher — Smart-Pairing für Steak-Cuts',
    description: 'Rubs, Räucherholz und Drinks, die zu deinem Cut passen — kuratiert nach prägenden Schlüsselaromen.',
    url: 'https://steakakademie.de/aroma-matcher',
    type: 'website',
  },
};

export default function AromaMatcherPage() {
  const cuts = allCutSummaries();
  const teaser = teaserCut();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">
        <div className="mx-auto max-w-editorial px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <nav className="mb-6 flex items-center gap-1.5 font-sans text-xs text-text-muted" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-brand-fire">Start</Link>
            <ChevronRight size={12} />
            <Link href="/cuts" className="transition-colors hover:text-brand-fire">Cuts</Link>
            <ChevronRight size={12} />
            <span className="text-text-secondary">Aroma-Matcher</span>
          </nav>

          <div className="mb-8 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold uppercase tracking-[0.22em] text-brand-fire">
              <FlaskConical size={12} /> Werkzeug
            </span>
            <h1 className="mt-2 font-serif text-3xl leading-tight text-text-primary sm:text-4xl">Aroma-Matcher</h1>
            <p className="mt-3 font-body text-[1.05rem] leading-relaxed text-text-secondary">
              Echtes Aroma-Matching statt grauer Theorie. Wähle deinen Cut — der Matcher zeigt dir, welche Rubs,
              welches Räucherholz und welche Drinks seine prägenden Schlüsselaromen wirklich aufgreifen.
            </p>
            <details className="group mt-3 rounded-lg border border-border-subtle bg-surface-card px-4 py-2 font-sans text-xs text-text-secondary">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-text-primary">
                <Info size={13} className="text-brand-gold" />
                Warum unser Matching funktioniert
              </summary>
              <p className="mt-2 leading-relaxed">
                Viele Foodpairing-Tools zählen jedes Molekül, das zwei Zutaten gemeinsam haben — auch die, die so schwach
                vorkommen, dass niemand sie schmeckt. Wir kuratieren anders: Nur Schlüsselaromen, die oberhalb der
                menschlichen Wahrnehmungsschwelle liegen (in der Aromaforschung: Aromawert über 1), zählen für ein Pairing.
                Weniger Treffer, aber jeder ist am Gaumen spürbar.
              </p>
            </details>
          </div>

          <AromaMatcher cuts={cuts} teaser={teaser} limit={FREE_LIMIT} />

          <section className="mt-14 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
              <h2 className="mb-2 font-serif text-lg font-bold text-text-light">Schritt 1 · Der Cut als Anker</h2>
              <p className="text-sm text-text-secondary">
                Kein neutrales Zutat-zu-Zutat-Raten: Jedes Pairing startet beim Fleisch — Reifegrad, Fettanteil und
                Faserstruktur bestimmen, welche Aromenfamilien den Ton angeben.
              </p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
              <h2 className="mb-2 font-serif text-lg font-bold text-text-light">Schritt 2 · Drei Cluster statt Liste</h2>
              <p className="text-sm text-text-secondary">
                Rubs &amp; Glazes für die Kruste, Wood &amp; Smoke für die Phenol-Struktur, Drinks &amp; Sides für den Teller.
                Jeder Vorschlag mit dem Grund, warum er passt.
              </p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
              <h2 className="mb-2 font-serif text-lg font-bold text-text-light">Schritt 3 · Der Aroma-Radar</h2>
              <p className="text-sm text-text-secondary">
                Vier Aromenfamilien, ein Blick: Röst, Nussig, Cremig, Umami. So siehst du sofort, welche Brücke
                ein Pairing schlägt — und welche es bewusst nicht schlägt.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
