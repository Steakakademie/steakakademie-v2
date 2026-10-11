import { ExternalLink } from 'lucide-react';
import { getProductById } from '@/lib/products';
import { klickKlassen, produktLink } from './produkt-anzeige';

/**
 * Eine Zeile in einem Setup der Aktionsseiten (11.10.2026): Name, Marke, unser „Warum"
 * und der Link in den Shop. Bewusst OHNE Preis — die Registry-Preise stammen vom Mai 2026,
 * und eine Aktionsseite mit altem Preis wäre eine falsche Preisangabe (PAngV). Preise
 * kommen erst mit einem Händler-Feed (Konzept, Abschnitt 5).
 *
 * Kennzeichnung wie überall: „Anzeige" und rel aus produktLink — nur beim Partnerlink.
 */
export default function AktionProdukt({ id, warum }: { id: string; warum: string }) {
  const product = getProductById(id);
  if (!product) return null;
  const link = produktLink(product);

  return (
    <li className="border border-border-subtle bg-surface-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-sans font-bold tracking-[0.14em] uppercase text-text-muted">{product.brand}</p>
          <h3 className="font-serif text-lg font-bold text-text-primary leading-snug">{product.name}</h3>
        </div>
        {link.partner && (
          <span className="shrink-0 text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-text-muted border border-border-subtle px-1.5 py-0.5">
            Anzeige
          </span>
        )}
      </div>
      <p className="font-body text-sm text-text-secondary leading-relaxed mt-3">{warum}</p>
      <a
        href={link.href}
        target="_blank"
        rel={link.rel}
        className={`mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-bold text-brand-gold hover:text-text-primary transition-colors ${klickKlassen(product, 'aktion')}`}
      >
        Zum Anbieter <ExternalLink size={14} aria-hidden="true" />
      </a>
      {link.partner && (
        <p className="mt-2 text-[11px] font-sans text-text-muted">
          Partnerlink: Kaufst du darüber, erhalten wir eine Provision — der Preis ändert sich für dich nicht.
        </p>
      )}
    </li>
  );
}
