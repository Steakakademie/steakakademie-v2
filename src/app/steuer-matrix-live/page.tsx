import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight, ArrowRight, RefreshCw, AlertTriangle,
  Calendar, Globe, Bell, ShieldCheck,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  // Uwe, 02.09.2026: noindex — Gruender-Bereich ist aus der Steakakademie ausgebaut
  // (Nav/Footer seit 641b346, Sitemap seit heute). CLAUDE.md Abschnitt 10.
  robots: { index: false, follow: false },
  title: 'Steuer-Matrix LIVE: Update-Abo für 23 Länder',
  description:
    'Steuerrecht ändert sich jedes Jahr. Das Jahres-Update-Abo hält deine Steuer-Matrix für alle 23 Länder aktuell: neue Steuersätze, geänderte Regelungen.',
  alternates: { canonical: 'https://steakakademie.de/steuer-matrix-live' },
  openGraph: {
    images: ogImages('Steuer-Matrix LIVE — Immer aktuelle Steuerdaten für 23 Länder'),
    title: 'Steuer-Matrix LIVE — Immer aktuelle Steuerdaten für 23 Länder',
    description:
      'Jährliches Update-Abo: alle Steuersätze, Pflichtabgaben und Regeländerungen für 23 Länder — direkt in deinen Rechner. Kündbar jederzeit.',
    url: 'https://steakakademie.de/steuer-matrix-live',
    type: 'website',
  },
};

const UPDATES = [
  {
    Icon: Globe,
    title: 'Alle 23 Länder aktualisiert',
    desc: 'Einkommenssteuersätze, Sozialabgaben, Pflichtbeiträge — jedes Land nach dem Stand des neuen Steuerjahres. Keine veralteten Grundlagen für deine Entscheidung.',
  },
  {
    Icon: Bell,
    title: 'Änderungs-Zusammenfassung',
    desc: 'Du bekommst eine klare Übersicht: Welche Länder haben sich geändert, was konkret, und was das für Solo-Selbstständige bedeutet. Kein Lesen von Gesetzestexten.',
  },
  {
    Icon: Calendar,
    title: 'Jedes Jahr im Januar',
    desc: 'Updates erscheinen zu Beginn des neuen Steuerjahres — wenn die geänderten Regelungen in Kraft treten. Du wirst per E-Mail benachrichtigt sobald der neue Stand verfügbar ist.',
  },
  {
    Icon: RefreshCw,
    title: 'Neue Länder inklusive',
    desc: 'Wenn das Tool um weitere Länder erweitert wird, sind diese automatisch im Abo enthalten. Du bekommst mehr — ohne zusätzliche Kosten.',
  },
];

const CHANGES_EXAMPLES = [
  { country: '🇵🇹 Portugal', change: 'NHR-Status abgeschafft, IFICI als Nachfolger — neue Bedingungen, andere Steuersätze' },
  { country: '🇩🇪 Deutschland', change: 'Anpassung Grundfreibetrag + Sozialversicherungsgrenzen jedes Jahr' },
  { country: '🇪🇪 Estland', change: 'e-Residency Dividendenbesteuerung geändert' },
  { country: '🇳🇱 Niederlande', change: 'ZZP-Regelung unter politischem Druck — mögliche Änderungen bei Zelfstandigenaftrek' },
  { country: '🇦🇪 Dubai / VAE', change: 'Corporate Tax eingeführt 2023 — neue Relevanz für Solopreneure' },
];

