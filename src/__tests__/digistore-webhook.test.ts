import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/digistore24/route';

/**
 * Digistore24-Webhook gegen eine In-Memory-Supabase.
 * Echt bleibt die Route selbst (Auth, Idempotenz, Event-Routing); ersetzt werden nur
 * die externen Dienste: Supabase (Tabellen, RPCs, Auth-Admin) und Loops (fetch).
 * Die RPC-Nachbildungen folgen den SQL-Funktionen in supabase/migrations/.
 */

type Row = Record<string, any>;
type User = { id: string; email: string };

const db = vi.hoisted(() => ({
  users: [] as { id: string; email: string }[],
  tables: {} as Record<string, Record<string, any>[]>,
  credits: {} as Record<string, number>,
  seq: 0,
}));

function nextId(prefix: string) {
  db.seq += 1;
  return `${prefix}-${String(db.seq).padStart(4, '0')}`;
}

function from(name: string) {
  const rows = (db.tables[name] ??= []);
  const filters: [string, unknown][] = [];
  let op: 'select' | 'insert' | 'update' = 'select';
  let payload: Row | null = null;
  const matches = (r: Row) => filters.every(([k, v]) => r[k] === v);

  async function run(single: boolean) {
    if (op === 'insert') {
      const row = payload!;
      if (name === 'digistore_orders' &&
          rows.some((r) => r.ds_order_id === row.ds_order_id && r.ds_event === row.ds_event)) {
        return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
      }
      const stored = { id: nextId('order'), created_at: new Date().toISOString(), ...row };
      rows.push(stored);
      return { data: { id: stored.id }, error: null };
    }
    if (op === 'update') {
      rows.filter(matches).forEach((r) => Object.assign(r, payload));
      return { data: null, error: null };
    }
    const found = rows.find(matches) ?? null;
    if (single && !found) return { data: null, error: { code: 'PGRST116', message: 'no rows' } };
    return { data: found, error: null };
  }

  const builder: any = {
    select: () => builder,
    insert: (row: Row) => { op = 'insert'; payload = row; return builder; },
    update: (patch: Row) => { op = 'update'; payload = patch; return builder; },
    eq: (k: string, v: unknown) => { filters.push([k, v]); return builder; },
    single: () => run(true),
    maybeSingle: () => run(false),
    then: (ok: any, fail: any) => run(false).then(ok, fail),
  };
  return builder;
}

async function rpc(name: string, args: Row) {
  const bookings = (db.tables.bookings ??= []);
  switch (name) {
    case 'find_user_id_by_email': {
      const u = db.users.find((x) => x.email.toLowerCase() === String(args.p_email).toLowerCase());
      return { data: u?.id ?? null, error: null };
    }
    case 'grant_course_access': {
      let b = bookings.find((x) => x.user_id === args.p_user_id && x.course_id === args.p_course_id);
      if (b) b.revoked_at = null;
      else bookings.push((b = { id: nextId('booking'), user_id: args.p_user_id, course_id: args.p_course_id, revoked_at: null }));
      return { data: b.id, error: null };
    }
    case 'revoke_course_access': {
      const hit = bookings.filter((x) => x.user_id === args.p_user_id && x.course_id === args.p_course_id && !x.revoked_at);
      hit.forEach((x) => { x.revoked_at = new Date().toISOString(); });
      return { data: hit.length, error: null };
    }
    case 'grant_diagnose_credits': {
      db.credits[args.p_user_id] = (db.credits[args.p_user_id] ?? 0) + args.p_amount;
      return { data: db.credits[args.p_user_id], error: null };
    }
    case 'grant_order_credits': {
      const order = (db.tables.digistore_orders ?? []).find((o) => o.id === args.p_order_id);
      if (!order) return { data: null, error: { code: 'P0001', message: `order not found: ${args.p_order_id}` } };
      if (order.credits_applied_at) return { data: false, error: null };
      order.credits_applied_at = new Date().toISOString();
      db.credits[args.p_user_id] = (db.credits[args.p_user_id] ?? 0) + args.p_amount;
      return { data: true, error: null };
    }
    default:
      return { data: null, error: { code: 'PGRST202', message: `Could not find the function public.${name}` } };
  }
}

const client = {
  from,
  rpc,
  auth: {
    admin: {
      // Wie die echte GoTrue-Admin-API: seitenweise, Standard 50, hier max. perPage Nutzer.
      listUsers: async ({ page = 1, perPage = 50 } = {}) => ({
        data: { users: db.users.slice((page - 1) * perPage, page * perPage) },
        error: null,
      }),
      createUser: async ({ email }: { email: string }) => {
        if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          return { data: { user: null }, error: { status: 422, code: 'email_exists', message: 'A user with this email address has already been registered' } };
        }
        const user = { id: nextId('user'), email };
        db.users.push(user);
        return { data: { user }, error: null };
      },
      generateLink: async () => ({ data: { properties: { hashed_token: 'hashed-token' } }, error: null }),
    },
  },
};

