import { test, expect, oeffne, erwarteH1 } from './helpers/probe';

/**
 * Anonyme Funktionsproben — laufen immer, täglich gegen die Live-Seite.
 * =====================================================================
 * Anlass (03.10.2026): Der Aroma-Matcher antwortete zwei Wochen lang jedem
 * eingeloggten Nutzer mit 401, ohne dass es jemand merkte. Alle Gates waren
 * grün — sie prüfen den Code, nicht die laufende Seite. Die Proben fragen
 * einmal am Tag: Tut die Seite noch, was ein Besucher von ihr will?
 *
 * Regeln für jede Probe in dieser Datei:
 *  - Nur lesen. Kein Formular wird abgesendet, keinem Partnerlink wird gefolgt.
 *    Seiten, die beim Laden selbst etwas abfragen (Hofladen-Suche aus der URL,
 *    Aroma-Partner auf der Rezeptseite, Status des Aroma-Matchers), tun das wie
 *    bei jedem Besucher — die Probe beobachtet die Antwort.
 *  - Geprüft wird Struktur, nicht Wortlaut: Überschrift zum Thema, das
 *    Kernelement der Seite, die Antwort der Schnittstelle. Ein redaktionell
 *    geänderter Satz soll keine Probe rot machen.
 *  - Mess-Aufrufe sind abgefangen, das Consent-Banner ist entschieden
 *    (tests/proben/helpers/probe.ts).
 */

// Feste Anker. Fällt einer davon weg, soll die Probe das melden — dann ist
// entweder die Seite weg oder der Anker gehört hier ersetzt.
const CUT = '/cuts/ribeye';
const REZEPT_MIT_AROMA = '/rezepte/fleisch/vacio-asado-argentino';
const HOFLADEN_ORT = 'Wuppertal';

test.describe('Kernseiten laden mit Inhalt', () => {
  test('Startseite: Überschrift, Rubriken-Einstiege, Fußbereich', async ({ page }) => {
    await oeffne(page, '/');
    await erwarteH1(page, /Steak/i);
    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(nav).toBeAttached();
    for (const ziel of ['/cuts', '/rezepte', '/diplome']) {
      await expect(page.locator(`a[href="${ziel}"]`).first(), `Einstieg ${ziel}`).toBeAttached();
    }
    await expect(page.locator('footer')).toBeVisible();
  });

  test('Cut-Seite: Ribeye mit Fließtext und Temperaturangaben', async ({ page }) => {
    await oeffne(page, CUT);
    await erwarteH1(page, /Ribeye/i);
    const text = await page.locator('main').innerText();
    expect(text.length, 'Textmenge der Cut-Seite').toBeGreaterThan(2000);
    expect(text, 'Temperaturangabe auf der Cut-Seite').toMatch(/\d{2}\s?°C/);
  });

  test('Rezept: Übersicht führt zu einem Rezept mit Zutaten-Rechner und Koch-Coach', async ({ page }) => {
    await oeffne(page, '/rezepte');
    await erwarteH1(page, /Rezepte/i);

    const ziele = await page
      .locator('a[href^="/rezepte/"]')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
    const rezept = ziele.find((h) => /^\/rezepte\/[^/]+\/[^/?#]+$/.test(h) && !h.startsWith('/rezepte/community'));
    expect(rezept, 'kein Rezept-Link auf /rezepte gefunden').toBeTruthy();

    await oeffne(page, rezept!);
    await expect(page.getByRole('heading', { level: 1 }).first()).not.toBeEmpty();
    await expect(page.locator('[aria-label="Zutaten-Rechner"]')).toBeVisible();
    await expect(page.locator('[aria-label="Koch-Coach: Zubereitungsschritte"]')).toBeAttached();
  });

  test('Temperatur-Guide: Tabellen mit Werten', async ({ page }) => {
    await oeffne(page, '/temperatur-guide');
    await erwarteH1(page, /Kerntemperatur/i);
    const tabellen = page.locator('main table');
    expect(await tabellen.count(), 'Anzahl Tabellen').toBeGreaterThan(0);
    expect(await page.locator('main table tbody tr').count(), 'Tabellenzeilen').toBeGreaterThan(20);
    await expect(tabellen.first()).toContainText(/\d{2}\s?°C/);
  });

  test('Diplom: Übersicht und eine freie Lektion der Stufe 1', async ({ page }) => {
    await oeffne(page, '/diplome');
    await expect(page.getByRole('heading', { level: 1 }).first()).not.toBeEmpty();

    const lektionen = await page
      .locator('a[href^="/diplome/lernen/stufe-1/"]')
      .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute('href') ?? ''))]);
    expect(lektionen.length, 'Links auf Lektionen der Stufe 1').toBeGreaterThan(4);

    await oeffne(page, lektionen[0]);
    // Frei heißt: kein Umweg über die Anmeldung, und es steht Lehrtext da.
    await expect(page).toHaveURL(new RegExp(`${lektionen[0]}$`));
    await expect(page.getByRole('heading', { level: 1 }).first()).not.toBeEmpty();
    expect((await page.locator('main').innerText()).length, 'Textmenge der Lektion').toBeGreaterThan(800);
  });

  test('Newsletter: Anmeldeformular ist sichtbar', async ({ page }) => {
    await oeffne(page, '/newsletter');
    const formular = page.locator('main').getByRole('region', { name: 'Newsletter-Anmeldung' }).first();
    await expect(formular).toBeVisible();
    await expect(formular.locator('input[type="email"]')).toBeVisible();
    await expect(formular.locator('input[type="checkbox"]')).toBeAttached();
    await expect(formular.getByRole('button').first()).toBeVisible();
    // Bewusst kein Absenden: eine Anmeldung würde eine echte Mail auslösen.
  });
});

