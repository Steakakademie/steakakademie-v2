/**
 * Relaunch-Formular → POST /api/newsletter mit scharfem Turnstile (03.10.2026).
 *
 * Anlass: src/components/relaunch/SpickzettelForm.tsx schickte kein
 * `turnstileToken`. Mit gesetztem TURNSTILE_SECRET_KEY antwortete die Route
 * jeder Anmeldung über dieses Formular mit 403. Der Body kommt jetzt aus
 * anmeldungKoerper(); hier steht der Vertrag mit der Route.
 *
 * Echt bleiben: Route, guardRequest, botCheck/verifyTurnstile, Token-Logik.
 * Ersetzt werden: Cloudflare siteverify und Loops (fetch).
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/newsletter/route';
import { anmeldungKoerper } from '@/lib/newsletter-anmeldung';
import { NEWSLETTER_CONSENT_VERSION } from '@/lib/newsletter-consent';

let ipSeq = 0;

/** Cloudflare lässt nur das Token „gut“ durch; alles andere geht an Loops. */
function dienste() {
  const geprueft: string[] = [];
  const mails: Record<string, unknown>[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    if (String(url).includes('challenges.cloudflare.com')) {
      const token = (init.body as URLSearchParams).get('response') ?? '';
      geprueft.push(token);
      return new Response(JSON.stringify({ success: token === 'gut' }), { status: 200 });
    }
    mails.push(JSON.parse(String(init.body)) as Record<string, unknown>);
    return new Response('{"success":true}', { status: 200 });
  }));
  return { geprueft, mails };
}

function anfrage(body: Record<string, unknown>) {
  ipSeq += 1;
  return new NextRequest('https://steakakademie.de/api/newsletter', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://steakakademie.de',
      'x-real-ip': `10.7.0.${ipSeq}`,
    },
    body: JSON.stringify(body),
  });
}

const EINGABE = { email: '  Kim@Example.de ', source: 'footer-relaunch', website: '' };

beforeEach(() => {
  vi.stubEnv('LOOPS_API_KEY', 'loops-key');
  vi.stubEnv('LOOPS_DOI_TEMPLATE_ID', 'tpl-doi');
  vi.stubEnv('NEWSLETTER_DOI_SECRET', 'ein-test-secret-mit-mehr-als-32-zeichen');
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('anmeldungKoerper()', () => {
  it('trägt alle Felder, die /api/newsletter erwartet — samt Token und Einwilligungsfassung', () => {
    expect(anmeldungKoerper({ ...EINGABE, turnstileToken: 'gut' })).toEqual({
      email: 'Kim@Example.de',
      source: 'footer-relaunch',
      website: '',
      consentVersion: NEWSLETTER_CONSENT_VERSION,
      turnstileToken: 'gut',
    });
  });
});

describe('Relaunch-Formular → /api/newsletter mit scharfem Turnstile', () => {
  it('der Body aus anmeldungKoerper() kommt durch und löst die Bestätigungs-Mail aus', async () => {
    const { geprueft, mails } = dienste();
    const res = await POST(anfrage(anmeldungKoerper({ ...EINGABE, turnstileToken: 'gut' })));
    expect(res.status).toBe(200);
    expect(geprueft).toEqual(['gut']);
    expect(mails).toHaveLength(1);
    expect(mails[0]).toMatchObject({ transactionalId: 'tpl-doi', email: 'kim@example.de' });
  });

  it('der Body, wie ihn das Formular bis 03.10.2026 schickte (ohne Token) → 403, keine Mail', async () => {
    const { mails } = dienste();
    const res = await POST(anfrage({
      email: 'kim@example.de',
      source: 'footer-relaunch',
      website: '',
      consentVersion: NEWSLETTER_CONSENT_VERSION,
    }));
    expect(res.status).toBe(403);
    expect(mails).toHaveLength(0);
  });

  it('ein von Cloudflare abgelehntes Token → 403, keine Mail', async () => {
    const { mails } = dienste();
    const res = await POST(anfrage(anmeldungKoerper({ ...EINGABE, turnstileToken: 'verbraucht' })));
    expect(res.status).toBe(403);
    expect(mails).toHaveLength(0);
  });

  it('ohne Secret prüft der Server nicht — ein leeres Token kommt durch', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    const { geprueft, mails } = dienste();
    const res = await POST(anfrage(anmeldungKoerper({ ...EINGABE, turnstileToken: '' })));
    expect(res.status).toBe(200);
    expect(geprueft).toEqual([]);
    expect(mails).toHaveLength(1);
  });
});

describe('SpickzettelForm.tsx — das Formular nutzt den geprüften Body', () => {
  // Die Komponente selbst läuft in dieser Umgebung nicht (kein DOM). Geprüft
  // wird deshalb am Quelltext, dass sie den Body aus anmeldungKoerper() nimmt
  // und das Widget rendert — sonst wäre der Vertragstest oben ohne Anschluss.
  const quelle = readFileSync(new URL('../components/relaunch/SpickzettelForm.tsx', import.meta.url), 'utf-8');

  it('baut den Body über anmeldungKoerper() mit turnstileToken', () => {
    expect(quelle).toMatch(/JSON\.stringify\(anmeldungKoerper\(\{[^}]*turnstileToken[^}]*\}\)\)/);
  });

  it('rendert das Turnstile-Widget und wartet mit dem Knopf auf das Token', () => {
    expect(quelle).toMatch(/<Turnstile\s[^>]*onToken=\{setTurnstileToken\}/);
    expect(quelle).toContain('wartetAufCaptcha');
  });
});
