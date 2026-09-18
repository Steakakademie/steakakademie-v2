'use client';

import { useEffect, useMemo, useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { RotateCcw, Share2, ShoppingCart, ChevronRight, Check } from 'lucide-react';
import CutDnaRadar from './CutDnaRadar';
import CutImage from './CutImage';
import {
  OCCASION_LABEL,
  METHOD_LABEL,
  type Cut,
  type Occasion,
  type CookMethod,
  type Species,
} from '@/lib/cuts-catalog';
import { getMeatOffer } from '@/lib/cut-affiliate';
import type { CutRecipeRef } from '@/lib/cut-recipes';

interface CutGeneratorProps {
  bySpecies: Record<Species, Cut[]>;
  recipeMap: Record<string, CutRecipeRef[]>;
}

/**
 * Schwein ist vorübergehend ausgeblendet: Die Cut-Fotos für Schwein stammen aus
 * Händler-Produktbildern und sind nach der Rechts-Doktrin (siehe
 * public/images/cuts/CREDITS.md) nicht verwendbar. Sobald lizenzsaubere Fotos
 * vorliegen, genügt hier `true` — Katalog, Bewertung und Deep-Links bleiben intakt.
 */
const SHOW_PORK = false;

const ALL_SPECIES_TABS: { id: Species; label: string }[] = [
  { id: 'rind', label: '🐄 Rind' },
  { id: 'schwein', label: '🐖 Schwein' },
];

// Erst typisieren, dann filtern: .filter() direkt auf dem Array-Literal laesst
// TypeScript 'id' zu string verbreitern statt zu Species -> TS2322 im Build.
const SPECIES_TABS = ALL_SPECIES_TABS.filter((t) => SHOW_PORK || t.id !== 'schwein');

type Budget = 'spar' | 'mittel' | 'premium';
type Profile = 'zart' | 'marmoriert' | 'aromatisch' | 'mager';

interface Answers {
  occasion?: Occasion;
  budget?: Budget;
  method?: CookMethod;
  profile?: Profile;
}

const OCCASION_OPTS: Occasion[] = ['date', 'familie', 'gaeste', 'solo', 'meal-prep'];
const BUDGET_OPTS: { id: Budget; label: string; hint: string }[] = [
  { id: 'spar', label: 'Preisbewusst', hint: 'Geheimtipps & Sparcuts' },
  { id: 'mittel', label: 'Mittelklasse', hint: 'Solide Qualität' },
  { id: 'premium', label: 'Premium', hint: 'Das Beste vom Tier' },
];
const METHOD_OPTS: CookMethod[] = ['grill-direkt', 'pfanne', 'smoker', 'sous-vide', 'schmoren'];
const PROFILE_OPTS: { id: Profile; label: string; hint: string }[] = [
  { id: 'marmoriert', label: 'Marmoriert', hint: 'Saftig, viel Fett' },
  { id: 'zart', label: 'Butterzart', hint: 'Schmilzt im Mund' },
  { id: 'aromatisch', label: 'Aromatisch', hint: 'Kräftiger Rind-Geschmack' },
  { id: 'mager', label: 'Mager', hint: 'Wenig Fett, fitnessfreundlich' },
];

const STEPS = ['occasion', 'budget', 'method', 'profile'] as const;

function scoreCut(cut: Cut, a: Answers): number {
  let s = 0;
  if (a.occasion && cut.occasions.includes(a.occasion)) s += 3;
  if (a.method && cut.methods.includes(a.method)) s += 3;
  if (a.budget === 'spar') s += cut.price <= 2 ? 2 : cut.price >= 4 ? -3 : 0;
  if (a.budget === 'mittel') s += cut.price === 3 ? 2 : cut.price === 2 || cut.price === 4 ? 1 : 0;
  if (a.budget === 'premium') s += cut.price >= 4 ? 2 : cut.price === 3 ? 1 : 0;
  if (a.profile === 'zart') s += cut.dna.tenderness * 0.8;
  if (a.profile === 'marmoriert') s += cut.dna.marbling * 0.8;
  if (a.profile === 'aromatisch') s += cut.dna.flavor * 0.8;
  if (a.profile === 'mager') s += (6 - cut.dna.fat) * 0.8;
  return s;
}

export default function CutGenerator({ bySpecies, recipeMap }: CutGeneratorProps) {
  const [species, setSpecies] = useState<Species>('rind');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [resultId, setResultId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cuts = bySpecies[species];

  // Deep-Link: /cut-generator?cut=<id> springt direkt zum Ergebnis (für geteilte Links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('cut');
    if (!id) return;
    const inPork = SHOW_PORK && bySpecies.schwein.some((c) => c.id === id);
    const inBeef = bySpecies.rind.some((c) => c.id === id);
    if (inPork) setSpecies('schwein');
    if (inPork || inBeef) setResultId(id);
    // Alte geteilte Links auf Schwein-Cuts landen still auf dem Rind-Quiz,
    // statt auf eine leere Ansicht zu laufen.
  }, [bySpecies]);

  const switchSpecies = (s: Species) => {
    setSpecies(s);
    setAnswers({});
    setStep(0);
    setResultId(null);
  };

  const ranked = useMemo(() => {
    return [...cuts]
      .map((c) => ({ cut: c, score: scoreCut(c, answers) }))
      .sort((a, b) => b.score - a.score || a.cut.nameDE.localeCompare(b.cut.nameDE));
  }, [cuts, answers]);

  const result = resultId ? cuts.find((c) => c.id === resultId) ?? null : null;
  const alternatives = ranked.filter((r) => r.cut.id !== resultId).slice(0, 3).map((r) => r.cut);

  const choose = (patch: Partial<Answers>) => {
    const next = { ...answers, ...patch };
    setAnswers(next);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      const r = [...cuts].map((c) => ({ c, s: scoreCut(c, next) })).sort((a, b) => b.s - a.s)[0];
      setResultId(r.c.id);
    }
  };

  const reset = () => {
    setAnswers({});
    setStep(0);
    setResultId(null);
    setCopied(false);
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(null, '', '/cut-generator');
    }
  };

  const share = async () => {
    if (!result) return;
    const url = `${window.location.origin}/cut-generator?cut=${result.id}`;
    const text = `Mein perfekter Steak-Cut: ${result.nameDE} 🥩 — finde deinen auf der Steakakademie:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Mein Steak-Cut', text, url });
        return;
      }
    } catch {
      /* abgebrochen → Fallback */
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  };

  // ── Ergebnis-Ansicht ──────────────────────────────────────────────────────
  if (result) {
    const offer = getMeatOffer(result);
    const recipe = (recipeMap[result.id] ?? [])[0];
    return (
      <motion.div
        key="result"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-brand-gold/25 bg-surface-dark overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          <CutImage
            src={result.image}
            alt={`${result.nameDE} (${result.nameEN})`}
            label={result.nameDE}
            className="w-full aspect-[4/3] md:aspect-auto md:h-full min-h-[240px]"
            ai={result.imageAI}
          />
          <div className="p-6 sm:p-8">
            <span className="text-[10px] font-sans font-bold text-brand-fire uppercase tracking-[0.18em]">
              Dein perfekter Cut
            </span>
            <h2 className="font-serif text-3xl font-bold text-text-light mt-1.5">{result.nameDE}</h2>
            <p className="text-text-light/40 text-sm italic">{result.nameEN}</p>
            <p className="font-body text-text-light/75 text-sm leading-relaxed mt-3">{result.blurb}</p>

            <div className="mt-4">
              <CutDnaRadar dna={result.dna} size={200} />
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={offer.href}
              target="_blank"
              rel="nofollow sponsored noopener"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-fire text-white font-sans font-bold text-sm uppercase tracking-[0.04em] hover:brightness-110 transition"
            >
              <ShoppingCart size={16} /> {result.nameDE} kaufen
            </a>
            {recipe && (
              <Link
                href={recipe.url}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 border border-brand-gold/50 text-brand-gold font-sans font-bold text-sm uppercase tracking-[0.04em] hover:bg-brand-gold/10 transition"
              >
                Passendes Rezept <ChevronRight size={15} />
              </Link>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={share}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border-subtle text-text-light/70 font-sans font-bold text-xs uppercase tracking-[0.08em] hover:border-brand-gold/40 hover:text-brand-gold transition"
            >
              {copied ? <><Check size={15} /> Link kopiert</> : <><Share2 size={15} /> Ergebnis teilen</>}
            </button>
            <button
              onClick={reset}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border-subtle text-text-light/70 font-sans font-bold text-xs uppercase tracking-[0.08em] hover:border-brand-gold/40 hover:text-brand-gold transition"
            >
              <RotateCcw size={15} /> Nochmal
            </button>
          </div>
          <p className="text-text-light/30 text-[11px] font-sans leading-relaxed">{offer.disclosure}</p>
        </div>

        {/* Alternativen */}
        {alternatives.length > 0 && (
          <div className="border-t border-brand-gold/10 px-6 sm:px-8 py-6">
            <h3 className="text-[10px] font-sans font-bold text-text-light/40 uppercase tracking-[0.18em] mb-3">
              Passt auch zu dir
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {alternatives.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setResultId(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-left border border-border-subtle bg-surface-card hover:border-brand-gold/40 transition-colors overflow-hidden"
                >
                  <CutImage src={c.image} alt={c.nameDE} label={c.nameDE} className="aspect-[4/3]" ai={c.imageAI} />
                  <p className="font-serif text-xs font-bold text-text-light p-2 leading-tight">{c.nameDE}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // ── Quiz-Ansicht ──────────────────────────────────────────────────────────
  const current = STEPS[step];
  return (
    <div className="border border-brand-gold/20 bg-surface-dark p-6 sm:p-10">
      {/* Spezies-Umschalter — entfällt, solange nur eine Tierart verfügbar ist */}
      <div className={`flex items-center gap-2 mb-7 ${SPECIES_TABS.length < 2 ? 'hidden' : ''}`}>
        {SPECIES_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchSpecies(t.id)}
            className={`px-4 py-2 text-sm font-sans font-bold border transition-colors ${
              species === t.id
                ? 'bg-brand-gold/15 border-brand-gold/50 text-brand-gold'
                : 'border-border-subtle text-text-light/45 hover:border-brand-gold/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Fortschritt */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{ background: i <= step ? '#C8882A' : '#3a2818' }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-[10px] font-sans font-bold text-brand-fire uppercase tracking-[0.18em] mb-1">
            Frage {step + 1} / {STEPS.length}
          </p>

          {current === 'occasion' && (
            <Question title="Für welchen Anlass kochst du?">
              {OCCASION_OPTS.map((o) => (
                <OptBtn key={o} label={OCCASION_LABEL[o]} onClick={() => choose({ occasion: o })} active={answers.occasion === o} />
              ))}
            </Question>
          )}

          {current === 'budget' && (
            <Question title="Wie viel darf's kosten?">
              {BUDGET_OPTS.map((b) => (
                <OptBtn key={b.id} label={b.label} hint={b.hint} onClick={() => choose({ budget: b.id })} active={answers.budget === b.id} />
              ))}
            </Question>
          )}

          {current === 'method' && (
            <Question title="Wie willst du garen?">
              {METHOD_OPTS.map((m) => (
                <OptBtn key={m} label={METHOD_LABEL[m]} onClick={() => choose({ method: m })} active={answers.method === m} />
              ))}
            </Question>
          )}

          {current === 'profile' && (
            <Question title="Welcher Typ darf's sein?">
              {PROFILE_OPTS.map((p) => (
                <OptBtn key={p.id} label={p.label} hint={p.hint} onClick={() => choose({ profile: p.id })} active={answers.profile === p.id} />
              ))}
            </Question>
          )}
        </motion.div>
      </AnimatePresence>

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-6 text-xs font-sans text-text-light/40 hover:text-brand-gold transition-colors"
        >
          ← Zurück
        </button>
      )}
    </div>
  );
}

function Question({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-light mb-6 leading-tight">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </>
  );
}

function OptBtn({ label, hint, onClick, active }: { label: string; hint?: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 border transition-colors duration-150 group ${
        active
          ? 'border-brand-gold bg-brand-gold/10'
          : 'border-border-subtle bg-surface-card hover:border-brand-gold/40 hover:bg-surface-elevated'
      }`}
    >
      <span className="flex items-center justify-between">
        <span className="font-serif text-lg font-bold text-text-light">{label}</span>
        <ChevronRight size={16} className="text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
      {hint && <span className="block text-text-light/45 text-xs font-sans mt-0.5">{hint}</span>}
    </button>
  );
}
