'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import {
  GRILL_TYPES, EXPERIENCE, TIME_SLOTS, GOALS, type Answers,
} from '@/lib/mein-protokoll/schema';

type Props = {
  /** 'neu' verbraucht ein Protokoll, 'korrektur' die eine kostenlose Korrektur. */
  modus: 'neu' | 'korrektur';
  korrekturVon?: string;
  /** Vorbelegung (Korrektur: die Antworten des bisherigen Plans). */
  start?: Answers;
  /** Wortlaut der Bestätigung — kommt vom Server und wird mit dem Plan gespeichert. */
  bestaetigung: string;
};

type Step =
  | { key: 'grillType';      label: string; options: readonly string[] }
  | { key: 'experience';     label: string; options: readonly string[] }
  | { key: 'timePerSession'; label: string; options: readonly string[] }
  | { key: 'mainGoal';       label: string; options: readonly string[] };

const STEPS: Step[] = [
  { key: 'grillType',      label: 'Dein Grilltyp',         options: GRILL_TYPES },
  { key: 'experience',     label: 'Dein Erfahrungsstand',  options: EXPERIENCE },
  { key: 'timePerSession', label: 'Zeit pro Session',      options: TIME_SLOTS },
  { key: 'mainGoal',       label: 'Dein Hauptziel',        options: GOALS },
];

export default function FragebogenForm({ modus, korrekturVon, start, bestaetigung }: Props) {
  const router = useRouter();

  const [grillType,      setGrillType]      = useState<string>(start?.grillType ?? '');
  const [grillOther,     setGrillOther]     = useState<string>(start?.grillOther ?? '');
  const [experience,     setExperience]     = useState<string>(start?.experience ?? '');
  const [timePerSession, setTimePerSession] = useState<string>(start?.timePerSession ?? '');
  const [mainGoal,       setMainGoal]       = useState<string>(start?.mainGoal ?? '');
  const [frustration,    setFrustration]    = useState<string>(start?.frustration ?? '');
  const [hinweis,        setHinweis]        = useState<string>('');
  const [bestaetigt,     setBestaetigt]     = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const values: Record<string, string> = {
    grillType, experience, timePerSession, mainGoal,
  };
  const setters: Record<string, (v: string) => void> = {
    grillType: setGrillType,
    experience: setExperience,
    timePerSession: setTimePerSession,
    mainGoal: setMainGoal,
  };

  const allSelected = grillType && experience && timePerSession && mainGoal;
  const grillOk     = grillType !== 'Anderes' || grillOther.trim().length > 1;
  const hinweisOk   = modus !== 'korrektur' || hinweis.trim().length >= 3;
  const canSubmit   = allSelected && grillOk && hinweisOk && bestaetigt && frustration.trim().length >= 3 && !loading;

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mein-protokoll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grillType,
          grillOther: grillType === 'Anderes' ? grillOther.trim() : undefined,
          experience,
          timePerSession,
          mainGoal,
          frustration: frustration.trim(),
          modus,
          korrekturVon: modus === 'korrektur' ? korrekturVon : undefined,
          hinweis: modus === 'korrektur' ? hinweis.trim() : undefined,
          bestaetigt: true,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'Plan-Generierung fehlgeschlagen.');
      }
      router.push('/mein-protokoll/plan');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Etwas ist schiefgelaufen. Bitte erneut versuchen.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {STEPS.map(({ key, label, options }) => (
        <div key={key}>
          <p className="font-serif text-sm font-bold text-text-primary mb-3">{label}</p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const active = values[key] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setters[key](opt)}
                  className="text-sm font-sans px-4 py-2 border transition-colors"
                  style={
                    active
                      ? { background: '#C8882A', color: '#0D0A06', borderColor: '#C8882A' }
                      : { borderColor: 'rgba(200,136,42,0.25)', color: 'var(--text-secondary, #555)' }
                  }
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {key === 'grillType' && grillType === 'Anderes' && (
            <input
              type="text"
              value={grillOther}
              onChange={(e) => setGrillOther(e.target.value)}
              maxLength={120}
              placeholder="Beschreibe deinen Grilltyp (z. B. Feuergrill, Wok-Station)"
              className="mt-3 w-full border px-4 py-2.5 text-sm font-sans bg-transparent"
              style={{ borderColor: 'rgba(200,136,42,0.25)' }}
            />
          )}
        </div>
      ))}

      <div>
        <p className="font-serif text-sm font-bold text-text-primary mb-3">
          Was nervt dich beim Grillen am meisten?
        </p>
        <textarea
          value={frustration}
          onChange={(e) => setFrustration(e.target.value)}
          maxLength={600}
          rows={4}
          placeholder="Je konkreter, desto präziser adressiert dein Plan genau dieses Problem."
          className="w-full border px-4 py-3 text-sm font-sans bg-transparent leading-relaxed"
          style={{ borderColor: 'rgba(200,136,42,0.25)' }}
        />
        <p className="text-xs font-sans text-text-muted mt-1">{frustration.length}/600</p>
      </div>

      {modus === 'korrektur' && (
        <div>
          <p className="font-serif text-sm font-bold text-text-primary mb-3">
            Was passt am bisherigen Plan nicht?
          </p>
          <textarea
            value={hinweis}
            onChange={(e) => setHinweis(e.target.value)}
            maxLength={600}
            rows={4}
            placeholder="Zum Beispiel: Die Sessions sind zu lang für meine Zeit. Oder: zu viel Rind, ich will mehr Geflügel."
            className="w-full border px-4 py-3 text-sm font-sans bg-transparent leading-relaxed"
            style={{ borderColor: 'rgba(200,136,42,0.25)' }}
          />
          <p className="text-xs font-sans text-text-muted mt-1">{hinweis.length}/600</p>
        </div>
      )}

      <div className="border px-4 py-4" style={{ borderColor: 'rgba(200,136,42,0.25)', background: 'rgba(200,136,42,0.04)' }}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={bestaetigt}
            onChange={(e) => setBestaetigt(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[#C8882A]"
          />
          <span className="text-sm font-sans text-text-secondary leading-relaxed">{bestaetigung}</span>
        </label>
        <p className="text-xs font-sans text-text-muted leading-relaxed mt-3 pl-7">
          Deine Antworten werden zur Erstellung an unseren KI-Dienstleister Anthropic (USA) übermittelt und
          zusammen mit dem Plan in deinem Konto gespeichert —{' '}
          <a href="/datenschutz" className="text-brand-gold underline hover:text-brand-fire">Datenschutzerklärung</a>.
          Trag keine sensiblen persönlichen Daten in die Freitextfelder ein.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="border px-4 py-3 text-sm font-sans"
          style={{ borderColor: 'rgba(180,60,0,0.4)', background: 'rgba(180,60,0,0.06)', color: '#B43C00' }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="inline-flex items-center gap-2 px-7 py-3.5 font-sans font-bold text-base transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#C8882A', color: '#0D0A06' }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
            Plan wird erstellt … (ein bis zwei Minuten)
          </>
        ) : (
          <>
            {modus === 'korrektur' ? 'Plan neu erstellen' : 'Meinen Plan erstellen'} <ArrowRight size={16} />
          </>
        )}
      </button>

      {loading && (
        <p className="text-xs font-sans text-text-muted">
          Das System baut deinen 8-Wochen-Plan und prüft jede Kerntemperatur gegen die Referenz. Schließe dieses Fenster nicht.
        </p>
      )}
    </div>
  );
}
