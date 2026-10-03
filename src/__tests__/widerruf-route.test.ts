/**
 * POST /api/widerruf gegen nachgebildete Dienste (03.10.2026).
 *
 * Anlass: Die Route meldete IMMER `ok: true`. Der Insert in `widerrufe` wurde
 * nie ausgewertet (supabase-js wirft nicht), und der Betreiber erfuhr von
 * keinem Widerruf — die Tabelle liest keine Seite.
 *
 * Echt bleiben: Route, guardRequest, der gemeinsame Versand-Helfer.
 * Ersetzt werden: Supabase (Insert), Loops (fetch) und Sentry.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const welt = vi.hoisted(() => ({
  zeilen: [] as Record<string, unknown>[],
  insertFehler: null as { message: string } | null,
  sentry: [] as { text: string; opts: Record<string, unknown> }[],
  ipSeq: 0,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (name: string) => {
      if (name !== 'widerrufe') throw new Error(`unerwartete Tabelle ${name}`);
      return {
        insert: async (zeile: Record<string, unknown>) => {
          if (welt.insertFehler) return { data: null, error: welt.insertFehler };
          welt.zeilen.push(zeile);
          return { data: null, error: null };
        },
      };
    },
  }),
}));

vi.mock('@sentry/nextjs', () => ({
  captureMessage: (text: string, opts: Record<string, unknown>) => { welt.sentry.push({ text, opts }); },
}));

import { POST } from '@/app/api/widerruf/route';
import { KONTAKT_EMPFAENGER } from '@/lib/kontakt';

type Mail = { transactionalId: string; email: string; dataVariables: Record<string, string> };

/** Loops-Stub: je Vorlage ein Status; merkt sich, was verschickt werden sollte. */
function loops(status: { betreiber?: number; kunde?: number } = {}) {
  const mails: Mail[] = [];
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    const mail = JSON.parse(String(init.body)) as Mail;
    mails.push(mail);
    const code = mail.transactionalId === 'tpl-kontakt' ? status.betreiber ?? 200 : status.kunde ?? 200;
    return new Response(code === 200 ? '{"success":true}' : 'abgelehnt', { status: code });
  }));
  return {
    mails,
    anBetreiber: () => mails.filter((m) => m.transactionalId === 'tpl-kontakt'),
    anKunde: () => mails.filter((m) => m.transactionalId === 'tpl-widerruf'),
  };
}

function anfrage(body: Record<string, unknown>) {
  welt.ipSeq += 1;
  return new Request('https://steakakademie.de/api/widerruf', {
    method: 'POST',
    headers: {
      'content-type': 'application/json', origin: 'https://steakakademie.de', host: 'steakakademie.de',
      'x-real-ip': `10.3.0.${welt.ipSeq}`,
    },
    body: JSON.stringify(body),
  });
}

const WIDERRUF = { email: 'kunde@example.de', orderRef: 'ABCD1234', name: 'Kim Kunde', product: 'Steuer-Matrix', reason: 'Passt nicht.' };

beforeEach(() => {
  welt.zeilen = [];
  welt.insertFehler = null;
  welt.sentry = [];
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  process.env.LOOPS_API_KEY = 'loops-key';
  process.env.LOOPS_KONTAKT_TEMPLATE_ID = 'tpl-kontakt';
  process.env.LOOPS_WIDERRUF_TEMPLATE_ID = 'tpl-widerruf';
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Widerruf: alles in Ordnung', () => {
  it('speichert, meldet dem Betreiber und bestätigt dem Verbraucher', async () => {
    const post = loops();
    const res = await POST(anfrage(WIDERRUF));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, emailSent: true });
    expect(welt.zeilen).toHaveLength(1);
    expect(welt.zeilen[0]).toMatchObject({ email: 'kunde@example.de', order_ref: 'ABCD1234' });

    // Die Meldung geht an das Betreiber-Postfach, nicht an den Verbraucher.
    expect(post.anBetreiber()).toHaveLength(1);
    const meldung = post.anBetreiber()[0];
    expect(meldung.email).toBe(KONTAKT_EMPFAENGER);
    expect(meldung.dataVariables).toMatchObject({
      betreff_tag: '[Widerruf]', Betreff_tag: '[Widerruf]',
      absender: 'kunde@example.de', reply_to: 'kunde@example.de', thema: 'Widerruf', name: 'Kim Kunde',
    });
    expect(meldung.dataVariables.nachricht).toMatch(/Bestell-\/Vertragsnummer: ABCD1234/);
    expect(meldung.dataVariables.nachricht).toMatch(/gespeichert \(Tabelle widerrufe\): ja/);
    expect(meldung.dataVariables.nachricht).toMatch(/Eingangsbestätigung an den Verbraucher: gesendet/);
    expect(meldung.dataVariables.datum).toMatch(/^\d{1,2}\.\d{1,2}\.\d{4}$/);

    expect(post.anKunde()).toHaveLength(1);
    expect(post.anKunde()[0].email).toBe('kunde@example.de');
    expect(welt.sentry).toHaveLength(0);
  });

  it('nur Bestellnummer: Reply-To bleibt beim Betreiber-Postfach, keine Bestätigungsmail', async () => {
    const post = loops();
    const res = await POST(anfrage({ orderRef: 'ABCD1234' }));
    expect(await res.json()).toMatchObject({ ok: true, emailSent: false });
    expect(post.anBetreiber()[0].dataVariables.reply_to).toBe(KONTAKT_EMPFAENGER);
    expect(post.anBetreiber()[0].dataVariables.nachricht).toMatch(/NICHT gesendet — keine E-Mail-Adresse angegeben/);
    expect(post.anKunde()).toHaveLength(0);
  });
});

