'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { istGeschenkSaison, kaufbareGutscheine } from '@/lib/gutschein-products';
import { leistenEintraege, type LeistenEintrag } from '@/lib/aktionen/leiste';
import { liesVorschau } from '@/lib/aktionen/vorschau';

/**
 * Leiste über der Navigation (Uwe, 11.10.2026: „Als Laufleiste, anderen leichten
 * Animationen, die das Auge dahin lenken?").
 *
 * Außerhalb des Saisonfensters: die Spickzettel-Leiste wie seit dem Audit vom 15.08.2026
 * (Leadmagnet auf der stärksten Fläche). Im Fenster — oder mit dem Vorschau-Schalter —
 * eine Laufleiste mit den laufenden Aktionsseiten und dem Gutschein: Text läuft langsam
 * von rechts nach links (CSS-Keyframes `sa-lauf`, globals.css), hält bei Hover und Fokus
 * an; das Symbol pulsiert leicht. Wer „weniger Bewegung" eingestellt hat
 * (prefers-reduced-motion), sieht dieselben Einträge still nebeneinander.
 *
 * Erst nach dem Hydrieren umgeschaltet: Der erste Render ist auf Server und Client die
 * Spickzettel-Leiste (statische Seiten).
 */
export default function SaisonLeiste() {
  const [eintraege, setEintraege] = useState<LeistenEintrag[]>([]);
  useEffect(() => {
    const vorschau = liesVorschau(window.location.search);
    const gutschein = istGeschenkSaison() && kaufbareGutscheine().length > 0;
    setEintraege(leistenEintraege({ vorschau, gutschein }));
  }, []);

  if (eintraege.length === 0) {
    return (
      <aside
        aria-label="Kostenloser Kerntemperatur-Spickzettel"
        className="bg-surface-dark border-b border-brand-gold/20 text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-center py-2 px-4 text-text-light/60"
      >
        Gratis: der Kerntemperatur-Spickzettel — alle Garstufen auf einer Seite
        <Link
          href="/kerntemperatur-spickzettel"
          className="ml-3 inline-block py-1.5 text-brand-gold underline underline-offset-2 hover:text-brand-gold transition-colors"
        >
          Jetzt sichern →
        </Link>
      </aside>
    );
  }

  // Zweimal dieselbe Reihe: Die zweite rückt nach, wenn die erste nach links hinausläuft —
  // so entsteht die Schleife ohne Sprung. Für Vorlesesoftware zählt nur die erste Reihe.
  const reihe = (versteckt: boolean) => (
    <ul className="sa-lauf__reihe" aria-hidden={versteckt || undefined}>
      {eintraege.map((e) => (
        <li key={e.key} className="sa-lauf__eintrag">
          <Link href={e.href} tabIndex={versteckt ? -1 : undefined} className="sa-lauf__link">
            <span className="sa-lauf__symbol" aria-hidden="true">{e.symbol}</span>
            {e.text}
            <span className="sa-lauf__pfeil" aria-hidden="true">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <aside aria-label="Saison-Angebote" className="sa-lauf bg-surface-dark border-b border-brand-gold/30">
      <div className="sa-lauf__bahn">
        {reihe(false)}
        {reihe(true)}
      </div>
    </aside>
  );
}
