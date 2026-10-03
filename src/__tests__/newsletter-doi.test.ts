/**
 * Newsletter-Trichter ohne stille Erfolge (03.10.2026).
 *
 * Vier Fehlfunktionen, je mit Test:
 *   1. src/lib/doi.ts fiel ohne NEWSLETTER_DOI_SECRET auf einen festen, im
 *      öffentlichen Repo lesbaren Wert zurück — auch in der Produktion.
 *   2. /api/newsletter meldete ohne LOOPS_API_KEY Erfolg („DEV MODE“).
 *   3. /api/newsletter/confirm leitete immer auf „confirmed“, auch wenn Loops
 *      scheiterte; im 409-Zweig fehlte die userGroup.
 *   4. /api/niche-validator/lead meldete success ohne versendete Mail.
 *
 * Echt bleiben: Routen, guardRequest, Token-Logik. Ersetzt wird nur Loops (fetch).
 */
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createDOIToken, doiSecret, verifyDOIToken } from '@/lib/doi';
import { POST as anmelden } from '@/app/api/newsletter/route';
import { GET as bestaetigen } from '@/app/api/newsletter/confirm/route';
import { POST as lead } from '@/app/api/niche-validator/lead/route';

const SECRET = 'ein-test-secret-mit-mehr-als-32-zeichen';
const OEFFENTLICHER_ALTWERT = 'dev-only-insecure-secret';
let ipSeq = 0;

type Aufruf = { url: string; method: string; body: Record<string, unknown> };

/** Loops-Stub: Antwort je Aufruf (Statuscode oder Fehler), merkt sich die Anfragen. */
function loops(...antworten: (number | Error)[]) {
  const aufrufe: Aufruf[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    aufrufe.push({ url: String(url), method: String(init.method), body: JSON.parse(String(init.body)) });
    const a = antworten.length > 1 ? antworten.shift()! : antworten[0] ?? 200;
    if (a instanceof Error) throw a;
    return new Response(a === 200 ? '{"success":true}' : '{"success":false}', { status: a });
  }));
  return aufrufe;
}

