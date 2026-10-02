import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { createClient } from '@/lib/supabase/server';
import { VERKAUF_AN } from '@/lib/mein-protokoll/angebot';
import { AnswersSchema } from '@/lib/mein-protokoll/schema';
import { ladeStand } from '@/lib/mein-protokoll/stand';
import { BESTAETIGUNG_KORREKTUR, BESTAETIGUNG_NEU } from '@/lib/mein-protokoll/texte';
import FragebogenForm from './FragebogenForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Fragebogen — Mein Protokoll',
  description: 'Beantworte 5 Fragen — das System generiert deinen persönlichen 8-Wochen-Grillplan.',
  robots: { index: false, follow: false },
};

const KNOPF = 'inline-flex items-center gap-2 px-7 py-3.5 font-sans font-bold text-base';
const GOLD = { background: '#C8882A', color: '#0D0A06' } as const;

export default async function FragebogenPage(props: {
  searchParams: Promise<{ modus?: string; von?: string }>;
}) {
  const { user } = await requireCourseAccess('mein-protokoll', '/mein-protokoll/fragebogen');
  const { modus, von } = await props.searchParams;

  const supabase = await createClient();
  const stand = await ladeStand(supabase, user.id);
  const g = stand.guthaben;

  // Welches Protokoll soll korrigiert werden? Ausdrücklich genannt (von=…) oder
  // das jüngste, dessen Korrektur noch offen ist.
  const ziel = modus === 'korrektur'
    ? (von ? g.protokolle.find((p) => p.basisId === von && !p.korrigiert) ?? null : g.korrigierbar)
    : null;

  const zielAntworten = ziel
    ? AnswersSchema.safeParse(stand.zeilen.find((z) => z.id === ziel.basisId)?.answers)
    : null;

  let inhalt: React.ReactNode;

  if (!stand.verfuegbar) {
    inhalt = (
      <Hinweis titel="Gerade nicht verfügbar">
        Die Plan-Erstellung ist im Moment nicht erreichbar. Bitte versuch es später noch einmal —
        dein Guthaben bleibt unberührt. Hält das an: pitmaster@steakakademie.de
      </Hinweis>
    );
  } else if (ziel) {
    inhalt = (
      <>
        <Kopf
          eyebrow={`Protokoll ${ziel.nr} — kostenlose Korrektur`}
          titel="Was passt nicht?"
          text="Pass deine Antworten an und schreib dazu, was am Plan nicht stimmt. Der Plan wird einmal neu erstellt und ersetzt den bisherigen. Das ist die eine Korrektur, die zu diesem Protokoll gehört."
        />
        <FragebogenForm
          modus="korrektur"
          korrekturVon={ziel.basisId}
          start={zielAntworten?.success ? zielAntworten.data : undefined}
          bestaetigung={BESTAETIGUNG_KORREKTUR}
        />
      </>
    );
  } else if (g.frei > 0) {
    const folge = g.verbraucht > 0;
    inhalt = (
      <>
        <Kopf
          eyebrow={`Protokoll ${g.verbraucht + 1} von ${g.gekauft}`}
          titel={folge ? 'Dein nächstes Protokoll.' : '5 Fragen. Dann dein Plan.'}
          text={folge
            ? 'Der neue Plan baut auf deinem letzten auf: neue Cuts, neue Techniken, höhere Anforderungen. Aktualisiere deine Antworten — vor allem den Erfahrungsstand.'
            : 'Jede Antwort fließt direkt in deinen 8-Wochen-Plan. Je konkreter du bist, desto präziser passt der Plan zu deinem Setup. Die Erstellung dauert ein bis zwei Minuten.'}
        />
        <FragebogenForm modus="neu" bestaetigung={BESTAETIGUNG_NEU} />
      </>
    );
  } else {
    inhalt = (
      <Hinweis titel={g.verbraucht > 0 ? 'Dein Guthaben ist verbraucht' : 'Kein Guthaben vorhanden'}>
        {g.verbraucht > 0
          ? `Du hast ${g.verbraucht === 1 ? 'dein Protokoll' : `deine ${g.verbraucht} Protokolle`} bereits erstellt.`
          : 'Für dein Konto ist kein Protokoll gutgeschrieben. Wenn du gekauft hast und das nicht stimmt: pitmaster@steakakademie.de'}
        {g.korrigierbar ? ' Eine kostenlose Korrektur steht dir noch zu.' : ''}
        <span className="mt-6 flex flex-wrap justify-center gap-3">
          {g.verbraucht > 0 && (
            <Link href="/mein-protokoll/plan" className={KNOPF} style={GOLD}>
              Zu meinem Plan <ArrowRight size={16} />
            </Link>
          )}
          {g.korrigierbar && (
            <Link
              href={`/mein-protokoll/fragebogen?modus=korrektur&von=${g.korrigierbar.basisId}`}
              className={`${KNOPF} border border-brand-gold/60 text-brand-gold`}
            >
              Kostenlose Korrektur nutzen
            </Link>
          )}
          {VERKAUF_AN && (
            <Link href="/mein-protokoll#kaufen" className={`${KNOPF} border border-brand-gold/60 text-brand-gold`}>
              Weiteres Protokoll kaufen
            </Link>
          )}
        </span>
      </Hinweis>
    );
  }

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
              <Link href="/mein-protokoll" className="hover:text-brand-gold transition-colors">Mein Protokoll</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">Fragebogen</span>
            </nav>

            {inhalt}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Kopf({ eyebrow, titel, text }: { eyebrow: string; titel: string; text: string }) {
  return (
    <div className="max-w-2xl mb-10">
      <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
        {eyebrow}
      </span>
      <h1 className="font-serif text-3xl lg:text-4xl font-bold text-text-primary mb-4">{titel}</h1>
      <p className="font-body text-base text-text-secondary leading-relaxed">{text}</p>
    </div>
  );
}

function Hinweis({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto py-8 text-center">
      <h1 className="font-serif text-3xl font-bold text-text-primary mb-4">{titel}</h1>
      <p className="font-body text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}
