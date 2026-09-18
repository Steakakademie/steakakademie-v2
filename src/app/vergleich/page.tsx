import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, FlaskConical, Star, ShieldCheck } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allVergleiches } from 'contentlayer/generated';
import { collectionPageSchema, breadcrumbSchema } from '@/lib/schema';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'BBQ-Ausrüstung im Test — Thermometer, Grills',
  description:
    'Unabhängige BBQ-Tests: Fleischthermometer, Oberhitzegrills, Dry-Ager. Jedes Produkt wochenlang im Praxiseinsatz geprüft — keine Herstellerdaten, echte Werte.',
  alternates: { canonical: 'https://steakakademie.de/vergleich' },
  openGraph: {
    images: ogImages('BBQ-Ausrüstung im Test'),
    title: 'BBQ-Ausrüstung im Test',
    description: 'Unabhängige Produkttests: Fleischthermometer, Grills, Smoker, Messer und Dry-Ager. Praxisnah getestet, ohne Herstellereinfluss.',
    url: 'https://steakakademie.de/vergleich',
    type: 'website',
  },
};

const SILO_CATEGORIES = [
  {
    slug: 'premium-fleischthermometer',
    label: 'Fleischthermometer',
    kicker: 'Kerntemperatur-Präzision',
    description:
      'Funk-Thermometer, WLAN-Sonden und Sofortmessgeräte im Vergleich. Messgenauigkeit ±0,4 °C, Reichweite bis 80 m, App-Integration — hier entscheidet der Messfühler über perfekte Garstufen.',
    count: 11,
    icon: '🌡️',
    href: undefined,
  },
  {
    slug: 'oberhitzegrill-vergleich',
    label: 'Oberhitzegrills',
    kicker: 'Maillard-Reaktion bei 800 °C',
    description:
      'Oberhitzegrills erzeugen durch Infrarot-Brenner Temperaturen bis 850 °C — die Grundvoraussetzung für die vollständige Maillard-Reaktion, knusprige Kruste und saftigen Kern bei minimalem Zeitfenster.',
    count: 6,
    icon: '🔥',
    href: undefined,
  },
  {
    slug: 'dry-aging-kuehlschrank-vergleich',
    label: 'Dry-Ager & Reifeschränke',
    kicker: 'Dry-Aging im Eigenbetrieb',
    description:
      'Kontrolliertes Trockenreifen bei 1–3 °C, 75–85 % rel. Luftfeuchtigkeit und gezielter UVC-Entkeimung. Enzymatische Autolyse über 21–90 Tage gibt dem Fleisch seine charakteristische Nussigkeit.',
    count: 5,
    icon: '❄️',
    href: undefined,
  },
  {
    slug: 'kuechenmaschine-vergleich',
    label: 'Küchenmaschinen & Fleischwölfe',
    kicker: 'Hackfleisch, Würste, Rubs',
    description:
      'Für selbst gewolftes Hackfleisch, Bratwurst-Herstellung und Trockenmarinade-Verarbeitung. Leistung ab 1.200 W, Lochscheibendurchmesser 4–8 mm, Hygienesicherheit der Schneidwerke.',
    count: 4,
    icon: '⚙️',
    href: undefined,
  },
  {
    slug: 'messer-ratgeber',
    label: 'Messer',
    kicker: 'Deutsches Handwerk & Damast',
    description:
      'Kochmesser, Damast-Messer und BBQ-Tranchiermesser — von Wüsthof und Güde aus Solingen bis Miyabi aus Seki/Japan. Premium, Damast, Mittelklasse und BBQ-Spezialisten in 4 Segmenten.',
    count: 11,
    icon: '🔪',
    href: '/ausruestung/messer',
  },
];

