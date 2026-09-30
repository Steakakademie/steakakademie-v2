'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChefHat } from 'lucide-react';
import AromaRadSvg, { GRUPPEN, gruppenFarbe } from './AromaRadSvg';
import type { Rad } from '@/lib/foodpairing-daten';

export type RadMitLabel = Rad & { label: string; sub?: string };

/** Interaktives Aroma-Rad der Seite /foodpairing — Daten kommen fertig vom Server. */
export default function AromaRad({ raeder }: { raeder: RadMitLabel[] }) {
  const [idx, setIdx] = useState(0);
  const rad = raeder[idx];
  const [aktiv, setAktiv] = useState<string | null>(rad.partner[0]?.name ?? null);
  const partner = rad.partner.find((p) => p.name === aktiv) ?? null;

  function wechseln(i: number) {
    setIdx(i);
    setAktiv(raeder[i].partner[0]?.name ?? null);
  }

  return (
    <div className="rounded-2xl border border-brand-gold/30 bg-surface-card p-4 sm:p-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Ausgangszutat wählen">
        {raeder.map((r, i) => (
          <button
            key={r.zentrum}
            type="button"
            role="tab"
            aria-selected={i === idx}
            onClick={() => wechseln(i)}
            className={`rounded-full border px-3.5 py-1.5 font-sans text-sm transition-colors ${
              i === idx
                ? 'border-brand-fire bg-brand-fire text-ink font-bold'
                : 'border-brand-gold/40 text-text-secondary hover:border-brand-gold hover:text-brand-gold'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid items-center gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <AromaRadSvg
            zentrum={rad.label}
            zentrumSub={rad.sub}
            punkte={rad.partner.map((p) => ({ name: p.name, kategorie: p.kategorie, anzahl: p.stoffe.length }))}
            aktiv={aktiv}
            onWaehlen={setAktiv}
            className="mx-auto w-full max-w-[560px]"
            titel={`Aroma-Rad ${rad.label}: ${rad.partner
              .map((p) => `${p.name} ${p.stoffe.length}`)
              .join(', ')} gemeinsame Schlüssel-Aromen`}
          />
          <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 font-sans text-[11px] text-text-muted">
            {GRUPPEN.map((g) => (
              <li key={g.label} className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: g.farbe }} aria-hidden />
                {g.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5" aria-live="polite">
          {partner ? (
            <div className="rounded-xl border border-border-subtle bg-surface-base p-5">
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">Aroma-Brücke</p>
              <h3 className="mt-1 font-serif text-2xl font-bold text-text-light">
                {rad.label} + {partner.name}
              </h3>
              <p className="mt-1 font-sans text-sm text-text-secondary">
                {partner.stoffe.length === 1
                  ? '1 gemeinsames Schlüssel-Aroma'
                  : `${partner.stoffe.length} gemeinsame Schlüssel-Aromen`}
              </p>
              <ul className="mt-4 space-y-2">
                {partner.stoffe.map((s) => (
                  <li key={s.id} className="flex items-baseline justify-between gap-3 border-b border-border-subtle/60 pb-2 last:border-0">
                    <span className="font-sans text-sm font-semibold text-text-light">{s.note ?? '—'}</span>
                    <span className="text-right font-sans text-[11px] text-text-muted">{s.name}</span>
                  </li>
                ))}
              </ul>
              {partner.verwandt.length > 0 && (
                <div className="mt-3">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                    Dazu verwandte Noten
                  </p>
                  <ul className="mt-1.5 space-y-1.5">
                    {partner.verwandt.map((v) => (
                      <li key={v.familie} className="font-sans text-xs text-text-secondary">
                        <span className="font-semibold text-text-light">≈ {v.familie}</span>{' '}
                        <span className="text-text-muted">
                          ({v.a.join(', ')} ↔ {v.b.join(', ')})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Link
                href={`/?schmiede=${encodeURIComponent(`${rad.label} mit ${partner.name}`)}#werkzeuge`}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-fire px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wide text-ink hover:opacity-90"
              >
                <ChefHat size={15} /> Rezept dazu schmieden
              </Link>
            </div>
          ) : (
            <p className="font-sans text-sm text-text-muted">Wähle einen Punkt im Rad.</p>
          )}

          <p className="mt-4 font-sans text-[11px] uppercase tracking-wide text-text-muted">Alle Partner</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {rad.partner.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setAktiv(p.name)}
                aria-pressed={p.name === aktiv}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-xs transition-colors ${
                  p.name === aktiv
                    ? 'border-text-light text-text-light'
                    : 'border-border-subtle text-text-secondary hover:border-brand-gold hover:text-brand-gold'
                }`}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: gruppenFarbe(p.kategorie) }} aria-hidden />
                {p.name} <span className="text-text-muted">{p.stoffe.length}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
