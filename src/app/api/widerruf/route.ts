/**
 * Widerrufsbutton — Eingangsverarbeitung (§ Button-Lösung Widerruf, ab 19.06.2026)
 * ===============================================================================
 * POST /api/widerruf
 *  1. Widerruf protokollieren (Tabelle `widerrufe`) → authoritative Eingangszeit.
 *  2. Betreiber benachrichtigen (Loops, Vorlage des Kontaktformulars, an pitmaster@).
 *  3. Elektronische Eingangsbestätigung an den Verbraucher (Loops), mit Datum/Uhrzeit.
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
 *   LOOPS_API_KEY · LOOPS_KONTAKT_TEMPLATE_ID   (Meldung an den Betreiber)
 *   LOOPS_WIDERRUF_TEMPLATE_ID                  (Bestätigungs-Vorlage)
 *
 * „Eingegangen“ heißt seit 03.10.2026: gespeichert ODER dem Betreiber zugestellt.
 * Vorher meldete die Route IMMER `ok: true` — der Insert wurde nie ausgewertet
 * (supabase-js wirft nicht, es liefert `{ error }`), und selbst ein gespeicherter
 * Widerruf erreichte niemanden: Die Tabelle liest keine Seite. Trifft keines von
 * beidem zu, gibt es 502 mit dem Hinweis auf den Weg per E-Mail. Die Bestätigung
 * an den Verbraucher ist Zusatz: Scheitert sie, bleibt der Widerruf eingegangen.
 *
 * Eingangsschutz (01.10.2026): Same-Origin, 10 Widerrufe / IP / Stunde und ein
 * Honeypot `website` — über den zentralen Guard. BEWUSST KEIN Turnstile: Der
 * Widerrufsbutton (§ 312k BGB) muss ohne Hürde funktionieren; eine fehlgeschlagene
 * Sicherheitsprüfung darf einen Verbraucher nicht am Widerruf hindern.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { guardRequest } from '@/lib/api/guard';
import { KONTAKT_EMPFAENGER } from '@/lib/kontakt';
import { datumZeitBerlin, sendeBetreiberMail } from '@/lib/betreiber-mail';

const RATE = { limit: 10, windowMs: 60 * 60 * 1_000 };
// Loops darf den Widerruf nicht aufhalten: zwei Aufrufe, zusammen deutlich
// unter der Funktionsgrenze von 30 s (vercel.json).
const LOOPS_TIMEOUT_MS = 8_000;

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().max(254).optional().default(''),
  orderRef: z.string().trim().max(100).optional().default(''),
  name: z.string().trim().max(200).optional().default(''),
  product: z.string().trim().max(300).optional().default(''),
  reason: z.string().trim().max(2000).optional().default(''),
});

type Bestaetigung = { gesendet: boolean; grund: string };

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
  const { datum, zeit } = datumZeitBerlin(receivedAt);

  // 1) Protokollieren (Service-Role — RLS-geschützt)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let gespeichert = false;
  let speicherFehler = '';
  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      // supabase-js wirft bei Datenbankfehlern nicht — `error` auswerten.
      const { error } = await supabase.from('widerrufe').insert({
        email: emailOk ? email : null,
        order_ref: orderRef || null,
        name: name || null,
        product: product || null,
        reason: reason || null,
        received_at: receivedAt,
      });
      if (error) throw new Error(error.message);
      gespeichert = true;
    } catch (e) {
      speicherFehler = e instanceof Error ? e.message : 'unbekannter Fehler';
      console.error('[widerruf] insert failed', e);
      // Nicht abbrechen — die Meldung an den Betreiber kann den Widerruf noch retten.
    }
  } else {
    speicherFehler = 'Supabase-Konfiguration fehlt';
    console.error('[widerruf] NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt — Widerruf wird nicht gespeichert.');
  }

  // Elektronische Eingangsbestätigung an den Verbraucher. Erst, wenn der
  // Widerruf nachweislich eingegangen ist — sonst bestätigte die Mail etwas,
  // das niemand hat.
  async function bestaetige(): Promise<Bestaetigung> {
    const apiKey     = process.env.LOOPS_API_KEY;
    const templateId = process.env.LOOPS_WIDERRUF_TEMPLATE_ID;
    if (!emailOk) return { gesendet: false, grund: 'keine E-Mail-Adresse angegeben' };
    if (!apiKey || !templateId) return { gesendet: false, grund: 'LOOPS_API_KEY oder LOOPS_WIDERRUF_TEMPLATE_ID fehlt' };
    try {
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
        signal: AbortSignal.timeout(LOOPS_TIMEOUT_MS),
      });
      if (!resp.ok) {
        console.error('[widerruf] loops failed', resp.status, (await resp.text().catch(() => '')).slice(0, 300));
        return { gesendet: false, grund: `Loops hat abgelehnt (HTTP ${resp.status})` };
      }
      return { gesendet: true, grund: '' };
    } catch (e) {
      console.error('[widerruf] loops error', e);
      return { gesendet: false, grund: 'Loops nicht erreichbar' };
    }
  }

  // 2) Bestätigung zuerst, wenn der Widerruf schon gespeichert ist — dann kann
  //    die Meldung an den Betreiber sagen, ob er von Hand bestätigen muss.
  let bestaetigung: Bestaetigung | null = gespeichert ? await bestaetige() : null;

  // 3) Betreiber benachrichtigen. Ohne diese Mail erfährt niemand vom Widerruf.
  const meldung = await sendeBetreiberMail(
    {
      betreffTag: '[Widerruf]',
      name: name || 'Widerruf',
      // Ohne E-Mail des Verbrauchers bleibt der Reply-To beim eigenen Postfach —
      // ein leerer Wert könnte die Vorlage ablehnen lassen.
      absender: emailOk ? email : KONTAKT_EMPFAENGER,
      thema: 'Widerruf',
      receivedAt,
      nachricht: [
        'Widerruf über das Formular unter /widerruf.',
        '',
        `Eingang: ${datum}, ${zeit} Uhr`,
        `E-Mail: ${emailOk ? email : '(nicht angegeben)'}`,
        `Bestell-/Vertragsnummer: ${orderRef || '(nicht angegeben)'}`,
        `Name: ${name || '(nicht angegeben)'}`,
        `Produkt/Vertrag: ${product || '(nicht angegeben)'}`,
        `Anmerkung: ${reason || '(keine)'}`,
        '',
        gespeichert
          ? 'In der Datenbank gespeichert (Tabelle widerrufe): ja'
          : `In der Datenbank gespeichert (Tabelle widerrufe): NEIN — ${speicherFehler}. Diese Mail ist der einzige Nachweis.`,
        bestaetigung
          ? bestaetigung.gesendet
            ? 'Eingangsbestätigung an den Verbraucher: gesendet'
            : `Eingangsbestätigung an den Verbraucher: NICHT gesendet — ${bestaetigung.grund}. Bitte von Hand bestätigen.`
          : `Eingangsbestätigung an den Verbraucher: ${emailOk ? 'wird nach dieser Meldung versucht' : 'NICHT möglich — keine E-Mail-Adresse angegeben'}`,
      ].join('\n'),
    },
    { quelle: 'widerruf', timeoutMs: LOOPS_TIMEOUT_MS },
  );
  const gemeldet = meldung.ok;

  if (!gemeldet) {
    // Zurückgegebene Fehler erreichen Sentry nicht von selbst (nur geworfene).
    // Ein Widerruf, von dem der Betreiber nichts weiß, darf nicht still bleiben.
    // Bewusst ohne personenbezogene Angaben.
    console.error('[widerruf] Betreiber nicht benachrichtigt', { gespeichert, grund: meldung.grund });
    Sentry.captureMessage(
      gespeichert
        ? 'Widerruf gespeichert, aber Betreiber nicht benachrichtigt — Tabelle widerrufe ansehen'
        : 'Widerruf weder gespeichert noch zugestellt — Verbraucher bekam 502',
      {
        level: 'error',
        fingerprint: ['widerruf', gespeichert ? 'nicht-gemeldet' : 'verloren'],
        tags: { grund: meldung.grund, gespeichert: String(gespeichert) },
        extra: { receivedAt, speicherFehler: speicherFehler || null },
      },
    );
  }

  // Weder gespeichert noch zugestellt: nicht „eingegangen“ melden.
  if (!gespeichert && !gemeldet) {
    return Response.json(
      { error: `Dein Widerruf konnte technisch nicht entgegengenommen werden. Bitte schick ihn per E-Mail an ${KONTAKT_EMPFAENGER}.` },
      { status: 502 },
    );
  }

  // 4) Nicht gespeichert, aber zugestellt: Bestätigung jetzt nachholen.
  if (!bestaetigung) bestaetigung = await bestaetige();

  return Response.json({ ok: true, receivedAt, emailSent: bestaetigung.gesendet });
}
