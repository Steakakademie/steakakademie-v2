import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Versand zum Wunschtermin + Formular-API (Uwe, 11.10.2026).
 * Echt: src/lib/gutschein-versand.ts, die beiden Routen, guardRequest, Schema.
 * Nachgebildet: die Tabelle `vouchers` (nur was die Routen fragen) und Loops (fetch).
 */

type Zeile = Record<string, any>;
const welt = vi.hoisted(() => ({ vouchers: [] as Record<string, any>[], ipSeq: 0 }));

function abfrage() {
  let op: 'select' | 'update' = 'select';
  let patch: Zeile = {};
  let head = false;
  let limit = Infinity;
  const filter: ((z: Zeile) => boolean)[] = [];
  const treffer = () => welt.vouchers.filter((z) => filter.every((f) => f(z)));
  const ausfuehren = (einzeln: boolean) => {
    const rows = treffer().slice(0, limit);
    if (op === 'update') rows.forEach((z) => Object.assign(z, patch));
    const mitKurs = rows.map((z) => ({ ...z, courses: { title: 'Mein Protokoll', slug: 'mein-protokoll' } }));
    if (head) return Promise.resolve({ count: rows.length, data: null, error: null });
    if (einzeln) return Promise.resolve({ data: mitKurs[0] ?? null, error: null });
    return Promise.resolve({ data: mitKurs, error: null });
  };
  const b: any = {
    select: (_s?: string, opts?: { head?: boolean }) => { if (opts?.head) head = true; return b; },
    update: (p: Zeile) => { op = 'update'; patch = p; return b; },
    eq: (k: string, v: unknown) => { filter.push((z) => z[k] === v); return b; },
    lte: (k: string, v: string) => { filter.push((z) => z[k] != null && z[k] <= v); return b; },
    order: () => b,
    limit: (n: number) => { limit = n; return b; },
    maybeSingle: () => ausfuehren(true),
    then: (ok: any, fail: any) => ausfuehren(false).then(ok, fail),
  };
  return b;
}

vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: () => abfrage() }) }));

import { verarbeiteFaellige, laufIstRot } from '@/lib/gutschein-versand';
import { POST as personalisieren } from '@/app/api/gutschein/personalisieren/route';
import { POST as versandLauf } from '@/app/api/gutschein/versand/route';
import { createClient } from '@supabase/supabase-js';

const TOKEN = '11111111-2222-3333-4444-555555555555';

function gutschein(extra: Zeile = {}): Zeile {
  return {
    id: `v${welt.vouchers.length + 1}`, code: `SA-TEST-000${welt.vouchers.length + 1}`, status: 'issued',
    valid_until: '2029-12-31T22:59:59+00:00', schenker_token: TOKEN, motiv: 'glut',
    empfaenger_name: null, schenker_name: null, gift_message: null,
    empfaenger_email: null, empfaenger_hinweis: null, versand_am: null, versand_status: 'keiner',
    versand_versuche: 0, versendet_am: null, versand_fehler: null,
    ...extra,
  };
}

function anfrage(body: Zeile) {
  welt.ipSeq += 1;
  return new Request('https://steakakademie.de/api/gutschein/personalisieren', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://steakakademie.de', host: 'steakakademie.de', 'x-real-ip': `10.2.0.${welt.ipSeq}` },
    body: JSON.stringify(body),
  });
}

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  welt.vouchers = [];
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk';
  process.env.LOOPS_API_KEY = 'loops-key';
  process.env.LOOPS_VOUCHER_GIFT_TEMPLATE_ID = 'tpl-geschenk';
  process.env.GUTSCHEIN_VERSAND_SECRET = 'geheim';
  fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

const admin = () => createClient('u', 'k') as any;
const mailBody = (i = 0) => JSON.parse(fetchMock.mock.calls[i][1].body);

