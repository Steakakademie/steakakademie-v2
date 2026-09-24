import { test, expect } from '@playwright/test';

/**
 * Relaunch 2026-09 — Suche (im Handoff nicht entworfen, Auftrag Uwe 05.09.2026).
 *
 * Geprüft wird das, was kaputtgehen kann, ohne dass es jemand sieht:
 *  - Kopfzeilen-Feld schickt auf /relaunch/suche und bleibt im neuen Design
 *  - Treffer erscheinen, Typ-Filter grenzt ein und die Zählung stimmt
 *  - ein ?typ=, den es in dieser Trefferliste nicht gibt, erzeugt KEINE leere
 *    Seite (Lesezeichen-Fall)
 *  - der Nichts-gefunden-Zustand bietet Marco an
 *  - Redaktionsvorbehalt: Entwürfe tauchen nicht auf (indirekt über /suche
 *    dieselbe Quelle, hier über die Trefferzahl-Konsistenz beider Seiten)
 * Consent-Banner ist über storageState (playwright.config.ts) bereits weg.
 */
test.describe('Relaunch · Suche', () => {
  test('Kopfzeilen-Feld führt auf die Ergebnisseite im neuen Design', async ({ page }) => {
    await page.goto('/relaunch/cuts');
    await page.getByRole('searchbox', { name: 'Website durchsuchen' }).first().fill('Ribeye');
    await page.getByRole('searchbox', { name: 'Website durchsuchen' }).first().press('Enter');

    await expect(page).toHaveURL(/\/relaunch\/suche\?q=Ribeye$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ribeye');
    // noch im Relaunch-Layout, nicht in der Alt-Site
    await expect(page.locator('.sk')).toHaveCount(1);
    await expect(page.locator('.sk-tref').first()).toBeVisible();
  });

  test('Typ-Filter grenzt ein, „Alle" hebt ihn auf', async ({ page }) => {
    await page.goto('/relaunch/suche?q=steak');
    const alle = await page.locator('.sk-tref').count();
    expect(alle).toBeGreaterThan(1);

    const ersterFilter = page.locator('.sk-filterbar__chips a').nth(1);
    const label = (await ersterFilter.innerText()).trim();
    const erwartet = Number(label.match(/\((\d+)\)$/)?.[1]);
    expect(erwartet).toBeGreaterThan(0);

    await ersterFilter.click();
    await expect(page.locator('.sk-tref')).toHaveCount(erwartet);
    await expect(page.locator('.sk-count')).toHaveText(`${erwartet} angezeigt`);

    await page.getByRole('link', { name: /^Alle \(/ }).click();
    await expect(page.locator('.sk-tref')).toHaveCount(alle);
  });

  test('unbekannter ?typ wird ignoriert statt eine leere Seite zu zeigen', async ({ page }) => {
    await page.goto('/relaunch/suche?q=steak&typ=Gibtsnicht');
    await expect(page.locator('.sk-tref').first()).toBeVisible();
    await expect(page.locator('.sk-chip--on')).toContainText('Alle');
  });

  test('kein Treffer: Marco wird angeboten, Suche behauptet nichts', async ({ page }) => {
    await page.goto('/relaunch/suche?q=zzzqqxyz');
    await expect(page.locator('.sk-empty__title')).toHaveText('Nichts gefunden');
    await expect(page.getByRole('button', { name: 'Marco fragen' })).toBeVisible();
    await expect(page.locator('.sk-tref')).toHaveCount(0);
  });

  test('leere Suche zeigt die Einstiegsseite, keine Treffer', async ({ page }) => {
    await page.goto('/relaunch/suche');
    await expect(page.locator('.sk-empty__title')).toHaveText('Wonach suchst du?');
    await expect(page.locator('.sk-tref')).toHaveCount(0);
    await expect(page.locator('.sk-filterbar')).toHaveCount(0);
  });

  test('gleiche Quelle wie die Alt-Suche: identische Trefferzahl', async ({ page }) => {
    await page.goto('/relaunch/suche?q=brisket');
    const neu = await page.locator('.sk-tref').count();
    await page.goto('/suche?q=brisket');
    const alt = await page.locator('main ul > li').count();
    expect(neu).toBe(alt);
  });

  // Seit #185 (22.09.2026) ist Marco Mitgliedern vorbehalten. Ein anonymer
  // Besucher bekommt beim Öffnen den Anmelde-Hinweis statt des Eingabefelds —
  // die frühere Erwartung (#marco-input mit vorbefüllter Frage) gilt nur noch
  // eingeloggt und ist hier ohne Test-Login nicht prüfbar.
  test('„Marco fragen" öffnet den Chat — anonym mit Anmelde-Hinweis, ohne API-Aufruf', async ({ page }) => {
    const marcoAufrufe: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/marco')) marcoAufrufe.push(r.url());
    });

    await page.goto('/relaunch/suche?q=zzzqqxyz');
    await page.getByRole('button', { name: 'Marco fragen' }).click();

    // Marco hängt in DeferredMount + next/dynamic und ist beim Klick evtl. noch
    // nicht geladen — MarcoStarter wiederholt das Ereignis deshalb bis zu 3 s.
    await expect(page.getByText('Marco ist Mitgliedern vorbehalten')).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('link', { name: 'Jetzt kostenlos anmelden' })).toHaveAttribute(
      'href',
      `/auth/login?redirectTo=${encodeURIComponent('/relaunch/suche')}`,
    );
    await expect(page.locator('#marco-input')).toHaveCount(0);
    expect(marcoAufrufe).toEqual([]);
  });
});
