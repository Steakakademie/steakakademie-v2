import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { pruefeGeraet, geraeteZiel } from '@/lib/auth/geraete-limit';

export type CourseAccess = {
  user:    { id: string; email: string };
  course:  { id: string; slug: string; title: string };
  booking: { id: string; status: 'active' | 'pending' };
};

/**
 * Server-Side Gate für geschützte Kurs-Tools.
 *
 *  1. Kein Login                       → /auth/login?redirectTo=<this>
 *  2. Login, keine aktive Booking      → /<slug>?locked=1
 *  3. Login + active/pending, aber drittes Gerät → /auth/geraete (17.10.2026)
 *  4. Login + active/pending           → { user, course, booking }
 *
 * RLS (Migrations 006/008) übernimmt die Sicherheitsfilterung — diese
 * Funktion stellt nur die Redirects + Typsicherheit für die Server Components.
 */
export async function requireCourseAccess(
  courseSlug: string,
  routePath:  string,
): Promise<CourseAccess> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(routePath)}`);
  }

  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', courseSlug)
    .maybeSingle();

  if (!course) {
    redirect(`/${courseSlug}?locked=1`);
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('course_id', course.id)
    // 20.09.2026: Widerruf (Rückgabe/Chargeback) setzt revoked_at; eine der beiden
    // SELECT-Policies prüfte das nicht → Zugang blieb nach Rückgabe. Hier explizit.
    .is('revoked_at', null)
    .in('status', ['active', 'confirmed', 'pending'])
    .maybeSingle();

  if (!booking) {
    redirect(`/${courseSlug}?locked=1`);
  }

  // Ein Kauf = eine Person: nur die zwei zuletzt angemeldeten Geräte (src/lib/auth/geraete-limit.ts).
  const geraet = await pruefeGeraet(supabase, user.id);
  if (!geraet.zugelassen) {
    redirect(geraeteZiel(routePath));
  }

  return {
    user:    { id: user.id, email: user.email },
    course:  { id: course.id, slug: course.slug, title: course.title },
    booking: { id: booking.id, status: booking.status as 'active' | 'pending' },
  };
}
