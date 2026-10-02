import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * POST /api/mein-protokoll/generate gegen nachgebildete Dienste.
 * Echt bleiben: Route, guardRequest, Schema, Referenzprüfung, Guthaben-Logik.
 * Ersetzt werden: Supabase (Nutzer-Client + Service-Client) und das Sprachmodell.
 */

const welt = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  course: { id: 'course-mp' } as { id: string } | null,
  booking: { id: 'booking-1' } as { id: string } | null,
  protokolle: [] as Record<string, unknown>[],
  gutschriften: [{ anzahl: 1 }] as { anzahl: number }[],
  gutschriftenFehler: null as { message: string } | null,
  rpc: [] as Record<string, unknown>[],
  rpcAntwort: { data: { status: 'ok', id: 'neu-1' }, error: null } as { data: unknown; error: unknown },
  modell: [] as (() => unknown)[],
  prompts: [] as string[],
  ipSeq: 0,
}));

function kette(ergebnis: () => { data: unknown; error: unknown }, einzeln: () => { data: unknown; error: unknown }) {
  const b: any = {
    select: () => b, eq: () => b, is: () => b, in: () => b, order: () => b,
    maybeSingle: async () => einzeln(),
    then: (ok: any, fail: any) => Promise.resolve(ergebnis()).then(ok, fail),
  };
  return b;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: welt.user } }) },
    from: (name: string) => {
      if (name === 'courses') return kette(() => ({ data: [], error: null }), () => ({ data: welt.course, error: null }));
      if (name === 'bookings') return kette(() => ({ data: [], error: null }), () => ({ data: welt.booking, error: null }));
      if (name === 'protokolle') return kette(() => ({ data: welt.protokolle, error: null }), () => ({ data: null, error: null }));
      if (name === 'protokoll_gutschriften') {
        return kette(() => ({ data: welt.gutschriftenFehler ? null : welt.gutschriften, error: welt.gutschriftenFehler }), () => ({ data: null, error: null }));
      }
      throw new Error(`unerwartete Tabelle ${name}`);
    },
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => { welt.rpc.push({ name, ...args }); return welt.rpcAntwort; },
  }),
}));

vi.mock('@ai-sdk/anthropic', () => ({ anthropic: (id: string) => id }));
vi.mock('ai', () => ({
  generateObject: async (opts: { prompt: string }) => {
    welt.prompts.push(opts.prompt);
    const naechster = welt.modell.shift();
    if (!naechster) throw new Error('Modell nicht erreichbar');
    return { object: naechster() };
  },
}));

import { POST } from '@/app/api/mein-protokoll/generate/route';

const ANTWORTEN = {
  grillType: 'Kugelgrill', experience: 'Einsteiger', timePerSession: '1–2 Stunden',
  mainGoal: 'Techniken meistern', frustration: 'Außen schwarz, innen roh.',
};

function plan(kern: { cut?: string; kernRef?: string; kernTempC?: number | null } = {}) {
  return {
    intro: 'Dein Kugelgrill kann mehr, als du ihm bisher zutraust.',
    focusAreas: ['Zwei-Zonen-Glut', 'Kerntemperatur', 'Rasten'],
    closingNote: 'Nach acht Wochen triffst du jede Garstufe gezielt.',
    weeks: Array.from({ length: 8 }, (_, i) => ({
      week: i + 1, theme: `Thema ${i + 1}`,
      description: 'Worum es geht, warum jetzt und wie du es angehst — konkret beschrieben.',
      note: 'Miss, statt zu schätzen.',
      sessions: [{
        cut: kern.cut ?? 'Entrecôte vom Rind 300 g', method: 'Heiß angrillen + indirekt ziehen',
        grillTemp: '280–300 °C direkt, dann 150–170 °C indirekt',
        kernRef: kern.kernRef ?? 'rind_medium_rare', kernTempC: kern.kernTempC === undefined ? 54 : kern.kernTempC,
        process: 'Vorheizen, je 2 Min angrillen, indirekt ziehen, 6 Min rasten.',
        timePlanning: 'ca. 60 Min inkl. Ruhephase', successCriterion: 'Gleichmäßig rosa von Rand zu Rand.',
      }],
    })),
  };
}

