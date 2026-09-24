import { test, expect, type Page } from '@playwright/test';

const URL = '/diplome/roadmap';

/**
 * Wartet, bis die Roadmap geladen und sichtbar ist.
 *
 * Ersetzt `waitForLoadState('networkidle')` (24.09.2026): Seit dem Upgrade auf
 * Next 16 (17.09.) lief jeder Test dieser Datei dort in den 15-s-Timeout, obwohl
 * die Seite laengst fertig war — nach dem Reload feuert der Router rund 150
 * Prefetch-Anfragen fuer die Navigationslinks. Warum `networkidle` dabei nie
 * eintritt, ist nicht abschliessend belegt. Playwright raet von `networkidle`
 * ohnehin ab; gewartet wird deshalb auf das, was der Test braucht.
 */
async function roadmapBereit(page: Page) {
  await page.waitForLoadState('load');
  await expect(page.getByText('Grillmeister-Ausbildung in 5 Stufen')).toBeVisible();
}

async function clearAndLoad(page: Page) {
  await page.goto(URL);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await roadmapBereit(page);
}

async function openBronze(page: Page) {
  await page.getByRole('button', { name: /Modul öffnen.*Feuerzone/ }).click();
  await expect(page.getByRole('button', { name: /Zurück zur Roadmap/ })).toBeVisible();
}

// ═════════════════════════════════════════════════════════════════════
// PHASE 1 — Roadmap, Navigation, Locks, Banner
// ═════════════════════════════════════════════════════════════════════

test.describe('Phase 1 — Roadmap & Locks', () => {
  test.beforeEach(async ({ page }) => {
    await clearAndLoad(page);
  });

  test('Roadmap rendert Header + 5 Stufen', async ({ page }) => {
    await expect(page.getByText('Grillmeister-Ausbildung in 5 Stufen')).toBeVisible();

    for (let i = 1; i <= 5; i++) {
      const stageBtn = page.locator('button', { hasText: new RegExp(`^.*Stufe ${i}.*$`) }).first();
      await expect(stageBtn).toBeVisible();
    }
  });

  test('Bronze (Stufe 1) ist initial offen — CTA ohne Schloss', async ({ page }) => {
    const cta = page.getByRole('button', { name: /Modul öffnen.*Feuerzone/ });
    await expect(cta).toBeVisible();
    const text = await cta.textContent();
    expect(text).not.toContain('🔒');
  });

  // Stufe 2 steht hinter Stufe 1 — gewollt, siehe Kommentar an `requires` in
  // RoadmapClient.tsx („Vorher fehlte `requires` bei Stufe 2"). Bis 24.09.2026
  // erwartete dieser Test noch den alten, offenen Zustand.
  test('Anatomie (Stufe 2) ist initial gesperrt', async ({ page }) => {
    await page.locator('button', { hasText: /Stufe 2/ }).first().click();
    const cta = page.getByRole('button', { name: /Modul öffnen.*Anatomie/ });
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('🔒');
  });

  test('Thermometer (Stufe 3) ist initial gesperrt', async ({ page }) => {
    await page.locator('button', { hasText: /Stufe 3/ }).first().click();
    const cta = page.getByRole('button', { name: /Modul öffnen.*Kerntemperatur/ });
    await expect(cta).toContainText('🔒');
  });

  test('Klick auf gesperrtes Thermometer zeigt Lock-Banner', async ({ page }) => {
    await page.locator('button', { hasText: /Stufe 3/ }).first().click();
    await page.getByRole('button', { name: /Modul öffnen.*Kerntemperatur/ }).click();
    await expect(page.getByRole('status')).toContainText(/Schließe zuerst Stufe 2/);
  });

  test('Reset-Link versteckt ohne Fortschritt, sichtbar mit', async ({ page }) => {
    await expect(page.getByText('Fortschritt zurücksetzen')).toHaveCount(0);

    await page.evaluate(() => {
      window.localStorage.setItem(
        'steakakademie_progress',
        JSON.stringify({
          bestandene_module: ['bronze'],
          quiz_scores: { bronze: 5 },
          badges: ['Glut-Lehrling'],
          streak_count: 3,
        }),
      );
    });
    await page.reload();
    await roadmapBereit(page);

    await expect(page.getByText('Fortschritt zurücksetzen')).toBeVisible();
  });

  test('Bronze-Abschluss schaltet Thermometer NICHT frei (Pflicht: anatomie)', async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.setItem(
        'steakakademie_progress',
        JSON.stringify({
          bestandene_module: ['bronze'],
          quiz_scores: { bronze: 5 },
          badges: ['Glut-Lehrling'],
          streak_count: 0,
        }),
      );
    });
    await page.reload();
    await roadmapBereit(page);

    await page.locator('button', { hasText: /Stufe 3/ }).first().click();
    const cta = page.getByRole('button', { name: /Modul öffnen.*Kerntemperatur/ });
    await expect(cta).toContainText('🔒');
  });

  test('Anatomie-Score 4+ schaltet Thermometer frei', async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.setItem(
        'steakakademie_progress',
        JSON.stringify({
          bestandene_module: ['anatomie'],
          quiz_scores: { anatomie: 4 },
          badges: ['Fleischkenner'],
          streak_count: 0,
        }),
      );
    });
    await page.reload();
    await roadmapBereit(page);

    await page.locator('button', { hasText: /Stufe 3/ }).first().click();
    const cta = page.getByRole('button', { name: /Modul öffnen.*Kerntemperatur/ });
    const text = await cta.textContent();
    expect(text).not.toContain('🔒');
  });
});

