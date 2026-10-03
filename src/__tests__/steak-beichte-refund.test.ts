/**
 * POST /api/steak-beichte/analyze — Rückbuchung nach gescheiterter Diagnose (03.10.2026).
 *
 * Anlass: Die Route verbraucht ein Guthaben, bevor sie das Modell ruft, und
 * bucht es bei einem Fehler zurück. Das Ergebnis dieser Rückbuchung wurde nie
 * ausgewertet — supabase-js wirft bei Datenbankfehlern nicht, es liefert
 * `{ error }`. Die Antwort sagte deshalb immer „dein Guthaben wurde nicht
 * belastet“, auch wenn die Rückbuchung gescheitert war, und niemand erfuhr davon.
 *
 * Echt bleiben: Route, Rate-Limit, Eingabe-Schema.
 * Ersetzt werden: Supabase (Sitzung + Service-Client), das Sprachmodell und Sentry.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const welt = vi.hoisted(() => ({
  rpc: [] as { name: string; args: Record<string, unknown> }[],
  /** Antwort von grant_diagnose_credits — Wert oder Wurf. */
  grant: (() => ({ data: 1, error: null })) as () => { data: unknown; error: { message: string } | null },
  modell: (() => { throw new Error('Modell nicht erreichbar'); }) as () => unknown,
  insertFehler: null as { message: string } | null,
  sentry: [] as { text: string; opts: Record<string, unknown> }[],
  ipSeq: 0,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'nutzer-1', email: 'kim@example.de' } } }) },
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      welt.rpc.push({ name, args });
      if (name === 'consume_diagnose_credit') return { data: true, error: null };
      if (name === 'grant_diagnose_credits') return welt.grant();
      throw new Error(`unerwartete RPC ${name}`);
    },
    from: (tabelle: string) => {
      if (tabelle !== 'diagnosen') throw new Error(`unerwartete Tabelle ${tabelle}`);
      return {
        insert: () => ({
          select: () => ({
            single: async () => (welt.insertFehler ? { data: null, error: welt.insertFehler } : { data: { id: 'diagnose-1' }, error: null }),
          }),
        }),
      };
    },
  }),
}));

vi.mock('@ai-sdk/anthropic', () => ({ anthropic: (id: string) => id }));
vi.mock('ai', () => ({ generateObject: async () => ({ object: welt.modell() }) }));

vi.mock('@sentry/nextjs', () => ({
  captureMessage: (text: string, opts: Record<string, unknown>) => { welt.sentry.push({ text, opts }); },
}));

import { POST } from '@/app/api/steak-beichte/analyze/route';

function anfrage(): Request {
  const fd = new FormData();
  fd.set('problem', 'Außen schwarz, innen roh — was lief falsch?');
  welt.ipSeq += 1;
  return new Request('https://steakakademie.de/api/steak-beichte/analyze', {
    method: 'POST',
    headers: { origin: 'https://steakakademie.de', host: 'steakakademie.de', 'x-real-ip': `10.8.0.${welt.ipSeq}` },
    body: fd,
  });
}

const rueckbuchungen = () => welt.rpc.filter((r) => r.name === 'grant_diagnose_credits');

beforeEach(() => {
  welt.rpc = [];
  welt.sentry = [];
  welt.insertFehler = null;
  welt.grant = () => ({ data: 1, error: null });
  welt.modell = () => { throw new Error('Modell nicht erreichbar'); };
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('Diagnose gescheitert, Rückbuchung gelungen', () => {
  it('502, genau eine Rückbuchung über 1 Guthaben, die Antwort sagt „nicht belastet“ — und Sentry schweigt', async () => {
    const res = await POST(anfrage());
    expect(res.status).toBe(502);
    expect(rueckbuchungen()).toEqual([{ name: 'grant_diagnose_credits', args: { p_user_id: 'nutzer-1', p_amount: 1 } }]);
    expect((await res.json()).error).toContain('dein Guthaben wurde nicht belastet');
    expect(welt.sentry).toHaveLength(0);
  });
});

describe('Diagnose gescheitert, Rückbuchung gescheitert', () => {
  it('die Datenbank meldet einen Fehler → die Antwort behauptet die Rückbuchung NICHT und nennt den Kontaktweg', async () => {
    welt.grant = () => ({ data: null, error: { message: 'permission denied for function grant_diagnose_credits' } });
    const res = await POST(anfrage());
    expect(res.status).toBe(502);
    const { error } = await res.json();
    expect(error).not.toContain('nicht belastet');
    expect(error).toContain('nicht automatisch zurückgebucht');
    expect(error).toContain('pitmaster@steakakademie.de');
  });

  it('… und Sentry bekommt genau eine Meldung mit Konto-ID und Ursache, ohne Adresse und ohne Eingabetext', async () => {
    welt.grant = () => ({ data: null, error: { message: 'permission denied for function grant_diagnose_credits' } });
    await POST(anfrage());
    expect(welt.sentry).toHaveLength(1);
    expect(welt.sentry[0].text).toMatch(/Rückbuchung gescheitert/);
    expect(welt.sentry[0].opts).toMatchObject({
      level: 'error',
      fingerprint: ['steak-beichte', 'refund-gescheitert'],
      extra: { userId: 'nutzer-1', fehler: 'permission denied for function grant_diagnose_credits' },
    });
    const roh = JSON.stringify(welt.sentry[0]);
    expect(roh).not.toContain('kim@example.de');
    expect(roh).not.toContain('Außen schwarz');
  });

  it('die Rückbuchung wirft (Netz weg) → trotzdem 502 mit ehrlicher Antwort und Meldung, kein unbehandelter Fehler', async () => {
    welt.grant = () => { throw new Error('fetch failed'); };
    const res = await POST(anfrage());
    expect(res.status).toBe(502);
    expect((await res.json()).error).not.toContain('nicht belastet');
    expect(welt.sentry).toHaveLength(1);
    expect(welt.sentry[0].opts).toMatchObject({ extra: { fehler: 'fetch failed' } });
  });

  it('auch wenn erst das Speichern der Diagnose scheitert, gilt dasselbe', async () => {
    welt.modell = () => ({ zusammenfassung: 'x' });
    welt.insertFehler = { message: 'insert verweigert' };
    welt.grant = () => ({ data: null, error: { message: 'kaputt' } });
    const res = await POST(anfrage());
    expect(res.status).toBe(502);
    expect(rueckbuchungen()).toHaveLength(1);
    expect(welt.sentry).toHaveLength(1);
  });
});

describe('Diagnose gelungen', () => {
  it('200 mit der ID — keine Rückbuchung, keine Meldung', async () => {
    welt.modell = () => ({ zusammenfassung: 'x' });
    const res = await POST(anfrage());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: 'diagnose-1' });
    expect(rueckbuchungen()).toHaveLength(0);
    expect(welt.sentry).toHaveLength(0);
  });
});
