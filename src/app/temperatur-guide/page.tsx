import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Thermometer, AlertTriangle, CheckCircle2, Clock, Flame, BookOpen } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/affiliate/ProductCard';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import { getProductsByCategory } from '@/lib/products';
import KeyFacts from '@/components/KeyFacts';
import { breadcrumbSchema, faqSchema, howToSchema } from '@/lib/schema';

// ── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Kerntemperaturen Fleisch — Tabelle 2026',
  description:
    'Kerntemperaturen für Rind, Schwein, Lamm, Geflügel und Wild — mit Garzeiten, Ruhephase und Hinweisen zur Lebensmittelsicherheit. Alles in einer Tabelle.',
  alternates: { canonical: 'https://steakakademie.de/temperatur-guide' },
  openGraph: {
    title: 'Kerntemperaturen Fleisch — Komplette Tabelle 2026',
    description:
      'Alle Kerntemperaturen für Rind, Schwein, Lamm, Geflügel und Wild. Wissenschaftlich fundiert, praxiserprobt.',
    url: 'https://steakakademie.de/temperatur-guide',
    type: 'article',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Kerntemperaturen Fleisch — Steakakademie' }],
  },
  twitter: { card: 'summary_large_image', creator: '@steakakademie' },
};

// ── Schema Data ───────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: 'Was ist die ideale Kerntemperatur für ein medium-rare Steak?',
    answer:
      '52–55 °C Kerntemperatur ergibt ein perfektes medium-rare Steak — die Steakakademie empfiehlt 54 °C, den oberen Rand dieses Korridors. Bei dieser Temperatur sind die Muskelfasern noch zart und saftig, während das Fleisch innen warm und gleichmäßig rosa ist.',
  },
  {
    question: 'Wie messe ich die Kerntemperatur richtig?',
    answer:
      'Das Thermometer wird in die dickste Stelle des Fleisches eingeführt, ohne Knochen oder Fettschichten zu berühren. Bei Steaks seitlich einstechen, nicht von oben. Ablesen erst nach 10–15 Sekunden wenn der Wert stabil ist.',
  },
  {
    question: 'Warum muss Hähnchen komplett durchgegart sein?',
    answer:
      'Geflügel kann Salmonellen und Campylobacter enthalten. Erst ab einer Kerntemperatur von 74 °C (Mindest-Haltedauer 2 Sekunden) werden diese Keime zuverlässig abgetötet. Diese Empfehlung gilt gemäß BfR (Bundesinstitut für Risikobewertung).',
  },
  {
    question: 'Was ist der Unterschied zwischen Ziel-Kerntemperatur und Ruhephase?',
    answer:
      'Beim Ruhen des Fleisches steigt die Kerntemperatur noch um 3–5 °C nach (Carryover Cooking). Für medium-rare nimmt man das Fleisch daher bereits bei 50–51 °C vom Grill. Während der Ruhephase (5–10 Minuten unter Alufolie) verteilt sich der Fleischsaft gleichmäßig.',
  },
  {
    question: 'Gilt die Kerntemperatur-Tabelle auch für den Backofen?',
    answer:
      'Ja, Kerntemperaturen gelten unabhängig von der Garmethode — Grill, Pfanne, Backofen, Sous Vide oder Smoker. Entscheidend ist die Temperatur im Inneren des Fleisches, nicht die Außentemperatur.',
  },
  {
    question: 'Ab welcher Kerntemperatur ist Schweinefleisch sicher zu essen?',
    answer:
      'Schweinefleisch ist ab einer Kerntemperatur von 63 °C (mit 3 Minuten Ruhephase) lebensmittelsicher, gemäß EFSA-Richtlinien. Bei 70 °C ist es durchgegart ohne Ruhepflicht. Roséfarbenes Schweinefleisch ist bei 63 °C unbedenklich.',
  },
];

const HOWTO_SCHEMA = howToSchema({
  name: 'Kerntemperatur richtig messen',
  description:
    'Schritt-für-Schritt-Anleitung zur präzisen Messung der Kerntemperatur bei Fleisch — für perfekte Ergebnisse und Lebensmittelsicherheit.',
  totalTime: 'PT2M',
  url: '/temperatur-guide',
  steps: [
    {
      name: 'Thermometer vorbereiten',
      text: 'Ein Sofortlesethermometer (Reaktionszeit < 3 Sekunden) oder ein Einstechthermometer mit Kabel bereithalten. Sonde auf Zimmertemperatur und sauber.',
    },
    {
      name: 'Einstichstelle bestimmen',
      text: 'Die dickste Stelle des Fleischstücks identifizieren. Bei Steaks die Seite wählen (nicht von oben stechen). Knochen, Fettränder und Höhlungen vermeiden — sie verfälschen den Messwert.',
    },
    {
      name: 'Thermometer einführen',
      text: 'Die Sonde horizontal in die Mitte des Fleisches einführen. Die Messspitze soll sich im geometrischen Zentrum befinden — dort ist die Kerntemperatur am niedrigsten.',
    },
    {
      name: 'Wert ablesen',
      text: 'Mindestens 10–15 Sekunden warten bis der Anzeigewert stabil ist. Bei Sofortlesern: 3–5 Sekunden genügen. Wert notieren.',
    },
    {
      name: 'Carryover einkalkulieren',
      text: 'Für den gewünschten Gargrad 3–5 °C abziehen (Carryover Cooking). Das Fleisch gart beim Ruhen weiter nach. Ziel: 3–5 °C unter dem gewünschten Endwert vom Grill nehmen.',
    },
  ],
});

// ── Page Component ─────────────────────────────────────────────────────────────

