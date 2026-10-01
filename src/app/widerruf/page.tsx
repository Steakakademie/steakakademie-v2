import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WiderrufForm from './WiderrufForm';
import { URKUNDE_WIDERRUF_HINWEIS } from '@/lib/urkunde/preis';

export const metadata: Metadata = {
  title: 'Vertrag widerrufen',
  description: 'Widerrufe deinen Vertrag bequem online. Identifikation per E-Mail oder Bestellnummer — kein Login nötig. Du erhältst eine Eingangsbestätigung per E-Mail.',
  alternates: { canonical: 'https://steakakademie.de/widerruf' },
};

export default function WiderrufPage() {
  return (
    <>
      <Header />
      <main className="bg-surface-base">
        <section className="border-b border-border-subtle">
          <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">Vertrag widerrufen</span>
            </nav>

            <div className="max-w-2xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                Widerrufsformular
              </span>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold text-text-primary mb-4">
                Vertrag widerrufen
              </h1>
              <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
                Steht dir für deinen Vertrag ein gesetzliches Widerrufsrecht zu, kannst du ihn hier
                bequem widerrufen — ohne Login. Gib zur Identifikation deine E-Mail-Adresse
                oder deine Bestell-/Vertragsnummer an und bestätige den Widerruf.
              </p>
              <p className="font-body text-sm text-text-muted leading-relaxed mb-8">
                Nach dem Absenden erhältst du eine <strong>elektronische Eingangsbestätigung
                per E-Mail</strong> mit Datum und Uhrzeit deines Widerrufs.
              </p>

              <WiderrufForm />

              <p className="font-body text-xs text-text-muted leading-relaxed mt-10 border-t border-border-subtle pt-5">
                Hinweis: Für bestimmte Verträge besteht kein Widerrufsrecht (z. B. digitale Inhalte,
                deren Ausführung du ausdrücklich vor Ablauf der Widerrufsfrist zugestimmt hast,
                oder gedruckte Urkunden: {URKUNDE_WIDERRUF_HINWEIS}).
                Details findest du in unseren{' '}
                <Link href="/agb" className="text-brand-gold hover:text-brand-fire underline">AGB</Link>{' '}
                und der dortigen Widerrufsbelehrung.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
