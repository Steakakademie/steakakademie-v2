'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Flame, MonitorSmartphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sicheresZiel } from '@/lib/auth/sicheres-ziel';
import { MAX_GERAETE } from '@/lib/auth/geraete-konstanten';

/**
 * /auth/geraete — hierher leitet jede Kurs-Seite, wenn das Konto gekauft hat,
 * dieses Gerät aber nicht zu den MAX_GERAETE zuletzt angemeldeten gehört
 * (src/lib/auth/geraete-limit.ts, Entscheidung Uwe 17.10.2026).
 *
 * „Andere Geräte abmelden" = supabase.auth.signOut({ scope: 'others' }): löscht
 * alle übrigen Sitzungen des Kontos; dieses Gerät ist danach das einzige und
 * damit wieder zugelassen — ohne neue Anmeldung per Mail.
 */
function GeraeteInhalt() {
  const params = useSearchParams();
  const ziel = sicheresZiel(params.get('redirectTo'), undefined, '/meine-kurse');
  const [status, setStatus] = useState<'bereit' | 'laeuft' | 'fehler'>('bereit');

  async function andereAbmelden() {
    setStatus('laeuft');
    try {
      const { error } = await createClient().auth.signOut({ scope: 'others' });
      if (error) throw error;
      window.location.assign(new URL(ziel, window.location.origin));
    } catch {
      setStatus('fehler');
    }
  }

  async function hierAbmelden() {
    setStatus('laeuft');
    try {
      await createClient().auth.signOut({ scope: 'local' });
    } finally {
      window.location.assign(new URL('/', window.location.origin));
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <Flame size={28} className="text-brand-fire" />
          <span className="font-serif text-xl font-bold text-text-light">Steakakademie</span>
        </Link>
      </div>

      <div className="border border-border-subtle bg-surface-elevated/60 p-6">
        <MonitorSmartphone size={28} className="text-brand-fire mb-4" aria-hidden />
        <h1 className="font-serif text-2xl font-bold text-text-light mb-3">
          Dein Konto ist auf anderen Geräten angemeldet
        </h1>
        <p className="font-sans text-sm text-text-secondary mb-3">
          Deine Kurse kannst du auf bis zu {MAX_GERAETE} Geräten gleichzeitig nutzen. Auf zwei anderen
          Geräten bist du später angemeldet worden als auf diesem — deshalb sind die Inhalte hier gerade zu.
        </p>
        <p className="font-sans text-sm text-text-secondary mb-6">
          Willst du hier weitermachen, melde die anderen Geräte ab. Dort musst du dich beim nächsten Mal
          neu anmelden.
        </p>

        <button
          type="button"
          onClick={andereAbmelden}
          disabled={status === 'laeuft'}
          className="w-full bg-brand-fire text-white font-sans font-bold text-sm py-3 px-4 hover:opacity-90 disabled:opacity-60"
        >
          {status === 'laeuft' ? 'Einen Moment …' : 'Andere Geräte abmelden und hier weiterlernen'}
        </button>
        <button
          type="button"
          onClick={hierAbmelden}
          disabled={status === 'laeuft'}
          className="w-full mt-3 border border-border-subtle text-text-secondary font-sans text-sm py-3 px-4 hover:text-text-light disabled:opacity-60"
        >
          Lieber hier abmelden
        </button>

        {status === 'fehler' && (
          <p role="alert" className="mt-4 font-sans text-sm text-red-400">
            Das hat nicht geklappt. Lade die Seite neu und versuch es noch einmal — oder melde dich ab und
            wieder an.
          </p>
        )}

        <p className="mt-6 font-sans text-xs text-text-muted">
          Hinweis: Deine Kurse sind für dich persönlich. Die Weitergabe von Zugangsdaten ist laut{' '}
          <Link href="/agb" className="underline hover:text-text-light">AGB</Link> nicht erlaubt.
        </p>
      </div>
    </div>
  );
}

export default function GeraetePage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(circle at center, #2D2218 0%, #120C07 100%)' }}
    >
      <Suspense fallback={<div className="font-serif text-xl text-text-light">Lädt…</div>}>
        <GeraeteInhalt />
      </Suspense>
    </main>
  );
}
