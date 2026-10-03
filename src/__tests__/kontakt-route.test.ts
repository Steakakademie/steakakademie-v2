/**
 * POST /api/kontakt gegen nachgebildete Dienste (03.10.2026).
 *
 * Zwei Anlässe:
 *   1. Die Projekt-Anamnese (tuwasduwillst.de) schickte kein Turnstile-Token —
 *      mit gesetztem TURNSTILE_SECRET_KEY endete jede Anfrage mit 403. Der Body
 *      kommt jetzt aus anfrageKoerper(); hier steht der Vertrag mit der Route.
 *   2. Der Versand an das Betreiber-Postfach ist nach src/lib/betreiber-mail.ts
 *      gezogen (auch /api/widerruf nutzt ihn). Am Verhalten von /api/kontakt
 *      darf sich dabei nichts geändert haben.
 *
 * Echt bleiben: Route, botCheck/verifyTurnstile, Versand-Helfer.
 * Ersetzt werden: Supabase, Cloudflare siteverify und Loops (fetch).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const welt = vi.hoisted(() => ({
  zeilen: [] as Record<string, unknown>[],
  insertFehler: null as { message: string } | null,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (name: string) => {
      if (name !== 'kontaktanfragen') throw new Error(`unerwartete Tabelle ${name}`);
      return {
        insert: (zeile: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              if (welt.insertFehler) return { data: null, error: welt.insertFehler };
              const gespeichert = { id: `anfrage-${welt.zeilen.length + 1}`, mail_sent: false, ...zeile };
              welt.zeilen.push(gespeichert);
              return { data: { id: gespeichert.id }, error: null };
            },
          }),
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: async (_spalte: string, id: string) => {
            welt.zeilen.filter((z) => z.id === id).forEach((z) => Object.assign(z, patch));
            return { error: null };
          },
        }),
      };
    },
  }),
}));

import { POST } from '@/app/api/kontakt/route';
import { anfrageKoerper } from '@/lib/baukasten/anfrage';
import { KONTAKT_EMPFAENGER } from '@/lib/kontakt';

type Mail = { transactionalId: string; email: string; dataVariables: Record<string, string> };
let ipSeq = 0;

/** Cloudflare lässt nur das Token „gut“ durch; Loops antwortet mit `loopsStatus`. */
function dienste(loopsStatus = 200) {
  const mails: Mail[] = [];
  const geprueft: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    if (String(url).includes('challenges.cloudflare.com')) {
      const token = (init.body as URLSearchParams).get('response') ?? '';
      geprueft.push(token);
      return new Response(JSON.stringify({ success: token === 'gut' }), { status: 200 });
    }
    mails.push(JSON.parse(String(init.body)) as Mail);
    return new Response(loopsStatus === 200 ? '{"success":true}' : 'abgelehnt', { status: loopsStatus });
  }));
  return { mails, geprueft };
}

function anfrage(body: Record<string, unknown>) {
  ipSeq += 1;
  return new Request('https://tuwasduwillst.de/api/kontakt', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': `10.5.0.${ipSeq}` },
    body: JSON.stringify(body),
  });
}

const EINGABE = { name: 'Maler Müller', email: 'mueller@example.de', message: 'Betrieb: Maler Müller\nWunsch: Angebot zum Festpreis\n\nProjektakte …', consent: true, website: '' };

