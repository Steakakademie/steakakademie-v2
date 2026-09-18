/**
 * Hofladen-Radar — Datenzugriff (Server). Nur oeffentliche View + RPC,
 * mit dem anon-Key: mehr darf der Radar nicht sehen (RLS in der Migration).
 *
 * Ohne Supabase-Env (Build-Gate ohne Variablen) liefern alle Funktionen leer —
 * dasselbe Muster wie content-feed.ts. Nie Platzhalter-URLs einsetzen.
 */
import { createClient } from '@supabase/supabase-js';
import type { Hof, HofTreffer, Umkreis } from './types';

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
    // Next.js patcht das globale fetch() und cached es standardmaessig --
    // das gilt auch fuer Bibliotheks-interne Aufrufe wie die von supabase-js.
    // hoefe_im_umkreis() ist die erste RPC (POST) in diesem Modul: sie wurde
    // in Produktion nie neu ausgefuehrt und lieferte eine (vermutlich leere)
    // gecachte Antwort -- Supabase-Edge-Logs zeigten dafuer ueberhaupt keine
    // eingehende Anfrage von Vercel mehr, obwohl der Request-Handler lief.
    // explizit no-store erzwingen, damit jede Anfrage wirklich rausgeht.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}

export async function hofPerSlug(slug: string): Promise<Hof | null> {
  const sb = client();
  if (!sb || !/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  try {
    const { data, error } = await sb.from('hoefe_public').select('*').eq('slug', slug).maybeSingle();
    if (error) {
      console.error('[hoefe] hofPerSlug DB-Fehler:', error);
      return null;
    }
    if (!data) return null;
    return data as Hof;
  } catch (e) {
    console.error('[hoefe] hofPerSlug Ausnahme:', e);
    return null;
  }
}

export async function hoefeImUmkreis(u: Umkreis, limit = 200): Promise<HofTreffer[]> {
  const sb = client();
  if (!sb) {
    console.error('[hoefe] hoefeImUmkreis: kein Supabase-Client (fehlende Env-Variablen?)');
    return [];
  }
  try {
    const { data, error } = await sb.rpc('hoefe_im_umkreis', {
      p_lat: u.lat,
      p_lng: u.lng,
      p_km: u.km,
      p_nur_fleisch: u.nurFleisch,
      p_limit: limit,
    });
    if (error) {
      console.error('[hoefe] hoefeImUmkreis RPC-Fehler:', error);
      return [];
    }
    if (!Array.isArray(data)) {
      console.error('[hoefe] hoefeImUmkreis: unerwartete Antwortform:', data);
      return [];
    }
    return data as HofTreffer[];
  } catch (e) {
    console.error('[hoefe] hoefeImUmkreis Ausnahme:', e);
    return [];
  }
}

/** Hoefe in der Naehe eines Hofs (fuer die Profilseite), ohne den Hof selbst. */
export async function nachbarn(h: Hof, km = 25, limit = 6): Promise<HofTreffer[]> {
  const treffer = await hoefeImUmkreis({ lat: h.lat, lng: h.lng, km, nurFleisch: false }, limit + 1);
  return treffer.filter((t) => t.id !== h.id).slice(0, limit);
}

/** Bestandszahlen fuer die Einstiegsseite (ehrlich: 0 = noch nichts importiert). */
export async function bestand(): Promise<{ gesamt: number; fleisch: number }> {
  const sb = client();
  if (!sb) return { gesamt: 0, fleisch: 0 };
  try {
    const [g, f] = await Promise.all([
      sb.from('hoefe_public').select('id', { count: 'exact', head: true }),
      sb.from('hoefe_public').select('id', { count: 'exact', head: true }).eq('verkauft_fleisch', true),
    ]);
    if (g.error) console.error('[hoefe] bestand gesamt-Fehler:', g.error);
    if (f.error) console.error('[hoefe] bestand fleisch-Fehler:', f.error);
    return { gesamt: g.count ?? 0, fleisch: f.count ?? 0 };
  } catch (e) {
    console.error('[hoefe] bestand Ausnahme:', e);
    return { gesamt: 0, fleisch: 0 };
  }
}
