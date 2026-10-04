import { defineConfig, devices } from '@playwright/test';

/**
 * Funktionsproben gegen die Live-Seite — Abteilung Systems & Ops (03.10.2026).
 *
 * Getrennt von playwright.config.ts (tests/e2e): Die E2E-Suite prüft einen
 * frischen Build ohne Env, die Proben prüfen die PRODUKTION, wie ein Besucher
 * sie sieht. Hier startet deshalb kein Server.
 *
 * Aufruf:   npm run proben
 * Ziel:     BASE_URL, Standard https://steakakademie.de
 * Workflow: .github/workflows/funktionsproben.yml (täglich)
 *
 * Zwei Projekte, damit das Job-Summary beide Gruppen getrennt zählt:
 *   anonym      — immer; nur lesen, kein Formular wird abgesendet
 *   angemeldet  — nur mit PROBE_EMAIL und PROBE_PASSWORD (gekennzeichnetes
 *                 Testkonto); ohne die beiden werden die Proben ausgesetzt
 *
 * Sanft zur Produktion: ein Worker, nacheinander. Ein Wiederholungsversuch in
 * CI fängt einen Netz-Schluckauf ab; was erst im zweiten Anlauf besteht,
 * zählt das Summary als „wackelig" und nennt es beim Namen.
 */
const CI = !!process.env.CI;
const BASE_URL = (process.env.BASE_URL || 'https://steakakademie.de').replace(/\/+$/, '');

// Nur für Umgebungen, in denen der zur Playwright-Version passende Browser
// nicht installiert werden kann: Pfad zu einem vorhandenen Chromium.
const CHROMIUM = process.env.PROBE_CHROMIUM_PATH;
// Ausgehender Verkehr über einen Proxy (HTTPS_PROXY), falls die Umgebung einen vorschreibt.
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;

export default defineConfig({
  testDir: './tests/proben',
  outputDir: 'test-results/proben',
  timeout: 60_000,
  expect: { timeout: 10_000 },

  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  forbidOnly: CI,
  // results.json speist die Zahlen im Job-Summary — grün ohne Zahl wäre kein
  // Ergebnis (CLAUDE.md §2 Regel 10). Auswertung: scripts/proben-summary.mjs
  reporter: [['list'], ['json', { outputFile: 'playwright-report/proben-results.json' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    ...(PROXY ? { proxy: { server: PROXY } } : {}),
    ...(CHROMIUM ? { launchOptions: { executablePath: CHROMIUM } } : {}),
  },

  projects: [
    {
      name: 'anonym',
      testMatch: /anonym\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'angemeldet',
      testMatch: /angemeldet\.spec\.ts$/,
      // Öffentliches Repo: keine Traces und keine Screenshots einer Sitzung —
      // sie enthielten Sitzungs-Token und die Adresse des Testkontos.
      use: { ...devices['Desktop Chrome'], trace: 'off', screenshot: 'off' },
    },
  ],
});
