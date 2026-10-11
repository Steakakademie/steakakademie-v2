import Link from 'next/link';
import { ChevronRight, Flame } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AktionProdukt from '@/components/affiliate/AktionProdukt';
import { faqSchema } from '@/lib/schema';
import type { Aktion } from '@/lib/aktionen/typen';

/**
 * Aktionsseite (11.10.2026, Konzept docs/affiliate-aktionen-bundles-konzept-2026.md, Abschnitt 8).
 *
 * Aufbau: H1 mit Thema (nie mit Rabatt) → Einleitung → Setups mit „Anzeige" je Partnerlink →
 * eigener Teil (Gutschein, Guide, Kurs) → FAQ (FAQPage-Schema) → Kennzeichnungsblock mit dem
 * Amazon-Pflichtsatz. Kein Countdown, keine Knappheit, keine Preise.
 *
 * `vorschau`: Seite außerhalb des Fensters ansehen (Gegenlesen vor dem Start) — dann mit
 * sichtbarem Hinweis; noindex setzt die Route.
 */
export default function AktionsSeite({ aktion, vorschau = false }: { aktion: Aktion; vorschau?: boolean }) {
  const faq = aktion.faq.map((f) => ({ question: f.frage, answer: f.antwort }));

  return (
    <>
      <Header />
      {faq.length > 0 && (
        // „<" maskiert, damit ein Text aus der YAML den Skriptblock nicht schließen kann.
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faq)).replace(/</g, '\\u003c') }} />
      )}
      <main>
        {vorschau && (
          <div className="bg-brand-fire/10 border-b border-brand-fire/30 text-center text-xs font-sans text-text-secondary py-2 px-4">
            Vorschau — diese Seite ist erst vom {aktion.fenster.von.split('-').reverse().join('.')} bis{' '}
            {aktion.fenster.bis.split('-').reverse().join('.')} öffentlich.
          </div>
        )}

        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span>{aktion.titel}</span>
          </nav>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-4">{aktion.titel}</h1>
          <p className="font-body text-lg text-text-secondary leading-relaxed max-w-3xl">{aktion.untertitel}</p>
          <div className="mt-6 space-y-4 max-w-3xl">
            {aktion.einleitung.map((absatz, i) => (
              <p key={i} className="font-body text-text-secondary leading-relaxed">{absatz}</p>
            ))}
          </div>
        </section>

        {aktion.setups.map((setup) => (
          <section key={setup.titel} className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-label={setup.titel}>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary mb-2">{setup.titel}</h2>
            <p className="font-body text-text-secondary leading-relaxed max-w-3xl mb-6">{setup.fuer}</p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {setup.produkte.map((p) => (
                <AktionProdukt key={p.id} id={p.id} warum={p.warum} />
              ))}
            </ul>
          </section>
        ))}

        {aktion.eigener_teil.length > 0 && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-label="Von der Steakakademie">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary mb-6">Von der Steakakademie</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {aktion.eigener_teil.map((e) => (
                <div key={e.url} className="border border-brand-gold/30 bg-surface-card p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame size={18} className="text-brand-gold" aria-hidden="true" />
                    <h3 className="font-serif text-xl font-bold text-text-primary">{e.titel}</h3>
                  </div>
                  <p className="font-body text-sm text-text-secondary leading-relaxed mb-4">{e.text}</p>
                  <Link href={e.url} className="inline-flex items-center gap-1 font-sans text-sm font-bold text-brand-gold hover:text-text-primary transition-colors">
                    {e.knopf} <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {aktion.faq.length > 0 && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-label="Häufige Fragen">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary mb-6">Häufige Fragen</h2>
            <dl className="space-y-5 max-w-3xl">
              {aktion.faq.map((f) => (
                <div key={f.frage}>
                  <dt className="font-sans font-bold text-text-primary mb-1">{f.frage}</dt>
                  <dd className="font-body text-text-secondary leading-relaxed">{f.antwort}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Kennzeichnungsblock — immer, auch wenn gerade kein Partnerlink auf der Seite steht. */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-label="Hinweis zu Partnerlinks">
          <div className="border-t border-border-subtle pt-6 text-xs font-sans text-text-muted leading-relaxed max-w-3xl space-y-2">
            {aktion.hinweis && <p className="text-text-secondary">{aktion.hinweis}</p>}
            <p>
              Diese Seite enthält Partnerlinks (am Link mit &bdquo;Anzeige&ldquo; gekennzeichnet). Kaufst du darüber, erhalten
              wir eine Provision; der Preis ändert sich für dich nicht. Als Amazon-Partner verdienen wir an
              qualifizierten Verkäufen. Die Zusammenstellungen sind Empfehlungen nach Herstellerangaben und
              öffentlich zugänglichen Daten, keine eigenen Gerätetests. Preise und Verfügbarkeit siehst du beim
              Anbieter. Mehr dazu in der{' '}
              <Link href="/affiliate-disclosure" className="underline hover:text-brand-gold">Affiliate-Disclosure</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
