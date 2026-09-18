import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, BookOpen } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allGlossars } from 'contentlayer/generated';
import { sichtbareArtikel } from '@/lib/redaktion';
import { breadcrumbSchema, collectionPageSchema, definedTermSetSchema } from '@/lib/schema';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  // `absolute`: die Marke steht schon im Titel selbst — das Root-Template
  // wuerde ein zweites " | Steakakademie" anhaengen und Platz in der
  // Suchergebnis-Zeile verbrennen (Google schneidet ab ~60 Zeichen ab).
  title: { absolute: 'BBQ-Glossar — Fachbegriffe der Steakakademie erklärt' },
  description:
    'Von Maillard-Reaktion bis Plateauphase: das vollständige BBQ- und Grill-Lexikon. Jeder Begriff präzise definiert — mit wissenschaftlichem Hintergrund.',
  alternates: { canonical: 'https://steakakademie.de/glossar' },
  openGraph: {
    images: ogImages('BBQ-Glossar'),
    title: 'BBQ-Glossar',
    description: 'Das komplette Fachbegriff-Lexikon für Grillmeister. Maillard-Reaktion, Reverse Sear, Dry Aging — alles erklärt.',
    url: 'https://steakakademie.de/glossar',
    type: 'website',
  },
};

const CATEGORY_ORDER = [
  'Techniken & Methoden',
  'Chemie & Physik',
  'Thermodynamik',
  'Fleischkunde',
  'Cuts & Teilstücke',
  'Reifung',
  'Würzung & Marinaden',
  'Ausrüstung',
];

export default function GlossarPage() {
  // sichtbareArtikel: in der Entwicklung inklusive Entwuerfe, im Produktions-
  // Build faellt es auf nurVeroeffentlicht() zurueck. Der Glossar-Agent legt
  // neue Begriffe als draft/false an — sie erscheinen erst nach Freigabe.
  const sorted = [...sichtbareArtikel(allGlossars)].sort((a, b) => a.title.localeCompare(b.title, 'de'));

  const byCategory = CATEGORY_ORDER.reduce<Record<string, typeof sorted>>((acc, cat) => {
    const entries = sorted.filter(g => g.category === cat);
    if (entries.length) acc[cat] = entries;
    return acc;
  }, {});

  // Kategorien ohne explizite Reihenfolge ans Ende
  for (const g of sorted) {
    if (!CATEGORY_ORDER.includes(g.category) && !byCategory[g.category]) {
      byCategory[g.category] = sorted.filter(x => x.category === g.category);
    }
  }

  const breadcrumbSch = breadcrumbSchema([{ name: 'Glossar', url: '/glossar' }]);
  const collectionSch = collectionPageSchema(
    'BBQ-Glossar — Fachbegriffe der Steakakademie',
    '/glossar',
    'Das vollständige Fachbegriff-Lexikon für Grillmeister.',
  );
  const termSetSch = definedTermSetSchema(sorted.map((g) => ({ title: g.title, url: g.url })));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(termSetSch) }} />
      <Header />
      <main className="min-h-screen" style={{ backgroundColor: '#0D0D0D' }}>

        {/* Hero */}
        <section className="border-b border-border-subtle">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <nav className="flex items-center gap-2 text-xs font-sans text-text-muted mb-6">
              <Link href="/" className="hover:text-brand-gold transition-colors">Startseite</Link>
              <ChevronRight size={12} className="opacity-40" />
              <span className="text-text-secondary">Glossar</span>
            </nav>
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 mt-1"
                style={{ background: 'linear-gradient(135deg, rgba(200,136,42,0.15), rgba(180,60,0,0.1))' }}
              >
                <BookOpen size={22} className="text-brand-gold" />
              </div>
              <div>
                <h1 className="font-serif text-4xl sm:text-5xl font-bold text-text-light leading-tight mb-4">
                  BBQ-Glossar
                </h1>
                <p className="font-body text-lg text-text-secondary leading-relaxed max-w-2xl">
                  Jeder Begriff präzise definiert — mit wissenschaftlichem Hintergrund und direktem Praxistipp.
                  {sorted.length > 0 && (
                    <span className="text-brand-gold ml-1">{sorted.length} Einträge.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Alphabetical Quick-Jump */}
        {sorted.length > 0 && (
          <section className="border-b border-border-subtle sticky top-0 z-10" style={{ backgroundColor: '#0D0D0D' }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 overflow-x-auto">
              <div className="flex gap-1 text-xs font-mono min-w-max">
                {Object.keys(byCategory).map(cat => (
                  <a
                    key={cat}
                    href={`#${cat.toLowerCase().replace(/[^a-z]/g, '-')}`}
                    className="px-2 py-1 rounded text-text-muted hover:text-brand-gold hover:bg-brand-gold/5 transition-colors whitespace-nowrap"
                  >
                    {cat}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Entries by category */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
          {sorted.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-body text-text-muted text-lg">
                Das Glossar wird beim nächsten Build automatisch befüllt.
              </p>
              <p className="font-mono text-xs text-text-muted/50 mt-2">
                node scripts/glossary-agent.mjs
              </p>
            </div>
          ) : (
            Object.entries(byCategory).map(([category, entries]) => (
              <section key={category} id={category.toLowerCase().replace(/[^a-z]/g, '-')}>
                <h2
                  className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-brand-gold mb-5 pb-3"
                  style={{ borderBottom: '1px solid rgba(200,136,42,0.2)' }}
                >
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {entries.map(entry => (
                    <Link
                      key={entry.slug}
                      href={entry.url}
                      className="group block rounded-lg p-4 transition-colors bg-white/[0.02] border border-white/[0.06] hover:border-brand-gold/30 hover:bg-brand-gold/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-sans font-semibold text-text-light text-sm group-hover:text-brand-gold transition-colors">
                          {entry.title}
                        </span>
                        <ChevronRight size={14} className="text-brand-gold/40 group-hover:text-brand-gold shrink-0 mt-0.5 transition-colors" />
                      </div>
                      <p className="font-body text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2">
                        {entry.shortDefinition}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
