import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signiertes Ziehungs-Token der Stufenpruefung (Rahmenlehrplan §8, 08.09.2026).
 *
 * Der Server zieht Fragen aus dem Pool und haelt genau diese Ziehung in einem
 * HMAC-signierten Token fest; die Bewertung gilt nur fuer dieses Token. So
 * kann sich der Browser weder Fragen aussuchen noch eine fremde Ziehung
 * einreichen. Zustandslos: kein Tabelleneintrag, kein Aufraeumen.
 */

export type Ziehung = { m: string; ids: string[]; exp: number };

export const TOKEN_TTL_MS = 30 * 60 * 1000;

/**
 * Eigenes Secret bevorzugt; das DOI-Secret als Rueckfall, weil es in jeder
 * Umgebung gesetzt sein muss. Ohne beides: in der Produktion null (lieber keine
 * Pruefung als eine faelschbare), lokal ein Dev-Wert mit Warnung.
 */
export function tokenSecret(): string | null {
  const s = process.env.DIPLOM_PRUEFUNG_SECRET || process.env.NEWSLETTER_DOI_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[diplome/pruefung] Kein DIPLOM_PRUEFUNG_SECRET — unsicherer Dev-Fallback aktiv.');
    return 'dev-only-pruefung-secret-nicht-fuer-produktion';
  }
  console.error('[diplome/pruefung] DIPLOM_PRUEFUNG_SECRET fehlt — Pruefung deaktiviert.');
  return null;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

export function signiereZiehung(z: Ziehung, secret: string): string {
  const payload = b64url(Buffer.from(JSON.stringify(z), 'utf8'));
  const sig = b64url(createHmac('sha256', secret).update(payload).digest());
  return `${payload}.${sig}`;
}

export function pruefeZiehung(token: string, secret: string): Ziehung | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const erwartet = b64url(createHmac('sha256', secret).update(payload).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(erwartet);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const z = JSON.parse(fromB64url(payload).toString('utf8')) as Partial<Ziehung>;
    if (typeof z.m !== 'string' || !Array.isArray(z.ids) || typeof z.exp !== 'number') return null;
    if (!z.ids.every((id) => typeof id === 'string')) return null;
    if (z.exp < Date.now()) return null;
    return { m: z.m, ids: z.ids as string[], exp: z.exp };
  } catch {
    return null;
  }
}
