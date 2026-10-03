import { NextRequest, NextResponse } from 'next/server';
import { doiSecret, verifyDOIToken } from '@/lib/doi';
import { NEWSLETTER_CONSENT_HISTORY, NEWSLETTER_CONSENT_VERSION } from '@/lib/newsletter-consent';

/**
 * GET /api/newsletter/confirm?token=...
 *
 * Double-Opt-In Bestätigungs-Endpoint.
 * - Verifiziert den HMAC-signierten Token aus der Bestätigungs-E-Mail
 * - Prüft Tokenlaufzeit (max. 48 Stunden)
 * - Legt Kontakt in Loops an (subscribed: true)
 * - Leitet auf /newsletter/bestaetigt weiter — mit dem Ergebnis, das wirklich
 *   eingetreten ist (siehe „EHRLICHES ERGEBNIS“ unten)
 *
 * RECHTLICHER HINWEIS:
 * Erst nach erfolgter Bestätigung hier wird der Kontakt in Loops angelegt.
 * Kein Kontakt in der Mailing-Liste ohne nachgewiesene Einwilligung.
 * Konform mit DSGVO Art. 6 Abs. 1 lit. a und UWG § 7 Abs. 2 Nr. 2.
 *
 * BEWEISLAST (ergänzt im Rechts-Audit 28.08.2026):
 * Art. 7 Abs. 1 DSGVO verlangt, dass der Verantwortliche die Einwilligung
 * NACHWEISEN kann. `subscribed: true` allein ist ein Ergebnis, kein Nachweis.
 * Deshalb wird am Kontakt festgeschrieben:
 *   consentVersion · consentText · signupIp · signupAt · confirmIp · doiConfirmedAt
 * Die ersten vier Werte stammen aus dem HMAC-signierten Token und sind seit der
 * Anmeldung nachweislich unverändert.
 *
 * EHRLICHES ERGEBNIS (03.10.2026):
 * Bis dahin leitete die Route IMMER auf `/?newsletter=confirmed` — auch wenn
 * Loops ablehnte, nicht erreichbar war oder der Schlüssel fehlte. Und den
 * Parameter las keine Seite: Erfolg, Fehler und abgelaufener Link sahen alle
 * gleich aus (Startseite, kein Wort). Jetzt gibt es drei Ausgänge:
 *   /newsletter/bestaetigt                   Kontakt ist nachweislich in Loops
 *   /newsletter/bestaetigt?status=ungueltig  Link fehlt, ist gefälscht oder abgelaufen
 *   /newsletter/bestaetigt?status=fehler     technisch gescheitert — der Link bleibt
 *                                            48 h gültig, ein zweiter Klick wiederholt
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://steakakademie.de';
const LOOPS_API_BASE = 'https://app.loops.so/api/v1';
const STANDARD_GRUPPE = 'newsletter';
// Loops darf den Klick nicht in die Funktionsgrenze (30 s) laufen lassen.
const LOOPS_TIMEOUT_MS = 8_000;

function weiter(status?: 'ungueltig' | 'fehler') {
  return NextResponse.redirect(`${APP_URL}/newsletter/bestaetigt${status ? `?status=${status}` : ''}`);
}

export async function GET(req: NextRequest) {
  const rawToken = req.nextUrl.searchParams.get('token');
  if (!rawToken) return weiter('ungueltig');

  // Ohne Schlüssel (Produktion) lässt sich kein Token prüfen. Das ist kein
  // ungültiger Link, sondern ein Fehler auf unserer Seite.
  if (!doiSecret()) return weiter('fehler');

  const payload = verifyDOIToken(rawToken);
  if (!payload) return weiter('ungueltig');

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    // Simulation nur ausserhalb der Produktion — dort wäre „bestätigt“ ohne
    // Kontakt eine Falschmeldung.
    if (process.env.NODE_ENV === 'production') {
      console.error('[Newsletter/Confirm] LOOPS_API_KEY fehlt — Kontakt kann NICHT angelegt werden.');
      return weiter('fehler');
    }
    console.log(`[Newsletter/Confirm] DEV MODE — Kontakt würde angelegt: ${payload.email}`);
    return weiter();
  }

  // ── Einwilligungsnachweis zusammenstellen (Art. 7 Abs. 1 DSGVO) ────────────
  // Alles außer der Bestätigungs-IP stammt aus dem HMAC-signierten Token und ist
  // damit nachweislich unverändert seit der Anmeldung. Der Volltext wird
  // mitgeschrieben, nicht nur die Versions-ID: Das Protokoll muss auch dann noch
  // aussagekräftig sein, wenn dieses Repository nicht mehr vorliegt.
  const confirmIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '';
  const consentVersion = payload.cv ?? NEWSLETTER_CONSENT_VERSION;
  const consentText = NEWSLETTER_CONSENT_HISTORY[consentVersion] ?? '';
  const consentEvidence = {
    consentVersion,
    consentText,
    signupIp: payload.ip ?? '',
    signupAt: new Date(payload.iat).toISOString(),
    confirmIp,
    doiConfirmedAt: new Date().toISOString(),
  };

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
  const userGroup = payload.userGroup ?? STANDARD_GRUPPE;

  // Kontakt in Loops anlegen (subscribed: true — nachgewiesene Einwilligung)
  try {
    const createRes = await fetch(`${LOOPS_API_BASE}/contacts/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: payload.email,
        subscribed: true,
        source: `steakakademie-website-${payload.source ?? 'default'}-doi-confirmed`,
        userGroup,
        ...consentEvidence,
      }),
      signal: AbortSignal.timeout(LOOPS_TIMEOUT_MS),
    });
    if (createRes.ok) return weiter();

    if (createRes.status !== 409) {
      console.error('[Newsletter/Confirm] Loops create error:', createRes.status, (await createRes.text().catch(() => '')).slice(0, 300));
      return weiter('fehler');
    }

    // 409 = Kontakt existiert bereits → update auf subscribed: true.
    // Die Gruppe geht mit, wenn die Anmeldung eine eigene trägt (z. B.
    // `vip_warteliste` von /vip): Vorher fehlte sie hier, und wer schon Kontakt
    // war, landete nie in der Warteliste. Die Standard-Gruppe wird NICHT
    // gesendet — sie würde eine gezielt gesetzte Gruppe des Bestandskontakts
    // überschreiben.
    const updateRes = await fetch(`${LOOPS_API_BASE}/contacts/update`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        email: payload.email,
        subscribed: true,
        ...(userGroup !== STANDARD_GRUPPE ? { userGroup } : {}),
        ...consentEvidence,
      }),
      signal: AbortSignal.timeout(LOOPS_TIMEOUT_MS),
    });
    if (!updateRes.ok) {
      console.error('[Newsletter/Confirm] Loops update error:', updateRes.status, (await updateRes.text().catch(() => '')).slice(0, 300));
      return weiter('fehler');
    }
    return weiter();
  } catch (err) {
    console.error('[Newsletter/Confirm] Loops API error:', err);
    return weiter('fehler');
  }
}
