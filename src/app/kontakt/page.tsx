'use client';

import { useEffect, useState } from 'react';
import Turnstile, { TURNSTILE_SITE_KEY, turnstileReset } from '@/components/ui/Turnstile';
import Link from 'next/link';
import { ChevronRight, Mail, MessageSquare, Award } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CONSENT_TEXT, KONTAKT_EMPFAENGER, kontaktMailto } from '@/lib/kontakt';

type FormState = 'idle' | 'sending' | 'sent' | 'error';

// Ein Postfach, drei Anliegen (03.10.2026): Vorher stand je Kachel eine eigene
// Adresse, für die es keinen Zustellnachweis gibt (siehe /api/kontakt). Jetzt
// geht alles an KONTAKT_EMPFAENGER; das Anliegen steht im Betreff-Präfix, nach
// dem das Postfach sortiert — dasselbe Präfix wie beim Formular darunter.
const CONTACT_OPTIONS = [
  {
    icon: MessageSquare,
    title: 'Frage zum Diplom-System',
    desc: 'Hilfe bei Levels, Freischaltung oder Urkunden.',
    href: kontaktMailto('diplom', 'Frage zum Diplom-System'),
  },
  {
    icon: Mail,
    title: 'Allgemeiner Kontakt',
    desc: 'Feedback, Ideen, Kooperationen, Presse.',
    href: kontaktMailto(),
  },
  {
    icon: Award,
    title: 'Rezept-Idee einreichen',
    desc: 'Du hast ein BBQ-Rezept das die Welt kennen muss?',
    href: kontaktMailto('rezept'),
  },
];

