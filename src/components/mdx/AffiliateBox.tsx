import Link from 'next/link';
import { ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';
import { getProductById } from '@/lib/products';

// ─────────────────────────────────────────────────────────────────────────────
// AffiliateBox — Kaufimpuls-Block im Fliesstext (MDX)
//
// Zwei Betriebsarten, bewusst getrennt:
//
//  1. PRODUKT (extern, Affiliate):
//     <AffiliateBox id="thermapen-one" headline="…" text="…" cta="…" />
//     `id` ist ein Schluessel aus products/registry.yaml. Der Link geht ueber
//     /go/<id> (302 auf den Haendler, Klick-Tracking dort). Die Box traegt das
//     Label „Anzeige" SICHTBAR VOR dem ersten Klick — LG Koeln 12.05.2026,
//     CLAUDE.md §2 Regel 1. „Ad" oder ein Sternchen reichen nicht.
//
//  2. INTERN (redaktionell, keine Kennzeichnung):
//     <AffiliateBox href="/vergleich/fleischthermometer" headline="…" text="…" cta="…" />
//     Verweist auf eine eigene Seite (Vergleich, Cut-Atlas, Guide). Kein
//     „Anzeige"-Label, weil kein Dritter bezahlt — ein falsches Label waere
//     genauso irrefuehrend wie ein fehlendes.
//
// FEHLENDES PRODUKT: Unbekannte `id` → die Box rendert NICHT (null). Ein
// Tippfehler im MDX darf keinen toten /go/-Link erzeugen; check-links.mjs
// wuerde ihn zurecht rot setzen. Gleiches Prinzip wie InlineAffiliate.
//
// KEIN PREFETCH auf /go/: Next wuerde die Route sonst im Voraus laden, die
// antwortet mit 302 auf den Haendler, und die Besucher-IP ginge beim blossen
// Scrollen an Amazon (KAN-71/KAN-75, aufgefallen 20.08.2026).
// ─────────────────────────────────────────────────────────────────────────────

interface AffiliateBoxProps {
  /** Produkt-ID aus products/registry.yaml — externer Affiliate-Link. */
  id?: string;
  /** Interner Pfad — redaktioneller Verweis ohne Kennzeichnung. */
  href?: string;
  headline: string;
  text: string;
  cta?: string;
}

const PLAUSIBLE = (provider: string, produkt: string) =>
  `plausible-event-name=Affiliate-Klick plausible-event-zone=box plausible-event-provider=${provider} plausible-event-produkt=${produkt}`;

export function AffiliateBox({ id, href, headline, text, cta }: AffiliateBoxProps) {
  // ── Betriebsart 2: intern ────────────────────────────────────────────────
  if (!id && href && href.startsWith('/')) {
    return (
      <aside
        className="my-12 p-7"
        style={{
          background: 'linear-gradient(135deg, rgba(200,136,42,0.09) 0%, transparent 70%)',
          border: '1px solid rgba(200,136,42,0.28)',
        }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <ArrowRight size={18} className="text-brand-gold shrink-0" aria-hidden="true" />
          <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-brand-gold">
            Aus der Steakakademie
          </span>
        </div>
        <p className="font-serif text-xl sm:text-2xl font-bold text-text-light leading-snug mb-3">{headline}</p>
        <p className="font-body text-[1.0625rem] leading-[1.75] text-text-light/75 mb-6">{text}</p>
        <Link
          href={href}
          className="inline-flex items-center gap-2 font-sans text-sm font-bold tracking-wide uppercase text-brand-gold hover:text-brand-fire transition-colors"
        >
          {cta ?? 'Weiterlesen'}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </aside>
    );
  }

  // ── Betriebsart 1: Produkt ───────────────────────────────────────────────
  if (!id) return null;
  const product = getProductById(id);
  if (!product) return null;

  const preis =
    product.priceMin && product.priceMax
      ? `ab ${product.priceMin} €`
      : product.price
        ? `ca. ${product.price} €`
        : null;

  return (
    <aside
      className="my-12 p-7 relative"
      style={{
        background: 'linear-gradient(135deg, rgba(232,80,24,0.10) 0%, rgba(200,136,42,0.06) 55%, transparent 100%)',
        border: '1px solid rgba(232,80,24,0.32)',
      }}
      aria-label={`Anzeige: ${product.name}`}
    >
      {/* Kennzeichnung: sichtbar, oben, vor jedem Klick. */}
      <span className="absolute top-3 right-3 font-sans text-[10px] font-bold tracking-[0.16em] uppercase text-text-muted border border-text-muted/40 px-2 py-0.5">
        Anzeige
      </span>

      <div className="flex items-center gap-2.5 mb-4 pr-20">
        <ShoppingBag size={18} className="text-brand-fire shrink-0" aria-hidden="true" />
        <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-brand-fire">
          {product.badge ? `${product.badge} · ` : ''}
          {product.name}
        </span>
      </div>

      <p className="font-serif text-xl sm:text-2xl font-bold text-text-light leading-snug mb-3">{headline}</p>
      <p className="font-body text-[1.0625rem] leading-[1.75] text-text-light/75 mb-6">{text}</p>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href={`/go/${product.id}`}
          prefetch={false}
          rel="sponsored nofollow noopener"
          target="_blank"
          className={`inline-flex items-center gap-2 bg-brand-fire text-ink font-sans text-sm font-bold tracking-wide uppercase px-5 py-2.5 hover:bg-brand-gold transition-colors ${PLAUSIBLE(product.provider, product.id)}`}
        >
          {cta ?? 'Zum Angebot'}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
        {preis && (
          <span className="font-sans text-xs text-text-muted">
            {preis} · Stand {product.lastChecked}
          </span>
        )}
      </div>
    </aside>
  );
}

export default AffiliateBox;
