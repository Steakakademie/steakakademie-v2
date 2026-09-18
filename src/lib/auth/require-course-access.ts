import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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
 *  3. Login + active/pending           → { user, course, booking }
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
    .maybeSingle();

  if (!booking) {
    redirect(`/${courseSlug}?locked=1`);
  }

  return {
    user:    { id: user.id, email: user.email },
    course:  { id: course.id, slug: course.slug, title: course.title },
    booking: { id: booking.id, status: booking.status as 'active' | 'pending' },
  };
}
