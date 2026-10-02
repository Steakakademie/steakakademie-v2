import 'server-only';

/**
 * Darf die gedruckte Urkunde gerade bestellt werden?
 *
 * Anlass (Audit 02.10.2026): Der Knopf „Zahlungspflichtig bestellen" nahm
 * verbindliche Bestellungen an, waehrend in der Produktion zwei Dinge fehlten:
 *
 *   1. LOOPS_URKUNDE_BESTAETIGUNG_TEMPLATE_ID — ohne sie geht keine
 *      Bestaetigung an den Besteller. Die Seite sagt sie zu, und § 312i Abs. 1
 *      Nr. 3 BGB verlangt sie unverzueglich. bestaetigeBestellung() loggt in
 *      dem Fall nur und meldet der Route `false`, die das ignoriert hat.
 *   2. GELATO_API_KEY — ohne ihn scheitert die Freigabe unter /admin/urkunden
 *      erst beim Druckdienst, nachdem der Kunde bestellt hat.
 *
 * Bestellungen gab es bis dahin keine (urkunden_bestellungen: 0 Zeilen). Statt
 * die Luecke offen zu lassen, wird die Annahme an die Konfiguration gebunden:
 * Fehlt eine der drei Variablen, gibt es kein Bestellformular und die Route
 * antwortet mit 503. Sobald alle gesetzt sind, ist die Bestellung ohne
 * weiteren Deploy-Schritt im Code wieder offen.
 *
 * Kein Schalter zum Umgehen: Eine verbindliche Bestellung ohne Bestaetigung
 * ist genau der Zustand, den es nicht geben soll.
 */
const NOETIG = ['LOOPS_API_KEY', 'LOOPS_URKUNDE_BESTAETIGUNG_TEMPLATE_ID', 'GELATO_API_KEY'] as const;

/** Namen der fehlenden Variablen — fuers Server-Log und /admin, nie nach aussen. */
export function urkundeFehlendeKonfiguration(): string[] {
  return NOETIG.filter((name) => !process.env[name]);
}

export function urkundeBestellbar(): boolean {
  return urkundeFehlendeKonfiguration().length === 0;
}
