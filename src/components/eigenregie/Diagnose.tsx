'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Printer, RotateCcw, ArrowRight } from 'lucide-react';
import { berechneWeg, type Antworten } from '@/lib/eigenregie/diagnose';

type Option<T extends string> = { wert: T; label: string };
type Frage =
  | { key: 'ziel' | 'heute' | 'zugaenge' | 'zeit' | 'technik' | 'gewerbe'; frage: string; optionen: Option<string>[] }
  | { key: 'kostenHeute'; frage: string; zahl: true }
  | { key: 'idee'; frage: string; text: true };

const FRAGEN: Frage[] = [
  { key: 'ziel', frage: 'Was soll die Seite für dich tun?', optionen: [
    { wert: 'kunden', label: 'Kunden vor Ort gewinnen' },
    { wert: 'verkaufen', label: 'Produkte oder Leistungen verkaufen' },
    { wert: 'wissen', label: 'Wissen veröffentlichen' },
    { wert: 'referenz', label: 'Referenz zeigen' },
  ] },
  { key: 'heute', frage: 'Was hast du heute?', optionen: [
    { wert: 'nichts', label: 'Noch keine Website' },
    { wert: 'wordpress', label: 'WordPress bei einer Agentur oder einem Hoster' },
    { wert: 'baukasten', label: 'Baukasten (Wix, Jimdo, Squarespace …)' },
    { wert: 'ohne-zugriff', label: 'Eigene Seite, aber ohne Zugriff' },
  ] },
  { key: 'zugaenge', frage: 'Hast du Domain, Hosting und Zugangsdaten selbst in der Hand?', optionen: [
    { wert: 'ja', label: 'Ja, alles' }, { wert: 'teilweise', label: 'Teilweise' },
    { wert: 'nein', label: 'Nein' }, { wert: 'unklar', label: 'Weiß ich nicht' },
  ] },
  { key: 'zeit', frage: 'Wie viel Zeit hast du pro Woche?', optionen: [
    { wert: 'unter-2', label: 'Unter 2 Stunden' }, { wert: '2-5', label: '2–5 Stunden' },
    { wert: '5-10', label: '5–10 Stunden' }, { wert: 'vollzeit', label: 'Vollzeit' },
  ] },
  { key: 'technik', frage: 'Deine technische Vorerfahrung?', optionen: [
    { wert: 'keine', label: 'Keine' }, { wert: 'office', label: 'Sicher mit Office & Co.' },
    { wert: 'html', label: 'Etwas HTML' }, { wert: 'entwickler', label: 'Ich entwickle selbst' },
  ] },
  { key: 'gewerbe', frage: 'Ist dein Gewerbe angemeldet?', optionen: [
    { wert: 'ja', label: 'Ja' }, { wert: 'in-arbeit', label: 'In Arbeit' }, { wert: 'nein', label: 'Nein' },
  ] },
  { key: 'kostenHeute', frage: 'Was zahlst du heute monatlich für Website, Wartung und Hosting (in €)?', zahl: true },
  { key: 'idee', frage: 'Beschreib dein Vorhaben in ein, zwei Sätzen (optional).', text: true },
];

