import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChefHat, Clock, Users, Award, Sparkles } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Community-Rezepte von Mitgliedern',
  description:
    'Rezepte aus der Steakakademie-Community: von Mitgliedern eingereicht, KI-geprüft, freigegeben. Echte Pitmaster-Kreationen zum Nachgrillen.',
  alternates: { canonical: 'https://steakakademie.de/rezepte/community' },
};

type Card = {
  slug: string;
  title: string;
  description: string;
  portions: string | null;
  prep_time: string | null;
  image_url: string | null;
  author_name: string;
  quality_score: number | null;
};

const PITMASTER_SEAL = 85;

export default async function CommunityIndexPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_recipes')
    .select('slug, title, description, portions, prep_time, image_url, author_name, quality_score')
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(60);
  const recipes = (data as Card[] | null) ?? [];

  return (
    <>
      <Header />
      <main className="bg-surface-base min-h-screen">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-6" aria-label="Breadcrumb">
            <Link href="/rezepte" className="hover:text-brand-gold transition-colors">Rezepte</Link>
            <ChevronRight size={12} />
            <span className="text-text-primary">Community</span>
          </nav>

          <div className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
            <ChefHat size={12} /> Aus der Community
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary mb-3 leading-tight">
            Community-Rezepte
          </h1>
          <p className="font-body text-lg text-text-secondary max-w-2xl leading-relaxed mb-10">
            Von Mitgliedern der Akademie eingereicht, KI-geprüft, freigegeben. Echte Kreationen
            zum Nachgrillen — kein Redaktions-Content, sondern gelebte Praxis.
          </p>

          {recipes.length === 0 ? (
            <div className="border border-border-subtle bg-surface-elevated p-8 text-center">
              <ChefHat size={28} className="text-brand-gold mx-auto mb-4" />
              <p className="font-serif text-xl font-bold text-text-primary mb-2">Noch keine Community-Rezepte.</p>
              <p className="font-body text-sm text-text-secondary mb-5">
                Sei der Erste — reiche dein bestes Rezept ein. Gute Rezepte gehen nach KI-Prüfung sofort live.
              </p>
              <Link href="/rezepte" className="inline-flex items-center gap-2 px-5 py-3 bg-brand-gold text-ink font-sans font-bold uppercase text-sm tracking-[0.08em]">
                Zu den Rezepten <ChevronRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((r) => (
                <Link key={r.slug} href={`/rezepte/community/${r.slug}`}
                  className="group block border border-border-subtle bg-surface-elevated hover:border-brand-gold/40 transition-colors overflow-hidden">
                  <div className="relative aspect-[16/10] bg-surface-dark">
                    {r.image_url ? (
                      <>
                        <Image src={r.image_url} alt={`${r.title} — KI-generiertes Symbolbild`} fill sizes="(max-width: 768px) 100vw, 360px" className="object-cover" unoptimized />
                        {/* KI-Kennzeichnung (EU-AI-Act Art. 50 / § 5 UWG) */}
                        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[9px] font-sans font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 bg-black/65 backdrop-blur-sm border border-white/15 text-zinc-200">
                          <Sparkles size={9} /> KI-Symbolbild
                        </span>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ChefHat size={32} className="text-brand-gold/30" />
                      </div>
                    )}
                    {/* Autor-Badge — an derselben Stelle, an der bei Redaktions-Rezepten das Land steht */}
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-sans font-bold tracking-[0.1em] uppercase px-2 py-1 bg-surface-dark/90 backdrop-blur-sm border border-border-subtle text-brand-gold">
                      <ChefHat size={10} /> {r.author_name}
                    </span>
                    {(r.quality_score ?? 0) >= PITMASTER_SEAL && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-sans font-bold tracking-[0.1em] uppercase px-2 py-1 backdrop-blur-sm border"
                        style={{ background: 'rgba(200,136,42,0.9)', color: '#1a1206', borderColor: 'rgba(255,255,255,0.25)' }}>
                        <Award size={10} /> Pitmaster
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-serif text-lg font-bold text-text-primary group-hover:text-brand-gold transition-colors mb-2 leading-snug">
                      {r.title}
                    </h2>
                    <p className="font-body text-sm text-text-secondary leading-relaxed mb-3 line-clamp-2">{r.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-sans text-text-muted">
                      <span>von {r.author_name}</span>
                      {r.portions && <span className="flex items-center gap-1"><Users size={11} /> {r.portions}</span>}
                      {r.prep_time && <span className="flex items-center gap-1"><Clock size={11} /> {r.prep_time}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
