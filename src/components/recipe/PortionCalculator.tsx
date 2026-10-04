'use client';

import { useState } from 'react';
import { Plus, Minus, Users, ClipboardList, Check } from 'lucide-react';

export interface RecipeIngredient {
  amount: number;
  unit: string;
  name: string;
  note?: string;
}

interface Props {
  basePortions: number;
  ingredients: RecipeIngredient[];
}

// Einheiten-Konvertierung: Upgrade (kleine → große Einheit)
const UPGRADES = [
  { from: 'TL',  to: 'EL',   threshold: 3,    factor: 3    },
  { from: 'g',   to: 'kg',   threshold: 1000, factor: 1000 },
  { from: 'ml',  to: 'L',    threshold: 1000, factor: 1000 },
  { from: 'mg',  to: 'g',    threshold: 1000, factor: 1000 },
] as const;

// Einheiten-Konvertierung: Downgrade (große → kleine Einheit bei Skalierung nach unten)
const DOWNGRADES = [
  { from: 'EL', to: 'TL', factor: 3    },
  { from: 'kg', to: 'g',  factor: 1000 },
  { from: 'L',  to: 'ml', factor: 1000 },
  { from: 'g',  to: 'mg', factor: 1000 },
] as const;

export function smartConvert(amount: number, unit: string): { amount: number; unit: string } {
  for (const c of UPGRADES) {
    if (unit === c.from && amount >= c.threshold)
      return smartConvert(amount / c.factor, c.to);
  }
  if (amount > 0 && amount < 0.25) {
    for (const c of DOWNGRADES) {
      if (unit === c.from)
        return smartConvert(amount * c.factor, c.to);
    }
  }
  return { amount, unit };
}

// Vulgarbrüche + sinnvolle Rundung
const FRACS: [number, string][] = [
  [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'],
  [0.5,   '½'], [0.667, '⅔'], [0.75,  '¾'],
];

export function fmt(raw: number): string {
  if (raw <= 0) return '0';
  if (raw < 1) {
    for (const [v, s] of FRACS)
      if (Math.abs(raw - v) < 0.04) return s;
    return raw.toFixed(1);
  }
  const whole = Math.floor(raw);
  const frac  = raw - whole;
  for (const [v, s] of FRACS) {
    if (Math.abs(frac - v) < 0.04)
      return whole > 0 ? `${whole} ${s}` : s;
  }
  if (raw >= 500) return String(Math.round(raw / 5) * 5);
  if (raw >= 100) return String(Math.round(raw));
  if (raw >= 10)  return String(Math.round(raw * 2) / 2);
  return String(Math.round(raw * 10) / 10);
}

export const NO_CONVERT = new Set(['Prise', 'n.B.', 'etwas']);

export default function PortionCalculator({ basePortions, ingredients }: Props) {
  const [portions, setPortions] = useState(basePortions);
  const [kopiert, setKopiert] = useState(false);
  const scale = portions / basePortions;

  // Einkaufsliste: dieselbe deterministische Skalierung wie die Anzeige,
  // als Klartext in die Zwischenablage (für Notizen/Messenger/Einkaufs-App).
  async function einkaufslisteKopieren() {
    const zeilen = ingredients.map((ing) => {
      if (NO_CONVERT.has(ing.unit)) return `• ${ing.name} (${ing.unit})`;
      const { amount, unit } = smartConvert(ing.amount * scale, ing.unit);
      return `• ${fmt(amount)} ${unit} ${ing.name}${ing.note ? ` (${ing.note})` : ''}`;
    });
    const text = `Einkaufsliste (${portions} ${portions === 1 ? 'Portion' : 'Portionen'}) — steakakademie.de\n${zeilen.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2500);
    } catch {
      // Clipboard verweigert (z. B. unsicherer Kontext) — still bleiben, kein kaputtes UI
    }
  }

  return (
    <div
      className="not-prose my-8 bg-surface-elevated border border-border-subtle overflow-hidden"
      aria-label="Zutaten-Rechner"
    >
      {/* Header + Stepper */}
      <div className="border-t-2 border-brand-fire px-6 pt-5 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={11} className="text-brand-fire shrink-0" />
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">
                Steakakademie · Zutaten-Rechner
              </span>
            </div>
            <p className="font-serif text-base font-bold text-text-light leading-snug">
              Portionen anpassen
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0" role="group" aria-label="Portionen">
            <button
              onClick={() => setPortions(p => Math.max(1, p - 1))}
              disabled={portions <= 1}
              aria-label="Portionen verringern"
              className="w-9 h-9 flex items-center justify-center border border-brand-fire/40 text-brand-fire hover:bg-brand-fire hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-[background-color,color,opacity]"
            >
              <Minus size={14} />
            </button>

            <span
              className="font-serif text-2xl font-bold text-text-primary w-8 text-center tabular-nums"
              aria-live="polite"
            >
              {portions}
            </span>

            <button
              onClick={() => setPortions(p => Math.min(20, p + 1))}
              disabled={portions >= 20}
              aria-label="Portionen erhöhen"
              className="w-9 h-9 flex items-center justify-center border border-brand-fire/40 text-brand-fire hover:bg-brand-fire hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-[background-color,color,opacity]"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle" />

      {/* Ingredient rows */}
      <ul>
        {ingredients.map((ing, i) => {
          const isSpecial = NO_CONVERT.has(ing.unit);
          const rawAmount = ing.amount * scale;
          const { amount: scaledAmount, unit: scaledUnit } = isSpecial
            ? { amount: rawAmount, unit: ing.unit }
            : smartConvert(rawAmount, ing.unit);

          return (
            <li
              key={i}
              className="flex items-baseline justify-between px-6 py-3 border-b border-border-subtle/40 last:border-0"
            >
              <span className="font-body text-sm text-text-secondary leading-relaxed flex-1 pr-4">
                {ing.name}
                {ing.note && (
                  <span className="text-text-muted text-xs ml-1">({ing.note})</span>
                )}
              </span>

              <span className="font-sans text-sm shrink-0 tabular-nums">
                {isSpecial ? (
                  <span className="text-text-muted">{ing.unit}</span>
                ) : (
                  <>
                    <span className="font-bold text-brand-fire">{fmt(scaledAmount)}</span>
                    {' '}
                    <span className="text-text-muted font-normal">{scaledUnit}</span>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Scale hint */}
      {scale !== 1 && (
        <div className="px-6 py-3 bg-surface-base/60 border-t border-border-subtle">
          <p className="text-[10px] font-sans text-text-muted text-center">
            Skaliert auf {portions} Portionen
            {' '}({scale > 1 ? `×${+scale.toFixed(2)}` : `×${+scale.toFixed(2)}`} der Basismenge)
          </p>
        </div>
      )}

      {/* Einkaufsliste für die gewählte Personenzahl */}
      <div className="px-6 py-3 border-t border-border-subtle">
        <button
          onClick={einkaufslisteKopieren}
          className="w-full inline-flex items-center justify-center gap-2 py-2 text-[11px] font-sans font-bold tracking-[0.12em] uppercase border border-brand-gold/40 text-brand-gold hover:bg-brand-gold hover:text-ink transition-colors"
          aria-live="polite"
        >
          {kopiert ? (
            <>
              <Check size={13} className="shrink-0" /> Kopiert — ab in die Einkaufs-App
            </>
          ) : (
            <>
              <ClipboardList size={13} className="shrink-0" /> Einkaufsliste für {portions} {portions === 1 ? 'Portion' : 'Portionen'} kopieren
            </>
          )}
        </button>
      </div>
    </div>
  );
}
