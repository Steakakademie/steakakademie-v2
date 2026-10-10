import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Thermometer, Flame, Clock } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import KeyFacts from '@/components/KeyFacts';
import AutorHinweis from '@/components/AutorHinweis';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import AngebotsRegal from '@/components/angebote/AngebotsRegal';
import { angebote } from '@/lib/angebote/register';
import { regal } from '@/lib/angebote/auswahl';
import ScrollBereich from '@/components/ui/ScrollBereich';
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { badge, garstufenRind, kernReferenz, spanne } from '@/lib/kerntemperatur-referenz';
import { seoTitel } from '@/lib/seo-titel';
import { ogImages } from '@/lib/og';

/**
 * /kerntemperatur-steak — Antwortseite fuer die Steak-Nachfrage (Aufgabe 1 des
 * SEO/GEO-Teams, 10.10.2026; Freigabe Uwe im Chat: „Ja, bau die Steak-Seite als
 * Content-PR"; der Merge ist die Freigabe, Regel 4).
 *
 * Anlass (GSC, Websuche, 90 Tage bis 06.10.2026): 322 Steak-/Rind-Anfragen, 1.361
 * Impressionen, Position 31,6 — 72 % davon beantwortet /temperatur-guide, eine
 * Sammelseite fuer alle Tierarten. Hackfleisch (Position ~9) zeigt, dass eine eigene
 * Antwortseite je Frage der Weg ist; diese Seite prueft es am zweiten Beispiel.
 *
 * Werte NUR aus data/kerntemperatur-referenz.yaml (Regel 8c):
 *   garstufen_rind  → rare … well_done (Korridore)
 *   badges.beef_mr  → Medium Rare, Steakakademie-Standard 54 °C
 *   badges.wagyu / badges.beef_flank → Teilstuecke
 *   meta.carryover / meta.messen → Nachziehen, Einstich
 * Der Ziehwert fuer Medium Rare (50–51 °C) steht woertlich in meta.ziehtemperatur;
 * src/__tests__/kerntemperatur-steak.test.ts bindet die Seite daran. Fuer die uebrigen
 * Stufen nennt die Referenz nur die Faustregel (ca. 3 °C vor Ziel), keinen eigenen
 * Ziehwert — deshalb steht hier auch keiner. Keine Garzeiten.
 */

const GARSTUFEN = garstufenRind();
const MR = badge('beef_mr');
const MR_SPANNE = spanne('beef_mr');
const WAGYU = spanne('wagyu');
const FLANK = spanne('beef_flank');
const REF = kernReferenz();
// Quelle: meta.ziehtemperatur („Medium Rare: bei 50-51 °C ziehen"); Test haelt die Bindung.
const MR_ZIEHEN = '50–51 °C';

const URL = '/kerntemperatur-steak';
const TITEL = 'Kerntemperatur Steak: Garstufen von Rare bis Well Done';
/** Wie ein Garpunkt innen aussieht — nur Beschreibung, keine Zahl. */
const KERN: Record<string, string> = {
  rare: 'Kern rot, kaum gewärmt',
  medium_rare: 'Kern rot bis rosa, saftig',
  medium: 'Kern rosa',
  medium_well: 'Kern nur noch leicht rosa',
  well_done: 'durchgegart, grau-braun',
};

const bereich = (key: string) => {
  const g = GARSTUFEN[key];
  if (!g) throw new Error(`Garstufe „${key}" fehlt in data/kerntemperatur-referenz.yaml`);
  return key === 'well_done' ? `ab ${g.range[0]} °C` : `${g.range[0]}–${g.range[1]} °C`;
};

const BESCHREIBUNG = `Kerntemperatur Steak: Medium Rare ${MR_SPANNE} (Standard ${MR.c} °C), Medium ${bereich('medium')}, Well Done ${bereich('well_done')} — Tabelle, Nachziehen, richtig messen.`;

