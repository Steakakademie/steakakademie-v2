'use client';

import Link from 'next/link';
import { Flame, ChevronRight, Lock } from 'lucide-react';
import { STUFEN, ERSTE_BEZAHLSTUFE } from '@/lib/diplome/stufen';

interface DiplomFunnelProps {
  personName: string;
  personClaim: string;
}

// Aus der Diplom-Taxonomie abgeleitet (03.10.2026): Vorher stand hier eine eigene
// Liste, die Silber als offen zeigte (ist Bezahlstufe) und „Low & Slow" bei Gold
// fuehrte (gehoert zu Stufe 4).
const DIPLOM_LEVELS = STUFEN.map((s) => ({
  label: s.metall,
  sub: s.title,
  locked: s.nr >= ERSTE_BEZAHLSTUFE,
}));

const LEVEL_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silber: '#9CA3AF',
  Gold: '#C8882A',
  Platin: '#38BDF8',
  Meister: '#E85018',
};

export default function DiplomFunnel({ personName, personClaim }: DiplomFunnelProps) {
  // Extract first name for personal feel
  const firstName = personName.split(' ')[0];

  return (
    <section className="my-0 border-t border-brand-gold/15 bg-surface-dark px-6 py-12 not-prose">
      <div className="max-w-xl mx-auto text-center">

        {/* Anchor text — behavioral: identity bridge from article to action */}
        <p className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
          Vom Lesen zum Können
        </p>
        <h3 className="font-serif text-2xl font-bold text-text-light mb-3 leading-tight">
          {firstName} hat Jahrzehnte gebraucht.<br />
          Du brauchst Wochen.
        </h3>
        <p className="font-body text-sm text-text-light/60 mb-8 leading-relaxed max-w-sm mx-auto">
          Das Steakakademie-Diplom gibt dir die Systematik, die hinter Meistern wie{' '}
          <span className="text-text-light/80">{personName}</span> steckt —
          Schritt für Schritt, Level für Level.
        </p>

        {/* Level progression — visual progress psychology */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {DIPLOM_LEVELS.map((level, i) => (
            <div key={level.label} className="flex items-center gap-1">
              <div className="text-center">
                <div
                  className="w-10 h-10 flex items-center justify-center border-2 text-xs font-bold font-sans relative"
                  style={{
                    borderColor: level.locked ? 'rgba(255,255,255,0.12)' : LEVEL_COLORS[level.label],
                    color: level.locked ? 'rgba(255,255,255,0.25)' : LEVEL_COLORS[level.label],
                    background: level.locked ? 'transparent' : `${LEVEL_COLORS[level.label]}18`,
                  }}
                >
                  {level.locked ? <Lock size={12} opacity={0.3} /> : (i + 1)}
                </div>
                <p
                  className="text-[8px] font-sans mt-1 tracking-wider uppercase"
                  style={{ color: level.locked ? 'rgba(255,255,255,0.5)' : LEVEL_COLORS[level.label] }}
                >
                  {level.label}
                </p>
              </div>
              {i < DIPLOM_LEVELS.length - 1 && (
                <div className="w-6 h-px mb-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Primary CTA — large, clear */}
        <Link
          href="/diplome"
          className="inline-flex items-center gap-2 bg-brand-gold text-ink font-sans font-bold text-sm tracking-[0.1em] uppercase px-8 py-4 hover:bg-[#b07020] transition-colors"
        >
          <Flame size={14} />
          Jetzt mit Bronze starten
        </Link>

        {/* Social proof micro-copy */}
        <p className="text-[10px] font-sans text-text-light/55 mt-4">
          Kostenlos · Kein Account nötig · Jederzeit weiter
        </p>

      </div>
    </section>
  );
}
