/**
 * POST /api/niche-validator/lead
 *
 * Qualified Lead-Erfassung vom Niche Validator Tool.
 * DOI-Flow: Bestätigungs-E-Mail → /api/newsletter/confirm?token=...
 * Kein Eintrag in Loops ohne bestätigte Einwilligung.
 *
 * Benötigte Umgebungsvariablen:
 *  LOOPS_API_KEY              — Loops.so API Key
 *  LOOPS_DOI_TEMPLATE_ID      — Transaktionale DOI-Vorlage (selbe wie Newsletter)
 *  NEWSLETTER_DOI_SECRET      — HMAC-Geheimnis
 *  NEXT_PUBLIC_APP_URL        — z.B. https://steakakademie.de
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createDOIToken } from '@/lib/doi';
import { guardRequest } from '@/lib/api/guard';

const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
const DOI_TEMPLATE_ID = process.env.LOOPS_DOI_TEMPLATE_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://steakakademie.de';

// Eingangsschutz (01.10.2026): Same-Origin, 5 Leads / IP / Stunde, Honeypot,
// Turnstile — über den zentralen Guard. Schützt die kostenpflichtige Loops-Mail.
const RATE = { limit: 5, windowMs: 60 * 60 * 1_000 };
const LeadSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email.').max(254),
  niche: z.string().trim().min(1, 'Niche is required.').max(200),
  verdict: z.enum(['Go', 'Caution', 'Skip']).optional(),
  difficulty: z.number().optional(),
  consent: z.boolean().optional(),
});
type LeadPayload = z.infer<typeof LeadSchema>;

export async function POST(req: NextRequest) {
  const guard = await guardRequest(req, { key: 'niche-lead', rate: RATE, schema: LeadSchema, honeypot: 'website', turnstile: true });
  if (!guard.ok) return guard.response;
  const body: LeadPayload = guard.body;
  const email = body.email;
  const niche = body.niche;

  // Einwilligung muss explizit gegeben worden sein (DSGVO Art. 6 Abs. 1 lit. a)
  if (!body.consent) {
    return NextResponse.json({ error: 'Consent required.' }, { status: 400 });
  }

  // Dev mode: kein Loops key → simulierte Antwort
  if (!LOOPS_API_KEY) {
    console.log(
      `[NicheValidator] DEV — DOI-E-Mail würde gesendet: ${email} | niche="${niche}" | verdict=${body.verdict ?? '?'}`,
    );
    return NextResponse.json({ success: true, doi: true, dev: true });
  }

  // DOI-Token mit Niche-Metadaten generieren
  const token = createDOIToken(email);
  const confirmUrl = `${APP_URL}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

  // Bestätigungs-E-Mail senden (Kontakt erst nach Klick in Loops angelegt)
  if (DOI_TEMPLATE_ID) {
    const txRes = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        transactionalId: DOI_TEMPLATE_ID,
        email,
        dataVariables: {
          confirmUrl,
          source: 'authorityos-niche-validator',
          userGroup: 'authorityos_lead',
          nicheValidated: niche,
          nicheVerdict: body.verdict ?? 'Unknown',
        },
      }),
    });
    if (!txRes.ok) {
      console.error('[NicheValidator] Loops transactional error:', txRes.status);
    }
  } else {
    console.warn('[NicheValidator] LOOPS_DOI_TEMPLATE_ID fehlt — Bestätigungs-E-Mail nicht gesendet.');
  }

  return NextResponse.json({ success: true, doi: true });
}
