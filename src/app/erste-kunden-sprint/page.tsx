import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight, Clock, Shield, CheckCircle,
  Target, Package, Users, MessageSquare, Phone, Mail,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  // Uwe, 02.09.2026: noindex — Gruender-Bereich ist aus der Steakakademie ausgebaut
  // (Nav/Footer seit 641b346, Sitemap seit heute). CLAUDE.md Abschnitt 10.
  robots: { index: false, follow: false },
  title: 'Erste-Kunden-Sprint — erste Aufträge in 72h',
  description:
    'Gewerbe angemeldet, Website live — und jetzt? In 72 Stunden zum ersten bezahlten Auftrag. Positionierung, Angebot, Direktansprache. Kein Marketing-Kurs.',
  alternates: { canonical: 'https://steakakademie.de/erste-kunden-sprint' },
  openGraph: {
    images: ogImages('Erste-Kunden-Sprint — Erste Aufträge in 72h'),
    title: 'Erste-Kunden-Sprint — Erste Aufträge in 72h',
    description:
      'Das System für den Übergang von "gegründet" zu "erste bezahlte Kunden". Positionierung schärfen, erstes Angebot formulieren, drei Wunschkunden direkt ansprechen.',
    url: 'https://steakakademie.de/erste-kunden-sprint',
    type: 'website',
  },
};

const DELIVERABLES = [
  {
    Icon: Target,
    title: 'Positionierung in einem Satz',
    desc: 'Wer du bist, für wen du es bist, warum ausgerechnet du — in einem Satz, den du auswendig kannst und der sofort verstanden wird. Kein Elevator Pitch. Eine klare Aussage.',
  },
  {
    Icon: Package,
    title: 'Das erste Angebot',
    desc: 'Konkret. Preisgestellt. Sofort buchbar. Kein "ich mache eigentlich alles" — sondern ein Angebot das ein spezifisches Problem löst und einen klaren Preis hat.',
  },
  {
    Icon: Users,
    title: 'Drei Wunschkunden identifizieren',
    desc: 'Keine Zielgruppen-Persona. Drei echte Menschen aus deinem Umfeld — Bekannte, Ex-Kollegen, Netzwerk-Kontakte — die von dem profitieren was du anbietest.',
  },
  {
    Icon: MessageSquare,
    title: 'Die erste Nachricht schreiben',
    desc: 'Eine direkte, persönliche Nachricht ohne Pitch, ohne Vorwort, ohne "ich wollte mal fragen ob…". Der Text, den du wirklich abschicken kannst — heute noch.',
  },
  {
    Icon: Phone,
    title: 'Das Gespräch führen',
    desc: 'Fragen statt erklären. Bedarf verstehen bevor du das Angebot nennst. Die drei Fragen, die jedes Verkaufsgespräch einfacher machen als es je war.',
  },
  {
    Icon: Mail,
    title: 'Nachfassen ohne Unbehagen',
    desc: 'Follow-up der nicht nervt — weder dich noch den anderen. Wann, wie, was schreiben. Und wann du loslässt. Das Ende des "Ich will nicht aufdringlich wirken".',
  },
];

const FAQ = [
  {
    q: 'Muss ich vorher den Gründer-Schmiede gemacht haben?',
    a: 'Nein. Der Erste-Kunden-Sprint funktioniert unabhängig — egal ob du gerade gegründet hast oder schon ein Jahr selbstständig bist und noch nicht weißt wie du an Kunden kommst.',
  },
  {
    q: 'Ich habe Hemmungen bei Direktansprache — ist das hier auch Kaltakquise?',
    a: 'Nein. Das System setzt auf Warmakquise: Menschen aus deinem bestehenden Netzwerk, nicht auf Fremde. Der psychologische Unterschied ist enorm — und die Erfolgsrate auch.',
  },
  {
    q: 'Was wenn ich noch kein fertiges Angebot habe?',
    a: 'Dann ist das der erste Schritt. Modul 2 führt dich durch die Angebotsdefinition — von "ich mache irgendwie Beratung" zu einem konkreten Paket mit Preis. Das dauert weniger als zwei Stunden.',
  },
  {
    q: 'In welchen Branchen funktioniert das?',
    a: 'Überall wo Einzelpersonen Dienstleistungen verkaufen: Berater, Trainer, Coaches, Texter, Designer, Entwickler, Handwerker, Therapeuten. Überall wo der erste Kontakt eine Entscheidung eines Menschen ist.',
  },
  {
    q: 'Was wenn nach 72 Stunden noch kein Auftrag da ist?',
    a: 'Das System liefert dir die Grundlage — Positionierung, Angebot, Nachricht, Gespräch. Aufträge entstehen durch Ausführung, nicht durch Lesen. Wer das System vollständig durchläuft und die Nachrichten wirklich abschickt, hat nach 72 Stunden mindestens ein Gespräch geführt.',
  },
];

