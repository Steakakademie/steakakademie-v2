import Link from 'next/link';
import { Flame } from 'lucide-react';
import ConsentSettingsLink from '@/components/analytics/ConsentSettingsLink';
import NewsletterSignup from '@/components/ui/NewsletterSignup';

const FOOTER_LINKS = {
  Wissen: [
    { label: 'Kerntemperaturen', href: '/temperatur-guide' },
    { label: 'Grilltechniken', href: '/methoden' },
    { label: 'BBQ-Lexikon', href: '/glossar' },
    { label: 'Streitfälle am Grill', href: '/streitfaelle' },
    { label: 'Reverse Sear', href: '/methoden/reverse-sear' },
  ],
  Tests: [
    { label: 'Fleischthermometer', href: '/vergleich/fleischthermometer' },
    { label: 'Grills & Smoker', href: '/vergleich/grills' },
    { label: 'Messer', href: '/vergleich/messer' },
    { label: 'Alle Tests', href: '/vergleich' },
  ],
  Cuts: [
    { label: 'Ribeye', href: '/cuts/ribeye' },
    { label: 'Brisket', href: '/cuts/brisket' },
    // Uwe, 17.09.2026: Aroma-Matcher bewusst HIER statt unter "Sonstiges" — das
    // Werkzeug startet mit der Cut-Wahl, gehört thematisch zu den Cuts.
    { label: 'Aroma-Matcher', href: '/aroma-matcher' },
    { label: 'Alle Cuts', href: '/cuts' },
  ],
  Akademie: [
    { label: 'Grillmeister-Diplome', href: '/diplome' },
    { label: 'BBQ-Grundkurs', href: '/bbq-grundkurs' },
    // Vorher standen hier Marco, Jonas und Elena als drei Eintraege — alle drei
    // zeigten auf dieselbe Seite /autoren. Drei Zeilen fuer ein Ziel sind
    // verschenkter Platz und fuer den Nutzer eine Enttaeuschung beim zweiten Klick.
    { label: 'Autoren & Redaktion', href: '/autoren' },
    { label: 'Über uns', href: '/ueber-uns' },
  ],
  // Uwe, 30.08.2026: Spalte "Ehrliches System" ausgebaut — dieselbe Entscheidung
  // wie im Header, dort steht die ausfuehrliche Begruendung. Kurz: CLAUDE.md
  // Abschnitt 10 verbietet die Vermarktung von GF3, solange GF1 nichts Messbares
  // liefert; und ein BBQ-Besucher, der im Footer "Steuer-Matrix" liest, sieht ein
  // unklares Angebot. Die Spalte lag auf allen ~500 Seiten.
  //
  // Routen bleiben erreichbar, nur die Verlinkung entfaellt.
  // WIEDEREINSETZEN: entkommentieren — aber erst, wenn GF1 liefert.
  // 'Ehrliches System': [
  //   { label: 'Das Ehrliche System', href: '/ehrliches-system' },
  //   { label: 'SEO-Sprint', href: '/seo-sprint' },
  //   { label: 'Steuer-Matrix LIVE', href: '/steuer-matrix-live' },
  //   { label: 'Niche Validator', href: '/tools/niche-validator' },
  // ],
  // Audit 15.08.2026: Der Footer lag auf allen 517 Seiten und sammelte nichts.
  // Spickzettel + Wissens-Brief + Gutscheine waren site-weit unverlinkt.
  'Wissens-Brief': [
    { label: 'Kerntemperatur-Spickzettel', href: '/kerntemperatur-spickzettel' },
    { label: 'Wissens-Brief abonnieren', href: '/newsletter' },
    { label: 'Steak-Beichte', href: '/steak-beichte' },
  ],
  // Neue Sammelspalte (16.09.2026, auf Uwes Hinweis): Hofladen-Radar (Tool, kein Cut)
  // und Geschenkgutscheine (Shop-Feature, kein Wissens-Brief-Inhalt) lagen an
  // kategorisch falschen Stellen. Pulled Pork wurde ersatzlos aus der Cuts-Kurzliste
  // entfernt statt hierher verschoben — bleibt aber über "Alle Cuts" erreichbar.
  Sonstiges: [
    { label: 'Hofladen-Radar', href: '/hoefe' },
    { label: 'Geschenkgutscheine', href: '/gutschein' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-dark text-text-light mt-16">
      {/* Sammel-Band — site-weiter Anmeldepunkt auf jeder Seite (Audit 15.08.2026).
          Vorher gab es genau zwei aktive Sammelstellen: eine Sidebar-Box auf der
          Startseite und ein Exit-Intent, der auf Touch-Geräten nie feuert. */}
      <div className="border-b border-brand-gold/10">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-content mx-auto">
            <NewsletterSignup source="footer" />
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-8">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="font-serif font-black text-2xl tracking-tight text-white hover:text-brand-gold transition-colors">
                Steakakademie
              </span>
            </Link>
            <p className="mt-3 text-sm font-body text-text-light/60 leading-relaxed max-w-[220px]">
              Deutschlands methodisch tiefste BBQ-Wissensplattform. Für Hobbygriller, die es ernst meinen.
            </p>
            <div className="mt-5 flex items-center gap-1 text-xs font-sans text-text-light/35 tracking-widest uppercase">
              <Flame size={12} className="text-brand-gold" />
              Seit 2026
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-text-light/35 mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-sans text-text-light/65 hover:text-brand-gold transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Affiliate disclosure + legal */}
      <div className="border-t border-brand-gold/10">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-[11px] font-sans text-text-light/35 leading-relaxed mb-4 max-w-3xl">
            <strong className="text-text-light/50">Affiliate-Hinweis:</strong> Einige Links auf dieser Seite sind Affiliate-Links.
            Wenn du über sie kaufst, erhalten wir eine kleine Provision — der Preis für dich ändert sich nicht.
            Wir empfehlen nur Produkte, die wir selbst getestet haben oder für qualitativ hochwertig halten.
          </p>
          {/* Gesetzlicher Widerrufsbutton (ab 19.06.2026) — ständig und leicht auffindbar, farblich hervorgehoben */}
          <Link
            href="/widerruf"
            className="inline-flex items-center gap-1.5 mb-5 px-4 py-2 border border-brand-gold/50 text-brand-gold text-xs font-sans font-bold tracking-wide uppercase hover:bg-brand-gold/10 transition duration-200 ease-out active:scale-[0.98] motion-reduce:active:scale-100"
          >
            Vertrag widerrufen
          </Link>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-sans text-text-light/35">
            <span>© {year} Steakakademie</span>
            <Link href="/impressum" className="hover:text-text-light/60 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-text-light/60 transition-colors">Datenschutz</Link>
            <ConsentSettingsLink className="hover:text-text-light/60 transition-colors" />
            <Link href="/agb" className="hover:text-text-light/60 transition-colors">AGB</Link>
            <Link href="/nutzungsbedingungen" className="hover:text-text-light/60 transition-colors">Nutzungsbedingungen</Link>
            <Link href="/affiliate-disclosure" className="hover:text-text-light/60 transition-colors">Affiliate-Disclosure</Link>
            <Link href="/ki-disclaimer" className="hover:text-text-light/60 transition-colors">KI-Disclaimer</Link>
            <Link href="/kontakt" className="hover:text-text-light/60 transition-colors">Kontakt</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
