import { describe, it, expect } from 'vitest';
import { kernReferenz, mindestwert } from '@/lib/kerntemperatur-referenz';
import {
  KEIN_KERNWERT, kernAnzeige, kernRefs, kernwerteImText, klasseVonBadge,
  minimumDerKlasse, pruefeSession, referenzTabelle, risikoKlassen,
} from '@/lib/mein-protokoll/kerntemperatur';
import { generierungsSchema, pruefePlan, zuAnzeige, type GenerierterPlan } from '@/lib/mein-protokoll/generierung';
import { berechneGuthaben, protokolleFuerBetrag } from '@/lib/mein-protokoll/guthaben';
import { buildUserPrompt, systemPrompt } from '@/lib/mein-protokoll/prompts';
import { AuftragSchema, PlanSchema } from '@/lib/mein-protokoll/schema';

/**
 * Mein Protokoll — was vor dem Verkauf feststehen muss:
 *   1. Der Generator kann keine Kerntemperatur ausgeben, die der Referenz
 *      widerspricht oder unter einem Sicherheits-Mindestwert liegt.
 *   2. Das Guthaben zählt richtig: 19 € = 1 Protokoll, 29 € = 2; je Protokoll
 *      ein Plan plus eine Korrektur.
 */

const session = (teil: Partial<Parameters<typeof pruefeSession>[0]>) => ({
  cut: 'Entrecôte vom Rind 300 g',
  kernRef: 'rind_medium_rare',
  kernTempC: 54 as number | null,
  process: 'Vorheizen, 2 Min je Seite angrillen, indirekt ziehen, 6 Min rasten.',
  successCriterion: 'Gleichmäßig rosa, Kruste beidseitig.',
  ...teil,
});

describe('Referenzbindung: Schlüssel, die der Generator wählen darf', () => {
  it('jeder Badge der Referenz hat eine Klasse — ein neuer Badge ohne Zuordnung fällt hier auf', () => {
    const ohne = Object.keys(kernReferenz().badges).filter((k) => klasseVonBadge(k) === null);
    expect(ohne).toEqual([]);
  });

  it('Ausnahmen unter dem Sicherheitsminimum stehen NICHT zur Wahl (Regel 2: automatisch erzeugt = Minimum)', () => {
    const keys = kernRefs().map((r) => r.key);
    const ausnahmen = Object.entries(kernReferenz().badges).filter(([, b]) => b.unter_sicherheit).map(([k]) => k);
    expect(ausnahmen.length).toBeGreaterThan(0);
    for (const k of ausnahmen) expect(keys).not.toContain(k);
  });

  it('kein wählbarer Korridor beginnt unter dem Mindestwert seiner Klasse', () => {
    for (const r of kernRefs()) {
      const min = minimumDerKlasse(r.klasse);
      if (min !== null) expect(r.range[0], r.key).toBeGreaterThanOrEqual(min);
    }
  });

  it('die Garstufen Rind kommen aus der Referenz, nicht aus dem Prompt', () => {
    const rare = kernRefs().find((r) => r.key === 'rind_rare')!;
    expect(rare.range).toEqual((kernReferenz().garstufen_rind.rare as { range: [number, number] }).range);
    const prompt = systemPrompt();
    expect(prompt).toContain(referenzTabelle());
    // Die alten, abweichenden Werte dürfen nicht zurückkommen.
    expect(prompt).not.toMatch(/rare ~50 °C|durch 63 °C\+/);
    // Interne Herkunftsvermerke gehören nicht in den Prompt (Regel 3).
    expect(prompt).not.toMatch(/Uwe/);
  });
});

