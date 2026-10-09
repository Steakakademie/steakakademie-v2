/**
 * Gültigkeitsdatum eines Geschenkgutscheins als Text für die Gutschein-Mail.
 *
 * Quelle der Wahrheit ist `vouchers.valid_until` (Datenbank-Vorgabe seit
 * Migration 20261009170345: 31.12. des dritten Folgejahres, 23:59:59 Berlin —
 * AGB § 5a). Die Mail zeigt genau dieses Datum, damit sie mit der Geschenkseite
 * (`/gutschein/[code]`) übereinstimmt.
 *
 * Fehlt der Wert (Lesefehler), rechnet die Funktion dieselbe Regel selbst nach,
 * statt die Mail ohne Datum zu verschicken.
 */

const ZEITZONE = 'Europe/Berlin';

function datumDe(d: Date): string {
  return d.toLocaleDateString('de-DE', {
    timeZone: ZEITZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Jahr eines Zeitpunkts in Berliner Zeit (Silvesterabend zählt noch zum alten Jahr). */
function jahrInBerlin(d: Date): number {
  return Number(d.toLocaleDateString('de-DE', { timeZone: ZEITZONE, year: 'numeric' }));
}

/**
 * @param validUntil Wert aus `vouchers.valid_until` (ISO-Zeitstempel) oder null
 * @param jetzt      Kaufzeitpunkt für die Ersatzrechnung (Standard: jetzt)
 * @returns z. B. "31.12.2029"
 */
export function gueltigBisText(validUntil: string | null | undefined, jetzt: Date = new Date()): string {
  if (validUntil) {
    const d = new Date(validUntil);
    if (!Number.isNaN(d.getTime())) return datumDe(d);
  }
  return `31.12.${jahrInBerlin(jetzt) + 3}`;
}
