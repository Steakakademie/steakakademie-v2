import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Response } from '@playwright/test';
import { test, expect, oeffne, erwarteH1 } from './helpers/probe';

/**
 * Angemeldete Funktionsproben — nur mit einem gekennzeichneten Testkonto.
 * ======================================================================
 * Laufen nur, wenn PROBE_EMAIL und PROBE_PASSWORD gesetzt sind (im Workflow
 * als Secrets). Ohne die beiden sind alle Proben dieser Datei ausgesetzt und
 * das Job-Summary sagt „nicht eingerichtet".
 *
 * Was das Testkonto tut — und was nie:
 *  - anmelden über das Passwort-Formular (/auth/login)
 *  - /meine-kurse und das Profil laden
 *  - im Aroma-Matcher EINEN Cut abfragen. Bevorzugt einen, den das Konto schon
 *    analysiert hat (Wiederholung ist kostenlos) — das Freikontingent sinkt so
 *    höchstens beim allerersten Lauf um eins.
 *  - im Streitfall „wenden" abstimmen: beim ersten Lauf die erste Option,
 *    danach dieselbe Stimme erneut (die Datenbank hält eine Stimme je Konto
 *    und Streitfall, der zweite Schreibvorgang ändert nichts am Ergebnis).
 *    Die eine Stimme des Testkontos zählt im öffentlichen Ergebnis mit.
 *  - das Profil-Formular ausfüllen, OHNE zu speichern
 *  - NIE: kaufen, etwas absenden, das eine Mail auslöst, löschen, abmelden
 *    (der Abmelde-Knopf ist ein POST; die Sitzung endet mit dem Browser).
 *
 * Öffentliches Repo: Für dieses Projekt gibt es keine Traces, Screenshots oder
 * hochgeladenen Berichte (playwright.proben.config.ts, funktionsproben.yml) —
 * sie enthielten die Sitzung und die Adresse des Testkontos. Der Sitzungsstand
 * liegt im Temp-Ordner des Runners, nicht im Arbeitsbaum.
 *
 * Bekannte Grenze: Die Login-Seite ist mit Cloudflare Turnstile geschützt. Gibt
 * Turnstile dem automatisierten Browser kein Token, bleibt der Anmelde-Knopf
 * gesperrt. Das ist dann kein Defekt der Seite — die Proben werden mit genau
 * diesem Grund ausgesetzt, und das Summary nennt ihn.
 */

const EMAIL = process.env.PROBE_EMAIL ?? '';
const PASSWORT = process.env.PROBE_PASSWORD ?? '';
const EINGERICHTET = Boolean(EMAIL && PASSWORT);

// Die Texte liest scripts/proben-summary.mjs — beim Ändern dort nachziehen.
const GRUND_NICHT_EINGERICHTET = 'nicht eingerichtet: PROBE_EMAIL / PROBE_PASSWORD fehlen';
const GRUND_TURNSTILE = 'Turnstile gab dem Probenbrowser kein Token — Anmeldung über das Formular nicht möglich';

const SITZUNG = join(process.env.RUNNER_TEMP || tmpdir(), 'steakakademie-proben', 'sitzung.json');
const STREITFALL = 'wenden';

/** Ergebnis der Anmeldung — gilt für alle folgenden Proben desselben Laufs. */
let anmeldung: 'offen' | 'ok' | 'turnstile' = 'offen';

test.describe.configure({ mode: 'serial' });
test.skip(!EINGERICHTET, GRUND_NICHT_EINGERICHTET);

