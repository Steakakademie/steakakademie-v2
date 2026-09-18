import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { allDiplomLektions } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { breadcrumbSchema } from '@/lib/schema';
import { ChevronRight, ChevronLeft, ArrowRight, BookOpen, Lightbulb, Lock } from 'lucide-react';
import { Schnelluebersicht, Achtung, ProTipp, TempBox, Leitfrage, Handgriff } from '@/components/mdx/Callouts';
import KontextRail from '@/components/diplome/KontextRail';
import LektionFortschritt from '@/components/diplome/LektionFortschritt';
import LektionsCheck from '@/components/diplome/LektionsCheck';
import Glutbett from '@/components/diplome/Glutbett';
import { STUFEN, stufeByNr } from '@/lib/diplome/stufen';
import { diplomZugang, istBezahlstufe } from '@/lib/diplome/zugang';
import { urkundePreisMitVersand } from '@/lib/urkunde/preis';
import { ogImages } from '@/lib/og';

type Params = { stufe: string; lektion: string };
interface Props {
  params: Promise<Params>;
}

function lessonFrom(params: Params) {
  const stufeNum = Number(params.stufe.replace('stufe-', ''));
  return allDiplomLektions.find(
    (l) => l.stufe === stufeNum && l.lektionSlug === params.lektion,
  );
}

export function generateStaticParams() {
  return allDiplomLektions.map((l) => ({
    stufe: `stufe-${l.stufe}`,
    lektion: l.lektionSlug,
  }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const l = lessonFrom(params);
  if (!l) return {};
  const title = l.seoTitle ?? l.title;
  const description = l.seoDescription ?? l.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `https://steakakademie.de${l.url}` },
    openGraph: {
      images: ogImages(l.title),
      title,
      description,
      url: `https://steakakademie.de${l.url}`,
      type: 'article',
    },
  };
}

const mdxComponents = {
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary mt-10 mb-4 leading-tight border-b border-border-subtle pb-3" {...p} />
  ),
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-serif text-xl font-bold text-text-primary mt-8 mb-3" {...p} />
  ),
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="font-body text-[1.0625rem] leading-[1.8] text-text-primary mb-5" {...p} />
  ),
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem]" {...p} />
  ),
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem]" {...p} />
  ),
  strong: (p: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-text-primary" {...p} />
  ),
  blockquote: (p: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-brand-gold pl-5 my-6 font-body text-lg italic text-text-secondary" {...p} />
  ),
  hr: () => <hr className="border-border-subtle my-10" />,
  Schnelluebersicht, Achtung, ProTipp, TempBox, Leitfrage, Handgriff,
};

/**
 * Aeussere, asynchrone Huelle: entscheidet den Zugang. Die eigentliche Seite
 * (LektionSeite) bleibt synchron, weil useMDXComponent ein Hook ist und Hooks
 * in async-Komponenten nicht erlaubt sind.
 */
export default async function DiplomLektionPage(props: Props) {
  const params = await props.params;
  const lektion = lessonFrom(params);
  if (!lektion) notFound();

  // ── BEZAHLPRODUKT-SCHUTZ (26.08.2026, docs/konzept-diplom-stufe-2-5.md) ──
  // Stufe 1 (Bronze) ist der kostenlose Trichter. Stufe 2-5 sind das
  // kostenpflichtige Grillmeister-Diplom (99 EUR Gruendungspreis / 149 EUR).
  // Oeffentlich bleibt ein Anreisser (Excerpt); der Volltext oeffnet sich mit
  // Kauf-Berechtigung: Admin-Cookie ODER aktive Buchung des Diplom-Kurses
  // (src/lib/diplome/zugang.ts — seit dem Audit vom 06.09.2026 angeschlossen,
  // vorher sah ausschliesslich der Admin-Cookie die Volltexte, ein zahlender
  // Kunde nichts).
  //
  // diplomZugang() NUR fuer Bezahlstufen aufrufen: cookies()/auth machen die
  // Seite dynamisch. Die sieben KOSTENLOSEN Stufe-1-Lektionen muessen statisch
  // bleiben — sonst fallen sie aus dem Manifest, aus dem next-sitemap seine
  // URLs liest (ist schon einmal passiert).
  const isPaidTier = istBezahlstufe(lektion.stufe);
  const locked = isPaidTier ? !(await diplomZugang()).zugang : false;

  return <LektionSeite lektion={lektion} locked={locked} />;
}

