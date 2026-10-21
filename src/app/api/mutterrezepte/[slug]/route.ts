import { isAdminRequest, jsonError, rateLimitRequest } from '@/lib/api/guard';
import { mutterrezept, sicht } from '@/lib/mutterrezepte';

/**
 * Vollansicht eines Mutterrezepts (Grammangaben, alle Blätter).
 *
 * Die Seite /mutterrezepte/[slug] ist statisch und liefert nur die öffentliche
 * Sicht aus. Die Komponente fragt hier nach; nur wer Vollzugriff hat, bekommt
 * die gesperrten Inhalte. Stand 21.10.2026 hat den Vollzugriff nur der Admin
 * (Vorschau für Uwe) — die VIP-Rolle gibt es noch nicht (Digistore-Produkt
 * 734925 gesperrt, siehe /vip). Kommt sie, wird sie HIER ergänzt, sonst nirgends.
 */

const RATE = { limit: 30, windowMs: 10 * 60 * 1000 };

async function hatVollzugriff(req: Request): Promise<boolean> {
  return isAdminRequest(req);
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
