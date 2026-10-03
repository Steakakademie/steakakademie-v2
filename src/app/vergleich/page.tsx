import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ClipboardList, Scale, ShieldCheck } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allVergleiches } from 'contentlayer/generated';
import { collectionPageSchema, breadcrumbSchema } from '@/lib/schema';
import { ogImages } from '@/lib/og';
import { getProductsByCategory } from '@/lib/products';
import { METHODENSATZ, anzahlModelle } from '@/lib/vergleich-seite';

// 03.10.2026: Diese Seite hiess „BBQ-Ausrüstung im Praxistest“ und versprach
// selbst gekaufte, wochenlang getestete Geräte samt Messverfahren. Einen
// Testbeleg gibt es nicht. Die Vergleiche sind eine Marktübersicht nach
// Herstellerangaben — Titel, Beschreibung, Siegel und Methodik-Abschnitt sagen
// das jetzt. Wächter: src/__tests__/vergleich-keine-testbehauptung.test.ts.
export const metadata: Metadata = {
  title: 'BBQ-Ausrüstung im Vergleich — Thermometer, Grills',
  description:
    'Marktübersichten zu Fleischthermometern, Oberhitzegrills, Dry-Agern und Küchenmaschinen: nach Herstellerangaben und öffentlich zugänglichen Daten — kein eigener Gerätetest.',
  alternates: { canonical: 'https://steakakademie.de/vergleich' },
  openGraph: {
    images: ogImages('BBQ-Ausrüstung im Vergleich'),
    title: 'BBQ-Ausrüstung im Vergleich',
    description: 'Marktübersichten zu Fleischthermometern, Oberhitzegrills, Dry-Agern, Küchenmaschinen und Messern — nach Herstellerangaben, mit nachvollziehbaren Kriterien.',
    url: 'https://steakakademie.de/vergleich',
    type: 'website',
  },
};

/**
 * Die Kategorie-Karten. Die Modellzahl steht NICHT mehr hier (vorher fest:
 * 11/6/5/4/11 — die Detailseiten zeigten 5/4/3/3). Sie wird gezählt: aus den
 * Produkt-Bausteinen der Vergleichsseite bzw. aus der Registry-Kategorie.
 */
const SILO_CATEGORIES: {
  slug: string;
  label: string;
  kicker: string;
  description: string;
  icon: string;
  href?: string;
  /** Registry-Kategorie für Karten ohne eigene Vergleichsseite. */
  kategorie?: Parameters<typeof getProductsByCategory>[0];
}[] = [
  {
    slug: 'premium-fleischthermometer',
    label: 'Fleischthermometer',
    kicker: 'Kerntemperatur-Präzision',
    description:
      'Funk-Thermometer, WLAN-Sonden und Sofortlesegeräte nebeneinander: Messgenauigkeit, Sondenzahl, Hitzegrenze und App — nach den Angaben der Hersteller.',
    icon: '🌡️',
  },
  {
    slug: 'oberhitzegrill-vergleich',
    label: 'Oberhitzegrills',
    kicker: 'Kruste durch Strahlungshitze',
    description:
      'Gas- und Elektro-Oberhitzegrills im Vergleich: Brennerleistung, Temperatur laut Hersteller, Grillfläche und Einsatzort — Terrasse oder Innenraum.',
    icon: '🔥',
  },
  {
    slug: 'dry-aging-kuehlschrank-vergleich',
    label: 'Dry-Ager & Reifeschränke',
    kicker: 'Dry-Aging zu Hause',
    description:
      'Reifeschränke für zu Hause im Vergleich: Fassungsvermögen, Temperatur- und Feuchteregelung, Entkeimung und Preisklasse — nach Herstellerangaben.',
    icon: '❄️',
  },
  {
    slug: 'kuechenmaschine-vergleich',
    label: 'Küchenmaschinen',
    kicker: 'Buns, Hackfleisch, Marinaden',
    description:
      'KitchenAid Artisan und Ankarsrum im Vergleich: Motorleistung, Schüsselgröße und Zubehör wie der Fleischwolf-Aufsatz — für Burger Buns, selbst gewolftes Hackfleisch und große Marinadenmengen.',
    icon: '⚙️',
  },
  {
    slug: 'messer-ratgeber',
    label: 'Messer',
    kicker: 'Deutsches Handwerk & Damast',
    description:
      'Kochmesser, Damast-Messer und BBQ-Tranchiermesser — von Wüsthof und Güde aus Solingen bis Miyabi aus Seki/Japan. Premium, Damast, Mittelklasse und BBQ-Spezialisten in 4 Segmenten.',
    icon: '🔪',
    href: '/ausruestung/messer',
    kategorie: 'messer',
  },
];