test.describe('Werkzeuge antworten', () => {
  test('Hofladen-Radar: Suche aus der URL liefert Höfe', async ({ page }) => {
    // Geocoder-Antworten sind 30 Tage gecacht (src/lib/hoefe/geocode.ts) —
    // derselbe Ort jeden Tag belastet keinen fremden Dienst.
    const antwort = page.waitForResponse((r) => r.url().includes('/api/hoefe?'), { timeout: 30_000 });
    await oeffne(page, `/hoefe?ort=${encodeURIComponent(HOFLADEN_ORT)}&km=25`);
    await erwarteH1(page, /Hofladen-Radar/);

    const res = await antwort;
    expect(res.status(), '/api/hoefe').toBe(200);
    const daten = (await res.json()) as { treffer?: unknown[] };
    expect(daten.treffer?.length ?? 0, `Höfe im Umkreis von 25 km um ${HOFLADEN_ORT}`).toBeGreaterThan(0);

    await expect(page.getByRole('heading', { level: 2, name: /im Umkreis von 25 km/ })).toBeVisible();
    await expect(page.locator('main a[href^="/hoefe/"]').first()).toBeVisible();
  });

  test('Aroma-Matcher: Seite mit Beispiel-Pairing, Status-Abfrage antwortet', async ({ page }) => {
    const status = page.waitForResponse(
      (r) => r.url().endsWith('/api/aroma-matcher') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await oeffne(page, '/aroma-matcher');
    await erwarteH1(page, /Aroma-Matcher/);

    const res = await status;
    expect(res.status(), 'Status-Abfrage /api/aroma-matcher').toBe(200);
    expect(await res.json()).toMatchObject({ loggedIn: false });

    // Anonym: festes Beispiel sichtbar, Cut-Wahl gesperrt, Weg zur Anmeldung da.
    await expect(page.getByRole('heading', { name: 'Aroma-Radar' }).first()).toBeVisible();
    await expect(page.getByText('Nach Anmeldung aktiv')).toBeVisible();
    await expect(page.locator('a[href^="/auth/login?redirectTo=/aroma-matcher"]')).toBeVisible();
  });

  test('Aroma-Abfrage (frei): Rezeptseite zeigt Partner über geteilte Aromamoleküle', async ({ page }) => {
    // Die Rezeptseite fragt beim Laden selbst /api/foodpairing — ohne Anmeldung.
    const abfrage = page.waitForResponse(
      (r) => r.url().endsWith('/api/foodpairing') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await oeffne(page, REZEPT_MIT_AROMA);

    const res = await abfrage;
    expect(res.status(), '/api/foodpairing').toBe(200);
    const daten = (await res.json()) as { treffer?: unknown[] };
    expect(daten.treffer?.length ?? 0, 'Aroma-Partner').toBeGreaterThan(0);
    await expect(page.getByText(/gemeinsame Moleküle/).first()).toBeVisible();
  });

  test('Suche: „ribeye" findet die Cut-Seite', async ({ page }) => {
    await oeffne(page, '/suche?q=ribeye');
    await erwarteH1(page, /Suche/);
    await expect(page.locator(`main a[href="${CUT}"]`).first()).toBeVisible();
  });
});

test.describe('Anmeldung und Zugangstor', () => {
  test('Login-Seite: Formular mit E-Mail, Passwort-Weg erreichbar', async ({ page }, testInfo) => {
    await oeffne(page, '/auth/login');
    await expect(page.locator('#email')).toBeVisible();
    await page.getByRole('button', { name: /Lieber mit Passwort anmelden/ }).click();
    await expect(page.locator('#password')).toBeVisible();

    // Nur Beobachtung, kein Urteil: Bekommt ein automatisierter Browser von
    // Turnstile ein Token? Davon hängt ab, ob die angemeldeten Proben sich
    // überhaupt anmelden können. Es wird nichts abgesendet — die Felder sind
    // gefüllt, damit der Knopf allein noch auf die Sicherheitsprüfung wartet.
    await page.locator('#email').fill('funktionsprobe@example.invalid');
    await page.locator('#password').fill('nicht-absenden');
    const knopf = page.locator('form:has(#email) button[type="submit"]');
    const frei = await expect(knopf)
      .toHaveText(/Anmelden/, { timeout: 20_000 })
      .then(() => true, () => false);
    testInfo.annotations.push({
      type: 'turnstile',
      description: frei
        ? 'Sicherheitsprüfung bestanden — der Anmelde-Knopf wurde freigegeben'
        : 'kein Token — der Anmelde-Knopf blieb bei „Sicherheitsprüfung …"',
    });
  });

  for (const pfad of ['/meine-kurse', '/profil']) {
    test(`Zugangstor: ${pfad} leitet ohne Anmeldung auf die Login-Seite`, async ({ page }) => {
      await page.goto(pfad, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/auth\/login\?redirectTo=/);
      expect(new URL(page.url()).searchParams.get('redirectTo'), 'Rücksprungziel').toBe(pfad);
      await expect(page.locator('#email')).toBeVisible();
    });
  }
});

test.describe('Für Suchmaschinen erreichbar', () => {
  test('robots.txt: erreichbar, nennt die Sitemap', async ({ page }) => {
    const antwort = await page.goto('/robots.txt');
    expect(antwort?.status()).toBe(200);
    const text = await antwort!.text();
    expect(text).toMatch(/^User-agent:/im);
    expect(text).toMatch(/^Sitemap:\s*https:\/\/steakakademie\.de\/sitemap\.xml/im);
  });

  test('sitemap.xml: erreichbar, verweist auf eine Sitemap mit Seiten — ohne Admin-, API- und Anmelde-Routen', async ({ page }) => {
    const index = await page.goto('/sitemap.xml');
    expect(index?.status()).toBe(200);
    const indexText = await index!.text();
    const erste = /<loc>([^<]+\.xml)<\/loc>/.exec(indexText)?.[1];
    expect(erste, 'sitemap.xml nennt keine Teil-Sitemap').toBeTruthy();

    const teil = await page.goto(new URL(erste!).pathname);
    expect(teil?.status()).toBe(200);
    const urls = [...(await teil!.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(urls.length, 'Anzahl Seiten in der Sitemap').toBeGreaterThan(300);
    expect(urls.filter((u) => /\/(admin|api|auth)(\/|$)/.test(new URL(u).pathname))).toEqual([]);
  });
});
