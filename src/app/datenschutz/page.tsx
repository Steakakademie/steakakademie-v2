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
          <p className="text-sm font-sans text-text-muted mb-10">Stand: 03.10.2026</p>

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
                Das Formular ist durch die Bot-Prüfung Cloudflare Turnstile geschützt (Abschnitt 4a).
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

            {/* Abgleich Text ↔ Technik 03.10.2026: Turnstile läuft seit 01.10.2026
                (docs/bot-schutz-2026-10.md) und stand in keinem Rechtstext. Beschrieben
                ist nur, was der Code tut: src/components/ui/Turnstile.tsx (Script lädt,
                sobald ein Formular mit Widget gerendert wird — ohne Klick, ohne Bezug
                zum Consent-Banner) und src/lib/api/turnstile.ts (Token + Besucher-IP
                gehen zur Prüfung an Cloudflare). */}
            <section id="turnstile">
              <h2 className={h2Class}>4a. Bot-Schutz an Formularen (Cloudflare Turnstile)</h2>
              <p className="mb-3">
                Um unsere Formulare vor automatisierten Eingaben (Spam, Bots) zu schützen, nutzen
                wir die Prüfung &bdquo;Turnstile&ldquo; von Cloudflare (Anbieter siehe Abschnitt 4).
                Sie ist eingebunden in die Newsletter-Anmeldung, das Kontaktformular sowie die
                Anmeldung und Registrierung. Die Newsletter-Anmeldung steht unter anderem im
                Seitenfuß – die Prüfung ist deshalb auf den meisten Seiten dieser Website
                vorhanden. Für den Widerruf eines Vertrags (Abschnitt 10f) verlangen wir diese
                Prüfung nicht.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Was beim Seitenaufruf geschieht:</strong>{' '}
                Sobald eine Seite eines dieser Formulare anzeigt, lädt dein Browser ein Skript und
                einen Prüfrahmen von <code>challenges.cloudflare.com</code> – ohne dass du dafür
                etwas anklicken musst und unabhängig von deiner Auswahl im Cookie-Banner. Dabei
                erhält Cloudflare deine IP-Adresse und die technischen Angaben, die dein Browser bei
                jedem Abruf mitsendet. Meist läuft die Prüfung unsichtbar ab; nur wenn Cloudflare
                eine Interaktion verlangt, erscheint ein Kästchen. Welche Merkmale das Skript in
                deinem Browser auswertet, legt Cloudflare fest:{' '}
                <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  cloudflare.com/privacypolicy
                </a>
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Was beim Absenden geschieht:</strong>{' '}
                Das Skript erzeugt ein Prüfzeichen (Token), das mit dem Formular an unseren Server
                geht. Bei der Newsletter-Anmeldung und beim Kontaktformular lässt unser Server das
                Token von Cloudflare bestätigen und übermittelt dafür das Token und deine
                IP-Adresse. Bei Anmeldung und Registrierung geht das Token zusammen mit deinen
                Anmeldedaten an Supabase (Abschnitt 9).
              </p>
              <p>
                <strong className="text-text-primary">Zweck:</strong> Abwehr automatisierter
                Anfragen an unsere Formulare.
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
              {/* Abgleich 03.10.2026: src/app/go/[product-slug]/route.ts und
                  src/app/go-fleisch/[cut]/route.ts melden den Klick serverseitig an
                  plausible.io/api/event und setzen dabei X-Forwarded-For (Besucher-IP)
                  und User-Agent in den Anfragekopf. Was Plausible damit tut, steht
                  nicht im Repo — deshalb hier keine Aussage dazu. */}
              <p className="mb-3">
                <strong className="text-text-primary">Klick auf eine Produktempfehlung:</strong>{' '}
                Unsere Empfehlungs-Links führen über eine Weiterleitung auf unserem Server
                (Adressen, die mit <code>/go/</code> oder <code>/go-fleisch/</code> beginnen) zum
                jeweiligen Shop. Dabei meldet unser Server den Klick als Ereignis
                &bdquo;Affiliate-Klick&ldquo; an Plausible – mit dem Partner, der Kennung des
                Produkts und der Adresse der Seite, von der du kommst. Im Kopf dieser Anfrage
                reicht unser Server deine IP-Adresse und die Kennung deines Browsers (User-Agent)
                an Plausible weiter.
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
                Geocoding serverseitig, Standort nur auf Klick, lokaler Merker.
                Abgleich 03.10.2026: „serverseitig" hieß nicht „ohne Dritte" —
                src/lib/hoefe/geocode.ts schickt den Suchbegriff an api.maptiler.com,
                ohne MapTiler-Key an nominatim.openstreetmap.org; Antworten liegen
                30 Tage im Next-fetch-Cache. Der Betreiber von Nominatim ist im Repo
                nicht mit Anschrift belegt und deshalb nur mit der Adresse des
                Dienstes genannt. */}
            <section id="hofladen-radar">
              <h2 className={h2Class}>6a. Hofladen-Radar (Karte: MapTiler, Daten: OpenStreetMap)</h2>
              <p className="mb-3">
                Unter <Link href="/hoefe" className={linkClass}>/hoefe</Link> findest du Hofläden und
                Direktvermarkter in deiner Nähe. Die Hof-Daten stammen aus OpenStreetMap
                (Lizenz ODbL) und liegen auf unserem eigenen Server (Supabase, Abschnitt 9);
                bei einer Suche werden nur der eingegebene Ort bzw. die gewählten Koordinaten
                verarbeitet, um Treffer zu berechnen.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Suche nach Ort oder Postleitzahl:</strong>{' '}
                Die Umwandlung deines Suchbegriffs in Koordinaten stößt{' '}
                <strong className="text-text-primary">unser Server</strong> an. Er sendet den
                eingegebenen Ort bzw. die Postleitzahl an den Geocoding-Dienst von MapTiler
                (Anbieter siehe nächster Absatz) oder, falls dieser nicht eingerichtet ist, an
                den Dienst Nominatim des OpenStreetMap-Projekts
                (<code>nominatim.openstreetmap.org</code>). Übermittelt wird nur der Suchbegriff;
                dein Browser sendet dabei nichts an diese Dienste, und deine IP-Adresse geben wir
                nicht weiter. Das Ergebnis halten wir bis zu 30 Tage in einem Zwischenspeicher
                vor, damit derselbe Ort nicht erneut angefragt werden muss.
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
                Für den Versand unseres Newsletters und unserer Transaktions-E-Mails nutzen wir
                den Dienst Loops. Über Loops laufen: die Bestätigungsmail der Newsletter-Anmeldung
                (7.3), die Zustellung deiner Kontaktanfrage an unser Postfach (Abschnitt 2a), die
                Eingangsbestätigung eines Widerrufs (Abschnitt 10f), der Versand von
                Geschenkgutscheinen und der Anmeldelink nach einem Kauf (Abschnitt 10) sowie bei
                der Bestellung einer gedruckten Urkunde die Benachrichtigung an unser Postfach und
                die Bestellbestätigung an dich (Abschnitt 10e). Anbieter ist die{' '}
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
                Wortlaut des Einwilligungstextes, dem du zugestimmt hast. Diese Angaben werden mit
                deiner Bestätigung an deinem Kontakt-Eintrag bei Loops gespeichert. Diese
                Protokollierung ist zur Erfüllung unserer Rechenschaftspflicht nach Art. 5 Abs. 2
                DSGVO erforderlich.
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
                {/* Abgleich 03.10.2026: Hier stand „automatische Löschung nach 30 Tagen".
                    Dafür gibt es keinen Mechanismus — und nichts zu löschen: Die Anmeldung
                    ist zustandslos (src/lib/doi.ts, signiertes Token, 48 h), ein Kontakt
                    entsteht erst in /api/newsletter/confirm. */}
                <li>
                  Nicht bestätigte Anmeldungen: Vor deiner Bestätigung legen wir keinen Eintrag im
                  Verteiler an und speichern deine Anmeldung nicht bei uns. Deine Angaben
                  (E-Mail-Adresse, Zeitpunkt und IP-Adresse der Anmeldung, Fassung des
                  Einwilligungstextes) stecken bis dahin ausschließlich im Bestätigungslink, der
                  nach 48 Stunden ungültig wird. Für den Versand der Bestätigungsmail gehen deine
                  E-Mail-Adresse und dieser Link an Loops (7.1).
                </li>
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
                <strong className="text-text-primary">Anmeldung mit Google oder Amazon (Social Login):</strong>{' '}
                Wahlweise kannst du dich mit einem bestehenden Google- oder Amazon-Konto anmelden.
                Dabei wirst du zum jeweiligen Anbieter weitergeleitet; erst nach deiner Freigabe
                dort erhalten wir von Google LLC bzw. Amazon.com, Inc. (beide USA) deine
                E-Mail-Adresse, deinen Namen und eine Konto-Kennung, bei Google gegebenenfalls
                auch dein Profilbild — sonst nichts. Diese Daten werden deinem Nutzerkonto bei
                Supabase zugeordnet; ein Passwort wird bei uns dann nicht gespeichert. Welche
                Daten der Anbieter selbst bei der Anmeldung verarbeitet, regeln dessen
                Datenschutzhinweise:{' '}
                <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  policies.google.com/privacy
                </a>{' '}
                und{' '}
                <a href="https://www.amazon.de/gp/help/customer/display.html?nodeId=201909010" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  amazon.de (Datenschutzerklärung)
                </a>
                . Die Übermittlung in die USA stützt sich auf den Angemessenheitsbeschluss zum
                EU-US Data Privacy Framework (Art. 45 DSGVO); die Zertifizierung der Anbieter
                ist unter dataprivacyframework.gov einsehbar. Rechtsgrundlage der Anmeldung
                selbst: Art. 6 Abs. 1 lit. b DSGVO.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherdauer:</strong> Konto- und
                Kursdaten werden für die Dauer des Nutzerkontos gespeichert und nach dessen
                Löschung innerhalb von <strong className="text-text-primary">30 Tagen</strong>{' '}
                entfernt, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
              </p>
              {/* Abgleich 03.10.2026 mit src/app/api/konto-loeschen/route.ts. Die Liste
                  nennt nur, was die Route ausdrücklich löscht (TABELLEN_MIT_USER_ID,
                  Bucket diagnose-images, auth.users) bzw. laut Kopfkommentar bewusst
                  stehen lässt. Wer dort etwas ändert, ändert es hier und in
                  src/app/diplome/profil/KontoLoeschen.tsx mit.
                  NICHT genannt, weil nur über Fremdschlüssel-Kaskade und am Live-Stand
                  nicht geprüft: bookings, protokoll_gutschriften, aroma_matcher_abfragen,
                  aroma_matrix_warteliste. */}
              <p className="mb-3" id="konto-loeschen">
                <strong className="text-text-primary">Konto löschen:</strong> Du kannst dein Konto
                jederzeit selbst im{' '}
                <Link href="/diplome/profil" className={linkClass}>Profil</Link> unter
                &bdquo;Konto löschen&ldquo; entfernen oder die Löschung per E-Mail an{' '}
                <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>pitmaster@steakakademie.de</a>{' '}
                verlangen. Löschst du es im Profil, werden dabei sofort und unwiderruflich
                gelöscht:
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li>dein Konto mit E-Mail-Adresse und Anmeldedaten,</li>
                <li>dein Profil (Grillmeister-Vita), dein Lernfortschritt und dein Lesestand der Lektionen,</li>
                <li>deine Abstimmungen und Erfahrungsberichte zu Streitfällen,</li>
                <li>
                  deine Grill-Protokolle sowie deine Steak-Diagnosen samt Guthaben und den dazu
                  hochgeladenen Fotos.
                </li>
              </ul>
              <p className="mb-3">
                <strong className="text-text-primary">Nicht gelöscht</strong> werden dabei Daten,
                die nicht an deinem Konto hängen, sondern für sich gespeichert sind:
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li>
                  <strong className="text-text-primary">Community-Rezepte:</strong> Sie bleiben
                  gespeichert und werden anonymisiert (Abschnitt 8a).
                </li>
                <li>
                  <strong className="text-text-primary">Bestelldaten aus Käufen über Digistore24</strong>{' '}
                  (Abschnitt 10), einschließlich der dabei gespeicherten E-Mail-Adresse: Sie
                  bleiben als Kaufnachweis bestehen; Rechnungs- und Zahlungsdaten unterliegen
                  gesetzlichen Aufbewahrungspflichten (§ 257 HGB, § 147 AO).
                </li>
                <li>
                  <strong className="text-text-primary">Bestellungen gedruckter Urkunden</strong>{' '}
                  (Abschnitt 10e) mit E-Mail-Adresse, Name, Lieferadresse und der erzeugten
                  Druckdatei: Sie bleiben gespeichert – auch Bestellungen, die noch nicht bezahlt
                  sind –, nur die Verknüpfung zu deinem Konto wird gelöst. Zur Speicherdauer siehe
                  Abschnitt 10e.
                </li>
                <li>
                  <strong className="text-text-primary">Gutscheine, die du gekauft hast,
                  Widerrufe und Kontaktanfragen</strong> (Abschnitte 10, 10f und 2a): Sie sind
                  nicht mit deinem Konto verknüpft, sondern nur über deine E-Mail-Adresse
                  zuzuordnen, und werden von der Kontolöschung nicht erfasst.
                </li>
                <li>
                  <strong className="text-text-primary">Newsletter:</strong> Die Anmeldung beruht
                  auf einer eigenen Einwilligung (Abschnitt 7) und endet nicht mit dem Konto. Du
                  meldest dich über den Abmeldelink in jeder Newsletter-E-Mail ab.
                </li>
              </ul>
              <p className="mb-3">
                Möchtest du, dass wir auch diese Daten löschen, schreib uns an{' '}
                <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>pitmaster@steakakademie.de</a>{' '}
                (deine Rechte: Abschnitt 14).
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Details:{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  supabase.com/privacy
                </a>
              </p>
            </section>

            {/* id="community": Sprungziel aus AGB § 12 und dem Einwilligungstext im
                Rezeptformular (RecipeSubmitModal) — bis 03.10.2026 lief der Anker ins Leere.
                Abgleich 03.10.2026 mit /api/rezept-einreichen und /api/konto-loeschen:
                Freigabe nur noch durch einen Menschen (Abschnitt 10a); eine Löschfunktion
                für eigene Rezepte gibt es nicht (nur E-Mail); bei Kontolöschung werden
                ALLE Einreichungen anonymisiert behalten, nicht nur veröffentlichte. */}
            <section id="community" className="scroll-mt-24">
              <h2 className={h2Class}>8a. Community-Rezepte (nutzergenerierte Inhalte)</h2>
              <p className="mb-3">
                Angemeldete Nutzer können eigene Rezepte einreichen. Nach einer automatisierten
                Vorprüfung (Abschnitt 10a) und unserer Freigabe können sie im Community-Bereich
                veröffentlicht werden. Dabei verarbeiten wir die von dir eingegebenen Inhalte
                (Rezepttitel, Kurzbeschreibung, Portionen, Zubereitungszeit, Zutaten,
                Zubereitungsschritte, von dir gewählter Anzeigename), das Ergebnis der
                KI-Vorprüfung (Bewertung und Begründung) sowie den Bearbeitungsstatus. Die
                Speicherung erfolgt bei Supabase (Abschnitt 9).
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Kein Foto-Upload:</strong> Das Hochladen
                von Bildern — insbesondere von Personenfotos — ist nicht vorgesehen. Rezeptbilder
                werden von uns KI-generiert (siehe Abschnitt 10b).
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherdauer:</strong> Eingereichte Inhalte
                bleiben gespeichert, bis du ihre Entfernung verlangst. Eine Funktion, mit der du
                ein eingereichtes Rezept selbst löschen kannst, gibt es derzeit nicht – schreib uns
                dazu an{' '}
                <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>pitmaster@steakakademie.de</a>.
                Es gelten ergänzend unsere{' '}
                <Link href="/nutzungsbedingungen" className={linkClass}>Nutzungsbedingungen</Link>.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Bei Löschung deines Kontos:</strong> Deine
                Einreichungen werden nicht gelöscht. Veröffentlichte Rezepte bleiben als Bestandteil
                des Community-Bereichs erhalten; auch noch nicht freigegebene und abgelehnte
                Einreichungen bleiben in unserer Datenbank gespeichert. In allen wird dein
                Anzeigename entfernt und durch &bdquo;Ehemaliges Mitglied&ldquo; ersetzt, und die
                Verknüpfung zu deinem Nutzerkonto wird gelöst — ein Personenbezug besteht danach
                nicht mehr.
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
                erforderlichen Daten (Name, E-Mail, Zahlungsdaten). Die Zahlung selbst wickelt
                Digistore24 ab; wir haben keinen Zugriff auf vollständige Zahlungsdaten.
              </p>
              {/* Abgleich 03.10.2026: Hier stand, die Daten würden „ausschließlich von
                  Digistore24 verarbeitet". src/app/api/webhooks/digistore24/route.ts
                  speichert aber jede Bestellbenachrichtigung in digistore_orders
                  (ds_order_id, ds_product_id, ds_email, ds_event, raw_payload, raw_body),
                  legt aus der Käufer-E-Mail ein Konto an (ensureUser), verschickt den
                  Anmeldelink über Loops (sendMagicLink) und speichert bei Gutscheinen
                  purchaser_email + gift_message (create_voucher). */}
              <p className="mb-3">
                <strong className="text-text-primary">Was wir von Digistore24 erhalten und
                speichern:</strong> Nach einem Kauf – und bei späteren Ereignissen zu dieser
                Bestellung, etwa einer Erstattung – sendet Digistore24 eine Bestellbenachrichtigung
                an unseren Server. Daraus speichern wir bei Supabase (Abschnitt 9) die Bestellnummer,
                die Produktnummer, deine E-Mail-Adresse, die Art des Ereignisses sowie die
                Benachrichtigung in der Form, in der Digistore24 sie übermittelt. Welche Angaben sie
                im Einzelnen enthält, legt Digistore24 fest.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Was wir damit tun:</strong> Mit deiner
                E-Mail-Adresse legen wir – falls du noch keines hast – automatisch ein Nutzerkonto
                an (Abschnitt 9), schalten das gekaufte Produkt frei und senden dir über Loops
                (Abschnitt 7) einen Anmeldelink. Kaufst du einen Geschenkgutschein, legen wir dafür
                kein Konto an; wir speichern zusätzlich den Gutschein-Code zusammen mit deiner
                E-Mail-Adresse und – falls Digistore24 sie übermittelt – deiner persönlichen
                Nachricht und senden dir den Code über Loops zu. Lässt sich eine Bestellung keinem
                freigeschalteten Produkt zuordnen, meldet unser Server Bestell- und Produktnummer
                (ohne E-Mail-Adresse) an unsere Fehlerüberwachung (Abschnitt 13a), damit wir uns
                darum kümmern können.
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

            {/* Neu 03.10.2026 — das Widerrufsformular war in der Datenschutzerklärung
                nicht beschrieben (nur „Widerrufsbestätigungen" unter 7.1). Stand laut
                src/app/api/widerruf/route.ts und supabase/migrations/20260531_widerrufe.sql. */}
            <section id="widerruf">
              <h2 className={h2Class}>10f. Widerrufsformular</h2>
              <p className="mb-3">
                Erklärst du einen Widerruf über das Formular unter{' '}
                <Link href="/widerruf" className={linkClass}>steakakademie.de/widerruf</Link>,
                speichern wir bei Supabase (Abschnitt 9) die Angaben, die du dort machst: deine
                E-Mail-Adresse und/oder die Bestell- bzw. Vertragsnummer sowie – soweit du sie
                einträgst – Name, Produkt und Anmerkung. Dazu halten wir den Zeitpunkt fest, zu dem
                dein Widerruf bei uns eingegangen ist.
              </p>
              <p className="mb-3">
                Hast du eine E-Mail-Adresse angegeben, senden wir dir über Loops (Abschnitt 7) eine
                Eingangsbestätigung mit Datum und Uhrzeit des Eingangs sowie der angegebenen
                Bestellnummer und dem Produkt. Gibst du nur eine Bestellnummer an, können wir dir
                keine E-Mail schicken; die Bestätigung siehst du dann nur auf dem Bildschirm.
              </p>
              <p>
                <strong className="text-text-primary">Speicherdauer:</strong> Eine automatische
                Löschfrist ist für diese Einträge derzeit nicht eingerichtet. Sie hängen nicht an
                einem Nutzerkonto und werden deshalb auch bei einer Kontolöschung (Abschnitt 9)
                nicht entfernt.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>10d. Terminbuchung für Coachings (Cal.com)</h2>
              <p className="mb-3">
                Termine für ein gekauftes Personal-Coaching buchst du über eine Buchungsseite des
                Dienstes Cal.com der <strong className="text-text-primary">Cal.com, Inc.</strong>,
                2261 Market Street #4382, San Francisco, CA 94114, USA. Cal.com verarbeitet die Daten
                in unserem Auftrag (Art. 28 DSGVO, Vertrag zur Auftragsverarbeitung). Wir binden die
                Buchungsseite nicht in unsere Website ein, sondern verlinken sie: Daten fließen erst,
                wenn du den Link öffnest.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Welche Daten:</strong> Name, E-Mail-Adresse,
                gewählter Termin, deine Antworten auf die Buchungsfragen (Ziel des Coachings, aktueller
                Stand, genutzte Website oder Werkzeuge, Bestellnummer, ggf. deine Erklärung zum Beginn
                vor Ablauf der Widerrufsfrist) sowie technische Daten beim Aufruf der Seite (z. B.
                IP-Adresse, Browser).
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Wozu:</strong> Vereinbarung, Bestätigung,
                Erinnerung, Verschiebung und Durchführung des Termins. Damit es keine Doppelbuchungen
                gibt, gleicht Cal.com freie Zeiten mit unserem Google-Kalender ab; der Termin wird dort
                eingetragen und findet per Google Meet statt (Google Ireland Limited, Gordon House,
                Barrow Street, Dublin 4, Irland).
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Übermittlung in die USA:</strong> Cal.com
                verarbeitet Daten in den USA. Grundlage sind die EU-Standardvertragsklauseln
                (Art. 46 Abs. 2 lit. c DSGVO) bzw. das EU-US Data Privacy Framework, soweit der Anbieter
                zertifiziert ist.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Speicherdauer:</strong> Wir löschen Buchungsdaten
                6 Monate nach dem Termin, soweit keine gesetzliche Aufbewahrungspflicht besteht.
                Rechnungsdaten liegen bei Digistore24 (Abschnitt 10).
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Details:{' '}
                <a href="https://cal.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  cal.com/privacy
                </a>
              </p>
            </section>

            {/* Abgleich 03.10.2026: Hier stand Anthropic als Empfänger. Der Chat läuft
                aber über Google Gemini — src/app/api/marco/route.ts (@google/genai,
                GEMINI_MODEL), aufgerufen aus src/components/ai/MarcoWidget.tsx.
                Übermittelt werden der Verlauf der laufenden Unterhaltung und, falls
                angehängt, ein Foto (Base64); der Guard verlangt ein angemeldetes Konto
                (auth: 'user-or-admin'); die Route schreibt nichts in die Datenbank.
                ENTFERNT, weil für den falschen Empfänger geschrieben: „Anthropic PBC …
                Auftragsverarbeiter gemäß Art. 28 DSGVO" und „Drittlandübermittlung USA —
                EU-Standardvertragsklauseln". */}
            <section id="marco">
              <h2 className={h2Class}>11. KI-Assistent „Marco&quot; (Google Gemini)</h2>
              <p className="mb-3">
                Diese Website bietet den KI-Assistenten „Marco&quot; als Chat-Widget an. Nutzen
                kannst du ihn nur, wenn du mit einem Nutzerkonto angemeldet bist (Abschnitt 9).
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li>
                  <strong className="text-text-primary">Zweck:</strong>{' '}
                  Bereitstellung von Grillberatung via Chat (Cuts, Temperaturen, Techniken)
                  sowie die Einschätzung von Fotos, die du im Chat anhängst.
                </li>
                <li>
                  <strong className="text-text-primary">Verarbeitete Daten:</strong>{' '}
                  Deine Chat-Nachrichten, mit jeder neuen Nachricht der bisherige Verlauf der
                  laufenden Unterhaltung (deine Fragen und Marcos Antworten) sowie Fotos, die du
                  anhängst. Dein Konto wird bei jeder Anfrage geprüft, um den Zugang zu gewähren;
                  Kontodaten wie deine E-Mail-Adresse werden nicht an das KI-Modell übermittelt,
                  und die Chat-Inhalte werden nicht in deinem Konto gespeichert.
                </li>
                <li>
                  <strong className="text-text-primary">Empfänger:</strong>{' '}
                  Google. Die Antworten erzeugt das KI-Modell „Gemini&quot;, das unser Server über
                  die Gemini-Schnittstelle von Google anspricht (Google Ireland Limited, Gordon
                  House, Barrow Street, Dublin 4, Irland; ggf. Google LLC, 1600 Amphitheatre
                  Parkway, Mountain View, CA 94043, USA).
                </li>
                <li>
                  <strong className="text-text-primary">Rechtsgrundlage:</strong>{' '}
                  Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse: Bereitstellung
                  des Beratungsdienstes).
                </li>
                <li>
                  <strong className="text-text-primary">Speicherdauer bei uns:</strong>{' '}
                  Wir speichern weder Nachrichten noch Fotos auf unseren Servern. Der Verlauf
                  liegt nur in deinem Browser und ist nach dem Neuladen oder Schließen der Seite
                  nicht mehr abrufbar.
                </li>
              </ul>
              <p className="mb-3">
                Wir empfehlen, keine sensiblen personenbezogenen Daten in den Chat einzugeben und
                keine Fotos anzuhängen, auf denen Personen zu erkennen sind.
                Marco ist ein KI-Assistent — keine Rechts-, Steuer- oder Gesundheitsberatung.
              </p>
              <p>
                Weitere Informationen:{' '}
                <Link href="/ki-disclaimer" className={linkClass}>
                  KI-Disclaimer
                </Link>
                {' '}· Datenschutzhinweise von Google:{' '}
                <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  policies.google.com/privacy
                </a>
              </p>
            </section>

            <section>
              <h2 className={h2Class}>11a. KI-gestützte Kaufprodukte: „Mein Protokoll&quot; und „Steak-Beichte&quot; (Anthropic)</h2>
              <p className="mb-3">
                Zwei kostenpflichtige Produkte erstellen ihr Ergebnis mit einem KI-Sprachmodell von{' '}
                <strong className="text-text-primary">Anthropic PBC</strong>, 548 Market Street, San Francisco,
                CA 94104, USA (Auftragsverarbeiter gemäß Art. 28 DSGVO). Beide setzen ein Nutzerkonto voraus
                (Abschnitt 9).
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li>
                  <strong className="text-text-primary">Mein Protokoll (8-Wochen-Grillplan):</strong>{' '}
                  Übermittelt werden deine Antworten aus dem Fragebogen — Grilltyp, Erfahrungsstand, Zeit pro
                  Session, Hauptziel, dein Freitext zur Frage, was dich beim Grillen stört, sowie bei einer
                  Korrektur dein Hinweis, was am Plan nicht passt. Bei einer Korrektur und bei einem
                  weiteren Protokoll gehen außerdem die Wochenthemen und Cuts deines zuvor erstellten
                  Plans mit, damit der neue Plan daran anknüpft. Name und E-Mail-Adresse werden nicht
                  übermittelt. Antworten und Plan speichern wir in deinem Konto, zusammen mit Zeitpunkt und
                  Wortlaut deiner Bestätigung, dass der Plan erstellt werden soll.
                </li>
                <li>
                  <strong className="text-text-primary">Steak-Beichte (Grillfehler-Diagnose):</strong>{' '}
                  Übermittelt werden deine Problembeschreibung, optional Cut und Grilltyp sowie — falls du
                  eines hochlädst — dein Foto. Das Foto speichern wir in einem nicht öffentlichen Speicher bei
                  Supabase, Beschreibung und Diagnose in deinem Konto.
                </li>
                <li>
                  <strong className="text-text-primary">Drittlandübermittlung:</strong>{' '}
                  USA — Rechtsgrundlage: EU-Standardvertragsklauseln (SCC) gemäß Art. 46 Abs. 2 lit. c DSGVO.
                </li>
                <li>
                  <strong className="text-text-primary">Rechtsgrundlage:</strong>{' '}
                  Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) — ohne die Übermittlung lässt sich das gekaufte
                  Ergebnis nicht erstellen.
                </li>
                <li>
                  <strong className="text-text-primary">Speicherdauer:</strong>{' '}
                  Bis du dein Konto löschst. Mit der Kontolöschung entfernen wir Antworten, Pläne, Diagnosen
                  und hochgeladene Fotos.
                </li>
                <li>
                  <strong className="text-text-primary">Keine automatisierte Entscheidung:</strong>{' '}
                  Plan und Diagnose sind Empfehlungen ohne Rechtswirkung (kein Fall des Art. 22 DSGVO).
                </li>
              </ul>
              <p>
                Bitte trag in Freitextfelder keine sensiblen personenbezogenen Daten ein und lade keine Fotos
                hoch, auf denen Personen zu erkennen sind. Weitere Informationen:{' '}
                <Link href="/ki-disclaimer" className={linkClass}>
                  KI-Disclaimer
                </Link>
              </p>
            </section>

            {/* Abgleich 03.10.2026: Bis dahin setzte /api/rezept-einreichen bei einer
                KI-Bewertung ab 65 sofort `approved` + `published_at` — der Satz
                „endgültige Freigabe … unter menschlicher Kontrolle" war unwahr.
                Geändert wurde der CODE (src/lib/rezept/einreichung-status.ts): Die KI
                gibt nichts mehr frei, veröffentlicht wird nur über /admin/rezepte.
                Der Satz unten ist dem angepasst — mit EINER Präzisierung, die die
                Kanzlei sehen muss: Eine ABLEHNUNG (unsicher, kein Rezept, Bewertung
                unter 45) trifft weiterhin die KI allein, ohne dass ein Mensch sie
                ansieht. Der alte Wortlaut („Freigabe oder Ablehnung … unter
                menschlicher Kontrolle") hätte das weiter falsch behauptet. */}
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
                <strong className="text-text-primary">Keine Veröffentlichung ohne menschliche
                Freigabe:</strong> Die KI-Prüfung ist eine Vorprüfung. Besteht dein Rezept sie, wird
                es nicht automatisch veröffentlicht, sondern uns zur Freigabe vorgelegt; es
                erscheint erst, wenn ein Mensch es freigegeben hat (kein automatisierter
                Einzelfallbeschluss mit Rechtswirkung i.&nbsp;S.&nbsp;v. Art. 22 DSGVO). Stuft die
                KI eine Einreichung als unzulässig, nicht als Rezept oder als zu unvollständig ein,
                wird sie nicht veröffentlicht und uns nicht zur Freigabe vorgelegt. Den Hinweis der
                KI dazu siehst du direkt nach dem Absenden und in deinem Profil; du kannst das
                Rezept überarbeiten und neu einreichen.
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

            {/* Abgleich 03.10.2026: Der Abschnitt nannte nur Voyage AI. Beide Routen
                (src/app/api/kochwissen/route.ts, …/generieren/route.ts) schicken die
                Eingabe danach samt den gefundenen Wissenseinträgen an Anthropic
                (claude-sonnet-4-6); die Startseite sagt es selbst („Claude schreibt dein
                Rezept", ToolBoxes.tsx). Für Anthropic wird auf die schon bestehenden
                Angaben in 11a verwiesen statt sie zu wiederholen. */}
            <section>
              <h2 className={h2Class}>10c. Wissenssuche &amp; Rezept-Generierung (Voyage AI, Anthropic)</h2>
              <p className="mb-3">
                Die Wissenssuche und die „Rezept-Schmiede&quot; stehen nur angemeldeten Nutzern zur
                Verfügung (Abschnitt 9). Sie wandeln deine Eingabe (Frage bzw.
                Rezept-Auftrag) serverseitig in einen Vektor um, um passende Einträge unserer
                Wissensdatenbank zu finden. Dafür nutzen wir den Dienst{' '}
                <strong className="text-text-primary">Voyage AI Innovations, Inc.</strong>, eine
                hundertprozentige Tochtergesellschaft der MongoDB, Inc., 1633 Broadway, 38th Floor,
                New York, NY 10019, USA (Auftragsverarbeiter, Art. 28 DSGVO).
              </p>
              <p className="mb-3">
                Verarbeitet wird ausschließlich der von dir eingegebene Text zur Berechnung der
                Vektor-Darstellung und zum Sortieren der gefundenen Einträge; eine dauerhafte
                Speicherung deiner Eingabe bei Voyage AI ist uns
                nicht bekannt und nicht beabsichtigt. Es werden keine Nutzerprofile oder Kontodaten
                übermittelt.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Antwort bzw. Rezept (Anthropic):</strong>{' '}
                Den Text der Antwort bzw. des Rezepts formuliert anschließend ein KI-Sprachmodell
                von Anthropic PBC (Anbieter und Angaben zur Übermittlung in die USA: Abschnitt 11a).
                Dorthin übermittelt unser Server deine Eingabe – bei der Rezept-Schmiede samt deiner
                Auswahl zu Art, Niveau und Personenzahl – zusammen mit den gefundenen Einträgen
                unserer Wissensdatenbank. Kontodaten werden auch hier nicht übermittelt.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Kein KI-Training mit deinen Daten bei Voyage AI:</strong> Wir
                haben das Trainings-Opt-out gemäß Ziff. 3(iii) der Voyage-AI-Nutzungsbedingungen
                aktiviert (Stand: 16.09.2026). Ab diesem Zeitpunkt eingehende Anfragen werden nicht zum
                Training von KI-Modellen verwendet und nach der Verarbeitung gelöscht. Für Anfragen vor
                diesem Zeitpunkt kann Voyage AI laut seinen Nutzungsbedingungen ein fortbestehendes
                Nutzungsrecht zu Trainingszwecken haben.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Drittlandübermittlung (Voyage AI):</strong> USA — abgesichert
                über EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).
              </p>
              <p className="mb-3">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer
                funktionierenden Wissenssuche und Rezept-Generierung).
              </p>
              <p>
                <strong className="text-text-primary">Widerspruchsrecht (Art. 21 DSGVO):</strong> Du
                hast das Recht, aus Gründen, die sich aus deiner besonderen Situation ergeben,
                jederzeit gegen diese auf Art. 6 Abs. 1 lit. f DSGVO gestützte Verarbeitung
                Widerspruch einzulegen.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>10e. Gedruckte Urkunden (Druck und Versand über Gelato)</h2>
              <p className="mb-3">
                Wenn du eine gedruckte Urkunde bestellst, speichern wir deine Bestellung (Name auf der
                Urkunde, Level, Versandadresse, E-Mail-Adresse, Zeitpunkt deiner Einwilligung) und
                übermitteln deinen Namen, deine Versandadresse und deine E-Mail-Adresse, die
                Druckdatei der Urkunde (mit dem Namen auf der Urkunde und dem Level) sowie eine
                Bestell- und eine Kundenkennung an unseren Druckdienstleister{' '}
                <strong className="text-text-primary">Gelato ASA</strong>, Dronning Eufemias Gate 8,
                0191 Oslo, Norwegen, der die Urkunde druckt und verschickt. Norwegen gehört zum
                Europäischen Wirtschaftsraum; die DSGVO gilt dort unmittelbar. Gelato verarbeitet die Daten als Auftragsverarbeiter (Art. 28 DSGVO) auf
                Grundlage seiner Data Processing Terms, die Teil der Nutzungsbedingungen sind
                (<a href="https://www.gelato.com/legal/data-processing-terms" target="_blank" rel="noopener noreferrer" className={linkClass}>gelato.com/legal/data-processing-terms</a>).
              </p>
              <p className="mb-3">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Erfüllung deiner Bestellung) sowie deine
                Einwilligung im Bestellformular. Die Daten werden nur so lange gespeichert, wie es für
                Abwicklung, Gewährleistung und gesetzliche Aufbewahrungspflichten erforderlich ist.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>12. Cookies &amp; lokale Speicherung</h2>
              <p className="mb-3">
                <strong className="text-text-primary">Technisch notwendige Speichermechanismen</strong>{' '}
                (keine Einwilligung erforderlich, § 25 Abs. 2 TDDDG):
              </p>
              {/* Abgleich 03.10.2026 gegen den Code (grep localStorage/sessionStorage/
                  cookies.set in src/): Die „Theme-Einstellung (hell/dunkel)" gab es nie —
                  gestrichen. Die Supabase-Anmeldung liegt technisch in Cookies
                  (sb-…-auth-token), nicht in einem „Token"-Speicher.
                  Die beiden Listen darunter („Weitere Einträge …", „Weitere Cookies")
                  sind NEU und nennen nur, was der Code setzt. */}
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li><strong className="text-text-primary">sessionStorage</strong> (Schlüssel <code>sa_exit_shown</code>): Exit-Intent-Status (wurde das Overlay bereits gezeigt?) — wird nach Schließen des Browsers automatisch gelöscht</li>
                <li><strong className="text-text-primary">Anmelde-Cookies von Supabase</strong> (<code>sb-…-auth-token</code>): nur für eingeloggte Nutzer — sie enthalten das Sitzungs-Token (JWT) zur Sitzungsverwaltung</li>
              </ul>
              <p className="mb-3">
                <strong className="text-text-primary">Weitere Einträge im lokalen Speicher deines
                Browsers (localStorage):</strong> Sie entstehen erst, wenn du die jeweilige Funktion
                nutzt, und bleiben in deinem Browser, bis du sie dort löschst.
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li><code>sa-karte-v1</code> — deine Wahl „Immer laden&quot; für die Karte im Hofladen-Radar (Abschnitt 6a)</li>
                <li>
                  <code>steakakademie_progress</code>, <code>steakakademie_flashcards_…</code>,{' '}
                  <code>steakakademie_gelesen</code>, <code>steakakademie_check</code> — dein
                  Lernstand im Diplom-Bereich (bearbeitete Module und Quiz-Ergebnisse, gewusste
                  Lernkarten, gelesene Lektionen, bestandene Lektions-Checks). Bist du angemeldet,
                  speichern wir gelesene Lektionen und bestandene Prüfungen zusätzlich in deinem
                  Konto (Abschnitt 9).
                </li>
                <li><code>sa_griller_name</code> — der Name, den du für deine Auszeichnungs-Karte im Diplom-Bereich eingibst</li>
                <li><code>gs-planer-v1</code> — deine Eingaben im Arbeitszeit-Planer (Stunden und Aufgaben)</li>
                <li><code>sk.ansicht</code>, <code>sk.lektionen</code> — gewählte Ansicht und Lesestand im Vorschau-Bereich unter <code>/relaunch</code></li>
              </ul>
              <p className="mb-3">
                <strong className="text-text-primary">Weitere Cookies:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li>
                  <code>sa_ab_home</code> — nur während eines laufenden Tests zweier
                  Gestaltungsvarianten der Startseite: Beim ersten Aufruf der Startseite wird dir
                  zufällig eine der beiden Varianten zugeteilt und für 90 Tage in diesem Cookie
                  gemerkt (Wert <code>a</code> oder <code>b</code>). Meldest du dich mit Variante b
                  zum Newsletter an, wird das an der Anmeldequelle vermerkt, die wir bei Loops
                  speichern (Abschnitt 7). Läuft kein Test, wird das Cookie nicht gesetzt.
                </li>
                <li>
                  <code>admin_auth</code> — entsteht ausschließlich, wenn sich der Betreiber im
                  Verwaltungsbereich anmeldet (Gültigkeit 7 Tage). Besucher erhalten dieses Cookie
                  nicht.
                </li>
              </ul>
              <p className="mb-3">
                <strong className="text-text-primary">Bot-Prüfung an Formularen:</strong> Zu
                Cloudflare Turnstile siehe Abschnitt 4a.
              </p>
              <p className="mb-3">
                <strong className="text-text-primary">Einwilligungspflichtige Cookies (nur nach Opt-in):</strong>{' '}
                Microsoft Clarity (Abschnitt 6) setzt Cookies für Heatmaps und Sitzungs-Analyse. Diese
                werden <strong className="text-text-primary">ausschließlich nach deiner aktiven Einwilligung</strong>{' '}
                über unseren Cookie-Banner gesetzt. Der Banner bietet auf erster Ebene zwei gleichwertige
                Optionen („Alles akzeptieren&quot; und „Ablehnen&quot;); ohne Zustimmung werden keine solchen Cookies
                gesetzt. Deine Wahl kannst du jederzeit über „Cookie-Einstellungen&quot; im Seitenfuß ändern oder
                widerrufen. Die gespeicherte Einwilligungs-Entscheidung selbst liegt technisch notwendig im
                localStorage deines Browsers (Schlüssel <code>sa-consent-v1</code>).
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
