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

// ── Pruefungs-Mocks ─────────────────────────────────────────────────────
// Antwortformen wie in src/app/api/diplome/pruefung/ziehung/route.ts und
// src/app/api/diplome/pruefung/route.ts. Aendert sich dort die Form, muss
// dieser Block mit — sonst testen die Quiz-Tests eine API, die es nicht gibt.

const MOCK_TOKEN = 'e2e-mock-token';

// Fuenf Fragen: 5 -> Grenze 4 (bestehensgrenze, 80 %). Texte bewusst als
// Testdaten erkennbar — hier wird der Ablauf geprueft, nicht der Fragenpool.
const FIXTURE_FRAGEN = [1, 2, 3, 4, 5].map((n) => ({
  id: `e2e-f${n}`,
  q: `Testfrage ${n}`,
  options: [`Antwort ${n}A`, `Antwort ${n}B`, `Antwort ${n}C`],
  lektionSlug: 'grillarten',
}));

type Eingereicht = { modul: string; token: string; antworten: number[] };

async function mockPruefung(page: Page, { bestanden }: { bestanden: boolean }) {
  const eingereicht: Eingereicht[] = [];

  await page.route('**/api/diplome/pruefung/ziehung', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: MOCK_TOKEN, exp: Date.now() + 60 * 60 * 1000, fragen: FIXTURE_FRAGEN }),
    }),
  );

  await page.route('**/api/diplome/pruefung', (route) => {
    eingereicht.push(route.request().postDataJSON() as Eingereicht);
    // Nicht bestanden: Fragen 3–5 falsch -> 2 von 5, Grenze 4.
    const ergebnisse = FIXTURE_FRAGEN.map((f, i) => {
      const richtig = bestanden || i < 2;
      return {
        id: f.id,
        richtig,
        explain: richtig ? '' : `Erklaerung zu Frage ${i + 1}`,
        lektionSlug: richtig ? '' : f.lektionSlug,
      };
    });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        score: ergebnisse.filter((r) => r.richtig).length,
        gesamt: FIXTURE_FRAGEN.length,
        grenze: 4,
        bestanden,
        badge: bestanden ? 'Glut-Lehrling' : null,
        ergebnisse,
        gespeichert: false,
        hinweis: 'Ohne Anmeldung wird das Ergebnis nicht gespeichert.',
      }),
    });
  });

  return { eingereicht };
}

/** Beantwortet jede Frage mit Option A und gibt die gewaehlten Indizes zurueck. */
async function beantworteAlle(page: Page): Promise<number[]> {
  const gewaehlt: number[] = [];
  for (const frage of FIXTURE_FRAGEN) {
    await expect(page.getByText(frage.q, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(frage.options[0]) }).click();
    gewaehlt.push(0);
    await page.getByRole('button', { name: /Nächste Frage|Abgeben und Ergebnis sehen/ }).click();
  }
  return gewaehlt;
}

type Fortschritt = {
  bestandene_module: string[];
  quiz_scores: Record<string, number>;
  badges: string[];
  streak_count: number;
};

async function fortschritt(page: Page): Promise<Fortschritt> {
  const raw = await page.evaluate(() => window.localStorage.getItem('steakakademie_progress'));
  expect(raw, 'Fortschritt fehlt in localStorage').not.toBeNull();
  return JSON.parse(raw!) as Fortschritt;
}

