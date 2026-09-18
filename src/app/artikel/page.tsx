import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allArtikels } from 'contentlayer/generated';
import { sichtbareArtikel, nurVeroeffentlicht, istEntwurf } from '@/lib/redaktion';
import { ogImages } from '@/lib/og';

/** JSON-LD sicher einbetten: verhindert das Ausbrechen aus dem script-Tag. */
const ldJson = (obj: unknown) => JSON.stringify(obj).replace(/</g, '\\u003c');

/**
 * Solange kein Artikel freigegeben ist, rendert diese Seite nur den Leerzustand.
 * Eine leere Uebersicht gehoert nicht in den Index — das waere Thin Content und
 * wuerde die Route verbrennen, bevor sie Inhalt hat.
 *
 * Konditional und nicht als Schalter: Sobald der erste Artikel auf
 * reviewed: true steht, faellt das noindex beim naechsten Build von allein weg.
 * Dieselbe Bedingung steuert den Sitemap-Ausschluss in next-sitemap.config.js.
 */
export async function generateMetadata(): Promise<Metadata> {
  const leer = nurVeroeffentlicht(allArtikels).length === 0;

  return {
    title: 'Artikel — Grundlagen und Werkstattwissen',
    description:
      'Artikel der Steakakademie: Grundlagen, Technik und Werkstattwissen rund um Grill, Smoker und Fleisch — erklärt fürs Nachmachen, nicht fürs Nachschlagen.',
    alternates: { canonical: 'https://steakakademie.de/artikel' },
    ...(leer && { robots: { index: false, follow: false } }),
    openGraph: {
      images: ogImages('Artikel — Grundlagen und Werkstattwissen'),
      title: 'Artikel — Grundlagen und Werkstattwissen',
      description: 'Grundlagen, Technik und Werkstattwissen rund um Grill, Smoker und Fleisch.',
      url: 'https://steakakademie.de/artikel',
    },
  };
}

export default function ArtikelIndexPage() {
  // sichtbareArtikel: in der Entwicklung inklusive Entwuerfe, im Produktions-Build
  // faellt es auf nurVeroeffentlicht() zurueck.
  const artikel = [...sichtbareArtikel(allArtikels)].sort((a, b) =>
    Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  // Nach Reihe gruppieren, damit die Grundlagen-Werkstatt als Einheit lesbar ist.
  // Bewusst ohne Spread ueber Map.entries(): das verlangt downlevelIteration,
  // das dieses tsconfig nicht setzt. Das parallele Array haelt zugleich die
  // Reihenfolge des ersten Auftretens fest.
  type ArtikelListe = typeof artikel;
  const gruppen: Array<[string, ArtikelListe]> = [];
  const index = new Map<string, ArtikelListe>();
  for (const a of artikel) {
    const k = a.category || 'Ohne Kategorie';
    let liste = index.get(k);
    if (!liste) {
      liste = [];
      index.set(k, liste);
      gruppen.push([k, liste]);
    }
    liste.push(a);
  }

  // Schema bewusst nur aus veroeffentlichten Artikeln — ein Entwurf hat in
  // strukturierten Daten nichts verloren, auch nicht lokal.
  const veroeffentlicht = nurVeroeffentlicht(allArtikels);
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Artikel — Steakakademie',
    numberOfItems: veroeffentlicht.length,
    itemListElement: veroeffentlicht.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: a.title,
      url: `https://steakakademie.de${a.url}`,
    })),
  };

  return (
    <>
      <Header />
      {veroeffentlicht.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(itemListSchema) }}
        />
      )}

      <main className="min-h-screen bg-surface-base">
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Artikel</span>
            </nav>
            <div className="max-w-2xl">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-4">
                Artikel
              </h1>
              <p className="font-body text-base sm:text-lg text-text-light/70 leading-relaxed">
                Grundlagen, Technik und Werkstattwissen — erklärt fürs Nachmachen,
                nicht fürs Nachschlagen.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {artikel.length === 0 ? (
            <p className="font-body text-text-secondary">
              Aktuell sind keine Artikel veröffentlicht.
            </p>
          ) : (
            gruppen.map(([kategorie, liste]) => (
              <section key={kategorie} className="mb-14 last:mb-0">
                <h2 className="font-sans text-xs font-bold tracking-[0.16em] uppercase text-brand-gold mb-6">
                  {kategorie}
                </h2>

                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                  {liste.map((a: ArtikelListe[number]) => (
                    <li key={a.slug}>
                      <article className="group">
                        {istEntwurf(a) && (
                          // Nur in der Entwicklung erreichbar — im Produktions-Build
                          // ist dieser Artikel gar nicht erst in der Liste.
                          <span className="inline-block mb-2 px-2 py-0.5 font-sans text-[10px] font-bold tracking-[0.14em] uppercase border border-brand-fire text-brand-fire">
                            Entwurf · nicht veröffentlicht
                          </span>
                        )}

                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-text-primary leading-snug mb-2">
                          <Link
                            href={a.url}
                            className="transition-colors group-hover:text-brand-fire underline-offset-4 group-hover:underline decoration-2"
                          >
                            {a.title}
                          </Link>
                        </h3>

                        <p className="font-body text-[0.9375rem] leading-relaxed text-text-secondary mb-3">
                          {a.excerpt}
                        </p>

                        <div className="flex items-center gap-3 font-sans text-xs text-text-secondary/70">
                          <span>{a.formattedDate}</span>
                          {a.readingTime ? (
                            <span className="flex items-center gap-1">
                              <Clock size={11} aria-hidden="true" />
                              {a.readingTime} Min. Lesezeit
                            </span>
                          ) : null}
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