// vi.mock wird ueber die Imports gehoben; `client` wird erst beim Aufruf gelesen.
vi.mock('@supabase/supabase-js', () => ({ createClient: () => client }));

const TOKEN = 'test-webhook-token';
const COURSE_ID = 'course-bbq-grundkurs';

function delivery(fields: Record<string, string>) {
  return new Request('https://steakakademie.de/api/webhooks/digistore24', {
    method: 'POST',
    headers: { 'x-webhook-token': TOKEN, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  });
}

/** 250 Bestandskunden — mehr als eine listUsers-Seite zu 200. */
function seedUsers(count: number): User[] {
  for (let i = 1; i <= count; i++) db.users.push({ id: `user-existing-${i}`, email: `kunde${i}@example.de` });
  return db.users;
}

beforeEach(() => {
  db.users = [];
  db.tables = {
    digistore_products: [
      { ds_product_id: '696399', course_id: COURSE_ID, is_voucher: false, voucher_credit_amount: null, credit_amount: null,
        courses: { slug: 'bbq-grundkurs', title: 'BBQ Grundkurs' } },
      { ds_product_id: '696394', course_id: null, is_voucher: false, voucher_credit_amount: null, credit_amount: 1,
        courses: null },
    ],
    digistore_orders: [],
    bookings: [],
  };
  db.credits = {};
  db.seq = 0;
  process.env.DIGISTORE_WEBHOOK_TOKEN = TOKEN;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  process.env.LOOPS_API_KEY = 'loops-key';
  process.env.LOOPS_MAGIC_LINK_TEMPLATE_ID = 'tpl-magic';
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Digistore24-Webhook: Bestandskunden jenseits der ersten 200 Nutzer', () => {
  it('Kauf schaltet den Kurs fuer das vorhandene Konto frei, statt ein zweites anzulegen', async () => {
    seedUsers(250);

    const res = await POST(delivery({
      event: 'payment', order_id: 'ORD-1', product_id: '696399', email: 'Kunde230@example.de',
    }));

    expect(res.status).toBe(200);
    expect(db.tables.bookings).toHaveLength(1);
    expect(db.tables.bookings[0]).toMatchObject({ user_id: 'user-existing-230', course_id: COURSE_ID, revoked_at: null });
    expect(db.users).toHaveLength(250);
  });

  it('Rueckerstattung entzieht dem vorhandenen Konto den Kurs', async () => {
    seedUsers(250);
    db.tables.bookings.push({ id: 'booking-existing', user_id: 'user-existing-230', course_id: COURSE_ID, revoked_at: null });

    const res = await POST(delivery({
      event: 'refund', order_id: 'ORD-1', product_id: '696399', email: 'kunde230@example.de',
    }));

    expect(res.status).toBe(200);
    expect(db.tables.bookings[0].revoked_at).not.toBeNull();
  });
});

describe('Digistore24-Webhook: Credit-Produkt bei Wiederholung', () => {
  it('schreibt Credits nur einmal gut, wenn die Mail beim ersten Versuch scheitert und Digistore erneut zustellt', async () => {
    seedUsers(1);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('loops down', { status: 503 }))
      .mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const kauf = { event: 'payment', order_id: 'ORD-CREDIT-1', product_id: '696394', email: 'kunde1@example.de' };

    const erster  = await POST(delivery(kauf));
    const zweiter = await POST(delivery(kauf));

    expect(erster.status).toBe(500);
    expect(zweiter.status).toBe(200);
    expect(db.credits).toEqual({ 'user-existing-1': 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('schreibt beim 5er-Pack (25 EUR brutto) fuenf Credits gut, bei der Einzeldiagnose (7 EUR) eines', async () => {
    seedUsers(2);

    const pack   = await POST(delivery({ event: 'payment', order_id: 'ORD-PACK', product_id: '696394', email: 'kunde1@example.de', amount_brutto: '25.00' }));
    const einzel = await POST(delivery({ event: 'payment', order_id: 'ORD-EINZEL', product_id: '696394', email: 'kunde2@example.de', amount_brutto: '7.00' }));

    expect(pack.status).toBe(200);
    expect(einzel.status).toBe(200);
    expect(db.credits).toEqual({ 'user-existing-1': 5, 'user-existing-2': 1 });
  });
});
