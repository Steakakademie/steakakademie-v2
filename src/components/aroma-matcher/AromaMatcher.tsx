'use client';

/**
 * Smart-Pairing-Engine — Client-Teil (/aroma-matcher).
 *
 * Drei Zustände, eine Komponente:
 *   1. Anonym       → Teaser (festes Beispiel), Cut-Picker gesperrt, Registrieren-CTA
 *   2. Eingeloggt   → Cut-Picker aktiv, Counter „X von 5", Ergebnis mit Aroma-Balken + 3 Clustern
 *   3. Kontingent 0 → letztes Ergebnis unscharf, Modal mit Warteliste (Aroma-Matrix)
 *
 * Die Seite selbst bleibt statisch (SEO/GEO): der Login-Status kommt erst im
 * Client über POST /api/aroma-matcher {} — kein cookies() im Server-Render.
 * Aroma-Balken sind reines Tailwind/SVG, keine Chart-Bibliothek.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Beef, Flame, Info, Leaf, Lock, TreePine, Wine, X } from 'lucide-react';
import {
  CLUSTER_LABELS,
  CLUSTER_ORDER,
  FAMILY_LABELS,
  FAMILY_ORDER,
  type ClusterKey,
  type Cut,
  type CutSummary,
} from '@/lib/aroma-matcher/data';

type Status = {
  loggedIn: boolean;
  remaining: number;
  limit: number;
  analysed: string[];
  unlimited?: boolean;
};

type Props = {
  cuts: CutSummary[];
  teaser: Cut;
  limit: number;
};

const CLUSTER_ICON: Record<ClusterKey, typeof Leaf> = {
  rubs_and_glazes: Leaf,
  wood_and_smoke: TreePine,
  drinks_and_sides: Wine,
};

async function post<T>(body: Record<string, unknown>): Promise<{ status: number; data: T }> {
  const res = await fetch('/api/aroma-matcher', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

// ─── Aroma-Balken ────────────────────────────────────────────────────────────

function AromaBars({ cut, muted = false }: { cut: Cut; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-brand-fire">Aroma-Radar</h3>
        <span className="font-sans text-[10px] uppercase tracking-wider text-text-muted">Gewichtung der Aromenfamilien</span>
      </div>
      <ul className="space-y-3">
        {FAMILY_ORDER.map((key) => {
          const value = cut.aroma_profile[key];
          return (
            <li key={key}>
              <div className="mb-1 flex items-baseline justify-between font-sans text-xs">
                <span className="text-text-primary">{FAMILY_LABELS[key]}</span>
                <span className="tabular-nums text-text-muted">{value} %</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated" role="img" aria-label={`${FAMILY_LABELS[key]} ${value} Prozent`}>
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${muted ? 'bg-text-muted' : 'bg-gradient-to-r from-brand-gold to-brand-fire'}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {cut.key_compounds.length > 0 && (
        <p className="mt-4 font-sans text-xs leading-relaxed text-text-muted">
          <span className="text-text-secondary">Prägende Schlüsselaromen: </span>
          {cut.key_compounds.map((c, i) => (
            <span key={c.name}>
              {i > 0 && ' · '}
              <span className="text-text-primary">{c.name}</span> ({c.family})
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

// ─── Cluster-Ergebnis ────────────────────────────────────────────────────────

function Clusters({ cut }: { cut: Cut }) {
  const [active, setActive] = useState<ClusterKey>('rubs_and_glazes');

  return (
    <div>
      {/* Mobil: Tabs · Desktop: drei Spalten */}
      <div className="mb-3 flex gap-2 md:hidden" role="tablist" aria-label="Pairing-Kategorien">
        {CLUSTER_ORDER.map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={active === key}
            onClick={() => setActive(key)}
            className={`flex-1 rounded-lg border px-2 py-2 font-sans text-xs font-semibold transition-colors ${
              active === key
                ? 'border-brand-fire bg-brand-fire/10 text-brand-fire'
                : 'border-border-subtle bg-surface-card text-text-secondary'
            }`}
          >
            {CLUSTER_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {CLUSTER_ORDER.map((key) => {
          const Icon = CLUSTER_ICON[key];
          return (
            <section
              key={key}
              className={`rounded-xl border border-border-subtle bg-surface-card p-5 ${active === key ? 'block' : 'hidden md:block'}`}
            >
              <div className="mb-3 flex items-center gap-2 text-brand-fire">
                <Icon size={18} />
                <h3 className="font-serif text-lg font-bold text-text-light">{CLUSTER_LABELS[key]}</h3>
              </div>
              <ul className="space-y-3">
                {cut.clusters[key].map((p) => (
                  <li key={p.item} className="border-l-2 border-brand-gold/60 pl-3">
                    <p className="font-sans text-sm font-semibold text-text-primary">{p.item}</p>
                    <p className="mt-0.5 font-body text-sm leading-relaxed text-text-secondary">{p.reason}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ─── Ergebnis-Block ──────────────────────────────────────────────────────────

function Result({ cut, muted = false }: { cut: Cut; muted?: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <span className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-brand-gold">
          <Beef size={12} /> Pairing für
        </span>
        <h2 className="mt-1 font-serif text-2xl text-text-light sm:text-3xl">{cut.name}</h2>
        <p className="mt-1 font-body text-[0.95rem] text-text-secondary">{cut.description}</p>
      </div>
      <AromaBars cut={cut} muted={muted} />
      <Clusters cut={cut} />
    </div>
  );
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────

export default function AromaMatcher({ cuts, teaser, limit }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [result, setResult] = useState<Cut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [waitlist, setWaitlist] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    let alive = true;
    post<Status>({}).then(({ status: code, data }) => {
      if (!alive) return;
      if (code === 200) {
        setStatus(data);
        if (data.loggedIn && !data.unlimited && data.remaining <= 0) setLocked(true);
      } else {
        setStatus({ loggedIn: false, remaining: 0, limit, analysed: [] });
      }
    }).catch(() => { if (alive) setStatus({ loggedIn: false, remaining: 0, limit, analysed: [] }); });
    return () => { alive = false; };
  }, [limit]);

  const analyse = useCallback(async (cutId: string, alreadySeen: boolean) => {
    if (!cutId) return;
    setLoading(true);
    setError(null);
    const { status: code, data } = await post<{ cut?: Cut; remaining?: number; analysed?: string[]; error?: string }>({ cutId });
    setLoading(false);
    if (code === 200 && data.cut) {
      setResult(data.cut);
      setStatus((s) => s ? { ...s, remaining: data.remaining ?? s.remaining, analysed: data.analysed ?? s.analysed } : s);
      // Sperre nur, wenn diese Abfrage die letzte freie war — eine Wiederholung
      // eines schon analysierten Cuts bleibt auch bei Rest 0 sichtbar.
      if (!status?.unlimited && !alreadySeen && (data.remaining ?? 1) <= 0) setLocked(true);
      return;
    }
    if (code === 402) {
      setStatus((s) => s ? { ...s, remaining: 0, analysed: data.analysed ?? s.analysed } : s);
      setLocked(true);
      return;
    }
    if (code === 401) {
      window.location.href = '/auth/login?redirectTo=/aroma-matcher';
      return;
    }
    setError(data.error ?? 'Analyse fehlgeschlagen — bitte noch einmal versuchen.');
  }, [status?.unlimited]);

  const joinWaitlist = useCallback(async () => {
    setWaitlist('sending');
    const { status: code } = await post<unknown>({ warteliste: true });
    setWaitlist(code === 200 ? 'done' : 'error');
  }, []);

  const loggedIn = status?.loggedIn === true;
  const remaining = status?.remaining ?? 0;
  const quotaOpen = loggedIn && (status?.unlimited || remaining > 0);
  const analysed = new Set(status?.analysed ?? []);

  return (
    <div className="space-y-8">
      {/* ── Sticky Counter (nur eingeloggt) ─────────────────────────────── */}
      {loggedIn && (
        <div className="sticky top-[64px] z-30 -mx-4 border-y border-border-subtle bg-surface-dark/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
          <div className="flex items-center justify-between font-sans text-xs">
            <span className="inline-flex items-center gap-1.5 text-text-secondary">
              <Flame size={14} className="text-brand-fire" />
              {status?.unlimited ? 'Unbegrenzter Zugang' : 'Verbleibende Test-Analysen'}
            </span>
            {!status?.unlimited && (
              <span className={`rounded-full px-2.5 py-0.5 font-bold tabular-nums ${remaining > 0 ? 'bg-brand-fire/15 text-brand-fire' : 'bg-surface-elevated text-text-muted'}`}>
                {remaining} / {status?.limit ?? limit}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Cut-Picker ──────────────────────────────────────────────────── */}
      <section aria-labelledby="cut-picker">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="cut-picker" className="font-serif text-xl text-text-light">1 · Wähle deinen Cut</h2>
          {!loggedIn && status && (
            <span className="inline-flex items-center gap-1 font-sans text-xs text-text-muted"><Lock size={12} /> Nach Anmeldung aktiv</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {cuts.map((c) => {
            const isSel = selected === c.id;
            const seen = analysed.has(c.id);
            // Bereits analysierte Cuts bleiben auch bei Rest 0 aufrufbar (kostenlos).
            const disabled = loading || !loggedIn || (!quotaOpen && !seen);
            return (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                aria-pressed={isSel}
                onClick={() => { setSelected(c.id); analyse(c.id, seen); }}
                title={seen ? 'Bereits analysiert — kostet keine weitere Analyse' : c.description}
                className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                  isSel
                    ? 'border-brand-fire bg-brand-fire/10'
                    : 'border-border-subtle bg-surface-card hover:border-brand-gold/60'
                } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <span className="block font-sans text-sm font-semibold text-text-primary">{c.name}</span>
                {seen && <span className="mt-1 block font-sans text-[10px] uppercase tracking-wider text-brand-gold">analysiert</span>}
              </button>
            );
          })}
        </div>
        {error && <p className="mt-3 font-sans text-sm text-brand-fire" role="alert">{error}</p>}
      </section>

      {/* ── Ergebnis / Teaser ───────────────────────────────────────────── */}
      <section className="relative">
        {loggedIn ? (
          result ? (
            <div className={locked ? 'pointer-events-none select-none blur-sm' : ''} aria-hidden={locked}>
              <Result cut={result} muted={locked} />
            </div>
          ) : locked ? (
            <div className="pointer-events-none select-none blur-sm" aria-hidden>
              <Result cut={teaser} muted />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center">
              <p className="font-body text-text-secondary">{loading ? 'Analysiere Schlüsselaromen …' : 'Wähle oben einen Cut — das Pairing erscheint hier.'}</p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-sans text-xs text-text-muted">
              <Info size={14} className="text-brand-gold" />
              Beispiel-Pairing — so sieht eine Analyse aus.
            </div>
            <Result cut={teaser} />
            {status && (
              <div className="rounded-xl border border-brand-gold/40 bg-surface-elevated p-6 text-center">
                <p className="font-serif text-xl text-text-light">Registriere dich kostenlos und erhalte {limit} interaktive Smart-Pairings gratis.</p>
                <p className="mt-2 font-body text-sm text-text-secondary">Kein Abo, keine Kreditkarte — nur ein Konto bei der Steakakademie.</p>
                <Link
                  href="/auth/login?redirectTo=/aroma-matcher"
                  className="mt-4 inline-block rounded-lg bg-brand-fire px-6 py-3 font-sans text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-fire/90"
                >
                  Jetzt kostenlos registrieren
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Sperrzustand (Modal-Overlay) ─────────────────────────────── */}
        {loggedIn && locked && (
          <div className="absolute inset-0 z-20 flex items-start justify-center p-2 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
            <div className="w-full max-w-md rounded-xl border border-brand-gold/50 bg-surface-dark p-6 shadow-2xl">
              <div className="mb-3 flex items-center gap-2 text-brand-gold">
                <Lock size={18} />
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.22em]">Freikontingent verbraucht</span>
              </div>
              <h2 id="paywall-title" className="font-serif text-2xl text-text-light">Du hast deine {status?.limit ?? limit} kostenlosen Test-Pairings verbraucht.</h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-text-secondary">
                Schalte den unbegrenzten Zugriff auf die komplette Aroma-Matrix frei — mit allen Cuts, allen Clustern und künftigen Signature-Matches.
              </p>
              {waitlist === 'done' ? (
                <p className="mt-5 rounded-lg border border-brand-gold/40 bg-surface-elevated p-3 font-sans text-sm text-text-primary">
                  Du stehst auf der Warteliste. Wir melden uns, sobald die Aroma-Matrix freigeschaltet wird.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={joinWaitlist}
                  disabled={waitlist === 'sending'}
                  className="mt-5 w-full rounded-lg bg-brand-fire px-6 py-3 font-sans text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-fire/90 disabled:opacity-60"
                >
                  {waitlist === 'sending' ? 'Einen Moment …' : 'Auf die Warteliste setzen'}
                </button>
              )}
              {waitlist === 'error' && <p className="mt-2 font-sans text-xs text-brand-fire">Das hat nicht geklappt — bitte noch einmal versuchen.</p>}
              <p className="mt-3 text-center font-sans text-xs text-text-muted">
                Deine bereits analysierten Cuts bleiben dir erhalten.
              </p>
              {analysed.size > 0 && (
                <div className="mt-4 border-t border-border-subtle pt-3">
                  <p className="mb-2 font-sans text-[10px] uppercase tracking-wider text-text-muted">Noch einmal ansehen (kostenlos)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cuts.filter((c) => analysed.has(c.id)).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={async () => {
                          setLocked(false);
                          setSelected(c.id);
                          await analyse(c.id, true);
                        }}
                        className="rounded-full border border-border-subtle px-2.5 py-1 font-sans text-xs text-text-primary hover:border-brand-gold"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Zurück zur Sperre, wenn ein analysierter Cut nach dem Sperrzustand angesehen wird */}
      {loggedIn && !locked && remaining <= 0 && !status?.unlimited && result && (
        <button
          type="button"
          onClick={() => setLocked(true)}
          className="inline-flex items-center gap-1 font-sans text-xs text-text-muted hover:text-brand-fire"
        >
          <X size={12} /> Ansicht schließen
        </button>
      )}
    </div>
  );
}
