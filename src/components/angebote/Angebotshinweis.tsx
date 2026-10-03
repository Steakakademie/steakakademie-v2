import { ChevronRight } from 'lucide-react';
import type { Hinweis, Seitentyp } from '@/lib/angebote/typen';
import AngebotLink from './AngebotLink';

/**
 * Der eine Hinweis im Text — nach dem Wissens-Höhepunkt der Seite.
 * Die Seite wählt (hinweiseFuer), dieser Baustein zeigt nur an.
 *
 * Zwei Fassungen, nach Umgebung (Entscheidung Uwe, 02.10.2026, anhand der
 * Entwurfsbilder: „A im Rezept, B im Glossar"):
 *   randnotiz — Goldlinie, Kennzeile, ein Satz, ein Link. Für Seiten, die schon
 *               voller Kästen sind (Rezept): dort fällt die Linie auf.
 *   karte     — Rahmen, Name, Satz, Knopf. Für ruhige Seiten (Glossar): dort
 *               trägt die Karte.
 */
export type HinweisVariante = 'randnotiz' | 'karte';

const KENNZEILE = 'Aus der Steakakademie';

export default function Angebotshinweis({
  hinweis, seite, variante = 'randnotiz',
}: {
  hinweis: Hinweis | null;
  seite: Seitentyp;
  variante?: HinweisVariante;
}) {
  if (!hinweis) return null;

  if (variante === 'karte') {
    return (
      <aside
        aria-label={KENNZEILE}
        className="my-10 border border-brand-gold/30 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8"
        style={{ background: 'linear-gradient(135deg, rgba(200,136,42,0.10) 0%, rgba(232,80,24,0.04) 60%, transparent 100%)' }}
      >
        <div className="min-w-0">
          <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold">
            {KENNZEILE}
            <span className="border border-brand-gold/40 px-2 py-0.5 tracking-[0.12em] text-text-light">{hinweis.marke}</span>
          </p>
          <p className="font-serif text-xl font-bold leading-snug text-text-light">{hinweis.name}</p>
          <p className="mt-1.5 font-body text-[0.9375rem] leading-relaxed text-text-secondary">{hinweis.satz}</p>
        </div>
        <AngebotLink
          href={hinweis.url}
          angebot={hinweis.id}
          stelle="text"
          seite={seite}
          className="mt-5 inline-flex shrink-0 items-center gap-1.5 bg-brand-gold px-5 py-3 font-sans text-sm font-bold text-ink transition-opacity hover:opacity-90 sm:mt-0"
        >
          {hinweis.knopf} <ChevronRight size={16} />
        </AngebotLink>
      </aside>
    );
  }

  return (
    <aside aria-label={KENNZEILE} className="my-10 border-l-2 border-brand-gold pl-5">
      <p className="mb-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold">
        {KENNZEILE} <span className="text-text-muted">· {hinweis.marke}</span>
      </p>
      <p className="font-serif text-lg leading-snug text-text-light">{hinweis.satz}</p>
      <AngebotLink
        href={hinweis.url}
        angebot={hinweis.id}
        stelle="text"
        seite={seite}
        className="mt-2 inline-flex items-center gap-1 font-sans text-sm font-bold text-brand-gold transition-colors hover:text-brand-fire"
      >
        {hinweis.knopf} <ChevronRight size={15} />
      </AngebotLink>
    </aside>
  );
}
