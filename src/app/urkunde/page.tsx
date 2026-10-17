import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UrkundeSuchen from './UrkundeSuchen';

/**
 * /urkunde — Einstieg zur Echtheitsprüfung (17.10.2026). Auf jeder Urkunde
 * steht „steakakademie.de" und die Urkunden-Nummer samt Prüfcode; hier gibt
 * man sie ein und landet auf /urkunde/<kennung>.
 */
export const metadata: Metadata = {
  title: 'Urkunde prüfen — Steakakademie',
  description:
    'Prüfe die Echtheit einer Urkunde der Steakakademie: Urkunden-Nummer eingeben, Name, Grad und Ausstellungsdatum sehen.',
  alternates: { canonical: 'https://steakakademie.de/urkunde' },
};

export default function UrkundeEinstiegPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-surface-dark px-4 py-16">
        <div className="mx-auto max-w-xl">
          <p className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
            Echtheitsprüfung
          </p>
          <h1 className="font-serif text-3xl font-bold text-text-light mb-3">Urkunde prüfen</h1>
          <p className="font-sans text-sm text-text-secondary mb-8">
            Jede Urkunde der Steakakademie trägt unten links eine Urkunden-Nummer mit Prüfcode, zum Beispiel
            „SA-2026-0001-ABC234“. Gib sie ein — du siehst, auf wen die Urkunde ausgestellt ist und welchen
            Grad sie bestätigt.
          </p>
          <UrkundeSuchen />
        </div>
      </main>
      <Footer />
    </>
  );
}
