/**
 * AWIN-Deeplinks und BOS-FOOD-Fleischbrücke (10.10.2026).
 * Das Zielverzeichnis eines Deeplinks muss zur Domain des Advertisers passen — sonst
 * entsteht still ein Link ohne Provision.
 */
import { describe, it, expect } from 'vitest';
import { AWIN_ADVERTISER, AWIN_PUBLISHER_ID, awinLink } from '@/lib/awin';
import { ALL_CUTS } from '@/lib/cuts-catalog';
import { activeMeatPartner, buildMeatTargetUrl, getMeatOffer } from '@/lib/cut-affiliate';
import { getAffiliatePrograms } from '@/lib/affiliate-programs';
import { getAllProducts } from '@/lib/products';

describe('awinLink', () => {
  it('baut den Trackinglink mit Advertiser, Publisher, Platz und kodiertem Ziel', () => {
    const l = new URL(awinLink('bos-food', 'https://www.bosfood.de/shop-detail/kategorie/schinken-wurst-fleisch.html', 'cut-ribeye'));
    expect(l.origin + l.pathname).toBe('https://www.awin1.com/cread.php');
    expect(l.searchParams.get('awinmid')).toBe('19712');
    expect(l.searchParams.get('awinaffid')).toBe(AWIN_PUBLISHER_ID);
    expect(l.searchParams.get('clickref')).toBe('cut-ribeye');
    expect(l.searchParams.get('ued')).toBe('https://www.bosfood.de/shop-detail/kategorie/schinken-wurst-fleisch.html');
  });

  it('clickref ist optional', () => {
    expect(new URL(awinLink('santosgrills', 'https://www.santosgrills.de/')).searchParams.has('clickref')).toBe(false);
  });

  it('lehnt fremde Domains, Nicht-https, Unsinn und ungültige clickrefs ab', () => {
    expect(() => awinLink('bos-food', 'https://www.santosgrills.de/')).toThrow(/gehört nicht/);
    expect(() => awinLink('bos-food', 'https://bosfood.de.evil.example/')).toThrow(/gehört nicht/);
    expect(() => awinLink('bos-food', 'http://www.bosfood.de/')).toThrow(/https/);
    expect(() => awinLink('bos-food', 'kein url')).toThrow(/keine URL/);
    expect(() => awinLink('bos-food', 'https://www.bosfood.de/', 'Groß & Leer')).toThrow(/clickref/);
  });

  it('Subdomains des Advertisers sind erlaubt, der Domainname als Suffix nicht', () => {
    expect(() => awinLink('bos-food', 'https://shop.bosfood.de/x')).not.toThrow();
    expect(() => awinLink('bos-food', 'https://notbosfood.de/x')).toThrow(/gehört nicht/);
  });

  it('jeder zugelassene Advertiser hat im Programmregister einen Eintrag mit AWIN als Netzwerk', () => {
    const programme = getAffiliatePrograms();
    for (const [provider, a] of Object.entries(AWIN_ADVERTISER)) {
      const p = programme.find((x) => x.providers.includes(provider as never));
      expect(p, provider).toBeTruthy();
      expect(p!.network, provider).toBe('AWIN');
      // Die ID steht in der Notiz: das Netzwerk-Feld zeigt /affiliate-disclosure öffentlich an.
      expect(p!.note, provider).toContain(`AWIN-ID ${a.id}`);
    }
  });
});

describe('Fleischbrücke: noch kein Partner', () => {
  it('bis ein Händler feststeht, bleibt der Amazon-Fallback aktiv — kein Partnerlink vor dem 01.11.', () => {
    expect(activeMeatPartner().id).toBe('amazon');
    expect(getMeatOffer(ALL_CUTS[0]).premiumActive).toBe(false);
    for (const cut of ALL_CUTS) expect(buildMeatTargetUrl(cut)).toContain('tag=steakakademie-21');
  });

  it('BOS FOOD ist nicht der Fleischpartner (Uwe, 10.10.2026: Spezialitäten wie Trüffel, Öle, Kaviar)', () => {
    for (const cut of ALL_CUTS) {
      expect(buildMeatTargetUrl(cut)).not.toMatch(/awin1.com|bosfood/);
    }
    const bos = getAffiliatePrograms().find((p) => p.id === 'bos-food');
    expect(bos?.focus).toMatch(/Spezialit/);
    expect(bos?.status).toBe('applied');
  });
});

