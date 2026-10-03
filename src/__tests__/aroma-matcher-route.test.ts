/**
 * POST /api/aroma-matcher gegen nachgebildete Dienste (03.10.2026).
 *
 * Anlass: Die Route lief mit `auth: 'none'` und bekam damit nie einen Nutzer
 * zu sehen — jede Cut-Abfrage eines Eingeloggten endete mit 401, die Tabelle
 * aroma_matcher_abfragen hatte in der Produktion 0 Zeilen.
 *
 * Echt bleiben: Route, guardRequest, Cut-Daten. Ersetzt werden die beiden
 * Supabase-Clients (Sitzung und Service-Role).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const welt = vi.hoisted(() => ({
  user: null as { id: string } | null,
  abfragen: [] as { user_id: string; cut_id: string }[],
  warteliste: [] as string[],
  rpc: [] as Record<string, unknown>[],
  ipSeq: 0,
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: welt.user } }) } }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (name: string) => {
      if (name === 'aroma_matcher_abfragen') {
        return {
          select: () => ({
            eq: async (_spalte: string, userId: string) => ({
              data: welt.abfragen.filter((a) => a.user_id === userId).map((a) => ({ cut_id: a.cut_id })),
              error: null,
            }),
          }),
        };
      }
      if (name === 'aroma_matrix_warteliste') {
        return {
          upsert: async (zeile: { user_id: string }) => {
            if (!welt.warteliste.includes(zeile.user_id)) welt.warteliste.push(zeile.user_id);
            return { error: null };
          },
        };
      }
      throw new Error(`unerwartete Tabelle ${name}`);
    },
    // Nachbildung von consume_aroma_matcher_abfrage: Wiederholung frei, sonst
    // 1 vom Kontingent; -1, wenn es erschöpft ist.
    rpc: async (name: string, args: { p_user_id: string; p_cut_id: string; p_limit: number }) => {
      welt.rpc.push({ name, ...args });
      const meine = welt.abfragen.filter((a) => a.user_id === args.p_user_id);
      if (!meine.some((a) => a.cut_id === args.p_cut_id)) {
        if (meine.length >= args.p_limit) return { data: -1, error: null };
        welt.abfragen.push({ user_id: args.p_user_id, cut_id: args.p_cut_id });
      }
      const neu = welt.abfragen.filter((a) => a.user_id === args.p_user_id).length;
      return { data: args.p_limit - neu, error: null };
    },
  }),
}));

import { POST } from '@/app/api/aroma-matcher/route';
import { cutIds, FREE_LIMIT } from '@/lib/aroma-matcher/data';
import { ADMIN_COOKIE, erzeugeAdminToken } from '@/lib/admin-auth';

const CUT = cutIds()[0];

function anfrage(body: Record<string, unknown>, cookie?: string) {
  welt.ipSeq += 1;
  return new Request('https://steakakademie.de/api/aroma-matcher', {
    method: 'POST',
    headers: {
      'content-type': 'application/json', origin: 'https://steakakademie.de', host: 'steakakademie.de',
      'x-real-ip': `10.2.0.${welt.ipSeq}`,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  welt.user = null;
  welt.abfragen = [];
  welt.warteliste = [];
  welt.rpc = [];
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  process.env.ADMIN_PASSWORD = 'ein-langes-test-passwort';
});

describe('Aroma-Matcher: eingeloggt', () => {
  it('Cut-Abfrage liefert das Pairing und verbucht 1 vom Freikontingent (vorher: 401)', async () => {
    welt.user = { id: 'user-1' };
    const res = await POST(anfrage({ cutId: CUT }, 'sb-token=abc'));
    expect(res.status).toBe(200);
    const daten = await res.json();
    expect(daten.cut.id).toBe(CUT);
    expect(daten.remaining).toBe(FREE_LIMIT - 1);
    expect(daten.analysed).toEqual([CUT]);
    expect(welt.rpc).toHaveLength(1);
    expect(welt.rpc[0]).toMatchObject({ name: 'consume_aroma_matcher_abfrage', p_user_id: 'user-1', p_cut_id: CUT });
  });

  it('Status meldet loggedIn:true und das Restkontingent', async () => {
    welt.user = { id: 'user-1' };
    welt.abfragen = [{ user_id: 'user-1', cut_id: CUT }];
    const res = await POST(anfrage({}, 'sb-token=abc'));
    expect(await res.json()).toMatchObject({ loggedIn: true, remaining: FREE_LIMIT - 1, analysed: [CUT] });
  });

  it('Warteliste trägt das Konto ein', async () => {
    welt.user = { id: 'user-1' };
    const res = await POST(anfrage({ warteliste: true }, 'sb-token=abc'));
    expect(res.status).toBe(200);
    expect(welt.warteliste).toEqual(['user-1']);
  });

  it('erschöpftes Kontingent → 402', async () => {
    welt.user = { id: 'user-1' };
    const andere = cutIds().filter((id) => id !== CUT).slice(0, FREE_LIMIT);
    welt.abfragen = andere.map((cut_id) => ({ user_id: 'user-1', cut_id }));
    const res = await POST(anfrage({ cutId: CUT }, 'sb-token=abc'));
    expect(res.status).toBe(402);
  });
});

describe('Aroma-Matcher: anonym und Admin', () => {
  it('anonym: Status kommt zurück, Cut-Abfrage → 401, nichts wird verbucht', async () => {
    const status = await POST(anfrage({}));
    expect(await status.json()).toMatchObject({ loggedIn: false, remaining: 0 });
    const res = await POST(anfrage({ cutId: CUT }));
    expect(res.status).toBe(401);
    expect(welt.rpc).toHaveLength(0);
  });

  it('Admin-Cookie: Pairing ohne Verbuchung', async () => {
    const token = await erzeugeAdminToken();
    const res = await POST(anfrage({ cutId: CUT }, `${ADMIN_COOKIE}=${token}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ unlimited: true });
    expect(welt.rpc).toHaveLength(0);
  });
});
