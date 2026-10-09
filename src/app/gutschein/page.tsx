import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { sichtbareGutscheine, sichtbareWertgutscheine } from '@/lib/gutschein-products';
import { faqSchema } from '@/lib/schema';
import { Gift, Mail, Flame, Ticket } from 'lucide-react';

// Gutschein-Konzept T10 (09.10.2026): Title und Description auf die Suchanfragen
// der Geschenk-Saison („Geschenk für Griller", „Grill Gutschein"), dazu eine FAQ
// mit FAQPage-Schema. Gültigkeit seit 09.10.2026 wie AGB § 5a: bis Jahresende
// des dritten Folgejahres (Migration 20261009200000) — vorher stand hier
// „3 Jahre ab Kauf", die AGB nannten das Jahresende, die Datenbank rechnete ab Kauf.
export const metadata: Metadata = {
  title: 'Geschenkgutscheine für Grillfans',
  description: 'Geschenk für Griller: digitale Gutscheine der Steakakademie für Steak-Beichte, Mein Protokoll und mehr. Sofort per E-Mail, mindestens 3 Jahre gültig.',
  alternates: { canonical: 'https://steakakademie.de/gutschein' },
};

const FAQ = [
  {
    question: 'Wie kommt der Gutschein bei der beschenkten Person an?',
    answer:
      'Nach dem Kauf bekommst du den Code per E-Mail, zusammen mit einem Link zu einer Geschenkseite zum Ausdrucken. Ob du den Code weiterleitest oder die Seite ausdruckst, entscheidest du.',
  },
  {
    question: 'Wie lange ist der Gutschein gültig?',
    answer:
      'Bis zum 31. Dezember des dritten Jahres nach dem Kauf. Ein Gutschein von 2026 gilt also bis Ende 2029. Das genaue Datum steht auf der Geschenkseite.',
  },
  {
    question: 'Wie wird der Gutschein eingelöst?',
    answer:
      'Die beschenkte Person meldet sich auf steakakademie.de an oder legt ein kostenloses Konto an und gibt den Code unter „Gutschein einlösen" ein. Danach ist das Produkt im Konto freigeschaltet.',
  },
  {
    question: 'Welcher Gutschein passt zu wem?',
    answer:
      'Die Steak-Beichte passt zu allen, die schon grillen und an einem misslungenen Steak hängen bleiben — als 5er für alle, die oft am Grill stehen. Mein Protokoll passt zu allen, die sich über acht Wochen gezielt verbessern wollen.',
  },
  {
    question: 'Kann ich mir den Gutschein auszahlen lassen?',
    answer: 'Nein. Der Gutschein gilt für das genannte Produkt, eine Barauszahlung ist ausgeschlossen (AGB § 5a).',
  },
];

export default function GutscheinLandingPage() {
  const wertgutscheine = sichtbareWertgutscheine();

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(FAQ)) }} />
      <main>
        {/* Hero */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 text-center">
          <Gift size={44} className="text-brand-gold mx-auto mb-5" />
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-4">
            Verschenke Grillkönnen
          </h1>
          <p className="font-body text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Digitale Geschenkgutscheine für die Steakakademie. Sofort per E-Mail, zum Ausdrucken oder Weiterleiten —
            der Beschenkte löst einfach einen Code ein. <strong className="text-text-primary">Mindestens 3 Jahre gültig.</strong>
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
            {sichtbareGutscheine().map((p) => (
              <div key={p.key} className="bg-surface-card border border-border-subtle p-6 flex flex-col">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-serif text-xl font-bold text-text-primary">{p.title}</h3>
                  {p.priceLabel && <span className="font-sans font-bold text-brand-gold">{p.priceLabel}</span>}
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

        {/* Freie Wertgutscheine — erst sichtbar, wenn T9 steht (WERTGUTSCHEINE_AKTIV) */}
        {wertgutscheine.length > 0 && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-2 text-center">Oder einen festen Betrag</h2>
            <p className="font-body text-sm text-text-secondary text-center max-w-2xl mx-auto mb-6 leading-relaxed">
              Die beschenkte Person sucht sich selbst aus, wofür sie den Betrag einsetzt. Was übrig bleibt,
              bleibt als Guthaben auf dem Code.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {wertgutscheine.map((w) => (
                <a
                  key={w.key}
                  href={w.checkoutUrl}
                  rel="nofollow noopener"
                  className="bg-surface-card border border-border-subtle p-5 text-center hover:border-brand-gold/40 transition-colors"
                >
                  <span className="block font-serif text-3xl font-bold text-brand-gold">{w.wertEuro} €</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-sans text-text-secondary">
                    <Gift size={12} aria-hidden="true" /> Verschenken
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* FAQ — sichtbar und als FAQPage-Schema (Gutschein-Konzept T10) */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-10">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 text-center">Häufige Fragen</h2>
          <div className="divide-y divide-border-subtle border-y border-border-subtle">
            {FAQ.map(({ question, answer }) => (
              <div key={question} className="py-5">
                <h3 className="font-serif text-base font-bold text-text-primary mb-2">{question}</h3>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{answer}</p>
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
            Gutscheine gelten bis zum 31. Dezember des dritten Jahres nach dem Kauf und für das jeweils angegebene Produkt.
            Bezahlung &amp; Rechnung über Digistore24. Es gelten unsere{' '}
            <Link href="/agb" className="underline hover:text-brand-gold">AGB</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
