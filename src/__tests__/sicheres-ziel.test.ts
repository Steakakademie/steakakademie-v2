import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Waechter gegen die offene Weiterleitung nach der Anmeldung (03.10.2026).
 *
 * Anlass: /auth/callback leitete auf `${origin}${next}` weiter, `next` ungeprueft
 * aus der URL. `next=@evil.example` fuehrte auf einen fremden Host. Geprueft wird
 * die Funktion selbst (Tabelle) UND die Route, die sie nutzen muss — eine
 * richtige Funktion, die niemand aufruft, schuetzt nichts.
 */

const welt = vi.hoisted(() => ({
  otpFehler: null as { message: string } | null,
  codeFehler: null as { message: string } | null,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      verifyOtp: async () => ({ error: welt.otpFehler }),
      exchangeCodeForSession: async () => ({ error: welt.codeFehler }),
    },
  }),
}));

import { GET } from '@/app/auth/callback/route';
import { STANDARD_ZIEL, sicheresZiel, sicheresZielUrl } from '@/lib/auth/sicheres-ziel';

const ORIGIN = 'https://steakakademie.de';

const ERLAUBT: [string, string][] = [
  ['/meine-kurse', '/meine-kurse'],
  ['/diplome/profil?x=1', '/diplome/profil?x=1'],
  ['/eigenregie/lernen?a=1&b=2', '/eigenregie/lernen?a=1&b=2'],
  ['/mein-protokoll/fragebogen#start', '/mein-protokoll/fragebogen#start'],
  ['/steuer-matrix/rechner', '/steuer-matrix/rechner'],
  ['/', '/'],
  // Ein fremder Host IM Pfad oder in der Query ist kein fremdes Ziel.
  ['/@evil.example', '/@evil.example'],
  ['/suche?q=https://evil.example', '/suche?q=https://evil.example'],
];

const ABGEWIESEN: [string, string | null | undefined][] = [
  ['protokoll-relativ', '//evil.example'],
  ['drei Schraegstriche', '///evil.example'],
  ['Backslash nach Schraegstrich', '/\\evil'],
  ['Backslash nach Schraegstrich, Host', '/\\evil.example'],
  ['zwei Backslashes', '\\\\evil.example'],
  ['Backslash tiefer im Pfad', '/a\\b'],
  ['@ — eigener Host wird Benutzername', '@evil.example'],
  ['. — haengt sich als Domain-Endung an', '.evil.example'],
  ['absolute URL https', 'https://evil.example'],
  ['absolute URL http', 'http://evil.example/meine-kurse'],
  ['javascript:', 'javascript:alert(1)'],
  ['data:', 'data:text/html,<script>alert(1)</script>'],
  ['ohne fuehrenden Schraegstrich', 'evil.example'],
  ['kodierter Doppel-Schraegstrich ohne fuehrenden', '%2F%2Fevil.example'],
  ['Leerzeichen davor', ' /meine-kurse'],
  ['Tab — Parser streicht ihn, es bleibt //', '/\t/evil.example'],
  ['Zeilenumbruch', '/\n/evil.example'],
  ['Wagenruecklauf', '/\r/evil.example'],
  ['Nullbyte', '/foo\u0000bar'],
  ['Punkt-Segment ergibt //', '/..//evil.example'],
  ['Punkt-Segment ergibt // (einfach)', '/.//evil.example'],
  ['Punkt-Segment nach Pfad', '/a/..//evil.example'],
  ['kodiertes Punkt-Segment', '/%2e%2e//evil.example'],
  ['leer', ''],
  ['null', null],
  ['undefined', undefined],
];

