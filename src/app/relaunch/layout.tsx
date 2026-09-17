import type { Metadata } from 'next';
import Link from 'next/link';
import { Big_Shoulders, Literata } from 'next/font/google';
import Header from '@/components/relaunch/Header';
import Footer from '@/components/relaunch/Footer';
import './relaunch.css';

/**
 * Layout des Website-Relaunches 2026-09 — läuft PARALLEL zur Alt-Site unter
 * /relaunch, bis die Umschalt-Kriterien erfüllt sind
 * (docs/website-relaunch-2026-09.md). Die Alt-Site bleibt unberührt.
 *
 * Zwei Schriften, keine dritte (Handoff-README): Big Shoulders Display für
 * Überschriften, Etiketten, Zahlen, Knöpfe — Literata für alles, was gelesen
 * wird. Self-hosted über next/font, kein Request an Google (DSGVO).
 *
 * noindex: Solange die Seiten unter /relaunch liegen, darf Google sie nicht
 * als Doppelung zur Live-Site werten. Beim Umschalten fällt das weg — und die
 * URLs bleiben dieselben wie heute (keine Slug-Änderung, SEO-Kriterium).
 */
// Next 16: Google hat „Big Shoulders Display“ in die Familie „Big Shoulders“
// zusammengefuehrt — next/font/google exportiert nur noch Big_Shoulders.
const display = Big_Shoulders({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-big-shoulders',
  // Next 16.3 kennt fuer die zusammengefuehrte Familie noch keine
  // Fallback-Metriken ("Failed to find font override values") — ohne diesen
  // Schalter steht der Hinweis in jedem Build. Betrifft nur die
  // /relaunch-Vorschau; Layout-Shift-Feinjustage dort ist verzichtbar.
  adjustFontFallback: false,
});

const literata = Literata({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-literata',
});

export const metadata: Metadata = {
  title: {
    default: 'Steakakademie — Relaunch-Vorschau',
    template: '%s | Steakakademie (Vorschau)',
  },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: 'https://steakakademie.de/' },
};

export default function RelaunchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`sk ${display.variable} ${literata.variable}`}>
      <a href="#sk-inhalt" className="sk-skip">Zum Inhalt springen</a>
      <div className="sk-preview" role="note">
        Vorschau des neuen Designs — die Live-Site ist unverändert unter <Link href="/">steakakademie.de</Link>
      </div>
      <Header />
      <main id="sk-inhalt" style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
