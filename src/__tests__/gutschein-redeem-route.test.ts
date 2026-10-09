import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * POST /api/gutschein/redeem gegen nachgebildete Dienste (Gutschein-Konzept T7).
 * Echt bleiben: Route, guardRequest, Schema, Weiterleitungsziele.
 * Ersetzt werden: Supabase (Nutzer-Client + Service-Client). Was redeem_voucher
 * selbst tut, steht in supabase/migrations/ — hier zählt, was die Route daraus macht.
 */

const welt = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  rpcAntwort: { data: { status: 'ok', course_slug: 'mein-protokoll', course_title: 'Mein Protokoll' }, error: null } as {
    data: unknown;
    error: unknown;
  },
  rpc: [] as Record<string, unknown>[],
  upserts: [] as { tabelle: string; zeile: Record<string, unknown>; opts: Record<string, unknown> }[],
  ipSeq: 0,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: welt.user } }) },
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      welt.rpc.push({ name, ...args });
      return welt.rpcAntwort;
    },
    from: (tabelle: string) => ({
      upsert: async (zeile: Record<string, unknown>, opts: Record<string, unknown>) => {
        welt.upserts.push({ tabelle, zeile, opts });
        return { data: null, error: null };
      },
    }),
  }),
}));

import { POST } from '@/app/api/gutschein/redeem/route';

function anfrage(code: string) {
  welt.ipSeq += 1;
  return new Request('https://steakakademie.de/api/gutschein/redeem', {
    method: 'POST',
    headers: {
      'content-type': 'application/json', origin: 'https://steakakademie.de', host: 'steakakademie.de',
      'x-real-ip': `10.1.0.${welt.ipSeq}`,
    },
    body: JSON.stringify({ code }),
  });
}

beforeEach(() => {
  welt.user = { id: 'user-1' };
  welt.rpcAntwort = { data: { status: 'ok', course_slug: 'mein-protokoll', course_title: 'Mein Protokoll' }, error: null };
  welt.rpc = [];
  welt.upserts = [];
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Gutschein einlösen', () => {
  it('ohne Anmeldung: 401 mit needsLogin, kein RPC', async () => {
    welt.user = null;
    const res = await POST(anfrage('SA-ABCD-EFGH'));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ needsLogin: true });
    expect(welt.rpc).toHaveLength(0);
  });

  it('Mein Protokoll: Gutschrift kommt aus redeem_voucher, die Route schreibt nichts selbst', async () => {
    // Seit Migration 20261009170338 (angewendet 09.10.2026) in derselben
    // Transaktion wie die Einlösung — ein zweiter Schreibschritt hier könnte
    // scheitern, nachdem der Gutschein schon verbraucht ist.
    const res = await POST(anfrage('  sa-abcd-efgh '));
    expect(await res.json()).toMatchObject({ ok: true, redirect: '/mein-protokoll/fragebogen' });
    expect(welt.rpc[0]).toMatchObject({ name: 'redeem_voucher', p_user_id: 'user-1' });
    expect(welt.upserts).toHaveLength(0);
  });

  it('Steak-Beichte: keine Protokoll-Gutschrift, weiter zur Diagnose', async () => {
    welt.rpcAntwort = { data: { status: 'ok', course_slug: 'steak-beichte', course_title: 'Steak-Beichte' }, error: null };
    const res = await POST(anfrage('SA-ABCD-EFGH'));
    expect(await res.json()).toMatchObject({ ok: true, redirect: '/steak-beichte/diagnose' });
    expect(welt.upserts).toHaveLength(0);
  });

  it('Grillmeister-Diplom führt auf die Roadmap, nicht in den Gründer-Bereich', async () => {
    welt.rpcAntwort = { data: { status: 'ok', course_slug: 'grillmeister-diplom', course_title: 'Grillmeister-Diplom' }, error: null };
    const res = await POST(anfrage('SA-ABCD-EFGH'));
    expect(await res.json()).toMatchObject({ ok: true, redirect: '/diplome/roadmap' });
  });

  it('bereits eingelöst: verständliche Meldung, keine Gutschrift', async () => {
    welt.rpcAntwort = { data: { status: 'already_redeemed' }, error: null };
    const res = await POST(anfrage('SA-ABCD-EFGH'));
    expect(await res.json()).toEqual({ error: 'Dieser Gutschein wurde bereits eingelöst.' });
    expect(welt.upserts).toHaveLength(0);
  });

  it('RPC-Fehler: 500, keine Gutschrift', async () => {
    welt.rpcAntwort = { data: null, error: { message: 'boom' } };
    const res = await POST(anfrage('SA-ABCD-EFGH'));
    expect(res.status).toBe(500);
    expect(welt.upserts).toHaveLength(0);
  });
});
