import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, TrendingUp, FileText, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  // Uwe, 02.09.2026: noindex — Gruender-Bereich ist aus der Steakakademie ausgebaut
  // (Nav/Footer seit 641b346, Sitemap seit heute). CLAUDE.md Abschnitt 10.
  robots: { index: false, follow: false },
  title: 'Das Ehrliche System für Solo-Selbstständige',
  description:
    'Reproduzierbares Betriebssystem für Solo-Selbstständige, entwickelt beim Aufbau von steakakademie.de. Drei Säulen: Gründung, Steuern, Agentur-Unabhängigkeit.',
  alternates: { canonical: 'https://steakakademie.de/ehrliches-system' },
  openGraph: {
    title: 'Das Ehrliche System',
    description:
      'Kein Hype. Keine vagen Versprechen. Ein reproduzierbares KI-Business-Betriebssystem, das wir live beim Aufbau von steakakademie.de entwickelt haben.',
    url: 'https://steakakademie.de/ehrliches-system',
    type: 'website',
  },
};

const PILLARS = [
  {
    slug: 'gruender-schmiede',
    number: 'I',
    icon: '🚀',
    label: 'Gründer-Schmiede',
    kicker: 'Von 0 auf legal in 72h',
    tagline: 'Von der Idee zur rechtssicheren Gewerbeanmeldung & ersten Website in 72 Stunden.',
    bullets: [
      'Exakte Checkliste: was wirklich notwendig ist — kein "Was du brauchen könntest"',
      'Gewerbeanmeldung, Steuer-Onboarding, Domain + Hosting',
      'Erste Seite live: technischer Stack ohne Agentur',
      'Reproduzierbare Schritt-für-Schritt-Dokumentation',
    ],
    audience: 'Gründer in der Vorgründungsphase, 30–50 J., DACH',
  },
  {
    slug: 'steuer-matrix',
    number: 'II',
    icon: '📊',
    label: 'Steuer-Matrix',
    kicker: 'Datengestützte Entscheidungen',
    tagline: 'GmbH vs. Einzelunternehmen. Netto-Vergleiche. KI-Modelle für klare Entscheidungen.',
    bullets: [
      'GmbH vs. Einzelunternehmen: konkrete Netto-Vergleiche',
      'Gewinnentnahme-Optimierung mit Excel-/KI-Modellen',
      'Keine Steuerberatung — Entscheidungshilfe (Disclaimer)',
      'Reproduzierbare Berechnungsmodelle für Solo-Selbstständige',
    ],
    disclaimer: '⚠️ Keine Steuerberatung. Immer Steuerberater konsultieren.',
    audience: 'Solo-Selbstständige, die Steuer-Entscheidungen rational treffen wollen',
  },
  {
    slug: 'eigenregie',
    number: 'III',
    icon: '⚡',
    label: 'Eigenregie',
    kicker: 'Full-Ownership in 72h',
    tagline: 'Befreiung von Drittanbieter-Abhängigkeiten. Website-Migration zu Next.js + Vercel.',
    bullets: [
      'Migration: Agentur-Website → GitHub-Ownership in 72h',
      'Next.js + Vercel: vollständige Code-Kontrolle',
      'Claude Code als dein dauerhaftes Werkzeug',
      'Einmal aufgesetzt — für immer unabhängig',
    ],
    audience: 'KMUs/Selbstständige mit laufender Agentur, die Kontrolle zurückwollen',
  },
];

const MODELS = [
  {
    label: 'Masterclass',
    model: 'D',
    desc: 'Selbststudium-Paket mit Template-Zugang',
    phase: '→ Jetzt verfügbar',
    highlight: true,
  },
  {
    label: 'Build-to-Order',
    model: 'C',
    desc: 'Digitalisierung eines bestehenden analogen Betriebs',
    phase: '→ Phase 2',
    highlight: false,
  },
  {
    label: 'Business-in-a-Box',
    model: 'A',
    desc: 'Schlüsselfertiges Nischen-Projekt inkl. Coaching',
    phase: '→ Phase 3',
    highlight: false,
  },
  {
    label: 'Lizenz & Franchise',
    model: 'B',
    desc: 'Steakakademie-Methode für eigene Region/Nische',
    phase: '→ Phase 3',
    highlight: false,
  },
];

interface Course {
  slug: string;
  price: number;
  published: boolean;
}

