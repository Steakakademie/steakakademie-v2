import { describe, expect, it } from 'vitest';
import { ALL_CUTS } from '@/lib/cuts-catalog';
import { AMAZON_TAG, buildMeatTargetUrl, getMeatOffer } from '@/lib/cut-affiliate';

/**
 * Fleisch-Kaufknopf (11.10.2026): Solange kein Premium-Partner aktiv ist, fuehrt der
 * Knopf direkt zur Amazon-Suche mit Partner-Tag — nicht mehr ueber /go-fleisch
 * (Amazon-Programmrichtlinien, siehe produkt-anzeige.ts). Gezaehlt wird im Browser.
 */
describe('getMeatOffer ohne Premium-Partner', () => {
  const cut = ALL_CUTS[0];
  const offer = getMeatOffer(cut);

  it('verlinkt direkt zu Amazon mit Partner-Tag', () => {
    expect(offer.premiumActive).toBe(false);
    expect(offer.href).toMatch(/^https:\/\/www\.amazon\.de\/s\?k=/);
    expect(offer.href).toContain(`tag=${AMAZON_TAG}`);
    expect(offer.href).toBe(buildMeatTargetUrl(cut));
    expect(offer.href).not.toContain('/go-fleisch/');
  });

  it('traegt die Plausible-Klassen fuer die Zaehlung im Browser', () => {
    expect(offer.klickKlassen).toContain('plausible-event-name=Affiliate-Klick');
    expect(offer.klickKlassen).toContain(`plausible-event-produkt=${cut.id}`);
    expect(offer.klickKlassen).toContain('plausible-event-provider=amazon');
  });

  it('kennzeichnet den Knopf als Anzeige', () => {
    expect(offer.disclosure).toMatch(/^Anzeige/);
  });
});