const FAQ = [
  {
    q: 'Brauche ich zuerst die Steuer-Matrix?',
    a: 'Ja. Steuer-Matrix LIVE ist ein Update-Abo für Käufer der Steuer-Matrix. Wenn du die Matrix noch nicht hast, kaufe sie zuerst — das LIVE-Abo hält sie dann dauerhaft aktuell.',
  },
  {
    q: 'Wann genau erscheinen die Updates?',
    a: 'Jedes Jahr im Januar, nach Inkrafttreten der neuen Steuerregelungen. Du erhältst eine E-Mail-Benachrichtigung sobald der neue Stand verfügbar ist.',
  },
  {
    q: 'Was passiert wenn ich das Abo kündige?',
    a: 'Du behältst Zugang zur Steuer-Matrix mit dem letzten aktualisierten Stand bis zum Ende des bezahlten Zeitraums. Danach keine weiteren Updates — die Matrix bleibt auf dem Stand des letzten Update-Jahres.',
  },
  {
    q: 'Wie kündige ich?',
    a: 'Jederzeit über dein Digistore24-Kundenkonto — ohne Frist, ohne Formular. Kein Kündigungsschreiben nötig.',
  },
  {
    q: 'Bekomme ich als Original-Käufer einen Rabatt?',
    a: 'Ja. Wenn du die Steuer-Matrix bereits gekauft hast, erhältst du im ersten Jahr 50 % Rabatt. Der Rabatt-Link wird dir per E-Mail zugeschickt — oder schreib uns unter pitmaster@steakakademie.de mit deiner Bestellnummer.',
  },
];