describe('Fleischklasse aus dem Cut-Text', () => {
  it.each([
    ['Hähnchenschenkel 4 Stück', ['gefluegel']],
    ['Entenbrust 350 g', ['gefluegel']],
    ['Putenoberkeule', ['gefluegel']],
    ['Burger-Patty vom Rind 180 g', ['hackfleisch']],
    ['Bratwurst grob', ['hackfleisch']],
    ['Lamm-Köfte', ['hackfleisch']],
    ['Schweinenacken-Steak 250 g', ['schwein']],
    ['Pulled Pork (Schulter) 2 kg', ['schwein']],
    ['Spareribs St. Louis Cut', ['schwein']],
    ['Wildschweinrücken 600 g', ['wildschwein']],
    ['Hähnchen-Burger', ['hackfleisch', 'gefluegel']],
  ])('%s → %j', (cut, erwartet) => {
    expect(risikoKlassen(cut).sort()).toEqual([...erwartet].sort());
  });

  it.each([
    'Entrecôte vom Rind 300 g', 'Rinder-Nackensteak (Chuck)', 'Flank Steak', 'Lammkarree',
    'Tomahawk 1,2 kg', 'Lachsfilet auf der Planke', 'Gemüsespieße', 'Rumpsteak ganz, dry-aged',
  ])('%s → keine Risikoklasse', (cut) => {
    expect(risikoKlassen(cut)).toEqual([]);
  });
});

describe('Kernwerte im Freitext', () => {
  it('erkennt beide Schreibweisen und Spannen, ignoriert Grilltemperaturen', () => {
    expect(kernwerteImText('Bei 160 °C Deckel indirekt bis Kerntemperatur 72 °C.')).toEqual([72]);
    expect(kernwerteImText('Bei 68 °C Kern vom Grill, rastet auf 72 °C im Kern.')).toEqual([68, 72]);
    expect(kernwerteImText('Kern 72–74 °C')).toEqual([74]);
    expect(kernwerteImText('280 °C direkt, dann 150 °C indirekt, Brett 85 °C')).toEqual([]);
  });
});

describe('Prüfung einer Session', () => {
  it('lässt einen Wert im Korridor durch', () => {
    expect(pruefeSession(session({}))).toEqual([]);
  });

  it('verwirft „medium rare" mit 58 °C — außerhalb des Korridors der Referenz', () => {
    expect(pruefeSession(session({ kernTempC: 58 })).join(' ')).toMatch(/außerhalb des Korridors/);
  });

  it('verwirft Geflügel mit Rind-Schlüssel, auch wenn die Zahl zum Schlüssel passt', () => {
    const f = pruefeSession(session({ cut: 'Hähnchenbrust 200 g', kernRef: 'rind_medium', kernTempC: 58 }));
    expect(f.join(' ')).toMatch(/passt nicht zum Fleisch/);
    expect(f.join(' ')).toMatch(new RegExp(`unter dem Sicherheits-Mindestwert von ${mindestwert('gefluegel')}`));
  });

  it('verwirft Entenbrust rosa — die Ausnahme der Referenz gilt nicht für erzeugte Pläne', () => {
    const f = pruefeSession(session({ cut: 'Entenbrust 350 g', kernRef: 'duck_breast', kernTempC: 58 }));
    expect(f.join(' ')).toMatch(/steht nicht in der Referenz/);
  });

  it('verwirft Burger „medium" mit Rind-Schlüssel', () => {
    const f = pruefeSession(session({ cut: 'Burger-Patty vom Rind 180 g', kernRef: 'rind_medium', kernTempC: 57 }));
    expect(f.length).toBeGreaterThan(0);
  });

  it('verwirft Hähnchen-Burger bei 70 °C: Geflügel-Minimum schlägt Hack-Korridor', () => {
    const f = pruefeSession(session({ cut: 'Hähnchen-Burger', kernRef: 'burger', kernTempC: 70 }));
    expect(f.join(' ')).toMatch(new RegExp(`Mindestwert von ${mindestwert('gefluegel')}`));
  });

  it('lässt Schwein bei 63 °C durch und erlaubt einen Ziehwert darunter, wenn der Endwert dasteht', () => {
    expect(pruefeSession(session({
      cut: 'Schweinefilet 400 g', kernRef: 'pork_juicy', kernTempC: 63,
      process: 'Indirekt bis 60 °C Kern, dann rasten — zieht auf 63 °C Kern nach.',
    }))).toEqual([]);
  });

  it('verwirft Schwein, wenn der Freitext als höchsten Kernwert 58 °C nennt', () => {
    const f = pruefeSession(session({
      cut: 'Schweinefilet 400 g', kernRef: 'pork_juicy', kernTempC: 63,
      successCriterion: 'Zartrosa bei 58 °C Kern.',
    }));
    expect(f.join(' ')).toMatch(/Erfolgskriterium nennt als höchsten Kernwert 58/);
  });

  it('„keine" ist nur ohne Fleisch zulässig', () => {
    expect(pruefeSession(session({ cut: 'Gemüsespieße', kernRef: KEIN_KERNWERT, kernTempC: null }))).toEqual([]);
    expect(pruefeSession(session({ cut: 'Hähnchenflügel', kernRef: KEIN_KERNWERT, kernTempC: null })).length).toBe(1);
  });

  it('der Anzeige-Text entsteht aus den geprüften Werten', () => {
    expect(kernAnzeige({ kernRef: 'rind_medium_rare', kernTempC: 54 })).toBe('54 °C Kern (Medium Rare)');
    expect(kernAnzeige({ kernRef: KEIN_KERNWERT, kernTempC: null })).toMatch(/keine Kerntemperatur/);
  });
});

