'use client';

/**
 * Formular „Gutschein persönlich machen" auf /gutschein/[code] — nur sichtbar mit dem
 * Schlüssel aus der Käufer-Mail (Uwe, 11.10.2026). Speichert über
 * /api/gutschein/personalisieren; Regeln in src/lib/gutschein-personalisierung.ts.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Gift, Loader2, CheckCircle2 } from 'lucide-react';
import { GRENZEN, MOTIVE, MOTIV_KEYS, type MotivKey, berlinDatumStunde } from '@/lib/gutschein-personalisierung';

export interface PersonalisierenProps {
  code: string;
  k: string;
  mailVerfuegbar: boolean;
  start: {
    empfaengerName: string;
    schenkerName: string;
    nachricht: string;
    motiv: MotivKey;
    versandStatus: string;
    empfaengerEmail: string;
    versandAmIso: string | null;
  };
}

const feld = 'w-full bg-surface-base border border-border-subtle px-3 py-2 text-sm font-body text-text-primary focus:outline-none focus:border-brand-gold';
const label = 'block text-xs font-sans font-semibold uppercase tracking-wider text-text-muted mb-1';

function morgenBerlin(): string {
  const morgen = new Date(Date.now() + 86_400_000);
  return morgen.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
}

export default function GutscheinPersonalisieren({ code, k, mailVerfuegbar, start }: PersonalisierenProps) {
  const router = useRouter();
  const geplant = start.versandStatus === 'geplant' && start.versandAmIso;
  const vorbelegt = geplant ? berlinDatumStunde(start.versandAmIso!) : { datum: morgenBerlin(), stunde: 8 };

  const [empfaengerName, setEmpfaengerName] = useState(start.empfaengerName);
  const [schenkerName, setSchenkerName] = useState(start.schenkerName);
  const [nachricht, setNachricht] = useState(start.nachricht);
  const [motiv, setMotiv] = useState<MotivKey>(start.motiv);
  const [versand, setVersand] = useState<'selbst' | 'mail'>(geplant ? 'mail' : 'selbst');
  const [empfaengerEmail, setEmpfaengerEmail] = useState(start.empfaengerEmail);
  const [zeitpunkt, setZeitpunkt] = useState<'sofort' | 'termin'>('termin');
  const [datum, setDatum] = useState(vorbelegt.datum);
  const [stunde, setStunde] = useState(vorbelegt.stunde);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);

  async function speichern(ev: React.FormEvent) {
    ev.preventDefault();
    setLaeuft(true);
    setFehler(null);
    setErfolg(null);
    try {
      const body: Record<string, unknown> = { code, k, empfaengerName, schenkerName, nachricht, motiv, versand };
      if (versand === 'mail') {
        body.empfaengerEmail = empfaengerEmail;
        body.zeitpunkt = zeitpunkt;
        if (zeitpunkt === 'termin') {
          body.datum = datum;
          body.stunde = stunde;
        }
      }
      const res = await fetch('/api/gutschein/personalisieren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFehler(data.error ?? 'Speichern hat nicht geklappt.');
        return;
      }
      if (data.versand === 'versendet') setErfolg('Verschickt — der Gutschein ist im Postfach der beschenkten Person.');
      else if (data.versand === 'geplant' && data.termin) setErfolg(`Gespeichert. Wir schicken den Gutschein am ${data.termin.replace(', ', ' ab ')}.`);
      else if (data.hinweis) setErfolg(data.hinweis);
      else setErfolg('Gespeichert.');
      router.refresh();
    } catch {
      setFehler('Keine Verbindung. Bitte versuch es gleich noch einmal.');
    } finally {
      setLaeuft(false);
    }
  }

  const stunden: number[] = [];
  for (let h = GRENZEN.ersteStunde; h <= GRENZEN.letzteStunde; h++) stunden.push(h);

  return (
    <form onSubmit={speichern} className="mt-10 text-left bg-surface-base border border-brand-gold/40 p-6 print:hidden">
      <h2 className="font-sans font-bold text-base text-text-primary mb-1">Gutschein persönlich machen</h2>
      <p className="font-body text-sm text-text-secondary mb-6">
        Nur für dich sichtbar — über den Link aus deiner Bestell-Mail. Ändern kannst du alles, bis der Gutschein
        verschickt oder eingelöst ist.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="gp-empfaenger" className={label}>Für</label>
          <input id="gp-empfaenger" className={feld} maxLength={GRENZEN.name} value={empfaengerName}
            onChange={(e) => setEmpfaengerName(e.target.value)} placeholder="z. B. Papa" />
        </div>
        <div>
          <label htmlFor="gp-schenker" className={label}>Von</label>
          <input id="gp-schenker" className={feld} maxLength={GRENZEN.name} value={schenkerName}
            onChange={(e) => setSchenkerName(e.target.value)} placeholder="z. B. Anna" />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="gp-nachricht" className={label}>Deine Nachricht</label>
        <textarea id="gp-nachricht" className={`${feld} min-h-[90px]`} maxLength={GRENZEN.nachricht} value={nachricht}
          onChange={(e) => setNachricht(e.target.value)} placeholder="Für das nächste perfekte Steak …" />
        <p className="text-[11px] font-sans text-text-muted mt-1">{nachricht.length}/{GRENZEN.nachricht}</p>
      </div>

      <fieldset className="mt-4">
        <legend className={label}>Motiv</legend>
        <div className="flex flex-wrap gap-2">
          {MOTIV_KEYS.map((m) => (
            <label key={m} className={`cursor-pointer border px-3 py-1.5 text-sm font-sans transition-colors ${motiv === m ? 'border-brand-gold text-brand-gold' : 'border-border-subtle text-text-secondary hover:border-brand-gold/60'}`}>
              <input type="radio" name="gp-motiv" value={m} checked={motiv === m} onChange={() => setMotiv(m)} className="sr-only" />
              {MOTIVE[m].label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className={label}>Wie kommt der Gutschein an?</legend>
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm font-body text-text-secondary cursor-pointer">
            <input type="radio" name="gp-versand" checked={versand === 'selbst'} onChange={() => setVersand('selbst')} className="mt-1" />
            <span><Gift size={14} className="inline mr-1 text-brand-gold" />Ich gebe ihn selbst weiter (ausdrucken oder Link schicken)</span>
          </label>
          {mailVerfuegbar && (
            <label className="flex items-start gap-2 text-sm font-body text-text-secondary cursor-pointer">
              <input type="radio" name="gp-versand" checked={versand === 'mail'} onChange={() => setVersand('mail')} className="mt-1" />
              <span><Mail size={14} className="inline mr-1 text-brand-gold" />Die Steakakademie schickt ihn per E-Mail an die beschenkte Person</span>
            </label>
          )}
        </div>
      </fieldset>

      {versand === 'mail' && mailVerfuegbar && (
        <div className="mt-4 space-y-4 border-l-2 border-brand-gold/40 pl-4">
          <div>
            <label htmlFor="gp-email" className={label}>E-Mail der beschenkten Person</label>
            <input id="gp-email" type="email" required className={feld} maxLength={GRENZEN.email} value={empfaengerEmail}
              onChange={(e) => setEmpfaengerEmail(e.target.value)} placeholder="name@example.de" />
            <p className="text-[11px] font-sans text-text-muted mt-1">
              Nur für diese eine Mail. Nach dem Versand löschen wir die Adresse.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-body text-text-secondary">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="gp-zeit" checked={zeitpunkt === 'sofort'} onChange={() => setZeitpunkt('sofort')} /> Sofort
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="gp-zeit" checked={zeitpunkt === 'termin'} onChange={() => setZeitpunkt('termin')} /> Zu einem Termin
            </label>
          </div>
          {zeitpunkt === 'termin' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="gp-datum" className={label}>Tag</label>
                <input id="gp-datum" type="date" className={feld} value={datum} min={morgenBerlin()} onChange={(e) => setDatum(e.target.value)} />
              </div>
              <div>
                <label htmlFor="gp-stunde" className={label}>Ab</label>
                <select id="gp-stunde" className={feld} value={stunde} onChange={(e) => setStunde(Number(e.target.value))}>
                  {stunden.map((h) => <option key={h} value={h}>{h}:00 Uhr</option>)}
                </select>
              </div>
              <p className="sm:col-span-2 text-[11px] font-sans text-text-muted">
                Deutsche Zeit. Der Gutschein geht ab der gewählten Stunde raus.
              </p>
            </div>
          )}
        </div>
      )}

      {fehler && <p role="alert" className="mt-4 text-sm font-sans text-brand-fire">{fehler}</p>}
      {erfolg && (
        <p role="status" className="mt-4 inline-flex items-center gap-2 text-sm font-sans text-green-500">
          <CheckCircle2 size={15} /> {erfolg}
        </p>
      )}

      <div className="mt-6">
        <button type="submit" disabled={laeuft} className="btn-affiliate inline-flex justify-center text-sm px-6 disabled:opacity-60">
          {laeuft ? <Loader2 size={15} className="animate-spin" /> : null}
          {versand === 'mail' && zeitpunkt === 'sofort' ? 'Speichern und jetzt verschicken' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}
