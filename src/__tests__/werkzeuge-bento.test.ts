/**
 * Waechter fuer die Werkzeuge-Datenbasis des Bento-Grids (02.11.2026):
 * Die Startseite zeigt beim Laden das Dry-Aged Ribeye und Hickory — beides
 * muss an erster Stelle der JSON stehen, sonst zeigt die Kachel etwas anderes.
 * Dazu die reine Logik (Cut-Wechsel, Regler → Dosierung, Warnliste).
 */
import { describe, it, expect } from 'vitest';
import { STEAKAKADEMIE_TOOLS, pruefeWerkzeugDaten } from '@/lib/werkzeuge/daten';
import { dosierungFuer, intensitaetsStufe, naechsterCut, ungeeigneteHoelzer } from '@/lib/werkzeuge/logik';

describe('Werkzeuge-Datenbasis', () => {
  it('startet mit Dry-Aged Ribeye und Hickory', () => {
    expect(STEAKAKADEMIE_TOOLS.aromaMatcher.cuts[0]).toMatchObject({ id: 'dry-aged-ribeye', name: 'Dry-Aged Ribeye' });
    expect(STEAKAKADEMIE_TOOLS.woodFinder.woods[0]).toMatchObject({ id: 'hickory', name: 'Hickory' });
  });

  it('lehnt eine kaputte Datenbasis ab (Pruefung kann rot werden)', () => {
    const kaputt = structuredClone(STEAKAKADEMIE_TOOLS) as unknown as { woodFinder: { woods: { flavorProfile: string }[] } };
    kaputt.woodFinder.woods[0].flavorProfile = 'texas';
    expect(() => pruefeWerkzeugDaten(kaputt)).toThrow(/flavorProfile/);
    expect(() => pruefeWerkzeugDaten({ ...STEAKAKADEMIE_TOOLS, aromaMatcher: { totalStudiesReferenced: 1, cuts: [] } })).toThrow(/leer/);
  });
});

describe('Bento-Logik', () => {
  const cuts = STEAKAKADEMIE_TOOLS.aromaMatcher.cuts;
  const hickory = STEAKAKADEMIE_TOOLS.woodFinder.woods[0];

  it('wechselt zyklisch zum naechsten Cut', () => {
    const a = { ...cuts[0], id: 'a' };
    const b = { ...cuts[0], id: 'b' };
    expect(naechsterCut([a, b], 'a').id).toBe('b');
    expect(naechsterCut([a, b], 'b').id).toBe('a');
    expect(naechsterCut(cuts, cuts[cuts.length - 1].id).id).toBe(cuts[0].id);
  });

  it('ordnet den Regler den drei Stufen zu', () => {
    expect(intensitaetsStufe(0)).toBe('Mild');
    expect(intensitaetsStufe(39)).toBe('Mild');
    expect(intensitaetsStufe(40)).toBe('Ausgewogen');
    expect(intensitaetsStufe(74)).toBe('Ausgewogen');
    expect(intensitaetsStufe(75)).toBe('Kräftig');
    expect(intensitaetsStufe(100)).toBe('Kräftig');
  });

  it('interpoliert die Hickory-Dosierung im Smoker zwischen mild und kraeftig', () => {
    expect(dosierungFuer(hickory, 0)).toMatchObject({ menge: 2, einheit: 'chunks' });
    expect(dosierungFuer(hickory, 50)).toMatchObject({ menge: 3 });
    expect(dosierungFuer(hickory, 100)).toMatchObject({ menge: 4 });
    expect(dosierungFuer(hickory, 250)?.menge).toBe(4);
  });

  it('gibt fuer ungeeignetes Holz keine Dosierung, aber einen Warnlisten-Eintrag', () => {
    const warnliste = ungeeigneteHoelzer(STEAKAKADEMIE_TOOLS.woodFinder.woods);
    expect(warnliste.map((w) => w.id)).toEqual(['nadelholz']);
    expect(dosierungFuer(warnliste[0], 50)).toBeNull();
  });
});
