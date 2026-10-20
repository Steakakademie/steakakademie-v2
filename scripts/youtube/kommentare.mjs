#!/usr/bin/env node
/**
 * Unbeantwortete Kommentare finden (20.10.2026). Antworten schreibt das Skript NICHT —
 * Antworten gehen nur nach Freigabe raus (öffentlich sichtbar, im Namen der Steakakademie).
 *
 * AUFRUF:  node scripts/youtube/kommentare.mjs [--tage 30]
 */
import { pathToFileURL } from 'node:url';
import { alle, argumente, zugang } from './lib.mjs';

/** Threads ohne Antwort des Kanals selbst. */
export function offen(threads, kanalId, seit) {
  return threads.filter((t) => {
    const top = t.snippet.topLevelComment.snippet;
    if (top.authorChannelId?.value === kanalId) return false;
    if (seit && new Date(top.publishedAt) < seit) return false;
    const antworten = t.replies?.comments ?? [];
    return !antworten.some((c) => c.snippet.authorChannelId?.value === kanalId);
  });
}

async function main() {
  const a = argumente(process.argv.slice(2));
  const tage = a.tage ? Number(a.tage) : 30;
  const { kanalId } = zugang();
  const threads = await alle('commentThreads', { part: 'snippet,replies', allThreadsRelatedToChannelId: kanalId, maxResults: 100, order: 'time' }, { max: 1000 });
  const liste = offen(threads, kanalId, new Date(Date.now() - tage * 86_400_000));
  console.log(`${threads.length} Kommentar-Threads gesamt · ${liste.length} unbeantwortet (letzte ${tage} Tage)`);
  for (const t of liste) {
    const s = t.snippet.topLevelComment.snippet;
    console.log(`\n[${s.publishedAt.slice(0, 10)}] https://youtu.be/${t.snippet.videoId} — ${s.authorDisplayName}:\n  ${s.textOriginal.replace(/\s+/g, ' ').slice(0, 300)}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