const GUT = () => plan();
const UNSICHER = () => plan({ cut: 'Hähnchenschenkel 4 Stück', kernRef: 'poultry', kernTempC: 68 });

function anfrage(body: Record<string, unknown>, kopf: Record<string, string> = {}) {
  welt.ipSeq += 1;
  return new Request('https://steakakademie.de/api/mein-protokoll/generate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json', origin: 'https://steakakademie.de', host: 'steakakademie.de',
      'x-real-ip': `10.0.0.${welt.ipSeq}`, ...kopf,
    },
    body: JSON.stringify(body),
  });
}

const zeile = (id: string, korrektur_von: string | null, tag: number) => ({
  id, korrektur_von, created_at: `2026-11-0${tag}T10:00:00Z`, answers: ANTWORTEN,
  plan: { intro: 'x', focusAreas: ['a', 'b', 'c'], closingNote: 'y', weeks: plan().weeks.map((w) => ({ ...w, theme: `Alt ${w.week}`, sessions: w.sessions.map((s) => ({ ...s, targetTemp: '54 °C Kern' })) })) },
});

beforeEach(() => {
  welt.user = { id: 'user-1' };
  welt.course = { id: 'course-mp' };
  welt.booking = { id: 'booking-1' };
  welt.protokolle = [];
  welt.gutschriften = [{ anzahl: 1 }];
  welt.gutschriftenFehler = null;
  welt.rpc = [];
  welt.rpcAntwort = { data: { status: 'ok', id: 'neu-1' }, error: null };
  welt.modell = [];
  welt.prompts = [];
  process.env.ANTHROPIC_API_KEY = 'test';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Generator: Zugang', () => {
  it('fremde Herkunft → 403, ohne Modellaufruf', async () => {
    const res = await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }, { origin: 'https://boese.example' }));
    expect(res.status).toBe(403);
    expect(welt.prompts).toHaveLength(0);
  });

  it('ohne Bestätigung → 400', async () => {
    expect((await POST(anfrage(ANTWORTEN))).status).toBe(400);
  });

  it('nicht eingeloggt → 401', async () => {
    welt.user = null;
    expect((await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }))).status).toBe(401);
  });

  it('ohne Buchung → 403', async () => {
    welt.booking = null;
    expect((await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }))).status).toBe(403);
  });

  it('Guthaben-Tabelle fehlt (Migration nicht angewendet) → 503, kein Modellaufruf', async () => {
    welt.gutschriftenFehler = { message: 'relation "protokoll_gutschriften" does not exist' };
    welt.modell = [GUT];
    const res = await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }));
    expect(res.status).toBe(503);
    expect(welt.prompts).toHaveLength(0);
  });

  it('siebter Aufruf derselben Adresse in einer Stunde → 429', async () => {
    welt.user = null;
    const kopf = { 'x-real-ip': '10.9.9.9' };
    for (let i = 0; i < 6; i++) expect((await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }, kopf))).status).toBe(401);
    expect((await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }, kopf))).status).toBe(429);
  });
});

