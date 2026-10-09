/**
 * Dateien zum Kurs Eigenregie — nur für Käufer, nie aus /public.
 *
 * Die Dateien liegen im privaten Repo Steakakademie/Steakakademie-kursinhalte (Ordner
 * `dateien/`) und werden beim Build von scripts/kursinhalte-holen.mjs nach
 * `privat/kursdateien/` gelegt (gitignored). Ausgeliefert werden sie über
 * src/app/eigenregie/lernen/dateien/[datei]/route.ts hinter dem Kurszugang.
 *
 * Nur Namen aus dieser Liste werden ausgeliefert: kein Pfad aus der Adresse
 * erreicht je das Dateisystem.
 */
import path from 'node:path';

export const KURSDATEIEN = {
  'eigenregie-blueprint.md': {
    titel: 'Eigenregie-Blueprint',
    beschreibung: 'Arbeitsprinzipien, Werkzeuge mit Kosten, vermiedene Umwege und Auftragsvorlagen – als Nachschlagewerk für dein Claude Code.',
  },
  'eigenregie-starterpaket.md': {
    titel: 'Starterpaket: Skills, Sperren, Hooks',
    beschreibung: 'Fertiger Auftrag an dein Claude Code: fünf Skills, Sperren für Rechtstexte und Löschbefehle, zwei Hooks, Selbsttest (Modul 4).',
  },
} as const;

export type Kursdatei = keyof typeof KURSDATEIEN;

export const KURSDATEIEN_ORDNER = path.join('privat', 'kursdateien');

export function istKursdatei(name: string): name is Kursdatei {
  return Object.prototype.hasOwnProperty.call(KURSDATEIEN, name);
}

/** Absoluter Pfad einer erlaubten Datei — oder null für jeden anderen Namen. */
export function kursdateiPfad(name: string, wurzel: string = process.cwd()): string | null {
  return istKursdatei(name) ? path.join(wurzel, KURSDATEIEN_ORDNER, name) : null;
}
