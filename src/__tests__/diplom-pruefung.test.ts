import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { bewerte, zieheFragen, fragenFuerClient, FRAGEN } from '@/lib/diplome/fragen';
import { FLASHCARDS } from '@/lib/diplome/flashcards';
import {
  STUFEN,
  LEVELS,
  STUFEN_ORDER,
  QUIZ_FRAGEN_PRO_PRUEFUNG,
  QUIZ_BESTEHENSQUOTE,
  bestehensgrenze,
  stufeByKey,
  tierForLevel,
  type StufeKey,
} from '@/lib/diplome/stufen';

// Audit 06.09.2026 — die Tests halten fest, was vorher kaputt war.
// Rahmenlehrplan §8 (08.09.2026): Ziehung aus dem Pool, 80 %, ids statt Reihenfolge.

describe('Stufenpruefung: Bewertung', () => {
  const ids = (modul: StufeKey) => FRAGEN[modul].map((f) => f.id);
  const richtigFuer = (modul: StufeKey, idList: readonly string[]) =>
    idList.map((id) => FRAGEN[modul].find((f) => f.id === id)!.correct);

  it('bestanden nur ab der Bestehensgrenze (80 %, aufgerundet)', () => {
    for (const modul of STUFEN_ORDER) {
      const alle = ids(modul);
      const richtig = richtigFuer(modul, alle);
      const n = alle.length;
      const grenze = bestehensgrenze(n);
      expect(bewerte(modul, alle, richtig)).toMatchObject({ score: n, gesamt: n, grenze, bestanden: true });

      // genau an der Grenze → bestanden
      const anGrenze = richtig.map((c, i) => (i < n - grenze ? (c + 1) % 4 : c));
      expect(bewerte(modul, alle, anGrenze)).toMatchObject({ score: grenze, bestanden: true });

      // eine unter der Grenze → NICHT bestanden. Vorher wurde jedes Ergebnis verbucht.
      const darunter = richtig.map((c, i) => (i < n - grenze + 1 ? (c + 1) % 4 : c));
      expect(bewerte(modul, alle, darunter)).toMatchObject({ score: grenze - 1, bestanden: false });

      // alles falsch / leer → 0, nicht bestanden
      expect(bewerte(modul, alle, [])).toMatchObject({ score: 0, bestanden: false });
      expect(bewerte(modul, [], [])).toMatchObject({ score: 0, gesamt: 0, bestanden: false });
    }
  });

  it('Bestehensgrenze: 10 → 8, 5 → 4', () => {
    expect(QUIZ_FRAGEN_PRO_PRUEFUNG).toBe(10);
    expect(QUIZ_BESTEHENSQUOTE).toBe(80);
    expect(bestehensgrenze(10)).toBe(8);
    expect(bestehensgrenze(5)).toBe(4);
  });

  it('unbekannte ids und fremde Reihenfolge werden nicht belohnt', () => {
    const modul: StufeKey = 'bronze';
    const alle = ids(modul).slice(0, 5);
    const richtig = richtigFuer(modul, alle);
    // fremde id → als falsch gewertet, nicht als Fehler geworfen
    expect(bewerte(modul, [...alle.slice(0, 4), 'gibt-es-nicht'], richtig).score).toBe(4);
    // Antworten zur falschen Reihenfolge → nur Zufallstreffer zaehlen.
    // Bis 24.09.2026 stand hier `toBeLessThanOrEqual(5)` bei fuenf Fragen —
    // das ist immer wahr und haette auch eine Bewertung ohne ids bestanden.
    const gedreht = [...alle].reverse();
    const loesungGedreht = richtigFuer(modul, gedreht);
    expect(loesungGedreht, 'Vorbedingung: Loesungen muessen sich beim Drehen aendern').not.toEqual(richtig);
    const zufallstreffer = richtig.filter((a, i) => a === loesungGedreht[i]).length;
    expect(bewerte(modul, gedreht, richtig).score).toBe(zufallstreffer);
    expect(zufallstreffer).toBeLessThan(alle.length);
  });

  it('Ziehung: hoechstens eine Frage je Lektion, nie mehr als der Pool', () => {
    for (const modul of STUFEN_ORDER) {
      for (let lauf = 0; lauf < 20; lauf++) {
        const gezogen = zieheFragen(modul);
        expect(gezogen.length).toBe(Math.min(QUIZ_FRAGEN_PRO_PRUEFUNG, FRAGEN[modul].length));
        expect(new Set(gezogen).size).toBe(gezogen.length);
        const lektionen = gezogen.map((id) => FRAGEN[modul].find((f) => f.id === id)!.lektionSlug);
        const verschiedene = new Set(FRAGEN[modul].map((f) => f.lektionSlug)).size;
        // solange genug Lektionen da sind, kommt jede hoechstens einmal vor
        if (verschiedene >= gezogen.length) expect(new Set(lektionen).size).toBe(gezogen.length);
      }
    }
  });

  it('Stufe 1 hat einen Pool von mindestens 3 Fragen je Lektion (Rahmenlehrplan §8)', () => {
    const jeLektion = new Map<string, number>();
    for (const f of FRAGEN.bronze) jeLektion.set(f.lektionSlug, (jeLektion.get(f.lektionSlug) ?? 0) + 1);
    expect(FRAGEN.bronze.length).toBeGreaterThanOrEqual(33);
    for (const [slug, n] of Array.from(jeLektion.entries())) expect(n, slug).toBeGreaterThanOrEqual(3);
  });

  it('der Browser bekommt keine Loesungen', () => {
    const client = fragenFuerClient('bronze', ids('bronze'));
    expect(client.length).toBe(FRAGEN.bronze.length);
    for (const f of client as unknown as Record<string, unknown>[]) {
      expect(f).not.toHaveProperty('correct');
      expect(f).not.toHaveProperty('explain');
      expect(typeof f.id).toBe('string');
    }
  });

  it('jede Frage hat eine eindeutige id und einen gueltigen correct-Index', () => {
    const alleIds = new Set<string>();
    for (const modul of STUFEN_ORDER) {
      expect(FRAGEN[modul].length).toBeGreaterThan(0);
      for (const f of FRAGEN[modul]) {
        expect(alleIds.has(f.id), `doppelte id ${f.id}`).toBe(false);
        alleIds.add(f.id);
        expect(f.correct).toBeGreaterThanOrEqual(0);
        expect(f.correct).toBeLessThan(f.options.length);
        expect(f.explain.length).toBeGreaterThan(0);
      }
      expect(FLASHCARDS[modul].length).toBeGreaterThan(0);
    }
  });
});

