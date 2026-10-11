'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { chipEintrag, type LeistenEintrag } from '@/lib/aktionen/leiste';
import { liesVorschau } from '@/lib/aktionen/vorschau';

/**
 * Saison-Chip im Kopfbereich der Startseite (Uwe, 11.10.2026) — ein goldener Knopf
 * neben den Rubriken, der im Saisonfenster auf die erste laufende Aktionsseite zeigt
 * und leicht glüht (`sa-gluehen`, globals.css; still bei prefers-reduced-motion).
 *
 * Er ist Teil des VALUE-PROP-BANDES, kein eigener Abschnitt — die Reihenfolge der
 * Startseite (CLAUDE.md Regel 8) bleibt, der Vermerk dazu steht dort.
 *
 * `server`: was der Server für das echte Fenster berechnet hat (die Startseite wird
 * stündlich neu gerendert). Nach dem Hydrieren kommt der Vorschau-Schalter dazu.
 */
export default function SaisonChip({ server }: { server: LeistenEintrag | null }) {
  const [eintrag, setEintrag] = useState<LeistenEintrag | null>(server);
  useEffect(() => {
    if (server) return;
    if (liesVorschau(window.location.search)) setEintrag(chipEintrag({ vorschau: true }));
  }, [server]);
  if (!eintrag) return null;
  return (
    <Link
      href={eintrag.href}
      className="sa-gluehen inline-flex items-center gap-1.5 rounded-full border border-brand-gold bg-brand-gold px-4 py-2 text-xs font-sans font-bold tracking-wide uppercase text-ink hover:bg-brand-fire hover:border-brand-fire transition-colors motion-reduce:animate-none"
    >
      <span aria-hidden="true">{eintrag.symbol}</span> {eintrag.text} <ChevronRight size={12} />
    </Link>
  );
}
