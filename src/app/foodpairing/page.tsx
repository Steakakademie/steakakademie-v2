import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, FlaskConical, ChefHat, Wine, Scale, Microscope } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AutorHinweis from '@/components/AutorHinweis';
import AromaRad, { type RadMitLabel } from '@/components/foodpairing/AromaRad';
import { gruppenFarbe } from '@/components/foodpairing/AromaRadSvg';
import AromaBrueckeSvg from '@/components/foodpairing/AromaBrueckeSvg';
import { aufzaehlen, istImDatensatz, paarung, rad, statistik, type Paarung } from '@/lib/foodpairing-daten';
import { UEBERRASCHUNGEN, FAKTENCHECK, RAEDER } from '@/lib/foodpairing-inhalte';
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { ogImages } from '@/lib/og';

// Statisch: alle Zahlen werden beim Build aus data/foodpairing gelesen.
export const dynamic = 'force-static';

const URL = '/foodpairing';
const TITEL = 'Foodpairing: Warum Steak und Schokolade zusammenpassen';
const BESCHREIBUNG =
  'Foodpairing erklärt: Welche Zutaten teilen Schlüssel-Aromen? Aroma-Rad zum Ausprobieren, überraschende Paare mit Beleg und der Faktencheck bekannter Kombinationen.';

export const metadata: Metadata = {
  title: 'Foodpairing: Welche Aromen zusammenpassen',
  description: BESCHREIBUNG,
  alternates: { canonical: `https://steakakademie.de${URL}` },
  openGraph: {
    images: ogImages('Foodpairing', 'Warum Steak und Schokolade zusammenpassen'),
    title: TITEL,
    description: BESCHREIBUNG,
    url: `https://steakakademie.de${URL}`,
    type: 'article',
  },
};

function anzahlText(n: number) {
  return n === 1 ? '1 gemeinsames Schlüssel-Aroma' : `${n} gemeinsame Schlüssel-Aromen`;
}

function urteil(p: Paarung | null, art?: 'kontrast') {
  if (art === 'kontrast') return { label: 'Kontrast', klasse: 'border-[#5FB8B0] text-[#5FB8B0]' };
  if (!p) return { label: 'Nicht geprüft', klasse: 'border-border-subtle text-text-muted' };
  const n = p.stoffe.length;
  if (n === 0) return { label: 'Keine Brücke', klasse: 'border-border-subtle text-text-muted' };
  if (n === 1) return { label: 'Schwache Brücke', klasse: 'border-brand-gold/50 text-brand-gold' };
  if (n === 2) return { label: 'Brücke', klasse: 'border-brand-gold text-brand-gold' };
  return { label: 'Starke Brücke', klasse: 'border-brand-fire text-brand-fire' };
}

function Noten({ p }: { p: Paarung }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {p.stoffe.map((s) => (
        <li
          key={s.id}
          title={s.name}
          className="rounded-full border border-border-subtle bg-surface-base px-2.5 py-0.5 font-sans text-[11px] text-text-secondary"
        >
          {s.note ?? s.name}
        </li>
      ))}
    </ul>
  );
}

