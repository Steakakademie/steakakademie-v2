import { isAdminRequest, jsonError, rateLimitRequest } from '@/lib/api/guard';
import { mutterrezept, sicht } from '@/lib/mutterrezepte';
import { createClient } from '@/lib/supabase/server';

/**
 * Vollansicht eines Mutterrezepts (Grammangaben, alle Blätter).
 *
 * Die Seite /mutterrezepte/[slug] ist statisch und liefert nur die öffentliche
 * Sicht aus. Die Komponente fragt hier nach; nur wer Vollzugriff hat, bekommt
 * die gesperrten Inhalte. Stand 21.10.2026 hat den Vollzugriff nur der Admin
 * (Vorschau für Uwe) — die VIP-Rolle gibt es noch nicht (Digistore-Produkt
 * 734925 gesperrt, siehe /vip). Seit 22.10.2026 liegt sie HIER hinter dem Schalter
 * VIP_ROLLE_ENABLED (siehe hatVollzugriff), sonst nirgends.
 */

const RATE = { limit: 30, windowMs: 10 * 60 * 1000 };

/**
 * 22.10.2026 (C3): VIP-Rolle hinter Schalter. Mit VIP_ROLLE_ENABLED=1 gibt eine
 * aktive, nicht widerrufene Buchung des Kurses VIP_KURS_SLUG (Standard `vip`)
 * die Vollansicht. Solange Digistore-Produkt 734925 gesperrt ist, bleibt der
 * Schalter aus — dann gilt wie bisher: nur der Admin. Die Buchungsabfrage folgt
 * src/lib/auth/require-course-access.ts (revoked_at null, Status active/confirmed);
 * RLS auf bookings begrenzt sie auf den eingeloggten Nutzer.
 */
async function hatVollzugriff(req: Request): Promise<boolean> {
  if (await isAdminRequest(req)) return true;
  if (process.env.VIP_ROLLE_ENABLED !== '1') return false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: kurs } = await supabase
    .from('courses').select('id').eq('slug', process.env.VIP_KURS_SLUG ?? 'vip').maybeSingle();
  if (!kurs) return false;
  const { data: buchung } = await supabase
    .from('bookings').select('id').eq('course_id', kurs.id)
    .is('revoked_at', null).in('status', ['active', 'confirmed']).maybeSingle();
  return Boolean(buchung);
}

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const limit = rateLimitRequest(req, 'mutterrezepte', RATE);
  if (!limit.ok) return limit.response;

  const { slug } = await ctx.params;
  const m = mutterrezept(slug);
  if (!m) return jsonError(404, 'Unbekanntes Mutterrezept.', limit.headers);

  if (!(await hatVollzugriff(req))) {
    return jsonError(403, 'Vollansicht nur im VIP-Pass.', limit.headers);
  }

  return Response.json(sicht(m, true), {
    headers: { ...limit.headers, 'Cache-Control': 'private, no-store' },
  });
}
