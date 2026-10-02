/**
 * Mein Protokoll — Guthaben: wie viele Protokolle gekauft, wie viele verbraucht.
 *
 * Angebot (Uwe, 02.10.2026): 19 € = 1 Protokoll, 29 € = 2 Protokolle. Je Protokoll
 * gibt es einen Plan plus EINE kostenlose Korrektur. Bis dahin war die
 * Generierung nach einem Kauf unbegrenzt wiederholbar, während die FAQ „jeder
 * Neudurchlauf erfordert einen neuen Kauf" versprach.
 *
 * Reine Logik ohne Datenbank — die Zahlen liefert die Route, die atomare
 * Gegenprüfung beim Speichern macht die DB-Funktion `protokoll_speichern`.
 */

/** Ein Digistore-Produkt (696396), zwei Preispläne. Schwelle statt exaktem
 *  Betrag, damit ein Rabattcode auf das 29-€-Paket nicht auf 1 zurückfällt
 *  (29 € − 20 % = 23,20 €); 19 € bleibt immer darunter. Gleiches Muster wie
 *  CREDIT_PACK_MIN_BRUTTO im Webhook. */
export const PAKET_2_MIN_BRUTTO = 22;

export const PAKETE = [
  { protokolle: 1, preis: 19, titel: '1 Protokoll',  zeile: '8 Wochen, ein Plan, eine kostenlose Korrektur' },
  { protokolle: 2, preis: 29, titel: '2 Protokolle', zeile: '16 Wochen — das zweite baut auf dem ersten auf; je eine kostenlose Korrektur' },
] as const;

export function protokolleFuerBetrag(bruttoRoh: string | number | null | undefined): 1 | 2 {
  const brutto = Math.abs(typeof bruttoRoh === 'number' ? bruttoRoh : parseFloat(String(bruttoRoh ?? '').replace(',', '.')));
  return Number.isFinite(brutto) && brutto >= PAKET_2_MIN_BRUTTO ? 2 : 1;
}

export interface ProtokollZeile {
  id: string;
  korrektur_von: string | null;
  created_at: string;
}

export interface Protokoll {
  /** Laufende Nummer in Kaufreihenfolge, beginnend bei 1. */
  nr: number;
  /** Der ursprüngliche Plan. */
  basisId: string;
  /** Was angezeigt wird: die Korrektur, falls es eine gibt, sonst der ursprüngliche Plan. */
  aktuellId: string;
  korrigiert: boolean;
  erstelltAm: string;
}

export interface Guthaben {
  gekauft: number;
  verbraucht: number;
  /** Noch nicht erstellte, bezahlte Protokolle. */
  frei: number;
  protokolle: Protokoll[];
  /** Jüngstes Protokoll, dessen kostenlose Korrektur noch offen ist. */
  korrigierbar: Protokoll | null;
}

export function berechneGuthaben(gekauft: number, zeilen: ProtokollZeile[]): Guthaben {
  const sortiert = [...zeilen].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const basen = sortiert.filter((z) => !z.korrektur_von);

  const protokolle: Protokoll[] = basen.map((b, i) => {
    const korrektur = sortiert.find((z) => z.korrektur_von === b.id);
    return {
      nr: i + 1,
      basisId: b.id,
      aktuellId: korrektur?.id ?? b.id,
      korrigiert: Boolean(korrektur),
      erstelltAm: b.created_at,
    };
  });

  const verbraucht = protokolle.length;
  const offen = protokolle.filter((p) => !p.korrigiert);
  return {
    gekauft: Math.max(0, gekauft),
    verbraucht,
    frei: Math.max(0, gekauft - verbraucht),
    protokolle,
    korrigierbar: offen.length ? offen[offen.length - 1] : null,
  };
}