test('Anmeldung über das Passwort-Formular', async ({ page }) => {
  mkdirSync(dirname(SITZUNG), { recursive: true });
  // Leerer Stand, damit die folgenden Proben auch dann einen Kontext bekommen,
  // wenn die Anmeldung ausgesetzt wird.
  writeFileSync(SITZUNG, JSON.stringify({ cookies: [], origins: [] }));

  await oeffne(page, '/auth/login?redirectTo=/meine-kurse');
  await page.getByRole('button', { name: /Lieber mit Passwort anmelden/ }).click();
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORT);

  // Der Knopf zeigt „Sicherheitsprüfung …", bis Turnstile ein Token liefert.
  const knopf = page.locator('form:has(#email) button[type="submit"]');
  const frei = await expect(knopf)
    .toHaveText(/Anmelden/, { timeout: 25_000 })
    .then(() => true, () => false);
  if (!frei) {
    anmeldung = 'turnstile';
    test.skip(true, GRUND_TURNSTILE);
  }

  await knopf.click();
  try {
    await page.waitForURL(/\/meine-kurse/, { timeout: 30_000 });
  } catch {
    // Die Meldung der Seite nennen — ohne Adresse, ohne Passwort.
    const meldung = (await page.locator('main').innerText().catch(() => ''))
      .split('\n')
      .find((z) => /falsch|fehlgeschlagen|Sicherheitsprüfung|bestätig/i.test(z));
    throw new Error(`Anmeldung nicht gelungen${meldung ? `: ${meldung.trim().slice(0, 160)}` : ' (keine Meldung auf der Seite)'}`);
  }

  await page.context().storageState({ path: SITZUNG });
  anmeldung = 'ok';
});

