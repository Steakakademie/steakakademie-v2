/**
 * Mein Protokoll — Schema, gegen das generiert wird, plus Prüfung und Umsetzung
 * in das Anzeige-Format. Nur Server (kerntemperatur.ts liest die Referenz).
 *
 * Unterschied zum Anzeige-Schema (./schema.ts): Hier sind Beschreibung, Ablauf
 * und Grilltemperatur Pflicht, und die Kerntemperatur ist kein Freitext, sondern
 * Schlüssel + Zahl. Den Anzeige-Text setzt kernAnzeige() aus den geprüften
 * Werten zusammen — er kann von der Prüfung nicht abweichen.
 */

import { z } from 'zod';
import type { Plan } from './schema';
import { KEIN_KERNWERT, kernAnzeige, kernRefs, pruefeSession } from './kerntemperatur';

export function generierungsSchema() {
  const keys = [KEIN_KERNWERT, ...kernRefs().map((r) => r.key)] as [string, ...string[]];

  const Session = z.object({
    cut:              z.string().min(3).describe('Cut MIT Tierart und Gewicht, z.B. "Entrecôte vom Rind 300 g", "Schweinenacken-Steak 250 g", "Hähnchenschenkel 4 Stück"'),
    method:           z.string().min(3).describe('Methode, z.B. "Heiß angrillen + indirekt ziehen", "Reverse Sear", "direkt"'),
    grillTemp:        z.string().min(3).describe('Grill-/Deckeltemperaturen konkret, z.B. "280–300 °C direkt zum Angrillen, danach 150–170 °C Deckel indirekt"'),
    kernRef:          z.enum(keys).describe('Schlüssel aus der Referenztabelle im Systemprompt. "keine" nur bei Sessions ohne Fleisch/Fisch.'),
    kernTempC:        z.number().int().min(30).max(99).nullable().describe('Ziel-Kerntemperatur beim Servieren in °C, INNERHALB des Korridors von kernRef. null nur bei kernRef "keine".'),
    process:          z.string().min(20).describe('Ablauf in 2–4 kurzen Schritten mit Zahlen: Vorheizen → Angrillen → indirekt bis Kerntemperatur → Rasten'),
    timePlanning:     z.string().min(3).describe('Zeitplanung der Session, z.B. "ca. 90 Min inkl. Ruhephase"'),
    successCriterion: z.string().min(10).describe('Konkretes, messbares Erfolgskriterium für diese Session'),
  });

  const Week = z.object({
    week:        z.number().int().min(1).max(8),
    theme:       z.string().min(3).describe('Wochenthema, kurz, z.B. "Temperaturkontrolle"'),
    description: z.string().min(20).describe('2–3 Sätze: worum es diese Woche geht, warum das jetzt dran ist und wie man es angeht'),
    sessions:    z.array(Session).min(1).max(2).describe('1–2 Sessions, realistisch in der angegebenen Zeit'),
    note:        z.string().min(3).describe('Kurzer Coaching-Hinweis für diese Woche, 1 Satz'),
  });

  return z.object({
    intro:       z.string().min(20).describe('Persönliche Einleitung, 2–3 Sätze, bezieht sich auf Grilltyp + Niveau + Ziel'),
    focusAreas:  z.array(z.string()).min(3).max(4).describe('3–4 Schwerpunkte über die 8 Wochen'),
    weeks:       z.array(Week).length(8).describe('Genau 8 Wochen, progressiv aufgebaut'),
    closingNote: z.string().min(10).describe('Abschluss-Satz: was der Nutzer nach 8 Wochen können wird'),
  });
}

export type GenerierterPlan = z.infer<ReturnType<typeof generierungsSchema>>;

/** Alle Verstöße des Plans gegen Referenz und Aufbau — leer heißt speicherbar. */
export function pruefePlan(plan: GenerierterPlan): string[] {
  const fehler: string[] = [];

  const wochen = plan.weeks.map((w) => w.week);
  if (wochen.join(',') !== '1,2,3,4,5,6,7,8') {
    fehler.push(`Die Wochen müssen 1 bis 8 in dieser Reihenfolge sein (erhalten: ${wochen.join(', ')}).`);
  }

  for (const w of plan.weeks) {
    w.sessions.forEach((s, i) => {
      for (const f of pruefeSession(s)) fehler.push(`Woche ${w.week}, Session ${i + 1} — ${f}`);
    });
  }
  return fehler;
}

/** Geprüften Plan in das gespeicherte Anzeige-Format bringen. */
export function zuAnzeige(plan: GenerierterPlan): Plan {
  return {
    intro: plan.intro,
    focusAreas: plan.focusAreas,
    closingNote: plan.closingNote,
    weeks: plan.weeks.map((w) => ({
      week: w.week,
      theme: w.theme,
      description: w.description,
      note: w.note,
      sessions: w.sessions.map((s) => ({
        cut: s.cut,
        method: s.method,
        grillTemp: s.grillTemp,
        targetTemp: kernAnzeige(s),
        kernRef: s.kernRef,
        kernTempC: s.kernTempC,
        process: s.process,
        timePlanning: s.timePlanning,
        successCriterion: s.successCriterion,
      })),
    })),
  };
}
