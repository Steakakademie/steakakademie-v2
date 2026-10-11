import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { alleAktionen, aktionBySlug, istAktiv } from '@/lib/aktionen';
import { heuteMMTT, imFenster, tageBisBeginn } from '@/lib/aktionen/typen';
import { getProductById } from '@/lib/products';
import { hatPartnerlink, REL_EXTERN, REL_PARTNERLINK } from '@/components/affiliate/produkt-anzeige';
import AktionProdukt from '@/components/affiliate/AktionProdukt';

/**
 * Aktionsseiten (11.10.2026): Jede YAML ist gültig, jedes Produkt existiert, das Fenster
 * rechnet in deutscher Zeit und über den Jahreswechsel, und die Produktzeile kennzeichnet
 * Partnerlinks — ohne Preis.
 */
describe('data/aktionen', () => {
  const aktionen = alleAktionen();

  it('enthält die beiden Seiten für 2026', () => {
    expect(aktionen.map((a) => a.slug)).toEqual(expect.arrayContaining(['geschenke', 'weihnachtsmenue']));
  });

  it('jedes Produkt jedes Setups steht in der Registry', () => {
    for (const a of aktionen) {
      for (const s of a.setups) {
        for (const p of s.produkte) {
          expect(getProductById(p.id), `${a.slug} › ${s.titel} › ${p.id}`).toBeTruthy();
        }
      }
    }
  });

  it('nennt keine Preise, Temperaturen oder Testurteile im Text (Regel 8c, Regel 12)', () => {
    for (const a of aktionen) {
      const text = JSON.stringify(a);
      expect(text, a.slug).not.toMatch(/\d\s?(€|Euro)/);
      expect(text, a.slug).not.toMatch(/\d\s?°\s?C/);
      // „Testurteil" darf im Text stehen, wenn erklaert wird, dass es keines gibt.
      expect(text, a.slug).not.toMatch(/getestet|Testsieger/i);
    }
  });
});

describe('Fenster', () => {
  it('Geschenke: 02.11.–24.12., Weihnachtsmenü: 15.11.–24.12.', () => {
    const g = aktionBySlug('geschenke')!;
    const w = aktionBySlug('weihnachtsmenue')!;
    // 12:00 UTC = 13:00 Berlin — eindeutig derselbe Tag.
    expect(istAktiv(g, new Date('2026-11-01T12:00:00Z'))).toBe(false);
    expect(istAktiv(g, new Date('2026-11-02T12:00:00Z'))).toBe(true);
    expect(istAktiv(g, new Date('2026-12-24T12:00:00Z'))).toBe(true);
    expect(istAktiv(g, new Date('2026-12-25T12:00:00Z'))).toBe(false);
    expect(istAktiv(w, new Date('2026-11-14T12:00:00Z'))).toBe(false);
    expect(istAktiv(w, new Date('2026-11-15T12:00:00Z'))).toBe(true);
  });

  it('rechnet in deutscher Zeit: 01.11. 23:30 UTC ist in Berlin schon der 02.11.', () => {
    expect(heuteMMTT(new Date('2026-11-01T23:30:00Z'))).toBe('11-02');
    expect(istAktiv(aktionBySlug('geschenke')!, new Date('2026-11-01T23:30:00Z'))).toBe(true);
  });

  it('Fenster über den Jahreswechsel (Neujahr 27.12.–31.01.)', () => {
    const f = { von: '12-27', bis: '01-31' };
    expect(imFenster(f, '12-30')).toBe(true);
    expect(imFenster(f, '01-15')).toBe(true);
    expect(imFenster(f, '02-01')).toBe(false);
    expect(imFenster(f, '12-26')).toBe(false);
  });

  it('tageBisBeginn: 0 im Fenster, sonst Tage bis zum nächsten Beginn', () => {
    const f = { von: '11-02', bis: '12-24' };
    expect(tageBisBeginn(f, new Date('2026-11-10T12:00:00Z'))).toBe(0);
    expect(tageBisBeginn(f, new Date('2026-10-23T12:00:00Z'))).toBe(10);
    expect(tageBisBeginn(f, new Date('2026-12-30T12:00:00Z'))).toBe(307);
  });
});

describe('AktionProdukt', () => {
  const sichtbar = (m: string) => m.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  it('kennzeichnet den Amazon-Partnerlink mit „Anzeige", rel=sponsored und direktem Ziel — ohne Preis', () => {
    const p = getProductById('meater-plus')!;
    expect(hatPartnerlink(p)).toBe(true);
    const markup = renderToStaticMarkup(createElement(AktionProdukt, { id: p.id, warum: 'Darum, weil es gut misst und lange hält.' }));
    expect(sichtbar(markup)).toMatch(/\bAnzeige\b/);
    expect(markup).toContain(`rel="${REL_PARTNERLINK}"`);
    // Bis PR #390 (Amazon direkt) gemergt ist, liefert produktLink /go/<id>; danach die Amazon-URL.
    expect(markup).toMatch(/href="(https:\/\/(www\.)?amazon\.de\/|\/go\/meater-plus)/);
    expect(markup).toContain('plausible-event-name=Affiliate-Klick');
    expect(sichtbar(markup)).not.toMatch(/\d\s?€/);
  });

  it('zeigt bei einem Händler ohne Programm weder „Anzeige" noch Provisions-Satz', () => {
    const p = getProductById('beefer-pro-ii')!;
    expect(hatPartnerlink(p)).toBe(false);
    const markup = renderToStaticMarkup(createElement(AktionProdukt, { id: p.id, warum: 'Darum, weil die Kruste in Sekunden kommt.' }));
    expect(sichtbar(markup)).not.toMatch(/\bAnzeige\b|Provision/);
    expect(markup).toContain(`rel="${REL_EXTERN}"`);
  });

  it('rendert nichts für eine unbekannte ID', () => {
    expect(renderToStaticMarkup(createElement(AktionProdukt, { id: 'gibt-es-nicht', warum: 'x'.repeat(30) }))).toBe('');
  });
});