test.describe('mit Sitzung', () => {
  test.use({ storageState: SITZUNG });
  test.skip(() => anmeldung === 'turnstile', GRUND_TURNSTILE);

  test('Meine Kurse lädt', async ({ page }) => {
    await oeffne(page, '/meine-kurse');
    await expect(page).toHaveURL(/\/meine-kurse$/);
    await erwarteH1(page, /Meine Kurse/);
  });

  test('Profil lädt und erkennt das Konto', async ({ page }) => {
    // /profil leitet auf /diplome/profil weiter.
    await page.goto('/profil', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/diplome\/profil$/);
    await erwarteH1(page, /Grillmeister-Vita/);
    // Der Abmelde-Knopf erscheint nur, wenn die Seite das Konto geladen hat.
    await expect(page.getByRole('button', { name: 'Abmelden' })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Anmelden/ })).toHaveCount(0);
  });

  test('Aroma-Matcher: Abfrage als angemeldeter Nutzer liefert ein Pairing (kein 401)', async ({ page }) => {
    const istAromaPost = (r: Response) => r.url().endsWith('/api/aroma-matcher') && r.request().method() === 'POST';

    const statusAntwort = page.waitForResponse((r) => istAromaPost(r) && !/cutId/.test(r.request().postData() ?? ''), { timeout: 30_000 });
    await oeffne(page, '/aroma-matcher');
    const status = await statusAntwort;
    expect(status.status(), 'Status-Abfrage').toBe(200);
    expect(await status.json(), 'der Status erkennt die Anmeldung').toMatchObject({ loggedIn: true });

    // Bevorzugt ein schon analysierter Cut: kostet nichts vom Freikontingent.
    const picker = page.locator('section[aria-labelledby="cut-picker"]');
    const schonAnalysiert = picker.locator('button', { hasText: 'analysiert' });
    const ziel = (await schonAnalysiert.count()) > 0 ? schonAnalysiert.first() : picker.locator('button').first();
    await expect(ziel).toBeEnabled();

    const abfrage = page.waitForResponse((r) => istAromaPost(r) && /cutId/.test(r.request().postData() ?? ''), { timeout: 30_000 });
    await ziel.click();
    const res = await abfrage;
    // 401 hier war der Defekt, der zwei Wochen unbemerkt blieb (bis 03.10.2026).
    expect(res.status(), 'Cut-Abfrage mit gültiger Sitzung').toBe(200);
    expect(((await res.json()) as { cut?: unknown }).cut, 'Antwort enthält das Pairing').toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Aroma-Radar' }).first()).toBeVisible();
  });

  test('Streitfall: Stimme abgeben — dieselbe erneut, das Ergebnis bleibt gleich', async ({ page }) => {
    const umfrage = page.locator(`section[aria-labelledby="umfrage-${STREITFALL}"]`);
    const optionen = umfrage.locator('button[aria-pressed]');
    const eigeneStimme = /\/rest\/v1\/streitfall_votes\?.*select=option_key/;
    const gedrueckt = () => optionen.evaluateAll((bs) => bs.findIndex((b) => b.getAttribute('aria-pressed') === 'true'));

    // 1) Stand lesen: Hat das Testkonto hier schon abgestimmt?
    const gelesen = page.waitForResponse((r) => eigeneStimme.test(r.url()) && r.request().method() === 'GET', { timeout: 30_000 });
    await oeffne(page, `/streitfaelle/${STREITFALL}`);
    await expect(optionen.first()).toBeVisible();
    const lesen = await gelesen;
    expect(lesen.status(), 'eigene Stimme lesen').toBeLessThan(500);
    const roh = (await lesen.json().catch(() => null)) as { option_key?: string } | { option_key?: string }[] | null;
    const hatteStimme = Boolean(Array.isArray(roh) ? roh[0]?.option_key : roh?.option_key);

    let zielIndex = 0;
    if (hatteStimme) {
      await expect(umfrage.locator('button[aria-pressed="true"]')).toHaveCount(1);
      zielIndex = await gedrueckt();
      // Die Seite schreibt nicht, wenn man die schon gewählte Option erneut
      // anklickt. Damit die Probe trotzdem den Schreibweg der Seite prüft,
      // wird ihr für EINEN Ladevorgang die eigene Stimme vorenthalten — der
      // Klick schreibt dann dieselbe Stimme noch einmal (Upsert, ändert nichts).
      await page.route(eigeneStimme, (route) =>
        route.request().method() === 'GET'
          ? route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
          : route.fallback(),
      );
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(optionen.first()).toBeVisible();
      await expect(umfrage.getByText('Anmelden zum Abstimmen')).toHaveCount(0);
    }

    // 2) Abstimmen — der Schreibvorgang muss ankommen.
    const geschrieben = page.waitForResponse(
      (r) => r.url().includes('/rest/v1/streitfall_votes') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await optionen.nth(zielIndex).click();
    const schreiben = await geschrieben;
    expect(schreiben.ok(), `Stimme speichern: HTTP ${schreiben.status()}`).toBe(true);
    await expect(umfrage.getByRole('alert')).toHaveCount(0);

    // 3) Gegenlesen ohne Eingriff: Die Stimme steht, und zwar dieselbe.
    await page.unroute(eigeneStimme);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(optionen.nth(zielIndex)).toHaveAttribute('aria-pressed', 'true');
    await expect(umfrage.locator('button[aria-pressed="true"]')).toHaveCount(1);
  });

  test('Profil-Formular ausfüllen — bis vor das Speichern', async ({ page }) => {
    const schreibversuche: string[] = [];
    page.on('request', (r) => {
      if (r.method() !== 'GET' && r.url().includes('/rest/v1/profiles')) schreibversuche.push(`${r.method()} ${new URL(r.url()).pathname}`);
    });

    await oeffne(page, '/diplome/profil');
    await expect(page.getByRole('button', { name: 'Abmelden' })).toBeVisible();

    const anzeigename = page.getByPlaceholder('z. B. Max Mustermann');
    await anzeigename.fill('Funktionsprobe');
    await expect(anzeigename).toHaveValue('Funktionsprobe');
    await expect(page.getByRole('button', { name: 'Speichern' })).toBeEnabled();

    // Bewusst kein Klick auf „Speichern" — und es darf auch sonst nichts geschrieben worden sein.
    expect(schreibversuche, 'Schreibzugriffe auf das Profil').toEqual([]);
  });
});
