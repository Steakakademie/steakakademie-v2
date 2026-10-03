import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Product } from '@/types';
import { getAllProducts, getProductById } from '@/lib/products';
import BuyingGuideBlock from './BuyingGuideBlock';
import ComparisonTable from './ComparisonTable';
import EquipmentFooter from './EquipmentFooter';
import HeroRecommendation from './HeroRecommendation';
import InlineAffiliate from './InlineAffiliate';
import ProductCard from './ProductCard';
import {
  hatPartnerlink,
  klickKlassen,
  preisAnzeige,
  preisStand,
  produktLink,
  REL_EXTERN,
  REL_PARTNERLINK,
} from './produkt-anzeige';

/**
 * Wächter (03.10.2026), zwei Regeln für jede Produktkarte:
 *
 * 1. „Anzeige“, rel="sponsored" und der Provisions-Satz stehen genau dort, wo
 *    der Link ein Partnerlink ist. Karten mit Ziel beefer.de, dry-ager.com und
 *    otto.de behaupteten eine Provision, obwohl dafür kein Partnerprogramm
 *    verdrahtet ist — sie sind jetzt gewöhnliche externe Links.
 * 2. Ein Preis steht nie ohne seinen Stand (`lastChecked` der Registry).
 */
const AMAZON: Product = {
  id: 'amazon-produkt',
  name: 'Amazon-Produkt',
  brand: 'Marke',
  category: 'thermometer',
  price: 129,
  affiliateUrl: 'https://www.amazon.de/dp/B000TEST/?tag=steakakademie-21',
  provider: 'amazon',
  lastChecked: '2026-05-22',
};
const HERSTELLER: Product = {
  ...AMAZON,
  id: 'hersteller-produkt',
  affiliateUrl: 'https://beefer.de/shop/beefer-pro-ii/',
  provider: 'other',
};

function sichtbar(markup: string) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

/** Alle <a …> eines Markups als Attribut-Strings. */
function links(markup: string): string[] {
  return markup.match(/<a\b[^>]*>/g) ?? [];
}

/** InlineAffiliate hat keine Hooks — direkt aufrufen, der Linktext ist das Kind. */
function inline(id: string): string {
  return renderToStaticMarkup(InlineAffiliate({ id, children: 'Linktext' }));
}

function karten(product: Product): Record<string, string> {
  return {
    'ProductCard default': renderToStaticMarkup(createElement(ProductCard, { product })),
    'ProductCard sidebar': renderToStaticMarkup(createElement(ProductCard, { product, variant: 'sidebar' })),
    'ProductCard compact': renderToStaticMarkup(createElement(ProductCard, { product, variant: 'compact' })),
    ComparisonTable: renderToStaticMarkup(createElement(ComparisonTable, { products: [product] })),
    BuyingGuideBlock: renderToStaticMarkup(createElement(BuyingGuideBlock, { product, title: 'Titel', summary: 'Text' })),
  };
}

describe('hatPartnerlink', () => {
  it('erkennt den Amazon-Link mit Partner-Tag', () => {
    expect(hatPartnerlink(AMAZON)).toBe(true);
    expect(hatPartnerlink({ affiliateUrl: 'https://www.amazon.de/s?k=x&tag=steakakademie-21' })).toBe(true);
  });

  it('lehnt Links ohne Partner-Parameter ab — auch zu Amazon', () => {
    for (const url of [
      'https://www.amazon.de/dp/B000TEST/',
      'https://www.amazon.de/dp/B000TEST/?tag=',
      'https://beefer.de/shop/beefer-pro-ii/',
      'https://www.dry-ager.com/shop/x/',
      'https://www.otto.de/p/x/',
      'https://www.otto-gourmet.de/',
      'kein-link',
      '',
    ]) {
      expect(hatPartnerlink({ affiliateUrl: url }), url).toBe(false);
    }
  });
});

