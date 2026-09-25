/**
 * Kontaktformular — Eingangsverarbeitung (KAN-70)
 * ==============================================
 * POST /api/kontakt
 *  1. Nachricht in `kontaktanfragen` speichern — VOR dem Mailversand, damit ein
 *     Loops-Ausfall keine Anfrage verschluckt.
 *  2. Zustellung per Loops-Transaktionsmail an pitmaster@steakakademie.de.
 *
 * Warum nur eine Zieladresse: Eine Postfach-Pruefung am 19.08.2026 ergab, dass
 * ausschliesslich pitmaster@steakakademie.de nachweislich empfaengt. Fuer info@,
 * masterclass@, inspiration@ und uwe@ gibt es keinen Zustellnachweis und keine
 * Verifizierung im Email-Routing — Post dorthin laeuft vermutlich ins Leere.
 * Sortiert wird deshalb ueber ein Betreff-Praefix, die Verteilung uebernehmen
 * Gmail-Filter.
 *
 * Der Endpunkt verarbeitet zwei Formate:
 *   - application/json                 → Antwort als JSON (Formular mit JS)
 *   - application/x-www-form-urlencoded → Redirect zurueck auf /kontakt
 * Das zweite ist der Weg ohne JavaScript. Ohne ihn wuerde das Formular bei
 * fehlgeschlagener Hydration den Browser-Standard ausfuehren: GET auf dieselbe
 * URL, mit Name, E-Mail und Nachricht in der Adresszeile, im Server-Log, im
 * Referrer und in der History. Genau das hat das Anwalts-Testat beanstandet.
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
 *   LOOPS_API_KEY · LOOPS_KONTAKT_TEMPLATE_ID
 *
 * Graceful: Fehlt das Loops-Template, wird trotzdem gespeichert und bestaetigt —
 * die Nachricht ist dann in der Tabelle und geht nicht verloren.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { CONSENT_TEXT, KONTAKT_EMPFAENGER as EMPFAENGER } from '@/lib/kontakt';

/** Auswahlfeld → Betreff-Praefix fuer die Gmail-Filter. */
function betreffTag(subject: string): string {
  switch (subject) {
    case 'presse':      return '[Presse]';
    case 'kooperation': return '[Kooperation]';
    case 'rezept':      return '[Rezept-Idee]';
    case 'urkunde':     return '[Urkunde]';      // Bestellung gedruckte Urkunde (/diplome/urkunde)
    case 'hofladen':    return '[Hofladen]';     // Hof melden/bestaetigen (/hoefe)
    case 'baukasten':   return '[Baukasten]';    // Projekt-Anamnese (tuwasduwillst.de/projekt-anamnese)
    default:            return '[Allgemein]';   // diplom, feedback, sonstiges, leer
  }
}

