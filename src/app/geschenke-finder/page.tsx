import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GeschenkeFinderServer from '@/components/geschenke/GeschenkeFinderServer';
import { aktionBySlug, istAktiv } from '@/lib/aktionen';
import { aktionUrl } from '@/lib/aktionen/nav';

/**
 * /geschenke-finder (Uwe, 11.10.2026): das ganze Jahr erreichbar (Geburtstag, Vatertag,
 * Weihnachten), im Tools-Menü verlinkt. Die Setups kommen aus data/aktionen/geschenke.yaml;
 * der Link zur Aktionsseite /geschenke erscheint nur in deren Fenster (sonst 404).
 * Stündlich neu gerendert, damit der Link ohne Deploy kommt und geht.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Geschenke-Finder für Grillfans',
  description: 'Drei Fragen, ein Vorschlag: Welches Grillgeschenk passt zu wem — für Einsteiger, Fortgeschrittene und die, die schon alles haben. Mit Begründung, ohne Katalog.',
  alternates: { canonical: 'https://steakakademie.de/geschenke-finder' },
};

export default function GeschenkeFinderPage() {
  const geschenke = aktionBySlug('geschenke');
  const aktionAktiv = Boolean(geschenke && istAktiv(geschenke));

  return (
    <>
      <Header />
      <main className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span>Geschenke-Finder</span>
        </nav>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-4">
          Welches Grillgeschenk passt?
        </h1>
        <p className="font-body text-lg text-text-secondary leading-relaxed max-w-3xl mb-10">
          Die meisten Grillgeschenke landen im Schrank. Sag uns, für wen du suchst und wie gut die Person grillt —
          wir schlagen vor, was beim nächsten Grillen wirklich den Unterschied macht.
        </p>

        <GeschenkeFinderServer />

        {aktionAktiv && geschenke && (
          <p className="mt-8 font-body text-text-secondary">
            Lieber selbst stöbern?{' '}
            <Link href={aktionUrl('geschenke')} className="font-sans font-bold text-brand-gold hover:text-text-primary transition-colors">
              Alle Geschenk-Setups ansehen
            </Link>
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
