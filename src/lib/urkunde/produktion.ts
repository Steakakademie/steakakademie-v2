import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { rendereUrkunde, urkundenDatum } from './render';
import { kennungAus, urkundenZeile } from './kennung';
import { sendeAuftrag, GelatoFehler } from './gelato';

/**
 * Der Weg von der freigegebenen Bestellung zum Druckauftrag.
 *
 * Nummer vergeben → Urkunde rendern → in den privaten Bucket legen →
 * signierte URL erzeugen → Gelato beauftragen → Bestellung fortschreiben.
 *
 * Ausdruecklich hinter einer manuellen Freigabe (Testphase): Hier wird Geld
 * ausgegeben und etwas physisch verschickt. Erst wenn das ueber mehrere echte
 * Bestellungen sauber laeuft, kann der Digistore-Webhook diese Funktion
 * direkt nach dem Zahlungseingang aufrufen — der Code dafuer aendert sich
 * nicht, es faellt nur der Knopf weg.
 */

const BUCKET = 'urkunden';
/** Gueltigkeit der signierten Druckdatei-URL: ein halbes Jahr. */
const URL_GUELTIG_SEKUNDEN = 180 * 24 * 60 * 60;

export type Bestellung = {
  id: string;
  user_id: string | null;
  email: string;
  stufe: number;
  level_id: number | null;
  name_auf_urkunde: string;
  vorname: string;
  nachname: string;
  strasse: string;
  adresszusatz: string | null;
  plz: string;
  ort: string;
  land: string;
  preis_cents: number;
  status: 'neu' | 'bezahlt' | 'gesendet' | 'fehler' | 'storniert';
  urkunde_nr: string | null;
  druck_datei: string | null;
  gelato_order_id: string | null;
  fehler_text: string | null;
  bestellt_am: string;
  freigegeben_am: string | null;
};

export function dienstClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type ProduktionsErgebnis =
  | { ok: true; urkundeNr: string; gelatoOrderId: string; druckDatei: string; entwurf: boolean }
  | { ok: false; grund: string; status: number };

