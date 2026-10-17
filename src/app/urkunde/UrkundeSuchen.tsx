'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zerlegeKennung, pruefPfad } from '@/lib/urkunde/kennung';

export default function UrkundeSuchen() {
  const router = useRouter();
  const [eingabe, setEingabe] = useState('');
  const [fehler, setFehler] = useState('');

  function absenden(e: React.FormEvent) {
    e.preventDefault();
    const k = zerlegeKennung(eingabe);
    if (!k) {
      setFehler('Das sieht nicht nach einer Urkunden-Nummer aus. Form: SA-2026-0001-ABC234');
      return;
    }
    router.push(pruefPfad(k.nr, k.code));
  }

  return (
    <form onSubmit={absenden} className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
      <label htmlFor="kennung" className="sr-only">Urkunden-Nummer mit Prüfcode</label>
      <input
        id="kennung"
        value={eingabe}
        onChange={(e) => { setEingabe(e.target.value); setFehler(''); }}
        placeholder="SA-2026-0001-ABC234"
        autoComplete="off"
        spellCheck={false}
        className="flex-1 bg-surface-elevated border border-border-subtle px-4 py-3 font-mono text-sm text-text-light placeholder:text-text-muted focus:outline-none focus:border-brand-fire"
      />
      <button type="submit" className="bg-brand-fire text-white font-sans font-bold text-sm px-6 py-3 hover:opacity-90">
        Prüfen
      </button>
      {fehler && <p role="alert" className="sm:basis-full font-sans text-sm text-red-400">{fehler}</p>}
    </form>
  );
}
