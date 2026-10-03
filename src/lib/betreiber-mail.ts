import 'server-only';
import { KONTAKT_EMPFAENGER } from '@/lib/kontakt';

/**
 * Nachricht an das Betreiber-Postfach (pitmaster@) über die Loops-
 * Transaktionsvorlage des Kontaktformulars (LOOPS_KONTAKT_TEMPLATE_ID).
 *
 * Herausgezogen am 03.10.2026 aus /api/kontakt, weil /api/widerruf denselben
 * Weg braucht: Ein Widerruf landete bis dahin nur in der Tabelle `widerrufe`,
 * die keine Seite liest — der Betreiber erfuhr davon nichts. Verhalten und
 * Variablennamen sind die des Kontaktformulars, unverändert.
 *
 * Wirft nie. Das Ergebnis sagt, WARUM nichts rausging — der Aufrufer
 * entscheidet, ob das ein Fehler ist (Kontakt: gespeichert reicht; Widerruf:
 * gespeichert ODER zugestellt).
 */

export type BetreiberMail = {
  /** Betreff-Präfix für die Gmail-Filter, z. B. '[Widerruf]'. */
  betreffTag: string;
  name: string;
  /** Adresse, an die geantwortet wird (gehört in der Vorlage in den Reply-To). */
  absender: string;
  nachricht: string;
  thema: string;
  /** ISO-Zeitpunkt des Eingangs — Datum/Uhrzeit der Mail werden daraus gebildet. */
  receivedAt: string;
};

export type BetreiberMailErgebnis =
  | { ok: true }
  | { ok: false; grund: 'nicht-konfiguriert' | 'abgelehnt' | 'netzfehler'; status?: number };

/** Datum und Uhrzeit in deutscher Schreibweise, Zeitzone Berlin. */
export function datumZeitBerlin(iso: string): { datum: string; zeit: string } {
  const d = new Date(iso);
  return {
    datum: d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }),
    zeit: d.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }),
  };
}

export async function sendeBetreiberMail(
  m: BetreiberMail,
  opts: { quelle: string; timeoutMs?: number },
): Promise<BetreiberMailErgebnis> {
  const apiKey = process.env.LOOPS_API_KEY;
  const templateId = process.env.LOOPS_KONTAKT_TEMPLATE_ID;
  if (!apiKey || !templateId) return { ok: false, grund: 'nicht-konfiguriert' };

  const { datum, zeit } = datumZeitBerlin(m.receivedAt);
  try {
    const resp = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionalId: templateId,
        // Empfaenger ist das Postfach, nicht der Absender — die Mail geht an
        // Uwe. Die Absenderadresse steht in den Variablen und gehoert im
        // Template in den Reply-To.
        email: KONTAKT_EMPFAENGER,
        // Loops-Variablennamen sind case-sensitive → beide Schreibweisen
        // senden, damit Template-Tippvarianten (Zeit/zeit …) immer matchen.
        dataVariables: {
          betreff_tag: m.betreffTag, Betreff_tag: m.betreffTag,
          name: m.name,              Name: m.name,
          absender: m.absender,      Absender: m.absender,
          reply_to: m.absender,      Reply_to: m.absender,
          nachricht: m.nachricht,    Nachricht: m.nachricht,
          thema: m.thema,            Thema: m.thema,
          datum,                     Datum: datum,
          zeit,                      Zeit: zeit,
        },
      }),
      ...(opts.timeoutMs ? { signal: AbortSignal.timeout(opts.timeoutMs) } : {}),
    });
    if (!resp.ok) {
      console.error(`[${opts.quelle}] loops`, resp.status, (await resp.text().catch(() => '')).slice(0, 300));
      return { ok: false, grund: 'abgelehnt', status: resp.status };
    }
    return { ok: true };
  } catch (e) {
    console.error(`[${opts.quelle}] loops error`, e);
    return { ok: false, grund: 'netzfehler' };
  }
}
