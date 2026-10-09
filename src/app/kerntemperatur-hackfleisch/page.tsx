import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, AlertTriangle, Thermometer, Flame } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import KeyFacts from '@/components/KeyFacts';
import AutorHinweis from '@/components/AutorHinweis';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import ScrollBereich from '@/components/ui/ScrollBereich';
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { mindestwert, spanne, kernReferenz } from '@/lib/kerntemperatur-referenz';
import { seoTitel } from '@/lib/seo-titel';
import { ogImages } from '@/lib/og';

/**
 * /kerntemperatur-hackfleisch — Antwortseite fuer die Suchnachfrage, fuer die
 * Google die Steakakademie tatsaechlich zeigt (GSC-Export 09.10.2026, 6 Monate):
 * 9.307 der 15.683 ausgewiesenen Impressionen entfielen auf Kerntemperatur
 * Hackfleisch/Frikadellen/Buletten/Hackbraten/Burger — 120 Varianten, Position
 * ~9, sechs Klicks. Alle landeten auf /temperatur-guide, wo der Hackfleisch-Wert
 * in einem Kasten weit unten steht. Freigabe Uwe, 09.10.2026.
 *
 * Werte NUR aus data/kerntemperatur-referenz.yaml (Regel 8c):
 *   sicherheit.hackfleisch  → Mindestwert fuer jedes Hack
 *   badges.burger           → Korridor „durchgegart"
 *   sicherheit.gefluegel    → Gefluegelhack: es gilt der hoehere der beiden
 *                             Mindestwerte (kein eigener Eintrag in der Referenz,
 *                             sondern die strengere von zwei kanonischen Grenzen)
 *   meta.messen             → Einstich
 * Bewusst KEIN Ziehwert unter dem Mindestwert: anders als bei der Haehnchenbrust
 * (poultry_breast, Entscheidung Uwe 23.09.2026) gibt es fuer Hack keine Freigabe,
 * auf das Nachziehen zu setzen. Keine Garzeiten — die stehen in keiner Referenz.
 */

const HACK_MIN = mindestwert('hackfleisch');
const GEFLUEGEL_MIN = mindestwert('gefluegel');
const GEFLUEGELHACK_MIN = Math.max(HACK_MIN, GEFLUEGEL_MIN);
const HACK_KORRIDOR = spanne('burger');
const MESSEN = kernReferenz().meta.messen;

const URL = '/kerntemperatur-hackfleisch';
const TITEL = 'Kerntemperatur Hackfleisch: Frikadellen, Burger, Hackbraten';
const BESCHREIBUNG = `Kerntemperatur Hackfleisch: Frikadellen, Buletten, Hackbraten und Burger brauchen mindestens ${HACK_MIN} °C im Kern — Rind, Schwein, gemischt, Geflügel.`;

export const metadata: Metadata = {
  title: seoTitel(TITEL),
  description: BESCHREIBUNG,
  alternates: { canonical: `https://steakakademie.de${URL}` },
  openGraph: {
    title: TITEL,
    description: BESCHREIBUNG,
    url: `https://steakakademie.de${URL}`,
    type: 'article',
    images: ogImages(`Kerntemperatur Hackfleisch: ${HACK_MIN} °C`),
  },
  twitter: { card: 'summary_large_image', creator: '@steakakademie' },
};

/** Gerichte — regionale Namen stehen mit drin, weil genau so gesucht wird. */
const GERICHTE: { gericht: string; auchGenannt: string; hinweis: string }[] = [
  { gericht: 'Frikadellen', auchGenannt: 'Buletten, Fleischpflanzerl, Fleischküchle, Fleischlaberl', hinweis: 'Seitlich in die Mitte der dicksten Frikadelle stechen.' },
  { gericht: 'Hackbraten', auchGenannt: 'Falscher Hase', hinweis: 'In die Mitte des Bratens, bei Füllung (Ei) nicht in die Füllung messen.' },
  { gericht: 'Burger-Patty', auchGenannt: 'Hacksteak', hinweis: 'Von der Seite einstechen — von oben trifft die Spitze schnell die Pfanne oder den Rost.' },
  { gericht: 'Hackbällchen', auchGenannt: 'Köttbullar, Fleischbällchen', hinweis: 'Das größte Bällchen messen, nicht das erste, das fertig aussieht.' },
  { gericht: 'Köfte, Ćevapčići', auchGenannt: 'Kebab vom Spieß aus Hack', hinweis: 'Am dicksten Abschnitt messen, nicht am dünnen Ende.' },
];

