'use client';

/**
 * Hofladen-Radar — Suche (Ort/PLZ oder Standort), Trefferliste, Karte.
 *
 * Karte nur nach Klick („Karte laden"): Kartenkacheln kommen von MapTiler,
 * damit geht die IP-Adresse an einen Dritten — erst mit Entscheidung des
 * Besuchers. „Immer laden" merkt sich die Entscheidung lokal (localStorage,
 * eigener Schluessel, unabhaengig vom Statistik-Consent). Widerruf: Link unter
 * der Karte.
 *
 * URL-Parameter (?ort=…&km=…&fleisch=1) werden gelesen und gespiegelt, damit
 * eine Suche teilbar ist — ueber window.location statt useSearchParams, damit
 * die Seite statisch bleibt (kein Suspense-Umbau, wie ToolBoxes.tsx).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Search, LocateFixed, Loader2, MapPin, Leaf, Beef, ChevronRight, Globe, Phone, Map as MapIcon, ShieldCheck } from 'lucide-react';
import type { HofTreffer } from '@/lib/hoefe/types';
import { adresseZeile, entfernungLabel, fleischartenLabel, sichereUrl, hostAusUrl } from '@/lib/hoefe/format';

const HofKarte = dynamic(() => import('./HofKarte'), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full animate-pulse bg-surface-elevated sm:h-[520px]" aria-hidden />,
});

const KARTE_KEY = 'sa-karte-v1';
const RADIEN = [10, 25, 50, 100] as const;

type Antwort = {
  mittelpunkt: { lat: number; lng: number; label: string | null };
  km: number;
  treffer: HofTreffer[];
  error?: string;
};

function karteFreigabeGelesen(): boolean {
  try {
    return window.localStorage.getItem(KARTE_KEY) === 'immer';
  } catch {
    return false;
  }
}

export default function HofladenRadar({ apiKey }: { apiKey: string }) {
  const [ort, setOrt] = useState('');
  const [km, setKm] = useState<number>(25);
  const [nurFleisch, setNurFleisch] = useState(false);
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [antwort, setAntwort] = useState<Antwort | null>(null);
  const [karteFrei, setKarteFrei] = useState(false);
  const [immerLaden, setImmerLaden] = useState(false);
  const [aktiv, setAktiv] = useState<string | null>(null);
  const abbruch = useRef<AbortController | null>(null);

  const suchen = useCallback(async (params: Record<string, string>) => {
    abbruch.current?.abort();
    const ac = new AbortController();
    abbruch.current = ac;
    setLaden(true);
    setFehler(null);
    try {
      const qs = new URLSearchParams(params);
      const res = await fetch(`/api/hoefe?${qs.toString()}`, { signal: ac.signal });
      const data = (await res.json()) as Antwort;
      if (!res.ok) {
        setAntwort(null);
        setFehler(res.status === 404 ? 'Diesen Ort haben wir nicht gefunden — versuch die Postleitzahl.' : data.error ?? 'Suche fehlgeschlagen.');
        return;
      }
      setAntwort(data);
      setAktiv(null);
      // Teilbare URL, ohne Navigation.
      const url = new URL(window.location.href);
      url.search = qs.toString();
      window.history.replaceState(null, '', url.toString());
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setFehler('Verbindung fehlgeschlagen — bitte noch einmal.');
    } finally {
      if (abbruch.current === ac) setLaden(false);
    }
  }, []);

  // Start: Freigabe lesen, URL-Parameter uebernehmen.
  useEffect(() => {
    if (karteFreigabeGelesen()) { setKarteFrei(true); setImmerLaden(true); }
    const p = new URLSearchParams(window.location.search);
    const pOrt = p.get('ort')?.trim() ?? '';
    const pKm = Number(p.get('km'));
    const pFleisch = p.get('fleisch') === '1';
    const kmStart = RADIEN.includes(pKm as (typeof RADIEN)[number]) ? pKm : 25;
    setKm(kmStart);
    setNurFleisch(pFleisch);
    if (pOrt) {
      setOrt(pOrt);
      void suchen({ ort: pOrt, km: String(kmStart), ...(pFleisch ? { fleisch: '1' } : {}) });
    }
  }, [suchen]);

  function parameter(overrides: Partial<{ ort: string; km: number; nurFleisch: boolean; lat: number; lng: number }> = {}) {
    const o = { ort, km, nurFleisch, ...overrides };
    const p: Record<string, string> = { km: String(o.km) };
    if (o.nurFleisch) p.fleisch = '1';
    if (typeof o.lat === 'number' && typeof o.lng === 'number') {
      p.lat = o.lat.toFixed(5);
      p.lng = o.lng.toFixed(5);
    } else {
      p.ort = o.ort.trim();
    }
    return p;
  }

  function absenden(e: React.FormEvent) {
    e.preventDefault();
    if (ort.trim().length < 2) { setFehler('Bitte Ort oder Postleitzahl eingeben.'); return; }
    void suchen(parameter());
  }

  function standort() {
    if (!('geolocation' in navigator)) { setFehler('Dein Browser gibt keinen Standort frei.'); return; }
    setLaden(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrt('');
        void suchen(parameter({ ort: '', lat: pos.coords.latitude, lng: pos.coords.longitude }));
      },
      () => { setLaden(false); setFehler('Standort nicht freigegeben — gib stattdessen einen Ort ein.'); },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  }

  function neuSuchenMit(o: Partial<{ km: number; nurFleisch: boolean }>) {
    if (!antwort) return;
    const m = antwort.mittelpunkt;
    const basis = antwort.mittelpunkt.label && ort.trim() ? { ort } : { lat: m.lat, lng: m.lng, ort: '' };
    void suchen(parameter({ ...basis, ...o }));
  }

  function karteLaden(dauerhaft: boolean) {
    setKarteFrei(true);
    if (dauerhaft) {
      setImmerLaden(true);
      try { window.localStorage.setItem(KARTE_KEY, 'immer'); } catch { /* blockiert = nur diese Sitzung */ }
    }
  }
  function karteWiderrufen() {
    setKarteFrei(false);
    setImmerLaden(false);
    try { window.localStorage.removeItem(KARTE_KEY); } catch { /* egal */ }
  }

  const treffer = antwort?.treffer ?? [];

  return (
    <div className="space-y-6">
      {/* Suche */}
      {/* method/action: vor der Hydration (oder ohne JS) laedt ein Absenden /hoefe?ort=…
          neu, und der Start-Effekt fuehrt die Suche aus — kein toter Klick. */}
      <form method="get" action="/hoefe" onSubmit={absenden} className="rounded-xl border border-brand-gold/25 bg-surface-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Ort oder Postleitzahl</span>
            <input
              name="ort"
              value={ort}
              onChange={(e) => setOrt(e.target.value)}
              placeholder="Ort oder PLZ, z. B. Wuppertal, 8001 Zürich, 1010 Wien"
              inputMode="search"
              autoComplete="postal-code"
              className="w-full rounded-lg border border-border-subtle bg-surface-base px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-gold focus:outline-none"
            />
          </label>
          <label className="sm:w-36">
            <span className="sr-only">Umkreis</span>
            <select
              name="km"
              value={km}
              onChange={(e) => { const v = Number(e.target.value); setKm(v); neuSuchenMit({ km: v }); }}
              className="w-full rounded-lg border border-border-subtle bg-surface-base px-3 py-2.5 text-sm text-text-primary focus:border-brand-gold focus:outline-none"
            >
              {RADIEN.map((r) => <option key={r} value={r}>{r} km Umkreis</option>)}
            </select>
          </label>
          <button
            type="submit"
            disabled={laden}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-fire px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-ink hover:opacity-90 disabled:opacity-50"
          >
            {laden ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" /> : <Search size={16} />} Suchen
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-text-secondary">
            <input
              type="checkbox"
              name="fleisch"
              value="1"
              checked={nurFleisch}
              onChange={(e) => { setNurFleisch(e.target.checked); neuSuchenMit({ nurFleisch: e.target.checked }); }}
              className="h-4 w-4 rounded border-border-subtle bg-surface-base accent-brand-fire"
            />
            Nur Höfe mit belegtem Fleischangebot
          </label>
          <button type="button" onClick={standort} disabled={laden} className="inline-flex items-center gap-1.5 text-text-secondary hover:text-brand-gold disabled:opacity-50">
            <LocateFixed size={15} /> Meinen Standort verwenden
          </button>
        </div>
        {fehler && <p role="alert" className="mt-3 text-sm text-brand-fire">{fehler}</p>}
      </form>

      {antwort && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Karte */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-dark">
              {karteFrei && apiKey ? (
                <HofKarte mitte={antwort.mittelpunkt} km={antwort.km} treffer={treffer} apiKey={apiKey} aktiv={aktiv} />
              ) : (
                <div className="flex h-[420px] flex-col items-center justify-center gap-4 p-6 text-center sm:h-[520px]">
                  <MapIcon size={36} className="text-brand-gold" />
                  {apiKey ? (
                    <>
                      <p className="max-w-md text-sm text-text-secondary">
                        Die Karte lädt Kartenkacheln von <strong className="text-text-primary">MapTiler</strong> (Schweiz). Dabei wird deine
                        IP-Adresse an MapTiler übertragen. Die Trefferliste funktioniert auch ohne Karte.
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={() => karteLaden(false)} className="rounded-lg bg-brand-fire px-4 py-2 text-sm font-bold uppercase tracking-wide text-ink hover:opacity-90">
                          Karte einmal laden
                        </button>
                        <button type="button" onClick={() => karteLaden(true)} className="rounded-lg border border-brand-gold/40 px-4 py-2 text-sm font-semibold text-text-primary hover:border-brand-gold">
                          Immer laden
                        </button>
                      </div>
                      <Link href="/datenschutz#hofladen-radar" className="text-xs text-text-muted underline hover:text-brand-gold">Details im Datenschutz</Link>
                    </>
                  ) : (
                    <p className="max-w-md text-sm text-text-secondary">Die Kartenansicht ist noch nicht freigeschaltet — die Trefferliste zeigt alle Höfe mit Entfernung.</p>
                  )}
                </div>
              )}
            </div>
            {karteFrei && apiKey && (
              <p className="mt-2 text-[11px] text-text-muted">
                Karte: MapTiler · Daten: © OpenStreetMap-Mitwirkende (ODbL).{' '}
                {immerLaden ? (
                  <button type="button" onClick={karteWiderrufen} className="underline hover:text-brand-gold">Automatisches Laden widerrufen</button>
                ) : (
                  <button type="button" onClick={karteWiderrufen} className="underline hover:text-brand-gold">Karte ausblenden</button>
                )}
              </p>
            )}
          </div>

          {/* Liste */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="font-serif text-xl font-bold text-text-light">
                {treffer.length} {treffer.length === 1 ? 'Hof' : 'Höfe'}
                <span className="font-sans text-sm font-normal text-text-secondary"> im Umkreis von {antwort.km} km{antwort.mittelpunkt.label ? ` um ${antwort.mittelpunkt.label}` : ''}</span>
              </h2>
            </div>
            {treffer.length === 0 ? (
              <p className="rounded-xl border border-border-subtle bg-surface-card p-5 text-sm text-text-secondary">
                Kein Hof in diesem Umkreis. Vergrößere den Radius — oder kennst du einen Hofladen, der fehlt?{' '}
                <Link href="/kontakt?betreff=hofladen" className="text-brand-gold underline">Sag uns Bescheid.</Link>
              </p>
            ) : (
              <ol className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {treffer.map((t) => {
                  const web = sichereUrl(t.website);
                  return (
                    <li key={t.id}>
                      <article
                        onMouseEnter={() => setAktiv(t.id)}
                        className={`rounded-xl border bg-surface-card p-4 transition-colors ${aktiv === t.id ? 'border-brand-gold' : 'border-border-subtle hover:border-brand-gold/50'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-serif text-base font-bold text-text-light">
                              <Link href={`/hoefe/${t.slug}`} className="hover:text-brand-fire">{t.name}</Link>
                            </h3>
                            {adresseZeile(t) && (
                              <p className="mt-0.5 flex items-start gap-1 text-xs text-text-secondary"><MapPin size={12} className="mt-0.5 shrink-0" />{adresseZeile(t)}</p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs font-bold text-brand-gold">{entfernungLabel(t.entfernung_km)}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                          {t.verkauft_fleisch === true && (
                            <span className="inline-flex items-center gap-1 rounded bg-brand-fire/15 px-1.5 py-0.5 font-semibold text-brand-fire"><Beef size={11} /> Fleisch{t.fleischarten.length ? `: ${fleischartenLabel(t.fleischarten).join(', ')}` : ''}</span>
                          )}
                          {t.bio && <span className="inline-flex items-center gap-1 rounded bg-green-900/40 px-1.5 py-0.5 font-semibold text-green-300"><Leaf size={11} /> Bio</span>}
                          {t.beansprucht && <span className="inline-flex items-center gap-1 rounded bg-brand-gold/15 px-1.5 py-0.5 font-semibold text-brand-gold"><ShieldCheck size={11} /> Vom Hof bestätigt</span>}
                          {t.verkauft_fleisch !== true && <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-text-muted">Angebot nicht bestätigt</span>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs">
                          {web && <a href={web} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-text-secondary hover:text-brand-gold"><Globe size={12} /> {hostAusUrl(web)}</a>}
                          {t.telefon && <a href={`tel:${t.telefon.replace(/\s+/g, '')}`} className="inline-flex items-center gap-1 text-text-secondary hover:text-brand-gold"><Phone size={12} /> {t.telefon}</a>}
                          <Link href={`/hoefe/${t.slug}`} className="ml-auto inline-flex items-center gap-0.5 font-bold uppercase tracking-wide text-brand-gold hover:text-brand-fire">Profil <ChevronRight size={12} /></Link>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
