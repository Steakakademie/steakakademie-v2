import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/digistore24/route';
import { digistoreSignature } from '@/lib/digistore/signature';

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
  // Lesefehler je Tabelle (03.10.2026): supabase-js wirft nicht, es liefert `error`.
  leseFehler: {} as Record<string, { message: string }>,
  sentry: [] as { text: string; opts: Record<string, any> }[],
}));

// Sentry wird nur mitgeschrieben — die Tests pruefen, WAS gemeldet wird.
vi.mock('@sentry/nextjs', () => ({
  captureMessage: (text: string, opts: Record<string, any>) => { db.sentry.push({ text, opts }); },
}));

function nextId(prefix: string) {
  db.seq += 1;
  return `${prefix}-${String(db.seq).padStart(4, '0')}`;
}

function from(name: string) {
  const rows = (db.tables[name] ??= []);
  const filters: [string, unknown][] = [];
  let op: 'select' | 'insert' | 'update' | 'upsert' = 'select';
  let payload: Row | null = null;
  const matches = (r: Row) => filters.every(([k, v]) => r[k] === v);

  async function run(single: boolean, list = false) {
    if (op === 'upsert') {
      // Nachbildung von UNIQUE (quelle, referenz) + ignoreDuplicates.
      const row = payload!;
      if (!rows.some((r) => r.quelle === row.quelle && r.referenz === row.referenz)) {
        rows.push({ id: nextId('gutschrift'), ...row });
      }
      return { data: null, error: null };
    }
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
    if (db.leseFehler[name]) return { data: null, error: db.leseFehler[name] };
    // Ohne single()/maybeSingle() liefert PostgREST eine Liste.
    if (list) return { data: rows.filter(matches), error: null };
    const found = rows.find(matches) ?? null;
    if (single && !found) return { data: null, error: { code: 'PGRST116', message: 'no rows' } };
    return { data: found, error: null };
  }

  const builder: any = {
    select: () => builder,
    insert: (row: Row) => { op = 'insert'; payload = row; return builder; },
    update: (patch: Row) => { op = 'update'; payload = patch; return builder; },
    upsert: (row: Row) => { op = 'upsert'; payload = row; return builder; },
    eq: (k: string, v: unknown) => { filters.push([k, v]); return builder; },
    single: () => run(true),
    maybeSingle: () => run(false),
    then: (ok: any, fail: any) => run(false, op === 'select' && name === 'protokoll_gutschriften').then(ok, fail),
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
    case 'create_voucher': {
      // Nachbildung von create_voucher: idempotent je ds_order_id.
      const vouchers = (db.tables.vouchers ??= []);
      const vorhanden = vouchers.find((v) => v.ds_order_id === args.p_ds_order_id);
      if (vorhanden) return { data: vorhanden.code, error: null };
      const code = `SA-TEST-${String(vouchers.length + 1).padStart(4, '0')}`;
      vouchers.push({
        code, course_id: args.p_course_id, kind: args.p_kind, credit_amount: args.p_credit_amount,
        ds_order_id: args.p_ds_order_id, purchaser_email: args.p_purchaser_email, status: 'issued',
      });
      return { data: code, error: null };
    }
    case 'revoke_voucher': {
      const v = (db.tables.vouchers ?? []).find((x) => x.ds_order_id === args.p_ds_order_id);
      if (!v) return { data: 'not_found', error: null };
      v.status = 'revoked';
      return { data: 'revoked', error: null };
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
      { ds_product_id: '696396', course_id: 'course-mein-protokoll', is_voucher: false, voucher_credit_amount: null, credit_amount: null,
        courses: { slug: 'mein-protokoll', title: 'Mein Protokoll', published: true } },
    ],
    digistore_orders: [],
    bookings: [],
  };
  db.credits = {};
  db.seq = 0;
  db.leseFehler = {};
  db.sentry = [];
  process.env.DIGISTORE_WEBHOOK_TOKEN = TOKEN;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  process.env.LOOPS_API_KEY = 'loops-key';
  process.env.LOOPS_MAGIC_LINK_TEMPLATE_ID = 'tpl-magic';
  process.env.LOOPS_VOUCHER_TEMPLATE_ID = 'tpl-voucher';
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
  // mockClear: Der Spion bleibt ueber die Tests hinweg derselbe und sammelt
  // sonst die ALARM-Zeilen frueherer Tests — alarme() weiter unten zaehlt sie.
  vi.spyOn(console, 'error').mockImplementation(() => {}).mockClear();
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

describe('Digistore24-Webhook: „Verbindung testen“ (event=connection_test)', () => {
  const PASS = 'test-ipn-kennwort';

  function signed(fields: Record<string, string>, pass = PASS) {
    const params = { ...fields, sha_sign: digistoreSignature(pass, fields) };
    return new Request('https://steakakademie.de/api/webhooks/digistore24', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
  }

  beforeEach(() => {
    process.env.DIGISTORE_IPN_PASSPHRASE = PASS;
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  it('antwortet mit 200, wenn der Test korrekt signiert ist — ohne Bestellung anzulegen', async () => {
    const res = await POST(signed({ event: 'connection_test' }));
    expect(res.status).toBe(200);
    expect(db.tables.digistore_orders).toHaveLength(0);
  });

  it('weist einen Test mit falschem Kennwort ab (401)', async () => {
    const res = await POST(signed({ event: 'connection_test' }, 'falsches-kennwort'));
    expect(res.status).toBe(401);
  });

  it('akzeptiert einen echten Kauf über sha_sign', async () => {
    const res = await POST(signed({
      event: 'payment', order_id: 'ORD-SHA-1', product_id: '696399', email: 'neu@example.de',
    }));
    expect(res.status).toBe(200);
    expect(db.tables.bookings).toHaveLength(1);
  });
});

describe('Digistore24-Webhook: Alarm „Kurs nicht veroeffentlicht“ (Fehlalarm 30.09.2026)', () => {
  function alarme() {
    return (console.error as any).mock.calls.filter((c: unknown[]) => c[0] === '[ds-webhook] ALARM');
  }

  it('Credit-Produkt (Steak-Beichte) loest keinen Alarm aus, auch wenn der Kurs unveroeffentlicht ist', async () => {
    db.tables.digistore_products[1] = {
      ...db.tables.digistore_products[1],
      course_id: 'course-steak-beichte',
      courses: { slug: 'steak-beichte', title: 'Steak-Beichte', published: false },
    };
    const res = await POST(delivery({ event: 'payment', order_id: 'ORD-B-1', product_id: '696394', email: 'neu@example.de' }));
    expect(res.status).toBe(200);
    expect(alarme()).toHaveLength(0);
  });

  it('Kurs-Produkt mit unveroeffentlichtem Kurs alarmiert genau einmal, auch bei doppelter Zustellung', async () => {
    db.tables.digistore_products[0].courses = { slug: 'bbq-grundkurs', title: 'BBQ Grundkurs', published: false };
    const felder = { event: 'payment', order_id: 'ORD-K-1', product_id: '696399', email: 'neu2@example.de' };
    const erste  = await POST(delivery(felder));
    const zweite = await POST(delivery(felder));
    expect(erste.status).toBe(200);
    expect(zweite.status).toBe(200);
    expect(alarme()).toHaveLength(1);
  });
});

describe('Digistore24-Webhook: Mein Protokoll — Pakete als Gutschrift', () => {
  const kauf = (order: string, brutto: string, event = 'payment') =>
    delivery({ event, order_id: order, product_id: '696396', email: 'griller@example.de', amount_brutto: brutto });
  const gutschriften = () => db.tables.protokoll_gutschriften ?? [];
  const summe = () => gutschriften().reduce((n, g) => n + g.anzahl, 0);
  const zugang = () => (db.tables.bookings ?? []).some((b) => b.course_id === 'course-mein-protokoll' && !b.revoked_at);

  it('19 EUR schreibt 1 Protokoll gut, 29 EUR zwei — und schaltet den Zugang frei', async () => {
    expect((await POST(kauf('MP-1', '19.00'))).status).toBe(200);
    expect(gutschriften()).toMatchObject([{ quelle: 'digistore', referenz: 'MP-1', anzahl: 1 }]);
    expect(zugang()).toBe(true);

    expect((await POST(kauf('MP-2', '29.00'))).status).toBe(200);
    expect(gutschriften()[1]).toMatchObject({ referenz: 'MP-2', anzahl: 2 });
    expect(summe()).toBe(3);
  });

  it('eine zweite Zustellung derselben Bestellung schreibt nichts doppelt', async () => {
    await POST(kauf('MP-1', '29.00'));
    await POST(kauf('MP-1', '29.00'));
    expect(gutschriften()).toHaveLength(1);
    expect(summe()).toBe(2);
  });

  it('scheitert die Mail, bleibt die Gutschrift bei der Wiederholung einfach', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    expect((await POST(kauf('MP-1', '19.00'))).status).toBe(500);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    await POST(kauf('MP-1', '19.00'));
    expect(summe()).toBe(1);
  });

  it('Rückgabe des einzigen Kaufs bucht zurück und entzieht den Zugang', async () => {
    await POST(kauf('MP-1', '29.00'));
    expect((await POST(kauf('MP-1', '-29.00', 'refund'))).status).toBe(200);
    expect(gutschriften()[1]).toMatchObject({ referenz: 'MP-1:rueckgabe', anzahl: -2 });
    expect(summe()).toBe(0);
    expect(zugang()).toBe(false);
  });

  it('Rückgabe EINES von zwei Käufen lässt den Zugang für den anderen stehen', async () => {
    await POST(kauf('MP-1', '19.00'));
    await POST(kauf('MP-2', '19.00'));
    expect((await POST(kauf('MP-2', '-19.00', 'refund'))).status).toBe(200);
    expect(summe()).toBe(1);
    expect(zugang()).toBe(true);
  });

  it('andere Kurse bekommen keine Protokoll-Gutschrift', async () => {
    await POST(delivery({ event: 'payment', order_id: 'BBQ-1', product_id: '696399', email: 'griller@example.de', amount_brutto: '49.00' }));
    expect(gutschriften()).toHaveLength(0);
  });
});

describe('Digistore24-Webhook: Lesefehler ist nicht „unbekanntes Produkt“ (03.10.2026)', () => {
  const kauf = { event: 'payment', order_id: 'ORD-L-1', product_id: '696399', email: 'neu@example.de' };

  it('Produkt-Zuordnung nicht lesbar → 500 (Digistore wiederholt) und Alarm, keine Zeile, kein Zugang', async () => {
    db.leseFehler.digistore_products = { message: 'connection terminated unexpectedly' };

    const res = await POST(delivery(kauf));

    expect(res.status).toBe(500);
    expect(db.tables.digistore_orders).toHaveLength(0);
    expect(db.tables.bookings).toHaveLength(0);
    expect(db.sentry).toHaveLength(1);
    expect(db.sentry[0].opts.tags).toMatchObject({ grund: 'mapping-lesefehler', ds_product_id: '696399' });
    expect(db.sentry[0].opts.extra.fehler).toBe('connection terminated unexpectedly');
  });

  it('die Wiederholung nach behobenem Lesefehler liefert aus', async () => {
    db.leseFehler.digistore_products = { message: 'connection terminated unexpectedly' };
    expect((await POST(delivery(kauf))).status).toBe(500);

    db.leseFehler = {};
    expect((await POST(delivery(kauf))).status).toBe(200);
    expect(db.tables.bookings).toHaveLength(1);
    expect(db.tables.digistore_orders[0]).toMatchObject({ processing_status: 'processed' });
  });

  it('wirklich unbekanntes Produkt bleibt bei 200 + Alarm „kein-mapping“', async () => {
    const res = await POST(delivery({ ...kauf, product_id: '999999' }));
    expect(res.status).toBe(200);
    expect(db.sentry).toHaveLength(1);
    expect(db.sentry[0].opts.tags).toMatchObject({ grund: 'kein-mapping' });
  });
});

describe('Digistore24-Webhook: gescheiterte Verarbeitung erreicht Sentry (03.10.2026)', () => {
  it('Kaufmail scheitert → 500 und Alarm „verarbeitung-gescheitert“ — nicht nur eine Logzeile', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('template not published', { status: 400 })));

    const res = await POST(delivery({ event: 'payment', order_id: 'ORD-V-1', product_id: '696399', email: 'neu@example.de' }));

    expect(res.status).toBe(500);
    expect(db.tables.digistore_orders[0]).toMatchObject({ processing_status: 'failed' });
    expect(db.sentry).toHaveLength(1);
    expect(db.sentry[0].opts.tags).toMatchObject({ grund: 'verarbeitung-gescheitert', ds_product_id: '696399', ds_event: 'payment' });
    expect(db.sentry[0].opts.extra.fehler).toMatch(/loops email failed \(400\)/);
  });

  it('Credit-Produkt: gescheiterte Kaufmail alarmiert ebenfalls', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    const res = await POST(delivery({ event: 'payment', order_id: 'ORD-V-2', product_id: '696394', email: 'neu@example.de' }));
    expect(res.status).toBe(500);
    expect(db.sentry.map((s) => s.opts.tags.grund)).toEqual(['verarbeitung-gescheitert']);
  });

  it('die Kaeuferadresse steht nicht im Alarm (Rueckgabe fuer unbekanntes Konto)', async () => {
    const res = await POST(delivery({ event: 'refund', order_id: 'ORD-V-3', product_id: '696399', email: 'fremd@example.de' }));
    expect(res.status).toBe(500);
    expect(db.sentry).toHaveLength(1);
    expect(JSON.stringify(db.sentry[0])).not.toContain('fremd@example.de');
    expect(db.sentry[0].opts.extra.fehler).toBe('refund for unknown user: <email>');
  });

  it('erfolgreicher Kauf meldet nichts', async () => {
    const res = await POST(delivery({ event: 'payment', order_id: 'ORD-V-4', product_id: '696399', email: 'neu@example.de' }));
    expect(res.status).toBe(200);
    expect(db.sentry).toHaveLength(0);
  });
});