function plan(aendern?: (p: GenerierterPlan) => void): GenerierterPlan {
  const p: GenerierterPlan = {
    intro: 'Dein Kugelgrill kann mehr, als du ihm bisher zutraust.',
    focusAreas: ['Zwei-Zonen-Glut', 'Kerntemperatur', 'Rasten'],
    closingNote: 'Nach acht Wochen triffst du jede Garstufe gezielt.',
    weeks: Array.from({ length: 8 }, (_, i) => ({
      week: i + 1,
      theme: `Thema ${i + 1}`,
      description: 'Worum es geht, warum jetzt und wie du es angehst — konkret beschrieben.',
      note: 'Miss, statt zu schätzen.',
      sessions: [{
        cut: 'Entrecôte vom Rind 300 g',
        method: 'Heiß angrillen + indirekt ziehen',
        grillTemp: '280–300 °C direkt, dann 150–170 °C indirekt',
        kernRef: 'rind_medium_rare',
        kernTempC: 54,
        process: 'Vorheizen, je 2 Min angrillen, indirekt bis 51 °C Kern, 6 Min rasten bis 54 °C Kern.',
        timePlanning: 'ca. 60 Min inkl. Ruhephase',
        successCriterion: 'Gleichmäßig rosa von Rand zu Rand.',
      }],
    })),
  };
  aendern?.(p);
  return p;
}

describe('Prüfung und Umsetzung des ganzen Plans', () => {
  it('ein sauberer Plan besteht Schema und Prüfung und ist danach als Anzeige-Plan lesbar', () => {
    const p = generierungsSchema().parse(plan());
    expect(pruefePlan(p)).toEqual([]);
    const anzeige = zuAnzeige(p);
    expect(PlanSchema.safeParse(anzeige).success).toBe(true);
    expect(anzeige.weeks[0].sessions[0].targetTemp).toBe('54 °C Kern (Medium Rare)');
  });

  it('nennt Woche und Session des Verstoßes', () => {
    const p = plan((x) => { x.weeks[2].sessions[0] = { ...x.weeks[2].sessions[0], cut: 'Hähnchenschenkel', kernRef: 'poultry', kernTempC: 68 }; });
    expect(pruefePlan(p).join(' ')).toMatch(/Woche 3, Session 1/);
  });

  it('verlangt die Wochen 1 bis 8 in Reihenfolge', () => {
    const p = plan((x) => { x.weeks[7].week = 7; });
    expect(pruefePlan(p).join(' ')).toMatch(/Wochen müssen 1 bis 8/);
  });

  it('das Schema lehnt einen erfundenen Referenzschlüssel ab', () => {
    const p = plan((x) => { x.weeks[0].sessions[0].kernRef = 'schwein_rosa'; });
    expect(generierungsSchema().safeParse(p).success).toBe(false);
  });

  it('ein alter gespeicherter Plan ohne kernRef bleibt lesbar', () => {
    const alt = zuAnzeige(plan());
    for (const w of alt.weeks) for (const s of w.sessions) { delete (s as Record<string, unknown>).kernRef; delete (s as Record<string, unknown>).kernTempC; }
    expect(PlanSchema.safeParse(alt).success).toBe(true);
  });
});