export default function FoodpairingPage() {
  const stat = statistik();
  const raeder: RadMitLabel[] = RAEDER.map((r) => ({ ...rad(r.zutat, 12), label: r.label, sub: r.sub }));
  const steakSchoko = paarung('Rind', 'Kakao');
  const steakPopcorn = paarung('Rind', 'Popcorn');

  const faq = [
    {
      question: 'Was ist Foodpairing?',
      answer:
        'Foodpairing kombiniert Zutaten nach ihren Schlüssel-Aromen — den wenigen Duftmolekülen, die ein Lebensmittel prägen. Teilen zwei Zutaten solche Moleküle, harmonieren sie oft, auch wenn die Kombination ungewohnt klingt.',
    },
    {
      question: 'Ist Foodpairing wissenschaftlich belegt?',
      answer:
        'Teilweise. Eine Auswertung von über 56.000 Rezepten (Ahn et al., Scientific Reports 2011) fand: Nordamerikanische und westeuropäische Küchen kombinieren bevorzugt Zutaten mit gemeinsamen Aromastoffen, ostasiatische Küchen eher nicht. Gemeinsame Aromen sind also ein guter Hinweis, aber kein Naturgesetz — Geschmack, Textur und Kontrast zählen mit.',
    },
    {
      question: 'Warum passt Steak zu Schokolade?',
      answer: `Gebratenes Rindfleisch und Kakao teilen in unseren belegten Daten ${anzahlText(
        steakSchoko.stoffe.length,
      )}: ${aufzaehlen(steakSchoko.stoffe.map((s) => (s.note ? `${s.note} (${s.name})` : s.name)))}. Deshalb wirkt Kakao im Rub wie eine Verlängerung der Kruste.`,
    },
    {
      question: 'Passen Steak und Popcorn zusammen?',
      answer: `Die Kombination wird oft mit gemeinsamen Röstaromen begründet. In unseren Belegen teilen Rind und Popcorn aber nur ${anzahlText(
        steakPopcorn.stoffe.length,
      )} (${steakPopcorn.stoffe.map((s) => s.note ?? s.name).join(', ')}). Eine schwache Brücke — stärker sind Steak & Kaffee oder Steak & Schokolade.`,
    },
    {
      question: 'Wie nutze ich Foodpairing am Grill?',
      answer:
        'Über Rub, Glaze, Beilage und Getränk: Wähle zum Fleisch eine Zutat mit mehreren gemeinsamen Schlüssel-Aromen — zum Beispiel Kaffee oder Kakao im Rub für Rind, Himbeere als Glaze für Schwein. Die Foodpairing-Suche auf der Startseite und der Aroma-Matcher zeigen dir passende Partner.',
    },
  ];

  const articleSch = articleSchema({
    headline: TITEL,
    description: BESCHREIBUNG,
    image: '/api/og',
    datePublished: '2026-09-30',
    authorName: 'Elena',
    authorSlug: 'elena',
    url: URL,
    keywords: ['Foodpairing', 'Aromen kombinieren', 'Schlüssel-Aromen', 'Steak und Schokolade', 'Aroma-Rad'],
  });
  const breadcrumbSch = breadcrumbSchema([
    { name: 'Wissen', url: '/wissen' },
    { name: 'Foodpairing', url: URL },
  ]);

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faq)) }} />

      <main className="min-h-screen bg-surface-base">
        <div className="mx-auto max-w-editorial px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <nav className="mb-6 flex items-center gap-1.5 font-sans text-xs text-text-muted" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-brand-fire">Start</Link>
            <ChevronRight size={12} />
            <Link href="/wissen" className="transition-colors hover:text-brand-fire">Wissen</Link>
            <ChevronRight size={12} />
            <span className="text-text-secondary">Foodpairing</span>
          </nav>

          {/* ── Hero ── */}
          <header className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-brand-fire">
                <FlaskConical size={12} /> Aromenforschung
              </span>
              <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-text-light sm:text-4xl lg:text-5xl">
                Foodpairing: Warum Steak und Schokolade zusammenpassen
              </h1>
              <p className="mt-4 font-body text-[1.08rem] leading-relaxed text-text-secondary">
                Beim Foodpairing kombinierst du Zutaten nicht nach Gewohnheit, sondern nach ihren{' '}
                <strong className="text-text-light">Schlüssel-Aromen</strong> — den wenigen Duftmolekülen, die ein
                Lebensmittel wirklich prägen. Teilen zwei Zutaten solche Moleküle, schlagen sie eine Brücke. Sie
                harmonieren, auch wenn die Kombination auf den ersten Blick absurd klingt.
              </p>
              <p className="mt-3 font-body text-[1.08rem] leading-relaxed text-text-secondary">
                Ein gebratenes Steak und dunkler Kakao zum Beispiel teilen {anzahlText(steakSchoko.stoffe.length)}:{' '}
                {aufzaehlen(steakSchoko.stoffe.map((s) => s.note ?? s.name))}. Probier es unten im Aroma-Rad aus.
              </p>
              <p className="mt-5 font-sans text-xs text-text-muted">Von Elena · Food Science</p>
              <AutorHinweis authorSlug="elena" />
            </div>
            <figure className="lg:col-span-5">
              <AromaBrueckeSvg
                a="Steak"
                subA="Rind, gebraten"
                b="Kakao"
                subB="Schokolade"
                bruecken={steakSchoko.stoffe.map((s) => ({ note: s.note ?? s.name, stoff: s.name }))}
                idSuffix="hero"
                className="w-full overflow-hidden rounded-2xl border border-brand-gold/30"
                titel={`Aroma-Brücke Steak und Kakao: ${steakSchoko.stoffe
                  .map((s) => `${s.note ?? s.name} (${s.name})`)
                  .join(', ')}`}
              />
              <figcaption className="mt-2 font-sans text-[11px] text-text-muted">
                Die Aroma-Brücke zwischen gebratenem Rind und Kakao — Daten aus unserer belegten Aroma-Datenbank.
              </figcaption>
            </figure>
          </header>

          {/* ── Aroma-Rad ── */}
          <section className="mt-14" aria-labelledby="rad">
            <h2 id="rad" className="font-serif text-2xl font-bold text-text-light sm:text-3xl">
              Das Aroma-Rad: Wer passt zu wem?
            </h2>
            <p className="mb-5 mt-2 max-w-2xl font-body text-text-secondary">
              In der Mitte steht deine Zutat, außen ihre stärksten Partner. Die Zahl im Punkt zeigt, wie viele
              Schlüssel-Aromen die beiden teilen — je größer der Punkt, desto stärker die Brücke. Tipp einen Partner
              an, um zu sehen, welche Aromen es sind.
            </p>
            <AromaRad raeder={raeder} />
          </section>

          {/* ── So funktioniert's ── */}
          <section className="mt-14" aria-labelledby="prinzip">
            <h2 id="prinzip" className="font-serif text-2xl font-bold text-text-light sm:text-3xl">
              So funktioniert Foodpairing
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                {
                  t: '1 · Wenige Moleküle prägen alles',
                  x: 'Ein Steak gibt beim Braten hunderte flüchtige Stoffe ab. Riechen kannst du nur eine Handvoll davon — die Schlüssel-Aromen. Die Aromaforschung findet sie mit Verdünnungsanalysen und Nachbau-Versuchen.',
                },
                {
                  t: '2 · Gemeinsame Moleküle bauen Brücken',
                  x: 'Steckt dasselbe Schlüssel-Aroma in zwei Zutaten, greifen sie ineinander statt zu konkurrieren. Das ist die Grundidee des Foodpairings.',
                },
                {
                  t: '3 · Mehr Brücken, stärkeres Signal',
                  x: 'Eine gemeinsame Note ist ein Hinweis, drei oder mehr sind ein starkes Signal. Geschmack, Textur und Temperatur entscheiden trotzdem mit.',
                },
              ].map((k) => (
                <div key={k.t} className="rounded-xl border border-border-subtle bg-surface-card p-5">
                  <h3 className="mb-2 font-serif text-lg font-bold text-text-light">{k.t}</h3>
                  <p className="font-sans text-sm leading-relaxed text-text-secondary">{k.x}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Überraschende Paare ── */}
          <section className="mt-14" aria-labelledby="paare">
            <h2 id="paare" className="font-serif text-2xl font-bold text-text-light sm:text-3xl">
              Überraschende Paare — mit Beleg
            </h2>
            <p className="mt-2 max-w-2xl font-body text-text-secondary">
              Jede Zahl kommt aus unserer eigenen Aroma-Datenbank, jede Verbindung ist mit Fachstudien belegt.
            </p>
            {UEBERRASCHUNGEN.map((g) => (
              <div key={g.gruppe} className="mt-8">
                <h3 className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">{g.gruppe}</h3>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {g.paare.map((pp) => {
                    const p = paarung(pp.a, pp.b);
                    const u = urteil(p);
                    return (
                      <article key={pp.titel} className="flex flex-col rounded-xl border border-border-subtle bg-surface-card p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-serif text-xl font-bold text-text-light">{pp.titel}</h4>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide ${u.klasse}`}>
                            {u.label}
                          </span>
                        </div>
                        <p className="mt-1 font-sans text-xs text-text-muted">
                          <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ background: gruppenFarbe(pp.katA) }} aria-hidden />{' '}
                          {anzahlText(p.stoffe.length)}
                        </p>
                        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">{pp.text}</p>
                        <div className="mt-3">
                          <Noten p={p} />
                        </div>
                        <p className="mt-4 font-sans text-sm text-text-light">
                          <span className="font-bold text-brand-fire">Am Grill: </span>
                          {pp.grill}
                        </p>
                        <Link
                          href={`/?schmiede=${encodeURIComponent(pp.auftrag)}#werkzeuge`}
                          className="mt-auto inline-flex items-center gap-1.5 pt-4 font-sans text-xs font-bold uppercase tracking-wide text-brand-gold hover:text-brand-fire"
                        >
                          <ChefHat size={14} /> Rezept dazu
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {/* ── Faktencheck ── */}
          <section className="mt-14" aria-labelledby="faktencheck">
            <h2 id="faktencheck" className="font-serif text-2xl font-bold text-text-light sm:text-3xl">
              Bekannte Kombinationen im Faktencheck
            </h2>
            <p className="mt-2 max-w-2xl font-body text-text-secondary">
              Im Netz kursieren viele „wissenschaftliche“ Foodpairing-Listen. Wir haben die bekanntesten gegen unsere
              belegten Daten gehalten. Nicht jedes Paar hält, was es verspricht — und manche funktionieren aus einem
              ganz anderen Grund.
            </p>
            <div className="mt-5 overflow-hidden rounded-xl border border-border-subtle">
              {FAKTENCHECK.map((f, i) => {
                const p = f.a && f.b && istImDatensatz(f.a) && istImDatensatz(f.b) ? paarung(f.a, f.b) : null;
                const besser = f.besser ? paarung(f.besser.a, f.besser.b) : null;
                const u = urteil(p, f.art);
                return (
                  <div
                    key={f.titel}
                    className={`grid gap-2 bg-surface-card p-5 sm:grid-cols-12 sm:gap-4 ${i ? 'border-t border-border-subtle' : ''}`}
                  >
                    <div className="sm:col-span-4">
                      <h3 className="font-serif text-lg font-bold text-text-light">{f.titel}</h3>
                      <span className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide ${u.klasse}`}>
                        {u.label}
                        {p && f.art !== 'kontrast' ? ` · ${p.stoffe.length}` : ''}
                      </span>
                    </div>
                    <div className="font-sans text-sm leading-relaxed text-text-secondary sm:col-span-8">
                      <p>{f.text}</p>
                      {p && p.stoffe.length > 0 && (
                        <div className="mt-2">
                          <Noten p={p} />
                        </div>
                      )}
                      {besser && f.besser && (
                        <p className="mt-2 text-text-light">
                          <span className="font-bold text-brand-gold">Stärker: </span>
                          {f.besser.label} — {anzahlText(besser.stoffe.length)}.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Brücke oder Kontrast ── */}
          <section className="mt-14 grid gap-4 md:grid-cols-2" aria-label="Zwei Wege zum guten Pairing">
            <div className="rounded-xl border border-brand-fire/40 bg-surface-card p-6">
              <p className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-fire">
                <FlaskConical size={12} /> Weg 1
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-text-light">Brücke: gleiche Aromen</h2>
              <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
                Zwei Zutaten teilen Schlüssel-Aromen und verstärken sich. Beispiel: Steak & Kaffee — Karamell, Rauch
                und die Brühe-Note. Das ist Foodpairing im engeren Sinn.
              </p>
            </div>
            <div className="rounded-xl border border-[#5FB8B0]/50 bg-surface-card p-6">
              <p className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5FB8B0]">
                <Scale size={12} /> Weg 2
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-text-light">Kontrast: Gegensätze gleichen aus</h2>
              <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
                Säure schneidet Fett, Süße puffert Schärfe, Salz hebt Frucht. Beispiel: Essiggurke zum fetten Pulled
                Pork. Hier teilen die Zutaten keine Aromen — sie ergänzen sich im Geschmack.
              </p>
            </div>
          </section>

          {/* ── Grenzen & Datenbasis ── */}
          <section className="mt-14 grid gap-4 lg:grid-cols-2" aria-label="Grenzen und Datenbasis">
            <div className="rounded-xl border border-border-subtle bg-surface-card p-6">
              <h2 className="font-serif text-2xl font-bold text-text-light">Wo die Theorie an Grenzen stößt</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
                Eine Auswertung von über 56.000 Rezepten zeigte: Nordamerikanische und westeuropäische Küchen
                kombinieren bevorzugt Zutaten mit gemeinsamen Aromastoffen — ostasiatische Küchen eher nicht, und
                schmecken trotzdem hervorragend (
                <a
                  href="https://doi.org/10.1038/srep00196"
                  className="underline hover:text-brand-fire"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ahn et al., Scientific Reports 2011
                </a>
                ).
              </p>
              <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
                Gemeinsame Aromen sind deshalb ein Kompass, kein Gesetz. Grundgeschmack (süß, sauer, salzig, bitter,
                umami), Textur, Temperatur und Menge entscheiden mit, ob ein Paar auf dem Teller funktioniert.
              </p>
            </div>
            <div className="rounded-xl border border-brand-gold/30 bg-surface-card p-6">
              <h2 className="inline-flex items-center gap-2 font-serif text-2xl font-bold text-text-light">
                <Microscope size={20} className="text-brand-gold" /> Unsere Datenbasis
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  [stat.zutaten, 'Zutaten'],
                  [stat.stoffe, 'Schlüssel-Aromen'],
                  [stat.kanten, 'Verbindungen'],
                  [stat.studien, 'Fachstudien'],
                ].map(([zahl, label]) => (
                  <div key={label} className="rounded-lg bg-surface-base p-3 text-center">
                    <dt className="order-2 font-sans text-[11px] text-text-muted">{label}</dt>
                    <dd className="font-serif text-2xl font-bold text-brand-gold">{zahl}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 font-sans text-sm leading-relaxed text-text-secondary">
                Viele Foodpairing-Tools zählen jedes Molekül, das zwei Zutaten gemeinsam haben — auch Spuren, die
                niemand riecht. Wir zählen nur Schlüssel-Aromen, die in Fachstudien per Verdünnungsanalyse,
                Aromawert oder Nachbau-Versuch als geruchsprägend nachgewiesen sind. Jede Verbindung hat eine Quelle
                mit DOI. Weniger Treffer, aber jeder ist am Gaumen spürbar.
              </p>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="mt-14 max-w-3xl" aria-labelledby="faq">
            <h2 id="faq" className="font-serif text-2xl font-bold text-text-light sm:text-3xl">Häufige Fragen</h2>
            <div className="mt-4 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-card">
              {faq.map((f) => (
                <details key={f.question} className="group p-5">
                  <summary className="cursor-pointer list-none font-serif text-lg font-bold text-text-light marker:hidden">
                    {f.question}
                  </summary>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* ── Weiter ── */}
          <section className="mt-14 grid gap-4 md:grid-cols-2">
            <Link
              href="/#werkzeuge"
              className="group rounded-xl border border-brand-gold/40 bg-surface-card p-6 transition-colors hover:border-brand-gold"
            >
              <FlaskConical size={20} className="text-brand-fire" />
              <h2 className="mt-2 font-serif text-xl font-bold text-text-light">Deine Zutat testen</h2>
              <p className="mt-1 font-sans text-sm text-text-secondary">
                Die Foodpairing-Suche findet Partner für jede der {stat.zutaten} Zutaten — und schmiedet dir auf Wunsch
                gleich ein Rezept daraus.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-brand-gold group-hover:gap-2 transition-[gap]">
                Zur Suche <ChevronRight size={14} />
              </span>
            </Link>
            <Link
              href="/aroma-matcher"
              className="group rounded-xl border border-brand-gold/40 bg-surface-card p-6 transition-colors hover:border-brand-gold"
            >
              <Wine size={20} className="text-brand-fire" />
              <h2 className="mt-2 font-serif text-xl font-bold text-text-light">Aroma-Matcher für deinen Cut</h2>
              <p className="mt-1 font-sans text-sm text-text-secondary">
                Rub, Räucherholz und das passende Glas — zugeschnitten auf Ribeye, Brisket, Flank und mehr.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-brand-gold group-hover:gap-2 transition-[gap]">
                Cut wählen <ChevronRight size={14} />
              </span>
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
