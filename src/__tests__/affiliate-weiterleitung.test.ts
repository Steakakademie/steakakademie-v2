/**
 * Affiliate-Weiterleitungen /go/[product-slug] und /go-fleisch/[cut] (03.10.2026).
 *
 * Anlass: Beide Routen warteten ohne Zeitgrenze auf Plausible, bevor sie
 * weiterleiteten. Das catch fängt Fehler, kein Hängen — schwieg Plausible,
 * hing der Klick (bei /go bis zur Funktionsgrenze, danach ohne Weiterleitung).
 *
 * Echt bleiben: beide Routen samt Produkt-Registry und Cut-Katalog.
 * Ersetzt wird nur fetch (Plausible).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as goProdukt } from '@/app/go/[product-slug]/route';
import { GET as goFleisch } from '@/app/go-fleisch/[cut]/route';
import { getAllProducts } from '@/lib/products';
import { ALL_CUTS } from '@/lib/cuts-catalog';
import { buildMeatTargetUrl } from '@/lib/cut-affiliate';

const produkt = getAllProducts()[0];
const cut = ALL_CUTS[0];

const klickProdukt = () =>
  goProdukt(new NextRequest(`https://steakakademie.de/go/${produkt.id}`), { params: Promise.resolve({ 'product-slug': produkt.id }) });
const klickFleisch = () =>
  goFleisch(new NextRequest(`https://steakakademie.de/go-fleisch/${cut.id}`), { params: Promise.resolve({ cut: cut.id }) });

/** Plausible antwortet nie — das Versprechen endet nur, wenn die Route selbst abbricht. */
function plausibleSchweigt() {
  const signale: (AbortSignal | null | undefined)[] = [];
  vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => {
    signale.push(init.signal);
    return new Promise((_ok, abbruch) => {
      init.signal?.addEventListener('abort', () => abbruch(init.signal?.reason));
    });
  }));
  return signale;
}

describe('Affiliate-Weiterleitung hängt nicht an Plausible', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('schweigt Plausible, leiten beide Routen nach rund 1,5 s trotzdem weiter', async () => {
    const signale = plausibleSchweigt();
    const start = Date.now();

    const [p, f] = await Promise.all([klickProdukt(), klickFleisch()]);

    expect(Date.now() - start).toBeLessThan(3_000);
    expect(signale).toHaveLength(2);
    expect(signale.every((s) => s instanceof AbortSignal)).toBe(true);
    expect(p.status).toBe(302);
    expect(p.headers.get('location')).toBe(new URL(produkt.affiliateUrl).toString());
    expect(f.status).toBe(302);
    expect(f.headers.get('location')).toBe(new URL(buildMeatTargetUrl(cut)).toString());
  }, 5_000);

  it('antwortet Plausible, geht das Ereignis raus und die Weiterleitung folgt sofort', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response('ok', { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await klickProdukt();

    expect(res.status).toBe(302);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://plausible.io/api/event');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toMatchObject({
      name: 'Affiliate-Klick', props: { produkt: produkt.id },
    });
  });

  it('wirft Plausible sofort, bleibt die Weiterleitung', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED'); }));
    expect((await klickFleisch()).status).toBe(302);
  });
});
