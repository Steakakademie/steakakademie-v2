import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Thermometer, Camera, ClipboardList } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { PlanSchema, type Plan } from '@/lib/mein-protokoll/schema';
import PrintButton from './PrintButton';
import PlanNewsletter from './PlanNewsletter';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dein Plan — Mein Protokoll',
  description: 'Dein persönlicher 8-Wochen-Grillplan.',
  robots: { index: false, follow: false },
};

export default async function PlanPage() {
  const { user } = await requireCourseAccess('mein-protokoll', '/mein-protokoll/plan');

  const supabase = await createClient();
  const { data: row } = await supabase
    .from('protokolle')
    .select('id, plan, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Noch kein Plan generiert → zurück zum Fragebogen
  if (!row?.plan) {
    return (
      <>
        <Header />
        <main className="bg-surface-base">
          <section className="border-b border-border-subtle">
            <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
              <h1 className="font-serif text-3xl font-bold text-text-primary mb-4">
                Noch kein Plan vorhanden
              </h1>
              <p className="font-body text-text-secondary mb-8">
                Fülle den Fragebogen aus — dein 8-Wochen-Plan wird in Minuten generiert.
              </p>
              <Link
                href="/mein-protokoll/fragebogen"
                className="inline-flex items-center gap-2 px-7 py-3.5 font-sans font-bold text-base"
                style={{ background: '#C8882A', color: '#0D0A06' }}
              >
                Zum Fragebogen <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const parsed = PlanSchema.safeParse(row.plan);
  if (!parsed.success) {
    return (
      <>
        <Header />
        <main className="bg-surface-base">
          <section className="border-b border-border-subtle">
            <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
              <h1 className="font-serif text-3xl font-bold text-text-primary mb-4">
                Plan konnte nicht geladen werden
              </h1>
              <p className="font-body text-text-secondary mb-8">
                Bitte generiere deinen Plan erneut. Falls das Problem bleibt:
                pitmaster@steakakademie.de
              </p>
              <Link
                href="/mein-protokoll/fragebogen"
                className="inline-flex items-center gap-2 px-7 py-3.5 font-sans font-bold text-base"
                style={{ background: '#C8882A', color: '#0D0A06' }}
              >
                Erneut generieren <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const plan: Plan = parsed.data;

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
              <Link href="/mein-protokoll" className="hover:text-brand-gold transition-colors">Mein Protokoll</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">Dein Plan</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
              <div className="max-w-2xl">
                <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                  Dein persönlicher 8-Wochen-Plan
                </span>
                <h1 className="font-serif text-3xl lg:text-4xl font-bold text-text-primary mb-4">
                  Mein Protokoll
                </h1>
                <p className="font-body text-base text-text-secondary leading-relaxed">
                  {plan.intro}
                </p>
              </div>
              <PrintButton />
            </div>

            {/* Schwerpunkte */}
            <div className="mb-12 border border-brand-gold/20 p-6" style={{ background: 'rgba(200,136,42,0.04)' }}>
              <p className="font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-brand-gold mb-4">
                Deine Schwerpunkte über 8 Wochen
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {plan.focusAreas.map((area, i) => (
                  <li key={i} className="flex items-start gap-2 font-body text-sm text-text-secondary">
                    <ChevronRight size={14} className="text-brand-gold shrink-0 mt-0.5" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ausrüstungs-Check (Element 1) — interne Empfehlungen, noch kein Affiliate */}
            <div className="print:hidden mb-8 border border-border-subtle p-6">
              <p className="font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-brand-fire mb-2">
                Ausrüstungs-Check
              </p>
              <p className="font-body text-sm text-text-secondary leading-relaxed mb-4 max-w-2xl">
                Dieser Plan setzt zwei Dinge voraus: ein <strong className="text-text-primary">präzises
                Einstichthermometer</strong> und ein <strong className="text-text-primary">vorgewärmtes
                Holzbrett</strong> zum Rasten. Ohne sie arbeitest du mit Schätzwerten — und das ist nicht unser Stil.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/vergleich/fleischthermometer"
                  className="inline-flex items-center gap-2 px-4 py-2 border text-sm font-sans font-bold transition-colors hover:bg-brand-gold/10"
                  style={{ borderColor: 'rgba(200,136,42,0.6)', color: '#C8882A' }}
                >
                  <Thermometer size={15} /> Thermometer-Empfehlungen
                </Link>
                <Link
                  href="/kategorie/ausruestung"
                  className="inline-flex items-center gap-2 px-4 py-2 border text-sm font-sans font-bold transition-colors hover:bg-brand-gold/10"
                  style={{ borderColor: 'rgba(200,136,42,0.6)', color: '#C8882A' }}
                >
                  Ausrüstung ansehen <ArrowRight size={15} />
                </Link>
              </div>
              <p className="text-[10px] font-sans text-text-muted/60 mt-3">Unabhängige Empfehlungen — keine bezahlten Platzierungen.</p>
            </div>

            {/* Wochenstart-Erinnerung (Element 2) */}
            <PlanNewsletter />

            {/* Wochen */}
            <div className="space-y-8">
              {plan.weeks.map((w) => (
                <Fragment key={w.week}>
                <div className="border border-border-subtle p-6 break-inside-avoid">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-sans text-xs font-bold" style={{ color: 'rgba(200,136,42,0.6)' }}>
                      Woche {w.week}
                    </span>
                  </div>
                  <h2 className="font-serif text-xl font-bold text-text-primary mb-2">{w.theme}</h2>
                  {w.description && (
                    <p className="font-body text-sm text-text-secondary leading-relaxed mb-4">
                      {w.description}
                    </p>
                  )}

                  <div className="space-y-4">
                    {w.sessions.map((s, si) => (
                      <div
                        key={si}
                        className="border-l-2 pl-4 py-1"
                        style={{ borderColor: 'rgba(200,136,42,0.3)' }}
                      >
                        <p className="font-sans text-[10px] font-bold tracking-[0.12em] uppercase text-text-muted mb-2">
                          Session {si + 1}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                          {[
                            { label: 'Cut', value: s.cut },
                            { label: 'Methode', value: s.method },
                            { label: 'Grill-/Deckeltemp.', value: s.grillTemp },
                            { label: 'Kerntemp.', value: s.targetTemp },
                            { label: 'Zeitplanung', value: s.timePlanning },
                          ].filter((x) => x.value).map(({ label, value }) => (
                            <div key={label}>
                              <p className="font-sans text-[10px] font-bold tracking-[0.1em] uppercase text-text-muted mb-0.5">
                                {label}
                              </p>
                              <p className="font-serif text-sm font-bold text-text-primary">{value}</p>
                            </div>
                          ))}
                        </div>
                        {s.process && (
                          <p className="font-body text-sm text-text-secondary leading-relaxed mb-2">
                            <span className="font-bold text-text-primary">Ablauf: </span>
                            {s.process}
                          </p>
                        )}
                        <p className="font-body text-sm text-text-secondary leading-relaxed">
                          <span className="font-bold text-text-primary">Erfolgskriterium: </span>
                          {s.successCriterion}
                        </p>
                      </div>
                    ))}
                  </div>

                  {w.note && (
                    <p className="font-body text-sm text-text-secondary italic mt-4 pt-4 border-t border-border-subtle">
                      {w.note}
                    </p>
                  )}
                </div>

                {/* Fleischpass-Teaser nach Woche 1 (Element 4) */}
                {w.week === 1 && (
                  <div className="print:hidden border border-brand-gold/15 bg-surface-elevated p-5 flex items-start gap-3">
                    <ClipboardList size={18} className="text-brand-gold shrink-0 mt-0.5" />
                    <p className="font-body text-sm text-text-secondary leading-relaxed">
                      <strong className="text-text-primary">Session absolviert?</strong> Trag sie in deinen{' '}
                      <Link href="/fleischpass" className="text-brand-gold font-bold hover:text-brand-fire underline">Fleischpass</Link>{' '}
                      ein — Kerntemperatur, Methode, dein Urteil. Nach 8 Wochen zeigt dir die KI, wo du
                      konstant bist und wo noch Luft ist. Kostenlos.
                    </p>
                  </div>
                )}
                </Fragment>
              ))}
            </div>

            {/* Steak-Beichte Cross-Sell (Element 3) */}
            <div className="print:hidden mt-10 border border-brand-fire/25 p-6" style={{ background: 'rgba(232,80,24,0.05)' }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-fire/10 border border-brand-fire/25 flex items-center justify-center shrink-0">
                  <Camera size={16} className="text-brand-fire" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-1">
                    Wenn etwas schiefgeht
                  </p>
                  <p className="font-serif font-bold text-text-primary text-base mb-1.5">
                    Läuft eine Session nicht wie geplant?
                  </p>
                  <p className="font-body text-sm text-text-secondary leading-relaxed mb-4 max-w-2xl">
                    Gut. Das ist der wertvollste Datenpunkt, den du haben kannst — wenn du weißt, was
                    schiefgelaufen ist. Foto hochladen, kurz beschreiben, KI-Diagnose in Minuten.
                  </p>
                  <Link
                    href="/steak-beichte"
                    className="inline-flex items-center gap-2 px-5 py-2.5 font-sans text-sm font-bold transition-opacity hover:opacity-90"
                    style={{ background: '#E85018', color: '#fff' }}
                  >
                    Session analysieren lassen <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Abschluss */}
            <div className="mt-12 border-t border-brand-gold/20 pt-8">
              <p className="font-serif text-lg text-text-primary leading-relaxed max-w-2xl">
                {plan.closingNote}
              </p>
            </div>

            <p className="mt-8 border-t border-border-subtle pt-5 font-body text-xs text-text-muted leading-relaxed max-w-2xl">
              <strong className="text-text-secondary">Hinweis:</strong> Dieser Plan ist KI-generiert —
              Temperaturen und Zeiten sind Richtwerte ohne Gewähr. Die{' '}
              <strong className="text-text-secondary">Lebensmittelsicherheit</strong> (z. B. sichere
              Kerntemperaturen bei Geflügel und Hack) liegt in deiner Verantwortung. Mehr im{' '}
              <Link href="/ki-disclaimer" className="text-brand-gold hover:text-brand-fire underline">KI-Disclaimer</Link>.
            </p>

            {/* 8-Wochen-Abschluss-Framing (Element 5) */}
            <p className="print:hidden mt-8 max-w-2xl font-body text-sm text-text-secondary leading-relaxed">
              8 Wochen sind kein Kurs — das ist eine Gewohnheit, die du dir baust. Bist du am Ende
              bereit fürs nächste Level, generierst du einfach einen neuen Plan auf höherem Niveau.
            </p>

            <div className="print:hidden mt-6 flex flex-wrap gap-4">
              <PrintButton />
              <Link
                href="/mein-protokoll/fragebogen"
                className="inline-flex items-center gap-2 px-5 py-2.5 font-sans text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: '#C8882A', color: '#0D0A06' }}
              >
                Nächste Stufe: Neuen Plan generieren
              </Link>
            </div>

            {/* Diplom-Hinweis (Element 6) — ehrlich, kein Button */}
            <p className="print:hidden mt-10 pt-6 border-t border-border-subtle text-xs font-body text-text-muted leading-relaxed max-w-2xl">
              Die Steakakademie baut gerade die <strong className="text-text-secondary">Diplom-Tracks</strong> auf —
              strukturierte Lernpfade, die auf Plänen wie diesem aufbauen. Wer früh dabei sein will:
              die Wochenstart-Erinnerung oben genügt, du erfährst es zuerst.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
