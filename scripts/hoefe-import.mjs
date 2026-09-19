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
 * Voraussetzung: supabase/migrations/20260913120000_hoefe.sql eingespielt.
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
import { OVERPASS_QUERY, hoefeAusElementen } from './lib/hoefe-osm.mjs';

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

async function main() {
  console.log(`Hofladen-Radar Import${DRY_RUN ? ' (Trockenlauf)' : ''}`);
  const elements = await ladeOsm();
  const hoefe = hoefeAusElementen(elements);
  const mitFleisch = hoefe.filter((h) => h.verkauft_fleisch === true).length;
  const mitAdresse = hoefe.filter((h) => h.plz && h.ort).length;
  console.log(`OSM-Elemente: ${elements.length} · brauchbar (mit Name): ${hoefe.length} · Fleisch belegt: ${mitFleisch} · mit PLZ+Ort: ${mitAdresse}`);

  if (DRY_RUN) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen');
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  let eingefuegt = 0, aktualisiert = 0, uebersprungen = 0;
  for (let i = 0; i < hoefe.length; i += CHUNK) {
    const teil = hoefe.slice(i, i + CHUNK);
    const { data, error } = await admin.rpc('hoefe_import_upsert', { p_rows: teil });
    if (error) throw new Error(`Upsert Chunk ${i / CHUNK + 1}: ${error.message}`);
    const r = Array.isArray(data) ? data[0] : data;
    eingefuegt += r?.eingefuegt ?? 0;
    aktualisiert += r?.aktualisiert ?? 0;
    uebersprungen += r?.uebersprungen ?? 0;
  }
  console.log(`Fertig: ${eingefuegt} neu · ${aktualisiert} aktualisiert · ${uebersprungen} uebersprungen (beansprucht/Slug-Konflikt)`);
}

main().catch((e) => {
  console.error(`Import fehlgeschlagen: ${e.message}`);
  process.exit(1);
});
