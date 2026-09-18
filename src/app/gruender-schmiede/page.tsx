import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight, CheckCircle, ArrowRight, Clock, Shield,
  FileText, Globe, Calculator, List, Rocket,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WerkzeugHinweis from '@/components/gruendung/WerkzeugHinweis';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  // Uwe, 02.09.2026: noindex — Gruender-Bereich ist aus der Steakakademie ausgebaut
  // (Nav/Footer seit 641b346, Sitemap seit heute). CLAUDE.md Abschnitt 10.
  robots: { index: false, follow: false },
  title: 'Gründer-Schmiede — 6 Module zum KI-Business',
  description:
    'Sechs Module, das Gründer-Nachschlagewerk „Das Komplettikon" und ein Arbeitszeit-Planer: die Methode hinter steakakademie.de, von Tag 1 dokumentiert.',
  alternates: { canonical: 'https://steakakademie.de/gruender-schmiede' },
  openGraph: {
    title: 'Gründer-Schmiede — KI-gesteuert dein Business bauen',
    description:
      'Nicht noch ein Kurs übers Gründen — die Methode, mit der ich steakakademie.de wirklich gebaut habe. Mit KI als Mitgründer, ehrlich dokumentiert.',
    url: 'https://steakakademie.de/gruender-schmiede',
    type: 'website',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
};

const DELIVERABLES = [
  {
    Icon: Shield,
    title: 'Das Chef-Prinzip',
    desc: 'Das mentale Betriebssystem: eine Wahrheitsquelle, KI als Chef statt Praktikant, EIN Produkt bis es Geld bringt. Damit du dich nicht im Chaos verlierst.',
  },
  {
    Icon: List,
    title: 'Schluss mit Tool-Chaos',
    desc: 'Das mentale Modell, mit dem dein Projekt mitwächst statt zu zerfasern — der häufigste Grund, warum junge Projekte sterben.',
  },
  {
    Icon: Globe,
    title: 'KI an deine Tools koppeln',
    desc: 'Die KI mit Jira & Confluence verbinden und erst den Ist-Stand lesen lassen — kein blindes Drauflosschreiben.',
  },
  {
    Icon: Calculator,
    title: 'Struktur bauen',
    desc: 'Epics sind deine Geschäftsbereiche, Tickets die aktive Arbeit. Ein Backbone, das ehrlich bleibt und mitwächst.',
  },
  {
    Icon: FileText,
    title: 'Wissensbasis & Disziplin',
    desc: 'Deine Wissensbasis aus echten Fakten — und die drei Todsünden, die jedes System nach drei Wochen wieder zerlegen.',
  },
  {
    Icon: Rocket,
    title: 'Der Arbeits-Loop',
    desc: 'Briefing → bauen lassen → verifizieren → festhalten. Wie du mit begrenzter Zeit täglich etwas wirklich fertig machst.',
  },
];

const FAQ = [
  {
    q: 'Brauche ich Vorkenntnisse in Technik oder Programmierung?',
    a: 'Nein. Du musst einen Computer bedienen können — sonst nichts. Die Methode arbeitet mit KI (Claude Code) als Werkzeug: Du steuerst und entscheidest, die KI macht die eigentliche Arbeit.',
  },
  {
    q: 'Wie viel Zeit muss ich investieren?',
    a: 'So viel, wie du hast. Die Methode ist auf kleine Arbeits-Loops ausgelegt — auch 45 Minuten am Tag bringen dich voran. Der eingebaute Arbeitszeit-Planer macht aus deiner verfügbaren Zeit einen realistischen Plan.',
  },
  {
    q: 'Entstehen mir zusätzliche Kosten?',
    a: 'Ja, und das sagen wir offen: Die Methode arbeitet mit Claude Code — dafür brauchst du ein eigenes Claude-Abo, Empfehlung Max-Tarif (rund 100 € im Monat, monatlich kündbar — aktuelle Preise bei Anthropic). Bevor du schluckst, rechne dagegen: Eine professionelle Website vom Dienstleister kostet im Aufbau schnell mehrere tausend Euro — und danach zahlst du für jede Änderung. Hier gehört dir das System komplett: Du baust geführt, verwaltest selbst und kündigst das Werkzeug, sobald du es nicht mehr brauchst. Die Steakakademie selbst ist genau so entstanden — ohne Agentur-Rechnung.',
  },
  {
    q: 'Und die Bürokratie — Gewerbe, Finanzamt, Rechtsform?',
    a: 'Deckt „Das Komplettikon" ab, dein Gründer-Nachschlagewerk: was du angehen musst, was du beantragst und welche Kosten in den ersten 6 Monaten kommen — plus Rechtsform-Vergleich. Das ist eine Orientierung, keine Steuer- oder Rechtsberatung.',
  },
  {
    q: 'Ist das auch für nebenberufliche Selbstständigkeit geeignet?',
    a: 'Ja. Methode und Komplettikon decken Haupt- und Nebenerwerb ab — die relevanten Unterschiede (Kleinunternehmer, Versicherung) sind erklärt.',
  },
  {
    q: 'Gibt es Support bei Fragen?',
    a: 'Du erreichst uns unter info@steakakademie.de. Keine automatisierten Ticketsysteme — direkter Kontakt.',
  },
];

