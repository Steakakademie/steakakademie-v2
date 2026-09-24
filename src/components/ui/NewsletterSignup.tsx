'use client';

import { useId, useState } from 'react';
import { m as motion } from 'framer-motion';
import { Flame, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/components/analytics/PlausibleScript';
import { NEWSLETTER_CONSENT_TEXT, NEWSLETTER_CONSENT_VERSION } from '@/lib/newsletter-consent';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface NewsletterSignupProps {
  /** Segmentierungs-Quelle für Loops (z.B. "homepage-banner", "footer"). */
  source?: string;
  /** Überschrift des Formulars. */
  headline?: string;
  /** Kurzer Nutzenversprechen-Text unter der Überschrift. */
  subline?: string;
  /** Button-Beschriftung im Ruhezustand. */
  cta?: string;
  /** Eyebrow-Zeile über der Überschrift. */
  eyebrow?: string;
  /**
   * Überschreibt beide Marken-Akzente (Gold + Feuer) mit einer Sub-Brand-Farbe,
   * z.B. Grillstil-Rosé. Ohne Angabe gilt die Marken-DNA gold/fire.
   */
  accentColor?: string;
  /** Textfarbe auf dem Akzent-Button (Kontrast zu `accentColor`). Default: Ink. */
  accentTextColor?: string;
  /** Zusätzliche Klassen für den äußeren Container. */
  className?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Marken-DNA (CLAUDE.md §2.3) — Default-Akzente.
const BRAND_GOLD = '#C8882A';
const BRAND_FIRE = '#E85018';
const BRAND_INK = '#120C07';

/** "#C8882A" → "200 136 42", damit die Farbe in `rgb(… / <alpha>)` alpha-fähig wird. */
function hexToRgbTriple(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = Number.parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/**
 * Conversion-optimiertes Newsletter-Anmeldeformular (Double-Opt-In via Loops).
 *
 * Features:
 *  - Client-seitige E-Mail-Validierung (sofortiges Feedback, keine Server-Roundtrips)
 *  - Verpflichtende DSGVO-Einwilligung (Checkbox, ohne Häkchen kein Absenden)
 *  - Ladezustand mit Spinner, Erfolgs- und Fehlermeldung (inkl. Rate-Limit 429)
 *  - Honeypot-Feld gegen Bots (für Menschen unsichtbar)
 *  - Plausible-Event bei erfolgreicher Anmeldung
 *
 * Trust-Signale (Conversion): kostenlos, jederzeit abmeldbar, kein Verkauf der Daten.
 *
 * Der Einwilligungstext liegt versioniert in @/lib/newsletter-consent und wird von dort
 * gerendert UND als `consentVersion` an die API übergeben — beides muss dieselbe
 * Quelle haben, sonst ist der Nachweis nach Art. 7 Abs. 1 DSGVO wertlos.
 */
export default function NewsletterSignup({
  source = 'default',
  // Einheitliches Versprechen (Audit 15.08.2026): Geschenk zuerst, Frequenz konsistent
  // „jeden Freitag". Diese Defaults sind die Single Source der Anmelde-Copy — Aufrufer
  // überschreiben sie nur noch, wenn der Kontext es wirklich verlangt.
  headline = 'Der Kerntemperatur-Spickzettel — alle Garstufen auf einer Seite.',
  subline = 'Druckfertig für die Grillstation. Dazu jeden Freitag ein Stück BBQ-Wissen, das bleibt — präzise, ehrlich, jederzeit abbestellbar.',
  cta = 'Spickzettel sichern',
  eyebrow = 'Kostenloses Geschenk',
  accentColor,
  accentTextColor,
  className,
}: NewsletterSignupProps) {
  // Eine Sub-Brand-Farbe ersetzt beide Akzente; sonst bleibt es bei gold/fire.
  const accentVars = {
    '--nl-gold': hexToRgbTriple(accentColor ?? BRAND_GOLD),
    '--nl-fire': hexToRgbTriple(accentColor ?? BRAND_FIRE),
    '--nl-on-accent': accentTextColor ?? BRAND_INK,
  } as React.CSSProperties;

  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // Honeypot
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const emailId = useId();
  const consentId = useId();

  const emailValid = EMAIL_RE.test(email.trim());
  const canSubmit = emailValid && consent && status !== 'loading';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!emailValid) {
      setStatus('error');
      setErrorMsg('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    if (!consent) {
      setStatus('error');
      setErrorMsg('Bitte bestätige die Einwilligung, um dich anzumelden.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // consentVersion wandert mit: Sie ist der Schlüssel, mit dem sich später
        // belegen lässt, WORIN eingewilligt wurde (Art. 7 Abs. 1 DSGVO).
        body: JSON.stringify({ email: email.trim(), source, website, consentVersion: NEWSLETTER_CONSENT_VERSION }),
      });

      if (res.ok) {
        trackEvent('Newsletter-Anmeldung', { source });
        setStatus('success');
        return;
      }

      // A2-Fix: Server-Fehlermeldung anzeigen, wenn vorhanden (ehrlicher Fehler
      // statt Schein-Erfolg — die API meldet jetzt 502/503, wenn keine
      // Bestätigungs-Mail rausging).
      const serverError = await res
        .json()
        .then((d: { error?: string }) => d?.error)
        .catch(() => undefined);
      if (res.status === 429) {
        setErrorMsg('Zu viele Anmeldeversuche. Bitte in ein paar Minuten erneut probieren.');
      } else {
        setErrorMsg(serverError ?? 'Etwas ist schiefgelaufen. Bitte versuche es gleich noch einmal.');
      }
      setStatus('error');
    } catch {
      setErrorMsg('Netzwerkfehler. Bitte prüfe deine Verbindung und versuche es erneut.');
      setStatus('error');
    }
  }

  // ── Erfolgszustand ────────────────────────────────────────────────────────
  // Das Formular wird durch die Karte ersetzt; ohne Uebergang wirkt der Tausch
  // wie ein Sprung. Nur opacity/transform (Compositor), Kurve wie im Header.
  // Bei prefers-reduced-motion nimmt MotionConfig (MotionProvider) die scale-
  // Anteile heraus — es bleibt die Ueberblendung.
  // Abnahme Uwe 24.09.2026: „deutlicher" — 300 ms statt 250, Haekchen-Feder
  // bounce 0.3 statt 0.2. Der Moment soll nach Bestaetigung aussehen.
  if (status === 'success') {
    return (
      <motion.div
        className={cn(
          'border border-[rgb(var(--nl-gold)/0.25)] bg-surface-elevated p-6 text-center not-prose',
          className,
        )}
        style={accentVars}
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      >
        <motion.div
          className="w-11 h-11 bg-[rgb(var(--nl-gold)/0.15)] flex items-center justify-center mx-auto mb-3"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3, delay: 0.08 }}
        >
          <Check size={20} className="text-[rgb(var(--nl-gold))]" />
        </motion.div>
        <p className="font-serif font-bold text-text-primary text-lg mb-1.5">
          Fast geschafft — bitte E-Mail bestätigen.
        </p>
        <p className="text-sm font-body text-text-secondary leading-relaxed">
          Wir haben dir eine Bestätigungs-Mail geschickt (Double-Opt-in). Klicke den Link
          darin, dann bist du dabei. Kein Link im Postfach? Schau kurz im Spam-Ordner nach.
        </p>
      </motion.div>
    );
  }

  // ── Formular ────────────────────────────────────────────────────────────────
  return (
    <section
      className={cn(
        'border border-[rgb(var(--nl-gold)/0.15)] bg-surface-elevated p-6 sm:p-7 not-prose',
        className,
      )}
      style={accentVars}
      aria-label="Newsletter-Anmeldung"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-[rgb(var(--nl-fire)/0.1)] border border-[rgb(var(--nl-fire)/0.25)] flex items-center justify-center shrink-0">
          <Flame size={16} className="text-[rgb(var(--nl-fire))]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-[rgb(var(--nl-fire))] mb-1.5">
            {eyebrow}
          </p>
          <h2 className="font-serif font-bold text-text-primary text-lg leading-snug mb-1.5">
            {headline}
          </h2>
          <p className="text-sm font-body text-text-secondary leading-relaxed mb-4">
            {subline}
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            {/* Honeypot — für Menschen unsichtbar, von Bots gerne befüllt */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor={`${emailId}-website`}>Website (bitte leer lassen)</label>
              <input
                id={`${emailId}-website`}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {/* Lesbarkeits-/Layout-Fix (Design-Audit 16.08.2026): flex-wrap statt
                Viewport-Breakpoint. Der sm:-Breakpoint schaltete ab 640px
                VIEWPORT auf nebeneinander — in der 300px-Artikel-Sidebar wurde
                das E-Mail-Feld dadurch auf ~0px zerquetscht (Anmeldung dort
                unmöglich). Mit wrap + Mindestbreite bricht der Button um,
                sobald der CONTAINER zu schmal ist. */}
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor={emailId} className="sr-only">
                  E-Mail-Adresse
                </label>
                <input
                  id={emailId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  placeholder="deine@email.de"
                  required
                  aria-invalid={status === 'error' && !emailValid}
                  className="w-full min-w-0 bg-surface-dark border border-[rgb(var(--nl-gold)/0.2)] px-3.5 py-2.5 text-sm font-body text-text-primary placeholder:text-text-muted focus:border-[rgb(var(--nl-gold)/0.5)] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!canSubmit}
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-[rgb(var(--nl-gold))] text-[var(--nl-on-accent)] font-sans text-xs font-bold tracking-[0.1em] uppercase px-5 py-2.5 hover:bg-[color-mix(in_srgb,rgb(var(--nl-gold))_85%,black)] transition-colors disabled:bg-transparent disabled:border disabled:border-[rgb(var(--nl-gold)/0.45)] disabled:text-[rgb(var(--nl-gold)/0.9)] disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={14} className="animate-spin motion-reduce:animate-none" />
                    Sendet…
                  </>
                ) : (
                  cta
                )}
              </button>
            </div>

            {/* DSGVO-Einwilligung */}
            <div className="flex items-start gap-2.5 pt-0.5">
              <input
                id={consentId}
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (status === 'error') setStatus('idle');
                }}
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--nl-gold))] cursor-pointer"
              />
              {/* Rechts-Audit 28.08.2026 — Wortlaut aus @/lib/newsletter-consent (versioniert).
                  Der Text nennt jetzt ausdrücklich Werbung und den beworbenen
                  Produktbereich (§ 7 Abs. 2 Nr. 2 UWG; BGH „Payback"/„Happy
                  Digits"). Vorher war nur vom „Wissens-Brief" die Rede, versendet
                  werden aber Produktempfehlungen und Affiliate-Links.
                  NICHT ohne Grund ändern: siehe Versionierungsregel in
                  newsletter-consent.ts (alte Fassungen bleiben Beweismittel). */}
              <label
                htmlFor={consentId}
                className="text-xs font-body text-text-secondary leading-relaxed cursor-pointer"
              >
                {NEWSLETTER_CONSENT_TEXT}
              </label>
            </div>

            {/* Die Datenschutzerklärung ist bewusst KEIN Bestandteil der Checkbox:
                Sie ist Information nach Art. 13 DSGVO, kein Einwilligungsgegenstand.
                Deshalb steht sie hier als Hinweis daneben — außerhalb des <label>. */}
            <p className="text-xs font-body text-text-muted leading-relaxed">
              Versand über Loops (Astrodon Corporation, USA). Wie wir deine Daten
              verarbeiten, welche Garantien für die Übermittlung gelten und welche
              Rechte du hast, steht in der{' '}
              <a
                href="/datenschutz"
                className="text-[rgb(var(--nl-fire))] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Datenschutzerklärung
              </a>
              .
            </p>

            {/* Fehlermeldung */}
            {status === 'error' && errorMsg && (
              <p
                className="flex items-center gap-1.5 text-xs font-body text-[rgb(var(--nl-fire))]"
                role="alert"
              >
                <AlertCircle size={13} className="shrink-0" />
                {errorMsg}
              </p>
            )}
          </form>

          {/* Lesbarkeits-Fix: 10px/60%-Deckkraft war unter jeder Kontrastgrenze.
              Rechts-Audit 28.08.2026: „Keine Weitergabe deiner Daten" war
              unzutreffend — die Adresse geht an Astrodon Corporation (USA).
              Eine unzutreffende Datenschutz-Zusage ist nach § 5 UWG irreführend
              und widersprach zudem der eigenen Datenschutzerklärung. Die
              Präzisierung „an Dritte für deren eigene Werbezwecke" bleibt ein
              Verkaufsargument und ist zugleich richtig: Die Übermittlung an
              Loops ist Auftragsverarbeitung, keine Weitergabe zu Fremdzwecken. */}
          <p className="text-[11px] font-sans text-text-muted mt-3">
            Kostenlos · Double-Opt-in · Jederzeit abmeldbar · Kein Verkauf deiner Daten und
            keine Weitergabe an Dritte für deren eigene Werbezwecke
          </p>
        </div>
      </div>
    </section>
  );
}
