/**
 * POST /api/rezept-bild   (application/json { slug })
 *
 * Generiert EIN markenkonformes Food-Foto (fal.ai FLUX.1 + Hausstil-LoRA) für ein
 * FREIGEGEBENES Community-Rezept und schreibt die URL nach user_recipes.image_url.
 * Login-Pflicht (Kosten-/Missbrauchsschutz). Die eigentliche Generierung liegt im
 * gemeinsamen Helper, den auch die Admin-Freigabe (Auto-Bild) nutzt.
 *
 * Guard (Same-Origin → Rate-Limit → Zod) sitzt VOR der Auth: jeder Aufruf löst
 * eine bezahlte fal.ai-Bildgenerierung aus — ohne Limit ein offener Kostenhahn.
 * Auth bleibt bewusst in der Route: das Frontend (GenerateImageButton) erwartet
 * beim 401 das Shape { error, needsLogin }, der Guard-401 hätte kein needsLogin.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { generateRecipeImage } from '@/lib/rezept/generate-image';
import { guardRequest } from '@/lib/api/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

export async function POST(req: Request) {
  // 1) Guard: Same-Origin → Rate-Limit → Zod-Body.
  // 10 Bilder pro Stunde pro IP (Guard zählt pro IP) — legitim reicht das
  // locker (ein Klick pro Rezept ohne Bild), Skript-Schleifen laufen ins 429.
  const guard = await guardRequest(req, {
    key: 'rezept-bild',
    rate: { limit: 10, windowMs: 60 * 60_000 },
    schema: z.object({ slug: z.string().trim().min(1).max(200) }),
    maxBodyBytes: 4 * 1024,
  });
  if (!guard.ok) return guard.response;
  const { slug } = guard.body;

  // 2) Auth: Login-Pflicht — Shape { error, needsLogin } NICHT ändern (GenerateImageButton.tsx).
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Bitte melde dich an.', needsLogin: true }, { status: 401 });
  }

  // 3) Generieren (gemeinsamer Helper)
  const r = await generateRecipeImage(slug);
  if (r.error && !r.image_url) {
    return NextResponse.json({ error: r.error }, { status: r.status ?? 500 });
  }
  return NextResponse.json({ image_url: r.image_url, cached: r.cached ?? false });
}
