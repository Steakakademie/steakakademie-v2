/**
 * Anfrage aus der Projekt-Anamnese an /api/kontakt — der Body an EINER Stelle.
 *
 * Herausgezogen am 03.10.2026: Das Formular schickte kein `turnstileToken`.
 * /api/kontakt verlangt eines, sobald TURNSTILE_SECRET_KEY gesetzt ist (in der
 * Produktion seit 01.10.2026) — jede Anfrage endete mit 403. Als eigene
 * Funktion ist der Vertrag mit der Route testbar
 * (src/__tests__/kontakt-route.test.ts); in einer Komponente war er es nicht.
 */

export type AnfrageEingabe = {
  name: string;
  email: string;
  /** Projektakte samt Wunsch (Angebot / Wertgespräch). */
  message: string;
  consent: boolean;
  /** Honeypot — bleibt bei Menschen leer. */
  website: string;
  /** Token des Turnstile-Widgets; leer, solange kein Site-Key gesetzt ist. */
  turnstileToken: string;
};

export function anfrageKoerper(e: AnfrageEingabe) {
  return {
    name: e.name,
    email: e.email,
    subject: 'baukasten' as const,
    message: e.message,
    consent: e.consent,
    website: e.website,
    turnstileToken: e.turnstileToken,
  };
}