describe('Widerruf: Speichern scheitert', () => {
  it('Insert-Fehler + Betreiber-Mail ok → ok, und die Mail sagt, dass nichts gespeichert ist', async () => {
    welt.insertFehler = { message: 'permission denied for table widerrufe' };
    const post = loops();
    const res = await POST(anfrage(WIDERRUF));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, emailSent: true });
    expect(welt.zeilen).toHaveLength(0);
    expect(post.anBetreiber()[0].dataVariables.nachricht).toMatch(/NEIN — permission denied for table widerrufe/);
    // Der Fehler steht im Log — vorher hinterliess ein abgelehnter Insert keine Zeile.
    expect((console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls.some((c) => c[0] === '[widerruf] insert failed')).toBe(true);
    // Die Bestätigung an den Verbraucher wird nach der Meldung nachgeholt.
    expect(post.anKunde()).toHaveLength(1);
  });

  it('Insert-Fehler + Betreiber-Mail scheitert → 502 mit dem Weg per E-Mail, keine Bestätigung, Alarm', async () => {
    welt.insertFehler = { message: 'permission denied for table widerrufe' };
    const post = loops({ betreiber: 500 });
    const res = await POST(anfrage(WIDERRUF));
    expect(res.status).toBe(502);
    const daten = await res.json();
    expect(daten.ok).toBeUndefined();
    expect(daten.error).toContain(KONTAKT_EMPFAENGER);
    expect(post.anKunde()).toHaveLength(0);
    expect(welt.sentry).toHaveLength(1);
    expect(welt.sentry[0].text).toMatch(/weder gespeichert noch zugestellt/);
    // Keine personenbezogenen Angaben im Alarm.
    expect(JSON.stringify(welt.sentry[0])).not.toContain('kunde@example.de');
  });

  it('Supabase nicht konfiguriert + keine Kontakt-Vorlage → 502 statt „eingegangen“', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.LOOPS_KONTAKT_TEMPLATE_ID;
    const post = loops();
    const res = await POST(anfrage(WIDERRUF));
    expect(res.status).toBe(502);
    expect(post.mails).toHaveLength(0);
  });
});

describe('Widerruf: Zusatzschritte dürfen ihn nicht kippen', () => {
  it('gespeichert, Betreiber-Mail scheitert → ok, aber Alarm (sonst erfährt es niemand)', async () => {
    loops({ betreiber: 500 });
    const res = await POST(anfrage(WIDERRUF));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(welt.zeilen).toHaveLength(1);
    expect(welt.sentry).toHaveLength(1);
    expect(welt.sentry[0].text).toMatch(/gespeichert, aber Betreiber nicht benachrichtigt/);
  });

  it('Bestätigung an den Verbraucher scheitert → ok mit emailSent:false, Betreiber liest es in der Meldung', async () => {
    const post = loops({ kunde: 500 });
    const res = await POST(anfrage(WIDERRUF));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, emailSent: false });
    expect(post.anBetreiber()[0].dataVariables.nachricht).toMatch(/NICHT gesendet — Loops hat abgelehnt \(HTTP 500\)\. Bitte von Hand bestätigen\./);
  });

  it('weder E-Mail noch Bestellnummer → 400, nichts passiert', async () => {
    const post = loops();
    const res = await POST(anfrage({ name: 'Kim Kunde' }));
    expect(res.status).toBe(400);
    expect(welt.zeilen).toHaveLength(0);
    expect(post.mails).toHaveLength(0);
  });
});
