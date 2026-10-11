'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, RotateCcw, Share2, Check, ChevronRight } from 'lucide-react';
import ProduktZeileClient from '@/components/affiliate/ProduktZeileClient';
import {
  ART, FUER, KOENNEN, ergebnis, parseAntworten, serializeAntworten,
  type Antworten, type ArtKey, type FinderSetup, type FuerKey, type KoennenKey,
} from '@/lib/geschenke-finder';

/**
 * Geschenke-Finder (Uwe, 11.10.2026): drei Fragen, ein Ergebnis, teilbar per Link.
 * Logik in src/lib/geschenke-finder.ts; die Setups kommen fertig vom Server
 * (GeschenkeFinderServer), inklusive Link und Kennzeichnung je Produkt.
 *
 * Ein geteilter Link (?fuer=…&koennen=…&art=…) zeigt nach dem Hydrieren direkt das Ergebnis.
 * Messung: Plausible-Klassen am Ergebnis (Geschenke-Finder, koennen, art) und an den
 * Produktlinks (Affiliate-Klick, zone=finder).
 */
export default function GeschenkeFinder({ setups, basisUrl }: { setups: FinderSetup[]; basisUrl: string }) {
  const [fuer, setFuer] = useState<FuerKey | null>(null);
  const [koennen, setKoennen] = useState<KoennenKey | null>(null);
  const [art, setArt] = useState<ArtKey | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const a = parseAntworten(window.location.search);
    if (a) { setFuer(a.fuer); setKoennen(a.koennen); setArt(a.art); }
  }, []);

  const antworten: Antworten | null = fuer && koennen && art ? { fuer, koennen, art } : null;
  const schritt = !fuer ? 1 : !koennen ? 2 : !art ? 3 : 4;

  const reset = () => { setFuer(null); setKoennen(null); setArt(null); setCopied(false); };

  const teilen = async () => {
    if (!antworten) return;
    const url = `${window.location.origin}${basisUrl}${serializeAntworten(antworten)}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Geschenk-Tipp der Steakakademie', url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* abgebrochen — nichts zu tun */ }
  };

  const knopf = 'text-left border border-border-subtle bg-surface-card px-5 py-4 hover:border-brand-gold hover:bg-brand-gold/5 transition-colors';

  return (
    <section id="finder" className="border border-brand-gold/40 bg-surface-base p-6 sm:p-8" aria-label="Geschenke-Finder">
      <div className="flex items-center gap-3 mb-1">
        <Gift size={22} className="text-brand-gold" aria-hidden="true" />
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary">Geschenke-Finder</h2>
      </div>
      <p className="font-body text-sm text-text-secondary mb-6">
        Drei Fragen, dann ein Vorschlag — mit Begründung, ohne Katalog.
      </p>

      {schritt < 4 && (
        <ol className="flex gap-2 mb-6 text-[10px] font-sans font-bold tracking-[0.14em] uppercase text-text-muted" aria-label="Fortschritt">
          {['Für wen', 'Können', 'Was'].map((t, i) => (
            <li key={t} className={`px-2 py-1 border ${schritt === i + 1 ? 'border-brand-gold text-brand-gold' : 'border-border-subtle'}`}>{i + 1} · {t}</li>
          ))}
        </ol>
      )}

      {schritt === 1 && (
        <fieldset>
          <legend className="font-sans font-bold text-text-primary mb-3">Für wen suchst du?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {FUER.map((f) => (
              <button key={f.key} type="button" onClick={() => setFuer(f.key)} className={knopf}>
                <span className="font-sans font-bold text-text-primary">{f.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {schritt === 2 && (
        <fieldset>
          <legend className="font-sans font-bold text-text-primary mb-3">Wie gut grillt die Person?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {KOENNEN.map((k) => (
              <button key={k.key} type="button" onClick={() => setKoennen(k.key)} className={knopf}>
                <span className="block font-sans font-bold text-text-primary">{k.label}</span>
                <span className="block font-body text-xs text-text-secondary mt-1">{k.hinweis}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {schritt === 3 && (
        <fieldset>
          <legend className="font-sans font-bold text-text-primary mb-3">Was soll es sein?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {ART.map((x) => (
              <button key={x.key} type="button" onClick={() => setArt(x.key)} className={knopf}>
                <span className="block font-sans font-bold text-text-primary">{x.label}</span>
                <span className="block font-body text-xs text-text-secondary mt-1">{x.hinweis}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {schritt === 4 && antworten && (() => {
        const e = ergebnis(antworten, setups);
        return (
          <div
            className={`plausible-event-name=Geschenke-Finder plausible-event-koennen=${antworten.koennen} plausible-event-art=${antworten.art}`}
            role="region"
            aria-label="Dein Geschenk-Vorschlag"
          >
            <p className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-gold mb-1">Unser Vorschlag</p>
            <h3 className="font-serif text-2xl font-bold text-text-primary mb-2">{e.ueberschrift}</h3>
            {e.setup && <p className="font-body text-text-secondary leading-relaxed mb-5">{e.setup.fuer}</p>}

            {e.produkte.length > 0 && (
              <ul className="grid gap-4 sm:grid-cols-3 mb-6">
                {e.produkte.map((p) => <ProduktZeileClient key={p.id} p={p} />)}
              </ul>
            )}

            {e.gutschein && (
              <div className="border border-brand-gold/30 bg-surface-card p-5 mb-6">
                <p className="text-[10px] font-sans font-bold tracking-[0.14em] uppercase text-text-muted">Gutschein der Steakakademie</p>
                <h4 className="font-serif text-lg font-bold text-text-primary mt-1">{e.gutschein.titel}</h4>
                <p className="font-body text-sm text-text-secondary leading-relaxed mt-2">{e.gutschein.warum}</p>
                <Link href="/gutschein" className="mt-3 inline-flex items-center gap-1 font-sans text-sm font-bold text-brand-gold hover:text-text-primary transition-colors">
                  Zum Gutschein <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={teilen} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-brand-gold/50 text-brand-gold font-sans font-bold text-xs uppercase tracking-[0.08em] hover:bg-brand-gold/10 transition-colors">
                {copied ? <><Check size={15} /> Link kopiert</> : <><Share2 size={15} /> Vorschlag teilen</>}
              </button>
              <button type="button" onClick={reset} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border-subtle text-text-secondary font-sans font-bold text-xs uppercase tracking-[0.08em] hover:border-brand-gold/40 hover:text-brand-gold transition-colors">
                <RotateCcw size={15} /> Nochmal
              </button>
            </div>
            <p className="mt-4 text-[11px] font-sans text-text-muted leading-relaxed">
              Empfehlung nach Herstellerangaben und unserer Grillpraxis, kein Gerätetest. Preise und Verfügbarkeit siehst du beim Anbieter.
            </p>
          </div>
        );
      })()}
    </section>
  );
}