describe('Digistore24-Webhook: Geschenkgutscheine (Gutschein-Konzept T7, 09.10.2026)', () => {
  beforeEach(() => {
    db.tables.digistore_products.push(
      // G3 Mein Protokoll — Kurs-Gutschein
      { ds_product_id: '800001', course_id: 'course-mein-protokoll', is_voucher: true, voucher_credit_amount: null, credit_amount: null,
        courses: { slug: 'mein-protokoll', title: 'Mein Protokoll', published: false } },
      // G2 Steak-Beichte 5er — Credit-Gutschein
      { ds_product_id: '800002', course_id: 'course-steak-beichte', is_voucher: true, voucher_credit_amount: 5, credit_amount: null,
        courses: { slug: 'steak-beichte', title: 'Steak-Beichte', published: false } },
    );
  });

  const kauf = (product: string, order = 'GS-1', event = 'payment') =>
    delivery({ event, order_id: order, product_id: product, email: 'Schenker@Example.de' });
  const vouchers = () => db.tables.vouchers ?? [];
  const mailBodies = () =>
    (fetch as any).mock.calls.map((c: unknown[]) => JSON.parse(String((c[1] as RequestInit).body)));

  it('Kurs-Gutschein: Code entsteht, Gutschein-Mail geht raus, beim Käufer wird nichts freigeschaltet', async () => {
    const res = await POST(kauf('800001'));

    expect(res.status).toBe(200);
    expect(vouchers()).toMatchObject([
      { course_id: 'course-mein-protokoll', kind: 'course', credit_amount: null, ds_order_id: 'GS-1', purchaser_email: 'schenker@example.de' },
    ]);
    expect(db.tables.bookings).toHaveLength(0);
    expect(db.users).toHaveLength(0);
    expect(mailBodies()).toEqual([
      expect.objectContaining({
        transactionalId: 'tpl-voucher',
        email: 'schenker@example.de',
        dataVariables: expect.objectContaining({ voucher_code: 'SA-TEST-0001', course_title: 'Mein Protokoll' }),
      }),
    ]);
    expect(db.tables.digistore_orders[0]).toMatchObject({ processing_status: 'processed', error_message: 'voucher SA-TEST-0001' });
  });

  it('unveröffentlichter Kurs löst beim Gutschein-Kauf keinen Alarm aus (Mein Protokoll vor dem 01.11.)', async () => {
    await POST(kauf('800001'));
    expect(db.sentry).toHaveLength(0);
  });

  it('5er-Gutschein der Steak-Beichte: Credit-Gutschein über 5 Diagnosen, Käufer bekommt keine Credits', async () => {
    const res = await POST(kauf('800002'));

    expect(res.status).toBe(200);
    expect(vouchers()).toMatchObject([{ course_id: 'course-steak-beichte', kind: 'credit', credit_amount: 5 }]);
    expect(db.credits).toEqual({});
  });

  it('doppelte Zustellung derselben Bestellung erzeugt keinen zweiten Code', async () => {
    await POST(kauf('800001'));
    const zweite = await POST(kauf('800001'));
    expect(zweite.status).toBe(200);
    expect(vouchers()).toHaveLength(1);
  });

  it('scheitert die Gutschein-Mail: 500 + Alarm, die Wiederholung verschickt denselben Code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    expect((await POST(kauf('800001'))).status).toBe(500);
    expect(db.sentry.map((s) => s.opts.tags.grund)).toEqual(['verarbeitung-gescheitert']);

    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    expect((await POST(kauf('800001'))).status).toBe(200);
    expect(vouchers()).toHaveLength(1);
    expect(mailBodies()[0].dataVariables.voucher_code).toBe('SA-TEST-0001');
  });

  it('Rückgabe nimmt den Gutschein zurück', async () => {
    await POST(kauf('800001'));
    const res = await POST(kauf('800001', 'GS-1', 'refund'));
    expect(res.status).toBe(200);
    expect(vouchers()[0].status).toBe('revoked');
  });
});
