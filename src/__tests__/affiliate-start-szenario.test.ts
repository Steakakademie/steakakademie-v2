/**
 * Abnahmetest Affiliate-Start 01.11.2026 (12.10.2026).
 *
 * Der Start ist ein Schalter: `status` der AWIN-Programme in
 * products/affiliate-programs.yaml wechselt von `applied` auf `active`.
 * Dieser Test spielt den Schalter durch, ohne die Datei zu ändern, und prüft,
 * was danach stimmen muss:
 *   - /affiliate-disclosure führt jedes Programm aktiv und mit Pflichttext,
 *   - jeder AWIN-Link ist ein Partnerlink (Anzeige, rel=sponsored, /go-Weiterleitung, Plausible-Klasse),
 *   - die Weiterleitung /go/<id> führt auf den Trackinglink und hängt nicht an Plausible,
 *   - Register und Code (awin.ts) widersprechen sich nicht,
 *   - Burghardt-Links führen nicht zu Alkohol (AGB: keine Produkte mit Altersfreigabe).
 *
 * Nicht geprüft: gerenderte Seiten, Einwilligungsbanner, echte AWIN-Klicks.
 */
import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { AWIN_ADVERTISER, AWIN_PUBLISHER_ID, awinLink, type AwinAdvertiser } from '@/lib/awin';
import { getAffiliatePrograms } from '@/lib/affiliate-programs';
import { klickKlassen, produktLink, REL_PARTNERLINK } from '@/components/affiliate/produkt-anzeige';
import type { AffiliateProgram, Product } from '@/types';

/** Das Produkt, das /go/<id> im Test liefert — der Registerstand hat noch kein AWIN-Produkt. */
const geliefert: { produkt?: Product } = {};
vi.mock('@/lib/products', async (original) => ({
  ...(await original<typeof import('@/lib/products')>()),
  getProductById: (id: string) => (geliefert.produkt?.id === id ? geliefert.produkt : undefined),
}));
import { GET as goProdukt } from '@/app/go/[product-slug]/route';

/** Der Start-PR: alle AWIN-Programme von `applied` auf `active`. */
function nachStart(): AffiliateProgram[] {
  return getAffiliatePrograms().map((p) => (p.network === 'AWIN' ? { ...p, status: 'active' as const } : p));
}

const awinProgramme = () => getAffiliatePrograms().filter((p) => p.network === 'AWIN');
const anbieter = Object.keys(AWIN_ADVERTISER) as AwinAdvertiser[];

function testProdukt(a: AwinAdvertiser): Product {
  const ziel = `https://www.${AWIN_ADVERTISER[a].domain}/`;
  return {
    id: `test-${a}`,
    provider: a,
    affiliateUrl: awinLink(a, ziel, 'abnahme'),
  } as unknown as Product;
}

describe('Start-Szenario: Register nach dem Schalter', () => {
  it('kein AWIN-Programm bleibt „in Vorbereitung“ — jedes steht aktiv in /affiliate-disclosure', () => {
    const aktiv = nachStart().filter((p) => p.status === 'active');
    for (const p of awinProgramme()) expect(aktiv.map((x) => x.id), p.id).toContain(p.id);
  });

  it('jedes aktive Netzwerk-Programm hat einen Pflichttext mit Provisionshinweis, ohne Mehrkosten für die Leser', () => {
    // Amazon hat den von Amazon vorgegebenen Wortlaut („Als Amazon-Partner verdiene ich …“).
    for (const p of nachStart().filter((x) => x.status === 'active' && x.id !== 'amazon')) {
      expect(p.name, p.id).toBeTruthy();
      expect(p.disclosureNote, p.id).toMatch(/Provision/);
      expect(p.disclosureNote, p.id).toMatch(/ohne Mehrkosten/);
    }
  });

  it('AWIN-Programme tragen belegte Provision und Cookie — kein Platzhalter „nachsehen“', () => {
    for (const p of awinProgramme()) {
      expect(p.commission, p.id).not.toMatch(/nachsehen/i);
      expect(p.cookie, p.id).not.toMatch(/nachsehen/i);
      expect(p.commission, p.id).toMatch(/\d/);
      expect(p.cookie, p.id).toMatch(/\d/);
    }
  });

  it('Register und awin.ts widersprechen sich nicht: Provider, ID und Händlerdomain passen', () => {
    for (const p of awinProgramme()) {
      expect(p.providers.length, p.id).toBeGreaterThan(0);
      for (const prov of p.providers) {
        const a = AWIN_ADVERTISER[prov as AwinAdvertiser];
        expect(a, `${p.id}: ${prov} fehlt in awin.ts`).toBeTruthy();
        expect(p.note, p.id).toContain(`AWIN-ID ${a.id}`);
        if (p.applyUrl) {
          const host = new URL(p.applyUrl).hostname;
          expect(host === a.domain || host.endsWith(`.${a.domain}`), `${p.id}: applyUrl ${host}`).toBe(true);
        }
      }
    }
  });

  it('Burghardt trägt die AGB-Regel „keine Produkte mit Altersfreigabe“ im Register', () => {
    const b = getAffiliatePrograms().find((p) => p.id === 'burghardt');
    expect(b?.note).toMatch(/Altersfreigabe/);
  });
});

