import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getAllAuthors } from '@/lib/authors';
import { breadcrumbSchema } from '@/lib/schema';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  // `absolute`: die Marke steht schon im Titel selbst — das Root-Template
  // wuerde ein zweites " | Steakakademie" anhaengen und Platz in der
  // Suchergebnis-Zeile verbrennen (Google schneidet ab ~60 Zeichen ab).
  title: { absolute: 'Unsere Autoren — Die Köpfe hinter der Steakakademie' },
  description:
    'Marco, Jonas und Elena — die redaktionellen KI-Personas der Steakakademie. Fachlich geprüft und verantwortet von Gründer Uwe Yendell.',
  alternates: { canonical: 'https://steakakademie.de/autoren' },
  openGraph: {
    images: ogImages('Unsere Autoren'),
    title: 'Unsere Autoren',
    description: 'Lerne die Experten hinter der Steakakademie kennen — Pitmaster, Enthusiast und Food-Wissenschaftlerin.',
    url: 'https://steakakademie.de/autoren',
    type: 'website',
  },
};

export default function AutorenIndexPage() {
  const authors = getAllAuthors();

  const breadcrumbSch = breadcrumbSchema([{ name: 'Autoren', url: '/autoren' }]);

  const teamSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Autoren der Steakakademie',
    // Person-Markup NUR für reale Autoren — KI-Personas nur als name+url-ListItem
    itemListElement: authors.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: a.name,
      url: `https://steakakademie.de/autoren/${a.slug}`,
      ...(a.realPerson && {
        item: {
          '@type': 'Person',
          name: a.name,
          url: `https://steakakademie.de/autoren/${a.slug}`,
          description: a.shortBio,
          knowsAbout: a.expertise,
        },
      }),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(teamSchema) }} />

      <Header />

      <main>
        {/* Hero */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-14">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">Autoren</span>
            </nav>

            <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire block mb-3">
              Steakakademie · Das Team
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-text-light leading-tight mb-4">
              Die Köpfe hinter<br className="hidden sm:block" /> der Steakakademie
            </h1>
            <p className="font-body text-lg text-text-secondary leading-relaxed max-w-2xl">
              Marco, Jonas und Elena sind unsere redaktionellen KI-Personas — jede mit eigenem Blickwinkel. Alle Inhalte werden fachlich geprüft und verantwortet von Gründer Uwe Yendell (Details im KI-Disclaimer).
            </p>
          </div>
        </section>

        {/* Author cards */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {authors.map((author) => (
              <Link
                key={author.slug}
                href={`/autoren/${author.slug}`}
                className="group bg-surface-card border border-border-subtle hover:border-brand-gold/40 transition-colors duration-200 flex flex-col"
              >
                {/* Gold top accent */}
                <div className="border-t-2 border-brand-gold" />

                <div className="p-6 flex flex-col flex-1">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-5 shrink-0 bg-gradient-to-br from-brand-gold/20 to-brand-fire/10 flex items-center justify-center border border-border-subtle">
                    <span className="font-serif text-2xl font-bold text-brand-gold">
                      {author.name[0]}
                    </span>
                  </div>

                  {/* Name + shortBio */}
                  <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-brand-fire mb-1 block">
                    Autor
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-text-primary mb-1 group-hover:text-brand-gold transition-colors">
                    {author.name}
                  </h2>
                  {author.statsLabel && (
                    <p className="text-xs font-sans font-bold text-text-muted mb-3">
                      {author.statsLabel}
                    </p>
                  )}
                  <p className="font-body text-sm text-text-secondary leading-relaxed mb-5 flex-1">
                    {author.shortBio}
                  </p>

                  {/* Expertise tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {author.expertise.slice(0, 3).map((e) => (
                      <span
                        key={e}
                        className="text-[10px] font-sans font-bold tracking-wide uppercase px-2 py-1 bg-surface-base border border-border-subtle text-text-muted"
                      >
                        {e}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-1 text-xs font-sans font-bold tracking-[0.12em] uppercase text-brand-gold group-hover:text-brand-fire transition-colors">
                    Profil ansehen
                    <ChevronRight size={13} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* E-E-A-T note */}
        <section className="border-t border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
            <p className="font-body text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
              Alle Inhalte der Steakakademie fußen auf der Praxis von Gründer Uwe Yendell und werden vor
              Veröffentlichung auf Richtigkeit geprüft. Artikel unter den Namen Marco, Jonas und Elena
              entstehen KI-unterstützt und werden fachlich von ihm verantwortet.
              Affiliate-Links sind klar gekennzeichnet —{' '}
              <Link href="/affiliate-disclosure" className="text-brand-gold hover:text-brand-fire transition-colors underline underline-offset-2">
                Offenlegung
              </Link>.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
