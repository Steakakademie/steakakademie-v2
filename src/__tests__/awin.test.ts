/**
 * AWIN-Deeplinks und BOS-FOOD-Fleischbrücke (10.10.2026).
 * Das Zielverzeichnis eines Deeplinks muss zur Domain des Advertisers passen — sonst
 * entsteht still ein Link ohne Provision.
 */
import { describe, it, expect } from 'vitest';
import { AWIN_ADVERTISER, AWIN_PUBLISHER_ID, awinLink } from '@/lib/awin';
import { ALL_CUTS } from '@/lib/cuts-catalog';
import { activeMeatPartner, bosFoodUrl, buildMeatTargetUrl, getMeatOffer } from '@/lib/cut-affiliate';
import { getAffiliatePrograms } from '@/lib/affiliate-programs';

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

describe('Fleischbrücke BOS FOOD', () => {
  it('bis zum Start (planned) bleibt der Amazon-Fallback aktiv — kein Partnerlink vor dem 01.11.', () => {
    expect(activeMeatPartner().id).toBe('amazon');
    expect(getMeatOffer(ALL_CUTS[0]).premiumActive).toBe(false);
    for (const cut of ALL_CUTS) expect(buildMeatTargetUrl(cut)).toContain('tag=steakakademie-21');
  });

  it('der vorbereitete BOS-FOOD-Link ist ein AWIN-Deeplink auf die Kategorie der Tierart', () => {
    const rind = ALL_CUTS.find((c) => c.species === 'rind')!;
    const schwein = ALL_CUTS.find((c) => c.species === 'schwein')!;
    const u = (c: typeof rind) => new URL(new URL(bosFoodUrl(c)).searchParams.get('ued')!);
    expect(new URL(bosFoodUrl(rind)).searchParams.get('awinmid')).toBe('19712');
    expect(u(rind).pathname).toMatch(/subkategorie\/rindfleisch\.html$/);
    expect(u(schwein).pathname).toMatch(/subkategorie\/schweinefleisch\.html$/);
    expect(new URL(bosFoodUrl(rind)).searchParams.get('clickref')).toBe(`cut-${rind.id}`.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
  });
});
