'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Lock, Hammer, BookOpen, Sparkles } from 'lucide-react';
import type { AstId, BlattOeffentlich, Einsatzform, MutterrezeptSicht } from '@/lib/mutterrezepte/typen';

/**
 * Der Pairing-Baum eines Mutterrezepts (Konzept vom 21.10.2026).
 *
 * Desktop: radialer Baum — Grundrezept in der Mitte, Äste nach Grillgut,
 * Blätter als Punkte (Buchstabe = Einsatzform), Detail rechts daneben.
 * Mobil: Ast-Chips und aufklappbare Karten — 48 Punkte im Kreis sind am
 * Telefon nicht lesbar.
 *
 * Die Seite liefert nur die öffentliche Sicht. Beim Laden fragt die
 * Komponente die Vollansicht an; 403 heißt: bleibt öffentlich.
 */

const FARBE: Record<Einsatzform, { bg: string; fg: string }> = {
  dip: { bg: '#FCCD32', fg: '#0F0A06' },
  klecks: { bg: '#F0E8D8', fg: '#0F0A06' },
  spiegel: { bg: '#EE8C14', fg: '#0F0A06' },
  dressing: { bg: '#7FC8B8', fg: '#0F0A06' },
  aufstrich: { bg: '#B9A0E0', fg: '#0F0A06' },
  marinade: { bg: '#D04E08', fg: '#F0E8D8' },
  warm: { bg: '#A8280C', fg: '#F0E8D8' },
};

const TYP_LABEL = { rezept: 'Rezept auf der Seite', schmiede: 'Schmiede-Auftrag', pairing: 'Pairing-Tipp' } as const;

const FORMEN_REIHE: Einsatzform[] = ['dip', 'klecks', 'spiegel', 'dressing', 'aufstrich', 'marinade', 'warm'];

// Geometrie des Baums in einem 1000er-Raster (Prozent = Wert / 10).
const MITTE = 500;
const R_AST = 250;
const R_BLATT = [390, 445];
const SEKTOR = 17;

function punkt(gradzahl: number, r: number) {
  const rad = (gradzahl * Math.PI) / 180;
  return { x: MITTE + r * Math.cos(rad), y: MITTE + r * Math.sin(rad) };
}

function Punkt({ form, hohl, size = 12 }: { form: Einsatzform; hohl?: boolean; size?: number }) {
  const f = FARBE[form];
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: hohl ? 'transparent' : f.bg,
        border: hohl ? `2px solid ${f.bg}` : '1px solid rgba(240,232,216,0.35)',
      }}
    />
  );
}