const STUFEN = ['rare', 'medium_rare', 'medium', 'medium_well', 'well_done'] as const;
const GLOSSAR: Record<string, string> = {
  rare: '/glossar/rare',
  medium_rare: '/glossar/medium-rare',
  medium: '/glossar/medium',
  medium_well: '/glossar/medium-well',
  well_done: '/glossar/well-done',
};

const TEILSTUECKE: { name: string; wert: string; hinweis: string; href: string }[] = [
  { name: 'Ribeye / Entrecôte', wert: MR_SPANNE, hinweis: `Standard ${MR.c} °C — viel Marmorierung, verzeiht mehr.`, href: '/cuts/ribeye' },
  { name: 'Rumpsteak', wert: MR_SPANNE, hinweis: 'Magerer als Ribeye: exakt messen, nicht zu lange auf dem Rost.', href: '/glossar/rumpsteak' },
  { name: 'Flank Steak', wert: FLANK, hinweis: 'Dünnes, langfaseriges Stück — quer zur Faser aufschneiden.', href: '/glossar/flank-steak' },
  { name: 'Wagyu', wert: WAGYU, hinweis: 'Das Fett schmilzt früh, deshalb liegt der Korridor etwas tiefer.', href: '/glossar/wagyu' },
];

const FAQ = [
  {
    question: 'Welche Kerntemperatur hat ein Medium-Rare-Steak?',
    answer: `${MR_SPANNE} im Kern, gemessen im dicksten Punkt. Der Standard der Steakakademie liegt bei ${MR.c} °C, am oberen Rand des Korridors. Vom Grill nehmen kannst du es bei etwa ${MR_ZIEHEN}, weil es beim Ruhen noch nachzieht.`,
  },
  {
    question: 'Bei wie viel Grad ist ein Steak medium?',
    answer: `Medium liegt bei ${bereich('medium')} Kerntemperatur. Darunter beginnt der Bereich von Medium Rare (${bereich('medium_rare')}), darüber Medium Well (${bereich('medium_well')}).`,
  },
  {
    question: 'Welche Kerntemperatur hat ein Ribeye-Steak?',
    answer: `Für ein Ribeye gilt dieselbe Skala wie für andere Rindersteaks: Medium Rare ${MR_SPANNE}, Standard ${MR.c} °C. Die Marmorierung macht das Stück verzeihender, ersetzt aber das Thermometer nicht.`,
  },
  {
    question: 'Wann nehme ich das Steak vom Grill?',
    answer: `${REF.meta.carryover}. Für Medium Rare heißt das: bei etwa ${MR_ZIEHEN} vom Grill nehmen; es zieht beim Ruhen auf ${MR_SPANNE} nach. Bei Reverse Sear liegt der Ziehwert noch etwas tiefer, weil das kurze Anbraten am Schluss den Kern um 2–3 °C hebt.`,
  },
  {
    question: 'Wie lange muss ein Steak ruhen?',
    answer: 'Steaks brauchen etwa 5–7 Minuten Ruhe, große Braten 10–20 Minuten. Ruhen lassen am besten auf einer vorgewärmten Unterlage, nicht auf dem kalten Teller.',
  },
  {
    question: 'Wo messe ich die Kerntemperatur beim Steak?',
    answer: 'Mit dem Thermometer seitlich in den dicksten Punkt einstechen, nicht am Knochen.',
  },
  {
    question: 'Gilt das auch für Hackfleisch, Schwein und Geflügel?',
    answer: 'Nein. Diese Skala gilt für Rindersteaks aus einem Stück. Hackfleisch, Schwein und Geflügel haben eigene Mindestwerte und gehören durchgegart oder auf einen sicheren Kernwert gebracht.',
  },
];

