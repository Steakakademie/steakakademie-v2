import { describe, it, expect, vi, beforeEach } from 'vitest';

const sentry = vi.hoisted(() => ({ meldungen: [] as { text: string; opts: Record<string, any> }[] }));
vi.mock('@sentry/nextjs', () => ({
  captureMessage: (text: string, opts: Record<string, any>) => { sentry.meldungen.push({ text, opts }); },
}));

import { pruefeGeraet, geraeteZiel, MAX_GERAETE, AUFFAELLIG_AB_ANMELDUNGEN_7D } from '@/lib/auth/geraete-limit';

/** Nachbildung von supabase.rpc('sitzung_zugelassen') — Migration 20261017094922. */
function client(antwort: { data?: unknown; error?: { message: string } | null } | 'wirft') {
  const aufrufe: { fn: string; args: unknown }[] = [];
  return {
    aufrufe,
    rpc: async (fn: string, args: unknown) => {
      aufrufe.push({ fn, args });
      if (antwort === 'wirft') throw new Error('Netzwerk weg');
      return { data: antwort.data ?? null, error: antwort.error ?? null };
    },
  };
}

beforeEach(() => {
  sentry.meldungen = [];
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Geräte-Limit (Entscheidung Uwe 17.10.2026)', () => {
  it('fragt die Datenbank mit dem Limit von zwei Geräten', async () => {
    const c = client({ data: [{ zugelassen: true, sitzungen_7d: 1 }] });
    await pruefeGeraet(c, 'u1');
    expect(MAX_GERAETE).toBe(2);
    expect(c.aufrufe).toEqual([{ fn: 'sitzung_zugelassen', args: { p_max: 2 } }]);
  });

  it('drittes Gerät: nicht zugelassen', async () => {
    expect(await pruefeGeraet(client({ data: [{ zugelassen: false, sitzungen_7d: 3 }] }), 'u1'))
      .toEqual({ zugelassen: false, anmeldungen7d: 3 });
  });

  it('eines der zwei neuesten Geräte: zugelassen', async () => {
    expect((await pruefeGeraet(client({ data: [{ zugelassen: true, sitzungen_7d: 2 }] }), 'u1')).zugelassen).toBe(true);
  });

  it('Störung sperrt niemanden: Fehler, Ausnahme oder fehlende Funktion → zugelassen', async () => {
    expect((await pruefeGeraet(client({ error: { message: 'function sitzung_zugelassen does not exist' } }), 'u1')).zugelassen).toBe(true);
    expect((await pruefeGeraet(client('wirft'), 'u1')).zugelassen).toBe(true);
    expect((await pruefeGeraet({}, 'u1')).zugelassen).toBe(true);
    expect((await pruefeGeraet(null, 'u1')).zugelassen).toBe(true);
  });

  it(`meldet ab ${AUFFAELLIG_AB_ANMELDUNGEN_7D} neuen Anmeldungen in 7 Tagen an Sentry — ein Issue pro Konto, ohne E-Mail`, async () => {
    await pruefeGeraet(client({ data: [{ zugelassen: true, sitzungen_7d: AUFFAELLIG_AB_ANMELDUNGEN_7D - 1 }] }), 'u1');
    expect(sentry.meldungen).toHaveLength(0);
    await pruefeGeraet(client({ data: [{ zugelassen: false, sitzungen_7d: AUFFAELLIG_AB_ANMELDUNGEN_7D }] }), 'u1');
    expect(sentry.meldungen).toHaveLength(1);
    expect(sentry.meldungen[0].opts.fingerprint).toEqual(['geraete-auffaellig', 'u1']);
    expect(JSON.stringify(sentry.meldungen[0].opts)).not.toContain('@');
  });

  it('Weiterleitung nur auf interne Pfade', () => {
    expect(geraeteZiel('/diplome/lernen/stufe-2/x')).toBe('/auth/geraete?redirectTo=%2Fdiplome%2Flernen%2Fstufe-2%2Fx');
    expect(geraeteZiel('//boese.example')).toBe('/auth/geraete?redirectTo=%2Fmeine-kurse');
    expect(geraeteZiel('https://boese.example')).toBe('/auth/geraete?redirectTo=%2Fmeine-kurse');
  });
});