function BlattDetail({
  blatt,
  sicht,
  rezepte,
}: {
  blatt: BlattOeffentlich;
  sicht: MutterrezeptSicht;
  rezepte: Record<string, { titel: string; url: string }>;
}) {
  const form = sicht.formen[blatt.form];
  const ast = sicht.aeste.find((a) => a.id === blatt.ast);
  const farbe = FARBE[blatt.form];

  return (
    <div>
      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold">
        {ast?.name} · {form.label}
      </p>
      <h3 className="mt-1 font-serif text-2xl font-bold leading-tight text-text-light">{blatt.name}</h3>
      <div className="mt-3 flex flex-wrap gap-2 font-sans text-xs">
        <span className="rounded-full px-2.5 py-1 font-semibold" style={{ background: farbe.bg, color: farbe.fg }}>
          {form.label}
        </span>
        <span className="rounded-full border border-border-subtle px-2.5 py-1 text-text-secondary">{blatt.land}</span>
        <span className="rounded-full border border-border-subtle px-2.5 py-1 text-text-secondary">{TYP_LABEL[blatt.typ]}</span>
      </div>

      {blatt.gesperrt ? (
        <div className="mt-5 rounded-xl border border-brand-gold/40 bg-surface-elevated p-5 text-center">
          <Lock className="mx-auto text-brand-gold" size={24} aria-hidden="true" />
          <p className="mt-2 font-serif text-lg font-bold text-text-light">Dieser Einsatz ist Teil des VIP-Passes</p>
          <p className="mt-1 font-body text-sm leading-relaxed text-text-secondary">
            Abwandlung in Gramm, Wassermenge für die Konsistenz und die Verknüpfung zum Rezept.
          </p>
          <Link
            href="/vip#warteliste"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-fire px-5 font-sans text-sm font-bold text-surface-dark transition-colors hover:bg-brand-gold"
          >
            Auf die VIP-Warteliste
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-4 font-body leading-relaxed text-text-primary">{blatt.warum}</p>
          <div className="mt-4 rounded-xl bg-surface-elevated p-4">
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold">
              Abwandlung · auf eine Grundmenge (ca. 300 g)
            </p>
            <p className="mt-1 font-body text-sm leading-relaxed text-text-primary">{blatt.abwandlung}</p>
          </div>
          {blatt.wasserGramm != null && (
            <div className="mt-3 rounded-xl bg-surface-elevated p-4">
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold">
                Konsistenz für {form.label}
              </p>
              <p className="mt-1 font-body text-sm leading-relaxed text-text-primary">
                150 g Cashews + <strong className="text-text-light">{blatt.wasserGramm} g Wasser</strong> — {form.ergebnis}
              </p>
            </div>
          )}
          {blatt.typ === 'rezept' && blatt.rezeptSlug && rezepte[blatt.rezeptSlug] && (
            <Link
              href={rezepte[blatt.rezeptSlug].url}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-fire px-4 font-sans text-sm font-bold text-surface-dark transition-colors hover:bg-brand-gold"
            >
              <BookOpen size={16} aria-hidden="true" /> Zum Rezept: {rezepte[blatt.rezeptSlug].titel}
            </Link>
          )}
          {blatt.typ === 'schmiede' && blatt.schmiedeAuftrag && (
            <Link
              href={`/?schmiede=${encodeURIComponent(blatt.schmiedeAuftrag)}#werkzeuge`}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-fire px-4 font-sans text-sm font-bold text-surface-dark transition-colors hover:bg-brand-gold"
            >
              <Hammer size={16} aria-hidden="true" /> In der Rezept-Schmiede schmieden
            </Link>
          )}
          <p className="mt-4 font-sans text-xs leading-relaxed text-text-muted">
            {blatt.ableitung && blatt.quelle && (
              <>
                Eigene Ableitung der Steakakademie, angeregt durch{' '}
                <a href={blatt.quelle.url} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-brand-fire">
                  {blatt.quelle.name}
                </a>
                .
              </>
            )}
            {blatt.ableitung && !blatt.quelle && <>Eigene Kombination der Steakakademie.</>}
            {!blatt.ableitung && !blatt.quelle && blatt.herkunft && <>{blatt.herkunft}</>}
            {!blatt.ableitung && blatt.quelle && (
              <>
                Idee gefunden bei{' '}
                <a href={blatt.quelle.url} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-brand-fire">
                  {blatt.quelle.name}
                </a>
                .
              </>
            )}{' '}
            Grammangaben der Abwandlung sind Richtwerte, nicht probegekocht.
          </p>
        </>
      )}
    </div>
  );
}

