import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Scale, AlertTriangle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allStreitfalls } from 'contentlayer/generated';
import { sichtbareArtikel } from '@/lib/redaktion';
import { collectionPageSchema, breadcrumbSchema } from '@/lib/schema';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  title: 'Streitfälle am Grill — klare Entscheidungen',
  description:
    'Salzen vorher oder nachher, Edelstahl oder Guss: die strittigen Grillfragen mit beiden Positionen und einer klaren Entscheidung aus 30 Jahren Praxis.',
  alternates: { canonical: 'https://steakakademie.de/streitfaelle' },
  openGraph: {
    images: ogImages('Streitfälle am Grill'),
    title: 'Streitfälle am Grill',
    description:
      'Die strittigen Grillfragen — beide Seiten fair dargestellt, dann eine klare Entscheidung mit der Bedingung, unter der die andere Antwort gewinnt.',
    url: 'https://steakakademie.de/streitfaelle',
    type: 'website',
  },
};

export default function StreitfaellePage() {
  // Entschiedene Faelle zuerst, danach Entwuerfe. Innerhalb jeder Gruppe neueste
  // oben. Ein Entwurf ohne Entscheidung ist der halbe Wert der Seite — er darf
  // nicht ueber einem fertigen Fall stehen.
  // sichtbareArtikel statt roher Collection (03.09.2026): Streitfaelle tragen
  // seit heute den Redaktionsvorbehalt (contentlayer.config.ts). In der
  // Entwicklung bleiben Entwuerfe lesbar, in Produktion nicht — dieselbe
  // Richtung wie bei /fleischwissen: bei einem Fehler zu wenig zeigen,
  // nicht ungepruefte KI-Texte.
  const streitfaelle = sichtbareArtikel(allStreitfalls).sort((a, b) => {
    const aDone = a.entscheidung ? 1 : 0;
    const bDone = b.entscheidung ? 1 : 0;
    if (aDone !== bDone) return bDone - aDone;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const collectionSch = collectionPageSchema(
    'Streitfälle am Grill',
    '/streitfaelle',
    'Strittige Grillfragen mit beiden Positionen und einer klaren Entscheidung aus der Praxis.',
  );

  const breadcrumbSch = breadcrumbSchema([{ name: 'Streitfälle', url: '/streitfaelle' }]);

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />

      <main>
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/45" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={12} />
            <span className="text-text-light/65">Streitfälle</span>
          </nav>
        </div>

        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <header className="max-w-content mb-12">
            <span className="category-label">Streitfälle</span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-light mt-3 mb-5 leading-tight">
              Beide Seiten. Und dann eine Entscheidung.
            </h1>
            <p className="font-body text-lg text-text-light/75 leading-relaxed">
              Bei den meisten Streitfragen am Grill hat keine Seite unrecht — beide optimieren
              etwas anderes, und keiner sagt dazu, was. Hier steht, worin jede Seite recht hat,
              worauf es tatsächlich ankommt, und was wir tun. Mit der Bedingung, unter der die
              andere Antwort gewinnt.
            </p>
          </header>

          {streitfaelle.length === 0 ? (
            <p className="font-body text-text-light/60">Noch keine Streitfälle veröffentlicht.</p>
          ) : (
            <div className="max-w-content space-y-5">
              {streitfaelle.map((s) => (
                <Link
                  key={s.slug}
                  href={s.url}
                  className="block p-6 transition-colors group"
                  style={{ border: '1px solid rgba(200,136,42,0.18)', background: 'rgba(255,255,255,0.02)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Scale size={15} className="text-brand-gold" />
                    <span className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-brand-gold">
                      {s.streitfrage}
                    </span>
                    {s.istMythos && (
                      <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold tracking-wide uppercase text-brand-fire">
                        <AlertTriangle size={11} /> Mythos
                      </span>
                    )}
                  </div>

                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-light mb-3 leading-snug group-hover:text-brand-gold transition-colors">
                    {s.title}
                  </h2>

                  <p className="font-body text-text-light/70 leading-relaxed mb-4">{s.excerpt}</p>

                  {s.entscheidung ? (
                    <p
                      className="font-body text-[0.95rem] text-text-light/85 pl-4"
                      style={{ borderLeft: '2px solid rgba(200,136,42,0.5)' }}
                    >
                      {s.merksatz}
                    </p>
                  ) : (
                    <span className="font-sans text-xs text-text-light/40">Entscheidung folgt</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
