import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ArticleMeta, ArticleCardVariant } from '@/types';

interface ArticleCardProps {
  article: ArticleMeta;
  variant?: ArticleCardVariant;
  className?: string;
}

export default function ArticleCard({
  article,
  variant = 'medium',
  className,
}: ArticleCardProps) {
  const { url, title, excerpt, image, imageAlt, category, author, formattedDate, readingTime } = article;

  // ── HERO (volle Breite linke Hauptspalte) ────────────────────────────────
  if (variant === 'hero') {
    return (
      <article className={cn('group', className)}>
        <Link href={url}>
          <div className="cinema-frame mb-5 aspect-[16/10]">
            <Image
              src={image}
              alt={imageAlt}
              width={800}
              height={500}
              sizes="(max-width: 1024px) 100vw, 800px"
              className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
              priority
            />
          </div>
          <span className="category-label">{category}</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mt-2 mb-3 leading-tight article-title-link group-hover:text-brand-gold">
            {title}
          </h1>
          <p className="font-body text-base leading-relaxed mb-4 line-clamp-3 text-text-light/70">
            {excerpt}
          </p>
          <div className="flex items-center gap-2 text-xs font-sans text-text-light/55">
            <span>{author}</span>
            <span className="text-brand-gold/40">—</span>
            <span>{formattedDate}</span>
            {readingTime && (
              <>
                <span className="text-brand-gold/40">—</span>
                <span>{readingTime} Min. Lesezeit</span>
              </>
            )}
          </div>
        </Link>
      </article>
    );
  }

  // ── SMALL (mittlere Spalte, gestapelt) ───────────────────────────────────
  if (variant === 'small') {
    return (
      <article className={cn('group flex gap-4', className)}>
        <Link href={url} className="shrink-0">
          <div className="cinema-frame w-24 h-16">
            <Image
              src={image}
              alt={imageAlt}
              width={100}
              height={70}
              sizes="96px"
              className="w-24 h-16 object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
            />
          </div>
        </Link>
        <div className="min-w-0">
          <span className="category-label">{category}</span>
          <Link href={url}>
            <h3 className="font-serif text-base font-bold mt-1 leading-snug article-title-link group-hover:text-brand-gold line-clamp-3">
              {title}
            </h3>
          </Link>
          <p className="text-[11px] font-sans text-text-light/55 mt-1.5">{formattedDate}</p>
        </div>
      </article>
    );
  }

  // ── HORIZONTAL (Artikel-Listen-Zeile) ────────────────────────────────────
  if (variant === 'horizontal') {
    return (
      <article className={cn('group flex gap-5 py-5 border-b border-border-subtle', className)}>
        <Link href={url} className="shrink-0">
          <div className="cinema-frame w-32 sm:w-36 h-24">
            <Image
              src={image}
              alt={imageAlt}
              width={140}
              height={90}
              sizes="144px"
              className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
            />
          </div>
        </Link>
        <div className="flex flex-col justify-center min-w-0">
          <span className="category-label">{category}</span>
          <Link href={url}>
            <h3 className="font-serif text-lg sm:text-xl font-bold mt-1 mb-2 leading-snug article-title-link group-hover:text-brand-gold line-clamp-2">
              {title}
            </h3>
          </Link>
          <p className="font-body text-sm text-text-light/65 leading-relaxed line-clamp-2 hidden sm:block mb-2">
            {excerpt}
          </p>
          <div className="flex items-center gap-2 text-xs font-sans text-text-light/55">
            <span>{author}</span>
            <span className="text-brand-gold/40">—</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </article>
    );
  }

  // ── MEDIUM (Standard Grid-Karte) ─────────────────────────────────────────
  return (
    <article className={cn('group', className)}>
      <Link href={url}>
        <div className="cinema-frame mb-4 aspect-[3/2]">
          <Image
            src={image}
            alt={imageAlt}
            width={600}
            height={380}
            // Ohne `sizes` nimmt der Browser 100vw an und laedt fuer eine
            // Grid-Karte das 1200-px-Derivat (Lighthouse 02.09.2026: ~35 kB
            // Verschwendung je Karte). Die Karte ist maximal ein Drittel breit.
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          />
        </div>
        <span className="category-label">{category}</span>
        <h2 className="font-serif text-xl font-bold mt-2 mb-2 leading-snug article-title-link group-hover:text-brand-gold line-clamp-3">
          {title}
        </h2>
        <div className="flex items-center gap-2 text-xs font-sans text-text-light/55 mb-2">
          <span>{author}</span>
          <span className="text-brand-gold/40">—</span>
          <span>{formattedDate}</span>
        </div>
        <p className="font-body text-sm text-text-light/65 leading-relaxed line-clamp-3">
          {excerpt}
        </p>
        <span className="inline-flex items-center gap-1 mt-3 text-xs font-sans font-bold text-brand-fire hover:text-brand-gold transition-colors">
          Weiterlesen →
        </span>
      </Link>
    </article>
  );
}
