#!/usr/bin/env node
/**
 * YouTube-Analytics — die Zahlen, an denen Optimierung sich messen lässt (20.10.2026).
 *
 * AUFRUF:  node scripts/youtube/analytics.mjs [--tage 90]
 * AUSGABE: privat/youtube/<datum>/analytics-<tage>t.json + Zusammenfassung auf der Konsole
 * INHALT:  Summen, Top-Videos, Traffic-Quellen, YouTube-Suchbegriffe, externe Quellen,
 *          Länder, Geräte, Abonnenten-Herkunft. YouTube Analytics liefert mit 2–3 Tagen Verzug.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { argumente, bericht, heute, wurzel } from './lib.mjs';

const tag = (d) => d.toISOString().slice(0, 10);

export function zeitraum(tage, jetzt = new Date()) {
  if (!Number.isInteger(tage) || tage < 1 || tage > 3650) throw new Error('--tage: 1 bis 3650');
  const ende = new Date(jetzt.getTime() - 2 * 86_400_000);
  return { startDate: tag(new Date(ende.getTime() - (tage - 1) * 86_400_000)), endDate: tag(ende) };
}

export async function analytics(tage) {
  const z = zeitraum(tage);
  const m = 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares';
  const sicher = async (p) => { try { return await bericht({ ...z, ...p }); } catch (e) { return { fehler: e.message }; } };
  return {
    zeitraum: z,
    summe: await sicher({ metrics: m }),
    topVideos: await sicher({ dimensions: 'video', metrics: 'views,estimatedMinutesWatched,averageViewPercentage,subscribersGained', sort: '-views', maxResults: 25 }),
    trafficQuellen: await sicher({ dimensions: 'insightTrafficSourceType', metrics: 'views,estimatedMinutesWatched', sort: '-views' }),
    suchbegriffe: await sicher({ dimensions: 'insightTrafficSourceDetail', filters: 'insightTrafficSourceType==YT_SEARCH', metrics: 'views', sort: '-views', maxResults: 25 }),
    externeQuellen: await sicher({ dimensions: 'insightTrafficSourceDetail', filters: 'insightTrafficSourceType==EXT_URL', metrics: 'views', sort: '-views', maxResults: 25 }),
    formate: await sicher({ dimensions: 'creatorContentType', metrics: 'views,estimatedMinutesWatched,averageViewPercentage', sort: '-views' }),
    laender: await sicher({ dimensions: 'country', metrics: 'views', sort: '-views', maxResults: 10 }),
    geraete: await sicher({ dimensions: 'deviceType', metrics: 'views', sort: '-views' }),
    // Tagesverlauf statt Monat: die month-Dimension verlangt Monatsanfang/-ende als Grenzen.
    verlaufTag: await sicher({ dimensions: 'day', metrics: 'views,subscribersGained', sort: 'day' }),
  };
}

async function main() {
  const a = argumente(process.argv.slice(2));
  const tage = a.tage ? Number(a.tage) : 90;
  const erg = await analytics(tage);
  const ziel = join(wurzel(), 'privat', 'youtube', heute());
  mkdirSync(ziel, { recursive: true });
  writeFileSync(join(ziel, `analytics-${tage}t.json`), JSON.stringify(erg, null, 2));
  console.log(`Zeitraum ${erg.zeitraum.startDate} bis ${erg.zeitraum.endDate}`);
  for (const [k, v] of Object.entries(erg)) {
    if (k === 'zeitraum') continue;
    console.log(`\n## ${k}`);
    if (v.fehler) console.log(`  Fehler: ${v.fehler}`);
    else for (const z of v.slice(0, 12)) console.log('  ' + Object.values(z).join(' · '));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
