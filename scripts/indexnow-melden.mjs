#!/usr/bin/env node
/**
 * IndexNow melden — geänderte URLs nach jedem Produktions-Deploy sofort an
 * Bing (und die übrigen IndexNow-Suchmaschinen) melden (SEO/GEO-Team, 10.10.2026).
 *
 * ANLASS: Bing ist laut docs/geo-baseline.md der stärkste Suchkanal, und die
 * ChatGPT-Suche sowie Copilot stützen sich auf den Bing-Index. Ohne IndexNow
 * wartet eine neue oder geänderte Seite, bis Bing sie selbst wiederfindet.
 * Google nimmt an IndexNow nicht teil — dort bleibt es bei der Sitemap.
 *
 * ABLAUF (Workflow .github/workflows/indexnow.yml, Event deployment_status):
 *   1. Geänderte Dateien des deployten Commits: git diff <sha>^ <sha>.
 *   2. Abbildung auf URLs:
 *      - content/**\/<slug>.mdx       → Sitemap-URLs, deren letztes Segment <slug> ist
 *      - src/app/<pfad>/page.tsx      → /<pfad> (Routengruppen entfernt, keine [dynamischen] Pfade)
 *      - INDEXNOW_URLS (Komma/Leerzeichen) → zusätzlich, für manuelle Meldungen
 *   3. Nur URLs, die in der Live-Sitemap stehen, werden gemeldet. Damit gehen
 *      noindex-Seiten, Bezahl-Lektionen und Tippfehler nie raus.
 *
 * Der Schlüssel ist kein Geheimnis: IndexNow verlangt, dass er öffentlich unter
 * https://steakakademie.de/<SCHLUESSEL>.txt liegt (public/<SCHLUESSEL>.txt).
 *
 * INDEXNOW_PROBELAUF=1 zeigt nur an, was gemeldet würde.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const HOST = 'steakakademie.de';
export const SCHLUESSEL = '6e96368b2f834938f15a7d989f452dd7';
export const ENDPUNKT = 'https://api.indexnow.org/indexnow';
// IndexNow nimmt bis zu 10.000 URLs je Anfrage.
export const MAX_URLS = 10_000;

const BASIS = `https://${HOST}`;

/** Sitemap-Text → Liste der <loc>-Einträge. */
export function locsAus(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

/** src/app/<pfad>/page.tsx → "/<pfad>", sonst null (dynamisch, privat, keine Seite). */
export function routeAusAppDatei(datei) {
  const m = datei.match(/^src\/app\/(?:(.*)\/)?page\.(?:tsx|ts|jsx|js|mdx)$/);
  if (!m) return null;
  const segmente = (m[1] ?? '').split('/').filter(Boolean);
  if (segmente.some((s) => s.startsWith('[') || s.startsWith('@') || s.startsWith('_'))) return null;
  const pfad = segmente.filter((s) => !/^\(.*\)$/.test(s)).join('/');
  return `/${pfad}`;
}

/** content/…/<slug>.mdx → "<slug>", sonst null. */
export function slugAusContentDatei(datei) {
  const m = datei.match(/^content\/.+\/([^/]+)\.mdx?$/);
  return m ? m[1] : null;
}

/**
 * Geänderte Dateien + Sitemap-URLs → zu meldende URLs (sortiert, ohne Doppel).
 * Gemeldet wird nur, was in der Sitemap steht.
 */
export function urlsFuerAenderungen(dateien, sitemapUrls, zusaetzlich = []) {
  const inSitemap = new Set(sitemapUrls);
  const nachSlug = new Map();
  for (const url of sitemapUrls) {
    const letztes = new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
    if (!nachSlug.has(letztes)) nachSlug.set(letztes, []);
    nachSlug.get(letztes).push(url);
  }

  const treffer = new Set();
  for (const datei of dateien.map((d) => d.replace(/\\/g, '/'))) {
    const route = routeAusAppDatei(datei);
    if (route !== null) {
      const url = route === '/' ? `${BASIS}/` : `${BASIS}${route}`;
      for (const kandidat of [url, url.replace(/\/$/, '')]) {
        if (inSitemap.has(kandidat)) treffer.add(kandidat);
      }
      continue;
    }
    const slug = slugAusContentDatei(datei);
    if (slug) for (const url of nachSlug.get(slug) ?? []) treffer.add(url);
  }
  for (const url of zusaetzlich) if (inSitemap.has(url)) treffer.add(url);

  return [...treffer].sort().slice(0, MAX_URLS);
}

/** Request-Body nach IndexNow-Protokoll. */
export function meldung(urls) {
  return {
    host: HOST,
    key: SCHLUESSEL,
    keyLocation: `${BASIS}/${SCHLUESSEL}.txt`,
    urlList: urls,
  };
}

function geaenderteDateien(sha) {
  const r = spawnSync('git', ['diff', '--name-only', `${sha}^`, sha], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git diff fehlgeschlagen: ${r.stderr.trim()}`);
  return r.stdout.split('\n').map((z) => z.trim()).filter(Boolean);
}

async function holeText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'steakakademie-indexnow' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

async function sitemapUrls() {
  const index = await holeText(`${BASIS}/sitemap.xml`);
  const eintraege = locsAus(index);
  // sitemap.xml ist ein Index (sitemap-0.xml …); falls nicht, sind es schon die Seiten.
  if (!/<sitemapindex/.test(index)) return eintraege;
  const teile = await Promise.all(eintraege.map(holeText));
  return teile.flatMap(locsAus);
}

async function main() {
  const sha = process.env.INDEXNOW_SHA || 'HEAD';
  const zusaetzlich = (process.env.INDEXNOW_URLS ?? '').split(/[\s,]+/).filter(Boolean);
  const dateien = geaenderteDateien(sha);
  const urls = urlsFuerAenderungen(dateien, await sitemapUrls(), zusaetzlich);

  console.log(`Commit ${sha}: ${dateien.length} geänderte Dateien → ${urls.length} URLs`);
  for (const url of urls) console.log(`  ${url}`);
  // Regel 10: das Ergebnis steht mit Zahl im Job-Summary, auch wenn es 0 ist.
  const zusammenfassung = (zeile) => {
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${zeile}\n`);
  };
  zusammenfassung(`IndexNow: ${dateien.length} geänderte Dateien → **${urls.length} URLs**`);
  for (const url of urls) zusammenfassung(`- ${url}`);
  if (urls.length === 0) return;

  if (process.env.INDEXNOW_PROBELAUF === '1') {
    console.log('Probelauf — nichts gemeldet.');
    zusammenfassung('Probelauf — nichts gemeldet.');
    return;
  }

  const res = await fetch(ENDPUNKT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(meldung(urls)),
  });
  // 200 = angenommen, 202 = angenommen, Schlüsselprüfung steht noch aus.
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(`IndexNow → HTTP ${res.status}: ${await res.text()}`);
  }
  console.log(`IndexNow → HTTP ${res.status}`);
  zusammenfassung(`IndexNow → HTTP ${res.status}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
