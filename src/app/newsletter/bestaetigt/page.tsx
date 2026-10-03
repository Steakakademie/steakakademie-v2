import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { KONTAKT_EMPFAENGER } from '@/lib/kontakt';

/**
 * Zielseite des Bestätigungslinks aus der DOI-Mail (03.10.2026).
 *
 * /api/newsletter/confirm leitete bis dahin auf `/?newsletter=confirmed` — den
 * Parameter las keine Seite, und er stand auch dann in der Adresse, wenn Loops
 * den Kontakt gar nicht angelegt hatte. Diese Seite sagt, was wirklich
 * passiert ist:
 *   ohne Parameter       Kontakt ist angelegt
 *   ?status=ungueltig    Link fehlt, ist verfälscht oder älter als 48 Stunden
 *   ?status=fehler       technisch gescheitert — Link bleibt gültig, Kontaktweg
 *
 * Die Texte hängen NUR an diesen festen Werten; nichts aus der Adresse wird
 * ausgegeben. noindex: Die Seite hat ohne den Klick aus der Mail keinen Sinn.
 */

export const metadata: Metadata = {
  title: 'Newsletter-Anmeldung',
  robots: { index: false, follow: false },
};

type Zustand = 'ok' | 'ungueltig' | 'fehler';

const BUTTON_PRIMAER =
  'inline-flex items-center justify-center px-6 py-3 bg-brand-gold text-ink font-sans font-bold text-sm tracking-[0.08em] uppercase hover:opacity-90 transition-opacity';
const BUTTON_SEKUNDAER =
  'inline-flex items-center justify-center px-6 py-3 border border-brand-gold/40 text-brand-gold font-sans font-bold text-sm tracking-[0.08em] uppercase hover:bg-brand-gold/10 transition-colors';

export default async function NewsletterBestaetigtPage(props: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { status } = await props.searchParams;
  const zustand: Zustand = status === 'fehler' ? 'fehler' : status === 'ungueltig' ? 'ungueltig' : 'ok';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">
        <section className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          {zustand === 'ok' && (
            <>
              <CheckCircle2 size={40} className="mx-auto mb-6 text-brand-gold" aria-hidden />
              <h1 className="font-serif text-3xl lg:text-4xl font-bold text-text-light leading-tight mb-4">
                Anmeldung bestätigt.
              </h1>
              <p className="font-body text-lg text-text-secondary leading-relaxed mb-3">
                Danke — deine E-Mail-Adresse ist bestätigt. Ab jetzt bekommst du Post von der Steakakademie.
              </p>
              <p className="font-body text-sm text-text-muted leading-relaxed mb-10">
                Abmelden kannst du dich jederzeit über den Link am Ende jeder E-Mail.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/kerntemperatur-spickzettel" className={BUTTON_PRIMAER}>
                  Zum Kerntemperatur-Spickzettel
                </Link>
                <Link href="/" className={BUTTON_SEKUNDAER}>
                  Zur Startseite
                </Link>
              </div>
            </>
          )}

          {zustand === 'ungueltig' && (
            <>
              <Clock size={40} className="mx-auto mb-6 text-brand-gold" aria-hidden />
              <h1 className="font-serif text-3xl lg:text-4xl font-bold text-text-light leading-tight mb-4">
                Dieser Link gilt nicht mehr.
              </h1>
              <p className="font-body text-lg text-text-secondary leading-relaxed mb-10">
                Bestätigungslinks sind 48 Stunden gültig. Deine Anmeldung ist noch nicht abgeschlossen —
                trag dich einfach noch einmal ein, dann bekommst du einen frischen Link.
              </p>
              <Link href="/newsletter" className={BUTTON_PRIMAER}>
                Neu anmelden
              </Link>
            </>
          )}

          {zustand === 'fehler' && (
            <div role="alert">
              <AlertTriangle size={40} className="mx-auto mb-6 text-brand-fire" aria-hidden />
              <h1 className="font-serif text-3xl lg:text-4xl font-bold text-text-light leading-tight mb-4">
                Das hat gerade nicht geklappt.
              </h1>
              <p className="font-body text-lg text-text-secondary leading-relaxed mb-3">
                Deine Bestätigung konnte technisch nicht verarbeitet werden — an dir liegt es nicht.
                Deine Anmeldung ist deshalb noch nicht abgeschlossen.
              </p>
              <p className="font-body text-base text-text-secondary leading-relaxed mb-10">
                Klick den Link aus der E-Mail in ein paar Minuten noch einmal an. Klappt es dann immer
                noch nicht, schreib uns an{' '}
                <a href={`mailto:${KONTAKT_EMPFAENGER}`} className="text-brand-gold hover:underline">
                  {KONTAKT_EMPFAENGER}
                </a>
                .
              </p>
              <Link href="/" className={BUTTON_SEKUNDAER}>
                Zur Startseite
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
