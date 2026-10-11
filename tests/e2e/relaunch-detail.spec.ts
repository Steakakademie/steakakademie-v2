import { test, expect } from '@playwright/test';

/**
 * Relaunch 2026-09 — Detailseiten (Handoff-Ansichten 3–8).
 * Prüft das, was beim Umschalten nicht kaputtgehen darf: Portionsrechner,
 * Bezahlschutz der Stufen 2–5, Werbekennzeichnung vor dem Klick,
 * KI-Bildkennzeichnung, Redaktionsvorbehalt-Inhalte vorhanden.
 */
test.describe('Relaunch · Detailseiten', () => {
  test('Streitfall: Entscheidung, Merksatz, FAQ und Weiche vorhanden', async ({ page }) => {
    await page.goto('/relaunch/streitfaelle/myoglobin');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('rote Saft');
    await expect(page.locator('.sk-pull')).not.toBeEmpty();
    await expect(page.locator('.sk-entscheidung')).toBeVisible();
    await expect(page.locator('.sk-faq')).toBeVisible();
    await expect(page.locator('a.sk-weiche')).toHaveAttribute('href', '/relaunch/diplome');
    await expect(page.locator('.sk-read__meta')).toContainText('Min. Lesezeit');
  });

  test('Rezept: Portionsrechner skaliert Mengen, Kennzeichnung Symbolbild', async ({ page }) => {
    await page.goto('/relaunch/rezepte/fleisch/asado-de-tira');
    await expect(page.locator('.sk-stepper__n')).toHaveText('4');
    const erste = page.locator('.sk-zutaten__row').first();
    await expect(erste).toContainText('2 kg');
    await page.getByRole('button', { name: 'Eine Portion mehr' }).click();
    await page.getByRole('button', { name: 'Eine Portion mehr' }).click();
    await expect(page.locator('.sk-stepper__n')).toHaveText('6');
    await expect(erste).toContainText('3 kg');
    await expect(page.locator('.sk-rezept__bild figcaption')).toContainText(/Symbolbild/);
    await expect(page.locator('.sk-ablauf__step').first()).toBeVisible();
    const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => e.textContent ?? ''));
    expect(schemas.filter((s) => s.includes('"@type":"Recipe"'))).toHaveLength(1);
  });

  test('Lektion Stufe 1 offen, Stufe 2 nur Anreißer (Bezahlschutz)', async ({ page }) => {
    await page.goto('/relaunch/diplome/lernen/stufe-1/grillarten');
    await expect(page.locator('.sk-prose')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lektion abschließen' })).toBeVisible();

    // Stufe 2, Lektion 1 (content/diplom-lektionen/stufe-2, order 1)
    const res = await page.goto('/relaunch/diplome/lernen/stufe-2/fleischanatomie');
    expect(res?.status()).toBe(200);
    await expect(page.locator('.sk-prose')).toHaveCount(0);
    await expect(page.getByText('Teil der Grillmeister-Ausbildung')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lektion abschließen' })).toHaveCount(0);
  });

  // 11.10.2026: Amazon-Partnerlinks fuehren direkt zu Amazon (produktLink), Netzwerk-Links ueber /go/.
  test('Werkzeug: Produktkarten tragen „Anzeige" vor dem Klick, Links direkt zu Amazon oder über /go/', async ({ page }) => {
    await page.goto('/relaunch/vergleich/fleischthermometer');
    const karten = page.locator('.sk-produkt');
    await expect(karten.first()).toBeVisible();
    const n = await karten.count();
    for (let i = 0; i < n; i++) {
      await expect(karten.nth(i).locator('.sk-produkt__top')).toContainText('Anzeige');
      const a = karten.nth(i).locator('a.sk-btn');
      await expect(a).toHaveAttribute('href', /^(https:\/\/(www\.)?amazon\.de\/|\/go\/)/);
      await expect(a).toHaveAttribute('rel', /sponsored/);
    }
    await expect(page.locator('.sk-prose table').first()).toBeVisible();
  });

  test('Über uns: drei Kapitel, KI-Kennzeichnung, Persona-Hinweis, Platzhalter-Hinweis', async ({ page }) => {
    await page.goto('/relaunch/ueber-uns');
    await expect(page.locator('.sk-ueber-text').getByRole('heading', { level: 2 })).toHaveCount(3);
    await expect(page.locator('figcaption')).toContainText('KI-Symbolbild');
    await expect(page.getByText('Vorläufig · Reifekammer-Motiv folgt')).toBeVisible();
    await expect(page.getByText('KI-Persona · fachlich verantwortet von Uwe Yendell').first()).toBeVisible();
  });
});
