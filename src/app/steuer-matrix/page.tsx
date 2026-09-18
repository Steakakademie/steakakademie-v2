import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Lock, BarChart3, Globe, ShieldCheck } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import { ogImages } from '@/lib/og';

export const metadata: Metadata = {
  // Uwe, 02.09.2026: noindex — Gruender-Bereich ist aus der Steakakademie ausgebaut
  // (Nav/Footer seit 641b346, Sitemap seit heute). CLAUDE.md Abschnitt 10.
  robots: { index: false, follow: false },
  title: 'Steuer-Matrix — 23 Länder im Steuervergleich',
  description:
    'Interaktiver Netto-Vergleich für Solo-Selbstständige: Was bleibt in 23 Ländern übrig? Deutschland, Portugal, Niederlande und 20 weitere — echte Zahlen.',
  alternates: { canonical: 'https://steakakademie.de/steuer-matrix' },
  openGraph: {
    images: ogImages('Steuer-Matrix — 23 Länder im Vergleich'),
    title: 'Steuer-Matrix — 23 Länder im Vergleich',
    description: 'Datengestützte Entscheidungshilfe für Solo-Selbstständige: 23 Länder im Netto-Vergleich. Finde heraus, wo du als Solopreneur am meisten behältst.',
    url: 'https://steakakademie.de/steuer-matrix',
    type: 'website',
  },
};

const COUNTRIES = [
  { flag: '🇩🇪', name: 'Deutschland', system: 'Einzelunternehmer / GmbH', highlight: 'Referenzland' },
  { flag: '🇳🇱', name: 'Niederlande', system: 'ZZP — Zelfstandigenaftrek', highlight: 'Oft günstiger' },
  { flag: '🇫🇷', name: 'Frankreich',  system: 'Auto-entrepreneur (BNC)', highlight: 'Pauschalsteuer' },
  { flag: '🇪🇸', name: 'Spanien',     system: 'Autónomo',                 highlight: 'Flatrate möglich' },
  { flag: '🇮🇹', name: 'Italien',     system: 'Regime Forfettario',       highlight: '15 % Pauschalsteuer' },
  { flag: '🇵🇹', name: 'Portugal',    system: 'Recibos Verdes + NHR',     highlight: 'NHR-Sonderregel' },
];

const FEATURES = [
  {
    icon: <BarChart3 size={20} />,
    title: 'Was am Ende zählt',
    desc: 'Nicht der Steuersatz — das Netto. GKV, Einkommensteuer, alle Pflichtabgaben nach geltendem Recht 2024. Du gibst deinen Umsatz ein, der Rechner zeigt dir auf den Euro, was wirklich bleibt.',
  },
  {
    icon: <Globe size={20} />,
    title: '23 Länder auf einen Blick',
    desc: 'DE, PT, NL, ES, IT, EE, GB, AE und 15 weitere — jedes mit dem realistischen Pflichtabgaben-Modell für Solopreneure. Keine Hochglanz-Tabellen. Echte Zahlen.',
  },
  {
    icon: <ShieldCheck size={20} />,
    title: 'Unser Interesse: null',
    desc: 'Wir verdienen nichts daran, wo du am Ende lebst. Keine Provision, kein Upsell, kein versteckter Berater-Funnel. Die Zahl gehört dir — die Entscheidung auch.',
  },
];

