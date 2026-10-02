import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ArrowRight, NotebookPen } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * Fleischpass — in Vorbereitung (Entscheidung Uwe, 02.10.2026).
 *
 * Bis dahin stand hier eine Verkaufsseite (gratis bis 10 Einträge, Premium
 * 39 €/Jahr, KI-Auswertung, FAQ) für ein Logbuch, das es nicht gibt: keine
 * Route außer dieser Seite, keine Tabelle. „Kostenlos starten" führte zum Login
 * und danach ins Leere. Die alte Fassung liegt in der Git-Historie.
 *
 * Diese Seite sagt, was geplant ist — ohne Preis, ohne Start-Knopf, ohne
 * Zusagen zur Auswertung. Preis und Zuschnitt (einzeln oder Baustein des
 * VIP-Bereichs) sind nicht entschieden; am 18.09.2026 hat Uwe das Grill-Logbuch
 * als VIP-Funktion eingeordnet, deshalb führt der Weg zur VIP-Warteliste.
 *
 * Aus Header und Footer genommen, noindex, nicht in der Sitemap. Einziger
 * Zugang: der Baustein „Grill-Logbuch" auf /vip.
 */

export const metadata: Metadata = {
  title: 'Fleischpass — Grill-Logbuch (in Vorbereitung)',
  description: 'Der Fleischpass, das Grill-Logbuch der Steakakademie, ist geplant und noch nicht verfügbar.',
  alternates: { canonical: 'https://steakakademie.de/fleischpass' },
  robots: { index: false, follow: false },
};

const FELDER = [
  'Cut und Gewicht',
  'Methode',
  'Grill- und Kerntemperatur',
  'Dauer',
  'Dein Urteil und deine Notizen',
  'Foto, wenn du magst',
];

export default function FleischpassPage() {
  return (
    <>
      <Header />

      <main className="bg-surface-base">
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">Fleischpass</span>
            </nav>

            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                <NotebookPen size={14} /> In Vorbereitung
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-6">
                Fleischpass — dein Grill-Logbuch
              </h1>
              <p className="font-body text-lg text-text-secondary leading-relaxed mb-4">
                Jede Session festhalten und nach ein paar Wochen sehen, wo du konstant bist und wo
                noch Luft ist: Das ist die Idee hinter dem Fleischpass.
              </p>
              <p className="font-body text-base text-text-secondary leading-relaxed">
                <strong className="text-text-light">Es gibt ihn noch nicht.</strong> Deshalb kannst du
                hier nichts starten und nichts kaufen. Wir sagen Bescheid, wenn er da ist.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="max-w-2xl">
              <h2 className="font-serif text-2xl font-bold text-text-light mb-5">Was er festhalten soll</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-10">
                {FELDER.map((feld) => (
                  <li key={feld} className="flex items-start gap-2 font-body text-sm text-text-secondary">
                    <ChevronRight size={14} className="text-brand-gold shrink-0 mt-0.5" />
                    {feld}
                  </li>
                ))}
              </ul>

              <h2 className="font-serif text-2xl font-bold text-text-light mb-3">Wann es losgeht</h2>
              <p className="font-body text-base text-text-secondary leading-relaxed mb-6">
                Das Grill-Logbuch ist als Baustein des VIP-Bereichs vorgesehen. Einen Termin nennen wir
                erst, wenn er steht. Wer auf der VIP-Warteliste ist, erfährt es zuerst.
              </p>
              <Link
                href="/vip"
                className="inline-flex items-center gap-2 bg-brand-gold px-6 py-3 font-sans text-sm font-bold text-ink transition-opacity hover:opacity-90"
              >
                Zur VIP-Warteliste <ArrowRight size={15} />
              </Link>

              <h2 className="font-serif text-2xl font-bold text-text-light mt-12 mb-3">Bis dahin</h2>
              <p className="font-body text-base text-text-secondary leading-relaxed">
                Ein Zettel reicht. Notier dir nach jeder Session drei Dinge, solange sie frisch sind:
                gemessene Kerntemperatur, Methode, dein Urteil. Die Zielwerte stehen auf dem{' '}
                <Link href="/kerntemperatur-spickzettel" className="text-brand-gold underline hover:text-brand-fire">
                  Kerntemperatur-Spickzettel
                </Link>
                , und wenn etwas schiefgeht, hilft die{' '}
                <Link href="/rettung" className="text-brand-gold underline hover:text-brand-fire">
                  Steak-Rettung
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