// Randfaelle der Bewertung (24.09.2026). Die Route /api/diplome/pruefung prueft
// vorher per Zod (ganze Zahlen −1…16, Anzahl = gezogene Fragen) und nimmt die ids
// aus dem signierten Token. bewerte() muss trotzdem allein robust sein — sie ist
// die verbindliche Stelle und darf nie werfen oder etwas Ungueltiges belohnen.
describe('Stufenpruefung: Bewertung — Randfaelle', () => {
  const modul: StufeKey = 'bronze';
  const loesung = (id: string, m: StufeKey = modul) => FRAGEN[m].find((f) => f.id === id)!.correct;
  const optionen = (id: string) => FRAGEN[modul].find((f) => f.id === id)!.options.length;

  it('echte Ziehung: 10 Fragen, Grenze 8 — 8 richtig besteht, 7 nicht', () => {
    for (let lauf = 0; lauf < 20; lauf++) {
      const gezogen = zieheFragen(modul);
      expect(gezogen).toHaveLength(QUIZ_FRAGEN_PRO_PRUEFUNG);
      const richtig = gezogen.map((id) => loesung(id));
      // i < k falsch beantworten: (correct + 1) % Optionen ist immer eine andere, gueltige Option
      const mitFehlern = (k: number) =>
        gezogen.map((id, i) => (i < k ? (loesung(id) + 1) % optionen(id) : loesung(id)));

      expect(bewerte(modul, gezogen, richtig)).toMatchObject({ score: 10, gesamt: 10, grenze: 8, bestanden: true });
      expect(bewerte(modul, gezogen, mitFehlern(2))).toMatchObject({ score: 8, bestanden: true });
      expect(bewerte(modul, gezogen, mitFehlern(3))).toMatchObject({ score: 7, bestanden: false });
    }
  });

  it('ungueltige Antworten zaehlen als falsch und werfen nicht', () => {
    const [id] = FRAGEN[modul].map((f) => f.id);
    const c = loesung(id);
    const falsch = (a: number) => bewerte(modul, [id], [a]).ergebnisse[0].richtig;

    expect(falsch(c)).toBe(true); // Gegenprobe: die Loesung selbst zaehlt
    for (const a of [-1, optionen(id), 16, c + 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => bewerte(modul, [id], [a])).not.toThrow();
      expect(falsch(a), `Antwort ${a}`).toBe(false);
    }
  });

  it('fehlende Antworten sind falsch, ueberzaehlige zaehlen nicht mit', () => {
    const gezogen = FRAGEN[modul].slice(0, 5).map((f) => f.id);
    const richtig = gezogen.map((id) => loesung(id));

    // Nur drei Antworten fuer fuenf Fragen → 3 von 5, gesamt bleibt 5.
    expect(bewerte(modul, gezogen, richtig.slice(0, 3))).toMatchObject({ score: 3, gesamt: 5, bestanden: false });
    // Zusaetzliche Antworten hinter der letzten Frage aendern nichts.
    expect(bewerte(modul, gezogen, [...richtig, ...richtig])).toMatchObject({ score: 5, gesamt: 5 });
  });

  it('eine id aus einer anderen Stufe zaehlt nicht — auch mit deren richtiger Antwort', () => {
    // Sonst liesse sich eine Bronze-Pruefung mit leichten Fragen einer anderen
    // Stufe fuellen, deren Loesungen man kennt.
    const fremd = FRAGEN.anatomie[0];
    const e = bewerte(modul, [fremd.id], [loesung(fremd.id, 'anatomie')]);
    expect(e.score).toBe(0);
    expect(e.ergebnisse[0]).toEqual({ id: fremd.id, richtig: false, explain: '', lektionSlug: '' });
  });

  it('ergebnisse: eine Zeile je Frage, in Reihenfolge, mit Erklaerung und Lektion', () => {
    const fragen = FRAGEN[modul].slice(0, 3);
    const antworten = [fragen[0].correct, (fragen[1].correct + 1) % fragen[1].options.length, fragen[2].correct];
    const { ergebnisse } = bewerte(modul, fragen.map((f) => f.id), antworten);

    expect(ergebnisse).toEqual(
      fragen.map((f, i) => ({ id: f.id, richtig: i !== 1, explain: f.explain, lektionSlug: f.lektionSlug })),
    );
  });

  it('die Bewertung haengt nur von ids und Antworten ab — nicht vom Zufall der Ziehung', () => {
    const gezogen = zieheFragen(modul);
    const antworten = gezogen.map((id, i) => (i % 2 ? loesung(id) : 0));
    const erste = bewerte(modul, gezogen, antworten);
    for (let lauf = 0; lauf < 5; lauf++) {
      zieheFragen(modul); // Zufall weiterdrehen
      expect(bewerte(modul, gezogen, antworten)).toEqual(erste);
    }
  });
});