export async function POST(req: Request) {
  const typ = req.headers.get('content-type') || '';
  const alsFormular = typ.includes('application/x-www-form-urlencoded') || typ.includes('multipart/form-data');

  let daten: Record<string, string> = {};
  try {
    if (alsFormular) {
      const fd = await req.formData();
      // Array.from statt direkter Iteration: Das tsconfig-Target liegt unter
      // ES2015, dort laesst sich ein FormData-Iterator nicht durchlaufen (TS2802).
      for (const [k, v] of Array.from(fd.entries())) daten[k] = String(v);
    } else {
      daten = await req.json();
    }
  } catch {
    return antwort(req, alsFormular, { error: 'Ungültige Anfrage.' }, 400);
  }

  const name    = String(daten.name ?? '').trim().slice(0, 200);
  const email   = String(daten.email ?? '').trim().toLowerCase().slice(0, 200);
  const subject = String(daten.subject ?? '').trim().slice(0, 50);
  const message = String(daten.message ?? '').trim().slice(0, 5000);
  // Beide Transportwege liefern die Einwilligung unterschiedlich: JSON einen
  // echten Boolean, das Formular den String "on". Beides muss zaehlen — sonst
  // weist die Route ausgerechnet den normalen Weg mit JavaScript ab.
  const roh = (daten as Record<string, unknown>).consent;
  const consent = roh === true || roh === 'true' || roh === 'on' || roh === '1';
  // Honeypot: ein Feld, das kein Mensch sieht und keiner ausfuellt.
  const falle   = String(daten.website ?? '').trim();

  // Bots bekommen ein freundliches OK und nichts passiert. Eine Fehlermeldung
  // wuerde nur verraten, dass es die Falle gibt.
  if (falle) return antwort(req, alsFormular, { ok: true }, 200);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !emailOk || !message) {
    return antwort(req, alsFormular, { error: 'Bitte Name, gültige E-Mail-Adresse und Nachricht angeben.' }, 400);
  }
  if (!consent) {
    return antwort(req, alsFormular, { error: 'Ohne Einwilligung in die Datenverarbeitung können wir die Anfrage nicht bearbeiten.' }, 400);
  }

  const receivedAt = new Date().toISOString();
  const tag = betreffTag(subject);

  // 1) Speichern — vor dem Mailversand.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let zeileId: string | null = null;
  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { data, error } = await supabase.from('kontaktanfragen').insert({
        name, email, subject: subject || null, betreff_tag: tag, message,
        consent: true,
        consent_at: receivedAt,      // serverseitig, nicht vom Client uebernommen
        consent_text: CONSENT_TEXT,
        received_at: receivedAt,
      }).select('id').single();
      if (error) throw error;
      zeileId = data?.id ?? null;
    } catch (e) {
      console.error('[kontakt] insert failed', e);
      // Nicht abbrechen — lieber zustellen als beides verlieren.
    }
  }

  // 2) Zustellen per Loops.
  const apiKey     = process.env.LOOPS_API_KEY;
  const templateId = process.env.LOOPS_KONTAKT_TEMPLATE_ID;
  let mailSent = false;
  if (apiKey && templateId) {
    try {
      const d = new Date(receivedAt);
      const datum = d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
      const zeit  = d.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });
      const resp = await fetch('https://app.loops.so/api/v1/transactional', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionalId: templateId,
          // Empfaenger ist das Postfach, nicht der Absender — die Mail geht an
          // Uwe. Die Absenderadresse steht in den Variablen und gehoert im
          // Template in den Reply-To.
          email: EMPFAENGER,
          // Loops-Variablennamen sind case-sensitive → beide Schreibweisen
          // senden, wie in /api/widerruf.
          dataVariables: {
            betreff_tag: tag,          Betreff_tag: tag,
            name,                      Name: name,
            absender: email,           Absender: email,
            reply_to: email,           Reply_to: email,
            nachricht: message,        Nachricht: message,
            thema: subject || '—',     Thema: subject || '—',
            datum,                     Datum: datum,
            zeit,                      Zeit: zeit,
          },
        }),
      });
      mailSent = resp.ok;
      if (!resp.ok) {
        console.error('[kontakt] loops', resp.status, (await resp.text()).slice(0, 300));
      }
    } catch (e) {
      console.error('[kontakt] loops error', e);
    }
  } else {
    console.warn('[kontakt] LOOPS_API_KEY oder LOOPS_KONTAKT_TEMPLATE_ID fehlt — nur gespeichert.');
  }

  // Versand-Status nachtragen, damit die Tabelle zeigt, was noch offen ist.
  if (zeileId && url && key && mailSent) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      await supabase.from('kontaktanfragen').update({ mail_sent: true }).eq('id', zeileId);
    } catch (e) {
      console.error('[kontakt] update mail_sent failed', e);
    }
  }

  // Gespeichert ODER zugestellt reicht fuer ein ehrliches "angekommen".
  const angekommen = Boolean(zeileId) || mailSent;
  if (!angekommen) {
    return antwort(req, alsFormular, { error: 'Die Nachricht konnte nicht entgegengenommen werden. Bitte schreib direkt an pitmaster@steakakademie.de.' }, 502);
  }
  return antwort(req, alsFormular, { ok: true, receivedAt, mailSent }, 200);
}

/** JSON fuer fetch, Redirect fuer das Formular ohne JavaScript. */
function antwort(req: Request, alsFormular: boolean, body: Record<string, unknown>, status: number) {
  if (!alsFormular) return Response.json(body, { status });
  const ziel = body.ok
    ? '/kontakt?gesendet=1'
    : `/kontakt?fehler=${encodeURIComponent(String(body.error ?? 'Unbekannter Fehler'))}`;
  // Basis aus der Anfrage: funktioniert lokal, in Preview und in Produktion,
  // ohne dass eine weitere Env-Variable gepflegt werden muss.
  return Response.redirect(new URL(ziel, req.url), 303);
}
