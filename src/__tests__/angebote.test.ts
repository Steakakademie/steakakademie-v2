import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { abText, hinweisImText, markeVon, passendeHinweise, regal } from '@/lib/angebote/auswahl';
import { angebot, angebote, hinweiseFuer, verkaufsstand } from '@/lib/angebote/register';
import { AngebotSchema, RegisterSchema, type Angebot } from '@/lib/angebote/typen';
import { PAKETE } from '@/lib/mein-protokoll/guthaben';

/**
 * Angebots-Register: Form, Auswahl und die Regeln aus dem Konzept
 * (Anlass statt Banner · pausiert erscheint nie · ehrlicher Status).
 */

const HEUTE = new Date('2026-10-02T12:00:00Z');

const basis = (teil: Partial<Angebot> & { id: string }): Angebot => AngebotSchema.parse({
  name: `Angebot ${teil.id}`, url: `/${teil.id}`, art: 'gratis', status: 'live', preis_text: 'Kostenlos', knopf: 'Öffnen',
  anlaesse: [{ typ: 'rezept', satz: `Satz für ${teil.id}, lang genug.` }],
  ...teil,
});

describe('Register (data/angebote.yaml)', () => {
  it('lädt und besteht die Formprüfung', () => {
    expect(angebote().length).toBeGreaterThanOrEqual(10);
  });

  it('jedes Ziel ist eine vorhandene Seite — kein Hinweis führt ins Leere', () => {
    const fehlend = angebote()
      .filter((a) => !existsSync(join(process.cwd(), 'src', 'app', ...a.url.split('/').filter(Boolean), 'page.tsx')))
      .map((a) => `${a.id} → ${a.url}`);
    expect(fehlend).toEqual([]);
  });

  it('jedes nicht pausierte Angebot hat mindestens einen Anlass', () => {
    const ohne = angebote().filter((a) => a.status !== 'pausiert' && a.anlaesse.length === 0).map((a) => a.id);
    expect(ohne).toEqual([]);
  });

  it('Geschäftsfeld 3 und zurückgestellte Produkte erscheinen nirgends', () => {
    for (const id of ['eigenregie', 'gruender-schmiede', 'steuer-matrix', 'fleischpass', 'gutscheine']) {
      expect(angebot(id).status, id).toBe('pausiert');
    }
    const alle = [
      ...passendeHinweise(angebote(), { typ: 'rezept', slug: 'x', felder: { kategorie: 'fleisch', difficulty: 'Einfach' } }, HEUTE),
      ...passendeHinweise(angebote(), { typ: 'glossar', slug: 'x', felder: { category: 'Techniken & Methoden' } }, HEUTE),
      ...passendeHinweise(angebote(), { typ: 'temperatur-guide', slug: 'temperatur-guide' }, HEUTE),
    ].map((h) => h.id);
    for (const id of ['eigenregie', 'gruender-schmiede', 'steuer-matrix', 'fleischpass', 'gutscheine']) {
      expect(alle).not.toContain(id);
    }
  });

  it('Steak-Beichte: vor dem Verkaufsstart kein Kaufknopf, der Hinweis trägt das Datum', () => {
    // Uwe, 02.10.2026: bis zur Gewerbeanmeldung keine bezahlten Bestellungen.
    // Wird der Status auf `live` gestellt, ist dieser Test bewusst anzupassen.
    expect(verkaufsstand('steak-beichte')).toEqual({ kaufbar: false, hinweis: 'Verkaufsstart geplant: 1. November 2026' });
    const h = passendeHinweise(angebote(), { typ: 'rezept', slug: 'x', felder: { kategorie: 'fleisch', difficulty: 'Profi' } }, HEUTE)
      .find((x) => x.id === 'steak-beichte');
    expect(h?.marke).toBe('ab 1. November');
  });

  it('pausierte Angebote sind nie kaufbar', () => {
    expect(verkaufsstand('fleischpass').kaufbar).toBe(false);
    expect(verkaufsstand('gruender-schmiede').kaufbar).toBe(false);
  });

  it('der Preis von Mein Protokoll stimmt mit dem Paketpreis im Code überein', () => {
    expect(angebot('mein-protokoll').preis_text).toContain(`${PAKETE[0].preis} €`);
  });

  it('Mein Protokoll trägt bis zum Verkaufsstart das Datum statt eines Preises', () => {
    const mp = hinweiseFuer({ typ: 'temperatur-guide', slug: 'temperatur-guide' });
    const eintrag = [mp.imText, ...mp.regal].find((h) => h?.id === 'mein-protokoll');
    expect(eintrag).toBeTruthy();
    expect(markeVon(angebot('mein-protokoll'), HEUTE)).toBe('ab 1. November');
  });
});

