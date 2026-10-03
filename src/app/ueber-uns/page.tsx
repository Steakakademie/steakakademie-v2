import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ArrowRight, Mail } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { FOUNDER_ID, ORGANIZATION_ID } from '@/lib/schema';

export const metadata: Metadata = {
  // Der erste Eindruck in der Suchergebnisliste ist die Herkunft, nicht der
  // Abschluss. Titel und Beschreibung folgen der Reihenfolge der Seite selbst:
  // erst die Praxis, dann der Nachweis.
  title: 'Uwe Yendell — 50 Jahre am Feuer',
  description:
    'Mit sieben bei der Oma angefangen, später Profi-Koch und Weber-zertifizierter Grillmeister. Wer hinter steakakademie.de steckt und warum Technik zuerst kommt.',
  alternates: { canonical: 'https://steakakademie.de/ueber-uns' },
  openGraph: {
    title: 'Uwe Yendell — 50 Jahre am Feuer',
    description:
      'Vom Kochen für die Gruppe zum Weber-zertifizierten Grillmeister. Warum auf steakakademie.de Technik vor Budget steht.',
    url: 'https://steakakademie.de/ueber-uns',
    type: 'profile',
    images: [{ url: '/images/uwe-yendell.jpg', width: 800, height: 800 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Uwe Yendell — 50 Jahre am Feuer',
    description:
      'Vom Kochen für die Gruppe zum Weber-zertifizierten Grillmeister. Warum hier Technik vor Budget steht.',
    images: ['/images/uwe-yendell.jpg'],
  },
};

// Kanonische Person-Entität für Uwe. Organization.founder, die Artikel-
// Autorschaft und /autoren/uwe-yendell referenzieren nur noch diese @id —
// vorher existierten mehrere unverbundene "Uwe Yendell"-Blöcke, deren
// E-E-A-T-Signal sich aufgeteilt hat statt sich zu addieren.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': FOUNDER_ID,
  name: 'Uwe Yendell',
  jobTitle: 'Weber-zertifizierter Grillmeister, Koch, Marketing-Manager',
  hasOccupation: [
    {
      '@type': 'Occupation',
      name: 'Geschäftsführer und Grillmeister, Genusskunst GmbH',
      occupationalCategory: 'Gastronomie / Kulinarische Weiterbildung',
      description:
        '8 Jahre Geschäftsführer der Genusskunst GmbH (Eventküche) und Leiter der dort betriebenen offiziellen Weber Grillakademie — Unterricht aller Grill-Kurs-Klassen des Programms (2013–2021).',
    },
    {
      '@type': 'Occupation',
      name: 'Mietkoch (deutschlandweit)',
      occupationalCategory: 'Gastronomie',
      description:
        'Nach der Genusskunst bis 2025 immer wieder als Mietkoch in wechselnden Küchen deutschlandweit im Einsatz — durchgehende Kochpraxis bis unmittelbar vor dem Aufbau der Steakakademie.',
    },
  ],
  url: 'https://steakakademie.de/ueber-uns',
  image: 'https://steakakademie.de/images/uwe-yendell.jpg',
  email: 'pitmaster@steakakademie.de',
  description:
    'Gründer der Steakakademie. Ausgebildeter Profi-Koch und Weber-zertifizierter Grillmeister, von 2013 bis 2021 Geschäftsführer der Genusskunst GmbH und Kursleiter der dort betriebenen Weber Grillakademie. Danach bis 2025 deutschlandweit als Mietkoch tätig. Kocht seit dem siebten Lebensjahr, seit dem Alter von vierzehn für Gruppen.',
  knowsAbout: [
    'Grillen', 'Barbecue', 'Fleischkunde', 'Cuts', 'Kerntemperaturen',
    'Reverse Sear', 'Low and Slow', 'Dry Aging',
  ],
  hasCredential: [
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'certification',
      name: 'Weber-zertifizierter Grillmeister',
    },
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'certification',
      name: 'Zertifizierter Marketing-Manager (Master-Niveau)',
    },
  ],
  address: { '@type': 'PostalAddress', addressLocality: 'Wuppertal', addressCountry: 'DE' },
  worksFor: { '@id': ORGANIZATION_ID },
  founderOf: { '@id': ORGANIZATION_ID },
  // Bewusst KEIN sameAs auf die Marken-Accounts: sameAs bedeutet "diese Entität
  // IST dieses Profil". @steakakademie sind Organisations-Profile (korrekt am
  // Organization-Schema gelistet) — sie hier zu wiederholen würde behaupten,
  // Uwe sei der Instagram-Account, und verwässert beide Entitäten.
  // Ergänzen, sobald echte Personenprofile existieren (LinkedIn/Xing/Wikidata).
};

