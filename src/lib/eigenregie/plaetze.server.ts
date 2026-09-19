import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Anzahl vergebener Pilotplätze = nicht widerrufene Buchungen auf den Kurs „eigenregie“.
 * 20.09.2026: zählte nur status='active' — die Live-Fassung von grant_course_access
 * legte Käufe aber als 'pending' an → Zähler blieb bei 0. Jetzt: jeder Status außer
 * cancelled/refunded, solange revoked_at leer ist.
 * Service-Role, weil bookings per RLS nur der eigene Nutzer sieht.
 * Fehler → null (Seite zeigt dann keine Zahl, statt eine falsche).
 * Achtung: Uwes Testkauf zählt mit — Test-Buchung danach widerrufen (revoked_at).
 */
export async function vergebenePlaetze(): Promise<number | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const sb = createClient(url, key, {
      auth: { persistSession: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
    });
    const { data: course } = await sb.from('courses').select('id').eq('slug', 'eigenregie').maybeSingle();
    if (!course) return null;
    const { count, error } = await sb
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', course.id)
      .in('status', ['active', 'confirmed', 'pending'])
      .is('revoked_at', null);
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}
