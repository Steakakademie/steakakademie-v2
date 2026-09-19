import { describe, it, expect } from 'vitest';
import { berechneWeg, type Antworten } from '@/lib/eigenregie/diagnose';
import { angebotFuer, PILOT_ENDE, PILOT_PREIS, REGULAERER_PREIS } from '@/lib/eigenregie/angebot';

const basis: Antworten = {
  ziel: 'kunden', heute: 'wordpress', zugaenge: 'ja', zeit: '2-5', technik: 'office', gewerbe: 'ja', kostenHeute: 300, idee: '',
};

describe('Eigenregie-Diagnose', () => {
  it('Standardfall: sechs Module in Grundreihenfolge, Amortisation aus eigenen Zahlen', () => {
    const w = berechneWeg(basis, 999);
    expect(w.schritte.map((s) => s.modul)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(w.amortisation.monate).toBe(Math.ceil(999 / (300 - 40)));
    expect(w.weichen[0].art).toBe('fertig');
  });
  it('Verkaufen: Recht vor Livegang, Shop-Weiche', () => {
    const w = berechneWeg({ ...basis, ziel: 'verkaufen' }, 999);
    expect(w.schritte.map((s) => s.modul)).toEqual([1, 2, 5, 3, 4, 6]);
    expect(w.weichen.some((x) => x.art === 'shop')).toBe(true);
  });
  it('Ehrliche Weichen: kein Gewerbe, keine Zugänge, wenig Zeit', () => {
    const w = berechneWeg({ ...basis, gewerbe: 'nein', zugaenge: 'unklar', zeit: 'unter-2', technik: 'keine' }, 999);
    const arten = w.weichen.map((x) => x.art);
    expect(arten).toEqual(expect.arrayContaining(['gruendung', 'rueckholung', 'begleitung']));
    expect(w.schritte[0].hinweis).toMatch(/Zugänge zurückholen/);
  });
  it('Keine laufenden Kosten heute → keine Amortisationsbehauptung', () => {
    expect(berechneWeg({ ...basis, kostenHeute: 0 }, 999).amortisation.monate).toBeNull();
    expect(berechneWeg({ ...basis, kostenHeute: 30 }, 999).amortisation.monate).toBeNull();
  });
});

describe('Eigenregie-Angebot', () => {
  const vorher = new Date('2026-10-31T22:00:00Z'); // 23:00 MEZ
  const nachher = new Date('2026-10-31T23:00:00Z'); // 00:00 MEZ am 01.11.
  it('Pilotpreis bis 31.10. 23:59:59 MEZ, danach regulär — für alle gleich', () => {
    expect(vorher.getTime()).toBeLessThan(PILOT_ENDE.getTime());
    expect(angebotFuer(vorher, 3)).toMatchObject({ preis: PILOT_PREIS, pilot: true, freiePlaetze: 7 });
    expect(angebotFuer(nachher, 3)).toMatchObject({ preis: REGULAERER_PREIS, pilot: false });
  });
  it('Nach 10 Plätzen ausverkauft, unbekannte Zahl bleibt unbekannt', () => {
    expect(angebotFuer(vorher, 10).ausverkauft).toBe(true);
    expect(angebotFuer(vorher, null).freiePlaetze).toBeNull();
  });
});