describe('verarbeiteFaellige', () => {
  it('verschickt fällige Gutscheine, löscht die Adresse und behält den Hinweis', async () => {
    welt.vouchers.push(gutschein({
      versand_status: 'geplant', versand_am: '2026-12-24T07:00:00.000Z', empfaenger_email: 'papa@example.de',
      empfaenger_hinweis: 'p•••@example.de', empfaenger_name: 'Papa', schenker_name: 'Anna', gift_message: 'Frohes Fest', motiv: 'weihnachten',
    }));
    const b = await verarbeiteFaellige(admin(), new Date('2026-12-24T07:10:00Z'));
    expect(b).toMatchObject({ faellig: 1, versendet: 1 });
    expect(laufIstRot(b)).toBe(false);
    expect(mailBody()).toMatchObject({
      transactionalId: 'tpl-geschenk',
      email: 'papa@example.de',
      dataVariables: {
        empfaenger_name: 'Papa', schenker_name: 'Anna', nachricht: 'Frohes Fest', anlass: 'Frohe Weihnachten!',
        course_title: 'Mein Protokoll', voucher_code: 'SA-TEST-0001', gueltig_bis: '31.12.2029',
        voucher_url: 'https://steakakademie.de/gutschein/SA-TEST-0001',
      },
    });
    // Der Link an die beschenkte Person trägt KEINEN Schlüssel.
    expect(mailBody().dataVariables.voucher_url).not.toContain('k=');
    expect(welt.vouchers[0]).toMatchObject({ versand_status: 'versendet', empfaenger_email: null, empfaenger_hinweis: 'p•••@example.de' });
  });

  it('verschickt nichts vor dem Termin', async () => {
    welt.vouchers.push(gutschein({ versand_status: 'geplant', versand_am: '2026-12-24T07:00:00.000Z', empfaenger_email: 'papa@example.de' }));
    const b = await verarbeiteFaellige(admin(), new Date('2026-12-24T06:50:00Z'));
    expect(b.faellig).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('zurückgenommener Gutschein (Erstattung) wird nicht verschickt', async () => {
    welt.vouchers.push(gutschein({ status: 'revoked', versand_status: 'geplant', versand_am: '2026-12-24T07:00:00.000Z', empfaenger_email: 'papa@example.de' }));
    const b = await verarbeiteFaellige(admin(), new Date('2026-12-24T08:00:00Z'));
    expect(b.uebersprungen).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(welt.vouchers[0]).toMatchObject({ versand_status: 'keiner', empfaenger_email: null });
  });

  it('Loops-Fehler: zurück auf geplant, Lauf rot; nach dem dritten Versuch fehlgeschlagen', async () => {
    fetchMock.mockResolvedValue(new Response('down', { status: 503 }));
    welt.vouchers.push(gutschein({ versand_status: 'geplant', versand_am: '2026-12-24T07:00:00.000Z', empfaenger_email: 'papa@example.de' }));
    const jetzt = new Date('2026-12-24T08:00:00Z');

    const b1 = await verarbeiteFaellige(admin(), jetzt);
    expect(b1.erneutGeplant).toBe(1);
    expect(laufIstRot(b1)).toBe(true);
    expect(welt.vouchers[0]).toMatchObject({ versand_status: 'geplant', versand_versuche: 1 });

    await verarbeiteFaellige(admin(), jetzt);
    const b3 = await verarbeiteFaellige(admin(), jetzt);
    expect(b3.fehlgeschlagen).toBe(1);
    expect(b3.offeneFehler).toBe(1);
    expect(welt.vouchers[0]).toMatchObject({ versand_status: 'fehlgeschlagen', versand_versuche: 3 });
    // Die Adresse bleibt, damit der Schenkende korrigieren und neu speichern kann.
    expect(welt.vouchers[0].empfaenger_email).toBe('papa@example.de');
  });

  it('meldet einen hängenden Versand (in_arbeit seit über einer Stunde) als rot', async () => {
    welt.vouchers.push(gutschein({ versand_status: 'in_arbeit', versand_am: '2026-12-24T05:00:00.000Z', empfaenger_email: 'papa@example.de' }));
    const b = await verarbeiteFaellige(admin(), new Date('2026-12-24T08:00:00Z'));
    expect(b.haengend).toBe(1);
    expect(laufIstRot(b)).toBe(true);
  });
});

describe('POST /api/gutschein/personalisieren', () => {
  it('falscher Schlüssel: 403, nichts geändert', async () => {
    welt.vouchers.push(gutschein());
    const res = await personalisieren(anfrage({ code: 'SA-TEST-0001', k: 'falsch', motiv: 'danke', versand: 'selbst' }));
    expect(res.status).toBe(403);
    expect(welt.vouchers[0].motiv).toBe('glut');
  });

  it('selbst weitergeben: speichert Namen, Nachricht, Motiv und sagt geplanten Versand ab', async () => {
    welt.vouchers.push(gutschein({ versand_status: 'geplant', versand_am: '2026-12-24T07:00:00.000Z', empfaenger_email: 'papa@example.de' }));
    const res = await personalisieren(anfrage({
      code: 'sa-test-0001', k: TOKEN, empfaengerName: 'Papa', schenkerName: 'Anna', nachricht: 'Viel Spaß', motiv: 'geburtstag', versand: 'selbst',
    }));
    expect(res.status).toBe(200);
    expect(welt.vouchers[0]).toMatchObject({
      empfaenger_name: 'Papa', schenker_name: 'Anna', gift_message: 'Viel Spaß', motiv: 'geburtstag',
      versand_status: 'keiner', empfaenger_email: null, versand_am: null,
    });
  });

  it('Termin: plant den Versand in deutscher Zeit und verschickt noch nichts', async () => {
    welt.vouchers.push(gutschein());
    vi.useFakeTimers({ now: new Date('2026-11-05T10:00:00Z'), toFake: ['Date'] });
    const res = await personalisieren(anfrage({
      code: 'SA-TEST-0001', k: TOKEN, schenkerName: 'Anna', motiv: 'weihnachten', versand: 'mail',
      empfaengerEmail: 'Papa@Example.de', zeitpunkt: 'termin', datum: '2026-12-24', stunde: 8,
    }));
    vi.useRealTimers();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ versand: 'geplant', termin: '24.12.2026, 8:00 Uhr' });
    expect(welt.vouchers[0]).toMatchObject({
      versand_status: 'geplant', versand_am: '2026-12-24T07:00:00.000Z', empfaenger_email: 'papa@example.de', empfaenger_hinweis: 'p•••@example.de',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Sofort: verschickt direkt', async () => {
    welt.vouchers.push(gutschein());
    const res = await personalisieren(anfrage({
      code: 'SA-TEST-0001', k: TOKEN, schenkerName: 'Anna', motiv: 'glut', versand: 'mail', empfaengerEmail: 'papa@example.de', zeitpunkt: 'sofort',
    }));
    expect(await res.json()).toMatchObject({ versand: 'versendet' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(welt.vouchers[0].versand_status).toBe('versendet');
  });

  it('ohne Loops-Vorlage kein Mail-Versand (503), selbst weitergeben geht weiter', async () => {
    delete process.env.LOOPS_VOUCHER_GIFT_TEMPLATE_ID;
    welt.vouchers.push(gutschein());
    const mail = await personalisieren(anfrage({
      code: 'SA-TEST-0001', k: TOKEN, schenkerName: 'Anna', motiv: 'glut', versand: 'mail', empfaengerEmail: 'papa@example.de', zeitpunkt: 'sofort',
    }));
    expect(mail.status).toBe(503);
    const selbst = await personalisieren(anfrage({ code: 'SA-TEST-0001', k: TOKEN, motiv: 'danke', versand: 'selbst' }));
    expect(selbst.status).toBe(200);
  });

  it('nach dem Versand ist nichts mehr änderbar (409)', async () => {
    welt.vouchers.push(gutschein({ versand_status: 'versendet' }));
    const res = await personalisieren(anfrage({ code: 'SA-TEST-0001', k: TOKEN, motiv: 'danke', versand: 'selbst' }));
    expect(res.status).toBe(409);
  });

  it('eingelöster Gutschein ist nicht mehr änderbar (409)', async () => {
    welt.vouchers.push(gutschein({ status: 'redeemed' }));
    const res = await personalisieren(anfrage({ code: 'SA-TEST-0001', k: TOKEN, motiv: 'danke', versand: 'selbst' }));
    expect(res.status).toBe(409);
  });
});

describe('POST /api/gutschein/versand', () => {
  const lauf = (auth?: string) =>
    versandLauf(new Request('https://steakakademie.de/api/gutschein/versand', { method: 'POST', headers: auth ? { authorization: auth } : {} }));

  it('ohne Secret in der Umgebung: 503 (nicht geprüft ist nie grün)', async () => {
    delete process.env.GUTSCHEIN_VERSAND_SECRET;
    expect((await lauf('Bearer geheim')).status).toBe(503);
  });
  it('falsches Secret: 401', async () => {
    expect((await lauf('Bearer falsch')).status).toBe(401);
  });
  it('nichts fällig: 200 mit Bericht', async () => {
    const res = await lauf('Bearer geheim');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ faellig: 0, versendet: 0 });
  });
});
