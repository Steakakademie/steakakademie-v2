/**
 * Geschenkgutscheine: Personalisierung und Versand zum Wunschtermin (Uwe, 11.10.2026).
 *
 * Reine Logik ohne Server-Abhängigkeit — die Geschenkseite, das Formular (Client)
 * und die API (`/api/gutschein/personalisieren`) nutzen dieselben Regeln.
 * Konzept: docs/gutschein-sichtbarkeit-konzept.md, Muster M1 und M2.
 */
import { z } from 'zod';

const ZEITZONE = 'Europe/Berlin';

// ─── Motive ─────────────────────────────────────────────────────────────────

export const MOTIV_KEYS = ['glut', 'weihnachten', 'geburtstag', 'vatertag', 'danke'] as const;
export type MotivKey = (typeof MOTIV_KEYS)[number];

export interface Motiv {
  label: string;
  /** Zeile über dem Produktnamen auf der Geschenkseite und in der Mail; null = keine. */
  ueberschrift: string | null;
  /** Farbe des Glüh-Verlaufs auf der Geschenkseite. */
  farbe: string;
}

export const MOTIVE: Record<MotivKey, Motiv> = {
  glut:        { label: 'Glut (ohne Anlass)', ueberschrift: null,                         farbe: '#E85018' },
  weihnachten: { label: 'Weihnachten',        ueberschrift: 'Frohe Weihnachten!',         farbe: '#B3261E' },
  geburtstag:  { label: 'Geburtstag',         ueberschrift: 'Alles Gute zum Geburtstag!', farbe: '#C8882A' },
  vatertag:    { label: 'Vatertag',           ueberschrift: 'Alles Gute zum Vatertag!',   farbe: '#8A5A2B' },
  danke:       { label: 'Danke',              ueberschrift: 'Danke!',                      farbe: '#C8882A' },
};

export function motivOderStandard(wert: string | null | undefined): MotivKey {
  return (MOTIV_KEYS as readonly string[]).includes(wert ?? '') ? (wert as MotivKey) : 'glut';
}

// ─── Grenzen ────────────────────────────────────────────────────────────────

export const GRENZEN = {
  name: 60,
  nachricht: 300,
  email: 254,
  /** Frühester Termin: so weit in der Zukunft, dass der Lauf ihn sicher noch sieht. */
  vorlaufMinuten: 10,
  /** Spätester Termin ab heute, zusätzlich nie nach Ablauf des Gutscheins. */
  maxTageVoraus: 400,
  /** Uhrzeiten, die das Formular anbietet (volle Stunden, Berliner Zeit). */
  ersteStunde: 6,
  letzteStunde: 22,
} as const;

/** Versuche, bevor ein Versand als fehlgeschlagen gilt (je ein Lauf pro Stunde). */
export const MAX_VERSAND_VERSUCHE = 3;

// ─── Eingabe ────────────────────────────────────────────────────────────────