export default function TemperaturGuidePage() {
  const breadcrumbSch = breadcrumbSchema([
    { name: 'Wissen', url: '/wissen' },
    { name: 'Kerntemperaturen', url: '/temperatur-guide' },
  ]);
  const faqSch = faqSchema(FAQ_ITEMS);

  // Echte Thermometer-Empfehlungen aus der Produkt-Registry (statt statischer Texte).
  // Bewusst nur Mainstream-Amazon.de-Produkte mit Deep-Link:
  // MEATER 2 Plus (Funk-Premium) · Inkbird IBT-4XS (Budget) · Inkbird IBBQ-4T (WiFi-Mehrkanal).
  // US-/Eigenvertrieb-ASINs (Thermapen ONE, ThermoWorks Signals) bleiben Suchlink → hier nicht gefeatured.
  // Fallback auf die ersten drei Thermometer, falls eine ID fehlt.
  const thermometers = getProductsByCategory('thermometer');
  const preferredIds = ['meater-2-plus', 'inkbird-ibt-4xs', 'inkbird-ibbq-4t'];
  const picked = preferredIds
    .map((id) => thermometers.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const thermometerPicks = (
    picked.length >= 2
      ? picked
      : thermometers.slice(0, 3)
  ).slice(0, 3);

  return (
    <>
      <Header />

      {/* JSON-LD Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOWTO_SCHEMA) }} />

      <main className="bg-surface-base">

        {/* ── Hero / Silo-Header ──────────────────────────────────────────── */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/methoden" className="hover:text-brand-gold transition-colors">Wissen</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Kerntemperaturen</span>
            </nav>

            <div className="max-w-3xl">
              {/* Kicker */}
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Referenz & Pillar Page
              </span>

              {/* H1 */}
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5">
                Kerntemperaturen Fleisch —<br className="hidden sm:block" />
                Die komplette Referenz-Tabelle
              </h1>

              {/* GEO-critical intro — definitional, must be first paragraph */}
              <p className="font-body text-lg text-text-light/75 leading-relaxed mb-6">
                Die <strong className="text-text-light">Kerntemperatur</strong> ist die Temperatur im Inneren des Fleisches
                und der einzig zuverlässige Indikator für den gewünschten Gargrad und die Lebensmittelsicherheit.
                Während Farbe, Festigkeit und Zeit als Hilfsmittel dienen können, ist nur das Thermometer präzise.
              </p>

              {/* Kurz & knapp (Plan C3) — alle Werte aus data/kerntemperatur-referenz.yaml:
                  badges.beef_mr, sicherheit.*, meta.ruhen, meta.carryover, meta.messen.
                  Keine Zahl hier ohne Entsprechung dort (Regel 8c). */}
              <KeyFacts
                variant="dark"
                quelle="Werte aus der kanonischen Kerntemperatur-Referenz der Steakakademie — gemessen im dicksten Punkt, vor dem Ruhen."
                facts={[
                  { label: 'Rind, Medium Rare', value: '52–55 °C · Steakakademie-Standard 54 °C' },
                  { label: 'Schwein, Mindestwert', value: '63 °C — Lebensmittelhygiene' },
                  { label: 'Geflügel, Mindestwert', value: '72 °C — Salmonellen, immer durchgaren' },
                  { label: 'Hackfleisch, Mindestwert', value: '70 °C — durch das Wolfen sind Keime innen' },
                  { label: 'Nachziehen', value: '+2–5 °C · rund 3 °C vor Ziel vom Grill nehmen' },
                  { label: 'Ruhen', value: 'Steaks 3–5 Min., große Braten 10–20 Min.' },
                  { label: 'Richtig messen', value: 'Einstich in den dicksten Punkt, nicht am Knochen' },
                  { label: 'Low & Slow', value: '90–96 °C · Kollagen wird zu Gelatine' },
                ]}
              />

              {/* Meta strip */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-text-light/50">
                <span className="inline-flex items-center gap-1.5 bg-brand-fire/20 text-brand-fire font-bold px-3 py-1 border border-brand-fire/30">
                  <Clock size={11} />
                  Zuletzt aktualisiert: Mai 2026
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={11} className="text-brand-gold/60" />
                  Lesezeit ca. 10 Minuten
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Thermometer size={11} className="text-brand-gold/60" />
                  5 Fleischkategorien · 25+ Gargrade
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

          {/* ── Lebensmittelsicherheits-Hinweis ─────────────────────────── */}
          <div className="bg-amber-950/40 border border-amber-600/40 p-6 mb-12 flex gap-4">
            <AlertTriangle size={22} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-xs font-bold tracking-[0.12em] uppercase text-amber-400 mb-2">
                Lebensmittelsicherheits-Hinweis
              </p>
              <p className="font-body text-sm text-amber-200/80 leading-relaxed">
                Diese Temperaturangaben basieren auf den Empfehlungen des{' '}
                <strong className="text-amber-200">Bundesinstituts für Risikobewertung (BfR)</strong> und der{' '}
                <strong className="text-amber-200">Europäischen Behörde für Lebensmittelsicherheit (EFSA)</strong>.
                Für Risikogruppen (Schwangere, Immungeschwächte, Kinder, Senioren) gelten erhöhte Sicherheitsstufen —
                insbesondere bei Geflügel, Hackfleisch und Schweinefleisch ist vollständiges Durchgaren Pflicht.
                Im Zweifelsfall amtliche Empfehlungen beachten.
              </p>
            </div>
          </div>

          {/* ── Table of Contents ────────────────────────────────────────── */}
          <div className="bg-surface-card border border-border-subtle p-6 mb-14">
            <p className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-text-muted mb-4">Inhalt</p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-8">
              {[
                ['1', 'Rind & Steak — Garstufentabelle', '#rind'],
                ['2', 'Schwein', '#schwein'],
                ['3', 'Lamm', '#lamm'],
                ['4', 'Geflügel', '#gefluegel'],
                ['5', 'Wild', '#wild'],
                ['6', 'Die Ruhephase (Carryover)', '#ruhephase'],
                ['7', 'Wie messe ich richtig?', '#messen'],
                ['8', 'Thermometer-Empfehlungen', '#thermometer'],
                ['9', 'FAQ', '#faq'],
              ].map(([num, label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-brand-gold transition-colors py-0.5"
                  >
                    <span className="text-brand-gold/50 font-mono text-[10px] w-4 shrink-0">{num}</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 1: RIND & STEAK
          ═══════════════════════════════════════════════════════════════ */}
          <section id="rind" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">01</span>
              <h2 className="font-serif text-3xl font-bold text-text-primary">Rind &amp; Steak</h2>
            </div>
            <p className="font-body text-text-secondary leading-relaxed mb-8 max-w-2xl">
              Rindfleisch ist die Domäne der Garstufen-Präzision. Kein anderes Fleisch hat ein so differenziertes
              Spektrum von rare bis Pulled Beef. Die folgende Tabelle gilt für klassische Steaks (Ribeye, Entrecôte,
              Rumpsteak, T-Bone, Sirloin) und Braten gleichermaßen.
            </p>

            {/* Rind-Tabelle */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse text-sm font-sans" aria-label="Kerntemperaturen Rind und Steak">
                <thead>
                  <tr className="border-b-2 border-brand-gold/40">
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Gargrad</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Kerntemperatur</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold hidden sm:table-cell">Farbe & Textur</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold hidden md:table-cell">Empfehlung</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      grade: 'Rare / Blutig',
                      temp: '45–49 °C',
                      color: 'Außen grau, innen tiefrot, kühl im Kern, sehr saftig',
                      rec: 'Tatar-Temperatur, Carpaccio, Beef Tataki — nur bei geprüftem Fleisch',
                      highlight: false,
                    },
                    {
                      grade: 'Medium Rare',
                      temp: '52–55 °C',
                      color: 'Außen gebräunt, innen durchgehend warm rosa, saftig',
                      rec: 'Ribeye, Entrecôte, T-Bone — Steakakademie-Standard 54 °C, oberer Rand',
                      highlight: true,
                    },
                    {
                      grade: 'Medium',
                      temp: '55–60 °C',
                      color: 'Rosa Mitte, leichter Fleischsaftverlust, vollständig warm',
                      rec: 'Rumpsteak, Hüfte, Hanger Steak — guter Kompromiss',
                      highlight: false,
                    },
                    {
                      grade: 'Medium Well',
                      temp: '60–65 °C',
                      color: 'Leicht rosa Kern, kaum Fleischsaft, deutlich fester',
                      rec: 'Brisket-Vorstufe, Braten, Tafelspitz',
                      highlight: false,
                    },
                    {
                      grade: 'Well Done',
                      temp: '70+ °C',
                      color: 'Grau-braun durchgehend, trocken, Textur fest',
                      rec: 'Nur für Burger-Patties aus Hackfleisch (Pflicht: 70 °C+)',
                      highlight: false,
                    },
                    {
                      grade: 'Brisket / Pulled Beef',
                      temp: '88–95 °C',
                      color: 'Braun, Kollagen vollständig zu Gelatine, zerfallszart',
                      rec: 'Low & Slow 8–16 Stunden bei 110–130 °C — Plateauphase beachten',
                      highlight: false,
                    },
                  ].map((row, i) => (
                    <tr
                      key={row.grade}
                      className={`border-b transition-colors ${
                        row.highlight
                          ? 'border-brand-gold/30 bg-brand-gold/8'
                          : 'border-border-subtle hover:bg-surface-card'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${row.highlight ? 'text-brand-gold' : 'text-text-primary'}`}>
                          {row.grade}
                        </span>
                        {row.highlight && (
                          <span className="ml-2 text-[9px] font-bold tracking-[0.12em] uppercase text-brand-fire bg-brand-fire/15 px-1.5 py-0.5">
                            Empfohlen
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-text-primary text-base">{row.temp}</span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary hidden sm:table-cell">{row.color}</td>
                      <td className="py-3.5 px-4 text-text-muted text-xs hidden md:table-cell">{row.rec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rind — Info-Box */}
            <div className="bg-surface-card border border-border-subtle p-6">
              <h3 className="font-serif text-lg font-bold text-text-primary mb-3">
                Hackfleisch: Kerntemperatur 70 °C — keine Ausnahme
              </h3>
              <p className="font-body text-sm text-text-secondary leading-relaxed">
                Burger-Patties, Hackbraten und Frikadellen aus Rinderhack müssen eine Kerntemperatur von{' '}
                <strong className="text-text-primary">mindestens 70 °C</strong> erreichen. Beim Wolfen wird die
                Außenfläche des Fleisches (wo Keime sitzen) mit dem Innern vermischt. Was bei einem Steak (intakte
                Oberfläche) als rare unbedenklich ist, wird beim Hack zur Gesundheitsgefahr. Diese Regel gilt auch
                für selbst gemischte Burger-Blends mit Dry-Aged-Einlagen.
              </p>
            </div>
          </section>

          {/* ── LEADMAGNET, Erstkontakt ────────────────────────────────────
              Audit 15.08.2026: Diese Seite hatte auf 1.189 Zeilen keinen
              einzigen Anmeldepunkt und keinen Link auf den Spickzettel —
              obwohl sie thematisch deckungsgleich mit dem Leadmagneten ist.
              Der Link löst zugleich die Kannibalisierung zwischen
              /temperatur-guide (nachschlagen) und /kerntemperatur-spickzettel
              (ausdrucken/mitnehmen) über den Anker-Text auf. */}
          <div className="mb-16">
            <NewsletterSignup source="temperatur-guide-inline" />
            <p className="mt-3 text-center font-body text-sm text-text-secondary">
              Lieber sofort loslegen?{' '}
              <Link
                href="/kerntemperatur-spickzettel"
                className="font-semibold text-brand-fire hover:underline"
              >
                Alle Werte auf einer Seite — zum Ausdrucken
              </Link>
              .
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 2: SCHWEIN
          ═══════════════════════════════════════════════════════════════ */}
          <section id="schwein" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">02</span>
              <h2 className="font-serif text-3xl font-bold text-text-primary">Schwein</h2>
            </div>
            <p className="font-body text-text-secondary leading-relaxed mb-8 max-w-2xl">
              Die EFSA (Europäische Behörde für Lebensmittelsicherheit) hat die Sicherheitsgrenze für
              Schweinefleisch auf <strong className="text-text-primary">63 °C mit 3 Minuten Ruhephase</strong> festgelegt.
              Roséfarbenes Schweinefleisch ist bei dieser Temperatur lebensmittelsicher — ein wichtiges Umdenken
              gegenüber der früher verbreiteten Ansicht, Schwein müsse komplett grau durchgegart sein.
            </p>

            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse text-sm font-sans" aria-label="Kerntemperaturen Schwein">
                <thead>
                  <tr className="border-b-2 border-brand-gold/40">
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Stück / Zubereitung</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Kerntemperatur</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold hidden sm:table-cell">Ergebnis</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold hidden md:table-cell">Hinweis</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      cut: 'Schweinefilet (medium rosa)',
                      temp: '63 °C',
                      result: 'Rosa, sehr saftig, zart — Premiumergebnis',
                      note: 'EFSA-konform mit 3 Min. Ruhephase',
                      highlight: true,
                    },
                    {
                      cut: 'Kotelett / Nacken',
                      temp: '68–70 °C',
                      result: 'Leicht rosa bis weiß, saftig wenn nicht übergrillt',
                      note: 'Gängiger Zielwert beim Grillen',
                      highlight: false,
                    },
                    {
                      cut: 'Schnitzel / Minutensteak',
                      temp: '70 °C',
                      result: 'Durchgegart, goldbraun',
                      note: 'Dünne Stücke — Kerntemperatur schnell erreicht',
                      highlight: false,
                    },
                    {
                      cut: 'Schweinebauch / Kruste',
                      temp: '80–85 °C',
                      result: 'Weich, Fettschichten ausgebraten',
                      note: 'Kruste separat mit hoher Oberhitze',
                      highlight: false,
                    },
                    {
                      cut: 'Spareribs (Baby Back)',
                      temp: '88–90 °C',
                      result: 'Bone-pull perfekt, Fleisch löst sich sauber',
                      note: '3-2-1-Methode oder 5h bei 120 °C',
                      highlight: false,
                    },
                    {
                      cut: 'Pulled Pork (Schulter/Boston Butt)',
                      temp: '93–96 °C',
                      result: 'Kollagen zu Gelatine — zieht sich in Fasern',
                      note: 'Low & Slow 10–14h, Plateauphase bei 72–80 °C',
                      highlight: false,
                    },
                    {
                      cut: 'Schinken (gegrillt/gebacken)',
                      temp: '70–72 °C',
                      result: 'Durchgegart, aromatisch',
                      note: 'Bei Pökelware: Farbe kein Indikator — Thermometer nötig',
                      highlight: false,
                    },
                  ].map((row) => (
                    <tr
                      key={row.cut}
                      className={`border-b transition-colors ${
                        row.highlight
                          ? 'border-brand-gold/30 bg-brand-gold/8'
                          : 'border-border-subtle hover:bg-surface-card'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span className={`font-medium ${row.highlight ? 'text-brand-gold' : 'text-text-primary'}`}>
                          {row.cut}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-text-primary text-base">{row.temp}</span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary hidden sm:table-cell">{row.result}</td>
                      <td className="py-3.5 px-4 text-text-muted text-xs hidden md:table-cell">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-surface-card border border-border-subtle p-6">
              <h3 className="font-serif text-lg font-bold text-text-primary mb-3">
                Schwein rosa — der Paradigmenwechsel
              </h3>
              <p className="font-body text-sm text-text-secondary leading-relaxed">
                Jahrzehntelang galt: Schwein muss grau sein. Dieser Irrglaube stammt aus einer Zeit, in der
                Trichinose (Fadenwurm-Infektion) ein reales Risiko in der Massentierhaltung war. Moderne
                Qualitätskontrollen und die EFSA-Studie von 2011 haben gezeigt: 63 °C mit 3 Minuten Haltezeit
                ist ausreichend. Das Ergebnis: saftiges, leicht rosafarbenes Schweinefleisch — ohne
                Sicherheitsrisiko. Bei Wildschwein gelten hingegen verschärfte Regeln (siehe Abschnitt Wild).
              </p>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 3: LAMM
          ═══════════════════════════════════════════════════════════════ */}
          <section id="lamm" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">03</span>
              <h2 className="font-serif text-3xl font-bold text-text-primary">Lamm</h2>
            </div>
            <p className="font-body text-text-secondary leading-relaxed mb-8 max-w-2xl">
              Lammfleisch verträgt niedrige Kerntemperaturen hervorragend. Lammkarree, -keule und -filet
              entwickeln ihre feinen aromatischen Eigenschaften am besten zwischen 55 und 65 °C — ähnlich wie
              Rindfleisch. Well Done ist bei Lamm meist Geschmackssache, nicht Sicherheitsfrage.
            </p>

            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse text-sm font-sans" aria-label="Kerntemperaturen Lamm">
                <thead>
                  <tr className="border-b-2 border-brand-gold/40">
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Gargrad</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Kerntemperatur</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold hidden sm:table-cell">Beschreibung</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold hidden md:table-cell">Geeignete Stücke</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      grade: 'Rare',
                      temp: '52–54 °C',
                      desc: 'Tiefrot, sehr saftig — nur für frisches Qualitätslamm',
                      cuts: 'Lammfilet, kurze Stücke',
                      highlight: false,
                    },
                    {
                      grade: 'Medium Rare',
                      temp: '55–57 °C',
                      desc: 'Rosa Kern, warm, volles Aroma, perfekte Textur',
                      cuts: 'Lammkarree, Lammkotelett, Lammrücken',
                      highlight: true,
                    },
                    {
                      grade: 'Medium',
                      temp: '60–65 °C',
                      desc: 'Durchgehend rosa-grau, aromatisch, noch saftig',
                      cuts: 'Lammkeule, Lammschulter (kurzgebraten)',
                      highlight: false,
                    },
                    {
                      grade: 'Well Done',
                      temp: '70–75 °C',
                      desc: 'Vollständig gegart, intensiver Aroma-Verlust',
                      cuts: 'Lammhaxe (Schmoren), Lammschulter (geschmort)',
                      highlight: false,
                    },
                    {
                      grade: 'Geschmort / Pulled',
                      temp: '85–90 °C',
                      desc: 'Zerfallszart, Kollagen gelöst',
                      cuts: 'Lammschulter Low & Slow, Lammkeule 8h',
                      highlight: false,
                    },
                  ].map((row) => (
                    <tr
                      key={row.grade}
                      className={`border-b transition-colors ${
                        row.highlight
                          ? 'border-brand-gold/30 bg-brand-gold/8'
                          : 'border-border-subtle hover:bg-surface-card'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${row.highlight ? 'text-brand-gold' : 'text-text-primary'}`}>
                          {row.grade}
                        </span>
                        {row.highlight && (
                          <span className="ml-2 text-[9px] font-bold tracking-[0.12em] uppercase text-brand-fire bg-brand-fire/15 px-1.5 py-0.5">
                            Empfohlen
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-text-primary text-base">{row.temp}</span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary hidden sm:table-cell">{row.desc}</td>
                      <td className="py-3.5 px-4 text-text-muted text-xs hidden md:table-cell">{row.cuts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 4: GEFLÜGEL
          ═══════════════════════════════════════════════════════════════ */}
          <section id="gefluegel" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">04</span>
              <h2 className="font-serif text-3xl font-bold text-text-primary">Geflügel</h2>
            </div>
            <p className="font-body text-text-secondary leading-relaxed mb-6 max-w-2xl">
              Bei Geflügel gilt ausnahmslos: vollständiges Durchgaren ist Pflicht — ohne Ausnahmen für
              persönlichen Geschmack. Geflügel kann{' '}
              <strong className="text-text-primary">Salmonellen und Campylobacter</strong> enthalten, die erst
              bei ausreichend hoher Temperatur und Haltedauer zuverlässig abgetötet werden. Das BfR empfiehlt
              mindestens 74 °C Kerntemperatur für mindestens 2 Sekunden.
            </p>

            {/* BfR-Warnbox */}
            <div className="bg-amber-950/40 border border-amber-600/40 p-5 mb-8 flex gap-4">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-xs font-bold tracking-[0.1em] uppercase text-amber-400 mb-1">BfR-Empfehlung Geflügel</p>
                <p className="font-body text-sm text-amber-200/80 leading-relaxed">
                  Geflügelfleisch (Hühnchen, Pute, Ente, Gans, Wachtel) muss eine Kerntemperatur von{' '}
                  <strong className="text-amber-200">mindestens 74 °C für mindestens 2 Sekunden</strong> erreichen.
                  Rosafarbenes Geflügelfleisch ist kein Anzeichen für ein gewünschtes Garergebnis —
                  es ist ein Sicherheitsrisiko. Keine Ausnahmen.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse text-sm font-sans" aria-label="Kerntemperaturen Geflügel">
                <thead>
                  <tr className="border-b-2 border-brand-gold/40">
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Geflügelart / Stück</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Mindest-KT</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Ideal-KT</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold hidden sm:table-cell">Hinweis</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      bird: 'Hähnchenbrust',
                      min: '74 °C',
                      ideal: '74–76 °C',
                      note: 'Nicht überschreiten — wird trocken. Sonde in die dickste Stelle der Brust',
                    },
                    {
                      bird: 'Hähnchenschenkel / -keule',
                      min: '74 °C',
                      ideal: '80–85 °C',
                      note: 'Bindegewebe und Sehnen lösen sich erst ab 80 °C — saftiger als Brust',
                    },
                    {
                      bird: 'Ganzes Hähnchen',
                      min: '74 °C',
                      ideal: '82 °C (dickste Stelle Oberschenkel)',
                      note: 'Sonde in die Schenkelinnenseite — nicht am Knochen messen',
                    },
                    {
                      bird: 'Pute / Truthahn (Brust)',
                      min: '74 °C',
                      ideal: '77–80 °C',
                      note: 'Große Stücke: Brust und Schenkel separat messen',
                    },
                    {
                      bird: 'Pute (Schenkel)',
                      min: '74 °C',
                      ideal: '82–85 °C',
                      note: 'Überwacht separat — gart langsamer als Brust',
                    },
                    {
                      bird: 'Ente (Brust)',
                      min: '74 °C',
                      ideal: '75–78 °C',
                      note: 'Entenbrustfilet kann etwas rosa sein wenn sicherheitsrelevante 74 °C erreicht',
                    },
                    {
                      bird: 'Gans',
                      min: '74 °C',
                      ideal: '80–85 °C',
                      note: 'Schenkel immer heißer garen als Brust — getrennte Messung',
                    },
                    {
                      bird: 'Wachtel / Taube',
                      min: '74 °C',
                      ideal: '74–76 °C',
                      note: 'Kleine Vögel — schnelles Übergaren möglich, Thermometer unabdingbar',
                    },
                  ].map((row) => (
                    <tr key={row.bird} className="border-b border-border-subtle hover:bg-surface-card transition-colors">
                      <td className="py-3.5 px-4 font-medium text-text-primary">{row.bird}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-amber-400">{row.min}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-text-primary">{row.ideal}</span>
                      </td>
                      <td className="py-3.5 px-4 text-text-muted text-xs hidden sm:table-cell">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-surface-card border border-border-subtle p-6">
              <h3 className="font-serif text-lg font-bold text-text-primary mb-3">
                Warum Hähnchenbrust bei 74 °C aufhört — und nicht weitergaren sollte
              </h3>
              <p className="font-body text-sm text-text-secondary leading-relaxed">
                Hähnchenbrust ist eine der wenigen Proteinfleisch-Arten, die bei geringer Überhitzung sofort
                trocken und mehlig wird. Der Grund: wenig intramuskuläres Fett (IMF), kaum Kollagen.
                Jedes Grad über 74 °C kostet Saftigkeit. Wer Hähnchenbrust bei 80 °C serviert, serviert
                trockenes Fleisch — nicht sichereres. Das Ziel ist: exakt 74–76 °C, nicht mehr.
                Sous Vide bei 65 °C für 1,5 Stunden ist eine valide Alternative (ausreichende Pasteurisierungszeit).
              </p>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 5: WILD
          ═══════════════════════════════════════════════════════════════ */}
          <section id="wild" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">05</span>
              <h2 className="font-serif text-3xl font-bold text-text-primary">Wild</h2>
            </div>
            <p className="font-body text-text-secondary leading-relaxed mb-8 max-w-2xl">
              Wild-Fleisch zeichnet sich durch geringen Fettgehalt, intensive Aromatik und feine Textur aus.
              Hirsch und Reh tolerierten niedrige Kerntemperaturen ähnlich wie Rind. Bei Wildschwein gilt
              eine verschärfte Regel: Trichinose-Vorsorge erfordert höhere Mindesttemperaturen.
            </p>

            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse text-sm font-sans" aria-label="Kerntemperaturen Wild">
                <thead>
                  <tr className="border-b-2 border-brand-gold/40">
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Wildart / Stück</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Kerntemperatur</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold hidden sm:table-cell">Gargrad</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold hidden md:table-cell">Besonderheit</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      animal: 'Wildschwein (alle Stücke)',
                      temp: '72 °C (Mindest)',
                      grade: 'Vollständig durchgegart',
                      note: 'Trichinose-Pflichtvorsorge. Keine Ausnahmen. BfR-Empfehlung.',
                      warn: true,
                    },
                    {
                      animal: 'Reh (Rücken/Filet)',
                      temp: '55–58 °C',
                      grade: 'Medium Rare',
                      note: 'Sehr zart, kein Bindegewebe — gart schnell, Thermometer kritisch',
                      warn: false,
                    },
                    {
                      animal: 'Reh (Keule/Braten)',
                      temp: '60–65 °C',
                      grade: 'Medium',
                      note: 'Ruhephase 10 Minuten — aromatische Tiefe',
                      warn: false,
                    },
                    {
                      animal: 'Hirsch (Rücken)',
                      temp: '55–60 °C',
                      grade: 'Medium Rare bis Medium',
                      note: 'Edelstes Wild — wie Rinderfilet behandeln',
                      warn: false,
                    },
                    {
                      animal: 'Hirsch (Keule)',
                      temp: '63–68 °C',
                      grade: 'Medium bis Medium Well',
                      note: 'Niedrigtemperatur-Garen ideal: 80 °C Ofentemperatur, 4–6 Stunden',
                      warn: false,
                    },
                    {
                      animal: 'Wildente / Fasan',
                      temp: '74 °C (Mindest)',
                      grade: 'Durchgegart',
                      note: 'Wildgeflügel = BfR-Geflügel-Regel gilt',
                      warn: true,
                    },
                    {
                      animal: 'Wildhasenfleisch',
                      temp: '72–74 °C',
                      grade: 'Durchgegart',
                      note: 'Hasen-Tularämie-Vorsorge: vollständiges Durchgaren empfohlen',
                      warn: true,
                    },
                  ].map((row) => (
                    <tr key={row.animal} className="border-b border-border-subtle hover:bg-surface-card transition-colors">
                      <td className="py-3.5 px-4 font-medium text-text-primary">{row.animal}</td>
                      <td className="py-3.5 px-4">
                        <span className={`font-mono font-bold text-base ${row.warn ? 'text-amber-400' : 'text-text-primary'}`}>
                          {row.temp}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary hidden sm:table-cell">{row.grade}</td>
                      <td className="py-3.5 px-4 text-text-muted text-xs hidden md:table-cell">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-950/40 border border-amber-600/40 p-5">
              <div className="flex gap-3">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-sans text-xs font-bold tracking-[0.1em] uppercase text-amber-400 mb-1">Wildschwein — Trichinose-Pflichtvorsorge</p>
                  <p className="font-body text-sm text-amber-200/80 leading-relaxed">
                    Wildschwein muss in Deutschland vor dem Verzehr auf Trichinen untersucht werden
                    (Pflicht nach EU-Verordnung 2075/2005). Zusätzlich: vollständiges Durchgaren bei mindestens
                    72 °C tötet vorhandene Trichinen-Larven ab. Einfrieren reicht bei Wildschwein
                    <em> nicht</em> aus — anders als bei Zucht-Schweinen.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 6: RUHEPHASE
          ═══════════════════════════════════════════════════════════════ */}
          <section id="ruhephase" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">06</span>
              <h2 className="font-serif text-3xl font-bold text-text-primary">Die Ruhephase — Carryover Cooking</h2>
            </div>

            <p className="font-body text-text-secondary leading-relaxed mb-6 max-w-2xl">
              <strong className="text-text-primary">Carryover Cooking</strong> beschreibt den Temperaturanstieg
              der Kerntemperatur nach dem Abnehmen vom Grill oder aus dem Ofen. Heiße Außenschichten übertragen
              ihre Wärme weiter in den kühleren Kern — auch ohne externe Wärmequelle. Das Fleisch gart buchstäblich
              in der Ruhephase weiter.
            </p>

            <div className="bg-surface-card border border-border-subtle p-6 mb-8">
              <h3 className="font-serif text-lg font-bold text-text-primary mb-4">
                Drei Gründe für die Ruhephase
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Carryover',
                    icon: <Thermometer size={18} className="text-brand-gold" />,
                    text: 'Die Kerntemperatur steigt noch 3–8 °C nach dem Abnehmen. Bei direktem Hochhitze-Grillen mehr, beim Reverse Sear / Niedrigtemperatur weniger (unter 2 °C).',
                  },
                  {
                    title: 'Fleischsaftverteilung',
                    icon: <CheckCircle2 size={18} className="text-brand-gold" />,
                    text: 'Beim Garen kontrahieren Muskelfasern und drücken Säfte zur Mitte. Die Ruhephase erlaubt Relaxation — der Saft verteilt sich wieder gleichmäßig. Anschnitt danach: deutlich weniger Austritt.',
                  },
                  {
                    title: 'Maillard-Nachreifung',
                    icon: <Flame size={18} className="text-brand-gold" />,
                    text: 'Auf der Kruste laufen Maillard-Reaktionen bei hohen Temperaturen noch kurz weiter. Aroma und Krustencharakter vertiefen sich in den ersten 2–3 Ruheminuten.',
                  },
                ].map((item) => (
                  <div key={item.title}>
                    <div className="flex items-center gap-2 mb-2">
                      {item.icon}
                      <span className="font-sans font-bold text-sm text-text-primary">{item.title}</span>
                    </div>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ruhephase Tabelle */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse text-sm font-sans" aria-label="Ruhephase nach Fleischgröße">
                <thead>
                  <tr className="border-b-2 border-brand-gold/40">
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Fleischgröße / Stück</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold">Ruhephase</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold hidden sm:table-cell">Temperaturanstieg (Carryover)</th>
                    <th className="text-left py-3 px-4 font-bold tracking-[0.08em] uppercase text-[11px] text-brand-gold hidden md:table-cell">Abdeckung</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      size: 'Steak 2–3 cm (Minutensteak)',
                      rest: '3–5 Minuten',
                      carry: '2–4 °C',
                      cover: 'Locker mit Alufolie abdecken',
                    },
                    {
                      size: 'Steak 3–5 cm (Ribeye, T-Bone)',
                      rest: '5–8 Minuten',
                      carry: '3–5 °C',
                      cover: 'Alufolie-Zelt (nicht einwickeln, sonst schwitzt Kruste)',
                    },
                    {
                      size: 'Steak 5+ cm (Tomahawk, Côte de Bœuf)',
                      rest: '8–12 Minuten',
                      carry: '4–6 °C',
                      cover: 'Alufolie-Zelt + warm stellen (50 °C Backofen)',
                    },
                    {
                      size: 'Braten 1–2 kg',
                      rest: '15–20 Minuten',
                      carry: '5–8 °C',
                      cover: 'In Alufolie wickeln + Handtuch darum',
                    },
                    {
                      size: 'Brisket / Pulled Pork 3–6 kg',
                      rest: '45–90 Minuten',
                      carry: '2–5 °C (bei 100–130 °C Gartemperatur)',
                      cover: 'In Metzgerpapier (Butcher Paper) oder Folie, in Kühlbox legen',
                    },
                    {
                      size: 'Ganzes Hähnchen',
                      rest: '5–10 Minuten',
                      carry: '3–5 °C',
                      cover: 'Nur locker — Kruspel-Haut nicht einwickeln',
                    },
                  ].map((row) => (
                    <tr key={row.size} className="border-b border-border-subtle hover:bg-surface-card transition-colors">
                      <td className="py-3.5 px-4 font-medium text-text-primary">{row.size}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-brand-gold">{row.rest}</span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary hidden sm:table-cell">{row.carry}</td>
                      <td className="py-3.5 px-4 text-text-muted text-xs hidden md:table-cell">{row.cover}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-surface-card border border-brand-gold/25 p-6">
              <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-brand-gold mb-3">
                Praktische Konsequenz: Abzugstemperaturen
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Ziel: Medium Rare', pull: '50–51 °C', final: '52–55 °C' },
                  { label: 'Ziel: Medium', pull: '53–55 °C', final: '55–60 °C' },
                  { label: 'Ziel: Medium Well', pull: '57–60 °C', final: '60–65 °C' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 bg-surface-base border border-border-subtle">
                    <p className="text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-text-muted mb-2">{item.label}</p>
                    <p className="font-mono text-xl font-bold text-brand-fire mb-1">{item.pull}</p>
                    <p className="text-[10px] font-sans text-text-muted">vom Grill nehmen</p>
                    <div className="my-2 text-text-muted/50 text-xs">↓ Ruhe</div>
                    <p className="font-mono text-lg font-bold text-brand-gold">{item.final}</p>
                    <p className="text-[10px] font-sans text-text-muted">Serviertemperatur</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 7: WIE MESSE ICH RICHTIG?
          ═══════════════════════════════════════════════════════════════ */}
          <section id="messen" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">07</span>
              <h2 className="font-serif text-3xl font-bold text-text-primary">Kerntemperatur richtig messen</h2>
            </div>

            <p className="font-body text-text-secondary leading-relaxed mb-8 max-w-2xl">
              Das präziseste Thermometer nützt nichts ohne korrekte Messtechnik. Die häufigsten Fehler:
              Messen von oben statt von der Seite, Berühren von Knochen oder Fett, zu früh ablesen.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {[
                {
                  step: '01',
                  title: 'Einstichstelle wählen',
                  text: 'Die dickste Stelle des Fleischstücks identifizieren — dort ist die Temperatur am niedrigsten und am kritischsten. Knochen und Fettränder verfälschen den Wert nach oben.',
                  good: true,
                },
                {
                  step: '02',
                  title: 'Horizontal einstechen',
                  text: 'Bei Steaks nie von oben (senkrecht) — das Thermometer passiert heiße Außenzonen und misst zu hoch. Seitlich, horizontal in die Mitte — der Messfühler soll im geometrischen Zentrum liegen.',
                  good: true,
                },
                {
                  step: '03',
                  title: '10–15 Sekunden warten',
                  text: 'Der Messwert braucht Zeit zum Stabilisieren. Sofortlesethermometer (Thermapen-Klasse): 3–5 Sekunden. Günstige Geräte: bis zu 20 Sekunden. Erst ablesen wenn der Wert nicht mehr steigt.',
                  good: true,
                },
                {
                  step: '04',
                  title: 'Carryover einkalkulieren',
                  text: '3–5 °C vor dem Zielwert vom Grill nehmen — bei Hochhitze mehr, bei Niedrigtemperatur weniger. Beim Reverse Sear reicht 1–2 °C Abzug.',
                  good: true,
                },
                {
                  step: '⚠',
                  title: 'Häufiger Fehler: Am Knochen messen',
                  text: 'Knochen leiten Wärme anders als Fleisch — sie sind oft deutlich heißer. Thermometer-Spitze immer mindestens 1–2 cm vom Knochen entfernt platzieren.',
                  good: false,
                },
                {
                  step: '⚠',
                  title: 'Häufiger Fehler: In Fettschicht messen',
                  text: 'Fett hat eine andere Wärmekapazität als Muskelfleisch. Durch die Fettschicht messen ergibt falsche Werte. Die Sonde muss im Fleischgewebe enden.',
                  good: false,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`p-5 border ${
                    item.good
                      ? 'bg-surface-card border-border-subtle'
                      : 'bg-amber-950/20 border-amber-600/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`font-mono text-xs font-bold w-8 h-8 flex items-center justify-center shrink-0 ${
                        item.good
                          ? 'bg-brand-gold/15 text-brand-gold'
                          : 'bg-amber-600/20 text-amber-400'
                      }`}
                    >
                      {item.step}
                    </span>
                    <div>
                      <h3 className={`font-sans font-bold text-sm mb-1.5 ${item.good ? 'text-text-primary' : 'text-amber-300'}`}>
                        {item.title}
                      </h3>
                      <p className="font-body text-sm text-text-secondary leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sous Vide Box */}
            <div className="bg-surface-card border border-brand-gold/25 p-6">
              <h3 className="font-serif text-lg font-bold text-text-primary mb-3">
                Sous Vide: Kerntemperatur = Badtemperatur
              </h3>
              <p className="font-body text-sm text-text-secondary leading-relaxed mb-4">
                Beim Sous-Vide-Garen entspricht die Kerntemperatur am Ende der Garzeit exakt der eingestellten
                Wassertemperatur — das ist der physikalische Vorteil der Methode. Es gibt kein Übergaren,
                kein Carryover im klassischen Sinn. Die &quot;Kerntemperatur&quot; ist daher gleichzeitig die Zieltemperatur.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs font-sans" aria-label="Sous Vide Temperaturen">
                  <thead>
                    <tr className="border-b border-brand-gold/25">
                      <th className="text-left py-2 px-3 font-bold tracking-[0.08em] uppercase text-[10px] text-brand-gold">Fleisch</th>
                      <th className="text-left py-2 px-3 font-bold tracking-[0.08em] uppercase text-[10px] text-brand-gold">Badtemperatur</th>
                      <th className="text-left py-2 px-3 font-bold tracking-[0.08em] uppercase text-[10px] text-brand-gold">Garzeit</th>
                      <th className="text-left py-2 px-3 font-bold tracking-[0.08em] uppercase text-[10px] text-brand-gold hidden sm:table-cell">Ergebnis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { meat: 'Ribeye Steak 3 cm', temp: '54 °C', time: '1,5–2 Stunden', result: 'Medium Rare perfekt' },
                      { meat: 'Hähnchenbrust', temp: '65 °C', time: '1,5 Stunden', result: 'Sicher + saftig (Pasteurisierung bei 65°/1,5h)' },
                      { meat: 'Schweinefilet', temp: '60 °C', time: '1–1,5 Stunden', result: 'Rosa, EFSA-konform' },
                      { meat: 'Lammkarree', temp: '55 °C', time: '1–1,5 Stunden', result: 'Medium Rare, perfekt rosa' },
                      { meat: 'Pulled Pork', temp: '74 °C', time: '24 Stunden', result: 'Zart, aber kein Smoke Ring' },
                    ].map((row) => (
                      <tr key={row.meat} className="border-b border-border-subtle">
                        <td className="py-2 px-3 text-text-primary font-medium">{row.meat}</td>
                        <td className="py-2 px-3 font-mono font-bold text-brand-gold">{row.temp}</td>
                        <td className="py-2 px-3 text-text-secondary">{row.time}</td>
                        <td className="py-2 px-3 text-text-muted hidden sm:table-cell">{row.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 8: THERMOMETER-EMPFEHLUNGEN
          ═══════════════════════════════════════════════════════════════ */}
          <section id="thermometer" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">08</span>
              <h2 className="font-serif text-3xl font-bold text-text-primary">Thermometer-Empfehlungen</h2>
            </div>

            <p className="font-body text-text-secondary leading-relaxed mb-8 max-w-2xl">
              Das richtige Thermometer ist die wichtigste Investition für präzises Grillen. Die Wahl hängt
              vom Grill-Stil ab: schnelle Steaks brauchen Sofortleser, Long Jobs brauchen Funk-Thermometer.
            </p>

            {/* Affiliate-Disclosure */}
            <div className="bg-surface-card border border-border-subtle p-4 mb-8 flex items-start gap-3">
              <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-text-muted bg-surface-base px-2 py-1 border border-border-subtle shrink-0">
                Affiliate-Hinweis
              </span>
              <p className="text-xs font-sans text-text-muted leading-relaxed">
                Links zu Produkten können Affiliate-Links sein. Steakakademie erhält eine kleine Provision
                ohne Mehrkosten für dich. Alle Empfehlungen basieren auf redaktioneller Beurteilung.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {thermometerPicks.map((product) => (
                <ProductCard key={product.id} product={product} variant="default" />
              ))}
            </div>

            <Link
              href="/vergleich/premium-fleischthermometer"
              className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-brand-fire hover:text-[#cc4412] transition-colors border-b border-brand-fire/40 hover:border-[#cc4412] pb-0.5"
            >
              <Thermometer size={14} />
              Zum vollständigen Fleischthermometer-Vergleich →
            </Link>
          </section>

          {/* ── LEADMAGNET, Zweitkontakt vor der FAQ ─────────────────────── */}
          <div className="mb-16">
            <NewsletterSignup
              source="temperatur-guide-vor-faq"
              eyebrow="Kostenloses Geschenk"
              headline="Die ganze Tabelle passt auf eine Seite."
              subline="Wir schicken dir den druckfertigen Kerntemperatur-Spickzettel — plus jeden Freitag ein Stück BBQ-Wissen, das bleibt. Jederzeit abbestellbar."
              cta="Spickzettel sichern"
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 9: FAQ
          ═══════════════════════════════════════════════════════════════ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">09</span>
              <h2 className="font-serif text-3xl font-bold text-text-primary">Häufige Fragen</h2>
            </div>
            <p className="font-body text-text-secondary leading-relaxed mb-8 max-w-2xl">
              Die häufigsten Fragen zur Kerntemperatur — knapp und präzise beantwortet.
            </p>

            <div className="space-y-0 border border-border-subtle">
              {FAQ_ITEMS.map((item, i) => (
                <details
                  key={i}
                  className="group border-b border-border-subtle last:border-0"
                >
                  <summary className="flex items-start justify-between gap-4 p-6 cursor-pointer list-none hover:bg-surface-card transition-colors">
                    <h3 className="font-serif text-base font-bold text-text-primary leading-snug">
                      {item.question}
                    </h3>
                    <ChevronRight
                      size={16}
                      className="text-brand-gold/60 shrink-0 mt-0.5 transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <div className="px-6 pb-6 pt-0">
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* ── Lebensmittelsicherheits-Abschluss ──────────────────────── */}
          <div className="bg-surface-card border border-border-subtle p-8 mb-12">
            <div className="flex items-start gap-4">
              <CheckCircle2 size={22} className="text-brand-gold shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif text-lg font-bold text-text-primary mb-3">
                  Quellenangaben &amp; Wissenschaftliche Grundlage
                </h3>
                <p className="font-body text-sm text-text-secondary leading-relaxed mb-4">
                  Alle Temperaturempfehlungen basieren auf folgenden Quellen:
                </p>
                <ul className="space-y-2 text-sm font-sans text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold/60 text-[10px] font-bold mt-1">→</span>
                    <span>
                      <strong className="text-text-primary">BfR (Bundesinstitut für Risikobewertung)</strong> — Empfehlungen zu Mindestgartemperaturen für Geflügel, Hackfleisch und Schweinefleisch (Stand 2024)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold/60 text-[10px] font-bold mt-1">→</span>
                    <span>
                      <strong className="text-text-primary">EFSA (European Food Safety Authority)</strong> — Scientific Opinion on the risk posed by pathogens in food of non-animal origin (2011, aktualisiert 2019)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold/60 text-[10px] font-bold mt-1">→</span>
                    <span>
                      <strong className="text-text-primary">USDA Food Safety and Inspection Service</strong> — Safe Minimum Internal Temperatures (2023)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-gold/60 text-[10px] font-bold mt-1">→</span>
                    <span>
                      <strong className="text-text-primary">EU-Verordnung (EG) Nr. 2075/2005</strong> — Trichinen-Überwachung bei Hausschweinen und Wildschweinen
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Cross-Silo-Links ─────────────────────────────────────────── */}
          <div className="pt-10 border-t border-border-subtle">
            <div className="flex items-center gap-3 mb-6">
              <Flame size={16} className="text-brand-gold" />
              <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted">
                Weiterführendes Wissen
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Reverse Sear — die präziseste Methode', href: '/methoden/reverse-sear' },
                { label: 'Fleischthermometer im Vergleich', href: '/vergleich/premium-fleischthermometer' },
                { label: 'Brisket — Plateauphase verstehen', href: '/cuts/brisket' },
                { label: 'Pulled Pork — Schritt für Schritt', href: '/cuts/pulled-pork' },
                { label: 'Maillard-Reaktion erklärt', href: '/wissen' },
                { label: 'Dry-Aging & Reifung', href: '/aging' },
                { label: 'Ribeye: Marmorierung & IMF', href: '/cuts/ribeye' },
                { label: 'Sous Vide Grundlagen', href: '/methoden' },
                { label: 'Diplom Bronze: Grundlagen', href: '/diplome' },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-sm font-sans text-text-secondary hover:text-brand-fire transition-colors flex items-center gap-1.5 py-2"
                >
                  <ChevronRight size={11} className="text-brand-gold/50 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
