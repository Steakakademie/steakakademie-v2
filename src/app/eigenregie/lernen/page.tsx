import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allEigenregieModuls } from 'contentlayer/generated';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import Diagnose from '@/components/eigenregie/Diagnose';
import { angebotFuer } from '@/lib/eigenregie/angebot';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Eigenregie — dein Kursbereich',
};

export const dynamic = 'force-dynamic';

export default async function EigenregieLernen() {
  await requireCourseAccess('eigenregie', '/eigenregie/lernen');
  const alle = allEigenregieModuls.slice().sort((a, b) => a.order - b.order);
  // Startkapitel (order 0) steht zwischen Diagnose und Modul 1; die nummerierten Module beginnen bei order 1.
  const startkapitel = alle.filter((m) => m.order === 0);
  const kursModule = alle.filter((m) => m.order > 0);
  const { preis } = angebotFuer(new Date(), null);

  return (
    <>
      <Header />
      <main className="bg-surface-base min-h-screen">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8 print:hidden" aria-label="Breadcrumb">
            <Link href="/eigenregie" className="hover:text-brand-fire">Eigenregie</Link>
            <ChevronRight size={12} />
            <span className="text-text-primary">Kursbereich</span>
          </nav>

          <header className="mb-12 pb-10 border-b-2 border-text-primary print:hidden">
            <p className="text-xs font-sans font-bold tracking-widest uppercase text-brand-fire mb-3">Dein Kursbereich</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-text-primary mb-4 leading-tight">Eigenregie</h1>
            <p className="font-body text-lg text-text-secondary max-w-content leading-relaxed">
              Erst die Diagnose, dann sechs Module. Jedes Modul endet mit einem prüfbaren Ergebnis — geh erst weiter, wenn es steht.
            </p>
          </header>

          <section className="max-w-content mb-16" aria-labelledby="modul-0">
            <p className="text-xs font-sans font-bold tracking-widest uppercase text-brand-fire mb-2 print:hidden">Modul 0</p>
            <h2 id="modul-0" className="font-serif text-2xl font-bold text-text-primary mb-3 print:hidden">Diagnose und Zielbild</h2>
            <p className="font-body text-text-secondary mb-8 print:hidden">
              Beantworte die Fragen, druck dir „Dein Weg“ aus oder speichere ihn als PDF. Er ist dein Plan für die nächsten Wochen.
            </p>
            <Diagnose kurspreis={preis} imKurs />
          </section>

          {startkapitel.length > 0 && (
            <section className="max-w-content mb-16 print:hidden" aria-labelledby="startkapitel">
              <h2 id="startkapitel" className="font-serif text-2xl font-bold text-text-primary mb-6">Startkapitel</h2>
              <ul className="grid grid-cols-1 gap-5">
                {startkapitel.map((m) => (
                  <li key={m.slug}>
                    <Link href={m.url} className="block h-full border border-border-subtle bg-surface-card p-6 hover:border-brand-gold transition-colors">
                      <p className="text-xs font-sans font-bold tracking-widest uppercase text-brand-fire mb-2">Startkapitel</p>
                      <h3 className="font-serif text-lg font-bold text-text-primary mb-2">{m.title}</h3>
                      <p className="font-body text-sm text-text-secondary mb-3">{m.excerpt}</p>
                      <p className="flex items-start gap-2 font-body text-sm text-text-primary mb-3">
                        <CheckCircle2 size={16} className="text-brand-gold shrink-0 mt-0.5" /> {m.ergebnis}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-sans text-text-muted"><Clock size={12} /> {m.dauer}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="print:hidden" aria-labelledby="module">
            <h2 id="module" className="font-serif text-2xl font-bold text-text-primary mb-6">Die sechs Module</h2>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {kursModule.map((m) => (
                <li key={m.slug}>
                  <Link href={m.url} className="block h-full border border-border-subtle bg-surface-card p-6 hover:border-brand-gold transition-colors">
                    <p className="text-xs font-sans font-bold tracking-widest uppercase text-brand-fire mb-2">Modul {m.order}</p>
                    <h3 className="font-serif text-lg font-bold text-text-primary mb-2">{m.title}</h3>
                    <p className="font-body text-sm text-text-secondary mb-3">{m.excerpt}</p>
                    <p className="flex items-start gap-2 font-body text-sm text-text-primary mb-3">
                      <CheckCircle2 size={16} className="text-brand-gold shrink-0 mt-0.5" /> {m.ergebnis}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-sans text-text-muted"><Clock size={12} /> {m.dauer}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <p className="mt-12 font-body text-xs text-text-muted max-w-content print:hidden">
            Die Modultexte sind KI-unterstützt erstellt und fachlich verantwortet von Uwe Yendell. Preis- und Tarifangaben der
            Werkzeuge: Stand 09/2026 — prüfe sie vor jeder Buchung beim Anbieter. Rechtliche Hinweise sind keine Rechtsberatung.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
