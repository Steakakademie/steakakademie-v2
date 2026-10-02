/**
 * Mein Protokoll (Produkt B) — Schemas
 *
 * Fragebogen-Antworten (Input) + gespeicherter 8-Wochen-Plan (Anzeige).
 * Geteilt zwischen Generate-API (server) und Anzeige (client/server) — deshalb
 * hier KEIN Dateizugriff. Das strengere Schema, gegen das generiert wird, steht
 * in ./generierung.ts (nur Server, liest die Kerntemperatur-Referenz).
 */

import { z } from 'zod';

// ─── Fragebogen-Antworten ─────────────────────────────────────────────────────

export const GRILL_TYPES = ['Kugelgrill', 'Gasgrill', 'Pelletgrill', 'Kamado', 'Offset-Smoker', 'Anderes'] as const;
export const EXPERIENCE  = ['Einsteiger', 'Gelegentlich aktiv', 'Regelmäßig', 'Ambitioniert'] as const;
export const TIME_SLOTS  = ['1–2 Stunden', '3–4 Stunden', 'Halber Tag', 'Flexibel'] as const;
export const GOALS       = ['Techniken meistern', 'Bestimmten Cut perfektionieren', 'Gäste beeindrucken', 'Wettbewerb vorbereiten'] as const;

export const AnswersSchema = z.object({
  grillType:   z.enum(GRILL_TYPES),
  grillOther:  z.string().max(120).optional(),
  experience:  z.enum(EXPERIENCE),
  timePerSession: z.enum(TIME_SLOTS),
  mainGoal:    z.enum(GOALS),
  frustration: z.string().min(3).max(600).describe('Offene Frage: Was nervt dich beim Grillen am meisten?'),
});

export type Answers = z.infer<typeof AnswersSchema>;

/** Was der Generator-Endpunkt entgegennimmt: Antworten + Auftrag. */
export const AuftragSchema = AnswersSchema.extend({
  /** 'neu' verbraucht ein gekauftes Protokoll, 'korrektur' die eine kostenlose Korrektur. */
  modus:        z.enum(['neu', 'korrektur']).default('neu'),
  /** Protokoll, das korrigiert werden soll (nur bei modus 'korrektur'). */
  korrekturVon: z.string().uuid().optional(),
  /** Was am bisherigen Plan nicht passt (nur bei modus 'korrektur'). */
  hinweis:      z.string().trim().max(600).optional(),
  /** Ausdrückliche Bestätigung, dass jetzt erstellt und Guthaben verbraucht wird. */
  bestaetigt:   z.literal(true),
});

export type Auftrag = z.infer<typeof AuftragSchema>;

// ─── Generierter Plan ──────────────────────────────────────────────────────────

export const SessionSchema = z.object({
  cut:              z.string().describe('Cut mit Gewicht, z.B. "Entrecôte 300g"'),
  method:           z.string().describe('Methode, z.B. "Heiß angrillen + indirekt ziehen", "Reverse Sear", "direkt"'),
  grillTemp:        z.string().optional().describe('Grill-/Deckeltemperaturen konkret, z.B. "280–300 °C direkt zum Angrillen, danach ~150–170 °C Deckel indirekt". IMMER ausfüllen.'),
  targetTemp:       z.string().describe('Ziel-KERNtemperatur mit Gargrad, z.B. "54 °C Kern (medium rare)"'),
  // Seit 02.10.2026: Schlüssel aus data/kerntemperatur-referenz.yaml + geprüfte Zahl.
  // Optional, weil ältere gespeicherte Pläne die Felder nicht haben.
  kernRef:          z.string().optional(),
  kernTempC:        z.number().nullable().optional(),
  process:          z.string().optional().describe('Ablauf in 2–4 kurzen Schritten: Glut/Vorheizen → Angrillen (°C, beide Seiten) → in indirekten Bereich (Deckel-°C) bis Kerntemperatur → Rasten. Konkret mit Zahlen. IMMER ausfüllen.'),
  timePlanning:     z.string().describe('Zeitplanung der Session, z.B. "ca. 90 Min inkl. Ruhephase"'),
  successCriterion: z.string().describe('Konkretes, messbares Erfolgskriterium für diese Session'),
});

export const WeekSchema = z.object({
  week:        z.number().int().min(1).max(8),
  theme:       z.string().describe('Wochenthema, kurz, z.B. "Temperaturkontrolle"'),
  description: z.string().optional().describe('2–3 Sätze: worum es diese Woche geht, warum das dran ist (Bezug zum Vorwissen/Ziel) und wie man es angeht. Die Beschreibung des Wochen-Projekts — konkret, kein Fülltext. IMMER ausfüllen.'),
  sessions:    z.array(SessionSchema).min(1).max(2).describe('1–2 Sessions, realistisch in der angegebenen Zeit'),
  note:        z.string().describe('Kurzer Coaching-Hinweis für diese Woche, 1 Satz'),
});

export const PlanSchema = z.object({
  intro:       z.string().describe('Persönliche Einleitung, 2–3 Sätze, bezieht sich auf Grilltyp + Niveau + Ziel des Nutzers'),
  focusAreas:  z.array(z.string()).min(3).max(4).describe('3–4 Schwerpunkte über die 8 Wochen'),
  weeks:       z.array(WeekSchema).length(8).describe('Genau 8 Wochen, progressiv aufgebaut — Woche 8 deutlich anspruchsvoller als Woche 1'),
  closingNote: z.string().describe('Abschluss-Satz: was der Nutzer nach 8 Wochen können wird'),
});

export type Plan = z.infer<typeof PlanSchema>;
