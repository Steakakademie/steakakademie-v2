import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createDOIToken } from '@/lib/doi';
import { guardRequest } from '@/lib/api/guard';
import { NEWSLETTER_CONSENT_VERSION, NEWSLETTER_CONSENT_HISTORY } from '@/lib/newsletter-consent';

/**
 * Newsletter API — Loops.so Integration mit Double-Opt-In (DOI)
 *
 * DOI-Flow:
 *  1. POST /api/newsletter   → generiert signierten Token, schickt Bestätigungs-E-Mail
 *  2. GET  /api/newsletter/confirm?token=... → verifiziert Token, legt Kontakt in Loops an
 *
 * Benötigte Umgebungsvariablen (Vercel):
 *  LOOPS_API_KEY              — Loops.so API Key
 *  LOOPS_DOI_TEMPLATE_ID      — ID der transaktionalen Bestätigungs-E-Mail in Loops
 *  NEWSLETTER_DOI_SECRET      — HMAC-Geheimnis (min. 32 zufällige Zeichen)
 *  NEXT_PUBLIC_APP_URL        — z.B. https://steakakademie.de
 *
 * Loops-Onboarding-Sequenz (7 E-Mails — erst NACH DOI-Bestätigung):
 *  Email #1 (sofort)  — Willkommen + erste Technik
 *  Email #2 (Tag 2)   — Persönlichkeits-Teaser (Aaron Franklin)
 *  Email #3 (Tag 4)   — Fehler-basierter Artikel → Steak-Rettung
 *  Email #4 (Tag 7)   — Bronze-Herausforderung CTA (Haupt-Conversion)
 *  Email #5 (Tag 10)  — Social Proof Story
 *  Email #6 (Tag 14)  — Marco-Widget Adoption
 *  Email #7 (Tag 21)  — Roadmap-Teaser + Feedback-Request
 */

export const runtime = 'nodejs';

const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
const LOOPS_API_BASE = 'https://app.loops.so/api/v1';
const DOI_TEMPLATE_ID = process.env.LOOPS_DOI_TEMPLATE_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://steakakademie.de';

// Map source → Loops user groups for post-confirmation segmentation
const SOURCE_CONFIG: Record<string, { userGroup: string }> = {
  'simulation-final-cta': { userGroup: 'high_intent' },
  'exit-intent': { userGroup: 'recovered' },
  'mid-article': { userGroup: 'content_engaged' },
  'grillstil': { userGroup: 'grillstil' },
  'mein-protokoll-plan': { userGroup: 'protokoll_active' },
  'footer': { userGroup: 'newsletter' },
  'homepage-banner': { userGroup: 'newsletter' },
  // /vip (20.09.2026): Warteliste fuer den VIP-Pass — Launch-Mail geht an diese Gruppe.
  'vip-warteliste': { userGroup: 'vip_warteliste' },
  default: { userGroup: 'newsletter' },
};

