import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { istAdminPasswort } from '@/lib/admin-auth';
import { DIPLOM_COURSE_SLUG, ERSTE_BEZAHLSTUFE } from './stufen';

export type DiplomZugang = {
  /** Eingeloggter Nutzer, sonst null */
  userId: string | null;
  /** Admin-Cookie (Uwe) */
  admin: boolean;
  /** Darf Stufe 2–5 sehen: Admin ODER aktive Buchung des Diplom-Kurses */
  zugang: boolean;
};

/**
 * Entscheidet serverseitig, ob jemand die Bezahlstufen des Diploms sehen darf.
 *
 * Der Weg Kauf → Zugang war bis zum Audit vom 06.09.2026 nicht angeschlossen:
 * Der Digistore-Webhook schreibt Buchungen (grant_course_access), aber der
 * Lektions-Gate prueft nur den Admin-Cookie — ein zahlender Kunde haette
 * nichts gesehen. Jetzt zaehlt eine aktive Buchung auf DIPLOM_COURSE_SLUG.
 *
 * Achtung fuer Aufrufer: cookies()/auth.getUser() machen die Route dynamisch.
 * Fuer Stufe 1 (frei, statisch vorgerendert) NICHT aufrufen — siehe
 * lernen/[stufe]/[lektion]/page.tsx.
 */
export async function diplomZugang(): Promise<DiplomZugang> {
  const admin = istAdminPasswort((await cookies()).get('admin_auth')?.value);

  // Ohne Supabase-Umgebung (Build-Gate, frische Preview) gibt es keine
  // Buchungspruefung — dann zaehlt nur der Admin-Cookie. Nie werfen: die
  // Lektionsseite soll auch dann rendern, nur eben gesperrt.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { userId: null, admin, zugang: admin };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { userId: null, admin, zugang: admin };
    if (admin) return { userId: user.id, admin, zugang: true };

    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', DIPLOM_COURSE_SLUG)
      .maybeSingle();
    if (!course) return { userId: user.id, admin, zugang: false };

    const { data: booking } = await supabase
      .from('bookings')
      .select('status')
      .eq('course_id', course.id)
      .eq('user_id', user.id)
      .maybeSingle();

    const aktiv = booking?.status === 'active' || booking?.status === 'confirmed';
    return { userId: user.id, admin, zugang: aktiv };
  } catch {
    return { userId: null, admin, zugang: admin };
  }
}

/** Ist diese Stufe frei (Stufe 1) oder Teil des Bezahlprodukts? */
export function istBezahlstufe(stufe: number): boolean {
  return stufe >= ERSTE_BEZAHLSTUFE;
}
