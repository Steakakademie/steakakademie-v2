import 'server-only';
import { KONTAKT_EMPFAENGER } from '@/lib/kontakt';

/**
 * Meldet eine neue Urkunden-Bestellung an pitmaster@.
 *
 * Bewusst ueber dieselbe Loops-Transaktionsvorlage wie das Kontaktformular
 * (LOOPS_KONTAKT_TEMPLATE_ID): Die Variablen passen, und eine eigene Vorlage
 * waere eine weitere Sache, die vor dem Start in Loops angelegt und gepflegt
 * werden muesste.
 *
 * Scheitert der Versand, ist das kein Grund, die Bestellung abzulehnen — sie
 * steht in der Datenbank und erscheint unter /admin/urkunden. Die Mail ist
 * die Bequemlichkeit, nicht der Nachweis.
 */
export async function meldeBestellung(text: string, absender: string): Promise<boolean> {
  const apiKey = process.env.LOOPS_API_KEY;
  const templateId = process.env.LOOPS_KONTAKT_TEMPLATE_ID;
  if (!apiKey || !templateId) {
    console.warn('[urkunde] LOOPS_API_KEY oder LOOPS_KONTAKT_TEMPLATE_ID fehlt — Bestellung nur gespeichert.');
    return false;
  }

  const d = new Date();
  try {
    const resp = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionalId: templateId,
        email: KONTAKT_EMPFAENGER,
        // Loops-Variablennamen sind case-sensitive → beide Schreibweisen, wie in /api/kontakt.
        dataVariables: {
          betreff_tag: '[Urkunde]', Betreff_tag: '[Urkunde]',
          name: 'Urkunden-Bestellung', Name: 'Urkunden-Bestellung',
          absender, Absender: absender,
          reply_to: absender, Reply_to: absender,
          nachricht: text, Nachricht: text,
          thema: 'Gedruckte Urkunde', Thema: 'Gedruckte Urkunde',
          datum: d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }),
          Datum: d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }),
          zeit: d.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }),
          Zeit: d.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }),
        },
      }),
    });
    if (!resp.ok) console.error('[urkunde] loops', resp.status, (await resp.text()).slice(0, 300));
    return resp.ok;
  } catch (e) {
    console.error('[urkunde] loops error', e);
    return false;
  }
}

/**
 * Bestaetigung an den Besteller (§ 312i Abs. 1 Nr. 3 BGB: Zugang der Bestellung
 * unverzueglich auf elektronischem Weg bestaetigen).
 *
 * Braucht eine eigene Loops-Transaktionsvorlage (LOOPS_URKUNDE_BESTAETIGUNG_TEMPLATE_ID,
 * Variablen: stufe_name, name_auf_urkunde, preis, bestell_id, adresse, widerruf_hinweis) —
 * die Loops-API legt keine Vorlagen an, sie entstehen im Loops-Editor. Fehlt die
 * Variable, wird nur geloggt; die Bestellung bleibt gespeichert.
 */
export async function bestaetigeBestellung(
  email: string,
  v: { stufeName: string; nameAufUrkunde: string; preis: string; bestellId: string; adresse: string; widerrufHinweis: string },
): Promise<boolean> {
  const apiKey = process.env.LOOPS_API_KEY;
  const templateId = process.env.LOOPS_URKUNDE_BESTAETIGUNG_TEMPLATE_ID;
  if (!apiKey || !templateId) {
    console.warn('[urkunde] LOOPS_URKUNDE_BESTAETIGUNG_TEMPLATE_ID fehlt — keine Bestaetigung an den Besteller.');
    return false;
  }
  try {
    const resp = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionalId: templateId,
        email,
        dataVariables: {
          stufe_name: v.stufeName,
          name_auf_urkunde: v.nameAufUrkunde,
          preis: v.preis,
          bestell_id: v.bestellId,
          adresse: v.adresse,
          widerruf_hinweis: v.widerrufHinweis,
        },
      }),
    });
    if (!resp.ok) console.error('[urkunde] loops bestaetigung', resp.status, (await resp.text()).slice(0, 300));
    return resp.ok;
  } catch (e) {
    console.error('[urkunde] loops bestaetigung error', e);
    return false;
  }
}
