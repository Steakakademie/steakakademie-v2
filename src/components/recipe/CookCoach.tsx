'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Flame, ChefHat } from 'lucide-react';

export interface RecipeStep {
  title: string;
  description: string;
  duration?: string;
  tip?: string;
}

interface Props {
  steps: RecipeStep[];
}

export default function CookCoach({ steps }: Props) {
  const [done, setDone] = useState<Set<number>>(new Set());

  function toggle(idx: number) {
    setDone(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  const progress = steps.length > 0 ? (done.size / steps.length) * 100 : 0;
  const allDone  = done.size === steps.length && steps.length > 0;

  return (
    <div
      className="not-prose my-10 bg-surface-elevated border border-border-subtle overflow-hidden"
      aria-label="Koch-Coach: Zubereitungsschritte"
    >
      {/* Header */}
      <div className="border-t-2 border-brand-gold px-6 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <ChefHat size={11} className="text-brand-gold" />
          <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-gold">
            Steakakademie · Koch-Coach
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-serif text-base font-bold text-text-light">
            Schritt für Schritt am Grill
          </p>
          <span className="text-xs font-sans text-text-muted" aria-live="polite">
            {done.size}&thinsp;/&thinsp;{steps.length} erledigt
          </span>
        </div>

        {/* Fortschrittsbalken */}
        <div
          className="mt-3 h-1 bg-surface-base rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Fortschritt der Zubereitung"
          aria-valuenow={done.size}
          aria-valuemin={0}
          aria-valuemax={steps.length}
        >
          <div
            className="h-full bg-gradient-to-r from-brand-fire to-brand-gold transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="border-t border-border-subtle" />

      {/* Schritt-Liste */}
      <ol>
        {steps.map((step, idx) => {
          const isDone = done.has(idx);

          return (
            <li
              key={idx}
              onClick={() => toggle(idx)}
              className={[
                'px-6 py-5 border-b border-border-subtle/40 last:border-0',
                'cursor-pointer select-none group transition-[background-color,opacity] duration-300 motion-reduce:transition-none',
                isDone
                  ? 'bg-surface-base/70 opacity-50'
                  : 'hover:bg-surface-base/30',
              ].join(' ')}
            >
              <div className="flex gap-4">
                {/* Checkbox-Icon */}
                <div className="mt-0.5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                  {isDone ? (
                    <CheckCircle2 size={20} className="text-brand-gold" />
                  ) : (
                    <Circle size={20} className="text-border-subtle group-hover:text-brand-gold/50 transition-colors duration-200 motion-reduce:transition-none" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Schritt-Label + Dauer */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-brand-fire">
                      Schritt {idx + 1}
                    </span>
                    {step.duration && (
                      <>
                        <span className="text-border-subtle">·</span>
                        <span className="text-[10px] font-sans text-text-muted">{step.duration}</span>
                      </>
                    )}
                  </div>

                  {/* Titel */}
                  <h3
                    className={[
                      'font-serif text-base font-bold mb-2 leading-snug transition-colors duration-300 motion-reduce:transition-none',
                      isDone
                        ? 'text-text-muted line-through decoration-brand-gold/30'
                        : 'text-text-primary',
                    ].join(' ')}
                  >
                    {step.title}
                  </h3>

                  {/* Beschreibung */}
                  <p className="font-body text-sm text-text-secondary leading-relaxed">
                    {step.description}
                  </p>

                  {/* Pitmaster-Tipp */}
                  {step.tip && !isDone && (
                    <div className="mt-3 flex items-start gap-2 bg-brand-gold/5 border border-brand-gold/20 px-3 py-2.5">
                      <Flame size={12} className="text-brand-gold mt-0.5 shrink-0" />
                      <p className="text-xs font-sans text-brand-gold leading-relaxed">
                        <span className="font-bold text-brand-gold">Pitmaster-Tipp:</span>{' '}
                        {step.tip}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Abschluss-Message */}
      {allDone && (
        <div className="border-t border-brand-gold/30 px-6 py-6 text-center"
          style={{ background: 'linear-gradient(180deg, rgba(200,136,42,0.06) 0%, transparent 100%)' }}
        >
          <p className="font-serif text-xl font-bold text-brand-gold mb-1">
            Perfekt gemacht.
          </p>
          <p className="font-body text-sm text-text-muted">
            Alle Schritte abgehakt — Zeit anzurichten und zu genießen.
          </p>
        </div>
      )}
    </div>
  );
}
