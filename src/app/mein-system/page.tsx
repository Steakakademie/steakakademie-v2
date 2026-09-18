import type { Metadata } from 'next';
import { redirect }      from 'next/navigation';
import Link              from 'next/link';
import {
  ChevronRight, Lock, Unlock, BarChart3,
  Rocket, Zap, ArrowRight, BookOpen,
} from 'lucide-react';
import Header  from '@/components/layout/Header';
import Footer  from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title:  'Mein System — Das Ehrliche System',
  description: 'Dein persönlicher Zugang zum Ehrlichen System.',
  robots: { index: false, follow: false },
};

// ─── Produkt-Definitionen ─────────────────────────────────────────────────────

const SAULEN = [
  {
    slug:        'gruender-schmiede',
    nummer:      'I',
    titel:       'Gründer-Schmiede',
    untertitel:  'Idee → Gewerbeanmeldung → erste Website. In 72 Stunden.',
    beschreibung:
      'Schritt-für-Schritt-System: Rechtsform wählen, Gewerbe anmelden, Domain & Hosting einrichten, erste Website live. Kein Agentur-Budget nötig.',
    Icon:        Rocket,
    href:        '/gruender-schmiede',
    toolHref:    null as string | null,
    toolLabel:   null as string | null,
    // Checkout AUS (Uwe, 03.09.2026): "Gründung-Sprint bleibt aus, dazu haben
    // wir bereits ein anderes Produkt entwickelt." Digistore 695894 bleibt im
    // Konto aktiv und fuer DS-de genehmigt — nur verkauft wird es hier nicht
    // mehr. Gleiche Stilllegung wie bei 695900 darunter.
    //
    // Anlass: Am 02.09. wurde der Gruender-Bereich deindexiert und aus
    // Navigation und Footer ausgebaut (63a08d4, 641b346), der Checkout aber
    // nicht mitgenommen. noindex heisst nur "nicht in Google" — diese Seite
    // lieferte weiter 200 und war ueber die URL kaufbar.
    checkoutUrl: null as string | null,
  },
  {
    slug:        'steuer-matrix',
    nummer:      'II',
    titel:       'Steuer-Matrix',
    untertitel:  'Wieviel bleibt dir wirklich übrig? 23 Länder im Vergleich.',
    beschreibung:
      'Interaktiver Netto-Rechner für 23 Länder weltweit. Echte Pflichtabgaben — kein Durchschnitt, keine Hochglanz-PR.',
    Icon:        BarChart3,
    href:        '/steuer-matrix',
    toolHref:    '/steuer-matrix/rechner' as string | null,
    toolLabel:   'Rechner öffnen' as string | null,
    // Checkout AUS (Uwe, 03.09.2026): "Steuer-Matrix ebenfalls unsichtbar
    // schalten." Digistore 695797 bleibt im Konto aktiv und genehmigt.
    // Wer bereits gekauft hat, behaelt seinen Zugang — das laeuft ueber
    // hasAccess in src/app/steuer-matrix/page.tsx, nicht ueber diese Zeile.
    checkoutUrl: null as string | null,
  },
  {
    slug:        'eigenregie',
    nummer:      'III',
    titel:       'Eigenregie',
    untertitel:  'Deine Website raus aus der Agentur-Abhängigkeit.',
    beschreibung:
      'Migration in eigene Infrastruktur: Next.js, Vercel, GitHub. Full-Ownership-Modell. KI-gesteuert. 0 % Plattform-Abzug.',
    Icon:        Zap,
    href:        '/eigenregie',
    toolHref:    null as string | null,
    toolLabel:   null as string | null,
    // 695900 steht laut Reaktivierungs-Checkliste auf „In Vorbereitung" (kein Kurs/DB-Mapping
    // → würde kassieren ohne Auslieferung). Checkout AUS bis Substanz + Testkauf verifiziert.
    checkoutUrl: null as string | null,
  },
] as const;

interface CourseRow { slug: string; price: number }

// ─── Seite ────────────────────────────────────────────────────────────────────

