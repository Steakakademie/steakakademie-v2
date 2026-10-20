#!/usr/bin/env node
/**
 * YouTube-Audit — Kanal und alle Videos gegen die Steakakademie-Checkliste prüfen (20.10.2026).
 *
 * AUFRUF:  node scripts/youtube/audit.mjs
 * AUSGABE: privat/youtube/<datum>/audit.md + audit.json (privat/ ist gitignored)
 * KOSTEN:  ~1 Einheit je 50 Videos + 2 — praktisch nichts vom Tageskontingent.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { alle, api, heute, pruefeKanal, pruefeVideo, wurzel, zugang } from './lib.mjs';

const RANG = { hoch: 0, mittel: 1, info: 2 };

export async function audit() {
  const { kanalId } = zugang();
  const k = (await api('channels', { params: { part: 'snippet,brandingSettings,status,statistics,contentDetails', id: kanalId } })).items?.[0];
  if (!k) throw new Error(`Kanal ${kanalId} nicht gefunden`);
  const uploads = k.contentDetails.relatedPlaylists.uploads;
  const ids = (await alle('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: 50 })).map((p) => p.contentDetails.videoId);
  const videos = [];
  for (let i = 0; i < ids.length; i += 50) {
    const j = await api('videos', { params: { part: 'snippet,contentDetails,status,statistics', id: ids.slice(i, i + 50).join(','), maxResults: 50 } });
    videos.push(...(j.items ?? []));
  }
  return { kanal: k, kanalBefunde: pruefeKanal(k), videos: videos.map((v) => ({ ...pruefeVideo(v), veroeffentlicht: v.snippet.publishedAt })) };
}

export function alsMarkdown({ kanal, kanalBefunde, videos }) {
  const zaehl = {};
  for (const v of videos) for (const b of v.befunde) zaehl[b.code] = (zaehl[b.code] ?? 0) + 1;
  const z = [];
  z.push(`# YouTube-Audit ${heute()} — ${kanal.snippet.title} (${kanal.snippet.customUrl ?? kanal.id})`, '');
  z.push(`Abos ${kanal.statistics.subscriberCount} · Aufrufe ${kanal.statistics.viewCount} · Videos ${kanal.statistics.videoCount}`, '');
  z.push('## Kanal', '');
  z.push(...(kanalBefunde.length ? kanalBefunde.map((b) => `- **${b.schwere}** ${b.text}`) : ['- keine Befunde']), '');
  z.push('## Häufigste Befunde über alle Videos', '', '| Befund | Videos |', '|---|---|');
  for (const [code, n] of Object.entries(zaehl).sort((a, b) => b[1] - a[1])) z.push(`| ${code} | ${n}/${videos.length} |`);
  z.push('', '## Videos (nach Aufrufen)', '', '| Aufrufe | Typ | Titel | hoch | mittel |', '|---|---|---|---|---|');
  for (const v of [...videos].sort((a, b) => b.aufrufe - a.aufrufe)) {
    const n = (s) => v.befunde.filter((b) => b.schwere === s).length;
    z.push(`| ${v.aufrufe} | ${v.short ? 'Short' : `${Math.round(v.dauer / 60)} min`} | [${v.titel.replace(/\|/g, '/')}](https://youtu.be/${v.id}) | ${n('hoch')} | ${n('mittel')} |`);
  }
  z.push('', '## Details', '');
  for (const v of videos) {
    z.push(`### ${v.titel} (${v.id})`);
    for (const b of [...v.befunde].sort((a, c) => RANG[a.schwere] - RANG[c.schwere])) z.push(`- ${b.schwere}: ${b.text}`);
    z.push('');
  }
  return z.join('\n');
}

async function main() {
  const erg = await audit();
  const ziel = join(wurzel(), 'privat', 'youtube', heute());
  mkdirSync(ziel, { recursive: true });
  writeFileSync(join(ziel, 'audit.json'), JSON.stringify(erg, null, 2));
  writeFileSync(join(ziel, 'audit.md'), alsMarkdown(erg));
  const hoch = erg.videos.reduce((n, v) => n + v.befunde.filter((b) => b.schwere === 'hoch').length, 0);
  console.log(`${erg.videos.length} Videos geprüft · ${erg.kanalBefunde.length} Kanal-Befunde · ${hoch} hohe Video-Befunde`);
  console.log(`Bericht: ${join(ziel, 'audit.md')}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