export default async function SteuerMatrixPage() {
  // Prüfen ob User bereits Zugang hat
  let hasAccess = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('bookings')
        .select('status, courses!inner(slug)')
        .eq('user_id', user.id)
        .eq('courses.slug', 'steuer-matrix')
        .eq('status', 'active')
        .maybeSingle();
      hasAccess = !!data;
    }
  } catch { /* graceful */ }

  // Preisabruf entfernt (Uwe, 03.09.2026): Seit die Kauf-CTAs raus sind, wurde
  // der Wert nirgends mehr angezeigt — eine Supabase-Abfrage pro Aufruf ohne
  // Abnehmer. Der Preis steht weiterhin in der courses-Tabelle; beim
  // Wiedereinschalten des Verkaufs kommt dieser Block zurueck.

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Steuer-Matrix — EU-Steuervergleich',
    applicationCategory: 'FinanceApplication',
    // Nicht mehr buchbar (Uwe, 03.09.2026) — deshalb Discontinued statt
    // InStock und ohne Preis. Gleiche Begruendung wie beim Gruendung-Sprint:
    // ein Offer mit InStock und Preis ist fuer Parser ein kaufbares Angebot,
    // und Schema.org wird nicht nur von Googlebot gelesen — noindex schuetzt
    // davor nicht.
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/Discontinued',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://steakakademie.de' },
      { '@type': 'ListItem', position: 2, name: 'Das Ehrliche System', item: 'https://steakakademie.de/ehrliches-system' },
      { '@type': 'ListItem', position: 3, name: 'Steuer-Matrix', item: 'https://steakakademie.de/steuer-matrix' },
    ],
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="bg-surface-base">

        {/* ── Hero ─────────────────────────────────────────────────────────────── */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/ehrliches-system" className="hover:text-brand-gold transition-colors">Das Ehrliche System</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Steuer-Matrix</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Säule II — Das Ehrliche System
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5">
                Steuer-Matrix
              </h1>
              <p className="font-serif text-xl text-text-light/80 leading-relaxed mb-4">
                Wieviel bleibt dir als Solo-Selbstständiger wirklich übrig?
              </p>
              <p className="font-body text-base text-text-light/55 leading-relaxed mb-10 max-w-2xl">
                Steuer-Vergleich für Solo-Selbstständige: 23 Länder. Sofort. Ohne Berater.
                Du gibst deinen Bruttoumsatz ein — das Tool rechnet dir in Echtzeit vor,
                wo du am meisten behältst.
              </p>

              {hasAccess ? (
                <Link
                  href="/steuer-matrix/rechner"
                  className="inline-flex items-center gap-2 bg-brand-gold text-surface-dark font-sans font-bold text-sm px-6 py-3 hover:bg-brand-gold/90 transition-colors"
                >
                  Zum Rechner <ChevronRight size={16} />
                </Link>
              ) : (
                /* Kauf-CTA entfernt (Uwe, 03.09.2026): "Steuer-Matrix ebenfalls
                   unsichtbar schalten". Wer bereits gekauft hat, sieht oben
                   weiterhin "Zum Rechner" — hasAccess ist davon unberuehrt.
                   Der Button hier zeigte ohnehin nur auf den Anker #kaufen,
                   der auf sich selbst verweist (id und href identisch weiter
                   unten): ein Kaufversprechen mit Preis, das nirgendwohin
                   fuehrte. Preis und "sofortiger Zugang" sind mit raus —
                   beides waere neben einem nicht buchbaren Angebot
                   irrefuehrend. Zurueckholen zusammen mit dem Checkout in
                   src/app/mein-system/page.tsx. */
                <p className="font-sans text-sm text-text-light/50 max-w-xl">
                  Der Zugang zum Rechner ist derzeit nicht buchbar.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Länder-Übersicht ─────────────────────────────────────────────────── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">
            23 Länder — ein Rechner
          </h2>
          <p className="font-body text-text-secondary mb-10 max-w-xl">
            Jedes Land mit dem realistischen Pflicht-Abgaben-Modell für Solopreneure.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {COUNTRIES.map(({ flag, name, system, highlight }) => (
              <div key={name} className="bg-surface-card border border-border-subtle p-4">
                <div className="text-2xl mb-2">{flag}</div>
                <div className="font-serif text-base font-bold text-text-primary mb-0.5">{name}</div>
                <div className="text-xs font-sans text-text-muted mb-2">{system}</div>
                <span className="text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-brand-fire">
                  {highlight}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────────── */}
        <section className="border-t border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {FEATURES.map(({ icon, title, desc }) => (
                <div key={title}>
                  <div className="text-brand-gold mb-3">{icon}</div>
                  <h3 className="font-serif text-lg font-bold text-text-light mb-2">{title}</h3>
                  <p className="font-body text-sm text-text-light/55 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Preview / Lock ───────────────────────────────────────────────────── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="relative bg-surface-card border border-border-subtle overflow-hidden">

            {/* Blurred Preview */}
            <div className="p-6 filter blur-sm pointer-events-none select-none" aria-hidden>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {['🇩🇪', '🇳🇱', '🇫🇷'].map((flag, i) => (
                  <div key={i} className="bg-surface-base border border-border-subtle p-4">
                    <div className="text-2xl mb-2">{flag}</div>
                    <div className="font-serif text-2xl font-bold text-brand-gold">x.xxx €</div>
                    <div className="text-xs font-sans text-text-muted mt-1">Netto / Monat</div>
                    <div className="mt-3 space-y-1.5">
                      {['KV', 'Steuer', 'Abgaben'].map((l) => (
                        <div key={l} className="flex justify-between text-xs text-text-secondary">
                          <span>{l}</span><span>xxx €</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lock-Overlay */}
            {!hasAccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-base/80 backdrop-blur-sm">
                <div className="text-center p-8 max-w-md">
                  <Lock size={32} className="text-brand-gold mx-auto mb-4" />
                  {/* Kauf-CTA entfernt (Uwe, 03.09.2026) — zweiter von zwei
                      Kaufversprechen auf dieser Seite. Das Lock-Overlay ueber
                      der unscharfen Laender-Tabelle bleibt: Es zeigt ehrlich,
                      dass hier Inhalt liegt, den man freischalten kann. Nur
                      der Button samt Preis und "Sofortzugang nach Kauf" ist
                      raus, solange nicht gekauft werden kann. */}
                  <h3 className="font-serif text-xl font-bold text-text-primary mb-3">
                    Derzeit nicht buchbar
                  </h3>
                  <p className="font-body text-sm text-text-secondary">
                    Der Zugang zum Rechner mit allen 23 Ländern ist zurzeit nicht erhältlich.
                    Wer ihn bereits freigeschaltet hat, kommt unverändert hinein.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Disclaimer + Links ───────────────────────────────────────────────── */}
        <section className="border-t border-border-subtle bg-surface-dark">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="max-w-content mx-auto">
              <p className="text-xs font-sans text-text-muted leading-relaxed mb-6">
                ⚠️ Die Steuer-Matrix ist eine vereinfachte Entscheidungshilfe und ersetzt keine
                individuelle Steuerberatung. Steuergesetze ändern sich. Konsultieren Sie immer
                einen zugelassenen Steuerberater für Ihre persönliche Situation.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/ehrliches-system" className="text-sm font-sans text-text-muted hover:text-brand-fire transition-colors">
                  ← Das Ehrliche System
                </Link>
                <Link href="/ehrliches-system#saule-i" className="text-sm font-sans text-text-muted hover:text-brand-fire transition-colors">
                  Säule I: Gründer-Schmiede
                </Link>
                <Link href="/ehrliches-system#saule-iii" className="text-sm font-sans text-text-muted hover:text-brand-fire transition-colors">
                  Säule III: Eigenregie
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
