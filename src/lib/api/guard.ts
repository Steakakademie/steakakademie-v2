/**
 * Zentraler Guard für öffentliche KI-/Daten-Endpunkte.
 *
 * Schutzschichten (in dieser Reihenfolge, jede bricht früh ab):
 *   1. Herkunft   — Browser-Aufrufe müssen same-origin sein (Origin/Host-Abgleich,
 *                   Sec-Fetch-Site). Stoppt Cross-Site-Missbrauch und naive Skripte.
 *   2. Rate-Limit — Fixed-Window pro IP + Endpunkt-Schlüssel.
 *   3. Body       — Content-Type, Größenlimit, JSON-Parse, Zod-Schema.
 *   4. Auth       — optional: eingeloggter Supabase-Nutzer ODER Admin-Cookie.
 *   5. Bots       — optional: Honeypot-Feld (still verwerfen) und Cloudflare-
 *                   Turnstile-Token (src/lib/api/turnstile.ts), seit 01.10.2026.
 *
 * Läuft in Edge- und Node-Runtime (nur Web-APIs, kein next/headers).
 *
 * Ehrliche Grenze des Rate-Limits: Der Zähler lebt IM PROZESS. Auf Vercel ist
 * das pro Serverless-Instanz bzw. Edge-Isolate — ein Angreifer, der auf mehrere
 * Instanzen verteilt wird, sieht ein entsprechend höheres Gesamtlimit. Für
 * Token-Verschwendung durch Einzelclients und Skript-Schleifen reicht das;
 * für harte Garantien muss ein geteilter Store (Upstash/Redis) hinter
 * `RateLimiter` gesteckt werden — die Schnittstelle ist dafür vorbereitet.
 */

import { createServerClient } from '@supabase/ssr';
import type { z } from 'zod';
import { istAdminPasswort } from '@/lib/admin-auth';
import { TURNSTILE_FEHLER_TEXT, verifyTurnstile } from '@/lib/api/turnstile';

// ─── Typen ───────────────────────────────────────────────────────────────────

export type RateLimitRule = {
  /** Max. Requests pro Fenster. */
  limit: number;
  /** Fensterlänge in Millisekunden. */
  windowMs: number;
};

export type GuardOptions<S extends z.ZodTypeAny> = {
  /** Endpunkt-Schlüssel — trennt die Zähler verschiedener Routen. */
  key: string;
  rate: RateLimitRule;
  /** Zod-Schema für den JSON-Body. */
  schema: S;
  /** Max. Body-Größe in Bytes (Default 16 KiB). */
  maxBodyBytes?: number;
  /** Same-Origin erzwingen (Default true). Nur für reine Server-zu-Server-Routen abschalten. */
  requireSameOrigin?: boolean;
  /** Zusätzlich Login (Supabase-Session) oder Admin-Cookie verlangen. */
  auth?: 'none' | 'user-or-admin' | 'admin';
  /**
   * Name eines Honeypot-Felds im Body (z. B. 'website'). Ist es befüllt, war es
   * ein Bot: Er bekommt ein freundliches `{ ok: true }` mit 200 — und nichts
   * passiert. Geprüft VOR dem Zod-Schema, damit ein striktes Schema das Feld
   * nicht erst wegfiltert. Eine Fehlermeldung würde nur die Falle verraten.
   */
  honeypot?: string;
  /**
   * Cloudflare-Turnstile-Token aus `body.turnstileToken` prüfen. Ohne
   * TURNSTILE_SECRET_KEY wird übersprungen (Rollout ohne Variablen bleibt
   * unverändert). Das Feld wird vor dem Zod-Schema entfernt.
   */
  turnstile?: boolean;
};

export type GuardResult<T> =
  | { ok: true; body: T; ip: string; principal: Principal }
  | { ok: false; response: Response };

export type Principal =
  | { kind: 'anonymous' }
  | { kind: 'user'; userId: string }
  | { kind: 'admin' };

// ─── Antwort-Helfer ──────────────────────────────────────────────────────────

