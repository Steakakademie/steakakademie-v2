import Link from 'next/link';
import { ChevronRight, RotateCcw } from 'lucide-react';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allPersoenlichkeits } from 'contentlayer/generated';

export const metadata: Metadata = {
  title: 'BBQ-Persönlichkeiten der Grillszene',
  description: 'Lucky Maurer, Aaron Franklin, Francis Mallmann und mehr — die einflussreichsten Köche und Pitmasters der Grillszene im Porträt.',
};

/**
 * Woche-basierte Rotation — alle 2 Wochen rückt eine ANDERE Person aus dem Bestand
 * in den Fokus. Das ist ein Wechsel des Aufmachers, kein neues Porträt: Der Bestand
 * wächst dadurch nicht. Bis 03.10.2026 stand auf dieser Seite dreimal „alle zwei
 * Wochen neu vorgestellt“ — das letzte Porträt ist vom 23.05.2026, kein Workflow
 * erzeugt neue. Der Banner unten sagt deshalb nur, was die Funktion tut.
 *
 * Ohne Takt im Banner (03.10.2026, zweiter Durchgang): Die Seite wird statisch
 * gebaut (kein `revalidate`, kein `dynamic`) — `Date.now()` ist der Zeitpunkt des
 * Builds. Der Wechsel passiert also beim nächsten Deploy nach der Zwei-Wochen-
 * Grenze, nicht von selbst. „Wechselt automatisch alle 2 Wochen — heute im Fokus“
 * versprach mehr. Wer den Takt zusagen will, gibt der Seite zuerst ein `revalidate`.
 */
function getCurrentFeatured(slugs: string[]): number {
  const weeksSinceEpoch = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return Math.floor(weeksSinceEpoch / 2) % slugs.length;
}

const CATEGORY_LABELS: Record<string, string> = {
  Pitmaster: '🔥 Pitmaster',
  'TV-Persönlichkeit': '📺 TV & Media',
  YouTube: '▶️ YouTube',
  DACH: '🇩🇪 DACH',
  Wagyu: '🏅 Wagyu',
  Competition: '🏆 Competition',
  Restaurateur: '🍽️ Restaurateur',
  International: '🌍 International',
};

export default function PersoenlichkeitenPage() {
  const sorted = [...allPersoenlichkeits].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
  const featuredIndex = getCurrentFeatured(sorted.map(p => p.slug));
  const featured = sorted[featuredIndex];
  const rest = sorted.filter((_, i) => i !== featuredIndex);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">

        {/* Header */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/55 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Persönlichkeiten</span>
            </nav>
            <div className="max-w-2xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Steakakademie · Die Großen der Grillszene
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-4">
                Menschen, die das Grillen geprägt haben.
              </h1>
              <p className="font-body text-lg text-text-light/70 leading-relaxed">
                Pitmasters, Wagyu-Pioniere, Feuer-Philosophen — hier stellen wir
                Persönlichkeiten vor, die die BBQ-Welt verändert haben.
              </p>
            </div>
          </div>
        </section>

        {/* Rotation Banner */}
        <div className="bg-brand-gold/10 border-b border-brand-gold/20 px-4 py-2">
          <div className="max-w-editorial mx-auto flex items-center gap-2 text-xs font-sans text-brand-gold/70">
            <RotateCcw size={12} />
            <span>Im Fokus: <strong className="text-brand-gold">{featured?.title?.split('—')[0]?.trim()}</strong> — der Aufmacher wechselt durch den Bestand</span>
          </div>
        </div>

        {/* Featured — Person im Fokus (Rotation, siehe getCurrentFeatured) */}
        {featured && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-6">
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">
                Aktuell im Fokus
              </span>
            </div>
            <Link href={featured.url} className="group block">
              <div className="border border-brand-gold/25 bg-surface-dark overflow-hidden transition-colors hover:border-brand-gold/50">
                {/* Image placeholder */}
                <div className="h-56 bg-gradient-to-br from-surface-elevated to-surface-dark flex items-center justify-center border-b border-brand-gold/10">
                  <span className="text-8xl opacity-30">🥩</span>
                </div>
                <div className="p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-brand-fire bg-brand-fire/10 px-3 py-1">
                      {CATEGORY_LABELS[featured.category] ?? featured.category}
                    </span>
                    <span className="text-text-light/30 text-xs font-sans">{featured.nationality}</span>
                    {featured.born && <span className="text-text-light/30 text-xs font-sans">*{featured.born}</span>}
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-light mb-3 leading-tight group-hover:text-brand-gold transition-colors">
                    {featured.title}
                  </h2>
                  <p className="font-body text-text-light/60 text-base leading-relaxed mb-4 max-w-2xl">
                    {featured.excerpt}
                  </p>
                  <div className="border border-brand-gold/20 bg-brand-gold/5 px-4 py-3 inline-block mb-6">
                    <p className="text-xs font-sans text-brand-gold/70">
                      <span className="font-bold text-brand-gold">Claim to fame:</span> {featured.claim}
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-2 text-sm font-sans font-bold text-brand-gold group-hover:gap-3 transition-[gap]">
                      Vollständiges Porträt lesen
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* All personalities grid */}
        {rest.length > 0 && (
          <section className="border-t border-border-subtle py-12 px-4">
            <div className="max-w-editorial mx-auto">
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">
                Alle Porträts
              </h2>
              <p className="text-text-muted text-sm font-sans mb-8">
                {allPersoenlichkeits.length} Persönlichkeiten
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map(person => (
                  <Link key={person.slug} href={person.url} className="group block border border-border-subtle bg-surface-card hover:border-brand-gold/30 hover:bg-surface-elevated transition-colors">
                    <div className="h-32 bg-gradient-to-br from-surface-elevated to-surface-card flex items-center justify-center border-b border-border-subtle">
                      <span className="text-5xl opacity-20">🥩</span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-brand-fire">
                          {CATEGORY_LABELS[person.category] ?? person.category}
                        </span>
                        <span className="text-text-muted text-[9px] font-sans">{person.nationality}</span>
                      </div>
                      <h3 className="font-serif font-bold text-text-primary text-base leading-snug mb-2 group-hover:text-brand-gold transition-colors">
                        {person.title.split('—')[0].trim()}
                      </h3>
                      <p className="text-text-muted text-xs font-body leading-relaxed line-clamp-2">
                        {person.claim}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter CTA — 03.10.2026: ohne Takt und ohne Porträt-Zusage (der
            Wissens-Brief verschickt keine Porträts). Das Ziel war /#newsletter; eine
            Sprungmarke mit dieser id gab es nirgends, der Klick landete oben auf der
            Startseite. Jetzt die Anmeldeseite selbst. */}
        <section className="border-t border-border-subtle py-14 px-4 text-center bg-surface-dark">
          <p className="text-text-light/55 text-sm font-sans mb-2">
            Kostenlos per Mail — ohne festen Takt, ohne Spam.
          </p>
          <h3 className="font-serif text-2xl font-bold text-text-light mb-6">
            Der Wissens-Brief: BBQ-Wissen, das bleibt.
          </h3>
          <Link
            href="/newsletter"
            className="inline-flex items-center gap-2 px-8 py-4 border border-brand-gold/60 text-brand-gold font-sans font-bold tracking-[0.1em] uppercase text-sm hover:bg-brand-gold/10 transition-colors"
          >
            Zum Newsletter anmelden
            <ChevronRight size={14} />
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
