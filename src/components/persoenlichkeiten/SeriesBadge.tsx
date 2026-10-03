'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SeriesBadgeProps {
  currentSlug: string;
  currentOrder: number;
  totalCount: number;
  prevSlug?: string;
  prevTitle?: string;
  nextSlug?: string;
  nextTitle?: string;
}

export default function SeriesBadge({
  currentOrder,
  totalCount,
  prevSlug,
  prevTitle,
  nextSlug,
  nextTitle,
}: SeriesBadgeProps) {
  const pct = Math.round((currentOrder / totalCount) * 100);

  return (
    <div className="border border-brand-gold/15 bg-surface-elevated px-5 py-4 mb-8 not-prose">

      {/* Series label + progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">
          Die {totalCount} Meister des Feuers
        </span>
        <span className="text-[10px] font-sans text-text-muted">
          {currentOrder} / {totalCount}
        </span>
      </div>

      {/* Progress bar — Zeigarnik effect: incomplete set creates tension */}
      <div className="h-0.5 bg-surface-dark rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-brand-gold transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between gap-4">
        {prevSlug ? (
          <Link
            href={`/persoenlichkeiten/${prevSlug}`}
            className="flex items-center gap-1.5 text-xs font-sans text-text-muted hover:text-brand-gold transition-colors group min-w-0"
          >
            <ChevronLeft size={12} className="shrink-0 group-hover:-translate-x-0.5 transition-transform" />
            <span className="truncate">{prevTitle}</span>
          </Link>
        ) : <div />}

        <Link
          href="/persoenlichkeiten"
          className="text-[10px] font-sans font-bold tracking-[0.1em] uppercase text-text-muted hover:text-brand-gold transition-colors shrink-0"
        >
          Alle Profile
        </Link>

        {nextSlug ? (
          <Link
            href={`/persoenlichkeiten/${nextSlug}`}
            className="flex items-center gap-1.5 text-xs font-sans text-text-muted hover:text-brand-gold transition-colors group min-w-0 text-right"
          >
            <span className="truncate">{nextTitle}</span>
            <ChevronRight size={12} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
