/**
 * Double-Opt-In Token Utility
 *
 * Erstellt und verifiziert HMAC-SHA256-signierte DOI-Tokens.
 * Stateless — kein Datenbankzustand nötig.
 */

import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 Stunden

let devWarnungGezeigt = false;

/**
 * Schlüssel der Signatur. Ohne NEWSLETTER_DOI_SECRET: in der Produktion `null`
 * (lieber keine Anmeldung als eine fälschbare), lokal ein Dev-Wert mit Warnung.
 * Vorbild: tokenSecret() in src/lib/diplome/pruefung-token.ts.
 *
 * Bis 03.10.2026 stand hier `process.env.NEWSLETTER_DOI_SECRET ?? 'dev-only-…'`
 * — ein fester Wert im öffentlichen Repo, auch in der Produktion. Fehlte die
 * Variable, konnte jeder ein gültiges Bestätigungs-Token für eine beliebige
 * Adresse bauen und sie ohne deren Zutun in die Liste eintragen. Der
 * Einwilligungsnachweis (Art. 7 Abs. 1 DSGVO) wäre damit wertlos gewesen.
 * Pro Aufruf gelesen, nicht beim Laden des Moduls — ein leerer Wert zählt als
 * fehlend.
 */
export function doiSecret(): string | null {
  const s = process.env.NEWSLETTER_DOI_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV !== 'production') {
    if (!devWarnungGezeigt) {
      devWarnungGezeigt = true;
      console.warn('[doi] Kein NEWSLETTER_DOI_SECRET — unsicherer Dev-Fallback aktiv.');
    }
    return 'dev-only-insecure-secret';
  }
  console.error('[doi] NEWSLETTER_DOI_SECRET fehlt — DOI-Tokens werden weder erzeugt noch angenommen.');
  return null;
}

export interface TokenPayload {
  email: string;
  iat: number;
  source?: string;
  userGroup?: string;
  /** ID der Einwilligungsfassung (siehe @/lib/consent). Beweis: worin wurde eingewilligt? */
  cv?: string;
  /** IP-Adresse zum Zeitpunkt der Anmeldung. Beweis: wer hat angefordert? */
  ip?: string;
}

/**
 * Erstellt einen signierten, zeitgestempelten DOI-Token.
 * Format: base64url(JSON{email,iat,source?,userGroup?}) + "." + HMAC-SHA256-Signatur
 * Gültig für 48 Stunden.
 *
 * A2-Fix (16.08.2026): source/userGroup wandern MIT in den Token. Vorher gingen
 * sie beim Confirm verloren — jeder Kontakt landete als "default" in Gruppe
 * "newsletter", die Quellen-Segmentierung (Plausible-Vergleich der 8 Block-A-
 * Sammelpunkte) war damit blind.
 *
 * `null`, wenn in der Produktion kein Schlüssel gesetzt ist (siehe doiSecret) —
 * der Aufrufer antwortet dann mit 503, statt eine Mail mit fälschbarem Link zu
 * verschicken.
 */
export function createDOIToken(
  email: string,
  source?: string,
  userGroup?: string,
  consentVersion?: string,
  signupIp?: string,
): string | null {
  const secret = doiSecret();
  if (!secret) return null;
  const payload = Buffer.from(
    JSON.stringify({
      email: email.toLowerCase().trim(),
      iat: Date.now(),
      ...(source ? { source } : {}),
      ...(userGroup ? { userGroup } : {}),
      // Rechts-Audit 28.08.2026 — Beweislast nach Art. 7 Abs. 1 DSGVO.
      // Einwilligungsfassung und Anmelde-IP reisen signiert im Token mit und
      // werden beim Confirm am Kontakt festgeschrieben. Der HMAC schützt sie
      // vor nachträglicher Veränderung: Ein manipuliertes Protokoll wäre als
      // Beweismittel wertlos.
      ...(consentVersion ? { cv: consentVersion } : {}),
      ...(signupIp ? { ip: signupIp } : {}),
    }),
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/**
 * Verifiziert einen DOI-Token zeitkonstant.
 * Gibt das Payload-Objekt zurück oder null bei Ungültigkeit — auch dann, wenn
 * in der Produktion kein Schlüssel gesetzt ist. Wer „Link ungültig“ von
 * „Server nicht eingerichtet“ unterscheiden muss, fragt vorher doiSecret().
 */
export function verifyDOIToken(token: string): TokenPayload | null {
  const secret = doiSecret();
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  // HMAC prüfen (timing-safe)
  const expectedSig = createHmac('sha256', secret).update(payloadB64).digest('base64url');
  try {
    const sigBuf = Buffer.from(sig, 'base64url');
    const expectedBuf = Buffer.from(expectedSig, 'base64url');
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  // Payload dekodieren und Laufzeit prüfen
  try {
    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8'),
    );
    if (!payload.email || typeof payload.iat !== 'number') return null;
    if (Date.now() - payload.iat > TOKEN_MAX_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}
