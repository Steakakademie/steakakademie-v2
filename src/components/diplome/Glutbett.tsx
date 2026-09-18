'use client';

import { useEffect, useRef, useState } from 'react';
import { CHECK_EREIGNIS, anzahlBestanden } from '@/lib/diplome/check-speicher';

/**
 * Glutbett — Fortschritt einer Stufe als Kohlebett (Uwe, 09.09.2026).
 *
 * Je bestandenem Lektions-Check entzuendet sich eine Kohle. Das ist der Ersatz
 * fuer Konfetti, und zwar aus einem inhaltlichen Grund: Konfetti ist jedes Mal
 * dasselbe und wird ab dem vierten Mal zur Tapete. Eine Kohle SAMMELT sich —
 * Belohnung Nummer sieben ist befriedigender als Nummer eins, weil das Bett
 * voller wird. Nebenbei ersetzt das Bild die Prozentzahl: Man sieht, wie viele
 * Kohlen bis zur Pruefung fehlen, ohne dass jemand rechnet.
 *
 * Drei Intensitaetsstufen, wie man ein Animationsbudget in einem Spiel verteilt:
 *   Kohle 1 bis n-1  eine Kohle zuendet, klein und freundlich
 *   letzte Kohle     das ganze Bett schlaegt einmal durch
 *   Rang-Aufstieg    das Abzeichen (Abschnitt B, spaeter) — der eine grosse Moment
 *
 * Der Zustand kommt aus dem localStorage (check-speicher.ts) und wird per
 * Fensterereignis aktualisiert, weil Check und Glutbett auf der Seite weit
 * auseinanderliegen.
 *
 * SSR-Hinweis: Auf dem Server ist der Stand unbekannt. Deshalb rendert die
 * erste Runde bewusst NULL brennende Kohlen und der echte Stand kommt im
 * Effekt — sonst gaebe es eine Hydrations-Abweichung. Das Bett ist beim
 * Seitenaufbau also kurz dunkel; das faellt nicht auf und ist der Preis dafuer,
 * dass die Lektionsseiten statisch bleiben duerfen.
 */

type Props = {
  /** Alle Lektions-Slugs der Stufe, in Reihenfolge. Laenge = Anzahl der Kohlen. */
  slugs: readonly string[];
  /** Stufenfarbe aus stufen.ts. */
  color: string;
  variant?: 'klein' | 'gross';
  /** Beschriftung darunter; false blendet sie aus. */
  label?: boolean;
};

const FUNKEN = [-14, -8, -3, 3, 9, 15];

export default function Glutbett({ slugs, color, variant = 'klein', label = true }: Props) {
  const [anzahl, setAnzahl] = useState(0);
  const [zuendend, setZuendend] = useState<number | null>(null);
  const letzte = useRef(0);
  /**
   * Der erste Lauf zeigt den mitgebrachten Stand — er darf NICHT zuenden.
   * Sonst flackert bei jedem Seitenaufruf die zuletzt verdiente Kohle erneut
   * auf, und aus einem Moment wird eine Marotte. Gezuendet wird nur, was
   * waehrend dieses Besuchs dazukommt.
   */
  const ersterLauf = useRef(true);
  const uhr = useRef<number | null>(null);

  // `slugs` kommt als frisches Array aus dem Rendern der Seite und hat bei
  // jedem Durchlauf eine neue Identitaet. Als Abhaengigkeit direkt eingesetzt,
  // liefe der Effekt nach JEDEM Rendern erneut, meldete sich neu an und
  // wieder ab — und da er selbst Zustand setzt, dreht sich das im Kreis, bis
  // React abbricht, weil der Wert gleich blieb. Ein aus dem Inhalt gebildeter
  // Schluessel macht die Abhaengigkeit stabil.
  const schluessel = slugs.join('|');

  useEffect(() => {
    const liste = schluessel ? schluessel.split('|') : [];
    const lesen = () => {
      const n = anzahlBestanden(liste);
      setAnzahl(n);
      if (n > letzte.current && !ersterLauf.current) {
        setZuendend(n - 1); // die gerade hinzugekommene Kohle
        if (uhr.current !== null) window.clearTimeout(uhr.current);
        uhr.current = window.setTimeout(() => setZuendend(null), 1250);
      }
      letzte.current = n;
      ersterLauf.current = false;
    };
    lesen();
    window.addEventListener(CHECK_EREIGNIS, lesen);
    // Ein zweiter Tab, in dem gelernt wird, aktualisiert dieses Bett mit.
    window.addEventListener('storage', lesen);
    return () => {
      window.removeEventListener(CHECK_EREIGNIS, lesen);
      window.removeEventListener('storage', lesen);
      if (uhr.current !== null) window.clearTimeout(uhr.current);
    };
  }, [schluessel]);

  const gesamt = slugs.length;
  const vollstaendig = gesamt > 0 && anzahl === gesamt;
  const kante = variant === 'gross' ? 20 : 12;
  const abstand = variant === 'gross' ? 7 : 5;

  return (
    <div>
      <div
        className="flex items-end"
        style={{ gap: abstand }}
        role="img"
        aria-label={`${anzahl} von ${gesamt} Lektionen verstanden`}
      >
        {slugs.map((slug, i) => {
          const brennt = i < anzahl;
          const zuendetGerade = zuendend === i || (vollstaendig && zuendend !== null);
          return (
            <span key={slug} className="relative inline-block" style={{ width: kante, height: kante }}>
              <span
                className={`block w-full h-full rounded-[3px] ${zuendetGerade ? 'sa-glut-zuendet' : ''}`}
                style={
                  brennt
                    ? {
                        background: `radial-gradient(120% 120% at 50% 120%, #FFB347 0%, ${color} 45%, #7A2E0B 100%)`,
                        boxShadow: `0 0 ${variant === 'gross' ? 10 : 6}px ${color}80`,
                      }
                    : { background: '#2A1E16', border: '1px solid rgba(255,255,255,0.06)' }
                }
              />
              {zuendetGerade &&
                FUNKEN.map((x, f) => (
                  <span
                    key={f}
                    className="sa-funke absolute left-1/2 top-0 rounded-full pointer-events-none"
                    style={
                      {
                        width: 3,
                        height: 3,
                        background: '#FFC66B',
                        animationDelay: `${f * 45}ms`,
                        '--sa-funke-x': `${x}px`,
                      } as React.CSSProperties
                    }
                  />
                ))}
            </span>
          );
        })}
      </div>

      {label && (
        <p className="mt-2 font-sans text-[11px] tracking-wide text-text-light/45">
          {vollstaendig
            ? 'Das Feuer brennt — alle Lektionen verstanden.'
            : `${anzahl} von ${gesamt} Kohlen glühen`}
        </p>
      )}
    </div>
  );
}
