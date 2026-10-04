'use client';

import { useEffect, useState } from 'react';
import { m as motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import NewsletterSignup from '@/components/ui/NewsletterSignup';

/**
 * Symmetrische Akzent-Leiste (oben & unten) mit dezentem Glimmer-Sweep.
 * Rahmt das Modal bewusst statt der einzelnen Linie oben; Motion respektiert
 * prefers-reduced-motion (dann nur statischer Gradient, kein Sweep).
 */
function AccentBar() {
  const reduce = useReducedMotion();
  return (
    <div className="relative h-0.5 overflow-hidden bg-gradient-to-r from-brand-fire via-brand-gold to-brand-fire">
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
          initial={{ x: '-130%' }}
          animate={{ x: '330%' }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.4 }}
        />
      )}
    </div>
  );
}

// Routes where the overlay should NOT appear
const EXCLUDED_PATHS = ['/diplome', '/diplome/simulation', '/kontakt', '/impressum', '/datenschutz', '/agb'];

// Safe sessionStorage access. Mobile Safari (u. a. bei blockierten Cookies /
// Privatmodus) wirft beim Zugriff auf sessionStorage eine SecurityError
// (DOMException 18 „The operation is insecure.") — window existiert dann zwar,
// der Storage-Zugriff ist aber trotzdem gesperrt. Ohne diese Kapselung landete
// jeder solche Aufruf als Fehler in Sentry (/temperatur-guide, 02.09.2026).
function safeSessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* Storage gesperrt — Overlay verhält sich, als wäre es noch nicht gezeigt worden. */
  }
}

export default function ExitIntent() {
  const [visible, setVisible] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    // Check session storage — don't show twice
    if (typeof window !== 'undefined') {
      const shown = safeSessionGet('sa_exit_shown');
      const currentPath = window.location.pathname;

      // Don't show on excluded paths
      if (shown || EXCLUDED_PATHS.some(p => currentPath.startsWith(p))) return;
    }

    // Arm after 15 seconds on page
    const armTimer = setTimeout(() => setArmed(true), 15_000);

    return () => clearTimeout(armTimer);
  }, []);

  useEffect(() => {
    if (!armed) return;

    function handleMouseLeave(e: MouseEvent) {
      // Only trigger when mouse leaves through the TOP of the viewport
      if (e.clientY > 10) return;
      setVisible(true);
      safeSessionSet('sa_exit_shown', '1');
      document.removeEventListener('mouseleave', handleMouseLeave);
    }

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [armed]);

  // Also close on Escape
  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setVisible(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setVisible(false)}
            className="fixed inset-0 bg-black/85 z-[100]"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: -24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-md px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Bevor du gehst"
          >
            <div className="bg-surface-dark border border-brand-gold/25 shadow-[0_24px_64px_rgba(0,0,0,0.7)] overflow-hidden">

              {/* Accent line — oben */}
              <AccentBar />

              {/* Close button */}
              <button
                onClick={() => setVisible(false)}
                className="absolute top-4 right-4 z-10 text-text-muted hover:text-text-primary transition-colors"
                aria-label="Schließen"
              >
                <X size={16} />
              </button>

              <div className="px-2 pt-2 sm:px-3">
                {/* Zentrale Anmelde-Komponente (DSGVO-Consent, Honeypot, DOI-Erfolgszustand) —
                    Rahmen/Hintergrund neutralisiert, damit sie im Modal nicht doppelt rahmt. */}
                {/* Audit 15.08.2026: Das Overlay versprach als einziges „Porträts
                    der 50 besten Grillmeister" — ein viertes, nirgends eingelöstes
                    Versprechen. Jetzt dasselbe Angebot wie überall sonst. */}
                <NewsletterSignup
                  source="exit-intent"
                  eyebrow="Warte kurz — bevor du gehst"
                  headline="Nimm den Kerntemperatur-Spickzettel mit."
                  subline="Alle Garstufen auf einer Seite, druckfertig für die Grillstation. Dazu der Wissens-Brief: BBQ-Wissen, das bleibt — ohne festen Takt, ohne Spam. Double-Opt-In, jederzeit abbestellbar."
                  cta="Ja, Spickzettel sichern"
                  className="border-0 bg-transparent"
                />
              </div>

              <button
                onClick={() => setVisible(false)}
                className="w-full text-center text-[10px] font-sans text-text-muted hover:text-text-muted transition-colors pb-4"
              >
                Nein danke, ich verpasse das lieber
              </button>

              {/* Accent line — unten (Symmetrie) */}
              <AccentBar />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
