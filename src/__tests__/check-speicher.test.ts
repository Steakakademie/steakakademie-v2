import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Zaehl- und Ereignislogik des Glutbetts (09.09.2026).
 *
 * WARUM ES DIESEN TEST GIBT: Am Abend des 09.09. sah es im Browser so aus, als
 * zaehle das Glutbett falsch — im Speicher stand ein bestandener Check, das Bett
 * zeigte null. Der Befund war wertlos: Der Dev-Server lief auf einem kaputten
 * `.next` (Produktions-Build und Dev-Server teilen sich den Ordner) und lieferte
 * teils alten Code. Statt die Frage im Browser noch einmal aufzurollen, ist die
 * Logik hier festgenagelt — ein Test lueegt nicht, egal in welchem Zustand die
 * Bau-Umgebung gerade ist.
 *
 * Vitest laeuft hier in `environment: 'node'`, es gibt also weder `window` noch
 * `localStorage`. Beide werden minimal nachgebaut; genau das prueft nebenbei
 * mit, dass die Modul-Funktionen ohne Browser-Globale nicht abstuerzen.
 */

const SCHLUESSEL = 'steakakademie_check';

class SpeicherStub {
  private daten = new Map<string, string>();
  getItem(k: string) { return this.daten.has(k) ? this.daten.get(k)! : null; }
  setItem(k: string, v: string) { this.daten.set(k, v); }
  removeItem(k: string) { this.daten.delete(k); }
  clear() { this.daten.clear(); }
}

function fensterAufbauen() {
  const hoerer = new Map<string, Array<(e: Event) => void>>();
  const fenster = {
    localStorage: new SpeicherStub(),
    addEventListener: (typ: string, fn: (e: Event) => void) => {
      hoerer.set(typ, [...(hoerer.get(typ) ?? []), fn]);
    },
    removeEventListener: () => {},
    dispatchEvent: (e: Event) => {
      for (const fn of hoerer.get(e.type) ?? []) fn(e);
      return true;
    },
  };
  (globalThis as Record<string, unknown>).window = fenster;
  (globalThis as Record<string, unknown>).localStorage = fenster.localStorage;
  return { fenster, hoerer };
}

// Das Modul liest `window` beim Aufruf, nicht beim Laden — es darf trotzdem
// erst NACH dem Aufbau importiert werden, damit nichts zwischengespeichert wird.
let ladeBestandeneChecks: typeof import('@/lib/diplome/check-speicher')['ladeBestandeneChecks'];
let merkeBestandenenCheck: typeof import('@/lib/diplome/check-speicher')['merkeBestandenenCheck'];
let anzahlBestanden: typeof import('@/lib/diplome/check-speicher')['anzahlBestanden'];
let CHECK_EREIGNIS: string;

const STUFE_1 = [
  'grillarten', 'brennstoffkunde', 'sicherheit-brandschutz', 'anzuenden-startroutine',
  'direkte-indirekte-hitze', 'temperaturzonen', 'temperatur-messen', 'salzen',
  'das-erste-steak', 'dry-rubs-marinaden', 'rauch-reinigung-pflege',
];

beforeEach(async () => {
  fensterAufbauen();
  vi.resetModules();
  const mod = await import('@/lib/diplome/check-speicher');
  ladeBestandeneChecks = mod.ladeBestandeneChecks;
  merkeBestandenenCheck = mod.merkeBestandenenCheck;
  anzahlBestanden = mod.anzahlBestanden;
  CHECK_EREIGNIS = mod.CHECK_EREIGNIS;
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).localStorage;
});

describe('check-speicher: zaehlen', () => {
  it('leerer Speicher ergibt null Kohlen', () => {
    expect(ladeBestandeneChecks().size).toBe(0);
    expect(anzahlBestanden(STUFE_1)).toBe(0);
  });

  it('ein gemerkter Check ergibt genau eine Kohle', () => {
    merkeBestandenenCheck('das-erste-steak');
    expect(anzahlBestanden(STUFE_1)).toBe(1);
  });

  it('zaehlt nur Slugs der uebergebenen Stufe', () => {
    merkeBestandenenCheck('das-erste-steak');
    merkeBestandenenCheck('fleischanatomie'); // Stufe 2
    expect(anzahlBestanden(STUFE_1)).toBe(1);
    expect(ladeBestandeneChecks().size).toBe(2);
  });

  it('derselbe Check zweimal zaehlt einmal', () => {
    merkeBestandenenCheck('salzen');
    merkeBestandenenCheck('salzen');
    expect(anzahlBestanden(STUFE_1)).toBe(1);
  });

  it('alle elf ergeben ein volles Bett', () => {
    for (const s of STUFE_1) merkeBestandenenCheck(s);
    expect(anzahlBestanden(STUFE_1)).toBe(STUFE_1.length);
  });
});

describe('check-speicher: Ereignis fuers Glutbett', () => {
  it('meldet nur den ERSTEN Abschluss einer Lektion', () => {
    const gemeldet: string[] = [];
    (globalThis as { window: { addEventListener: (t: string, f: (e: Event) => void) => void } }).window
      .addEventListener(CHECK_EREIGNIS, (e: Event) => {
        gemeldet.push((e as CustomEvent<{ lektionSlug: string }>).detail.lektionSlug);
      });

    merkeBestandenenCheck('temperaturzonen');
    merkeBestandenenCheck('temperaturzonen'); // „Nochmal" — darf nicht erneut zuenden
    merkeBestandenenCheck('salzen');

    expect(gemeldet).toEqual(['temperaturzonen', 'salzen']);
  });
});

describe('check-speicher: kaputte Daten legen nichts lahm', () => {
  it('unlesbarer Inhalt ergibt eine leere Menge statt eines Fehlers', () => {
    (globalThis as { localStorage: SpeicherStub }).localStorage.setItem(SCHLUESSEL, '{kein json');
    expect(() => ladeBestandeneChecks()).not.toThrow();
    expect(anzahlBestanden(STUFE_1)).toBe(0);
  });

  it('fremde Datentypen im Array werden aussortiert', () => {
    (globalThis as { localStorage: SpeicherStub }).localStorage
      .setItem(SCHLUESSEL, JSON.stringify(['salzen', 42, null, { a: 1 }]));
    expect(anzahlBestanden(STUFE_1)).toBe(1);
  });

  it('ohne window (Server) ist die Menge leer statt undefiniert', async () => {
    delete (globalThis as Record<string, unknown>).window;
    vi.resetModules();
    const mod = await import('@/lib/diplome/check-speicher');
    expect(mod.ladeBestandeneChecks().size).toBe(0);
    expect(mod.anzahlBestanden(STUFE_1)).toBe(0);
  });
});
