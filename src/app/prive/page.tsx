import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Crown } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * Steakakademie Privé — in Vorbereitung (Entscheidung Uwe, 03.10.2026).
 *
 * Bis dahin standen hier drei Pakete mit Preisen, ein Etikett „Beliebt", eine
 * Gutschein-Laufzeit und Anfrage-Knöpfe — laut eigenem Dateikopf ein Entwurf.
 * Dahinter stand nichts, was man buchen kann: kein Produkt, kein Termin, kein
 * Gutschein für diese Leistungen. Die alte Fassung liegt in der Git-Historie.
 *
 * Diese Seite sagt, was die Idee ist — ohne Preis, ohne Paket, ohne Termin,
 * ohne Anfrage-Knopf. Vorbild: /fleischpass.
 *
 * noindex, nicht in der Sitemap. Einziger Zugang: der Footer.
 */

export const metadata: Metadata = {
  // `absolute`: die Marke steht schon im Titel selbst — das Root-Template
  // würde ein zweites „| Steakakademie" anhängen.
  title: { absolute: 'Steakakademie Privé — in Vorbereitung' },
  description:
    'Steakakademie Privé, Grill-Erlebnisse für Teams und besondere Anlässe, ist in Vorbereitung und noch nicht buchbar.',
  alternates: { canonical: 'https://steakakademie.de/prive' },
  robots: { index: false, follow: false },
};

const BIS_DAHIN = [
  { label: 'Grilltechniken', text: 'von der direkten Hitze bis Low & Slow', href: '/methoden' },
  { label: 'Cut-Atlas', text: 'welches Stück was kann', href: '/cuts' },
  { label: 'Kerntemperatur-Spickzettel', text: 'die Zielwerte auf einen Blick', href: '/kerntemperatur-spickzettel' },
];

export default function PrivePage() {
  return (
    <>
      <Header />

      <main className="bg-surface-base">
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">Privé</span>
            </nav>

            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                <Crown size={14} /> In Vorbereitung
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-6">
                Steakakademie Privé
              </h1>
              <p className="font-body text-lg text-text-secondary leading-relaxed mb-4">
                Grillen als gemeinsames Erlebnis — für Teams, für Unternehmen, für besondere Anlässe:
                Das ist die Idee hinter Privé.
              </p>
              <p className="font-body text-base text-text-secondary leading-relaxed">
                <strong className="text-text-light">Es gibt das Angebot noch nicht.</strong> Deshalb findest
                du hier keine Pakete, keine Preise und keine Termine, und buchen kannst du nichts.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="max-w-2xl">
              <h2 className="font-serif text-2xl font-bold text-text-light mb-3">Wann es losgeht</h2>
              <p className="font-body text-base text-text-secondary leading-relaxed mb-10">
                Umfang, Ablauf und Preis stehen noch nicht fest. Einen Termin nennen wir erst, wenn er
                steht — dann steht er auf dieser Seite.
              </p>

              <h2 className="font-serif text-2xl font-bold text-text-light mb-3">Bis dahin</h2>
              <p className="font-body text-base text-text-secondary leading-relaxed mb-5">
                Grilltechniken, Cuts und Kerntemperaturen stehen frei auf der Seite. Drei Einstiege:
              </p>
              <ul className="space-y-2 mb-8">
                {BIS_DAHIN.map((e) => (
                  <li key={e.href} className="flex items-start gap-2 font-body text-sm text-text-secondary">
                    <ChevronRight size={14} className="text-brand-gold shrink-0 mt-0.5" />
                    <span>
                      <Link href={e.href} className="text-brand-gold underline hover:text-brand-fire">
                        {e.label}
                      </Link>{' '}
                      — {e.text}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/newsletter"
                className="inline-flex items-center gap-2 bg-brand-gold px-6 py-3 font-sans text-sm font-bold text-ink transition-opacity hover:opacity-90"
              >
                Zum Wissens-Brief <ArrowRight size={15} />
              </Link>
              <p className="font-body text-sm text-text-muted leading-relaxed mt-4">
                BBQ-Wissen, das bleibt — ohne festen Takt, ohne Spam.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
