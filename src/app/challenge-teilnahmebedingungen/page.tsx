import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Teilnahmebedingungen „Rezept des Monats"',
  robots: { index: false, follow: false },
};

export default function ChallengeTeilnahmebedingungenPage() {
  const h2Class = 'font-sans text-sm font-bold tracking-[0.12em] uppercase text-text-primary mb-3';
  const linkClass = 'text-brand-fire underline underline-offset-2 hover:no-underline';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">

          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={12} />
            <span>Teilnahmebedingungen</span>
          </nav>

          <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">
            Teilnahmebedingungen — „Rezept des Monats&quot;
          </h1>
          <p className="text-sm font-sans text-text-muted mb-10">Stand: Juni 2026</p>

          <div className="max-w-content space-y-8 font-body text-text-secondary leading-relaxed">

            <section>
              <h2 className={h2Class}>§ 1 Veranstalter</h2>
              <p>
                Veranstalter des Gewinnspiels ist <strong className="text-text-primary">Uwe Yendell</strong>,
                Stahlsberg 73, 42279 Wuppertal (vollständige Angaben im{' '}
                <Link href="/impressum" className={linkClass}>Impressum</Link>). Das Gewinnspiel steht in
                keiner Verbindung zu sozialen Netzwerken (z.&nbsp;B. Instagram, TikTok, Facebook) und wird
                von diesen weder gesponsert noch unterstützt oder organisiert.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 2 Teilnahmeberechtigung</h2>
              <p>
                Teilnahmeberechtigt sind natürliche Personen ab 18 Jahren mit Wohnsitz in Deutschland,
                Österreich oder der Schweiz. Ausgeschlossen sind der Veranstalter sowie an der Durchführung
                beteiligte Personen und deren Angehörige.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 3 Teilnahme & Ablauf</h2>
              <p className="mb-3">
                Die Teilnahme ist <strong className="text-text-primary">kostenlos und unabhängig vom Kauf</strong>{' '}
                eines Produkts oder einer Leistung. Du nimmst teil, indem du im Aktionszeitraum ein eigenes
                Rezept über den Community-Bereich von steakakademie.de einreichst. Es gelten ergänzend unsere{' '}
                <Link href="/nutzungsbedingungen" className={linkClass}>Nutzungsbedingungen</Link>.
              </p>
              <p>
                Pro Person sind mehrere Einreichungen möglich; je Einreichung besteht eine Gewinnchance.
                Mehrfachkonten zur Erhöhung der Gewinnchance sind unzulässig.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 4 Aktionszeitraum</h2>
              <p>
                Das Gewinnspiel läuft monatlich. Einsendeschluss ist jeweils der letzte Tag des Kalendermonats
                (23:59 Uhr MEZ/MESZ). Maßgeblich ist der Eingang der Einreichung auf unseren Systemen.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 5 Gewinn</h2>
              <p>
                Zu gewinnen ist je Aktionsmonat ein wechselnder Sachpreis — aktuell ein{' '}
                <strong className="text-text-primary">SteakChamp 3-Color Steak-Thermometer</strong> (neu).
                Der Veranstalter behält sich vor, einen gleichwertigen Ersatzpreis bereitzustellen. Eine
                Barauszahlung, ein Umtausch oder eine Übertragung des Gewinns auf Dritte ist ausgeschlossen.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 6 Gewinnermittlung</h2>
              <p>
                Der Gewinner wird durch eine Jury der Steakakademie anhand von Qualität, Originalität,
                Nachvollziehbarkeit und fachlicher Korrektheit (u.&nbsp;a. Kerntemperaturen, Technik)
                der Einreichung ausgewählt. Die Entscheidung ist endgültig; ein Rechtsanspruch auf den
                Gewinn besteht nicht.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 7 Benachrichtigung & Versand</h2>
              <p className="mb-3">
                Der Gewinner wird per E-Mail benachrichtigt und um Mitteilung einer Versandadresse innerhalb
                des Teilnahmegebiets (DE/AT/CH) gebeten. Meldet sich der Gewinner nicht innerhalb von 14 Tagen,
                verfällt der Anspruch und es kann ein neuer Gewinner bestimmt werden.
              </p>
              <p>
                Der Versand des Gewinns erfolgt kostenfrei innerhalb DE/AT/CH durch den Veranstalter.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 8 Datenschutz</h2>
              <p>
                Die im Rahmen des Gewinnspiels erhobenen Daten werden ausschließlich zur Durchführung des
                Gewinnspiels verwendet. Die Versandadresse des Gewinners wird nur zum Zweck der Zustellung
                verarbeitet und nach erfolgtem Versand bzw. Ablauf etwaiger Aufbewahrungsfristen gelöscht.
                Einzelheiten in der{' '}
                <Link href="/datenschutz" className={linkClass}>Datenschutzerklärung</Link>.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 9 Rechte an den Einreichungen</h2>
              <p>
                Für eingereichte Inhalte gelten die{' '}
                <Link href="/nutzungsbedingungen" className={linkClass}>Nutzungsbedingungen</Link>{' '}
                (insbesondere die dort geregelte Nutzungsrechtseinräumung und die Zusicherung, nur eigene
                Inhalte einzureichen).
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 10 Ausschluss von der Teilnahme</h2>
              <p>
                Der Veranstalter kann Teilnehmer ausschließen, die gegen diese Teilnahmebedingungen verstoßen,
                unwahre Angaben machen, sich unzulässiger Hilfsmittel bedienen, den Ablauf manipulieren oder
                rechtswidrige Inhalte einreichen. Bereits zugesprochene Gewinne können in diesem Fall
                aberkannt und zurückgefordert werden.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 11 Vorzeitige Beendigung & Änderungen</h2>
              <p>
                Der Veranstalter behält sich vor, das Gewinnspiel aus wichtigem Grund (z.&nbsp;B. technische
                Störungen, Manipulation, rechtliche Gründe) jederzeit ohne Vorankündigung abzubrechen, zu
                beenden oder die Bedingungen anzupassen.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 12 Haftung</h2>
              <p>
                Die Haftung des Veranstalters ist auf Vorsatz und grobe Fahrlässigkeit beschränkt, soweit
                nicht zwingende gesetzliche Haftungstatbestände (z.&nbsp;B. Verletzung von Leben, Körper,
                Gesundheit) betroffen sind.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 13 Rechtsweg & anwendbares Recht</h2>
              <p>
                Der Rechtsweg ist ausgeschlossen. Es gilt das Recht der Bundesrepublik Deutschland.
                Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen
                Bedingungen unberührt.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
