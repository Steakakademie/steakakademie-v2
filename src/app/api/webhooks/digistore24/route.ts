/**
 * Digistore24 Webhook — v4
 * ========================
 * POST /api/webhooks/digistore24
 *
 * Authentifizierung (eine der drei Stufen muss greifen, Reihenfolge = Prüfreihenfolge):
 *   1. Header  `X-Webhook-Token: <DIGISTORE_WEBHOOK_TOKEN>`  (oder `Authorization: Bearer …`)
 *      → für Relays/Tests. Digistore24 selbst kann KEINE eigenen Header senden
 *      (Webhook-Konfiguration kennt nur URL + GET-Parameter).
 *   2. `sha_sign` im POST-Body, geprüft gegen DIGISTORE_IPN_PASSPHRASE
 *      (SHA-512 über sortierte Felder, Digistore-Referenz sha_sign.php).
 *      → der von Digistore24 vorgesehene Weg: IPN-Typ „Standard" mit IPN-Passwort.
 *   3. URL-Parameter `?token=` — NUR noch als Übergang, wenn
 *      DIGISTORE_WEBHOOK_ALLOW_URL_TOKEN=true gesetzt ist. Danach entfernen:
 *      Secrets in URLs landen in Proxy-/Access-Logs.
 *
 * Idempotenz: UNIQUE(ds_order_id, ds_event) in digistore_orders. Eine zweite
 * Zustellung trifft auf den bestehenden Datensatz:
 *   processed → 200 „duplicate" (nichts passiert erneut)
 *   pending   → 200 „in progress" (parallele Zustellung, laeuft schon) —
 *               ausser der Datensatz ist aelter als STALE_PENDING_MS (abgestuerzt) → erneut verarbeiten
 *   failed    → erneut verarbeiten (Digistore wiederholt nach 5xx — genau dafuer)
 *
 * Env benötigt:
 *   DIGISTORE_WEBHOOK_TOKEN        — Secret fuer Header-Auth (Stufe 1) und Uebergangs-URL (Stufe 3)
 *   DIGISTORE_IPN_PASSPHRASE       — IPN-Passwort aus Digistore24 (Stufe 2)
 *   DIGISTORE_WEBHOOK_ALLOW_URL_TOKEN — 'true' nur waehrend der Umstellung
 *   SUPABASE_SERVICE_ROLE_KEY      — Service-Role (NICHT anon)
 *   NEXT_PUBLIC_SUPABASE_URL
 *   LOOPS_API_KEY                  — Transactional E-Mail
 *   LOOPS_MAGIC_LINK_TEMPLATE_ID   — Template-ID des Magic-Link-Templates
 *   LOOPS_VOUCHER_TEMPLATE_ID      — Template-ID der Gutschein-Mail
 */

export const runtime  = 'nodejs';
export const dynamic  = 'force-dynamic';

import { timingSafeEqual } from 'node:crypto';
import * as Sentry from '@sentry/nextjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { digistoreSignature } from '@/lib/digistore/signature';

/**
 * Kassieren-ohne-Auslieferung-Alarm (17.09.2026, DB-Audit vom 07.09.)
 * ====================================================================
 * Digistore verkauft, was dort aktiv ist — unabhaengig davon, ob die DB einen
 * Kurs dafuer kennt. Produkt 695900 (Eigenregie, 37/497 EUR) hat KEINE
 * digistore_products-Zeile; 696396/696399 haben eine, zeigen aber auf einen
 * Kurs mit published=false. In beiden Faellen zahlt der Kaeufer und bekommt
 * nichts. Abschalten in Digistore ist blockiert (API nur lesend, Backend-UI
 * wirft 400/CSRF). Bis das geloest ist, muss ein solcher Kauf SOFORT jemanden
 * erreichen, statt still als Zeile in digistore_orders zu liegen: Sentry
 * (Server-SDK, sentry.server.config.ts) legt ein neues Issue an und mailt.
 * Fingerprint pro Produkt, damit jede Bestellung im selben Issue landet und
 * nicht als Rauschen untergeht.
 */