describe('Prompt: Folge-Protokoll und Korrektur', () => {
  const antworten = { grillType: 'Kugelgrill', experience: 'Einsteiger', timePerSession: '1–2 Stunden', mainGoal: 'Techniken meistern', frustration: 'Außen schwarz, innen roh.' } as const;
  const alt = zuAnzeige(plan());

  it('das zweite Protokoll bekommt den ersten Plan als Ausgangspunkt', () => {
    const p = buildUserPrompt(antworten, { vorgaenger: alt });
    expect(p).toMatch(/FOLGE-PROTOKOLL/);
    expect(p).toMatch(/Woche 8: Thema 8/);
  });

  it('die Korrektur bekommt den beanstandeten Plan und den Hinweis des Nutzers', () => {
    const p = buildUserPrompt(antworten, { korrektur: { plan: alt, hinweis: 'Zu viel Rind.' } });
    expect(p).toMatch(/KORREKTUR/);
    expect(p).toMatch(/Zu viel Rind\./);
    expect(p).not.toMatch(/FOLGE-PROTOKOLL/);
  });
});

describe('Auftrag: ohne ausdrückliche Bestätigung wird nichts erstellt', () => {
  const basis = { grillType: 'Kugelgrill', experience: 'Einsteiger', timePerSession: '1–2 Stunden', mainGoal: 'Techniken meistern', frustration: 'Zu trocken.' };
  it('verlangt bestaetigt: true', () => {
    expect(AuftragSchema.safeParse(basis).success).toBe(false);
    expect(AuftragSchema.safeParse({ ...basis, bestaetigt: false }).success).toBe(false);
    expect(AuftragSchema.safeParse({ ...basis, bestaetigt: true }).success).toBe(true);
  });
});

describe('Guthaben', () => {
  it('19 € = 1 Protokoll, 29 € = 2 — auch mit 20 % Rabatt, als Text mit Komma und bei negativem Rückgabebetrag', () => {
    expect(protokolleFuerBetrag('19.00')).toBe(1);
    expect(protokolleFuerBetrag('29.00')).toBe(2);
    expect(protokolleFuerBetrag('23.20')).toBe(2);
    expect(protokolleFuerBetrag('15,20')).toBe(1);
    expect(protokolleFuerBetrag('-29.00')).toBe(2);
    expect(protokolleFuerBetrag(undefined)).toBe(1);
  });

  const z = (id: string, korrektur_von: string | null, tag: number) => ({ id, korrektur_von, created_at: `2026-11-${String(tag).padStart(2, '0')}T10:00:00Z` });

  it('frisch gekauft: ein Protokoll frei, nichts zu korrigieren', () => {
    const g = berechneGuthaben(1, []);
    expect(g).toMatchObject({ gekauft: 1, verbraucht: 0, frei: 1, korrigierbar: null });
  });

  it('ein Plan erstellt: Guthaben verbraucht, Korrektur offen', () => {
    const g = berechneGuthaben(1, [z('a', null, 1)]);
    expect(g.frei).toBe(0);
    expect(g.korrigierbar?.basisId).toBe('a');
  });

  it('die Korrektur zählt nicht gegen das Guthaben und ersetzt die Anzeige', () => {
    const g = berechneGuthaben(2, [z('a', null, 1), z('a2', 'a', 2)]);
    expect(g).toMatchObject({ verbraucht: 1, frei: 1, korrigierbar: null });
    expect(g.protokolle[0]).toMatchObject({ nr: 1, basisId: 'a', aktuellId: 'a2', korrigiert: true });
  });

  it('Paket 2: beide erstellt, das erste korrigiert — korrigierbar ist das zweite', () => {
    const g = berechneGuthaben(2, [z('a', null, 1), z('a2', 'a', 2), z('b', null, 3)]);
    expect(g.frei).toBe(0);
    expect(g.korrigierbar).toMatchObject({ nr: 2, basisId: 'b' });
  });

  it('nach einer Rückgabe (Summe 0) ist nichts frei — nie negativ', () => {
    expect(berechneGuthaben(0, [z('a', null, 1)]).frei).toBe(0);
    expect(berechneGuthaben(-1, []).gekauft).toBe(0);
  });
});
