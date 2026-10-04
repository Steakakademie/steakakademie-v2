import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Star, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { amazonBewertung, klickKlassen, produktLink } from './produkt-anzeige';
import PreisMitStand from './PreisMitStand';

/** Hinweis unter dem Button, wenn der Link KEIN Partnerlink ist. */
const HINWEIS_KEIN_PARTNERLINK = 'Externer Link zum Anbieter — kein Partnerlink';

function SymbolicBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  // Rechtlich relevanter Hinweis: KI-/generisches Bild, nicht das Originalprodukt
  const cls =
    size === 'sm'
      ? 'text-[8px] px-1 py-[1px]'
      : 'text-[9px] px-1.5 py-0.5';
  return (
    <span
      className={cn(
        'absolute top-1 right-1 z-10 font-sans font-bold tracking-wider uppercase',
        'bg-black/65 text-zinc-200 border border-white/15 backdrop-blur-sm',
        cls
      )}
      aria-label="Symbolbild — Originalprodukt kann optisch abweichen"
    >
      Symbolbild
    </span>
  );
}

// Kategorie-Icon für den No-Image-Fallback. Bewusst als handgepflegte Inline-SVGs
// (kein externes Bild — PA-API nicht angebunden, Amazon-/Hersteller-Bilder = ToS-Tabu).
function CategoryGlyph({ category, className }: { category: string; className?: string }) {
  const common = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };

  switch (category) {
    case 'thermometer':
    case 'sous-vide':
      // Thermometer
      return (
        <svg {...common}>
          <path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0Z" />
          <path d="M12 9v6.5" />
          <circle cx="12" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'messer':
      // Kochmesser
      return (
        <svg {...common}>
          <path d="M3 17 14.5 5.5a3.5 3.5 0 0 1 5 5L8 22" />
          <path d="M3 17l4 4" />
          <path d="M14.5 5.5 19.5 10.5" />
        </svg>
      );
    case 'grill':
    case 'smoker':
    case 'oberhitzegrill':
      // Grillrost mit Beinen
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M5 6a7 7 0 0 0 14 0" />
          <path d="M8.5 13l-2 7" />
          <path d="M15.5 13l2 7" />
          <path d="M9 9h6" />
        </svg>
      );
    case 'gewuerze':
      // Gewürzstreuer
      return (
        <svg {...common}>
          <path d="M8 9h8l-1 11H9L8 9Z" />
          <path d="M9 9V6a3 3 0 0 1 6 0v3" />
          <path d="M11 4.5h.01M13 4.5h.01M12 3h.01" />
        </svg>
      );
    case 'fleisch':
      // Steak
      return (
        <svg {...common}>
          <path d="M14.5 4.5a7.5 7.5 0 1 0 4 13.5c2-1.5 2-4 .5-5.5s-1-4 0-5.5-2.5-3-4.5-2.5Z" />
          <circle cx="9" cy="13" r="1.8" />
        </svg>
      );
    case 'dry-ager':
      // Reifeschrank
      return (
        <svg {...common}>
          <rect x="6" y="3" width="12" height="18" rx="1.5" />
          <path d="M10 3v18" />
          <path d="M8 8v3M12.5 8v3" />
        </svg>
      );
    case 'kuechenmaschine':
      // Standmixer / Küchenmaschine
      return (
        <svg {...common}>
          <path d="M6 4h9l-1 7H7L6 4Z" />
          <path d="M9 11l-1 4a3 3 0 0 0 3 3h2" />
          <path d="M15 6h3a2 2 0 0 1 2 2v3" />
          <path d="M9 21h6" />
        </svg>
      );
    default:
      // Generischer Fallback: Flamme (Marken-Motiv)
      return (
        <svg {...common}>
          <path d="M12 3c.5 3-2 4-2 7a4 4 0 1 0 6.5-3c.3 2-1 3-2 3 .5-2-.5-5-2.5-7Z" />
        </svg>
      );
  }
}

