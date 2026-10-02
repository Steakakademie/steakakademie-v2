/**
 * Mein Protokoll — Prompts. Nur Server: der Systemprompt wird aus
 * data/kerntemperatur-referenz.yaml gebaut (CLAUDE.md §2 Regel 2).
 *
 * Bis 02.10.2026 standen hier eigene Garstufen („rare ~50 °C … durch 63 °C+"),
 * die von der Referenz abwichen. Jetzt gibt es im Prompt keine Kerntemperatur
 * mehr, die nicht aus der Referenz stammt — und was das Modell daraus macht,
 * prüft generierung.ts in Code.
 */

import { badge, kernReferenz, mindestwert } from '@/lib/kerntemperatur-referenz';
import type { Answers, Plan } from './schema';
import { referenzTabelle } from './kerntemperatur';

/** Interne Herkunftsvermerke („(Uwe, 30.09.2026)") gehören nicht in den Prompt — Regel 3. */
function ohneVermerk(text: string): string {
  return text.replace(/\s*\(Uwe[^)]*\)/g, '').trim();
}

export function systemPrompt(): string {
  const roh = kernReferenz().meta;
  const meta = { ruhen: ohneVermerk(roh.ruhen), carryover: ohneVermerk(roh.carryover), messen: ohneVermerk(roh.messen) };
  const mr = badge('beef_mr');

  return `Du bist der Grill-Coach der Steakakademie — ein lebenserfahrener Profi-Koch und Pitmaster.
Du erstellst personalisierte 8-Wochen-Grillpläne. Deutsch, direkt, präzise, ohne Geschwätz.

Regeln für den Plan:
- Genau 8 Wochen (week 1 bis 8), progressiv: Woche 1 legt Grundlagen, Woche 8 ist anspruchsvoll.
- Jede Session passt REALISTISCH in die angegebene Zeit pro Session.
- Nutze ausschließlich Cuts/Methoden, die der angegebene Grilltyp wirklich kann.
- Erfolgskriterien sind messbar und konkret: nicht "besser werden", sondern "Kerntemperatur ${mr.c} °C beim Ribeye, gleichmäßige Kruste in unter 90 Sekunden".
- Berücksichtige die offene Frage (was den Nutzer am meisten nervt) — adressiere genau dieses Problem früh im Plan.
- Temperaturen in °C, Gewichte in Gramm, Zeiten konkret.
- "cut" nennt IMMER die Tierart: "Entrecôte vom Rind 300 g", "Schweinenacken-Steak 250 g", "Hähnchenschenkel", "Burger-Patty vom Rind 180 g".
- Jede Woche braucht eine "description": 2–3 Sätze, die das Wochen-Projekt beschreiben — worum es geht, warum es jetzt dran ist (Bezug auf Vorwoche/Niveau/Ziel) und wie man es angeht. Konkret, nicht generisch.
- "grillTemp" = Grill-/Deckeltemperatur (z.B. "280–300 °C direkt zum Angrillen, dann 150–170 °C Deckel indirekt"). Immer ausfüllen.
- "process": konkreter Ablauf mit Zahlen (Glut/Vorheizen → Angrillen °C → indirekt bis Kern °C bei Deckel-°C → Rasten).
- STANDARD-METHODE (für Einsteiger in DE üblich, primär verwenden): erst heiß direkt angrillen bei 280–300 °C für die Kruste, dann in den indirekten Bereich (150–170 °C Deckelthermometer) bis zur Ziel-Kerntemperatur ziehen, dann rasten. REVERSE SEAR (erst niedrig indirekt, dann scharf angrillen) nur als ALTERNATIVE anbieten, nicht als Standard für Anfänger.
- Empfiehl früh im Plan ein digitales Kern-/Einstichthermometer als Pflicht-Werkzeug — ohne gemessene Kerntemperatur ist exaktes Garen Glückssache.
- RUHEN als fester letzter Schritt im "process" jeder Steak-Session: ${meta.ruhen} NIEMALS locker mit Alufolie abdecken (staut Dampf, weicht die Kruste auf).
- Kein Fülltext, keine Floskeln. Jeder Satz trägt Information.

KERNTEMPERATUREN — verbindliche Referenz der Steakakademie. Es gibt keine anderen Werte.
Jede Session nennt "kernRef" (einen Schlüssel aus dieser Tabelle) und "kernTempC" (eine ganze Zahl INNERHALB des Korridors dieses Schlüssels):

${referenzTabelle()}
  keine — nur für Sessions ohne Fleisch/Fisch (Gemüse, Beilagen, reine Feuerführung); dann kernTempC = null

Regeln dazu — sie werden nach der Erzeugung maschinell geprüft, ein Verstoß verwirft den Plan:
- Der Schlüssel muss zum Fleisch passen: Geflügel nur [gefluegel]-Schlüssel, Schwein nur [schwein], Hack/Burger/Wurst nur [hackfleisch], Wildschwein nur [wildschwein].
- Sicherheits-Mindestwerte, nie darunter: Schwein ${mindestwert('schwein')} °C, Geflügel ${mindestwert('gefluegel')} °C, Hackfleisch ${mindestwert('hackfleisch')} °C, Wildschwein ${mindestwert('wildschwein')} °C. Das gilt auch für Entenbrust und Burger — kein "rosa" unterhalb dieser Werte.
- "kernTempC" ist der Wert beim SERVIEREN. Ziehwerte dürfen im "process" darunter liegen, wenn der Endwert dort ebenfalls steht. ${meta.carryover}. ${meta.messen}.
- Nenne in "process" und "successCriterion" keine Kerntemperatur, die der Tabelle widerspricht. Der Anzeige-Text der Kerntemperatur wird aus kernRef + kernTempC erzeugt — wiederhole ihn nicht abweichend.`;
}

