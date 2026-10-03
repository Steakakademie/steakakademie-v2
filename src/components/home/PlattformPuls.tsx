'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { PulsData } from '@/lib/plattform-puls';

// Zählt von 0 auf target, sobald sichtbar (IntersectionObserver).
function useCountUp(target: number, run: boolean, durationMs = 1100) {
  // Start auf target → Server-HTML/Crawler sehen die ECHTE Zahl (nicht 0).
  // Beim Sichtbarwerden (run) animiert die Client-Version von 0 hoch.
  const [val, setVal] = useState(target);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, durationMs]);
  return val;
}

export default function PlattformPuls({ data }: { data: PulsData }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  return (
    <section
      ref={ref}
      className="border-y border-brand-gold/15"
      style={{ background: 'linear-gradient(180deg, #0F0A06 0%, #140D08 100%)' }}
    >
      <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-fire mb-2">
            <Sparkles size={12} /> Eine wachsende Wissensbasis
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-light">
            Die Steakakademie wächst
          </h2>
        </div>

        {/* Zahlen — der Wachstums-Beweis. „Was frisch dazukam" zeigt jetzt das
            eigene Frisch-&-Saisonal-Modul direkt darunter (keine Doppelung). */}
        {/* flex statt festem 5er-Grid: Anzahl der Zähler ist dynamisch
            (Kategorien unter 10 werden serverseitig ausgefiltert). */}
        <div className="flex flex-wrap justify-center gap-x-14 gap-y-8">
          {data.counts.map((c) => (
            <Stat key={c.label} label={c.label} value={c.value} run={seen} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, run }: { label: string; value: number; run: boolean }) {
  const n = useCountUp(value, run);
  return (
    <div className="text-center">
      <div className="font-serif text-4xl lg:text-5xl font-bold" style={{ color: '#C8882A' }}>
        {n}
      </div>
      <div className="text-[11px] font-sans uppercase tracking-[0.12em] text-text-light/50 mt-1">
        {label}
      </div>
    </div>
  );
}
