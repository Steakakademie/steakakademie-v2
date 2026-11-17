/**
 * Antwort des Content-Scouts lesen und den Lauf bewerten — ohne Netz, ohne Clients,
 * damit beides testbar ist (scripts/scout-antwort.test.mjs).
 *
 * ANLASS (17.11.2026): content-grow lief am 08.11. und 15.11.2026 gruen durch und
 * lieferte 1 bzw. 0 Entwuerfe aus 5 bzw. 6 Briefings. Jede Generierung endete mit
 * „Kein JSON in Antwort", der Bericht zeigte „Fehler: 0", der Workflow blieb gruen.
 * Der Ops-Heartbeat meldete den Stillstand erst nach 10 Tagen.
 */

/** Hoechstlaenge der Antwort. 3072 war fuer 600–1000 Woerter JSON plus Denkanteil zu knapp. */
export const SCOUT_MAX_TOKENS = 8000

/**
 * JSON-Objekt aus der Modellantwort holen. Wirft mit einer Meldung, die die Ursache
 * nennt — abgeschnitten (max_tokens) ist etwas anderes als „Modell hat Prosa geschrieben".
 */
export function leseAntwort (msg) {
  const text = msg?.content?.find?.(b => b.type === 'text')?.text ?? ''
  const grund = msg?.stop_reason ?? '?'
  if (grund === 'max_tokens') {
    throw new Error(`Antwort bei max_tokens abgeschnitten (${text.length} Zeichen Text)`)
  }
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error(`Kein JSON in Antwort (stop_reason=${grund}, ${text.length} Zeichen Text)`)
  try {
    return JSON.parse(m[0])
  } catch (e) {
    throw new Error(`JSON nicht lesbar (stop_reason=${grund}): ${e.message}`)
  }
}

/** Vom Qualitaets-Gate verworfen ist ein Ergebnis, kein Ausfall. */
export function istTechnischerFehler (meldung = '') {
  return !String(meldung).startsWith('Gate:')
}

/**
 * Ausfall = es gab Briefings, kein einziger Entwurf entstand und mindestens ein Versuch
 * scheiterte technisch. Hat das Gate alles verworfen, bleibt der Lauf gruen.
 */
export function laufGescheitert ({ briefings = 0, generiert = 0, technisch = 0 } = {}) {
  return briefings > 0 && generiert === 0 && technisch > 0
}