describe('Programmregister: nur belegte Programme (12.10.2026)', () => {
  it('kein Eintrag mit Status „planned“ — /affiliate-disclosure zeigt alles, was nicht aktiv ist, öffentlich als „in Vorbereitung“', () => {
    for (const p of getAffiliatePrograms()) expect(p.status, p.id).not.toBe('planned');
  });

  it('360° BBQ, Grill-Experte, Banggood und BURNHARD sind raus (ungeprüft seit 02.06.2026, BURNHARD von Uwe abgelehnt)', () => {
    const namen = getAffiliatePrograms().map((p) => `${p.id} ${p.name}`).join(' ');
    expect(namen).not.toMatch(/dreisechzig|360|grill-experte|banggood|burnhard/i);
  });
});

describe('Bremer Gewürzhandel (AWIN 128963)', () => {
  it('Deeplink trägt Advertiser-ID und Publisher-ID, Ziel nur auf der Shop-Domain', () => {
    const l = new URL(awinLink('bremer-gewuerzhandel', 'https://www.bremer-gewuerzhandel.de/', 'rezept-rub'));
    expect(l.searchParams.get('awinmid')).toBe('128963');
    expect(l.searchParams.get('awinaffid')).toBe(AWIN_PUBLISHER_ID);
    expect(() => awinLink('bremer-gewuerzhandel', 'https://www.bosfood.de/')).toThrow(/gehört nicht/);
  });

  it('steht im Register als „applied“ — nicht live, bis Uwe auf „active“ stellt', () => {
    const p = getAffiliatePrograms().find((x) => x.id === 'bremer-gewuerzhandel');
    expect(p?.status).toBe('applied');
    expect(p?.network).toBe('AWIN');
  });
});

describe('Partnerziele im Produktregister (14.10.2026)', () => {
  const mitZiel = getAllProducts().filter((p) => p.partnerZiele?.length);

  it('jedes Ziel ergibt einen gültigen AWIN-Link und gehört zu einem eingetragenen Programm', () => {
    expect(mitZiel.length).toBeGreaterThan(0);
    const providers = new Set(getAffiliatePrograms().flatMap((p) => p.providers));
    for (const p of mitZiel) {
      for (const z of p.partnerZiele!) {
        expect(() => awinLink(z.advertiser, z.url, p.id), p.id).not.toThrow();
        expect(providers.has(z.advertiser), `${p.id}: ${z.advertiser}`).toBe(true);
        expect(z.geprueft, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('schaltet nichts um: affiliateUrl zeigt nicht auf AWIN, solange das Programm nicht active ist', () => {
    for (const p of mitZiel) expect(p.affiliateUrl, p.id).not.toContain('awin1.com');
  });

  it('SharkNinja (14.10.2026): Ninja Woodfire und die Küchenmaschine zeigen auf Produktseiten bei sharkninja.de', () => {
    const ninja = mitZiel.filter((p) => p.partnerZiele!.some((z) => z.advertiser === 'sharkninja'));
    expect(ninja.map((p) => p.id).sort()).toEqual([
      'ninja-precisionpro-bz651',
      'ninja-woodfire-og701',
      'ninja-woodfire-pro-connect-xl-og901',
    ]);
    expect(ninja.filter((p) => p.category === 'grill').map((p) => p.name)).toEqual(
      expect.arrayContaining([expect.stringContaining('Woodfire'), expect.stringContaining('Woodfire')]),
    );
    expect(ninja.find((p) => p.category === 'kuechenmaschine')?.name).toContain('Küchenmaschine');
    for (const p of ninja) {
      const z = p.partnerZiele![0];
      // Produktseite, keine Kategorie- oder Startseite: Pfad endet auf <SKU>.html
      expect(z.url, p.id).toMatch(/^https:\/\/www\.sharkninja\.de\/[a-z0-9-]+\/[A-Z0-9-]+\.html$/);
      expect(new URL(awinLink('sharkninja', z.url, p.id)).searchParams.get('awinmid')).toBe('19810');
      // Noch nicht live: kein Partnerlink zum Händler, keine fremden Sterne ohne Amazon-Prüfung
      expect(p.affiliateUrl, p.id).toContain('tag=steakakademie-21');
      expect(p.rating, p.id).toBeUndefined();
      expect(p.recommended, p.id).toBe(false);
    }
  });
});
