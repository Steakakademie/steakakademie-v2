import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';

/**
 * Darstellung des Aktions-Teasers — ohne Datenzugriff und ohne Hooks, damit der
 * Server-Teaser (echter Stand) und die Client-Vorschau (alle Seiten) dasselbe Markup
 * nutzen. `vorschau`: Hinweisleiste und Links mit `?vorschau=1`.
 */
export interface TeaserEintrag {
  slug: string;
  href: string;
  titel: string;
  untertitel: string;
}

export default function AktionsTeaserKarten({ eintraege, vorschau = false }: { eintraege: TeaserEintrag[]; vorschau?: boolean }) {
  if (eintraege.length === 0) return null;
  return (
    <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-label="Aktuelle Themen">
      {vorschau && (
        <p className="mb-4 inline-block bg-brand-fire/10 border border-brand-fire/30 px-3 py-1 text-xs font-sans text-text-secondary">
          Vorschau — dieser Abschnitt ist erst im Saisonfenster öffentlich. Ausschalten: <code>?vorschau=0</code>
        </p>
      )}
      <div className="flex items-center gap-3 mb-5">
        <Sparkles size={22} className="text-brand-gold" aria-hidden="true" />
        <h2 className="font-serif text-2xl font-bold text-text-primary">Gerade passend</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {eintraege.map((a) => (
          <Link
            key={a.slug}
            href={a.href}
            className="group border border-border-subtle bg-surface-card p-6 hover:border-brand-gold/50 transition-colors"
          >
            <h3 className="font-serif text-xl font-bold text-text-primary mb-2 group-hover:text-brand-gold transition-colors">
              {a.titel}
            </h3>
            <p className="font-body text-sm text-text-secondary leading-relaxed mb-4">{a.untertitel}</p>
            <span className="inline-flex items-center gap-1 font-sans text-sm font-bold text-brand-gold">
              Ansehen <ChevronRight size={14} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
