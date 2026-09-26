import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight, ArrowRight, Camera, Zap, FileSearch,
  AlertTriangle, CheckCircle, Flame,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Steak-Beichte — KI-Diagnose für Grill-Fehler',
  description:
    'Beschreibe, was schiefgelaufen ist — du bekommst die genaue Ursache und ein Korrektur-Protokoll für das nächste Mal. Kein Forum, kein Raten, keine Tipps.',
  alternates: { canonical: 'https://steakakademie.de/steak-beichte' },
  openGraph: {
    title: 'Steak-Beichte — KI-Diagnose für dein Grill-Problem',
    description:
      'Zu trocken, Kruste falsch, innen roh? Beschreibe dein Ergebnis — KI-Analyse liefert Ursache + Korrektur-Protokoll. Pro Diagnose oder als 5er-Pack.',
    url: 'https://steakakademie.de/steak-beichte',
    type: 'website',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
};

const STEPS = [
  {
    Icon: Camera,
    step: '01',
    title: 'Beschreibe dein Problem',
    desc: 'Was hast du gegrillt, wie vorbereitet, was ist passiert? Foto optional, aber hilfreich. Je konkreter, desto präziser die Diagnose.',
  },
  {
    Icon: Zap,
    step: '02',
    title: 'KI analysiert',
    desc: 'Claude Vision kombiniert deine Beschreibung mit dem Bild und gleicht es gegen bekannte Fehlerursachen ab. Keine allgemeinen Tipps — präzise Ursachenforschung.',
  },
  {
    Icon: FileSearch,
    step: '03',
    title: 'Diagnose in deinem Postfach',
    desc: 'Du bekommst: die Ursache, warum es passiert ist, und die 2–3 konkreten Änderungen die das nächste Mal den Unterschied machen.',
  },
];

const REPORT_ITEMS = [
  { label: 'Ursachen-Analyse', desc: 'Was genau schiefgelaufen ist — technisch präzise, nicht beschönigt' },
  { label: 'Fehler-Einordnung', desc: 'Ob es ein Temperatur-, Timing-, Technik- oder Vorbereitung-Problem ist' },
  { label: 'Korrektur-Protokoll', desc: 'Die 2–3 konkreten Änderungen für das nächste Mal — in der richtigen Reihenfolge' },
  { label: 'Nächste-Session-Plan', desc: 'Wie du das nächste Mal vorgehst um denselben Fehler auszuschließen' },
];

const PROBLEMS = [
  'Außen verbrannt, innen roh',
  'Fleisch zu trocken / zäh',
  'Kruste bildet sich nicht',
  'Ungleichmäßige Garung',
  'Geschmack flach oder bitter',
  'Rub haftet nicht',
  'Plateauphase endlos lang',
  'Pulled Pork zerfällt nicht',
  'Brisket zu fest',
  'Fettrand schmilzt nicht',
];

const FAQ = [
  {
    q: 'Welche Grillprobleme können analysiert werden?',
    a: 'Alles was beim Grillen, Smoken oder Barbecue schiefgehen kann — von Steak über Brisket, Pulled Pork, Ribs bis Burger. Auch Technikprobleme wie Temperatursteuerung, Rauchenentwicklung oder Brikettmanagement.',
  },
  {
    q: 'Brauche ich zwingend ein Foto?',
    a: 'Nein. Ein gutes Foto erhöht die Diagnose-Präzision deutlich — aber auch reine Textbeschreibungen werden analysiert. Fotos von Schnittfläche, Oberfläche und Grillsituation sind am hilfreichsten.',
  },
  {
    q: 'Wie detailliert muss meine Beschreibung sein?',
    a: 'So detailliert wie möglich: welcher Cut, Gewicht, Vorbereitung (Trockenreife, Marinade, Rub), Grilltemperatur, Methode (direkt/indirekt), Garzeiten, gemessene Kerntemperatur. Je mehr Daten, desto präzisere Analyse.',
  },
  {
    q: 'Wie schnell bekomme ich die Diagnose?',
    a: 'In der Regel innerhalb weniger Minuten nach Einreichung. Die KI-Analyse läuft automatisch — du bekommst das Ergebnis per E-Mail sobald es fertig ist.',
  },
  {
    q: 'Was wenn ich mit der Diagnose nicht einverstanden bin?',
    a: 'Schreib uns unter pitmaster@steakakademie.de. Bei faktisch falschen Diagnosen erstatten wir den Credit. Wir stehen hinter der Qualität der Analyse.',
  },
];