function alarmKassiertOhneAuslieferung(
  grund: 'kein-mapping' | 'kurs-unpublished',
  info: { productId: string; orderId: string; event: string; courseSlug?: string | null },
) {
  const text =
    grund === 'kein-mapping'
      ? `Digistore-Bestellung fuer unbekanntes Produkt ${info.productId} — kassiert ohne Auslieferung`
      : `Digistore-Bestellung fuer Produkt ${info.productId} → Kurs "${info.courseSlug}" ist NICHT veroeffentlicht — Kaeufer sieht nichts`;
  console.error('[ds-webhook] ALARM', grund, info);
  Sentry.captureMessage(text, {
    level: 'error',
    fingerprint: ['ds-webhook', grund, info.productId],
    tags: { ds_product_id: info.productId, ds_event: info.event, grund },
    extra: { orderId: info.orderId, courseSlug: info.courseSlug ?? null },
  });
}

const TOOL_REDIRECT: Record<string, string> = {
  'steuer-matrix':         'https://steakakademie.de/auth/callback?next=/steuer-matrix/rechner',
  'gruender-schmiede':     'https://steakakademie.de/auth/callback?next=/mein-system',
  'eigenregie':            'https://steakakademie.de/auth/callback?next=/eigenregie/lernen',
  // Legacy-Slug (Umbenennung 07.09.2026): faellt weg, sobald die Migration
  // ueberall gelaufen ist — bis dahin darf ein Kauf nicht ins Leere laufen.
  'agentur-killer-sprint': 'https://steakakademie.de/auth/callback?next=/eigenregie/lernen',
  'mein-protokoll':        'https://steakakademie.de/auth/callback?next=/mein-protokoll/fragebogen',
  'steak-beichte':         'https://steakakademie.de/auth/callback?next=/steak-beichte/diagnose',
};

const DEFAULT_REDIRECT = 'https://steakakademie.de/auth/callback?next=/mein-system';

/**
 * Credit-Produkte (verbrauchbares Guthaben, KEIN Course-Gate) — heute die Steak-Beichte.
 * Wie viele Credits ein Kauf gutschreibt, steht in digistore_products.credit_amount;
 * NULL dort heisst: normales Kurs-Produkt. Ein neues Paket ist damit EINE Zeile und
 * kein Deploy — frueher war es eine hartkodierte Liste plus eine Env-Variable je Paket.
 * Dieselbe Mechanik traegt spaeter das Stundenkonto des Personal-Coachings
 * (docs/coaching-gruender-schmiede.md, Abschnitt 3).
 */
const CREDIT_FALLBACK_SLUG = 'steak-beichte';

// ─── Authentifizierung ──────────────────────────────────────────────────────

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

type AuthResult = { ok: true; via: 'header' | 'sha_sign' | 'url-token' } | { ok: false; reason: string };

function authenticate(req: Request, params: Record<string, string>): AuthResult {
  const token      = process.env.DIGISTORE_WEBHOOK_TOKEN;
  const passphrase = process.env.DIGISTORE_IPN_PASSPHRASE;

  // 1) Header
  const headerToken =
    req.headers.get('x-webhook-token') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    null;
  if (headerToken && token) {
    return safeEqual(headerToken, token) ? { ok: true, via: 'header' } : { ok: false, reason: 'header token mismatch' };
  }

  // 2) sha_sign (Digistore24 IPN)
  if (params.sha_sign) {
    if (!passphrase) return { ok: false, reason: 'sha_sign received but DIGISTORE_IPN_PASSPHRASE not set' };
    return safeEqual(params.sha_sign.toUpperCase(), digistoreSignature(passphrase, params))
      ? { ok: true, via: 'sha_sign' }
      : { ok: false, reason: 'sha_sign mismatch' };
  }

  // 3) URL-Token — Uebergang, explizit freigeschaltet
  if (process.env.DIGISTORE_WEBHOOK_ALLOW_URL_TOKEN === 'true' && token) {
    const urlToken = new URL(req.url).searchParams.get('token');
    if (urlToken && safeEqual(urlToken, token)) {
      console.warn('[ds-webhook] DEPRECATED: authenticated via URL token — auf sha_sign umstellen');
      return { ok: true, via: 'url-token' };
    }
  }

  return { ok: false, reason: 'no valid credential (header, sha_sign or url token)' };
}

