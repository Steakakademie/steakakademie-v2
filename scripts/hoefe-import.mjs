#!/usr/bin/env node
/**
 * Hofladen-Radar — Wochenimport aller Hoflaeden (shop=farm) in Deutschland, Oesterreich und der Schweiz
 * aus OpenStreetMap (Overpass) nach Supabase (Tabelle hoefe).
 *
 * Aufruf:
 *   node scripts/hoefe-import.mjs            # Import
 *   node scripts/hoefe-import.mjs --dry-run  # nur zaehlen, nichts schreiben
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (.env.local oder Secrets)
 * Voraussetzung: supabase/migrations/20260913120000_hoefe.sql eingespielt — und fuer
 * Oesterreich/Schweiz 20261003074310_hoefe_grenzen_dach.sql (weitet die CHECK-Grenzen).
 *
 * Exitcode (03.10.2026, CLAUDE.md Regel 10 „Gruen ist kein Ergebnis"):
 *   0 = es wurde geschrieben und die Datenbank hat keine Zeile abgelehnt
 *   1 = Overpass/Supabase nicht erreichbar · nichts Brauchbares geliefert · nichts
 *       geschrieben · oder die Datenbank hat Zeilen abgelehnt (der Rest ist dann
 *       trotzdem angekommen — siehe scripts/lib/hoefe-schreiben.mjs)
 * Der Workflow braucht dafuer `pipefail`: hinter `| tee` zaehlte bis 03.10.2026 der
 * Exitcode von tee, drei gescheiterte Wochenlaeufe wurden gruen gemeldet.
 *
 * Warum kein Supabase-Edge-Function: das Repo betreibt alle Importe als
 * GitHub-Actions-Cron mit denselben zwei Secrets (import-foodpairing, saison-grow).
 * Eine dritte Laufzeit (Deno) nur fuer diesen Job waere Ballast.
 *
 * Lizenz: OSM-Daten stehen unter ODbL. Wir speichern sie mit Quellenangabe
 * (datenquelle = 'osm', osm_id) und zeigen auf jeder Seite die Attribution.
 */
import { createClient } from '@supabase/supabase-js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { OVERPASS_QUERY, DACH_GRENZEN, hoefeMitBilanz } from './lib/hoefe-osm.mjs';
import { schreibeHoefe, ablehnungenNachGrund } from './lib/hoefe-schreiben.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');
// Mehrere Instanzen: die Haupt-Instanz antwortet unter Last mit 503/504.
const OVERPASS_URLS = process.env.OVERPASS_URL
  ? [process.env.OVERPASS_URL]
  : [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];
const CHUNK = 500;

async function ladeOsm() {
  const fehler = [];
  for (let versuch = 0; versuch < 2; versuch++) {
    for (const url of OVERPASS_URLS) {
      try {
        // Overpass verlangt einen aussagekraeftigen User-Agent (Usage Policy).
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'steakakademie.de Hofladen-Radar (kontakt via steakakademie.de/kontakt)',
          },
          body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
        });
        if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
        const json = await res.json();
        if (!Array.isArray(json.elements)) throw new Error('keine elements im JSON');
        console.log(`Quelle: ${url}`);
        return json.elements;
      } catch (e) {
        fehler.push(`${url} → ${e.message}`);
        console.warn(`Overpass-Versuch fehlgeschlagen: ${url} (${e.message.slice(0, 80)})`);
      }
    }
    await new Promise((r) => setTimeout(r, 30_000));
  }
  throw new Error(`Overpass nicht erreichbar:\n${fehler.join('\n')}`);
}

const de = (n) => String(n).replace('.', ',');

async function main() {
  console.log(`Hofladen-Radar Import${DRY_RUN ? ' (Trockenlauf)' : ''}`);
  const elements = await ladeOsm();
  const { hoefe, bilanz } = hoefeMitBilanz(elements);
  const mitFleisch = hoefe.filter((h) => h.verkauft_fleisch === true).length;
  const mitAdresse = hoefe.filter((h) => h.plz && h.ort).length;
  console.log(`OSM-Elemente: ${elements.length} · brauchbar (mit Name): ${hoefe.length} · Fleisch belegt: ${mitFleisch} · mit PLZ+Ort: ${mitAdresse}`);
  // Was vor dem Schreiben wegfiel — einzeln, mit Zahl (03.10.2026). Ein Hof ausserhalb
  // des Rahmens kostet diesen einen Datensatz, nicht den Lauf.
  const g = DACH_GRENZEN;
  console.log(`Aussortiert: ${bilanz.ausserhalb} ausserhalb des Rahmens (Breite ${de(g.latMin)}–${de(g.latMax)}, Laenge ${de(g.lngMin)}–${de(g.lngMax)}) · ${bilanz.ohneName} ohne Name · ${bilanz.ohneKoordinate} ohne Koordinate · ${bilanz.doppelt} doppelt`);

  // Overpass hat geantwortet, aber nichts Brauchbares geliefert: kein Normalzustand.
  if (hoefe.length === 0) throw new Error('kein einziger brauchbarer Hof in der Overpass-Antwort');

  if (DRY_RUN) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen');
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const r = await schreibeHoefe(hoefe, (zeilen) => admin.rpc('hoefe_import_upsert', { p_rows: zeilen }), { chunk: CHUNK });
  console.log(`Fertig: ${r.eingefuegt} neu · ${r.aktualisiert} aktualisiert · ${r.uebersprungen} uebersprungen (beansprucht/Slug-Konflikt) · ${r.abgelehnt.length} von der Datenbank abgelehnt`);

  if (r.abgelehnt.length > 0) {
    for (const [grund, anzahl] of ablehnungenNachGrund(r.abgelehnt)) console.log(`  abgelehnt wegen ${grund}: ${anzahl}`);
    console.log(`  Beispiele: ${r.abgelehnt.slice(0, 5).map((a) => `${a.name} (${a.osm_id})`).join(' · ')}`);
    const grenzen = r.abgelehnt.some((a) => /^hoefe_(lat|lng)_check$/.test(a.grund));
    // Der Rest ist geschrieben. Rot wird der Lauf trotzdem: Code und Tabelle sind sich
    // uneins, und das behebt kein weiterer Wochenlauf, sondern nur ein Mensch.
    throw new Error(
      `${r.abgelehnt.length} Hoefe von der Datenbank abgelehnt (${r.nachgefahreneBloecke} Bloecke zeilenweise nachgefahren).` +
      (grenzen
        ? ' Die Tabelle hat engere Grenzen als der Code — die Grenzen setzt supabase/migrations/20261003074310_hoefe_grenzen_dach.sql (angewendet 03.10.2026), die Zahlen im Code stehen in src/lib/hoefe/grenzen.json.'
        : ' Code und Tabelle passen nicht zusammen — Ursache am Constraint-Namen oben ablesen.'),
    );
  }
  // Alles gelesen, nichts geschrieben: ein Lauf ohne Ergebnis ist nicht gruen.
  if (r.eingefuegt + r.aktualisiert + r.uebersprungen === 0) throw new Error('kein einziger Hof geschrieben');
}

main().catch((e) => {
  console.error(`Import fehlgeschlagen: ${e.message}`);
  process.exit(1);
});
