import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Diagnose from '@/components/eigenregie/Diagnose';
import { angebotFuer } from '@/lib/eigenregie/angebot';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: 'Eigenregie-Diagnose: Passt der Selbstbau zu dir?',
  description: 'Acht Fragen, eine ehrliche Antwort: Aufwand, Zeitplan, Werkzeugkosten und ob Eigenregie für dich der richtige Weg ist.',
  alternates: { canonical: 'https://steakakademie.de/eigenregie/diagnose' },
};

export const revalidate = 3600;

export default function EigenregieDiagnosePage() {
  const { preis } = angebotFuer(new Date(), null);
  return (
    <>
      <Header />
      <main className="bg-surface-base min-h-screen">
        <div className="max-w-content mx-auto px-4 sm:px-6 py-10 lg:py-14">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-6 print:hidden" aria-label="Breadcrumb">
            <Link href="/eigenregie" className="hover:text-brand-fire">Eigenregie</Link>
            <ChevronRight size={12} />
            <span className="text-text-primary">Diagnose</span>
          </nav>
          <p className="text-xs font-sans font-bold tracking-widest uppercase text-brand-fire mb-3">Kostenlos · 3 Minuten</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary mb-4 leading-tight">Passt Eigenregie zu dir?</h1>
          <p className="font-body text-lg text-text-secondary leading-relaxed mb-10">
            Acht Fragen. Danach siehst du deinen Aufwand, einen realistischen Zeitplan, die Werkzeugkosten — und ehrlich,
            ob ein anderer Weg für dich besser passt.
          </p>
          <Diagnose kurspreis={preis} />
        </div>
      </main>
      <Footer />
    </>
  );
}
