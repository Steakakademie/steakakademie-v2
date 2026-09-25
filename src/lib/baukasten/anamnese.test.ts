import { describe, expect, it } from 'vitest';
import { werteAus, aktiveFragen, bereinige, vollstaendig, projektakte, type Antworten } from './anamnese';
import { betrag, formatBetrag, mietkaufRate, PREISE } from './preise';

const basis: Antworten = {
  vorhaben: 'neu', branche: 'handwerk', land: 'DE', groesse: '2-9',
  ziele: ['anfragen'], leistungen: '1-3', sprachen: 'de', vorhanden: ['logo', 'fotos', 'texte'],
  betrieb: 'ihr-pflegt', sichtbarkeit: 'lokal', termin: 'flexibel', zahlung: 'einmalig', rahmen: 'bis-3000',
};
const mit = (x: Partial<Antworten>): Antworten => ({ ...basis, ...x });

describe('Preisliste', () => {
  it('Konzept-Beispiele Mietkauf: Fundament + Basis = 94, Rohbau + Standard = 169', () => {
    expect(mietkaufRate(990, 49)).toBe(94);
    expect(mietkaufRate(1990, 79)).toBe(169);
  });
  it('CHF: feste Preise aus dem Konzept, sonst EUR × 1,2 gerundet', () => {
    expect(betrag(PREISE.rohbau, 'CHF')).toBe(2390);
    expect(betrag(PREISE.karriereAb, 'CHF')).toBe(830);
    expect(betrag(PREISE.artikeltextMin, 'CHF')).toBe(11);
    expect(formatBetrag(2390, 'CHF')).toBe('CHF 2’390');
    expect(formatBetrag(1990, 'EUR')).toBe('1.990 €');
  });
});

