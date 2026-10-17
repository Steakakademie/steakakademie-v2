import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Gedruckte Urkunde: ein Name pro Konto (17.10.2026). Vorher war der Name je
 * Bestellung frei — ein Konto konnte Urkunden für beliebig viele Personen drucken.
 */

const db = vi.hoisted(() => ({
  tabellen: {} as Record<string, Record<string, any>[]>,
  benutzer: 'u1' as string | null,
  body: {} as Record<string, any>,
}));

vi.mock('@/lib/api/guard', () => ({
  guardRequest: async () => ({ ok: true, body: db.body, ip: '1.2.3.4', principal: { kind: 'user', userId: db.benutzer } }),
  jsonError: (status: number, error: string) => Response.json({ error }, { status }),
  isAdminRequest: async () => false,
  userIdFromRequest: async () => db.benutzer,
}));
vi.mock('@/lib/urkunde/bestellbar', () => ({ urkundeBestellbar: () => true, urkundeFehlendeKonfiguration: () => [] }));
vi.mock('@/lib/urkunde/benachrichtigung', () => ({ meldeBestellung: async () => true, bestaetigeBestellung: async () => true }));
vi.mock('@/lib/urkunde/produktion', () => ({
  dienstClient: () => ({
    from(name: string) {
      const zeilen = (db.tabellen[name] ??= []);
      const filter: [string, unknown][] = [];
      let einfuegen: Record<string, any> | null = null;
      const passt = (z: Record<string, any>) => filter.every(([k, v]) => z[k] === v);
      const b: any = {
        select: () => b,
        eq: (k: string, v: unknown) => { filter.push([k, v]); return b; },
        insert: (z: Record<string, any>) => { einfuegen = z; return b; },
        upsert: async (z: Record<string, any>) => {
          if (!zeilen.some((x) => x.user_id === z.user_id)) zeilen.push({ ...z });
          return { data: null, error: null };
        },
        maybeSingle: async () => {
          if (einfuegen) {
            const z = { id: `id-${zeilen.length + 1}`, ...einfuegen };
            zeilen.push(z);
            return { data: { id: z.id }, error: null };
          }
          return { data: zeilen.find(passt) ?? null, error: null };
        },
      };
      return b;
    },
    auth: { admin: { getUserById: async () => ({ data: { user: { email: 'kunde@example.de' } } }) } },
  }),
}));

import { POST } from '@/app/api/urkunde/bestellen/route';

const adresse = { vorname: 'Max', nachname: 'Muster', strasse: 'Weg 1', plz: '42279', ort: 'Wuppertal', land: 'DE', consent: true };
const bestellen = (extra: Record<string, any>) => {
  db.body = { stufe: 2, ...adresse, ...extra };
  return POST(new Request('https://steakakademie.de/api/urkunde/bestellen', { method: 'POST' }));
};

beforeEach(() => {
  db.benutzer = 'u1';
  db.tabellen = {
    course_progress: [{ user_id: 'u1', stufe: 2, status: 'bestanden' }],
    urkunden_namen: [],
    urkunden_bestellungen: [],
  };
});

describe('Urkunde bestellen: Name fest ans Konto gebunden', () => {
  it('erste Bestellung legt den Namen fest', async () => {
    const res = await bestellen({ nameAufUrkunde: '  Max   Muster ' });
    expect(res.status).toBe(200);
    expect(db.tabellen.urkunden_namen).toEqual([{ user_id: 'u1', name: 'Max Muster' }]);
    expect(db.tabellen.urkunden_bestellungen[0].name_auf_urkunde).toBe('Max Muster');
  });

  it('spätere Bestellung mit anderem Namen druckt trotzdem den festgelegten', async () => {
    db.tabellen.urkunden_namen.push({ user_id: 'u1', name: 'Max Muster' });
    const res = await bestellen({ nameAufUrkunde: 'Freund des Hauses' });
    expect(res.status).toBe(200);
    expect(db.tabellen.urkunden_bestellungen[0].name_auf_urkunde).toBe('Max Muster');
  });

  it('festgelegter Name genügt — kein Name im Formular nötig', async () => {
    db.tabellen.urkunden_namen.push({ user_id: 'u1', name: 'Max Muster' });
    expect((await bestellen({})).status).toBe(200);
  });

  it('ohne festen Namen und ohne Angabe: 400, keine Bestellung', async () => {
    const res = await bestellen({});
    expect(res.status).toBe(400);
    expect(db.tabellen.urkunden_bestellungen).toHaveLength(0);
  });
});