export default async function GruenderSchmiedePage() {
  let price: number | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('courses')
      .select('price')
      .eq('slug', 'gruender-schmiede')
      .single();
    if (data) price = data.price;
  } catch {
    // Graceful degradation
  }

  const eur = (n: number) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(n);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Gründer-Schmiede',
    description:
      'Die echte Methode, KI-gesteuert ein digitales Business aufzubauen — sechs Module vom Chef-Prinzip bis zum täglichen Arbeits-Loop, plus das Gründer-Nachschlagewerk „Das Komplettikon" und ein Arbeitszeit-Planer. Von Tag 1 dokumentiert.',
    brand: { '@type': 'Brand', name: 'Steakakademie' },
    // Checkout AUS (Uwe, 03.09.2026) — deshalb Discontinued statt InStock und
    // ohne Preis. Ein Product-Schema mit InStock und Preisangabe ist fuer
    // Suchmaschinen ein kaufbares Angebot; das waere hier eine strukturierte
    // Falschangabe, auch wenn die Seite auf noindex steht (Schema wird von
    // anderen Parsern als Googlebot gelesen). Mit dem Checkout zurueckdrehen.
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/Discontinued',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://steakakademie.de' },
      { '@type': 'ListItem', position: 2, name: 'Das Ehrliche System', item: 'https://steakakademie.de/ehrliches-system' },
      { '@type': 'ListItem', position: 3, name: 'Gründer-Schmiede', item: 'https://steakakademie.de/gruender-schmiede' },
    ],
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

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
              <Link href="/ehrliches-system" className="hover:text-brand-gold transition-colors">
                Das Ehrliche System
              </Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Gründer-Schmiede</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Säule I — Gründer-Schmiede
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-text-light leading-tight mb-6">
                KI-gesteuert dein Business bauen —<br className="hidden lg:block" />
                ohne dich im Chaos zu verlieren.
              </h1>
              <p className="font-serif text-xl lg:text-2xl text-text-light/80 leading-relaxed mb-4">
                Nicht noch ein Kurs übers Gründen. Die Methode, mit der diese Website entstand —
                solo, ohne Programmierer, von Tag 1 dokumentiert.
              </p>
              <p className="font-body text-base text-text-light/55 leading-relaxed mb-10 max-w-2xl">
                Andere verkaufen dir Theorie. Ich zeige dir meine echte Herangehensweise —
                von Tag 1 dokumentiert: wie du mit KI als fokussiertem Mitgründer ein digitales
                Business aufbaust, Schritt für Schritt, ohne dich zu verzetteln. Plus alles, was du
                fürs Gründen brauchst, an einer Stelle.
              </p>

              <div className="flex flex-wrap gap-6">
                {[
                  { icon: <Clock size={14} />, text: 'Sechs Module — vom Chef-Prinzip bis zum täglichen Arbeits-Loop' },
                  { icon: <Shield size={14} />, text: 'Das Komplettikon: Gründungs-Bürokratie & Kosten ehrlich erklärt' },
                  { icon: <CheckCircle size={14} />, text: 'Arbeitszeit-Planer: aus deiner Zeit ein realistischer Plan' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs font-sans text-text-light/55">
                    <span className="text-brand-gold">{icon}</span>
                    {text}
                  </div>
                ))}
              </div>

              {/* Kauf-CTA entfernt (Uwe, 03.09.2026) — siehe Kommentar am
                  Preis-Abschnitt weiter unten. Ein "Jetzt für X € starten",
                  das auf einen Abschnitt ohne Kaufmöglichkeit springt, wäre
                  eine Preiszusage ohne Einlösung. Beim Wiedereinschalten
                  zusammen mit dem Checkout zurückholen. */}
            </div>
          </div>
        </section>

        {/* ── Setup-Showcase Teaser ─────────────────────────────────────────── */}
        <section className="border-b border-brand-gold/15" style={{ background: 'linear-gradient(180deg, rgba(200,136,42,0.06) 0%, transparent 100%)' }}>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-content mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-2">
                  Eröffnung — volle Transparenz
                </span>
                <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">
                  Erst zeige ich dir mein komplettes System.
                </h2>
                <p className="font-body text-sm text-text-secondary leading-relaxed max-w-xl">
                  Die KI-Agenten, Programme, Konnektoren und Werkzeuge, mit denen die Steakakademie
                  als Ein-Personen-Betrieb läuft — offen gelegt. Du kaufst kein Theorie-Modell,
                  du bekommst dieses laufende System.
                </p>
              </div>
              <Link href="/gruender-schmiede/setup"
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 border border-brand-gold/40 text-brand-gold font-sans font-bold text-xs tracking-[0.1em] uppercase hover:bg-brand-gold/10 transition-colors">
                Mein Setup ansehen <ArrowRight size={15} />
              </Link>
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
                Die Idee ist nicht das Problem.<br />
                Das Chaos ist es.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-body text-text-secondary leading-relaxed">
                <div className="space-y-4">
                  <p>
                    Du willst etwas aufbauen — vielleicht hast du schon angefangen: die Idee in
                    Notion, die Zahlen in Excel, vierzig offene Tabs. Nach zwei Wochen weißt du nicht
                    mehr, was Stand ist, und entscheidest aus dem Bauch.
                  </p>
                  <p>
                    KI macht das schlimmer, wenn du sie falsch einsetzt — sie öffnet dir auf
                    Knopfdruck zehn neue Baustellen. Das killt mehr junge Projekte als jeder
                    Wettbewerber: nicht die schlechte Idee, sondern der verlorene Überblick.
                  </p>
                </div>
                <div className="space-y-4">
                  <p>
                    Dazu die Hürde davor: Gewerbe oder Freiberuf? Welche Rechtsform? Finanzamt-
                    Fragebogen — was soll ich da eintragen? Viele verlieren hier den Überblick,
                    bevor sie überhaupt gebaut haben.
                  </p>
                  <p>
                    Die Gründer-Schmiede löst beides: eine Methode, die KI zu deinem fokussierten
                    Mitgründer macht — und „Das Komplettikon&quot;, das die Bürokratie ehrlich erklärt.
                    Genau so habe ich steakakademie.de gebaut.
                  </p>
                </div>
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
                Sechs Module. Null Füllmaterial.
              </h2>
              <p className="font-body text-text-light/60 max-w-xl">
                Das ist meine echte Methode — KI-gesteuert ein Business bauen, von Tag 1
                dokumentiert. Jedes Modul bringt dich weiter, nicht nur „du weißt jetzt mehr&quot;.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {DELIVERABLES.map(({ Icon, title, desc }, i) => (
                <div
                  key={title}
                  className="bg-surface-base border border-border-subtle p-6 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="shrink-0 w-8 h-8 flex items-center justify-center font-sans text-xs font-bold"
                      style={{ background: 'rgba(200,136,42,0.12)', color: '#C8882A' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <Icon size={18} className="text-brand-gold shrink-0 mt-0.5" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-text-light">{title}</h3>
                  <p className="font-body text-sm text-text-light/55 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Dazu: Komplettikon + Arbeitszeit-Planer */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Link
                href="/gruender-schmiede/gruendung-basics"
                className="group bg-surface-base border border-border-subtle p-6 transition-colors hover:border-brand-gold/50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-serif text-base font-bold text-text-light">Das Komplettikon</h3>
                  <ArrowRight size={16} className="text-brand-gold transition-transform group-hover:translate-x-1" />
                </div>
                <p className="font-body text-sm text-text-light/55 leading-relaxed">
                  Dein komplettes Gründer-Nachschlagewerk: was du angehen musst, was du beantragst und
                  welche Kosten die ersten 6 Monate kommen — plus Rechtsform-Vergleich und Anti-Scam.
                </p>
              </Link>
              <Link
                href="/gruender-schmiede/planer"
                className="group bg-surface-base border border-border-subtle p-6 transition-colors hover:border-brand-gold/50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-serif text-base font-bold text-text-light">Arbeitszeit-Planer</h3>
                  <ArrowRight size={16} className="text-brand-gold transition-transform group-hover:translate-x-1" />
                </div>
                <p className="font-body text-sm text-text-light/55 leading-relaxed">
                  Sag, wie viel Zeit du pro Tag hast — der Planer verteilt alle Aufgaben auf einen
                  realistischen Timetable und rechnet automatisch neu, während dein Projekt wächst.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Differenziator ───────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <blockquote className="border-l-4 border-brand-gold pl-6 py-2 mb-12">
                <p className="font-serif text-xl lg:text-2xl text-text-primary italic leading-relaxed">
                  „Kein Kurs über Kurse. Die echte Methode, mit der dieses Projekt entstanden ist —
                  von Tag 1 dokumentiert.&quot;
                </p>
                <footer className="mt-4 text-sm font-sans text-text-muted">
                  — Kernprinzip der Gründer-Schmiede
                </footer>
              </blockquote>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  {
                    title: 'Praxiserprobt',
                    desc: 'Genau diese Methode hat steakakademie.de aufgebaut — solo, ohne Programmierer, ohne Agentur. Kein Theoriemodell, sondern der gelebte Weg.',
                  },
                  {
                    title: 'Ehrlich',
                    desc: 'Von Tag 1 dokumentiert, inklusive der Sackgassen. „Das ehrliche System": zeigen, wie man wirklich arbeitet — nicht nur, was man verkauft.',
                  },
                  {
                    title: 'Transparent',
                    desc: 'Kein Hype, kein Pflicht-Coaching. Was an Werkzeug-Kosten anfällt (Claude), sagen wir offen — und Claude ist monatlich kündbar.',
                  },
                ].map(({ title, desc }) => (
                  <div key={title}>
                    <h3 className="font-serif text-lg font-bold text-text-primary mb-2">{title}</h3>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Autor ────────────────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-6">
                Wer steckt dahinter
              </span>
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="shrink-0">
                  <div
                    className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center font-serif text-3xl font-bold overflow-hidden"
                    style={{ background: 'rgba(200,136,42,0.14)', border: '1px solid rgba(200,136,42,0.28)', color: '#C8882A' }}
                  >
                    {/* Foto → /public/images/uwe-yendell.jpg */}
                    <Image
                      src="/images/uwe-yendell.jpg"
                      alt="Uwe Yendell"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      onError={undefined}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-text-light mb-1">Uwe Yendell</h3>
                  <p className="text-sm font-sans text-brand-gold mb-4">
                    Profi-Koch · Zertifizierter Marketing-Manager · Sport- & Gymnastiklehrer
                  </p>
                  <div className="space-y-3 font-body text-sm text-text-light/65 leading-relaxed max-w-xl">
                    <p>
                      Ich bin 59, lebe in Wuppertal und habe steakakademie.de ohne Programmierer,
                      ohne Agentur und ohne Investoren aufgebaut — mit Next.js, Supabase und
                      KI-Werkzeugen, die heute jedem zugänglich sind.
                    </p>
                    <p>
                      Ich habe eine Eventküche durch die Insolvenz verloren. Ich habe eine Domain
                      verloren, weil sie auf dem falschen Namen registriert war. Ich habe gelernt,
                      was es kostet, wenn man die Grundlagen nicht kennt.
                    </p>
                    <p>
                      Die Gründer-Schmiede ist das, was ich mir selbst gewünscht hätte — vor zwanzig
                      Jahren. Kein Kurs über Kurse. Ein System, das funktioniert.
                    </p>
                  </div>
                </div>
              </div>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
                <div>
                  {/* Preis und "Sofortzugang" entfernt (Uwe, 03.09.2026):
                      Solange nicht gekauft werden kann, ist beides eine Zusage
                      ohne Einlösung — Preisangabe plus "Sofortzugang" neben
                      einem nicht buchbaren Angebot ist irreführende Werbung.
                      Mit dem Checkout zurückholen, nicht vorher. */}
                  <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-2">
                    Derzeit nicht buchbar
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-text-primary">
                    Gründer-Schmiede
                  </h2>
                </div>
                {/* Checkout AUS (Uwe, 03.09.2026): "Gründung-Sprint bleibt aus,
                    dazu haben wir bereits ein anderes Produkt entwickelt."
                    Der zweite Kaufweg neben /mein-system — beide stillgelegt.
                    Digistore 695894 bleibt im Konto aktiv und genehmigt, es
                    wird hier nur nicht mehr verkauft. Der Kaufbutton ist
                    entfernt statt versteckt: ein per CSS ausgeblendeter Link
                    bleibt klickbar und im HTML auffindbar.
                    WIEDEREINSCHALTEN: diesen Block durch den <a>-Button auf
                    https://www.checkout-ds24.com/product/695894 ersetzen und
                    checkoutUrl in src/app/mein-system/page.tsx zuruecksetzen —
                    aber erst, wenn Auslieferung (courses-Zeile +
                    digistore_products-Mapping) verifiziert ist. */}
                <div className="shrink-0 max-w-xs">
                  <p className="font-sans text-sm text-text-muted leading-relaxed">
                    Dieses Angebot ist derzeit nicht buchbar. Wir haben es durch ein neues
                    Produkt abgelöst und geben hier Bescheid, sobald es so weit ist.
                  </p>
                </div>
              </div>

              {/* Werkzeug-Kosten ehrlich offenlegen (Claude Code). Bleibt stehen,
                  obwohl derzeit nicht gekauft werden kann — die Angabe gehoert
                  zur Beschreibung des Systems, nicht zum Kaufvorgang. */}
              <div className="mb-6">
                <WerkzeugHinweis />
              </div>

              <div
                className="border px-5 py-4"
                style={{ borderColor: 'rgba(200,136,42,0.2)', background: 'rgba(200,136,42,0.04)' }}
              >
                <p className="text-xs font-sans text-text-secondary leading-relaxed">
                  <strong className="text-text-primary">Hinweis zum Widerrufsrecht:</strong>{' '}
                  Bei digitalen Inhalten, die nach Zahlung sofort zugänglich gemacht werden,
                  erlischt das gesetzliche 14-tägige Widerrufsrecht mit Beginn der Bereitstellung,
                  sofern du dem ausdrücklich zugestimmt hast. Dies wird beim Checkout abgefragt.
                </p>
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
                Alle Säulen
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Säule I — Gründer-Schmiede', href: '/gruender-schmiede', active: true },
                  { label: 'Säule II — Steuer-Matrix', href: '/steuer-matrix', active: false },
                  { label: 'Säule III — Eigenregie', href: '/eigenregie', active: false },
                ].map(({ label, href, active }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 text-sm font-sans py-3 px-4 border transition-colors"
                    style={{
                      borderColor: active ? 'rgba(200,136,42,0.4)' : 'rgba(200,136,42,0.12)',
                      background: active ? 'rgba(200,136,42,0.08)' : 'transparent',
                      color: active ? '#C8882A' : 'rgba(255,255,255,0.5)',
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
