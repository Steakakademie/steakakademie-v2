import { test, expect, type Page } from '@playwright/test';

/**
 * E2E — DSGVO-Consent-Banner (src/components/analytics/ConsentBanner.tsx)
 *
 * Das Banner ist rechtlich tragend (Opt-in fuer Microsoft Clarity, § 25 Abs. 1
 * TDDDG). Bis 24.09.2026 gab es keinen Test, der es selbst prueft — alle
 * anderen Specs starten mit bereits getroffener Entscheidung (storageState in
 * playwright.config.ts). Dieser Spec hebt das auf und deckt ab:
 *  - Erscheinen ohne Entscheidung, zwei gleichwertige Buttons, keine Vorauswahl
 *  - kein Schliessen ohne Wahl (Escape, Klick daneben)
 *  - Footer bleibt ueber dem Banner erreichbar (KAN-72, § 5 Abs. 1 DDG)
 *  - Ablehnen/Akzeptieren speichern die Wahl, Reload bleibt ohne Banner
 *  - Widerruf ueber „Cookie-Einstellungen" im Footer
 *  - ohne Zustimmung geht keine Anfrage an clarity.ms
 *  - Reduced Motion: Banner steht sofort in Endlage (Animation seit #193)
 *
 * Was dieser Spec NICHT beweisen kann: dass Clarity nach „Alles akzeptieren"
 * tatsaechlich laedt. ClarityScript.tsx laedt nur auf steakakademie.de
 * (Hostname-Gate) — auf localhost bleibt es in beiden Faellen aus. Der
 * Positivfall ist nur auf der Produktion pruefbar.
 */

const URL = '/';
const STORAGE_KEY = 'sa-consent-v1'; // = STORAGE_KEY in src/lib/consent.ts

// Ohne vorab getroffene Entscheidung starten (siehe tests/e2e/helpers/consent.ts).
test.use({ storageState: { cookies: [], origins: [] } });

const banner = (p: Page) => p.getByRole('dialog', { name: 'Datenschutz-Einstellungen' });
const ablehnen = (p: Page) => banner(p).getByRole('button', { name: 'Ablehnen' });
const akzeptieren = (p: Page) => banner(p).getByRole('button', { name: 'Alles akzeptieren' });

const gespeicherteWahl = (p: Page) =>
  p.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as { statistics: boolean }).statistics : null;
  }, STORAGE_KEY);

/** Unterkante des Banners minus Viewport-Hoehe — 0 heisst: sitzt in Endlage. */
async function abstandZumRand(page: Page) {
  const box = await banner(page).boundingBox();
  if (!box) return Number.NaN;
  return Math.round(box.y + box.height) - page.viewportSize()!.height;
}

test.describe('Consent-Banner', () => {
  test('erscheint ohne Entscheidung — zwei gleichwertige Buttons, keine Vorauswahl', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await expect(banner(page)).toBeVisible();
    await expect.poll(() => abstandZumRand(page)).toBe(0);

    // Genau zwei Buttons, kein Haekchen, kein Schliessen-X.
    await expect(banner(page).getByRole('button')).toHaveCount(2);
    await expect(banner(page).getByRole('checkbox')).toHaveCount(0);

    // Gleichwertig heisst: dieselbe Klasse (Farbe) und dieselbe Groesse — kein Nudging.
    const [a, b] = await Promise.all([ablehnen(page), akzeptieren(page)].map(async (btn) => ({
      klasse: await btn.getAttribute('class'),
      box: await btn.boundingBox(),
    })));
    expect(a.klasse).toBe(b.klasse);
    expect(Math.round(a.box!.width)).toBe(Math.round(b.box!.width));
    expect(Math.round(a.box!.height)).toBe(Math.round(b.box!.height));

    await expect(banner(page).getByRole('link', { name: 'Datenschutzerklärung' })).toHaveAttribute('href', '/datenschutz');
    expect(await gespeicherteWahl(page)).toBeNull();
  });

  test('laesst sich nur per Wahl schliessen', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await expect(banner(page)).toBeVisible();

    await page.keyboard.press('Escape');
    // Klick daneben auf etwas, das selbst nichts ausloest (die H1 ist kein Link).
    await page.getByRole('main').getByRole('heading', { level: 1 }).first().click();
    await expect(banner(page)).toBeVisible();
    expect(await gespeicherteWahl(page)).toBeNull();
  });

  test('Footer bleibt ueber dem Banner erreichbar (KAN-72)', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await expect(banner(page)).toBeVisible();

    // Body-Padding entspricht der Bannerhoehe (ResizeObserver im Banner).
    await expect.poll(async () => {
      const hoehe = (await banner(page).boundingBox())?.height ?? 0;
      const padding = await page.evaluate(() => parseFloat(document.body.style.paddingBottom || '0'));
      return Math.abs(padding - hoehe) <= 1;
    }).toBe(true);

    // Ganz nach unten: Der Impressum-Link liegt frei, nicht unter dem Banner.
    const impressum = page.getByRole('contentinfo').getByRole('link', { name: 'Impressum' });
    await impressum.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const box = await impressum.boundingBox();
    expect(box).not.toBeNull();
    const getroffen = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return el?.closest('a')?.getAttribute('href') ?? null;
    }, { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 });
    expect(getroffen).toBe('/impressum');
  });

  test('Ablehnen speichert die Wahl, entfernt das Padding und bleibt nach Reload zu', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await ablehnen(page).click();

    await expect(banner(page)).toHaveCount(0);
    expect(await gespeicherteWahl(page)).toBe(false);
    expect(await page.evaluate(() => document.body.style.paddingBottom)).toBe('');

    await page.reload({ waitUntil: 'load' });
    // Das Banner oeffnet im Effekt nach der Hydration — kurz warten, dann darf es nicht kommen.
    await page.waitForTimeout(1000);
    await expect(banner(page)).toHaveCount(0);
  });

  test('Widerruf: „Cookie-Einstellungen" im Footer oeffnet erneut, Akzeptieren speichert', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await ablehnen(page).click();
    await expect(banner(page)).toHaveCount(0);

    await page.getByRole('contentinfo').getByRole('button', { name: 'Cookie-Einstellungen' }).click();
    await expect(banner(page)).toBeVisible();
    await akzeptieren(page).click();

    await expect(banner(page)).toHaveCount(0);
    expect(await gespeicherteWahl(page)).toBe(true);

    // Und wieder zurueck: der Widerruf muss genauso leicht sein wie die Zustimmung.
    await page.getByRole('contentinfo').getByRole('button', { name: 'Cookie-Einstellungen' }).click();
    await ablehnen(page).click();
    expect(await gespeicherteWahl(page)).toBe(false);
  });

  test('ohne Zustimmung keine Anfrage an clarity.ms', async ({ page }) => {
    const clarity: string[] = [];
    page.on('request', (req) => {
      if (/clarity\.ms/i.test(req.url())) clarity.push(req.url());
    });

    await page.goto(URL, { waitUntil: 'load' });
    await expect(banner(page)).toBeVisible();
    await ablehnen(page).click();
    await page.waitForTimeout(1000);

    expect(clarity).toEqual([]);
    await expect(page.locator('#ms-clarity')).toHaveCount(0);
  });

  test('Reduced Motion: Banner steht sofort in Endlage', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await expect(banner(page)).toBeVisible();
    // Ohne Animation keine Zwischenlage: der erste Messwert ist schon die Endlage.
    expect(await abstandZumRand(page)).toBe(0);

    await ablehnen(page).click();
    await expect(banner(page)).toHaveCount(0);
  });
});
