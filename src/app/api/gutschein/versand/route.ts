/**
 * POST /api/gutschein/versand — verschickt fällige Geschenkgutscheine (Wunschtermin).
 *
 * Aufrufer: .github/workflows/gutschein-versand.yml, stündlich. Bewusst GitHub
 * Actions statt Vercel Cron: Ob der Vercel-Tarif stündliche Crons erlaubt, ist aus
 * dem Repo nicht belegbar; ein unzulässiger Cron in vercel.json würde den
 * Produktions-Deploy brechen.
 *
 * Anmeldung: `Authorization: Bearer <GUTSCHEIN_VERSAND_SECRET>` (Vercel Production
 * + GitHub-Actions-Secret). Fehlt die Variable, antwortet die Route 503 — der Lauf
 * wird rot, statt still nichts zu tun (CLAUDE.md §2 Regel 10).
 *
 * Antwort: Bericht als JSON. Status 500, sobald etwas nicht zugestellt ist oder
 * hängt — dann ist der Workflow-Lauf rot.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { schluesselGleich } from '@/lib/gutschein-personalisierung';
import { laufIstRot, verarbeiteFaellige } from '@/lib/gutschein-versand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = process.env.GUTSCHEIN_VERSAND_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'GUTSCHEIN_VERSAND_SECRET ist nicht gesetzt — Lauf abgebrochen, nichts verarbeitet.' }, { status: 503 });
  }
  const auth = req.headers.get('authorization') ?? '';
  if (!schluesselGleich(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  try {
    const bericht = await verarbeiteFaellige(admin);
    return NextResponse.json(bericht, { status: laufIstRot(bericht) ? 500 : 200 });
  } catch (err) {
    console.error('[gutschein-versand] Lauf gescheitert', err);
    return NextResponse.json({ error: String((err as Error)?.message ?? err).slice(0, 300) }, { status: 500 });
  }
}
