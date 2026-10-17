/**
 * Konstanten des Geräte-Limits — ohne Sentry-Import, damit Client-Seiten
 * (/auth/geraete) sie nutzen können, ohne Sentry in den Browser zu ziehen
 * (Entscheidung 08.09.2026: kein Sentry im Browser). Logik: ./geraete-limit.ts
 */
export const MAX_GERAETE = 2;
export const GERAETE_PFAD = '/auth/geraete';