const KOMPETENZEN = [
  {
    kicker: 'Der Koch',
    titel: 'Weber-zertifizierter Grillmeister',
    text:
      'Ausgebildeter Profi-Koch und Weber-zertifizierter Grillmeister. Von 2013 bis 2021 Geschäftsführer der Genusskunst GmbH und Kursleiter der dort betriebenen Weber Grillakademie — mit allen Klassen, die das Programm umfasst. Danach bis 2025 immer wieder deutschlandweit als Mietkoch am Herd. Handwerk, das ich selbst abgenommen bekommen habe, bevor ich es weitergegeben habe.',
  },
  {
    kicker: 'Der Marketing-Manager',
    titel: 'Zertifiziert auf Master-Niveau',
    text:
      'Intensive Marketing-Fachausbildung auf Master-Niveau, dazu Praxis in Marketing und Vertrieb: Budgets verantwortet, Kampagnen gesteuert, Agenturen briefed und hinterfragt. Ich weiß, was Agenturen Ihnen verkaufen — und was sie Ihnen schulden.',
  },
  {
    kicker: 'Der Trainer',
    titel: 'KI als Werkzeug, nicht als Hype',
    text:
      'Seit den frühen GPT-3-Tagen experimentiere ich produktiv mit KI-Tools. Nicht als Tech-Enthusiast, sondern als Unternehmer, der echte Probleme lösen will. Was funktioniert, landet im System.',
  },
] as const;

