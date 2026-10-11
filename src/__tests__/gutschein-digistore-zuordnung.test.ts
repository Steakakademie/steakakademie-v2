/**
 * Geschenkgutscheine: Digistore-Zuordnung (Migration 20261011080159), 11.10.2026.
 *
 * Die Migration ordnet die drei in Digistore24 angelegten Gutschein-Produkte den Kursen zu.
 * Eine falsche Zahl dort heißt: Käufer zahlt, Beschenkter bekommt zu wenig oder gar nichts.
 * Der Test hält Produkt-IDs, Credit-Mengen und die Abbruchkontrolle fest und bindet sie an
 * die Karten auf /gutschein (src/lib/gutschein-products.ts).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { GIFTABLE_PRODUCTS } from '@/lib/gutschein-products';

const SQL = readFileSync('supabase/migrations/20261011080159_gutschein_digistore_zuordnung.sql', 'utf8');
// Kommentare zählen nicht: dort dürfen die Werte noch einmal stehen.
const CODE = SQL.split('\n').filter((z) => !/^\s*--/.test(z)).join('\n');

const zeile = (id: string) => {
  const m = CODE.match(new RegExp(`SELECT '${id}', id, (true|false), ([0-9]+|NULL), (NULL|[0-9]+) FROM public\\.courses WHERE slug = '([a-z-]+)'`));
  return m ? { voucher: m[1], voucherCredits: m[2], credit: m[3], kurs: m[4] } : null;
};

describe('Gutschein-Zuordnung zu Digistore', () => {
  it('G1 746579: Steak-Beichte, Credit-Gutschein über 1 Diagnose', () => {
    expect(zeile('746579')).toEqual({ voucher: 'true', voucherCredits: '1', credit: 'NULL', kurs: 'steak-beichte' });
  });

  it('G2 746580: Steak-Beichte 5er, Credit-Gutschein über 5 Diagnosen', () => {
    expect(zeile('746580')).toEqual({ voucher: 'true', voucherCredits: '5', credit: 'NULL', kurs: 'steak-beichte' });
  });

  it('G3 746581: Mein Protokoll, Kurs-Gutschein ohne Credits', () => {
    expect(zeile('746581')).toEqual({ voucher: 'true', voucherCredits: 'NULL', credit: 'NULL', kurs: 'mein-protokoll' });
  });

  it('kein Gutschein-Produkt darf als Credit-Kauf des Käufers laufen (credit_amount bleibt NULL)', () => {
    // Nur Zuweisungen an die Spalte credit_amount (Zeilenanfang im SET-Block), nicht der Vergleich
    // „voucher_credit_amount = 1" in der Kontrolle.
    expect(CODE).not.toMatch(/^\s*credit_amount\s*=\s*[1-9]/m);
    for (const m of CODE.matchAll(/^\s*credit_amount = (\w+)/gm)) expect(m[1]).toBe('NULL');
  });

  it('genau drei Produkt-IDs, und die Migration bricht ab, wenn nicht alle drei Zeilen stehen', () => {
    expect([...CODE.matchAll(/SELECT '(\d+)', id/g)].map((m) => m[1]).sort()).toEqual(['746579', '746580', '746581']);
    expect(CODE).toContain('IF anzahl <> 3 THEN');
    expect(CODE).toContain('RAISE EXCEPTION');
  });

  it('die Gutschein-Karten auf /gutschein gehören zu denselben Kursen', () => {
    const kurs = (key: string) => GIFTABLE_PRODUCTS.find((p) => p.key === key)?.courseSlug;
    expect(kurs('steak-beichte')).toBe('steak-beichte');
    expect(kurs('steak-beichte-5er')).toBe('steak-beichte');
    expect(kurs('mein-protokoll')).toBe('mein-protokoll');
  });

  it('die Preise auf den Karten stimmen mit dem Sortiment vom 09.10.2026 überein', () => {
    const preis = (key: string) => GIFTABLE_PRODUCTS.find((p) => p.key === key)?.priceLabel;
    expect(preis('steak-beichte')).toBe('7 €');
    expect(preis('steak-beichte-5er')).toBe('25 €');
    expect(preis('mein-protokoll')).toBe('19 €');
  });
});
