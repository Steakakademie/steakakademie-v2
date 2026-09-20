'use client';

/**
 * Werkzeuge-Sektion der Startseite (Position 5, Konzept Uwe 19.09.2026,
 * Design-Canvas „Aroma-Matcher – Darstellung", Artboard „Startseite-B"):
 *   6 Kacheln 3×2 — Aroma-Matcher (Platz 1, Bild, Gold-Rahmen, NEU + VIP) ·
 *   Cut-Atlas · Foodpairing · Rezept-Schmiede · Hofladen-Radar · Räucherholz-Finder (BALD, VIP)
 *   darunter das Marco-Band „Sommelier am Grill" (öffnet den Chat per sk:marco-Event)
 *   darunter die ruhige VIP-Zeile → /vip (Warteliste).
 *
 * Hintergrund: Der Aroma-Matcher war vom 17.–20.09. nur im Footer verlinkt —
 * 0 Abfragen in drei Tagen. „Footer-Link als einziger Zugang geht gar nicht" (Uwe).
 *
 * „Jetzt mit Fallback": Foodpairing & Rezept-Schmiede rufen ihre Endpoints
 * (/api/foodpairing, /api/kochwissen/generieren) live auf. Solange die
 * Wissens-DB / Keys noch nicht scharf sind, fangen wir das sauber ab und
 * zeigen einen Demo-/„Bald verfügbar"-Zustand — nichts wirkt kaputt.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, FlaskConical, ChefHat, ChevronRight, Search, Loader2, Users, Plus, Minus, Radar, Wine, Trees, Crown } from 'lucide-react';
import LazyMarkdown from '@/components/ui/LazyMarkdown';
import MarcoStarter from '@/components/relaunch/MarcoStarter';

type Pairing = { partner: string; category: string | null; shared: number; shared_examples: string[] | null };

// Demo-Vorschau (verifizierte Aroma-Molekülbrücken aus foods-oa), bis die DB live ist.
const DEMO_PAIRINGS: Pairing[] = [
  { partner: 'Kaffee', category: 'geröstet', shared: 7, shared_examples: ['2-Methyl-3-furanthiol', 'Pyrazine'] },
  { partner: 'Kakao', category: 'geröstet', shared: 6, shared_examples: ['Pyrazine', 'Strecker-Aldehyde'] },
  { partner: 'Champignon', category: 'Gemüse', shared: 5, shared_examples: ['1-Octen-3-ol'] },
  { partner: 'Thunfisch', category: 'Fisch', shared: 4, shared_examples: ['2-Methyl-3-furanthiol'] },
  { partner: 'Röstzwiebel', category: 'Gemüse', shared: 4, shared_examples: ['Pyrazine'] },
];

function Bar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(8, Math.round((value / max) * 100));
  return (
    <span className="inline-block h-1.5 rounded-full bg-brand-gold/80" style={{ width: `${pct}%` }} aria-hidden />
  );
}

function FoodpairingBox({ onSeedRezept }: { onSeedRezept: (zutat: string, partner: string) => void }) {
  const [zutat, setZutat] = useState('');
  const [treffer, setTreffer] = useState<Pairing[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(false);

  async function suchen(e: React.FormEvent) {
    e.preventDefault();
    const q = zutat.trim();
    if (!q) return;
    setLoading(true);
    setTreffer(null);
    setDemo(false);
    try {
      const res = await fetch('/api/foodpairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zutat: q, limit: 6 }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.treffer) && data.treffer.length) {
        setTreffer(data.treffer);
      } else {
        setTreffer(DEMO_PAIRINGS);
        setDemo(true);
      }
    } catch {
      setTreffer(DEMO_PAIRINGS);
      setDemo(true);
    } finally {
      setLoading(false);
    }
  }

  const max = treffer?.reduce((m, t) => Math.max(m, t.shared), 1) ?? 1;

  return (
    <div className="flex flex-col rounded-xl border border-brand-gold/25 bg-surface-card p-5">
      <div className="flex items-center gap-2 mb-1.5 text-brand-fire">
        <FlaskConical size={18} />
        <h3 className="font-serif text-lg font-bold text-text-light">Foodpairing</h3>
      </div>
      <p className="text-xs text-text-secondary mb-3">Welche Aromen passen zusammen? Wissenschaftlich, über geteilte Moleküle.</p>

      <form onSubmit={suchen} className="flex gap-2">
        <input
          value={zutat}
          onChange={(e) => setZutat(e.target.value)}
          placeholder="z. B. Ribeye"
          className="flex-1 min-w-0 rounded-lg border border-border-subtle bg-surface-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-gold"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-fire px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin motion-reduce:animate-none" /> : <Search size={14} />} Finden
        </button>
      </form>

      {treffer && (
        <div className="mt-4 space-y-2">
          {demo && (
            <p className="text-[11px] text-text-muted italic">Vorschau-Beispiel — die Live-Datenbank wird gerade scharfgeschaltet.</p>
          )}
          {treffer.map((t) => (
            <div key={t.partner} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-text-light font-medium">{t.partner}</span>
                <button
                  type="button"
                  onClick={() => onSeedRezept(zutat, t.partner)}
                  className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-brand-gold hover:text-brand-fire"
                  title={`Rezept: ${zutat} mit ${t.partner}`}
                >
                  → Rezept
                </button>
              </div>
              <Bar value={t.shared} max={max} />
              <p className="text-[11px] text-text-muted truncate">
                {t.shared} Moleküle{t.shared_examples?.length ? ` · ${t.shared_examples.join(', ')}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const NIVEAUS = [
  { n: 1, label: '⭐ Einsteiger' },
  { n: 2, label: '⭐⭐ Fortgeschritten' },
  { n: 3, label: '⭐⭐⭐ Profi' },
] as const;

// ── Pro-Person-Engine ────────────────────────────────────────────────
// Der Generator liefert am Rezept-Ende einen ```zutaten-basis```-Block mit
// Mengen pro 1 Person. Wir parsen ihn, blenden ihn aus dem Markdown aus und
// rechnen die Personenzahl DETERMINISTISCH um (kein LLM, kein API-Call).
type ZutatBasis = { menge: number; einheit: string; name: string; skalierung?: 'linear' | 'fix' };

function parseZutatenBasis(md: string): { text: string; zutaten: ZutatBasis[] | null } {
  const m = md.match(/```zutaten-basis\s*([\s\S]*?)```/);
  if (!m) return { text: md, zutaten: null };
  const text = md.replace(m[0], '').trimEnd();
  try {
    const data = JSON.parse(m[1]);
    const roh = Array.isArray(data?.zutaten) ? data.zutaten : null;
    if (!roh?.length) return { text, zutaten: null };
    const zutaten: ZutatBasis[] = roh
      .filter((z: ZutatBasis) => z && typeof z.name === 'string' && Number.isFinite(Number(z.menge)))
      .map((z: ZutatBasis) => ({
        menge: Number(z.menge),
        einheit: String(z.einheit ?? ''),
        name: z.name,
        skalierung: z.skalierung === 'fix' ? 'fix' : 'linear',
      }));
    return { text, zutaten: zutaten.length ? zutaten : null };
  } catch {
    return { text, zutaten: null };
  }
}

// Skaliert 1-Personen-Menge auf n Personen; Kerntemperaturen/Zeiten skalieren nie.
function skaliere(z: ZutatBasis, personen: number): string {
  if (z.skalierung === 'fix') return z.menge > 0 && z.einheit ? `${fmtMenge(z.menge)} ${z.einheit}` : 'n. B.';
  let menge = z.menge * personen;
  let einheit = z.einheit;
  if (einheit === 'g' && menge >= 1000) { menge /= 1000; einheit = 'kg'; }
  if (einheit === 'ml' && menge >= 1000) { menge /= 1000; einheit = 'l'; }
  if (einheit === 'TL' && menge >= 3) { menge /= 3; einheit = 'EL'; }
  return `${fmtMenge(menge)} ${einheit}`.trim();
}

function fmtMenge(x: number): string {
  if (x >= 500) return String(Math.round(x / 5) * 5);
  if (x >= 100) return String(Math.round(x));
  if (x >= 10) return String(Math.round(x * 2) / 2).replace('.', ',');
  const r = Math.round(x * 100) / 100;
  return String(r).replace('.', ',');
}

function RezeptSchmiedeBox({ seed }: { seed: { auftrag: string; nonce: number } | null }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [auftrag, setAuftrag] = useState('');
  const [niveau, setNiveau] = useState<1 | 2 | 3>(2);
  const [personen, setPersonen] = useState(2);
  const [ergebnis, setErgebnis] = useState<string | null>(null);
  const [zutatenBasis, setZutatenBasis] = useState<ZutatBasis[] | null>(null);
  const [rezeptLinks, setRezeptLinks] = useState<{ titel: string; href: string }[]>([]);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Live-Sekundenzähler während der Generierung — beruhigt und setzt die Erwartung,
  // damit niemand vorzeitig abbricht.
  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  async function generate(text: string) {
    const q = text.trim();
    if (!q) return;
    setLoading(true);
    setErgebnis(null);
    setZutatenBasis(null);
    setRezeptLinks([]);
    setHinweis(null);
    try {
      const res = await fetch('/api/kochwissen/generieren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auftrag: q, niveau, personen, art: 'rezept' }),
      });
      const data = await res.json();
      if (res.ok && data.ergebnis) {
        const { text, zutaten } = parseZutatenBasis(String(data.ergebnis));
        setErgebnis(text);
        setZutatenBasis(zutaten);
        // Verkettung: Quellen aus unserer eigenen Rezeptwelt als Links anbieten
        // (Quelle-Format "Steakakademie-Rezept: /rezepte/<kategorie>/<slug>" aus dem Ingest).
        const PREFIX = 'Steakakademie-Rezept: ';
        const links = new Map<string, { titel: string; href: string }>();
        for (const q of Array.isArray(data.verwendete_quellen) ? data.verwendete_quellen : []) {
          const quelle = String(q?.quelle ?? '');
          if (!quelle.startsWith(PREFIX)) continue;
          const href = quelle.slice(PREFIX.length).trim();
          if (href.startsWith('/rezepte/') && !links.has(href)) {
            links.set(href, { titel: String(q.titel ?? href), href });
          }
        }
        setRezeptLinks(Array.from(links.values()).slice(0, 3));
      } else if (res.status === 401) {
        setHinweis('Die Rezept-Schmiede ist Mitgliedern vorbehalten — melde dich kostenlos an, dann schmiedet Marco dein Rezept.');
      } else if (res.status === 429) {
        setHinweis(String(data?.error ?? 'Zu viele Anfragen — bitte gleich noch einmal versuchen.'));
      } else {
        setHinweis('Die Rezept-Schmiede wird gerade scharfgeschaltet — gleich kannst du hier aus geprüftem Wissen Rezepte erzeugen.');
      }
    } catch {
      setHinweis('Die Rezept-Schmiede wird gerade scharfgeschaltet — gleich kannst du hier aus geprüftem Wissen Rezepte erzeugen.');
    } finally {
      setLoading(false);
    }
  }

  function erstellen(e: React.FormEvent) {
    e.preventDefault();
    generate(auftrag);
  }

  // Verkettung: eine Vorgabe aus der Foodpairing-Box füllt das Feld und erzeugt
  // direkt ein Rezept — der Loop Aroma → Gericht.
  useEffect(() => {
    if (!seed) return;
    setAuftrag(seed.auftrag);
    boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    generate(seed.auftrag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.nonce]);

  return (
    <div ref={boxRef} className="flex flex-col rounded-xl border border-brand-gold/25 bg-surface-card p-5">
      <div className="flex items-center gap-2 mb-1.5 text-brand-fire">
        <ChefHat size={18} />
        <h3 className="font-serif text-lg font-bold text-text-light">Rezept-Schmiede</h3>
      </div>
      <p className="text-xs text-text-secondary mb-3">Rezept aus geprüftem Wissen — in deinem Schwierigkeitsgrad.</p>

      <div className="flex gap-1.5 mb-2">
        {NIVEAUS.map(({ n, label }) => (
          <button
            key={n}
            type="button"
            onClick={() => setNiveau(n as 1 | 2 | 3)}
            className={`flex-1 rounded-md px-1 py-1.5 text-[11px] font-bold transition-colors ${
              niveau === n ? 'bg-brand-gold text-ink' : 'bg-surface-base text-text-muted hover:text-text-secondary'
            }`}
            title={label}
          >
            {'⭐'.repeat(n)}
          </button>
        ))}
      </div>

      {/* Personenzahl — Basis der Kalkulation ist immer 1 Person */}
      <div className="flex items-center justify-between gap-2 mb-2 rounded-md bg-surface-base px-2.5 py-1.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary">
          <Users size={12} className="text-brand-gold" /> Personen
        </span>
        <div className="flex items-center gap-2" role="group" aria-label="Personenzahl">
          <button
            type="button"
            onClick={() => setPersonen((p) => Math.max(1, p - 1))}
            disabled={personen <= 1}
            aria-label="Weniger Personen"
            className="w-6 h-6 flex items-center justify-center rounded border border-brand-gold/40 text-brand-gold hover:bg-brand-gold hover:text-ink disabled:opacity-30 transition-colors"
          >
            <Minus size={11} />
          </button>
          <span className="w-6 text-center text-sm font-bold text-text-light tabular-nums" aria-live="polite">
            {personen}
          </span>
          <button
            type="button"
            onClick={() => setPersonen((p) => Math.min(20, p + 1))}
            disabled={personen >= 20}
            aria-label="Mehr Personen"
            className="w-6 h-6 flex items-center justify-center rounded border border-brand-gold/40 text-brand-gold hover:bg-brand-gold hover:text-ink disabled:opacity-30 transition-colors"
          >
            <Plus size={11} />
          </button>
        </div>
      </div>

      <form onSubmit={erstellen} className="flex gap-2">
        <input
          value={auftrag}
          onChange={(e) => setAuftrag(e.target.value)}
          placeholder="z. B. Ribeye mit Kaffee-Kruste"
          className="flex-1 min-w-0 rounded-lg border border-border-subtle bg-surface-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-gold"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-fire px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin motion-reduce:animate-none" /> : <ChevronRight size={14} />} Erstellen
        </button>
      </form>

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-brand-gold">
          <Loader2 size={13} className="animate-spin motion-reduce:animate-none shrink-0" />
          <span>
            Claude schreibt dein Rezept … {elapsed}s{' '}
            <span className="text-text-muted">(meist 10–20 s)</span>
          </span>
        </div>
      )}
      {hinweis && (
        <p className="mt-3 text-[11px] text-text-muted italic">
          {hinweis}
          {hinweis.includes('Mitgliedern vorbehalten') && (
            <> <Link href="/auth/login" className="not-italic font-semibold text-brand-gold underline">Jetzt anmelden</Link></>
          )}
        </p>
      )}
      {ergebnis && (
        <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-border-subtle bg-surface-base p-3">
          {/* Live-Mengenrechner: Basis 1 Person, deterministisch skaliert */}
          {zutatenBasis && (
            <div className="mb-3 rounded-md border border-brand-gold/25 bg-surface-card p-2.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-gold">
                  <Users size={11} /> Mengen für {personen} {personen === 1 ? 'Person' : 'Personen'}
                </span>
                <span className="text-[10px] text-text-muted">Personen oben ändern — rechnet live um</span>
              </div>
              <ul className="grid grid-cols-1 gap-y-0.5 text-[12px] text-text-primary">
                {zutatenBasis.map((z) => (
                  <li key={z.name} className="flex justify-between gap-2">
                    <span className="truncate">{z.name}</span>
                    <span className="shrink-0 tabular-nums text-text-light font-medium">
                      {skaliere(z, personen)}
                      {z.skalierung === 'fix' && <span className="text-text-muted font-normal"> (n. B.)</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[10px] text-text-muted">
                Kern- & Gartemperaturen bleiben gleich — nur Mengen skalieren.
              </p>
            </div>
          )}
          <div className="prose prose-sm max-w-none prose-headings:text-text-light prose-headings:font-serif">
            <LazyMarkdown>{ergebnis}</LazyMarkdown>
          </div>
          {rezeptLinks.length > 0 && (
            <div className="mt-3 border-t border-border-subtle pt-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-gold mb-1.5">
                Erprobte Rezepte aus unserer Rezeptwelt
              </p>
              <ul className="space-y-1">
                {rezeptLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="inline-flex items-center gap-1 text-[12px] text-text-light hover:text-brand-fire"
                    >
                      <ChevronRight size={12} className="text-brand-gold shrink-0" /> {l.titel}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const KACHEL =
  'group flex flex-col rounded-xl border border-brand-gold/25 bg-surface-card p-5 hover:border-brand-gold transition-colors';

function Badge({ children, filled = false, muted = false }: { children: React.ReactNode; filled?: boolean; muted?: boolean }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] font-sans font-bold tracking-[0.18em] uppercase ${
        filled
          ? 'bg-brand-gold text-ink'
          : muted
            ? 'border border-border-subtle text-text-muted'
            : 'border border-brand-gold text-brand-gold'
      }`}
    >
      {children}
    </span>
  );
}

const MARCO_FRAGEN = [
  'Welcher Wein zum Dry-Aged Ribeye?',
  'Welches Bier zum Brisket?',
  'Alkoholfrei zum Tomahawk für 6 Gäste?',
];

export default function ToolBoxes({ freeLimit = 5 }: { freeLimit?: number }) {
  // Verkettung: Foodpairing → Rezept-Schmiede (nonce, damit auch gleiche Vorgabe erneut auslöst).
  const [seed, setSeed] = useState<{ auftrag: string; nonce: number } | null>(null);

  // Deeplink von Rezeptseiten (AromaPairing): /?schmiede=<Auftrag>#werkzeuge
  // startet die Rezept-Schmiede direkt mit dem Aroma-Auftrag.
  // window.location statt useSearchParams: kein Suspense-/SSG-Umbau nötig.
  useEffect(() => {
    const auftrag = new URLSearchParams(window.location.search).get('schmiede');
    if (auftrag?.trim()) setSeed({ auftrag: auftrag.trim(), nonce: Date.now() });
  }, []);

  return (
    <section id="werkzeuge" className="bg-surface-dark border-b border-brand-gold/15">
      <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-fire">
            <Flame size={12} /> Werkzeuge
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-light mt-2">
            Spiel mit Aromen, Cuts & Rezepten
          </h2>
        </div>

        {/* 6 Kacheln, 3×2 — Aroma-Matcher auf Platz 1 (Uwe, 19.09.2026) */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Aroma-Matcher — Platz 1, Bild, Gold-Rahmen, NEU + VIP */}
          <Link
            href="/aroma-matcher"
            className="group flex flex-col overflow-hidden rounded-xl border-2 border-brand-gold bg-surface-card hover:bg-surface-elevated transition-colors"
          >
            <div className="relative h-32 w-full">
              <Image
                src="/images/cuts/ribeye.jpg"
                alt="Dry-Aged Ribeye — Ausgangspunkt des Aroma-Matchers"
                fill
                sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-2 flex gap-2">
                <Badge>Neu</Badge>
                <Badge filled>VIP</Badge>
              </div>
              <div className="flex items-center gap-2 mb-1.5 text-brand-fire">
                <Wine size={18} />
                <h3 className="font-serif text-lg font-bold text-text-light">Aroma-Matcher</h3>
              </div>
              <p className="text-xs text-text-secondary mb-2">
                Was passt zu deinem Cut? Rub, Holz und das passende Glas — mit einem Satz, warum.
              </p>
              <p className="text-[11px] text-text-muted mb-4">{freeLimit} Cuts gratis · VIP ohne Limit</p>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand-gold group-hover:gap-2 transition-[gap]">
                Cut wählen <ChevronRight size={14} />
              </span>
            </div>
          </Link>

          {/* Cut-Atlas → bestehende Cut-Welt */}
          <Link href="/cuts" className={KACHEL}>
            <div className="flex items-center gap-2 mb-1.5 text-brand-fire">
              <Flame size={18} />
              <h3 className="font-serif text-lg font-bold text-text-light">Cut-Atlas</h3>
            </div>
            <p className="text-xs text-text-secondary mb-4">
              Jeder Cut erklärt — Lage, Muskel, Marmorierung und der perfekte Garpunkt.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand-gold group-hover:gap-2 transition-[gap]">
              Entdecken <ChevronRight size={14} />
            </span>
          </Link>

          <FoodpairingBox
            onSeedRezept={(z, p) => setSeed({ auftrag: `${z} mit ${p}`, nonce: Date.now() })}
          />
          <RezeptSchmiedeBox seed={seed} />

          {/* Hofladen-Radar → Fleisch direkt vom Erzeuger (/hoefe) */}
          <Link href="/hoefe" className={KACHEL}>
            <div className="flex items-center gap-2 mb-1.5 text-brand-fire">
              <Radar size={18} />
              <h3 className="font-serif text-lg font-bold text-text-light">Hofladen-Radar</h3>
            </div>
            <p className="text-xs text-text-secondary mb-4">
              Fleisch direkt vom Erzeuger — Höfe in deiner Nähe, Fleischangebot und Bio auf einen Blick.
              Deutschland, Österreich und die Schweiz.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand-gold group-hover:gap-2 transition-[gap]">
              Höfe finden <ChevronRight size={14} />
            </span>
          </Link>

          {/* Räucherholz-Finder — noch nicht gebaut (Uwe-Angaben offen), deshalb kein Link */}
          <div className="flex flex-col rounded-xl border border-border-subtle bg-surface-card/60 p-5" aria-label="Räucherholz-Finder — bald verfügbar">
            <div className="mb-2 flex gap-2">
              <Badge muted>Bald</Badge>
              <Badge filled>VIP</Badge>
            </div>
            <div className="flex items-center gap-2 mb-1.5 text-text-muted">
              <Trees size={18} />
              <h3 className="font-serif text-lg font-bold text-text-light/80">Räucherholz-Finder</h3>
            </div>
            <p className="text-xs text-text-secondary mb-4">
              Welches Holz zu welchem Grillgut — mit Dosierung und Warnliste der ungeeigneten Hölzer.
            </p>
            <span className="mt-auto text-[11px] text-text-muted">Erscheint für VIP-SteakAkademiker.</span>
          </div>
        </div>

        {/* Marco-Band „Sommelier am Grill" — plakativ, aber dezent (Uwe, 19.09.2026) */}
        <div className="mt-6 grid overflow-hidden rounded-xl border border-brand-gold/60 bg-surface-card lg:grid-cols-12">
          <div className="flex items-start gap-5 p-6 sm:p-8 lg:col-span-7">
            <Image
              src="/images/authors/marco-richter.jpg"
              alt="Marco — KI-Grillmeister der Steakakademie"
              width={96}
              height={96}
              className="h-20 w-20 shrink-0 rounded-full border-2 border-brand-gold object-cover sm:h-24 sm:w-24"
            />
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-gold">
                <Wine size={12} /> Sommelier am Grill
              </span>
              <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-bold leading-tight text-text-light">
                Frag Marco, was ins Glas gehört.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Wein, Bier, Cocktail oder alkoholfrei: Marco empfiehlt, was zu Cut, Garstufe, Rub und Sauce
                passt — und sagt dir, warum. Zu jedem Drink gibt es eine alkoholfreie Alternative.
              </p>
              <p className="mt-3 text-[11px] text-text-muted">
                KI-Grillmeister · fachlich verantwortet von Uwe Yendell
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2 border-t border-brand-gold/20 p-6 sm:p-8 lg:col-span-5 lg:border-l lg:border-t-0">
            {MARCO_FRAGEN.map((frage) => (
              <MarcoStarter
                key={frage}
                frage={frage}
                className="rounded-lg border border-border-subtle bg-surface-base px-4 py-2.5 text-left text-sm text-text-light hover:border-brand-gold hover:text-brand-gold transition-colors"
              >
                „{frage}“
              </MarcoStarter>
            ))}
            <MarcoStarter
              frage=""
              className="mt-1 rounded-lg bg-brand-fire px-5 py-3 text-center text-sm font-bold uppercase tracking-wide text-white hover:opacity-90 transition-opacity"
            >
              Marco fragen
            </MarcoStarter>
          </div>
        </div>

        {/* VIP-Zeile — ruhig, ganz unten; führt auf die Warteliste (/vip) */}
        <Link
          href="/vip"
          className="group mt-4 flex flex-col gap-3 rounded-xl border border-border-subtle border-l-[3px] border-l-brand-gold bg-surface-card/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between hover:border-brand-gold/60 transition-colors"
        >
          <span className="flex items-center gap-3 text-sm text-text-secondary">
            <Badge filled>VIP</Badge>
            <span>
              <span className="font-semibold text-text-light">VIP-SteakAkademiker:</span> Aroma-Matcher ohne Limit,
              Räucherholz-Finder komplett, Profi-Rezepte grammgenau.
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand-gold group-hover:gap-2 transition-[gap]">
            <Crown size={13} /> 49 € im Jahr · Mehr erfahren <ChevronRight size={14} />
          </span>
        </Link>
      </div>
    </section>
  );
}
