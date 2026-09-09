import Link from 'next/link';
import Rauchring from './Rauchring';
import SpickzettelForm from './SpickzettelForm';

/**
 * Fußbereich (dunkel) mit dem Spickzettel — genau einmal auf der ganzen Website.
 * Alle Verweise zeigen auf Seiten, die es heute gibt; die vier Kataloge auf das
 * Übersicht-Muster des Relaunches.
 */
export default function Footer() {
  return (
    <footer className="sk-footer">
      <div className="sk-footer__inner">
        <div className="sk-footer__cta">
          <div>
            <div className="sk-kicker sk-kicker--warm" style={{ marginBottom: 12 }}>Kostenlos · Druckfertig</div>
            <h2 className="sk-h" style={{ fontWeight: 800, fontSize: 'clamp(30px, 3.6vw, 48px)', lineHeight: .95 }}>
              Der Kerntemperatur-Spickzettel für die Grillstation.
            </h2>
            <p className="sk-text sk-text--16" style={{ marginTop: 14 }}>
              Rind, Schwein, Lamm, Geflügel, Fisch — die Werte der Pitmaster-Doktrin. Dazu freitags ein Stück BBQ-Wissen. Jederzeit abbestellbar.
            </p>
          </div>
          <SpickzettelForm />
        </div>

        <div className="sk-footer__brand">
          <Rauchring size={44} inner="#15120f" />
          <span className="sk-wordmark sk-wordmark--30">Steak<span>akademie</span></span>
          <span className="sk-footer__claim">Methodisch · Geprüft · Ohne Zufall</span>
        </div>

        <nav className="sk-footer__cols" aria-label="Fußnavigation">
          <div className="sk-footer__col">
            <span className="sk-footer__head">Wissen</span>
            <Link href="/kerntemperatur-spickzettel">Kerntemperaturen</Link>
            <Link href="/relaunch/techniken">Grilltechniken</Link>
            <Link href="/glossar">BBQ-Lexikon</Link>
            <Link href="/relaunch/streitfaelle">Streitfälle</Link>
          </div>
          <div className="sk-footer__col">
            <span className="sk-footer__head">Tests</span>
            <Link href="/relaunch/vergleich/fleischthermometer">Fleischthermometer</Link>
            <Link href="/vergleich">Grills &amp; Smoker</Link>
            <Link href="/ausruestung/messer">Messer</Link>
          </div>
          <div className="sk-footer__col">
            <span className="sk-footer__head">Cuts</span>
            <Link href="/cuts/ribeye">Ribeye</Link>
            <Link href="/cuts/brisket">Brisket</Link>
            <Link href="/cuts/pulled-pork">Pulled Pork</Link>
            <Link href="/relaunch/cuts">Cut-Atlas</Link>
          </div>
          <div className="sk-footer__col">
            <span className="sk-footer__head">Akademie</span>
            <Link href="/relaunch/diplome">Grillmeister-Diplome</Link>
            {/* BBQ-Grundkurs eingestellt 09.09.2026 — ersetzt durch den
                Rahmenlehrplan, der zeigt, was die Ausbildung umfasst. */}
            <Link href="/diplome/rahmenlehrplan">Rahmenlehrplan</Link>
            <Link href="/autoren">Autoren</Link>
            <Link href="/relaunch/ueber-uns">Über uns</Link>
          </div>
        </nav>

        <div className="sk-footer__legal">
          <span>© 2026 Steakakademie · Affiliate-Links gekennzeichnet, Preis für dich unverändert.</span>
          <span>
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
            <Link href="/agb">AGB</Link>
            <Link href="/ki-disclaimer">KI-Disclaimer</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