export default function UeberUnsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="bg-surface-base min-h-screen">

        {/* ── Breadcrumb ────────────────────────────────────────────── */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={11} />
            <span className="text-text-secondary">Über mich</span>
          </nav>
        </div>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div
          className="mt-6 mb-12 border-b"
          style={{
            background:  'linear-gradient(180deg, rgba(200,136,42,0.07) 0%, transparent 100%)',
            borderColor: 'rgba(200,136,42,0.12)',
          }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex flex-col md:flex-row items-start gap-10">

              {/* Foto */}
              <div className="shrink-0">
                <div
                  className="w-32 h-32 md:w-44 md:h-44 overflow-hidden"
                  style={{ border: '1px solid rgba(200,136,42,0.3)' }}
                >
                  <Image
                    src="/images/uwe-yendell.jpg"
                    alt="Uwe Yendell"
                    width={176}
                    height={176}
                    className="w-full h-full object-cover object-top"
                    priority
                  />
                </div>
              </div>

              {/* Text */}
              <div className="flex-1">
                <span
                  className="inline-block font-sans text-[10px] font-bold tracking-[0.16em] uppercase px-3 py-1 mb-4"
                  style={{
                    background: 'rgba(200,136,42,0.14)',
                    color:      '#C8882A',
                    border:     '1px solid rgba(200,136,42,0.28)',
                  }}
                >
                  Wer ich bin — und warum das relevant ist
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-light leading-tight mb-4">
                  Uwe Yendell.<br />
                  Profi-Koch, Marketing-Manager,<br className="hidden sm:block" /> KI-Pionier.{' '}
                  <span style={{ color: '#C8882A' }}>In dieser Reihenfolge.</span>
                </h1>
                {/* Weber-Credential Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold tracking-[0.14em] uppercase px-3 py-1.5"
                    style={{
                      background: 'rgba(200,136,42,0.12)',
                      color:      '#C8882A',
                      border:     '1px solid rgba(200,136,42,0.3)',
                    }}
                  >
                    ✦ Weber-zertifizierter Grillmeister
                  </span>
                  <span
                    className="inline-flex items-center font-sans text-[10px] font-bold tracking-[0.14em] uppercase px-3 py-1.5"
                    style={{
                      background: 'rgba(200,136,42,0.06)',
                      color:      'rgba(200,136,42,0.7)',
                      border:     '1px solid rgba(200,136,42,0.18)',
                    }}
                  >
                    Weber Grillakademie 2013–2021
                  </span>
                </div>
                <p className="font-body text-base text-text-secondary leading-relaxed max-w-2xl">
                  Ich bin 59, lebe in Wuppertal, und ich habe drei Karrieren hinter mir —
                  bevor ich angefangen habe, anderen zu erklären, wie das geht.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ── Inhalt ───────────────────────────────────────────────── */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-16">

          {/* Einstieg */}
          <section className="max-w-2xl">
            <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
              Das klingt nach Selbstvermarktung. Ist es auch. Aber hören Sie kurz zu,
              warum das für Sie relevant ist.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
              Die meisten Menschen, die heute Online-Kurse über Gründung, Marketing oder KI verkaufen,
              haben eines gemeinsam: Sie erklären, was sie gelesen haben. Ich erkläre, was ich
              gemacht habe — und was dabei schiefgelaufen ist.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed">
              Beides ist wichtig.
            </p>
          </section>

          {/* Herkunft — steht bewusst VOR den Kompetenz-Kacheln.
              Die Kacheln nennen Abschluesse. Dieser Abschnitt erklaert, was vor den
              Abschluessen da war. Umgekehrt liest es sich wie ein Lebenslauf,
              so herum wie eine Herleitung. */}
          <section className="max-w-2xl">
            <h2 className="font-serif text-2xl font-bold text-text-light mb-5">
              Angefangen habe ich nicht in einer Küche.
            </h2>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
              Angefangen habe ich mit sieben, bei meiner Oma. Das ist kein Kindheitsbild
              fürs Album, sondern der Ort, an dem die Hand gelernt hat, was das Auge später
              beurteilt: wann Fett klar wird, wann Fleisch aufhört nachzugeben, wann es zu
              spät ist.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
              Mit vierzehn habe ich angefangen, für eine Gruppe zu kochen. Ich lebte damals
              in einem Jugendwohnhaus, von dreizehn bis achtzehn. Kochen war dort keine
              Freizeitbeschäftigung, sondern eine Aufgabe im Haushalt vieler Menschen — mit
              dem, was da war, für die, die Hunger hatten, zu einer festen Zeit. Wer so
              anfängt, lernt zuerst Planung und Verlässlichkeit und erst danach Geschmack.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
              Gegrillt habe ich immer. Und ich war der, der etwas anderes mitbrachte.
              Während die anderen Würstchen und Schweinenacken auflegten, kamen bei mir
              Fische auf den Rost, Kaninchen, Wildfleisch. Nicht um aufzufallen, sondern
              weil mich interessierte, was diese Stücke brauchen — und weil sie oft das
              waren, was verfügbar und bezahlbar war. Genau daher stammt das, was auf
              dieser Seite{' '}
              <Link href="/cuts" className="underline" style={{ color: '#C8882A' }}>
                Cut-Kunde
              </Link>{' '}
              heißt: nicht aus einem Katalog, sondern aus dem Umgang mit Fleisch, das
              keiner sonst anfassen wollte.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
              Danach kam das Kochen für Gruppen unter wechselnden Bedingungen. Als
              Jugendbetreuer in AWO-Feriencamps. Auf Plattbodenschiffen in den Niederlanden,
              auf Reisen, die ich selbst veranstaltet habe — Kombüse statt Küche, Wetter
              statt Wandthermometer, dreißig Leute, die pünktlich essen wollen. Wer so
              kocht, kann eine Methode nicht auswendig lernen. Er muss verstehen, warum sie
              funktioniert, damit er sie umbauen kann, wenn die Umstände sich ändern.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
              Die Ausbildung zum Koch kam danach. Dann die Jahre als Mietkoch, dann die
              Weber-Grillmeister-Ausbildung und die Kursleitung an der Weber Grillakademie
              meiner eigenen Eventküche. Die Zeugnisse liegen in der richtigen Reihenfolge — nur nicht
              in der, die man erwartet. Erst die Praxis, dann der Nachweis.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed">
              <strong className="text-text-light">
                Deshalb steht auf dieser Plattform Technik vor Budget.
              </strong>{' '}
              Nicht als Verkaufsargument, sondern weil ich es nie anders kennengelernt habe.
              Ein Nacken, richtig behandelt, schlägt ein schlecht gegrilltes Filet. Das ist
              keine Meinung, das ist die Erfahrung von fünfzig Jahren am Feuer — und es ist
              der Grund, warum es diese Seite gibt.
            </p>
          </section>

          {/* Dreifach-Kompetenz */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-text-light mb-6">
              Drei Karrieren. Eine Perspektive.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {KOMPETENZEN.map((k) => (
                <div
                  key={k.kicker}
                  className="border px-5 py-6 flex flex-col"
                  style={{
                    borderColor: 'rgba(200,136,42,0.18)',
                    background:  '#1A1209',
                  }}
                >
                  <span
                    className="font-sans text-[10px] font-bold tracking-[0.14em] uppercase mb-2"
                    style={{ color: '#C8882A' }}
                  >
                    {k.kicker}
                  </span>
                  <h3 className="font-serif text-base font-bold text-text-light mb-3">
                    {k.titel}
                  </h3>
                  <p className="font-body text-sm text-text-secondary leading-relaxed flex-1">
                    {k.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Rückschläge */}
          <section className="max-w-2xl">
            <h2 className="font-serif text-2xl font-bold text-text-light mb-5">
              Was ich gelernt habe — ohne Weichzeichner.
            </h2>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
              Können und Geschäftsmodell sind zwei verschiedene Dinge. Ich habe beides
              getrennt gelernt — und manchmal auf die harte Tour.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
              <strong className="text-text-light">wuppercoach.de</strong> — ein Coaching-Angebot,
              das ich aufgebaut habe, ohne eine klare Positionierung zu haben. Gute Inhalte,
              falsche Zielgruppe, kein System. Ich habe Geld und Zeit investiert und nie
              zurückbekommen.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-6">
              <strong className="text-text-light">Genusskunst</strong> — von 2013 bis 2021
              Geschäftsführer der Genusskunst GmbH, meiner Eventküche mit angeschlossener
              Weber Grillakademie. Ich habe dort alle Grill-Kurs-Klassen unterrichtet — vom
              Einsteigerkurs bis zu den fortgeschrittenen Programmen. Dafür habe ich die
              Weber-Grillmeister-Ausbildung selbst absolviert und abgeschlossen. Personal,
              Kalkulation, Einkauf, Kurse: die Verantwortung lag bei mir. Das war echtes
              Handwerk, echte Verantwortung, echte Teilnehmer. Was nicht funktioniert hat:
              das Geschäftsmodell drumherum. Ich habe zu früh skaliert, bevor die Struktur
              stand. Das Können war real — das Timing war falsch.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-6">
              <strong className="text-text-light">Danach: Mietkoch, bis 2025.</strong>{' '}
              Ich bin nicht in die Theorie ausgewichen. Ich habe weitergekocht — als Mietkoch
              in fremden Küchen quer durch Deutschland, immer wieder, bis 2025. Fremde Geräte,
              fremde Abläufe, fremde Gäste, und das Ergebnis muss trotzdem stimmen. Wer das
              jahrelang macht, hört auf, über Fleisch zu theoretisieren.
            </p>
            <blockquote
              className="border-l-2 pl-5 py-1"
              style={{ borderColor: '#C8882A' }}
            >
              <p className="font-serif text-base italic text-text-light leading-relaxed">
                &ldquo;Ich erzähle das nicht für Sympathie. Ich erzähle es, weil das Ehrliche System
                aus diesen Fehlern entstanden ist — nicht aus Erfolgsgeschichten.&rdquo;
              </p>
            </blockquote>
          </section>

          {/* Mission */}
          <section
            className="border px-6 sm:px-8 py-8"
            style={{
              borderColor: 'rgba(200,136,42,0.2)',
              background:  'rgba(200,136,42,0.04)',
            }}
          >
            <h2 className="font-serif text-2xl font-bold text-text-light mb-5">
              Warum steakakademie.de?
            </h2>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
              steakakademie.de ist beides: mein Handwerk und mein System.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
              Das Fleisch ist echt — ich koche seit über 30 Jahren und weiß, wie ein perfektes
              Steak entsteht. Aber die Plattform ist mehr als Rezepte. Sie ist ein Beweis,
              dass man mit den richtigen Werkzeugen heute als Einzelperson eine professionelle
              digitale Präsenz aufbauen kann — ohne Agentur, ohne Investoren, ohne Vorkenntnisse
              in Webentwicklung.
            </p>
            <p className="font-body text-base text-text-secondary leading-relaxed">
              Was ich hier gelernt habe — über Gründung, Infrastruktur, KI-Tools und
              Steueroptimierung — ist das, was ich im{' '}
              <Link href="/ehrliches-system" className="underline" style={{ color: '#C8882A' }}>
                Ehrlichen System
              </Link>{' '}
              weitergebe. Kein Hochglanz. Keine Erfolgsversprechen. Nur das, was funktioniert.
            </p>
          </section>

          {/* CTA */}
          <section className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/ehrliches-system"
              className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ background: '#C8882A', color: '#0D0A06' }}
            >
              Das Ehrliche System <ArrowRight size={14} />
            </Link>
            <a
              href="mailto:pitmaster@steakakademie.de"
              className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm hover:opacity-80 transition-opacity"
              style={{
                border:     '1px solid rgba(200,136,42,0.35)',
                color:      '#C8882A',
                background: 'transparent',
              }}
            >
              <Mail size={14} />
              pitmaster@steakakademie.de
            </a>
          </section>

        </div>
      </main>

      <Footer />
    </>
  );
}