export default function VergleichIndexPage() {
  const collectionSch = collectionPageSchema(
    'BBQ-Ausrüstung im Test — Vergleiche & Ratgeber',
    '/vergleich',
    'Unabhängige Tests von Fleischthermometern, Grills, Smokern, Dry-Agern und Messern. Alle Produkte selbst gekauft und wochenlang im Praxiseinsatz geprüft.',
  );
  const breadcrumbSch = breadcrumbSchema([{ name: 'Vergleiche', url: '/vergleich' }]);

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />

      <main className="bg-surface-base">
        {/* Hero-Silo-Header */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Vergleiche & Tests</span>
            </nav>

            <div className="max-w-2xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Unabhängige Produkttests
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5">
                BBQ-Ausrüstung im Praxistest
              </h1>
              <p className="font-body text-lg text-text-light/70 leading-relaxed mb-8">
                Kein Herstellereinfluss. Kein Leihgerät. Jedes Produkt selbst gekauft und über
                mehrere Wochen unter Echtbedingungen getestet — vom Sofortlesethermometer mit
                ±0,4&thinsp;°C Messtolerranz bis zum Kamado-Keramikgrill mit gusseisernem Rost
                und Deflektorstein-System.
              </p>

              {/* Trust-Signale */}
              <div className="flex flex-wrap gap-5">
                {[
                  { icon: <FlaskConical size={14} />, text: '26+ Produkte getestet' },
                  { icon: <Star size={14} />, text: 'Echte Bewertungen' },
                  { icon: <ShieldCheck size={14} />, text: 'Selbst gekauft' },
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

        {/* Silo-Cluster-Grid */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">Alle Testkategorien</h2>
          <p className="text-sm font-sans text-text-muted mb-10">
            Jede Kategorie ist ein eigenes Wissens-Silo — mit Ratgeber, Vergleichstabelle und Kaufberatung.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SILO_CATEGORIES.map((cat) => {
              const content = allVergleiches.find((v) => v.slug === cat.slug);
              const linkHref = cat.href ?? `/vergleich/${cat.slug}`;
              return (
                <Link
                  key={cat.slug}
                  href={linkHref}
                  className="group block bg-surface-card border border-border-subtle hover:border-brand-gold/40 transition-colors duration-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-3xl">{cat.icon}</span>
                    <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted bg-surface-base px-2 py-1">
                      {cat.count} Modelle
                    </span>
                  </div>

                  <div className="mb-1 text-[10px] font-sans font-bold tracking-[0.14em] uppercase text-brand-fire">
                    {cat.kicker}
                  </div>
                  <h3 className="font-serif text-xl font-bold text-text-primary group-hover:text-brand-gold transition-colors mb-3">
                    {cat.label}
                  </h3>
                  <p className="text-sm font-body text-text-secondary leading-relaxed mb-4">
                    {cat.description}
                  </p>

                  {(content || cat.href) && (
                    <div className="flex items-center gap-1.5 text-xs font-sans text-brand-fire font-semibold">
                      {cat.href && !content ? 'Zur Übersicht' : 'Zum Test'}
                      <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Semantische Tiefe — Redaktioneller Fließtext für Google */}
        <section className="border-t border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="max-w-content mx-auto">
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-5">
                Unsere Testmethodik — Warum Ausrüstung über Ergebnis entscheidet
              </h2>
              <div className="font-body text-text-secondary leading-relaxed space-y-5 text-[1.0625rem]">
                <p>
                  Die Kerntemperatur ist die einzige objektive Größe beim Grillen. Ob ein Ribeye bei
                  54 °C (medium rare) oder 62 °C (medium well) von der Hitze genommen wird, entscheidet
                  nicht der Grillmeister per Augenmaß, sondern die Messgenauigkeit seines
                  Fleischthermometers. Deshalb testen wir Funk-Sonden und Sofortlesegeräte immer
                  gegen ein kalibriertes Referenzthermometer — in drei Messpunkten: Wasserbad 0 °C,
                  kochendes Wasser 100 °C, und im Praxistest am lebenden Grillobjekt.
                </p>
                <p>
                  Bei Oberhitzegrills steht die Maillard-Reaktion im Fokus. Sie setzt ab ca. 140 °C
                  ein, läuft optimal zwischen 160–180 °C auf Fleischoberflächen-Niveau und produziert
                  die charakteristischen Röstaromen aus Aminosäuren und reduzierenden Zuckern. Ein
                  Infrarot-Oberhitzegrill mit 800–850 °C Grillgutstemperatur schließt die Kruste
                  innerhalb von 60–90 Sekunden — bevor die Wärme tief ins intramuskuläre Fett
                  eindringt und das Fleisch überzieht.
                </p>
                <p>
                  Dry-Ager und Reifeschränke beurteilen wir nach ihrer Fähigkeit, die enzymatische
                  Autolyse zu kontrollieren. Natürliche Enzyme (Cathepsine, Calpaine) bauen bei 1–3 °C
                  Bindegewebe und Myofibrillen ab — Resultat: Mürbe, Nussigkeit, konzentrierter
                  Fleischgeschmack. Entscheidend sind Temperaturgradient (max. ±0,5 °C Abweichung),
                  relative Luftfeuchtigkeit (75–85 %) und UVC-Entkeimung zur Schimmelkontrolle.
                </p>
              </div>

              {/* Interne Silo-Links */}
              <div className="mt-10 pt-8 border-t border-border-subtle">
                <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted mb-4">
                  Verwandtes Wissen
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Kerntemperaturen: Der komplette Guide', href: '/temperatur-guide' },
                    { label: 'Maillard-Reaktion verstehen', href: '/wissen' },
                    { label: 'Reverse Sear — Methodik', href: '/methoden/reverse-sear' },
                    { label: 'Dry-Aging: Reifung & Enzyme', href: '/aging' },
                    { label: 'Ribeye: intramuskuläres Fett', href: '/cuts/ribeye' },
                    { label: 'Brisket: Kollagen & Plateauphase', href: '/cuts/brisket' },
                  ].map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-brand-fire transition-colors group py-2 border-b border-border-subtle/40 last:border-0"
                    >
                      <ChevronRight size={12} className="text-brand-gold opacity-60 group-hover:opacity-100 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
