import { test, expect } from '@playwright/test';

/**
 * Mobiles Menue (Header.tsx) — Befund Uwe 19.10.2026: „Wenn ich auf dem Smartphone
 * versuche die Tools aufzurufen passiert gar nichts."
 *
 * Ursache: „Tools" zeigt auf /#werkzeuge. Auf der Startseite aendert sich dabei nur der
 * Anker, nicht der Pfad — das Menue schloss aber nur bei Pfadwechsel. Das Overlay blieb
 * offen und verdeckte die Stelle, zu der gesprungen wurde.
 */
test.describe('Mobiles Menue', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('„Tools" auf der Startseite schliesst das Menue und zeigt die Werkzeuge', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menü öffnen' }).click();

    const overlay = page.locator('div.fixed.inset-0.z-40');
    await expect(overlay).toBeVisible();

    await overlay.getByRole('link', { name: 'Tools', exact: true }).click();

    await expect(overlay).toHaveCount(0);
    await expect(page).toHaveURL(/#werkzeuge$/);
    await expect(page.locator('#werkzeuge')).toBeInViewport();
  });

  test('Werkzeug-Link mit Anker schliesst das Menue ebenfalls', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menü öffnen' }).click();

    const overlay = page.locator('div.fixed.inset-0.z-40');
    await overlay.getByRole('link', { name: 'Rezept-Schmiede', exact: true }).click();

    await expect(overlay).toHaveCount(0);
  });
});
