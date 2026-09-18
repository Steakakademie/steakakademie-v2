/**
 * POST /api/aroma-matcher   (application/json)
 *
 * Smart-Pairing-Engine — ein Endpunkt, drei Aktionen (immer POST, weil
 * guardRequest einen JSON-Body verlangt und die Antwort personenbezogen ist):
 *
 *   {}                      → Status: loggedIn, remaining, analysed[]
 *   { cutId }               → Pairing für den Cut; verbraucht 1 vom Freikontingent,
 *                             außer der Cut wurde schon analysiert (Wiederholung frei).
 *                             402, wenn das Kontingent erschöpft ist.
 *   { warteliste: true }    → Konto auf die Aroma-Matrix-Warteliste setzen.
 *
 * Anonym: Status kommt zurück (loggedIn=false); cutId/warteliste → 401.
 * Admin-Cookie: unbegrenzt, nichts wird verbucht.
 * Kontingent-Logik liegt in der RPC consume_aroma_matcher_abfrage (atomar).
 */

import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { guardRequest, jsonError } from '@/lib/api/guard';
import { cutById, cutIds, FREE_LIMIT } from '@/lib/aroma-matcher/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function analysedCuts(userId: string): Promise<string[]> {
  const { data } = await admin()
    .from('aroma_matcher_abfragen')
    .select('cut_id')
    .eq('user_id', userId);
  return (data ?? []).map((r: { cut_id: string }) => r.cut_id);
}

export async function POST(req: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase-Konfiguration fehlt.' }, { status: 500 });
  }

  const guard = await guardRequest(req, {
    key: 'aroma-matcher',
    rate: { limit: 60, windowMs: 10 * 60_000 },
    schema: z.object({
      cutId: z.string().trim().min(1).max(64).optional(),
      warteliste: z.boolean().optional(),
    }),
    maxBodyBytes: 2 * 1024,
    auth: 'none',
  });
  if (!guard.ok) return guard.response;
  const { cutId, warteliste } = guard.body;
  const { principal } = guard;

  // ── Anonym ────────────────────────────────────────────────────────────────
  if (principal.kind === 'anonymous') {
    if (cutId || warteliste) return jsonError(401, 'Anmeldung erforderlich.');
    return NextResponse.json({ loggedIn: false, remaining: 0, limit: FREE_LIMIT, analysed: [] }, { headers: NO_STORE });
  }

  // ── Admin: unbegrenzt, nichts verbuchen ───────────────────────────────────
  if (principal.kind === 'admin') {
    if (warteliste) return NextResponse.json({ ok: true }, { headers: NO_STORE });
    if (!cutId) {
      return NextResponse.json({ loggedIn: true, unlimited: true, remaining: FREE_LIMIT, limit: FREE_LIMIT, analysed: [] }, { headers: NO_STORE });
    }
    const cut = cutById(cutId);
    if (!cut) return jsonError(404, 'Unbekannter Cut.');
    return NextResponse.json({ cut, remaining: FREE_LIMIT, limit: FREE_LIMIT, analysed: [], unlimited: true }, { headers: NO_STORE });
  }

  const userId = principal.userId;

  // ── Warteliste ────────────────────────────────────────────────────────────
  if (warteliste) {
    const { error } = await admin()
      .from('aroma_matrix_warteliste')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
    if (error) return jsonError(502, `Warteliste fehlgeschlagen: ${error.message}`);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }

  // ── Status ────────────────────────────────────────────────────────────────
  if (!cutId) {
    const analysed = await analysedCuts(userId);
    return NextResponse.json(
      { loggedIn: true, remaining: Math.max(FREE_LIMIT - analysed.length, 0), limit: FREE_LIMIT, analysed },
      { headers: NO_STORE },
    );
  }

  // ── Pairing ───────────────────────────────────────────────────────────────
  if (!cutIds().includes(cutId)) return jsonError(404, 'Unbekannter Cut.');

  const { data: remaining, error } = await admin().rpc('consume_aroma_matcher_abfrage', {
    p_user_id: userId,
    p_cut_id: cutId,
    p_limit: FREE_LIMIT,
  });
  if (error) return jsonError(502, `Kontingent konnte nicht geprüft werden: ${error.message}`);

  const analysed = await analysedCuts(userId);

  if (typeof remaining !== 'number' || remaining < 0) {
    return NextResponse.json(
      { error: 'Freikontingent aufgebraucht.', remaining: 0, limit: FREE_LIMIT, analysed },
      { status: 402, headers: NO_STORE },
    );
  }

  const cut = cutById(cutId);
  return NextResponse.json({ cut, remaining, limit: FREE_LIMIT, analysed }, { headers: NO_STORE });
}
