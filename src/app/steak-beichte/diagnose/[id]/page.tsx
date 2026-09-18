import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import { ReportSchema, type Report } from '@/lib/steak-beichte/schema';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Deine Diagnose — Steak-Beichte',
  description: 'Deine persönliche KI-Grilldiagnose.',
  robots: { index: false, follow: false },
};

export default async function DiagnoseResultPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(`/steak-beichte/diagnose/${params.id}`)}`);
  }

  // RLS erlaubt nur eigene Diagnosen — fremde id liefert null.
  const { data: row } = await supabase
    .from('diagnosen')
    .select('id, report, created_at')
    .eq('id', params.id)
    .maybeSingle();

  if (!row?.report) {
    redirect('/steak-beichte/diagnose');
  }

  const parsed = ReportSchema.safeParse(row.report);
  if (!parsed.success) {
    return (
      <>
        <Header />
        <main className="bg-surface-base">
          <section className="border-b border-border-subtle">
            <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
              <h1 className="font-serif text-3xl font-bold text-text-primary mb-4">
                Diagnose konnte nicht geladen werden
              </h1>
              <p className="font-body text-text-secondary mb-8">
                Bitte fordere eine neue Diagnose an. Falls das Problem bleibt:
                pitmaster@steakakademie.de
              </p>
              <Link
                href="/steak-beichte/diagnose"
                className="inline-flex items-center gap-2 px-7 py-3.5 font-sans font-bold text-base"
                style={{ background: '#C8882A', color: '#0D0A06' }}
              >
                Neue Diagnose <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const report: Report = parsed.data;

  return (
    <>
      <Header />
      <main className="bg-surface-base print:bg-white">
        <section className="border-b border-border-subtle print:border-0">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <nav
              className="print:hidden flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/steak-beichte" className="hover:text-brand-gold transition-colors">Steak-Beichte</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">Deine Diagnose</span>
            </nav>

            <div className="max-w-2xl mb-10">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                Deine Diagnose
              </span>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold text-text-primary mb-4">
                Die ehrliche Einschätzung
              </h1>
              <p className="font-body text-base text-text-primary leading-relaxed font-bold">
                {report.kurzdiagnose}
              </p>
            </div>

            {/* Ursachen-Analyse */}
            <Block label="Ursachen-Analyse">
              <ul className="space-y-4">
                {report.ursachen.map((u, i) => (
                  <li key={i} className="border-l-2 pl-4 py-1" style={{ borderColor: 'rgba(200,136,42,0.3)' }}>
                    <p className="font-serif text-base font-bold text-text-primary mb-1">{u.titel}</p>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{u.erklaerung}</p>
                  </li>
                ))}
              </ul>
            </Block>

            {/* Fehler-Einordnung */}
            <Block label="Fehler-Einordnung">
              <p className="font-body text-sm text-text-secondary leading-relaxed">{report.fehlerEinordnung}</p>
            </Block>

            {/* Korrektur-Protokoll */}
            <Block label="Korrektur-Protokoll">
              <ol className="space-y-4">
                {report.korrekturProtokoll.map((k, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-sans text-sm font-bold shrink-0" style={{ color: '#C8882A' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="font-serif text-base font-bold text-text-primary mb-1">{k.schritt}</p>
                      <p className="font-body text-sm text-text-secondary leading-relaxed">{k.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Block>

            {/* Nächste-Session-Plan */}
            <Block label="Nächste-Session-Plan">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Ziel',             value: report.naechsteSession.ziel },
                  { label: 'Setup',            value: report.naechsteSession.setup },
                  { label: 'Erfolgskriterium', value: report.naechsteSession.erfolgskriterium },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-sans text-[10px] font-bold tracking-[0.1em] uppercase text-text-muted mb-1.5">{label}</p>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            </Block>

            <p className="mt-8 border-t border-border-subtle pt-5 font-body text-xs text-text-muted leading-relaxed max-w-2xl">
              <strong className="text-text-secondary">Hinweis:</strong> Diese Diagnose ist eine
              KI-generierte Einschätzung — ohne Gewähr und kein Ersatz für deine eigene Prüfung.
              Die <strong className="text-text-secondary">Lebensmittelsicherheit liegt in deiner
              Verantwortung</strong>; im Zweifel verdorbenes Fleisch entsorgen. Mehr im{' '}
              <Link href="/ki-disclaimer" className="text-brand-gold hover:text-brand-fire underline">KI-Disclaimer</Link>.
            </p>

            <div className="print:hidden mt-12 flex flex-wrap gap-4">
              <Link
                href="/steak-beichte/diagnose"
                className="inline-flex items-center gap-2 px-7 py-3.5 font-sans font-bold text-base"
                style={{ background: '#C8882A', color: '#0D0A06' }}
              >
                Weitere Diagnose <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-10 border border-border-subtle p-6 break-inside-avoid">
      <p className="font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-brand-gold mb-4">{label}</p>
      {children}
    </div>
  );
}