// ═════════════════════════════════════════════════════════════════════
// PHASE 2 — Bronze-Modul (FeuerzoneSpiel + Quiz)
// ═════════════════════════════════════════════════════════════════════

test.describe('Phase 2 — Bronze: FeuerzoneSpiel + Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await clearAndLoad(page);
    await openBronze(page);
  });

  test('Bronze-Modul-Header zeigt Titel + Tabs', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Feuerzone/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Lerninhalte/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^.*Quiz.*$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Flashcards/ })).toBeVisible();
  });

  test('FeuerzoneSpiel ist sichtbar mit 6 Items', async ({ page }) => {
    await expect(page.getByText('Wo gehört welches Fleisch hin?')).toBeVisible();
    for (const item of ['Steak', 'Wurst', 'Hähnchen', 'Brisket', 'Gemüse', 'Fisch']) {
      await expect(page.locator('button', { hasText: new RegExp(`^.*${item}.*$`) }).first()).toBeVisible();
    }
  });

  // Die Pruefung kommt seit dem Audit vom 06.09.2026 vom Server
  // (/api/diplome/pruefung/ziehung und /api/diplome/pruefung, Supabase-gestuetzt).
  // Ohne diese Anbindung — lokal ohne Env und im CI-Workflow e2e.yml — zeigt der
  // Quiz-Tab korrekt „Pruefung derzeit nicht verfuegbar". Die drei Tests unten
  // klicken noch feste Antworttexte aus der alten Client-Pruefung an. Ausgesetzt
  // statt geloescht: Wiederbeleben heisst, beide Routen per page.route() mit einer
  // Fixture-Ziehung zu mocken (24.09.2026).
  test.fixme('Quiz: 5/5 korrekt schaltet Glut-Lehrling-Badge frei', async ({ page }) => {
    await page.getByRole('button', { name: /^.*Quiz.*$/ }).click();

    const correctAnswers = [
      'Sobald ein grauer Aschefilm sichtbar ist',
      '230-290 °C',
      'Große Stücke schonend durchgaren',
      'Deckel schließen',
      '10-15 cm',
    ];

    for (let i = 0; i < correctAnswers.length; i++) {
      await page.locator('button', { hasText: correctAnswers[i] }).first().click();
      const next = page.locator('button', { hasText: /Nächste Frage|Ergebnis sehen/ });
      await next.click();
    }

    await expect(page.getByText('Modul bestanden!')).toBeVisible();

    // Banner kurzzeitig — falls schon weg, prüfen wir localStorage
    const progress = await page.evaluate(() => {
      const raw = window.localStorage.getItem('steakakademie_progress');
      return raw ? JSON.parse(raw) : null;
    });
    expect(progress).not.toBeNull();
    expect(progress.bestandene_module).toContain('bronze');
    expect(progress.quiz_scores.bronze).toBe(5);
    expect(progress.badges).toContain('Glut-Lehrling');
    expect(progress.streak_count).toBeGreaterThanOrEqual(5);
  });

  test.fixme('Quiz: falsche Antwort bricht Streak', async ({ page }) => {
    // Seed: streak = 4
    await page.goto(URL);
    await page.evaluate(() => {
      window.localStorage.setItem(
        'steakakademie_progress',
        JSON.stringify({
          bestandene_module: [],
          quiz_scores: {},
          badges: [],
          streak_count: 4,
        }),
      );
    });
    await page.reload();
    await roadmapBereit(page);
    await openBronze(page);
    await page.getByRole('button', { name: /^.*Quiz.*$/ }).click();

    // Erste Frage: falsche Antwort wählen (A = "Sobald die Flammen lodern")
    await page.locator('button', { hasText: 'Sobald die Flammen lodern' }).first().click();

    const progress = await page.evaluate(() => {
      const raw = window.localStorage.getItem('steakakademie_progress');
      return raw ? JSON.parse(raw) : null;
    });
    expect(progress?.streak_count).toBe(0);
  });

  test.fixme('Quiz: 2 richtige Antworten in Folge inkrementieren Streak', async ({ page }) => {
    await page.getByRole('button', { name: /^.*Quiz.*$/ }).click();

    // Erste Frage: richtig
    await page.locator('button', { hasText: 'Sobald ein grauer Aschefilm sichtbar ist' }).first().click();
    await page.locator('button', { hasText: /Nächste Frage/ }).click();

    // Zweite Frage: richtig
    await page.locator('button', { hasText: '230-290 °C' }).first().click();

    const progress = await page.evaluate(() => {
      const raw = window.localStorage.getItem('steakakademie_progress');
      return raw ? JSON.parse(raw) : null;
    });
    expect(progress?.streak_count).toBe(2);
  });
});