describe('Formprüfung', () => {
  it('ab_datum ohne Datum, pausiert ohne Grund, pausiert mit Anlass und doppelte id werden abgelehnt', () => {
    const gut = { id: 'a', name: 'A A', url: '/a', art: 'gratis', status: 'live', preis_text: '', knopf: 'Los', anlaesse: [] };
    expect(AngebotSchema.safeParse({ ...gut, status: 'ab_datum' }).success).toBe(false);
    expect(AngebotSchema.safeParse({ ...gut, status: 'ab_datum', ab: '2026-11-01' }).success).toBe(true);
    expect(AngebotSchema.safeParse({ ...gut, status: 'pausiert' }).success).toBe(false);
    expect(AngebotSchema.safeParse({ ...gut, status: 'pausiert', grund: 'x', anlaesse: [{ typ: 'rezept', satz: 'Ein Satz, lang genug.' }] }).success).toBe(false);
    expect(RegisterSchema.safeParse({ angebote: [gut, gut] }).success).toBe(false);
    expect(AngebotSchema.safeParse({ ...gut, tippfehler: 1 }).success).toBe(false);
  });
});

describe('Auswahl', () => {
  it('Anlass statt Banner: ohne zutreffenden Anlass kein Hinweis', () => {
    expect(hinweiseFuer({ typ: 'glossar', slug: 'gusseisen', felder: { category: 'Ausrüstung' } }).imText).toBeNull();
    expect(hinweiseFuer({ typ: 'glossar', slug: 'ohne-kategorie' }).imText).toBeNull();
  });

  it('Bedingungen: alle Felder müssen passen, eine Liste heißt „eines davon", Groß/klein und Anführungszeichen egal', () => {
    const a = basis({ id: 'nur-einfach', anlaesse: [{ typ: 'rezept', wenn: { kategorie: 'fleisch', difficulty: ['Einfach', 'Mittel'] }, satz: 'Ein Satz, lang genug.' }] });
    const f = (felder: Record<string, string>) => hinweisImText([a], { typ: 'rezept', slug: 's', felder }, HEUTE);
    expect(f({ kategorie: 'fleisch', difficulty: 'Mittel' })).not.toBeNull();
    expect(f({ kategorie: 'Fleisch', difficulty: '"Mittel"' })).not.toBeNull();
    expect(f({ kategorie: 'fleisch', difficulty: 'Profi' })).toBeNull();
    expect(f({ kategorie: 'fisch', difficulty: 'Mittel' })).toBeNull();
    expect(f({ kategorie: 'fleisch' })).toBeNull();
    expect(hinweisImText([a], { typ: 'glossar', slug: 's', felder: { kategorie: 'fleisch', difficulty: 'Mittel' } }, HEUTE)).toBeNull();
  });

  it('pausierte Angebote werden nie gewählt', () => {
    const p = { ...basis({ id: 'pausiert' }), status: 'pausiert' as const };
    expect(passendeHinweise([p], { typ: 'rezept', slug: 's' }, HEUTE)).toEqual([]);
  });

  it('dieselbe Seite bekommt immer denselben Hinweis', () => {
    const liste = [basis({ id: 'a' }), basis({ id: 'b' }), basis({ id: 'c' })];
    const eins = passendeHinweise(liste, { typ: 'rezept', slug: 'ribeye-reverse-sear' }, HEUTE).map((h) => h.id);
    const zwei = passendeHinweise([...liste].reverse(), { typ: 'rezept', slug: 'ribeye-reverse-sear' }, HEUTE).map((h) => h.id);
    expect(eins).toEqual(zwei);
  });

  it('verschiedene Seiten verteilen sich auf die passenden Angebote; höheres Gewicht steht öfter vorn', () => {
    const liste = [basis({ id: 'leicht' }), basis({ id: 'schwer', gewicht: 3 }), basis({ id: 'mittel', gewicht: 2 })];
    const zaehler: Record<string, number> = { leicht: 0, schwer: 0, mittel: 0 };
    for (let i = 0; i < 600; i++) zaehler[hinweisImText(liste, { typ: 'rezept', slug: `rezept-${i}` }, HEUTE)!.id] += 1;
    expect(zaehler.leicht).toBeGreaterThan(40);
    expect(zaehler.schwer).toBeGreaterThan(zaehler.mittel);
    expect(zaehler.mittel).toBeGreaterThan(zaehler.leicht);
  });

  it('das Regal zeigt höchstens drei und nie das Angebot, das schon im Text steht', () => {
    const liste = ['a', 'b', 'c', 'd', 'e'].map((id) => basis({ id }));
    const k = { typ: 'rezept' as const, slug: 'picanha' };
    const imText = hinweisImText(liste, k, HEUTE)!;
    const r = regal(liste, k, { ohne: imText.id }, HEUTE);
    expect(r).toHaveLength(3);
    expect(r.map((h) => h.id)).not.toContain(imText.id);
  });

  it('Marke: gratis heißt „Kostenlos", Warteliste „Warteliste", bezahlt nennt den Preis, vor dem Start das Datum', () => {
    expect(markeVon(basis({ id: 'g' }), HEUTE)).toBe('Kostenlos');
    expect(markeVon(basis({ id: 'w', art: 'warteliste', status: 'warteliste' }), HEUTE)).toBe('Warteliste');
    expect(markeVon(basis({ id: 'b', art: 'bezahlt', preis_text: 'ab 19 €' }), HEUTE)).toBe('ab 19 €');
    expect(markeVon(basis({ id: 'd', art: 'bezahlt', status: 'ab_datum', ab: '2026-11-01', preis_text: 'ab 19 €' }), HEUTE)).toBe('ab 1. November');
    expect(abText('2026-11-01', new Date('2027-01-05'))).toBe('ab 1. November 2026');
  });
});
