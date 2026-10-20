#!/usr/bin/env node
/**
 * Private Playlists vom Firmenkanal in den Privatkanal kopieren (20.10.2026).
 *
 * ANLASS: @master_of_steak war der persönliche Kanal von u.yendell@gmail.com; mit dem Umzug ins
 * Brand-Konto wanderten ~145 private Playlists mit. Uwe hat am 20.10.2026 freigegeben, welche
 * zurück in den Privatkanal gehen (privat/youtube/playlists-privat-plan.json, aktion "kopieren").
 *
 * VERBINDUNGEN: Quelle = YOUTUBE_REFRESH_TOKEN (Firmenkanal), Ziel = YOUTUBE_PRIVAT_REFRESH_TOKEN.
 * Das Skript bricht ab, wenn beide auf denselben Kanal zeigen.
 *
 * AUFRUF:  node scripts/youtube/playlists-kopieren.mjs                      (Probelauf: zeigt Stand und Restaufwand)
 *          node scripts/youtube/playlists-kopieren.mjs --anwenden [--max-einheiten 8000]
 * Fortsetzbar: Fortschritt steht in privat/youtube/kopie-status.json. Alle Ziel-Playlists sind privat.
 * Gelöscht wird hier NICHTS — die Originale bleiben im Firmenkanal, bis Uwe sie selbst entfernt.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { alle, api, argumente, wurzel, zugang, zugangPrivat } from './lib.mjs';

const KOSTEN_SCHREIBEN = 50;

/** Videos, die noch ins Ziel müssen — in Quell-Reihenfolge, ohne bereits erledigte oder übersprungene. */
export function offeneVideos(quelle, status = {}) {
  const fertig = new Set([...(status.erledigt ?? []), ...(status.uebersprungen ?? [])]);
  return quelle.filter((v) => !fertig.has(v));
}

/** Nicht kopierbar (gelöscht, privat, gesperrt) → überspringen statt abbrechen. */
// Kontingent-/Ratenfehler sind auch 403 — die müssen den Lauf ANHALTEN, nicht das Video überspringen.
export const nichtKopierbar = (msg) =>
  !/quotaExceeded|rateLimitExceeded|dailyLimitExceeded|userRateLimitExceeded/.test(msg) &&
  /HTTP (403|404)\b|videoNotFound|forbidden|playlistItemsNotAccessible/.test(msg);

async function main() {
  const a = argumente(process.argv.slice(2), ['anwenden']);
  const budget = a['max-einheiten'] ? Number(a['max-einheiten']) : 8000;
  const planDatei = join(wurzel(), 'privat', 'youtube', 'playlists-privat-plan.json');
  const statusDatei = join(wurzel(), 'privat', 'youtube', 'kopie-status.json');
  const plan = JSON.parse(readFileSync(planDatei, 'utf8')).playlists.filter((p) => p.aktion === 'kopieren');
  const stand = existsSync(statusDatei) ? JSON.parse(readFileSync(statusDatei, 'utf8')) : {};
  const speichern = () => writeFileSync(statusDatei, JSON.stringify(stand, null, 1));

  const zq = zugang();
  const zz = zugangPrivat();
  const kq = (await api('channels', { params: { part: 'snippet', mine: true }, z: zq })).items?.[0];
  const kz = (await api('channels', { params: { part: 'snippet', mine: true }, z: zz })).items?.[0];
  if (!kq || !kz) throw new Error('Quelle oder Ziel hat keinen Kanal — Anmeldung prüfen');
  if (kq.id === kz.id) throw new Error(`Quelle und Ziel sind derselbe Kanal (${kq.id}) — Abbruch`);
  if (kq.id !== zq.kanalId) throw new Error(`Quelle ist ${kq.id}, erwartet ${zq.kanalId} (Firmenkanal)`);
  console.log(`Quelle: ${kq.snippet.title} (${kq.id}) → Ziel: ${kz.snippet.title} (${kz.id})`);

  let verbraucht = 4;
  let rest = 0;
  for (const p of plan) {
    const s = (stand[p.id] ??= { titel: p.titel, zielId: null, erledigt: [], uebersprungen: [] });
    const quelle = (await alle('playlistItems', { part: 'contentDetails', playlistId: p.id, maxResults: 50 }, { z: zq })).map((i) => i.contentDetails.videoId);
    verbraucht += Math.ceil(quelle.length / 50) || 1;
    const offen = offeneVideos(quelle, s);
    rest += offen.length + (s.zielId ? 0 : 1);
    if (!a.anwenden || (!offen.length && s.zielId)) continue;
    if (verbraucht + KOSTEN_SCHREIBEN > budget) break;
    if (!s.zielId) {
      const neu = await api('playlists', {
        method: 'POST',
        params: { part: 'snippet,status' },
        body: { snippet: { title: p.titel, description: p.beschreibung ?? '' }, status: { privacyStatus: 'private' } },
        z: zz,
      });
      s.zielId = neu.id;
      verbraucht += KOSTEN_SCHREIBEN;
      rest -= 1;
      speichern();
    }
    for (const videoId of offen) {
      if (verbraucht + KOSTEN_SCHREIBEN > budget) break;
      try {
        await api('playlistItems', { method: 'POST', params: { part: 'snippet' }, body: { snippet: { playlistId: s.zielId, resourceId: { kind: 'youtube#video', videoId } } }, z: zz });
        s.erledigt.push(videoId);
      } catch (e) {
        if (!nichtKopierbar(e.message)) { speichern(); throw e; }
        s.uebersprungen.push(videoId);
      }
      verbraucht += KOSTEN_SCHREIBEN;
      rest -= 1;
      speichern();
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  const fertig = plan.filter((p) => stand[p.id]?.zielId && stand[p.id].erledigt.length + stand[p.id].uebersprungen.length >= p.videos).length;
  const uebersprungen = Object.values(stand).reduce((n, s) => n + (s.uebersprungen?.length ?? 0), 0);
  console.log(`${fertig}/${plan.length} Playlists fertig · ${rest} Schritte offen (~${rest * KOSTEN_SCHREIBEN} Einheiten) · ${uebersprungen} Videos nicht kopierbar · diesmal ~${verbraucht} Einheiten`);
  if (!a.anwenden) console.log('Probelauf — nichts geschrieben.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
