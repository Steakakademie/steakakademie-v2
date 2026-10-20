#!/usr/bin/env node
/**
 * Playlists aus einer Plan-Datei anlegen und befüllen — idempotent (20.10.2026).
 * Vorhandene Playlists (gleicher Titel) werden wiederverwendet, vorhandene Videos nicht doppelt eingefügt.
 *
 * PLAN (privat/youtube/playlists-*.json):
 *   [{ "titel": "...", "beschreibung": "...", "videos": ["<id>", ...] }]
 * AUFRUF:  node scripts/youtube/playlists.mjs --plan <json>              (Probelauf)
 *          node scripts/youtube/playlists.mjs --plan <json> --anwenden
 * KOSTEN:  50 je neue Playlist, 50 je eingefügtes Video.
 */
import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SPRACHE, alle, api, argumente, wurzel } from './lib.mjs';

/** Was fehlt? Liefert je Plan-Eintrag die vorhandene Playlist-ID (oder null) und die fehlenden Videos. */
export function abgleich(plan, vorhanden, inhalt) {
  return plan.map((p) => {
    const pl = vorhanden.find((v) => v.snippet.title === p.titel);
    const drin = new Set(pl ? inhalt[pl.id] ?? [] : []);
    return { ...p, id: pl?.id ?? null, fehlend: p.videos.filter((v) => !drin.has(v)) };
  });
}

async function main() {
  const a = argumente(process.argv.slice(2), ['anwenden']);
  if (!a.plan) throw new Error('--plan <datei.json> fehlt');
  const plan = JSON.parse(readFileSync(isAbsolute(a.plan) ? a.plan : join(wurzel(), a.plan), 'utf8'));
  for (const p of plan) {
    if (!p.titel || p.titel.length > 150 || /[<>]/.test(p.titel + (p.beschreibung ?? ''))) throw new Error(`Ungültiger Playlist-Titel: ${p.titel}`);
  }
  // Achtung: @master_of_steak ist ein persönlicher Kanal — hier hängen auch ~145 private Playlists des
  // Privatkontos (Stand 20.10.2026). Inhalte nur für Playlists mit Plan-Titel laden.
  const titel = new Set(plan.map((p) => p.titel));
  const vorhanden = (await alle('playlists', { part: 'snippet', mine: true, maxResults: 50 })).filter((pl) => titel.has(pl.snippet.title));
  const inhalt = {};
  for (const pl of vorhanden) {
    inhalt[pl.id] = (await alle('playlistItems', { part: 'contentDetails', playlistId: pl.id, maxResults: 50 })).map((i) => i.contentDetails.videoId);
  }
  for (const p of abgleich(plan, vorhanden, inhalt)) {
    console.log(`${p.id ? '=' : '+'} ${p.titel} — ${p.fehlend.length} von ${p.videos.length} Videos fehlen`);
    if (!a.anwenden) continue;
    let id = p.id;
    if (!id) {
      const neu = await api('playlists', {
        method: 'POST',
        params: { part: 'snippet,status' },
        body: { snippet: { title: p.titel, description: p.beschreibung ?? '', defaultLanguage: SPRACHE }, status: { privacyStatus: 'public' } },
      });
      id = neu.id;
    }
    for (const [i, videoId] of p.fehlend.entries()) {
      // Schnelle Einfügungen in dieselbe Playlist beantwortet YouTube zeitweise mit 409/5xx → Pause + Wiederholung.
      for (let versuch = 1; ; versuch++) {
        try {
          await api('playlistItems', { method: 'POST', params: { part: 'snippet' }, body: { snippet: { playlistId: id, resourceId: { kind: 'youtube#video', videoId } } } });
          break;
        } catch (e) {
          if (versuch >= 4 || !/HTTP (409|5\d\d)/.test(e.message)) throw e;
          await new Promise((r) => setTimeout(r, 1500 * versuch));
        }
      }
      await new Promise((r) => setTimeout(r, 400));
      if ((i + 1) % 10 === 0) console.log(`    ${i + 1}/${p.fehlend.length}`);
    }
    console.log(`    ✓ https://www.youtube.com/playlist?list=${id}`);
  }
  if (!a.anwenden) console.log('\nProbelauf — nichts geschrieben.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