const KRITERIEN = [
  { icon: <ClipboardList size={14} />, text: 'Nach Herstellerangaben' },
  { icon: <Scale size={14} />, text: 'Nachvollziehbare Kriterien' },
  { icon: <ShieldCheck size={14} />, text: 'Partnerlinks als Anzeige gekennzeichnet' },
];

export default function VergleichIndexPage() {
  const collectionSch = collectionPageSchema(
    'BBQ-Ausrüstung im Vergleich — Marktübersichten & Ratgeber',
    '/vergleich',
    'Marktübersichten zu Fleischthermometern, Oberhitzegrills, Dry-Agern, Küchenmaschinen und Messern — nach Herstellerangaben und öffentlich zugänglichen Daten.',
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
              <span className="text-text-light/65">Vergleiche</span>
            </nav>

            <div className="max-w-2xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Marktübersichten
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5">
                BBQ-Ausrüstung im Vergleich
              </h1>
              <p className="font-body text-lg text-text-light/70 leading-relaxed mb-4">
                Welches Thermometer, welcher Oberhitzegrill, welcher Reifeschrank passt zu dir?
                Wir stellen die Geräte nach ihren technischen Daten nebeneinander und ordnen sie
                nach Kriterien ein, die du nachprüfen kannst — vom Sofortlesethermometer bis zum
                Dry-Ager.
              </p>
              <p className="font-sans text-sm text-text-light/65 leading-relaxed mb-8" data-methodenhinweis>
                {METHODENSATZ}
              </p>

              {/* Was die Übersichten sind — keine Test-Siegel */}
              <div className="flex flex-wrap gap-5">
                {KRITERIEN.map(({ icon, text }) => (
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
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">Alle Kategorien</h2>
          <p className="text-sm font-sans text-text-muted mb-10">
            Jede Kategorie ist ein eigenes Wissens-Silo — mit Ratgeber, Vergleichstabelle und Kaufberatung.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SILO_CATEGORIES.map((cat) => {
              const content = allVergleiches.find((v) => v.slug === cat.slug);
              const linkHref = cat.href ?? `/vergleich/${cat.slug}`;
              // Gezählt, nicht behauptet: Bausteine der Vergleichsseite bzw. Registry-Kategorie.
              const modelle = content
                ? anzahlModelle(content.slug, content.body.raw)
                : cat.kategorie
                  ? getProductsByCategory(cat.kategorie).length
                  : 0;
              return (
                <Link
                  key={cat.slug}
                  href={linkHref}
                  className="group block bg-surface-card border border-border-subtle hover:border-brand-gold/40 transition-colors duration-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-3xl">{cat.icon}</span>
                    {modelle > 0 && (
                      <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted bg-surface-base px-2 py-1">
                        {modelle} Modelle
                      </span>
                    )}
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
                      {cat.href && !content ? 'Zur Übersicht' : 'Zum Vergleich'}
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
                So ordnen wir ein — und warum Ausrüstung über das Ergebnis mitentscheidet
              </h2>
              <div className="font-body text-text-secondary leading-relaxed space-y-5 text-[1.0625rem]">
                <p>
                  Die Kerntemperatur ist die einzige objektive Größe beim Grillen. Ob ein Ribeye bei
                  54 °C (medium rare) oder 62 °C (medium well) von der Hitze genommen wird, entscheidet
                  nicht der Grillmeister per Augenmaß, sondern die Messgenauigkeit seines
                  Fleischthermometers. Deshalb vergleichen wir bei Funk-Sonden und Sofortlesegeräten
                  zuerst die Genauigkeit, die der Hersteller angibt, dann Sondenzahl, Hitzegrenze und
                  Bedienung. Nachgemessen haben wir diese Angaben nicht — das sagen wir auf jeder
                  Seite dazu.
                </p>
                <p>
                  Bei Oberhitzegrills steht die Maillard-Reaktion im Fokus. Sie setzt ab ca. 140 °C
                  ein und erzeugt die charakteristischen Röstaromen aus Aminosäuren und reduzierenden
                  Zuckern. Oberhitzegrills arbeiten laut Hersteller mit Brennertemperaturen um
                  800 °C: Die Kruste entsteht in sehr kurzer Zeit, bevor die Hitze tief ins Fleisch
                  vordringt. Wir vergleichen Brennerleistung, Temperaturangabe, Grillfläche und
                  Einsatzort.
                </p>
                <p>
                  Dry-Ager und Reifeschränke ordnen wir danach ein, wie fein sich Temperatur und
                  Luftfeuchtigkeit laut Datenblatt regeln lassen. Beim Trockenreifen bauen
                  fleischeigene Enzyme bei niedrigen Plusgraden Muskelfasern ab — Resultat: Mürbe,
                  Nussigkeit, konzentrierter Fleischgeschmack. Wichtig sind eine stabile Temperatur,
                  eine relative Luftfeuchtigkeit von 75–85 % und eine Entkeimung der Umluft gegen
                  unerwünschten Schimmel.
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
