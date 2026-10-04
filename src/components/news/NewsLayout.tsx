// ── Texas-Monthly-inspirierte News-Layout-Komponenten ───────────────────────
// Wiederverwendbar (bbq-news Pilot → später grillstil/pflanzlich/Homepage).
// Bild-forward mit markenkonformem "Smoke"-Platzhalter, wenn kein Foto da ist.

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Globe, Trophy, Clock, ChevronRight } from 'lucide-react';
import type { NewsItem, NewsRegion } from '@/lib/bbq-news';

// ── Region-Akzente (zentral) ────────────────────────────────────────────────
export const REGION_ACCENT: Record<NewsRegion, { color: string; label: string; grad: string }> = {
  USA:         { color: '#E85018', label: 'USA',          grad: 'radial-gradient(ellipse 130% 120% at 25% 15%, #3A1D10 0%, #17100B 70%)' },
  Deutschland: { color: '#C8882A', label: 'Deutschland',  grad: 'radial-gradient(ellipse 130% 120% at 25% 15%, #3A2E14 0%, #17100B 70%)' },
  International:{ color: '#9A8466', label: 'International', grad: 'radial-gradient(ellipse 130% 120% at 25% 15%, #2A2418 0%, #17100B 70%)' },
};

function regionIcon(region: NewsRegion, size: number) {
  if (region === 'USA') return <Flame size={size} strokeWidth={0.8} />;
  if (region === 'Deutschland') return <Trophy size={size} strokeWidth={0.8} />;
  return <Globe size={size} strokeWidth={0.8} />;
}

// ── Bild oder designter Platzhalter ─────────────────────────────────────────
function NewsImage({
  item,
  className,
  iconSize = 96,
  sizes,
  priority = false,
}: {
  item: NewsItem;
  className?: string;
  iconSize?: number;
  sizes?: string;
  priority?: boolean;
}) {
  const accent = REGION_ACCENT[item.region];
  if (item.image) {
    return (
      <div className={`relative overflow-hidden ${className ?? ''}`}>
        <Image src={item.image} alt={item.title} fill sizes={sizes ?? '100vw'} priority={priority} className="object-cover" />
      </div>
    );
  }
  // Smoke-Placeholder: Region-Gradient + Diagonal-Textur + Kategorie-Icon
  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{ background: accent.grad }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 14px)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center" style={{ color: accent.color, opacity: 0.4 }}>
        {regionIcon(item.region, iconSize)}
      </div>
      <span
        className="absolute bottom-3 left-3 text-[10px] font-sans font-bold tracking-[0.18em] uppercase px-2 py-0.5"
        style={{ background: 'rgba(0,0,0,0.45)', color: accent.color }}
      >
        {item.category}
      </span>
    </div>
  );
}

function Kicker({ item }: { item: NewsItem }) {
  const accent = REGION_ACCENT[item.region];
  return (
    <div className="flex items-center gap-2 text-[11px] font-sans mb-3">
      <span className="inline-flex items-center gap-1.5 font-bold tracking-wider uppercase" style={{ color: accent.color }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent.color }} />
        {accent.label}
      </span>
      <span className="text-brand-gold/30">·</span>
      <span className="text-text-muted uppercase tracking-wider">{item.category}</span>
    </div>
  );
}

function Meta({ item }: { item: NewsItem }) {
  return (
    <div className="flex items-center gap-x-3 text-[11px] font-sans text-text-muted mt-3">
      <span className="inline-flex items-center gap-1.5">
        <Clock size={12} className="text-brand-gold/60" />
        <time dateTime={item.isoDate}>{item.date}</time>
      </span>
      {item.source && (<><span className="text-brand-gold/30">·</span><span>{item.source}</span></>)}
    </div>
  );
}

function maybeLink(item: NewsItem, children: ReactNode, className?: string) {
  return item.href
    ? <Link href={item.href} className={className}>{children}</Link>
    : <div className={className}>{children}</div>;
}

