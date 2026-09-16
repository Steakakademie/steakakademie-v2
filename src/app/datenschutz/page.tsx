import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  robots: { index: false, follow: false },
};

export default function DatenschutzPage() {
  const linkClass = 'text-brand-fire hover:underline';
  const h2Class = 'font-sans text-sm font-bold tracking-[0.12em] uppercase text-text-primary mb-3';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">

          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={12} />
            <span>Datenschutz</span>
          </nav>

          <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">Datenschutzerklärung</h1>
          <p className="text-sm font-sans text-text-muted mb-10">Stand: September 2026</p>

          <div className="max-w-content space-y-8 font-body text-text-secondary leading-relaxed">

            <section>
              <h2 className={h2Class}>1. Verantwortlicher</h2>
              <p>
                Uwe Yendell<br />
                Stahlsberg 73<br />
                42279 Wuppertal<br />
                E-Mail:{' '}
                <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>
                  pitmaster@steakakademie.de
                </a>
              </p>
            </section>

            <section>
              <h2 className={h2Class}>1a. SSL-/TLS-Verschlüsselung</h2>
              <p>
                Diese Website nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
                vertraulicher Inhalte — etwa Anfragen über das Kontaktformular oder Anmeldedaten —
                eine SSL-/TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennst du daran,
                dass die Adresszeile deines Browsers auf &bdquo;https://&ldquo; steht und an dem
                Schloss-Symbol in deiner Browserzeile. Unverschlüsselte Verbindungen werden
                serverseitig automatisch auf https umgeleitet und der Browser wird zusätzlich per
                HTTP Strict Transport Security (HSTS) angewiesen, ausschließlich verschlüsselt zu
                verbinden. Ist die SSL-/TLS-Verschlüsselung aktiviert, können die Daten, die du an
                uns übermittelst, nicht ohne Weiteres von Dritten mitgelesen werden.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>2. Allgemeine Hinweise zur Datenverarbeitung</h2>
              <p>
                Die Nutzung dieser Website ist grundsätzlich ohne Angabe personenbezogener Daten
                möglich. Soweit personenbezogene Daten erhoben werden, erfolgt dies auf freiwilliger
                Basis. Diese Daten werden ohne deine ausdrückliche Zustimmung nicht an Dritte
                weitergegeben, außer es ist zur Erbringung des Dienstes erforderlich oder gesetzlich
                vorgeschrieben.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>2a. Kontaktformular</h2>
              <p className="mb-3">
                Nutzt du das Formular unter{' '}
                <Link href="/kontakt" className={linkClass}>steakakademie.de/kontakt</Link>, verarbeiten
                wir die von dir eingegebenen Daten: Name, E-Mail-Adresse, ausgewählter Betreff und
                deine Nachricht. Zum Nachweis deiner Einwilligung (Art. 5 Abs. 2 DSGVO) speichern wir
                zusätzlich Zeitpunkt und Wortlaut des Einwilligungstextes, dem du zugestimmt hast —
                nicht jedoch deine IP-Adresse.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherort &amp; Zustellung:</strong> Deine
                Anfrage wird bei Supabase (Abschnitt 9) abgelegt und zusätzlich per E-Mail über
                unseren Versanddienstleister Loops (Abschnitt 7) an unser Postfach zugestellt.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherdauer:</strong> Deine Anfrage bleibt
                gespeichert, bis sie bearbeitet und das Anliegen abgeschlossen ist; eine automatische
                Löschfrist ist derzeit nicht eingerichtet. Du kannst jederzeit die Löschung verlangen
                unter{' '}
                <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>pitmaster@steakakademie.de</a>.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Bearbeitung deiner Anfrage) bzw. lit. f
                DSGVO (berechtigtes Interesse an der Beantwortung), Art. 6 Abs. 1 lit. c
                i.&nbsp;V.&nbsp;m. Art. 5 Abs. 2 DSGVO für den Nachweis deiner Einwilligung.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>3. Hosting (Vercel)</h2>
              <p className="mb-3">
                Diese Website wird bei Vercel Inc., 440 N Barranca Avenue #4133, Covina,
                CA 91723, USA gehostet. Beim Aufruf der Website werden automatisch technisch
                notwendige Serverlog-Daten verarbeitet (IP-Adresse, Browsertyp, Betriebssystem,
                Referrer-URL, Uhrzeit des Zugriffs). Diese Daten werden nicht mit anderen
                Datenquellen zusammengeführt.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherdauer:</strong> Server-Logs werden
                nach spätestens <strong className="text-text-primary">30 Tagen</strong> gelöscht
                oder anonymisiert.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am
                störungsfreien Betrieb). Drittlandübermittlung USA: EU-US Data Privacy Framework
                + EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). Details:{' '}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  vercel.com/legal/privacy-policy
                </a>
              </p>
            </section>

            <section>
              <h2 className={h2Class}>4. CDN &amp; DNS (Cloudflare)</h2>
              <p className="mb-3">
                Wir nutzen Cloudflare Inc., 101 Townsend St., San Francisco, CA 94107, USA als
                DNS-Anbieter und Content Delivery Network (CDN). Dabei werden Anfragen über
                Cloudflare-Server geleitet, um Sicherheit und Ladegeschwindigkeit zu verbessern.
                Cloudflare kann dabei technische Daten (u.&nbsp;a. IP-Adressen) verarbeiten.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherdauer:</strong> Verbindungs- und
                Sicherheitsdaten werden von Cloudflare nur kurzfristig zur Angriffsabwehr
                vorgehalten (in der Regel <strong className="text-text-primary">bis zu 30 Tage</strong>).
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO. Details:{' '}
                <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  cloudflare.com/privacypolicy
                </a>
              </p>
            </section>

            <section>
              <h2 className={h2Class}>5. Webanalyse (Plausible Analytics)</h2>
              <p className="mb-3">
                Diese Website nutzt Plausible Analytics der Plausible Insights OÜ, Västriku tn 2,
                50403 Tartu, Estland. Plausible ist ein datenschutzfreundliches Analysetool, das
                keine Cookies setzt, keine personenbezogenen Daten speichert und keine
                geräteübergreifende Verfolgung vornimmt.
              </p>
              <p className="mb-3">
                Plausible erhebt ausschließlich aggregierte, anonyme Nutzungsstatistiken
                (Seitenaufrufe, Herkunftsland, Gerätekategorie, Referrer). Es werden keine
                IP-Adressen gespeichert. Eine Einwilligung nach § 25 TDDDG ist nicht erforderlich.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
                Verbesserung unseres Angebots). Details:{' '}
                <a href="https://plausible.io/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  plausible.io/privacy
                </a>
              </p>
            </section>

            <section>
              <h2 className={h2Class}>5a. Ladezeit-Messung (eigene Erhebung)</h2>
              <p className="mb-3">
                Zur technischen Optimierung erhebt diese Website die sogenannten Core Web Vitals
                (unter anderem Ladezeit des größten Inhaltselements, Layout-Stabilität,
                Reaktionszeit auf die erste Eingabe, Server-Antwortzeit). Die Messung erfolgt im
                Browser und wird an unseren eigenen Server übermittelt; ein externer
                Dienstleister ist nicht beteiligt.
              </p>
              <p className="mb-3">
                Gespeichert werden ausschließlich: der aufgerufene Pfad ohne Suchparameter, Name
                und Wert der Messgröße, deren Bewertung, die Art des Seitenaufrufs, die
                Geräteklasse (Touch- oder Zeigegerät) und die Versionsnummer der Website. Es
                werden keine IP-Adresse, keine Browserkennung, keine Nutzerkennung, keine Cookies und
                keine Daten in Ihrem Endgerät gespeichert oder ausgelesen. Ein Personenbezug ist
                damit nicht herstellbar; eine Einwilligung nach § 25 TDDDG ist nicht erforderlich.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer
                schnellen und stabilen Website).
              </p>
            </section>

            <section>
              <h2 className={h2Class}>6. Heatmaps &amp; Sitzungs-Analyse (Microsoft Clarity)</h2>
              <p className="mb-3">
                Zur Verbesserung von Benutzerfreundlichkeit und Inhalten setzen wir – <strong className="text-text-primary">ausschließlich
                mit deiner Einwilligung</strong> – Microsoft Clarity ein, einen Dienst der Microsoft Ireland
                Operations Limited (One Microsoft Place, South County Business Park, Leopardstown, Dublin 18,
                Irland; ggf. Microsoft Corporation, USA).
              </p>
              <p className="mb-3">
                Clarity erstellt anonymisierte <strong className="text-text-primary">Heatmaps</strong> und
                {' '}<strong className="text-text-primary">Sitzungsaufzeichnungen</strong> (Klick-, Scroll- und
                Mausbewegungen) und hilft uns zu verstehen, wie die Seite genutzt wird. Sensible Inhalte
                (Eingabefelder, Texte) werden dabei automatisch maskiert. Clarity setzt hierfür Cookies
                (u. a. <code>_clck</code>, <code>_clsk</code>, <code>CLID</code>).
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Einwilligung erforderlich:</strong> Clarity wird erst
                geladen, nachdem du im Cookie-Banner aktiv zugestimmt hast. Ohne Zustimmung findet keine
                Verarbeitung durch Clarity statt. Du kannst deine Einwilligung jederzeit mit Wirkung für die
                Zukunft widerrufen – über den Link „Cookie-Einstellungen&quot; im Seitenfuß.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Drittlandübermittlung:</strong> Eine Verarbeitung in den
                USA ist möglich. Microsoft ist unter dem EU-US Data Privacy Framework zertifiziert; zusätzlich
                besteht ein Auftragsverarbeitungsvertrag (Art. 28 DSGVO).
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherdauer:</strong> Sitzungsaufzeichnungen speichert
                Microsoft für <strong className="text-text-primary">30 Tage</strong> (einzelne markierte
                Aufzeichnungen bis zu 13 Monate), aggregierte Heatmap-Daten für{' '}
                <strong className="text-text-primary">13 Monate</strong>; danach werden die Daten inklusive
                Backups unwiederbringlich gelöscht. Die gesetzten Cookies haben Laufzeiten von einem Tag
                (Sitzungs-Cookie) bis zu ca. einem Jahr.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) i. V. m. § 25 Abs. 1 TDDDG. Details:{' '}
                <a href="https://learn.microsoft.com/clarity/setup-and-installation/faq" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Microsoft Clarity FAQ
                </a>{' '}·{' '}
                <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  privacy.microsoft.com
                </a>
              </p>
            </section>

            {/* Hofladen-Radar (13.09.2026): Karte nur nach Klick (Klick-zum-Laden),
                Geocoding serverseitig, Standort nur auf Klick, lokaler Merker. */}
            <section id="hofladen-radar">
              <h2 className={h2Class}>6a. Hofladen-Radar (Karte: MapTiler, Daten: OpenStreetMap)</h2>
              <p className="mb-3">
                Unter <Link href="/hoefe" className={linkClass}>/hoefe</Link> findest du Hofläden und
                Direktvermarkter in deiner Nähe. Die Hof-Daten stammen aus OpenStreetMap
                (Lizenz ODbL) und liegen auf unserem eigenen Server (Supabase, Abschnitt 9);
                bei einer Suche werden nur der eingegebene Ort bzw. die gewählten Koordinaten
                verarbeitet, um Treffer zu berechnen. Die Umwandlung eines Ortsnamens in
                Koordinaten führt <strong className="text-text-primary">unser Server</strong> durch –
                dein Browser sendet dabei nichts an Dritte.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Kartenansicht – nur nach Klick:</strong> Die
                Kartenkacheln liefert MapTiler AG, Zugerstrasse 22, 6314 Unterägeri, Schweiz (Angemessenheitsbeschluss
                der EU-Kommission). Die Karte wird erst geladen, wenn du auf „Karte laden“ klickst;
                dann überträgt dein Browser deine IP-Adresse und die angeforderten Kartenausschnitte
                an MapTiler (Art. 6 Abs. 1 lit. a DSGVO). Wählst du „Immer laden“, merken wir uns
                das ausschließlich in deinem Browser (localStorage, Schlüssel <code>sa-karte-v1</code>,
                keine Übertragung an uns); den Widerruf findest du direkt unter der Karte.
                Datenschutzerklärung von MapTiler:{' '}
                <a href="https://www.maptiler.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  maptiler.com/privacy-policy
                </a>
              </p>
              <p>
                <strong className="text-text-primary">„Meinen Standort verwenden“:</strong> Nur auf
                deinen Klick fragt der Browser nach deinem Standort. Die Koordinaten werden einmalig
                an unseren Server gesendet, um Höfe im Umkreis zu berechnen, und nicht gespeichert.
                Ohne Freigabe funktioniert die Suche über Ort oder Postleitzahl.
              </p>
            </section>

            {/* Rechts-Audit 28.08.2026 — vollständig ersetzt.
                Behobene Mängel: falsche Rechtsperson („Loops Software Inc." statt
                Astrodon Corporation), fehlender Drittlandhinweis USA samt Garantie
                (Art. 13 Abs. 1 lit. f), fehlende Protokollierung (Art. 13 Abs. 1
                lit. c), fehlende Löschfrist für Nichtbestätiger (Art. 13 Abs. 2
                lit. a), Widerspruch zwischen „unverzüglich gelöscht" und der
                Pflicht zu Sperrliste und Einwilligungsnachweis, sowie die fehlende
                Abdeckung der Transaktionsmails über denselben Dienstleister. */}
            <section>
              <h2 className={h2Class}>7. Newsletter (Wissens-Brief) und E-Mail-Versand</h2>

              <h3 className="font-serif font-bold text-text-primary mt-4 mb-2">7.1 Anbieter und Empfänger</h3>
              <p className="mb-3">
                Für den Versand unseres Newsletters und unserer Transaktions-E-Mails
                (Bestätigungen aus dem Kontaktformular, Widerrufsbestätigungen,
                Geschenkgutscheine, Login-Links) nutzen wir den Dienst Loops der{' '}
                <strong className="text-text-primary">Astrodon Corporation</strong>,
                9450 SW Gemini Dr, PMB 22902, Beaverton, Oregon 97008-7105, USA.
              </p>
              <p className="mb-3">
                Astrodon verarbeitet die Daten ausschließlich weisungsgebunden für uns. Wir haben
                einen Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO geschlossen (
                <a href="https://loops.so/dpa" target="_blank" rel="noopener noreferrer" className={linkClass}>loops.so/dpa</a>
                ). Die eingesetzten Unterauftragsverarbeiter sind unter{' '}
                <a href="https://loops.so/subprocessors" target="_blank" rel="noopener noreferrer" className={linkClass}>loops.so/subprocessors</a>{' '}
                einsehbar. Astrodon prüft versandte E-Mails automatisiert und im Einzelfall
                manuell auf Spam und schädliche Inhalte.
              </p>

              <h3 className="font-serif font-bold text-text-primary mt-4 mb-2">7.2 Übermittlung in die USA</h3>
              <p className="mb-3">
                Die Verarbeitung findet in den USA statt — einem Drittland im Sinne der DSGVO.
                Astrodon Corporation ist nach dem EU-U.S. Data Privacy Framework zertifiziert;
                für die Übermittlung besteht damit ein Angemessenheitsbeschluss der Europäischen
                Kommission nach Art. 45 DSGVO. Den Zertifizierungsstatus kannst du unter{' '}
                <a href="https://www.dataprivacyframework.gov/list" target="_blank" rel="noopener noreferrer" className={linkClass}>dataprivacyframework.gov/list</a>{' '}
                einsehen. Ergänzend gelten die Standardvertragsklauseln der Europäischen Kommission
                nach Art. 46 Abs. 2 lit. c DSGVO. Trotz dieser Garantien lässt sich nicht
                vollständig ausschließen, dass US-Behörden auf die Daten zugreifen.
              </p>

              <h3 className="font-serif font-bold text-text-primary mt-4 mb-2">7.3 Anmeldung im Double-Opt-In-Verfahren</h3>
              <p className="mb-3">
                Nach Eingabe deiner E-Mail-Adresse senden wir dir eine Bestätigungsmail. Erst nach
                Klick auf den darin enthaltenen Link nehmen wir dich in den Verteiler auf. Der Link
                ist 48 Stunden gültig. Ohne Bestätigung wird kein Kontakt angelegt.
              </p>

              <h3 className="font-serif font-bold text-text-primary mt-4 mb-2">7.4 Protokollierung</h3>
              <p className="mb-3">
                Zum Nachweis der Einwilligung nach Art. 7 Abs. 1 DSGVO speichern wir: Zeitpunkt und
                IP-Adresse der Anmeldung, Zeitpunkt und IP-Adresse der Bestätigung sowie den
                Wortlaut des Einwilligungstextes, dem du zugestimmt hast. Diese Protokollierung ist
                zur Erfüllung unserer Rechenschaftspflicht nach Art. 5 Abs. 2 DSGVO erforderlich.
              </p>

              <h3 className="font-serif font-bold text-text-primary mt-4 mb-2">7.5 Inhalte</h3>
              <p className="mb-3">
                Der Wissens-Brief enthält redaktionelle Beiträge rund um Grillen und BBQ sowie
                Werbung und Produktempfehlungen, auch von Partnern über Affiliate-Links.
              </p>

              {/* ⚠️ ABHÄNGIGKEIT — NICHT ÜBERSEHEN
                  Dieser Absatz beschreibt den SOLL-Zustand: Tracking aus.
                  Er wird erst wahr, wenn in Loops unter Settings → Sending das
                  Open- und Click-Tracking deaktiviert ist. Die Loops-API stellt
                  diesen Schalter nicht bereit, er muss im UI umgelegt werden.
                  Solange Tracking aktiv ist, ist dieser Absatz eine unzutreffende
                  Datenschutzangabe — schlimmer als gar keine.
                  Wird Tracking bewusst beibehalten, braucht es stattdessen:
                    1. eine gesonderte, freiwillige Einwilligungs-Checkbox
                       (§ 25 Abs. 1 TDDDG — ein DSE-Hinweis genügt NICHT),
                    2. den Tracking-Passus in diesem Abschnitt,
                    3. TRACKING_CONSENT_IMPLEMENTED = true in @/lib/consent. */}
              <h3 className="font-serif font-bold text-text-primary mt-4 mb-2">7.6 Erfolgsmessung</h3>
              <p className="mb-3">
                Wir messen weder das Öffnen unserer E-Mails noch Klicks auf enthaltene Links
                personenbezogen. Unsere E-Mails enthalten kein Zählpixel.
              </p>

              <h3 className="font-serif font-bold text-text-primary mt-4 mb-2">7.7 Rechtsgrundlage</h3>
              <p className="mb-3">
                Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) sowie § 7 Abs. 2 Nr. 2 UWG. Für
                Transaktions-E-Mails: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) bzw.
                Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).
              </p>

              <h3 className="font-serif font-bold text-text-primary mt-4 mb-2">7.8 Widerruf</h3>
              <p className="mb-3">
                Du kannst deine Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen — über
                den Abmeldelink in jeder E-Mail oder per Nachricht an{' '}
                <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>pitmaster@steakakademie.de</a>.
                Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt.
              </p>

              <h3 className="font-serif font-bold text-text-primary mt-4 mb-2">7.9 Speicherdauer</h3>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li>Bestätigte Abonnements: bis zum Widerruf.</li>
                <li>Nicht bestätigte Anmeldungen: automatische Löschung nach 30 Tagen.</li>
                <li>
                  Nach Widerruf: Entfernung aus dem aktiven Verteiler. Deine Adresse wird in eine
                  Sperrliste aufgenommen, damit du keine weiteren E-Mails erhältst. Den
                  Einwilligungsnachweis bewahren wir 3 Jahre auf, um die rechtmäßige Zusendung im
                  Streitfall belegen zu können (Art. 6 Abs. 1 lit. f DSGVO, §§ 195, 199 BGB).
                </li>
              </ul>

              <p>
                Weitere Informationen:{' '}
                <a href="https://loops.so/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  loops.so/privacy
                </a>
              </p>
            </section>

            <section>
              <h2 className={h2Class}>8. Exit-Intent-Overlay (Newsletter-Anmeldung)</h2>
              <p className="mb-3">
                Diese Website zeigt nach einer bestimmten Verweildauer ein Overlay-Fenster an,
                das zur Newsletter-Anmeldung einlädt. Das Overlay wird durch Mausbewegung in
                Richtung Seitenrand ausgelöst und erscheint pro Browsersitzung maximal einmal
                (technische Speicherung via sessionStorage — wird nach Schließen des Browsers
                gelöscht, kein dauerhaftes Tracking).
              </p>
              <p>
                Wenn du deine E-Mail-Adresse eingibst, gilt dasselbe wie unter Abschnitt 7
                (Newsletter). Kein Pflichtfeld — das Overlay kann jederzeit geschlossen werden.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>9. Nutzerkonten &amp; Kursdaten (Supabase)</h2>
              <p className="mb-3">
                Für die Nutzung von kostenpflichtigen Inhalten (Kurse, Steuer-Matrix-Rechner,
                digitale Produkte) ist ein Nutzerkonto erforderlich. Kontodaten werden bei
                Supabase Inc. (EU-Rechenzentrum Frankfurt) gespeichert. Supabase verarbeitet
                im Rahmen einer Auftragsverarbeitung (Art. 28 DSGVO) folgende Daten:
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li>E-Mail-Adresse und Authentifizierungsdaten</li>
                <li>Kursbuchungen und Zugangsberechtigungen</li>
                <li>Lernfortschritt und Diplom-Status</li>
              </ul>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherdauer:</strong> Konto- und
                Kursdaten werden für die Dauer des Nutzerkontos gespeichert und nach dessen
                Löschung innerhalb von <strong className="text-text-primary">30 Tagen</strong>{' '}
                entfernt, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Details:{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  supabase.com/privacy
                </a>
              </p>
            </section>

            <section>
              <h2 className={h2Class}>8a. Community-Rezepte (nutzergenerierte Inhalte)</h2>
              <p className="mb-3">
                Angemeldete Nutzer können eigene Rezepte einreichen, die nach Prüfung im
                Community-Bereich veröffentlicht werden. Dabei verarbeiten wir die von dir
                eingegebenen Inhalte (Rezepttitel, Zutaten, Zubereitungsschritte, von dir
                gewählter Anzeigename) sowie den Bearbeitungsstatus. Die Speicherung erfolgt
                bei Supabase (Abschnitt 8).
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Kein Foto-Upload:</strong> Das Hochladen
                von Bildern — insbesondere von Personenfotos — ist nicht vorgesehen. Rezeptbilder
                werden von uns KI-generiert (siehe Abschnitt 10b).
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherdauer:</strong> Eingereichte Inhalte
                werden gespeichert, bis du sie löschst oder die Veröffentlichung widerrufst.
                Es gelten ergänzend unsere{' '}
                <Link href="/nutzungsbedingungen" className={linkClass}>Nutzungsbedingungen</Link>.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Bei Löschung deines Kontos:</strong> Bereits
                veröffentlichte Rezepte bleiben als Bestandteil des Community-Bereichs erhalten.
                Dein Anzeigename wird dabei entfernt und durch &bdquo;Ehemaliges Mitglied&ldquo;
                ersetzt, und die Verknüpfung zu deinem Nutzerkonto wird gelöst — ein Personenbezug
                besteht danach nicht mehr.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Nutzungsverhältnis) sowie lit. f
                (berechtigtes Interesse am Betrieb der Community).
              </p>
            </section>

            <section>
              <h2 className={h2Class}>8b. Authentifizierungs- &amp; Transaktions-E-Mails (Resend)</h2>
              <p className="mb-3">
                Für den Versand von Anmelde-/Login-Links (Magic Link) und transaktionalen
                E-Mails nutzen wir <strong className="text-text-primary">Resend, Inc.</strong>,
                2261 Market Street #5039, San Francisco, CA 94114, USA. Resend verarbeitet hierfür
                deine E-Mail-Adresse und den Nachrichteninhalt ausschließlich zum Zweck der Zustellung.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Drittlandübermittlung:</strong> USA —
                abgesichert über EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).
                <strong className="text-text-primary"> Speicherdauer:</strong> nur zur Zustellung;
                Zustell-Logs werden kurzfristig vorgehalten.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung/Kontozugang).
                Details:{' '}
                <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  resend.com/legal/privacy-policy
                </a>
              </p>
            </section>

            <section>
              <h2 className={h2Class}>10. Zahlungsabwicklung (Digistore24)</h2>
              <p className="mb-3">
                Zahlungen für digitale Produkte werden über Digistore24 GmbH abgewickelt.
                Im Rahmen des Bestellvorgangs erhebt Digistore24 die für die Kaufabwicklung
                erforderlichen Daten (Name, E-Mail, Zahlungsdaten). Diese Daten werden
                ausschließlich von Digistore24 verarbeitet; wir haben keinen Zugriff auf
                vollständige Zahlungsdaten.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherdauer:</strong> Rechnungs- und
                Buchungsdaten unterliegen den gesetzlichen Aufbewahrungsfristen
                (§ 147 AO, § 257 HGB — 10 bzw. 6 Jahre) und werden erst nach deren Ablauf gelöscht.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Details:{' '}
                <a href="https://www.digistore24.com/datenschutz" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  digistore24.com/datenschutz
                </a>
              </p>
            </section>

            <section>
              <h2 className={h2Class}>11. KI-Assistenten „Marco&quot; (Anthropic)</h2>
              <p className="mb-3">
                Diese Website bietet den KI-Assistenten „Marco&quot; als Chat-Widget an.
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li>
                  <strong className="text-text-primary">Zweck:</strong>{' '}
                  Bereitstellung von Grillberatung via Chat (Cuts, Temperaturen, Techniken).
                </li>
                <li>
                  <strong className="text-text-primary">Verarbeitete Daten:</strong>{' '}
                  Eingegebene Chat-Nachrichten (temporär, keine serverseitige Speicherung
                  nach Sitzungsende, keine Verknüpfung mit Nutzerprofilen).
                </li>
                <li>
                  <strong className="text-text-primary">Empfänger / Auftragsverarbeiter:</strong>{' '}
                  Anthropic PBC, 548 Market Street, San Francisco, CA 94104, USA
                  (Auftragsverarbeiter gemäß Art. 28 DSGVO).
                </li>
                <li>
                  <strong className="text-text-primary">Drittlandübermittlung:</strong>{' '}
                  USA — Rechtsgrundlage: EU-Standardvertragsklauseln (SCC)
                  gemäß Art. 46 Abs. 2 lit. c DSGVO.
                </li>
                <li>
                  <strong className="text-text-primary">Rechtsgrundlage:</strong>{' '}
                  Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse: Bereitstellung
                  des Beratungsdienstes).
                </li>
                <li>
                  <strong className="text-text-primary">Speicherdauer:</strong>{' '}
                  Keine serverseitige Speicherung nach Sitzungsende.
                </li>
              </ul>
              <p className="mb-3">
                Wir empfehlen, keine sensiblen personenbezogenen Daten in den Chat einzugeben.
                Marco ist ein KI-Assistent — keine Rechts-, Steuer- oder Gesundheitsberatung.
              </p>
              <p>
                Weitere Informationen:{' '}
                <Link href="/ki-disclaimer" className={linkClass}>
                  KI-Disclaimer
                </Link>
                {' '}· Anthropic-Datenschutz:{' '}
                <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  anthropic.com/privacy
                </a>
              </p>
            </section>

            <section>
              <h2 className={h2Class}>10a. KI-Moderation von Community-Einreichungen (Anthropic)</h2>
              <p className="mb-3">
                Von Nutzern eingereichte Rezepte werden vor einer möglichen Veröffentlichung
                automatisiert mit einem KI-Sprachmodell von <strong className="text-text-primary">Anthropic
                PBC</strong> (Auftragsverarbeiter, Art. 28 DSGVO; USA, EU-Standardvertragsklauseln)
                auf Qualität und Zulässigkeit geprüft. Verarbeitet wird ausschließlich der von dir
                eingereichte Rezeptinhalt.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Keine ausschließlich automatisierte
                Entscheidung:</strong> Die KI-Prüfung ist eine Vorprüfung; die endgültige
                Freigabe oder Ablehnung erfolgt unter menschlicher Kontrolle (kein automatisierter
                Einzelfallbeschluss mit Rechtswirkung i.&nbsp;S.&nbsp;v. Art. 22 DSGVO).
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am Schutz der
                Plattform vor rechtswidrigen oder unsachgemäßen Inhalten).
              </p>
            </section>

            <section>
              <h2 className={h2Class}>10b. KI-Bildgenerierung für Rezepte (fal.ai)</h2>
              <p className="mb-3">
                Rezeptbilder werden serverseitig mit dem KI-Bilddienst{' '}
                <strong className="text-text-primary">fal.ai (Features &amp; Labels, Inc.)</strong>, USA,
                erzeugt. Verarbeitet wird ausschließlich der Rezept-/Prompttext zur Erstellung eines
                Bildes — <strong className="text-text-primary">es werden keine personenbezogenen Daten
                und keine Personenfotos verarbeitet</strong>.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bebilderung
                der Inhalte). Drittlandübermittlung USA — EU-Standardvertragsklauseln (Art. 46 DSGVO).
              </p>
            </section>

            <section>
              <h2 className={h2Class}>10c. Wissenssuche &amp; Rezept-Generierung (Voyage AI)</h2>
              <p className="mb-3">
                Die Wissenssuche und die „Rezept-Schmiede&quot; wandeln deine Eingabe (Frage bzw.
                Rezept-Auftrag) serverseitig in einen Vektor um, um passende Einträge unserer
                Wissensdatenbank zu finden. Dafür nutzen wir den Dienst{' '}
                <strong className="text-text-primary">Voyage AI Innovations, Inc.</strong>, eine
                hundertprozentige Tochtergesellschaft der MongoDB, Inc., 1633 Broadway, 38th Floor,
                New York, NY 10019, USA (Auftragsverarbeiter, Art. 28 DSGVO).
              </p>
              <p className="mb-3">
                Verarbeitet wird ausschließlich der von dir eingegebene Text zur Berechnung der
                Vektor-Darstellung; eine dauerhafte Speicherung deiner Eingabe bei Voyage AI ist uns
                nicht bekannt und nicht beabsichtigt. Es werden keine Nutzerprofile oder Kontodaten
                übermittelt.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Kein KI-Training mit deinen Daten:</strong> Wir
                haben das Trainings-Opt-out gemäß Ziff. 3(iii) der Voyage-AI-Nutzungsbedingungen
                aktiviert (Stand: 16.09.2026). Ab diesem Zeitpunkt eingehende Anfragen werden nicht zum
                Training von KI-Modellen verwendet und nach der Verarbeitung gelöscht. Für Anfragen vor
                diesem Zeitpunkt kann Voyage AI laut seinen Nutzungsbedingungen ein fortbestehendes
                Nutzungsrecht zu Trainingszwecken haben.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Drittlandübermittlung:</strong> USA — abgesichert
                über EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer
                funktionierenden Wissenssuche und Rezept-Generierung).
              </p>
            </section>

            <section>
              <h2 className={h2Class}>12. Cookies &amp; lokale Speicherung</h2>
              <p className="mb-3">
                <strong className="text-text-primary">Technisch notwendige Speichermechanismen</strong>{' '}
                (keine Einwilligung erforderlich, § 25 Abs. 2 TDDDG):
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li><strong className="text-text-primary">localStorage:</strong> Theme-Einstellung (hell/dunkel) — dauerhaft, lokal im Browser</li>
                <li><strong className="text-text-primary">sessionStorage:</strong> Exit-Intent-Status (wurde das Overlay bereits gezeigt?) — wird nach Schließen des Browsers automatisch gelöscht</li>
                <li><strong className="text-text-primary">Supabase Auth-Token:</strong> Für eingeloggte Nutzer — sicherer JWT-Token zur Sitzungsverwaltung</li>
              </ul>
              <p className="mb-3">
                <strong className="text-text-primary">Einwilligungspflichtige Cookies (nur nach Opt-in):</strong>{' '}
                Microsoft Clarity (Abschnitt 6) setzt Cookies für Heatmaps und Sitzungs-Analyse. Diese
                werden <strong className="text-text-primary">ausschließlich nach deiner aktiven Einwilligung</strong>{' '}
                über unseren Cookie-Banner gesetzt. Der Banner bietet auf erster Ebene zwei gleichwertige
                Optionen („Alles akzeptieren&quot; und „Ablehnen&quot;); ohne Zustimmung werden keine solchen Cookies
                gesetzt. Deine Wahl kannst du jederzeit über „Cookie-Einstellungen&quot; im Seitenfuß ändern oder
                widerrufen. Die gespeicherte Einwilligungs-Entscheidung selbst liegt technisch notwendig im
                localStorage deines Browsers.
              </p>
              <p>
                <strong className="text-text-primary">Reichweitenmessung ohne Cookies:</strong>{' '}
                Die Grund-Statistik erfolgt über Plausible (Abschnitt 5), das cookieless arbeitet, keine
                personenbezogenen Daten speichert und keiner Einwilligung bedarf.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>13. Externe Links &amp; Affiliate-Links</h2>
              <p className="mb-3">
                Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte
                wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets
                der jeweilige Anbieter oder Betreiber verantwortlich.
              </p>
              <p className="mb-3">
                Produktempfehlungen können Affiliate-Links enthalten (gekennzeichnet mit * oder
                dem Hinweis „Affiliate-Link&quot;). Bei einem Kauf über solche Links erhalten wir
                eine Provision ohne Mehrkosten für dich.
              </p>
              <p className="mb-3">
                Wir nehmen am <strong>Amazon Partnerprogramm</strong> teil. In Vorbereitung
                befinden sich die Programme <strong>360° BBQ</strong> und{' '}
                <strong>Grill-Experte.de</strong> (vermittelt über die Affiliate-Netzwerke
                AWIN bzw. TradeTracker) sowie <strong>Banggood</strong>. Beim Klick auf einen
                Affiliate-Link kann der jeweilige Anbieter bzw. das Netzwerk ein Cookie setzen,
                über das ein späterer Kauf der Vermittlung zugeordnet wird (Affiliate-Tracking).
              </p>
              <p>
                <strong className="text-text-primary">Derzeit werden keine Affiliate-Tracking-Cookies
                gesetzt.</strong> Sobald ein Affiliate- oder Marketing-Tracking aktiviert wird, das
                einwilligungspflichtige Cookies erfordert (§ 25 TDDDG), richten wir vorab einen
                Einwilligungs-Mechanismus mit gleichwertiger Ablehnen-Option ein. Eine vollständige
                Übersicht aller Partnerprogramme findest du in unserer{' '}
                <Link href="/affiliate-disclosure" className={linkClass}>Affiliate-Disclosure</Link>.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>12a. Google Web Fonts — selbst gehostet</h2>
              <p className="mb-3">
                Diese Website verwendet Schriftarten des Dienstes{' '}
                <strong>Google Web Fonts</strong> (Google LLC, 1600 Amphitheatre Parkway,
                Mountain View, CA 94043, USA). Die Einbindung erfolgt über die Next.js
                Font Optimization (<code>next/font/google</code>): Die Schriftdateien
                (Playfair Display, Source Serif 4, DM Sans) werden dabei <strong>einmalig
                beim Build-Vorgang</strong> von Google-Servern heruntergeladen und
                anschließend auf unserer eigenen Server-Infrastruktur gespeichert.
              </p>
              <p className="mb-3">
                Beim Seitenaufruf werden die Schriften <strong>ausschließlich von unserem
                Server</strong> ausgeliefert — es findet <strong>keine direkte Verbindung
                zu Google-Servern</strong> zur Laufzeit statt. Deine IP-Adresse wird
                nicht an Google übermittelt.
              </p>
              <p>
                <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO
                (berechtigtes Interesse an einheitlicher, performanter Darstellung ohne
                externe Abhängigkeiten zur Laufzeit).
                Weitere Informationen:{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  policies.google.com/privacy
                </a>.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>12b. Technische Infrastruktur — Vercel</h2>
              <p className="mb-3">
                Das verwendete Web-Framework Next.js wird von{' '}
                <strong>Vercel Inc.</strong>, 440 N Barranca Avenue #4133, Covina,
                CA&nbsp;91723, USA, entwickelt und gepflegt. Vercel stellt für Next.js
                technische Infrastrukturdienste bereit (Build-Optimierungen,
                Font-Optimierung, Bild-Optimierung). Bei der Auslieferung dieser Website
                können daher technische Anfragen an Vercel-Server erfolgen.
              </p>
              <p className="mb-3">
                Verarbeitet werden technisch notwendige Verbindungsdaten
                (IP-Adresse, Zeitstempel, angeforderter Ressourcentyp).
              </p>
              <p className="mb-3">
                <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO
                (berechtigtes Interesse am performanten Betrieb des Web-Frameworks).
              </p>
              <p>
                <strong>Drittlandübermittlung:</strong> Vercel ist nach dem
                EU-US Data Privacy Framework zertifiziert; zusätzlich werden
                EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO) verwendet.
                Datenschutzerklärung:{' '}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  vercel.com/legal/privacy-policy
                </a>.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>13a. Fehler- und Stabilitätsüberwachung (Sentry)</h2>
              <p className="mb-3">
                Damit technische Fehler dieser Website erkannt und behoben werden können,
                setzen wir <strong className="text-text-primary">Sentry</strong> ein, einen
                Dienst der Functional Software, Inc. (dba Sentry), 45 Fremont Street,
                San Francisco, CA 94105, USA. Die Verarbeitung findet ausschließlich auf
                Servern in der <strong className="text-text-primary">Europäischen Union
                (Region &bdquo;de&ldquo;)</strong> statt; ein Datentransfer in die USA
                erfolgt im Regelbetrieb nicht.
              </p>
              <p className="mb-3">
                Erfasst werden ausschließlich Fehler <strong className="text-text-primary">auf
                unseren Servern</strong> — in den Programmierschnittstellen, beim Seitenaufbau
                und in den KI-Funktionen. Übermittelt wird ein technischer Bericht:
                Fehlermeldung, Programmzeile, betroffener Pfad und Zeitpunkt. Sentry setzt
                hierfür <strong className="text-text-primary">keine Cookies</strong>.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Seit dem 08.09.2026 läuft im Browser
                kein Sentry mehr.</strong> Fehler, die im Browser auftreten, erfassen wir
                selbst — siehe Abschnitt 13b. An Sentry wird aus dem Browser nichts mehr
                gesendet.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Was wir bewusst nicht übertragen:</strong>{' '}
                IP-Adressen, Cookies und nutzerbezogene Kopfzeilen werden nicht an Sentry
                gesendet (Option <code>sendDefaultPii</code> deaktiviert). Ebenfalls
                deaktiviert ist die Übertragung von Ein- und Ausgaben unserer KI-Funktionen:
                Deine Eingaben an den KI-Assistenten &bdquo;Marco&ldquo; (Abschnitt 11)
                erreichen Sentry <strong className="text-text-primary">nicht</strong> —
                übertragen werden nur technische Kennzahlen wie Modellname, Dauer und
                Token-Anzahl. Eine Sitzungsaufzeichnung (&bdquo;Session Replay&ldquo;)
                findet nicht statt.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherdauer:</strong> Fehlerberichte
                werden nach 90 Tagen automatisch gelöscht.
              </p>
              <p>
                <strong className="text-text-primary">Rechtsgrundlage:</strong> Art. 6 Abs. 1
                lit. f DSGVO — berechtigtes Interesse am fehlerfreien, sicheren Betrieb der
                Website. Mit Sentry besteht ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.
                Weitere Informationen:{' '}
                <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  sentry.io/privacy
                </a>.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>13b. Browser-Fehler (eigene Erfassung)</h2>
              <p className="mb-3">
                Fehler, die im Browser auftreten — etwa wenn eine Schaltfläche nicht reagiert
                oder eine Ansicht nicht lädt —, erfassen wir seit dem 08.09.2026 selbst. Die
                Meldung wird im Browser erzeugt und an unseren eigenen Server übermittelt; ein
                externer Dienstleister ist daran nicht beteiligt.
              </p>
              <p className="mb-3">
                Gespeichert werden ausschließlich: die Fehlermeldung und der technische
                Aufrufverlauf so, wie der Browser sie liefert, der aufgerufene Pfad ohne
                Suchparameter, die Browser-Familie (etwa Chrome oder Safari), die
                Geräteklasse und die Versionsnummer der Website. Es werden keine IP-Adresse,
                kein vollständiger Browser-Kennungstext, keine Nutzerkennung, keine Cookies
                und keine Daten in Ihrem Endgerät gespeichert oder ausgelesen. Eingaben in
                Formulare oder an den KI-Assistenten sind nicht Teil der Meldung.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am
                fehlerfreien und sicheren Betrieb der Website). Eine Einwilligung nach
                § 25 TDDDG ist nicht erforderlich.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>14. Deine Rechte</h2>
              <p className="mb-3">Du hast gemäß DSGVO folgende Rechte:</p>
              <ul className="list-disc list-inside space-y-1.5 mb-3">
                <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
                <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
                <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
                <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
                <li>Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
              </ul>
              <p>
                Wende dich dazu an:{' '}
                <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>
                  pitmaster@steakakademie.de
                </a>
              </p>
            </section>

            <section>
              <h2 className={h2Class}>15. Beschwerderecht bei der Aufsichtsbehörde</h2>
              <p>
                Du hast das Recht, dich bei der zuständigen Datenschutz-Aufsichtsbehörde
                zu beschweren. Zuständig ist die Landesbeauftragte für Datenschutz und
                Informationsfreiheit Nordrhein-Westfalen:{' '}
                <a href="https://www.ldi.nrw.de" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  ldi.nrw.de
                </a>
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
