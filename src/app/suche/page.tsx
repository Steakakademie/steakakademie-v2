import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { search } from '@/lib/suche';

// ─────────────────────────────────────────────────────────────────────────────
// /suche — Volltextsuche über alle Inhalte
//
// ANLASS (26.08.2026): Das Suchformular im Header schickte seit jeher auf
// /suche?q=… — die Route existierte aber nie. Jede Site-Suche endete im 404.
// Diese Seite schließt die Lücke: serverseitige Suche über Titel, Auszug und
// Definition aller Contentlayer-Kollektionen, gerankt nach Treffer-Gewicht
// (Titel-Prefix > Titel enthält > Text enthält). Kein Client-JS nötig.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Suche',
  robots: { index: false, follow: true },
};

// Next 14: searchParams ist ein einfaches Objekt (erst Next 15 macht es zum Promise)
export default async function SuchePage(
  props: {
    searchParams: Promise<{ q?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const q = searchParams.q ?? '';
  const query = q.trim().slice(0, 80);
  const hits = query ? search(query) : [];

  return (
    <>
      <Header />
      <main className="bg-surface-base min-h-[60vh]">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-serif text-3xl font-bold text-text-light mb-6">
            {query ? <>Suche nach „{query}&ldquo;</> : 'Suche'}
          </h1>

          <form action="/suche" method="get" className="flex items-center gap-2 mb-10">
            <div className="flex items-center gap-3 flex-1 bg-surface-card border border-border-subtle px-4 py-3">
              <Search size={16} className="text-text-muted shrink-0" />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Cuts, Techniken, Rezepte, Begriffe …"
                className="w-full bg-transparent font-sans text-sm text-text-primary placeholder:text-text-muted"
                maxLength={80}
              />
            </div>
            <button
              type="submit"
              className="shrink-0 bg-brand-fire text-white font-sans text-xs font-bold tracking-widest uppercase px-5 py-3.5 hover:opacity-90 transition-opacity"
            >
              Suchen
            </button>
          </form>

          {query && hits.length === 0 && (
            <p className="font-body text-text-secondary">
              Keine Treffer. Versuch es mit einem anderen Begriff — oder stöbere im{' '}
              <Link href="/glossar" className="text-brand-fire underline">Glossar</Link> und in den{' '}
              <Link href="/rezepte" className="text-brand-fire underline">Rezepten</Link>.
            </p>
          )}

          <ul className="divide-y divide-border-subtle">
            {hits.map((h) => (
              <li key={h.url}>
                <Link href={h.url} className="group flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <span className="font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-brand-gold">
                      {h.kind}
                    </span>
                    <h2 className="font-serif text-lg font-bold text-text-light group-hover:text-brand-fire transition-colors leading-snug">
                      {h.title}
                    </h2>
                    {h.snippet && (
                      <p className="font-body text-sm text-text-secondary line-clamp-2 mt-0.5">{h.snippet}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="shrink-0 mt-2 text-text-muted group-hover:text-brand-fire transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
