#!/usr/bin/env node
/**
 * Metadaten-Änderungen aus einer Plan-Datei anwenden (20.10.2026).
 *
 * PLAN (JSON, gehört nach privat/youtube/…):
 *   [{ "id": "<videoId>", "title"?: "...", "description"?: "...", "tags"?: [...],
 *      "categoryId"?: "26", "defaultLanguage"?: "de", "defaultAudioLanguage"?: "de",
 *      "containsSyntheticMedia"?: true|false }]
 *
 * AUFRUF:  node scripts/youtube/metadaten.mjs --plan privat/youtube/plan.json            (Probelauf, Diff)
 *          node scripts/youtube/metadaten.mjs --plan privat/youtube/plan.json --anwenden
 * SICHERUNG: Vor jedem Schreiben landet der Ist-Stand in privat/youtube/<datum>/sicherung-<zeit>.json.
 * KOSTEN:  50 Einheiten je Video (Tageskontingent 10.000 → max. ~190 Videos/Tag).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { api, argumente, heute, neuesSnippet, wurzel } from './lib.mjs';

const SNIPPET_FELDER = ['title', 'description', 'tags', 'categoryId', 'defaultLanguage', 'defaultAudioLanguage'];

export function diff(alt, neu) {
  return SNIPPET_FELDER.filter((k) => JSON.stringify(alt[k] ?? null) !== JSON.stringify(neu[k] ?? null))
    .map((k) => ({ feld: k, alt: alt[k], neu: neu[k] }));
}

async function main() {
  const a = argumente(process.argv.slice(2), ['anwenden']);
  if (!a.plan) throw new Error('--plan <datei.json> fehlt');
  const pfad = isAbsolute(a.plan) ? a.plan : join(wurzel(), a.plan);
  const plan = JSON.parse(readFileSync(pfad, 'utf8'));
  const ids = plan.map((p) => p.id);
  const ist = [];
  for (let i = 0; i < ids.length; i += 50) {
    ist.push(...((await api('videos', { params: { part: 'snippet,status', id: ids.slice(i, i + 50).join(',') } })).items ?? []));
  }
  const nachId = new Map(ist.map((v) => [v.id, v]));
  const ziel = join(wurzel(), 'privat', 'youtube', heute());
  mkdirSync(ziel, { recursive: true });
  if (a.anwenden) writeFileSync(join(ziel, `sicherung-${Date.now()}.json`), JSON.stringify(ist, null, 2));

  let geaendert = 0;
  for (const p of plan) {
    const v = nachId.get(p.id);
    if (!v) { console.log(`✗ ${p.id}: nicht gefunden`); continue; }
    const { id, containsSyntheticMedia, ...felder } = p;
    const neu = neuesSnippet(v.snippet, felder);
    const d = diff(v.snippet, neu);
    // videos.list liefert containsSyntheticMedia nicht zurück → bei Angabe im Plan immer mitsenden.
    const statusNeu = containsSyntheticMedia !== undefined;
    if (!d.length && !statusNeu) { console.log(`= ${id}: keine Änderung`); continue; }
    console.log(`~ ${id} „${v.snippet.title}“`);
    for (const x of d) console.log(`    ${x.feld}: ${JSON.stringify(x.alt)?.slice(0, 120)} → ${JSON.stringify(x.neu)?.slice(0, 120)}`);
    if (statusNeu) console.log(`    containsSyntheticMedia → ${containsSyntheticMedia} (nicht auslesbar, wird gesetzt)`);
    if (!a.anwenden) continue;
    const teile = ['snippet'];
    const body = { id, snippet: neu };
    if (statusNeu) {
      teile.push('status');
      body.status = {
        privacyStatus: v.status.privacyStatus,
        embeddable: v.status.embeddable,
        license: v.status.license,
        publicStatsViewable: v.status.publicStatsViewable,
        selfDeclaredMadeForKids: v.status.selfDeclaredMadeForKids ?? false,
        containsSyntheticMedia,
        ...(v.status.publishAt ? { publishAt: v.status.publishAt } : {}),
      };
    }
    await api('videos', { method: 'PUT', params: { part: teile.join(',') }, body });
    geaendert++;
  }
  console.log(a.anwenden ? `\n${geaendert} Videos aktualisiert.` : '\nProbelauf — nichts geschrieben. Mit --anwenden ausführen.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
