'use client';

/**
 * Menü-Modus (Flywheel-Ausbau): Mehrere Rezepte zu einem Menü kombinieren,
 * Personenzahl wählen → EINE aggregierte Einkaufsliste, deterministisch
 * skaliert (Basisprinzip: jedes Rezept wird über seine servings auf
 * 1 Person normiert und mit der Gästezahl multipliziert).
 *
 * Gleiche Einheiten werden zusammengezählt (kg→g, L→ml, EL→3 TL, "Gramm"→g,
 * Zehen→Zehe …); "Prise"/"n.B." erscheinen einmal als "nach Bedarf".
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, Plus, Minus, ClipboardList, Check, UtensilsCrossed, X, ChevronRight } from 'lucide-react';

export type MenuZutat = { amount: number; unit: string; name: string; note?: string };
export type MenuRezept = {
  slug: string;
  title: string;
  kategorie: string;
  meatType: string;
  servings: number;
  totalTime: string;
  ingredients: MenuZutat[];
};

const KATEGORIEN: Array<[string, string]> = [
  ['fleisch', 'Fleisch'],
  ['fisch', 'Fisch & Meeresfrüchte'],
  ['beilagen', 'Beilagen'],
  ['saucen-rubs', 'Saucen & Rubs'],
  ['desserts', 'Desserts'],
  ['wine-spirits', 'Wine & Spirits'],
];

// Einheiten-Normalisierung fürs Summieren (Anzeige rechnet ggf. wieder hoch)
const UNIT_NORM: Record<string, { unit: string; factor: number }> = {
  kg: { unit: 'g', factor: 1000 },
  Gramm: { unit: 'g', factor: 1 },
  '"g"': { unit: 'g', factor: 1 },
  L: { unit: 'ml', factor: 1000 },
  l: { unit: 'ml', factor: 1000 },
  Liter: { unit: 'ml', factor: 1000 },
  EL: { unit: 'TL', factor: 3 },
  Zehen: { unit: 'Zehe', factor: 1 },
  Zweige: { unit: 'Zweig', factor: 1 },
  Stück: { unit: 'Stück', factor: 1 },
};
const NACH_BEDARF = new Set(['Prise', 'n.B.', 'etwas', 'Handvoll']);

function fmt(x: number): string {
  if (x >= 500) return String(Math.round(x / 5) * 5);
  if (x >= 100) return String(Math.round(x));
  if (x >= 10) return String(Math.round(x * 2) / 2).replace('.', ',');
  return String(Math.round(x * 10) / 10).replace('.', ',');
}

function anzeige(menge: number, unit: string): string {
  if (unit === 'g' && menge >= 1000) return `${fmt(menge / 1000).replace(',', ',')} kg`;
  if (unit === 'ml' && menge >= 1000) return `${fmt(menge / 1000)} l`;
  if (unit === 'TL' && menge >= 3) return `${fmt(menge / 3)} EL`;
  return `${fmt(menge)} ${unit}`;
}

export default function MenueComposer({ rezepte }: { rezepte: MenuRezept[] }) {
  const [personen, setPersonen] = useState(4);
  const [gewaehlt, setGewaehlt] = useState<string[]>([]);
  const [kopiert, setKopiert] = useState(false);

  const auswahl = useMemo(
    () => gewaehlt.map((slug) => rezepte.find((r) => r.slug === slug)).filter(Boolean) as MenuRezept[],
    [gewaehlt, rezepte],
  );

  // Aggregation: Zutat-Name (case-insensitiv) + normalisierte Einheit als Schlüssel
  const liste = useMemo(() => {
    const summen = new Map<string, { name: string; unit: string; menge: number }>();
    const nachBedarf = new Set<string>();
    for (const r of auswahl) {
      const proPerson = personen / Math.max(1, r.servings);
      for (const z of r.ingredients ?? []) {
        if (NACH_BEDARF.has(z.unit)) { nachBedarf.add(z.name); continue; }
        const norm = UNIT_NORM[z.unit] ?? { unit: z.unit, factor: 1 };
        const key = `${z.name.trim().toLowerCase()}|${norm.unit}`;
        const prev = summen.get(key);
        const menge = z.amount * norm.factor * proPerson;
        if (prev) prev.menge += menge;
        else summen.set(key, { name: z.name.trim(), unit: norm.unit, menge });
      }
    }
    return {
      summen: Array.from(summen.values()).sort((a, b) => a.name.localeCompare(b.name, 'de')),
      nachBedarf: Array.from(nachBedarf).sort((a, b) => a.localeCompare(b, 'de')),
    };
  }, [auswahl, personen]);

  async function kopieren() {
    const kopf = `Menü-Einkaufsliste (${personen} ${personen === 1 ? 'Person' : 'Personen'}) — steakakademie.de`;
    const gaenge = auswahl.map((r) => `· ${r.title}`).join('\n');
    const zeilen = liste.summen.map((z) => `• ${anzeige(z.menge, z.unit)} ${z.name}`);
    const nb = liste.nachBedarf.length ? `\nNach Bedarf: ${liste.nachBedarf.join(', ')}` : '';
    try {
      await navigator.clipboard.writeText(`${kopf}\n${gaenge}\n\n${zeilen.join('\n')}${nb}`);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2500);
    } catch { /* Clipboard verweigert — kein kaputtes UI */ }
  }

  function toggle(slug: string) {
    setGewaehlt((g) => (g.includes(slug) ? g.filter((s) => s !== slug) : [...g, slug]));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
      {/* ── Rezept-Auswahl nach Kategorie ── */}
      <div className="space-y-8">
        {KATEGORIEN.map(([key, label]) => {
          const gruppe = rezepte.filter((r) => r.kategorie === key);
          if (!gruppe.length) return null;
          return (
            <section key={key}>
              <h2 className="font-serif text-xl font-bold text-text-primary mb-3 border-b border-border-subtle pb-2">
                {label}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {gruppe.map((r) => {
                  const aktiv = gewaehlt.includes(r.slug);
                  return (
                    <li key={r.slug}>
                      <button
                        onClick={() => toggle(r.slug)}
                        aria-pressed={aktiv}
                        className={`w-full text-left px-3.5 py-2.5 border transition-colors ${
                          aktiv
                            ? 'border-brand-gold bg-brand-gold/10'
                            : 'border-border-subtle bg-surface-elevated hover:border-brand-gold/50'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-sans text-text-primary leading-snug">{r.title}</span>
                          {aktiv ? (
                            <Check size={14} className="text-brand-gold shrink-0" />
                          ) : (
                            <Plus size={14} className="text-text-muted shrink-0" />
                          )}
                        </span>
                        <span className="text-[11px] font-sans text-text-muted">{r.meatType}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* ── Menü + Einkaufsliste (Sidebar) ── */}
      <aside>
        <div className="bg-surface-elevated border border-border-subtle overflow-hidden lg:sticky lg:top-24">
          <div className="border-t-2 border-brand-fire px-5 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <UtensilsCrossed size={11} className="text-brand-fire shrink-0" />
              <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">
                Dein Menü
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-sans text-text-secondary">
                <Users size={13} className="text-brand-gold" /> Personen
              </span>
              <div className="flex items-center gap-2.5" role="group" aria-label="Personenzahl">
                <button
                  onClick={() => setPersonen((p) => Math.max(1, p - 1))}
                  disabled={personen <= 1}
                  aria-label="Weniger Personen"
                  className="w-7 h-7 flex items-center justify-center border border-brand-fire/40 text-brand-fire hover:bg-brand-fire hover:text-ink disabled:opacity-30 transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="font-serif text-xl font-bold text-text-primary w-7 text-center tabular-nums" aria-live="polite">
                  {personen}
                </span>
                <button
                  onClick={() => setPersonen((p) => Math.min(30, p + 1))}
                  disabled={personen >= 30}
                  aria-label="Mehr Personen"
                  className="w-7 h-7 flex items-center justify-center border border-brand-fire/40 text-brand-fire hover:bg-brand-fire hover:text-ink disabled:opacity-30 transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>

          {auswahl.length === 0 ? (
            <p className="px-5 py-6 text-sm font-sans text-text-muted">
              Wähle links Gerichte aus — Hauptgang, Beilage, Sauce, Dessert. Die Einkaufsliste
              rechnet alle Mengen auf deine Personenzahl um.
            </p>
          ) : (
            <>
              <ul className="px-5 py-3 space-y-1.5 border-t border-border-subtle">
                {auswahl.map((r) => (
                  <li key={r.slug} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/rezepte/${r.slug}`} className="text-text-primary hover:text-brand-fire leading-snug">
                      {r.title}
                    </Link>
                    <button
                      onClick={() => toggle(r.slug)}
                      aria-label={`${r.title} entfernen`}
                      className="shrink-0 text-text-muted hover:text-brand-fire"
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border-subtle px-5 py-3">
                <p className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-brand-gold mb-2">
                  Einkaufsliste · {personen} {personen === 1 ? 'Person' : 'Personen'}
                </p>
                <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {liste.summen.map((z) => (
                    <li key={`${z.name}|${z.unit}`} className="flex items-baseline justify-between gap-3 text-[13px] font-sans">
                      <span className="text-text-secondary leading-snug">{z.name}</span>
                      <span className="shrink-0 tabular-nums font-bold text-text-primary">{anzeige(z.menge, z.unit)}</span>
                    </li>
                  ))}
                </ul>
                {liste.nachBedarf.length > 0 && (
                  <p className="mt-2 text-[11px] font-sans text-text-muted">
                    Nach Bedarf: {liste.nachBedarf.join(', ')}
                  </p>
                )}
              </div>

              <div className="px-5 pb-4">
                <button
                  onClick={kopieren}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 text-[11px] font-sans font-bold tracking-[0.12em] uppercase border border-brand-gold/40 text-brand-gold hover:bg-brand-gold hover:text-ink transition-colors"
                  aria-live="polite"
                >
                  {kopiert ? (
                    <><Check size={13} className="shrink-0" /> Kopiert</>
                  ) : (
                    <><ClipboardList size={13} className="shrink-0" /> Einkaufsliste kopieren</>
                  )}
                </button>
                <p className="mt-2 text-[10px] font-sans text-text-muted flex items-center gap-1">
                  <ChevronRight size={10} className="text-brand-gold shrink-0" />
                  Kern- & Gartemperaturen bleiben gleich — nur Mengen skalieren.
                </p>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