describe('Projekt-Anamnese — 10 Testfälle (Prüfpunkt Stufe 1)', () => {
  it('1 Handwerker, 1–3 Leistungen → S, Fundament 990 €', () => {
    const e = werteAus(basis);
    expect(e.stufe).toBe('S');
    expect(e.paket).toBe('Fundament');
    expect(e.einmalig).toEqual({ betrag: 990, ab: false, offenePositionen: false });
    expect(e.naechsterSchritt).toBe('angebot');
  });

  it('2 Handwerker mit 6 Leistungen + Azubisuche → Rohbau + Karriere-Website', () => {
    const e = werteAus(mit({ leistungen: '4-8', ziele: ['anfragen', 'mitarbeiter'], stellen: '2-5' }));
    expect(e.stufe).toBe('S');
    expect(e.paket).toBe('Rohbau');
    expect(e.einmalig.betrag).toBe(1990 + 690);
    expect(e.einmalig.ab).toBe(true);
  });

  it('3 Blog → M, Schlüsselfertig; Karriere-Baustein ist enthalten', () => {
    const e = werteAus(mit({ ziele: ['blog', 'mitarbeiter'], stellen: '1' }));
    expect(e.stufe).toBe('M');
    expect(e.einmalig.betrag).toBe(3490);
    expect(e.positionen.find((p) => p.label.startsWith('Karriere'))?.enthalten).toBe(true);
  });

  it('4 Kleiner Shop mit Karriere → M; Shop (teuerster) enthalten, Karriere kostet extra', () => {
    const e = werteAus(mit({ ziele: ['verkaufen', 'mitarbeiter'], artikel: 'bis-50', artikelMaterial: 'beides', stellen: '1' }));
    expect(e.stufe).toBe('M');
    expect(e.positionen.find((p) => p.label.startsWith('Webshop'))?.enthalten).toBe(true);
    expect(e.einmalig.betrag).toBe(3490 + 690);
  });

  it('5 Großer Shop (51–500 Artikel) → L, Wertgespräch, kein Mietkauf', () => {
    const e = werteAus(mit({ ziele: ['verkaufen'], artikel: '51-500', artikelMaterial: 'nichts', zahlung: 'monatlich', rahmen: 'bis-10000' }));
    expect(e.stufe).toBe('L');
    expect(e.naechsterSchritt).toBe('wertgespraech');
    expect(e.mietkauf).toBeNull();
    expect(e.positionen.some((p) => p.art === 'stueck')).toBe(true);
  });

  it('6 Aha-Effekt mit Rahmen > 10.000 € → XL; ohne großen Rahmen nur Hinweis', () => {
    expect(werteAus(mit({ ziele: ['eindruck'], rahmen: 'darueber' })).stufe).toBe('XL');
    const klein = werteAus(mit({ ziele: ['eindruck'], rahmen: 'bis-3000' }));
    expect(klein.stufe).toBe('S');
    expect(klein.hinweise.some((h) => h.includes('Aha-Effekt'))).toBe(true);
  });

  it('7 Modernisierung ohne Zugänge → Migrationspauschale + Befreiung (angerechnet)', () => {
    const e = werteAus(mit({ vorhaben: 'modernisieren', url: 'https://alt.example', zugaenge: 'nein', leistungen: '4-8' }));
    expect(e.einmalig.betrag).toBe(1990 + 390);
    expect(e.positionen.find((p) => p.label.startsWith('Befreiung'))?.enthalten).toBe(true);
    expect(e.markierungen).toEqual(expect.arrayContaining(['Modernisierung', 'Befreiung nötig']));
  });

  it('8 Schweiz, Mietkauf → CHF-Preise und Rate', () => {
    const e = werteAus(mit({ land: 'CH', leistungen: '4-8', zahlung: 'monatlich' }));
    expect(e.waehrung).toBe('CHF');
    expect(e.einmalig.betrag).toBe(2390);
    expect(e.mietkauf).toEqual({ rate: mietkaufRate(2390, 95), monate: 24 });
    expect(e.hinweise.some((h) => h.includes('Schweiz'))).toBe(true);
  });

  it('9 Selbst bauen + knapper Rahmen → Weichen Eigenregie und Budget', () => {
    const e = werteAus(mit({ betrieb: 'selbst-bauen', leistungen: '9-15', rahmen: 'bis-1000' }));
    const arten = e.weichen.map((w) => w.art);
    expect(arten).toContain('eigenregie');
    expect(arten).toContain('budget');
  });

  it('10 Gleiche Antworten → gleiches Ergebnis; Freitext 24/7 wird ehrlich beantwortet', () => {
    const a = mit({ freitext: 'Wir brauchen jemanden, der 24/7 erreichbar ist.' });
    expect(werteAus(a)).toEqual(werteAus({ ...a }));
    expect(werteAus(a).weichen.some((w) => w.art === 'ehrlich')).toBe(true);
    expect(werteAus(a).markierungen).toContain('Freitext lesen');
  });
});

describe('Verzweigung', () => {
  it('Shop- und Karrierefragen erscheinen nur bei passendem Ziel', () => {
    const keys = aktiveFragen(basis).map((f) => f.key);
    expect(keys).not.toContain('artikel');
    expect(keys).not.toContain('stellen');
    expect(keys).not.toContain('url');
    const keys2 = aktiveFragen(mit({ ziele: ['verkaufen', 'mitarbeiter'], vorhaben: 'modernisieren' })).map((f) => f.key);
    expect(keys2).toEqual(expect.arrayContaining(['artikel', 'artikelMaterial', 'stellen', 'url', 'zugaenge']));
  });

  it('bereinige entfernt verwaiste Antworten (Shop abgewählt)', () => {
    const b = bereinige({ ...basis, artikel: '51-500' });
    expect(b.artikel).toBeUndefined();
    expect(werteAus(b as Antworten).stufe).toBe('S');
  });

  it('vollstaendig erkennt fehlende Pflichtantworten', () => {
    expect(vollstaendig(basis)).toBe(true);
    expect(vollstaendig({ ...basis, ziele: [] })).toBe(false);
  });

  it('Projektakte bleibt unter dem Limit der Kontakt-Route', () => {
    const a = mit({ freitext: 'x'.repeat(4000) });
    const t = projektakte(a, werteAus(a), (n) => formatBetrag(n, 'EUR'));
    expect(t.length).toBeLessThanOrEqual(4800);
    expect(t).toContain('PROJEKT-ANAMNESE');
  });
});
