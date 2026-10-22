import { jsonError, rateLimitRequest } from '@/lib/api/guard';
import { awinFeed, skuAusUrl, type FeedAdvertiser } from '@/lib/awin-feed';
import { AWIN_ADVERTISER } from '@/lib/awin';
import { getAllProducts } from '@/lib/products';

/**
 * GET /api/partner/feed-status?advertiser=sharkninja
 *
 * Betriebsanzeige für den AWIN-Produktfeed (22.10.2026): Kommt der Feed an, wie
 * alt ist der Stand, und was sagt er zu den eingetragenen Geräten (Lagerstand,
 * Provisionsgruppe)? Gedacht für die Abnahme nach dem Eintragen der Feed-URL in
 * Vercel und für den Heartbeat — der Feed ist eine Fremdabhängigkeit, und wenn
 * er stillsteht, soll das auffallen, nicht erst beim Kunden.
 *
 * Keine Geheimnisse: Die Feed-URL (mit persönlichem Schlüssel) wird hier weder
 * gelesen noch ausgegeben — nur ob der Feed `ok`, `fehlt` (keine Variable) oder
 * `fehler` (nicht ladbar) ist. Alles Weitere sind Händlerangaben zu öffentlich
 * verlinkten Produkten.
 *
 * Teilt den 24-h-Cache mit den Rezeptseiten (unstable_cache, Tag `awin-feed`);
 * die Antwort ist eine Momentaufnahme, kein Live-Aufruf bei AWIN.
 */

const RATE = { limit: 20, windowMs: 10 * 60 * 1000 };

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const limit = rateLimitRequest(req, 'partner-feed-status', RATE);
  if (!limit.ok) return limit.response;

  const advertiser = new URL(req.url).searchParams.get('advertiser') ?? 'sharkninja';
  if (!(advertiser in AWIN_ADVERTISER)) return jsonError(404, 'Unbekannter Partner.', limit.headers);
  const adv = advertiser as FeedAdvertiser;

  const feed = await awinFeed(adv);
  const geraete = getAllProducts()
    .flatMap((p) => (p.partnerZiele ?? []).filter((z) => z.advertiser === adv).map((z) => ({ p, z })))
    .map(({ p, z }) => {
      const sku = skuAusUrl(z.url);
      const e = sku ? feed.produkte.get(sku) : undefined;
      return {
        id: p.id,
        sku,
        imFeed: Boolean(e),
        lieferbar: e?.lieferbar ?? null,
        provisionsgruppe: e?.provisionsgruppe ?? null,
      };
    });

  return Response.json(
    {
      advertiser: adv,
      status: feed.status,
      geladen: feed.geladen,
      anzahlProdukte: feed.produkte.size,
      /** Kopfzeile des Feeds — zeigt, ob eine erwartete Spalte (z. B. commission_group) in der URL fehlt. */
      spalten: feed.spalten,
      geraete,
    },
    { headers: { ...limit.headers, 'Cache-Control': 'no-store' } },
  );
}
