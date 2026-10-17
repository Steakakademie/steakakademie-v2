import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { BadgeCheck, ShieldAlert } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { stufeByNr, DIPLOM_HINWEIS } from '@/lib/diplome/stufen';
import { zerlegeKennung, kennungAus } from '@/lib/urkunde/kennung';

/**
 * Öffentliche Prüfseite einer Urkunde (17.10.2026). Wer eine Urkunde vorgelegt
 * bekommt, prüft hier Name, Grad und Datum. Abgefragt wird nur über
 * urkunde_pruefen(nr, code) — ohne den Prüfcode gibt es keinen Treffer, eine
 * fortlaufende Nummer allein verrät also keine Namen.
 *
 * noindex: Auf der Seite steht ein Klarname. Sie ist zum Vorzeigen gedacht,
 * nicht zum Finden über Suchmaschinen.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Urkunde prüfen — Steakakademie',
  description: 'Echtheitsprüfung einer Urkunde der Steakakademie.',
  robots: { index: false, follow: false },
};

// Nicht aus render.ts importieren: das zieht sharp und die Vorlagen in die Seite.
const datumFormat = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' });

type Treffer = { nr: string; name: string; stufe: number; ausgestellt_am: string; gueltig: boolean };

async function pruefe(nr: string, code: string): Promise<Treffer | null | 'fehler'> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return 'fehler';
  try {
    const db = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.rpc('urkunde_pruefen', { p_nr: nr, p_code: code });
    if (error) {
      console.error('[urkunde/pruefen]', error.message);
      return 'fehler';
    }
    const zeile = (Array.isArray(data) ? data[0] : data) as Treffer | undefined;
    return zeile ?? null;
  } catch {
    return 'fehler';
  }
}

export default async function UrkundePruefenPage(props: { params: Promise<{ kennung: string }> }) {
  const { kennung: roh } = await props.params;
  let dekodiert = roh;
  try { dekodiert = decodeURIComponent(roh); } catch { /* kaputte Kodierung → keine Kennung */ }
  const kennung = zerlegeKennung(dekodiert);
  const ergebnis = kennung ? await pruefe(kennung.nr, kennung.code) : null;
  const stufe = ergebnis && ergebnis !== 'fehler' ? stufeByNr(ergebnis.stufe) : undefined;

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-surface-dark px-4 py-16">
        <div className="mx-auto max-w-xl">
          <p className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
            Echtheitsprüfung
          </p>

          {ergebnis === 'fehler' ? (
            <div className="border border-border-subtle bg-surface-elevated/60 p-6">
              <h1 className="font-serif text-2xl font-bold text-text-light mb-3">Prüfung gerade nicht möglich</h1>
              <p className="font-sans text-sm text-text-secondary">Bitte versuch es in ein paar Minuten noch einmal.</p>
            </div>
          ) : ergebnis && ergebnis.gueltig ? (
            <div className="border border-brand-gold/40 bg-surface-elevated/60 p-6">
              <BadgeCheck size={32} className="text-brand-gold mb-4" aria-hidden />
              <h1 className="font-serif text-2xl font-bold text-text-light mb-1">Diese Urkunde ist echt.</h1>
              <p className="font-sans text-sm text-text-secondary mb-6">
                Ausgestellt von der Steakakademie für die bestandene Prüfung.
              </p>
              <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-3 font-sans text-sm">
                <dt className="text-text-muted">Name</dt>
                <dd className="text-text-light font-semibold" data-clarity-mask="true">{ergebnis.name}</dd>
                <dt className="text-text-muted">Grad</dt>
                <dd className="text-text-light">
                  {stufe ? `${stufe.cert} · Stufe ${stufe.nr} („${stufe.title}“)` : `Stufe ${ergebnis.stufe}`}
                </dd>
                <dt className="text-text-muted">Ausgestellt am</dt>
                <dd className="text-text-light">{datumFormat.format(new Date(ergebnis.ausgestellt_am))}</dd>
                <dt className="text-text-muted">Urkunden-Nr.</dt>
                <dd className="text-text-light font-mono">{kennung ? kennungAus(kennung.nr, kennung.code) : ergebnis.nr}</dd>
              </dl>
              <p className="mt-6 font-sans text-xs text-text-muted">{DIPLOM_HINWEIS}</p>
            </div>
          ) : (
            <div className="border border-border-subtle bg-surface-elevated/60 p-6">
              <ShieldAlert size={32} className="text-text-muted mb-4" aria-hidden />
              <h1 className="font-serif text-2xl font-bold text-text-light mb-3">
                {ergebnis && !ergebnis.gueltig ? 'Diese Urkunde ist nicht mehr gültig.' : 'Keine Urkunde zu dieser Nummer.'}
              </h1>
              <p className="font-sans text-sm text-text-secondary">
                Prüf die Urkunden-Nummer samt Prüfcode (Form „SA-2026-0001-ABC234“). Sie steht unten links auf der
                Urkunde.
              </p>
            </div>
          )}

          <p className="mt-8 font-sans text-sm text-text-secondary">
            <Link href="/urkunde" className="underline hover:text-text-light">Andere Urkunde prüfen</Link>
            {' · '}
            <Link href="/diplome" className="underline hover:text-text-light">Zum Grillmeister-Diplom</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
