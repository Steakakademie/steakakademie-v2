// ESLint Flat Config (Next 16, 17.09.2026)
// ========================================
// `next lint` gibt es seit Next 16 nicht mehr, `next build` lintet nicht mehr —
// Linting laeuft nur noch ueber `npm run lint` (= `eslint .`). Die alte
// .eslintrc.json ("extends: next/core-web-vitals") ist hierhin umgezogen;
// ESLint 10 liest das Legacy-Format nicht mehr (und ESLint 10 selbst ist mit
// dem in eslint-config-next gebuendelten eslint-plugin-react noch inkompatibel —
// deshalb bleibt ESLint auf 9.x gepinnt).
//
// Geltungsbereich wie frueher bei `next lint`: NUR src/. Alles andere
// (design/, handoff/, scripts/, tools/, video/, Buildausgaben) wurde nie
// gelintet und soll es auch jetzt nicht.
//
// Die mit eslint-config-next 16 neu hinzugekommenen React-Compiler-Regeln
// (set-state-in-effect, static-components, purity, refs) melden ~45 Stellen
// im Bestand. Das sind Refactoring-Hinweise, keine Bugs — bis zur gezielten
// Bereinigung als Warnung, nicht als Fehler (sonst ist `npm run lint` fuer
// echte Fehler unbrauchbar). Beim Aufraeumen einzeln wieder auf 'error'.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  globalIgnores(['*', '!src', '!src/**']),
  {
    files: ['src/**/*.{js,jsx,mjs,ts,tsx}'],
    extends: [...nextCoreWebVitals],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
]);
