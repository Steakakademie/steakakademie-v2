import Link from 'next/link';
import { getProductById } from '@/lib/products';
import { klickKlassen, produktLink } from './produkt-anzeige';

// ⚪ INLINE-Zone — kontextueller Affiliate-Textlink mitten im Schritt-Text.
// Nutzung im MDX:
//   …ohne ein gutes <InlineAffiliate id="thermapen-one">Einstich-Thermometer</InlineAffiliate>
//   wird das zum Ratespiel.
// Fehlt das Produkt, wird der Text unverlinkt ausgegeben (kein toter Link).
//
// 03.10.2026: „Anzeige“ und rel="sponsored" nur beim Partnerlink. Fuehrt der
// Link ohne Partner-Parameter zum Anbieter, ist er ein gewoehnlicher externer
// Link (siehe produktLink in produkt-anzeige.ts).
export default function InlineAffiliate({ id, children }: { id: string; children: React.ReactNode }) {
  const product = getProductById(id);
  if (!product) return <>{children}</>;

  const link = produktLink(product);

  return (
    <Link
      href={link.href}
      // KAN-75: KEIN Prefetch. Next laedt sonst /go/<id> im Voraus, die Route
      // antwortet mit 302 auf den Haendler — und der Browser folgt der
      // Weiterleitung ohne Klick. Damit ginge die Besucher-IP beim blossen
      // Scrollen an Amazon. Aufgefallen 20.08.2026 durch die neue CSP.
      prefetch={false}
      className={`text-brand-fire underline decoration-brand-fire/40 underline-offset-2 hover:decoration-brand-fire transition-colors ${klickKlassen(product, 'inline')}`}
      rel={link.rel}
      target="_blank"
    >
      {children}
      {link.partner && (
        <span className="text-[9px] font-sans font-bold tracking-wide uppercase text-text-muted align-super ml-0.5">
          Anzeige
        </span>
      )}
    </Link>
  );
}
