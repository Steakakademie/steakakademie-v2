/**
 * Saisonfenster der Aktionsseiten — reine Datumslogik ohne Abhängigkeiten, damit auch
 * Client-Bausteine (Header) sie laden können, ohne zod oder den Dateizugriff mitzuziehen.
 * Fenster: `von`/`bis` als „MM-TT" im deutschen Jahreslauf; `bis` darf vor `von` liegen
 * (Jahreswechsel, z. B. Neujahr 12-27 bis 01-31).
 */
export interface Fenster {
  von: string;
  bis: string;
}

/** Tag im Jahr als „MM-TT" in deutscher Zeit — damit das Fenster nicht um Mitternacht UTC kippt. */
export function heuteMMTT(jetzt: Date = new Date()): string {
  const teile = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', month: '2-digit', day: '2-digit' })
    .formatToParts(jetzt);
  const m = teile.find((t) => t.type === 'month')?.value;
  const t = teile.find((t) => t.type === 'day')?.value;
  return `${m}-${t}`;
}

/** Liegt der Tag im Fenster? Fenster über den Jahreswechsel (von > bis) eingeschlossen. */
export function imFenster(fenster: Fenster, mmtt: string): boolean {
  if (fenster.von <= fenster.bis) return mmtt >= fenster.von && mmtt <= fenster.bis;
  return mmtt >= fenster.von || mmtt <= fenster.bis;
}

/** Tage bis zum Beginn des Fensters (0 = heute drin oder beginnt heute), höchstens 365. */
export function tageBisBeginn(fenster: Fenster, jetzt: Date = new Date()): number {
  const heute = heuteMMTT(jetzt);
  if (imFenster(fenster, heute)) return 0;
  const jahr = Number(new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', year: 'numeric' }).format(jetzt));
  const [m, t] = fenster.von.split('-').map(Number);
  const [hm, ht] = heute.split('-').map(Number);
  const beginn = Date.UTC(fenster.von > heute ? jahr : jahr + 1, m - 1, t);
  const heuteUtc = Date.UTC(jahr, hm - 1, ht);
  return Math.round((beginn - heuteUtc) / 86_400_000);
}
