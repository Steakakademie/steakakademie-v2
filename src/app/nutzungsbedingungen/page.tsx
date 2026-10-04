import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Nutzungsbedingungen (Community)',
  robots: { index: false, follow: false },
};

export default function NutzungsbedingungenPage() {
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
            <span>Nutzungsbedingungen</span>
          </nav>

          <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">
            Nutzungsbedingungen für die Community
          </h1>
          <p className="text-sm font-sans text-text-muted mb-10">Stand: Oktober 2026</p>

          <div className="max-w-content space-y-8 font-body text-text-secondary leading-relaxed">

            <section>
              <h2 className={h2Class}>§ 1 Geltungsbereich &amp; Anbieter</h2>
              <p>
                Diese Nutzungsbedingungen gelten für die Community-Funktionen von steakakademie.de —
                insbesondere für die Erstellung eines Nutzerkontos sowie das Einreichen und
                Veröffentlichen eigener Rezepte. Anbieter ist{' '}
                <strong className="text-text-primary">Uwe Yendell</strong> (vollständige Angaben im{' '}
                <Link href="/impressum" className={linkClass}>Impressum</Link>). Für kostenpflichtige
                Produkte gelten ergänzend unsere{' '}
                <Link href="/agb" className={linkClass}>AGB</Link>, für die Datenverarbeitung die{' '}
                <Link href="/datenschutz" className={linkClass}>Datenschutzerklärung</Link>.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 2 Nutzerkonto</h2>
              <p className="mb-3">
                Für das Einreichen von Inhalten ist ein Nutzerkonto erforderlich. Du sicherst zu,
                wahrheitsgemäße Angaben zu machen und deine Zugangsdaten geheim zu halten.
              </p>
              <p>
                <strong className="text-text-primary">Mindestalter:</strong> Die eigenständige
                Anmeldung ist Personen ab 16 Jahren möglich. Jüngere Nutzer benötigen die
                Einwilligung der Erziehungsberechtigten (Art. 8 DSGVO).
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 3 Einreichen von Inhalten</h2>
              <p className="mb-3">
                Du darfst ausschließlich <strong className="text-text-primary">eigene Inhalte</strong>{' '}
                einreichen, an denen du alle erforderlichen Rechte besitzt. Mit dem Einreichen
                sicherst du zu, dass deine Inhalte keine Rechte Dritter (Urheber-, Marken-,
                Persönlichkeits- oder sonstige Rechte) verletzen.
              </p>
              <p>
                <strong className="text-text-primary">Kein Foto-Upload:</strong> Das Hochladen von
                Bildern — insbesondere Personenfotos — ist nicht vorgesehen. Rezeptbilder werden von
                uns KI-generiert.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 4 Verbotene Inhalte</h2>
              <p className="mb-3">Unzulässig sind insbesondere Inhalte, die:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>rechtswidrig, beleidigend, diskriminierend, gewaltverherrlichend oder jugendgefährdend sind,</li>
                <li>Rechte Dritter verletzen (Urheber-, Marken-, Persönlichkeitsrechte),</li>
                <li>Werbung, Spam oder rein kommerzielle Eigenwerbung enthalten,</li>
                <li>irreführende Angaben zu Lebensmittelsicherheit oder Gesundheit machen,</li>
                <li>personenbezogene Daten Dritter ohne deren Einwilligung enthalten.</li>
              </ul>
            </section>

            <section>
              <h2 className={h2Class}>§ 5 Nutzungsrechte an deinen Inhalten</h2>
              <p className="mb-3">
                Du bleibst Urheber deiner Inhalte. Mit dem Einreichen räumst du Steakakademie ein
                <strong className="text-text-primary"> einfaches, unentgeltliches, zeitlich und
                räumlich unbeschränktes Recht</strong> ein, deinen Inhalt auf der Plattform und zu
                deren Bewerbung zu speichern, zu bearbeiten/redigieren, zu vervielfältigen und
                öffentlich zugänglich zu machen.
              </p>
              <p>
                Dieses Recht endet, soweit du die Löschung deines Inhalts verlangst bzw. dein Konto
                löschst — bereits gestattete Nutzungen (z.&nbsp;B. Sicherungskopien) bleiben davon im
                gesetzlich zulässigen Rahmen unberührt.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 6 Moderation &amp; KI-Prüfung</h2>
              {/* Abgleich 03.10.2026: „automatisiert und/oder manuell" ließ offen, dass die
                  KI allein veröffentlichen konnte — genau das tat der Code bis dahin.
                  Jetzt: KI-Vorprüfung, Freigabe nur von Hand (src/lib/rezept/einreichung-status.ts). */}
              <p>
                Eingereichte Inhalte werden vor einer Veröffentlichung geprüft: zunächst
                automatisiert (KI-gestützt), anschließend geben wir sie von Hand frei. Ohne unsere
                Freigabe wird nichts veröffentlicht; Einreichungen, die die automatisierte Vorprüfung
                nicht bestehen, werden nicht veröffentlicht. Es besteht kein Anspruch auf Veröffentlichung. Wir
                behalten uns vor, Inhalte abzulehnen, zu kürzen, zu bearbeiten oder nach
                Veröffentlichung zu entfernen. Details zur KI-Prüfung findest du in der{' '}
                <Link href="/datenschutz" className={linkClass}>Datenschutzerklärung</Link> (Abschnitt 10a).
              </p>
            </section>

            <section id="melden" className="scroll-mt-24">
              <h2 className={h2Class}>§ 7 Melde- &amp; Abhilfeverfahren (DSA)</h2>
              <p className="mb-3">
                Du kannst uns rechtswidrige oder gegen diese Bedingungen verstoßende Inhalte jederzeit
                melden. Wir prüfen jede Meldung und entfernen oder sperren betroffene Inhalte, soweit
                erforderlich (Notice-&amp;-Action gemäß Art. 16 VO (EU) 2022/2065 — DSA).
              </p>
              <p>
                <strong className="text-text-primary">Meldungen &amp; Kontaktstelle (Art. 11/12 DSA):</strong>{' '}
                <a href="mailto:pitmaster@steakakademie.de?subject=Inhaltsmeldung" className={linkClass}>
                  pitmaster@steakakademie.de
                </a>{' '}
                — bitte mit Link/Bezeichnung des Inhalts und Grund der Meldung. Kommunikationssprache:
                Deutsch.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 8 Freistellung</h2>
              <p>
                Du stellst Steakakademie von allen Ansprüchen Dritter frei, die aus von dir
                rechtswidrig eingereichten Inhalten oder einer Verletzung dieser Nutzungsbedingungen
                resultieren, einschließlich angemessener Kosten der Rechtsverteidigung — soweit du die
                Rechtsverletzung zu vertreten hast.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 9 Sperrung &amp; Kündigung</h2>
              <p>
                Bei Verstößen gegen diese Nutzungsbedingungen können wir Inhalte entfernen und das
                Nutzerkonto vorübergehend oder dauerhaft sperren. Du kannst dein Konto jederzeit selbst
                in deinem <Link href="/diplome/profil" className={linkClass}>Profil</Link> unter
                &bdquo;Konto löschen&ldquo; entfernen oder es durch Nachricht an{' '}
                <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>pitmaster@steakakademie.de</a>{' '}
                löschen lassen. Was dabei gelöscht wird und was gespeichert bleibt, steht in der{' '}
                <Link href="/datenschutz#konto-loeschen" className={linkClass}>Datenschutzerklärung</Link>.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 10 Änderungen</h2>
              <p>
                Wir können diese Nutzungsbedingungen mit Wirkung für die Zukunft anpassen, etwa bei
                geänderter Rechtslage oder neuen Funktionen. Über wesentliche Änderungen informieren
                wir in geeigneter Form.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 11 Anwendbares Recht</h2>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
                Zwingende Verbraucherschutzvorschriften deines Wohnsitzstaates bleiben unberührt.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
