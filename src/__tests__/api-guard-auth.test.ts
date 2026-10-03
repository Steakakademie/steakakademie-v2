/**
 * Auth-Modi des zentralen Guards (03.10.2026).
 *
 * Anlass: `auth: 'none'` löst niemanden auf — `principal` ist dort IMMER
 * `anonymous`. Der Aroma-Matcher wertete `principal` trotzdem aus und wies
 * damit jeden Eingeloggten mit 401 ab. Seitdem gibt es `'optional'`.
 *
 * Echt bleiben: guardRequest, Admin-Token (admin-auth.ts). Ersetzt wird nur
 * der Supabase-Sitzungs-Client.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const welt = vi.hoisted(() => ({
  user: null as { id: string } | null,
  getUserAufrufe: 0,
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => {
        welt.getUserAufrufe += 1;
        return { data: { user: welt.user } };
      },
    },
  }),
}));

import { guardRequest } from '@/lib/api/guard';
import { ADMIN_COOKIE, erzeugeAdminToken } from '@/lib/admin-auth';

const HOST = 'https://steakakademie.de';
const schema = z.object({});
let seq = 0;

function post(cookie?: string): Request {
  seq += 1;
  return new Request(`${HOST}/api/test`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json', origin: HOST, host: 'steakakademie.de',
      'x-real-ip': `10.1.0.${seq}`,
      ...(cookie ? { cookie } : {}),
    },
    body: '{}',
  });
}

const regel = (auth: 'none' | 'optional' | 'user-or-admin' | 'admin') =>
  ({ key: `auth-test-${auth}`, rate: { limit: 100, windowMs: 60_000 }, schema, auth });

describe('guardRequest: Auth-Modi', () => {
  const env = process.env;
  beforeEach(() => {
    process.env = {
      ...env,
      ADMIN_PASSWORD: 'ein-langes-test-passwort',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
    };
    welt.user = null;
    welt.getUserAufrufe = 0;
  });
  afterEach(() => { process.env = env; });

  it("'optional' mit gültiger Sitzung → user", async () => {
    welt.user = { id: 'user-7' };
    const r = await guardRequest(post('sb-token=abc'), regel('optional'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.principal).toEqual({ kind: 'user', userId: 'user-7' });
  });

  it("'optional' ohne Sitzung → anonymous, nie 401", async () => {
    const r = await guardRequest(post(), regel('optional'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.principal).toEqual({ kind: 'anonymous' });
  });

  it("'optional' mit Admin-Cookie → admin (ohne Supabase-Aufruf)", async () => {
    const token = await erzeugeAdminToken();
    const r = await guardRequest(post(`${ADMIN_COOKIE}=${token}`), regel('optional'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.principal).toEqual({ kind: 'admin' });
    expect(welt.getUserAufrufe).toBe(0);
  });

  it("'none' bleibt billig: immer anonymous, auch mit Sitzung — und fragt Supabase nicht", async () => {
    welt.user = { id: 'user-7' };
    const r = await guardRequest(post('sb-token=abc'), regel('none'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.principal).toEqual({ kind: 'anonymous' });
    expect(welt.getUserAufrufe).toBe(0);
  });

  it("'user-or-admin' weist ohne Sitzung weiter mit 401 ab", async () => {
    const r = await guardRequest(post(), regel('user-or-admin'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(401);
  });

  it("'admin' lässt einen eingeloggten Nutzer nicht durch", async () => {
    welt.user = { id: 'user-7' };
    const r = await guardRequest(post('sb-token=abc'), regel('admin'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(401);
  });
});
