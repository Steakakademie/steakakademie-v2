/**
 * VIP-Rolle hinter Schalter (C3, 22.10.2026).
 *
 * Solange Digistore-Produkt 734925 gesperrt ist, bleibt VIP_ROLLE_ENABLED aus:
 * dann hat nur der Admin Vollzugriff — eine aktive Buchung zählt nicht.
 * Mit VIP_ROLLE_ENABLED=1 gibt eine aktive, nicht widerrufene Buchung des
 * Kurses VIP_KURS_SLUG (Standard `vip`) die Vollansicht; ohne Buchung bleibt 403.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const lage = vi.hoisted(() => ({ admin: false, user: null as null | { id: string }, kurs: null as null | { id: string }, buchung: null as null | { id: string } }));

vi.mock('@/lib/api/guard', async (original) => ({
  ...(await original<typeof import('@/lib/api/guard')>()),
  isAdminRequest: async () => lage.admin,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: lage.user } }) },
    from: (tabelle: string) => {
      const kette: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'is', 'in', 'limit']) kette[m] = () => kette;
      kette.maybeSingle = async () => ({ data: tabelle === 'courses' ? lage.kurs : tabelle === 'bookings' ? lage.buchung : null });
      return kette;
    },
  }),
}));

async function aufruf(ip: string) {
  vi.resetModules();
  const { GET } = await import('@/app/api/mutterrezepte/[slug]/route');
  const req = new Request('https://steakakademie.de/api/mutterrezepte/limetten-cashewcreme', { headers: { 'x-forwarded-for': ip } });
  return GET(req, { params: Promise.resolve({ slug: 'limetten-cashewcreme' }) });
}

describe('Mutterrezepte — VIP-Rolle hinter Schalter', () => {
  beforeEach(() => {
    lage.admin = false;
    lage.user = { id: 'u1' };
    lage.kurs = { id: 'k-vip' };
    lage.buchung = { id: 'b1' };
  });
  afterEach(() => vi.unstubAllEnvs());

  it('Schalter aus: aktive Buchung zählt nicht, nur der Admin', async () => {
    vi.stubEnv('VIP_ROLLE_ENABLED', '0');
    expect((await aufruf('203.0.113.21')).status).toBe(403);
    lage.admin = true;
    expect((await aufruf('203.0.113.22')).status).toBe(200);
  });

  it('Schalter an: aktive Buchung des VIP-Kurses gibt die Vollansicht', async () => {
    vi.stubEnv('VIP_ROLLE_ENABLED', '1');
    const res = await aufruf('203.0.113.23');
    expect(res.status).toBe(200);
    expect((await res.json()).vollzugriff).toBe(true);
  });

  it('Schalter an, aber ohne Login, ohne Kurs oder ohne Buchung: 403', async () => {
    vi.stubEnv('VIP_ROLLE_ENABLED', '1');
    lage.buchung = null;
    expect((await aufruf('203.0.113.24')).status).toBe(403);
    lage.buchung = { id: 'b1' };
    lage.kurs = null;
    expect((await aufruf('203.0.113.25')).status).toBe(403);
    lage.kurs = { id: 'k-vip' };
    lage.user = null;
    expect((await aufruf('203.0.113.26')).status).toBe(403);
  });
});
