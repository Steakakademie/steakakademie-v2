import Link from 'next/link';
import { Radar, ChevronRight } from 'lucide-react';

/**
 * Kontext-Einstieg in den Hofladen-Radar — auf Cut-Detailseiten (Sidebar) und
 * unter Rezepten. Server-Komponente, kein JS. Kein Affiliate, keine Werbung:
 * der Radar listet Hoefe ohne Geschaeftsbeziehung, deshalb keine Kennzeichnung.
 */
export default function HofladenHinweis({
  cut,
  variante = 'sidebar',
}: {
  /** Name des Cuts/Fleischs fuer die Ansprache, z. B. „Ribeye". */
  cut?: string;
  variante?: 'sidebar' | 'inline';
}) {
  const titel = cut ? `${cut} direkt vom Hof` : 'Fleisch direkt vom Hof';
  const text = cut
    ? `Der beste Anfang für ${cut}: ein Hof in deiner Nähe. Der Hofladen-Radar zeigt Direktvermarkter — mit Fleischangebot und Bio auf einen Blick.`
    : 'Der Hofladen-Radar zeigt Direktvermarkter in deiner Nähe — Umkreissuche nach Ort oder PLZ, Fleischangebot und Bio auf einen Blick.';

  if (variante === 'inline') {
    return (
      <aside aria-label={titel} className="my-8 flex flex-col gap-3 rounded-xl border border-brand-gold/25 bg-surface-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-brand-fire">
            <Radar size={18} />
            <h2 className="font-serif text-lg font-bold text-text-light">{titel}</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">{text}</p>
        </div>
        <Link href="/hoefe" className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-fire px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink hover:opacity-90">
          Höfe finden <ChevronRight size={14} />
        </Link>
      </aside>
    );
  }

  return (
    <div className="bg-surface-elevated border border-border-subtle p-5">
      <div className="border-t-2 border-brand-fire -mt-5 mb-3 pt-4">
        <h3 className="flex items-center gap-2 font-sans font-bold text-sm text-text-primary">
          <Radar size={14} className="text-brand-fire" /> {titel}
        </h3>
      </div>
      <p className="text-sm text-text-secondary">{text}</p>
      <Link href="/hoefe" className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand-gold hover:text-brand-fire">
        Hofladen-Radar öffnen <ChevronRight size={13} />
      </Link>
    </div>
  );
}
