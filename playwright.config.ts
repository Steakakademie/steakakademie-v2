import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Config — Steakakademie
 * Default: lokaler Dev-Server, chromium-only, sequenziell.
 *
 * Unter CI (.github/workflows/e2e.yml, `CI=true` setzt GitHub Actions selbst):
 * getestet wird der Produktions-Build per `next start` — derselbe Stand, den
 * Vercel ausliefert, nicht der Dev-Server. Der Workflow baut vorher.
 */
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  fullyParallel: false,
  workers: 1,
  retries: 0,
  // Ein vergessenes test.only liesse in CI still den Rest der Suite aus.
  forbidOnly: CI,
  // results.json speist die Zahlen im Job-Summary (e2e.yml) — gruen ohne Zahl
  // waere kein Ergebnis (CLAUDE.md §2 Regel 10).
  reporter: CI
    ? [['list'], ['github'], ['html', { open: 'never' }], ['json', { outputFile: 'playwright-report/results.json' }]]
    : [['list']],

  use: {
    baseURL: 'http://localhost:3000',
    // Consent-Banner vorab entschieden (abgelehnt): Sonst ueberdeckt das fixed
    // positionierte Banner untere Seitenbereiche, Hover/Click laufen in Timeouts
    // und sehen aus wie Regressionen (Befund 02.09.2026). Details und Ausnahme
    // fuer Banner-Tests: tests/e2e/helpers/consent.ts
    storageState: 'tests/e2e/fixtures/consent-declined.storage.json',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 5_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    // Kaltstart nach sauberem Build (ohne .next-Cache) braucht deutlich laenger als 2 min.
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
