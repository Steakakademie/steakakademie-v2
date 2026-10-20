#!/usr/bin/env node
/**
 * Kanal-Branding (Beschreibung, Keywords, Sprache, Land) aus einer JSON-Datei setzen (20.10.2026).
 *
 * DATEI (privat/youtube/kanal-*.json): { "description": "...", "keywords": "...", "defaultLanguage": "de", "country": "DE" }
 * AUFRUF:  node scripts/youtube/kanal.mjs --datei privat/youtube/kanal.json              (Probelauf)
 *          node scripts/youtube/kanal.mjs --datei privat/youtube/kanal.json --anwenden
 * Der Kanalname lässt sich per API nicht ändern (nur im YouTube Studio).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { api, argumente, heute, pruefeKanal, wurzel, zugang } from './lib.mjs';

const FELDER = ['description', 'keywords', 'defaultLanguage', 'country', 'unsubscribedTrailer'];

async function main() {
  const a = argumente(process.argv.slice(2), ['anwenden']);
  if (!a.datei) throw new Error('--datei fehlt');
  const neu = JSON.parse(readFileSync(isAbsolute(a.datei) ? a.datei : join(wurzel(), a.datei), 'utf8'));
  if ((neu.description ?? '').length > 1000) throw new Error('Kanalbeschreibung > 1.000 Zeichen');
  if (/[<>]/.test(neu.description ?? '')) throw new Error('< und > sind nicht erlaubt');
  const { kanalId } = zugang();
  const k = (await api('channels', { params: { part: 'brandingSettings', id: kanalId } })).items[0];
  const alt = k.brandingSettings.channel ?? {};
  const kanal = { ...alt };
  for (const f of FELDER) if (neu[f] !== undefined) kanal[f] = neu[f];
  for (const f of FELDER) if (JSON.stringify(alt[f]) !== JSON.stringify(kanal[f])) console.log(`${f}:\n  alt: ${JSON.stringify(alt[f])}\n  neu: ${JSON.stringify(kanal[f])}`);
  const rest = pruefeKanal({ brandingSettings: { channel: kanal } });
  console.log(`\nVerbleibende Befunde: ${rest.map((b) => b.code).join(', ') || 'keine'}`);
  if (!a.anwenden) { console.log('Probelauf — nichts geschrieben.'); return; }
  const ziel = join(wurzel(), 'privat', 'youtube', heute());
  mkdirSync(ziel, { recursive: true });
  writeFileSync(join(ziel, `kanal-sicherung-${Date.now()}.json`), JSON.stringify(k, null, 2));
  await api('channels', { method: 'PUT', params: { part: 'brandingSettings' }, body: { id: kanalId, brandingSettings: { ...k.brandingSettings, channel: kanal } } });
  console.log('✓ Kanal aktualisiert.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
