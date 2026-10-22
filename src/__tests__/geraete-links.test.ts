/**
 * Geräte-Links in Rezeptschritten (22.10.2026) — der eine Schalter, der Feed,
 * die Marker und die Kennzeichnung.
 *
 * Wächter für:
 * 1. Vor dem Start (Programm nicht `active`) führt KEIN Weg zu awin1.com — weder
 *    /go/ noch der Geräte-Link (Jobcenter/Einstiegsgeld: keine Partnereinnahmen vor dem Start).
 * 2. Nach dem Start geht /go/<id>?p=<platz> zum AWIN-Trackinglink mit clickref = Platz.
 * 3. Der Feed wird nach Spaltennamen gelesen; Lagerstand und Provisionsgruppe kommen an.
 * 4. Geräte-Marker stehen nur im freien Grundrezept, nie in VIP-Blättern; JSON-LD ohne Marker.
 * 5. Die Karte trägt „Anzeige“ und rel="sponsored" beim Partnerlink.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { feedAusCsv, feedSpalten, parseCsv, skuAusUrl } from '@/lib/awin-feed';
import { aktivesPartnerziel, weiterleitungsZiel } from '@/lib/partnerziel';
import { getProductById } from '@/lib/products';
import { getAffiliatePrograms } from '@/lib/affiliate-programs';
import { MUTTERREZEPTE } from '@/lib/mutterrezepte';
import { ohneGeraete, schrittTeile } from '@/lib/mutterrezepte/schritt-text';

const lies = (pfad: string) => readFileSync(join(__dirname, '..', pfad), 'utf8');

describe('AWIN-Feed', () => {
  it('parst Anführungszeichen, Kommas und Umbrüche in Feldern', () => {
    const rows = parseCsv('a,b,c\n"x, y","sagt ""hallo""","zwei\nzeilen"\n');
    expect(rows).toEqual([['a', 'b', 'c'], ['x, y', 'sagt "hallo"', 'zwei\nzeilen']]);
  });

  it('liest nach Spaltennamen — Reihenfolge egal — und erkennt Lagerstand und Provisionsgruppe', () => {
    const csv = [
      'product_name,commission_group,merchant_product_id,in_stock,aw_deep_link,merchant_image_url',
      '"Ninja Foodi Set","DEFAULT","CI100EU","1","https://www.awin1.com/pclick.php?p=1","https://img/ci100.jpg"',
      '"Ninja Mixer","DEFAULT","TB301EU","0","https://www.awin1.com/pclick.php?p=2",""',
      '"Ohne Lager","Zubehör","XY1","","",""',
    ].join('\n');
    const feed = feedAusCsv(csv);
    expect(feed.get('CI100EU')).toMatchObject({ lieferbar: true, provisionsgruppe: 'DEFAULT', bildUrl: 'https://img/ci100.jpg' });
    expect(feed.get('TB301EU')?.lieferbar).toBe(false);
    expect(feed.get('XY1')?.lieferbar).toBeNull();
    expect(feedSpalten(csv)).toEqual(['product_name', 'commission_group', 'merchant_product_id', 'in_stock', 'aw_deep_link', 'merchant_image_url']);
  });

  it('fällt auf stock_status zurück, wenn in_stock fehlt', () => {
    const feed = feedAusCsv('merchant_product_id,stock_status\nCI100EU,in stock\nTB301EU,out of stock\n');
    expect(feed.get('CI100EU')?.lieferbar).toBe(true);
    expect(feed.get('TB301EU')?.lieferbar).toBe(false);
  });

  it('zieht die SKU aus der sharkninja.de-Produkt-URL', () => {
    expect(skuAusUrl('https://www.sharkninja.de/ninja-foodi-3-in-1-hand-stabmixer-set/CI100EU.html')).toBe('CI100EU');
    expect(skuAusUrl('https://www.sharkninja.de/kueche/')).toBeNull();
  });

  it('die Feed-URL steht nirgends im Repo — nur die Umgebungsvariable', () => {
    for (const pfad of ['lib/awin-feed.ts', 'components/affiliate/GeraeteLink.tsx']) {
      const q = lies(pfad);
      expect(q).not.toMatch(/productdata\.awin\.com\/datafeed\/download\/apikey\/[a-f0-9]{8}/);
      expect(q).not.toMatch(/apikey\/[a-f0-9]{32}/);
    }
    expect(lies('lib/awin-feed.ts')).toContain('AWIN_FEED_SHARKNINJA');
  });

  it('die Betriebsanzeige /api/partner/feed-status liest die Variable nicht selbst und gibt nur Status aus', () => {
    const q = lies('app/api/partner/feed-status/route.ts');
    expect(q).not.toMatch(/process\.env/);
    expect(q).not.toMatch(/deepLink|bildUrl/);
    expect(q).toContain('rateLimitRequest');
  });
});

describe('Der eine Schalter (Programmstatus)', () => {
  const set = getProductById('ninja-foodi-ci100')!;
  const mixer = getProductById('ninja-detect-power-mixer-pro-tb301')!;

  it('beide Geräte sind eingetragen, mit Partnerziel bei sharkninja.de', () => {
    expect(set.partnerZiele?.[0]).toMatchObject({ advertiser: 'sharkninja' });
    expect(set.partnerZiele?.[0].url).toBe('https://www.sharkninja.de/ninja-foodi-3-in-1-hand-stabmixer-set/CI100EU.html');
    expect(mixer.partnerZiele?.[0].url).toMatch(/\/TB301EU\.html$/);
    for (const p of [set, mixer]) {
      expect(p.recommended).toBe(false);
      expect(p.rating).toBeUndefined();
      expect(p.affiliateUrl).toContain('tag=steakakademie-21');
    }
  });

  it('solange SharkNinja nicht active ist, zeigt nichts auf awin1.com', () => {
    const programm = getAffiliatePrograms().find((p) => p.providers.includes('sharkninja'));
    expect(programm?.status).not.toBe('active');
    expect(aktivesPartnerziel(set)).toBeNull();
    expect(weiterleitungsZiel(set, 'mr-limetten-cashewcreme-s3').url).toBe(set.affiliateUrl);
  });

  it('mit active geht /go/ zum AWIN-Link mit clickref = Platz', async () => {
    vi.resetModules();
    vi.doMock('@/lib/affiliate-programs', () => ({
      getProgramByProvider: () => ({ status: 'active', providers: ['sharkninja'] }),
    }));
    const { weiterleitungsZiel: mitSchalter } = await import('@/lib/partnerziel');
    const ziel = mitSchalter(set, 'mr-limetten-cashewcreme-s3');
    const u = new URL(ziel.url);
    expect(u.hostname).toBe('www.awin1.com');
    expect(u.searchParams.get('awinmid')).toBe('19810');
    expect(u.searchParams.get('clickref')).toBe('mr-limetten-cashewcreme-s3');
    expect(u.searchParams.get('ued')).toBe(set.partnerZiele![0].url);
    // Ungültiger Platz fällt auf die Produkt-ID zurück, statt den Link zu brechen
    expect(new URL(mitSchalter(set, 'Böse Leerzeichen').url).searchParams.get('clickref')).toBe(set.id);
    vi.doUnmock('@/lib/affiliate-programs');
    vi.resetModules();
  });
});

describe('Geräte-Marker im Mutterrezept', () => {
  it('stehen nur im freien Grundrezept und zeigen auf eingetragene Produkte', () => {
    for (const m of MUTTERREZEPTE) {
      const ids = m.schritte.flatMap((s) => schrittTeile(s.text).filter((t) => t.typ === 'geraet').map((t) => (t as { id: string }).id));
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) expect(getProductById(id), id).toBeDefined();
      // VIP-Bereich werbefrei (Uwe, 21.10.2026): kein Marker in Blättern, Abwandlungen oder Tipps
      for (const b of m.blaetter) {
        expect(b.abwandlung).not.toMatch(/\[\[/);
        expect(b.warum).not.toMatch(/\[\[/);
      }
      expect(m.profiTipp).not.toMatch(/\[\[/);
      expect(m.lagerung).not.toMatch(/\[\[/);
    }
  });

  it('JSON-LD und Klartext tragen das Wort, nicht den Marker', () => {
    expect(ohneGeraete('Mit dem [[ninja-foodi-ci100|Stabmixer]] pürieren.')).toBe('Mit dem Stabmixer pürieren.');
    expect(schrittTeile('A [[x-1|B]] C')).toEqual([
      { typ: 'text', text: 'A ' },
      { typ: 'geraet', id: 'x-1', wort: 'B' },
      { typ: 'text', text: ' C' },
    ]);
  });

  it('die Karte kennzeichnet den Partnerlink sichtbar und per rel', () => {
    const karte = lies('components/affiliate/GeraeteLinkKarte.tsx');
    expect(karte).toContain('daten.kennzeichnung');
    expect(karte).toContain('prefetch={false}');
    // rel nur aus produkt-anzeige.ts, nie als Literal oder Prop (Legal-Guard Regel 4)
    expect(karte).toContain('REL_PARTNERLINK');
    expect(karte).not.toMatch(/sponsored nofollow noopener/);
    const link = lies('components/affiliate/GeraeteLink.tsx');
    expect(link).toContain("kennzeichnung: 'Anzeige'");
    expect(link).not.toMatch(/rel\s*=\s*'sponsored/);
    expect(link).toMatch(/lieferbar === false\) return <>\{children\}<\/>/);
  });
});
