'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CONSENT_OPEN_EVENT, getConsent, setConsent } from '@/lib/consent';
import { istTuwasHost } from '@/lib/marken-host';

/**
 * DSGVO-Consent-Banner (Opt-in). Erscheint, bis eine Entscheidung getroffen wurde,
 * und lässt sich über den Footer ("Cookie-Einstellungen") jederzeit erneut öffnen
 * (Widerruf/Änderung).
 *
 * Rechtssicher gestaltet:
 *  - Zwei GLEICHWERTIGE Buttons auf der ersten Ebene: „Alles akzeptieren" und
 *    „Ablehnen" (identische Größe/Prominenz, kein Nudging).
 *  - Kein vorab gesetztes Häkchen, keine Vorauswahl; ohne Zustimmung wird nichts geladen.
 *  - Schließen ohne Wahl ist nicht möglich (nur über die beiden Buttons).
 */
// Beide Consent-Buttons nutzen exakt dieselbe Klasse → gleiche Größe UND Farbe.
const CONSENT_BTN =
  'w-full rounded-md border border-brand-gold/60 bg-surface-elevated px-5 py-3 text-sm font-sans font-bold uppercase tracking-[0.08em] text-brand-gold transition-colors hover:bg-brand-gold/10 hover:border-brand-gold';

export default function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // tuwasduwillst.de laedt nichts Einwilligungspflichtiges (Clarity nur auf steakakademie.de).
    if (istTuwasHost()) return;
    if (getConsent() === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  // KAN-72: Solange der Banner offen ist, bekommt <body> ein padding-bottom in
  // Bannerhöhe. So bleibt der Footer (Impressum/Datenschutz/AGB) über dem Banner
  // erreichbar, statt von ihm verdeckt zu werden (§ 5 Abs. 1 DDG).
  useEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;
    const apply = () => { document.body.style.paddingBottom = `${el.offsetHeight}px`; };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
      document.body.style.paddingBottom = '';
    };
  }, [open]);

  if (!open) return null;

  const decide = (statistics: boolean) => {
    setConsent(statistics);
    setOpen(false);
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Datenschutz-Einstellungen"
      className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-3xl rounded-lg border border-brand-gold/25 bg-surface-dark/95 backdrop-blur-sm p-5 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
        <h2 className="font-serif text-lg font-bold text-text-light">Deine Privatsphäre</h2>
        <p className="mt-2 font-body text-sm leading-relaxed text-text-light/70">
          Für die Grund-Reichweitenmessung nutzen wir <strong className="text-text-light/90">Plausible</strong> —
          cookielos, anonym, ohne Einwilligung. Zusätzlich möchten wir mit <strong className="text-text-light/90">Microsoft
          Clarity</strong> (Heatmaps &amp; Sitzungs-Analyse, mit Cookies) verstehen, wie die
          Seite genutzt wird, um sie zu verbessern. Das laden wir nur mit deiner Zustimmung.
          Du kannst deine Wahl jederzeit im Footer unter „Cookie-Einstellungen&quot; ändern.{' '}
          <Link href="/datenschutz" className="text-brand-gold underline underline-offset-2 hover:text-brand-gold/80">
            Datenschutzerklärung
          </Link>
        </p>

        {/* Erste Ebene: zwei gleichwertige Buttons — identische Größe UND Farbe,
            keiner wird hervorgehoben (kein Nudging). */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => decide(false)} className={CONSENT_BTN}>
            Ablehnen
          </button>
          <button onClick={() => decide(true)} className={CONSENT_BTN}>
            Alles akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