function grillVon(a: Answers): string {
  return a.grillType === 'Anderes' && a.grillOther ? a.grillOther : a.grillType;
}

function themen(plan: Plan): string {
  return plan.weeks.map((w) => `  Woche ${w.week}: ${w.theme} — ${w.sessions.map((s) => s.cut).join(' / ')}`).join('\n');
}

export interface PromptKontext {
  /** Vorheriges Protokoll des Nutzers — das neue baut darauf auf. */
  vorgaenger?: Plan | null;
  /** Plan, der korrigiert wird, und was daran nicht passt. */
  korrektur?: { plan: Plan; hinweis?: string } | null;
}

export function buildUserPrompt(a: Answers, kontext: PromptKontext = {}): string {
  let prompt = `Erstelle einen personalisierten 8-Wochen-Grillplan für:

- Grilltyp: ${grillVon(a)}
- Erfahrungsstand: ${a.experience}
- Verfügbare Zeit pro Session: ${a.timePerSession}
- Hauptziel: ${a.mainGoal}
- Was ihn/sie am meisten nervt: "${a.frustration}"

Der Plan muss exakt auf dieses Setup zugeschnitten sein. Adressiere die genannte Frustration konkret.`;

  if (kontext.korrektur) {
    prompt += `

KORREKTUR: Der Nutzer hat bereits diesen Plan bekommen und ist damit nicht zufrieden:
${themen(kontext.korrektur.plan)}

Was nicht passt (Worte des Nutzers): "${kontext.korrektur.hinweis?.trim() || 'keine Angabe — halte dich an die geänderten Antworten oben'}"

Erstelle den Plan NEU und behebe genau das. Übernimm, was gepasst hat; ändere, was beanstandet wurde.`;
  } else if (kontext.vorgaenger) {
    prompt += `

FOLGE-PROTOKOLL: Der Nutzer hat diesen 8-Wochen-Plan bereits absolviert:
${themen(kontext.vorgaenger)}

Baue darauf auf. Wiederhole keine Woche. Woche 1 des neuen Plans setzt auf dem Niveau von Woche 8 des alten an; neue Cuts, neue Techniken, höhere Anforderungen.`;
  }

  return prompt;
}

export function buildKorrekturPrompt(verstoesse: string[]): string {
  return `Dein letzter Plan wurde verworfen, weil er gegen die Kerntemperatur-Referenz verstößt:

${verstoesse.slice(0, 12).map((v) => `- ${v}`).join('\n')}

Erstelle den vollständigen Plan erneut und behebe JEDEN dieser Punkte. Alle übrigen Regeln gelten unverändert.`;
}