export default function SteuerMatrixLivePage() {
  return (
    <>
      <Header />

      <main className="bg-surface-base">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <nav
              className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-8"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/steuer-matrix" className="hover:text-brand-gold transition-colors">
                Steuer-Matrix
              </Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">LIVE — Jahres-Update</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Update-Abo · Steuer-Matrix
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-text-light leading-tight mb-6">
                Deine Steuer-Matrix.<br className="hidden lg:block" />
                Immer aktuell.
              </h1>
              <p className="font-serif text-xl lg:text-2xl text-text-light/80 leading-relaxed mb-4">
                Steuerrecht ändert sich jedes Jahr. Dein Rechner auch.
              </p>
              <p className="font-body text-base text-text-light/55 leading-relaxed mb-10 max-w-2xl">
                Alle 23 Länder. Jedes Jahr im Januar aktualisiert — neue Steuersätze,
                geänderte Pflichtabgaben, neue Regelungen. Du bekommst eine
                Benachrichtigung wenn der neue Stand verfügbar ist. Kündbar jederzeit.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                {/* In Vorbereitung — Digistore-Produkt noch nicht angelegt → ehrliche Vormerkung statt totem Kauf-Button */}
                <a
                  href="mailto:pitmaster@steakakademie.de?subject=Steuer-Matrix%20LIVE%20%E2%80%94%20Vormerkung&body=Bitte%20benachrichtigt%20mich%2C%20sobald%20Steuer-Matrix%20LIVE%20verf%C3%BCgbar%20ist."
                  className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ background: '#C8882A', color: '#0D0A06' }}
                >
                  In Vorbereitung — vormerken <ArrowRight size={15} />
                </a>
                <span className="text-xs font-sans text-text-light/40">
                  Erscheint zum nächsten Steuerjahr-Update · Vormerkung unverbindlich
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Problem ───────────────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Das Problem
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-8">
                Veraltete Zahlen. Echte Konsequenzen.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-body text-text-secondary leading-relaxed">
                <div className="space-y-4">
                  <p>
                    Portugal hat seinen NHR-Status 2024 abgeschafft. Dubai hat 2023
                    erstmals eine Corporate Tax eingeführt. Deutschland passt Grundfreibetrag
                    und Sozialversicherungsgrenzen jedes Jahr an.
                  </p>
                  <p>
                    Wer seine Wohnsitz- oder Firmensitz-Entscheidung auf Zahlen von
                    vor zwei Jahren trifft, kalkuliert mit einer Grundlage, die es
                    so nicht mehr gibt.
                  </p>
                </div>
                <div className="space-y-4">
                  <p>
                    Das ist kein theoretisches Risiko. Steueroptimierung auf Basis
                    veralteter Daten kann im Nachhinein fünfstellige Differenzen bedeuten —
                    zwischen erwartetem und tatsächlichem Netto.
                  </p>
                  <p>
                    Steuer-Matrix LIVE stellt sicher, dass dein Rechner immer auf dem
                    aktuellen Stand ist — ohne dass du selbst Gesetzesänderungen
                    verfolgen musst.
                  </p>
                </div>
              </div>

              {/* Beispiel-Änderungen */}
              <div className="mt-12">
                <p className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted mb-5">
                  Beispiele realer Änderungen der letzten Jahre
                </p>
                <div className="space-y-3">
                  {CHANGES_EXAMPLES.map(({ country, change }) => (
                    <div
                      key={country}
                      className="flex gap-4 items-start p-4 border border-border-subtle"
                      style={{ background: 'rgba(200,136,42,0.02)' }}
                    >
                      <span className="font-sans text-sm font-bold text-text-primary shrink-0 w-36">
                        {country}
                      </span>
                      <span className="font-body text-sm text-text-secondary leading-relaxed">
                        {change}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs font-sans text-text-muted">
                  * Illustrative Beispiele — keine Steuerberatung. Stand und Detailgenauigkeit
                  variieren je Update-Zyklus.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Was du bekommst ───────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-12">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                Was du bekommst
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-light mb-3">
                Einmal abonniert. Jedes Jahr automatisch aktuell.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {UPDATES.map(({ Icon, title, desc }) => (
                <div key={title} className="bg-surface-base border border-border-subtle p-6 flex gap-4">
                  <Icon size={18} className="text-brand-gold shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-serif text-base font-bold text-text-light mb-2">{title}</h3>
                    <p className="font-body text-sm text-text-light/55 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Preis + CTA ──────────────────────────────────────────────────── */}
        <section
          id="kaufen"
          className="border-b border-brand-gold/15"
          style={{ background: 'linear-gradient(180deg, rgba(200,136,42,0.06) 0%, transparent 100%)' }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Jahres-Abo
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-10">
                Wähle deinen Einstieg
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                {/* Standard */}
                <div className="border border-border-subtle p-6" style={{ background: 'rgba(200,136,42,0.03)' }}>
                  <p className="font-sans text-xs font-bold tracking-[0.12em] uppercase text-text-muted mb-1">
                    Neukunde
                  </p>
                  <p className="font-serif text-3xl font-bold text-text-primary mt-2">19 €</p>
                  <p className="font-sans text-xs text-text-muted mt-1 mb-5">pro Jahr · kündbar jederzeit</p>
                  <ul className="space-y-2 mb-6">
                    {[
                      'Jährliches Update aller 23 Länder',
                      'Änderungs-Zusammenfassung',
                      'E-Mail-Benachrichtigung',
                      'Neue Länder automatisch inklusive',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs font-sans text-text-secondary">
                        <ChevronRight size={12} className="text-brand-gold shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {/* In Vorbereitung — ehrliche Vormerkung statt totem #kaufen-Anker */}
                  <a
                    href="mailto:pitmaster@steakakademie.de?subject=Steuer-Matrix%20LIVE%20%E2%80%94%20Vormerkung&body=Bitte%20benachrichtigt%20mich%2C%20sobald%20Steuer-Matrix%20LIVE%20verf%C3%BCgbar%20ist."
                    className="flex items-center justify-center gap-2 w-full py-3 font-sans font-bold text-sm border transition-colors hover:border-brand-gold/50"
                    style={{ borderColor: 'rgba(200,136,42,0.3)', color: '#C8882A' }}
                  >
                    Vormerken — benachrichtigt werden <ArrowRight size={14} />
                  </a>
                </div>

                {/* Original-Käufer */}
                <div
                  className="border p-6 relative"
                  style={{ borderColor: 'rgba(200,136,42,0.4)', background: 'rgba(200,136,42,0.06)' }}
                >
                  <span
                    className="absolute -top-3 left-5 text-[10px] font-sans font-bold tracking-[0.14em] uppercase px-3 py-1"
                    style={{ background: '#C8882A', color: '#0D0A06' }}
                  >
                    Original-Käufer
                  </span>
                  <p className="font-sans text-xs font-bold tracking-[0.12em] uppercase text-text-muted mb-1 mt-1">
                    Bereits Steuer-Matrix Käufer
                  </p>
                  <div className="flex items-baseline gap-3 mt-2 mb-1">
                    <p className="font-serif text-3xl font-bold text-brand-gold">9,50 €</p>
                    <p className="font-sans text-sm text-text-muted line-through">19 €</p>
                  </div>
                  <p className="font-sans text-xs text-brand-gold mb-5">50 % Rabatt im ersten Jahr</p>
                  <ul className="space-y-2 mb-6">
                    {[
                      'Alle Leistungen wie Standard',
                      '50 % Rabatt im ersten Jahr',
                      'Danach 19 € / Jahr',
                      'Kündbar jederzeit',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs font-sans text-text-secondary">
                        <ChevronRight size={12} className="text-brand-gold shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="mailto:pitmaster@steakakademie.de?subject=Steuer-Matrix LIVE Rabatt&body=Meine Bestellnummer:"
                    className="flex items-center justify-center gap-2 w-full py-3 font-sans font-bold text-sm hover:opacity-90 transition-opacity"
                    style={{ background: '#C8882A', color: '#0D0A06' }}
                  >
                    Rabatt-Link anfordern <ArrowRight size={14} />
                  </a>
                  <p className="text-center text-[10px] font-sans text-text-muted mt-2">
                    Bestellnummer per E-Mail → Rabatt-Link innerhalb 24h
                  </p>
                </div>
              </div>

              <div
                className="mt-8 border px-5 py-4 max-w-2xl"
                style={{ borderColor: 'rgba(200,136,42,0.2)', background: 'rgba(200,136,42,0.04)' }}
              >
                <div className="flex gap-3">
                  <ShieldCheck size={16} className="text-brand-gold shrink-0 mt-0.5" />
                  <p className="text-xs font-sans text-text-secondary leading-relaxed">
                    Alle Preise sind Endpreise in Euro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Disclaimer ───────────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="max-w-content mx-auto flex gap-4">
              <AlertTriangle size={16} className="text-brand-gold shrink-0 mt-0.5" />
              <p className="text-xs font-sans text-text-muted leading-relaxed">
                Steuer-Matrix LIVE ist eine vereinfachte Entscheidungshilfe und ersetzt keine
                individuelle Steuerberatung. Trotz jährlicher Aktualisierung können kurzfristige
                Gesetzesänderungen zwischen den Update-Zyklen auftreten. Konsultiere immer
                einen zugelassenen Steuerberater für deine persönliche Situation.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Häufige Fragen
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-light mb-10">FAQ</h2>
              <div className="divide-y divide-border-subtle">
                {FAQ.map(({ q, a }) => (
                  <div key={q} className="py-6">
                    <h3 className="font-serif text-base font-bold text-text-light mb-2">{q}</h3>
                    <p className="font-body text-sm text-text-light/55 leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <section className="bg-surface-dark border-t border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-content mx-auto">
              <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted mb-6">
                Verwandte Produkte
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: '← Steuer-Matrix (Basis)', href: '/steuer-matrix', note: 'Voraussetzung für dieses Abo' },
                  { label: 'Gründer-Schmiede', href: '/gruender-schmiede', note: 'Von der Idee zur Anmeldung in 72h' },
                  { label: 'Erste-Kunden-Sprint', href: '/erste-kunden-sprint', note: 'Erste bezahlte Aufträge in 72h' },
                ].map(({ label, href, note }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col gap-1 text-sm font-sans py-3 px-4 border transition-colors hover:border-brand-gold/30"
                    style={{ borderColor: 'rgba(200,136,42,0.12)', color: 'rgba(255,255,255,0.5)' }}
                  >
                    <span className="flex items-center gap-2">
                      <ChevronRight size={12} className="text-brand-gold" />
                      {label}
                    </span>
                    <span className="text-[11px] text-text-muted pl-4">{note}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
