import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { generateNLPage, generateAllNLPages, type PageSection, type SectionId } from '@/services/pageGenerator';
import {
  ChevronRight,
  TrendingUp,
  Euro,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

// ─── Static generation ────────────────────────────────────────────────────────

export function generateStaticParams() {
  return generateAllNLPages().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const page = tryGenerate(params.slug);
  if (!page) return {};
  const { meta } = page;
  return {
    title:       meta.title,
    description: meta.description,
    keywords:    meta.keywords.join(', '),
    alternates:  { canonical: meta.canonical },
    openGraph: {
      title:       meta.ogTitle,
      description: meta.ogDescription,
      url:         meta.canonical,
      type:        'website',
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Props { params: Promise<{ slug: string }> }

function tryGenerate(slug: string) {
  try { return generateNLPage(slug); } catch { return null; }
}

const EUR_NL = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const SECTION_ICON: Record<SectionId, React.ElementType> = {
  'income-overview':  TrendingUp,
  'tax-breakdown':    Euro,
  'market-validation': ShieldCheck,
  'tax-advantages':   CheckCircle2,
  'faq':              Sparkles,
};

const GOLD_BORDER = { borderColor: 'rgba(200,136,42,0.22)' };
const GOLD_BG     = { background: 'linear-gradient(135deg, rgba(200,136,42,0.08) 0%, rgba(232,80,24,0.02) 100%)' };

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ section }: { section: PageSection }) {
  const Icon = SECTION_ICON[section.id] ?? TrendingUp;
  return (
    <section
      aria-labelledby={section.id}
      className="border rounded-sm"
      style={{ ...GOLD_BORDER, background: '#1E1410' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 border-b"
        style={{ borderColor: 'rgba(200,136,42,0.18)', ...GOLD_BG }}
      >
        <Icon size={18} className="text-brand-gold shrink-0" />
        <h2
          id={section.id}
          className="font-serif text-lg font-bold text-text-light leading-snug"
        >
          {section.heading}
        </h2>
      </div>

      {/* Lead */}
      {section.lead && (
        <p className="px-6 pt-5 pb-1 font-body text-sm leading-relaxed text-text-primary/80">
          {section.lead}
        </p>
      )}

      {/* Data rows */}
      <div className="px-6 py-4 divide-y" style={{ borderColor: 'rgba(58,42,30,0.8)' }}>
        {section.items.map((item, i) => (
          <div
            key={i}
            className="flex items-baseline justify-between gap-4 py-3"
            style={i === section.items.length - 1 && item.label.startsWith('★')
              ? { background: 'rgba(200,136,42,0.06)', margin: '0 -24px -16px', padding: '12px 24px 16px' }
              : {}}
          >
            <span className={`font-sans text-sm ${item.label.startsWith('★') ? 'font-bold text-brand-gold' : 'text-text-secondary'}`}>
              {item.label.replace('★ ', '')}
              {item.note && (
                <span className="block text-xs text-text-muted font-normal mt-0.5">{item.note}</span>
              )}
            </span>
            <span className={`font-sans font-bold tabular-nums shrink-0 ${item.label.startsWith('★') ? 'text-lg text-brand-gold' : 'text-text-light'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqSection({ items }: { items: Array<{ question: string; answer: string }> }) {
  return (
    <section aria-labelledby="faq-heading">
      <div
        className="flex items-center gap-3 px-6 py-4 border rounded-t-sm border-b-0"
        style={{ ...GOLD_BORDER, ...GOLD_BG }}
      >
        <Sparkles size={18} className="text-brand-gold shrink-0" />
        <h2 id="faq-heading" className="font-serif text-lg font-bold text-text-light">
          Veelgestelde vragen
        </h2>
      </div>
      <div className="border rounded-b-sm divide-y" style={GOLD_BORDER}>
        {items.map((item, i) => (
          <details key={i} className="group px-6 py-4" open={i === 0}>
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

function SidebarStats({ ev }: { ev: ReturnType<typeof generateNLPage>['evaluation'] }) {
  const stats = [
    { label: 'Netto / maand',  value: EUR_NL(ev.tax.monthlyNet) },
    { label: 'Netto / jaar',   value: EUR_NL(ev.annualNet) },
    { label: 'Belastingdruk',  value: `${(ev.tax.effectiveRate * 100).toFixed(1)} %` },
    { label: 'Marktscore',     value: `${ev.marketScore} / 100` },
  ];
  return (
    <div className="border rounded-sm overflow-hidden" style={GOLD_BORDER}>
      <div className="px-5 py-3 border-b text-xs font-sans font-bold tracking-widest uppercase text-brand-gold" style={{ borderColor: 'rgba(200,136,42,0.22)', ...GOLD_BG }}>
        Snel overzicht
      </div>
      <div className="divide-y" style={{ borderColor: 'rgba(58,42,30,0.8)', background: '#1E1410' }}>
        {stats.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-5 py-3 gap-3">
            <span className="font-sans text-xs text-text-secondary">{label}</span>
            <span className="font-sans font-bold text-sm text-text-light tabular-nums">{value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-5 py-3 gap-3" style={{ background: 'rgba(200,136,42,0.06)' }}>
          <span className="font-sans text-xs font-bold text-brand-gold">Marktpositie</span>
          <span className="font-sans font-bold text-sm text-brand-gold">{ev.viabilityLabel}</span>
        </div>
      </div>
    </div>
  );
}

function SidebarNLvsDE({ savings }: { savings: number }) {
  if (savings <= 0) return null;
  return (
    <div
      className="border rounded-sm p-5"
      style={{ borderColor: 'rgba(200,136,42,0.3)', background: 'linear-gradient(135deg, rgba(200,136,42,0.10) 0%, rgba(232,80,24,0.04) 100%)' }}
    >
      <p className="font-sans text-xs font-bold tracking-widest uppercase text-brand-gold mb-2">
        NL vs. Duitsland
      </p>
      <p className="font-serif text-2xl font-bold text-text-light">
        + {EUR_NL(savings)}
        <span className="font-sans text-sm font-normal text-text-secondary ml-1">/ maand</span>
      </p>
      <p className="font-body text-xs text-text-secondary mt-2 leading-relaxed">
        Netto meer als ZZP in Nederland dan als equivalent in Duitsland — bij dezelfde omzet.
      </p>
    </div>
  );
}

function SidebarCTA({ niche }: { niche: string }) {
  return (
    <div className="border rounded-sm p-5 space-y-3" style={{ borderColor: 'rgba(232,80,24,0.3)', background: 'rgba(232,80,24,0.04)' }}>
      <p className="font-sans text-xs font-bold tracking-widest uppercase text-brand-fire">
        Persoonlijke berekening
      </p>
      <p className="font-body text-sm text-text-secondary leading-relaxed">
        Vul jouw eigen omzet in als ZZP {niche} en zie exact wat jij netto overhoudt.
      </p>
      <Link
        href="/zzp-niche"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 font-sans font-bold text-sm text-white rounded-sm transition-opacity hover:opacity-90"
        style={{ background: '#E85018' }}
      >
        Bereken mijn netto
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ZZPNichePage(props: Props) {
  const params = await props.params;
  const page = tryGenerate(params.slug);
  if (!page) notFound();

  const { hero, highlights, sections, faq, structuredData, evaluation } = page;
  const { niche, savingsVsDE } = evaluation;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Header />

      <main>

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={11} />
            <Link href="/zzp-niche" className="hover:text-brand-gold transition-colors">ZZP Nederland</Link>
            <ChevronRight size={11} />
            <span className="text-text-secondary">{niche.title}</span>
          </nav>
        </div>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div
          className="mt-6 mb-10"
          style={{
            background: 'linear-gradient(180deg, rgba(200,136,42,0.07) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(200,136,42,0.12)',
          }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">

            {/* Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full"
                style={{ background: 'rgba(200,136,42,0.14)', color: '#C8882A', border: '1px solid rgba(200,136,42,0.3)' }}
              >
                {hero.badge}
              </span>
              <span
                className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full"
                style={{ background: 'rgba(232,80,24,0.10)', color: '#E85018', border: '1px solid rgba(232,80,24,0.25)' }}
              >
                ZZP {niche.category.replace('-', ' ')}
              </span>
            </div>

            {/* H1 */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5 max-w-content">
              {hero.h1}
            </h1>

            {/* Subtitle */}
            <p className="font-body text-lg text-text-primary/80 leading-relaxed max-w-content mb-8">
              {hero.subtitle}
            </p>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/zzp-niche"
                className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm text-white rounded-sm transition-opacity hover:opacity-90"
                style={{ background: '#E85018' }}
              >
                {hero.ctaLabel}
                <ArrowRight size={15} />
              </Link>
              <Link
                href="#tax-breakdown"
                className="font-sans text-sm text-brand-gold hover:text-text-light transition-colors underline underline-offset-4"
                style={{ textDecorationColor: 'rgba(200,136,42,0.4)' }}
              >
                Bekijk volledige belastingberekening
              </Link>
            </div>
          </div>
        </div>

        {/* ── Highlights strip ────────────────────────────────────────────── */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {highlights.map((h, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-4 rounded-sm border font-body text-sm text-text-primary/85 leading-snug"
                style={{ borderColor: 'rgba(200,136,42,0.16)', background: '#1E1410' }}
              >
                <span className="text-brand-gold font-bold shrink-0 mt-0.5">✦</span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Content grid ────────────────────────────────────────────────── */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

            {/* Main */}
            <div className="space-y-8">
              {sections.map((section) => (
                <div key={section.id} id={section.id}>
                  <SectionCard section={section} />
                </div>
              ))}
              <FaqSection items={faq} />
            </div>

            {/* Sidebar */}
            <aside className="space-y-5 lg:sticky lg:top-6 self-start">
              <SidebarStats ev={evaluation} />
              {savingsVsDE > 0 && <SidebarNLvsDE savings={savingsVsDE} />}
              <SidebarCTA niche={niche.title} />

              {/* Related niches link */}
              <div
                className="border rounded-sm p-5"
                style={{ borderColor: 'rgba(58,42,30,0.9)', background: '#1E1410' }}
              >
                <p className="font-sans text-xs font-bold tracking-widest uppercase text-text-muted mb-3">
                  Andere ZZP-niches
                </p>
                <Link
                  href="/zzp-niche"
                  className="flex items-center gap-2 font-sans text-sm text-text-secondary hover:text-brand-gold transition-colors"
                >
                  <ChevronRight size={13} className="text-brand-gold" />
                  Alle ZZP-niche overzichten bekijken
                </Link>
              </div>
            </aside>

          </div>
        </div>

      </main>

      <Footer />
    </>
  );
}
