import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight, Clock, Shield, CheckCircle,
  Search, BarChart2, MapPin, Link2, Eye, TrendingUp,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  // Uwe, 02.09.2026: noindex — Gruender-Bereich ist aus der Steakakademie ausgebaut
  // (Nav/Footer seit 641b346, Sitemap seit heute). CLAUDE.md Abschnitt 10.
  robots: { index: false, follow: false },
  title: 'SEO-Sprint — Google-Sichtbarkeit in 72h',
  description:
    'Website live — aber niemand findet sie? In 72 Stunden: Google Search Console, On-Page-SEO, Keyword-Strategie, erste Backlinks, lokale Sichtbarkeit.',
  alternates: { canonical: 'https://steakakademie.de/seo-sprint' },
  openGraph: {
    images: ogImages('SEO-Sprint — Google-Sichtbarkeit in 72h'),
    title: 'SEO-Sprint — Google-Sichtbarkeit in 72h',
    description:
      'Der logische nächste Schritt nach Eigenregie: deine fertige Website auf Google sichtbar machen. Schritt-für-Schritt, ohne Agentur.',
    url: 'https://steakakademie.de/seo-sprint',
    type: 'website',
  },
};

const DELIVERABLES = [
  {
    Icon: Search,
    title: 'Google Search Console einrichten',
    desc: 'Das wichtigste kostenlose Tool für Sichtbarkeit — richtig aufgesetzt, richtig gelesen. Du siehst ab jetzt welche Seiten Google kennt, welche nicht, und warum.',
  },
  {
    Icon: Eye,
    title: 'On-Page-SEO: Titel, Meta, Struktur',
    desc: 'Title-Tags, Meta-Descriptions, H1-Hierarchie, interne Verlinkung — die Basics die 80 % der Wirkung ausmachen. Für jede Seite deiner Website, in unter zwei Stunden.',
  },
  {
    Icon: BarChart2,
    title: 'Keyword-Strategie für Solo-Selbstständige',
    desc: 'Nicht auf Keywords mit 50.000 Suchanfragen zielen — auf die mit 200, die deine Wunschkunden wirklich eingeben. Wie du sie findest, priorisierst und einbaust.',
  },
  {
    Icon: Link2,
    title: 'Erste Backlinks — sauber und nachhaltig',
    desc: 'Branchenverzeichnisse, lokale Verzeichnisse, Partner-Erwähnungen. Welche zählen, welche schaden, wie du die ersten 10 bekommst ohne Spam-Risiko.',
  },
  {
    Icon: MapPin,
    title: 'Lokale Sichtbarkeit: Google Business',
    desc: 'Wenn deine Kunden lokal suchen, entscheidet Google Business über Sichtbarkeit — nicht die Website. Profil vollständig einrichten, Kategorien richtig wählen, aktiv halten.',
  },
  {
    Icon: TrendingUp,
    title: 'Messen & iterieren',
    desc: 'Was du wöchentlich in 15 Minuten überprüfst. Welche Seiten ranken, wo du Platz 11–20 bist (der Sweet Spot für schnelle Verbesserung), was du als nächstes optimierst.',
  },
];

const FAQ = [
  {
    q: 'Muss ich Eigenregie gemacht haben?',
    a: 'Nein. Der SEO-Sprint funktioniert mit jeder bestehenden Website — egal ob du sie selbst gebaut hast, von einer Agentur hast bauen lassen oder über WordPress, Squarespace oder Next.js betreibst.',
  },
  {
    q: 'In welchem Zeitraum sehe ich erste Ergebnisse?',
    a: 'Google braucht Zeit zum Indexieren und Ranken. Technische Korrekturen (Search Console, On-Page) zeigen Wirkung in 2–6 Wochen. Rankings für neue Keywords entstehen über 2–4 Monate. Lokale Sichtbarkeit über Google Business ist oft schneller — innerhalb von Wochen.',
  },
  {
    q: 'Brauche ich technisches Wissen oder Programmierkenntnisse?',
    a: 'Nein. Das System ist für Website-Betreiber ohne Entwickler-Hintergrund gebaut. Alle Schritte sind so erklärt, dass du sie direkt in deinem CMS oder deiner Website-Verwaltung ausführen kannst.',
  },
  {
    q: 'Was ist der Unterschied zu einer SEO-Agentur?',
    a: 'Eine SEO-Agentur kostet 500–2.000 € pro Monat und macht die Arbeit für dich — ohne dass du verstehst was passiert. Der SEO-Sprint kostet einmalig und macht dich selbst handlungsfähig. Du bist nie wieder abhängig von einer Agentur für Basis-SEO.',
  },
  {
    q: 'Funktioniert das auch für lokale Dienstleister (Handwerk, Beratung vor Ort)?',
    a: 'Besonders gut. Lokale Sichtbarkeit ist für Solo-Selbstständige mit regionalem Einzugsgebiet die wirkungsvollste SEO-Maßnahme — und gleichzeitig die, die am wenigsten Konkurrenz hat.',
  },
];

