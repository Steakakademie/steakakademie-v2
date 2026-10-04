/**
 * Anmeldung an /api/newsletter — der Body an EINER Stelle (03.10.2026).
 *
 * Anlass: Das Relaunch-Formular (src/components/relaunch/SpickzettelForm.tsx)
 * schickte kein `turnstileToken`. /api/newsletter verlangt eines, sobald
 * TURNSTILE_SECRET_KEY gesetzt ist — jede Anmeldung über den Relaunch-Fuß
 * endete dann mit 403. Als eigene Funktion ist der Vertrag mit der Route
 * testbar (src/__tests__/newsletter-anmeldung.test.ts); in einer Komponente
 * war er es nicht. Gleiches Muster wie src/lib/baukasten/anfrage.ts.
 */
import { NEWSLETTER_CONSENT_VERSION } from '@/lib/newsletter-consent';

export type AnmeldungEingabe = {
  email: string;
  /** Herkunft des Formulars — in Loops getrennt auszählbar. */
  source: string;
  /** Honeypot — bleibt bei Menschen leer. */
  website: string;
  /** Token des Turnstile-Widgets; leer, solange kein Site-Key gesetzt ist. */
  turnstileToken: string;
};

export function anmeldungKoerper(e: AnmeldungEingabe) {
  return {
    email: e.email.trim(),
    source: e.source,
    website: e.website,
    // Schlüssel, mit dem sich später belegen lässt, WORIN eingewilligt wurde.
    consentVersion: NEWSLETTER_CONSENT_VERSION,
    turnstileToken: e.turnstileToken,
  };
}