/** Setzt einen Anfangsfortschritt, laedt neu und oeffnet wieder das Bronze-Modul. */
async function seedeFortschritt(page: Page, teil: Partial<Fortschritt>) {
  await page.evaluate((stand) => {
    window.localStorage.setItem(
      'steakakademie_progress',
      JSON.stringify({ bestandene_module: [], quiz_scores: {}, badges: [], streak_count: 0, ...stand }),
    );
  }, teil);
  await page.reload();
  await roadmapBereit(page);
  await openBronze(page);
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

  // ── Pruefung (seit 06./08.09.2026 serverseitig) ────────────────────────
  // Die Fragen zieht /api/diplome/pruefung/ziehung (ohne Loesungen, dazu ein
  // signiertes Token), das Ergebnis stellt /api/diplome/pruefung fest. Ohne
  // Token-Secret (tokenSecret() in src/lib/diplome/pruefung-token.ts) — lokal
  // ohne Env und im CI-Workflow e2e.yml — antwortet die Ziehung 503 und der
  // Quiz-Tab zeigt „Pruefung nicht verfuegbar".
  // Diese Tests mocken deshalb beide Routen in genau der Form, die die Routen
  // liefern, und pruefen, was der CLIENT daraus macht: welche Antworten er mit
  // welchem Token schickt und was er im Fortschritt verbucht. Die Bewertung
  // selbst gehoert in Unit-Tests von src/lib/diplome/fragen.ts.
  //
  // Die Serie (streak_count) zaehlt seit der Server-Pruefung pro PRUEFUNG, nicht
  // mehr pro Frage: bestanden -> +1, nicht bestanden -> 0. Die frueheren Tests
  // („falsche Antwort bricht Streak", „2 richtige in Folge") prueften das alte
  // Verhalten und liefen bis 24.09.2026 als test.fixme.

  test('Quiz: bestandene Pruefung verbucht Modul, Badge und Serie', async ({ page }) => {
    const pruefung = await mockPruefung(page, { bestanden: true });
    await page.getByRole('button', { name: /^.*Quiz.*$/ }).click();
    const gewaehlt = await beantworteAlle(page);

    await expect(page.getByText('Modul bestanden!')).toBeVisible();
    await expect(page.getByText(`${FIXTURE_FRAGEN.length} von ${FIXTURE_FRAGEN.length} richtig`)).toBeVisible();

    // Der Client schickt genau die gewaehlten Antworten mit dem Token der Ziehung.
    expect(pruefung.eingereicht).toEqual([{ modul: 'bronze', token: MOCK_TOKEN, antworten: gewaehlt }]);

    const progress = await fortschritt(page);
    expect(progress.bestandene_module).toContain('bronze');
    expect(progress.quiz_scores.bronze).toBe(FIXTURE_FRAGEN.length);
    expect(progress.badges).toContain('Glut-Lehrling');
    expect(progress.streak_count).toBe(1);
  });

  test('Quiz: nicht bestandene Pruefung setzt die Serie zurueck und verbucht nichts', async ({ page }) => {
    await seedeFortschritt(page, { streak_count: 4 });
    await mockPruefung(page, { bestanden: false });
    await page.getByRole('button', { name: /^.*Quiz.*$/ }).click();
    await beantworteAlle(page);

    await expect(page.getByText('Noch nicht bestanden')).toBeVisible();
    await expect(page.getByText(/du brauchst mindestens 4/)).toBeVisible();
    // Nachlesen: jede falsche Frage mit Erklaerung aus der Server-Antwort.
    await expect(page.getByText('Nachlesen')).toBeVisible();
    await expect(page.getByText(/Erklaerung zu Frage 3/)).toBeVisible();

    const progress = await fortschritt(page);
    expect(progress.streak_count).toBe(0);
    expect(progress.bestandene_module).not.toContain('bronze');
    expect(progress.badges).not.toContain('Glut-Lehrling');
  });

  test('Quiz: jede bestandene Pruefung erhoeht die Serie um genau 1', async ({ page }) => {
    await seedeFortschritt(page, { streak_count: 2 });
    await mockPruefung(page, { bestanden: true });
    await page.getByRole('button', { name: /^.*Quiz.*$/ }).click();

    // Waehrend der Pruefung aendert sich die Serie nicht — gezaehlt wird am Ende.
    await page.getByRole('button', { name: new RegExp(FIXTURE_FRAGEN[0].options[0]) }).click();
    expect((await fortschritt(page)).streak_count).toBe(2);
    await page.getByRole('button', { name: /Nächste Frage/ }).click();
    for (let i = 1; i < FIXTURE_FRAGEN.length; i++) {
      await page.getByRole('button', { name: new RegExp(FIXTURE_FRAGEN[i].options[0]) }).click();
      await page.getByRole('button', { name: /Nächste Frage|Abgeben und Ergebnis sehen/ }).click();
    }

    await expect(page.getByText('Modul bestanden!')).toBeVisible();
    expect((await fortschritt(page)).streak_count).toBe(3);
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
