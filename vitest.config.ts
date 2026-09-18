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
  },
});
