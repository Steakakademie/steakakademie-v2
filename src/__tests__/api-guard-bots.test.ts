/**
 * Bot-Schutz im zentralen Guard (01.10.2026): Honeypot, Turnstile, Rate-Limit.
 * Laeuft ohne Netz — siteverify wird per fetch-Stub beantwortet.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { botCheck, guardRequest, rateLimitRequest } from '@/lib/api/guard';
import { verifyTurnstile } from '@/lib/api/turnstile';

const HOST = 'https://steakakademie.de';
function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`${HOST}/api/test`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: HOST, host: 'steakakademie.de', ...headers },
    body: JSON.stringify(body),
  });
}

describe('verifyTurnstile', () => {
  const env = process.env;
  beforeEach(() => { process.env = { ...env }; });
  afterEach(() => { process.env = env; vi.restoreAllMocks(); });

  it('ueberspringt ohne Secret (Rollout ohne Variablen bleibt unveraendert)', async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(await verifyTurnstile('egal')).toEqual({ ok: true, skipped: true });
  });

  it('lehnt ohne Token ab, wenn das Secret gesetzt ist', async () => {
    process.env.TURNSTILE_SECRET_KEY = 's';
    expect(await verifyTurnstile('')).toEqual({ ok: false, reason: 'missing-token' });
    expect(await verifyTurnstile(undefined)).toEqual({ ok: false, reason: 'missing-token' });
  });

  it('nimmt success:true an und lehnt success:false ab', async () => {
    process.env.TURNSTILE_SECRET_KEY = 's';
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));
    expect(await verifyTurnstile('tok', '1.2.3.4')).toEqual({ ok: true, skipped: false });
    const sent = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(sent.get('secret')).toBe('s');
    expect(sent.get('response')).toBe('tok');
    expect(sent.get('remoteip')).toBe('1.2.3.4');

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), { status: 200 }));
    expect(await verifyTurnstile('tok')).toEqual({ ok: false, reason: 'rejected' });
  });

  it('fail-open bei Netzfehler (Cloudflare-Ausfall legt kein Formular lahm)', async () => {
    process.env.TURNSTILE_SECRET_KEY = 's';
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNRESET'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await verifyTurnstile('tok')).toEqual({ ok: true, skipped: true });
  });
});

describe('botCheck', () => {
  const rl = { ip: '1.1.1.1', rlHeaders: {} };

  it('befuellter Honeypot → stilles 200 mit ok:true, keine Verarbeitung', async () => {
    const r = await botCheck({ email: 'a@b.de', website: 'http://spam' }, { honeypot: 'website', turnstile: false, ...rl });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response.status).toBe(200);
      expect(await r.response.json()).toEqual({ ok: true });
    }
  });

  it('leerer Honeypot → Body unveraendert durchgereicht', async () => {
    const r = await botCheck({ email: 'a@b.de', website: '' }, { honeypot: 'website', turnstile: false, ...rl });
    expect(r).toEqual({ ok: true, body: { email: 'a@b.de', website: '' } });
  });

  it('turnstile:true entfernt das Token aus dem Body (ohne Secret uebersprungen)', async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const r = await botCheck({ email: 'a@b.de', turnstileToken: 'tok' }, { turnstile: true, ...rl });
    expect(r).toEqual({ ok: true, body: { email: 'a@b.de' } });
  });

  it('turnstile:true mit Secret und ohne Token → 403', async () => {
    process.env.TURNSTILE_SECRET_KEY = 's';
    const r = await botCheck({ email: 'a@b.de' }, { turnstile: true, ...rl });
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(403);
  });
});

describe('guardRequest mit honeypot (vor dem Zod-Schema)', () => {
  const schema = z.object({ email: z.string().email() }).strict();

  it('striktes Schema sieht das Honeypot-Feld nie — Bot bekommt 200, Mensch kommt durch', async () => {
    const bot = await guardRequest(post({ email: 'a@b.de', website: 'x' }), { key: 'hp-test', rate: { limit: 10, windowMs: 60_000 }, schema, honeypot: 'website' });
    expect(bot.ok).toBe(false);
    if (!bot.ok) expect(bot.response.status).toBe(200);

    // Ein leeres Honeypot-Feld bleibt im Body — das strikte Schema lehnt es ab.
    // Routen mit .strict() muessen das Feld im Schema erlauben; die
    // umgestellten Routen (Newsletter, Widerruf, Lead) sind nicht strict.
    const lax = z.object({ email: z.string().email() });
    const mensch = await guardRequest(post({ email: 'a@b.de', website: '' }), { key: 'hp-test2', rate: { limit: 10, windowMs: 60_000 }, schema: lax, honeypot: 'website' });
    expect(mensch.ok).toBe(true);
    if (mensch.ok) expect(mensch.body).toEqual({ email: 'a@b.de' });
  });
});

describe('rateLimitRequest (Formular-Routen)', () => {
  it('zaehlt pro IP und Schluessel, 429 ab Ueberschreitung', () => {
    const req = (ip: string) => new Request(`${HOST}/api/kontakt`, { method: 'POST', headers: { 'x-real-ip': ip } });
    const rule = { limit: 2, windowMs: 60_000 };
    expect(rateLimitRequest(req('9.9.9.9'), 'rl-test', rule).ok).toBe(true);
    expect(rateLimitRequest(req('9.9.9.9'), 'rl-test', rule).ok).toBe(true);
    const dritter = rateLimitRequest(req('9.9.9.9'), 'rl-test', rule);
    expect(dritter.ok).toBe(false);
    if (!dritter.ok) expect(dritter.response.status).toBe(429);
    expect(rateLimitRequest(req('8.8.8.8'), 'rl-test', rule).ok).toBe(true);
  });
});
