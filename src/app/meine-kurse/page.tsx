import type { Metadata }  from 'next';
import { redirect }        from 'next/navigation';
import Link                from 'next/link';
import Header              from '@/components/layout/Header';
import Footer              from '@/components/layout/Footer';
import { createClient }    from '@/lib/supabase/server';
import { ChevronRight, BookOpen, Lock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title:       'Meine Kurse',
  description: 'Deine gebuchten Kurse und Diplom-Fortschritt auf Steakakademie.de.',
  robots: { index: false, follow: false },
};

interface Booking {
  id:        string;
  status:    string;
  created_at: string;
  courses: {
    id:          string;
    title:       string;
    description: string | null;
    slug:        string;
    price:       number;
  };
}

const G_BORDER = { borderColor: 'rgba(200,136,42,0.22)' } as const;
const G_BG     = { background: 'linear-gradient(135deg, rgba(200,136,42,0.08) 0%, rgba(232,80,24,0.02) 100%)' } as const;

// Kurs-Slug → reale Route (es gibt keine /kurse/[slug]-Route; jeder Kurs hat eine Top-Level-Seite)
const COURSE_ROUTES: Record<string, string> = {
  'steak-beichte': '/steak-beichte',
  'mein-protokoll': '/mein-protokoll',
  'bbq-grundkurs': '/bbq-grundkurs',
  'gruender-schmiede': '/gruender-schmiede',
  'gruendung-sprint': '/gruender-schmiede', // Legacy-Slug (Migration 006)
  'steuer-matrix': '/steuer-matrix',
  'eigenregie': '/eigenregie',
  // Legacy-Slug: Kaeufe vor der Umbenennung (07.09.2026) koennen den alten
  // Wert noch tragen, falls die Migration nicht gelaufen ist.
  'agentur-killer-sprint': '/eigenregie',
};

/** Route zu einem Kurs; Fallback: Konvention Top-Level-Route = Slug. */
function courseHref(slug: string): string {
  return COURSE_ROUTES[slug] ?? `/${slug}`;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  confirmed:  { label: 'Aktiv',         color: '#4ade80' },
  pending:    { label: 'Ausstehend',    color: '#C8882A' },
  cancelled:  { label: 'Storniert',     color: '#7A6558' },
  refunded:   { label: 'Erstattet',     color: '#7A6558' },
};

export default async function MeineKursePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirectTo=/meine-kurse');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, created_at, courses(id, title, description, slug, price)')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false });

  const confirmed = (bookings ?? []) as unknown as Booking[];

  return (
    <>
      <Header />

      <main>
        {/* Breadcrumb */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
            <ChevronRight size={11} />
            <span className="text-text-secondary">Meine Kurse</span>
          </nav>
        </div>

        {/* Hero */}
        <div
          className="mt-6 mb-10"
          style={{
            background:   'linear-gradient(180deg, rgba(200,136,42,0.07) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(200,136,42,0.12)',
          }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="font-sans text-[11px] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full"
                style={{ background: 'rgba(200,136,42,0.14)', color: '#C8882A', border: '1px solid rgba(200,136,42,0.3)' }}
              >
                Mitgliederbereich
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-light leading-tight mb-2">
              Meine Kurse
            </h1>
            <p className="font-body text-base text-text-secondary">
              {user.email}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-8">

          {confirmed.length === 0 ? (

            /* ── Leerer Zustand ── */
            <div
              className="border rounded-sm p-10 text-center space-y-4"
              style={{ ...G_BORDER, background: '#1E1410' }}
            >
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-2"
                style={{ background: 'rgba(200,136,42,0.12)', border: '1px solid rgba(200,136,42,0.25)' }}
              >
                <BookOpen size={24} className="text-brand-gold" />
              </div>
              <h2 className="font-serif text-xl font-bold text-text-light">
                Noch keine Kurse gebucht
              </h2>
              <p className="font-body text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
                Dein erster Kurs ist einen Klick entfernt. Starte mit den
                BBQ-Grundlagen oder hol dir direkt dein Diplom Bronze.
              </p>
              <Link
                href="/diplome"
                className="inline-flex items-center gap-2 px-6 py-3 font-sans font-bold text-sm text-white rounded-sm transition-opacity hover:opacity-90 mt-2"
                style={{ background: '#E85018' }}
              >
                Zum Diplom-System
                <ArrowRight size={14} />
              </Link>
            </div>

          ) : (

            /* ── Gebuchte Kurse ── */
            <div className="border rounded-sm overflow-hidden" style={G_BORDER}>
              <div
                className="px-5 py-3.5 border-b flex items-center gap-2"
                style={{ borderColor: 'rgba(200,136,42,0.18)', ...G_BG }}
              >
                <BookOpen size={16} className="text-brand-gold shrink-0" />
                <h2 className="font-serif text-base font-bold text-text-light">
                  Aktive Kurse ({confirmed.length})
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(58,42,30,0.8)', background: '#1E1410' }}>
                {confirmed.map(booking => {
                  const s = STATUS_LABEL[booking.status] ?? STATUS_LABEL['pending'];
                  return (
                    <div key={booking.id} className="px-5 py-5 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-serif font-bold text-text-light text-base">
                            {booking.courses.title}
                          </span>
                          <span
                            className="font-sans text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}40` }}
                          >
                            {s.label}
                          </span>
                        </div>
                        {booking.courses.description && (
                          <p className="font-body text-sm text-text-secondary leading-relaxed">
                            {booking.courses.description}
                          </p>
                        )}
                        <p className="font-sans text-xs text-text-muted mt-2">
                          Gebucht: {new Date(booking.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <Link
                        href={courseHref(booking.courses.slug)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 font-sans font-bold text-xs rounded-sm transition-opacity hover:opacity-90"
                        style={{ background: 'rgba(200,136,42,0.15)', color: '#C8882A', border: '1px solid rgba(200,136,42,0.3)' }}
                      >
                        Zum Kurs
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

          )}

          {/* Logout */}
          <div className="flex justify-end">
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="font-sans text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1.5"
              >
                <Lock size={11} />
                Abmelden
              </button>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
