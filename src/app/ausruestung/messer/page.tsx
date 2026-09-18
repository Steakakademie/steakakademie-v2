import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MesserClient from './MesserClient';
import { getProductsByCategory } from '@/lib/products';
import { breadcrumbSchema, collectionPageSchema } from '@/lib/schema';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'Messer für den Grill: Handwerk und Präzision',
  description:
    'Kochmesser, Damast-Messer und BBQ-Tranchiermesser im Überblick: Premium (Wüsthof, Güde), Damast (Miyabi, Kai Shun), Mittelklasse (F. Dick, Victorinox).',
  alternates: { canonical: 'https://steakakademie.de/ausruestung/messer' },
  openGraph: {
    images: ogImages('Messer für den Grill'),
    title: 'Messer für den Grill',
    description:
      'Deutsches Handwerk trifft japanische Präzision — 11 Messer in 4 Segmenten für Steaks, Brisket und BBQ.',
    url: 'https://steakakademie.de/ausruestung/messer',
    type: 'website',
  },
};

const SEGMENT_INFO: Record<string, { label: string; copy: string }> = {
  premium:      { label: 'Premium',       copy: 'Wüsthof, Güde, Windmühlenmesser — handgeschmiedet in Deutschland' },
  damast:       { label: 'Damast',        copy: 'Miyabi, Kai Shun, Böker — bis zu 67 Lagen, FC63-Pulverstahl-Kern' },
  mittelklasse: { label: 'Mittelklasse',  copy: 'F. Dick & Victorinox — Profi-Schärfe ohne Kompromisse beim Preis' },
  'bbq-spezial':{ label: 'BBQ-Spezial',  copy: 'Tranchiermesser & Steakmesser-Sets — zugeschnitten auf Brisket und Steak' },
};

export default function MesserPage() {
  const products = getProductsByCategory('messer');

  const breadcrumbSch = breadcrumbSchema([
    { name: 'Ausrüstung', url: '/kategorie/ausruestung' },
    { name: 'Messer', url: '/ausruestung/messer' },
  ]);

  const collectionSch = collectionPageSchema(
    'Messer für den Grill — Deutsches Handwerk & Japanische Präzision',
    '/ausruestung/messer',
    'Kochmesser, Damast-Messer und BBQ-Tranchiermesser für Steaks, Brisket und Long Cooks. Premium, Damast, Mittelklasse und BBQ-Spezialisten im Überblick.',
  );

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSch) }} />

      <main className="bg-surface-base">
        {/* Hero */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            {/* Breadcrumb */}
            <nav
              className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-6"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/50">Ausrüstung</span>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Messer</span>
            </nav>

            <div className="max-w-2xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Ausrüstung · Messer
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5">
                Messer für den Grill
              </h1>
              <p className="font-body text-lg text-text-light/70 leading-relaxed mb-8">
                Deutsches Handwerk trifft japanische Präzision. Ob Wüsthof Classic für
                die tägliche Mise en place, Miyabi 5000MCD&nbsp;67 für rasiererscharfe
                Scheiben oder Wüsthof Tranchiermesser für das perfekte Brisket-Aufschneiden
                — hier findest du das richtige Messer für deinen Stil.
              </p>

              {/* Segment-Übersicht Chips */}
              <div className="flex flex-wrap gap-3">
                {Object.entries(SEGMENT_INFO).map(([key, { label, copy }]) => (
                  <div
                    key={key}
                    className="flex flex-col gap-0.5 bg-surface-card border border-border-subtle px-4 py-2.5 text-left"
                  >
                    <span className="text-[10px] font-sans font-bold tracking-[0.14em] uppercase text-brand-gold">
                      {label}
                    </span>
                    <span className="text-xs font-sans text-text-light/55 leading-snug max-w-[180px]">
                      {copy}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Interaktiver Produktgrid mit Segment-Tabs */}
        <MesserClient products={products} />

        {/* Redaktioneller Fließtext — SEO */}
        <section className="border-t border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="max-w-content mx-auto">
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-5">
                Welches Messer für welchen Schnitt?
              </h2>
              <div className="font-body text-text-secondary leading-relaxed space-y-5 text-[1.0625rem]">
                <p>
                  Das richtige Messer beginnt beim Schnitt. Für Steaks — Ribeye, T-Bone,
                  Tomahawk — ist ein 20&thinsp;cm Kochmesser mit ausreichend Klingengewicht
                  ideal: Es zieht mit einer einzigen Schnittbewegung durch die Kruste, ohne
                  das Fleisch zu zerdrücken. Ein Solingen-Schmiedestahl wie Wüsthof&nbsp;X50CrMoV15
                  oder der Windmühlenmesser-Kohlenstoffstahl&nbsp;C75 hält eine Arbeitskante,
                  die du mit einem guten Wetzstahl schnell reaktivieren kannst.
                </p>
                <p>
                  Für Long&nbsp;Cooks — Brisket, Pulled&nbsp;Pork, Spareribs — entscheidet
                  die Klingenlänge. Ein 23&thinsp;cm Tranchiermesser (Wüsthof Classic) schneidet
                  ein volles Brisket in einem Zug. Die schmale Klinge reduziert den
                  Schneidwiderstand auf ein Minimum — Ergebnis: gleichmäßige 4–5&thinsp;mm
                  Scheiben ohne Zerreißen der Muskelstränge.
                </p>
                <p>
                  Damast-Messer (Miyabi&nbsp;5000MCD&nbsp;67, Kai&nbsp;Shun Classic) setzen
                  auf härtere Kernstähle (61–63&thinsp;HRC). Sie halten eine schärfere Arbeitskante
                  länger, sind aber spröder bei seitlicher Belastung — ideal für präzises
                  Portionieren von Filet oder Entrecôte, nicht für Knochen.
                </p>
              </div>

              {/* Interne Links */}
              <div className="mt-10 pt-8 border-t border-border-subtle">
                <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted mb-4">
                  Verwandte Guides
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Ribeye Guide — der König der Cuts', href: '/cuts/ribeye' },
                    { label: 'Brisket Guide — Kollagen & Plateauphase', href: '/cuts/brisket' },
                    { label: 'Reverse Sear — Methodik', href: '/methoden/reverse-sear' },
                    { label: 'Kerntemperaturen: Der komplette Guide', href: '/temperatur-guide' },
                    { label: 'Fleischthermometer im Vergleich', href: '/vergleich/premium-fleischthermometer' },
                    { label: 'Ausrüstung im Test — Übersicht', href: '/vergleich' },
                  ].map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-brand-fire transition-colors group py-2 border-b border-border-subtle/40 last:border-0"
                    >
                      <ChevronRight
                        size={12}
                        className="text-brand-gold opacity-60 group-hover:opacity-100 shrink-0"
                      />
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
