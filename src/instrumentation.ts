/**
 * Next.js Instrumentation-Hook — laedt die passende Sentry-Konfiguration.
 *
 * Next ruft register() genau einmal beim Start jeder Runtime auf (Node und
 * Edge getrennt) — vor dem ersten Request. Seit Next 15 stabil und immer
 * aktiv (bis Next 14 brauchte es experimental.instrumentationHook).
 *
 * onRequestError (Next 15+): Fehler aus Server Components, Route Handlers
 * und dem Proxy landen ueber diesen Hook in Sentry — ohne ihn sieht das
 * Server-SDK unter Next 15/16 nur, was es selbst wrappt.
 *
 * UMSTELLUNG 21.08.2026: vorher @vercel/otel (registerOTel) → jetzt Sentry.
 * Sentry registriert dabei selbst einen OpenTelemetry-TracerProvider, d. h.
 * das AI SDK (trace.getTracer('ai')) findet weiterhin einen echten Tracer —
 * die experimental_telemetry-Spans aus src/app/api/chat/route.ts landen nun
 * in Sentry statt in der Vercel-Observability. Grund der Umstellung:
 * Sentry ALARMIERT bei neuen Fehlern (E-Mail beim ersten Auftreten) und
 * sieht auch Browser-Fehler; die Vercel-Ansicht musste man aktiv besuchen
 * und sah nur den Server. @vercel/otel ist entfernt — zwei parallele
 * Telemetrie-Systeme hiessen doppelte Spans und zwei DSE-Eintraege.
 */
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
