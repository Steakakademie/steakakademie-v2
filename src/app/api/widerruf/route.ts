/**
 * Widerrufsbutton — Eingangsverarbeitung (§ Button-Lösung Widerruf, ab 19.06.2026)
 * ===============================================================================
 * POST /api/widerruf
 *  1. Widerruf protokollieren (Tabelle `widerrufe`) → authoritative Eingangszeit.
 *  2. Elektronische Eingangsbestätigung per E-Mail (Loops), mit Datum/Uhrzeit.
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
 *   LOOPS_API_KEY · LOOPS_WIDERRUF_TEMPLATE_ID  (Bestätigungs-Vorlage)
 *
 * Graceful: ohne Loops-Template wird trotzdem protokolliert + on-screen bestätigt.
 *
 * Eingangsschutz (01.10.2026): Same-Origin, 10 Widerrufe / IP / Stunde und ein
 * Honeypot `website` — über den zentralen Guard. BEWUSST KEIN Turnstile: Der
 * Widerrufsbutton (§ 312k BGB) muss ohne Hürde funktionieren; eine fehlgeschlagene
 * Sicherheitsprüfung darf einen Verbraucher nicht am Widerruf hindern.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { guardRequest } from '@/lib/api/guard';

const RATE = { limit: 10, windowMs: 60 * 60 * 1_000 };
const BodySchema = z.object({
  email: z.string().trim().toLowerCase().max(254).optional().default(''),
  orderRef: z.string().trim().max(100).optional().default(''),
  name: z.string().trim().max(200).optional().default(''),
  product: z.string().trim().max(300).optional().default(''),
  reason: z.string().trim().max(2000).optional().default(''),
});

export async function POST(req: Request) {
  const guard = await guardRequest(req, { key: 'widerruf', rate: RATE, schema: BodySchema, honeypot: 'website' });
  if (!guard.ok) return guard.response;
  const { email, orderRef, name, product, reason } = guard.body;

  // Identifikation: E-Mail ODER Bestell-/Vertragsnummer ist Pflicht.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk && !orderRef) {
    return Response.json({ error: 'Bitte gib deine E-Mail-Adresse oder die Bestell-/Vertragsnummer an.' }, { status: 400 });
  }

  const receivedAt = new Date().toISOString();

  // 1) Protokollieren (Service-Role — RLS-geschützt)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      await supabase.from('widerrufe').insert({
        email: emailOk ? email : null,
        order_ref: orderRef || null,
        name: name || null,
        product: product || null,
        reason: reason || null,
        received_at: receivedAt,
      });
    } catch (e) {
      console.error('[widerruf] insert failed', e);
      // Nicht abbrechen — der Widerruf gilt trotzdem als eingegangen.
    }
  }

  // 2) Elektronische Eingangsbestätigung per E-Mail (nur wenn E-Mail + Template da)
  const apiKey     = process.env.LOOPS_API_KEY;
  const templateId = process.env.LOOPS_WIDERRUF_TEMPLATE_ID;
  let emailSent = false;
  if (emailOk && apiKey && templateId) {
    try {
      const d = new Date(receivedAt);
      const datum = d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
      const zeit  = d.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });
      const resp = await fetch('https://app.loops.so/api/v1/transactional', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionalId: templateId,
          email,
          // Loops-Variablennamen sind case-sensitive → beide Schreibweisen senden,
          // damit Template-Tippvarianten (Zeit/zeit, Datum/datum …) immer matchen.
          dataVariables: {
            datum, Datum: datum,
            zeit,  Zeit:  zeit,
            order_ref: orderRef || '—', Order_ref: orderRef || '—',
            product:   product  || '—', Product:   product  || '—',
          },
        }),
      });
      emailSent = resp.ok;
      if (!resp.ok) console.error('[widerruf] loops failed', resp.status, await resp.text());
    } catch (e) {
      console.error('[widerruf] loops error', e);
    }
  }

  return Response.json({ ok: true, receivedAt, emailSent });
}
