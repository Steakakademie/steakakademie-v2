import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { generateAllNLPages, type NLPageContent } from '@/services/pageGenerator';
import { ChevronRight, TrendingUp, Euro, ShieldCheck, Users } from 'lucide-react';
import { ogImages } from '@/lib/og';

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'ZZP Netto Inkomen per Beroep — Belastingberekening 2024 | Nederland',
  description:
    'Bereken exact wat jij als ZZP netto overhoudt per beroep. Actuele belastingberekeningen voor 10+ freelance niches in Nederland — inclusief zelfstandigenaftrek, MKB-winstvrijstelling en Zorgverzekering.',
  robots: { index: false, follow: false },
  openGraph: {
    images: ogImages('ZZP Netto Inkomen per Beroep 2024 | Nederland'),
    title: 'ZZP Netto Inkomen per Beroep 2024 | Nederland',
    description: 'Exacte netto-inkomen berekeningen voor ZZP-freelancers in Nederland. Actuele belastingcijfers per beroep — snel inzicht in jouw echte take-home pay.',
    url: 'https://steakakademie.nl/zzp-niche',
    type: 'website',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EUR_NL = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const CATEGORY_LABELS: Record<string, string> = {
  'digital-marketing': 'Digital Marketing',
  'content':           'Content & Tekst',
  'tech':              'Tech & Dev',
  'health-wellness':   'Health & Wellness',
  'food-events':       'Food & Events',
  'creative':          'Creatief',
  'consulting':        'Consulting',
  'coaching':          'Coaching',
  'design':            'Design',
};

const DEMAND_LABEL: Record<string, string> = {
  hoog:      'Hoge vraag',
  gemiddeld: 'Gemiddelde vraag',
  laag:      'Niche markt',
};

const DEMAND_COLOR: Record<string, string> = {
  hoog:      'text-emerald-400',
  gemiddeld: 'text-brand-gold',
  laag:      'text-text-muted',
};

// ─── Niche Card ───────────────────────────────────────────────────────────────

function NicheCard({ page, rank }: { page: NLPageContent; rank: number }) {
  const { evaluation: ev } = page;
  const { niche, tax } = ev;
  const isTop3 = rank <= 3;

  return (
    <Link
      href={`/zzp-niche/${niche.slug}`}
      className={[
        'group block relative border transition-[transform,border-color] duration-200 hover:-translate-y-0.5',
        isTop3
          ? 'border-brand-gold/35 hover:border-brand-gold/60'
          : 'border-border-subtle hover:border-brand-gold/40',
      ].join(' ')}
      style={{ background: '#1E1410' }}
    >
      {/* Top-3 glow strip */}
      {isTop3 && (
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, #C8882A, transparent)' }}
        />
      )}

      <div className="p-5">
        {/* Top row: category + score */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span
            className="font-sans text-[10px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(200,136,42,0.12)', color: '#C8882A' }}
          >
            {CATEGORY_LABELS[niche.category] ?? niche.category}
          </span>
          <span
            className="font-sans text-[10px] font-bold tabular-nums px-2 py-0.5"
            style={{
              background: ev.marketScore >= 80 ? 'rgba(200,136,42,0.15)' : 'rgba(255,255,255,0.04)',
              color: ev.marketScore >= 80 ? '#C8882A' : '#7A6558',
            }}
          >
            {ev.marketScore}/100
          </span>
        </div>

        {/* Title */}
        <h2 className="font-serif text-lg font-bold text-text-light group-hover:text-brand-gold transition-colors mb-1 leading-snug">
          ZZP {niche.title}
        </h2>
        <p className="font-body text-xs text-text-muted mb-4 leading-snug line-clamp-2">
          {niche.description}
        </p>

        {/* Score bar */}
        <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-[width]"
            style={{
              width: `${ev.marketScore}%`,
              background: ev.marketScore >= 80
                ? 'linear-gradient(90deg, #C8882A, #E85018)'
                : 'linear-gradient(90deg, #7A6558, #C8882A)',
            }}
          />
        </div>

        {/* Net income — hero number */}
        <div
          className="flex items-baseline gap-1.5 mb-4 p-3 -mx-1"
          style={{ background: 'rgba(200,136,42,0.06)', borderLeft: '2px solid rgba(200,136,42,0.4)' }}
        >
          <span className="font-serif text-2xl font-bold text-brand-gold tabular-nums">
            {EUR_NL(tax.monthlyNet)}
          </span>
          <span className="font-sans text-xs text-text-muted">netto / maand</span>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
          {[
            { label: 'Bruto-omzet',     value: EUR_NL(niche.averageGrossRevenue) + ' / mo' },
            { label: 'Uurtarief',        value: EUR_NL(niche.hourlyRate) + ' / uur' },
            { label: 'Belastingdruk',    value: `${(tax.effectiveRate * 100).toFixed(1)} %` },
            { label: ev.savingsVsDE > 0 ? 'vs. Duitsland' : 'Jaaropbrengst',
              value: ev.savingsVsDE > 0 ? `+ ${EUR_NL(ev.savingsVsDE)} / mo` : EUR_NL(ev.annualNet) },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="block font-sans text-[10px] text-text-muted uppercase tracking-wide">{label}</span>
              <span className="font-sans text-xs font-bold text-text-secondary">{value}</span>
            </div>
          ))}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'rgba(58,42,30,0.8)' }}>
          <span className={`font-sans text-[10px] font-semibold ${DEMAND_COLOR[niche.demandLevel]}`}>
            {DEMAND_LABEL[niche.demandLevel]}
          </span>
          <span className="flex items-center gap-1 font-sans text-xs font-semibold text-brand-fire">
            Volledige berekening
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Summary stats bar ────────────────────────────────────────────────────────

function StatsBar({ pages }: { pages: NLPageContent[] }) {
  const nets   = pages.map((p) => p.evaluation.tax.monthlyNet);
  const avgNet = Math.round(nets.reduce((a, b) => a + b, 0) / nets.length);
  const maxNet = Math.max(...nets);
  const avgRate = pages.reduce((a, p) => a + p.evaluation.tax.effectiveRate, 0) / pages.length;

  const stats = [
    { icon: <TrendingUp size={16} />, label: 'Gemiddeld netto', value: EUR_NL(avgNet) + ' / mo' },
    { icon: <Euro size={16} />,        label: 'Hoogste netto',   value: EUR_NL(maxNet) + ' / mo' },
    { icon: <ShieldCheck size={16} />, label: 'Gem. belastingdruk', value: `${(avgRate * 100).toFixed(1)} %` },
    { icon: <Users size={16} />,       label: 'ZZP-niches',      value: `${pages.length} beroepen` },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0"
      style={{ borderColor: 'rgba(200,136,42,0.18)', border: '1px solid rgba(200,136,42,0.18)' }}
    >
      {stats.map(({ icon, label, value }) => (
        <div key={label} className="flex items-center gap-3 px-6 py-4" style={{ background: 'rgba(200,136,42,0.04)' }}>
          <span className="text-brand-gold shrink-0">{icon}</span>
          <div>
            <span className="block font-sans text-[10px] uppercase tracking-widest text-text-muted">{label}</span>
            <span className="font-sans font-bold text-sm text-text-light">{value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ZZPNicheIndexPage() {
  const pages = generateAllNLPages().sort(
    (a, b) => b.evaluation.marketScore - a.evaluation.marketScore,
  );

  return (
    <>
      <Header />

      <main className="bg-surface-base">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section
          className="border-b"
          style={{ background: 'linear-gradient(180deg, #0F0A06 0%, #17100B 100%)', borderColor: 'rgba(200,136,42,0.15)' }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={11} />
              <span className="text-text-secondary">ZZP Nederland</span>
            </nav>

            <div className="max-w-2xl">
              <span className="inline-block font-sans text-[10px] font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Belastingberekening 2024 · Actuele cijfers
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5">
                ZZP Netto Inkomen<br className="hidden sm:block" /> per Beroep
              </h1>
              <p className="font-body text-lg text-text-light/70 leading-relaxed mb-8">
                Wat houd jij als ZZP echt over? Exacte netto-inkomen berekeningen voor{' '}
                {pages.length} freelance beroepen in Nederland — inclusief zelfstandigenaftrek,
                MKB-winstvrijstelling en inkomensafhankelijke Zorgverzekeringspremie.
                Geen schattingen. Echte belastingformules.
              </p>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-5">
                {[
                  { icon: <ShieldCheck size={14} />, text: 'Wet IB 2001 + Zvw 2024' },
                  { icon: <TrendingUp size={14} />,  text: 'Actuele heffingskortingen' },
                  { icon: <Euro size={14} />,         text: 'Geen API — pure formules' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs font-sans text-text-light/55">
                    <span className="text-brand-gold">{icon}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ────────────────────────────────────────────────── */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 -mt-px">
          <StatsBar pages={pages} />
        </div>

        {/* ── Niche grid ───────────────────────────────────────────────── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-baseline justify-between mb-8 gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-1">
                Alle ZZP-niches
              </h2>
              <p className="font-sans text-sm text-text-muted">
                Gesorteerd op marktscore (hoogste eerst) — klik op een beroep voor de volledige belastingberekening.
              </p>
            </div>
            <span
              className="shrink-0 font-sans text-xs font-bold px-3 py-1.5"
              style={{ background: 'rgba(200,136,42,0.10)', color: '#C8882A', border: '1px solid rgba(200,136,42,0.25)' }}
            >
              {pages.length} beroepen
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pages.map((page, i) => (
              <NicheCard key={page.slug} page={page} rank={i + 1} />
            ))}
          </div>
        </section>

        {/* ── Semantic depth ───────────────────────────────────────────── */}
        <section className="border-t" style={{ borderColor: 'rgba(58,42,30,0.8)' }}>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">

              <div className="max-w-content">
                <h2 className="font-serif text-2xl font-bold text-text-primary mb-5">
                  Waarom ZZP in Nederland fiscaal aantrekkelijk is
                </h2>
                <div className="font-body text-text-secondary leading-relaxed space-y-4 text-[1.0625rem]">
                  <p>
                    Het Nederlandse ZZP-stelsel combineert drie fiscale voordelen die nergens anders in
                    Europa zo gunstig samenkomen. De <strong className="text-text-primary">zelfstandigenaftrek</strong>{' '}
                    (€&thinsp;3.750 in 2024) verlaagt je belastbare winst direct, de{' '}
                    <strong className="text-text-primary">MKB-winstvrijstelling</strong> van 13,31&thinsp;%
                    trekt nog eens een kwart van je resterende winst af, en de{' '}
                    <strong className="text-text-primary">heffingskortingen</strong>{' '}
                    (Algemene + Arbeidskorting, samen tot € 8.520 per jaar) verlagen je daadwerkelijk
                    te betalen belasting — niet alleen het belastbaar inkomen.
                  </p>
                  <p>
                    Ter vergelijking: een freelancer in Duitsland betaalt bij € 5.000 omzet per maand
                    gemiddeld € 985 alleen al aan Krankenversicherung (GKV + PV). Een ZZP&rsquo;er in
                    Nederland betaalt bij dezelfde omzet gemiddeld € 359 aan Zorgverzekering —
                    een verschil van meer dan € 600 per maand, puur op ziektekostenverzekering.
                    De effectieve belastingdruk bedraagt in Nederland gemiddeld 28–32&thinsp;%, tegenover
                    38–42&thinsp;% voor vergelijkbare Freiberufler in Duitsland.
                  </p>
                  <p>
                    Alle berekeningen op deze pagina zijn gebaseerd op de actuele belastingwetgeving:
                    Wet IB 2001, de Zorgverzekeringswet (Zvw) 2024 en de meest recente
                    heffingskortingsbedragen. Er worden geen schattingen gebruikt — de berekeningen
                    zijn deterministisch en reproduceerbaar.
                  </p>
                </div>
              </div>

              {/* Explainer box */}
              <div className="space-y-4">
                <div
                  className="border p-5"
                  style={{ borderColor: 'rgba(200,136,42,0.22)', background: 'linear-gradient(135deg, rgba(200,136,42,0.07) 0%, transparent 80%)' }}
                >
                  <h3 className="font-sans text-xs font-bold tracking-widest uppercase text-brand-gold mb-4">
                    Hoe werkt de berekening?
                  </h3>
                  {[
                    { step: '1', label: 'Bruto-omzet',           text: 'Maandelijks factuurbedrag excl. btw' },
                    { step: '2', label: 'Zelfstandigenaftrek',   text: '€ 3.750 / jaar van de winst af' },
                    { step: '3', label: 'MKB-winstvrijstelling', text: '13,31 % van de resterende winst vrij' },
                    { step: '4', label: 'Box 1-belasting',       text: '36,97 % tarief t/m € 75.518' },
                    { step: '5', label: 'Heffingskortingen',     text: 'Algemene + Arbeidskorting aftrekken' },
                    { step: '6', label: 'Zorgverzekering',       text: 'Basispremie + IAB 5,32 % over Box 1' },
                  ].map(({ step, label, text }) => (
                    <div key={step} className="flex gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(58,42,30,0.6)' }}>
                      <span
                        className="font-sans text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 mt-0.5"
                        style={{ background: 'rgba(200,136,42,0.2)', color: '#C8882A' }}
                      >
                        {step}
                      </span>
                      <div>
                        <span className="font-sans text-xs font-bold text-text-primary block">{label}</span>
                        <span className="font-sans text-xs text-text-muted">{text}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="font-sans text-[11px] text-text-muted leading-relaxed px-1">
                  Berekeningen zijn indicatief. Raadpleeg een belastingadviseur voor jouw persoonlijke situatie.
                  Geen aftrekposten voor AOV, zakelijke kosten of BTW-verplichtingen meegenomen.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