export default function SteakBeichtePage() {
  return (
    <>
      <Header />

      <main className="bg-surface-base">

        {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <nav
              className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-8"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Steak-Beichte</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                KI-Grilldiagnose
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-text-light leading-tight mb-6">
                Sag mir was schiefgelaufen ist.<br className="hidden lg:block" />
                Ich sag dir warum.
              </h1>
              <p className="font-serif text-xl lg:text-2xl text-text-light/80 leading-relaxed mb-4">
                Keine allgemeinen Tipps. Keine Forum-Diskussion. Präzise Ursache — in Minuten.
              </p>
              <p className="font-body text-base text-text-light/55 leading-relaxed mb-10 max-w-2xl">
                Du beschreibst dein Grill-Ergebnis — mit oder ohne Foto. Die KI-Diagnose
                liefert dir die genaue Ursache, eine Fehler-Einordnung und ein konkretes
                Korrektur-Protokoll für das nächste Mal. Kein Raten. Kein „kommt drauf an&quot;.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.checkout-ds24.com/product/696394"
                  className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ background: '#C8882A', color: '#0D0A06' }}
                >
                  Diagnose starten <ArrowRight size={15} />
                </a>
                <a
                  href="#wie-es-funktioniert"
                  className="inline-flex items-center gap-2 px-6 py-3 font-sans text-sm border transition-colors hover:border-brand-gold/40"
                  style={{ borderColor: 'rgba(200,136,42,0.2)', color: 'rgba(255,255,255,0.6)' }}
                >
                  Wie es funktioniert
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* â”€â”€ Problem â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Das Problem
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-8">
                Ein €45-Tomahawk. Vergeigt.<br />
                Und niemand kann dir sagen warum.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-body text-text-secondary leading-relaxed">
                <div className="space-y-4">
                  <p>
                    Du postest es im Forum. „Zu hohe Temperatur vielleicht?&quot; „Hast du
                    rested?&quot; „War der Rost sauber?&quot; Zehn Meinungen, null Diagnose.
                    Du weißt danach immer noch nicht was wirklich passiert ist.
                  </p>
                  <p>
                    YouTube-Videos zeigen dir wie es richtig gemacht wird. Aber nicht
                    warum es bei dir falsch gegangen ist — mit deinem Grill, deinem Cut,
                    deiner Situation.
                  </p>
                </div>
                <div className="space-y-4">
                  <p>
                    Grillfehler haben Ursachen. Meistens eine einzelne, entscheidende.
                    Außen verbrannt innen roh ist ein Temperaturproblem. Zähes Fleisch
                    ist ein Timing-Problem. Keine Kruste ist ein Feuchtigkeitsproblem.
                    Wer die Ursache kennt, macht den Fehler kein zweites Mal.
                  </p>
                  <p>
                    Genau das liefert die Steak-Beichte: keine allgemeinen Ratschläge,
                    sondern die präzise Ursache für dein spezifisches Problem — und
                    das Protokoll um es zu beheben.
                  </p>
                </div>
              </div>

              {/* Problem-Tags */}
              <div className="mt-10 flex flex-wrap gap-2">
                {PROBLEMS.map((p) => (
                  <span
                    key={p}
                    className="text-xs font-sans px-3 py-1.5 border"
                    style={{ borderColor: 'rgba(200,136,42,0.2)', color: 'rgba(255,255,255,0.45)', background: 'rgba(200,136,42,0.04)' }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* â”€â”€ Wie es funktioniert â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section id="wie-es-funktioniert" className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-12">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                Wie es funktioniert
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-light mb-3">
                Drei Schritte. Minuten statt Tage.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {STEPS.map(({ Icon, step, title, desc }) => (
                <div key={step} className="bg-surface-base border border-border-subtle p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="font-sans text-xs font-bold"
                      style={{ color: 'rgba(200,136,42,0.5)' }}
                    >
                      {step}
                    </span>
                    <Icon size={18} className="text-brand-gold" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-text-light mb-2">{title}</h3>
                  <p className="font-body text-sm text-text-light/55 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* â”€â”€ Was du bekommst â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Dein Diagnose-Bericht
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-10">
                Vier Bestandteile. Keine Füllung.
              </h2>

              <div className="space-y-4">
                {REPORT_ITEMS.map(({ label, desc }, i) => (
                  <div
                    key={label}
                    className="flex gap-5 p-5 border border-border-subtle"
                    style={{ background: 'rgba(200,136,42,0.02)' }}
                  >
                    <div
                      className="shrink-0 w-8 h-8 flex items-center justify-center font-sans text-xs font-bold"
                      style={{ background: 'rgba(200,136,42,0.12)', color: '#C8882A' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-text-primary mb-1">{label}</h3>
                      <p className="font-body text-sm text-text-secondary leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* â”€â”€ Preis + CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section
          id="kaufen"
          className="border-b border-brand-gold/15"
          style={{ background: 'linear-gradient(180deg, rgba(200,136,42,0.06) 0%, transparent 100%)' }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Credits kaufen
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-2">
                Wähle dein Paket
              </h2>
              <p className="font-body text-text-secondary mb-10">
                Jeder Credit = eine vollständige Diagnose. Credits verfallen nicht.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                {/* 1er */}
                <div className="border border-border-subtle p-6" style={{ background: 'rgba(200,136,42,0.03)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-sans text-xs font-bold tracking-[0.12em] uppercase text-text-muted mb-1">
                        Einzeldiagnose
                      </p>
                      <p className="font-serif text-3xl font-bold text-text-primary">7 €</p>
                      <p className="font-sans text-xs text-text-muted mt-1">1 Credit · einmalig</p>
                    </div>
                    <Flame size={20} className="text-brand-gold mt-1" />
                  </div>
                  {/* Digistore24-Link — nach Produkt-Anlage eintragen */}
                  <a
                    href="https://www.checkout-ds24.com/product/696394"
                    className="flex items-center justify-center gap-2 w-full py-3 font-sans font-bold text-sm border transition-colors hover:border-brand-gold/50"
                    style={{ borderColor: 'rgba(200,136,42,0.25)', color: '#C8882A' }}
                  >
                    1 Diagnose kaufen <ArrowRight size={14} />
                  </a>
                </div>

                {/* 5er */}
                <div
                  className="border p-6 relative"
                  style={{ borderColor: 'rgba(200,136,42,0.4)', background: 'rgba(200,136,42,0.06)' }}
                >
                  <span
                    className="absolute -top-3 left-5 text-[10px] font-sans font-bold tracking-[0.14em] uppercase px-3 py-1"
                    style={{ background: '#C8882A', color: '#0D0A06' }}
                  >
                    Empfohlen
                  </span>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-sans text-xs font-bold tracking-[0.12em] uppercase text-text-muted mb-1">
                        5er-Pack
                      </p>
                      <p className="font-serif text-3xl font-bold text-brand-gold">25 €</p>
                      <p className="font-sans text-xs text-text-muted mt-1">5 Credits · 5 € pro Diagnose</p>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-xs font-sans font-bold px-2 py-0.5"
                        style={{ background: 'rgba(200,136,42,0.2)', color: '#C8882A' }}
                      >
                        Spare 10 €
                      </span>
                    </div>
                  </div>
                  <p className="font-body text-xs text-text-muted mb-4 mt-2">
                    Credits verfallen nicht — nutz sie wann du willst.
                  </p>
                  {/* Digistore24-Link — nach Produkt-Anlage eintragen */}
                  <a
                    href="https://www.checkout-ds24.com/offer/347059064/RKqM5nVwWQfc/696394"
                    className="flex items-center justify-center gap-2 w-full py-3 font-sans font-bold text-sm hover:opacity-90 transition-opacity"
                    style={{ background: '#C8882A', color: '#0D0A06' }}
                  >
                    5er-Pack kaufen <ArrowRight size={14} />
                  </a>
                </div>
              </div>

              <div
                className="mt-8 border px-5 py-4 max-w-2xl"
                style={{ borderColor: 'rgba(200,136,42,0.2)', background: 'rgba(200,136,42,0.04)' }}
              >
                <p className="text-xs font-sans text-text-secondary leading-relaxed">
                  <strong className="text-text-primary">Hinweis:</strong>{' '}
                  Credits sind sofort nach Kauf verfügbar. Alle Preise sind Endpreise in Euro. Als Kleinunternehmer gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* â”€â”€ Vertrauen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  Icon: CheckCircle,
                  title: 'Präzise — nicht generisch',
                  desc: 'Kein "könntest du vielleicht…". Die Diagnose benennt die Ursache direkt — basierend auf deinem spezifischen Fall.',
                },
                {
                  Icon: AlertTriangle,
                  title: 'Keine Steuerberatung',
                  desc: 'Die Steak-Beichte analysiert Grillfehler — keine Gesundheitsaussagen, keine Haftung für Lebensmittelsicherheit. Gesunden Menschenverstand beim Grillen vorausgesetzt.',
                },
                {
                  Icon: Zap,
                  title: 'Minuten statt Tage',
                  desc: 'Keine Wartezeit auf Forum-Antworten. Die KI-Diagnose läuft automatisch — du bekommst dein Ergebnis noch am selben Tag.',
                },
              ].map(({ Icon, title, desc }) => (
                <div key={title}>
                  <Icon size={18} className="text-brand-gold mb-3" />
                  <h3 className="font-serif text-base font-bold text-text-light mb-2">{title}</h3>
                  <p className="font-body text-sm text-text-light/55 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* â”€â”€ FAQ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

        {/* â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-content mx-auto">
              <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted mb-6">
                Weitere Tools & Sprints
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Steuer-Matrix', href: '/steuer-matrix' },
                  { label: 'Gründer-Schmiede', href: '/gruender-schmiede' },
                  { label: 'Eigenregie', href: '/eigenregie' },
                  { label: 'Erste-Kunden-Sprint', href: '/erste-kunden-sprint' },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 text-sm font-sans py-3 px-4 border transition-colors hover:border-brand-gold/30"
                    style={{
                      borderColor: 'rgba(200,136,42,0.12)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <ChevronRight size={12} />
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

