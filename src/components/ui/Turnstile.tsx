'use client';

/**
 * Cloudflare Turnstile — Browser-Widget.
 *
 * Rendert NUR, wenn NEXT_PUBLIC_TURNSTILE_SITE_KEY gesetzt ist; sonst gibt es
 * kein Widget und kein Token — und der Server überspringt die Prüfung ebenfalls,
 * solange TURNSTILE_SECRET_KEY fehlt (src/lib/api/turnstile.ts). Beide Variablen
 * zusammen setzen, dann ist der Schutz scharf.
 *
 * Standard ist `appearance="interaction-only"`: Das Widget bleibt unsichtbar und
 * zeigt sich nur, wenn Cloudflare wirklich eine Interaktion braucht. Für die
 * meisten Besucher ändert sich an der Oberfläche nichts.
 *
 * CSP: script-src und frame-src erlauben https://challenges.cloudflare.com
 * (next.config.mjs).
 */

import { useEffect, useRef } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<void> | null = null;
function ladeScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error('Turnstile-Script nicht ladbar')); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

type Props = {
  /** Bekommt das Token; bei Ablauf/Fehler einen leeren String. */
  onToken: (token: string) => void;
  /** Aktion-Name für die Cloudflare-Statistik (nur [a-zA-Z0-9_-], max. 32). */
  action?: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
};

export default function Turnstile({ onToken, action, appearance = 'interaction-only', theme = 'dark', className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  useEffect(() => { onTokenRef.current = onToken; }, [onToken]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ref.current) return;
    let abgebaut = false;
    ladeScript()
      .then(() => {
        if (abgebaut || !ref.current || !window.turnstile) return;
        idRef.current = window.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          appearance,
          theme,
          language: 'de',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => onTokenRef.current(''),
          'timeout-callback': () => onTokenRef.current(''),
        });
      })
      .catch((e) => console.warn('[turnstile]', e));
    return () => {
      abgebaut = true;
      if (idRef.current && window.turnstile) {
        try { window.turnstile.remove(idRef.current); } catch { /* Widget schon weg */ }
      }
      idRef.current = null;
    };
  }, [action, appearance, theme]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} className={className} />;
}

/** Nach einem Fehlversuch neues Token holen (Tokens sind einmal gültig). */
export function turnstileReset(): void {
  try { window.turnstile?.reset(); } catch { /* kein Widget */ }
}