describe('Generator: Guthaben', () => {
  it('erstes Protokoll: erzeugt, speichert über protokoll_speichern mit Bestätigungstext', async () => {
    welt.modell = [GUT];
    const res = await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, id: 'neu-1' });
    expect(welt.rpc).toHaveLength(1);
    expect(welt.rpc[0]).toMatchObject({ name: 'protokoll_speichern', p_user_id: 'user-1', p_korrektur_von: null });
    expect(String(welt.rpc[0].p_bestaetigung)).toMatch(/Protokoll aus meinem Guthaben verbraucht/);
    const gespeichert = welt.rpc[0].p_plan as { weeks: { sessions: { targetTemp: string }[] }[] };
    expect(gespeichert.weeks[0].sessions[0].targetTemp).toBe('54 °C Kern (Medium Rare)');
    // Auftragsfelder gehören nicht in die gespeicherten Antworten.
    expect(welt.rpc[0].p_answers).not.toHaveProperty('bestaetigt');
  });

  it('Guthaben verbraucht → 409, kein Modellaufruf', async () => {
    welt.protokolle = [zeile('a', null, 1)];
    welt.modell = [GUT];
    const res = await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('kein_guthaben');
    expect(welt.prompts).toHaveLength(0);
  });

  it('Paket 2: das zweite Protokoll bekommt den ersten Plan als Ausgangspunkt', async () => {
    welt.gutschriften = [{ anzahl: 2 }];
    welt.protokolle = [zeile('a', null, 1)];
    welt.modell = [GUT];
    expect((await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }))).status).toBe(200);
    expect(welt.prompts[0]).toMatch(/FOLGE-PROTOKOLL/);
    expect(welt.prompts[0]).toMatch(/Alt 8/);
  });

  it('Korrektur: läuft ohne freies Guthaben, zielt auf das Protokoll und nennt den Hinweis', async () => {
    welt.protokolle = [zeile('a', null, 1)];
    welt.modell = [GUT];
    const res = await POST(anfrage({ ...ANTWORTEN, bestaetigt: true, modus: 'korrektur', hinweis: 'Zu viel Rind.' }));
    expect(res.status).toBe(200);
    expect(welt.rpc[0]).toMatchObject({ p_korrektur_von: 'a' });
    expect(String(welt.rpc[0].p_bestaetigung)).toMatch(/kostenlose Korrektur/);
    expect(welt.prompts[0]).toMatch(/KORREKTUR/);
    expect(welt.prompts[0]).toMatch(/Zu viel Rind\./);
  });

  it('zweite Korrektur desselben Protokolls → 409, kein Modellaufruf', async () => {
    welt.protokolle = [zeile('a', null, 1), zeile('a2', 'a', 2)];
    welt.modell = [GUT];
    const res = await POST(anfrage({ ...ANTWORTEN, bestaetigt: true, modus: 'korrektur', korrekturVon: '11111111-1111-4111-8111-111111111111' }));
    expect(res.status).toBe(409);
    const res2 = await POST(anfrage({ ...ANTWORTEN, bestaetigt: true, modus: 'korrektur' }));
    expect(res2.status).toBe(409);
    expect(welt.prompts).toHaveLength(0);
  });

  it('die Datenbank hat das letzte Wort: meldet sie kein Guthaben, gibt es 409 statt Erfolg', async () => {
    welt.modell = [GUT];
    welt.rpcAntwort = { data: { status: 'kein_guthaben' }, error: null };
    const res = await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }));
    expect(res.status).toBe(409);
  });
});

describe('Generator: Kerntemperatur-Prüfung', () => {
  it('unsicherer erster Plan wird verworfen; der zweite Versuch bekommt die Verstöße genannt und wird gespeichert', async () => {
    welt.modell = [UNSICHER, GUT];
    const res = await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }));
    expect(res.status).toBe(200);
    expect(welt.prompts).toHaveLength(2);
    expect(welt.prompts[1]).toMatch(/wurde verworfen/);
    expect(welt.prompts[1]).toMatch(/Sicherheits-Mindestwert von 72/);
    expect(welt.rpc).toHaveLength(1);
  });

  it('zweimal unsicher → 502, nichts gespeichert, nichts verbraucht', async () => {
    welt.modell = [UNSICHER, UNSICHER];
    const res = await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }));
    expect(res.status).toBe(502);
    expect(welt.rpc).toHaveLength(0);
  });

  it('Modell nicht erreichbar → 502, nichts gespeichert', async () => {
    welt.modell = [];
    const res = await POST(anfrage({ ...ANTWORTEN, bestaetigt: true }));
    expect(res.status).toBe(502);
    expect(welt.rpc).toHaveLength(0);
  });
});
