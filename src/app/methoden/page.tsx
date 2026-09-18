import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Flame, Clock } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allMethodes } from 'contentlayer/generated';
import { collectionPageSchema, breadcrumbSchema } from '@/lib/schema';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'Grilltechniken — Reverse Sear und Räuchern',
  description:
    'Grilltechniken im Detail: Reverse Sear, direktes und indirektes Grillen, Räuchern, Sous-vide. Physik, Temperaturen und Praxiswissen für jeden Grillstil.',
  alternates: { canonical: 'https://steakakademie.de/methoden' },
  openGraph: {
    images: ogImages('Grilltechniken — Methoden & Techniken'),
    title: 'Grilltechniken — Methoden & Techniken',
    description: 'Reverse Sear, Räuchern, direkt & indirekt — alle Grilltechniken mit Physik und Praxiswissen.',
    url: 'https://steakakademie.de/methoden',
    type: 'website',
  },
};

const DIFFICULTY_BADGE: Record<string, string> = {
  Einfach: 'Grundlagen',
  Mittel: 'Aufbau',
  Fortgeschritten: 'Profi',
};

export default function MethodenIndexPage() {
  const collectionSch = collectionPageSchema(
    'Grilltechniken — Reverse Sear, Räuchern & mehr',
    '/methoden',
    'Alle Grilltechniken mit Physik und Praxiswissen: Reverse Sear, direktes und indirektes Grillen, Räuchern, Sous-vide.',
  );
  const breadcrumbSch = breadcrumbSchema([{ name: 'Grilltechniken', url: '/methoden' }]);

  const methoden = [...(allMethodes ?? [])].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />

      <main className="bg-surface-base">
        {/* Silo-Header */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Grilltechniken</span>
            </nav>
            <div className="max-w-2xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Methoden &amp; Techniken
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5">
                Grilltechniken für Meister
              </h1>
              <p className="font-body text-lg text-text-light/70 leading-relaxed">
                Ob Reverse Sear, Low &amp; Slow Smoken oder die perfekte Kombination aus indirekter
                Vorgarung und direktem Finish — jede Methode folgt physikalischen Gesetzen.
                Wer sie versteht, beherrscht den Grill.
              </p>
            </div>
          </div>
        </section>

        {/* Methoden-Grid */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">Alle Grilltechniken</h2>
          <p className="text-sm font-sans text-text-muted mb-10">
            Von der Physik der Hitzeübertragung bis zur Praxis am Rost — fundiert erklärt.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {methoden.map((m) => {
              const titleMain = m.title.split(':')[0];
              return (
                <Link
                  key={m.slug}
                  href={m.url}
                  className="group block bg-surface-card border border-border-subtle hover:border-brand-gold/40 rounded-lg overflow-hidden transition-[transform,border-color] duration-200 hover:-translate-y-1"
                >
                  {/* Bild — bringt Leben in die Übersicht */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.image}
                      alt={m.imageAlt}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(180deg, rgba(15,10,6,0) 45%, rgba(15,10,6,0.85) 100%)' }}
                    />
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-sans font-bold tracking-[0.12em] uppercase rounded-full px-2.5 py-1 text-brand-gold" style={{ background: 'rgba(200,136,42,0.16)', backdropFilter: 'blur(4px)' }}>
                      {DIFFICULTY_BADGE[m.difficulty] ?? m.difficulty}
                    </span>
                    <h3 className="absolute bottom-3 left-4 right-4 font-serif text-xl font-bold text-text-light leading-snug group-hover:text-brand-gold transition-colors">
                      {titleMain}
                    </h3>
                  </div>

                  <div className="p-5">
                    <p className="text-sm font-body text-text-secondary leading-relaxed line-clamp-2 mb-4">
                      {m.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs font-sans">
                      <div className="flex items-center gap-3 text-text-muted">
                        <span className="flex items-center gap-1"><Flame size={12} className="text-brand-fire/70" />{m.difficulty}</span>
                        {m.timeMinutes && (
                          <span className="flex items-center gap-1"><Clock size={12} />{m.timeMinutes} Min.</span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-brand-fire font-semibold">
                        Zum Guide
                        <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Semantische Tiefe — Thermodynamik des Grillens */}
          <div className="bg-surface-card border border-border-subtle p-8 mb-12">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-5">
              Thermodynamik des Grillens — Warum Methoden zählen
            </h2>
            <div className="font-body text-text-secondary leading-relaxed space-y-5 text-[1.0625rem]">
              <p>
                Wärmeübertragung beim Grillen funktioniert über drei Mechanismen: <strong className="text-text-primary">Konduktion</strong>
                {' '}(direkter Kontakt, z. B. Grillrost auf Fleisch), <strong className="text-text-primary">Konvektion</strong>
                {' '}(Heißluftströmung im geschlossenen Grillraum) und <strong className="text-text-primary">Infrarot-Strahlung</strong>
                {' '}(direkte Wärmestrahlung von Glut oder Brennern). Oberhitzegrills nutzen Infrarot-Strahlung bei
                800–850 °C gezielt für maximale Maillard-Reaktion ohne den Kern zu übergaren.
              </p>
              <p>
                Die <strong className="text-text-primary">Plateauphase</strong> beim Brisket entsteht, wenn das
                verdunstende Oberflächenwasser die Kerntemperatur bei 68–76 °C für Stunden stabilisiert.
                Durch den Texas Crutch (Einwickeln in Butcher Paper oder Folie) wird die Verdunstung
                unterbunden — die Plateauphase verkürzt sich von 3–5 Stunden auf unter 1 Stunde.
              </p>
              <p>
                <strong className="text-text-primary">Carry-over</strong> bezeichnet den Temperaturanstieg
                nach dem Abnehmen vom Grill. Je dicker das Fleisch und je höher die Grilltemperatur,
                desto größer der Anstieg: Ein 4 cm dickes Ribeye bei 300 °C direktem Grillen entwickelt
                3–5 °C Carry-over. Beim Reverse Sear (100–120 °C Ofentemperatur) ist Carry-over
                minimal — unter 2 °C. Das ist der Hauptvorteil der Methode.
              </p>
            </div>
          </div>

          {/* Cross-Silo-Links */}
          <div className="pt-8 border-t border-border-subtle">
            <div className="flex items-center gap-3 mb-6">
              <Flame size={16} className="text-brand-gold" />
              <h3 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted">
                Verknüpfte Bereiche
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Kerntemperaturen: Der Guide', href: '/temperatur-guide' },
                { label: 'Maillard-Reaktion verstehen', href: '/wissen' },
                { label: 'Ribeye: Marmorierung & IMF', href: '/cuts/ribeye' },
                { label: 'Brisket: Plateauphase', href: '/cuts/brisket' },
                { label: 'Fleischthermometer im Test', href: '/vergleich/premium-fleischthermometer' },
                { label: 'Oberhitzegrill-Vergleich', href: '/vergleich/oberhitzegrill-vergleich' },
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
        </section>
      </main>
      <Footer />
    </>
  );
}
