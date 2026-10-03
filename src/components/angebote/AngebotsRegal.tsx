import { ChevronRight } from 'lucide-react';
import type { Hinweis, Seitentyp } from '@/lib/angebote/typen';
import AngebotLink from './AngebotLink';

/**
 * Das Regal am Seitenende: höchstens drei Angebote, die zur Seite passen.
 * Leer = der Baustein rendert nichts (Anlass statt Banner).
 */
export default function AngebotsRegal({ hinweise, seite }: { hinweise: Hinweis[]; seite: Seitentyp }) {
  if (hinweise.length === 0) return null;

  const spalten = hinweise.length === 1 ? '' : hinweise.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';

  return (
    <aside aria-label="Passt dazu — aus der Steakakademie" className="mt-12 border-t border-border-subtle pt-8">
      <p className="mb-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold">
        Aus der Steakakademie
      </p>
      <h2 className="mb-5 font-serif text-xl font-bold text-text-light">Passt dazu</h2>

      <div className={`grid grid-cols-1 gap-3 ${spalten}`}>
        {hinweise.map((h) => (
          <AngebotLink
            key={h.id}
            href={h.url}
            angebot={h.id}
            stelle="regal"
            seite={seite}
            className="group flex flex-col border border-border-subtle bg-surface-card p-4 transition-colors hover:border-brand-gold/50"
          >
            <span className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">{h.marke}</span>
            <span className="font-serif text-base font-bold leading-snug text-text-light transition-colors group-hover:text-brand-gold">
              {h.name}
            </span>
            <span className="mt-1.5 font-body text-sm leading-relaxed text-text-secondary">{h.satz}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-4 font-sans text-xs font-bold text-brand-gold">
              {h.knopf} <ChevronRight size={13} />
            </span>
          </AngebotLink>
        ))}
      </div>
    </aside>
  );
}