export default function MutterrezeptBaum({
  start,
  rezepte,
}: {
  start: MutterrezeptSicht;
  rezepte: Record<string, { titel: string; url: string }>;
}) {
  const [sicht, setSicht] = useState<MutterrezeptSicht>(start);
  const ersteFreie = start.blaetter.find((b) => !b.gesperrt) ?? start.blaetter[0];
  const [astId, setAstId] = useState<AstId>(ersteFreie.ast);
  const [blattId, setBlattId] = useState<string | null>(ersteFreie.id);
  const [filter, setFilter] = useState<Einsatzform | 'alle'>('alle');

  // Vollansicht nachladen — 403 ist der Normalfall und kein Fehler.
  useEffect(() => {
    let aktiv = true;
    fetch(`/api/mutterrezepte/${start.slug}`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? (r.json() as Promise<MutterrezeptSicht>) : null))
      .then((voll) => {
        if (aktiv && voll?.vollzugriff) setSicht(voll);
      })
      .catch(() => {});
    return () => {
      aktiv = false;
    };
  }, [start.slug]);

  const blatt = sicht.blaetter.find((b) => b.id === blattId) ?? null;
  const astBlaetter = sicht.blaetter.filter((b) => b.ast === astId);
  const freiAnzahl = sicht.blaetter.filter((b) => !b.gesperrt).length;

  const geo = useMemo(() => {
    const schritt = 360 / sicht.aeste.length;
    return sicht.aeste.map((a, i) => {
      const grad = -90 + i * schritt;
      const knoten = punkt(grad, R_AST);
      const blaetter = sicht.blaetter.filter((b) => b.ast === a.id);
      const n = blaetter.length;
      return {
        ast: a,
        knoten,
        blaetter: blaetter.map((b, k) => ({
          blatt: b,
          pos: punkt(grad - SEKTOR + (2 * SEKTOR * (k + 0.5)) / n, R_BLATT[k % 2]),
        })),
      };
    });
  }, [sicht]);

  function waehleAst(id: AstId) {
    setAstId(id);
    const erstes = sicht.blaetter.find((b) => b.ast === id);
    setBlattId(erstes?.id ?? null);
  }

  function waehleBlatt(b: BlattOeffentlich) {
    setAstId(b.ast);
    setBlattId(b.id);
  }

  const passt = (b: BlattOeffentlich) => filter === 'alle' || b.form === filter;

  return (
    <div>
      {sicht.vollzugriff && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-lg border border-brand-gold/50 bg-surface-elevated px-3 py-2 font-sans text-xs text-text-secondary">
          <Sparkles size={14} className="text-brand-gold" aria-hidden="true" /> Vollansicht aktiv — alle Einsätze und Grammangaben sichtbar.
        </p>
      )}

      {/* Filter nach Einsatzform — zugleich die Legende */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Nach Einsatzform filtern">
        <button
          type="button"
          onClick={() => setFilter('alle')}
          aria-pressed={filter === 'alle'}
          className={`min-h-[40px] rounded-full border px-3.5 font-sans text-sm transition-colors ${filter === 'alle' ? 'border-text-light bg-text-light text-surface-dark' : 'border-border-subtle text-text-primary hover:border-brand-gold'}`}
        >
          Alle Einsatzformen
        </button>
        {FORMEN_REIHE.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3.5 font-sans text-sm transition-colors ${filter === f ? 'border-text-light bg-text-light text-surface-dark' : 'border-border-subtle text-text-primary hover:border-brand-gold'}`}
          >
            <Punkt form={f} /> {sicht.formen[f].label}
            <span className="font-bold opacity-70">{sicht.formen[f].kuerzel}</span>
          </button>
        ))}
      </div>
      {!sicht.vollzugriff && (
        <p className="mt-3 font-sans text-xs text-text-muted">
          Gefüllte Punkte sind frei ({freiAnzahl} von {sicht.blaetter.length}), hohle Punkte gehören zum VIP-Pass.
        </p>
      )}

      {/* ── Desktop: radialer Baum + Detail ── */}
      <div className="mt-6 hidden gap-8 lg:grid lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="relative mx-auto aspect-square w-full max-w-[720px]">
            <svg viewBox="0 0 1000 1000" className="absolute inset-0 h-full w-full" aria-hidden="true">
              {geo.map(({ ast, knoten, blaetter }) => {
                const aktiv = ast.id === astId;
                return (
                  <g key={ast.id}>
                    <line
                      x1={MITTE}
                      y1={MITTE}
                      x2={knoten.x}
                      y2={knoten.y}
                      stroke={aktiv ? '#EE8C14' : 'rgba(200,136,42,0.35)'}
                      strokeWidth={aktiv ? 2 : 1}
                      vectorEffect="non-scaling-stroke"
                    />
                    {blaetter.map(({ blatt: b, pos }) => (
                      <line
                        key={b.id}
                        x1={knoten.x}
                        y1={knoten.y}
                        x2={pos.x}
                        y2={pos.y}
                        stroke={aktiv ? 'rgba(238,140,20,0.6)' : 'rgba(200,136,42,0.16)'}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                  </g>
                );
              })}
            </svg>

            <div
              className="absolute flex aspect-square w-[24%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-brand-gold bg-surface-card text-center"
              style={{ left: '50%', top: '50%' }}
            >
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">Mutterrezept</span>
              <span className="mt-1 font-serif text-xl font-bold leading-tight text-text-light">{sicht.zentrum}</span>
            </div>

            {geo.map(({ ast, knoten }) => {
              const aktiv = ast.id === astId;
              return (
                <button
                  key={ast.id}
                  type="button"
                  onClick={() => waehleAst(ast.id)}
                  aria-pressed={aktiv}
                  aria-label={`Ast ${ast.name}`}
                  className={`absolute min-h-[36px] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-3 font-sans text-xs font-semibold uppercase tracking-wide transition-colors ${aktiv ? 'border-brand-fire bg-brand-fire text-surface-dark' : 'border-brand-gold/60 bg-surface-card text-text-light hover:border-brand-fire'}`}
                  style={{ left: `${knoten.x / 10}%`, top: `${knoten.y / 10}%` }}
                >
                  {ast.kurz}
                </button>
              );
            })}

            {geo.flatMap(({ ast, blaetter }) =>
              blaetter.map(({ blatt: b, pos }) => {
                const f = FARBE[b.form];
                const gewaehlt = b.id === blattId;
                const opacity = !passt(b) ? 0.15 : ast.id === astId || gewaehlt ? 1 : 0.55;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => waehleBlatt(b)}
                    aria-pressed={gewaehlt}
                    aria-label={`${b.name} — ${sicht.formen[b.form].label}${b.gesperrt ? ' (VIP)' : ''}`}
                    title={b.name}
                    className="absolute flex h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-sans text-[10px] font-bold leading-none transition-opacity"
                    style={{
                      left: `${pos.x / 10}%`,
                      top: `${pos.y / 10}%`,
                      opacity,
                      background: b.gesperrt ? '#0F0A06' : f.bg,
                      color: b.gesperrt ? f.bg : f.fg,
                      border: b.gesperrt ? `2px solid ${f.bg}` : '1px solid rgba(240,232,216,0.35)',
                      boxShadow: gewaehlt ? '0 0 0 3px #0F0A06, 0 0 0 5px #F0E8D8' : 'none',
                    }}
                  >
                    {sicht.formen[b.form].kuerzel}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-brand-gold/30 bg-surface-card p-6">
            {blatt ? (
              <BlattDetail blatt={blatt} sicht={sicht} rezepte={rezepte} />
            ) : (
              <p className="font-body text-text-secondary">Wähle einen Punkt im Baum.</p>
            )}
            <div className="my-5 h-px bg-border-subtle" />
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold">
              Am Ast {sicht.aeste.find((a) => a.id === astId)?.name} · {astBlaetter.length} Einsätze
            </p>
            <ul className="mt-2 space-y-1">
              {astBlaetter.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => waehleBlatt(b)}
                    aria-pressed={b.id === blattId}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg border px-3 text-left font-body text-sm transition-colors ${b.id === blattId ? 'border-brand-fire bg-surface-elevated text-text-light' : 'border-transparent text-text-primary hover:bg-surface-elevated'}`}
                  >
                    <Punkt form={b.form} hohl={b.gesperrt} />
                    <span className="flex-1">{b.name}</span>
                    <span className="font-sans text-xs text-text-muted">{b.gesperrt ? 'VIP' : sicht.formen[b.form].label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* ── Mobil: Ast-Chips + Karten ── */}
      <div className="mt-6 lg:hidden">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="group" aria-label="Ast wählen">
          {sicht.aeste.map((a) => {
            const aktiv = a.id === astId;
            const anzahl = sicht.blaetter.filter((b) => b.ast === a.id).length;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => waehleAst(a.id)}
                aria-pressed={aktiv}
                className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full border px-4 font-sans text-sm transition-colors ${aktiv ? 'border-brand-fire bg-brand-fire text-surface-dark' : 'border-brand-gold/60 bg-surface-card text-text-light'}`}
              >
                {a.name} · {anzahl}
              </button>
            );
          })}
        </div>
        <ul className="mt-3 space-y-2">
          {astBlaetter.filter(passt).map((b) => {
            const offen = b.id === blattId;
            return (
              <li key={b.id} className={`rounded-xl border bg-surface-card ${offen ? 'border-brand-fire' : 'border-border-subtle'}`}>
                <button
                  type="button"
                  onClick={() => setBlattId(offen ? null : b.id)}
                  aria-expanded={offen}
                  className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left font-body text-[15px] text-text-light"
                >
                  <Punkt form={b.form} hohl={b.gesperrt} size={14} />
                  <span className="flex-1">{b.name}</span>
                  <span className="font-sans text-xs text-text-muted">{b.gesperrt ? 'VIP' : sicht.formen[b.form].label}</span>
                </button>
                {offen && (
                  <div className="border-t border-border-subtle px-4 pb-5 pt-4">
                    <BlattDetail blatt={b} sicht={sicht} rezepte={rezepte} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Konsistenz-Regler ── */}
      <section className="mt-12" aria-labelledby="konsistenz-regler">
        <h2 id="konsistenz-regler" className="font-serif text-2xl font-bold text-text-light">
          Konsistenz-Regler
        </h2>
        <p className="mt-2 max-w-2xl font-body text-text-secondary">
          Dieselbe Grundmenge, andere Wassermenge — so wird aus der Creme ein Aufstrich, ein Dip oder ein Dressing.
          Basis: 150 g Cashews.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {FORMEN_REIHE.map((f) => {
            const info = sicht.formen[f];
            return (
              <li key={f} className="rounded-xl border border-border-subtle bg-surface-card p-3">
                <span className="flex items-center gap-2 font-sans text-xs font-semibold text-text-light">
                  <Punkt form={f} /> {info.label}
                </span>
                <span className="mt-2 block font-serif text-xl font-bold text-text-light">
                  {info.wasserGramm != null ? `${info.wasserGramm} g` : <Lock size={16} className="text-brand-gold" aria-label="im VIP-Pass" />}
                </span>
                <span className="mt-1 block font-sans text-xs leading-snug text-text-muted">{info.ergebnis}</span>
              </li>
            );
          })}
        </ul>
        {!sicht.vollzugriff && (
          <p className="mt-3 font-sans text-xs text-text-muted">
            Die Wassermengen in Gramm gehören zum VIP-Pass.{' '}
            <Link href="/vip#warteliste" className="underline hover:text-brand-fire">
              Zur Warteliste
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
