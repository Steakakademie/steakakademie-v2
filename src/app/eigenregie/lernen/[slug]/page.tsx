import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Clock, Target } from 'lucide-react';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allEigenregieModuls } from 'contentlayer/generated';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { eigenregieMdx } from '@/components/eigenregie/mdxComponents';

interface Props { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const m = allEigenregieModuls.find((x) => x.slug === slug);
  return { robots: { index: false, follow: false }, title: m ? `${m.title} | Eigenregie` : 'Eigenregie' };
}

/** Modul 0 heißt im Kurs „Startkapitel“ (die Diagnose trägt die Nummer 0 schon). */
const modulLabel = (order: number) => (order === 0 ? 'Startkapitel' : `Modul ${order}`);

function Body({ code }: { code: string }) {
  const MDX = useMDXComponent(code);
  return <MDX components={eigenregieMdx} />;
}

export default async function EigenregieModulPage(props: Props) {
  const { slug } = await props.params;
  const sorted = allEigenregieModuls.slice().sort((a, b) => a.order - b.order);
  const i = sorted.findIndex((x) => x.slug === slug);
  if (i === -1) notFound();
  await requireCourseAccess('eigenregie', `/eigenregie/lernen/${slug}`);
  const modul = sorted[i];
  const anzahlModule = sorted.filter((x) => x.order > 0).length;
  const prev = sorted[i - 1];
  const next = sorted[i + 1];

  return (
    <>
      <Header />
      <main className="bg-surface-base min-h-screen">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <article className="max-w-content mx-auto">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-6" aria-label="Breadcrumb">
              <Link href="/eigenregie/lernen" className="hover:text-brand-fire">Eigenregie</Link>
              <ChevronRight size={12} />
              <span className="text-text-primary">{modulLabel(modul.order)}</span>
            </nav>
            <p className="text-xs font-sans font-bold tracking-widest uppercase text-brand-fire mb-3">
              {modul.order === 0 ? 'Startkapitel' : `Modul ${modul.order} von ${anzahlModule}`}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary mb-4 leading-tight">{modul.title}</h1>
            <p className="font-body text-lg text-text-secondary leading-relaxed mb-4">{modul.excerpt}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-sans text-text-muted">
              <span className="inline-flex items-center gap-1"><Clock size={12} /> {modul.dauer}</span>
              <span className="inline-flex items-center gap-1"><Target size={12} /> Lernziel: {modul.lernziel}</span>
            </div>
            <hr className="border-border-subtle my-8" />
            <Body code={modul.body.code} />

            <div className="mt-10 pt-6 border-t border-border-subtle flex justify-between gap-4">
              {prev ? (
                <Link href={prev.url} className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-brand-fire"><ChevronLeft size={16} /> {modulLabel(prev.order)}</Link>
              ) : (
                <Link href="/eigenregie/lernen" className="flex items-center gap-2 text-sm font-sans text-text-secondary hover:text-brand-fire"><ChevronLeft size={16} /> Diagnose</Link>
              )}
              {next ? (
                <Link href={next.url} className="flex items-center gap-2 text-sm font-sans font-bold text-text-primary hover:text-brand-fire ml-auto text-right">{modulLabel(next.order)}: {next.title.split(':')[0]} <ChevronRight size={16} /></Link>
              ) : (
                <Link href="/eigenregie/lernen" className="flex items-center gap-2 text-sm font-sans font-bold text-text-primary hover:text-brand-fire ml-auto">Zur Übersicht <ChevronRight size={16} /></Link>
              )}
            </div>
            <p className="mt-10 font-body text-xs text-text-muted">
              KI-unterstützt erstellt, fachlich verantwortet von Uwe Yendell. Tarif- und Preisangaben: Stand 09/2026. Rechtliche Hinweise sind keine Rechtsberatung.
            </p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
