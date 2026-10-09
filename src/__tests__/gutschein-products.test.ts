import { describe, it, expect } from 'vitest';
import {
  type GiftableProduct,
  sichtbareGutscheine,
  kaufbareGutscheine,
  gutscheinKaufbar,
  istGeschenkSaison,
  kanonischerCode,
  sichtbareWertgutscheine,
  WERTGUTSCHEINE,
  WERTGUTSCHEINE_AKTIV,
} from '@/lib/gutschein-products';

describe('Wertgutscheine (T10): Schalter vor Checkout', () => {
  const mitCheckout = WERTGUTSCHEINE.map((w) => ({ ...w, checkoutUrl: `https://checkout/${w.key}` }));

  it('Schalter ist aus, bis T9 steht — dann erscheint nichts, auch mit Checkout', () => {
    expect(WERTGUTSCHEINE_AKTIV).toBe(false);
    expect(sichtbareWertgutscheine(false, mitCheckout)).toEqual([]);
  });

  it('mit Schalter erscheinen nur Werte mit Checkout', () => {
    const teil = mitCheckout.map((w) => (w.wertEuro === 75 ? { ...w, checkoutUrl: undefined } : w));
    expect(sichtbareWertgutscheine(true, teil).map((w) => w.wertEuro)).toEqual([25, 50, 100]);
  });

  it('Sortiment laut Uwe: 25, 50, 75, 100 €', () => {
    expect(WERTGUTSCHEINE.map((w) => w.wertEuro)).toEqual([25, 50, 75, 100]);
  });
});

/** Gutschein-Konzept T2/T5/T8 (09.10.2026): welche Karte erscheint wann. */

const liste: GiftableProduct[] = [
  { key: 'mp', courseSlug: 'mein-protokoll', title: 'Mein Protokoll', priceLabel: '19 €', blurb: '', checkoutUrl: 'https://checkout/mp' },
  { key: 'sb', courseSlug: 'steak-beichte', title: 'Steak-Beichte', priceLabel: '7 €', blurb: '' },
  { key: 'sb5', courseSlug: 'steak-beichte', title: 'Steak-Beichte 5er', priceLabel: '25 €', blurb: '', checkoutUrl: 'https://checkout/sb5' },
  { key: 'dip-ohne', courseSlug: 'grillmeister-diplom', title: 'Diplom', blurb: '', nurMitCheckout: true },
  { key: 'dip-ohne-preis', courseSlug: 'grillmeister-diplom', title: 'Diplom', blurb: '', checkoutUrl: 'https://checkout/dip', nurMitCheckout: true },
];

describe('Gutschein-Karten', () => {
  it('„In Vorbereitung" bleibt sichtbar, das Diplom erst mit Checkout UND Preis', () => {
    expect(sichtbareGutscheine(liste).map((p) => p.key)).toEqual(['mp', 'sb', 'sb5']);
    const mitPreis = [...liste, { ...liste[4], key: 'dip', priceLabel: '99 €' }];
    expect(sichtbareGutscheine(mitPreis).map((p) => p.key)).toContain('dip');
  });

  it('kaufbar ist nur, was einen Checkout hat', () => {
    expect(kaufbareGutscheine(liste).map((p) => p.key)).toEqual(['mp', 'sb5']);
  });

  it('ein Kurs ist verschenkbar, sobald irgendeiner seiner Gutscheine kaufbar ist (5er reicht)', () => {
    expect(gutscheinKaufbar('steak-beichte', liste)).toBe(true);
    expect(gutscheinKaufbar('grillmeister-diplom', liste)).toBe(false);
    expect(gutscheinKaufbar('steak-beichte', liste.filter((p) => p.key !== 'sb5'))).toBe(false);
  });

  it('ohne gesetzte Variablen ist im echten Regal nichts kaufbar', () => {
    // Im Test sind keine NEXT_PUBLIC_DS_VOUCHER_* gesetzt.
    expect(kaufbareGutscheine()).toEqual([]);
    expect(sichtbareGutscheine().map((p) => p.key)).toEqual(['mein-protokoll', 'steak-beichte', 'steak-beichte-5er']);
  });
});

describe('Geschenk-Saison (deutsche Zeit)', () => {
  it('31.10. 23:30 Uhr Berlin ist noch keine Saison, 01.11. 00:30 Uhr schon', () => {
    expect(istGeschenkSaison(new Date('2026-10-31T22:30:00Z'))).toBe(false);
    expect(istGeschenkSaison(new Date('2026-10-31T23:30:00Z'))).toBe(true);
  });

  it('24.12. gehört dazu, 25.12. nicht mehr', () => {
    expect(istGeschenkSaison(new Date('2026-12-24T22:00:00Z'))).toBe(true);
    expect(istGeschenkSaison(new Date('2026-12-24T23:30:00Z'))).toBe(false);
  });

  it('Sommer ist keine Saison', () => {
    expect(istGeschenkSaison(new Date('2026-07-15T12:00:00Z'))).toBe(false);
  });
});

describe('kanonischer Gutschein-Code', () => {
  it('wie redeem_voucher: trimmen, Leerzeichen raus, Großbuchstaben', () => {
    expect(kanonischerCode('  sa-ab cd-efgh ')).toBe('SA-ABCD-EFGH');
  });
});
