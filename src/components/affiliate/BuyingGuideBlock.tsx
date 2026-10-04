import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { klickKlassen, produktLink } from './produkt-anzeige';
import PreisMitStand from './PreisMitStand';

function BrandInitials({ brand }: { brand: string }) {
  const initials = brand.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="h-24 w-24 sm:h-28 sm:w-28 flex items-center justify-center bg-surface-base border border-border-subtle" aria-hidden="true">
      <span className="font-serif font-bold text-2xl text-brand-gold">{initials}</span>
    </div>
  );
}

interface BuyingGuideBlockProps {
  product: Product;
  title: string;
  summary: string;
  className?: string;
}

/**
 * Kaufberatungs-Block: Einordnung eines Produkts mit Link zum Anbieter.
 *
 * 03.10.2026: Das fest verdrahtete Siegel behauptete einen eigenen Gerätetest,
 * für den es keinen Beleg gibt. An seiner Stelle steht, was der Block ist — eine
 * Einordnung nach Datenlage. „Anzeige“ und Affiliate-Hinweis erscheinen nur
 * beim Partnerlink (produktLink), der Preis immer mit Stand (PreisMitStand).
 */
export default function BuyingGuideBlock({
  product,
  title,
  summary,
  className,
}: BuyingGuideBlockProps) {
  const link = produktLink(product);

  return (
    <div
      className={cn(
        'border-l-4 border-l-brand-gold bg-surface-base p-5 sm:p-6',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
        <div className="shrink-0 flex justify-center sm:justify-start">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={120}
              height={100}
              className="object-contain h-24 w-24 sm:h-28 sm:w-28"
            />
          ) : (
            <BrandInitials brand={product.brand} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <ClipboardList size={13} className="text-brand-gold shrink-0" />
            <span className="text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-brand-fire">
              Einordnung nach Datenlage
            </span>
          </div>

          <h3 className="font-serif font-bold text-base sm:text-lg text-text-primary leading-snug mb-2">
            {title}
          </h3>

          <p className="font-sans text-sm text-text-secondary leading-relaxed mb-4">
            {summary}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span>
              <PreisMitStand product={product} className="font-sans font-bold text-xl text-text-primary" />
            </span>

            <div className="flex flex-col items-start gap-1 self-start sm:self-auto">
              {link.partner && (
                <span className="text-[9px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted">
                  Anzeige
                </span>
              )}
              <Link
                href={link.href}
                prefetch={false}
                className={`inline-flex items-center gap-1.5 bg-brand-gold text-ink font-sans text-sm font-bold tracking-wide px-5 py-2.5 hover:bg-[#d4891a] transition-colors ${klickKlassen(product)}`}
                rel={link.rel}
                target="_blank"
              >
                <ExternalLink size={14} />
                {link.partner ? 'Zum Shop →' : 'Zum Anbieter →'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] font-sans text-text-muted mt-4 italic border-t border-border-subtle pt-3">
        {link.partner
          ? '* Affiliate-Link — Preis unverändert für dich'
          : 'Externer Link zum Anbieter — kein Partnerlink'}
      </p>
    </div>
  );
}
