import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { urkundeBestellbar, urkundeFehlendeKonfiguration } from '@/lib/urkunde/bestellbar';

/**
 * Waechter (02.10.2026): Die gedruckte Urkunde wird nur angenommen, wenn die
 * Bestaetigung an den Besteller verschickt UND der Druck beauftragt werden
 * kann. Fehlt eine Variable, gibt es keine verbindliche Bestellung.
 */
const NAMEN = ['LOOPS_API_KEY', 'LOOPS_URKUNDE_BESTAETIGUNG_TEMPLATE_ID', 'GELATO_API_KEY'] as const;
const SCHALTER = 'URKUNDE_VERKAUF';

describe('urkundeBestellbar', () => {
  const vorher: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const n of NAMEN) { vorher[n] = process.env[n]; process.env[n] = 'gesetzt'; }
    vorher[SCHALTER] = process.env[SCHALTER]; process.env[SCHALTER] = 'an';
  });
  afterEach(() => {
    for (const n of [...NAMEN, SCHALTER]) {
      if (vorher[n] === undefined) delete process.env[n];
      else process.env[n] = vorher[n];
    }
  });

  it('ist offen, wenn alle drei Variablen gesetzt sind', () => {
    expect(urkundeBestellbar()).toBe(true);
    expect(urkundeFehlendeKonfiguration()).toEqual([]);
  });

  it.each(NAMEN)('ist zu, wenn %s fehlt', (name) => {
    delete process.env[name];
    expect(urkundeBestellbar()).toBe(false);
    expect(urkundeFehlendeKonfiguration()).toEqual([name]);
  });

  it('ist zu ohne Verkaufsschalter (Gewerbe noch nicht angemeldet, 20.10.2026)', () => {
    delete process.env[SCHALTER];
    expect(urkundeBestellbar()).toBe(false);
    process.env[SCHALTER] = 'aus';
    expect(urkundeBestellbar()).toBe(false);
  });

  it('ein leerer Wert zaehlt als fehlend', () => {
    process.env.GELATO_API_KEY = '';
    expect(urkundeBestellbar()).toBe(false);
  });
});