/** Hackarten — Faschiertes ist der österreichische Name für Hackfleisch. */
const HACKARTEN: { art: string; wert: string; warum: string }[] = [
  { art: 'Rinderhack', wert: `mindestens ${HACK_MIN} °C`, warum: 'Gewolft — die Keime der Oberfläche sitzen jetzt auch im Inneren. Anders als beim Steak gibt es kein „rare".' },
  { art: 'Schweinehack', wert: `mindestens ${HACK_MIN} °C`, warum: `Derselbe Wert wie beim Rinderhack — der Schwein-Mindestwert von ${mindestwert('schwein')} °C gilt nur für ganze Stücke.` },
  { art: 'Gemischtes Hack (halb und halb)', wert: `mindestens ${HACK_MIN} °C`, warum: 'Maßgeblich ist das Hack, nicht die Tierart.' },
  { art: 'Lammhack', wert: `mindestens ${HACK_MIN} °C`, warum: 'Ein rosa Lammrücken ist kein Maßstab für Lammhack.' },
  { art: 'Geflügelhack (Hähnchen, Pute)', wert: `mindestens ${GEFLUEGELHACK_MIN} °C`, warum: `Hier gilt der höhere der beiden Mindestwerte: Geflügel ${GEFLUEGEL_MIN} °C, Hack ${HACK_MIN} °C.` },
  { art: 'Faschiertes (Österreich)', wert: `mindestens ${HACK_MIN} °C`, warum: 'Anderer Name, dasselbe Fleisch — es gilt der Wert der jeweiligen Tierart oben.' },
];

const FAQ = [
  {
    question: 'Welche Kerntemperatur brauchen Frikadellen?',
    answer: `Mindestens ${HACK_MIN} °C im Kern, gemessen seitlich in der Mitte der dicksten Frikadelle. Das gilt für Frikadellen aus Rinderhack, Schweinehack und gemischtem Hack gleichermaßen. Frikadellen aus Geflügelhack brauchen mindestens ${GEFLUEGELHACK_MIN} °C.`,
  },
  {
    question: 'Warum muss Hackfleisch durchgegart werden, ein Steak aber nicht?',
    answer: 'Beim Steak sitzen mögliche Keime auf der Oberfläche, und die wird beim Anbraten heiß. Beim Wolfen wird diese Oberfläche ins Innere gemischt. Deshalb muss beim Hack der Kern die sichere Temperatur erreichen, nicht nur die Außenseite.',
  },
  {
    question: 'Kann ich Hackfleisch kurz vor 70 °C vom Grill nehmen und nachziehen lassen?',
    answer: `Nein. Bei Steaks nimmt man das Fleisch vor dem Zielwert vom Grill, weil es in der Ruhe nachzieht. Bei Hackfleisch ist ${HACK_MIN} °C ein Mindestwert, kein Zielwert — erst vom Grill nehmen, wenn das Thermometer ihn zeigt.`,
  },
  {
    question: 'Ist ein rosa Burger-Patty in Ordnung?',
    answer: `Die Farbe sagt beim Hack wenig über die Temperatur. Maßgeblich ist das Thermometer: ${HACK_MIN} °C im Kern. Für Schwangere, Kinder, ältere und immungeschwächte Menschen ist vollständiges Durchgaren Pflicht.`,
  },
  {
    question: 'Gilt die Kerntemperatur auch im Backofen und in der Heißluftfritteuse?',
    answer: `Ja. Die Kerntemperatur ist unabhängig vom Gerät — Grill, Pfanne, Backofen oder Heißluftfritteuse. Entscheidend ist, dass der Kern ${HACK_MIN} °C erreicht.`,
  },
];

