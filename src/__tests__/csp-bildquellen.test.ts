/**
 * Content-Security-Policy: Bildquellen (03.10.2026).
 *
 * Anlass: Die Bilder der Community-Rezepte kommen direkt aus dem Supabase-
 * Storage (`unoptimized`), img-src erlaubte den Host aber nicht — der Browser
 * blockierte jedes dieser Bilder still. Geprüft wird der Header, den
 * next.config.mjs wirklich ausliefert, nicht eine Kopie der Regel.
 *
 * Die beiden Build-Plugins (Contentlayer, Sentry) werden durchgereicht: Sie
 * ändern an `headers()` nichts und sollen im Test weder Dateien lesen noch
 * ins Netz greifen.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-contentlayer2', () => ({ withContentlayer: (config: unknown) => config }));
vi.mock('@sentry/nextjs', () => ({ withSentryConfig: (config: unknown) => config }));

type Regel = { source: string; headers: { key: string; value: string }[] };

/** CSP-Direktiven so, wie next.config.mjs sie mit dieser Supabase-URL baut. */
async function direktiven(supabaseUrl: string): Promise<Record<string, string>> {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl);
  const mod = (await import('../../next.config.mjs')) as unknown as { default: { headers: () => Promise<Regel[]> } };
  const regeln = await mod.default.headers();
  const csp = regeln.find((r) => r.source === '/(.*)')?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
  return Object.fromEntries(csp.split('; ').map((d) => {
    const [name, ...rest] = d.split(' ');
    return [name, rest.join(' ')];
  }));
}

// Bezugswert ist die Richtlinie OHNE Supabase-Variable — aus der Konfiguration
// selbst gelesen, nicht abgetippt. Abgetippte Hosts von Analyse-Diensten in einer
// Testdatei haelt der Legal-Guard fuer einen eingebauten Tracker (03.10.2026).
async function ohneSupabase(): Promise<Record<string, string>> {
  return direktiven('');
}

describe('CSP img-src', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('erlaubt den eigenen Supabase-Storage — genau diesen Host, kein Wildcard', async () => {
    const basis = (await ohneSupabase())['img-src'];
    const d = await direktiven('https://abcdefgh1234.supabase.co');
    expect(d['img-src']).toBe(`${basis} https://abcdefgh1234.supabase.co`);
    expect(d['img-src']).not.toContain('*.supabase.co');
  });

  it('nimmt nur den Ursprung, auch wenn die Variable einen Pfad oder Schrägstrich trägt', async () => {
    const basis = (await ohneSupabase())['img-src'];
    const d = await direktiven('https://abcdefgh1234.supabase.co/rest/v1/');
    expect(d['img-src']).toBe(`${basis} https://abcdefgh1234.supabase.co`);
  });

  it('ohne Variable (Build-Gate ohne Env): nichts dazu, kein Platzhalter', async () => {
    const d = await ohneSupabase();
    expect(d['img-src']).toMatch(/^'self' data: blob: /);
    expect(d['img-src']).not.toContain('supabase');
  });

  it('unbrauchbarer Wert oder kein https: nichts dazu', async () => {
    const basis = (await ohneSupabase())['img-src'];
    expect((await direktiven('keine-adresse'))['img-src']).toBe(basis);
    expect((await direktiven('http://abcdefgh1234.supabase.co'))['img-src']).toBe(basis);
  });

  it('die übrigen Direktiven bleiben, wie sie waren', async () => {
    const basis = await ohneSupabase();
    const d = await direktiven('https://abcdefgh1234.supabase.co');
    expect(d['default-src']).toBe("'self'");
    expect(d['connect-src']).toBe(basis['connect-src']);
    expect(d['frame-src']).toBe('https://challenges.cloudflare.com');
    expect(d['form-action']).toBe("'self'");
  });
});
