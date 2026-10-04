import Link from 'next/link';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import { getProductById } from '@/lib/products';
import { hatAmazonLink, klickKlassen, produktLink } from './produkt-anzeige';
import PreisMitStand from './PreisMitStand';

const PROVIDER_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  'otto-gourmet': 'Otto Gourmet',
  santosgrills: 'Santosgrills',
  grillfuerst: 'Grillfürst',
  ankerkraut: 'Ankerkraut',
  albers: 'Albers Food',
  'meater-direct': 'MEATER Shop',
  'dreisechzig-bbq': '360° BBQ',
  'grill-experte': 'Grill-Experte',
  banggood: 'Banggood',
  other: 'Anbieter',
};

// 🔵 FOOTER-Zone — „Marcos Equipment für [Methode]": Komplettliste als Tabelle
// mit Buttons. Wird vom Methoden-Template automatisch nach dem Artikel gerendert
// (config: src/lib/affiliate-zones.ts). Rendert nichts, wenn kein Produkt existiert.
//
// 03.10.2026: „Anzeige“ steht an jeder Zeile mit Partnerlink (und im Kopf, sobald
// es eine solche Zeile gibt). Zeilen ohne Partnerlink sind gewoehnliche externe
// Links — ohne „Anzeige“, und der Provisions-Satz nimmt sie ausdruecklich aus.
// Preise tragen den Stand aus der Registry (PreisMitStand).
export default function EquipmentFooter({ title, productIds }: { title?: string; productIds: string[] }) {
  const products = productIds.map(getProductById).filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (products.length === 0) return null;

  const hatPartner = products.some((p) => produktLink(p).partner);
  const hasAmazon = products.some((p) => hatAmazonLink(p) && produktLink(p).partner);

  return (
    <section className="mt-12 border border-border-subtle bg-surface-card" aria-label="Equipment-Empfehlungen">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
        <h2 className="font-serif text-xl font-bold text-text-primary flex items-center gap-2">
          <ShoppingCart size={18} className="text-brand-gold" />
          {title ?? 'Marcos Equipment-Empfehlung'}
        </h2>
        {hatPartner && (
          <span className="text-[9px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted shrink-0">Anzeige</span>
        )}
      </div>

      <ul className="divide-y divide-border-subtle">
        {products.map((product) => {
          const providerLabel = PROVIDER_LABELS[product.provider] ?? 'Anbieter';
          const link = produktLink(product);
          return (
            <li key={product.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-sans font-bold text-sm text-text-primary leading-snug">{product.name}</p>
                <p className="text-xs font-sans text-text-muted mt-0.5">
                  {product.brand}
                  {product.badge && <span className="text-brand-fire font-bold"> · {product.badge}</span>}
                </p>
              </div>
              <span className="shrink-0 hidden sm:block text-right">
                <PreisMitStand product={product} className="font-sans font-bold text-sm text-text-primary" block />
              </span>
              <span className="shrink-0 flex flex-col items-end gap-1">
                {link.partner && (
                  <span className="text-[9px] font-sans font-bold tracking-[0.15em] uppercase text-text-muted">Anzeige</span>
                )}
                <Link
                  href={link.href}
                  // KAN-75: KEIN Prefetch. Next laedt sonst /go/<id> im Voraus, die Route
                  // antwortet mit 302 auf den Haendler — und der Browser folgt der
                  // Weiterleitung ohne Klick. Damit ginge die Besucher-IP beim blossen
                  // Scrollen an Amazon. Aufgefallen 20.08.2026 durch die neue CSP.
                  prefetch={false}
                  className={`inline-flex items-center gap-1.5 bg-brand-fire text-white font-sans text-[11px] font-bold tracking-wide px-3 py-2 hover:bg-[#cc4412] transition-colors ${klickKlassen(product, 'footer')}`}
                  rel={link.rel}
                  target="_blank"
                >
                  <ExternalLink size={13} />
                  {providerLabel}
                </Link>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border-subtle px-5 py-3 space-y-1">
        {hatPartner ? (
          <p className="text-[11px] font-sans text-text-muted leading-relaxed">
            Mit „Anzeige“ markierte Links sind Affiliate-Links: Du zahlst keinen Cent mehr, wir erhalten eine kleine Provision.{' '}
            <Link href="/affiliate-disclosure" className="underline hover:text-brand-gold">
              Transparenz-Hinweis
            </Link>
          </p>
        ) : (
          <p className="text-[11px] font-sans text-text-muted leading-relaxed">
            Externe Links zum Anbieter — keine Partnerlinks.
          </p>
        )}
        {hasAmazon && (
          <p className="text-[11px] font-sans text-text-muted italic leading-relaxed">
            Als Amazon-Partner verdienen wir an qualifizierten Verkäufen.
          </p>
        )}
      </div>
    </section>
  );
}