const optionalerText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Höchstens ${max} Zeichen.`)
    .transform((s) => (s === '' ? null : s))
    .nullable()
    .optional()
    .transform((s) => s ?? null);

export const PersonalisierungSchema = z
  .object({
    code: z.string().trim().min(1).max(64),
    k: z.string().trim().min(1).max(64),
    empfaengerName: optionalerText(GRENZEN.name),
    schenkerName: optionalerText(GRENZEN.name),
    nachricht: optionalerText(GRENZEN.nachricht),
    motiv: z.enum(MOTIV_KEYS),
    versand: z.enum(['selbst', 'mail']),
    empfaengerEmail: z
      .string()
      .trim()
      .max(GRENZEN.email)
      .email('Bitte eine gültige E-Mail-Adresse eingeben.')
      .optional(),
    /** 'sofort' oder Termin als Datum (YYYY-MM-DD) + volle Stunde in Berliner Zeit. */
    zeitpunkt: z.enum(['sofort', 'termin']).optional(),
    datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    stunde: z.number().int().min(GRENZEN.ersteStunde).max(GRENZEN.letzteStunde).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.versand !== 'mail') return;
    if (!v.empfaengerEmail) {
      ctx.addIssue({ code: 'custom', path: ['empfaengerEmail'], message: 'Wohin sollen wir den Gutschein schicken?' });
    }
    if (!v.schenkerName) {
      ctx.addIssue({ code: 'custom', path: ['schenkerName'], message: 'Dein Name steht in der Mail — sonst weiß niemand, von wem das Geschenk kommt.' });
    }
    if (!v.zeitpunkt) {
      ctx.addIssue({ code: 'custom', path: ['zeitpunkt'], message: 'Sofort oder zu einem Termin?' });
    }
    if (v.zeitpunkt === 'termin' && (!v.datum || v.stunde === undefined)) {
      ctx.addIssue({ code: 'custom', path: ['datum'], message: 'Bitte Tag und Uhrzeit wählen.' });
    }
  });

export type PersonalisierungEingabe = z.infer<typeof PersonalisierungSchema>;

// ─── Zeit ───────────────────────────────────────────────────────────────────

/** Abstand Berlin − UTC in Minuten für einen Zeitpunkt (60 im Winter, 120 im Sommer). */
function berlinOffsetMinuten(zeitpunkt: Date): number {
  const teile = new Intl.DateTimeFormat('en-US', {
    timeZone: ZEITZONE,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(zeitpunkt);
  const w = (t: string) => Number(teile.find((p) => p.type === t)?.value);
  const alsUtc = Date.UTC(w('year'), w('month') - 1, w('day'), w('hour'), w('minute'), w('second'));
  return Math.round((alsUtc - zeitpunkt.getTime()) / 60_000);
}

/**
 * Tag + volle Stunde in Berliner Zeit → UTC-Zeitpunkt.
 * Zweimal angenähert, damit Tage mit Zeitumstellung stimmen.
 */
export function berlinZuUtc(datum: string, stunde: number): Date {
  const [j, m, t] = datum.split('-').map(Number);
  const naiv = Date.UTC(j, m - 1, t, stunde, 0, 0);
  let ergebnis = new Date(naiv - berlinOffsetMinuten(new Date(naiv)) * 60_000);
  ergebnis = new Date(naiv - berlinOffsetMinuten(ergebnis) * 60_000);
  return ergebnis;
}

/** „24.12.2026, 8:00 Uhr" */
export function versandZeitText(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const datum = d.toLocaleDateString('de-DE', { timeZone: ZEITZONE, day: '2-digit', month: '2-digit', year: 'numeric' });
  const zeit = d.toLocaleTimeString('de-DE', { timeZone: ZEITZONE, hour: 'numeric', minute: '2-digit' });
  return `${datum}, ${zeit} Uhr`;
}

/** Datum (YYYY-MM-DD) und Stunde eines Zeitpunkts in Berliner Zeit — zum Vorbelegen des Formulars. */
export function berlinDatumStunde(iso: string | Date): { datum: string; stunde: number } {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const datum = d.toLocaleDateString('sv-SE', { timeZone: ZEITZONE });
  const stunde = Number(d.toLocaleTimeString('de-DE', { timeZone: ZEITZONE, hour: '2-digit', hourCycle: 'h23' }).slice(0, 2));
  return { datum, stunde };
}

/**
 * Prüft einen Wunschtermin. Gibt eine Fehlermeldung zurück oder null.
 * @param termin   gewählter Zeitpunkt
 * @param gueltigBis valid_until des Gutscheins
 */
export function pruefeTermin(termin: Date, gueltigBis: Date, jetzt: Date = new Date()): string | null {
  if (Number.isNaN(termin.getTime())) return 'Dieser Termin ist ungültig.';
  if (termin.getTime() < jetzt.getTime() + GRENZEN.vorlaufMinuten * 60_000) {
    return 'Der Termin liegt in der Vergangenheit oder zu knapp — wähle „Sofort" oder eine spätere Uhrzeit.';
  }
  if (termin.getTime() > jetzt.getTime() + GRENZEN.maxTageVoraus * 86_400_000) {
    return `Höchstens ${GRENZEN.maxTageVoraus} Tage im Voraus.`;
  }
  if (termin.getTime() > gueltigBis.getTime()) {
    return 'Der Termin liegt nach dem Ablauf des Gutscheins.';
  }
  return null;
}

// ─── Sonstiges ──────────────────────────────────────────────────────────────

/** „anna@example.de" → „a•••@example.de" — für die Statusanzeige nach dem Versand. */
export function maskiereEmail(email: string): string {
  const [lokal, domain] = email.split('@');
  if (!domain) return '•••';
  return `${lokal.slice(0, 1)}•••@${domain}`;
}

/** Vergleich in konstanter Zeit (gleiche Länge vorausgesetzt), damit der Schlüssel nicht erraten wird. */
export function schluesselGleich(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