describe('produktLink', () => {
  it('führt den Partnerlink über /go/ und zeichnet ihn als bezahlt aus', () => {
    expect(produktLink(AMAZON)).toEqual({ href: '/go/amazon-produkt', rel: REL_PARTNERLINK, partner: true });
    expect(REL_PARTNERLINK).toMatch(/\bsponsored\b/);
    expect(REL_PARTNERLINK).toMatch(/\bnofollow\b/);
  });

  it('verlinkt alles andere direkt und ohne sponsored', () => {
    expect(produktLink(HERSTELLER)).toEqual({
      href: 'https://beefer.de/shop/beefer-pro-ii/',
      rel: REL_EXTERN,
      partner: false,
    });
    expect(REL_EXTERN).toBe('noopener noreferrer');
  });

  it('zählt nur den Partnerlink als Affiliate-Klick', () => {
    expect(klickKlassen(AMAZON, 'hero')).toContain('plausible-event-name=Affiliate-Klick');
    expect(klickKlassen(AMAZON, 'hero')).toContain('plausible-event-zone=hero');
    expect(klickKlassen(HERSTELLER)).toBe('');
  });
});

describe('Karten: Partnerlink', () => {
  it.each(Object.entries(karten(AMAZON)))('%s trägt „Anzeige“, /go/ und rel=sponsored', (_name, markup) => {
    expect(sichtbar(markup)).toMatch(/\bAnzeige\b/);
    const a = links(markup);
    expect(a.length).toBeGreaterThan(0);
    for (const tag of a) {
      expect(tag).toContain('href="/go/amazon-produkt"');
      expect(tag).toContain(`rel="${REL_PARTNERLINK}"`);
    }
  });
});

describe('Karten: kein Partnerlink', () => {
  it.each(Object.entries(karten(HERSTELLER)))('%s behauptet weder Anzeige noch Provision', (_name, markup) => {
    const text = sichtbar(markup);
    // „kein Partnerlink“ ist der ehrliche Hinweis — „Anzeige“ nur im Tabellen-Fußtext wäre falsch.
    expect(text).not.toMatch(/\bAnzeige\b/);
    expect(text).not.toMatch(/Provision|Affiliate/);
    const a = links(markup);
    expect(a.length).toBeGreaterThan(0);
    for (const tag of a) {
      expect(tag).toContain('href="https://beefer.de/shop/beefer-pro-ii/"');
      expect(tag).toContain(`rel="${REL_EXTERN}"`);
      expect(tag).not.toContain('sponsored');
      expect(tag).not.toContain('/go/');
      expect(tag).not.toContain('Affiliate-Klick');
    }
  });
});

