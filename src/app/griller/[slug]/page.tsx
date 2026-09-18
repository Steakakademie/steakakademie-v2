import type { Metadata } from 'next';
import { STUFEN } from '@/lib/diplome/stufen';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ slug: string }> }

// Taxonomie aus der einen Quelle — vorher stand hier Gold #F5C842 gegen #FFD700 anderswo.
const STAGES = STUFEN.map((s) => ({ stufe: s.nr, tier: s.tier, cert: s.metall, name: s.title, color: s.color }));

async function loadProfile(slug: string) {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, slug, display_name, is_public')
      .eq('slug', slug)
      .eq('is_public', true)
      .maybeSingle();
    if (!profile) return null;
    const { data: progress } = await supabase
      .from('course_progress')
      .select('stufe, status')
      .eq('user_id', profile.user_id);
    const done = new Set((progress ?? []).filter((p) => p.status === 'bestanden').map((p) => p.stufe));
    return { profile, done };
  } catch {
    return null;
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const data = await loadProfile(params.slug);
  if (!data) return { title: 'Grillmeister-Profil' };
  const name = data.profile.display_name ?? 'Grillmeister';
  return {
    title: `${name} — Grillmeister-Vita`,
    description: `Die Diplom-Fortschritte von ${name} an der Steakakademie.`,
    alternates: { canonical: `https://steakakademie.de/griller/${params.slug}` },
  };
}

export default async function GrillerProfilePage(props: Props) {
  const params = await props.params;
  const data = await loadProfile(params.slug);
  if (!data) notFound();
  const { profile, done } = data;
  const name = profile.display_name ?? 'Grillmeister';
  const erreicht = STAGES.filter((s) => done.has(s.stufe)).length;
  const top = [...STAGES].reverse().find((s) => done.has(s.stufe));

  return (
    <>
      <Header />
      <main className="bg-surface-base min-h-screen">
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 text-center">
            <p className="text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-fire mb-3">
              Steakakademie · Grillmeister-Vita
            </p>
            <h1 className="font-serif text-4xl lg:text-6xl font-bold text-text-light mb-4">{name}</h1>
            <p className="font-body text-text-light/60">
              {erreicht} von 5 Stufen bestanden{top ? ` · höchster Rang: ${top.cert}` : ''}
            </p>
          </div>
        </section>

        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 max-w-4xl mx-auto">
            {STAGES.map((s) => {
              const earned = done.has(s.stufe);
              return (
                <div key={s.stufe} className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28" style={{ filter: earned ? undefined : 'grayscale(1) brightness(0.5)', opacity: earned ? 1 : 0.5 }}>
                    <Image src={`/images/diplome/medal-${s.tier}.png`} alt={`${s.cert}-Medaille`} fill sizes="112px" className="object-contain" />
                  </div>
                  <p className="mt-3 text-[10px] font-sans font-bold tracking-[0.14em] uppercase" style={{ color: earned ? s.color : '#666' }}>
                    Stufe {s.stufe} · {s.cert}
                  </p>
                  <p className="font-serif text-sm font-bold" style={{ color: earned ? '#F5EDE2' : '#555' }}>{s.name}</p>
                  <p className="text-[10px] font-sans mt-0.5" style={{ color: earned ? '#7CB342' : '#555' }}>
                    {earned ? '✓ bestanden' : 'offen'}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/diplome"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-fire text-text-light font-sans font-bold tracking-[0.08em] uppercase text-sm hover:bg-brand-fire/90 transition-colors"
            >
              Eigenes Diplom starten <ChevronRight size={15} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
