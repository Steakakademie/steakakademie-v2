'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Social Login (Google, Amazon) für die Login-Seite.
 *
 * Beide Wege laufen über Supabase Auth und landen wie Magic Link und
 * Passwort-Login in /auth/callback, das den PKCE-Code gegen eine Sitzung
 * tauscht. `next` wird genauso durchgereicht wie dort.
 *
 * Amazon ist bei Supabase kein eingebauter Anbieter, sondern ein Custom
 * OAuth2 Provider (Dashboard: Authentication → Providers → Custom OAuth
 * Providers). Der Bezeichner unten MUSS dem dort eingetragenen entsprechen —
 * sonst antwortet Supabase mit "Unsupported provider", ohne dass tsc oder
 * der Build das bemerken.
 */
const AMAZON_PROVIDER = 'custom:amazon' as const;

type Anbieter = 'google' | typeof AMAZON_PROVIDER;

interface Props {
  /** Ziel nach erfolgreicher Anmeldung, relativ (z. B. /diplome/profil). */
  redirectTo: string;
  /** Sperrt die Buttons, während die Login-Seite selbst beschäftigt ist. */
  disabled?: boolean;
  /** Meldet Fehler an die Seite; die zeigt sie in ihrem bestehenden Kasten. */
  onError: (message: string) => void;
}

export default function OAuthButtons({ redirectTo, disabled = false, onError }: Props) {
  const [laufend, setLaufend] = useState<Anbieter | null>(null);

  async function anmelden(provider: Anbieter) {
    setLaufend(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    // Ohne Fehler leitet der Browser jetzt zum Anbieter weiter; der Zustand
    // spielt dann keine Rolle mehr. Mit Fehler bleiben wir auf der Seite.
    if (error) {
      setLaufend(null);
      onError(error.message);
    }
  }

  const gesperrt = disabled || laufend !== null;

  const buttonClass =
    'w-full flex items-center justify-center gap-3 py-3 px-4 rounded-sm font-sans text-sm font-bold ' +
    'text-text-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const buttonStyle = { background: '#120C07', border: '1px solid rgba(58,42,30,0.9)' };
  const rand = (e: React.MouseEvent<HTMLButtonElement>, farbe: string) => {
    e.currentTarget.style.borderColor = farbe;
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => anmelden('google')}
        disabled={gesperrt}
        aria-busy={laufend === 'google'}
        className={buttonClass}
        style={buttonStyle}
        onMouseEnter={e => rand(e, '#C8882A')}
        onMouseLeave={e => rand(e, 'rgba(58,42,30,0.9)')}
      >
        <GoogleMarke />
        {laufend === 'google' ? 'Weiterleitung zu Google …' : 'Mit Google anmelden'}
      </button>

      <button
        type="button"
        onClick={() => anmelden(AMAZON_PROVIDER)}
        disabled={gesperrt}
        aria-busy={laufend === AMAZON_PROVIDER}
        className={buttonClass}
        style={buttonStyle}
        onMouseEnter={e => rand(e, '#C8882A')}
        onMouseLeave={e => rand(e, 'rgba(58,42,30,0.9)')}
      >
        <AmazonMarke />
        {laufend === AMAZON_PROVIDER ? 'Weiterleitung zu Amazon …' : 'Mit Amazon anmelden'}
      </button>
    </div>
  );
}

/* Markenzeichen als Inline-SVG: kein Netzaufruf, keine Bildabhängigkeit. */

function GoogleMarke() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.7 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function AmazonMarke() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#FF9900"
        d="M2.5 15.4c.2-.3.5-.3.8-.1 4.4 2.6 9.9 3.4 15.3 1.6.4-.1.7.3.4.6-1.5 1.5-4.4 2.5-7.5 2.5-3.3 0-6.5-1.2-8.9-3.4-.2-.2-.3-.6-.1-1.2z"
      />
      <path
        fill="#FF9900"
        d="M20.1 14.6c-.4-.5-2.5-.2-3.4-.1-.3 0-.3-.2-.1-.4 1.7-1.2 4.4-.8 4.7-.4.3.4-.1 3.1-1.7 4.4-.2.2-.5.1-.4-.2.4-.9 1.2-2.8.9-3.3z"
      />
      <path
        fill="currentColor"
        d="M14.6 10.9V9.6c0-.2.1-.3.3-.3h3.5c.2 0 .3.1.3.3v1.1c0 .2-.2.4-.4.8l-1.8 2.6c.7 0 1.4.1 2 .4.1.1.2.2.2.3v1.3c0 .2-.2.4-.4.3-1.1-.6-2.5-.6-3.7 0-.2.1-.4-.1-.4-.3v-1.2c0-.2 0-.6.2-.9l2.1-3h-1.8c-.2 0-.3-.1-.3-.3zM8.9 16.4c-1.8 0-3-1-3-2.7 0-1.4.9-2.3 2.4-2.7.7-.2 1.5-.3 2.2-.3v-.2c0-.7-.1-1.3-1-1.3-.6 0-1 .3-1.1.8 0 .2-.2.3-.3.3l-1.6-.2c-.2 0-.3-.2-.3-.3.4-1.7 1.8-2.3 3.4-2.3.8 0 1.8.2 2.4.8.8.7.7 1.7.7 2.7v2.4c0 .7.3 1 .6 1.4.1.1.1.3 0 .4-.3.3-.9.8-1.2 1-.2.1-.4.1-.5 0-.4-.4-.5-.5-.8-.9-.7.7-1.3 1.1-2.4 1.1zm.5-1.6c.5 0 .9-.3 1.1-.8.2-.5.2-1 .2-1.5v-.3c-.8 0-1.7.2-1.7 1.4 0 .7.3 1.2.8 1.2h-.4z"
      />
    </svg>
  );
}
