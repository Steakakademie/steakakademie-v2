/**
 * check-speicher.ts — welche Lektions-Checks jemand bestanden hat.
 *
 * BEWUSST NUR IM BROWSER (Uwe, 09.09.2026). Der Check ist eine Uebung, kein
 * Nachweis; fuer jede beantwortete Frage eine Datenbankzeile zu schreiben waere
 * Aufwand ohne Gegenwert. Ausserdem ist Stufe 1 absichtlich ohne Anmeldung
 * nutzbar — ein Konto zur Voraussetzung zu machen wuerde genau die Leute
 * aussperren, fuer die der kostenlose Trichter gebaut ist.
 *
 * Folge, die man kennen muss: Wer Browser oder Geraet wechselt, faengt beim
 * Kohlebett wieder bei null an. Bestandene STUFENPRUEFUNGEN sind davon nicht
 * betroffen — die liegen in course_progress und bleiben.
 *
 * Nicht zu verwechseln mit `steakakademie_gelesen` (LektionFortschritt): Das
 * ist der Lesestand („hab ich angesehen"), hier steht das Verstandene („hab
 * ich beantwortet"). Zwei Aussagen, zwei Schluessel.
 *
 * Jeder Zugriff ist in try/catch: Im privaten Modus und bei geblockten
 * Website-Daten wirft schon das Lesen. Dann faellt alles still auf „nichts
 * bestanden" zurueck — die Seite bleibt benutzbar.
 */

const SCHLUESSEL = 'steakakademie_check';

export function ladeBestandeneChecks(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const roh = window.localStorage.getItem(SCHLUESSEL);
    const wert: unknown = roh ? JSON.parse(roh) : [];
    return new Set(
      Array.isArray(wert) ? wert.filter((x): x is string => typeof x === 'string') : [],
    );
  } catch {
    return new Set();
  }
}

/**
 * Ereignis, mit dem das Glutbett von einem bestandenen Check erfaehrt.
 *
 * Der Check steht unten unter der Lektion, das Glutbett oben im Kopf — zwei
 * Komponenten ohne gemeinsamen Elternteil, die denselben Zustand brauchen. Ein
 * Kontext oder eine Zustandsbibliothek waere fuer diese eine Zahl zu viel
 * Apparat; ein Fensterereignis reicht und haelt beide Seiten unabhaengig.
 */
export const CHECK_EREIGNIS = 'steakakademie:check-bestanden';

export function merkeBestandenenCheck(lektionSlug: string): Set<string> {
  const vorher = ladeBestandeneChecks();
  const istNeu = !vorher.has(lektionSlug);
  const menge = new Set(vorher);
  menge.add(lektionSlug);
  try {
    window.localStorage.setItem(SCHLUESSEL, JSON.stringify(Array.from(menge)));
  } catch {
    /* privater Modus — dann gilt es nur fuer diese Sitzung */
  }
  // Nur bei einer WIRKLICH neuen Lektion zuenden. Sonst flackert das Bett bei
  // jedem „Nochmal" erneut auf, und aus der Belohnung wird ein Zucken.
  if (istNeu && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHECK_EREIGNIS, { detail: { lektionSlug } }));
  }
  return menge;
}

/** Wie viele der uebergebenen Lektionen bestanden sind — Grundlage des Glutbetts. */
export function anzahlBestanden(slugs: readonly string[]): number {
  const menge = ladeBestandeneChecks();
  return slugs.filter((s) => menge.has(s)).length;
}
