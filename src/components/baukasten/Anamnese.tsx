'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ArrowLeft, ArrowRight, Check, Printer, RotateCcw, Send } from 'lucide-react';
import {
  BLOECKE, aktiveFragen, bereinige, istBeantwortet, projektakte, vollstaendig, werteAus,
  type Antworten, type Ergebnis, type Frage, type Position,
} from '@/lib/baukasten/anamnese';
import { formatBetrag, type Waehrung } from '@/lib/baukasten/preise';
import { CONSENT_TEXT } from '@/lib/kontakt';

/**
 * Projekt-Anamnese (KONZEPT-Website-Baukasten-2026-09-25, Abschnitt 13).
 * Die Antworten bleiben im Browser, bis der Nutzer ausdrücklich anfragt.
 * Die Anfrage läuft über /api/kontakt (Speicherung + Einwilligungsnachweis).
 */

const FEUER = '#E85018';

type Status = 'offen' | 'sendet' | 'gesendet' | 'fehler';

export default function Anamnese() {
  const [a, setA] = useState<Partial<Antworten>>({ ziele: [], vorhanden: [] });
  const [block, setBlock] = useState(0);
  const [fertig, setFertig] = useState(false);
  const kopf = useRef<HTMLHeadingElement>(null);

  const aktiv = useMemo(() => aktiveFragen(a), [a]);
  const blockName = BLOECKE[block];
  const fragen = aktiv.filter((f) => f.block === blockName);
  const blockOk = fragen.every((f) => istBeantwortet(f, a));

  useEffect(() => {
    kopf.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [block, fertig]);

  const setze = (key: keyof Antworten, wert: unknown) => setA((alt) => bereinige({ ...alt, [key]: wert }));
  const umschalten = (key: 'ziele' | 'vorhanden', wert: string) =>
    setA((alt) => {
      const liste = (alt[key] as string[] | undefined) ?? [];
      const neu = liste.includes(wert) ? liste.filter((x) => x !== wert) : [...liste, wert];
      return bereinige({ ...alt, [key]: neu });
    });

  if (fertig && vollstaendig(a)) {
    return <ErgebnisAnsicht a={a} e={werteAus(a)} kopf={kopf} neu={() => { setA({ ziele: [], vorhanden: [] }); setBlock(0); setFertig(false); }} zurueck={() => setFertig(false)} />;
  }

  const letzter = block === BLOECKE.length - 1;

  return (
    <section aria-labelledby="anamnese-block">
      {/* Fortschritt */}
      <div className="mb-8 print:hidden">
        <div className="flex justify-between font-sans text-xs uppercase tracking-[0.15em] text-[#F4EFE9]/60 mb-2">
          <span>Schritt {block + 1} von {BLOECKE.length}</span>
          <span>{blockName}</span>
        </div>
        <div className="h-1.5 w-full bg-[#F4EFE9]/10" role="progressbar" aria-valuemin={1} aria-valuemax={BLOECKE.length} aria-valuenow={block + 1} aria-label="Fortschritt">
          <div className="h-full transition-all duration-300" style={{ width: `${((block + 1) / BLOECKE.length) * 100}%`, background: FEUER }} />
        </div>
      </div>

      <h2 id="anamnese-block" ref={kopf} tabIndex={-1} className="font-sans text-2xl sm:text-3xl font-bold mb-8 outline-none">{blockName}</h2>

      <div className="space-y-10">
        {fragen.map((f) => (
          <FrageFeld key={f.key} f={f} a={a} setze={setze} umschalten={umschalten} />
        ))}
      </div>

      <div className="mt-12 flex items-center justify-between gap-4">
        <button type="button" onClick={() => setBlock((b) => Math.max(0, b - 1))} disabled={block === 0}
          className="inline-flex items-center gap-2 font-sans text-sm text-[#F4EFE9]/70 hover:text-[#F4EFE9] disabled:invisible">
          <ArrowLeft size={16} aria-hidden /> Zurück
        </button>
        <button type="button" disabled={!blockOk}
          onClick={() => (letzter ? setFertig(true) : setBlock((b) => b + 1))}
          className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: FEUER }}>
          {letzter ? 'Ergebnis zeigen' : 'Weiter'} <ArrowRight size={16} aria-hidden />
        </button>
      </div>
      {!blockOk && <p className="mt-3 text-right font-sans text-xs text-[#F4EFE9]/50">Bitte beantworte die Fragen in diesem Schritt.</p>}
    </section>
  );
}

