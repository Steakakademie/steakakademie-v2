#!/usr/bin/env node
/**
 * Verbindungstest + Kanal-Kurzstatus (Schritt 9 der Einrichtung, 20.10.2026).
 * AUFRUF: node scripts/youtube/status.mjs   → Kanalname, Abos, Aufrufe, Videos, letzte 5 Uploads
 */
import { pathToFileURL } from 'node:url';
import { api, zugang } from './lib.mjs';

async function main() {
  const { kanalId } = zugang();
  const k = (await api('channels', { params: { part: 'snippet,statistics,contentDetails', mine: true } })).items?.[0];
  if (!k) throw new Error('Kein Kanal für dieses Konto — wurde beim Anmelden das richtige Konto gewählt?');
  if (k.id !== kanalId) throw new Error(`Token gehört zu Kanal ${k.id}, erwartet ${kanalId} (@master_of_steak)`);
  console.log(`✓ ${k.snippet.title} (${k.snippet.customUrl}) · ${k.statistics.subscriberCount} Abos · ${k.statistics.viewCount} Aufrufe · ${k.statistics.videoCount} Videos`);
  const neu = await api('playlistItems', { params: { part: 'snippet', playlistId: k.contentDetails.relatedPlaylists.uploads, maxResults: 5 } });
  for (const p of neu.items ?? []) console.log(`  ${p.snippet.publishedAt.slice(0, 10)}  ${p.snippet.title}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
