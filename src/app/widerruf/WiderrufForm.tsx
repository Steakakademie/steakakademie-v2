'use client';

import { useRef, useState } from 'react';
import HoneypotFeld, { honeypotWert } from '@/components/ui/HoneypotFeld';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { KONTAKT_EMPFAENGER } from '@/lib/kontakt';
import { BESTAETIGUNGS_TEXT, bestaetigungsLage, type BestaetigungsLage } from '@/lib/widerruf-rueckmeldung';

// 03.10.2026: Scheitert die Übermittlung (kein Netz, Antwort ohne JSON), nennt
// die Meldung den Weg, der immer geht — statt „Failed to fetch“.
const FEHLER_MIT_AUSWEG =
  `Dein Widerruf konnte nicht übermittelt werden. Bitte schick ihn per E-Mail an ${KONTAKT_EMPFAENGER}.`;

const inputCls = 'w-full border px-4 py-2.5 text-sm font-sans bg-transparent';
const inputStyle = { borderColor: 'rgba(200,136,42,0.25)' } as const;

export default function WiderrufForm() {
  const [email, setEmail]       = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [name, setName]         = useState('');
  const [product, setProduct]   = useState('');
  const [reason, setReason]     = useState('');

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState<{ datum: string; zeit: string; lage: BestaetigungsLage } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const canSubmit = (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || orderRef.trim().length > 0) && !loading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/widerruf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), orderRef: orderRef.trim(), name: name.trim(), product: product.trim(), reason: reason.trim(), website: honeypotWert(formRef.current) }),
      });
      // Auch eine Antwort ohne JSON (Zeitüberschreitung der Plattform) muss als
      // Fehler ankommen — mit dem Weg per E-Mail, nicht mit einer Parser-Meldung.
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) { setError(data?.error ?? FEHLER_MIT_AUSWEG); return; }
      const d = new Date(data.receivedAt);
      setDone({
        datum: d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }),
        zeit:  d.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }),
        // Was zur Eingangsbestätigung stimmt, hängt davon ab, ob eine Mail rausging
        // und ob es überhaupt eine Adresse gab — siehe widerruf-rueckmeldung.ts.
        lage: bestaetigungsLage({ emailSent: !!data.emailSent, email }),
      });
    } catch {
      setError(FEHLER_MIT_AUSWEG);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="border p-6" style={{ borderColor: 'rgba(80,160,90,0.4)', background: 'rgba(80,160,90,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <h2 className="font-serif text-lg font-bold text-text-primary">Widerruf eingegangen</h2>
        </div>
        <p className="font-body text-sm text-text-secondary leading-relaxed">
          Dein Widerruf ist bei uns eingegangen am <strong>{done.datum} um {done.zeit} Uhr</strong>.
        </p>
        <p className="font-body text-sm text-text-secondary leading-relaxed mt-2">
          {BESTAETIGUNGS_TEXT[done.lage]}
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-5">
      <HoneypotFeld />
      <div>
        <label htmlFor="widerruf-email" className="font-serif text-sm font-bold text-text-primary block mb-2">E-Mail-Adresse</label>
        <input id="widerruf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="deine@email.de"
          className={inputCls} style={inputStyle} autoComplete="email" />
      </div>
      <div>
        <label htmlFor="widerruf-bestellnummer" className="font-serif text-sm font-bold text-text-primary block mb-2">
          Bestell-/Vertragsnummer <span className="font-sans font-normal text-text-muted">(alternativ zur E-Mail)</span>
        </label>
        <input id="widerruf-bestellnummer" type="text" value={orderRef} onChange={(e) => setOrderRef(e.target.value)} maxLength={120}
          placeholder="z. B. ABCD1234" className={inputCls} style={inputStyle} />
      </div>
      <p className="text-xs font-sans text-text-muted -mt-2">Mindestens eines der beiden Felder ist erforderlich.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="widerruf-name" className="font-serif text-sm font-bold text-text-primary block mb-2">Name <span className="font-sans font-normal text-text-muted">(optional)</span></label>
          <input id="widerruf-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={inputCls} style={inputStyle} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="widerruf-produkt" className="font-serif text-sm font-bold text-text-primary block mb-2">Produkt/Vertrag <span className="font-sans font-normal text-text-muted">(optional)</span></label>
          <input id="widerruf-produkt" type="text" value={product} onChange={(e) => setProduct(e.target.value)} maxLength={160} placeholder="z. B. Steuer-Matrix LIVE" className={inputCls} style={inputStyle} />
        </div>
      </div>

      <div>
        <label htmlFor="widerruf-anmerkung" className="font-serif text-sm font-bold text-text-primary block mb-2">Anmerkung <span className="font-sans font-normal text-text-muted">(optional)</span></label>
        <textarea id="widerruf-anmerkung" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} rows={3} className={inputCls} style={inputStyle} />
      </div>

      {error && (
        <div className="border px-4 py-3 text-sm font-sans" style={{ borderColor: 'rgba(180,60,0,0.4)', background: 'rgba(180,60,0,0.06)', color: '#B43C00' }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={!canSubmit}
        className="inline-flex items-center gap-2 px-7 py-3.5 font-sans font-bold text-base transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#C8882A', color: '#0D0A06' }}>
        {loading ? (<><Loader2 size={16} className="animate-spin motion-reduce:animate-none" /> Wird verarbeitet …</>) : 'Widerruf bestätigen'}
      </button>
    </form>
  );
}