describe('Registry: Händler ohne Partnerprogramm', () => {
  const OHNE_PROGRAMM = /(^|\.)(beefer\.de|dry-ager\.com|otto\.de)$/;
  const betroffen = getAllProducts().filter((p) => {
    try { return OHNE_PROGRAMM.test(new URL(p.affiliateUrl).hostname); } catch { return false; }
  });

  it('enthält die bekannten Fälle (sonst prüft dieser Test nichts)', () => {
    expect(betroffen.map((p) => p.id)).toEqual(
      expect.arrayContaining(['beefer-pro-ii', 'beefer-xl-ii', 'dry-ager-dx500', 'dry-ager-dx1000', 'ankarsrum-assistent-original']),
    );
  });

  it('zeigt bei keinem davon „Anzeige“ oder einen Provisions-Satz — in keiner Karte', () => {
    for (const product of betroffen) {
      const alle = {
        ...karten(product),
        HeroRecommendation: renderToStaticMarkup(createElement(HeroRecommendation, { productId: product.id, pitch: 'Pitch' })),
        EquipmentFooter: renderToStaticMarkup(createElement(EquipmentFooter, { productIds: [product.id] })),
        InlineAffiliate: inline(product.id),
      };
      for (const [name, markup] of Object.entries(alle)) {
        const text = sichtbar(markup);
        expect(text, `${product.id} · ${name}`).not.toMatch(/\bAnzeige\b/);
        expect(text, `${product.id} · ${name}`).not.toMatch(/Provision|Affiliate-Link/);
        for (const tag of links(markup)) {
          expect(tag, `${product.id} · ${name}`).not.toContain('sponsored');
          // Als Muster statt Zeichenkette: check-links.mjs liest sonst ein Linkziel „/go“ heraus.
          expect(tag, `${product.id} · ${name}`).not.toMatch(/href="\/go\//);
        }
      }
    }
  });
});

describe('Registry: Produkte mit Partnerlink', () => {
  it('bleiben gekennzeichnet — auch in Hero, Equipment-Liste und Fließtext', () => {
    const product = getProductById('meater-plus')!;
    expect(hatPartnerlink(product)).toBe(true);
    const alle = {
      ...karten(product),
      HeroRecommendation: renderToStaticMarkup(createElement(HeroRecommendation, { productId: product.id, pitch: 'Pitch' })),
      EquipmentFooter: renderToStaticMarkup(createElement(EquipmentFooter, { productIds: [product.id] })),
      InlineAffiliate: inline(product.id),
    };
    for (const [name, markup] of Object.entries(alle)) {
      expect(sichtbar(markup), name).toMatch(/\bAnzeige\b/);
      const produktLinks = links(markup).filter((tag) => tag.includes('/go/'));
      expect(produktLinks.length, name).toBeGreaterThan(0);
      for (const tag of produktLinks) expect(tag, name).toContain(`rel="${REL_PARTNERLINK}"`);
    }
  });

  it('mischt eine Equipment-Liste: „Anzeige“ nur an der Partner-Zeile', () => {
    const markup = renderToStaticMarkup(
      createElement(EquipmentFooter, { productIds: ['beefer-pro-ii', 'thermapen-one'] }),
    );
    const zeilen = markup.split('<li').slice(1);
    expect(zeilen).toHaveLength(2);
    expect(sichtbar(zeilen[0])).not.toMatch(/\bAnzeige\b/);
    expect(zeilen[0]).toContain(`rel="${REL_EXTERN}"`);
    expect(sichtbar(zeilen[1])).toMatch(/\bAnzeige\b/);
    expect(zeilen[1]).toContain(`rel="${REL_PARTNERLINK}"`);
  });
});

describe('preisStand / preisAnzeige', () => {
  it('nennt Monat und Jahr aus lastChecked', () => {
    expect(preisStand({ lastChecked: '2026-05-22' })).toBe('Stand Mai 2026');
    expect(preisStand({ lastChecked: '2026-03-01' })).toBe('Stand März 2026');
    expect(preisStand({ lastChecked: '2025-12-31' })).toBe('Stand Dezember 2025');
  });

  it('rät kein Datum', () => {
    for (const wert of ['', 'Mai 2026', '2026-13-01', '2026-00-10', undefined]) {
      expect(preisStand({ lastChecked: wert as unknown as string }), String(wert)).toBeNull();
    }
  });

  it('zeigt Einzelpreis und Spanne nur zusammen mit dem Stand', () => {
    expect(preisAnzeige({ price: 799, lastChecked: '2026-05-22' })).toEqual({ preis: '799 €', stand: 'Stand Mai 2026' });
    expect(preisAnzeige({ price: 999, priceMin: 849, priceMax: 1099, lastChecked: '2026-05-22' })).toEqual({
      preis: '849–1099 €',
      stand: 'Stand Mai 2026',
    });
    expect(preisAnzeige({ price: 799, lastChecked: '' })).toEqual({ preis: null, stand: null });
    expect(preisAnzeige({ price: 0, lastChecked: '2026-05-22' })).toEqual({ preis: null, stand: null });
  });
});

describe('Karten: Preis nie ohne Stand', () => {
  const EURO = /\d\s?€/;

  it('trägt in jeder Karte jedes Registry-Produkts den Stand am Preis', () => {
    for (const product of getAllProducts()) {
      const alle = {
        ...karten(product),
        HeroRecommendation: renderToStaticMarkup(createElement(HeroRecommendation, { productId: product.id, pitch: 'Pitch' })),
        EquipmentFooter: renderToStaticMarkup(createElement(EquipmentFooter, { productIds: [product.id] })),
      };
      for (const [name, markup] of Object.entries(alle)) {
        const text = sichtbar(markup);
        if (EURO.test(text)) {
          expect(text, `${product.id} · ${name}`).toMatch(/Stand (Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) 20\d\d/);
        }
      }
    }
  });

  it('zeigt ohne belegten Stand keinen Preis', () => {
    const ohneStand = { ...AMAZON, lastChecked: '' };
    for (const [name, markup] of Object.entries(karten(ohneStand))) {
      const text = sichtbar(markup);
      expect(text, name).not.toMatch(EURO);
      expect(text, name).toContain('Preis beim Anbieter prüfen');
    }
  });
});
