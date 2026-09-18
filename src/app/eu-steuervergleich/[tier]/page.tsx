import type { Metadata }  from 'next';
import { notFound }        from 'next/navigation';
import Link                from 'next/link';
import path                from 'path';
import fs                  from 'fs';
import Header              from '@/components/layout/Header';
import Footer              from '@/components/layout/Footer';
import { ChevronRight, ArrowRight, Info, TrendingUp, Globe } from 'lucide-react';
import { ogImages } from '@/lib/og';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComparisonRow {
  rank:            number;
  countryCode:     string;
  countryName:     string;
  freelancerTitle: string;
  monthlyGross:    string;
  monthlyNet:      string;
  effectiveRate:   string;
  svKV:            string;
  incomeTax:       string;
  taxSystem:       string;
}

interface EUSeoPageData {
  slug:         string;
  grossRevenue: number;
  generatedAt:  string;
  meta: {
    title:         string;
    description:   string;
    keywords:      string[];
    ogTitle:       string;
    ogDescription: string;
  };
  featuredSnippet: string;
  factualSummary:  string;
  comparisonTable: {
    caption:   string;
    rows:      ComparisonRow[];
    schemaOrg: Record<string, unknown>;
  };
  faq: Array<{ question: string; answer: string }>;
  structuredData: {
    faqPage:  Record<string, unknown>;
    dataset?: Record<string, unknown>;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_TIERS = new Set(['3000', '5000', '8000']);

const TIER_LABELS: Record<string, string> = {
  '3000': '3.000 €/Mo',
  '5000': '5.000 €/Mo',
  '8000': '8.000 €/Mo',
};

const TIERS = ['3000', '5000', '8000'] as const;

const FLAGS: Record<string, string> = {
  IT: '🇮🇹', NL: '🇳🇱', ES: '🇪🇸', FR: '🇫🇷', PT: '🇵🇹', DE: '🇩🇪',
};

// ─── Data loading ─────────────────────────────────────────────────────────────

function loadData(tier: string): EUSeoPageData | null {
  if (!VALID_TIERS.has(tier)) return null;
  try {
    const file = path.join(process.cwd(), 'src', 'data', 'generated', `eu-seo-${tier}.json`);
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as EUSeoPageData;
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseEUR(s: string): number {
  // "3.831 €" → remove thousands dot → remove non-digits → parse
  return parseInt(s.replace(/\./g, '').replace(/[^0-9]/g, ''), 10);
}

function rankEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}

// ─── Static generation ────────────────────────────────────────────────────────

type Props = { params: Promise<{ tier: string }> };

export function generateStaticParams() {
  return TIERS.map(tier => ({ tier }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const data = loadData(params.tier);
  if (!data) return {};
  return {
    title:       data.meta.title,
    description: data.meta.description,
    keywords:    data.meta.keywords.join(', '),
    alternates:  { canonical: `https://steakakademie.de/eu-steuervergleich/${params.tier}` },
    openGraph: {
      images: ogImages(data.meta.ogTitle),
      title:       data.meta.ogTitle,
      description: data.meta.ogDescription,
      url:         `https://steakakademie.de/eu-steuervergleich/${params.tier}`,
      type:        'website',
    },
  };
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const G_BORDER = { borderColor: 'rgba(200,136,42,0.22)' } as const;
const G_BG     = { background: 'linear-gradient(135deg, rgba(200,136,42,0.08) 0%, rgba(232,80,24,0.02) 100%)' } as const;
const CARD_BG  = { background: '#1E1410' } as const;

// ─── TierSelector ─────────────────────────────────────────────────────────────

function TierSelector({ current }: { current: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mt-2">
      <span className="font-sans text-xs text-text-muted uppercase tracking-wider shrink-0">
        Einkommensstufe:
      </span>
      {TIERS.map(tier => {
        const active = tier === current;
        return (
          <Link
            key={tier}
            href={`/eu-steuervergleich/${tier}`}
            aria-current={active ? 'page' : undefined}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm font-sans text-sm font-semibold transition-[background-color,border-color,color] border"
            style={active
              ? { background: 'rgba(200,136,42,0.20)', borderColor: '#C8882A', color: '#F0E8D8' }
              : { background: '#1E1410', borderColor: '#3A2A1E', color: '#C4A882' }
            }
          >
            {TIER_LABELS[tier]}
            {active && <span className="text-brand-gold ml-0.5">✓</span>}
          </Link>
        );
      })}
    </div>
  );
}

// ─── WinnerCard ───────────────────────────────────────────────────────────────

function WinnerCard({ rows }: { rows: ComparisonRow[] }) {
  const winner = rows[0];
  const deRow  = rows.find(r => r.countryCode === 'DE') ?? rows[rows.length - 1];
  const diff   = parseEUR(winner.monthlyNet) - parseEUR(deRow.monthlyNet);

  return (
    <div
      className="rounded-sm border p-6 sm:p-8"
      style={{
        borderColor: '#C8882A',
        background:  'linear-gradient(135deg, rgba(200,136,42,0.14) 0%, rgba(200,136,42,0.04) 60%, rgba(232,80,24,0.03) 100%)',
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

        {/* Left */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl" role="img" aria-label="Gold-Medaille">🥇</span>
            <div>
              <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-brand-gold block mb-0.5">
                Steuersieger 2026
              </span>
              <span className="font-serif text-2xl font-bold text-text-light">
                {FLAGS[winner.countryCode]} {winner.countryName}
              </span>
            </div>
          </div>
          <p className="font-sans text-sm text-text-secondary mb-1">{winner.freelancerTitle}</p>
          <p className="font-sans text-xs text-text-muted leading-relaxed">{winner.taxSystem}</p>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Abgabenquote',  value: winner.effectiveRate   },
              { label: 'SV / KV',       value: `${winner.svKV}/Mo`    },
              { label: 'Einkommenst.',  value: `${winner.incomeTax}/Mo` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-sm p-3 border"
                style={{ borderColor: 'rgba(200,136,42,0.20)', background: 'rgba(0,0,0,0.25)' }}
              >
                <p className="font-sans text-[10px] uppercase tracking-wider text-text-muted mb-1">{label}</p>
                <p className="font-sans font-bold text-sm text-text-light tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Net + DE delta */}
        <div className="flex flex-col gap-4 lg:items-end">
          <div>
            <p className="font-sans text-xs text-text-muted uppercase tracking-wider mb-1 lg:text-right">
              Netto / Monat
            </p>
            <p className="font-serif text-5xl sm:text-6xl font-bold text-brand-gold tabular-nums leading-none">
              {winner.monthlyNet}
            </p>
          </div>
          {diff > 0 && (
            <div
              className="inline-flex flex-col lg:items-end rounded-sm px-4 py-3 border"
              style={{ borderColor: 'rgba(200,136,42,0.32)', background: 'rgba(200,136,42,0.09)' }}
            >
              <p className="font-sans text-[10px] uppercase tracking-wider text-brand-gold mb-1">
                vs. {FLAGS['DE']} Deutschland
              </p>
              <p className="font-serif text-2xl font-bold text-text-light tabular-nums">
                +{diff.toLocaleString('de-DE')} €
                <span className="font-sans text-sm font-normal text-text-secondary ml-1">/Mo</span>
              </p>
              <p className="font-sans text-sm text-text-secondary tabular-nums">
                +{(diff * 12).toLocaleString('de-DE')} € / Jahr
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ComparisonTable ──────────────────────────────────────────────────────────

function ComparisonTable({ rows, gross }: { rows: ComparisonRow[]; gross: number }) {
  const maxNet = parseEUR(rows[0].monthlyNet);

  return (
    <div className="border rounded-sm overflow-hidden" style={G_BORDER}>

      {/* Section header */}
      <div
        className="px-5 py-3.5 border-b flex items-center gap-2"
        style={{ borderColor: 'rgba(200,136,42,0.18)', ...G_BG }}
      >
        <TrendingUp size={16} className="text-brand-gold shrink-0" />
        <h2 className="font-serif text-base font-bold text-text-light">
          Vollständiges Ranking — {gross.toLocaleString('de-DE')} € Brutto/Monat
        </h2>
      </div>

      {/* Scrollable table area */}
      <div className="overflow-x-auto">

        {/* Column headers — desktop */}
        <div
          className="hidden md:grid px-5 py-2 border-b min-w-[640px]"
          style={{
            gridTemplateColumns: '56px 1fr 130px 80px 110px 110px',
            borderColor: 'rgba(58,42,30,0.8)',
            background: 'rgba(15,10,6,0.5)',
          }}
        >
          {['Rang', 'Land / System', 'Netto / Monat', 'Quote', 'SV / KV', 'Einkommenst.'].map((h, i) => (
            <span
              key={h}
              className={`font-sans text-[11px] font-bold uppercase tracking-wider text-text-muted ${i > 1 ? 'text-right' : ''}`}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y min-w-0 md:min-w-[640px]" style={{ borderColor: 'rgba(58,42,30,0.8)' }}>
          {rows.map((row, idx) => {
            const net    = parseEUR(row.monthlyNet);
            const barPct = (net / maxNet) * 100;
            const isFirst = idx === 0;
            const isLast  = idx === rows.length - 1;
            const emoji   = rankEmoji(row.rank);

            return (
              <div
                key={row.countryCode}
                className="px-5 py-4"
                style={{
                  background: isFirst
                    ? 'rgba(200,136,42,0.07)'
                    : isLast
                    ? 'rgba(232,80,24,0.025)'
                    : 'transparent',
                }}
              >
                {/* Mobile row */}
                <div className="flex items-center gap-3 md:hidden">
                  <span className="text-xl w-7 shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{FLAGS[row.countryCode]}</span>
                      <span className={`font-sans font-bold text-sm ${isFirst ? 'text-brand-gold' : 'text-text-light'}`}>
                        {row.countryName}
                      </span>
                      <span className="font-sans text-xs text-text-muted">{row.effectiveRate}</span>
                    </div>
                  </div>
                  <span className={`font-sans font-bold text-base tabular-nums shrink-0 ${isFirst ? 'text-brand-gold' : 'text-text-light'}`}>
                    {row.monthlyNet}
                  </span>
                </div>

                {/* Desktop row */}
                <div
                  className="hidden md:grid items-center"
                  style={{ gridTemplateColumns: '56px 1fr 130px 80px 110px 110px' }}
                >
                  <span className="text-xl">{emoji}</span>
                  <div className="pr-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base">{FLAGS[row.countryCode]}</span>
                      <span className={`font-sans font-semibold text-sm ${isFirst ? 'text-brand-gold' : 'text-text-light'}`}>
                        {row.countryName}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-text-muted leading-tight truncate max-w-[240px]">
                      {row.freelancerTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`font-sans font-bold text-sm tabular-nums ${isFirst ? 'text-brand-gold' : 'text-text-light'}`}>
                      {row.monthlyNet}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-sans text-sm tabular-nums ${isFirst ? 'font-semibold text-text-light' : 'text-text-secondary'}`}>
                      {row.effectiveRate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-sans text-sm tabular-nums text-text-secondary">{row.svKV}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-sans text-sm tabular-nums text-text-secondary">{row.incomeTax}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 h-1.5 rounded-full" style={{ background: 'rgba(58,42,30,0.5)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width:      `${barPct}%`,
                      background: isFirst
                        ? 'linear-gradient(90deg, #C8882A 0%, #E85018 100%)'
                        : isLast
                        ? 'rgba(200,136,42,0.28)'
                        : 'rgba(200,136,42,0.50)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <div
        className="px-5 py-3 border-t flex items-start gap-2"
        style={{ borderColor: 'rgba(58,42,30,0.8)', background: 'rgba(15,10,6,0.4)' }}
      >
        <Info size={13} className="text-text-muted shrink-0 mt-0.5" />
        <p className="font-sans text-xs text-text-muted leading-relaxed">
          Abzüge: SV/KV + Einkommensteuer + Tech (100–150 €/Mo) + Kammer/Berater.
          Annahme: Einzelperson, keine Angestellten. Keine Steuerberatung.
        </p>
      </div>
    </div>
  );
}

// ─── SpreadBanner ─────────────────────────────────────────────────────────────

function SpreadBanner({ rows, gross }: { rows: ComparisonRow[]; gross: number }) {
  const winner = rows[0];
  const loser  = rows[rows.length - 1];
  const diff   = parseEUR(winner.monthlyNet) - parseEUR(loser.monthlyNet);

  return (
    <div
      className="rounded-sm border p-5 sm:p-6"
      style={{
        borderColor: 'rgba(200,136,42,0.30)',
        background:  'linear-gradient(135deg, rgba(200,136,42,0.09) 0%, rgba(58,42,30,0.22) 100%)',
      }}
    >
      <p className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-brand-gold mb-3">
        Steuerlicher Spread — {gross.toLocaleString('de-DE')} € Brutto/Monat
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <p className="font-body text-sm text-text-secondary leading-relaxed max-w-sm">
          {FLAGS[winner.countryCode]}{' '}
          <strong className="text-text-light">{winner.countryName}</strong> ({winner.monthlyNet}) liegt{' '}
          <strong className="text-brand-gold">{diff.toLocaleString('de-DE')} €/Monat</strong> vor{' '}
          {FLAGS[loser.countryCode]}{' '}
          <strong className="text-text-light">{loser.countryName}</strong> ({loser.monthlyNet}).
          Im Jahr:{' '}
          <strong className="text-brand-gold">{(diff * 12).toLocaleString('de-DE')} €</strong> Unterschied.
        </p>
        <div className="flex gap-6 shrink-0">
          <div>
            <p className="font-serif text-3xl font-bold text-brand-gold tabular-nums">
              +{diff.toLocaleString('de-DE')} €
            </p>
            <p className="font-sans text-xs text-text-muted">pro Monat</p>
          </div>
          <div>
            <p className="font-serif text-3xl font-bold text-text-light tabular-nums">
              +{(diff * 12).toLocaleString('de-DE')} €
            </p>
            <p className="font-sans text-xs text-text-muted">pro Jahr</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TierCTA ──────────────────────────────────────────────────────────────────

function TierCTA({ current }: { current: string }) {
  const others = TIERS.filter(t => t !== current);
  return (
    <div
      className="rounded-sm border p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
      style={{ borderColor: 'rgba(232,80,24,0.30)', background: 'rgba(232,80,24,0.04)' }}
    >
      <div className="flex-1">
        <p className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase text-brand-fire mb-1.5">
          Andere Einkommensstufen vergleichen
        </p>
        <p className="font-body text-sm text-text-secondary leading-relaxed">
          Wie verschiebt sich das Ranking bei anderen Umsatzniveaus? Die Heffingskortingen (NL) und das
          Forfettario-Regime (IT) zeigen unterschiedliche Stärken je nach Einkommenshöhe.
        </p>
      </div>
      <div className="flex gap-2 flex-wrap shrink-0">
        {others.map(tier => (
          <Link
            key={tier}
            href={`/eu-steuervergleich/${tier}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 font-sans font-bold text-sm rounded-sm text-white transition-opacity hover:opacity-90"
            style={{ background: '#E85018' }}
          >
            {TIER_LABELS[tier]}
            <ArrowRight size={13} />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── FAQSection ───────────────────────────────────────────────────────────────

function FAQSection({ items }: { items: Array<{ question: string; answer: string }> }) {
  return (
    <section aria-labelledby="faq-eu-heading">
      <div
        className="px-5 py-3.5 border rounded-t-sm border-b-0 flex items-center gap-2"
        style={{ ...G_BORDER, ...G_BG }}
      >
        <Globe size={16} className="text-brand-gold shrink-0" />
        <h2 id="faq-eu-heading" className="font-serif text-base font-bold text-text-light">
          Häufige Fragen — EU Freelancer Steuervergleich
        </h2>
      </div>
      <div className="border rounded-b-sm divide-y" style={{ ...G_BORDER, ...CARD_BG }}>
        {items.map((item, i) => (
          <details key={i} className="group px-5 py-4" open={i === 0}>
            <summary className="font-sans font-semibold text-sm text-text-light cursor-pointer list-none flex items-center justify-between gap-4 select-none">
              {item.question}
              <ChevronRight
                size={14}
                className="shrink-0 text-brand-gold transition-transform group-open:rotate-90"
              />
            </summary>
            <p className="font-body text-sm leading-relaxed text-text-primary/80 mt-3 pr-6">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EUSteuervergleichPage(props: Props) {
  const params = await props.params;
  const data = loadData(params.tier);
  if (!data) notFound();

  const { featuredSnippet, comparisonTable, faq, structuredData, grossRevenue } = data;

  return (
    <>
      {/* Structured Data — FAQPage + Dataset */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.faqPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonTable.schemaOrg) }}
      />

      <Header />

      <main>

        {/* Breadcrumb */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={11} />
            <span className="text-text-secondary">EU Steuervergleich</span>
            <ChevronRight size={11} />
            <span className="text-brand-gold">{TIER_LABELS[params.tier]}</span>
          </nav>
        </div>

        {/* Hero ──────────────────────────────────────────────────────────── */}
        <div
          className="mt-6 mb-10"
          style={{
            background:   'linear-gradient(180deg, rgba(200,136,42,0.07) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(200,136,42,0.12)',
          }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span
                className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full"
                style={{ background: 'rgba(200,136,42,0.14)', color: '#C8882A', border: '1px solid rgba(200,136,42,0.3)' }}
              >
                EU Steuervergleich 2026
              </span>
              <span
                className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full"
                style={{ background: 'rgba(232,80,24,0.10)', color: '#E85018', border: '1px solid rgba(232,80,24,0.25)' }}
              >
                6 Länder · Freelancer · Solopreneur
              </span>
            </div>

            {/* H1 */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5 max-w-content">
              Freelancer Netto-Ranking Europa 2026
            </h1>

            {/* Featured Snippet — Position-0-optimiert */}
            <p className="font-body text-lg text-text-primary/85 leading-relaxed max-w-content mb-6">
              {featuredSnippet}
            </p>

            {/* Tier Switcher */}
            <TierSelector current={params.tier} />
          </div>
        </div>

        {/* Main content ─────────────────────────────────────────────────── */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-8">

          {/* 1 — Winner Card */}
          <WinnerCard rows={comparisonTable.rows} />

          {/* 2 — Full ranking table */}
          <ComparisonTable rows={comparisonTable.rows} gross={grossRevenue} />

          {/* 3 — Spread banner */}
          <SpreadBanner rows={comparisonTable.rows} gross={grossRevenue} />

          {/* 4 — CTA: other tiers */}
          <TierCTA current={params.tier} />

          {/* 5 — FAQ */}
          <FAQSection items={faq} />

          {/* 6 — Legal & data source */}
          <div
            className="border rounded-sm px-5 py-4 flex items-start gap-3"
            style={{ borderColor: 'rgba(58,42,30,0.9)', ...CARD_BG }}
          >
            <Info size={14} className="text-text-muted shrink-0 mt-0.5" />
            <div className="font-sans text-xs text-text-muted leading-relaxed space-y-1.5">
              <p className="font-bold text-text-secondary">Datengrundlage & Rechtshinweis</p>
              <p>
                Alle Berechnungen basieren auf dem Steuerrecht 2026. Quellen: §32a EStG (DE) ·
                Wet IB 2001 (NL) · IRPF Escala general + RDL 13/2022 (ES) · L. 190/2014
                Regime Forfettario (IT) · Art. 197 CGI (FR) · CIRS Art. 68 (PT).
                Annahmen: Einzelperson, keine Angestellten, reine Dienstleistungstätigkeit.{' '}
                <strong className="text-text-secondary">
                  Keine Steuerberatung — individuelle Beratung vor Standortentscheidung zwingend erforderlich.
                </strong>
              </p>
              <p>Datenstand: {data.generatedAt.substring(0, 10)}</p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
