'use client';

import { useId, useState } from 'react';
import { NEWSLETTER_CONSENT_TEXT } from '@/lib/newsletter-consent';
import { anmeldungKoerper } from '@/lib/newsletter-anmeldung';
import { trackEvent } from '@/components/analytics/PlausibleScript';
import Turnstile, { TURNSTILE_SITE_KEY, turnstileReset } from '@/components/ui/Turnstile';

/**
 * Spickzettel-Anmeldung im Fußbereich — „genau einmal auf der ganzen Website".
 *
 * Spricht dieselbe API wie das bestehende NewsletterSignup (/api/newsletter,
 * Double-Opt-in über Loops) und trägt dieselben drei Pflichten mit:
 *  - Einwilligungs-Checkbox mit dem versionierten Wortlaut aus
 *    @/lib/newsletter-consent (Rechts-Audit 28.08.2026, § 7 Abs. 2 Nr. 2 UWG).
 *    Der Prototyp zeigt nur E-Mail-Feld und Knopf — Recht schlägt Entwurf
 *    (Prioritäts-Logik: Recht → Fakten → Marke).
 *  - Honeypot-Feld „website".
 *  - consentVersion im Request.
 *  - Turnstile-Token (seit 03.10.2026): /api/newsletter verlangt eines, sobald
 *    TURNSTILE_SECRET_KEY gesetzt ist. Ohne Token endete jede Anmeldung über
 *    dieses Formular mit 403. Der Body kommt aus anmeldungKoerper() — dort
 *    steht der Vertrag mit der Route, samt Test.
 *
 * source „footer-relaunch": landet in Loops in der Standardgruppe, ist aber
 * getrennt auszählbar — so lässt sich messen, was der Relaunch-Fuß bringt.
 */
type Status = 'idle' | 'loading' | 'success' | 'error' | 'ratelimit';

export default function SpickzettelForm() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const emailId = useId();
  const consentId = useId();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  // Mit Site-Key wartet der Knopf auf das Token; ohne Site-Key gibt es kein
  // Widget und der Server prüft nicht (src/lib/api/turnstile.ts).
  const wartetAufCaptcha = Boolean(TURNSTILE_SITE_KEY) && !turnstileToken;
  const canSubmit = emailValid && consent && status !== 'loading' && !wartetAufCaptcha;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anmeldungKoerper({ email, source: 'footer-relaunch', website, turnstileToken })),
      });
      if (res.ok) {
        trackEvent('Newsletter-Anmeldung', { source: 'footer-relaunch' });
        setStatus('success');
        return;
      }
      setStatus(res.status === 429 ? 'ratelimit' : 'error');
    } catch {
      setStatus('error');
    }
    // Ein Token gilt genau einmal — für den nächsten Versuch ein neues holen.
    setTurnstileToken('');
    turnstileReset();
  }

  if (status === 'success') {
    return (
      <p className="sk-text sk-text--16" role="status" style={{ color: '#d9cfc2' }}>
        Fast geschafft: Bitte bestätige den Link in der E-Mail, die gerade unterwegs ist. Danach schicken wir dir den Link zum Spickzettel zum Ausdrucken.
      </p>
    );
  }

  return (
    <form className="sk-footer__form" onSubmit={submit} noValidate>
      {/* Honeypot — für Menschen unsichtbar, Bots füllen es aus */}
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <label htmlFor={`${emailId}-website`}>Website (bitte leer lassen)</label>
        <input
          id={`${emailId}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <label htmlFor={emailId} className="sk-sr">E-Mail-Adresse</label>
      <input
        id={emailId}
        className="sk-input"
        type="email"
        name="email"
        placeholder="E-Mail-Adresse"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === 'error') setStatus('idle');
        }}
        aria-invalid={status === 'error' && !emailValid}
      />
      <button type="submit" className="sk-btn sk-btn--primary" disabled={!canSubmit}>
        {status === 'loading' ? 'Wird gesendet …' : 'Spickzettel sichern'}
      </button>
      <label htmlFor={consentId} style={{ width: '100%', display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5, color: '#b3a798', marginTop: 6 }}>
        <input
          id={consentId}
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (status === 'error') setStatus('idle');
          }}
          style={{ marginTop: 3, flex: 'none' }}
        />
        <span>{NEWSLETTER_CONSENT_TEXT}</span>
      </label>
      {/* Turnstile — unsichtbar, bis Cloudflare eine Interaktion braucht; rendert nur mit Site-Key */}
      <Turnstile action="newsletter" onToken={setTurnstileToken} />
      <p className="sk-footer__note">
        Double-Opt-in. Kein Verkauf deiner Daten. Details in der{' '}
        <a href="/datenschutz" style={{ color: 'inherit', textDecoration: 'underline' }}>Datenschutzerklärung</a>.
      </p>
      {status === 'error' && (
        <p className="sk-footer__note" role="alert" style={{ color: '#ffb35c' }}>
          Das hat nicht geklappt. Bitte E-Mail-Adresse prüfen und noch einmal versuchen.
        </p>
      )}
      {status === 'ratelimit' && (
        <p className="sk-footer__note" role="alert" style={{ color: '#ffb35c' }}>
          Zu viele Versuche. Bitte in ein paar Minuten noch einmal.
        </p>
      )}
    </form>
  );
}
