/**
 * Mein Protokoll — Kerntemperaturen an die Referenz binden.
 *
 * Bis 02.10.2026 standen die Garstufen als Freitext im Systemprompt
 * („rare ~50 °C … durch 63 °C+") und wichen von data/kerntemperatur-referenz.yaml
 * ab (dort: Rare 45–49, Well Done 70–99). Sicherheits-Mindestwerte kamen im
 * Prompt gar nicht vor; die Ausgabe wurde ungeprüft gespeichert und verkauft.
 *
 * Jetzt wählt das Modell je Session einen SCHLÜSSEL aus der Referenz (`kernRef`)
 * und nennt dazu eine Zahl (`kernTempC`). Geprüft wird in Code, nicht im Prompt:
 *
 *   1. Die Zahl liegt im Korridor des gewählten Schlüssels.
 *   2. Der Schlüssel passt zum Fleisch: Steht im Cut Geflügel, Hack, Schwein oder
 *      Wildschwein, muss der Schlüssel aus genau dieser Klasse stammen.
 *   3. Die Zahl liegt nie unter dem Sicherheits-Mindestwert der Klasse.
 *   4. Nennt der Freitext (Ablauf, Erfolgskriterium) Kernwerte, erreicht der
 *      höchste davon den Mindestwert — Ziehwerte darunter sind erlaubt, solange
 *      der Endwert dasteht.
 *
 * CLAUDE.md §2 Regel 2: Automatisch erzeugte Texte bleiben beim Sicherheits-
 * minimum. Die Ausnahmen der Referenz (`unter_sicherheit`: Entenbrust rosa,
 * Wildschwein-Rücken/-Filet rosa) stehen dem Generator deshalb NICHT zur Wahl.
 *
 * Nur serverseitig (liest die YAML von der Platte).
 */

import { garstufenRind, kernReferenz, mindestwert } from '@/lib/kerntemperatur-referenz';

export type Klasse = 'rind' | 'lamm' | 'schwein' | 'gefluegel' | 'hackfleisch' | 'wildschwein' | 'fisch';

export interface KernRef {
  key: string;
  klasse: Klasse;
  range: [number, number];
  /** Anzeige-Empfehlung innerhalb des Korridors, falls die Referenz eine nennt. */
  empfehlung?: number;
  label: string;
}

/** Sessions ohne Fleisch im Kern (Gemüse, Feuerführung, Beilagen). */
export const KEIN_KERNWERT = 'keine';

/** Klassen mit Sicherheits-Mindestwert in der Referenz. */
const KLASSEN_MIT_MINIMUM: Klasse[] = ['schwein', 'gefluegel', 'hackfleisch', 'wildschwein'];

const FISCH_BADGES = ['salmon', 'tuna', 'whitefish', 'oily_whole'];

/** Klasse eines Badge-Schlüssels. `null` = unbekannt → steht nicht zur Wahl (Test schlägt an). */
export function klasseVonBadge(key: string): Klasse | null {
  if (key === 'burger') return 'hackfleisch';
  if (key.startsWith('boar_')) return 'wildschwein';
  if (key.startsWith('beef_') || key === 'wagyu') return 'rind';
  if (key.startsWith('lamb_')) return 'lamm';
  if (key.startsWith('pork_') || key === 'iberico') return 'schwein';
  if (key.startsWith('poultry') || key.startsWith('duck_') || key.startsWith('goose_')) return 'gefluegel';
  if (FISCH_BADGES.includes(key)) return 'fisch';
  return null;
}

export function minimumDerKlasse(klasse: Klasse): number | null {
  return KLASSEN_MIT_MINIMUM.includes(klasse) ? mindestwert(klasse) : null;
}

let refCache: KernRef[] | null = null;

/** Alle Schlüssel, die der Generator wählen darf — aus der Referenz abgeleitet. */
export function kernRefs(): KernRef[] {
  if (refCache) return refCache;
  const ref = kernReferenz();
  const liste: KernRef[] = [];

  const standardMr = ref.badges.beef_mr?.c;
  for (const [stufe, g] of Object.entries(garstufenRind())) {
    liste.push({
      key: `rind_${stufe}`,
      klasse: 'rind',
      range: g.range,
      empfehlung: stufe === 'medium_rare' ? standardMr : undefined,
      label: g.label,
    });
  }

  for (const [key, b] of Object.entries(ref.badges)) {
    if (key === 'beef_mr') continue;        // deckt rind_medium_rare ab
    if (b.unter_sicherheit) continue;       // Ausnahmen nie automatisch
    const klasse = klasseVonBadge(key);
    if (!klasse) continue;
    const min = minimumDerKlasse(klasse);
    if (min !== null && b.range[0] < min) continue;
    liste.push({ key, klasse, range: b.range, empfehlung: b.c, label: b.label });
  }

  refCache = liste;
  return liste;
}

export function kernRef(key: string): KernRef | null {
  return kernRefs().find((r) => r.key === key) ?? null;
}

// ─── Fleischklasse aus dem Cut-Text ──────────────────────────────────────────

const MUSTER: { klasse: Klasse; re: RegExp }[] = [
  { klasse: 'wildschwein', re: /wildschwein|frischling|keiler|überläufer/i },
  { klasse: 'hackfleisch', re: /hack|burger|patty|patties|frikadelle|bulette|köfte|kofte|cevapcici|ćevap|wurst|würst|salsiccia|merguez|meatball|fleischbällchen/i },
  { klasse: 'gefluegel',   re: /hähnchen|hühn|huhn|poulet|pute|truthahn|chicken|wings|geflügel|(^|[^a-zäöüß])gans($|[^a-zäöüß])|gänse|(^|[^a-zäöüß])ente($|[^a-zäöüß])|(^|[^a-zäöüß])enten|wachtel|stubenküken|perlhuhn/i },
  { klasse: 'schwein',     re: /schwein|pork|ib[eé]rico|duroc|spare ?ribs|baby ?back|st\.? ?louis|kasseler|pluma|presa|secreto|bauchfleisch|krustenbraten|(?<!rinder[- ]?|kalbs[- ]?|lamm[- ]?)nackensteak/i },
];

