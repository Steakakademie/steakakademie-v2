export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/**
 * Dieselbe Begruendung wie in ../route.ts, eine Stufe kleiner: Diese Route
 * rendert dasselbe 300-dpi-Blatt (oder laedt die fertige Druckdatei), ruft
 * aber keinen Druckdienst. Ohne die Zeile gaelte der 30-s-Deckel aus
 * vercel.json. Ein Abbruch waere hier nur aergerlich, nicht schaedlich — die
 * Vorschau ist zustandslos und beliebig wiederholbar.
 */
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { istAdminPasswort } from '@/lib/admin-auth';
import { dienstClient } from '@/lib/urkunde/produktion';
import { rendereUrkunde, urkundenDatum } from '@/lib/urkunde/render';

/**
 * GET /api/admin/urkunden/vorschau?id=… — die Urkunde ansehen, bevor Geld
 * fliesst.
 *
 * Ist bereits gedruckt worden, zeigt die Vorschau die tatsaechlich an Gelato
 * geschickte Datei. Vorher wird frisch gerendert, mit Platzhalter-Nummer:
 * Die echte Nummer wird erst bei der Freigabe vergeben, damit eine Vorschau
 * keine Luecke in die Nummernfolge reisst.
 *
 * Der Sinn dieser Route ist das Vier-Augen-Prinzip auf einem Dokument, das
 * hinterher gedruckt und verschickt wird: Ein falsch geschriebener Name faellt
 * hier auf und nicht beim Empfaenger.
 */
export async function GET(req: Request) {
  if (!istAdminPasswort((await cookies()).get('admin_auth')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Parameter id fehlt.' }, { status: 400 });

  const db = dienstClient();
  if (!db) return NextResponse.json({ error: 'Supabase-Dienstschlüssel fehlt.' }, { status: 503 });

  const { data, error } = await db
    .from('urkunden_bestellungen')
    .select('stufe, name_auf_urkunde, urkunde_nr, druck_datei, freigegeben_am')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Bestellung nicht gefunden.' }, { status: 404 });

  // Schon produziert: die echte Datei zeigen, nicht eine Neuberechnung.
  //
  // Ausgeliefert werden die Bytes, NICHT eine Weiterleitung auf die signierte
  // Supabase-URL. Bis 11.09.2026 stand hier NextResponse.redirect(): Die
  // Vorschau haengt in /admin/urkunden an einem <img src="/api/…/vorschau">,
  // und die img-src-Liste der Content-Security-Policy (next.config.mjs, dort
  // die massgebliche Fassung) fuehrt den Supabase-Host nicht. Der Browser
  // folgt der Weiterleitung zwar, blockt die fremde Ziel-Herkunft dann aber —
  // still, ohne Fehlermeldung auf der Seite. Ausgerechnet der Fall, auf den
  // es ankommt (die tatsaechlich an Gelato geschickte Datei), blieb so leer.
  // Der Umweg ueber diese Route haelt ausserdem die signierte URL serverseitig.
  //
  // Die erlaubten Hosts stehen hier bewusst NICHT ausgeschrieben: Eine Kopie
  // der Liste veraltet, und `scripts/legal-guard.mjs` sucht im rohen Dateitext
  // nach Tracker-Namen — ohne Kommentare auszuklammern. Diese Datei hat den
  // Gate am 11.09.2026 genau so rot gesetzt („Tracker ohne Consent"), obwohl
  // sie keine Zeile Tracking enthaelt.
  if (data.druck_datei) {
    const { data: datei, error: ladeFehler } = await db.storage.from('urkunden').download(data.druck_datei);
    if (datei) {
      return new Response(await datei.arrayBuffer(), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store',
          'Content-Disposition': `inline; filename="urkunde-${id}.png"`,
        },
      });
    }
    // Nicht ladbar: unten frisch rendern statt eine leere Vorschau zeigen.
    console.error('[urkunde/vorschau] Druckdatei nicht ladbar', data.druck_datei, ladeFehler?.message);
  }

  try {
    const { png } = await rendereUrkunde({
      stufe: data.stufe,
      name: data.name_auf_urkunde,
      datum: urkundenDatum(data.freigegeben_am ? new Date(data.freigegeben_am) : new Date()),
      nr: `Urkunden-Nr. ${data.urkunde_nr ?? 'SA-XXXX-XXXX'}`,
    });
    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Content-Disposition': `inline; filename="vorschau-${id}.png"`,
      },
    });
  } catch (e) {
    const text = e instanceof Error ? e.message : String(e);
    console.error('[urkunde/vorschau]', id, text);
    return NextResponse.json({ error: text }, { status: 500 });
  }
}
