/**
 * Cloudflare Turnstile — serverseitige Token-Prüfung.
 *
 * Turnstile ist ein eigenständiges, kostenloses Widget (dashboard.cloudflare.com →
 * Turnstile). Es braucht KEINE DNS-Umstellung auf Cloudflare — die Domain bleibt,
 * wo sie ist. Der Browser holt sich ein Token, der Server fragt bei Cloudflare
 * nach, ob das Token echt ist.
 *
 * Env:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  — Site-Key, landet im Browser (Widget)
 *   TURNSTILE_SECRET_KEY            — Secret, nur hier auf dem Server
 *
 * Verhalten ohne Secret: Prüfung wird übersprungen (Rückgabe `skipped`). So
 * laufen Dev, Preview und ein Rollout ohne gesetzte Variablen weiter wie bisher —
 * und das Widget rendert ohne Site-Key gar nicht erst (Turnstile.tsx).
 *
 * Fail-open bei Netzfehlern: Erreicht der Server Cloudflare nicht, wird die
 * Anfrage durchgelassen und der Fehler geloggt. Ein Ausfall bei Cloudflare darf
 * das Kontaktformular nicht lahmlegen — die Honeypots und Rate-Limits greifen
 * weiterhin. Ein ausdrückliches `success: false` von Cloudflare bleibt eine
 * Ablehnung.
 */

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileVerdict =
  | { ok: true; skipped: boolean }
  | { ok: false; reason: 'missing-token' | 'rejected' };

export function turnstileAktiv(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(token: string | undefined | null, ip?: string): Promise<TurnstileVerdict> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };

  const t = String(token ?? '').trim();
  // Cloudflare-Tokens sind bis 2048 Zeichen lang.
  if (!t || t.length > 2048) return { ok: false, reason: 'missing-token' };

  const form = new URLSearchParams({ secret, response: t });
  if (ip && ip !== 'unknown') form.set('remoteip', ip);

  try {
    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error('[turnstile] siteverify HTTP', res.status);
      return { ok: true, skipped: true }; // fail-open, siehe Kopf
    }
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (data.success === true) return { ok: true, skipped: false };
    console.warn('[turnstile] abgelehnt', data['error-codes'] ?? []);
    return { ok: false, reason: 'rejected' };
  } catch (e) {
    console.error('[turnstile] siteverify nicht erreichbar', e);
    return { ok: true, skipped: true }; // fail-open
  }
}

export const TURNSTILE_FEHLER_TEXT =
  'Die Sicherheitsprüfung ist fehlgeschlagen. Bitte lade die Seite neu und versuch es noch einmal.';