// ─── Eingangsschutz ──────────────────────────────────────────────────────────
// Seit 01.10.2026 über den zentralen Guard (src/lib/api/guard.ts): Same-Origin,
// 5 Anmeldeversuche / IP / 10 min, Honeypot `website`, Turnstile-Token.
// Vorher stand hier ein eigener Map-Limiter — gleiche Grenze, zweite Kopie.
const RATE = { limit: 5, windowMs: 10 * 60 * 1_000 };

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format').max(254),
  source: z.string().max(64).optional().default('default'),
  // Fassung des akzeptierten Einwilligungstextes — Typ wird unten geprüft.
  consentVersion: z.unknown().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const guard = await guardRequest(req, {
      key: 'newsletter',
      rate: RATE,
      schema: BodySchema,
      honeypot: 'website',
      turnstile: true,
    });
    if (!guard.ok) return guard.response;
    const { email, source, consentVersion } = guard.body;
    const ip = guard.ip;

    const normalizedEmail = email;

    // Dev-Modus: kein Loops API Key → simulierte Antwort
    if (!LOOPS_API_KEY) {
      console.log(`[Newsletter] DEV MODE — DOI-E-Mail würde gesendet: ${normalizedEmail} (source: ${source})`);
      return NextResponse.json({ success: true, doi: true, dev: true });
    }

    // DOI-Token und Bestätigungs-URL generieren.
    // A2-Fix: source + userGroup wandern in den Token, damit /confirm sie kennt.
    const config = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.default;
    // A/B-Messung Startseite: B-Besucher (Editorial Ember, Cookie aus
    // src/proxy.ts) bekommen "-vb" an die source — in Loops damit je
    // Variante auszählbar. Config-Lookup läuft bewusst auf der Basis-source.
    const abVariant = req.cookies.get('sa_ab_home')?.value;
    const trackedSource = abVariant === 'b' ? `${source}-vb` : source;

    // ── Beweislast Art. 7 Abs. 1 DSGVO (Rechts-Audit 28.08.2026) ─────────────
    // Der Client meldet, welche Fassung des Einwilligungstextes er angezeigt hat.
    // Kennen wir die Fassung nicht (veralteter Client-Cache, manipulierter
    // Request), fällt der Server bewusst auf die SERVERSEITIG aktuelle Fassung
    // zurück statt einen unbekannten Wert zu protokollieren — ein Protokoll mit
    // erfundener Versionsangabe wäre als Beweismittel schlimmer als keines.
    const claimedVersion = typeof consentVersion === 'string' ? consentVersion : undefined;
    const loggedConsentVersion =
      claimedVersion && claimedVersion in NEWSLETTER_CONSENT_HISTORY ? claimedVersion : NEWSLETTER_CONSENT_VERSION;
    if (claimedVersion && claimedVersion !== loggedConsentVersion) {
      console.warn(
        `[Newsletter] Unbekannte consentVersion "${claimedVersion}" — protokolliere ${loggedConsentVersion}.`,
      );
    }

    const token = createDOIToken(
      normalizedEmail,
      trackedSource,
      config.userGroup,
      loggedConsentVersion,
      ip,
    );
    const confirmUrl = `${APP_URL}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

    // ── A2-Fix „ehrlicher Fehler" (16.08.2026) ──────────────────────────────
    // Vorher meldete diese Route IMMER success:true — auch wenn keine Mail
    // rausging. Folge: Wochen unsichtbar toter Trichter (fehlende Template-ID
    // auf Vercel), Nutzer sahen „Fast geschafft", es kam nie etwas an.
    // Jetzt gilt: keine Bestätigungs-Mail nachweislich versendet -> Fehler an
    // den Nutzer, laut ins Log. Ein Trichter, der kaputt AUSSIEHT, wird
    // repariert; einer, der kaputt SCHWEIGT, kostet wochenlang Anmeldungen.
    if (!DOI_TEMPLATE_ID) {
      console.error(
        '[Newsletter] LOOPS_DOI_TEMPLATE_ID fehlt — Bestätigungs-E-Mail kann NICHT gesendet werden. ' +
        'Transaktionale Vorlage in Loops anlegen/publishen und ID in Vercel eintragen.',
      );
      return NextResponse.json(
        { error: 'Anmeldung derzeit nicht möglich — die Bestätigungs-E-Mail kann nicht versendet werden. Bitte versuche es später erneut.' },
        { status: 503 },
      );
    }

    const txRes = await fetch(`${LOOPS_API_BASE}/transactional`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        transactionalId: DOI_TEMPLATE_ID,
        email: normalizedEmail,
        dataVariables: {
          confirmUrl,
          source,
          userGroup: config.userGroup,
        },
      }),
    });
    if (!txRes.ok) {
      console.error('[Newsletter] Loops transactional error:', txRes.status, await txRes.text().catch(() => ''));
      return NextResponse.json(
        { error: 'Die Bestätigungs-E-Mail konnte nicht versendet werden. Bitte versuche es in ein paar Minuten erneut.' },
        { status: 502 },
      );
    }

    // Kontakt wird erst nach Bestätigung angelegt (in /api/newsletter/confirm)
    // Dadurch: kein Eintrag in Loops ohne nachgewiesene Einwilligung (DSGVO Art. 6 + UWG §7)
    return NextResponse.json({ success: true, doi: true });

  } catch (error) {
    console.error('[Newsletter] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