function LektionSeite({ lektion, locked }: { lektion: (typeof allDiplomLektions)[number]; locked: boolean }) {
  const stufe = stufeByNr(lektion.stufe) ?? STUFEN[0];
  const meta = { cert: stufe.metall, title: stufe.title, color: stufe.color };
  const MDXContent = useMDXComponent(lektion.body.code);

  // Geschwister-Lektionen derselben Stufe, nach order sortiert
  const siblings = allDiplomLektions
    .filter((l) => l.stufe === lektion.stufe)
    .sort((a, b) => a.order - b.order);
  const idx = siblings.findIndex((l) => l.lektionSlug === lektion.lektionSlug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lektion.title,
    description: lektion.excerpt,
    educationalLevel: `Stufe ${lektion.stufe} — ${meta.cert}`,
    learningResourceType: 'Lesson',
    datePublished: lektion.publishedAt,
    inLanguage: 'de',
    isPartOf: { '@id': 'https://steakakademie.de/diplome#course' },
  };

  const breadcrumb = breadcrumbSchema([
    { name: 'Diplom-System', url: '/diplome' },
    { name: 'Roadmap', url: '/diplome/roadmap' },
    { name: lektion.title, url: `/diplome/lernen/stufe-${lektion.stufe}/${lektion.lektionSlug}` },
  ]);

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <main className="bg-surface-base">
        {/* Header-Band */}
        <section className="bg-surface-dark border-b" style={{ borderColor: `${meta.color}30` }}>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/diplome" className="hover:text-brand-gold transition-colors">Diplom-System</Link>
              <ChevronRight size={12} />
              <Link href="/diplome/roadmap" className="hover:text-brand-gold transition-colors">Roadmap</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">{lektion.title}</span>
            </nav>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-full"
                style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}50` }}
              >
                Stufe {lektion.stufe} · {meta.cert}
              </span>
              <span className="text-[10px] font-sans text-text-light/40 uppercase tracking-wider">
                Lektion {lektion.order} · Level {lektion.level}
              </span>
            </div>
            <h1 className="font-serif text-3xl lg:text-5xl font-bold text-text-light leading-tight mb-4 max-w-3xl">
              {lektion.title}
            </h1>
            <p className="font-body text-lg text-text-light/60 leading-relaxed max-w-2xl">
              {lektion.excerpt}
            </p>

            {/* Glutbett — je bestandenem Lektions-Check glueht eine Kohle mehr.
                Steht im Kopfband statt in der Seitenspalte, damit man den
                eigenen Stand sieht, bevor man liest, und nicht erst danach.
                Nur bei freien Stufen: Hinter der Bezahlschranke saehe man ein
                dunkles Bett ohne Weg, es zu fuellen. */}
            {!locked && (
              <div className="mt-7">
                <Glutbett slugs={siblings.map((l) => l.lektionSlug)} color={meta.color} />
              </div>
            )}
          </div>
        </section>

        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
            <article className="max-w-content">
              {locked ? (
                <div>
                  {/* Anreisser — oeffentlich sichtbarer Teil der Bezahl-Lektion */}
                  <p className="font-body text-[1.0625rem] leading-[1.8] text-text-primary mb-8">
                    {lektion.excerpt}
                  </p>
                  <div className="border p-7 sm:p-9 text-center" style={{ borderColor: `${meta.color}50`, background: `${meta.color}0D` }}>
                    <span
                      className="inline-flex w-12 h-12 items-center justify-center rounded-full mb-4"
                      style={{ background: `${meta.color}20`, color: meta.color }}
                    >
                      <Lock size={20} />
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-text-light mb-2">
                      Teil der Grillmeister-Ausbildung
                    </h2>
                    <p className="font-body text-text-secondary leading-relaxed max-w-md mx-auto mb-3">
                      Diese Lektion gehört zu Stufe {lektion.stufe} ({meta.cert}) des
                      kostenpflichtigen Grillmeister-Diploms. Stufe 1 mit sieben
                      vollständigen Lektionen ist frei zugänglich.
                    </p>
                    <p className="font-sans text-xs text-text-muted mb-3">
                      Verkaufsstart 01.10.2026 — Gründungs-Preis 99&nbsp;€ für die ersten 100,
                      danach 149&nbsp;€.
                    </p>
                    <p className="font-sans text-xs text-text-muted mb-6">
                      Nach bestandener Prüfung optional dazu bestellbar: die{' '}
                      <Link href="/diplome/urkunde" className="underline decoration-dotted hover:opacity-80" style={{ color: meta.color }}>
                        gedruckte Urkunde
                      </Link>{' '}
                      auf Papier für {urkundePreisMitVersand()}.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <Link
                        href="/diplome"
                        className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-xs uppercase tracking-widest text-white bg-brand-fire hover:opacity-90 transition-opacity"
                      >
                        Zur Ausbildung <ArrowRight size={14} />
                      </Link>
                      <Link
                        href="/diplome/lernen/stufe-1/grillarten"
                        className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-xs uppercase tracking-widest border border-brand-gold/40 text-text-light hover:bg-brand-gold hover:text-ink transition-colors"
                      >
                        Stufe 1 kostenlos lernen
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <MDXContent components={mdxComponents} />
              )}

              {!locked && (<>
              {/* Merksatz */}
              <div
                className="mt-10 p-6 rounded-r-sm border-l-[3px]"
                style={{ borderLeftColor: meta.color, background: `${meta.color}10` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={15} style={{ color: meta.color }} />
                  <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: meta.color }}>
                    Merksatz
                  </span>
                </div>
                <p className="font-serif text-lg italic text-text-primary leading-relaxed">
                  „{lektion.merksatz}&quot;
                </p>
              </div>

              {/* Verstaendnis-Check (09.09.2026). Steht bewusst VOR dem
                  Abhaken-Knopf: erst pruefen, ob es sitzt, dann abhaken. Der
                  Check traegt auch den Weiter-Weg — deshalb bekommt der Knopf
                  darunter kein naechsteUrl mehr, sonst staenden zwei
                  konkurrierende „Weiter" nebeneinander. Wer den Check
                  ueberspringt, nutzt die Prev/Next-Karten am Seitenende. */}
              <LektionsCheck
                lektionSlug={lektion.lektionSlug}
                color={meta.color}
                naechsteUrl={next?.url ?? null}
                naechsterTitel={next?.title ?? null}
              />

              {/* Lektion abhaken — schreibt lesson_progress (Konto) bzw. localStorage */}
              <div className="mt-6">
                <LektionFortschritt
                  stufe={lektion.stufe}
                  lektionSlug={lektion.lektionSlug}
                  alleSlugs={siblings.map((l) => l.lektionSlug)}
                  color={meta.color}
                  variant="knopf"
                  naechsteUrl={null}
                />
              </div>
              </>)}

              {/* Prev / Next */}
              <div className="mt-10 flex items-stretch justify-between gap-4">
                {prev ? (
                  <Link href={prev.url} className="group flex-1 border border-border-subtle hover:border-brand-gold/40 p-4 transition-colors">
                    <span className="flex items-center gap-1 text-[10px] font-sans uppercase tracking-wider text-text-muted mb-1">
                      <ChevronLeft size={12} /> Vorherige
                    </span>
                    <span className="font-serif text-sm font-bold text-text-primary group-hover:text-brand-fire transition-colors">{prev.title}</span>
                  </Link>
                ) : <div className="flex-1" />}
                {next ? (
                  <Link href={next.url} className="group flex-1 border border-border-subtle hover:border-brand-gold/40 p-4 text-right transition-colors">
                    <span className="flex items-center justify-end gap-1 text-[10px] font-sans uppercase tracking-wider text-text-muted mb-1">
                      Nächste <ChevronRight size={12} />
                    </span>
                    <span className="font-serif text-sm font-bold text-text-primary group-hover:text-brand-fire transition-colors">{next.title}</span>
                  </Link>
                ) : <div className="flex-1" />}
              </div>
            </article>

            {/* Sidebar: alle Lektionen der Stufe */}
            <aside>
              <div className="bg-surface-elevated border border-border-subtle p-5 sticky top-24">
                <div className="border-t-2 -mt-5 mb-4 pt-4" style={{ borderColor: meta.color }}>
                  <h2 className="font-sans font-bold text-sm text-text-primary flex items-center gap-2">
                    <BookOpen size={14} style={{ color: meta.color }} /> Stufe {lektion.stufe} · {meta.title}
                  </h2>
                </div>
                <div className="mb-4">
                  {/* Echter Lesestand (lokal + Konto), nicht mehr nur die Position in der Liste */}
                  <LektionFortschritt
                    stufe={lektion.stufe}
                    lektionSlug={lektion.lektionSlug}
                    alleSlugs={siblings.map((l) => l.lektionSlug)}
                    color={meta.color}
                    variant="leiste"
                    gesperrt={locked}
                  />
                </div>
                <ol className="space-y-1">
                  {siblings.map((l) => {
                    const active = l.lektionSlug === lektion.lektionSlug;
                    return (
                      <li key={l.lektionSlug}>
                        <Link
                          href={l.url}
                          className="flex items-start gap-2 text-sm font-sans py-1.5 transition-colors"
                          style={{ color: active ? meta.color : undefined }}
                        >
                          <span className="text-xs font-bold mt-0.5 w-4 shrink-0" style={{ color: meta.color }}>{l.order}</span>
                          <span className={active ? 'font-bold' : 'text-text-secondary hover:text-text-primary'}>{l.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
                <Link
                  href="/diplome/roadmap"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider hover:opacity-80 transition-opacity"
                  style={{ color: meta.color }}
                >
                  Zur Prüfung <ArrowRight size={13} />
                </Link>
              </div>

              <KontextRail text={`${lektion.title} ${lektion.lektionSlug}`} color={meta.color} />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