export default function KerntemperaturHackfleischPage() {
  const breadcrumbSch = breadcrumbSchema([
    { name: 'Kerntemperaturen', url: '/temperatur-guide' },
    { name: 'Hackfleisch', url: URL },
  ]);
  const faqSch = faqSchema(FAQ);
  const articleSch = articleSchema({
    headline: TITEL,
    description: BESCHREIBUNG,
    url: URL,
    image: `/api/og?title=${encodeURIComponent(`Kerntemperatur Hackfleisch: ${HACK_MIN} °C`)}`,
    datePublished: '2026-10-09',
    authorName: 'Marco',
    authorSlug: 'marco',
    keywords: ['Kerntemperatur Hackfleisch', 'Kerntemperatur Frikadellen', 'Kerntemperatur Burger', 'Kerntemperatur Hackbraten'],
  });

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSch) }} />

      <main className="bg-surface-base">
        {/* ── Kopf: die Antwort zuerst ─────────────────────────────────── */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/55 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/temperatur-guide" className="hover:text-brand-gold transition-colors">Kerntemperaturen</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Hackfleisch</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Kerntemperatur-Referenz
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5">
                Kerntemperatur Hackfleisch: {HACK_MIN} °C — für Frikadellen, Burger und Hackbraten
              </h1>
              <p className="font-body text-lg text-text-light/75 leading-relaxed mb-6">
                Hackfleisch braucht im Kern <strong className="text-text-light">mindestens {HACK_MIN} °C</strong> —
                egal ob Frikadelle, Bulette, Hackbraten, Burger-Patty oder Hackbällchen, egal ob Rind, Schwein oder
                halb und halb. Einzige Ausnahme nach oben: Hack aus Geflügel braucht{' '}
                <strong className="text-text-light">{GEFLUEGELHACK_MIN} °C</strong>. Gemessen wird mit dem Thermometer,
                nicht nach Farbe oder Zeit.
              </p>

              <KeyFacts
                variant="dark"
                quelle="Werte aus der kanonischen Kerntemperatur-Referenz der Steakakademie — gemessen im dicksten Punkt."
                facts={[
                  { label: 'Hackfleisch, Mindestwert', value: `${HACK_MIN} °C — Rind, Schwein, gemischt, Lamm` },
                  { label: 'Durchgegart', value: `${HACK_KORRIDOR} — Korridor für Burger und Frikadellen` },
                  { label: 'Geflügelhack', value: `${GEFLUEGELHACK_MIN} °C — der Geflügel-Mindestwert gilt` },
                  { label: 'Nachziehen', value: `Nicht einplanen — erst bei ${HACK_MIN} °C vom Grill` },
                  { label: 'Richtig messen', value: MESSEN.replace('NICHT', 'nicht') },
                ]}
              />

              <p className="mt-5 font-sans text-xs text-text-light/55">Von Marco · Technik & Kerntemperaturen</p>
              <AutorHinweis authorSlug="marco" />
            </div>
          </div>
        </section>

        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* ── Warum Hack anders ist ──────────────────────────────────── */}
          <section id="warum" className="mb-14 scroll-mt-24 max-w-3xl">
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-4">
              Warum Hackfleisch durch muss, ein Steak aber nicht
            </h2>
            <p className="font-body text-text-secondary leading-relaxed mb-4">
              Ein Steak ist ein intaktes Stück Muskel. Mögliche Keime sitzen auf der Oberfläche — und die wird beim
              Anbraten heiß. Deshalb darf ein Steak innen rare oder medium rare sein.
            </p>
            <p className="font-body text-text-secondary leading-relaxed">
              Beim Wolfen wird genau diese Oberfläche zerkleinert und ins Innere gemischt. Was beim Steak außen lag,
              liegt beim Hack überall. Deshalb zählt beim Hack der Kern: Erst wenn die Mitte {HACK_MIN} °C erreicht,
              ist das ganze Stück durchgegart.
            </p>
          </section>

          {/* ── Nach Gericht ─────────────────────────────────────────── */}
          <section id="gerichte" className="mb-14 scroll-mt-24">
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-2">
              Kerntemperatur nach Gericht
            </h2>
            <p className="font-body text-text-secondary leading-relaxed mb-6 max-w-2xl">
              Für alle Gerichte aus Rinder-, Schweine-, Lamm- oder gemischtem Hack gilt derselbe Wert:{' '}
              <strong className="text-text-primary">mindestens {HACK_MIN} °C</strong>. Unterschiedlich ist nur, wo du misst.
            </p>
            <ScrollBereich label="Kerntemperatur nach Hackfleisch-Gericht">
              <table className="w-full text-sm font-sans border border-border-subtle">
                <thead>
                  <tr className="bg-surface-card text-left">
                    <th className="py-3 px-4 font-bold text-text-primary">Gericht</th>
                    <th className="py-3 px-4 font-bold text-text-primary">Kerntemperatur</th>
                    <th className="py-3 px-4 font-bold text-text-primary hidden sm:table-cell">Auch genannt</th>
                    <th className="py-3 px-4 font-bold text-text-primary hidden md:table-cell">Wo messen</th>
                  </tr>
                </thead>
                <tbody>
                  {GERICHTE.map((g) => (
                    <tr key={g.gericht} className="border-t border-border-subtle">
                      <td className="py-3.5 px-4 font-semibold text-text-primary">{g.gericht}</td>
                      <td className="py-3.5 px-4"><span className="font-mono font-bold text-text-primary">{HACK_MIN} °C</span></td>
                      <td className="py-3.5 px-4 text-text-secondary hidden sm:table-cell">{g.auchGenannt}</td>
                      <td className="py-3.5 px-4 text-text-muted text-xs hidden md:table-cell">{g.hinweis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollBereich>
          </section>

          {/* ── Nach Hackart ─────────────────────────────────────────── */}
          <section id="hackarten" className="mb-14 scroll-mt-24">
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-2">
              Kerntemperatur nach Hackart: Rind, Schwein, gemischt, Geflügel
            </h2>
            <p className="font-body text-text-secondary leading-relaxed mb-6 max-w-2xl">
              Nur Geflügelhack weicht ab — nach oben.
            </p>
            <ScrollBereich label="Kerntemperatur nach Hackart">
              <table className="w-full text-sm font-sans border border-border-subtle">
                <thead>
                  <tr className="bg-surface-card text-left">
                    <th className="py-3 px-4 font-bold text-text-primary">Hackart</th>
                    <th className="py-3 px-4 font-bold text-text-primary">Kerntemperatur</th>
                    <th className="py-3 px-4 font-bold text-text-primary hidden sm:table-cell">Warum</th>
                  </tr>
                </thead>
                <tbody>
                  {HACKARTEN.map((h) => (
                    <tr key={h.art} className="border-t border-border-subtle">
                      <td className="py-3.5 px-4 font-semibold text-text-primary">{h.art}</td>
                      <td className="py-3.5 px-4"><span className="font-mono font-bold text-text-primary">{h.wert}</span></td>
                      <td className="py-3.5 px-4 text-text-secondary hidden sm:table-cell">{h.warum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollBereich>
          </section>

          {/* ── Richtig messen ───────────────────────────────────────── */}
          <section id="messen" className="mb-14 scroll-mt-24 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Thermometer size={20} className="text-brand-gold" />
              <h2 className="font-serif text-3xl font-bold text-text-primary">So misst du richtig</h2>
            </div>
            <ol className="list-decimal list-outside ml-5 space-y-3 font-body text-text-secondary leading-relaxed">
              <li><strong className="text-text-primary">Das dickste Stück wählen.</strong> Bei mehreren Frikadellen oder Patties das größte messen — es wird zuletzt gar.</li>
              <li><strong className="text-text-primary">Von der Seite einstechen.</strong> Die Spitze gehört in die Mitte, nicht nach unten an die heiße Pfanne oder den Rost.</li>
              <li><strong className="text-text-primary">Warten, bis der Wert steht.</strong> Erst ablesen, wenn sich die Anzeige nicht mehr bewegt.</li>
              <li><strong className="text-text-primary">Nicht auf das Nachziehen setzen.</strong> Bei Steaks nimmt man das Fleisch früher vom Grill — bei Hack erst, wenn {HACK_MIN} °C erreicht sind.</li>
            </ol>
          </section>

          {/* ── Risikogruppen ───────────────────────────────────────── */}
          <div className="bg-amber-950/40 border border-amber-600/40 p-6 mb-14 flex gap-4 max-w-3xl">
            <AlertTriangle size={22} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-xs font-bold tracking-[0.12em] uppercase text-amber-400 mb-2">
                Lebensmittelsicherheit
              </p>
              <p className="font-body text-sm text-amber-200/80 leading-relaxed">
                Für Schwangere, Kinder, ältere und immungeschwächte Menschen ist vollständiges Durchgaren von
                Hackfleisch Pflicht. Grundlage der Mindestwerte sind die Empfehlungen von BfR und EFSA — die Quellen
                stehen im{' '}
                <Link href="/temperatur-guide" className="underline underline-offset-2 text-amber-200 hover:no-underline">
                  Temperatur-Guide
                </Link>
                . Im Zweifel gelten die amtlichen Empfehlungen.
              </p>
            </div>
          </div>

          {/* ── FAQ ─────────────────────────────────────────────────── */}
          <section id="faq" className="mb-14 scroll-mt-24 max-w-3xl">
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-6">Häufige Fragen</h2>
            <div className="border border-border-subtle">
              {FAQ.map((item) => (
                <details key={item.question} className="group border-b border-border-subtle last:border-0">
                  <summary className="flex items-start justify-between gap-4 p-6 cursor-pointer list-none hover:bg-surface-card transition-colors">
                    <h3 className="font-serif text-base font-bold text-text-primary leading-snug">{item.question}</h3>
                    <ChevronRight size={16} className="text-brand-gold/60 shrink-0 mt-0.5 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-6 pb-6 pt-0">
                    <p className="font-body text-sm text-text-secondary leading-relaxed">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          <div className="mb-14">
            <NewsletterSignup source="kerntemperatur-hackfleisch" />
          </div>

          {/* ── Weiter ─────────────────────────────────────────────── */}
          <div className="pt-10 border-t border-border-subtle">
            <div className="flex items-center gap-3 mb-6">
              <Flame size={16} className="text-brand-gold" />
              <h2 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted">Weiterführend</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: 'Alle Kerntemperaturen: Rind, Schwein, Geflügel, Wild', href: '/temperatur-guide' },
                { label: 'Kerntemperatur-Spickzettel zum Ausdrucken', href: '/kerntemperatur-spickzettel' },
                { label: 'Fleischthermometer im Vergleich', href: '/vergleich/fleischthermometer' },
                { label: 'Glossar: Hackfleisch', href: '/glossar/hackfleisch' },
                { label: 'Direktes Grillen', href: '/methoden/direktes-grillen' },
                { label: 'Zwei-Zonen-Grillen', href: '/glossar/zwei-zonen-grillen' },
              ].map(({ label, href }) => (
                <Link key={href} href={href} className="text-sm font-sans text-text-secondary hover:text-brand-fire transition-colors flex items-center gap-1.5 py-2">
                  <ChevronRight size={11} className="text-brand-gold/50 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