export function jsonError(status: number, error: string, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

// ─── IP ──────────────────────────────────────────────────────────────────────

export function clientIp(req: Request): string {
  // Vercel setzt x-real-ip; x-forwarded-for ist Client-first.
  return (
    req.headers.get('x-real-ip')?.trim() ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// ─── Herkunft ────────────────────────────────────────────────────────────────

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try { return new URL(value).host.toLowerCase(); } catch { return null; }
}

/**
 * Same-Origin-Prüfung ohne feste Domain: Origin-Host muss dem Request-Host
 * entsprechen (funktioniert für Produktion, Preview-Deployments und localhost).
 * Requests ohne Origin (curl, Server-Skripte) werden abgelehnt — genau die
 * Klasse, die diese Endpunkte nicht bedienen sollen.
 */
export function isSameOrigin(req: Request): boolean {
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite === 'same-origin') return true;
  if (fetchSite === 'cross-site') return false;

  const origin = hostOf(req.headers.get('origin'));
  if (!origin) return false;
  const host =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim().toLowerCase() ||
    req.headers.get('host')?.toLowerCase() ||
    hostOf(req.url);
  return host !== null && origin === host;
}

// ─── Rate-Limit ──────────────────────────────────────────────────────────────

type Entry = { count: number; resetAt: number };

export type RateLimitVerdict = { allowed: boolean; remaining: number; retryAfterSecs: number };

/** Fixed-Window-Limiter. Austauschbar gegen einen geteilten Store (gleiche Schnittstelle). */
export class RateLimiter {
  private store = new Map<string, Entry>();
  private lastSweep = 0;

  check(key: string, rule: RateLimitRule, now = Date.now()): RateLimitVerdict {
    this.sweep(now);
    const entry = this.store.get(key);
    if (!entry || entry.resetAt <= now) {
      this.store.set(key, { count: 1, resetAt: now + rule.windowMs });
      return { allowed: true, remaining: rule.limit - 1, retryAfterSecs: 0 };
    }
    entry.count += 1;
    const retryAfterSecs = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    if (entry.count > rule.limit) {
      return { allowed: false, remaining: 0, retryAfterSecs };
    }
    return { allowed: true, remaining: rule.limit - entry.count, retryAfterSecs };
  }

  /** Abgelaufene Einträge höchstens einmal pro Minute räumen — begrenzt den Speicher. */
  private sweep(now: number): void {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    this.store.forEach((e, k) => { if (e.resetAt <= now) this.store.delete(k); });
  }
}

const limiter = new RateLimiter();

export function rateLimitHeaders(rule: RateLimitRule, v: RateLimitVerdict): Record<string, string> {
  const h: Record<string, string> = {
    'X-RateLimit-Limit': String(rule.limit),
    'X-RateLimit-Remaining': String(v.remaining),
  };
  if (!v.allowed) h['Retry-After'] = String(v.retryAfterSecs);
  return h;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

function parseCookies(header: string | null): { name: string; value: string }[] {
  if (!header) return [];
  return header.split(';').flatMap((part) => {
    const idx = part.indexOf('=');
    if (idx < 0) return [];
    const name = part.slice(0, idx).trim();
    if (!name) return [];
    let value = part.slice(idx + 1).trim();
    try { value = decodeURIComponent(value); } catch { /* roh lassen */ }
    return [{ name, value }];
  });
}

/**
 * Admin-Cookie-Schema wie in /api/admin/*: admin_auth === ADMIN_PASSWORD.
 *
 * Der Vergleich selbst steht in src/lib/admin-auth.ts und NUR dort
 * (CLAUDE.md, Abschnitt „Admin-Erkennung"). Bis 11.09.2026 lag hier eine
 * zweite, eigene Fassung. Sie war nicht offen — das `if (!expected) return
 * false` fing den `undefined === undefined`-Fall ab —, aber sie war die
 * siebte Stelle einer Regel, die genau eine haben soll: Wer die Pruefung
 * spaeter haertet, haette sie hier uebersehen.
 *
 * istAdminPasswort liest nur process.env und laeuft damit auch im
 * Edge-Runtime — die Zusage im Kopf dieser Datei bleibt gueltig.
 */
export function isAdminRequest(req: Request): boolean {
  const cookie = parseCookies(req.headers.get('cookie')).find((c) => c.name === 'admin_auth');
  return istAdminPasswort(cookie?.value);
}

/** Eingeloggter Supabase-Nutzer aus den Request-Cookies (read-only, kein Refresh-Write). */
export async function userIdFromRequest(req: Request): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => parseCookies(req.headers.get('cookie')),
        setAll: () => { /* Route Handler: Session-Refresh übernimmt die Middleware */ },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function resolvePrincipal(req: Request, mode: NonNullable<GuardOptions<z.ZodTypeAny>['auth']>): Promise<Principal | null> {
  if (mode === 'none') return { kind: 'anonymous' };
  if (isAdminRequest(req)) return { kind: 'admin' };
  if (mode === 'admin') return null;
  const userId = await userIdFromRequest(req);
  return userId ? { kind: 'user', userId } : null;
}

// ─── Haupt-Guard ─────────────────────────────────────────────────────────────

export async function guardRequest<S extends z.ZodTypeAny>(
  req: Request,
  opts: GuardOptions<S>,
): Promise<GuardResult<z.infer<S>>> {
  const { key, rate, schema, maxBodyBytes = 16 * 1024, requireSameOrigin = true, auth = 'none', honeypot, turnstile = false } = opts;

  // 1) Herkunft
  if (requireSameOrigin && !isSameOrigin(req)) {
    return { ok: false, response: jsonError(403, 'Aufruf nur von steakakademie.de aus möglich.') };
  }

  // 2) Rate-Limit (vor dem Body-Lesen — kein Parsing für gesperrte Clients)
  const ip = clientIp(req);
  const verdict = limiter.check(`${key}:${ip}`, rate);
  const rlHeaders = rateLimitHeaders(rate, verdict);
  if (!verdict.allowed) {
    return {
      ok: false,
      response: jsonError(429, `Zu viele Anfragen — bitte in ${verdict.retryAfterSecs} s erneut versuchen.`, rlHeaders),
    };
  }

  // 3) Auth (vor dem Body — kein Parsing für Unbefugte)
  const principal = await resolvePrincipal(req, auth);
  if (!principal) {
    return { ok: false, response: jsonError(401, 'Anmeldung erforderlich.', rlHeaders) };
  }

  // 4) Body
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return { ok: false, response: jsonError(415, 'Content-Type application/json erwartet.', rlHeaders) };
  }
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > maxBodyBytes) {
    return { ok: false, response: jsonError(413, 'Anfrage zu groß.', rlHeaders) };
  }
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { ok: false, response: jsonError(400, 'Body nicht lesbar.', rlHeaders) };
  }
  if (raw.length > maxBodyBytes) {
    return { ok: false, response: jsonError(413, 'Anfrage zu groß.', rlHeaders) };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, response: jsonError(400, 'Ungültiges JSON.', rlHeaders) };
  }
  // 5) Bots — Honeypot still verwerfen, Turnstile-Token prüfen.
  const bot = await botCheck(parsed, { honeypot, turnstile, ip, rlHeaders });
  if (!bot.ok) return bot;
  parsed = bot.body;

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.length ? `${issue.path.join('.')}: ` : '';
    return { ok: false, response: jsonError(400, `Ungültige Eingabe — ${path}${issue?.message ?? 'Schema verletzt'}.`, rlHeaders) };
  }

  return { ok: true, body: result.data, ip, principal };
}

