import { describe, expect, it } from 'vitest';
import { istImDatensatz, paarung, rad, statistik } from './foodpairing-daten';
import { FAKTENCHECK, FOODPAIRING_BEISPIELE, KACHEL_TEASER, RAEDER, UEBERRASCHUNGEN } from './foodpairing-inhalte';

// Wächter für /foodpairing und die Startseiten-Kachel: Jede Aroma-Aussage in den
// Texten muss durch data/foodpairing gedeckt sein. Ändern sich die Belege, fällt
// der Test — nicht erst ein Leser, der den Fehler findet.

const namen = (a: string, b: string) => paarung(a, b).stoffe.map((s) => s.name);

describe('Foodpairing-Inhalte gegen die Belege', () => {
  it('jedes Überraschungs-Paar teilt die Stoffe, die sein Text nennt', () => {
    for (const g of UEBERRASCHUNGEN)
      for (const p of g.paare) {
        const geteilt = namen(p.a, p.b);
        for (const s of p.belegt) expect(geteilt, `${p.titel}: ${s}`).toContain(s);
        expect(geteilt.length, p.titel).toBeGreaterThanOrEqual(2);
      }
  });

  it('Erdbeere & Parmesan: Balsamico teilt mit beiden die Butter- und Käsenote', () => {
    for (const z of ['Erdbeere', 'Parmesan']) {
      expect(namen('Balsamico', z)).toContain('2,3-Butandion');
      expect(namen('Balsamico', z)).toContain('Buttersäure');
    }
  });

  it('Faktencheck: Anzahl geteilter Stoffe stimmt mit dem Text überein', () => {
    for (const f of FAKTENCHECK) {
      if (f.erwartet === undefined) continue;
      expect(namen(f.a!, f.b!).length, f.titel).toBe(f.erwartet);
      if (f.besser) expect(namen(f.besser.a, f.besser.b).length, f.titel).toBeGreaterThan(f.erwartet);
    }
    expect(namen('Rind', 'Popcorn')).toEqual(['(E,E)-2,4-Decadienal']); // „nur die Frittiernote"
    expect(namen('Popcorn', 'Haselnuss')).toContain('2-Acetyl-1-pyrrolin'); // Popcorn-Röstnote
    expect(namen('Lamm', 'Kaffee').sort()).toEqual(['Furaneol', 'Vanillin']);
  });

  it('„Nicht geprüft"-Einträge sind wirklich nicht im Datensatz', () => {
    for (const z of ['Weiße Schokolade', 'Kaviar', 'Wassermelone', 'Essiggurke']) expect(istImDatensatz(z)).toBe(false);
  });

  it('Kachel-Teaser entspricht paarung(Rind, Kakao)', () => {
    expect(namen(KACHEL_TEASER.zutatA, KACHEL_TEASER.zutatB).sort()).toEqual(
      KACHEL_TEASER.bruecken.map((b) => b.stoffVoll).sort(),
    );
  });

  it('Kachel-Startzutaten und Rad-Mitten haben Partner', () => {
    for (const z of FOODPAIRING_BEISPIELE) expect(rad(z).partner.length, z).toBeGreaterThanOrEqual(6);
    for (const r of RAEDER) expect(rad(r.zutat).partner.length, r.zutat).toBeGreaterThanOrEqual(8);
  });

  it('Rad blendet dieselbe Kategorie aus (wie die RPC match_foodpairing)', () => {
    const steak = rad('Rind').partner.map((p) => p.name);
    expect(steak).not.toContain('Schwein');
    expect(steak).toContain('Kakao');
  });

  it('Statistik: „über 100 Fachstudien" in der Kachel bleibt wahr', () => {
    expect(statistik().studien).toBeGreaterThan(100);
  });
});
