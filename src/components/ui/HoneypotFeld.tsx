/**
 * Honeypot — ein Feld, das kein Mensch sieht und keiner ausfüllt.
 *
 * Bots füllen jedes Textfeld, das sie finden. Ist `website` beim Eingang gefüllt,
 * verwirft der Server die Anfrage still mit einem freundlichen 200 (guardRequest,
 * Option `honeypot`). Kein `type="hidden"`: Das lassen Bots eher aus.
 *
 * Unkontrolliert — der Wert geht mit dem Formular (FormData) oder wird vor dem
 * fetch aus dem Formular gelesen (`honeypotWert(form)`).
 */

export const HONEYPOT_FELD = 'website';

export default function HoneypotFeld() {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
      <label htmlFor={`hp-${HONEYPOT_FELD}`}>Website (bitte frei lassen)</label>
      <input id={`hp-${HONEYPOT_FELD}`} name={HONEYPOT_FELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

/** Wert des Honeypot-Felds aus einem Formular lesen (für fetch-basierte Formulare). */
export function honeypotWert(form: HTMLFormElement | null): string {
  if (!form) return '';
  const el = form.elements.namedItem(HONEYPOT_FELD);
  return el instanceof HTMLInputElement ? el.value : '';
}