export default async function ErsteKundenSprintPage() {
  // Preisabruf und eur() entfernt (03.09.2026): Seit die Kauf-CTAs raus sind,
  // wird kein Preis mehr angezeigt — die Supabase-Abfrage lief pro Aufruf
  // ohne Abnehmer. Der Preis steht weiterhin in der courses-Tabelle und
  // kommt mit dem Verkauf zurueck.

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Erste-Kunden-Sprint',
    description:
      'Von der Gründung zu ersten bezahlten Aufträgen in 72 Stunden. Positionierung, Angebot, Direktansprache.',
    brand: { '@type': 'Brand', name: 'Steakakademie' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      // PreOrder statt InStock (03.09.2026): Fuer diesen Sprint existiert kein
      // Digistore-Produkt, es gibt also keinen Kaufweg. InStock behauptete
      // Verfuegbarkeit. PreOrder — nicht Discontinued — weil das Angebot in
      // Vorbereitung ist und nie verkauft wurde; so haelt es auch
      // /ehrliches-system fuer die noch nicht gestarteten Saeulen.
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
              <span className="text-text-light/65">Erste-Kunden-Sprint</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Folgeprodukt zum Gründer-Schmiede
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-text-light leading-tight mb-6">
                Gegründet. Website live.<br className="hidden lg:block" />
                Jetzt die ersten Kunden.
              </h1>
              <p className="font-serif text-xl lg:text-2xl text-text-light/80 leading-relaxed mb-4">
                In 72 Stunden vom leeren Kalender zum ersten bezahlten Auftrag.
              </p>
              <p className="font-body text-base text-text-light/55 leading-relaxed mb-10 max-w-2xl">
                Positionierung schärfen. Erstes Angebot formulieren. Drei echte Menschen direkt
                ansprechen. Das Gespräch führen. Nachfassen ohne Unbehagen. Kein Marketing-Kurs.
                Kein Kaltakquise-Script. Ein System das funktioniert, wenn du es wirklich durchziehst.
              </p>

              <div className="flex flex-wrap gap-6">
                {[
                  { icon: <Clock size={14} />, text: '72 Stunden zum ersten Gespräch' },
                  { icon: <Shield size={14} />, text: 'Warmakquise — keine Fremde, kein Pitch' },
                  { icon: <CheckCircle size={14} />, text: 'Funktioniert ohne Marketing-Vorwissen' },
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
                Die Stille nach der Gründung.<br />
                Jeder kennt sie. Niemand spricht darüber.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-body text-text-secondary leading-relaxed">
                <div className="space-y-4">
                  <p>
                    Gewerbe angemeldet. Steuernummer da. Website live. Du bist offiziell
                    selbstständig. Und dann: nichts. Kein Anruf. Keine Anfrage. Nur die
                    Frage, die du dir nicht laut stellst — war das ein Fehler?
                  </p>
                  <p>
                    Der Rat den du bekommst: „Sei auf Social Media präsent.&quot; „Schreib einen
                    Blog.&quot; „Baue deine Personal Brand auf.&quot; Alles richtig. Alles langfristig.
                    Nichts davon bringt diese Woche einen Auftrag.
                  </p>
                </div>
                <div className="space-y-4">
                  <p>
                    Erste Kunden kommen nicht aus dem Algorithmus — sie kommen aus direktem
                    Kontakt. Aus einem kurzen Gespräch mit jemandem der dich kennt. Aus einer
                    Nachricht, die du heute noch schreiben könntest.
                  </p>
                  <p>
                    Das Problem ist nicht Reichweite. Das Problem ist, dass niemand dir gezeigt
                    hat wie man diesen ersten Schritt macht — direkt, ohne Pitch, ohne Unbehagen.
                    Das ist exakt das, was dieser Sprint liefert.
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
                Sechs Module. Ein Ziel: Erster Auftrag.
              </h2>
              <p className="font-body text-text-light/60 max-w-xl">
                Jedes Modul endet mit einer konkreten Aktion — nicht mit neuem Wissen,
                sondern mit einem fertigen Ergebnis.
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
                  „Erste Kunden kommen nicht aus Reichweite — sie kommen aus
                  einem direkten Gespräch, das du diese Woche noch führen kannst.&quot;
                </p>
                <footer className="mt-4 text-sm font-sans text-text-muted">
                  — Kernprinzip des Erste-Kunden-Sprints
                </footer>
              </blockquote>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  {
                    title: 'Kein Marketing-Kurs',
                    desc: 'Kein Content-Plan, kein Funnel, kein Social-Media-Kalender. Das System setzt auf direkte menschliche Kommunikation — schnell, konkret, heute noch umsetzbar.',
                  },
                  {
                    title: 'Warmakquise',
                    desc: 'Du schreibst keine Fremden an. Du sprichst Menschen an die dich kennen und von dem profitieren könnten was du anbietest. Das ist kein Pitch — das ist ein Gespräch.',
                  },
                  {
                    title: 'Einmalig',
                    desc: 'Kein Abo, kein Coaching-Paket. Du kaufst das System einmal — und kannst es so oft anwenden wie du neue Kunden brauchst.',
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
                      Ich habe eine Eventküche durch die Insolvenz verloren. Nicht wegen
                      schlechter Arbeit — wegen Corona und wegen Strukturen, die ich nicht
                      früh genug aufgebaut hatte. Danach war ich bei null.
                    </p>
                    <p>
                      Was mich wieder auf die Beine gebracht hat, war nicht ein Kurs über
                      Marketing. Es war ein direktes Gespräch mit einer Person, die meinen Wert
                      kannte — und mir den ersten Auftrag gegeben hat. Dieser Moment hat das System
                      inspiriert, das du hier kaufst.
                    </p>
                    <p>
                      Ich bin zertifizierter Marketing-Manager. Ich habe 22 Jahre als Sport- und Gymnastiklehrer
                      gearbeitet. Und ich baue steakakademie.de komplett alleine — ohne Agentur,
                      ohne Investoren. Ich weiß wie sich die Stille nach der Gründung anfühlt.
                      Ich weiß auch wie man sie beendet.
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
                    Erste-Kunden-Sprint
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
                  { label: 'Säule I — Gründer-Schmiede', href: '/gruender-schmiede', active: false },
                  { label: 'Säule II — Steuer-Matrix', href: '/steuer-matrix', active: false },
                  { label: 'Säule III — Eigenregie', href: '/eigenregie', active: false },
                  { label: 'Erste-Kunden-Sprint', href: '/erste-kunden-sprint', active: true },
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