export default async function SeoSprintPage() {
  // Preisabruf und eur() entfernt (03.09.2026): Seit die Kauf-CTAs raus sind,
  // wird kein Preis mehr angezeigt — die Supabase-Abfrage lief pro Aufruf
  // ohne Abnehmer. Der Preis steht weiterhin in der courses-Tabelle und
  // kommt mit dem Verkauf zurueck.

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'SEO-Sprint',
    description:
      'Deine Website auf Google sichtbar in 72 Stunden. Google Search Console, On-Page-SEO, Keyword-Strategie, erste Backlinks, lokale Sichtbarkeit.',
    brand: { '@type': 'Brand', name: 'Steakakademie' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      // PreOrder statt InStock (03.09.2026) — gleiche Begruendung wie bei
      // /erste-kunden-sprint: kein Digistore-Produkt, kein Kaufweg, also auch
      // keine Verfuegbarkeitszusage im Schema.
      availability: 'https://schema.org/PreOrder',
    },
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
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
              <span className="text-text-light/65">SEO-Sprint</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Folgeprodukt zu Eigenregie
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-text-light leading-tight mb-6">
                Website live.<br className="hidden lg:block" />
                Jetzt auf Google sichtbar.
              </h1>
              <p className="font-serif text-xl lg:text-2xl text-text-light/80 leading-relaxed mb-4">
                In 72 Stunden: von unsichtbar zu auffindbar.
              </p>
              <p className="font-body text-base text-text-light/55 leading-relaxed mb-10 max-w-2xl">
                Du hast die Website. Niemand findet sie. Das ist kein Design-Problem —
                das ist ein SEO-Problem. Google Search Console, On-Page-Basics,
                Keyword-Strategie, erste Backlinks, lokales Ranking. Einmal richtig
                eingerichtet, dauerhaft wirksam. Ohne Agentur, ohne Monatsrechnung.
              </p>

              <div className="flex flex-wrap gap-6">
                {[
                  { icon: <Clock size={14} />, text: '72 Stunden bis zur technischen Grundlage' },
                  { icon: <Shield size={14} />, text: 'Keine Agentur — du machst es selbst, einmalig' },
                  { icon: <CheckCircle size={14} />, text: 'Kein Programmierwissen, kein SEO-Vorwissen nötig' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs font-sans text-text-light/55">
                    <span className="text-brand-gold">{icon}</span>
                    {text}
                  </div>
                ))}
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
                Eine gute Website die niemand findet<br />
                ist wie ein Laden ohne Schild.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-body text-text-secondary leading-relaxed">
                <div className="space-y-4">
                  <p>
                    Du hast die Website aufgesetzt. Sie sieht gut aus. Sie lädt schnell.
                    Aber Google Analytics zeigt: 3 Besucher diese Woche — allesamt du selbst.
                  </p>
                  <p>
                    SEO-Agenturen kosten 500–2.000 € im Monat. Für Grundlagen die du einmal
                    selbst einrichten kannst und die dann dauerhaft funktionieren — ohne
                    monatliche Rechnung, ohne Abhängigkeit.
                  </p>
                </div>
                <div className="space-y-4">
                  <p>
                    Das Problem ist nicht, dass SEO kompliziert ist. Das Problem ist, dass
                    niemand dir gezeigt hat was wirklich zählt — und was du getrost ignorieren
                    kannst. 80 % der Wirkung kommen aus 20 % der Maßnahmen.
                  </p>
                  <p>
                    Der SEO-Sprint liefert genau diese 20 %. Keine Theorie, kein
                    Komplettpaket. Die Schritte, die für Solo-Selbstständige tatsächlich
                    den Unterschied machen — in drei fokussierten Arbeitstagen.
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
                Sechs Module. Null Agentur-Budget.
              </h2>
              <p className="font-body text-text-light/60 max-w-xl">
                Jedes Modul endet mit einer fertigen Einrichtung — nicht mit Wissen
                über Einrichtung.
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
          </div>
        </section>

        {/* ── Differenziator ───────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <blockquote className="border-l-4 border-brand-gold pl-6 py-2 mb-12">
                <p className="font-serif text-xl lg:text-2xl text-text-primary italic leading-relaxed">
                  „SEO-Agenturen verdienen daran, dass du nicht weißt wie einfach
                  die Grundlagen sind. Nach diesem Sprint weißt du es.&quot;
                </p>
                <footer className="mt-4 text-sm font-sans text-text-muted">
                  — Kernprinzip des SEO-Sprints
                </footer>
              </blockquote>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  {
                    title: 'Einmalig — nicht monatlich',
                    desc: 'Keine Agentur-Retainer. Du richtest einmal ein, was dauerhaft funktioniert. SEO-Grundlagen veralten langsam — was du heute einrichtest, wirkt noch in drei Jahren.',
                  },
                  {
                    title: 'Für Solo-Selbstständige',
                    desc: 'Nicht auf große Brands ausgelegt. Die Strategie fokussiert auf Low-Competition-Keywords und lokale Sichtbarkeit — wo Solo-Selbstständige tatsächlich gewinnen können.',
                  },
                  {
                    title: 'Praxiserprobt',
                    desc: 'Dasselbe System, das steakakademie.de von null auf messbare Sichtbarkeit gebracht hat — ohne eine einzige Agentur-Rechnung.',
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
                    className="w-24 h-24 sm:w-32 sm:h-32 overflow-hidden"
                    style={{ border: '1px solid rgba(200,136,42,0.28)' }}
                  >
                    <Image
                      src="/images/uwe-yendell.jpg"
                      alt="Uwe Yendell"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
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
                      Ich habe steakakademie.de ohne Agentur aufgebaut — und SEO von Grund
                      auf selbst gelernt. Nicht aus einem Kurs, sondern durch Tun: Search
                      Console auswerten, testen, anpassen, ranken sehen.
                    </p>
                    <p>
                      Als zertifizierter Marketing-Manager weiß ich wie Online-Sichtbarkeit
                      theoretisch funktioniert. Als Solopreneur weiß ich wie sie praktisch
                      funktioniert — mit begrenzter Zeit und ohne Agentur-Budget.
                    </p>
                    <p>
                      Der SEO-Sprint ist das System, das ich mir am Anfang gewünscht hätte:
                      direkt, priorisiert, umsetzbar — nicht erschöpfend, sondern wirksam.
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
                  <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-2">
                    Einmaliger Zugang
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-text-primary">
                    SEO-Sprint
                  </h2>
                  {/* Preis und "Sofortzugang" entfernt (03.09.2026): beides
                      waere neben einem nicht buchbaren Angebot irrefuehrend. */}
                </div>
                {/* Kauf-CTA entfernt (03.09.2026). Fuer diesen Sprint existiert
                    kein Digistore-Produkt — der Button zeigte auf den Anker
                    #kaufen und damit auf sich selbst. "Jetzt kaufen" samt Preis
                    und "nach Kauf sofort verfuegbar" war eine Zusage ohne
                    Einloesung. Zurueckholen, sobald das Produkt angelegt und
                    die Auslieferung verifiziert ist (courses-Zeile +
                    digistore_products-Mapping). */}
                <div className="shrink-0 max-w-xs">
                  <p className="font-sans text-sm text-text-muted leading-relaxed">
                    Dieses Angebot ist noch in Vorbereitung und derzeit nicht buchbar.
                  </p>
                </div>
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
                Das Ehrliche System
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Eigenregie', href: '/eigenregie', note: 'Voraussetzung empfohlen' },
                  { label: 'Gründer-Schmiede', href: '/gruender-schmiede', note: 'Von der Idee zur Anmeldung' },
                  { label: 'Erste-Kunden-Sprint', href: '/erste-kunden-sprint', note: 'Erste Aufträge in 72h' },
                  { label: 'Steuer-Matrix', href: '/steuer-matrix', note: '23 Länder im Netto-Vergleich' },
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
