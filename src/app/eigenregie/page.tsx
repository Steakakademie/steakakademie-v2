import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight, CheckCircle, ArrowRight, Clock, Shield,
  Github, Globe, Code2, Zap, Lock, Unlock,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  // Uwe, 02.09.2026: noindex — Gruender-Bereich ist aus der Steakakademie ausgebaut
  // (Nav/Footer seit 641b346, Sitemap seit heute). CLAUDE.md Abschnitt 10.
  robots: { index: false, follow: false },
  title: 'Eigenregie: Full-Ownership in 72h',
  description:
    'Befreiung von Drittanbieter-Abhängigkeiten. Website-Migration zu Next.js + Vercel + GitHub in 72 Stunden. Einmal aufgesetzt — für immer unabhängig.',
  alternates: { canonical: 'https://steakakademie.de/eigenregie' },
  openGraph: {
    images: ogImages('Eigenregie — Dein Business „KOMPLETT“ in Eigenregie.'),
    title: 'Eigenregie — Dein Business „KOMPLETT“ in Eigenregie.',
    description:
      'Raus aus der Abhängigkeit. Vollständige Migration zu eigenem GitHub-Repo, Next.js und Vercel. Kein Wartungsvertrag mehr, keine monatlichen Gebühren.',
    url: 'https://steakakademie.de/eigenregie',
    type: 'website',
  },
};

const DELIVERABLES = [
  {
    Icon: Github,
    title: 'GitHub-Ownership aufsetzen',
    desc: 'Dein Repository, dein Code, deine Zugangsdaten. Nie wieder darauf angewiesen sein, dass jemand anderes dir den Zugang gewährt.',
  },
  {
    Icon: Code2,
    title: 'Website-Migration zu Next.js',
    desc: 'Von WordPress, Webflow, Wix oder einer beliebigen Agentur-Lösung zu einem sauberen Next.js-Projekt — in deiner Hand, im eigenen Repo.',
  },
  {
    Icon: Globe,
    title: 'Vercel-Deployment + DNS',
    desc: 'Hosting auf Vercel (EU-Rechenzentrum, DSGVO-konform), Cloudflare für DNS und CDN. Kostenlos bis zu ehrlichen Traffic-Volumen.',
  },
  {
    Icon: Zap,
    title: 'Claude Code als dauerhaftes Werkzeug',
    desc: 'Einrichtung und Nutzung von Claude Code als dein persönlicher Entwicklungspartner. Änderungen ohne Agentur — auch ohne Programmierkenntnisse.',
  },
  {
    Icon: Shield,
    title: 'Rechtssichere Basisstruktur',
    desc: 'Impressum, Datenschutzerklärung, Cookie-Hinweis — DSGVO-konform in die neue Website integriert. Nicht "irgendwie", sondern korrekt.',
  },
  {
    Icon: CheckCircle,
    title: 'Übergabe-Protokoll',
    desc: 'Du bist der Administrator. Schritt-für-Schritt-Dokumentation: wie du Änderungen vornimmst, wie du deployed, wie du Probleme eigenständig löst.',
  },
];

const COMPARISON = [
  { aspect: 'Monatliche Kosten', mit: 'Wartungsvertrag: 300–800€/Monat', ohne: '0€ — vollständig self-hosted' },
  { aspect: 'Änderungen', mit: 'Ticket stellen, warten, zahlen', ohne: 'Sofort selbst vornehmen' },
  { aspect: 'Code-Zugang', mit: 'Liegt bei der Agentur', ohne: 'Dein GitHub-Repository' },
  { aspect: 'Agenturwechsel', mit: 'Projekt neu beginnen, Daten verlieren', ohne: 'Du hast alles — kein Wechsel nötig' },
  { aspect: 'Weiterentwicklung', mit: 'Budget beantragen, Angebot einholen', ohne: 'Claude Code, sofort' },
];

const FAQ = [
  {
    q: 'Muss ich programmieren können?',
    a: 'Nein. Du brauchst keine Programmierkenntnisse. Claude Code übernimmt die technische Umsetzung. Du lernst, wie du Aufgaben stellst — nicht wie du Code schreibst.',
  },
  {
    q: 'Was passiert mit meinem bestehenden Design?',
    a: 'Das bestehende Design wird in die neue Struktur übertragen. Der Fokus liegt auf Ownership — nicht auf einem neuen Look. Deine Marke bleibt.',
  },
  {
    q: 'Wie lange dauert die Migration wirklich?',
    a: 'Bei einem normalen Business-Auftritt (5–15 Seiten) drei fokussierte Arbeitstage. Komplexere Shops oder Portale dauern länger — Eigenregie deckt die Infrastruktur und Basisseiten.',
  },
  {
    q: 'Mein Hosting-Vertrag läuft noch — was tue ich?',
    a: 'Das ist kein Hindernis. Die neue Infrastruktur kann parallel aufgebaut werden. Der Umzug der Domain erfolgt dann zum gewünschten Zeitpunkt — ohne Downtime.',
  },
  {
    q: 'Was ist mit WordPress-Seiten?',
    a: 'WordPress-Inhalte lassen sich exportieren und in Next.js überführen. Eigenregie hat einen klaren Fokus auf statische und semi-dynamische Unternehmenswebsites — kein komplexes LMS oder Membership-System.',
  },
  {
    q: 'Gibt es Support nach der Umstellung?',
    a: 'Direkter E-Mail-Kontakt über info@steakakademie.de. Du bekommst außerdem Zugang zum vollständigen Übergabe-Protokoll — damit du bei zukünftigen Fragen eigenständig agieren kannst.',
  },
];