export const metadata: Metadata = {
  title: seoTitel(TITEL),
  description: BESCHREIBUNG,
  alternates: { canonical: `https://steakakademie.de${URL}` },
  openGraph: {
    title: TITEL,
    description: BESCHREIBUNG,
    url: `https://steakakademie.de${URL}`,
    type: 'article',
    images: ogImages(`Kerntemperatur Steak: Medium Rare ${MR_SPANNE}`),
  },
  twitter: { card: 'summary_large_image', creator: '@steakakademie' },
};

export default function KerntemperaturSteakPage() {
  const breadcrumbSch = breadcrumbSchema([
    { name: 'Kerntemperaturen', url: '/temperatur-guide' },
    { name: 'Steak', url: URL },
  ]);
  const faqSch = faqSchema(FAQ);
  const articleSch = articleSchema({
    headline: TITEL,
    description: BESCHREIBUNG,
    url: URL,
    image: `/api/og?title=${encodeURIComponent(`Kerntemperatur Steak: Medium Rare ${MR_SPANNE}`)}`,
    datePublished: '2026-10-10',
    authorName: 'Marco',
    authorSlug: 'marco',
    keywords: ['Kerntemperatur Steak', 'Steak Garstufen', 'Medium Rare Temperatur', 'Kerntemperatur Ribeye', 'Steak Temperatur Tabelle'],
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
              <span className="text-text-light/65">Steak</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Kerntemperatur-Referenz
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-5">
                Kerntemperatur Steak: Medium Rare bei {MR_SPANNE}
              </h1>
              <p className="font-body text-lg text-text-light/75 leading-relaxed mb-6">
                Ein Rindersteak ist <strong className="text-text-light">Medium Rare bei {MR_SPANNE}</strong> im Kern
                (Steakakademie-Standard: {MR.c} °C), <strong className="text-text-light">Medium bei {bereich('medium')}</strong> und
                {' '}<strong className="text-text-light">Well Done {bereich('well_done')}</strong>. Gemessen wird im dicksten Punkt;
                vom Grill nimmst du das Steak etwa 3 °C vor dem Zielwert, weil es beim Ruhen nachzieht.
              </p>

              <KeyFacts
                variant="dark"
                quelle="Werte aus der kanonischen Kerntemperatur-Referenz der Steakakademie — Kerntemperatur im dicksten Punkt."
                facts={[
                  { label: 'Rare', value: bereich('rare') },
                  { label: 'Medium Rare', value: `${MR_SPANNE} — Standard ${MR.c} °C` },
                  { label: 'Medium', value: bereich('medium') },
                  { label: 'Medium Well', value: bereich('medium_well') },
                  { label: 'Well Done', value: bereich('well_done') },
                  { label: 'Nachziehen', value: REF.meta.carryover },
                  { label: 'Richtig messen', value: REF.meta.messen.replace('NICHT', 'nicht') },
                ]}
              />

              <p className="mt-5 font-sans text-xs text-text-light/55">Von Marco · Technik & Kerntemperaturen</p>
              <AutorHinweis authorSlug="marco" />
            </div>
          </div>
        </section>

        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* ── Tabelle ─────────────────────────────────────────────── */}
          <section id="tabelle" className="mb-14 scroll-mt-24">
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-2">Garstufen beim Steak — Tabelle</h2>
            <p className="font-body text-text-secondary leading-relaxed mb-6 max-w-2xl">
              Die Werte sind <strong className="text-text-primary">Korridore</strong>, keine Punktwerte: Sie decken den
              Garbereich der jeweiligen Stufe ab. Innerhalb von Medium Rare empfehlen wir {MR.c} °C.
            </p>
            <ScrollBereich label="Kerntemperatur Steak nach Garstufe">
              <table className="w-full text-sm font-sans border border-border-subtle">
                <thead>
                  <tr className="bg-surface-card text-left">
                    <th className="py-3 px-4 font-bold text-text-primary">Garstufe</th>
                    <th className="py-3 px-4 font-bold text-text-primary">Kerntemperatur</th>
                    <th className="py-3 px-4 font-bold text-text-primary hidden sm:table-cell">Innen</th>
                  </tr>
                </thead>
                <tbody>
                  {STUFEN.map((k) => (
                    <tr key={k} className={`border-t border-border-subtle ${k === 'medium_rare' ? 'bg-brand-gold/5' : ''}`}>
                      <td className="py-3.5 px-4 font-semibold text-text-primary">
                        <Link href={GLOSSAR[k]} className="hover:text-brand-fire transition-colors">{GARSTUFEN[k].label}</Link>
                      </td>
                      <td className="py-3.5 px-4"><span className="font-mono font-bold text-text-primary">{bereich(k)}</span></td>
                      <td className="py-3.5 px-4 text-text-secondary hidden sm:table-cell">{KERN[k]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollBereich>
            <p className="mt-3 font-sans text-xs text-text-muted">
              Zwischen Rare und Medium Rare liegen {GARSTUFEN.rare.range[1] + 1}–{GARSTUFEN.medium_rare.range[0] - 1} °C: dieser Bereich hat in unserer Skala keine eigene Stufe.
            </p>
          </section>

          {/* ── Vom Grill nehmen ─────────────────────────────────────── */}
          <section id="nachziehen" className="mb-14 scroll-mt-24 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Thermometer size={18} className="text-brand-gold" />
              <h2 className="font-serif text-3xl font-bold text-text-primary">Wann das Steak vom Grill muss</h2>
            </div>
            <p className="font-body text-text-secondary leading-relaxed mb-4">
              Ein Steak gart beim Ruhen weiter: {REF.meta.carryover}. Wer erst beim Zielwert vom Rost geht, landet
              danach eine Stufe darüber. Für Medium Rare heißt das: bei etwa{' '}
              <strong className="text-text-primary">{MR_ZIEHEN}</strong> vom Grill nehmen, serviert wird bei {MR_SPANNE}.
            </p>
            <p className="font-body text-text-secondary leading-relaxed">
              Bei <Link href="/methoden/reverse-sear" className="text-brand-fire hover:underline">Reverse Sear</Link> liegt
              der Ziehwert noch etwas tiefer, weil das kurze, sehr heiße Anbraten am Schluss den Kern um 2–3 °C hebt.
              Für die übrigen Stufen gibt die Referenz die Faustregel „ca. 3 °C vor Ziel“ vor, keinen eigenen Ziehwert.
            </p>
          </section>

          {/* ── Messen & Ruhen ───────────────────────────────────────── */}
          <section id="messen" className="mb-14 scroll-mt-24 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={18} className="text-brand-gold" />
              <h2 className="font-serif text-3xl font-bold text-text-primary">Richtig messen und ruhen lassen</h2>
            </div>
            <ul className="space-y-3 font-body text-text-secondary leading-relaxed list-disc pl-5">
              <li>
                <strong className="text-text-primary">Messen:</strong> {REF.meta.messen.replace('NICHT', 'nicht')}. Seitlich einstechen,
                bis die Spitze in der Mitte sitzt.
              </li>
              <li>
                <strong className="text-text-primary">Ruhen:</strong> Steaks etwa 5–7 Minuten, große Braten 10–20 Minuten, auf einer
                vorgewärmten Unterlage statt auf dem kalten Teller.
              </li>
            </ul>
          </section>

          {/* ── Teilstuecke ─────────────────────────────────────────── */}
          <section id="teilstuecke" className="mb-14 scroll-mt-24">
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-2">Nach Teilstück: Medium Rare</h2>
            <p className="font-body text-text-secondary leading-relaxed mb-6 max-w-2xl">
              Die Skala gilt für alle Rindersteaks aus einem Stück. Abweichungen gibt es nur dort, wo das Teilstück es
              verlangt.
            </p>
            <ScrollBereich label="Medium Rare nach Teilstück">
              <table className="w-full text-sm font-sans border border-border-subtle">
                <thead>
                  <tr className="bg-surface-card text-left">
                    <th className="py-3 px-4 font-bold text-text-primary">Teilstück</th>
                    <th className="py-3 px-4 font-bold text-text-primary">Medium Rare</th>
                    <th className="py-3 px-4 font-bold text-text-primary hidden sm:table-cell">Hinweis</th>
                  </tr>
                </thead>
                <tbody>
                  {TEILSTUECKE.map((t) => (
                    <tr key={t.name} className="border-t border-border-subtle">
                      <td className="py-3.5 px-4 font-semibold text-text-primary">
                        <Link href={t.href} className="hover:text-brand-fire transition-colors">{t.name}</Link>
                      </td>
                      <td className="py-3.5 px-4"><span className="font-mono font-bold text-text-primary">{t.wert}</span></td>
                      <td className="py-3.5 px-4 text-text-secondary hidden sm:table-cell">{t.hinweis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollBereich>
          </section>

          {/* ── Abgrenzung ──────────────────────────────────────────── */}
          <section id="abgrenzung" className="mb-14 scroll-mt-24 max-w-3xl">
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-4">Gilt nur für Rind aus einem Stück</h2>
            <p className="font-body text-text-secondary leading-relaxed">
              <Link href="/kerntemperatur-hackfleisch" className="text-brand-fire hover:underline">Hackfleisch</Link>,
              Schwein und Geflügel folgen eigenen Mindestwerten — dort ist „rosa“ nicht dasselbe wie beim Steak. Alle Tierarten
              auf einer Seite zeigt der{' '}
              <Link href="/temperatur-guide" className="text-brand-fire hover:underline">Temperatur-Guide</Link>, zum
              Ausdrucken gibt es den{' '}
              <Link href="/kerntemperatur-spickzettel" className="text-brand-fire hover:underline">Kerntemperatur-Spickzettel</Link>.
            </p>
          </section>

          {/* ── FAQ ─────────────────────────────────────────────────── */}
          <section id="faq" className="mb-14 scroll-mt-24 max-w-3xl">
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-6">Häufige Fragen zur Steak-Kerntemperatur</h2>
            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              {FAQ.map((f) => (
                <details key={f.question} className="group py-4">
                  <summary className="cursor-pointer list-none font-sans font-semibold text-text-primary flex items-center justify-between gap-4">
                    {f.question}
                    <ChevronRight size={16} className="shrink-0 text-brand-gold transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 font-body text-text-secondary leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="mb-14">
            <NewsletterSignup source="kerntemperatur-steak" />
          </div>

          {/* ── Eigene Angebote — Anlass: Temperatur-Antwortseite (data/angebote.yaml) ── */}
          <AngebotsRegal
            hinweise={regal(angebote(), { typ: 'antwortseite', slug: 'kerntemperatur-steak' })}
            seite="antwortseite"
          />

          {/* ── Weiter ─────────────────────────────────────────────── */}
          <div className="pt-10 border-t border-border-subtle">
            <div className="flex items-center gap-3 mb-6">
              <Flame size={16} className="text-brand-gold" />
              <h2 className="font-sans text-xs font-bold tracking-[0.14em] uppercase text-text-muted">Weiterführend</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: 'Alle Kerntemperaturen: Rind, Schwein, Geflügel, Wild', href: '/temperatur-guide' },
                { label: 'Kerntemperatur Hackfleisch & Frikadellen', href: '/kerntemperatur-hackfleisch' },
                { label: 'Kerntemperatur-Spickzettel zum Ausdrucken', href: '/kerntemperatur-spickzettel' },
                { label: 'Ribeye Guide', href: '/cuts/ribeye' },
                { label: 'Reverse Sear', href: '/methoden/reverse-sear' },
                { label: 'Fleischthermometer im Vergleich', href: '/vergleich/fleischthermometer' },
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
