'use client';

import { useState, Suspense }  from 'react';
import Link                    from 'next/link';
import { useSearchParams }     from 'next/navigation';
import { ArrowRight, Mail, Flame, Lock } from 'lucide-react';
import OAuthButtons from '@/components/auth/OAuthButtons';

// ── Inner component — reads URL params (must be inside <Suspense>) ─────────────

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirectTo') ?? '/diplome/profil';
  const urlError     = searchParams.get('error');

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [mode,     setMode]     = useState<'magic' | 'password'>('magic');
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message,  setMessage]  = useState('');
  const [sentMsg,  setSentMsg]  = useState('');

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setSentMsg('Klick auf den Link in der E-Mail — kein Passwort nötig.');
      setStatus('sent');
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus('loading');
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setStatus('error');
      setMessage(
        /invalid login credentials/i.test(error.message)
          ? 'E-Mail oder Passwort falsch. Noch kein Passwort-Konto? Unten „Konto erstellen".'
          : error.message,
      );
    } else {
      window.location.href = redirectTo;
    }
  }

  async function handleSignup() {
    if (!email.trim() || !password) {
      setStatus('error'); setMessage('E-Mail und Passwort (min. 8 Zeichen) eingeben.'); return;
    }
    if (password.length < 8) {
      setStatus('error'); setMessage('Passwort muss mindestens 8 Zeichen haben.'); return;
    }
    setStatus('loading');
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    });
    if (error) {
      setStatus('error'); setMessage(error.message);
    } else if (data.session) {
      window.location.href = redirectTo;                 // E-Mail-Bestätigung deaktiviert → direkt drin
    } else {
      setSentMsg('Konto erstellt. Bestätige deine E-Mail-Adresse über den zugeschickten Link.');
      setStatus('sent');
    }
  }

  return (
    <div className="w-full max-w-sm">

      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <Flame size={28} className="text-brand-fire" />
          <span className="font-serif text-xl font-bold text-text-light">
            Steakakademie
          </span>
        </Link>
        <p className="font-sans text-xs text-text-muted mt-2 uppercase tracking-widest">
          Mitglieder-Zugang — kostenlos
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-sm border p-6"
        style={{
          borderColor: 'rgba(200,136,42,0.22)',
          background:  '#1E1410',
        }}
      >
        {status === 'sent' ? (

          /* ── Bestätigung ── */
          <div className="text-center py-4 space-y-3">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2"
              style={{ background: 'rgba(200,136,42,0.15)', border: '1px solid rgba(200,136,42,0.3)' }}
            >
              <Mail size={22} className="text-brand-gold" />
            </div>
            <h1 className="font-serif text-xl font-bold text-text-light">
              E-Mail unterwegs
            </h1>
            <p className="font-body text-sm text-text-secondary leading-relaxed">
              Wir haben eine E-Mail an{' '}
              <strong className="text-text-light">{email}</strong> geschickt.
              {' '}{sentMsg}
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="font-sans text-xs text-brand-gold hover:text-text-light transition-colors mt-2"
            >
              Andere E-Mail verwenden
            </button>
          </div>

        ) : (

          /* ── Formular ── */
          <>
            <h1 className="font-serif text-xl font-bold text-text-light mb-1">
              Willkommen in der Akademie
            </h1>
            <p className="font-body text-sm text-text-secondary mb-6">
              {mode === 'magic'
                ? 'Gib deine E-Mail-Adresse ein. Wir schicken dir einen Magic Link — kein Passwort nötig.'
                : 'Melde dich mit E-Mail und Passwort an — oder erstelle ein Passwort-Konto.'}
            </p>

            {(urlError || status === 'error') && (
              <div
                className="mb-4 px-4 py-3 rounded-sm border text-sm font-sans"
                style={{ borderColor: 'rgba(232,80,24,0.4)', background: 'rgba(232,80,24,0.08)', color: '#E85018' }}
              >
                {message || urlError || 'Anmeldung fehlgeschlagen — bitte erneut versuchen.'}
              </div>
            )}

            {/* Social Login — landet wie die anderen Wege in /auth/callback */}
            <OAuthButtons
              redirectTo={redirectTo}
              disabled={status === 'loading'}
              onError={msg => { setStatus('error'); setMessage(msg); }}
            />

            <div className="flex items-center gap-3 my-5" aria-hidden="true">
              <span className="h-px flex-1" style={{ background: 'rgba(200,136,42,0.22)' }} />
              <span className="font-sans text-xs uppercase tracking-wider text-text-muted">oder per E-Mail</span>
              <span className="h-px flex-1" style={{ background: 'rgba(200,136,42,0.22)' }} />
            </div>
            <form onSubmit={mode === 'magic' ? handleMagicLink : handlePassword} className="space-y-4">
              <div>
                <label htmlFor="email" className="font-sans text-xs font-bold uppercase tracking-wider text-text-muted block mb-2">
                  E-Mail-Adresse
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="deine@email.de"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-sm font-sans text-sm text-text-light placeholder:text-text-muted transition-colors"
                  style={{ background: '#120C07', border: '1px solid rgba(58,42,30,0.9)' }}
                  onFocus={e => e.target.style.borderColor = '#C8882A'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(58,42,30,0.9)'}
                />
              </div>

              {mode === 'password' && (
                <div>
                  <label htmlFor="password" className="font-sans text-xs font-bold uppercase tracking-wider text-text-muted block mb-2">
                    Passwort
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-sm font-sans text-sm text-text-light placeholder:text-text-muted transition-colors"
                    style={{ background: '#120C07', border: '1px solid rgba(58,42,30,0.9)' }}
                    onFocus={e => e.target.style.borderColor = '#C8882A'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(58,42,30,0.9)'}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim() || (mode === 'password' && !password)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 font-sans font-bold text-sm rounded-sm transition-opacity disabled:opacity-50"
                style={{ background: '#E85018', color: '#17100B' }}
              >
                {status === 'loading'
                  ? (mode === 'magic' ? 'Wird gesendet …' : 'Bitte warten …')
                  : (mode === 'magic' ? 'Magic Link senden' : 'Anmelden')}
                {status !== 'loading' && (mode === 'magic' ? <ArrowRight size={14} /> : <Lock size={14} />)}
              </button>
            </form>

            {mode === 'password' && (
              <button
                onClick={handleSignup}
                disabled={status === 'loading'}
                className="w-full mt-3 py-2.5 px-4 font-sans font-bold text-xs uppercase tracking-wider rounded-sm border transition-colors disabled:opacity-50"
                style={{ borderColor: 'rgba(200,136,42,0.45)', color: '#C8882A' }}
              >
                Neues Konto mit Passwort erstellen
              </button>
            )}

            {/* Modus-Umschalter */}
            <button
              onClick={() => { setMode(m => m === 'magic' ? 'password' : 'magic'); setStatus('idle'); setMessage(''); }}
              className="w-full text-center font-sans text-xs text-brand-gold hover:text-text-light transition-colors mt-5"
            >
              {mode === 'magic' ? 'Lieber mit Passwort anmelden →' : 'Lieber Magic Link (ohne Passwort) →'}
            </button>

            {mode === 'magic' && (
              <p className="font-sans text-xs text-text-muted text-center mt-4">
                Noch kein Konto? Einfach E-Mail eingeben — dein Zugang wird automatisch erstellt.
              </p>
            )}
          </>

        )}
      </div>

      <p className="font-sans text-xs text-text-muted text-center mt-6">
        <Link href="/" className="hover:text-brand-gold transition-colors">
          ← Zurück zur Startseite
        </Link>
      </p>
    </div>
  );
}

// ── Page export — wraps LoginForm in Suspense (required for useSearchParams) ──

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(circle at center, #2D2218 0%, #120C07 100%)' }}
    >
      <Suspense fallback={
        <div className="w-full max-w-sm text-center">
          <div className="font-serif text-xl text-text-light">Lädt…</div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </main>
  );
}
