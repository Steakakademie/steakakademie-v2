import { describe, it, expect } from 'vitest';
import {
  PersonalisierungSchema,
  berlinDatumStunde,
  berlinZuUtc,
  maskiereEmail,
  motivOderStandard,
  pruefeTermin,
  schluesselGleich,
  versandZeitText,
} from '@/lib/gutschein-personalisierung';

/**
 * Personalisierung und Wunschtermin (Uwe, 11.10.2026). Die Zeitrechnung ist der
 * heikle Teil: „24.12., 8 Uhr" heißt deutsche Zeit, und die liegt je nach Jahreszeit
 * eine oder zwei Stunden vor UTC.
 */
describe('berlinZuUtc', () => {
  it('Winterzeit: 24.12.2026 8 Uhr Berlin = 07:00 UTC', () => {
    expect(berlinZuUtc('2026-12-24', 8).toISOString()).toBe('2026-12-24T07:00:00.000Z');
  });
  it('Sommerzeit: 14.05.2027 (Vatertag-Woche) 9 Uhr Berlin = 07:00 UTC', () => {
    expect(berlinZuUtc('2027-05-14', 9).toISOString()).toBe('2027-05-14T07:00:00.000Z');
  });
  it('Tag der Umstellung: 28.03.2027 10 Uhr Berlin (schon Sommerzeit) = 08:00 UTC', () => {
    expect(berlinZuUtc('2027-03-28', 10).toISOString()).toBe('2027-03-28T08:00:00.000Z');
  });
  it('Hin und zurück ergibt denselben Tag und dieselbe Stunde', () => {
    expect(berlinDatumStunde(berlinZuUtc('2026-12-24', 8))).toEqual({ datum: '2026-12-24', stunde: 8 });
  });
  it('versandZeitText zeigt deutsche Zeit', () => {
    expect(versandZeitText('2026-12-24T07:00:00.000Z')).toBe('24.12.2026, 8:00 Uhr');
  });
});

describe('pruefeTermin', () => {
  const jetzt = new Date('2026-11-05T10:00:00Z');
  const gueltigBis = new Date('2029-12-31T22:59:59Z');

  it('Termin in der Zukunft ist in Ordnung', () => {
    expect(pruefeTermin(berlinZuUtc('2026-12-24', 8), gueltigBis, jetzt)).toBeNull();
  });
  it('Termin in der Vergangenheit oder zu knapp wird abgelehnt', () => {
    expect(pruefeTermin(new Date('2026-11-05T10:05:00Z'), gueltigBis, jetzt)).toMatch(/Vergangenheit|knapp/);
  });
  it('mehr als 400 Tage im Voraus wird abgelehnt', () => {
    expect(pruefeTermin(new Date('2028-01-01T08:00:00Z'), gueltigBis, jetzt)).toMatch(/400 Tage/);
  });
  it('nach Ablauf des Gutscheins wird abgelehnt', () => {
    expect(pruefeTermin(new Date('2026-12-24T07:00:00Z'), new Date('2026-12-01T00:00:00Z'), jetzt)).toMatch(/Ablauf/);
  });
});

describe('PersonalisierungSchema', () => {
  const basis = { code: 'SA-ABCD-EFGH', k: 'x'.repeat(36), motiv: 'weihnachten' };

  it('selbst weitergeben braucht keine Adresse; leere Texte werden null', () => {
    const r = PersonalisierungSchema.safeParse({ ...basis, versand: 'selbst', empfaengerName: '  ', nachricht: 'Viel Spaß' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.empfaengerName).toBeNull();
      expect(r.data.nachricht).toBe('Viel Spaß');
    }
  });
  it('Versand per Mail braucht Adresse, Absendername und Zeitpunkt', () => {
    const r = PersonalisierungSchema.safeParse({ ...basis, versand: 'mail' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const felder = r.error.issues.map((i) => i.path[0]);
      expect(felder).toEqual(expect.arrayContaining(['empfaengerEmail', 'schenkerName', 'zeitpunkt']));
    }
  });
  it('Termin braucht Tag und Stunde', () => {
    const r = PersonalisierungSchema.safeParse({
      ...basis, versand: 'mail', empfaengerEmail: 'papa@example.de', schenkerName: 'Anna', zeitpunkt: 'termin',
    });
    expect(r.success).toBe(false);
  });
  it('Stunde außerhalb 6–22 Uhr wird abgelehnt', () => {
    const r = PersonalisierungSchema.safeParse({
      ...basis, versand: 'mail', empfaengerEmail: 'papa@example.de', schenkerName: 'Anna',
      zeitpunkt: 'termin', datum: '2026-12-24', stunde: 3,
    });
    expect(r.success).toBe(false);
  });
  it('unbekanntes Motiv wird abgelehnt', () => {
    expect(PersonalisierungSchema.safeParse({ ...basis, motiv: 'halloween', versand: 'selbst' }).success).toBe(false);
  });
  it('Nachricht über 300 Zeichen wird abgelehnt', () => {
    expect(PersonalisierungSchema.safeParse({ ...basis, versand: 'selbst', nachricht: 'x'.repeat(301) }).success).toBe(false);
  });
});

describe('Hilfen', () => {
  it('maskiereEmail lässt nur den ersten Buchstaben und die Domain stehen', () => {
    expect(maskiereEmail('anna@example.de')).toBe('a•••@example.de');
  });
  it('schluesselGleich: nur exakt gleiche, nicht leere Werte', () => {
    expect(schluesselGleich('abc', 'abc')).toBe(true);
    expect(schluesselGleich('abc', 'abd')).toBe(false);
    expect(schluesselGleich('abc', 'abcd')).toBe(false);
    expect(schluesselGleich('', '')).toBe(false);
    expect(schluesselGleich(null, 'abc')).toBe(false);
  });
  it('motivOderStandard fällt auf „glut" zurück', () => {
    expect(motivOderStandard('weihnachten')).toBe('weihnachten');
    expect(motivOderStandard('quatsch')).toBe('glut');
    expect(motivOderStandard(null)).toBe('glut');
  });
});
