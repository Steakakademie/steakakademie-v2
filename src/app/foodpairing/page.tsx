import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, FlaskConical, ChefHat, Wine, Scale, Microscope, Sparkles, History, AlertTriangle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AutorHinweis from '@/components/AutorHinweis';
import AromaRad, { type RadMitLabel } from '@/components/foodpairing/AromaRad';
import { gruppenFarbe } from '@/components/foodpairing/AromaRadSvg';
import AromaBrueckeSvg from '@/components/foodpairing/AromaBrueckeSvg';
import {
  aromaUrteil,
  aufzaehlen,
  istImDatensatz,
  paarung,
  rad,
  statistik,
  type Paarung,
  type Urteil,
} from '@/lib/foodpairing-daten';
import { UEBERRASCHUNGEN, FAKTENCHECK, RAEDER, STEAK_POPCORN } from '@/lib/foodpairing-inhalte';
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { ogImages } from '@/lib/og';

// Statisch: alle Zahlen werden beim Build aus data/foodpairing gelesen.
export const dynamic = 'force-static';

const URL = '/foodpairing';
const TITEL = 'Foodpairing: Warum Steak und Schokolade zusammenpassen';
const BESCHREIBUNG =
  'Foodpairing erklärt: Schlüssel-Aromen, die drei Hebel guter Paare, Aroma-Rad zum Ausprobieren, Steak & Popcorn im Detail und was die Forschung wirklich sagt.';

export const metadata: Metadata = {
  title: 'Foodpairing: Welche Aromen zusammenpassen',
  description: BESCHREIBUNG,
  alternates: { canonical: `https://steakakademie.de${URL}` },
  openGraph: {
    images: ogImages('Foodpairing erklärt', 'Warum Steak und Schokolade zusammenpassen'),
    title: TITEL,
    description: BESCHREIBUNG,
    url: `https://steakakademie.de${URL}`,
    type: 'article',
  },
};

function anzahlText(n: number) {
  return n === 1 ? '1 gemeinsames Schlüssel-Aroma' : `${n} gemeinsame Schlüssel-Aromen`;
}

const URTEIL_KLASSE: Record<Urteil, string> = {
  'Starke Brücke': 'border-brand-fire text-brand-fire',
  Brücke: 'border-brand-gold text-brand-gold',
  'Schwache Brücke': 'border-brand-gold/50 text-brand-gold',
  'Keine Brücke': 'border-border-subtle text-text-muted',
};

function UrteilMarke({ p }: { p: Paarung | null }) {
  if (!p) {
    return <Marke klasse="border-border-subtle text-text-muted">Nicht geprüft</Marke>;
  }
  const u = aromaUrteil(p);
  return <Marke klasse={URTEIL_KLASSE[u]}>{u}</Marke>;
}

