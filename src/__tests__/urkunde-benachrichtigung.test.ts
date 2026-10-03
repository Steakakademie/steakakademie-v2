/**
 * Urkunden-Benachrichtigung an das Betreiber-Postfach (03.10.2026).
 *
 * meldeBestellung() nutzt seit heute den gemeinsamen Helfer
 * src/lib/betreiber-mail.ts statt einer eigenen Kopie des Loops-Aufrufs. Für
 * den Empfänger darf sich dabei nichts ändern: dieselbe Vorlage, dasselbe
 * Postfach, dieselben Variablen in beiden Schreibweisen. Dieser Test hält die
 * Nutzlast fest — er war vor dem Umzug grün und ist es danach.
 *
 * Ersetzt wird nur Loops (fetch).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { meldeBestellung } from '@/lib/urkunde/benachrichtigung';
import { KONTAKT_EMPFAENGER } from '@/lib/kontakt';

type Mail = { transactionalId: string; email: string; dataVariables: Record<string, string> };

function loops(antwort: number | Error = 200) {
  const aufrufe: { url: string; auth: string; mail: Mail }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    aufrufe.push({
      url: String(url),
      auth: String((init.headers as Record<string, string>).Authorization),
      mail: JSON.parse(String(init.body)) as Mail,
    });
    if (antwort instanceof Error) throw antwort;
    return new Response(antwort === 200 ? '{"success":true}' : 'abgelehnt', { status: antwort });
  }));
  return aufrufe;
}

beforeEach(() => {
  vi.stubEnv('LOOPS_API_KEY', 'loops-key');
  vi.stubEnv('LOOPS_KONTAKT_TEMPLATE_ID', 'tpl-kontakt');
  vi.useFakeTimers();
  // 03.10.2026, 14:05 Uhr in Berlin (Sommerzeit, UTC+2)
  vi.setSystemTime(new Date('2026-10-03T12:05:00Z'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('meldeBestellung', () => {
  it('schickt genau eine Mail über die Kontakt-Vorlage an das Betreiber-Postfach', async () => {
    const aufrufe = loops();
    expect(await meldeBestellung('Neue Bestellung …', 'kim@example.de')).toBe(true);
    expect(aufrufe).toHaveLength(1);
    expect(aufrufe[0].url).toBe('https://app.loops.so/api/v1/transactional');
    expect(aufrufe[0].auth).toBe('Bearer loops-key');
    expect(aufrufe[0].mail.transactionalId).toBe('tpl-kontakt');
    expect(aufrufe[0].mail.email).toBe(KONTAKT_EMPFAENGER);
  });

  it('die Variablen sind dieselben wie vor dem Umzug in den Helfer — in beiden Schreibweisen', async () => {
    const aufrufe = loops();
    await meldeBestellung('Neue Bestellung …', 'kim@example.de');
    expect(aufrufe[0].mail.dataVariables).toEqual({
      betreff_tag: '[Urkunde]', Betreff_tag: '[Urkunde]',
      name: 'Urkunden-Bestellung', Name: 'Urkunden-Bestellung',
      absender: 'kim@example.de', Absender: 'kim@example.de',
      reply_to: 'kim@example.de', Reply_to: 'kim@example.de',
      nachricht: 'Neue Bestellung …', Nachricht: 'Neue Bestellung …',
      thema: 'Gedruckte Urkunde', Thema: 'Gedruckte Urkunde',
      datum: '3.10.2026', Datum: '3.10.2026',
      zeit: '14:05', Zeit: '14:05',
    });
  });

  it('Loops lehnt ab → false, die Bestellung bleibt Sache des Aufrufers', async () => {
    loops(500);
    expect(await meldeBestellung('x', 'kim@example.de')).toBe(false);
  });

  it('Loops nicht erreichbar → false, kein Wurf', async () => {
    loops(new Error('ECONNRESET'));
    await expect(meldeBestellung('x', 'kim@example.de')).resolves.toBe(false);
  });

  it.each(['LOOPS_API_KEY', 'LOOPS_KONTAKT_TEMPLATE_ID'])('ohne %s geht nichts raus → false, mit Warnung', async (name) => {
    vi.stubEnv(name, '');
    const aufrufe = loops();
    expect(await meldeBestellung('x', 'kim@example.de')).toBe(false);
    expect(aufrufe).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Bestellung nur gespeichert'));
  });
});
