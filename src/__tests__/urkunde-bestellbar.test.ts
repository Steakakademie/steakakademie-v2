import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { urkundeBestellbar, urkundeFehlendeKonfiguration } from '@/lib/urkunde/bestellbar';

/**
 * Waechter (02.10.2026): Die gedruckte Urkunde wird nur angenommen, wenn die
 * Bestaetigung an den Besteller verschickt UND der Druck beauftragt werden
 * kann. Fehlt eine Variable, gibt es keine verbindliche Bestellung.
 */
const NAMEN = ['LOOPS_API_KEY', 'LOOPS_URKUNDE_BESTAETIGUNG_TEMPLATE_ID', 'GELATO_API_KEY'] as const;

describe('urkundeBestellbar', () => {
  const vorher: Record<string, string | undefined> = {};
  beforeEach(() => { for (const n of NAMEN) { vorher[n] = process.env[n]; process.env[n] = 'gesetzt'; } });
  afterEach(() => {
    for (const n of NAMEN) {
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

  it('ein leerer Wert zaehlt als fehlend', () => {
    process.env.GELATO_API_KEY = '';
    expect(urkundeBestellbar()).toBe(false);
  });
});