export default async function MeinSystemPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirectTo=/mein-system');

  // Aktive Buchungen
  const { data: bookingRows } = await supabase
    .from('bookings')
    .select('status, courses!inner(slug)')
    .eq('user_id', user.id)
    .in('status', ['active', 'confirmed']);

  const ownedSlugs = new Set<string>(
    (bookingRows ?? []).map(
      (b) => (b.courses as unknown as { slug: string }).slug,
    ),
  );

  // Preise aus DB (graceful fallback)
  const { data: courseRows } = await supabase
    .from('courses')
    .select('slug, price')
    .in('slug', SAULEN.map((s) => s.slug));

  const priceMap = Object.fromEntries(
    ((courseRows as CourseRow[]) ?? []).map((c) => [c.slug, c.price]),
  );

  const eur = (n: number) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency', currency: 'EUR', minimumFractionDigits: 0,
    }).format(n);

  return (
    <>
      <Header />

      <main className="bg-surface-base min-h-screen">

        {/* ── Breadcrumb ────────────────────────────────────────────── */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={11} />
            <Link href="/ehrliches-system" className="hover:text-brand-gold transition-colors">
              Das Ehrliche System
            </Link>
            <ChevronRight size={11} />
            <span className="text-text-secondary">Mein Zugang</span>
          </nav>
        </div>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div
          className="mt-6 mb-10 border-b"
          style={{
            background:  'linear-gradient(180deg, rgba(200,136,42,0.07) 0%, transparent 100%)',
            borderColor: 'rgba(200,136,42,0.12)',
          }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <span
              className="inline-block font-sans text-[10px] font-bold tracking-[0.16em] uppercase px-3 py-1 mb-3"
              style={{
                background: 'rgba(200,136,42,0.14)',
                color:      '#C8882A',
                border:     '1px solid rgba(200,136,42,0.28)',
              }}
            >
              Mitgliederbereich
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-light leading-tight mb-2">
              Mein System
            </h1>
            <p className="font-body text-sm text-text-secondary">
              {user.email}
              {ownedSlugs.size > 0 && (
                <span className="ml-3 font-sans text-xs text-green-400">
                  · {ownedSlugs.size} Modul{ownedSlugs.size !== 1 ? 'e' : ''} aktiv
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── Inhalt ────────────────────────────────────────────────── */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-24">

          {/* Banner: Zugang aktiv */}
          {ownedSlugs.size > 0 && (
            <div
              className="border mb-8 px-5 py-4 flex items-center gap-3"
              style={{
                borderColor: 'rgba(74,222,128,0.25)',
                background:  'rgba(74,222,128,0.05)',
              }}
            >
              <Unlock size={16} className="text-green-400 shrink-0" />
              <p className="font-sans text-sm text-green-400">
                Freigeschaltet:{' '}
                <strong>
                  {SAULEN
                    .filter((s) => ownedSlugs.has(s.slug))
                    .map((s) => `Säule ${s.nummer}`)
                    .join(' · ')}
                </strong>
              </p>
            </div>
          )}

          {/* Banner: noch kein Kauf */}
          {ownedSlugs.size === 0 && (
            <div
              className="border mb-8 px-5 py-4 flex items-start gap-3"
              style={{
                borderColor: 'rgba(200,136,42,0.2)',
                background:  'rgba(200,136,42,0.04)',
              }}
            >
              <BookOpen size={16} className="text-brand-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-sm text-text-secondary">
                  Noch kein Modul freigeschaltet.
                </p>
                <Link
                  href="/ehrliches-system"
                  className="inline-flex items-center gap-1 mt-1.5 text-xs font-sans text-brand-gold hover:text-brand-gold/80 transition-colors"
                >
                  Systemübersicht <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          )}

          {/* ── Säulen-Grid ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SAULEN.map((saule) => {
              const owned = ownedSlugs.has(saule.slug);
              const price = priceMap[saule.slug];
              const { Icon } = saule;

              return (
                <div
                  key={saule.slug}
                  className="border flex flex-col"
                  style={{
                    borderColor: owned
                      ? 'rgba(74,222,128,0.3)'
                      : 'rgba(200,136,42,0.18)',
                    background: owned ? 'rgba(74,222,128,0.04)' : '#1A1209',
                  }}
                >
                  {/* Kopf */}
                  <div
                    className="px-5 py-4 border-b flex items-center justify-between"
                    style={{
                      borderColor: owned
                        ? 'rgba(74,222,128,0.15)'
                        : 'rgba(200,136,42,0.12)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={18} style={{ color: owned ? '#4ade80' : '#C8882A' }} />
                      <span
                        className="font-sans text-[10px] font-bold tracking-[0.14em] uppercase"
                        style={{ color: owned ? '#4ade80' : '#C8882A' }}
                      >
                        Säule {saule.nummer}
                      </span>
                    </div>
                    {owned ? (
                      <span
                        className="font-sans text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-0.5"
                        style={{
                          background: 'rgba(74,222,128,0.14)',
                          color:      '#4ade80',
                          border:     '1px solid rgba(74,222,128,0.3)',
                        }}
                      >
                        Aktiv
                      </span>
                    ) : (
                      <Lock size={13} className="text-text-muted" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="px-5 pt-4 pb-5 flex-1 flex flex-col">
                    <h2 className="font-serif text-base font-bold text-text-light mb-1">
                      {saule.titel}
                    </h2>
                    <p className="font-sans text-xs text-text-muted mb-3 leading-relaxed">
                      {saule.untertitel}
                    </p>
                    <p className="font-body text-sm text-text-secondary leading-relaxed mb-5 flex-1">
                      {saule.beschreibung}
                    </p>

                    {/* CTA */}
                    <div className="space-y-2 mt-auto">
                      {owned && saule.toolHref ? (
                        <Link
                          href={saule.toolHref}
                          className="flex items-center justify-center gap-2 w-full py-2.5 font-sans font-bold text-sm"
                          style={{
                            background: 'rgba(74,222,128,0.15)',
                            color:      '#4ade80',
                            border:     '1px solid rgba(74,222,128,0.3)',
                          }}
                        >
                          {saule.toolLabel} <ArrowRight size={13} />
                        </Link>
                      ) : owned ? (
                        <Link
                          href={saule.href}
                          className="flex items-center justify-center gap-2 w-full py-2.5 font-sans font-bold text-sm"
                          style={{
                            background: 'rgba(74,222,128,0.12)',
                            color:      '#4ade80',
                            border:     '1px solid rgba(74,222,128,0.25)',
                          }}
                        >
                          Kurs-Inhalte <ArrowRight size={13} />
                        </Link>
                      ) : (
                        <>
                          {saule.checkoutUrl ? (
                            /* Direkt zum Digistore24-Checkout */
                            <a
                              href={saule.checkoutUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center justify-center gap-2 w-full py-2.5 font-sans font-bold text-sm hover:opacity-90 transition-opacity plausible-event-name=Digistore-Checkout plausible-event-produkt=${saule.slug}`}
                              style={{ background: '#C8882A', color: '#0D0A06' }}
                            >
                              {price ? `${eur(price)} — Freischalten` : 'Freischalten'}
                              <ChevronRight size={13} />
                            </a>
                          ) : (
                            /* Fallback: Zur Produkt-Inhaltsseite bis Checkout-URL eingetragen */
                            <Link
                              href={saule.href}
                              className="flex items-center justify-center gap-2 w-full py-2.5 font-sans font-bold text-sm hover:opacity-90 transition-opacity"
                              style={{ background: '#C8882A', color: '#0D0A06' }}
                            >
                              Mehr erfahren
                              <ChevronRight size={13} />
                            </Link>
                          )}
                          {/* Zugangszusage nur am echten Kaufweg (04.09.2026, Verifier-Befund):
                              Der Absatz lag ausserhalb des checkoutUrl-Ternaers und versprach
                              "Sofortzugang" auch fuer die drei stillgelegten Saeulen. Preis am
                              Fallback-Button aus demselben Grund entfernt — kein Preis und keine
                              Zugangszusage an etwas, das man nicht kaufen kann.
                              Merksatz: docs/confluence/03-OPERATIONS.md. */}
                          {saule.checkoutUrl && (
                            <p className="text-center text-[10px] font-sans text-text-muted">
                              Einmalig · Sofortzugang · Digistore24
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Footer ────────────────────────────────────────────── */}
          <div
            className="mt-12 pt-8 border-t flex items-center justify-between"
            style={{ borderColor: 'rgba(200,136,42,0.12)' }}
          >
            <Link
              href="/ehrliches-system"
              className="text-sm font-sans text-text-muted hover:text-brand-gold transition-colors"
            >
              ← System-Übersicht
            </Link>
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="font-sans text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1.5"
              >
                <Lock size={11} />
                Abmelden
              </button>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
