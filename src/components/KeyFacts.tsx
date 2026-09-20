import { Zap } from 'lucide-react';

/**
 * „Kurz & knapp" — kompakter Faktenblock direkt unter der Einleitung einer
 * Pillar-Seite (Plan C3, Hebel: AI-Overview-Liftbarkeit).
 *
 * Warum eine Definitionsliste (`dl`/`dt`/`dd`) und keine Kästen mit `div`:
 * Antwortmaschinen greifen Begriff-Wert-Paare deutlich zuverlaessiger ab, wenn
 * die Beziehung im Markup steht und nicht nur im Layout. Dieselbe Liste ist
 * damit fuer Leser ein Ueberblick und fuer Google/Perplexity ein zitierbarer
 * Block — ohne zusaetzliches Schema, das eine Behauptung ueber Inhalte waere,
 * die die Seite gar nicht macht.
 *
 * Inhalt: kurze, pruefbare Fakten. Temperaturen stammen ausschliesslich aus
 * data/kerntemperatur-referenz.yaml (Regel 8c) — nie aus dem Fliesstext der
 * Seite und nie geschaetzt.
 */

export interface KeyFact {
  /** Der Begriff, z. B. „Medium Rare" */
  label: string;
  /** Der Wert, kurz und eigenstaendig lesbar, z. B. „52–55 °C (Standard 54 °C)" */
  value: string;
}

interface KeyFactsProps {
  facts: KeyFact[];
  /** Ueberschrift des Blocks; Vorgabe „Kurz & knapp". */
  title?: string;
  /** Quellenhinweis unter der Liste, z. B. „Werte: Kerntemperatur-Referenz". */
  quelle?: string;
  /** 'light' = heller Grund (MDX-Artikel), 'dark' = dunkler Grund (Pillar-Hero). */
  variant?: 'light' | 'dark';
}

export default function KeyFacts({ facts, title = 'Kurz & knapp', quelle, variant = 'light' }: KeyFactsProps) {
  const dunkel = variant === 'dark';

  return (
    <aside
      className={`my-8 border p-5 sm:p-6 ${
        dunkel ? 'border-brand-gold/25 bg-black/25' : 'border-border-subtle bg-surface-card'
      }`}
      aria-labelledby="keyfacts-titel"
    >
      <div className="mb-4 flex items-center gap-2">
        <Zap size={15} className="shrink-0 text-brand-gold" />
        <h2
          id="keyfacts-titel"
          className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-brand-gold"
        >
          {title}
        </h2>
      </div>

      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {facts.map((f) => (
          <div key={f.label} className="border-l-2 border-brand-gold/30 pl-3">
            <dt
              className={`font-sans text-[11px] font-bold uppercase tracking-[0.1em] ${
                dunkel ? 'text-text-light/55' : 'text-text-muted'
              }`}
            >
              {f.label}
            </dt>
            <dd className={`font-body text-[0.95rem] leading-snug ${dunkel ? 'text-text-light' : 'text-text-primary'}`}>
              {f.value}
            </dd>
          </div>
        ))}
      </dl>

      {quelle && (
        <p className={`mt-4 font-sans text-[11px] ${dunkel ? 'text-text-light/45' : 'text-text-muted'}`}>{quelle}</p>
      )}
    </aside>
  );
}