beforeEach(() => {
  welt.zeilen = [];
  welt.insertFehler = null;
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role');
  vi.stubEnv('LOOPS_API_KEY', 'loops-key');
  vi.stubEnv('LOOPS_KONTAKT_TEMPLATE_ID', 'tpl-kontakt');
  vi.stubEnv('TURNSTILE_SECRET_KEY', '');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Projekt-Anamnese → /api/kontakt mit scharfem Turnstile', () => {
  beforeEach(() => { vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret'); });

  it('der Body aus anfrageKoerper() trägt das Token und kommt durch', async () => {
    const { mails, geprueft } = dienste();
    const res = await POST(anfrage(anfrageKoerper({ ...EINGABE, turnstileToken: 'gut' })));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(geprueft).toEqual(['gut']);
    expect(welt.zeilen[0]).toMatchObject({ subject: 'baukasten', betreff_tag: '[Baukasten]', mail_sent: true });
    expect(mails[0].dataVariables.betreff_tag).toBe('[Baukasten]');
  });

  it('ohne Token antwortet die Route mit 403 — so sah jede Anfrage vor dem Fix aus', async () => {
    const { mails } = dienste();
    const { turnstileToken: _weg, ...ohneToken } = anfrageKoerper({ ...EINGABE, turnstileToken: 'gut' });
    const res = await POST(anfrage(ohneToken));
    expect(res.status).toBe(403);
    expect(welt.zeilen).toHaveLength(0);
    expect(mails).toHaveLength(0);
  });

  it('ein von Cloudflare abgelehntes Token → 403', async () => {
    dienste();
    const res = await POST(anfrage(anfrageKoerper({ ...EINGABE, turnstileToken: 'verbraucht' })));
    expect(res.status).toBe(403);
  });
});

describe('/api/kontakt: Versand an das Betreiber-Postfach (unverändert nach dem Umzug in den Helfer)', () => {
  const NACHRICHT = { name: 'Kim', email: 'Kim@Example.de', subject: 'presse', message: 'Hallo', consent: true };

  it('schickt genau die Variablen der Kontakt-Vorlage, in beiden Schreibweisen, an pitmaster@', async () => {
    const { mails } = dienste();
    const res = await POST(anfrage(NACHRICHT));
    expect(await res.json()).toMatchObject({ ok: true, mailSent: true });
    expect(mails).toHaveLength(1);
    expect(mails[0].transactionalId).toBe('tpl-kontakt');
    expect(mails[0].email).toBe(KONTAKT_EMPFAENGER);
    const v = mails[0].dataVariables;
    expect(Object.keys(v).sort()).toEqual([
      'Absender', 'Betreff_tag', 'Datum', 'Nachricht', 'Name', 'Reply_to', 'Thema', 'Zeit',
      'absender', 'betreff_tag', 'datum', 'nachricht', 'name', 'reply_to', 'thema', 'zeit',
    ]);
    expect(v).toMatchObject({
      betreff_tag: '[Presse]', Betreff_tag: '[Presse]', name: 'Kim', Name: 'Kim',
      absender: 'kim@example.de', reply_to: 'kim@example.de', Reply_to: 'kim@example.de',
      nachricht: 'Hallo', thema: 'presse',
    });
    expect(v.datum).toMatch(/^\d{1,2}\.\d{1,2}\.\d{4}$/);
    expect(v.zeit).toMatch(/^\d{2}:\d{2}$/);
  });

  it('ohne Betreff steht im Thema ein Gedankenstrich', async () => {
    const { mails } = dienste();
    await POST(anfrage({ ...NACHRICHT, subject: '' }));
    expect(mails[0].dataVariables).toMatchObject({ thema: '—', betreff_tag: '[Allgemein]' });
  });

  it('Loops lehnt ab → gespeichert reicht: ok mit mailSent:false', async () => {
    dienste(500);
    const res = await POST(anfrage(NACHRICHT));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, mailSent: false });
    expect(welt.zeilen[0]).toMatchObject({ mail_sent: false });
  });

  it('Vorlage fehlt → gespeichert, keine Mail, ok', async () => {
    vi.stubEnv('LOOPS_KONTAKT_TEMPLATE_ID', '');
    const { mails } = dienste();
    const res = await POST(anfrage(NACHRICHT));
    expect(await res.json()).toMatchObject({ ok: true, mailSent: false });
    expect(mails).toHaveLength(0);
  });

  it('weder gespeichert noch zugestellt → 502 mit der Adresse des Postfachs', async () => {
    welt.insertFehler = { message: 'permission denied' };
    dienste(500);
    const res = await POST(anfrage(NACHRICHT));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain(KONTAKT_EMPFAENGER);
  });
});
