import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight, ArrowRight, ClipboardList, Cpu, Download,
  Flame, Clock, Target, BarChart2,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { badge } from '@/lib/kerntemperatur-referenz';
import { CHECKOUT_URL, VERKAUF_AN, VERKAUFSSTART_TEXT } from '@/lib/mein-protokoll/angebot';
import { PAKETE } from '@/lib/mein-protokoll/guthaben';
import GutscheinHinweis from '@/components/gutschein/GutscheinHinweis';

// Kerntemperatur aus der Referenz statt hart kodiert (CLAUDE.md §2 Regel 2).
const MR = badge('beef_mr').c;

export const metadata: Metadata = {
  title: 'Mein Protokoll — Dein 8-Wochen-Grillplan',
  description:
    'Kein generischer Kurs. Ein Plan der zu deinem Grill, deiner Zeit und deinen Zielen passt — 5 Minuten Fragebogen, 8 Wochen, konkrete Sessions.',
  alternates: { canonical: 'https://steakakademie.de/mein-protokoll' },
  openGraph: {
    title: 'Mein Protokoll — Dein 8-Wochen-Grillplan',
    description:
      'Fragebogen ausfüllen, KI generiert deinen Plan. Grilltyp, Erfahrungsstand, verfügbare Zeit, Ziele — dein Protokoll ist auf dich zugeschnitten, nicht auf irgendjemanden.',
    url: 'https://steakakademie.de/mein-protokoll',
    type: 'website',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
};

const STEPS = [
  {
    Icon: ClipboardList,
    step: '01',
    title: 'Fragebogen ausfüllen',
    desc: '5 Minuten. Grilltyp, Erfahrungsstand, verfügbare Zeit pro Session, Ziele, was dich am meisten nervt. Je konkreter, desto präziser der Plan.',
  },
  {
    Icon: Cpu,
    step: '02',
    title: 'KI generiert deinen Plan',
    desc: 'Das System kombiniert deine Angaben mit einem strukturierten 8-Wochen-Progressionsmodell. Kein Copy-Paste aus einem Template — ein Plan der zu dir passt.',
  },
  {
    Icon: Download,
    step: '03',
    title: 'Plan sofort verfügbar',
    desc: 'Du bekommst deinen persönlichen Grillplan als strukturiertes Dokument — Woche für Woche, Session für Session, mit Cut, Technik, Temperaturziel und Erfolgskriterium.',
  },
];

const PLAN_FEATURES = [
  {
    Icon: Flame,
    title: 'Auf deinen Grilltyp zugeschnitten',
    desc: 'Kettle, Gas, Pellet, Kamado, Smoker — jeder Grill hat andere Stärken und andere Lernkurven. Dein Plan nutzt was du hast, nicht was ideal wäre.',
  },
  {
    Icon: Clock,
    title: 'Realistisch in deiner Zeit',
    desc: 'Du hast samstags 2 Stunden oder sonntags einen halben Tag? Der Plan passt sich an — keine Sessions die du nie durchführen wirst.',
  },
  {
    Icon: Target,
    title: 'Zielgerichtet progressiv',
    desc: 'Woche 1 ist nie dasselbe wie Woche 8. Jede Session baut auf der letzten auf — Technik, Temperatur, Komplexität steigen gezielt.',
  },
  {
    Icon: BarChart2,
    title: 'Messbare Erfolgskriterien',
    desc: `Jede Session hat ein konkretes Ziel: nicht "lern das Steak besser machen", sondern "Kerntemperatur ${MR} °C beim Ribeye, gleichmäßige Kruste auf beiden Seiten"`,
  },
];

const QUESTIONNAIRE_PREVIEW = [
  { label: 'Dein Grilltyp', options: ['Kugelgrill', 'Gasgrill', 'Pelletgrill', 'Kamado', 'Offset-Smoker', 'Anderes'] },
  { label: 'Dein Erfahrungsstand', options: ['Einsteiger', 'Gelegentlich aktiv', 'Regelmäßig', 'Ambitioniert'] },
  { label: 'Zeit pro Session', options: ['1–2 Stunden', '3–4 Stunden', 'Halber Tag', 'Flexibel'] },
  { label: 'Dein Hauptziel', options: ['Techniken meistern', 'Bestimmten Cut perfektionieren', 'Gäste beeindrucken', 'Wettbewerb vorbereiten'] },
];

const FAQ = [
  {
    q: 'Kann ich den Plan nach 8 Wochen wiederholen oder neu generieren?',
    a: 'Ein Protokoll ist ein Plan über 8 Wochen. Für die nächsten 8 Wochen brauchst du ein weiteres Protokoll — im Paket mit zwei Protokollen ist es schon dabei, und das zweite baut auf dem ersten auf statt von vorn zu beginnen.',
  },
  {
    q: 'Was wenn mein Grill nicht in den Optionen ist?',
    a: 'Du kannst im Fragebogen unter "Anderes" deinen Grilltyp beschreiben. Das System berücksichtigt auch ungewöhnlichere Setups wie Feuergrills, Wok-Stationen oder Tandem-Setups.',
  },
  {
    q: 'Wie detailliert ist ein Wochenplan?',
    a: 'Jede Session enthält: den vorgeschlagenen Cut mit Gewicht, die Methode (direkt/indirekt/Reverse Sear etc.), Zieltemperaturen, Zeitplanung und das konkrete Erfolgskriterium für diese Session.',
  },
  {
    q: 'Bekomme ich den Plan als PDF?',
    a: 'Du erhältst deinen Plan als strukturiertes Web-Dokument mit Druckoption — übersichtlich formatiert für Küche oder Grillplatz. Über die Druckfunktion deines Browsers speicherst du ihn auch als PDF.',
  },
  {
    q: 'Was wenn ich mit dem Plan nicht zufrieden bin?',
    a: 'Zu jedem Protokoll gehört eine kostenlose Korrektur: Du passt deine Antworten an, schreibst dazu, was nicht passt, und der Plan wird einmal neu erstellt. Bleibt danach etwas offen, schreib uns unter pitmaster@steakakademie.de.',
  },
];

export default function MeinProtokollPage() {
  return (
    <>
      <Header />

      <main className="bg-surface-base">

        {/* Hero */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <nav
              className="flex items-center gap-1.5 text-xs font-sans text-text-light/55 mb-8"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Mein Protokoll</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Personalisierter Grillplan
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-text-light leading-tight mb-6">
                Dein Setup. Deine Ziele.<br className="hidden lg:block" />
                Dein Plan.
              </h1>
              <p className="font-serif text-xl lg:text-2xl text-text-light/80 leading-relaxed mb-4">
                8 Wochen. Auf dich zugeschnitten. 5 Minuten Fragebogen.
              </p>
              <p className="font-body text-base text-text-light/55 leading-relaxed mb-10 max-w-2xl">
                Kein generischer Kurs der für jeden passt und deshalb für niemanden
                optimal ist. Du beantwortest 5 Fragen zu deinem Grill, deiner Zeit
                und deinen Zielen — das System generiert deinen persönlichen
                8-Wochen-Trainingsplan mit konkreten Sessions, Cuts und Messzielen.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#kaufen"
                  className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ background: '#C8882A', color: '#0D0A06' }}
                >
                  {VERKAUF_AN ? 'Protokoll wählen — ab 19 €' : `Ab 19 € — Verkaufsstart ${VERKAUFSSTART_TEXT}`} <ArrowRight size={15} />
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

        {/* Problem */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Das Problem
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-8">
                Du weißt was du können willst.<br />
                Aber nicht in welcher Reihenfolge du dahin kommst.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-body text-text-secondary leading-relaxed">
                <div className="space-y-4">
                  <p>
                    Du schaust Videos. Du liest Guides. Du versuchst es beim nächsten
                    Grillen. Manchmal klappt es, manchmal nicht — aber du weißt nicht
                    warum, und du machst nächstes Mal dasselbe.
                  </p>
                  <p>
                    Kurse sind zu generisch. Was für einen Einsteiger mit Gasgrill funktioniert,
                    ist für jemanden mit Kamado und 20 Sessions Erfahrung Zeitverschwendung.
                  </p>
                </div>
                <div className="space-y-4">
                  <p>
                    Lernen durch Wiederholung funktioniert — aber nur wenn du die
                    richtige Sache zur richtigen Zeit übst. Progression statt
                    Zufallsprinzip.
                  </p>
                  <p>
                    Ein Plan der zu dir passt — deinem Grill, deiner Zeit, deinem
                    Niveau — macht den Unterschied zwischen &quot;ich grill schon seit
                    Jahren und bin immer noch mittelmäßig&quot; und echtem Fortschritt,
                    der messbar ist.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wie es funktioniert */}
        <section id="wie-es-funktioniert" className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-12">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                Wie es funktioniert
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-light mb-3">
                Drei Schritte. Fünf Minuten. Acht Wochen Plan.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {STEPS.map(({ Icon, step, title, desc }) => (
                <div key={step} className="bg-surface-base border border-border-subtle p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-sans text-xs font-bold" style={{ color: '#C8882A' }}>
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

        {/* Fragebogen-Vorschau */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Der Fragebogen
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-3">
                5 Fragen. Keine Pflichtfelder ohne Sinn.
              </h2>
              <p className="font-body text-text-secondary mb-10 max-w-xl">
                Jede Frage hat eine direkte Auswirkung auf deinen Plan. Keine Newsletter-Pflicht.
                Deine Antworten gehen zur Plan-Erstellung an unseren KI-Dienstleister — Details in der{' '}
                <Link href="/datenschutz" className="text-brand-gold underline hover:text-brand-fire">Datenschutzerklärung</Link>.
              </p>

              <div className="space-y-4 max-w-2xl">
                {QUESTIONNAIRE_PREVIEW.map(({ label, options }) => (
                  <div
                    key={label}
                    className="border border-border-subtle p-5"
                    style={{ background: 'rgba(200,136,42,0.02)' }}
                  >
                    <p className="font-serif text-sm font-bold text-text-primary mb-3">{label}</p>
                    <div className="flex flex-wrap gap-2">
                      {options.map((opt) => (
                        <span
                          key={opt}
                          className="text-xs font-sans px-3 py-1.5 border cursor-default"
                          style={{ borderColor: 'rgba(200,136,42,0.2)', color: 'rgba(255,255,255,0.5)' }}
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs font-sans text-text-muted pt-2">
                  + eine offene Frage: Was nervt dich beim Grillen am meisten?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Was dein Plan enthält */}
        <section className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-12">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                Was dein Plan enthält
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-light mb-3">
                Nicht &quot;lern mehr&quot; — sondern &quot;tu das jetzt&quot;.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {PLAN_FEATURES.map(({ Icon, title, desc }) => (
                <div key={title} className="bg-surface-base border border-border-subtle p-6 flex gap-4">
                  <Icon size={18} className="text-brand-gold shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-serif text-base font-bold text-text-light mb-2">{title}</h3>
                    <p className="font-body text-sm text-text-light/55 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Beispiel-Session */}
            <div className="mt-10 border border-brand-gold/20 p-6" style={{ background: 'rgba(200,136,42,0.04)' }}>
              <p className="font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-brand-gold mb-4">
                Beispiel — Woche 3, Session 1
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {[
                  { label: 'Cut', value: 'Entrecôte 300g' },
                  { label: 'Methode', value: 'Reverse Sear' },
                  { label: 'Zieltemp.', value: `${MR} °C Kern` },
                  { label: 'Erfolgsziel', value: 'Gleichmäßige Garung, Kruste <90 Sek.' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-sans text-[10px] font-bold tracking-[0.1em] uppercase text-text-muted mb-1">{label}</p>
                    <p className="font-serif text-sm font-bold text-text-light">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Preis + CTA */}
        <section
          id="kaufen"
          className="border-b border-brand-gold/15"
          style={{ background: 'linear-gradient(180deg, rgba(200,136,42,0.06) 0%, transparent 100%)' }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-2">
                Einmaliger Kauf — kein Abo
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-3">
                Mein Protokoll
              </h2>
              <p className="font-body text-sm text-text-secondary leading-relaxed max-w-2xl mb-8">
                Ein Protokoll ist ein persönlicher Plan über 8 Wochen. Zu jedem Protokoll gehört
                eine kostenlose Korrektur, falls der erste Wurf nicht passt.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {PAKETE.map((paket) => (
                  <div key={paket.protokolle} className="border border-brand-gold/25 p-6 flex flex-col" style={{ background: 'rgba(200,136,42,0.04)' }}>
                    <h3 className="font-serif text-xl font-bold text-text-primary">{paket.titel}</h3>
                    <p className="font-serif text-4xl font-bold text-brand-gold mt-2">{paket.preis} €</p>
                    <p className="text-sm font-sans text-text-muted mt-1 mb-5">Einmalig · {paket.zeile}</p>
                    <ul className="space-y-2 mb-6">
                      {[
                        paket.protokolle === 1 ? 'Ein persönlicher 8-Wochen-Plan' : 'Zwei 8-Wochen-Pläne, aufeinander aufbauend',
                        'Auf deinen Grilltyp & deine Zeit zugeschnitten',
                        'Jede Session mit Cut, Methode, Temperaturziel',
                        'Kerntemperaturen aus der Steakakademie-Referenz, maschinell geprüft',
                        'Eine kostenlose Korrektur je Protokoll',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm font-sans text-text-secondary">
                          <ChevronRight size={13} className="text-brand-gold shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto">
                      {VERKAUF_AN ? (
                        <a
                          href={CHECKOUT_URL}
                          rel="nofollow"
                          className="flex items-center justify-center gap-2 px-6 py-3.5 font-sans font-bold text-base hover:opacity-90 transition-opacity"
                          style={{ background: '#C8882A', color: '#0D0A06' }}
                        >
                          {paket.titel} — {paket.preis} €
                          <ArrowRight size={16} />
                        </a>
                      ) : (
                        <span
                          className="flex items-center justify-center px-6 py-3.5 font-sans font-bold text-base border border-brand-gold/40 text-text-muted cursor-not-allowed"
                          aria-disabled="true"
                        >
                          Verkaufsstart geplant: {VERKAUFSSTART_TEXT}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs font-sans text-text-muted">
                {VERKAUF_AN
                  ? 'Das Paket wählst du im Bestellformular. Nach dem Kauf bekommst du eine E-Mail mit deinem Login-Link zum Fragebogen.'
                  : `Noch nicht bestellbar — Verkaufsstart geplant: ${VERKAUFSSTART_TEXT}. Preise und Leistung stehen fest.`}
              </p>

              <div
                className="mt-8 border px-5 py-4"
                style={{ borderColor: 'rgba(200,136,42,0.2)', background: 'rgba(200,136,42,0.04)' }}
              >
                <p className="text-xs font-sans text-text-secondary leading-relaxed">
                  <strong className="text-text-primary">Hinweis zum Widerrufsrecht:</strong>{' '}
                  Für digitale Inhalte gilt das 14-tägige Widerrufsrecht (
                  <Link href="/agb" className="text-brand-gold underline hover:text-brand-fire">AGB § 6a</Link>,{' '}
                  <Link href="/widerruf" className="text-brand-gold underline hover:text-brand-fire">Widerruf</Link>).
                  Es erlischt, wenn du beim Kauf ausdrücklich zustimmst, dass der Plan vor Ablauf der Frist
                  erstellt wird, und bestätigst, dass du damit dein Widerrufsrecht verlierst. Der Plan wird
                  erst erstellt, wenn du den Fragebogen abschickst.
                  Endpreis in Euro inklusive gesetzlicher Mehrwertsteuer.
                </p>
                <p className="text-xs font-sans text-text-secondary leading-relaxed mt-2">
                  <strong className="text-text-primary">KI-Hinweis:</strong>{' '}
                  Der Plan wird von einem KI-Sprachmodell erstellt. Temperaturen und Zeiten sind Richtwerte.
                  Mehr im <Link href="/ki-disclaimer" className="text-brand-gold underline hover:text-brand-fire">KI-Disclaimer</Link>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
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

        <GutscheinHinweis courseSlug="mein-protokoll" titel="Mein Protokoll" />

        {/* Navigation */}
        <section className="bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-content mx-auto">
              <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted mb-6">
                Weitere BBQ-Tools
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Steak-Beichte', href: '/steak-beichte', note: 'KI-Diagnose für Grillfehler' },
                  { label: 'Steak-Rettung', href: '/rettung', note: 'Sechs Grillfehler und ihre Lösung' },
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