describe('sicheresZiel — nur interne Pfade', () => {
  it.each(ERLAUBT)('laesst %s durch', (eingabe, erwartet) => {
    expect(sicheresZiel(eingabe, ORIGIN)).toBe(erwartet);
    expect(sicheresZielUrl(eingabe, ORIGIN).href).toBe(`${ORIGIN}${erwartet}`);
  });

  it.each(ABGEWIESEN)('weist ab: %s', (_name, eingabe) => {
    expect(sicheresZiel(eingabe, ORIGIN)).toBe(STANDARD_ZIEL);
    expect(sicheresZielUrl(eingabe, ORIGIN).href).toBe(`${ORIGIN}${STANDARD_ZIEL}`);
  });

  it('das Ergebnis bleibt immer beim eigenen Origin und ist selbst ein gueltiges Ziel', () => {
    const alle = [...ERLAUBT.map(([e]) => e), ...ABGEWIESEN.map(([, e]) => e)];
    for (const eingabe of alle) {
      const pfad = sicheresZiel(eingabe, ORIGIN);
      // So liest der Browser die Zeichenkette in window.location.href:
      expect(new URL(pfad, ORIGIN).origin, String(eingabe)).toBe(ORIGIN);
      expect(pfad.startsWith('/') && !pfad.startsWith('//'), String(eingabe)).toBe(true);
      expect(sicheresZiel(pfad, ORIGIN), String(eingabe)).toBe(pfad);
    }
  });

  it('funktioniert ohne Origin (Client-Bauteil beim Server-Rendering)', () => {
    expect(sicheresZiel('/meine-kurse')).toBe('/meine-kurse');
    expect(sicheresZiel('//evil.example')).toBe(STANDARD_ZIEL);
    expect(sicheresZiel(null)).toBe(STANDARD_ZIEL);
  });

  it('gilt fuer jeden Origin — Preview und localhost', () => {
    const preview = 'https://steakakademie-git-fix-x.vercel.app';
    expect(sicheresZielUrl('/meine-kurse', preview).href).toBe(`${preview}/meine-kurse`);
    expect(sicheresZielUrl('@evil.example', preview).href).toBe(`${preview}${STANDARD_ZIEL}`);
    expect(sicheresZielUrl('/mein-system', 'http://localhost:3000').href).toBe('http://localhost:3000/mein-system');
  });

  it('nimmt ein eigenes Standardziel', () => {
    expect(sicheresZiel('//evil.example', ORIGIN, '/mein-system')).toBe('/mein-system');
  });
});

describe('GET /auth/callback — leitet nur intern weiter', () => {
  beforeEach(() => { welt.otpFehler = null; welt.codeFehler = null; });

  const aufruf = (query: string) => GET(new Request(`${ORIGIN}/auth/callback?${query}`));
  const ziel = (res: Response) => res.headers.get('location');

  it('Magic Link: internes Ziel wird uebernommen', async () => {
    const res = await aufruf(`token_hash=abc&type=magiclink&next=${encodeURIComponent('/steuer-matrix/rechner')}`);
    expect(res.status).toBe(307);
    expect(ziel(res)).toBe(`${ORIGIN}/steuer-matrix/rechner`);
  });

  it('Magic Link: Ziel mit Query bleibt erhalten', async () => {
    const res = await aufruf(`token_hash=abc&type=magiclink&next=${encodeURIComponent('/diplome/profil?x=1')}`);
    expect(ziel(res)).toBe(`${ORIGIN}/diplome/profil?x=1`);
  });

  it('ohne next: Standardziel', async () => {
    expect(ziel(await aufruf('code=abc'))).toBe(`${ORIGIN}${STANDARD_ZIEL}`);
  });

  // Die Faelle aus der Inventur — vor dem Fix fuehrte jeder auf einen fremden Host.
  it.each([
    '@evil.example',
    '.evil.example',
    '//evil.example',
    '/\\evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    '/..//evil.example',
    '',
  ])('fremdes Ziel %j → Standardziel (OTP und PKCE)', async (next) => {
    for (const query of [`token_hash=abc&type=magiclink`, `code=abc`]) {
      const res = await aufruf(`${query}&next=${encodeURIComponent(next)}`);
      const location = ziel(res)!;
      expect(new URL(location).host).toBe('steakakademie.de');
      expect(location).toBe(`${ORIGIN}${STANDARD_ZIEL}`);
    }
  });

  it('Fehler der Anmeldung fuehrt weiter zur Login-Seite, nicht zum Ziel', async () => {
    welt.codeFehler = { message: 'abgelaufen' };
    const res = await aufruf(`code=abc&next=${encodeURIComponent('/meine-kurse')}`);
    expect(ziel(res)).toBe(`${ORIGIN}/auth/login?error=abgelaufen`);
  });
});
