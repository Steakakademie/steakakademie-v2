import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { GIFTABLE_PRODUCTS } from '@/lib/gutschein-products';
import { Gift, Mail, Flame, Ticket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Geschenkgutscheine',
  description: 'Verschenke Grillkönnen: digitale Geschenkgutscheine für Kurse der Steakakademie. Sofort per E-Mail, 3 Jahre gültig.',
  alternates: { canonical: 'https://steakakademie.de/gutschein' },
};

export default function GutscheinLandingPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 text-center">
          <Gift size={44} className="text-brand-gold mx-auto mb-5" />
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-4">
            Verschenke Grillkönnen
          </h1>
          <p className="font-body text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Digitale Geschenkgutscheine für die Steakakademie. Sofort per E-Mail, zum Ausdrucken oder Weiterleiten —
            der Beschenkte löst einfach einen Code ein. <strong className="text-text-primary">3 Jahre gültig.</strong>
          </p>
        </section>

        {/* So funktioniert's */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Ticket, title: '1. Gutschein kaufen', text: 'Produkt auswählen und sicher über Digistore24 bezahlen.' },
              { icon: Mail, title: '2. Code erhalten', text: 'Du bekommst sofort einen Gutschein mit Code per E-Mail — zum Drucken oder Weiterleiten.' },
              { icon: Flame, title: '3. Beschenkter löst ein', text: 'Code auf der Einlöse-Seite eingeben — Produkt ist sofort freigeschaltet.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-surface-card border border-border-subtle p-6 text-center">
                <Icon size={26} className="text-brand-gold mx-auto mb-3" />
                <h2 className="font-sans font-bold text-sm text-text-primary mb-2">{title}</h2>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Verschenkbare Produkte */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 text-center">Das kannst du verschenken</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {GIFTABLE_PRODUCTS.map((p) => (
              <div key={p.courseSlug} className="bg-surface-card border border-border-subtle p-6 flex flex-col">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-serif text-xl font-bold text-text-primary">{p.title}</h3>
                  <span className="font-sans font-bold text-brand-gold">{p.priceLabel}</span>
                </div>
                <p className="font-body text-sm text-text-secondary leading-relaxed mb-5 flex-1">{p.blurb}</p>
                {p.checkoutUrl ? (
                  <a href={p.checkoutUrl} className="btn-affiliate justify-center" rel="nofollow noopener">
                    <Gift size={15} /> Verschenken
                  </a>
                ) : (
                  <span className="inline-flex justify-center items-center gap-2 border border-border-subtle text-text-muted text-sm font-sans px-4 py-2.5">
                    In Vorbereitung
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Einlösen + Recht */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-10 text-center">
          <div className="bg-surface-base border border-border-subtle p-6">
            <p className="font-body text-text-secondary mb-3">Schon einen Gutschein-Code?</p>
            <Link href="/gutschein/einloesen" className="btn-affiliate inline-flex justify-center">
              <Ticket size={15} /> Gutschein einlösen
            </Link>
          </div>
          <p className="text-xs font-sans text-text-muted mt-6 leading-relaxed">
            Gutscheine sind 3 Jahre ab Kauf gültig und gelten für das jeweils angegebene Produkt.
            Bezahlung &amp; Rechnung über Digistore24. Es gelten unsere{' '}
            <Link href="/agb" className="underline hover:text-brand-gold">AGB</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