function ProductImagePlaceholder({
  brand,
  category,
  size = 'md',
}: {
  brand: string;
  category: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const box = {
    sm: 'h-14 w-14',
    md: 'h-28 w-28',
    lg: 'h-36 w-36',
  }[size];

  const icon = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }[size];

  const caption = {
    sm: 'text-[6px] tracking-wide',
    md: 'text-[8px] tracking-wider',
    lg: 'text-[9px] tracking-[0.14em]',
  }[size];

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden',
        'border border-brand-gold/20',
        box
      )}
      style={{ background: 'radial-gradient(120% 120% at 50% 25%, #C8882A 0%, #5a3c14 45%, #0D0A06 100%)' }}
      role="img"
      aria-label={`${brand} — Symbolbild (kein Originalfoto verfügbar)`}
    >
      {/* dezenter Glanz oben */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-30"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25), transparent)' }}
        aria-hidden="true"
      />
      <CategoryGlyph category={category} className={cn('text-brand-gold/90 drop-shadow-sm', icon)} />
      <span
        className={cn(
          'mt-1 font-sans font-bold uppercase text-zinc-300/80 leading-none',
          caption
        )}
      >
        Symbolbild
      </span>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'sidebar';
  rank?: number;
  className?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  amazon:        'Amazon',
  'otto-gourmet':'Otto Gourmet',
  santosgrills:  'Santosgrills',
  grillfuerst:   'Grillfürst',
  ankerkraut:    'Ankerkraut',
  albers:        'Albers Food',
  'meater-direct':'MEATER Shop',
  other:         'Händler',
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < Math.round(rating) ? 'fill-brand-gold text-brand-gold' : 'text-border-subtle fill-border-subtle'}
        />
      ))}
    </div>
  );
}

