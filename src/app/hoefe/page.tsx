import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Radar, Beef, Leaf, ShieldCheck } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HofladenRadar from '@/components/hoefe/HofladenRadar';
import { bestand } from '@/lib/hoefe/db';
import { ogImages } from '@/lib/og';

export const revalidate = 3600;

export const metadata: Metadata = {
  // Kein "| Steakakademie" — das haengt das title.template im Root-Layout an.
  title: 'Hofladen-Radar: Fleisch direkt vom Erzeuger finden',
  description:
    'Hofläden und Direktvermarkter in deiner Nähe — in Deutschland, Österreich und der Schweiz. Umkreissuche nach Ort oder PLZ, Rind, Schwein, Lamm, Geflügel direkt vom Hof, Bio-Höfe markiert.',
  alternates: { canonical: 'https://steakakademie.de/hoefe' },
  openGraph: {
    images: ogImages('Hofladen-Radar — Fleisch direkt vom Erzeuger'),
    title: 'Hofladen-Radar — Fleisch direkt vom Erzeuger',
    description: 'Hofläden in deiner Nähe finden — Deutschland, Österreich, Schweiz: Umkreissuche nach Ort oder PLZ, Fleischangebot und Bio auf einen Blick.',
    url: 'https://steakakademie.de/hoefe',
    type: 'website',
  },
};

export default async function HoefePage() {
  const zahlen = await bestand();
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-base">
        <div className="mx-auto max-w-editorial px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <nav className="mb-6 flex items-center gap-1.5 font-sans text-xs text-text-muted" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-brand-fire">Start</Link>
            <ChevronRight size={12} />
            <Link href="/cuts" className="transition-colors hover:text-brand-fire">Cuts</Link>
            <ChevronRight size={12} />
            <span className="text-text-secondary">Hofladen-Radar</span>
          </nav>

          <div className="mb-8 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold uppercase tracking-[0.22em] text-brand-fire">
              <Radar size={12} /> Werkzeug
            </span>
            <h1 className="mt-2 font-serif text-3xl leading-tight text-text-primary sm:text-4xl">Hofladen-Radar</h1>
            <p className="mt-3 font-body text-[1rem] leading-relaxed text-text-secondary">
              Das beste Steak beginnt vor dem Grill: beim Tier, beim Hof, beim Menschen, der es großgezogen hat.
              Gib Ort oder Postleitzahl ein und finde Direktvermarkter in deiner Nähe
              {zahlen.gesamt > 0 ? ` — ${zahlen.gesamt.toLocaleString('de-DE')} Höfe in Deutschland, Österreich und der Schweiz, ${zahlen.fleisch.toLocaleString('de-DE')} davon mit belegtem Fleischangebot.` : '.'}
            </p>
          </div>

          <HofladenRadar apiKey={apiKey} />

          {/* Erklaerung */}
          <section className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
              <div className="mb-2 flex items-center gap-2 text-brand-fire"><Beef size={18} /><h2 className="font-serif text-lg font-bold text-text-light">Fleisch belegt</h2></div>
              <p className="text-sm text-text-secondary">
                Der Hof nennt Fleisch oder Wurst ausdrücklich in seinen Angaben. „Nicht bestätigt“ heißt nur: keine Angabe — nicht „kein Fleisch“. Anrufen lohnt sich.
              </p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
              <div className="mb-2 flex items-center gap-2 text-green-300"><Leaf size={18} /><h2 className="font-serif text-lg font-bold text-text-light">Bio</h2></div>
              <p className="text-sm text-text-secondary">
                Als Bio markiert, wenn der Hof eine Öko-Zertifizierung angibt. Das Siegel selbst prüfen wir nicht — frag im Hofladen nach der Kontrollstelle.
              </p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
              <div className="mb-2 flex items-center gap-2 text-brand-gold"><ShieldCheck size={18} /><h2 className="font-serif text-lg font-bold text-text-light">Vom Hof bestätigt</h2></div>
              <p className="text-sm text-text-secondary">
                Höfe, deren Inhaber die Angaben selbst geprüft haben. Dein Hof fehlt oder stimmt nicht?{' '}
                <Link href="/kontakt?betreff=hofladen" className="text-brand-gold underline hover:text-brand-fire">Schreib uns.</Link>
              </p>
            </div>
          </section>

          <p className="mt-8 text-xs leading-relaxed text-text-muted">
            Datenquelle: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-gold">© OpenStreetMap-Mitwirkende</a>,
            Lizenz ODbL, wöchentlich aktualisiert. Öffnungszeiten, Angebot und Kontaktdaten stammen aus den Angaben der Community und können veraltet sein — bitte vor dem Besuch prüfen.
            Die Steakakademie steht in keiner Geschäftsbeziehung zu den gelisteten Höfen.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