// ─── Bot-Prüfung (Honeypot + Turnstile) ──────────────────────────────────────

type BotCheckOpts = { honeypot?: string; turnstile: boolean; ip: string; rlHeaders: Record<string, string> };

/**
 * Für guardRequest und für Routen, die ihren Body selbst lesen (Formular-Routen
 * wie /api/kontakt): prüft Honeypot und Turnstile auf einem beliebigen Objekt
 * und gibt den Body ohne `turnstileToken` zurück.
 */
export async function botCheck(
  body: unknown,
  { honeypot, turnstile, ip, rlHeaders }: BotCheckOpts,
): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  const obj = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;

  if (honeypot && obj && String(obj[honeypot] ?? '').trim() !== '') {
    return {
      ok: false,
      response: new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...rlHeaders },
      }),
    };
  }

  if (!turnstile) return { ok: true, body };

  const token = obj ? obj.turnstileToken : undefined;
  const verdict = await verifyTurnstile(typeof token === 'string' ? token : undefined, ip);
  if (!verdict.ok) {
    return { ok: false, response: jsonError(403, TURNSTILE_FEHLER_TEXT, rlHeaders) };
  }
  if (obj && 'turnstileToken' in obj) {
    const rest = { ...obj };
    delete rest.turnstileToken;
    return { ok: true, body: rest };
  }
  return { ok: true, body };
}

/**
 * Rate-Limit allein — für Routen, die keinen JSON-Body haben oder ihn selbst
 * lesen (Formular-POSTs, GET-Routen). Gleicher Zähler wie guardRequest.
 */
export function rateLimitRequest(req: Request, key: string, rule: RateLimitRule):
  | { ok: true; ip: string; headers: Record<string, string> }
  | { ok: false; response: Response } {
  const ip = clientIp(req);
  const verdict = limiter.check(`${key}:${ip}`, rule);
  const headers = rateLimitHeaders(rule, verdict);
  if (!verdict.allowed) {
    return { ok: false, response: jsonError(429, `Zu viele Anfragen — bitte in ${verdict.retryAfterSecs} s erneut versuchen.`, headers) };
  }
  return { ok: true, ip, headers };
}