describe('Fragen ↔ Lektionen (Regel 8b, Pruefungsbezug)', () => {
  const root = join(process.cwd(), 'content', 'diplom-lektionen');
  const slugsJeStufe = new Map<number, Set<string>>();
  for (const s of STUFEN) {
    const dir = join(root, `stufe-${s.nr}`);
    const set = new Set<string>();
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.mdx')) continue;
      const m = readFileSync(join(dir, file), 'utf8').match(/^lektionSlug:\s*"([^"]+)"/m);
      if (m) set.add(m[1]);
    }
    slugsJeStufe.set(s.nr, set);
  }

  it('jede Frage zeigt auf eine existierende Lektion ihrer Stufe', () => {
    for (const modul of STUFEN_ORDER) {
      const stufe = stufeByKey(modul)!;
      const slugs = slugsJeStufe.get(stufe.nr)!;
      for (const f of FRAGEN[modul]) {
        expect(slugs.has(f.lektionSlug), `${modul}: "${f.q}" → ${f.lektionSlug}`).toBe(true);
      }
    }
  });

  it('Stufe 1 hat elf Lektionen (Rahmenlehrplan 08.09.2026), Stufen 2–5 je sieben', () => {
    expect(slugsJeStufe.get(1)!.size).toBe(11);
    for (const s of STUFEN) if (s.nr >= 2) expect(slugsJeStufe.get(s.nr)!.size).toBe(7);
  });
});

