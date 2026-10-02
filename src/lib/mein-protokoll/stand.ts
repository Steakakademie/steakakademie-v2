import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { berechneGuthaben, type Guthaben } from './guthaben';
import { PlanSchema, type Plan } from './schema';

export interface ProtokollDaten {
  id: string;
  korrektur_von: string | null;
  created_at: string;
  answers: unknown;
  plan: unknown;
}

export interface Stand {
  /**
   * false = Tabelle `protokoll_gutschriften` bzw. Spalte `korrektur_von` fehlt
   * (Migration noch nicht angewendet) oder die Abfrage ist gescheitert. Dann
   * wird NICHT generiert — lieber ein klarer Hinweis als ein Plan ohne Guthaben-
   * Prüfung. Vorhandene Pläne bleiben lesbar.
   */
  verfuegbar: boolean;
  guthaben: Guthaben;
  zeilen: ProtokollDaten[];
}

/**
 * Guthaben und Pläne eines Nutzers. Läuft mit dem Nutzer-Client: RLS gibt nur
 * die eigenen Zeilen frei (protokolle + protokoll_gutschriften, je SELECT own).
 */
export async function ladeStand(supabase: SupabaseClient, userId: string): Promise<Stand> {
  const voll = await supabase
    .from('protokolle')
    .select('id, korrektur_von, created_at, answers, plan')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  let zeilen: ProtokollDaten[];
  let verfuegbar = true;

  if (voll.error) {
    verfuegbar = false;
    const alt = await supabase
      .from('protokolle')
      .select('id, created_at, answers, plan')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    zeilen = (alt.data ?? []).map((z) => ({ ...z, korrektur_von: null })) as ProtokollDaten[];
  } else {
    zeilen = (voll.data ?? []) as ProtokollDaten[];
  }

  let gekauft = 0;
  if (verfuegbar) {
    const g = await supabase.from('protokoll_gutschriften').select('anzahl').eq('user_id', userId);
    if (g.error) {
      verfuegbar = false;
    } else {
      gekauft = (g.data ?? []).reduce((summe, z) => summe + (z.anzahl as number), 0);
    }
  }

  return { verfuegbar, zeilen, guthaben: berechneGuthaben(gekauft, zeilen) };
}

export function planVon(stand: Stand, id: string | null | undefined): Plan | null {
  const zeile = stand.zeilen.find((z) => z.id === id);
  if (!zeile) return null;
  const parsed = PlanSchema.safeParse(zeile.plan);
  return parsed.success ? parsed.data : null;
}
