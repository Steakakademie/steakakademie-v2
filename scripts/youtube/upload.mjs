#!/usr/bin/env node
/**
 * Video hochladen — Standard PRIVAT bzw. geplant, nie sofort öffentlich (20.10.2026).
 *
 * AUFRUF:
 *   node scripts/youtube/upload.mjs --datei video/out/x.mp4 --titel "..." --beschreibung-datei privat/youtube/x.txt \
 *        [--tags "a,b,c"] [--veroeffentlichen-am 2026-10-25T17:00:00+02:00] [--thumbnail x.jpg] \
 *        --ki ja|nein [--playlist <id>] [--probelauf]
 *
 * PFLICHT: --ki. „ja“, sobald KI-Bild, -Video oder -Stimme realistisch wirkt (YouTube-Richtlinie
 *          „veränderte oder synthetische Inhalte“ + Art. 50 KI-VO). Ohne Angabe bricht das Skript ab.
 * KOSTEN:  Upload im eigenen Kontingent-Topf; thumbnails.set 50 Einheiten, playlistItems.insert 50.
 */
import { readFileSync, statSync } from 'node:fs';
import { basename, extname, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { KATEGORIE_HOWTO, SPRACHE, WEBSITE, api, argumente, neuesSnippet, token, wurzel } from './lib.mjs';

const MIME = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mkv': 'video/x-matroska' };
const BILD = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

export function baueMetadaten({ titel, beschreibung, tags = [], veroeffentlichenAm, ki }) {
  if (ki !== 'ja' && ki !== 'nein') throw new Error('--ki ja|nein ist Pflicht (KI-Kennzeichnung)');
  if (!beschreibung.includes('steakakademie.de')) beschreibung += `\n\n🔥 Mehr Wissen, Diplom & Newsletter: ${WEBSITE}`;
  if (veroeffentlichenAm && !(new Date(veroeffentlichenAm) > new Date())) throw new Error('--veroeffentlichen-am muss in der Zukunft liegen');
  return {
    snippet: neuesSnippet({ title: titel, description: beschreibung, tags, categoryId: KATEGORIE_HOWTO, defaultLanguage: SPRACHE, defaultAudioLanguage: SPRACHE }, {}),
    status: {
      privacyStatus: 'private',
      ...(veroeffentlichenAm ? { publishAt: new Date(veroeffentlichenAm).toISOString() } : {}),
      selfDeclaredMadeForKids: false,
      embeddable: true,
      license: 'youtube',
      containsSyntheticMedia: ki === 'ja',
    },
  };
}

async function main() {
  const a = argumente(process.argv.slice(2), ['probelauf']);
  const abs = (p) => (isAbsolute(p) ? p : join(wurzel(), p));
  if (!a.datei || !a.titel) throw new Error('--datei und --titel sind Pflicht');
  const datei = abs(a.datei);
  const typ = MIME[extname(datei).toLowerCase()];
  if (!typ) throw new Error(`Dateityp ${extname(datei)} nicht unterstützt`);
  const beschreibung = a['beschreibung-datei'] ? readFileSync(abs(a['beschreibung-datei']), 'utf8') : (a.beschreibung ?? '');
  const meta = baueMetadaten({
    titel: a.titel,
    beschreibung,
    tags: a.tags ? a.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    veroeffentlichenAm: a['veroeffentlichen-am'],
    ki: a.ki,
  });
  const groesse = statSync(datei).size;
  console.log(`${basename(datei)} · ${(groesse / 1e6).toFixed(1)} MB · ${meta.status.publishAt ? `geplant ${meta.status.publishAt}` : 'privat'} · KI ${a.ki}`);
  if (a.probelauf) { console.log(JSON.stringify(meta, null, 2)); return; }

  // Resumable Upload: erst Sitzung anlegen, dann Datei in einem Stück senden.
  const start = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${await token()}`,
      'content-type': 'application/json; charset=UTF-8',
      'x-upload-content-type': typ,
      'x-upload-content-length': String(groesse),
    },
    body: JSON.stringify(meta),
  });
  if (!start.ok) throw new Error(`Upload-Sitzung: HTTP ${start.status} ${(await start.text()).slice(0, 300)}`);
  const ziel = start.headers.get('location');
  const r = await fetch(ziel, { method: 'PUT', headers: { 'content-type': typ, 'content-length': String(groesse) }, body: readFileSync(datei) });
  const v = await r.json();
  if (!r.ok) throw new Error(`Upload: HTTP ${r.status} ${JSON.stringify(v.error ?? v).slice(0, 300)}`);
  console.log(`✓ hochgeladen: https://youtu.be/${v.id} (${v.status.privacyStatus})`);

  if (a.thumbnail) {
    const bild = abs(a.thumbnail);
    const t = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${v.id}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${await token()}`, 'content-type': BILD[extname(bild).toLowerCase()] ?? 'image/jpeg' },
      body: readFileSync(bild),
    });
    console.log(t.ok ? '✓ Thumbnail gesetzt' : `✗ Thumbnail: HTTP ${t.status} (Kanal braucht ggf. Telefon-Bestätigung)`);
  }
  if (a.playlist) {
    await api('playlistItems', { method: 'POST', params: { part: 'snippet' }, body: { snippet: { playlistId: a.playlist, resourceId: { kind: 'youtube#video', videoId: v.id } } } });
    console.log('✓ zur Playlist hinzugefügt');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
