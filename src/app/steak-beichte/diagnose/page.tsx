import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import DiagnoseForm from './DiagnoseForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Diagnose — Steak-Beichte',
  description: 'Beichte deine missglückte Grillsitzung — die KI liefert die ehrliche Diagnose.',
  robots: { index: false, follow: false },
};

const ROUTE = '/steak-beichte/diagnose';

export default async function DiagnosePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(ROUTE)}`);
  }

  const { data: credits } = await supabase
    .from('diagnose_credits')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle();

  const balance = credits?.balance ?? 0;

  return (
    <>
      <Header />
      <main className="bg-surface-base">
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <nav
              className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/steak-beichte" className="hover:text-brand-gold transition-colors">Steak-Beichte</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">Diagnose</span>
            </nav>

            {balance < 1 ? (
              <div className="max-w-2xl">
                <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                  Kein Guthaben
                </span>
                <h1 className="font-serif text-3xl lg:text-4xl font-bold text-text-primary mb-4">
                  Du hast aktuell keine Diagnose offen.
                </h1>
                <p className="font-body text-base text-text-secondary leading-relaxed mb-8">
                  Sobald du eine Einzeldiagnose oder ein 5er-Pack kaufst, schreiben wir dir
                  dein Guthaben automatisch gut — und du landest direkt hier.
                </p>
                <Link
                  href="/steak-beichte"
                  className="inline-flex items-center gap-2 px-7 py-3.5 font-sans font-bold text-base"
                  style={{ background: '#C8882A', color: '#0D0A06' }}
                >
                  Zur Steak-Beichte <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <>
                <div className="max-w-2xl mb-10">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire">
                      Deine Beichte
                    </span>
                    <span className="font-sans text-xs font-bold px-3 py-1 border" style={{ borderColor: 'rgba(200,136,42,0.3)', color: '#C8882A' }}>
                      {balance} {balance === 1 ? 'Diagnose' : 'Diagnosen'} offen
                    </span>
                  </div>
                  <h1 className="font-serif text-3xl lg:text-4xl font-bold text-text-primary mb-4">
                    Was ist schiefgelaufen?
                  </h1>
                  <p className="font-body text-base text-text-secondary leading-relaxed">
                    Beschreibe die Session so konkret wie möglich. Ein Foto des Ergebnisses
                    macht die Diagnose deutlich präziser — ist aber optional. Die Analyse
                    dauert bis zu 60 Sekunden und kostet dich eine Diagnose.
                  </p>
                </div>

                <DiagnoseForm />
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