// ── 1) Großer Aufmacher (full-width, bild-dominant) ─────────────────────────
export function FeatureHero({ item }: { item: NewsItem }) {
  return (
    <article className="group">
      {maybeLink(
        item,
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-0 border border-border-subtle overflow-hidden">
          <NewsImage item={item} className="aspect-[16/10] lg:aspect-auto lg:min-h-[420px]" iconSize={140} sizes="(max-width:1024px) 100vw, 58vw" priority />
          <div className="flex flex-col justify-center p-7 sm:p-10 bg-surface-card">
            <Kicker item={item} />
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-text-light leading-[1.12] mb-4 group-hover:text-brand-gold transition-colors">
              {item.title}
            </h2>
            <p className="font-body text-base sm:text-lg text-text-secondary leading-relaxed">
              {item.summary}
            </p>
            <Meta item={item} />
          </div>
        </div>,
        'block'
      )}
    </article>
  );
}

// ── 2) Sekundär-Feature (Bild + Text nebeneinander, mittlere Dichte) ────────
export function SecondaryFeature({ item }: { item: NewsItem }) {
  return (
    <article className="group h-full">
      {maybeLink(
        item,
        <div className="flex flex-col h-full border border-border-subtle overflow-hidden bg-surface-card hover:border-brand-gold/40 transition-colors">
          <NewsImage item={item} className="aspect-[16/9]" iconSize={88} sizes="(max-width:1024px) 100vw, 40vw" />
          <div className="flex flex-col flex-1 p-6">
            <Kicker item={item} />
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-text-light leading-snug mb-2 group-hover:text-brand-gold transition-colors">
              {item.title}
            </h3>
            <p className="font-body text-sm text-text-secondary leading-relaxed flex-1">{item.summary}</p>
            <Meta item={item} />
          </div>
        </div>,
        'block h-full'
      )}
    </article>
  );
}

// ── 3) Kompaktes Listen-Item (Thumb + Titel, hohe Dichte) ───────────────────
export function CompactItem({ item, rank }: { item: NewsItem; rank?: number }) {
  const accent = REGION_ACCENT[item.region];
  return (
    <article className="group">
      {maybeLink(
        item,
        <div className="flex gap-4 items-start py-4 border-b border-border-subtle">
          {rank != null ? (
            <span className="font-serif text-2xl font-bold shrink-0 w-7 text-center" style={{ color: accent.color, opacity: 0.7 }}>
              {rank}
            </span>
          ) : (
            <NewsImage item={item} className="w-20 h-20 shrink-0" iconSize={28} sizes="80px" />
          )}
          <div className="min-w-0">
            <span className="text-[10px] font-sans font-bold tracking-wider uppercase" style={{ color: accent.color }}>
              {accent.label} · {item.category}
            </span>
            <h3 className="font-serif text-base font-bold text-text-light leading-snug mt-1 group-hover:text-brand-gold transition-colors">
              {item.title}
            </h3>
            <time className="text-[11px] font-sans text-text-muted mt-1 block" dateTime={item.isoDate}>{item.date}</time>
          </div>
        </div>,
        'block'
      )}
    </article>
  );
}

// ── 4) Themen-Band (Header mit Akzent + Grid) ───────────────────────────────
export function TopicBand({
  region,
  items,
  alt = false,
}: {
  region: NewsRegion;
  items: NewsItem[];
  alt?: boolean;
}) {
  if (items.length === 0) return null;
  const accent = REGION_ACCENT[region];
  const headline = region === 'USA' ? 'Aus den USA' : region === 'Deutschland' ? 'Deutsche Szene' : 'International';
  return (
    <section className={alt ? 'py-14' : 'py-14'} style={alt ? { background: 'linear-gradient(180deg,#15100B 0%,#17100B 100%)' } : undefined}>
      <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-1">
          <div className="flex items-center gap-3">
            <span className="w-8 h-[3px]" style={{ background: accent.color }} />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-light">{headline}</h2>
          </div>
          <Link href="/bbq-news" className="text-xs font-sans font-bold uppercase tracking-wider text-text-muted hover:text-brand-gold transition-colors inline-flex items-center gap-1">
            Mehr <ChevronRight size={13} />
          </Link>
        </div>
        <div className="section-divider mb-8" style={{ borderColor: `${accent.color}33` }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {items.map((it) => <SecondaryFeature key={it.id} item={it} />)}
        </div>
      </div>
    </section>
  );
}
