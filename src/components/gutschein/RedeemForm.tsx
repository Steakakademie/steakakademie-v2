'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gift, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RedeemForm({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [success, setSuccess] = useState<{ title: string; redirect: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setNeedsLogin(false);
    try {
      const res = await fetch('/api/gutschein/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.status === 401 && data.needsLogin) { setNeedsLogin(true); return; }
      if (data.ok) {
        setSuccess({ title: data.course_title, redirect: data.redirect });
        setTimeout(() => { window.location.href = data.redirect; }, 1800);
        return;
      }
      setError(data.error ?? 'Einlösung fehlgeschlagen.');
    } catch {
      setError('Netzwerkfehler. Bitte versuch es erneut.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h3 className="font-serif text-2xl font-bold text-text-primary mb-2">Freigeschaltet! 🔥</h3>
        <p className="font-body text-text-secondary mb-4">
          „{success.title}&quot; gehört jetzt dir. Wir leiten dich weiter …
        </p>
        <Link href={success.redirect} className="btn-affiliate justify-center inline-flex">Jetzt starten</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="voucher-code" className="block text-xs font-sans font-bold uppercase tracking-wide text-text-muted mb-1.5">
          Gutschein-Code
        </label>
        <input
          id="voucher-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="SA-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-surface-base border border-border-subtle px-4 py-3 font-mono text-lg tracking-widest text-text-primary uppercase placeholder:text-text-muted focus:border-brand-gold transition-colors duration-150"
        />
      </div>

      {error && (
        <p className="flex items-start gap-2 text-sm font-sans text-brand-fire">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {needsLogin && (
        <div className="bg-surface-base border border-border-subtle p-4 text-sm font-sans text-text-secondary">
          Zum Einlösen brauchst du ein (kostenloses) Konto — so gehört der Zugang dauerhaft dir.
          <Link
            href={`/auth/login?redirectTo=/gutschein/einloesen`}
            className="block mt-3 btn-affiliate justify-center"
          >
            Anmelden / Registrieren
          </Link>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || code.trim().length < 4}
        className="btn-affiliate w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" /> : <Gift size={16} />}
        {loading ? 'Wird eingelöst …' : 'Gutschein einlösen'}
      </button>
    </form>
  );
}
