import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight, ArrowRight, BookOpen, TrendingUp,
  Brain, Star, Lock, CheckCircle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'Fleischpass — Dein persönliches Grill-Logbuch mit KI-Auswertung',
  description:
    'Tracke jede Grill-Session. Nach 10 Einträgen analysiert die KI deine Muster — Stärken, Schwächen, nächste Herausforderung. Kostenlos starten, KI-Layer ab 39 €/Jahr.',
  alternates: { canonical: 'https://steakakademie.de/fleischpass' },
  robots: { index: false, follow: false },
  openGraph: {
    images: ogImages('Fleischpass — Grill-Logbuch mit KI-Intelligenz'),
    title: 'Fleischpass — Grill-Logbuch mit KI-Intelligenz',
    description:
      '47 Sessions. Deine Schwäche: Rinderbrust. Deine Stärke: Rippchen. Fleischpass macht deinen Fortschritt sichtbar — und sagt dir was als nächstes kommt.',
    url: 'https://steakakademie.de/fleischpass',
    type: 'website',
  },
};

const LOG_FIELDS = [
  { label: 'Cut & Gewicht', example: 'Tomahawk 900g' },
  { label: 'Methode', example: 'Reverse Sear' },
  { label: 'Grilltemperatur', example: '120 °C indirekt → 280 °C direkt' },
  { label: 'Kerntemperatur', example: '54 °C' },
  { label: 'Dauer', example: '65 Minuten' },
  { label: 'Ergebnis (1–10)', example: '8 / 10' },
  { label: 'Notizen', example: 'Kruste perfekt, Kern minimal ungleich' },
  { label: 'Foto', example: 'Optional' },
];

const FREE_FEATURES = [
  'Bis zu 10 Session-Einträge',
  'Alle Log-Felder: Cut, Temp, Methode, Notizen, Foto',
  'Persönliche Session-Historie',
  'Export einzelner Einträge',
];

const PREMIUM_FEATURES = [
  'Unbegrenzte Session-Einträge',
  'KI-Musteranalyse ab 10 Einträgen',
  'Stärken & Schwächen-Profil',
  'Empfehlung: nächste Herausforderung',
  'Fortschritts-Visualisierung über Zeit',
  'Neue KI-Features automatisch inklusive',
];

const ANALYSIS_EXAMPLES = [
  {
    sessions: 23,
    insight: 'Du erreichst bei Rindfleisch konstant ±2 °C Genauigkeit — aber bei Schwein fehlen dir noch 8 Sessions um dasselbe Gefühl zu entwickeln.',
  },
  {
    sessions: 41,
    insight: 'Reverse Sear ist deine stärkste Methode (Ø 8,4/10). Direkt-Grillen schwächelt bei Cuts über 400g — das ist dein nächster Fokus.',
  },
  {
    sessions: 67,
    insight: 'Deine Timing-Genauigkeit hat sich in den letzten 20 Sessions um 34 % verbessert. Nächste Herausforderung: Brisket — dein einziger blinder Fleck auf Master-Niveau.',
  },
];

const FAQ = [
  {
    q: 'Ist die kostenlose Version wirklich dauerhaft kostenlos?',
    a: 'Ja. Bis 10 Einträge ist der Fleischpass vollständig kostenlos — kein Ablaufdatum, keine Kreditkarte nötig. Das Premium-Upgrade ist optional und jederzeit buchbar.',
  },
  {
    q: 'Was genau analysiert die KI — und wie?',
    a: 'Die KI wertet deine Einträge über Cut-Typen, Methoden, Temperaturen und Selbstbewertungen aus. Sie erkennt Muster die du selbst nicht siehst: z.B. dass du bei langen Sessions systematisch besser bist als bei kurzen, oder dass ein bestimmter Cut konstant unter deinem Durchschnitt liegt.',
  },
  {
    q: 'Was passiert mit meinen Daten?',
    a: 'Deine Session-Daten werden in deinem Supabase-gesicherten Account gespeichert. Keine Weitergabe an Dritte, keine Werbung. Du kannst deine Daten jederzeit exportieren oder löschen.',
  },
  {
    q: 'Kann ich den Fleischpass auf mehreren Geräten nutzen?',
    a: 'Ja. Der Fleischpass ist webbasiert — du loggst dich auf jedem Gerät mit deinem Account ein. Keine App-Installation nötig.',
  },
  {
    q: 'Wie kündige ich das Premium-Abo?',
    a: 'Jederzeit über dein Digistore24-Kundenkonto — ohne Frist, ohne Formular. Du behältst Premium-Zugang bis Ende des bezahlten Zeitraums.',
  },
];