function FrageFeld({ f, a, setze, umschalten }: {
  f: Frage; a: Partial<Antworten>;
  setze: (k: keyof Antworten, v: unknown) => void;
  umschalten: (k: 'ziele' | 'vorhanden', v: string) => void;
}) {
  const id = `frage-${f.key}`;
  const kopf = (
    <>
      <legend id={id} className="font-sans text-lg font-semibold mb-1">
        {f.frage}{f.optional && <span className="ml-2 text-sm font-normal text-[#F4EFE9]/50">(optional)</span>}
      </legend>
      {f.erklaerung && <p className="font-sans text-sm text-[#F4EFE9]/60 mb-4">{f.erklaerung}</p>}
    </>
  );

  if (f.art === 'url' || f.art === 'text') {
    const wert = (a[f.key] as string | undefined) ?? '';
    return (
      <fieldset>
        {kopf}
        {f.art === 'url' ? (
          <input type="url" inputMode="url" value={wert} onChange={(ev) => setze(f.key, ev.target.value)} aria-labelledby={id}
            placeholder="https://www.dein-betrieb.de" maxLength={300}
            className="w-full bg-transparent border border-[#F4EFE9]/20 px-4 py-3 font-sans text-base focus:border-[#E85018] focus:outline-none" />
        ) : (
          <textarea value={wert} onChange={(ev) => setze(f.key, ev.target.value)} aria-labelledby={id} rows={4} maxLength={1500}
            placeholder="Zum Beispiel: Wir sind ein Malerbetrieb mit 8 Leuten und suchen dringend zwei Azubis …"
            className="w-full bg-transparent border border-[#F4EFE9]/20 px-4 py-3 font-sans text-base focus:border-[#E85018] focus:outline-none resize-y" />
        )}
      </fieldset>
    );
  }

  const mehrere = f.art === 'mehrere';
  const gewaehlt = (w: string) => (mehrere ? ((a[f.key] as string[] | undefined) ?? []).includes(w) : a[f.key] === w);

  return (
    <fieldset>
      {kopf}
      <div className={`grid gap-2 ${f.optionen && f.optionen.length > 4 ? 'sm:grid-cols-2' : ''}`}>
        {f.optionen?.map((o) => {
          const an = gewaehlt(o.wert);
          return (
            <label key={o.wert}
              className={`flex items-start gap-3 cursor-pointer border px-4 py-3 transition-colors ${an ? 'border-[#E85018] bg-[#E85018]/10' : 'border-[#F4EFE9]/15 hover:border-[#F4EFE9]/40'}`}>
              <input type={mehrere ? 'checkbox' : 'radio'} name={f.key} value={o.wert} checked={an}
                onChange={() => (mehrere ? umschalten(f.key as 'ziele' | 'vorhanden', o.wert) : setze(f.key, o.wert))}
                className="sr-only" />
              <span aria-hidden className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${mehrere ? '' : 'rounded-full'} ${an ? 'border-[#E85018] bg-[#E85018]' : 'border-[#F4EFE9]/40'}`}>
                {an && <Check size={13} strokeWidth={3} className="text-white" />}
              </span>
              <span className="font-sans text-base leading-snug">
                {o.label}
                {o.hinweis && <span className="block text-sm text-[#F4EFE9]/60 mt-0.5">{o.hinweis}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function betragText(p: Position, w: Waehrung): string {
  if (p.betrag === null) return 'im Angebot';
  const f = (n: number) => formatBetrag(n, w);
  if (p.art === 'stueck') return `${f(p.betrag)}–${f(p.stueckBis ?? p.betrag)} je Stück`;
  return `${p.ab ? 'ab ' : ''}${f(p.betrag)}${p.art === 'monatlich' ? ' / Monat' : ''}`;
}

function ErgebnisAnsicht({ a, e, kopf, neu, zurueck }: {
  a: Antworten; e: Ergebnis; kopf: RefObject<HTMLHeadingElement | null>; neu: () => void; zurueck: () => void;
}) {
  const w = e.waehrung;
  const f = (n: number) => formatBetrag(n, w);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [firma, setFirma] = useState('');
  const [consent, setConsent] = useState(false);
  const [falle, setFalle] = useState('');
  const [status, setStatus] = useState<Status>('offen');
  const [fehler, setFehler] = useState('');

  const wertgespraech = e.naechsterSchritt === 'wertgespraech';

  async function senden(ev: FormEvent) {
    ev.preventDefault();
    setStatus('sendet');
    setFehler('');
    const akte = projektakte(a, e, f);
    const message = `${firma.trim() ? `Betrieb: ${firma.trim()}\n` : ''}${wertgespraech ? 'Wunsch: Wertgespräch\n' : 'Wunsch: Angebot zum Festpreis\n'}\n${akte}`;
    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject: 'baukasten', message, consent, website: falle }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Senden fehlgeschlagen.');
      setStatus('gesendet');
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Senden fehlgeschlagen.');
      setStatus('fehler');
    }
  }

  return (
    <section aria-labelledby="ergebnis" className="print:text-black">
      <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: FEUER }}>Dein Ergebnis · Richtwert</p>
      <h2 id="ergebnis" ref={kopf} tabIndex={-1} className="font-sans text-3xl sm:text-4xl font-bold leading-tight mb-2 outline-none">
        {e.paket}
      </h2>
      <p className="font-sans text-[#F4EFE9]/70 mb-8 print:text-black">Stufe {e.stufe}: {e.stufeName}</p>

      {/* Kennzahlen */}
      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        <Kennzahl label="Einmalig" wert={`${e.einmalig.ab ? 'ab ' : ''}${f(e.einmalig.betrag)}`} zusatz={e.einmalig.offenePositionen ? 'zzgl. Positionen im Angebot' : undefined} />
        <Kennzahl label="Oder als Mietkauf" wert={e.mietkauf ? `${f(e.mietkauf.rate)} / Monat` : '—'} zusatz={e.mietkauf ? `${e.mietkauf.monate} Monate, inkl. Wartung, 0 € Anzahlung` : wertgespraech ? 'bei Maßanfertigung nicht möglich' : 'nicht gewählt'} />
        <Kennzahl label="Laufend in deinem Konto" wert={e.stufe === 'L' || e.stufe === 'XL' ? 'ca. 30–45 US-$' : '0 € Hosting'} zusatz={e.stufe === 'L' || e.stufe === 'XL' ? 'Datenbank + Hosting im Monat' : 'nur deine Domain'} />
      </div>

      {/* Positionen */}
      <h3 className="font-sans text-lg font-bold mb-3">Was drin ist</h3>
      <ul className="divide-y divide-[#F4EFE9]/10 border-y border-[#F4EFE9]/10 mb-8">
        {e.positionen.map((p) => (
          <li key={p.label} className="py-3 flex flex-wrap justify-between gap-x-6 gap-y-1">
            <span className="font-sans">
              {p.label}
              {p.hinweis && <span className="block text-sm text-[#F4EFE9]/55 print:text-black">{p.hinweis}</span>}
            </span>
            <span className={`font-sans font-semibold whitespace-nowrap ${p.enthalten ? 'text-[#F4EFE9]/50 line-through decoration-1 print:text-black' : ''}`}>
              {betragText(p, w)}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="font-sans text-lg font-bold mb-3">Laufend, freiwillig und monatlich kündbar</h3>
      <ul className="divide-y divide-[#F4EFE9]/10 border-y border-[#F4EFE9]/10 mb-8">
        {e.laufend.map((p) => (
          <li key={p.label} className="py-3 flex flex-wrap justify-between gap-x-6 gap-y-1">
            <span className="font-sans">{p.label}{p.hinweis && <span className="block text-sm text-[#F4EFE9]/55 print:text-black">{p.hinweis}</span>}</span>
            <span className="font-sans font-semibold whitespace-nowrap">{betragText(p, w)}</span>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 sm:grid-cols-2 mb-10 font-sans text-sm">
        <div><p className="font-bold mb-1">Zeitrahmen</p><p className="text-[#F4EFE9]/70 print:text-black">{e.zeitrahmen}</p></div>
        <div><p className="font-bold mb-1">Dein Aufwand</p><p className="text-[#F4EFE9]/70 print:text-black">{e.kundenaufwand}</p></div>
      </div>

      {/* Das Versprechen */}
      <div className="border-l-2 pl-5 mb-10 font-sans" style={{ borderColor: FEUER }}>
        <p className="font-bold mb-1">Die Website gehört dir — ab Tag 1.</p>
        <p className="text-sm text-[#F4EFE9]/70 print:text-black">Domain auf deinen Namen, Code und Hosting in deinen eigenen Konten. SEO und GEO sind in jedem Paket enthalten. Der Wartungsvertrag ist freiwillig und monatlich kündbar — bei Kündigung bekommst du ein Übergabe-Paket.</p>
      </div>

      {e.weichen.length > 0 && (
        <div className="mb-10 space-y-3">
          <h3 className="font-sans text-lg font-bold">Ehrlich gesagt</h3>
          {e.weichen.map((x) => (
            <div key={x.art} className="border border-[#F4EFE9]/15 p-4 font-sans text-sm">
              <p>{x.text}</p>
              {x.href && <a href={x.href} className="inline-flex items-center gap-1 mt-2 font-bold underline print:hidden" style={{ color: FEUER }}>Zur Eigenregie-Diagnose <ArrowRight size={14} aria-hidden /></a>}
            </div>
          ))}
        </div>
      )}

      {e.hinweise.length > 0 && (
        <div className="mb-10">
          <h3 className="font-sans text-lg font-bold mb-3">Gut zu wissen</h3>
          <ul className="list-disc pl-5 space-y-2 font-sans text-sm text-[#F4EFE9]/75 print:text-black">
            {e.hinweise.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </div>
      )}

      <p className="font-sans text-xs text-[#F4EFE9]/50 mb-10 print:text-black">
        Richtpreise für Unternehmer (B2B), berechnet aus deinen Antworten und unserer öffentlichen Preisliste. Verbindlich wird erst das Angebot; dort stehen auch die Angaben zur Umsatzsteuer. Keine Ranking- oder Umsatzversprechen.
      </p>

      {/* Anfrage */}
      <div className="border border-[#F4EFE9]/15 p-6 sm:p-8 print:hidden">
        {status === 'gesendet' ? (
          <div role="status">
            <p className="font-sans text-xl font-bold mb-2">Danke — deine Anfrage ist angekommen.</p>
            <p className="font-sans text-[#F4EFE9]/70">Du bekommst eine Antwort per E-Mail: {wertgespraech ? 'mit Terminvorschlägen für das Wertgespräch.' : 'mit dem Angebot zum Festpreis.'} Deine Antworten liegen uns vor — du musst nichts doppelt ausfüllen.</p>
          </div>
        ) : (
          <form onSubmit={senden} className="space-y-4">
            <h3 className="font-sans text-xl font-bold">{wertgespraech ? 'Wertgespräch anfragen' : 'Unverbindliches Angebot anfragen'}</h3>
            <p className="font-sans text-sm text-[#F4EFE9]/65">Deine Antworten und dieses Ergebnis gehen mit. Bis hierhin wurde nichts gespeichert.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Feld label="Name" wert={name} setze={setName} pflicht autoComplete="name" />
              <Feld label="E-Mail" wert={email} setze={setEmail} pflicht typ="email" autoComplete="email" />
            </div>
            <Feld label="Betrieb (optional)" wert={firma} setze={setFirma} autoComplete="organization" />
            <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="anamnese-website">Website (bitte frei lassen)</label>
              <input id="anamnese-website" tabIndex={-1} autoComplete="off" value={falle} onChange={(ev) => setFalle(ev.target.value)} />
            </div>
            <label className="flex items-start gap-3 font-sans text-sm text-[#F4EFE9]/75 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(ev) => setConsent(ev.target.checked)} required className="mt-1 h-4 w-4 accent-[#E85018]" />
              <span>{CONSENT_TEXT} Mehr in der <a href="https://steakakademie.de/datenschutz" className="underline">Datenschutzerklärung</a>.</span>
            </label>
            {status === 'fehler' && <p role="alert" className="font-sans text-sm" style={{ color: FEUER }}>{fehler}</p>}
            <button type="submit" disabled={status === 'sendet' || !consent}
              className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-white disabled:opacity-40" style={{ background: FEUER }}>
              <Send size={16} aria-hidden /> {status === 'sendet' ? 'Wird gesendet …' : wertgespraech ? 'Wertgespräch anfragen' : 'Angebot anfragen'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-6 font-sans text-sm print:hidden">
        <button type="button" onClick={zurueck} className="inline-flex items-center gap-2 text-[#F4EFE9]/70 hover:text-[#F4EFE9]"><ArrowLeft size={15} aria-hidden /> Antworten ändern</button>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 text-[#F4EFE9]/70 hover:text-[#F4EFE9]"><Printer size={15} aria-hidden /> Drucken / als PDF</button>
        <button type="button" onClick={neu} className="inline-flex items-center gap-2 text-[#F4EFE9]/70 hover:text-[#F4EFE9]"><RotateCcw size={15} aria-hidden /> Neu starten</button>
      </div>
    </section>
  );
}

function Kennzahl({ label, wert, zusatz }: { label: string; wert: string; zusatz?: string }) {
  return (
    <div className="border border-[#F4EFE9]/15 p-4">
      <p className="font-sans text-xs uppercase tracking-[0.15em] text-[#F4EFE9]/55 mb-1 print:text-black">{label}</p>
      <p className="font-sans text-2xl font-bold">{wert}</p>
      {zusatz && <p className="font-sans text-xs text-[#F4EFE9]/55 mt-1 print:text-black">{zusatz}</p>}
    </div>
  );
}

function Feld({ label, wert, setze, pflicht, typ = 'text', autoComplete }: {
  label: string; wert: string; setze: (v: string) => void; pflicht?: boolean; typ?: string; autoComplete?: string;
}) {
  return (
    <label className="block font-sans text-sm">
      <span className="block mb-1 text-[#F4EFE9]/75">{label}</span>
      <input type={typ} value={wert} onChange={(ev) => setze(ev.target.value)} required={pflicht} autoComplete={autoComplete} maxLength={200}
        className="w-full bg-transparent border border-[#F4EFE9]/20 px-4 py-3 text-base text-[#F4EFE9] focus:border-[#E85018] focus:outline-none" />
    </label>
  );
}
