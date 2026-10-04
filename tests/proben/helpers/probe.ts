import { test as base, expect, type BrowserContext, type Page, type Response } from '@playwright/test';

/**
 * Funktionsproben gegen die Live-Seite — gemeinsame Grundlage
 * ===========================================================
 * Anders als tests/e2e (läuft gegen einen frischen Build ohne Env) prüfen die
 * Proben die PRODUKTION, so wie ein Besucher sie sieht. Drei Dinge gelten
 * deshalb für jede Probe und stehen hier an einer Stelle:
 *
 * 1. Consent-Banner ist vorab entschieden (abgelehnt). Es liegt `fixed` unten
 *    und fängt sonst Klicks ab — ein Timeout dort wäre eine Überdeckung, keine
 *    Regression (CLAUDE.md Abschnitt A). tests/e2e löst das über storageState;
 *    der hängt aber am Origin localhost:3000. Hier setzt ein Init-Skript den
 *    Schlüssel für jedes Origin (derselbe wie STORAGE_KEY in src/lib/consent.ts).
 *
 * 2. Die Proben verfälschen keine Statistik. Alle Mess-Aufrufe der Seite
 *    werden im Browser abgefangen und nie gesendet: Plausible, Clarity, die
 *    eigenen Endpunkte /api/web-vitals und /api/js-errors. Abgefangen heißt
 *    beantwortet (leeres Skript bzw. 204), nicht abgebrochen — ein
 *    abgebrochener Aufruf sähe für die Seite wie ein Netzfehler aus.
 *    NICHT abfangbar sind Zählungen, die der Server selbst auslöst: /go/… und
 *    /go-fleisch/… melden den Klick serverseitig an Plausible. Deshalb folgt
 *    keine Probe einem Partnerlink.
 *
 * 3. Ein unbehandelter Fehler im Seitenskript lässt die Probe scheitern —
 *    genau die Sorte „still kaputt", für die es die Proben gibt.
 */

const CONSENT_KEY = 'sa-consent-v1';

/** Mess- und Analyse-Aufrufe, die keine Probe auslösen darf. */
export const MESS_AUFRUFE: RegExp[] = [
  /^https:\/\/([a-z0-9-]+\.)?plausible\.io\//,
  /^https:\/\/([a-z0-9-]+\.)?clarity\.ms\//,
  /\/api\/web-vitals(\?|$)/,
  /\/api\/js-errors(\?|$)/,
];

export function istMessAufruf(url: string): boolean {
  return MESS_AUFRUFE.some((muster) => muster.test(url));
}

/** Consent vorab entscheiden und Mess-Aufrufe abfangen — für jeden Kontext einer Probe. */
export async function richteKontextEin(context: BrowserContext): Promise<void> {
  await context.addInitScript((key) => {
    try {
      window.localStorage.setItem(key, JSON.stringify({ statistics: false, ts: 0 }));
    } catch {
      /* localStorage gesperrt → Banner erscheint; die Proben klicken nicht in den unteren Rand */
    }
  }, CONSENT_KEY);

  await context.route((url) => istMessAufruf(url.toString()), async (route) => {
    if (route.request().resourceType() === 'script') {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* Funktionsprobe: Messung abgefangen */' });
      return;
    }
    await route.fulfill({ status: 204, body: '' });
  });
}

/** Sammelt unbehandelte Fehler im Seitenskript. */
export function sammleSeitenfehler(page: Page): string[] {
  const fehler: string[] = [];
  page.on('pageerror', (e) => fehler.push(e.message.slice(0, 300)));
  return fehler;
}

export const test = base.extend<{ seitenfehler: string[] }>({
  context: async ({ context }, use) => {
    await richteKontextEin(context);
    await use(context);
  },
  seitenfehler: [
    async ({ page }, use) => {
      const fehler = sammleSeitenfehler(page);
      await use(fehler);
      expect(fehler, 'Unbehandelte Fehler im Seitenskript').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/**
 * Seite öffnen und prüfen, dass das Dokument selbst mit 200 kommt.
 * `domcontentloaded`, nie `networkidle`: seit Next 16 hängen Tests daran
 * (siehe .github/workflows/e2e.yml, Kopfkommentar).
 */
export async function oeffne(page: Page, pfad: string): Promise<Response> {
  const antwort = await page.goto(pfad, { waitUntil: 'domcontentloaded' });
  expect(antwort, `keine Antwort für ${pfad}`).not.toBeNull();
  expect(antwort!.status(), `${pfad} antwortet mit HTTP ${antwort!.status()}`).toBe(200);
  return antwort!;
}

/** Die Überschrift der Seite ist da und passt zum erwarteten Thema. */
export async function erwarteH1(page: Page, muster: RegExp): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(muster);
}
