'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STUFEN } from '@/lib/diplome/stufen';

type Zeile = { modul: string; stufe: number | null; quiz_score: number | null; updated_at: string | null };

/**
 * Die Medaillen des eingeloggten Nutzers — gelesen aus course_progress
 * (RLS: nur eigene Zeilen). Vorher zeigte /diplome/profil keine, obwohl der
 * Einleitungstext sie versprach; sichtbar waren sie nur auf /griller/[slug].
 * Schreiben tut hier niemand: Eintraege entstehen ausschliesslich ueber
 * /api/diplome/pruefung.
 */
export default function MeineMedaillen() {
  const [zeilen, setZeilen] = useState<Zeile[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from('course_progress')
          .select('modul, stufe, quiz_score, updated_at')
          .eq('user_id', user.id)
          .eq('status', 'bestanden');
        if (!cancelled) setZeilen((data ?? []) as Zeile[]);
      } catch {
        if (!cancelled) setZeilen([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const bestanden = new Map<number, Zeile>();
  for (const z of zeilen ?? []) if (typeof z.stufe === 'number') bestanden.set(z.stufe, z);
  const anzahl = bestanden.size;

  return (
    <div className="mt-6 border border-border-subtle bg-surface-elevated p-6">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="font-serif text-lg font-bold text-text-primary">Deine Medaillen</h2>
        <span className="text-xs font-sans text-text-muted">
          {zeilen === null ? 'Lädt …' : `${anzahl} von ${STUFEN.length} Stufen bestanden`}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-4">
        {STUFEN.map((s) => {
          const z = bestanden.get(s.nr);
          const earned = Boolean(z);
          return (
            <div key={s.nr} className="flex flex-col items-center text-center">
              <div
                className="relative w-14 h-14 sm:w-20 sm:h-20"
                style={{ filter: earned ? undefined : 'grayscale(1) brightness(0.55)', opacity: earned ? 1 : 0.45 }}
              >
                <Image src={`/images/diplome/medal-${s.tier}.png`} alt={`${s.cert}-Medaille`} fill sizes="80px" className="object-contain" />
              </div>
              <p className="mt-2 text-[9px] sm:text-[10px] font-sans font-bold tracking-[0.12em] uppercase" style={{ color: earned ? s.color : undefined }}>
                {s.metall}
              </p>
              <p className="text-[10px] sm:text-[11px] font-sans text-text-muted leading-tight">
                {/* Ohne Nenner: Stufe 1 stellt 10 Fragen, die uebrigen 5 — „von 5" war fuer Stufe 1 falsch. */}
                {earned ? (z?.quiz_score != null ? `${z.quiz_score} richtig` : 'bestanden') : 'offen'}
              </p>
            </div>
          );
        })}
      </div>

      {zeilen !== null && anzahl === 0 && (
        <p className="mt-4 text-sm font-body text-text-secondary">
          Noch keine Stufe bestanden. Stufe 1 ist kostenlos —{' '}
          <Link href="/diplome/roadmap" className="text-brand-fire font-semibold inline-flex items-center gap-1">
            zur Roadmap <ChevronRight size={13} />
          </Link>
        </p>
      )}
      {anzahl > 0 && (
        <p className="mt-4 text-xs font-sans text-text-muted">
          Gedruckte Urkunde für eine bestandene Stufe:{' '}
          <Link href="/diplome/urkunde" className="underline hover:text-brand-fire">bestellen</Link>
        </p>
      )}
    </div>
  );
}
