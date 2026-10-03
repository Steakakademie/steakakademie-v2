import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import { PREIS_OHNE_STAND, preisAnzeige } from './produkt-anzeige';

/**
 * Preis einer Produktkarte — immer mit Stand (03.10.2026).
 *
 * Die Preise stammen aus products/registry.yaml (`lastChecked`), nicht live vom
 * Händler. Ohne Datum liest sich die Zahl als aktueller Preis. Fehlt der Stand,
 * zeigt die Karte keinen Preis, sondern „Preis beim Anbieter prüfen“.
 */
export default function PreisMitStand({
  product,
  className,
  standClassName,
  block = false,
}: {
  product: Pick<Product, 'price' | 'priceMin' | 'priceMax' | 'lastChecked'>;
  /** Klassen der Preiszahl. */
  className?: string;
  /** Klassen des Stand-Vermerks. */
  standClassName?: string;
  /** Stand unter statt neben dem Preis. */
  block?: boolean;
}) {
  const { preis, stand } = preisAnzeige(product);

  if (!preis || !stand) {
    return (
      <span className={cn('text-xs font-sans text-text-muted', standClassName)}>{PREIS_OHNE_STAND}</span>
    );
  }

  return (
    <>
      <span className={className}>{preis}</span>
      <span
        className={cn(
          'text-[10px] font-sans font-normal text-text-muted whitespace-nowrap',
          block ? 'block' : 'ml-1.5',
          standClassName,
        )}
      >
        {stand}
      </span>
    </>
  );
}