// ═════════════════════════════════════════════════════════════════════
// PHASE 3 — Flashcards
// ═════════════════════════════════════════════════════════════════════

test.describe('Phase 3 — Flashcards', () => {
  test.beforeEach(async ({ page }) => {
    await clearAndLoad(page);
    await openBronze(page);
    await page.getByRole('button', { name: /Flashcards/ }).click();
    await expect(page.getByText('Klicken zum Umdrehen')).toBeVisible();
  });

  test('Stapel startet mit 8 Karten (Bronze)', async ({ page }) => {
    await expect(page.getByText(/Stapel:\s*8/)).toBeVisible();
    await expect(page.getByText(/Karte\s+1\s*\/\s*8/)).toBeVisible();
  });

  test('Click auf Karte triggert Flip (transform rotateY)', async ({ page }) => {
    const inner = page.locator('div').filter({ hasText: 'Klicken zum Umdrehen' }).locator('xpath=ancestor::div[1]/..').first();

    // Vor Flip: kein rotateY(180deg) im inneren Container
    const flipContainer = page.locator('div').filter({ has: page.locator(':text("Klicken zum Umdrehen")') }).first();

    // Direkter Click auf das outer perspective-Element (per text)
    await page.getByText('Klicken zum Umdrehen').click();

    // Nach Flip: Eines der inneren Divs hat transform rotateY(180deg)
    const transformedExists = await page.locator('div').evaluateAll((els) =>
      els.some((el) => {
        const t = (el as HTMLElement).style.transform || '';
        return t.includes('rotateY(180deg)');
      }),
    );
    expect(transformedExists).toBe(true);
  });

  test('"Gewusst" reduziert Stapel um 1', async ({ page }) => {
    await expect(page.getByText(/Stapel:\s*8/)).toBeVisible();
    await page.getByRole('button', { name: /✓\s*Gewusst/ }).click();
    await expect(page.getByText(/Stapel:\s*7/)).toBeVisible();
  });

  test('"Nochmal" hält Stapelgröße konstant', async ({ page }) => {
    await expect(page.getByText(/Stapel:\s*8/)).toBeVisible();
    await page.getByRole('button', { name: /↻\s*Nochmal/ }).click();
    await expect(page.getByText(/Stapel:\s*8/)).toBeVisible();
  });

  test('Gewusst persistiert in localStorage (eigener Key pro Modul)', async ({ page }) => {
    await page.getByRole('button', { name: /✓\s*Gewusst/ }).click();
    await page.waitForTimeout(100);

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('steakakademie_flashcards_bronze'),
    );
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.known).toHaveLength(1);
  });

  test('Stack-Reset funktioniert nach allen 8 Gewusst', async ({ page }) => {
    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: /✓\s*Gewusst/ }).click();
      await page.waitForTimeout(50);
    }
    await expect(page.getByText(/Alle 8 Karten gewusst/)).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════
// PERSISTENZ — Reload-Verhalten
// ═════════════════════════════════════════════════════════════════════

test.describe('Persistenz — Reload behält Fortschritt', () => {
  test('Bronze-Abschluss + Anatomie-Score überleben Reload', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => {
      window.localStorage.setItem(
        'steakakademie_progress',
        JSON.stringify({
          bestandene_module: ['bronze', 'anatomie'],
          quiz_scores: { bronze: 5, anatomie: 5 },
          badges: ['Glut-Lehrling', 'Fleischkenner'],
          streak_count: 12,
        }),
      );
    });
    await page.reload();
    await roadmapBereit(page);

    // Stufe 3 jetzt offen
    await page.locator('button', { hasText: /Stufe 3/ }).first().click();
    const cta = page.getByRole('button', { name: /Modul öffnen.*Kerntemperatur/ });
    const ctaText = await cta.textContent();
    expect(ctaText).not.toContain('🔒');

    // Reset-Link sichtbar
    await expect(page.getByText('Fortschritt zurücksetzen')).toBeVisible();
  });
});