export default function FleischpassPage() {
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
              <span className="text-text-light/65">Fleischpass</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Grill-Logbuch & KI-Analyse
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-text-light leading-tight mb-6">
                47 Sessions.<br className="hidden sm:block" />
                Deine Schwäche: Rinderbrust.<br className="hidden sm:block" />
                Deine Stärke: Rippchen.
              </h1>
              <p className="font-serif text-xl lg:text-2xl text-text-light/80 leading-relaxed mb-4">
                Tracke jede Session. Sieh deinen Fortschritt. Wiss was als nächstes kommt.
              </p>
              <p className="font-body text-base text-text-light/55 leading-relaxed mb-10 max-w-2xl">
                Der Fleischpass ist dein persönliches Grill-Logbuch — und ab Session 10
                dein persönlicher KI-Analyst. Er erkennt Muster die du nicht siehst,
                benennt deine blinden Flecken und sagt dir gezielt was du als nächstes
                üben solltest. Wie Strava — aber für BBQ.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#kaufen"
                  className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ background: '#C8882A', color: '#0D0A06' }}
                >
                  Kostenlos starten <ArrowRight size={15} />
                </a>
                <a
                  href="#premium"
                  className="inline-flex items-center gap-2 px-6 py-3 font-sans text-sm border transition-colors hover:border-brand-gold/40"
                  style={{ borderColor: 'rgba(200,136,42,0.2)', color: 'rgba(255,255,255,0.6)' }}
                >
                  KI-Layer ansehen
                </a>
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
                Du grillst seit Jahren.<br />
                Aber du weißt nicht ob du besser wirst.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-body text-text-secondary leading-relaxed">
                <div className="space-y-4">
                  <p>
                    Jeder Sportler trackt seine Leistung. Läufer wissen ihre Pace,
                    Kraftsportler ihr Gewicht, Radfahrer ihre Watts. Fortschritt
                    ohne Messung ist Zufall.
                  </p>
                  <p>
                    Beim Grillen? Die meisten erinnern sich vage an eine gute
                    Session vor drei Monaten. Was damals anders war, wissen sie
                    nicht mehr. Also machen sie dasselbe wie immer — und hoffen.
                  </p>
                </div>
                <div className="space-y-4">
                  <p>
                    Wer aufschreibt was er tut, lernt schneller. Wer seine Aufzeichnungen
                    auswertet, lernt gezielt. Und wer dabei eine KI hat die Muster über
                    Dutzende Sessions erkennt, lernt in Monaten was andere in Jahren nicht schaffen.
                  </p>
                  <p>
                    Der Fleischpass ist das Notizbuch das zurückdenkt — und dir sagt
                    was es gesehen hat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Was du loggst ─────────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-10">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                Was du loggst
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-light mb-3">
                Eine Session. Zwei Minuten. Alles drin.
              </h2>
              <p className="font-body text-text-light/60 max-w-xl">
                Kein aufwändiges Formular — die wichtigsten Felder, schnell ausgefüllt,
                direkt nach der Session.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
              {LOG_FIELDS.map(({ label, example }) => (
                <div
                  key={label}
                  className="bg-surface-base border border-border-subtle p-4"
                >
                  <p className="font-sans text-[10px] font-bold tracking-[0.1em] uppercase text-brand-gold mb-1.5">
                    {label}
                  </p>
                  <p className="font-body text-xs text-text-light/50 leading-relaxed">
                    {example}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── KI-Analyse ────────────────────────────────────────────────────── */}
        <section id="premium" className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Der KI-Layer
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-3">
                Ab Session 10 denkt der Pass mit.
              </h2>
              <p className="font-body text-text-secondary mb-12 max-w-xl">
                Was ein Mensch in 60 Sessions nicht bewusst bemerkt, sieht die KI
                nach 10 — und wird präziser mit jeder weiteren.
              </p>

              {/* Beispiel-Analysen */}
              <div className="space-y-4 mb-12">
                {ANALYSIS_EXAMPLES.map(({ sessions, insight }) => (
                  <div
                    key={sessions}
                    className="flex gap-5 p-5 border border-border-subtle"
                    style={{ background: 'rgba(200,136,42,0.02)' }}
                  >
                    <div className="shrink-0 text-center">
                      <p
                        className="font-serif text-2xl font-bold"
                        style={{ color: '#C8882A' }}
                      >
                        {sessions}
                      </p>
                      <p className="font-sans text-[9px] uppercase tracking-widest text-text-muted">
                        Sessions
                      </p>
                    </div>
                    <div className="flex items-center">
                      <p className="font-body text-sm text-text-secondary leading-relaxed italic">
                        „{insight}&quot;
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    Icon: TrendingUp,
                    title: 'Fortschritts-Tracking',
                    desc: 'Nicht nur "ich bin besser geworden" — sondern in welchen Bereichen, um wieviel, seit wann.',
                  },
                  {
                    Icon: Brain,
                    title: 'Muster-Erkennung',
                    desc: 'Die KI sieht Zusammenhänge über Dutzende Sessions — welche Variablen deine besten Ergebnisse erklären.',
                  },
                  {
                    Icon: Star,
                    title: 'Nächste Herausforderung',
                    desc: 'Gezielt — nicht zufällig. Was dich am schnellsten auf das nächste Niveau bringt, basierend auf deinem tatsächlichen Profil.',
                  },
                ].map(({ Icon, title, desc }) => (
                  <div key={title}>
                    <Icon size={18} className="text-brand-gold mb-3" />
                    <h3 className="font-serif text-base font-bold text-text-primary mb-2">{title}</h3>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────────── */}
        <section
          id="kaufen"
          className="border-b border-brand-gold/15"
          style={{ background: 'linear-gradient(180deg, rgba(200,136,42,0.06) 0%, transparent 100%)' }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Preise
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-10">
                Kostenlos starten. Upgraden wenn du bereit bist.
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">

                {/* Free */}
                <div className="border border-border-subtle p-6" style={{ background: 'rgba(200,136,42,0.02)' }}>
                  <p className="font-sans text-xs font-bold tracking-[0.12em] uppercase text-text-muted mb-1">
                    Kostenlos
                  </p>
                  <p className="font-serif text-3xl font-bold text-text-primary mt-2">0 €</p>
                  <p className="font-sans text-xs text-text-muted mt-1 mb-5">dauerhaft · kein Ablaufdatum</p>
                  <ul className="space-y-2 mb-6">
                    {FREE_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs font-sans text-text-secondary">
                        <CheckCircle size={12} className="text-brand-gold shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-xs font-sans text-text-muted">
                      <Lock size={12} className="shrink-0 mt-0.5" />
                      KI-Analyse (ab Premium)
                    </li>
                  </ul>
                  <a
                    href="/auth/login"
                    className="flex items-center justify-center gap-2 w-full py-3 font-sans font-bold text-sm border transition-colors hover:border-brand-gold/50"
                    style={{ borderColor: 'rgba(200,136,42,0.3)', color: '#C8882A' }}
                  >
                    Kostenlos starten <ArrowRight size={14} />
                  </a>
                </div>

                {/* Premium */}
                <div
                  className="border p-6 relative"
                  style={{ borderColor: 'rgba(200,136,42,0.4)', background: 'rgba(200,136,42,0.06)' }}
                >
                  <span
                    className="absolute -top-3 left-5 text-[10px] font-sans font-bold tracking-[0.14em] uppercase px-3 py-1"
                    style={{ background: '#C8882A', color: '#0D0A06' }}
                  >
                    Premium
                  </span>
                  <p className="font-sans text-xs font-bold tracking-[0.12em] uppercase text-text-muted mb-1 mt-1">
                    KI-Layer + unbegrenzt
                  </p>
                  <div className="flex items-baseline gap-3 mt-2">
                    <p className="font-serif text-3xl font-bold text-brand-gold">39 €</p>
                    <p className="font-sans text-sm text-text-muted">/ Jahr</p>
                  </div>
                  <p className="font-sans text-xs text-text-muted mt-0.5 mb-5">
                    oder 4,99 € / Monat · kündbar jederzeit
                  </p>
                  <ul className="space-y-2 mb-6">
                    {PREMIUM_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs font-sans text-text-secondary">
                        <CheckCircle size={12} className="text-brand-gold shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {/* Digistore24-Link — nach Produkt-Anlage eintragen */}
                  <a
                    href="#kaufen"
                    className="flex items-center justify-center gap-2 w-full py-3 font-sans font-bold text-sm hover:opacity-90 transition-opacity"
                    style={{ background: '#C8882A', color: '#0D0A06' }}
                  >
                    Premium — 39 € / Jahr <ArrowRight size={14} />
                  </a>
                  <p className="text-center text-[10px] font-sans text-text-muted mt-2">
                    Sofort freigeschaltet nach Kauf.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Häufige Fragen
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-10">FAQ</h2>
              <div className="divide-y divide-border-subtle">
                {FAQ.map(({ q, a }) => (
                  <div key={q} className="py-6">
                    <h3 className="font-serif text-base font-bold text-text-primary mb-2">{q}</h3>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <section className="bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-content mx-auto">
              <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted mb-6">
                Weitere BBQ-Tools
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Mein Protokoll', href: '/mein-protokoll', note: 'Personalisierter 8-Wochen-Plan' },
                  { label: 'Steak-Beichte', href: '/steak-beichte', note: 'KI-Diagnose für Grillfehler' },
                  { label: 'Diplom-System', href: '/diplome', note: '10 Level BBQ-Kompetenz' },
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
