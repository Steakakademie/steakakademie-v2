import { describe, expect, it } from 'vitest';
import { DIPLOM_DANKE_PFAD, checkoutUrlFuer, diplomAngebot, diplomAngebotAus, preisLabelAus } from '@/lib/diplome/angebot';

/**
 * Waechter fuer den Diplom-Kaufweg (16.10.2026): Ohne Produkt-ID UND Preis zeigt
 * keine Seite einen Kauf-Button — die Aussage „derzeit noch nicht buchbar" muss
 * dann wahr bleiben (Zusagen-Regel, CLAUDE.md §2 Regel 12).
 */
describe('Diplom-Angebot', () => {
  it('ohne Variablen nicht kaufbar — und zwar wegen des Produkts, nicht des Preises', () => {
    expect(diplomAngebotAus({})).toEqual({ kaufbar: false, grund: 'kein-produkt' });
    expect(diplomAngebotAus({ produktId: '', preis: '99' })).toEqual({ kaufbar: false, grund: 'kein-produkt' });
  });

  it('eine Produkt-ID ohne Preis reicht nicht (kein Preis, kein Button)', () => {
    expect(diplomAngebotAus({ produktId: '777001' })).toEqual({ kaufbar: false, grund: 'kein-preis' });
    expect(diplomAngebotAus({ produktId: '777001', preis: '  ' })).toEqual({ kaufbar: false, grund: 'kein-preis' });
  });

  it('nur Ziffern gelten als Produkt-ID — eine eingefuegte URL oder ein Plan-Code nicht', () => {
    expect(diplomAngebotAus({ produktId: 'https://www.checkout-ds24.com/product/777001', preis: '99' }).kaufbar).toBe(false);
    expect(diplomAngebotAus({ produktId: 'abc', preis: '99' }).kaufbar).toBe(false);
    expect(diplomAngebotAus({ produktId: '1', preis: '99' }).kaufbar).toBe(false);
  });

  it('mit beidem kaufbar: Checkout-URL und Preis-Label stehen', () => {
    expect(diplomAngebotAus({ produktId: ' 777001 ', preis: '99' })).toEqual({
      kaufbar: true,
      produktId: '777001',
      checkoutUrl: 'https://www.checkout-ds24.com/product/777001',
      preisLabel: '99 €',
    });
    expect(checkoutUrlFuer('695900')).toBe('https://www.checkout-ds24.com/product/695900');
  });

  it('Preis-Label: Zahl wird deutsch formatiert, freier Text bleibt', () => {
    expect(preisLabelAus('99')).toBe('99 €');
    expect(preisLabelAus('99,00')).toBe('99 €');
    expect(preisLabelAus('149.5')).toBe('149,50 €');
    expect(preisLabelAus('99 € statt 149 €')).toBe('99 € statt 149 €');
  });

  it('im Test ist nichts gesetzt — das echte Angebot ist nicht kaufbar', () => {
    expect(diplomAngebot().kaufbar).toBe(false);
  });

  it('die Dankeseite liegt unter /danke/ wie die anderen Produkte', () => {
    expect(DIPLOM_DANKE_PFAD).toBe('/danke/diplom');
  });
});