export default function KontaktPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', consent: false, website: '' });
  const [turnstileToken, setTurnstileToken] = useState('');
  const wartetAufCaptcha = Boolean(TURNSTILE_SITE_KEY) && !turnstileToken;
  // Vorbelegung aus der URL (z. B. /kontakt?betreff=hofladen&hof=<slug> aus dem
  // Hofladen-Radar): Betreff und ein Nachrichten-Anfang, damit der Hof-Bezug
  // nicht verloren geht. Nach dem Mount, damit Server- und Client-HTML gleich
  // bleiben (Hydration). Nur bekannte Betreff-Werte werden uebernommen.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const b = p.get('betreff') ?? '';
    if (!['diplom', 'rezept', 'kooperation', 'feedback', 'presse', 'sonstiges', 'hofladen'].includes(b)) return;
    const hof = (p.get('hof') ?? '').replace(/[^a-z0-9-]/g, '').slice(0, 80);
    const message = b === 'hofladen' && hof ? `Hof: steakakademie.de/hoefe/${hof}\n\n` : '';
    setForm((f) => ({ ...f, subject: b, message: f.message || message }));
  }, []);
  // Der Zustand startet aus der URL: Ohne JavaScript landet der Nutzer nach dem
  // nativen POST auf /kontakt?gesendet=1 bzw. ?fehler=… zurueck.
  const [state, setState] = useState<FormState>(() => {
    if (typeof window === 'undefined') return 'idle';
    const p = new URLSearchParams(window.location.search);
    if (p.get('gesendet') === '1') return 'sent';
    return p.get('fehler') ? 'error' : 'idle';
  });
  const [fehler, setFehler] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('fehler') ?? '';
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const t = e.target as HTMLInputElement;
    setForm(f => ({ ...f, [t.name]: t.type === 'checkbox' ? t.checked : t.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message || !form.consent) return;
    setState('sending');
    setFehler('');
    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      const daten = await res.json().catch(() => ({}));
      // Erfolg wird gemeldet, wenn die Route ihn bestaetigt — nicht vorher.
      if (res.ok && daten.ok) { setState('sent'); return; }
      setFehler(daten.error || 'Die Nachricht konnte nicht zugestellt werden.');
      setState('error');
      turnstileReset(); // Token ist einmal gueltig — fuer den naechsten Versuch ein neues
    } catch {
      setFehler('Keine Verbindung zum Server. Bitte später erneut versuchen.');
      setState('error');
    }
  }

  const inputClass = 'w-full bg-surface-dark border border-brand-gold/20 px-4 py-3 text-text-primary text-sm font-body focus:border-brand-gold/50 transition-colors placeholder:text-text-muted';
  const labelClass = 'block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-1.5';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">

        {/* Header */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Kontakt</span>
            </nav>
            <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
              Steakakademie · Kontakt
            </span>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-4">
              Schreib uns.
            </h1>
            <p className="font-body text-lg text-text-light/60 max-w-xl leading-relaxed">
              Fragen, Ideen, Feedback — wir antworten persönlich.
              Kein Bot, kein Callcenter.
            </p>
          </div>
        </section>

        {/* Direct email options */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {CONTACT_OPTIONS.map(opt => (
              <a
                key={opt.title}
                href={opt.href}
                className="group block border border-brand-gold/15 bg-surface-elevated p-6 hover:border-brand-gold/40 transition-colors"
              >
                <opt.icon size={20} className="text-brand-gold mb-3" />
                <h3 className="font-serif font-bold text-text-primary mb-1 group-hover:text-brand-gold transition-colors">
                  {opt.title}
                </h3>
                <p className="text-xs font-body text-text-muted mb-3 leading-relaxed">{opt.desc}</p>
                <span className="text-xs font-sans text-brand-gold/70">{KONTAKT_EMPFAENGER}</span>
              </a>
            ))}
          </div>

          {/* Contact form */}
          <div className="max-w-xl mx-auto">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 text-center">
              Oder Formular nutzen
            </h2>

            {state === 'sent' ? (
              <div className="text-center py-16 border border-brand-gold/20 bg-surface-elevated">
                <div className="text-6xl mb-4">🔥</div>
                <h3 className="font-serif text-2xl font-bold text-text-primary mb-2">Nachricht gesendet!</h3>
                <p className="text-text-muted font-body text-sm">
                  Wir melden uns innerhalb von 24–48 Stunden bei dir.
                </p>
              </div>
            ) : (
              /* method und action sind kein Beiwerk: Schlägt die Hydration fehl
                 oder klickt jemand vorher, führt der Browser sonst seinen
                 Standard aus — GET auf dieselbe URL, mit Name, E-Mail und
                 Nachricht in Adresszeile, Server-Log, Referrer und History. */
              <form
                onSubmit={handleSubmit}
                method="post"
                action="/api/kontakt"
                className="border border-brand-gold/15 bg-surface-elevated p-8 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required
                      placeholder="Max Mustermann" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>E-Mail</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required
                      placeholder="max@example.de" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Betreff</label>
                  <select name="subject" value={form.subject} onChange={handleChange} className={inputClass}>
                    <option value="">Bitte wählen…</option>
                    <option value="diplom">Frage zum Diplom-System</option>
                    <option value="rezept">Rezept-Idee einreichen</option>
                    <option value="kooperation">Kooperationsanfrage</option>
                    <option value="feedback">Feedback zur Website</option>
                    <option value="hofladen">Hofladen-Radar: Hof melden / bestätigen</option>
                    <option value="presse">Presse / Media</option>
                    <option value="sonstiges">Sonstiges</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Nachricht</label>
                  <textarea name="message" value={form.message} onChange={handleChange} required
                    rows={5} placeholder="Deine Nachricht…"
                    className={`${inputClass} resize-none`} />
                </div>

                {/* Honeypot — für Menschen unsichtbar, für Bots verlockend.
                    Kein `type="hidden"`: Das füllen Bots seltener aus. */}
                <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
                  <label htmlFor="website">Website (bitte frei lassen)</label>
                  <input id="website" name="website" type="text" tabIndex={-1}
                    autoComplete="off" value={form.website} onChange={handleChange} />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    name="consent" type="checkbox" required
                    checked={form.consent} onChange={handleChange}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-gold"
                  />
                  <span className="text-text-secondary text-xs font-body leading-relaxed">
                    {CONSENT_TEXT}{' '}
                    Weitere Infos in der{' '}
                    <Link href="/datenschutz" className="text-brand-gold hover:underline">Datenschutzerklärung</Link>.
                  </span>
                </label>

                {state === 'error' && (
                  <p role="alert" className="border border-brand-fire/40 bg-brand-fire/10 px-4 py-3 text-sm font-body text-text-primary">
                    {fehler || 'Die Nachricht konnte nicht zugestellt werden.'}{' '}
                    Du erreichst uns auch direkt unter{' '}
                    <a href={`mailto:${KONTAKT_EMPFAENGER}`} className="text-brand-gold hover:underline">
                      {KONTAKT_EMPFAENGER}
                    </a>.
                  </p>
                )}

                {/* Turnstile (unsichtbar, zeigt sich nur bei Bedarf). Rendert nur mit
                    NEXT_PUBLIC_TURNSTILE_SITE_KEY; ohne JavaScript legt das Widget
                    selbst ein verstecktes Feld cf-turnstile-response ins Formular. */}
                <Turnstile action="kontakt" onToken={setTurnstileToken} />

                <button
                  type="submit"
                  disabled={state === 'sending' || wartetAufCaptcha || !form.consent}
                  className="w-full py-4 border border-brand-gold/50 bg-brand-gold/10 text-brand-gold font-sans font-bold tracking-[0.1em] uppercase text-sm hover:bg-brand-gold/20 transition-[background-color,opacity] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {state === 'sending' ? 'Wird gesendet…' : wartetAufCaptcha ? 'Sicherheitsprüfung…' : 'Nachricht senden →'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Marco Widget hint */}
        <section className="border-t border-border-subtle py-12 px-4 text-center bg-surface-dark">
          <p className="text-text-light/40 text-sm font-sans mb-3">
            Sofortantwort gewünscht?
          </p>
          <p className="font-body text-text-light/60 text-sm max-w-md mx-auto">
            Marco — unser KI-Guide — beantwortet angemeldeten Mitgliedern Fragen zu Cuts,
            Kerntemperaturen und Techniken. Die Anmeldung ist kostenlos. Unten rechts auf der Seite.
          </p>
        </section>

      </main>
      <Footer />
    </>
  );
}