export default async function EhrlichesSystemPage() {
  // Preise aus Supabase — niemals hardcoden (Preisangabenverordnung)
  let courseData: Record<string, Course> = {};
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('courses')
      .select('slug, price, published')
      .in('slug', ['gruender-schmiede', 'steuer-matrix', 'eigenregie']);
    if (data) {
      courseData = Object.fromEntries(data.map((c) => [c.slug, c]));
    }
  } catch {
    // Graceful degradation — Preis-Display entfällt wenn DB nicht erreichbar
  }

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Das Ehrliche System',
    description:
      'Reproduzierbares Betriebssystem für Solo-Selbstständige — entwickelt live beim Aufbau von steakakademie.de.',
    brand: { '@type': 'Brand', name: 'Steakakademie' },
    offers: PILLARS.map((p) => {
      const course = courseData[p.slug];
      return {
        '@type': 'Offer',
        name: p.label,
        priceCurrency: 'EUR',
        ...(course ? { price: course.price } : {}),
        availability: 'https://schema.org/PreOrder',
      };
    }),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://steakakademie.de' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Das Ehrliche System',
        item: 'https://steakakademie.de/ehrliches-system',
      },
    ],
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="bg-surface-base">
        {/* ── Hero ──────────────────────────────────────────────────────────────── */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/55 mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/80">Das Ehrliche System</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Building in Public — Live-Fallstudie
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-text-light leading-tight mb-6">
                Das Ehrliche System
              </h1>
              <p className="font-serif text-xl lg:text-2xl text-text-light/90 leading-relaxed mb-4">
                Ein reproduzierbares Betriebssystem für Solo-Selbstständige —<br className="hidden lg:block" />
                entwickelt live beim Aufbau von steakakademie.de.
              </p>
              <p className="font-body text-base text-text-light/75 leading-relaxed mb-10 max-w-2xl">
                Kein Hype. Keine vagen Versprechen. Keine Phantasie-Income-Screenshots. Wer ein
                funktionierendes KI-gestütztes Web-Business aufgebaut hat, hat gleichzeitig das
                Blueprint für alle anderen gebaut. Das hier ist dieses Blueprint.
              </p>

              {/* Trust-Signale */}
              <div className="flex flex-wrap gap-6">
                {[
                  { icon: <CheckCircle size={14} />, text: 'Echte Zahlen aus dem laufenden Betrieb' },
                  { icon: <CheckCircle size={14} />, text: 'Kein Agentur-Modell, keine vagen Versprechen' },
                  { icon: <CheckCircle size={14} />, text: '3 eigenständig verkaufbare Säulen' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs font-sans text-text-light/70">
                    <span className="text-brand-gold">{icon}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Kern-These ────────────────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="max-w-content mx-auto">
              <blockquote className="border-l-4 border-brand-gold pl-6 py-2">
                <p className="font-serif text-xl lg:text-2xl text-text-primary italic leading-relaxed">
                  „Wer ein funktionierendes KI-gestütztes Web-Business aufgebaut hat, hat gleichzeitig
                  das Blueprint für alle anderen gebaut.&quot;
                </p>
                <footer className="mt-4 text-sm font-sans text-text-muted">
                  — Uwe Yendell, Gründer Steakakademie.de
                </footer>
              </blockquote>
            </div>
          </div>
        </section>

        {/* ── Die 3 Säulen ──────────────────────────────────────────────────────── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-12">
            <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
              3 eigenständige Produkte
            </span>
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-3">Die drei Säulen</h2>
            <p className="font-body text-text-secondary max-w-xl">
              Jede Säule ist ein eigenständiges Produkt — separat kaufbar, separat anwendbar. Zusammen
              bilden sie das vollständige Betriebssystem für ein KI-gestütztes Solo-Business.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {PILLARS.map((pillar) => {
              const course = courseData[pillar.slug];
              return (
                <div
                  key={pillar.slug}
                  id={`saule-${pillar.number.toLowerCase()}`}
                  className="scroll-mt-24 bg-surface-card border border-border-subtle hover:border-brand-gold/40 transition-colors duration-200 p-7 flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <span className="text-2xl">{pillar.icon}</span>
                      <div className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted mt-1">
                        Säule {pillar.number}
                      </div>
                    </div>
                    {course && (
                      <div className="text-right">
                        <div className="font-serif text-2xl font-bold text-brand-gold">
                          {new Intl.NumberFormat('de-DE', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0,
                          }).format(course.price)}
                        </div>
                        <div className="text-[10px] font-sans text-text-muted">einmalig</div>
                      </div>
                    )}
                  </div>

                  {/* Kicker + Titel */}
                  <div className="mb-1 text-[10px] font-sans font-bold tracking-[0.14em] uppercase text-brand-fire">
                    {pillar.kicker}
                  </div>
                  <h3 className="font-serif text-xl font-bold text-text-primary mb-3">
                    {pillar.label}
                  </h3>
                  <p className="font-body text-sm text-text-secondary leading-relaxed mb-5">
                    {pillar.tagline}
                  </p>

                  {/* Bullets */}
                  <ul className="space-y-2 mb-5 flex-1">
                    {pillar.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm font-body text-text-secondary">
                        <ChevronRight size={13} className="text-brand-gold shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  {/* Disclaimer */}
                  {pillar.disclaimer && (
                    <p className="text-[11px] font-sans text-text-muted bg-surface-base px-3 py-2 mb-5">
                      {pillar.disclaimer}
                    </p>
                  )}

                  {/* Audience */}
                  <div className="border-t border-border-subtle pt-4 mt-auto">
                    <div className="text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-text-muted mb-1">
                      Zielgruppe
                    </div>
                    <p className="text-xs font-sans text-text-secondary">{pillar.audience}</p>
                  </div>

                  {/* CTA */}
                  <div className="mt-4">
                    {course?.published ? (
                      <Link
                        href={`/${pillar.slug}`}
                        className="flex items-center gap-2 text-sm font-sans font-semibold text-brand-fire hover:gap-3 transition-[gap]"
                      >
                        Jetzt kaufen <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <span className="text-[11px] font-sans text-text-muted bg-surface-base px-3 py-1.5 inline-block">
                        In Vorbereitung
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Verkaufsmodelle ───────────────────────────────────────────────────── */}
        <section className="border-t border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-10">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                4 Einstiegsoptionen
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-light mb-3">Wie wir zusammenarbeiten</h2>
              <p className="font-body text-text-light/75 max-w-xl">
                Von Selbststudium bis schlüsselfertigem Nischen-Projekt. Jedes Modell hat seinen Platz —
                je nachdem wo du gerade stehst und was du brauchst.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MODELS.map((model) => (
                <div
                  key={model.model}
                  className={`p-6 border transition-colors ${
                    model.highlight
                      ? 'border-brand-gold/50 bg-surface-card'
                      : 'border-border-subtle bg-surface-base/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-sans font-bold tracking-[0.16em] uppercase ${
                      model.highlight ? 'text-brand-gold' : 'text-text-muted'
                    }`}>
                      Modell {model.model}
                    </span>
                    <span className={`text-[10px] font-sans px-2 py-0.5 ${
                      model.highlight
                        ? 'bg-brand-gold/10 text-brand-gold'
                        : 'bg-surface-base text-text-muted'
                    }`}>
                      {model.phase}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-text-light mb-2">{model.label}</h3>
                  <p className="text-sm font-body text-text-light/75">{model.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Radikale Transparenz ──────────────────────────────────────────────── */}
        <section className="border-t border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Unser Differenziator
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-8">
                Radikale Transparenz statt Guru-Versprechen
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  {
                    icon: <TrendingUp size={20} />,
                    title: 'Echte Zahlen',
                    desc: 'Keine Phantasie-Income-Screenshots. Alle Preis- und Ergebnisangaben sind realistisch und belegbar — aus dem laufenden Betrieb von steakakademie.de.',
                  },
                  {
                    icon: <FileText size={20} />,
                    title: 'Fehler-Tagebuch',
                    desc: 'Was schiefging, warum, und wie es behoben wurde. Ehrliche Dokumentation als Trust-Builder — nicht trotz der Fehler, sondern durch sie.',
                  },
                  {
                    icon: <Zap size={20} />,
                    title: 'Anti-Hype-Sprache',
                    desc: '"Bewährt" statt "revolutionär". "Konkret" statt "transformativ". Wir nennen Dinge beim Namen — auch wenn es unbequem ist.',
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title}>
                    <div className="text-brand-gold mb-3">{icon}</div>
                    <h3 className="font-serif text-lg font-bold text-text-primary mb-2">{title}</h3>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              {/* Semantischer Text für Google */}
              <div className="mt-12 pt-10 border-t border-border-subtle font-body text-text-secondary leading-relaxed space-y-5 text-[1.0625rem]">
                <p>
                  Das Ehrliche System entstand nicht am Reißbrett — es entstand beim Aufbau von
                  steakakademie.de. Jede Entscheidung, jeder Fehler, jede erfolgreiche Lösung ist
                  dokumentiert. Das macht es reproduzierbar: nicht als Versprechen, sondern als
                  Beweis.
                </p>
                <p>
                  Der Kerngedanke: Wer ein funktionierendes KI-gestütztes Web-Business aufgebaut hat,
                  hat gleichzeitig das Blueprint für alle anderen gebaut. Die Werkzeuge — Next.js,
                  Supabase, Claude Code, Loops.so — sind dieselben. Die Methodik ist dokumentiert.
                  Die Kosten sind real (unter 300&thinsp;€/Jahr im Grundbetrieb).
                </p>
                <p>
                  Zielgruppe sind Solo-Selbstständige, Trainer, Gastronomen und KMUs, die sich von
                  Agentur-Abhängigkeiten befreien wollen — oder die gerade neu gründen und von Anfang
                  an auf dem richtigen Fundament aufbauen möchten. Kein Vorwissen erforderlich. Kein
                  Programmierer notwendig.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Interne Verlinkung ────────────────────────────────────────────────── */}
        <section className="border-t border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-content mx-auto">
              <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted mb-6">
                Mehr von Steakakademie
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'Über den Gründer — Uwes Geschichte', href: '/ueber-uns' },
                  { label: 'KI-Guide Marco: Dein BBQ-Assistent', href: '/autoren/marco' },
                  { label: 'Das Steak-Manifest: 10 Thesen', href: '/manifest' },
                  { label: 'Diplom-System: Systematisch besser werden', href: '/diplome' },
                  { label: 'Cuts & Fleischkunde', href: '/cuts' },
                  { label: 'Methoden & Techniken', href: '/methoden' },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 text-sm font-sans text-text-light/70 hover:text-brand-fire transition-colors group py-2.5 border-b border-border-subtle/30 last:border-0"
                  >
                    <ChevronRight size={12} className="text-brand-gold opacity-50 group-hover:opacity-100 shrink-0" />
                    {label}
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