describe('Taxonomie: eine Quelle', () => {
  it('fuenf Stufen, zehn Level, je zwei Level pro Stufe', () => {
    expect(STUFEN).toHaveLength(5);
    expect(LEVELS).toHaveLength(10);
    for (const s of STUFEN) {
      const lv = LEVELS.filter((l) => l.stufe === s.nr).map((l) => l.id);
      expect(lv).toEqual([...s.levels]);
    }
  });

  it('Freischaltkette ist lueckenlos (vorher fehlte requires bei Stufe 2)', () => {
    expect(STUFEN[0].requires).toBeNull();
    for (let i = 1; i < STUFEN.length; i++) {
      expect(STUFEN[i].requires).toBe(STUFEN[i - 1].key);
    }
  });

  it('tierForLevel folgt der Stufe', () => {
    expect(tierForLevel(1)).toBe('bronze');
    expect(tierForLevel(2)).toBe('bronze');
    expect(tierForLevel(3)).toBe('silber');
    expect(tierForLevel(10)).toBe('master');
  });
});

describe('Regel 8c: Zahlen in Fragen und Flashcards folgen der Referenz', () => {
  const referenz = readFileSync(join(process.cwd(), 'data', 'kerntemperatur-referenz.yaml'), 'utf8');
  const schweinMin = Number(referenz.match(/^\s*schwein:\s*(\d+)/m)?.[1]);
  const beefMr = referenz.match(/beef_mr:\s*\{[^}]*range:\s*\[(\d+),\s*(\d+)\]/)?.slice(1, 3).map(Number);

  it('Referenz gelesen', () => {
    expect(schweinMin).toBe(63);
    expect(beefMr).toEqual([52, 55]);
  });

  it('Schweinefilet-Antwort unterschreitet das Sicherheits-Minimum nicht', () => {
    const f = FRAGEN.thermometer.find((q) => q.q.includes('Schweinefilet'))!;
    const richtig = f.options[f.correct];
    const unter = Number(richtig.match(/(\d+)/)?.[1]);
    expect(unter).toBeGreaterThanOrEqual(schweinMin);
  });

  it('Rind medium rare entspricht dem Referenzkorridor', () => {
    const f = FRAGEN.thermometer.find((q) => q.q.includes('medium rare'))!;
    expect(f.options[f.correct]).toContain(`${beefMr![0]}–${beefMr![1]}`);
    const card = FLASHCARDS.thermometer.find((c) => c.front === 'Rind medium rare')!;
    expect(card.back).toContain(`${beefMr![0]}–${beefMr![1]}`);
  });
});
