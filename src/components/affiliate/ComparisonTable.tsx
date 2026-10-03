import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { amazonBewertung, klickKlassen, produktLink } from './produkt-anzeige';
import PreisMitStand from './PreisMitStand';

interface ComparisonTableProps {
  products: Product[];
  className?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={
            i < Math.round(rating)
              ? 'fill-brand-gold text-brand-gold'
              : 'text-border-subtle fill-border-subtle'
          }
        />
      ))}
      <span className="text-xs font-sans text-text-secondary ml-1">
        {rating.toFixed(1)}
      </span>
      {/* Quelle gehoert an die Zahl (03.10.2026): ohne sie liest sich die
          Spalte als Bewertung der Steakakademie. */}
      <span
        className="text-[10px] font-sans text-text-muted ml-1 whitespace-nowrap"
        title="Durchschnittliche Amazon-Kundenbewertung"
      >
        (Ø Amazon)
      </span>
    </div>
  );
}

export default function ComparisonTable({ products, className }: ComparisonTableProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr className="bg-text-primary text-white">
              <th className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase py-3 px-4 text-left w-10">
                #
              </th>
              <th className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase py-3 px-4 text-left">
                Produkt
              </th>
              <th className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase py-3 px-4 text-left">
                Bewertung
              </th>
              <th className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase py-3 px-4 text-left">
                Preis
              </th>
              {/* „Einordnung“ statt „Badge“ (03.10.2026): Die Etiketten sind eine
                  redaktionelle Einordnung nach Datenlage, kein Testergebnis. */}
              <th className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase py-3 px-4 text-left hidden sm:table-cell">
                Einordnung
              </th>
              <th className="py-3 px-4 w-32" />
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const rank = index + 1;
              // Hervorhebung = redaktionelle Auswahl (`recommended`), kein Testurteil.
              const isTopPick = product.recommended === true;
              // Partnerlink → /go/<id> + „Anzeige“; sonst gewoehnlicher externer Link.
              const link = produktLink(product);
              // Sterne nur bei Produkten mit Amazon-Link (produkt-anzeige.ts)
              const bewertung = amazonBewertung(product);

              return (
                <tr
                  key={product.id}
                  className="border-b border-border-subtle bg-white transition-colors hover:bg-surface-base"
                >
                  {/* Rank cell carries the gold left-border highlight for top picks */}
                  <td
                    className={cn(
                      'py-4 px-4 font-serif text-xl font-bold text-border-subtle',
                      isTopPick && 'border-l-4 border-l-brand-gold pl-3'
                    )}
                  >
                    {rank}
                  </td>

                  {/* Product cell — image stacks above name on mobile */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {product.image && (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={56}
                          height={56}
                          className="object-contain h-14 w-14 shrink-0"
                        />
                      )}
                      <div>
                        <span className="block text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-brand-fire mb-0.5">
                          {product.brand}
                        </span>
                        <span className="block font-sans font-bold text-sm text-text-primary leading-snug line-clamp-2">
                          {product.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    {bewertung ? (
                      <StarRating rating={bewertung.rating} />
                    ) : (
                      <span className="text-xs font-sans text-text-muted">—</span>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <PreisMitStand
                      product={product}
                      className="font-sans font-bold text-sm text-text-primary whitespace-nowrap"
                      block
                    />
                  </td>

                  <td className="py-4 px-4 hidden sm:table-cell">
                    {product.badge ? (
                      <span className="inline-block text-[10px] font-sans font-bold tracking-wide uppercase bg-brand-gold/10 text-brand-fire px-2 py-0.5 whitespace-nowrap">
                        {product.badge}
                      </span>
                    ) : (
                      <span className="text-xs font-sans text-text-muted">—</span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-right">
                    {link.partner && (
                      <span className="block text-[9px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted mb-1">
                        Anzeige
                      </span>
                    )}
                    <Link
                      href={link.href}
                      prefetch={false}
                      className={`inline-flex items-center gap-1.5 bg-brand-gold text-white font-sans text-[11px] font-bold tracking-wide px-4 py-2 hover:bg-[#d4891a] transition-colors whitespace-nowrap ${klickKlassen(product)}`}
                      rel={link.rel}
                      target="_blank"
                    >
                      {link.partner ? 'Zum Shop →' : 'Zum Anbieter →'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Der Provisions-Hinweis steht nur, wenn die Tabelle mindestens einen
          Partnerlink zeigt — und sagt, woran man ihn erkennt. */}
      <p className="text-[10px] font-sans text-text-muted mt-2 italic">
        {products.some((p) => produktLink(p).partner)
          ? 'Mit „Anzeige“ markierte Links sind Affiliate-Links — Preis unverändert für dich. Preise laut Produktdaten zum genannten Stand, nicht live.'
          : 'Preise laut Produktdaten zum genannten Stand, nicht live.'}
      </p>
    </div>
  );
}
