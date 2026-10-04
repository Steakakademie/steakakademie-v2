'use client';

import { useState } from 'react';
import ProductCard from '@/components/affiliate/ProductCard';
import type { Product } from '@/types';

const SEGMENTS = [
  { key: 'alle',        label: 'Alle',         count: 0 },
  { key: 'premium',     label: 'Premium',       count: 0 },
  { key: 'damast',      label: 'Damast',        count: 0 },
  { key: 'mittelklasse',label: 'Mittelklasse',  count: 0 },
  { key: 'bbq-spezial', label: 'BBQ-Spezial',   count: 0 },
] as const;

type SegmentKey = (typeof SEGMENTS)[number]['key'];

interface Props {
  products: Product[];
}

export default function MesserClient({ products }: Props) {
  const [active, setActive] = useState<SegmentKey>('alle');

  // Zähler für Tabs
  const counts: Record<SegmentKey, number> = {
    alle:         products.length,
    premium:      products.filter((p) => p.segment === 'premium').length,
    damast:       products.filter((p) => p.segment === 'damast').length,
    mittelklasse: products.filter((p) => p.segment === 'mittelklasse').length,
    'bbq-spezial':products.filter((p) => p.segment === 'bbq-spezial').length,
  };

  const visible =
    active === 'alle' ? products : products.filter((p) => p.segment === active);

  return (
    <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Segment-Tabs */}
      <div
        className="flex flex-wrap gap-2 mb-10"
        role="tablist"
        aria-label="Messer-Segmente"
      >
        {SEGMENTS.map(({ key, label }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(key)}
              className={[
                'px-4 py-2 text-sm font-sans font-semibold tracking-wide transition-colors duration-150',
                isActive
                  ? 'bg-brand-gold text-ink'
                  : 'bg-surface-card border border-border-subtle text-text-secondary hover:border-brand-gold/40 hover:text-text-primary',
              ].join(' ')}
            >
              {label}
              <span
                className={[
                  'ml-2 text-[11px] font-mono',
                  isActive ? 'text-ink/80' : 'text-text-muted',
                ].join(' ')}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Produktgrid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} variant="default" />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-center font-sans text-text-muted py-12">
          Keine Messer in diesem Segment gefunden.
        </p>
      )}
    </section>
  );
}