// ─── Idempotenz ─────────────────────────────────────────────────────────────

const STALE_PENDING_MS = 10 * 60_000;

type OrderInsert = {
  ds_order_id: string; ds_product_id: string; ds_email: string; ds_event: string;
  course_id: string | null; raw_payload: Record<string, string>; raw_body: string;
  processing_status: 'pending' | 'failed'; error_message: string | null;
};

type RecordResult = { kind: 'new'; id: string } | { kind: 'done'; response: Response };

/**
 * Order protokollieren. Trifft der Insert auf UNIQUE(ds_order_id, ds_event),
 * entscheidet der Zustand des vorhandenen Datensatzes, ob erneut verarbeitet wird.
 */
async function recordOrder(supabase: SupabaseClient, row: OrderInsert): Promise<RecordResult> {
  const { data: inserted, error } = await supabase
    .from('digistore_orders')
    .insert(row)
    .select('id')
    .single();

  if (!error && inserted) return { kind: 'new', id: inserted.id as string };

  if (error?.code !== '23505') {
    console.error('[ds-webhook] order insert failed', error);
    return { kind: 'done', response: new Response('Internal error', { status: 500 }) };
  }

  const { data: existing } = await supabase
    .from('digistore_orders')
    .select('id, processing_status, created_at')
    .eq('ds_order_id', row.ds_order_id)
    .eq('ds_event', row.ds_event)
    .maybeSingle();

  if (!existing) {
    return { kind: 'done', response: new Response('Internal error', { status: 500 }) };
  }

  const status = existing.processing_status as 'pending' | 'processed' | 'failed';
  const ageMs  = Date.now() - new Date(existing.created_at as string).getTime();

  if (status === 'processed') {
    return { kind: 'done', response: new Response('OK (duplicate)', { status: 200 }) };
  }
  if (status === 'pending' && ageMs < STALE_PENDING_MS) {
    return { kind: 'done', response: new Response('OK (in progress)', { status: 200 }) };
  }

  // failed oder haengend → erneut verarbeiten, Datensatz zuruecksetzen
  console.warn('[ds-webhook] reprocessing order', { orderId: row.ds_order_id, event: row.ds_event, status, ageMs });
  await supabase
    .from('digistore_orders')
    .update({ processing_status: 'pending', error_message: null, raw_payload: row.raw_payload, raw_body: row.raw_body })
    .eq('id', existing.id);
  return { kind: 'new', id: existing.id as string };
}

