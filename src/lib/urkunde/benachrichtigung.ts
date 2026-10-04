import 'server-only';
import { sendeBetreiberMail } from '@/lib/betreiber-mail';

/**
 * Meldet eine neue Urkunden-Bestellung an pitmaster@.
 *
 * Bewusst ueber dieselbe Loops-Transaktionsvorlage wie das Kontaktformular
 * (LOOPS_KONTAKT_TEMPLATE_ID): Die Variablen passen, und eine eigene Vorlage
 * waere eine weitere Sache, die vor dem Start in Loops angelegt und gepflegt
 * werden muesste.
 *
 * Seit 03.10.2026 ueber den gemeinsamen Helfer src/lib/betreiber-mail.ts statt
 * ueber eine eigene Kopie des Loops-Aufrufs — Vorlage, Empfaenger und Variablen
 * sind dieselben geblieben (src/__tests__/urkunde-benachrichtigung.test.ts).
 *
 * Scheitert der Versand, ist das kein Grund, die Bestellung abzulehnen — sie
 * steht in der Datenbank und erscheint unter /admin/urkunden. Die Mail ist
 * die Bequemlichkeit, nicht der Nachweis.
 */
export async function meldeBestellung(text: string, absender: string): Promise<boolean> {
  const ergebnis = await sendeBetreiberMail(
    {
      betreffTag: '[Urkunde]',
      name: 'Urkunden-Bestellung',
      absender,
      nachricht: text,
      thema: 'Gedruckte Urkunde',
      receivedAt: new Date().toISOString(),
    },
    { quelle: 'urkunde' },
  );
  if (!ergebnis.ok && ergebnis.grund === 'nicht-konfiguriert') {
    console.warn('[urkunde] LOOPS_API_KEY oder LOOPS_KONTAKT_TEMPLATE_ID fehlt — Bestellung nur gespeichert.');
  }
  return ergebnis.ok;
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
