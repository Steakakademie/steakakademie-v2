import type { AnchorHTMLAttributes } from 'react';
import { getProductById } from '@/lib/products';
import { hatAmazonLink, hatNetzwerkLink, hatPartnerlink, REL_PARTNERLINK } from './produkt-anzeige';

/**
 * Ein Markdown-Link auf `/go/<id>` ist ein Partnerlink (Tracking-Redirect zum Händler).
 * Seit 11.10.2026 ebenso ein direkter Netzwerk-Link (awin1.com, track.webgains.com) —
 * sonst stünde ein AWIN-Deeplink im Fließtext ohne „Anzeige“.
 */
export function istPartnerlink(href?: string | null): boolean {
  if (typeof href !== 'string') return false;
  return href.startsWith('/go/') || hatNetzwerkLink({ affiliateUrl: href });
}

/**
 * Ziel eines `/go/<id>`-Links im Fließtext (11.10.2026): Amazon-Produkte direkt zu
 * Amazon (siehe produktLink), alles andere — Netzwerk-Produkte, unbekannte IDs —
 * bleibt bei `/go/`.
 */
export function zielHref(href?: string | null): string | undefined {
  if (typeof href !== 'string' || !href.startsWith('/go/')) return href ?? undefined;
  const product = getProductById(href.slice('/go/'.length));
  if (product && hatAmazonLink(product) && hatPartnerlink(product)) return product.affiliateUrl;
  return href;
}

/**
 * Link-Renderer für Markdown-Links im Fließtext der Vergleichsseiten
 * (`a` in den mdxComponents von src/app/vergleich/[slug]/page.tsx).
 *
 * Werbekennzeichnung (03.10.2026): Ein `/go/`-Link trug bis dahin nur
 * `rel="sponsored noopener"` — das sieht kein Mensch. „Anzeige“ muss als
 * lesbares Wort direkt am Link stehen, VOR dem Klick (CLAUDE.md §2 Regel 1);
 * ein `title`, ein Sternchen oder der Hinweis am Seitenende reichen nicht.
 * Eigene Datei statt Inline-Funktion in der Seite, damit Vitest sie prüfen kann
 * (die Seite selbst importiert contentlayer/generated).
 */
export default function MdxTextLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const partnerlink = istPartnerlink(href);
  const ziel = zielHref(href);
  const extern = typeof ziel === 'string' && /^https?:\/\//.test(ziel);
  return (
    <>
      <a
        href={ziel}
        rel={partnerlink ? REL_PARTNERLINK : undefined}
        target={partnerlink && extern ? '_blank' : undefined}
        className="text-brand-fire font-medium hover:text-brand-gold transition-colors"
        {...props}
      >
        {children}
      </a>
      {partnerlink && (
        <span className="ml-1 text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-text-light/65 whitespace-nowrap">
          Anzeige
        </span>
      )}
    </>
  );
}
