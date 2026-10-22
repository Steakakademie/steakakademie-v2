import { getProductById } from '@/lib/products';
import { getProgramByProvider } from '@/lib/affiliate-programs';
import { AWIN_ADVERTISER } from '@/lib/awin';
import { awinFeed, skuAusUrl } from '@/lib/awin-feed';
import { aktivesPartnerziel } from '@/lib/partnerziel';
import { klickKlassen, produktLink } from './produkt-anzeige';
import GeraeteLinkKarte, { type GeraeteKarteDaten } from './GeraeteLinkKarte';

/**
 * Gerät im Rezeptschritt (Konzept 21.10.2026, SharkNinja-Zusage).
 *
 *   …mit dem <GeraeteLink id="ninja-foodi-ci100" platz="mr-cashewcreme-s3">Stabmixer</GeraeteLink> pürieren.
 *
 * Server-Komponente: liest Produktregister, Programmstatus und den AWIN-Feed.
 * - Programm `active` → /go/<id>?p=<platz> (AWIN-Trackinglink, clickref = Platz)
 *   und der Feed entscheidet: NICHT lieferbar → nur der Text, kein Link. Kein
 *   Besucher landet auf einer Seite ohne Kaufweg, kein Klick geht verloren.
 * - Programm nicht `active` → bisheriger affiliateUrl-Weg (Amazon mit Tag),
 *   wie alle Rezept-Links heute. Der Start läuft über den einen Schalter.
 * - Unbekanntes Produkt → Text ohne Link (kein toter Link).
 *
 * NUR in freien Inhalten verwenden — der VIP-Bereich ist werbefrei (Uwe, 21.10.2026).
 */
export default async function GeraeteLink({
  id,
  platz,
  children,
}: {
  id: string;
  /** Platz auf der Seite, wird AWIN-clickref: nur a–z, 0–9, Bindestrich, Unterstrich. */
  platz: string;
  children: React.ReactNode;
}) {
  const product = getProductById(id);
  if (!product) return <>{children}</>;

  const ziel = aktivesPartnerziel(product);
  let lieferbar: boolean | null = null;
  let haendler = 'Amazon';
  let href: string;
  let partner: boolean;

  if (ziel) {
    const feed = await awinFeed(ziel.advertiser);
    const sku = skuAusUrl(ziel.zielUrl);
    const eintrag = sku ? feed.produkte.get(sku) : undefined;
    if (feed.status === 'ok' && eintrag) lieferbar = eintrag.lieferbar;
    if (lieferbar === false) return <>{children}</>;
    haendler = AWIN_ADVERTISER[ziel.advertiser].name.replace(/ DE$/, '');
    href = `/go/${product.id}?p=${encodeURIComponent(platz)}`;
    partner = true;
  } else {
    const link = produktLink(product);
    href = link.href;
    partner = link.partner;
    const programm = getProgramByProvider(product.provider);
    haendler = programm?.name ?? 'Amazon';
  }

  const daten: GeraeteKarteDaten = {
    name: product.name,
    beschreibung: product.description,
    pros: product.pros ?? [],
    brand: product.brand,
    category: product.category,
    href,
    klassen: klickKlassen(product, 'rezeptschritt'),
    partner,
    // Sichtbare Werbekennzeichnung am Link und in der Karte (§ 5a Abs. 4 UWG).
    kennzeichnung: 'Anzeige',
    haendler,
    lieferbar,
  };

  return <GeraeteLinkKarte daten={daten}>{children}</GeraeteLinkKarte>;
}