/**
 * Risikoklassen, die der Cut-Text nennt. Wildschwein schlägt Schwein (sonst
 * würde „Wildschweinrücken" als Schwein mit 63 °C durchgehen).
 */
export function risikoKlassen(cut: string): Klasse[] {
  const treffer = MUSTER.filter((m) => m.re.test(cut)).map((m) => m.klasse);
  return treffer.includes('wildschwein') ? treffer.filter((k) => k !== 'schwein') : treffer;
}

// ─── Kernwerte im Freitext ───────────────────────────────────────────────────

const KERN_DAVOR  = /kern[^.;\d]{0,25}?(?:\d{2,3}\s*[–-]\s*)?(\d{2,3})\s*°\s*C/gi;
const KERN_DANACH = /(\d{2,3})\s*°\s*C\s*(?:im\s+)?kern/gi;

/** Alle Zahlen, die der Text ausdrücklich als Kerntemperatur nennt (30–99 °C). */
export function kernwerteImText(text: string | undefined | null): number[] {
  if (!text) return [];
  const werte = new Set<number>();
  for (const re of [KERN_DAVOR, KERN_DANACH]) {
    for (const m of text.matchAll(re)) {
      const n = Number(m[1]);
      if (n >= 30 && n <= 99) werte.add(n);
    }
  }
  return [...werte].sort((a, b) => a - b);
}

// ─── Prüfung einer Session ───────────────────────────────────────────────────

export interface SessionKern {
  cut: string;
  kernRef: string;
  kernTempC: number | null;
  process?: string;
  successCriterion?: string;
}

/** Verstöße einer Session als lesbare Sätze — leer heißt in Ordnung. */
export function pruefeSession(s: SessionKern): string[] {
  const fehler: string[] = [];
  const klassen = risikoKlassen(s.cut);
  const minima = klassen.map(minimumDerKlasse).filter((n): n is number => n !== null);
  const pflichtMin = minima.length ? Math.max(...minima) : null;

  if (s.kernRef === KEIN_KERNWERT) {
    if (klassen.length) {
      fehler.push(`„${s.cut}": kernRef „keine" ist bei ${klassen.join('/')} nicht zulässig — Referenzschlüssel wählen.`);
    }
    if (s.kernTempC !== null) {
      fehler.push(`„${s.cut}": kernRef „keine" verlangt kernTempC = null.`);
    }
    return fehler;
  }

  const ref = kernRef(s.kernRef);
  if (!ref) {
    return [`„${s.cut}": kernRef „${s.kernRef}" steht nicht in der Referenz.`];
  }
  if (s.kernTempC === null) {
    return [`„${s.cut}": kernTempC fehlt (Korridor ${ref.range[0]}–${ref.range[1]} °C).`];
  }

  if (s.kernTempC < ref.range[0] || s.kernTempC > ref.range[1]) {
    fehler.push(`„${s.cut}": ${s.kernTempC} °C liegt außerhalb des Korridors von ${ref.key} (${ref.range[0]}–${ref.range[1]} °C).`);
  }
  if (klassen.length && !klassen.includes(ref.klasse)) {
    fehler.push(`„${s.cut}": kernRef ${ref.key} (${ref.klasse}) passt nicht zum Fleisch (${klassen.join('/')}).`);
  }

  const refMin = minimumDerKlasse(ref.klasse);
  const min = Math.max(pflichtMin ?? 0, refMin ?? 0);
  if (min > 0) {
    if (s.kernTempC < min) {
      fehler.push(`„${s.cut}": ${s.kernTempC} °C liegt unter dem Sicherheits-Mindestwert von ${min} °C.`);
    }
    for (const [feld, text] of [['Ablauf', s.process], ['Erfolgskriterium', s.successCriterion]] as const) {
      const werte = kernwerteImText(text);
      if (werte.length && Math.max(...werte) < min) {
        fehler.push(`„${s.cut}": ${feld} nennt als höchsten Kernwert ${Math.max(...werte)} °C — der Endwert muss mindestens ${min} °C sein.`);
      }
    }
  }
  return fehler;
}

/** Anzeige-Text der Kerntemperatur, zusammengesetzt aus geprüften Werten. */
export function kernAnzeige(s: { kernRef: string; kernTempC: number | null }): string {
  if (s.kernRef === KEIN_KERNWERT || s.kernTempC === null) return 'keine Kerntemperatur — siehe Ablauf';
  const ref = kernRef(s.kernRef);
  return ref ? `${s.kernTempC} °C Kern (${ref.label})` : `${s.kernTempC} °C Kern`;
}

/** Referenztabelle für den Systemprompt. */
export function referenzTabelle(): string {
  const zeilen = kernRefs().map((r) => {
    const korridor = r.range[0] === r.range[1] ? `${r.range[0]} °C` : `${r.range[0]}–${r.range[1]} °C`;
    const empf = r.empfehlung !== undefined ? `, Empfehlung ${r.empfehlung} °C` : '';
    return `  ${r.key} — ${r.label}: ${korridor}${empf} [${r.klasse}]`;
  });
  return zeilen.join('\n');
}
