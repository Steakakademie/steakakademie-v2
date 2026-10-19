'use client';

import { useEffect, useRef } from 'react';

/**
 * EmberGlow — reaktiver Glut-Schein als Ersatz für den SmokeEffect.
 *
 * Entscheidung (Uwe, 15.08.2026, Design-Audit): KEINE Dauerschleifen-Animation
 * (Gemini-Stil verworfen — Habituation, Lesbarkeit, INP). Stattdessen Bewegung
 * nur als REAKTION auf Nutzerhandlung:
 *
 *  - Der Farbton wandert mit der Scrolltiefe entlang des Gargrad-Spektrums
 *    (Rare → Medium Rare → Medium → Well Done). Der Verlauf ist
 *    damit bedeutungstragend: die Seite "gart" beim Lesen. Stufen-Namen =
 *    Kanon der Plattform; die Farbwerte sind gestalterische Interpretation,
 *    abgestimmt auf die Marken-DNA (Gold #C8882A / Fire #E85018 / Ink).
 *  - Während des Scrollens glimmt die Glut leicht auf, danach ruht sie.
 *  - Keine Timer, kein Animations-Loop: ein passiver, rAF-gedrosselter
 *    Scroll-Listener.
 *  - prefers-reduced-motion: Übergänge werden hart statt weich — die (ohnehin
 *    nutzerinitiierte) Farbänderung bleibt, nichts pulsiert.
 *
 * UMBAU 02.09.2026 (plans/006): Der Farbton wird nicht mehr interpoliert und in
 * EINEN Gradienten geschrieben. Stattdessen liegen alle fünf Garstufen als
 * eigene, statisch gezeichnete Ebenen übereinander, und beim Scrollen ändert
 * sich ausschliesslich deren opacity. Grund: `background` ist keine
 * Compositor-Property — jede Farbänderung zwang den Browser, ein
 * bildschirmfüllendes fixed-Element neu zu zeichnen, gemessen +71 Paints
 * (+24 %) und rund 3 Bilder/s auf einem Vollscroll. Opacity läuft auf dem
 * Compositor, ohne Repaint. Das frühere `willChange: 'background'` war
 * wirkungslos: eine eigene Ebene entsteht nur über transform, opacity oder
 * filter.
 *
 * Der alte SmokeEffect bleibt unangetastet im Repo (Ein-Zeilen-Revert in
 * layout.tsx möglich).
 */

/** Gargrad-Spektrum — Reihenfolge = kanonische Garstufen-Leiter. */
export const GARGRAD_STOPS: { label: string; hex: string }[] = [
  { label: 'Rare',        hex: '#8C2F39' }, // dunkles Blutrot
  { label: 'Medium Rare', hex: '#C0442E' }, // die Steakakademie-Empfehlung — nah an Brand-Fire
  { label: 'Medium',      hex: '#C97E52' }, // Rosé-Braun
  { label: 'Well Done',   hex: '#6E4B2E' }, // Röstbraun
];

/** Deckkraft des gesamten Scheins: ruhend und während des Scrollens. */
const ALPHA_RUHEND   = '0.13';
const ALPHA_SCROLLEND = '0.22';

/**
 * Eine Garstufe als statischer Verlauf. Die Farbe steht hier voll deckend;
 * die Gesamt-Deckkraft liefert der Container per opacity. `73` ist 45 % Alpha
 * in Hex — derselbe Abfall wie zuvor (`calc(var(--ember-alpha) * 0.45)`).
 */
function gradientFor(hex: string): string {
  return `radial-gradient(58% 34% at 50% 102%, ${hex} 0%, ${hex}73 42%, transparent 74%)`;
}

export default function EmberGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const layers = Array.from(el.children) as HTMLElement[];
    if (layers.length !== GARGRAD_STOPS.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      el.style.transition = 'none';
      layers.forEach((layer) => { layer.style.transition = 'none'; });
    }

    let ticking = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const t = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

      // Scrolltiefe auf das Stufen-Paar abbilden: i und i+1 blenden über,
      // alle anderen Ebenen bleiben unsichtbar.
      const seg = t * (GARGRAD_STOPS.length - 1);
      const i = Math.min(GARGRAD_STOPS.length - 2, Math.floor(seg));
      const f = seg - i;
      layers.forEach((layer, k) => {
        const o = k === i ? 1 - f : k === i + 1 ? f : 0;
        layer.style.opacity = String(o);
      });

      // Glimmen nur, solange der Nutzer wirklich scrollt.
      el.style.opacity = ALPHA_SCROLLEND;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { el.style.opacity = ALPHA_RUHEND; }, 600);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        opacity: Number(ALPHA_RUHEND),
        transition: 'opacity 700ms ease',
        willChange: 'opacity',
      }}
    >
      {GARGRAD_STOPS.map((stop, i) => (
        <div
          key={stop.label}
          data-gargrad={stop.label}
          style={{
            position: 'absolute',
            inset: 0,
            // Startzustand am Seitenanfang: Rare
            opacity: i === 0 ? 1 : 0,
            transition: 'opacity 700ms ease',
            willChange: 'opacity',
            background: gradientFor(stop.hex),
          }}
        />
      ))}
    </div>
  );
}
