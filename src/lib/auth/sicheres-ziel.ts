/**
 * Weiterleitungsziel nach der Anmeldung — nur interne Pfade (03.10.2026).
 *
 * Anlass: /auth/callback baute `${origin}${next}` per String-Verkettung und
 * nahm `next` ungeprueft aus der URL. `next=@evil.example` ergibt
 * `https://steakakademie.de@evil.example` — der eigene Host wird zum
 * Benutzernamen, das Ziel ist der fremde Host. `next=.evil.example` haengt
 * sich als Subdomain-Endung an. Ein Anmeldelink von uns haette so auf eine
 * fremde Seite gefuehrt (offene Weiterleitung, Phishing mit echter Absender-
 * Domain). Auf der Login-Seite landete derselbe Wert in `window.location.href`
 * — dort waere auch `javascript:` gelaufen.
 *
 * Regel: Ein Ziel gilt nur, wenn es
 *   1. mit GENAU einem `/` beginnt (`//host` ist protokoll-relativ),
 *   2. keinen Backslash enthaelt (Browser lesen `/\host` wie `//host`),
 *   3. keine Steuerzeichen enthaelt (der URL-Parser streicht Tab und
 *      Zeilenumbruch — aus `/<TAB>/host` wuerde `//host`),
 *   4. aufgeloest gegen den eigenen Origin beim eigenen Origin bleibt (Netz
 *      unter 1–3: nach ihnen ist kein Fall bekannt, der hier noch haengen
 *      bleibt — die Pruefung fragt aber den Parser selbst statt unser Bild
 *      von ihm und kostet nichts),
 *   5. auch NACH dem Aufloesen nicht mit `//` beginnt. Der Parser kuerzt
 *      Punkt-Segmente: aus `/..//host` und `/%2e%2e//host` wird der Pfad
 *      `//host`. Als URL-Objekt harmlos (der Host bleibt unserer), als
 *      Zeichenkette in `window.location.href` aber wieder ein fremder Host.
 * Alles andere faellt auf das Standardziel zurueck — ohne Fehlermeldung, die
 * Anmeldung selbst war ja erfolgreich.
 *
 * Bewusst KEIN 'use client' und kein 'server-only': Route, Login-Seite und
 * OAuth-Buttons nutzen dieselbe Funktion (CLAUDE.md A: gemeinsam genutzte
 * Logik nie in ein 'use client'-Modul). Waechter:
 * src/__tests__/sicheres-ziel.test.ts.
 */

/** Wohin es geht, wenn kein oder kein zulaessiges Ziel mitkommt. */
export const STANDARD_ZIEL = '/diplome/profil';

/**
 * Pruef-Origin fuer Aufrufer ohne eigenen Origin (Client-Bauteile waehrend des
 * Server-Renderings haben kein `window`). Das Urteil haengt nicht am Wert: ein
 * Pfad, der die Regeln 1–3 und 5 besteht, bleibt bei JEDEM Origin intern.
 */
const PRUEF_ORIGIN = 'https://steakakademie.de';

// Steuerzeichen U+0000–U+001F und U+007F.
const STEUERZEICHEN = /[\u0000-\u001f\u007f]/;

function pruefe(ziel: unknown, origin: string): URL | null {
  if (typeof ziel !== 'string' || ziel.length === 0) return null;
  if (ziel[0] !== '/' || ziel[1] === '/') return null;
  if (ziel.includes('\\') || STEUERZEICHEN.test(ziel)) return null;
  try {
    const basis = new URL(origin).origin;
    const url = new URL(ziel, basis);
    if (url.origin !== basis || url.pathname.startsWith('//')) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Ziel als URL-Objekt beim eigenen Origin — fuer `NextResponse.redirect(...)`.
 * Nie wieder `${origin}${ziel}`: Weitergeleitet wird mit dem, was der Parser
 * als Ziel versteht, nicht mit dem, was die Zeichenkette zu sein scheint.
 */
export function sicheresZielUrl(
  ziel: string | null | undefined,
  origin: string,
  standard: string = STANDARD_ZIEL,
): URL {
  return pruefe(ziel, origin) ?? new URL(standard, new URL(origin).origin);
}

/**
 * Ziel als interner Pfad (Pfad + Query + Fragment) — fuer Client-Bauteile
 * (`window.location.href`, `?next=`-Parameter).
 */
export function sicheresZiel(
  ziel: string | null | undefined,
  origin: string = PRUEF_ORIGIN,
  standard: string = STANDARD_ZIEL,
): string {
  const url = pruefe(ziel, origin);
  return url ? `${url.pathname}${url.search}${url.hash}` : standard;
}