export default async function EigenregiePage() {
  // Preisabruf und eur() entfernt (04.09.2026): Seit die Preisangabe raus ist,
  // hat die Supabase-Abfrage keinen Abnehmer mehr und lief pro Aufruf ins Leere.
  // Gleiches Vorgehen wie bei /erste-kunden-sprint und /seo-sprint (2f27717).

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
    name: 'Eigenregie',
    description:
      'Befreiung von Drittanbieter-Abhängigkeiten. Website-Migration zu Next.js + Vercel in 72 Stunden.',
    brand: { '@type': 'Brand', name: 'Steakakademie' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      // PreOrder (04.09.2026, Verifier-Befund): InStock war eine strukturierte
      // Falschangabe — der Checkout fuer 695900 ist bewusst aus ("wuerde
      // kassieren ohne Auslieferung", siehe src/app/mein-system/page.tsx), und
      // Schema.org wird nicht nur von Googlebot gelesen, noindex schuetzt davor
      // nicht. Am 03.09. zunaechst auf Discontinued gesetzt; das widerspricht
      // aber der Seite selbst, die "In Vorbereitung" und "bald buchbar" sagt.
      // Massstab ist dasselbe Kriterium wie bei /erste-kunden-sprint: in
      // Vorbereitung = PreOrder, eingestellt = Discontinued.
      // Preis bleibt raus: kein Preis fuer etwas, das man nicht kaufen kann.
      availability: 'https://schema.org/PreOrder',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://steakakademie.de' },
      { '@type': 'ListItem', position: 2, name: 'Das Ehrliche System', item: 'https://steakakademie.de/ehrliches-system' },
      { '@type': 'ListItem', position: 3, name: 'Eigenregie', item: 'https://steakakademie.de/eigenregie' },
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
              <span className="text-text-light/65">Eigenregie</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Säule III — Eigenregie
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-text-light leading-tight mb-6">
                Dein Business „KOMPLETT“<br className="hidden lg:block" />
                in Eigenregie.
              </h1>
              <p className="font-serif text-xl lg:text-2xl text-text-light/80 leading-relaxed mb-4">
                Deine Website. Dein Code. Unabhängig in 72 Stunden. Kein Wartungsvertrag
                mehr, keine monatlichen Gebühren, keine Agentur, die dir deinen eigenen
                Code verweigert.
              </p>
              <p className="font-body text-base text-text-light/55 leading-relaxed mb-10 max-w-2xl">
                Full-Ownership-Migration zu GitHub, Next.js und Vercel. Einmal aufgesetzt —
                für immer unabhängig. Claude Code als dein dauerhaftes Werkzeug für alle
                zukünftigen Änderungen.
              </p>

              <div className="flex flex-wrap gap-6">
                {[
                  { icon: <Unlock size={14} />, text: 'Vollständige Code-Kontrolle ab Tag 1' },
                  { icon: <Clock size={14} />, text: 'Migration in 72 Arbeitsstunden' },
                  { icon: <Lock size={14} />, text: 'Nie wieder Agentur-Abhängigkeit' },
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
                Du bezahlst jeden Monat —<br />
                für deine eigene Website.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-body text-text-secondary leading-relaxed">
                <div className="space-y-4">
                  <p>
                    Wartungsvertrag 300 Euro im Monat. Für was genau? Damit die Seite online
                    bleibt. Damit du nicht selbst rein musst. Damit jemand anderes die Kontrolle
                    behält — über deinen Auftritt, deine Inhalte, deinen Code.
                  </p>
                  <p>
                    Eine Textänderung? Ticket stellen. Drei Tage warten. Rechnung über
                    80 Euro. Eine neue Seite? Angebot einholen. Vier Wochen warten.
                    Rechnung über 1.200 Euro.
                  </p>
                </div>
                <div className="space-y-4">
                  <p>
                    Das Schlimmste: Bei einem Agenturwechsel verlierst du alles. Der Code
                    liegt auf deren Servern. Das Repository gehört ihnen. Du fängst von vorne an.
                  </p>
                  <p>
                    Das muss nicht so sein. Moderne Infrastruktur — GitHub, Next.js, Vercel —
                    kostet null Euro im Monat und gibt dir die vollständige Kontrolle.
                    Eigenregie zeigt dir wie.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Vergleich ─────────────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-6">
                Der Unterschied
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-light mb-8">
                Mit Agentur vs. in Eigenregie
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-3 pr-6 text-xs font-sans font-bold tracking-[0.12em] uppercase text-text-muted w-1/3">Aspekt</th>
                      <th className="text-left py-3 pr-6 text-xs font-sans font-bold tracking-[0.12em] uppercase text-text-muted w-1/3">
                        <span className="text-red-400/70">Mit Agentur</span>
                      </th>
                      <th className="text-left py-3 text-xs font-sans font-bold tracking-[0.12em] uppercase text-text-muted w-1/3">
                        <span className="text-green-400/70">In Eigenregie</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/40">
                    {COMPARISON.map(({ aspect, mit, ohne }) => (
                      <tr key={aspect}>
                        <td className="py-4 pr-6 text-sm font-sans font-medium text-text-light/70">{aspect}</td>
                        <td className="py-4 pr-6 text-sm font-body text-text-light/40">{mit}</td>
                        <td className="py-4 text-sm font-body text-green-400/80">{ohne}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ── Was du bekommst ───────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-12">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                Was du bekommst
              </span>
              <h2 className="font-serif text-3xl font-bold text-text-primary mb-3">
                Sechs Module. Ein Ergebnis: Unabhängigkeit.
              </h2>
              <p className="font-body text-text-secondary max-w-xl">
                Jedes Modul schließt mit einem greifbaren Ergebnis. Am Ende der drei Tage
                bist du Administrator deiner eigenen digitalen Infrastruktur.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {DELIVERABLES.map(({ Icon, title, desc }, i) => (
                <div
                  key={title}
                  className="bg-surface-card border border-border-subtle p-6 flex flex-col gap-3"
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
                  <h3 className="font-serif text-base font-bold text-text-primary">{title}</h3>
                  <p className="font-body text-sm text-text-secondary leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Differenziator ───────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-content mx-auto">
              <blockquote className="border-l-4 border-brand-gold pl-6 py-2">
                <p className="font-serif text-xl lg:text-2xl text-text-light italic leading-relaxed">
                  „72 Stunden von Agentur-Abhängigkeit zu vollständiger Code-Kontrolle.
                  Das ist kein Versprechen — das ist die Timeline, nach der steakakademie.de
                  aufgebaut wurde.&quot;
                </p>
                <footer className="mt-4 text-sm font-sans text-text-muted">
                  — Uwe Yendell, Gründer Steakakademie.de
                </footer>
              </blockquote>
            </div>
          </div>
        </section>

        {/* ── Autor ────────────────────────────────────────────────────────── */}
        <section className="border-b border-border-subtle">
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
                  <h3 className="font-serif text-xl font-bold text-text-primary mb-1">Uwe Yendell</h3>
                  <p className="text-sm font-sans text-brand-gold mb-4">
                    Profi-Koch · Zertifizierter Marketing-Manager · Sport- & Gymnastiklehrer
                  </p>
                  <div className="space-y-3 font-body text-sm text-text-secondary leading-relaxed max-w-xl">
                    <p>
                      Steakakademie.de läuft auf Next.js, Vercel und Cloudflare — ohne
                      Agentur, ohne Wartungsvertrag, ohne monatliche Kosten. Dieser Stack
                      betreibt die Seite, die du gerade liest.
                    </p>
                    <p>
                      Ich habe eine Eventküche verloren, eine Domain verloren, Systeme verloren —
                      weil sie nicht in meiner Hand lagen. Eigenregie ist die
                      Konsequenz aus diesen Erfahrungen: ein System, das dir gehört.
                    </p>
                    <p>
                      Kein theoretisches Modell. Das, was ich selbst anwende — dokumentiert,
                      reproduzierbar, übergeben.
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
                    Eigenregie
                  </h2>
                  {/* Preis und "Sofortzugang" entfernt (04.09.2026, Verifier-Befund):
                      Der Checkout fuer 695900 ist aus, die Seite sagt selbst "In
                      Vorbereitung" — eine Preisangabe mit Zugangsversprechen davor ist
                      ein Kaufversprechen ohne Kaufweg. Beides kommt mit dem Verkauf
                      zurueck; der Preis steht weiter in der courses-Tabelle. */}
                  <p className="text-sm font-sans text-text-muted mt-1">
                    Preis und Buchung folgen mit dem Verkaufsstart.
                  </p>
                </div>
                <div className="shrink-0">
                  <span
                    className="flex items-center justify-center gap-2 px-8 py-4 font-sans font-bold text-base cursor-not-allowed select-none"
                    style={{ background: 'rgba(200,136,42,0.12)', color: '#9a8a72', border: '1px solid rgba(200,136,42,0.25)' }}
                    aria-disabled="true"
                  >
                    In Vorbereitung
                  </span>
                  <p className="text-center text-[10px] font-sans text-text-muted mt-2">
                    Eigenregie wird derzeit fertiggestellt — bald buchbar.
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
                    <p className="font-body text-sm text-text-light/60 leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <section>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-content mx-auto">
              <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted mb-6">
                Alle Säulen
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Säule I — Gründer-Schmiede', href: '/gruender-schmiede', active: false },
                  { label: 'Säule II — Steuer-Matrix', href: '/steuer-matrix', active: false },
                  { label: 'Säule III — Eigenregie', href: '/eigenregie', active: true },
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