export async function POST(req: Request) {
  if (!process.env.DIGISTORE_WEBHOOK_TOKEN && !process.env.DIGISTORE_IPN_PASSPHRASE) {
    console.error('[ds-webhook] neither DIGISTORE_WEBHOOK_TOKEN nor DIGISTORE_IPN_PASSPHRASE set');
    return new Response('Server misconfiguration', { status: 500 });
  }

  const rawBody = await req.text();
  const params  = Object.fromEntries(new URLSearchParams(rawBody));

  const auth = authenticate(req, params);
  if (!auth.ok) {
    console.warn('[ds-webhook] unauthorized:', auth.reason);
    return new Response('Unauthorized', { status: 401 });
  }

  // Digistore24 sendet Events OHNE "on_"-Präfix ("payment", "refund", …);
  // ältere/Test-Aufrufe nutzten "on_payment". Normalisieren → beide Formen funktionieren.
  const event     = (params.event ?? '').replace(/^on_/, '');
  const orderId   = params.order_id;
  const productId = params.product_id;
  const email     = (params.email ?? params.buyer_email ?? '').toLowerCase().trim();

  if (!event || !orderId || !productId || !email) {
    return new Response('Missing required fields', { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 1) Produkt → Mapping aus DB (Kurs, Gutschein, Credits)
  const { data: mapping } = await supabase
    .from('digistore_products')
    .select('course_id, is_voucher, voucher_credit_amount, credit_amount, courses(slug, title, published)')
    .eq('ds_product_id', productId)
    .maybeSingle();

  const courseId       = mapping?.course_id ?? null;
  const courseSlug     = (mapping?.courses as any)?.slug  ?? null;
  const courseTitle    = (mapping?.courses as any)?.title ?? null;
  const coursePublished = (mapping?.courses as any)?.published as boolean | null | undefined;

  // Latenter Fall (696396 Mein Protokoll, 696399 BBQ-Grundkurs): Mapping da,
  // Kurs aber unveroeffentlicht. Die Buchung wird trotzdem angelegt (Zugang
  // greift, sobald Uwe veroeffentlicht) — aber jemand muss es JETZT erfahren.
  // Nur bei echten Kaufereignissen; Rueckerstattungen loesen keinen Alarm aus.
  if (courseId && coursePublished === false && (event === 'payment' || event === 'rebill' || event === 'rebill_resumed')) {
    alarmKassiertOhneAuslieferung('kurs-unpublished', { productId, orderId, event, courseSlug });
  }
  const isVoucher     = mapping?.is_voucher ?? false;
  const voucherCredit = mapping?.voucher_credit_amount ?? null;  // gesetzt = Credit-Gutschein
  const creditAmount  = (mapping?.credit_amount as number | null) ?? null;

  // 0) Credit-Produkt — eigener Pfad, kein Course-Gate. Vor dem Gutschein-Zweig:
  //    ein Gutschein AUF Credits ist etwas anderes (der Kaeufer verschenkt ihn).
  if (!isVoucher && creditAmount && creditAmount > 0) {
    return handleCreditProduct(supabase, {
      event, orderId, productId, email, params, rawBody,
      creditAmount,
      courseSlug: courseSlug ?? CREDIT_FALLBACK_SLUG,
      courseTitle,
    });
  }

  // 0b) Geschenkgutschein — Kauf erzeugt NUR einen Code (keine Freischaltung
  //     beim Käufer). Der Beschenkte löst den Code unter /gutschein/einloesen ein.
  if (isVoucher && courseId) {
    return handleVoucherProduct(supabase, {
      event, orderId, productId, email, params, rawBody, courseId, courseTitle, creditAmount: voucherCredit,
    });
  }

  // 2) Order immer protokollieren — auch unbekannte Produkte (Forensik).
  //    Idempotenz siehe recordOrder().
  const rec = await recordOrder(supabase, {
    ds_order_id:        orderId,
    ds_product_id:      productId,
    ds_email:           email,
    ds_event:           event,
    course_id:          courseId,
    raw_payload:        params,
    raw_body:           rawBody,
    processing_status:  courseId ? 'pending' : 'failed',
    error_message:      courseId ? null : `Unknown product_id: ${productId}`,
  });
  if (rec.kind === 'done') return rec.response;
  const orderRow = { id: rec.id };

  if (!courseId) {
    // Bis 07.09.2026 nur console.error — auf Vercel sieht das niemand, die
    // Bestellung lag still in digistore_orders (processing_status 'failed').
    if (event === 'payment' || event === 'rebill' || event === 'rebill_resumed') {
      alarmKassiertOhneAuslieferung('kein-mapping', { productId, orderId, event });
    } else {
      console.error('[ds-webhook] unknown product_id', productId, event);
    }
    return new Response('OK (unknown product logged)', { status: 200 });
  }

  // 3) Event-Routing
  try {
    if (event === 'payment' || event === 'rebill' || event === 'rebill_resumed') {
      const userId      = await ensureUser(supabase, email, courseSlug);

      const { data: bookingId, error: grantErr } = await supabase.rpc('grant_course_access', {
        p_user_id:   userId,
        p_course_id: courseId,
      });
      if (grantErr) throw new Error(`grant_course_access failed: ${grantErr.message}`);

      await sendMagicLink(supabase, email, courseSlug, courseTitle);

      await supabase
        .from('digistore_orders')
        .update({
          processing_status: 'processed',
          processed_at:      new Date().toISOString(),
          booking_id:        bookingId,
        })
        .eq('id', orderRow.id);

      return new Response('OK', { status: 200 });
    }

    if (event === 'refund' || event === 'chargeback') {
      const userId = await findUserId(supabase, email);
      if (!userId) throw new Error(`refund for unknown user: ${email}`);

      const { data: count, error: revokeErr } = await supabase.rpc('revoke_course_access', {
        p_user_id:   userId,
        p_course_id: courseId,
      });
      if (revokeErr) throw new Error(`revoke_course_access failed: ${revokeErr.message}`);
      if (count === 0) {
        console.warn('[ds-webhook] refund had no booking to revoke', { email, courseId });
      }

      await supabase
        .from('digistore_orders')
        .update({
          processing_status: 'processed',
          processed_at:      new Date().toISOString(),
        })
        .eq('id', orderRow.id);

      return new Response('OK', { status: 200 });
    }

    // Andere Events nur loggen (z.B. on_payment_missed)
    await supabase
      .from('digistore_orders')
      .update({
        processing_status: 'processed',
        processed_at:      new Date().toISOString(),
        error_message:     `event recorded, no action: ${event}`,
      })
      .eq('id', orderRow.id);

    return new Response('OK (event recorded)', { status: 200 });
  } catch (err: any) {
    console.error('[ds-webhook] processing failed', err);
    await supabase
      .from('digistore_orders')
      .update({
        processing_status: 'failed',
        error_message:     err?.message ?? 'unknown error',
      })
      .eq('id', orderRow.id);
    // 500 → Digistore retried
    return new Response('Processing failed', { status: 500 });
  }
}

// ─── Credit-Produkt-Handler (Steak-Beichte, Produkt A) ───────────────────────

async function handleCreditProduct(
  supabase: SupabaseClient,
  args: {
    event: string; orderId: string; productId: string; email: string;
    params: Record<string, string>; rawBody: string; creditAmount: number;
    courseSlug: string; courseTitle: string | null;
  },
): Promise<Response> {
  const { event, orderId, productId, email, params, rawBody, creditAmount, courseSlug, courseTitle } = args;

  // Order protokollieren (course_id null — Credits sind kein Course).
  const rec = await recordOrder(supabase, {
    ds_order_id:       orderId,
    ds_product_id:     productId,
    ds_email:          email,
    ds_event:          event,
    course_id:         null,
    raw_payload:       params,
    raw_body:          rawBody,
    processing_status: 'pending',
    error_message:     `credit product: ${creditAmount} credit(s)`,
  });
  if (rec.kind === 'done') return rec.response;
  const orderRow = { id: rec.id };

  try {
    if (event === 'payment' || event === 'rebill' || event === 'rebill_resumed') {
      const userId = await ensureUser(supabase, email, courseSlug);

      // Je Order genau einmal: scheitert danach die Mail und Digistore stellt erneut zu,
      // schreibt der zweite Lauf nichts mehr gut (grant_diagnose_credits allein addiert).
      const { error: grantErr } = await supabase.rpc('grant_order_credits', {
        p_order_id: orderRow.id,
        p_user_id:  userId,
        p_amount:   creditAmount,
      });
      if (grantErr) throw new Error(`grant_order_credits failed: ${grantErr.message}`);

      await sendMagicLink(supabase, email, courseSlug, courseTitle ?? 'deiner Steak-Beichte');

      await supabase
        .from('digistore_orders')
        .update({ processing_status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', orderRow.id);

      return new Response('OK', { status: 200 });
    }

    if (event === 'refund' || event === 'chargeback') {
      const userId = await findUserId(supabase, email);
      if (!userId) throw new Error(`refund for unknown user: ${email}`);

      const { error: revokeErr } = await supabase.rpc('revoke_diagnose_credits', {
        p_user_id: userId,
        p_amount:  creditAmount,
      });
      if (revokeErr) throw new Error(`revoke_diagnose_credits failed: ${revokeErr.message}`);

      await supabase
        .from('digistore_orders')
        .update({ processing_status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', orderRow.id);

      return new Response('OK', { status: 200 });
    }

    await supabase
      .from('digistore_orders')
      .update({
        processing_status: 'processed',
        processed_at:      new Date().toISOString(),
        error_message:     `event recorded, no action: ${event}`,
      })
      .eq('id', orderRow.id);
    return new Response('OK (event recorded)', { status: 200 });
  } catch (err: any) {
    console.error('[ds-webhook] credit processing failed', err);
    await supabase
      .from('digistore_orders')
      .update({ processing_status: 'failed', error_message: err?.message ?? 'unknown error' })
      .eq('id', orderRow.id);
    return new Response('Processing failed', { status: 500 });
  }
}

// ─── Gutschein-Handler (Geschenkgutscheine) ─────────────────────────────────

async function handleVoucherProduct(
  supabase: SupabaseClient,
  args: {
    event: string; orderId: string; productId: string; email: string;
    params: Record<string, string>; rawBody: string;
    courseId: string; courseTitle: string | null; creditAmount: number | null;
  },
): Promise<Response> {
  const { event, orderId, productId, email, params, rawBody, courseId, courseTitle, creditAmount } = args;

  const rec = await recordOrder(supabase, {
    ds_order_id:       orderId,
    ds_product_id:     productId,
    ds_email:          email,
    ds_event:          event,
    course_id:         courseId,
    raw_payload:       params,
    raw_body:          rawBody,
    processing_status: 'pending',
    error_message:     'gift voucher',
  });
  if (rec.kind === 'done') return rec.response;
  const orderRow = { id: rec.id };

  try {
    if (event === 'payment' || event === 'rebill' || event === 'rebill_resumed') {
      // optionale persönliche Nachricht (falls als Custom-Feld übergeben)
      const giftMessage = (params.custom ?? params.gift_message ?? '').slice(0, 500) || null;

      const { data: code, error: cErr } = await supabase.rpc('create_voucher', {
        p_course_id:       courseId,
        p_ds_order_id:     orderId,
        p_purchaser_email: email,
        p_gift_message:    giftMessage,
        p_kind:            creditAmount ? 'credit' : 'course',
        p_credit_amount:   creditAmount ?? null,
      });
      if (cErr) throw new Error(`create_voucher failed: ${cErr.message}`);

      // Käufer bekommt den Gutschein (NICHT den Magic-Link — er soll ihn verschenken)
      await sendVoucherEmail(email, code as string, courseTitle);

      await supabase
        .from('digistore_orders')
        .update({
          processing_status: 'processed',
          processed_at:      new Date().toISOString(),
          error_message:     `voucher ${code}`,
        })
        .eq('id', orderRow.id);

      return new Response('OK', { status: 200 });
    }

    if (event === 'refund' || event === 'chargeback') {
      const { error: rErr } = await supabase.rpc('revoke_voucher', { p_ds_order_id: orderId });
      if (rErr) throw new Error(`revoke_voucher failed: ${rErr.message}`);

      await supabase
        .from('digistore_orders')
        .update({ processing_status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', orderRow.id);

      return new Response('OK', { status: 200 });
    }

    await supabase
      .from('digistore_orders')
      .update({
        processing_status: 'processed',
        processed_at:      new Date().toISOString(),
        error_message:     `event recorded, no action: ${event}`,
      })
      .eq('id', orderRow.id);
    return new Response('OK (event recorded)', { status: 200 });
  } catch (err: any) {
    console.error('[ds-webhook] voucher processing failed', err);
    await supabase
      .from('digistore_orders')
      .update({ processing_status: 'failed', error_message: err?.message ?? 'unknown error' })
      .eq('id', orderRow.id);
    return new Response('Processing failed', { status: 500 });
  }
}

async function sendVoucherEmail(email: string, code: string, courseTitle: string | null) {
  const apiKey     = process.env.LOOPS_API_KEY;
  const templateId = process.env.LOOPS_VOUCHER_TEMPLATE_ID;
  if (!apiKey || !templateId) {
    throw new Error('LOOPS_API_KEY or LOOPS_VOUCHER_TEMPLATE_ID not set');
  }
  const voucherUrl = `https://steakakademie.de/gutschein/${encodeURIComponent(code)}`;

  const resp = await fetch('https://app.loops.so/api/v1/transactional', {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionalId: templateId,
      email,
      dataVariables: {
        voucher_code:  code,
        voucher_url:   voucherUrl,
        course_title:  courseTitle ?? 'deinem Geschenk',
      },
    }),
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`loops voucher email failed (${resp.status}): ${errBody}`);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Konto per E-Mail direkt in auth.users (RPC). NICHT listUsers: das liefert eine Seite,
 * und jeder Bestandskunde ausserhalb davon galt als neu (Kauf → email_exists → 500,
 * Refund → Zugang blieb). Ein Lesefehler wirft — lieber 500 und Retry als ein Doppelkonto.
 */
async function findUserId(supabase: SupabaseClient, email: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('find_user_id_by_email', { p_email: email });
  if (error) throw new Error(`find_user_id_by_email failed: ${error.message}`);
  return (data as string | null) ?? null;
}

async function ensureUser(
  supabase: SupabaseClient,
  email: string,
  courseSlug: string | null,
): Promise<string> {
  const existing = await findUserId(supabase, email);
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: 'digistore24', course: courseSlug ?? null },
  });
  if (error || !data?.user) {
    throw new Error(`createUser failed: ${error?.message}`);
  }
  return data.user.id;
}

async function sendMagicLink(
  supabase: SupabaseClient,
  email: string,
  courseSlug: string | null,
  courseTitle: string | null,
) {
  const redirectTo = (courseSlug && TOOL_REDIRECT[courseSlug]) ?? DEFAULT_REDIRECT;
  const nextPath   = new URL(redirectTo).searchParams.get('next') ?? '/mein-system';

  const { data, error } = await supabase.auth.admin.generateLink({
    type:    'magiclink',
    email,
    options: { redirectTo },
  });
  if (error || !data?.properties?.hashed_token) {
    throw new Error(`magic link generation failed: ${error?.message}`);
  }

  // Eigenen Link auf unseren Callback bauen (token_hash → verifyOtp).
  // NICHT action_link nutzen: der liefert Tokens im URL-Hash, die ein
  // Server-Route-Handler nicht lesen kann → Login schlug fehl.
  const magicLink =
    `https://steakakademie.de/auth/callback` +
    `?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
    `&type=magiclink&next=${encodeURIComponent(nextPath)}`;

  // generateLink GENERIERT — sendet NICHT. Loops macht den Versand.
  const apiKey     = process.env.LOOPS_API_KEY;
  const templateId = process.env.LOOPS_MAGIC_LINK_TEMPLATE_ID;
  if (!apiKey || !templateId) {
    throw new Error('LOOPS_API_KEY or LOOPS_MAGIC_LINK_TEMPLATE_ID not set');
  }

  const resp = await fetch('https://app.loops.so/api/v1/transactional', {
    method:  'POST',
    headers: {
      Authorization:   `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      transactionalId: templateId,
      email,
      dataVariables: {
        magic_link:   magicLink,
        course_title: courseTitle ?? 'deinem Kurs',
      },
    }),
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`loops email failed (${resp.status}): ${errBody}`);
  }
}

// deploy: pick up Vercel env vars
