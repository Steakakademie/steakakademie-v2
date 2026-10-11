import { ExternalLink } from 'lucide-react';
import type { ProduktZeile } from '@/lib/geschenke-finder';
import { REL_PARTNERLINK } from './produkt-anzeige';

/**
 * Produktzeile für Client-Bausteine (Geschenke-Finder, 11.10.2026). Link, rel und
 * Partner-Flag kommen fertig vom Server (produktLink in produkt-anzeige.ts — der Client
 * entscheidet nichts selbst); hier steht nur die Darstellung: „Anzeige" und der
 * Provisions-Satz genau dann, wenn es ein Partnerlink ist. Kein Preis (Registry-Preise
 * sind vom Mai 2026).
 */
export default function ProduktZeileClient({ p }: { p: ProduktZeile }) {
  // Sicherheitsnetz: Ein Partnerlink trägt immer das sponsored-rel aus der einen Quelle.
  const partner = p.partner && p.rel === REL_PARTNERLINK;
  return (
    <li className="border border-border-subtle bg-surface-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-sans font-bold tracking-[0.14em] uppercase text-text-muted">{p.brand}</p>
          <h4 className="font-serif text-lg font-bold text-text-primary leading-snug">{p.name}</h4>
        </div>
        {partner && (
          <span className="shrink-0 text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-text-muted border border-border-subtle px-1.5 py-0.5">
            Anzeige
          </span>
        )}
      </div>
      <p className="font-body text-sm text-text-secondary leading-relaxed mt-3">{p.warum}</p>
      <a
        href={p.href}
        target="_blank"
        rel={p.rel}
        className={`mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-bold text-brand-gold hover:text-text-primary transition-colors ${p.klickKlassen}`}
      >
        Zum Anbieter <ExternalLink size={14} aria-hidden="true" />
      </a>
      {partner && (
        <p className="mt-2 text-[11px] font-sans text-text-muted">
          Partnerlink: Kaufst du darüber, erhalten wir eine Provision — der Preis ändert sich für dich nicht.
        </p>
      )}
    </li>
  );
}