export default function ProductCard({
  product,
  variant = 'default',
  rank,
  className,
}: ProductCardProps) {
  const providerLabel = PROVIDER_LABELS[product.provider] ?? 'Händler';
  // „Bei Händler ansehen“ war kein Deutsch — ohne benannten Anbieter neutral.
  const buttonText = providerLabel === 'Händler' ? 'Beim Anbieter ansehen' : `Bei ${providerLabel} ansehen`;
  // KAN-75 (20.08.2026): Die Links tragen prefetch={false}. Ohne das laedt Next
  // /go/<id> im Voraus, sobald die Karte in den Viewport kommt; die Route
  // antwortet mit 302 auf den Haendler, und der Browser folgt der Weiterleitung
  // — die Besucher-IP ginge beim blossen Scrollen an Amazon, ohne Klick und
  // ohne Einwilligung. Aufgefallen erst durch die neue CSP, vorher unsichtbar.
  //
  // 03.10.2026: Nur ein Partnerlink laeuft ueber /go/<id> und traegt „Anzeige“
  // samt Provisions-Hinweis. Fuehrt der Link ohne Partner-Parameter zum
  // Anbieter (beefer.de, dry-ager.com, otto.de), ist er ein gewoehnlicher
  // externer Link — siehe produktLink() in produkt-anzeige.ts.
  const link = produktLink(product);
  const tracking = klickKlassen(product);
  // imageUrl (PA-API) hat Vorrang vor image (manuell in YAML)
  const imageSrc = product.imageUrl ?? product.image;
  // Sterne nur bei Produkten mit Amazon-Link, immer mit Quelle (03.10.2026) —
  // die Zahlen sind Amazon-Durchschnitte, keine Bewertung der Steakakademie.
  const bewertung = amazonBewertung(product);

  // ── SIDEBAR VARIANT ────────────────────────────────────────────────────
  if (variant === 'sidebar') {
    return (
      <div className={cn('bg-surface-card border border-border-subtle p-4', className)}>
        <div className="border-t-2 border-brand-gold -mt-4 mb-4 pt-3 flex items-center justify-between">
          <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-brand-fire">
            Empfehlung
          </span>
          {link.partner && (
            <span className="text-[9px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted">
              Anzeige
            </span>
          )}
        </div>

        <div className="relative mb-3 flex justify-center bg-surface-base p-3">
          {imageSrc ? (
            <>
              <Image
                src={imageSrc}
                alt={product.imageAlt ?? product.name}
                width={160}
                height={120}
                className="object-contain h-28"
              />
              {product.imageType === 'symbolic' && <SymbolicBadge size="md" />}
            </>
          ) : (
            <ProductImagePlaceholder brand={product.brand} category={product.category} size="md" />
          )}
        </div>

        <h3 className="font-sans font-bold text-sm text-text-primary mb-1 line-clamp-2">
          {product.name}
        </h3>

        {product.badge && (
          <span className="inline-block text-[10px] font-sans font-bold tracking-wide uppercase bg-brand-gold/15 text-brand-gold px-2 py-0.5 mb-2">
            {product.badge}
          </span>
        )}

        {bewertung && (
          <div className="flex items-center gap-2 mb-2">
            <StarRow rating={bewertung.rating} />
            <span className="text-xs font-sans text-text-muted">
              {bewertung.rating.toFixed(1)} <span title="Durchschnittliche Amazon-Kundenbewertung">(Ø Amazon)</span>
            </span>
          </div>
        )}

        <p className="mb-3">
          <PreisMitStand product={product} className="text-lg font-sans font-bold text-text-primary" />
        </p>

        <Link
          href={link.href}
          prefetch={false}
          className={`btn-affiliate w-full justify-center text-sm mb-2 ${tracking}`}
          rel={link.rel}
          target="_blank"
        >
          <ExternalLink size={14} />
          {buttonText}
        </Link>

        <p className="text-[10px] font-sans text-text-muted text-center leading-relaxed">
          {link.partner ? '* Affiliate-Link — Preis unverändert für dich' : HINWEIS_KEIN_PARTNERLINK}
        </p>
      </div>
    );
  }

  // ── COMPACT VARIANT ────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-4 py-3 border-b border-border-subtle', className)}>
        {rank && (
          <span className="font-serif text-2xl font-bold text-brand-gold/65 w-6 shrink-0">
            {rank}
          </span>
        )}
        {imageSrc ? (
          <div className="relative bg-surface-card p-1 shrink-0">
            <Image
              src={imageSrc}
              alt={product.imageAlt ?? product.name}
              width={60}
              height={60}
              className="object-contain h-14 w-14"
            />
            {product.imageType === 'symbolic' && <SymbolicBadge size="sm" />}
          </div>
        ) : (
          <ProductImagePlaceholder brand={product.brand} category={product.category} size="sm" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-bold text-sm text-text-primary line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            {product.badge && (
              <span className="text-[10px] font-sans font-bold uppercase text-brand-fire">
                {product.badge}
              </span>
            )}
            {link.partner && (
              <span className="text-[9px] font-sans font-bold tracking-[0.12em] uppercase text-text-muted">
                Anzeige
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="mb-1.5">
            <PreisMitStand product={product} className="font-sans font-bold text-sm text-text-primary" block />
          </p>
          <Link
            href={link.href}
            prefetch={false}
            className={`inline-flex items-center gap-1 bg-brand-fire text-white font-sans text-[11px] font-bold tracking-wide px-3 py-1.5 hover:bg-[#cc4412] transition duration-200 ease-out active:scale-[0.98] motion-reduce:active:scale-100 ${tracking}`}
            rel={link.rel}
            target="_blank"
          >
            Ansehen
          </Link>
        </div>
      </div>
    );
  }

  // ── DEFAULT VARIANT ─────────────────────────────────────────────────────
  return (
    <div className={cn('bg-surface-card border border-border-subtle overflow-hidden', className)}>
      {product.badge && (
        <div className="bg-brand-gold text-ink text-[10px] font-sans font-bold tracking-[0.15em] uppercase px-4 py-1.5 text-center">
          {product.badge}
        </div>
      )}

      <div className="relative p-6 flex justify-center bg-surface-base">
        {imageSrc ? (
          <>
            <Image
              src={imageSrc}
              alt={product.imageAlt ?? product.name}
              width={220}
              height={160}
              className="object-contain h-36"
            />
            {product.imageType === 'symbolic' && <SymbolicBadge size="lg" />}
          </>
        ) : (
          <ProductImagePlaceholder brand={product.brand} category={product.category} size="lg" />
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-brand-fire">
            {product.brand}
          </span>
          {link.partner && (
            <span className="text-[9px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted">
              Anzeige
            </span>
          )}
        </div>
        <h3 className="font-sans font-bold text-lg text-text-primary mb-2 leading-snug">
          {product.name}
        </h3>

        {bewertung && (
          <div className="flex items-center gap-2 mb-3">
            <StarRow rating={bewertung.rating} />
            <span className="text-sm font-sans text-text-secondary">
              {bewertung.rating.toFixed(1)}
              <span className="text-text-muted">
                {bewertung.ratingCount
                  ? ` (${bewertung.ratingCount.toLocaleString('de-DE')} Amazon-Bewertungen)`
                  : ' (Ø Amazon)'}
              </span>
            </span>
          </div>
        )}

        {product.pros && product.pros.length > 0 && (
          <ul className="space-y-1.5 mb-4">
            {product.pros.slice(0, 3).map((pro) => (
              <li key={pro} className="flex items-start gap-2 text-sm font-sans text-text-secondary">
                <ShieldCheck size={14} className="text-brand-gold mt-0.5 shrink-0" />
                {pro}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-end justify-between mb-4">
          <p>
            <PreisMitStand product={product} className="text-2xl font-sans font-bold text-text-primary" block />
          </p>
          {product.recommended && (
            <span className="text-[10px] font-sans font-bold tracking-wide uppercase text-brand-gold border border-brand-gold/30 px-2 py-1">
              Unsere Wahl
            </span>
          )}
        </div>

        <Link
          href={link.href}
          prefetch={false}
          className={`btn-affiliate w-full justify-center ${tracking}`}
          rel={link.rel}
          target="_blank"
        >
          <ExternalLink size={15} />
          {buttonText}
        </Link>

        <p className="text-[10px] font-sans text-text-muted text-center mt-2 leading-relaxed">
          {link.partner ? '* Wir erhalten eine Provision — Preis für dich unverändert' : HINWEIS_KEIN_PARTNERLINK}
        </p>
      </div>
    </div>
  );
}
