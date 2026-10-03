'use client';

import { useRef, useState } from 'react';
import HoneypotFeld, { honeypotWert } from '@/components/ui/HoneypotFeld';
import Turnstile, { TURNSTILE_SITE_KEY, turnstileReset } from '@/components/ui/Turnstile';
import { experimental_useObject as useObject } from 'ai/react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, AlertTriangle, XCircle,
  TrendingUp, Target, Users, Trophy, Lightbulb,
  ChevronRight, Loader2, Mail, Check,
} from 'lucide-react';
import {
  NicheAnalysisSchema,
  type NicheAnalysis,
  VERDICT_STYLE,
  BUYING_POWER_DOTS,
} from '@/lib/niche-validator/schema';

const STAGE_MESSAGES = [
  'Calibrating market lens …',
  'Sweeping SERPs for incumbents …',
  'Mapping audience archetypes …',
  'Modeling 12-month revenue arc …',
  'Distilling the contrarian angle …',
];

export default function NicheValidator() {
  const [niche, setNiche] = useState('');
  const [stage, setStage] = useState(0);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadConsent, setLeadConsent] = useState(false);
  const [leadState, setLeadState] = useState<'idle' | 'sending' | 'success'>('idle');

  const { object, submit, isLoading, error, stop } = useObject({
    api: '/api/niche-validator/analyze',
    schema: NicheAnalysisSchema,
  });

  // Cycle stage messages while loading
  if (isLoading && typeof window !== 'undefined') {
    setTimeout(() => {
      setStage(s => (s < STAGE_MESSAGES.length - 1 ? s + 1 : s));
    }, 1800);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!niche.trim() || isLoading) return;
    setStage(0);
    setLeadState('idle');
    submit({ niche: niche.trim() });
  }

  const leadFormRef = useRef<HTMLFormElement>(null);
  const [leadTurnstile, setLeadTurnstile] = useState('');
  const [leadFehler, setLeadFehler] = useState(false);

  async function handleLead(e: React.FormEvent) {
    e.preventDefault();
    if (!leadEmail || !object?.niche || leadState !== 'idle') return;
    setLeadState('sending');
    setLeadFehler(false);
    try {
      const res = await fetch('/api/niche-validator/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadEmail,
          niche: object.niche,
          verdict: object.verdict?.decision,
          difficulty: object.difficulty?.overall,
          consent: true,
          website: honeypotWert(leadFormRef.current),
          turnstileToken: leadTurnstile,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setLeadState('success');
    } catch {
      turnstileReset();
      setLeadState('idle');
      // 03.10.2026: Vorher sprang das Formular wortlos zurück. Seit die Route
      // ehrlich scheitert (keine Mail → kein success), muss man das auch sehen.
      setLeadFehler(true);
    }
  }

  // Build typed view of streaming object (treat partials safely)
  const a = object as Partial<NicheAnalysis> | undefined;
  const verdictStyle = a?.verdict?.decision ? VERDICT_STYLE[a.verdict.decision] : null;

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">

      {/* ── Hero / Input ─────────────────────────────────────────────────── */}
      <section className="border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
          <div className="text-center mb-10">
            <p className="text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-fire mb-3">
              An AuthorityOS Tool · Free
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-text-primary leading-tight">
              The Niche Authority Validator.
            </h1>
            <p className="mt-4 text-base sm:text-lg font-body text-text-secondary max-w-xl mx-auto leading-relaxed">
              A 45-second strategic audit of any niche.
              Built by the system that runs <a href="https://steakakademie.de" className="underline decoration-brand-gold/60 underline-offset-2 hover:text-brand-gold">steakakademie.de</a>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <input
                type="text"
                value={niche}
                onChange={e => setNiche(e.target.value)}
                placeholder="single-origin coffee · mechanical keyboards · sourdough · whisky pairing …"
                disabled={isLoading}
                maxLength={120}
                className="
                  w-full bg-surface-elevated border border-border-subtle
                  px-5 py-5 sm:py-6 text-base sm:text-lg font-body text-text-primary
                  placeholder:text-text-muted/55
                  focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/25
                  transition-colors
                  disabled:opacity-60
                "
                autoFocus
              />
              <button
                type="submit"
                disabled={!niche.trim() || isLoading}
                className="
                  absolute right-2 top-1/2 -translate-y-1/2
                  bg-brand-gold hover:bg-[#b07020] active:bg-[#9a6010]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  text-ink font-sans font-bold text-xs tracking-[0.14em] uppercase
                  px-5 sm:px-7 py-3 transition-colors
                  flex items-center gap-2
                "
              >
                {isLoading ? (
                  <><Loader2 size={13} className="animate-spin motion-reduce:animate-none" /> Analyzing</>
                ) : (
                  <>Analyze <ArrowRight size={13} /></>
                )}
              </button>
            </div>

            {error && (
              <p className="mt-3 text-xs font-sans text-brand-fire">
                {error.message || 'Analysis failed. Try again in a moment.'}
              </p>
            )}
          </form>

          {/* Trust line */}
          <div className="mt-8 flex items-center justify-center gap-6 flex-wrap text-[10px] font-sans tracking-[0.14em] uppercase text-text-muted/60">
            <span>Powered by Claude Sonnet</span>
            <span className="hidden sm:inline">·</span>
            <span>No login required</span>
            <span className="hidden sm:inline">·</span>
            <span>Results in &lt; 60 seconds</span>
          </div>
        </div>
      </section>

      {/* ── Loading State ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isLoading && !a?.verdict && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto px-6 py-16"
          >
            <div className="flex items-center gap-3 text-text-muted">
              <Loader2 size={14} className="animate-spin motion-reduce:animate-none text-brand-gold" />
              <span className="text-sm font-sans tracking-wide">
                {STAGE_MESSAGES[stage]}
              </span>
            </div>
            <div className="mt-8 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-surface-elevated/40 border border-border-subtle/40 animate-pulse motion-reduce:animate-none"
                />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {a && (
        <section className="max-w-3xl mx-auto px-6 py-12 sm:py-16 space-y-10">

          {/* Header */}
          {a.niche && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-b border-border-subtle pb-6"
            >
              <p className="text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-fire mb-2">
                Analysis Brief
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
                {a.niche}
              </h2>
            </motion.div>
          )}

          {/* ── Verdict Card ── */}
          {a.verdict?.decision && verdictStyle && (
            <ResultCard
              icon={
                a.verdict.decision === 'Go'      ? <CheckCircle2 size={18} className={verdictStyle.color} /> :
                a.verdict.decision === 'Caution' ? <AlertTriangle size={18} className={verdictStyle.color} /> :
                                                   <XCircle size={18} className={verdictStyle.color} />
              }
              label="Verdict"
            >
              <div className={`border ${verdictStyle.border} ${verdictStyle.bg} p-6`}>
                <div className={`text-[10px] font-sans font-bold tracking-[0.24em] uppercase ${verdictStyle.color} mb-2`}>
                  {verdictStyle.label}
                </div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-text-primary leading-snug">
                  {a.verdict.headline}
                </p>
              </div>
            </ResultCard>
          )}

          {/* ── TAM + Difficulty ── */}
          {(a.tam || a.difficulty) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {a.tam && (
                <ResultCard icon={<TrendingUp size={16} className="text-brand-gold" />} label="Market Size">
                  <div className="space-y-2">
                    {a.tam.annualMarketSize && (
                      <p className="font-serif text-2xl font-bold text-text-primary">
                        {a.tam.annualMarketSize}
                      </p>
                    )}
                    {a.tam.monthlySearchVolume && (
                      <p className="text-sm font-sans text-text-secondary">
                        {a.tam.monthlySearchVolume}
                      </p>
                    )}
                    {a.tam.rationale && (
                      <p className="text-xs font-body text-text-muted leading-relaxed mt-3">
                        {a.tam.rationale}
                      </p>
                    )}
                  </div>
                </ResultCard>
              )}
              {a.difficulty && a.difficulty.overall !== undefined && (
                <ResultCard icon={<Target size={16} className="text-brand-gold" />} label="Difficulty">
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-4xl font-bold text-brand-gold">
                        {a.difficulty.overall}
                      </span>
                      <span className="text-sm font-sans text-text-muted">/ 10</span>
                    </div>
                    <DifficultyBar value={a.difficulty.overall} />
                    {a.difficulty.reasoning && (
                      <p className="text-xs font-body text-text-muted leading-relaxed">
                        {a.difficulty.reasoning}
                      </p>
                    )}
                  </div>
                </ResultCard>
              )}
            </div>
          )}

          {/* ── Pillar Pages ── */}
          {a.pillarPages && a.pillarPages.length > 0 && (
            <ResultCard icon={<ChevronRight size={16} className="text-brand-gold" />} label={`${a.pillarPages.length} Pillar Page Opportunities`}>
              <ul className="divide-y divide-border-subtle/60">
                {a.pillarPages.map((p, i) => p && (
                  <li key={i} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-sans font-bold text-brand-gold/70">
                            0{i + 1}
                          </span>
                          <h4 className="font-serif text-base font-bold text-text-primary leading-tight">
                            {p.title}
                          </h4>
                        </div>
                        {p.targetKeyword && (
                          <p className="text-xs font-sans text-text-muted mb-1.5">
                            <span className="text-text-secondary">→</span> {p.targetKeyword}
                          </p>
                        )}
                        {p.angle && (
                          <p className="text-xs font-body text-text-secondary leading-relaxed">
                            {p.angle}
                          </p>
                        )}
                      </div>
                      {p.searchDifficulty !== undefined && (
                        <div className="shrink-0 text-right">
                          <span className="text-[9px] font-sans font-bold tracking-[0.14em] uppercase text-text-muted/60 block mb-1">
                            KD
                          </span>
                          <span className={`text-sm font-sans font-bold ${
                            p.searchDifficulty < 30 ? 'text-emerald-400' :
                            p.searchDifficulty < 60 ? 'text-brand-gold' : 'text-brand-fire'
                          }`}>
                            {p.searchDifficulty}
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </ResultCard>
          )}

          {/* ── Personas ── */}
          {a.personas && a.personas.length > 0 && (
            <ResultCard icon={<Users size={16} className="text-brand-gold" />} label="Buyer Archetypes">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {a.personas.map((p, i) => p && (
                  <div key={i} className="border border-border-subtle bg-surface-elevated/30 p-4 flex flex-col">
                    <p className="font-serif text-sm font-bold text-text-primary mb-1.5">
                      {p.archetype}
                    </p>
                    {p.description && (
                      <p className="text-xs font-body text-text-secondary leading-relaxed mb-3">
                        {p.description}
                      </p>
                    )}
                    {p.painPoint && (
                      <p className="text-[11px] font-body italic text-text-muted leading-relaxed mt-auto mb-3 border-l border-brand-gold/40 pl-3">
                        &ldquo;{p.painPoint}&rdquo;
                      </p>
                    )}
                    {p.buyingPower && (
                      <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2">
                        <span className="text-[9px] font-sans font-bold tracking-[0.14em] uppercase text-text-muted/60">
                          Buying Power
                        </span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4].map(n => (
                            <span
                              key={n}
                              className={`w-1.5 h-1.5 rounded-full ${
                                n <= BUYING_POWER_DOTS[p.buyingPower!]
                                  ? 'bg-brand-gold'
                                  : 'bg-border-subtle'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ResultCard>
          )}

          {/* ── Revenue ── */}
          {a.revenueProjection && (
            <ResultCard icon={<TrendingUp size={16} className="text-brand-gold" />} label="12-Month Revenue Projection">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Conservative', value: a.revenueProjection.conservative },
                  { label: 'Realistic',    value: a.revenueProjection.realistic, highlight: true },
                  { label: 'Aggressive',   value: a.revenueProjection.aggressive },
                ].map(b => b.value && (
                  <div
                    key={b.label}
                    className={`border p-4 ${
                      b.highlight
                        ? 'border-brand-gold/50 bg-brand-gold/5'
                        : 'border-border-subtle bg-surface-elevated/30'
                    }`}
                  >
                    <span className={`text-[9px] font-sans font-bold tracking-[0.18em] uppercase mb-1 block ${
                      b.highlight ? 'text-brand-gold' : 'text-text-muted'
                    }`}>
                      {b.label}
                    </span>
                    <p className={`font-serif text-lg font-bold leading-tight ${
                      b.highlight ? 'text-text-primary' : 'text-text-secondary'
                    }`}>
                      {b.value}
                    </p>
                  </div>
                ))}
              </div>
              {a.revenueProjection.assumptions && (
                <p className="text-xs font-body text-text-muted leading-relaxed">
                  <span className="font-bold text-text-secondary">Assumptions:</span> {a.revenueProjection.assumptions}
                </p>
              )}
            </ResultCard>
          )}

          {/* ── Competitors ── */}
          {a.competitors && a.competitors.length > 0 && (
            <ResultCard icon={<Trophy size={16} className="text-brand-gold" />} label="Top 3 Competitors">
              <div className="space-y-3">
                {a.competitors.map((c, i) => c && (
                  <div key={i} className="border-l-2 border-border-subtle pl-4 py-1">
                    <p className="font-serif text-base font-bold text-text-primary mb-1">{c.name}</p>
                    {c.strength && (
                      <p className="text-xs font-body text-text-secondary mb-0.5">
                        <span className="text-emerald-400/80 font-bold">+</span> {c.strength}
                      </p>
                    )}
                    {c.weakness && (
                      <p className="text-xs font-body text-text-secondary">
                        <span className="text-brand-fire/80 font-bold">−</span> {c.weakness}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ResultCard>
          )}

          {/* ── Unique Angle ── */}
          {a.uniqueAngle && (
            <ResultCard icon={<Lightbulb size={16} className="text-brand-gold" />} label="The Contrarian Angle">
              <p className="font-serif text-lg sm:text-xl font-bold text-text-primary leading-snug italic">
                &ldquo;{a.uniqueAngle}&rdquo;
              </p>
            </ResultCard>
          )}

          {/* ── Lead CTA ── */}
          {!isLoading && a.verdict?.decision && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-brand-gold/30 bg-gradient-to-br from-brand-gold/8 to-transparent"
            >
              <div className="h-0.5 bg-gradient-to-r from-brand-fire/60 via-brand-gold to-brand-fire/60" />
              <div className="p-6 sm:p-8">
                {leadState === 'success' ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 mx-auto mb-4 bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center">
                      <Check size={20} className="text-brand-gold" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-text-primary mb-2">
                      Check your inbox.
                    </h3>
                    <p className="text-sm font-body text-text-secondary max-w-sm mx-auto">
                      We sent a confirmation link to <strong>{leadEmail}</strong>. Click it to receive your analysis brief and the 7-day AuthorityOS series.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-fire mb-2">
                      Next Step
                    </p>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-text-primary mb-2 leading-tight">
                      Get the AuthorityOS blueprint for this niche.
                    </h3>
                    <p className="text-sm font-body text-text-secondary mb-5 leading-relaxed">
                      Receive this full analysis as a saved brief, plus the 7-day operator series that walks through the exact steps that built steakakademie.de — applied to <span className="text-brand-gold">{a.niche}</span>.
                    </p>
                    <form ref={leadFormRef} onSubmit={handleLead} className="flex flex-col gap-3">
                      <HoneypotFeld />
                      <Turnstile action="niche-lead" onToken={setLeadTurnstile} />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                          <input
                            type="email"
                            required
                            value={leadEmail}
                            onChange={e => setLeadEmail(e.target.value)}
                            placeholder="you@domain.com"
                            disabled={leadState === 'sending'}
                            className="
                              w-full bg-surface-elevated border border-border-subtle
                              pl-10 pr-4 py-3 text-sm font-body text-text-primary
                              placeholder:text-text-muted/55
                              focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/25
                              transition-colors
                            "
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!leadEmail || !leadConsent || leadState === 'sending' || (Boolean(TURNSTILE_SITE_KEY) && !leadTurnstile)}
                          className="
                            shrink-0 bg-brand-gold hover:bg-[#b07020] active:bg-[#9a6010]
                            disabled:opacity-50 disabled:cursor-not-allowed
                            text-ink font-sans font-bold text-xs tracking-[0.14em] uppercase
                            px-6 py-3 transition-colors flex items-center justify-center gap-2
                          "
                        >
                          {leadState === 'sending' ? (
                            <><Loader2 size={13} className="animate-spin motion-reduce:animate-none" /> Sending</>
                          ) : (
                            <>Send brief <ArrowRight size={13} /></>
                          )}
                        </button>
                      </div>
                      {/* DSGVO-Einwilligung — Pflichtfeld vor Absenden */}
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          required
                          checked={leadConsent}
                          onChange={e => setLeadConsent(e.target.checked)}
                          disabled={leadState === 'sending'}
                          className="mt-0.5 shrink-0 w-3.5 h-3.5 accent-brand-gold cursor-pointer"
                        />
                        <span className="text-[11px] font-sans text-text-muted/70 leading-relaxed group-hover:text-text-muted transition-colors">
                          I agree to receive the analysis brief and the AuthorityOS email series.
                          Unsubscribe at any time.{' '}
                          <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-gold">
                            Privacy Policy
                          </a>
                        </span>
                      </label>
                    </form>
                    {leadFehler && (
                      <p role="alert" className="text-xs font-sans text-brand-fire mt-3">
                        That didn’t go through — no email was sent. Please try again in a few minutes.
                      </p>
                    )}
                    <p className="text-[10px] font-sans text-text-muted/60 mt-2">
                      Confirmation email required (double opt-in) · Never shared
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Run another */}
          {!isLoading && a.verdict?.decision && (
            <div className="text-center pt-4">
              <button
                onClick={() => {
                  stop();
                  setNiche('');
                  setLeadEmail('');
                  setLeadState('idle');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[11px] font-sans tracking-[0.14em] uppercase text-text-muted hover:text-brand-gold transition-colors pb-px border-b border-transparent hover:border-brand-gold/40"
              >
                ← Validate another niche
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ─── Result Card wrapper ─────────────────────────────────────────────────────

function ResultCard({
  icon, label, children,
}: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-text-muted">
          {label}
        </h3>
      </div>
      <div className="bg-surface-card border border-border-subtle p-5 sm:p-6">
        {children}
      </div>
    </motion.section>
  );
}

// ─── Difficulty Bar ──────────────────────────────────────────────────────────

function DifficultyBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value * 10));
  const color =
    value <= 4 ? 'bg-emerald-500' :
    value <= 7 ? 'bg-brand-gold' :
                 'bg-brand-fire';
  return (
    <div className="h-1 bg-border-subtle relative overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`absolute inset-y-0 left-0 ${color}`}
      />
    </div>
  );
}
