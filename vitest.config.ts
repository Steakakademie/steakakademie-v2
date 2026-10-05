import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // `server-only` ist ein Next-interner Alias, kein installiertes Paket —
    // siehe src/__tests__/stubs/server-only.ts.
    alias: { 'server-only': fileURLToPath(new URL('./src/__tests__/stubs/server-only.ts', import.meta.url)) },
  },
  test: {
    environment: 'node',
    // scripts/ ist mit drin, seit die Ops-Hook-Eskalation testbare Logik hat
    // (02.09.2026). Ohne diese Zeile laeuft scripts/*.test.mjs nicht mit.
    include:     ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    // Der Standard von 5 s reicht nicht fuer Tests, die den ganzen Inhaltsbestand
    // einlesen (pruefstand.test.mjs: rund 400 .mdx). Lokal auf Windows unter Last lief
    // er in die Zeitgrenze (05.10.2026), einzeln und in der CI war er gruen — ein
    // Lastproblem, kein Inhaltsfehler. Ein rotes Signal ohne Befund lehrt, Rot zu ignorieren.
    testTimeout: 30_000,
  },
});