export async function produziere(
  bestellungId: string,
  optionen: { entwurf?: boolean } = {},
): Promise<ProduktionsErgebnis> {
  const db = dienstClient();
  if (!db) return { ok: false, grund: 'Supabase-Dienstschluessel fehlt.', status: 503 };

  const jetzt = new Date();

  // Der Zustand VOR der Reservierung — gebraucht wird er nur von der Probe,
  // die ihn hinterher wiederherstellt. Die Reservierung unten kann ihn nicht
  // liefern: Ihr `.select('*')` ist ein UPDATE ... RETURNING und gibt die
  // NEUEN Werte zurueck, also bereits 'gesendet' samt gesetztem
  // freigegeben_am. Wer damit "zuruecksetzt", schreibt 'gesendet' erneut.
  const { data: vorZustand } = await db
    .from('urkunden_bestellungen')
    .select('status, freigegeben_am')
    .eq('id', bestellungId)
    .maybeSingle();

  // Zustand wechseln, BEVOR bei Gelato bestellt wird. Zwei gleichzeitige
  // Klicks auf „Freigeben" koennen so nicht zwei Druckauftraege ausloesen:
  // Der zweite findet die Zeile nicht mehr im freigabefaehigen Zustand.
  const { data: reserviert, error: reservierFehler } = await db
    .from('urkunden_bestellungen')
    .update({ status: 'gesendet', freigegeben_am: jetzt.toISOString(), aktualisiert_am: jetzt.toISOString(), fehler_text: null })
    .eq('id', bestellungId)
    .in('status', ['neu', 'bezahlt', 'fehler'])
    .select('*')
    .maybeSingle();

  if (reservierFehler) return { ok: false, grund: reservierFehler.message, status: 500 };
  if (!reserviert) return { ok: false, grund: 'Bestellung nicht gefunden oder bereits in Produktion.', status: 409 };

  const bestellung = reserviert as Bestellung;

  try {
    // ── Nummer: bei einem erneuten Anlauf die bereits vergebene weiterbenutzen,
    // sonst reisst jeder Fehlversuch eine Luecke in die Nummernfolge.
    //
    // Seit 17.10.2026: Bestellungen eines Kontos drucken DIE Urkunde aus
    // public.urkunden (gleiche Nummer + Prüfcode wie die digitale, Name aus
    // urkunden_namen, Datum der Ausstellung). urkunde_ausstellen_fuer ist
    // idempotent je Konto und Stufe — ein Nachdruck trägt dieselbe Kennung.
    // Nur Bestellungen ohne Konto (Admin) laufen noch über den alten Zähler.
    let urkundeNr = bestellung.urkunde_nr;
    let druckName = bestellung.name_auf_urkunde;
    let druckZeile = urkundeNr ? `Urkunden-Nr. ${urkundeNr}` : '';
    let druckDatum = urkundenDatum(jetzt);
    // Admin-Testbestellung für ein Konto ohne bestandene Stufe: keine öffentlich
    // prüfbare Urkunde anlegen, sondern wie früher über den Zähler (unten).
    const kontoUrkunde = bestellung.user_id
      ? await db.rpc('urkunde_ausstellen_fuer', {
          p_user_id: bestellung.user_id,
          p_stufe: bestellung.stufe,
          p_name: bestellung.name_auf_urkunde,
        })
      : null;
    const nichtBestanden = Boolean(kontoUrkunde?.error?.message.includes('nicht_bestanden'));
    if (kontoUrkunde && !nichtBestanden) {
      const { data, error } = kontoUrkunde;
      const u = (Array.isArray(data) ? data[0] : data) as
        | { nr: string; pruefcode: string; name: string; ausgestellt_am: string }
        | null;
      if (error || !u) throw new Error(`Urkunde konnte nicht ausgestellt werden: ${error?.message ?? 'leere Antwort'}`);
      urkundeNr = kennungAus(u.nr, u.pruefcode);
      druckName = u.name;
      druckZeile = urkundenZeile(u.nr, u.pruefcode);
      druckDatum = urkundenDatum(new Date(u.ausgestellt_am));
      if (bestellung.urkunde_nr !== urkundeNr) {
        // Seit Migration 20261017101203 nicht mehr UNIQUE: ein Nachdruck trägt dieselbe Kennung.
        await db.from('urkunden_bestellungen').update({ urkunde_nr: urkundeNr }).eq('id', bestellung.id);
      }
    } else if (!urkundeNr) {
      const { data, error } = await db.rpc('naechste_urkundennummer', { p_jahr: jetzt.getFullYear() });
      if (error || typeof data !== 'string') throw new Error(`Nummernvergabe fehlgeschlagen: ${error?.message ?? 'leere Antwort'}`);
      urkundeNr = data;
      druckZeile = `Urkunden-Nr. ${urkundeNr}`;
      await db.from('urkunden_bestellungen').update({ urkunde_nr: urkundeNr }).eq('id', bestellung.id);
    }
    if (!urkundeNr) throw new Error('Keine Urkunden-Nummer.');

    // ── Rendern
    const { png } = await rendereUrkunde({
      stufe: bestellung.stufe,
      name: druckName,
      datum: druckDatum,
      nr: druckZeile,
    });

    // ── Ablegen und signieren
    // Bestell-ID im Namen: Ein Nachdruck derselben Urkunde überschreibt nicht die Datei der ersten Bestellung.
    const pfad = `druck/${jetzt.getFullYear()}/${urkundeNr}-${bestellung.id.slice(0, 8)}.png`;
    const { error: uploadFehler } = await db.storage
      .from(BUCKET)
      .upload(pfad, png, { contentType: 'image/png', upsert: true });
    if (uploadFehler) throw new Error(`Druckdatei konnte nicht abgelegt werden: ${uploadFehler.message}`);

    const { data: signiert, error: signFehler } = await db.storage
      .from(BUCKET)
      .createSignedUrl(pfad, URL_GUELTIG_SEKUNDEN);
    if (signFehler || !signiert?.signedUrl) throw new Error(`Signierte URL fehlgeschlagen: ${signFehler?.message ?? 'leer'}`);

    // ── Druckauftrag
    // Die Probe bekommt eine eigene Referenz: Sonst traegt der spaetere echte
    // Auftrag dieselbe orderReferenceId wie der Entwurf.
    const ergebnis = await sendeAuftrag({
      referenz: optionen.entwurf ? `${bestellung.id}-probe` : bestellung.id,
      kundenReferenz: bestellung.user_id ?? bestellung.email,
      dateiUrl: signiert.signedUrl,
      entwurf: optionen.entwurf,
      adresse: {
        firstName: bestellung.vorname,
        lastName: bestellung.nachname,
        addressLine1: bestellung.strasse,
        addressLine2: bestellung.adresszusatz ?? undefined,
        city: bestellung.ort,
        postCode: bestellung.plz,
        country: bestellung.land,
        email: bestellung.email,
      },
    });

    // Nach einer Probe bleibt die Bestellung offen: Gedruckt wurde nichts, die
    // echte Freigabe steht noch aus. Nummer und Druckdatei bleiben erhalten —
    // die echte Freigabe benutzt beide weiter, es entsteht keine Luecke in der
    // Nummernfolge und die geprüfte Datei ist genau die, die gedruckt wird.
    //
    // Zurueckgesetzt wird auf `vorZustand`, NICHT auf `bestellung`: Letzteres
    // ist die Antwort der Reservierung und traegt schon 'gesendet'. Bis
    // 11.09.2026 stand hier `bestellung.status` — eine Probe schrieb damit
    // 'gesendet' fest, und die anschliessende echte Freigabe scheiterte an
    // ihrem eigenen `.in('status', ['neu','bezahlt','fehler'])` mit 409
    // „bereits in Produktion". Die Probe hat also genau das verhindert,
    // wofuer es sie gibt.
    await db.from('urkunden_bestellungen').update({
      druck_datei: pfad,
      gelato_order_id: ergebnis.id,
      gelato_antwort: ergebnis.rohdaten as object,
      aktualisiert_am: new Date().toISOString(),
      ...(optionen.entwurf
        ? {
            status: (vorZustand?.status as Bestellung['status'] | undefined) ?? 'neu',
            freigegeben_am: (vorZustand?.freigegeben_am as string | null | undefined) ?? null,
          }
        : {}),
    }).eq('id', bestellung.id);

    return { ok: true, urkundeNr, gelatoOrderId: ergebnis.id, druckDatei: pfad, entwurf: Boolean(optionen.entwurf) };
  } catch (fehler) {
    const text = fehler instanceof GelatoFehler
      ? `${fehler.message} (HTTP ${fehler.status})`
      : fehler instanceof Error ? fehler.message : String(fehler);

    // Zurueck auf „fehler" — die Bestellung bleibt sichtbar und wiederholbar.
    await db.from('urkunden_bestellungen').update({
      status: 'fehler',
      fehler_text: text.slice(0, 2000),
      aktualisiert_am: new Date().toISOString(),
    }).eq('id', bestellungId);

    console.error('[urkunde/produktion]', bestellungId, text);
    return { ok: false, grund: text, status: 502 };
  }
}