export default function Diagnose({ kurspreis, imKurs = false }: { kurspreis: number; imKurs?: boolean }) {
  const [a, setA] = useState<Partial<Antworten>>({ kostenHeute: undefined, idee: '' });
  const [fertig, setFertig] = useState(false);

  const vollstaendig = FRAGEN.every((f) => f.key === 'idee' || (f.key === 'kostenHeute' ? typeof a.kostenHeute === 'number' && a.kostenHeute >= 0 : Boolean(a[f.key])));

  if (fertig && vollstaendig) {
    const w = berechneWeg(a as Antworten, kurspreis);
    return (
      <section aria-labelledby="dein-weg" className="print:text-black">
        <h2 id="dein-weg" className="font-serif text-3xl font-bold text-text-primary mb-2">Dein Weg</h2>
        {a.idee ? <p className="font-body text-text-secondary italic mb-6">„{a.idee}“</p> : null}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Kennzahl label="Aufwand gesamt" wert={`ca. ${w.stundenGesamt} Std.`} />
          <Kennzahl label="Bei deiner Zeit" wert={`ca. ${w.wochen} Woche${w.wochen === 1 ? '' : 'n'}`} />
          <Kennzahl label="Neue Werkzeugkosten" wert={`${w.neueKostenMonat.min}–${w.neueKostenMonat.max} €/Monat`} />
        </div>

        <h3 className="font-serif text-xl font-bold text-text-primary mb-3">Deine Modulreihenfolge</h3>
        <ol className="space-y-3 mb-8">
          {w.schritte.map((s, i) => (
            <li key={s.modul} className="border border-border-subtle bg-surface-card p-4">
              <p className="font-sans text-sm font-bold text-text-primary">
                {i + 1}. Modul {s.modul}: {s.titel} <span className="font-normal text-text-muted">· ca. {s.stunden} Std.</span>
              </p>
              {s.hinweis ? <p className="font-body text-sm text-text-secondary mt-1">{s.hinweis}</p> : null}
            </li>
          ))}
        </ol>

        <h3 className="font-serif text-xl font-bold text-text-primary mb-3">Ehrliche Einschätzung</h3>
        <ul className="space-y-3 mb-8">
          {w.weichen.map((x) => (
            <li key={x.art} className="border-l-4 border-brand-gold pl-4 font-body text-text-secondary">
              {x.text}{' '}
              {x.href ? <Link href={x.href} className="text-brand-fire underline">Mehr dazu</Link> : null}
            </li>
          ))}
        </ul>

        <h3 className="font-serif text-xl font-bold text-text-primary mb-3">Rechnet sich das?</h3>
        <p className="font-body text-text-secondary mb-8">{w.amortisation.text}</p>

        <h3 className="font-serif text-xl font-bold text-text-primary mb-3">Deine Werkzeuge</h3>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border-subtle">
              {w.werkzeuge.map((t) => (
                <tr key={t.name}>
                  <td className="py-2 pr-4 font-sans font-bold text-text-primary align-top">{t.name}</td>
                  <td className="py-2 pr-4 font-sans text-text-primary whitespace-nowrap align-top">{t.kosten}</td>
                  <td className="py-2 font-body text-text-secondary align-top">{t.hinweis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 print:hidden">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-5 py-3 border border-border-subtle font-sans text-sm font-bold text-text-primary hover:border-brand-gold">
            <Printer size={16} /> Drucken / als PDF speichern
          </button>
          <button type="button" onClick={() => setFertig(false)} className="inline-flex items-center gap-2 px-5 py-3 border border-border-subtle font-sans text-sm text-text-secondary hover:border-brand-gold">
            <RotateCcw size={16} /> Antworten ändern
          </button>
          {imKurs ? (
            <Link href="/eigenregie/lernen/01-ownership" className="inline-flex items-center gap-2 px-5 py-3 bg-brand-fire text-white font-sans text-sm font-bold">
              Mit Modul 1 starten <ArrowRight size={16} />
            </Link>
          ) : (
            <Link href="/eigenregie#kaufen" className="inline-flex items-center gap-2 px-5 py-3 bg-brand-fire text-white font-sans text-sm font-bold">
              Zum Angebot <ArrowRight size={16} />
            </Link>
          )}
        </div>
        <p className="font-body text-xs text-text-muted mt-6">
          Deine Antworten werden nicht gespeichert und nicht übertragen — die Auswertung läuft nur in deinem Browser.
          Zeitangaben sind Schätzungen für einen typischen Auftritt mit 5–15 Seiten.
        </p>
      </section>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (vollstaendig) setFertig(true); }}
      className="space-y-8"
      aria-label="Diagnose"
    >
      {FRAGEN.map((f, i) => (
        <fieldset key={f.key} className="border border-border-subtle bg-surface-card p-5">
          <legend className="px-1 font-sans text-xs font-bold tracking-widest uppercase text-brand-fire">Frage {i + 1} von {FRAGEN.length}</legend>
          <p className="font-serif text-lg font-bold text-text-primary mb-4">{f.frage}</p>
          {'optionen' in f ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {f.optionen.map((o) => (
                <label key={o.wert} className={`flex items-center gap-3 border px-4 py-3 cursor-pointer font-body text-sm ${a[f.key] === o.wert ? 'border-brand-fire bg-brand-fire/5 text-text-primary' : 'border-border-subtle text-text-secondary hover:border-brand-gold'}`}>
                  <input type="radio" name={f.key} value={o.wert} checked={a[f.key] === o.wert} onChange={() => setA((x) => ({ ...x, [f.key]: o.wert }))} className="accent-[#E85018]" />
                  {o.label}
                </label>
              ))}
            </div>
          ) : 'zahl' in f ? (
            <input
              type="number" inputMode="numeric" min={0} step={1}
              value={a.kostenHeute ?? ''}
              onChange={(e) => setA((x) => ({ ...x, kostenHeute: e.target.value === '' ? undefined : Number(e.target.value) }))}
              className="w-40 border border-border-subtle bg-surface-base px-3 py-2 font-sans text-text-primary"
              aria-label="Monatliche Kosten in Euro"
            />
          ) : (
            <textarea
              value={a.idee ?? ''} maxLength={400} rows={3}
              onChange={(e) => setA((x) => ({ ...x, idee: e.target.value }))}
              className="w-full border border-border-subtle bg-surface-base px-3 py-2 font-body text-text-primary"
              aria-label="Dein Vorhaben"
            />
          )}
        </fieldset>
      ))}
      <button type="submit" disabled={!vollstaendig} className="inline-flex items-center gap-2 px-6 py-3 bg-brand-fire text-white font-sans font-bold disabled:opacity-40 disabled:cursor-not-allowed">
        Meinen Weg anzeigen <ArrowRight size={16} />
      </button>
      {!vollstaendig ? <p className="font-body text-xs text-text-muted">Beantworte die Fragen 1–7, dann erscheint dein Weg.</p> : null}
    </form>
  );
}

function Kennzahl({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="border border-border-subtle bg-surface-card p-4">
      <p className="font-sans text-[11px] font-bold tracking-widest uppercase text-text-muted mb-1">{label}</p>
      <p className="font-serif text-xl font-bold text-text-primary">{wert}</p>
    </div>
  );
}
