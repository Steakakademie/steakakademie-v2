import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RedeemForm from '@/components/gutschein/RedeemForm';
import { Gift } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gutschein einlösen',
  description: 'Löse deinen Steakakademie-Geschenkgutschein ein und schalte dein Produkt frei.',
  robots: { index: false, follow: false },
};

export default async function GutscheinEinloesenPage(props: { searchParams: Promise<{ code?: string }> }) {
  const searchParams = await props.searchParams;
  const initialCode = (searchParams.code ?? '').toUpperCase();

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-8">
          <Gift size={40} className="text-brand-gold mx-auto mb-4" />
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary mb-3">Gutschein einlösen</h1>
          <p className="font-body text-text-secondary leading-relaxed">
            Gib den Code von deinem Geschenkgutschein ein — wir schalten dein Produkt sofort frei.
          </p>
        </div>

        <div className="bg-surface-card border border-border-subtle p-6 sm:p-8">
          <RedeemForm initialCode={initialCode} />
        </div>

        <p className="text-center text-xs font-sans text-text-muted mt-6 leading-relaxed">
          Probleme beim Einlösen? Schreib uns an{' '}
          <a href="mailto:masterclass@steakakademie.de" className="underline hover:text-brand-gold">
            masterclass@steakakademie.de
          </a>
        </p>
      </main>
      <Footer />
    </>
  );
}
