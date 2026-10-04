'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, ExternalLink, Copy, Check, Linkedin, LogOut, Map, GraduationCap, Award } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import MeineEinreichungen from './MeineEinreichungen';
import KontoLoeschen from './KontoLoeschen';
import MeineMedaillen from './MeineMedaillen';

type State = 'loading' | 'anon' | 'ready' | 'saving';

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
}

export default function ProfilClient() {
  const [state, setState] = useState<State>('loading');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://steakakademie.de';
  const profileUrl = `${origin}/griller/${slug}`;
  const signatureHtml =
    `<a href="${profileUrl}" style="font-family:sans-serif;font-size:13px;color:#C8882A;text-decoration:none">` +
    `🔥 Grillmeister-Ausbildung @ Steakakademie</a>`;
  const linkedinUrl =
    'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME' +
    '&name=' + encodeURIComponent('Grillmeister-Ausbildung') +
    '&organizationName=' + encodeURIComponent('Steakakademie') +
    '&certUrl=' + encodeURIComponent(profileUrl);

  function copySignature() {
    try {
      void navigator.clipboard.writeText(signatureHtml);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setState('anon'); return; }
    const { data } = await supabase.from('profiles')
      .select('slug, display_name, is_public').eq('user_id', user.id).maybeSingle();
    if (data) {
      setName(data.display_name ?? '');
      setSlug(data.slug ?? '');
      setIsPublic(!!data.is_public);
    }
    setState('ready');
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    setMsg(null);
    setState('saving');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setState('anon'); return; }
    const finalSlug = slug.trim() || slugify(name);
    const { error } = await supabase.from('profiles').upsert(
      { user_id: user.id, slug: finalSlug || null, display_name: name.trim() || null, is_public: isPublic, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    if (error) {
      setMsg({ text: error.code === '23505' ? 'Dieser Profil-Name (Slug) ist schon vergeben.' : 'Speichern fehlgeschlagen.', ok: false });
    } else {
      setSlug(finalSlug);
      setMsg({ text: 'Gespeichert.', ok: true });
    }
    setState('ready');
  }

  return (
    <>
      <Header />
      <main className="bg-surface-base min-h-screen">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between gap-3 mb-6">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted">
              <Link href="/diplome" className="hover:text-brand-gold transition-colors">Diplom-System</Link>
              <ChevronRight size={12} /><span>Mein Profil</span>
            </nav>
            {(state === 'ready' || state === 'saving') && (
              <form action="/auth/logout" method="post">
                <button type="submit"
                  className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-text-muted hover:text-brand-fire transition-colors">
                  <LogOut size={13} /> Abmelden
                </button>
              </form>
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">Deine Grillmeister-Vita</h1>
          <p className="font-body text-text-secondary mb-8">
            Mach deine bestandenen Stufen öffentlich teilbar — eine eigene Profil-Seite mit deinen Medaillen.
          </p>

          {state === 'loading' && <p className="text-text-muted text-sm">Lädt…</p>}

          {state === 'anon' && (
            <div className="border border-border-subtle bg-surface-elevated p-6">
              <p className="font-body text-text-secondary mb-4">Melde dich an, um dein Profil zu verwalten und deinen Fortschritt zu speichern.</p>
              <Link href="/auth/login" className="inline-flex items-center gap-2 px-5 py-3 bg-brand-fire text-ink font-sans font-bold uppercase text-sm tracking-[0.08em]">
                Anmelden <ChevronRight size={15} />
              </Link>
            </div>
          )}

          {(state === 'ready' || state === 'saving') && (
            <div className="space-y-5 border border-border-subtle bg-surface-elevated p-6">
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wide text-text-muted mb-1.5">Anzeigename</label>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
                  placeholder="z. B. Max Mustermann"
                  className="w-full px-4 py-2.5 bg-surface-base border border-border-subtle text-text-primary font-sans text-sm focus:border-brand-gold/50" />
              </div>
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wide text-text-muted mb-1.5">Profil-Adresse</label>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm font-sans">/griller/</span>
                  <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} maxLength={40}
                    placeholder={slugify(name) || 'dein-name'}
                    className="flex-1 px-4 py-2.5 bg-surface-base border border-border-subtle text-text-primary font-sans text-sm focus:border-brand-gold/50" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4 accent-brand-gold" />
                <span className="font-body text-sm text-text-secondary">Profil öffentlich sichtbar machen</span>
              </label>

              {msg && <p className={`text-sm font-sans ${msg.ok ? 'text-green-600' : 'text-brand-fire'}`}>{msg.text}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button onClick={() => void save()} disabled={state === 'saving'}
                  className="px-6 py-3 bg-brand-gold text-ink font-sans font-bold uppercase text-sm tracking-[0.08em] disabled:opacity-50">
                  {state === 'saving' ? 'Speichert…' : 'Speichern'}
                </button>
                {isPublic && slug && (
                  <a href={`/griller/${slug}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-sans text-brand-gold underline underline-offset-2 hover:no-underline">
                    Profil ansehen <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          )}

          {state === 'ready' && (
            <div className="mt-6 border border-border-subtle bg-surface-elevated p-6">
              <h2 className="font-serif text-lg font-bold text-text-primary mb-1">Wie geht&apos;s weiter?</h2>
              <p className="font-body text-sm text-text-secondary mb-5">
                Dein Profil ist eingerichtet. Jetzt fängt die eigentliche Ausbildung an:
              </p>
              <div className="space-y-3">
                {[
                  { href: '/diplome/roadmap', Icon: Map, title: 'Lernpfad starten', desc: 'Deine Grillmeister-Ausbildung — Stufe 1 „Glut-Lehrling". Fortschritt wird gespeichert.', primary: true },
                  { href: '/meine-kurse', Icon: GraduationCap, title: 'Meine Kurse', desc: 'Alle freigeschalteten Tools & Kurse auf einen Blick.' },
                  { href: '/diplome', Icon: Award, title: 'Diplom-Übersicht', desc: 'Alle 5 Stufen — Bronze bis Meister — im Überblick.' },
                ].map(({ href, Icon, title, desc, primary }) => (
                  <Link key={href} href={href}
                    className="group flex items-center gap-4 p-4 border transition-colors"
                    style={{
                      borderColor: primary ? 'rgba(200,136,42,0.45)' : 'rgba(200,136,42,0.14)',
                      background: primary ? 'rgba(200,136,42,0.08)' : 'transparent',
                    }}>
                    <Icon size={20} className={primary ? 'text-brand-gold shrink-0' : 'text-text-muted shrink-0'} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-sans text-sm font-bold ${primary ? 'text-brand-gold' : 'text-text-primary'}`}>{title}</p>
                      <p className="font-body text-xs text-text-secondary leading-snug">{desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-text-muted group-hover:text-brand-fire transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Die Seite versprach „eine eigene Profil-Seite mit deinen Medaillen" und zeigte keine (Audit). */}
          {state === 'ready' && <MeineMedaillen />}

          {state === 'ready' && <MeineEinreichungen />}

          {state === 'ready' && isPublic && slug && (
            <div className="mt-6 space-y-5 border border-border-subtle bg-surface-elevated p-6">
              <h2 className="font-serif text-lg font-bold text-text-primary">Zeigen & verlinken</h2>

              {/* B2 — E-Mail-Signatur */}
              <div>
                <p className="text-xs font-sans font-bold uppercase tracking-wide text-text-muted mb-1.5">E-Mail-Signatur</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-surface-base border border-border-subtle text-text-secondary text-xs font-mono overflow-x-auto whitespace-nowrap">
                    🔥 Grillmeister-Ausbildung @ Steakakademie
                  </code>
                  <button onClick={copySignature}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-brand-gold/40 text-brand-gold font-sans text-xs font-bold uppercase hover:bg-brand-gold/10 transition-colors">
                    {copied ? <><Check size={13} /> Kopiert</> : <><Copy size={13} /> Kopieren</>}
                  </button>
                </div>
                <p className="text-[11px] font-sans text-text-muted mt-1.5">Verlinkt auf deine öffentliche Vita.</p>
              </div>

              {/* B3 — LinkedIn */}
              <div>
                <p className="text-xs font-sans font-bold uppercase tracking-wide text-text-muted mb-1.5">LinkedIn</p>
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A66C2] text-white font-sans font-bold text-sm hover:bg-[#0a5cad] transition-colors">
                  <Linkedin size={16} /> Zertifikat zum Profil hinzufügen
                </a>
              </div>
            </div>
          )}

          {state === 'ready' && <KontoLoeschen />}
        </div>
      </main>
      <Footer />
    </>
  );
}