function Marke({ klasse, children }: { klasse: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block shrink-0 rounded-full border px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide ${klasse}`}>
      {children}
    </span>
  );
}

/** Chips: gleiche Moleküle (voll) und verwandte Noten (gestrichelt, „≈"). */
function Noten({ p }: { p: Paarung }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {p.stoffe.map((s) => (
        <li
          key={s.id}
          title={`Gleiches Molekül: ${s.name}`}
          className="rounded-full border border-border-subtle bg-surface-base px-2.5 py-0.5 font-sans text-[11px] text-text-secondary"
        >
          {s.note ?? s.name}
        </li>
      ))}
      {p.verwandt.map((v) => (
        <li
          key={v.familie}
          title={`Verwandte Note: ${v.a.join(', ')} ↔ ${v.b.join(', ')}`}
          className="rounded-full border border-dashed border-brand-gold/50 px-2.5 py-0.5 font-sans text-[11px] text-text-muted"
        >
          ≈ {v.familie}
        </li>
      ))}
    </ul>
  );
}

function Quelle({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="underline decoration-brand-gold/40 hover:text-brand-fire" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default function FoodpairingPage() {
  const stat = statistik();
  const raeder: RadMitLabel[] = RAEDER.map((r) => ({ ...rad(r.zutat, 12), label: r.label, sub: r.sub }));
  const steakSchoko = paarung('Rind', 'Kakao');
  const popcorn = paarung(STEAK_POPCORN.a, STEAK_POPCORN.b);

  const faq = [
    {
      question: 'Was ist Foodpairing?',
      answer:
        'Foodpairing kombiniert Zutaten nach ihren Schlüssel-Aromen — den wenigen Duftmolekülen, die ein Lebensmittel prägen. Teilen zwei Zutaten solche Moleküle, riechen sie verwandt und passen oft zusammen, auch wenn die Kombination ungewohnt klingt. Die Idee wurde um das Jahr 2000 durch den britischen Koch Heston Blumenthal bekannt.',
    },
    {
      question: 'Ist Foodpairing wissenschaftlich bewiesen?',
      answer:
        'Nein, nicht als Geschmacksregel. Belegt ist: Nordamerikanische und westeuropäische Rezepte kombinieren überzufällig oft Zutaten mit gemeinsamen Aromastoffen, ostasiatische und indische Küchen eher nicht (Ahn et al. 2011; Jain et al. 2015). Dass mehr gemeinsame Stoffe besseren Geschmack vorhersagen, ist nicht gezeigt — ein Übersichtsartikel von Charles Spence (2020) nennt die Hypothese inzwischen widerlegt. Gemeinsame Aromen sind deshalb ein guter Ideengeber, kein Naturgesetz.',
    },
    {
      question: 'Warum passt Steak zu Schokolade?',
      answer: `Gebratenes Rindfleisch und Kakao teilen in unseren belegten Daten ${anzahlText(
        steakSchoko.stoffe.length,
      )}: ${aufzaehlen(steakSchoko.stoffe.map((s) => (s.note ? `${s.note} (${s.name})` : s.name)))}. Alle drei entstehen beim Rösten und Braten.`,
    },
    {
      question: 'Passen Steak und Popcorn zusammen?',
      answer: `Ja, aus mehreren Gründen. Beide teilen ${anzahlText(popcorn.stoffe.length)} — darunter 2-Acetyl-1-pyrrolin, den typischen Popcorn-Duft, der auch in gegrilltem Rind nachgewiesen ist. Dazu kommen der Texturkontrast (zart gegen knusprig) und der süß-salzige Gegenpol, wenn das Popcorn gesalzen oder karamellisiert ist. Eine Geschmacksstudie zu genau diesem Paar gibt es allerdings nicht.`,
    },
    {
      question: 'Wie nutze ich Foodpairing am Grill?',
      answer:
        'Über drei Hebel: Ähnlichkeit (Kaffee oder Kakao im Rub für Rind), Kontrast (Essiggurke oder Krautsalat zu fettem Pulled Pork) und Synergie (Parmesan oder Pilze zum Steak — Umami verstärkt sich). Das Aroma-Tuning auf der Startseite und der Aroma-Matcher zeigen dir passende Partner.',
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
    keywords: ['Foodpairing', 'Aromen kombinieren', 'Schlüssel-Aromen', 'Steak und Schokolade', 'Steak und Popcorn', 'Aroma-Rad'],
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
                harmonieren oft, auch wenn die Kombination auf den ersten Blick absurd klingt.
              </p>
              <p className="mt-3 font-body text-[1.08rem] leading-relaxed text-text-secondary">
                Ein gebratenes Steak und dunkler Kakao zum Beispiel teilen {anzahlText(steakSchoko.stoffe.length)}:{' '}
                {aufzaehlen(steakSchoko.stoffe.map((s) => s.note ?? s.name))}. Gemeinsame Aromen sind aber nur einer
                von drei Hebeln — und ein Ideengeber, kein Naturgesetz. Beides erklären wir hier.
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
              an, um zu sehen, welche Aromen es sind und welche Noten zusätzlich verwandt sind.
            </p>
            <AromaRad raeder={raeder} />
          </section>

          {/* ── So funktioniert's ── */}
          <section className="mt-14" aria-labelledby="prinzip">
            <h2 id="prinzip" className="font-serif text-2xl font-bold text-text-light sm:text-3xl">
              So funktioniert Foodpairing
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
                <h3 className="mb-2 font-serif text-lg font-bold text-text-light">1 · Wenige Moleküle prägen alles</h3>
                <p className="font-sans text-sm leading-relaxed text-text-secondary">
                  In Lebensmitteln sind rund 10.000 flüchtige Stoffe bekannt. Nur etwa 230 davon sind Schlüssel-Aromen,
                  und ein einzelnes Lebensmittel wird von 3 bis 40 geprägt (
                  <Quelle href="https://doi.org/10.1002/anie.201309508">Dunkel et al. 2014</Quelle>). Beim Essen
                  erreichen sie die Nase vor allem von hinten, über den Rachen — deshalb schmeckst du sie, statt sie
                  nur zu riechen.
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
                <h3 className="mb-2 font-serif text-lg font-bold text-text-light">2 · So findet die Forschung sie</h3>
                <p className="font-sans text-sm leading-relaxed text-text-secondary">
                  Ein Mensch riecht am Gaschromatographen, der Extrakt wird Schritt für Schritt verdünnt. Was dann noch
                  riechbar ist, zählt. Der Aromawert (Menge geteilt durch Geruchsschwelle) und Nachbau- und
                  Weglassversuche bestätigen, welche Stoffe den Duft wirklich tragen.
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
                <h3 className="mb-2 font-serif text-lg font-bold text-text-light">3 · Die Brücken-Idee</h3>
                <p className="font-sans text-sm leading-relaxed text-text-secondary">
                  Teilen zwei Zutaten Schlüssel-Aromen, riechen sie verwandt — die Idee: Sie greifen ineinander, statt
                  zu konkurrieren. Das ist plausibel und ein starker Ideengeber, als Geschmacksregel aber nicht
                  bewiesen. Probieren bleibt Pflicht.
                </p>
              </div>
            </div>
          </section>

          {/* ── Drei Hebel ── */}
          <section className="mt-14" aria-labelledby="hebel">
            <h2 id="hebel" className="font-serif text-2xl font-bold text-text-light sm:text-3xl">
              Drei Hebel für gute Paare
            </h2>
            <p className="mt-2 max-w-2xl font-body text-text-secondary">
              Die Sensorik-Forschung unterscheidet drei Wege, wie Zutaten zusammenfinden (
              <Quelle href="https://doi.org/10.1186/s13411-017-0053-0">Spence et al. 2017</Quelle>). Foodpairing im
              engeren Sinn ist nur der erste.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-brand-fire/40 bg-surface-card p-6">
                <p className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-fire">
                  <FlaskConical size={12} /> Hebel 1
                </p>
                <h3 className="mt-1 font-serif text-xl font-bold text-text-light">Ähnlichkeit</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
                  <strong className="text-text-light">Gleiche Moleküle</strong> in beiden Zutaten — oder{' '}
                  <strong className="text-text-light">verwandte Noten</strong>: verschiedene Moleküle aus derselben
                  Duftfamilie, etwa die Röstnote aus Pyrazinen im Steak und aus Pyrrolinen im Popcorn. Beispiel: Steak
                  & Kaffee.
                </p>
              </div>
              <div className="rounded-xl border border-[#5FB8B0]/50 bg-surface-card p-6">
                <p className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5FB8B0]">
                  <Scale size={12} /> Hebel 2
                </p>
                <h3 className="mt-1 font-serif text-xl font-bold text-text-light">Kontrast</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
                  Gegensätze gleichen sich aus: Säure schneidet Fett, Süße puffert Schärfe, Salz dämpft Bitterkeit,
                  knusprig trifft zart. Beispiel: Essiggurke oder Krautsalat zu fettem Pulled Pork.
                </p>
              </div>
              <div className="rounded-xl border border-brand-gold/50 bg-surface-card p-6">
                <p className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                  <Sparkles size={12} /> Hebel 3
                </p>
                <h3 className="mt-1 font-serif text-xl font-bold text-text-light">Synergie</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
                  Zwei Zutaten verstärken sich gegenseitig. Das beste Beispiel ist Umami: Glutamat (Parmesan, Tomate,
                  Pilze) und Inosinat (Fleisch) wirken zusammen deutlich stärker als allein (
                  <Quelle href="https://doi.org/10.1111/j.1365-2621.1967.tb09715.x">Yamaguchi 1967</Quelle>). Beispiel:
                  Steak mit Parmesanbutter.
                </p>
              </div>
            </div>
          </section>

          {/* ── Überraschende Paare ── */}
          <section className="mt-14" aria-labelledby="paare">
            <h2 id="paare" className="font-serif text-2xl font-bold text-text-light sm:text-3xl">
              Überraschende Paare — mit Beleg
            </h2>
            <p className="mt-2 max-w-2xl font-body text-text-secondary">
              Jede Zahl kommt aus unserer eigenen Aroma-Datenbank, jede Verbindung ist mit Fachstudien belegt. Volle
              Chips sind gleiche Moleküle, gestrichelte (≈) verwandte Noten.
            </p>
            {UEBERRASCHUNGEN.map((g) => (
              <div key={g.gruppe} className="mt-8">
                <h3 className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">{g.gruppe}</h3>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {g.paare.map((pp) => {
                    const p = paarung(pp.a, pp.b);
                    return (
                      <article key={pp.titel} className="flex flex-col rounded-xl border border-border-subtle bg-surface-card p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-serif text-xl font-bold text-text-light">{pp.titel}</h4>
                          <UrteilMarke p={p} />
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

          {/* ── Steak & Popcorn ── */}
          <section className="mt-14 rounded-2xl border border-brand-gold/40 bg-surface-card p-5 sm:p-8" aria-labelledby="popcorn">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-fire">Im Detail</p>
                <h2 id="popcorn" className="mt-1 font-serif text-2xl font-bold text-text-light sm:text-3xl">
                  Steak & Popcorn: Wenn alle drei Hebel ziehen
                </h2>
                <p className="mt-3 font-body text-text-secondary">
                  Klingt nach Kino, funktioniert am Grill. Das Paar ist ein Lehrstück, weil es mehrere Gründe auf einmal
                  hat — und weil die oft zitierte Begründung „gleiche Röstaromen“ nur zur Hälfte stimmt.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <UrteilMarke p={popcorn} />
                  <span className="font-sans text-xs text-text-muted">{anzahlText(popcorn.stoffe.length)}</span>
                </div>
                <div className="mt-3">
                  <Noten p={popcorn} />
                </div>
              </div>
              <div className="lg:col-span-5">
                <AromaBrueckeSvg
                  a="Steak"
                  subA="gegrillt"
                  b="Popcorn"
                  bruecken={popcorn.stoffe.map((s) => ({ note: s.note ?? s.name, stoff: s.name }))}
                  idSuffix="popcorn"
                  className="w-full overflow-hidden rounded-xl border border-brand-gold/30"
                  titel={`Aroma-Brücke Steak und Popcorn: ${popcorn.stoffe.map((s) => s.name).join(', ')}`}
                />
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {STEAK_POPCORN.hebel.map((h) => (
                <div key={h.titel} className="rounded-xl border border-border-subtle bg-surface-base p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-lg font-bold text-text-light">{h.titel}</h3>
                    <span className="font-sans text-[10px] uppercase tracking-wide text-text-muted">{h.quelle}</span>
                  </div>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">{h.text}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-8 font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">Zubereitungsideen</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {STEAK_POPCORN.ideen.map((i) => (
                <div key={i.titel} className="flex flex-col rounded-xl border border-border-subtle bg-surface-base p-5">
                  <h4 className="font-serif text-lg font-bold text-text-light">{i.titel}</h4>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">{i.text}</p>
                  <Link
                    href={`/?schmiede=${encodeURIComponent(i.auftrag)}#werkzeuge`}
                    className="mt-auto inline-flex items-center gap-1.5 pt-4 font-sans text-xs font-bold uppercase tracking-wide text-brand-gold hover:text-brand-fire"
                  >
                    <ChefHat size={14} /> Rezept dazu
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-5 font-sans text-xs text-text-muted">
              Chemische Verwandtschaft ist belegt (u. a.{' '}
              <Quelle href="https://doi.org/10.3390/foods10123113">Li et al. 2021</Quelle> für gegrilltes Rind,
              Schieberle 1991 für Popcorn). Eine Geschmacksstudie zu genau diesem Paar gibt es nicht — dein Gaumen
              entscheidet.
            </p>
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
                return (
                  <div
                    key={f.titel}
                    className={`grid gap-2 bg-surface-card p-5 sm:grid-cols-12 sm:gap-4 ${i ? 'border-t border-border-subtle' : ''}`}
                  >
                    <div className="sm:col-span-4">
                      <h3 className="font-serif text-lg font-bold text-text-light">{f.titel}</h3>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {f.a ? <UrteilMarke p={p} /> : !f.kontrast && <UrteilMarke p={null} />}
                        {f.kontrast?.map((k) => (
                          <Marke key={k} klasse="border-[#5FB8B0] text-[#5FB8B0]">
                            Kontrast: {k}
                          </Marke>
                        ))}
                      </div>
                    </div>
                    <div className="font-sans text-sm leading-relaxed text-text-secondary sm:col-span-8">
                      <p>{f.text}</p>
                      {p && (p.stoffe.length > 0 || p.verwandt.length > 0) && (
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

            <div className="mt-6 rounded-xl border border-brand-fire/30 bg-surface-card p-6">
              <h3 className="inline-flex items-center gap-2 font-serif text-xl font-bold text-text-light">
                <AlertTriangle size={18} className="text-brand-fire" /> Vier Mythen, die du im Netz liest
              </h3>
              <ul className="mt-3 space-y-2 font-sans text-sm leading-relaxed text-text-secondary">
                <li>
                  <strong className="text-text-light">„Foodpairing ist wissenschaftlich bewiesen.“</strong> Bewiesen
                  ist nur, dass manche Küchen solche Paare häufiger nutzen — nicht, dass sie besser schmecken.
                </li>
                <li>
                  <strong className="text-text-light">„X und Y teilen 73 Stoffe, also passen sie.“</strong> Rohe
                  Stoffzahlen ohne Konzentration und Geruchsschwelle sagen wenig. Es zählen Schlüssel-Aromen — deshalb
                  sind unsere Zahlen klein.
                </li>
                <li>
                  <strong className="text-text-light">„80 % des Geschmacks kommen aus der Nase.“</strong> Der Geruch
                  dominiert das Aroma, aber diese Prozentzahl ist nicht belegt (
                  <Quelle href="https://doi.org/10.1186/s13411-015-0040-2">Spence 2015</Quelle>).
                </li>
                <li>
                  <strong className="text-text-light">„Gleiche Röstaromen“ bei Steak & Popcorn.</strong> Teils: Die
                  Popcorn-Note ist gleich, die meisten Röstnoten im Steak stammen aber von anderen Molekülen — verwandt,
                  nicht identisch.
                </li>
              </ul>
            </div>
          </section>

          {/* ── Herkunft & Forschung ── */}
          <section className="mt-14" aria-labelledby="forschung">
            <h2 id="forschung" className="inline-flex items-center gap-2 font-serif text-2xl font-bold text-text-light sm:text-3xl">
              <History size={22} className="text-brand-gold" /> Woher die Idee kommt — und was die Forschung sagt
            </h2>
            <ol className="mt-5 space-y-4 border-l border-brand-gold/30 pl-5">
              {[
                {
                  jahr: 'um 2000',
                  text: (
                    <>
                      Heston Blumenthal (The Fat Duck) probiert Salziges im Dessert und landet bei weißer Schokolade mit
                      Kaviar. Der Aromachemiker François Benzi (Firmenich) erklärt ihm: Beide enthalten viele Amine.
                      Blumenthal veröffentlicht das 2002 (
                      <Quelle href="https://www.theguardian.com/lifeandstyle/2002/may/04/foodanddrink.shopping">
                        The Guardian
                      </Quelle>
                      ).
                    </>
                  ),
                },
                {
                  jahr: '2009',
                  text: <>In Belgien gründet sich das Unternehmen Foodpairing® und macht die Idee zum Datenwerkzeug für Profiküchen.</>,
                },
                {
                  jahr: '2010',
                  text: (
                    <>
                      Blumenthal selbst rückt ab: Dass zwei Zutaten einen Stoff teilen, sei „a slender justification for
                      compatibility“ — eine dünne Begründung (zitiert nach{' '}
                      <Quelle href="https://doi.org/10.1186/s13411-017-0053-0">Spence et al. 2017</Quelle>).
                    </>
                  ),
                },
                {
                  jahr: '2011',
                  text: (
                    <>
                      Die große Rezeptanalyse: 56.498 Rezepte. Nordamerikanische und westeuropäische Küchen kombinieren
                      bevorzugt Zutaten mit gemeinsamen Aromastoffen, ostasiatische und südeuropäische eher nicht. Der
                      Effekt hängt an wenigen Zutaten wie Milch, Butter, Kakao, Vanille, Sahne und Ei (
                      <Quelle href="https://doi.org/10.1038/srep00196">Ahn et al. 2011</Quelle>).
                    </>
                  ),
                },
                {
                  jahr: '2015',
                  text: (
                    <>
                      Indische Regionalküchen zeigen das Gegenteil: Sie kombinieren überwiegend Zutaten mit{' '}
                      <em>wenig</em> Aroma-Überlappung — getrieben von den Gewürzen (
                      <Quelle href="https://doi.org/10.1371/journal.pone.0139539">Jain et al. 2015</Quelle>).
                    </>
                  ),
                },
                {
                  jahr: '2020',
                  text: (
                    <>
                      Ein kritischer Übersichtsartikel nennt die Hypothese als Geschmacksregel widerlegt. Ähnlichkeit,
                      Kontrast, Tradition und Textur zählen zusammen (
                      <Quelle href="https://doi.org/10.1016/j.foodres.2020.109124">Spence 2020</Quelle>).
                    </>
                  ),
                },
              ].map((e) => (
                <li key={e.jahr} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-brand-gold bg-surface-base" aria-hidden />
                  <p className="font-sans text-xs font-bold uppercase tracking-wide text-brand-gold">{e.jahr}</p>
                  <p className="mt-0.5 font-sans text-sm leading-relaxed text-text-secondary">{e.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 max-w-3xl rounded-xl border border-border-subtle bg-surface-card p-5 font-sans text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-light">Unser Umgang damit:</strong> Wir nutzen gemeinsame Schlüssel-Aromen als
              Ideengeber und sagen dir offen, wie stark eine Brücke ist. Ob ein Paar auf dem Teller funktioniert,
              entscheiden am Ende Menge, Garstufe, Kontrast — und dein Gaumen.
            </p>
          </section>

          {/* ── Datenbasis ── */}
          <section className="mt-14 rounded-xl border border-brand-gold/30 bg-surface-card p-6" aria-labelledby="daten">
            <h2 id="daten" className="inline-flex items-center gap-2 font-serif text-2xl font-bold text-text-light">
              <Microscope size={20} className="text-brand-gold" /> Unsere Datenbasis
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [stat.zutaten, 'Zutaten'],
                [stat.stoffe, 'Schlüssel-Aromen'],
                [stat.kanten, 'Verbindungen'],
                [stat.studien, 'Fachstudien'],
              ].map(([zahl, label]) => (
                <div key={label} className="flex flex-col-reverse rounded-lg bg-surface-base p-3 text-center">
                  <dt className="font-sans text-[11px] text-text-muted">{label}</dt>
                  <dd className="font-serif text-2xl font-bold text-brand-gold">{zahl}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 max-w-3xl font-sans text-sm leading-relaxed text-text-secondary">
              Wir zählen nur Schlüssel-Aromen, die in Fachstudien per Verdünnungsanalyse, Aromawert oder
              Nachbau-Versuch als geruchsprägend nachgewiesen sind — jede Verbindung mit Quelle und DOI.{' '}
              <strong className="text-text-light">Verwandte Noten</strong> fassen wir eng: nur Stoffklassen, die
              ähnlich riechen (etwa Röstnoten aus Pyrazinen, Pyrrolinen und Thiazolinen). Weniger Treffer, aber jeder
              ist am Gaumen spürbar.
            </p>
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
                Das Aroma-Tuning findet Partner für jede der {stat.zutaten} Zutaten — und schmiedet dir auf Wunsch
                gleich ein Rezept daraus.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-brand-gold transition-[gap] group-hover:gap-2">
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
              <span className="mt-3 inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-brand-gold transition-[gap] group-hover:gap-2">
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