function post(pfad: string, body: Record<string, unknown>) {
  ipSeq += 1;
  return new NextRequest(`https://steakakademie.de${pfad}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json', origin: 'https://steakakademie.de', host: 'steakakademie.de',
      'x-real-ip': `10.4.0.${ipSeq}`,
    },
    body: JSON.stringify(body),
  });
}

const klick = (token?: string) =>
  new NextRequest(`https://steakakademie.de/api/newsletter/confirm${token === undefined ? '' : `?token=${encodeURIComponent(token)}`}`);

/** Ziel der Weiterleitung als Pfad + Query. */
function ziel(res: Response): string {
  const u = new URL(res.headers.get('location') ?? '');
  return u.pathname + u.search;
}

/** Token mit frei wählbarem Schlüssel und Alter — für Fälschung und Ablauf. */
function tokenMit(schluessel: string, payload: Record<string, unknown>): string {
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${p}.${createHmac('sha256', schluessel).update(p).digest('base64url')}`;
}

beforeEach(() => {
  vi.stubEnv('NEWSLETTER_DOI_SECRET', SECRET);
  vi.stubEnv('LOOPS_API_KEY', 'loops-key');
  vi.stubEnv('LOOPS_DOI_TEMPLATE_ID', 'tpl-doi');
  vi.stubEnv('TURNSTILE_SECRET_KEY', '');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('doi: kein Ersatzschlüssel in der Produktion', () => {
  it('mit Schlüssel: Token lässt sich erzeugen und prüfen', () => {
    const token = createDOIToken('A@Example.de', 'footer', 'newsletter', 'v2', '1.2.3.4');
    expect(token).toMatch(/^[\w-]+\.[\w-]+$/);
    expect(verifyDOIToken(token!)).toMatchObject({ email: 'a@example.de', source: 'footer', userGroup: 'newsletter', cv: 'v2', ip: '1.2.3.4' });
  });

  it('Produktion ohne Schlüssel: kein Token, und ein mit dem alten öffentlichen Wert signiertes wird abgelehnt', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEWSLETTER_DOI_SECRET', '');
    expect(doiSecret()).toBeNull();
    expect(createDOIToken('a@example.de')).toBeNull();
    const gefaelscht = tokenMit(OEFFENTLICHER_ALTWERT, { email: 'opfer@example.de', iat: Date.now() });
    expect(verifyDOIToken(gefaelscht)).toBeNull();
  });

  it('Produktion mit Schlüssel: der alte öffentliche Wert öffnet nichts', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const gefaelscht = tokenMit(OEFFENTLICHER_ALTWERT, { email: 'opfer@example.de', iat: Date.now() });
    expect(verifyDOIToken(gefaelscht)).toBeNull();
  });

  it('lokal ohne Schlüssel: Dev-Wert, damit die Entwicklung weiterläuft', () => {
    vi.stubEnv('NEWSLETTER_DOI_SECRET', '');
    const token = createDOIToken('a@example.de');
    expect(token).not.toBeNull();
    expect(verifyDOIToken(token!)?.email).toBe('a@example.de');
  });

  it('abgelaufenes Token (älter als 48 h) → null', () => {
    const alt = tokenMit(SECRET, { email: 'a@example.de', iat: Date.now() - 49 * 60 * 60 * 1000 });
    expect(verifyDOIToken(alt)).toBeNull();
  });
});

describe('POST /api/newsletter', () => {
  it('Produktion ohne LOOPS_API_KEY → 503, kein „Erfolg“', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LOOPS_API_KEY', '');
    const aufrufe = loops(200);
    const res = await anmelden(post('/api/newsletter', { email: 'a@example.de' }));
    expect(res.status).toBe(503);
    expect((await res.json()).success).toBeUndefined();
    expect(aufrufe).toHaveLength(0);
  });

  it('Produktion ohne NEWSLETTER_DOI_SECRET → 503, es geht keine Mail mit fälschbarem Link raus', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEWSLETTER_DOI_SECRET', '');
    const aufrufe = loops(200);
    const res = await anmelden(post('/api/newsletter', { email: 'a@example.de' }));
    expect(res.status).toBe(503);
    expect(aufrufe).toHaveLength(0);
  });

  it('lokal ohne LOOPS_API_KEY → Simulation bleibt (dev:true)', async () => {
    vi.stubEnv('LOOPS_API_KEY', '');
    const res = await anmelden(post('/api/newsletter', { email: 'a@example.de' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, dev: true });
  });

  it('alles gesetzt → Mail mit Bestätigungslink, der die Gruppe der Quelle trägt', async () => {
    const aufrufe = loops(200);
    const res = await anmelden(post('/api/newsletter', { email: 'a@example.de', source: 'vip-warteliste' }));
    expect(res.status).toBe(200);
    expect(aufrufe).toHaveLength(1);
    const confirmUrl = String((aufrufe[0].body.dataVariables as Record<string, string>).confirmUrl);
    const token = new URL(confirmUrl).searchParams.get('token')!;
    expect(verifyDOIToken(token)).toMatchObject({ email: 'a@example.de', userGroup: 'vip_warteliste' });
  });
});

describe('GET /api/newsletter/confirm', () => {
  const token = (gruppe = 'newsletter') => createDOIToken('a@example.de', 'footer', gruppe, undefined, '1.2.3.4')!;

  it('Kontakt angelegt → Erfolgsseite', async () => {
    const aufrufe = loops(200);
    const res = await bestaetigen(klick(token()));
    expect(ziel(res)).toBe('/newsletter/bestaetigt');
    expect(aufrufe).toHaveLength(1);
    expect(aufrufe[0].body).toMatchObject({ email: 'a@example.de', subscribed: true, userGroup: 'newsletter' });
  });

  it('Loops lehnt ab (500) → Fehlerstatus statt „confirmed“', async () => {
    loops(500);
    expect(ziel(await bestaetigen(klick(token())))).toBe('/newsletter/bestaetigt?status=fehler');
  });

  it('Loops nicht erreichbar → Fehlerstatus', async () => {
    loops(new Error('ECONNRESET'));
    expect(ziel(await bestaetigen(klick(token())))).toBe('/newsletter/bestaetigt?status=fehler');
  });

  it('409 (Kontakt existiert): Update trägt die Gruppe der Anmeldung — Bestandskontakt kommt in die VIP-Warteliste', async () => {
    const aufrufe = loops(409, 200);
    const res = await bestaetigen(klick(token('vip_warteliste')));
    expect(ziel(res)).toBe('/newsletter/bestaetigt');
    expect(aufrufe).toHaveLength(2);
    expect(aufrufe[1]).toMatchObject({ method: 'PUT' });
    expect(aufrufe[1].url).toMatch(/\/contacts\/update$/);
    expect(aufrufe[1].body).toMatchObject({ email: 'a@example.de', subscribed: true, userGroup: 'vip_warteliste' });
    expect(aufrufe[1].body.consentVersion).toBeTruthy();
  });

  it('409 mit Standard-Gruppe: Update überschreibt die Gruppe des Bestandskontakts NICHT', async () => {
    const aufrufe = loops(409, 200);
    await bestaetigen(klick(token('newsletter')));
    expect(aufrufe[1].body).not.toHaveProperty('userGroup');
  });

  it('409 und das Update scheitert → Fehlerstatus', async () => {
    loops(409, 500);
    expect(ziel(await bestaetigen(klick(token('vip_warteliste'))))).toBe('/newsletter/bestaetigt?status=fehler');
  });

  it('fehlendes, verfälschtes oder abgelaufenes Token → „ungueltig“, Loops wird nicht gefragt', async () => {
    const aufrufe = loops(200);
    expect(ziel(await bestaetigen(klick()))).toBe('/newsletter/bestaetigt?status=ungueltig');
    expect(ziel(await bestaetigen(klick('kaputt')))).toBe('/newsletter/bestaetigt?status=ungueltig');
    const alt = tokenMit(SECRET, { email: 'a@example.de', iat: Date.now() - 49 * 60 * 60 * 1000 });
    expect(ziel(await bestaetigen(klick(alt)))).toBe('/newsletter/bestaetigt?status=ungueltig');
    expect(aufrufe).toHaveLength(0);
  });

  it('Produktion ohne LOOPS_API_KEY → Fehlerstatus, nicht „bestätigt“', async () => {
    const t = token();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LOOPS_API_KEY', '');
    expect(ziel(await bestaetigen(klick(t)))).toBe('/newsletter/bestaetigt?status=fehler');
  });

  it('Produktion ohne NEWSLETTER_DOI_SECRET → Fehlerstatus (unser Fehler, nicht der des Links)', async () => {
    const t = token();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEWSLETTER_DOI_SECRET', '');
    const aufrufe = loops(200);
    expect(ziel(await bestaetigen(klick(t)))).toBe('/newsletter/bestaetigt?status=fehler');
    expect(aufrufe).toHaveLength(0);
  });
});

describe('POST /api/niche-validator/lead', () => {
  const koerper = { email: 'a@example.de', niche: 'BBQ', verdict: 'Go', consent: true };

  it('Mail versendet → success', async () => {
    const aufrufe = loops(200);
    const res = await lead(post('/api/niche-validator/lead', koerper));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, doi: true });
    expect(aufrufe).toHaveLength(1);
  });

  it('Produktion ohne LOOPS_API_KEY → 503', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LOOPS_API_KEY', '');
    const res = await lead(post('/api/niche-validator/lead', koerper));
    expect(res.status).toBe(503);
    expect((await res.json()).success).toBeUndefined();
  });

  it('Vorlage fehlt → 503, kein success', async () => {
    vi.stubEnv('LOOPS_DOI_TEMPLATE_ID', '');
    const aufrufe = loops(200);
    const res = await lead(post('/api/niche-validator/lead', koerper));
    expect(res.status).toBe(503);
    expect((await res.json()).success).toBeUndefined();
    expect(aufrufe).toHaveLength(0);
  });

  it('Loops lehnt ab oder ist nicht erreichbar → 502, kein success', async () => {
    loops(400);
    const abgelehnt = await lead(post('/api/niche-validator/lead', koerper));
    expect(abgelehnt.status).toBe(502);
    expect((await abgelehnt.json()).success).toBeUndefined();

    loops(new Error('ECONNRESET'));
    expect((await lead(post('/api/niche-validator/lead', koerper))).status).toBe(502);
  });
});
