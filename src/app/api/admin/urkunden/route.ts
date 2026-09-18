export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/**
 * 90 s, wie bei den anderen schweren Routen (admin/rezepte, rezept-bild,
 * kochwissen/generieren). Ohne diese Zeile greift der Deckel aus vercel.json
 * — `"src/app/api/**": { "maxDuration": 30 }` gilt fuer JEDE Route, die nichts
 * eigenes sagt. Die Freigabe braucht in einem Zug: Vorlage und zwei Schriften
 * von der Platte, ein 300-dpi-Rendering durch sharp (A4 sind 3508x2480 Pixel),
 * rund 1,5 MB Upload in den Bucket und den Gelato-Aufruf, bei dem Gelato die
 * Datei seinerseits herunterlaedt. Kommt ein Kaltstart mit dem sharp-Binary
 * dazu, sind 30 s knapp.
 *
 * Warum das mehr als eine Unbequemlichkeit waere: Laeuft die Funktion in den
 * Deckel, wird sie abgeschnitten — das catch in produziere() laeuft dann NICHT
 * mehr. Die Zeile steht zu diesem Zeitpunkt bereits auf 'gesendet' (die
 * Reservierung gegen Doppelklicks), aber ohne gelato_order_id und ohne
 * fehler_text. Sie sieht damit aus wie erledigt, ist es nicht, und laesst sich
 * ueber die Oberflaeche auch nicht wiederholen: Jede Aktion dort verlangt
 * status in ('neu','bezahlt','fehler').
 *
 * Die Route-Segment-Angabe hat Vorrang vor vercel.json.
 */
export const maxDuration = 90;

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { istAdminPasswort } from '@/lib/admin-auth';
import { dienstClient, produziere } from '@/lib/urkunde/produktion';

/**
 * Urkunden-Freigabe — der Knopf der Testphase.
 *
 * GET  → offene und zuletzt bearbeitete Bestellungen
 * POST → { id, aktion }
 *          bezahlt    Zahlung eingegangen (die Zahlung selbst laeuft noch
 *                     ausserhalb, per Rechnung/Ueberweisung)
 *          freigeben  Nummer vergeben, rendern, an Gelato schicken — kostet
 *                     Geld und verschickt echte Post
 *          probe      dasselbe als Gelato-Entwurf: erzeugt Nummer und
 *                     Druckdatei, wird aber weder produziert noch berechnet
 *          stornieren Bestellung abschliessen, ohne zu drucken
 *
 * Auth: admin_auth-Cookie === ADMIN_PASSWORD, wie bei /api/admin/drafts.
 */

async function authed(): Promise<boolean> {
  return istAdminPasswort((await cookies()).get('admin_auth')?.value);
}

export async function GET() {
  if (!(await authed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = dienstClient();
  if (!db) return NextResponse.json({ error: 'Supabase-Dienstschlüssel fehlt.' }, { status: 503 });

  const { data, error } = await db
    .from('urkunden_bestellungen')
    .select('id, email, stufe, level_id, name_auf_urkunde, vorname, nachname, strasse, adresszusatz, plz, ort, land, preis_cents, status, urkunde_nr, druck_datei, gelato_order_id, fehler_text, bestellt_am, freigegeben_am')
    .order('bestellt_am', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bestellungen: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, aktion } = (await req.json().catch(() => ({}))) as { id?: string; aktion?: string };
  if (!id || !aktion) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const db = dienstClient();
  if (!db) return NextResponse.json({ error: 'Supabase-Dienstschlüssel fehlt.' }, { status: 503 });

  if (aktion === 'bezahlt' || aktion === 'stornieren') {
    const status = aktion === 'bezahlt' ? 'bezahlt' : 'storniert';
    const { error } = await db
      .from('urkunden_bestellungen')
      .update({ status, aktualisiert_am: new Date().toISOString() })
      .eq('id', id)
      .in('status', ['neu', 'bezahlt', 'fehler']);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status });
  }

  if (aktion === 'freigeben' || aktion === 'probe') {
    const ergebnis = await produziere(id, { entwurf: aktion === 'probe' });
    if (!ergebnis.ok) return NextResponse.json({ error: ergebnis.grund }, { status: ergebnis.status });
    return NextResponse.json(ergebnis);
  }

  return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
}
