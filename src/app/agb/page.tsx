import type { Metadata } from 'next';
import Link from 'next/link';
import { URKUNDE_WIDERRUF_HINWEIS } from '@/lib/urkunde/preis';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'AGB',
  robots: { index: false, follow: false },
};

export default function AgbPage() {
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
            <span>AGB</span>
          </nav>

          <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">
            Allgemeine Geschäftsbedingungen
          </h1>
          <p className="text-sm font-sans text-text-muted mb-10">Stand: Oktober 2026</p>

          <div className="max-w-content space-y-8 font-body text-text-secondary leading-relaxed">

            <section>
              <h2 className={h2Class}>§ 1 Geltungsbereich</h2>
              <p>
                Diese AGB gelten für alle Bestellungen und Leistungen, die über steakakademie.de
                abgeschlossen werden. Vertragspartner ist <strong className="text-text-primary">Uwe Yendell</strong>{' '}
                (vollständige Angaben im{' '}
                <Link href="/impressum" className={linkClass}>Impressum</Link>).
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 2 Vertragsschluss & Zahlungsabwicklung</h2>
              <p className="mb-3">
                Mit dem Absenden einer Bestellung oder der Anmeldung zu einem kostenpflichtigen
                Angebot gibst du ein verbindliches Kaufangebot ab. Der Vertrag kommt mit
                unserer Bestätigung per E-Mail zustande.
              </p>
              <p>
                Die Zahlungsabwicklung für digitale Produkte (Steak-Beichte, Mein Protokoll,
                Grillmeister-Diplom und weitere) erfolgt über <strong className="text-text-primary">Digistore24 GmbH</strong>,
                St.-Kilian-Str. 14, 97236 Randersacker. Digistore24 agiert im Rahmen des Kaufvorgangs
                als Zahlungsdienstleister. Die Allgemeinen Geschäftsbedingungen von Digistore24
                gelten ergänzend und sind unter{' '}
                <a href="https://www.digistore24.com/agb" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  digistore24.com/agb
                </a>{' '}
                abrufbar.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 3 Preise & Zahlung</h2>
              <p>
                Alle Preise sind Endpreise in Euro inkl. gesetzlicher Mehrwertsteuer. Die
                Rechnung mit ausgewiesener Umsatzsteuer stellt Digistore24 aus. Für digitale Produkte werden die verfügbaren
                Zahlungsmethoden (u.&nbsp;a. SEPA-Lastschrift, PayPal, Klarna) beim
                Bestellvorgang über Digistore24 angezeigt.
              </p>
              <p className="mt-3">
                <strong className="text-text-primary">Gedruckte Urkunden</strong> werden nicht über
                Digistore24 abgewickelt. Nach dem Absenden der Bestellung erhältst du eine
                Eingangsbestätigung per E-Mail; sie ist noch keine Annahme deines Angebots. Nach
                Prüfung deiner Bestellung senden wir dir per E-Mail eine Rechnung mit den
                Zahlungsinformationen. Mit dieser E-Mail kommt der Vertrag zustande (§&nbsp;2). Die
                Zahlung erfolgt per Überweisung; der Druck beginnt nach Zahlungseingang.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 4 Lieferung (physische Produkte)</h2>
              <p>
                Für physische Produkte (z.&nbsp;B. Urkunden) beträgt die Lieferzeit 3–7 Werktage
                nach Zahlungseingang innerhalb Deutschlands. Versandkosten werden im
                Bestellvorgang ausgewiesen.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 5 Digitale Inhalte — Bereitstellung & Nutzungsrechte</h2>
              <p className="mb-3">
                Digitale Inhalte (Kurse, interaktive Tools, Downloads, Zertifikate) werden nach
                Zahlungseingang und Vertragsschluss unverzüglich freigeschaltet und über das
                Nutzerkonto auf steakakademie.de zugänglich gemacht.
              </p>
              <p className="mb-3">
                Die erworbenen Inhalte sind ausschließlich zur <strong className="text-text-primary">persönlichen,
                nicht-kommerziellen Nutzung</strong> bestimmt. Insbesondere ist es untersagt:
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li>Zugangsdaten weiterzugeben oder Dritten den Zugang zu ermöglichen</li>
                <li>Inhalte zu vervielfältigen, zu verbreiten oder öffentlich zugänglich zu machen</li>
                <li>Inhalte ganz oder in Teilen weiterzuverkaufen oder zu lizenzieren</li>
                <li>Inhalte zu bearbeiten und als eigene Werke zu veröffentlichen</li>
              </ul>
              <p>
                Alle Inhalte sind urheberrechtlich geschützt. Verstöße berechtigen zur sofortigen
                Sperrung des Nutzerkontos und können zivilrechtliche Schadensersatzansprüche begründen.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 5a Geschenkgutscheine</h2>
              <p className="mb-3">
                Wir bieten <strong className="text-text-primary">Geschenkgutscheine für jeweils ein
                bestimmtes digitales Produkt</strong> an (z.&nbsp;B. einen Kurs). Der Gutschein berechtigt
                den Inhaber zur einmaligen Freischaltung des auf dem Gutschein genannten Produkts.
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li>
                  <strong className="text-text-primary">Gültigkeit:</strong> 3 Jahre ab Ausstellung
                  (gesetzliche Verjährungsfrist, § 195 BGB, beginnend zum Schluss des Ausstellungsjahres).
                </li>
                <li>
                  <strong className="text-text-primary">Übertragbarkeit:</strong> Der Gutschein ist
                  übertragbar und kann von der Person eingelöst werden, die im Besitz des Gutschein-Codes ist.
                </li>
                <li>
                  <strong className="text-text-primary">Einlösung:</strong> Code unter{' '}
                  <Link href="/gutschein/einloesen" className={linkClass}>steakakademie.de/gutschein/einloesen</Link>{' '}
                  eingeben. Für die Einlösung ist ein (kostenloses) Nutzerkonto erforderlich; nach Einlösung
                  wird das jeweilige Produkt freigeschaltet.
                </li>
                <li>
                  <strong className="text-text-primary">Kein Restguthaben / keine Barauszahlung:</strong>{' '}
                  Der Gutschein wird vollständig auf das genannte Produkt eingelöst. Eine Barauszahlung
                  oder Verrechnung eines Restwerts ist ausgeschlossen.
                </li>
              </ul>
              <p className="mb-3">
                <strong className="text-text-primary">Widerruf:</strong> Bis zur Einlösung besteht das
                14-tägige Widerrufsrecht (siehe § 6a). Mit der Einlösung — also der Freischaltung des
                digitalen Inhalts — erlischt das Widerrufsrecht gemäß § 356 Abs. 5 BGB.
              </p>
              <p>
                Die Zahlungsabwicklung erfolgt über Digistore24 (§ 2). Die Preise enthalten die gesetzliche
                Mehrwertsteuer (§ 3).
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 6 Widerrufsrecht (physische Produkte)</h2>
              <p className="mb-3">
                Du hast das Recht, diesen Vertrag innerhalb von 14 Tagen ohne Angabe von
                Gründen zu widerrufen. Die Frist beginnt ab Erhalt der Ware.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Ausnahme gedruckte Urkunden:</strong>{' '}
                {URKUNDE_WIDERRUF_HINWEIS}
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Elektronische Widerrufsfunktion (§ 356a BGB):</strong>{' '}
                Du kannst deinen Widerruf bequem über unsere elektronische Widerrufsfunktion
                erklären. Den Button „Vertrag widerrufen&quot; findest du jederzeit im Footer jeder
                Seite sowie direkt unter:{' '}
                <Link href="/widerruf" className={linkClass}>steakakademie.de/widerruf</Link>.
                Nach Bestätigung erhältst du unverzüglich eine elektronische Eingangsbestätigung
                per E-Mail mit Datum und Uhrzeit deines Widerrufs.
              </p>
              <p>
                Alternativ: Widerruf per E-Mail an{' '}
                <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>
                  pitmaster@steakakademie.de
                </a>{' '}
                oder per Post (Adresse siehe Impressum).
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 6a Widerrufsrecht (digitale Produkte)</h2>
              <p className="mb-3">
                Bei digitalen Inhalten, die nicht auf einem körperlichen Datenträger geliefert
                werden, besteht grundsätzlich ein 14-tägiges Widerrufsrecht gemäß § 355 BGB.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Elektronische Widerrufsfunktion (§ 356a BGB):</strong>{' '}
                Den Widerruf kannst du über die Schaltfläche „Vertrag widerrufen&quot; im Footer oder
                unter{' '}
                <Link href="/widerruf" className={linkClass}>steakakademie.de/widerruf</Link>{' '}
                erklären. Du erhältst eine automatische Eingangsbestätigung per E-Mail.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Erlöschen des Widerrufsrechts:</strong> Stimmst
                du beim Kaufvorgang ausdrücklich zu, dass wir mit der Ausführung des Vertrags vor
                Ablauf der Widerrufsfrist beginnen, und bestätigst du, dass du damit dein
                Widerrufsrecht verlierst, erlischt das Widerrufsrecht gemäß § 356 Abs. 5 BGB mit
                der Freischaltung des digitalen Inhalts.
              </p>
              <p>
                Im Rahmen des Kaufvorgangs über Digistore24 wirst du gesondert auf diesen Verzicht
                hingewiesen und musst aktiv zustimmen. Ohne diese Zustimmung erfolgt keine
                sofortige Freischaltung.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 6b Elektronische Widerrufsfunktion & Muster-Widerrufsformular</h2>
              <p className="mb-3">
                Gemäß § 356a BGB stellen wir eine elektronische Widerrufsfunktion bereit.
                Du findest die Schaltfläche{' '}
                <strong className="text-text-primary">„Vertrag widerrufen&quot;</strong>{' '}
                im Footer jeder Seite sowie unter{' '}
                <Link href="/widerruf" className={linkClass}>steakakademie.de/widerruf</Link>.
                Der Widerruf wird zweistufig bestätigt; du erhältst danach unverzüglich eine
                elektronische Eingangsbestätigung auf dem von dir angegebenen Kommunikationsweg.
                Die Eingangsbestätigung dokumentiert Inhalt, Datum und Uhrzeit deines Widerrufs —
                sie ist kein Anerkenntnis der Wirksamkeit des Widerrufs.
              </p>
              <p className="mb-3">
                Alternativ kannst du auch das folgende Muster-Widerrufsformular nutzen und uns
                per E-Mail oder Post zusenden:
              </p>
              <div className="border border-border-subtle bg-surface-card p-5 text-sm space-y-2">
                <p>An: Uwe Yendell, Stahlsberg 73, 42279 Wuppertal,{' '}
                  <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>pitmaster@steakakademie.de</a>
                </p>
                <p>
                  Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über
                  den Kauf der folgenden Waren (*) / die Erbringung der folgenden Dienstleistung (*):
                </p>
                <p>_______________________________________________</p>
                <p>Bestellt am (*) / erhalten am (*): _____________</p>
                <p>Name des/der Verbraucher(s): _________________</p>
                <p>Anschrift des/der Verbraucher(s): _____________</p>
                <p>Datum: _______________</p>
                <p>Unterschrift (nur bei Mitteilung auf Papier): _____________</p>
                <p className="text-text-muted text-xs">(*) Unzutreffendes streichen.</p>
              </div>
            </section>

            <section>
              <h2 className={h2Class}>§ 7 Nutzerkonten</h2>
              <p className="mb-3">
                Für den Zugang zu kostenpflichtigen digitalen Inhalten ist ein Nutzerkonto auf
                steakakademie.de erforderlich. Du bist verpflichtet, deine Zugangsdaten geheim
                zu halten und uns unverzüglich zu informieren, wenn du einen Missbrauch deines
                Kontos feststellst.
              </p>
              <p className="mb-3">
                Wir behalten uns vor, Nutzerkonten bei Verstößen gegen diese AGB — insbesondere
                bei unerlaubter Weitergabe von Zugangsdaten — ohne Vorankündigung zu sperren.
                In diesem Fall besteht kein Anspruch auf Rückerstattung bereits bezahlter Beträge.
              </p>
              <p>
                Du kannst dein Konto jederzeit selbst in deinem{' '}
                <Link href="/diplome/profil" className={linkClass}>Profil</Link> unter
                „Konto löschen&quot; entfernen oder es durch Kontaktaufnahme unter{' '}
                <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>pitmaster@steakakademie.de</a>{' '}
                löschen lassen. Mit Löschung erlischt der Zugang zu allen digitalen Inhalten. Was
                dabei gelöscht wird und was gespeichert bleibt, steht in der{' '}
                <Link href="/datenschutz#konto-loeschen" className={linkClass}>Datenschutzerklärung</Link>.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 8 Steuer-Matrix — Haftungsausschluss für Steuerinformationen</h2>
              <p className="mb-3">
                Die Steuer-Matrix ist ein interaktives Berechnungstool, das auf Basis allgemein
                zugänglicher Steuer- und Sozialversicherungsdaten vereinfachte Netto-Vergleiche
                für Solo-Selbstständige in verschiedenen Ländern erstellt.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Die Steuer-Matrix stellt ausdrücklich keine
                Steuerberatung dar</strong> und ersetzt nicht die individuelle Beratung durch einen
                zugelassenen Steuerberater oder Rechtsanwalt. Die Berechnungen sind vereinfacht,
                beruhen auf einem bestimmten Stand der Gesetzeslage und können individuelle
                Steuertatbestände, Sonderregelungen oder aktuelle Gesetzesänderungen nicht
                vollständig abbilden.
              </p>
              <p>
                Entscheidungen über Wohnsitzverlegung, Unternehmensgründung im Ausland oder
                steuerliche Gestaltung dürfen nicht allein auf Basis der Steuer-Matrix getroffen
                werden. Eine Haftung für finanzielle oder steuerliche Nachteile, die aus der
                Nutzung der Steuer-Matrix entstehen, ist ausgeschlossen.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 9 KI-gestützte Inhalte</h2>
              <p>
                Auf steakakademie.de ist ein KI-Assistent (&quot;Marco&quot;) verfügbar, der auf Basis
                von KI-Sprachmodellen Antworten zu Grillthemen generiert. Diese Antworten sind
                automatisch erstellt und können Fehler enthalten. Sie ersetzen keine
                professionelle Beratung — insbesondere nicht in Fragen der Lebensmittelsicherheit,
                Hygiene oder Gesundheit. Die Nutzung des KI-Assistenten erfolgt auf eigene
                Verantwortung.
              </p>
              <p className="mt-3">
                Dasselbe gilt für die Produkte „Mein Protokoll&quot; (persönlicher 8-Wochen-Grillplan) und
                „Steak-Beichte&quot; (Diagnose von Grillfehlern): Ihr Ergebnis wird von einem
                KI-Sprachmodell erstellt und nicht einzeln von einem Menschen geprüft. Temperaturen und
                Zeiten sind Richtwerte. Bei „Mein Protokoll&quot; umfasst ein Protokoll einen Plan sowie eine
                kostenlose Neuerstellung (Korrektur); die Erstellung beginnt erst, wenn du den Fragebogen
                abschickst. Einzelheiten zur Datenverarbeitung stehen in der{' '}
                <Link href="/datenschutz" className={linkClass}>Datenschutzerklärung</Link> und im{' '}
                <Link href="/ki-disclaimer" className={linkClass}>KI-Disclaimer</Link>.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 10 Gewährleistung</h2>
              <p>
                Es gelten die gesetzlichen Gewährleistungsrechte. Bei Mängeln wende dich
                innerhalb von 2 Jahren nach Erhalt der Ware an uns.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 11 Haftungsbeschränkung</h2>
              <p>
                Für Schäden aus der Nutzung der auf dieser Website bereitgestellten
                Informationen (Grillempfehlungen, Kerntemperaturen, Zubereitungshinweise,
                Steuer-Matrix-Berechnungen, KI-Assistent-Ausgaben) wird keine Haftung
                übernommen, soweit diese nicht auf Vorsatz oder grober Fahrlässigkeit beruhen.
                Alle Angaben sind nach bestem Wissen erstellt; eine Garantie für Richtigkeit
                und Vollständigkeit wird nicht übernommen.
              </p>
            </section>

            <section id="community" className="scroll-mt-24">
              <h2 className={h2Class}>§ 12 Community-Rezepte, Erfahrungsberichte &amp; nutzergenerierte Inhalte</h2>
              <p className="mb-3">
                Eingeloggte Nutzer können eigene <strong className="text-text-primary">Rezepte</strong>{' '}
                einreichen, die nach automatisierter Vorprüfung und unserer Freigabe auf
                steakakademie.de veröffentlicht werden können, sowie kurze <strong className="text-text-primary">Erfahrungsberichte zu
                Streitfällen</strong> („Stimme aus der Praxis&ldquo;, max. 600 Zeichen, ein Beitrag je
                Streitfall). Erfahrungsberichte erscheinen ausschließlich nach vorheriger manueller
                Freigabe durch uns; ein Anspruch auf Veröffentlichung besteht nicht. Für alle diese
                Inhalte — nachfolgend einheitlich „Beiträge&ldquo; — gilt:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li>
                  <strong className="text-text-primary">Zusicherung der Rechte:</strong> Du sicherst
                  zu, dass der eingereichte Beitrag von dir stammt bzw. du über alle erforderlichen
                  Rechte verfügst und keine Rechte Dritter (Urheber-, Marken-, Persönlichkeits- oder
                  sonstige Rechte) verletzt. Es dürfen keine personenbezogenen Daten Dritter
                  enthalten sein.
                </li>
                <li>
                  <strong className="text-text-primary">Nutzungsrechtseinräumung:</strong> Mit der
                  Einreichung räumst du uns ein einfaches, räumlich und zeitlich unbeschränktes,
                  unentgeltliches Nutzungsrecht ein, den Beitrag (Rezept bzw. Erfahrungsbericht)
                  sowie ein dazu automatisch generiertes KI-Bild auf der Plattform und in damit verbundenen Kanälen zu
                  speichern, zu bearbeiten (z.&nbsp;B. redaktionelle Anpassung, Kürzung), öffentlich
                  zugänglich zu machen und zu bewerben. Ein Vergütungsanspruch besteht nicht.
                </li>
                <li>
                  <strong className="text-text-primary">Autoren-Anzeige:</strong> Sofern du einen
                  Anzeigenamen gesetzt hast, wird dieser als Autor angezeigt. Ohne Anzeigenamen
                  erfolgt die Veröffentlichung unter einer neutralen Bezeichnung. Bei
                  Erfahrungsberichten ist der Anzeigename Teil der Einsendung (Vorname und Ort,
                  z.&nbsp;B. „Thomas aus Kassel&ldquo;); gib dort keine Nachnamen und keine Daten Dritter an.
                </li>
                <li>
                  <strong className="text-text-primary">Moderation &amp; Entfernung:</strong>{' '}
                  Rezept-Einreichungen durchlaufen zunächst eine automatisierte Vorprüfung (KI);
                  veröffentlicht wird ein Rezept erst, nachdem wir es freigegeben haben.
                  Einreichungen, die die Vorprüfung nicht bestehen, werden nicht veröffentlicht.
                  Erfahrungsberichte prüfen wir ausnahmslos manuell vor der Veröffentlichung. Wir
                  behalten uns vor, Inhalte ohne
                  Angabe von Gründen abzulehnen, zu bearbeiten oder zu entfernen. Du kannst die
                  Löschung deines veröffentlichten Beitrags jederzeit per E-Mail an{' '}
                  <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>pitmaster@steakakademie.de</a>{' '}
                  verlangen.
                </li>
                <li>
                  <strong className="text-text-primary">Verantwortlichkeit:</strong> Für eingereichte
                  Inhalte ist der jeweilige Nutzer verantwortlich. Wir machen uns nutzergenerierte
                  Inhalte nicht zu eigen und haften nach den §§ 7&nbsp;ff. DDG erst ab Kenntnis einer
                  konkreten Rechtsverletzung; bei Hinweisen entfernen wir betroffene Inhalte
                  unverzüglich. Rechtswidrige Inhalte kannst du jederzeit über das Melde- und
                  Abhilfeverfahren nach § 7 unserer{' '}
                  <a href="/nutzungsbedingungen#melden" className={linkClass}>Nutzungsbedingungen</a>{' '}
                  melden.
                </li>
                <li>
                  <strong className="text-text-primary">Freistellung:</strong> Verletzt ein von dir
                  eingereichter Inhalt schuldhaft Rechte Dritter, stellst du uns von berechtigten
                  Ansprüchen Dritter frei, die hieraus entstehen.
                </li>
              </ul>
              <p>
                Hinweise zur Datenverarbeitung bei Community-Rezepten findest du in der{' '}
                <Link href="/datenschutz#community" className={linkClass}>Datenschutzerklärung</Link>.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>§ 13 Anwendbares Recht</h2>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist
                Wuppertal, sofern du Kaufmann oder juristische Person des öffentlichen
                Rechts bist.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