describe('Start-Szenario: Kennzeichnung und Weiterleitung je AWIN-Advertiser', () => {
  it.each(anbieter)('%s: Partnerlink mit Anzeige, rel=sponsored, /go-Weiterleitung und Plausible-Klasse', (a) => {
    const p = testProdukt(a);
    const l = produktLink(p);
    expect(l.partner).toBe(true);
    expect(l.rel).toBe(REL_PARTNERLINK);
    expect(l.rel).toMatch(/sponsored/);
    expect(l.href).toBe(`/go/${p.id}`);
    const klass = klickKlassen(p, 'abnahme');
    expect(klass).toContain('plausible-event-name=Affiliate-Klick');
    expect(klass).toContain(`plausible-event-provider=${a}`);
  });

  it.each(anbieter)('%s: der Trackinglink trägt Advertiser-ID und Publisher-ID', (a) => {
    const u = new URL(testProdukt(a).affiliateUrl);
    expect(u.hostname).toBe('www.awin1.com');
    expect(u.searchParams.get('awinmid')).toBe(String(AWIN_ADVERTISER[a].id));
    expect(u.searchParams.get('awinaffid')).toBe(AWIN_PUBLISHER_ID);
    expect(u.searchParams.get('ued')).toContain(AWIN_ADVERTISER[a].domain);
  });
});

describe('Start-Szenario: /go/<id> leitet auf den Trackinglink', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it.each(anbieter)('%s: 302 auf den AWIN-Link, auch wenn Plausible ausfällt, ohne Caching', async (a) => {
    geliefert.produkt = testProdukt(a);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED'); }));

    const id = geliefert.produkt.id;
    const res = await goProdukt(new NextRequest(`https://steakakademie.de/go/${id}`), {
      params: Promise.resolve({ 'product-slug': id }),
    });

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(new URL(geliefert.produkt.affiliateUrl).toString());
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
    expect(res.headers.get('x-provider')).toBe(a);
  });

  it('unbekannte Produkt-ID führt auf die Startseite statt in einen Fehler', async () => {
    geliefert.produkt = undefined;
    const res = await goProdukt(new NextRequest('https://steakakademie.de/go/gibt-es-nicht'), {
      params: Promise.resolve({ 'product-slug': 'gibt-es-nicht' }),
    });
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://steakakademie.de/');
  });
});

// ── Burghardt: nie zu Alkohol ──────────────────────────────────────────────
// AGB Burghardt Delicious (Stand 25.04.2025): keine Werbung für Produkte mit
// Altersfreigabe. Der Shop führt Wein. Dieser Wächter durchsucht Inhalte und
// Code nach Burghardt-Links und lehnt Ziele ab, die nach Alkohol aussehen.
const ALKOHOL = /(^|[^a-z])(wein|weine|champagner|sekt|prosecco|spirituose|spirituosen|whisky|whiskey|rum|gin|likoer|likör|liqueur|bier|vodka|cognac|brandy|aperitif)([^a-z]|$)/i;
const WURZELN = ['content', 'src', 'products', 'data'].map((d) => path.join(process.cwd(), d));
const ENDUNGEN = new Set(['.mdx', '.md', '.ts', '.tsx', '.json', '.yaml', '.yml']);

function* dateien(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '_archiv' || e.name === '__tests__' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* dateien(p);
    else if (ENDUNGEN.has(path.extname(e.name)) && fs.statSync(p).size < 1_500_000) yield p;
  }
}

function burghardtZiele(): { datei: string; ziel: string }[] {
  const treffer: { datei: string; ziel: string }[] = [];
  const url = /awinmid=115505[^\s"'`)>]*/g;
  const aufruf = /awinLink\(\s*['"]burghardt['"]\s*,\s*['"`]([^'"`]+)['"`]/g;
  for (const wurzel of WURZELN) {
    for (const datei of dateien(wurzel)) {
      const text = fs.readFileSync(datei, 'utf-8');
      if (!text.includes('115505') && !text.includes('awinLink')) continue;
      for (const m of text.matchAll(url)) {
        const ued = /ued=([^&\s"'`)>]+)/.exec(m[0]);
        treffer.push({ datei, ziel: ued ? decodeURIComponent(ued[1]) : m[0] });
      }
      for (const m of text.matchAll(aufruf)) treffer.push({ datei, ziel: m[1] });
    }
  }
  return treffer;
}

describe('Wächter: Burghardt-Links führen nicht zu Alkohol', () => {
  it('erkennt Alkohol in Ziel-URLs und lässt Feinkost durch', () => {
    expect(ALKOHOL.test('https://burghardt-delicious.com/collections/champagner')).toBe(true);
    expect(ALKOHOL.test('https://burghardt-delicious.com/collections/wein-geschenke')).toBe(true);
    expect(ALKOHOL.test('https://burghardt-delicious.com/collections/nuesse')).toBe(false);
    expect(ALKOHOL.test('https://burghardt-delicious.com/collections/schweinefleisch-snacks')).toBe(false);
  });

  it('kein Burghardt-Link in Inhalten oder Code zeigt auf Wein, Champagner oder Spirituosen', () => {
    const verstoesse = burghardtZiele().filter((t) => ALKOHOL.test(t.ziel));
    expect(verstoesse).toEqual([]);
  });
});
