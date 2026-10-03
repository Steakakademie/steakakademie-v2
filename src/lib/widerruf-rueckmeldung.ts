import { KONTAKT_EMPFAENGER } from '@/lib/kontakt';

/**
 * Was das Widerrufsformular nach dem Absenden zur Eingangsbestätigung sagt.
 *
 * Bis 03.10.2026 stand in jedem Fall ohne versandte Mail: „Eine
 * Eingangsbestätigung folgt per E-Mail." Das stimmt mit /api/widerruf nicht
 * überein. Die Route meldet `emailSent: false` in zwei Lagen, und in keiner
 * folgt von selbst noch eine Mail:
 *   - Es wurde keine E-Mail-Adresse angegeben (Identifikation nur über die
 *     Bestell-/Vertragsnummer) — dann gibt es keine Adresse, an die bestätigt
 *     werden könnte.
 *   - Die Adresse ist da, aber der Versand kam nicht zustande (Vorlage fehlt,
 *     Dienst lehnt ab oder ist nicht erreichbar). Ein zweiter Versuch findet
 *     nicht statt.
 * Der Text sagt deshalb, was passiert ist, und nennt den Weg, der bleibt.
 *
 * Eigene Datei, damit Vitest die Auswahl prüfen kann
 * (src/__tests__/widerruf-rueckmeldung.test.ts).
 */

/** Dieselbe Prüfung wie in /api/widerruf (`emailOk`). */
export function istEmailAdresse(wert: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wert.trim());
}

export type BestaetigungsLage = 'gesendet' | 'keine-adresse' | 'nicht-gesendet';

export function bestaetigungsLage(o: { emailSent: boolean; email: string }): BestaetigungsLage {
  if (o.emailSent) return 'gesendet';
  return istEmailAdresse(o.email) ? 'nicht-gesendet' : 'keine-adresse';
}

export const BESTAETIGUNGS_TEXT: Record<BestaetigungsLage, string> = {
  gesendet: 'Eine elektronische Eingangsbestätigung haben wir dir per E-Mail gesendet.',
  'keine-adresse':
    'Du hast keine E-Mail-Adresse angegeben — eine Eingangsbestätigung per E-Mail können wir dir deshalb nicht schicken. ' +
    `Bitte notiere dir Datum und Uhrzeit als Nachweis. Möchtest du eine Bestätigung per E-Mail, schreib an ${KONTAKT_EMPFAENGER} und nenne deine Bestell-/Vertragsnummer.`,
  'nicht-gesendet':
    'Die automatische Eingangsbestätigung per E-Mail konnte gerade nicht verschickt werden. ' +
    `Bitte notiere dir Datum und Uhrzeit als Nachweis. Brauchst du eine Bestätigung per E-Mail, schreib an ${KONTAKT_EMPFAENGER}.`,
};
