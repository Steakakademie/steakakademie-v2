import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getActivePrograms, getPendingPrograms } from '@/lib/affiliate-programs';

export const metadata: Metadata = {
  title: 'Affiliate-Disclosure',
  description: 'Transparenz über Affiliate-Links und Vergütungen auf Steakakademie.de.',
  robots: { index: false, follow: false },
};

export default function AffiliateDisclosurePage() {
  const h2Class = 'font-sans text-sm font-bold tracking-[0.12em] uppercase text-text-primary mb-3';
  const linkClass = 'text-brand-fire hover:underline';

  const activePrograms  = getActivePrograms();
  const pendingPrograms = getPendingPrograms();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">

          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={12} />
            <span>Affiliate-Disclosure</span>
          </nav>

          <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">
            Affiliate-Disclosure
          </h1>
          <p className="text-sm font-sans text-text-muted mb-10">Stand: Oktober 2026</p>

          <div className="max-w-content space-y-8 font-body text-text-secondary leading-relaxed">

            <section>
              <h2 className={h2Class}>Was sind Affiliate-Links?</h2>
              <p>
                Einige Links auf steakakademie.de sind sogenannte Affiliate-Links. Das bedeutet:
                Wenn du über einen dieser Links ein Produkt kaufst, erhalte ich eine kleine
                Provision — ohne dass du mehr bezahlst. Der Preis für dich bleibt identisch.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>Welche Affiliate-Programme nutzen wir?</h2>
              <p className="mb-3">
                Steakakademie.de nimmt an folgenden Partnerprogrammen teil:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                {activePrograms.map((p) => (
                  <li key={p.id}>
                    <strong className="text-text-primary">{p.name}</strong>
                    {p.network ? ` (${p.network})` : ''} —{' '}
                    {p.disclosureNote ??
                      'Über diese Links gekaufte Produkte können mir eine Provision einbringen — ohne Mehrkosten für dich.'}
                  </li>
                ))}
              </ul>

              {pendingPrograms.length > 0 && (
                <>
                  <p className="mt-5 mb-3">
                    Folgende Partnerprogramme sind <strong className="text-text-primary">in Vorbereitung</strong>{' '}
                    und noch nicht aktiv. Sobald sie live gehen, werden ihre Links wie oben gekennzeichnet:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-text-muted">
                    {pendingPrograms.map((p) => (
                      <li key={p.id}>
                        <span className="text-text-secondary">{p.name}</span>
                        {p.network ? ` — ${p.network}` : ''}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section>
              <h2 className={h2Class}>Transparenz & Unabhängigkeit</h2>
              <p className="mb-3">
                Wir empfehlen nur Produkte, die wir selbst getestet haben oder nach sorgfältiger Recherche für qualitativ hochwertig halten — Testberichte sind als solche gekennzeichnet.
                Die Affiliate-Vergütung beeinflusst unsere Empfehlungen <strong className="text-text-primary">nicht</strong>.
                Wir lehnen Produkte ab, die unsere Standards nicht erfüllen — unabhängig von
                einer möglichen Provision.
              </p>
              <p>
                Artikel, die Affiliate-Links enthalten, sind am Ende oder direkt neben dem
                jeweiligen Link als solche kenntlich gemacht.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>Kennzeichnung</h2>
              <p>
                Affiliate-Links sind auf dieser Website mit dem Hinweis{' '}
                <span className="font-sans text-xs font-bold tracking-wide uppercase bg-surface-base border border-border-subtle px-2 py-0.5 text-text-muted">
                  Affiliate-Link
                </span>{' '}
                oder einem entsprechenden Hinweis im Artikel-Text kenntlich gemacht, sofern
                gesetzlich erforderlich.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>Produktbilder</h2>
              {/* Abgleich Text ↔ Technik 03.10.2026: Hier stand, wir nutzten „drei
                  Bildquellen", darunter Original-Produktbilder „bezogen über das Amazon
                  PA-API". Stand im Repo: products/images.json ist leer (_lastFetch: null),
                  in products/registry.yaml hat kein Produkt ein Bild, die Amazon-Bildhosts
                  sind in next.config.mjs bewusst entfernt. Gezeigt wird deshalb überall
                  ein Platzhalter: in ProductCard ein Kategorie-Symbol mit der Aufschrift
                  „Symbolbild" (ProductImagePlaceholder), in HeroRecommendation und
                  BuyingGuideBlock die Hersteller-Initialen. Wer Produktbilder einschaltet,
                  schreibt diesen Abschnitt im selben Zug wieder um. */}
              <p className="mb-3">
                Zu unseren Produktempfehlungen zeigen wir derzeit{' '}
                <strong className="text-text-primary">keine Produktfotos</strong>. An ihrer Stelle
                steht ein Platzhalter: je nach Darstellung die Initialen des Herstellers oder ein
                gezeichnetes Symbol der Produktkategorie mit der Aufschrift{' '}
                <span className="font-sans text-[10px] font-bold tracking-wider uppercase bg-black/65 text-zinc-200 border border-white/15 px-1.5 py-0.5">
                  Symbolbild
                </span>
                .
              </p>
              <p className="mb-3">
                Vorgesehen, aber noch nicht in Betrieb, sind zwei weitere Darstellungen:
              </p>
              <ul className="list-disc list-inside space-y-1.5 mb-3">
                <li>
                  <strong className="text-text-primary">Lizenzierte Original-Produktbilder</strong> —
                  über das Amazon Product Advertising API (PA-API) oder als vom Hersteller
                  freigegebene Pressebilder. Diese Bildquelle ist nicht angeschlossen.
                </li>
                <li>
                  <strong className="text-text-primary">Symbolbilder</strong> — eigens für
                  Steakakademie.de erstellte oder KI-generierte Darstellungen, die das Produkt
                  repräsentieren, aber optisch vom Originalprodukt abweichen können. Sie
                  würden mit demselben Badge „Symbolbild&ldquo; gekennzeichnet.
                </li>
              </ul>
              <p>
                Für die verbindliche Produktdarstellung ist immer der jeweilige Händler-Shop
                maßgeblich, auf den der Affiliate-Link verweist.
              </p>
            </section>

            <section>
              <h2 className={h2Class}>Fragen?</h2>
              <p>
                Bei Fragen zu Affiliate-Links oder unserer Empfehlungspolitik erreichst du
                mich unter{' '}
                <a href="mailto:pitmaster@steakakademie.de" className={linkClass}>
                  pitmaster@steakakademie.de
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className={h2Class}>Weitere rechtliche Informationen</h2>
              <p>
                Weitere rechtliche Informationen findest du in unserem{' '}
                <Link href="/impressum" className={linkClass}>Impressum</Link>,
                der{' '}
                <Link href="/datenschutz" className={linkClass}>Datenschutzerklärung</Link>{' '}
                und unseren{' '}
                <Link href="/agb" className={linkClass}>AGB</Link>.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
