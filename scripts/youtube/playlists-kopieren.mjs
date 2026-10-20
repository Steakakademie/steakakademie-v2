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

/** YouTube beantwortet schnelle Schreibzugriffe zeitweise mit 409/5xx → bis zu 4 Versuche mit wachsender Pause. */
export async function mitWiederholung(fn, { versuche = 4, pause = 1500 } = {}) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= versuche || !/HTTP (409|5\d\d)\b/.test(e.message)) throw e;
      await new Promise((r) => setTimeout(r, pause * i));
    }
  }
}

/** Videos, die noch ins Ziel müssen — in Quell-Reihenfolge, ohne bereits erledigte oder übersprungene. */
export function offeneVideos(quelle, status = {}) {
  const fertig = new Set([...(status.erledigt ?? []), ...(status.uebersprungen ?? [])]);
  return quelle.filter((v) => !fertig.has(v));
}

/** Das YouTube-Kontingent gilt je Kalendertag in Kalifornien (Reset 0 Uhr Pacific = 8/9 Uhr in Berlin). */
export const kontingentTag = (jetzt = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(jetzt);

/** Duplikate in einer Ziel-Playlist (z. B. wenn ein 409 doch geschrieben hatte und der zweite Versuch erneut). */
export function duplikate(videoIds) {
  const gesehen = new Set();
  return videoIds.filter((v) => (gesehen.has(v) ? true : (gesehen.add(v), false)));
}

/** Nicht kopierbar (gelöscht, privat, gesperrt) → überspringen statt abbrechen. */
// Kontingent-/Ratenfehler sind auch 403 — die müssen den Lauf ANHALTEN, nicht das Video überspringen.
export const nichtKopierbar = (msg) =>
  !/quotaExceeded|rateLimitExceeded|dailyLimitExceeded|userRateLimitExceeded/.test(msg) &&
  /HTTP (403|404)\b|videoNotFound|forbidden|playlistItemsNotAccessible/.test(msg);

async function main() {
  const a = argumente(process.argv.slice(2), ['anwenden', 'pruefen']);
  const tagesBudget = a['max-einheiten'] ? Number(a['max-einheiten']) : 8000;
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

  if (a.pruefen) {
    // Ziel-Playlists gegen Duplikate prüfen (nur lesen, ~1 Einheit je Liste).
    let gesamt = 0;
    for (const s of Object.values(stand)) {
      if (!s?.zielId) continue;
      const ziel = (await alle('playlistItems', { part: 'contentDetails', playlistId: s.zielId, maxResults: 50 }, { z: zz })).map((i) => i.contentDetails.videoId);
      const d = duplikate(ziel);
      if (d.length) console.log(`Duplikate in „${s.titel}“: ${d.join(', ')}`);
      gesamt += d.length;
    }
    console.log(`Duplikatprüfung: ${gesamt} Duplikate.`);
    return;
  }

  // Tagesbudget über alle Aufrufe eines Kontingent-Tages hinweg (Stand in kopie-status.json → _tag).
  const tag = kontingentTag();
  if (stand._tag?.tag !== tag) stand._tag = { tag, verbraucht: 0 };
  const budget = Math.max(0, tagesBudget - stand._tag.verbraucht);
  // Zeitlimit je Aufruf: device_bash bricht nach 180 s ab → Portionen, Fortsetzung beim nächsten Aufruf.
  const ende = Date.now() + (a['max-sekunden'] ? Number(a['max-sekunden']) : 140) * 1000;
  let verbraucht = 4;
  const speichernMitBudget = () => { stand._tag.verbraucht = tagesBudget - budget + verbraucht; speichern(); };
  let zeitUm = false;
  for (const p of plan) {
    const s = (stand[p.id] ??= { titel: p.titel, zielId: null, erledigt: [], uebersprungen: [], fertig: false });
    if (s.fertig || !a.anwenden) continue;
    if (Date.now() > ende) { zeitUm = true; break; }
    if (verbraucht + KOSTEN_SCHREIBEN > budget) break;
    const quelle = (await alle('playlistItems', { part: 'contentDetails', playlistId: p.id, maxResults: 50 }, { z: zq })).map((i) => i.contentDetails.videoId);
    verbraucht += Math.ceil(quelle.length / 50) || 1;
    const offen = offeneVideos(quelle, s);
    if (!s.zielId) {
      const neu = await mitWiederholung(() => api('playlists', {
        method: 'POST',
        params: { part: 'snippet,status' },
        body: { snippet: { title: p.titel, description: p.beschreibung ?? '' }, status: { privacyStatus: 'private' } },
        z: zz,
      }));
      s.zielId = neu.id;
      verbraucht += KOSTEN_SCHREIBEN;
      speichernMitBudget();
    }
    let abgebrochen = false;
    for (const videoId of offen) {
      if (verbraucht + KOSTEN_SCHREIBEN > budget || Date.now() > ende) { abgebrochen = true; zeitUm = Date.now() > ende; break; }
      try {
        await mitWiederholung(() => api('playlistItems', { method: 'POST', params: { part: 'snippet' }, body: { snippet: { playlistId: s.zielId, resourceId: { kind: 'youtube#video', videoId } } }, z: zz }));
        s.erledigt.push(videoId);
      } catch (e) {
        if (!nichtKopierbar(e.message)) {
          speichernMitBudget();
          // Kontingent leer → für heute als verbraucht markieren, der nächste Aufruf wartet auf den Reset.
          if (/quotaExceeded|dailyLimitExceeded/.test(e.message)) { stand._tag.verbraucht = tagesBudget; speichern(); }
          throw e;
        }
        s.uebersprungen.push(videoId);
      }
      verbraucht += KOSTEN_SCHREIBEN;
      speichernMitBudget();
      await new Promise((r) => setTimeout(r, 300));
    }
    if (!abgebrochen) { s.fertig = true; speichernMitBudget(); }
    else break;
  }
  // Bilanz aus Plan + Status (ohne weitere API-Aufrufe).
  const fertig = plan.filter((p) => stand[p.id]?.fertig).length;
  const offenSchritte = plan.reduce((n, p) => {
    const s = stand[p.id];
    if (s?.fertig) return n;
    return n + (s?.zielId ? 0 : 1) + Math.max(0, p.videos - (s?.erledigt.length ?? 0) - (s?.uebersprungen.length ?? 0));
  }, 0);
  const uebersprungen = Object.values(stand).reduce((n, s) => n + (s.uebersprungen?.length ?? 0), 0);
  console.log(`${fertig}/${plan.length} Playlists fertig · ~${offenSchritte} Schritte offen (~${offenSchritte * KOSTEN_SCHREIBEN} Einheiten) · ${uebersprungen} Videos nicht kopierbar · diesmal ~${verbraucht} Einheiten${zeitUm ? ' · Zeitlimit erreicht, erneut aufrufen' : ''}`);
  if (a.anwenden) {
    const rest = Math.max(0, tagesBudget - stand._tag.verbraucht);
    console.log(`Kontingent-Tag ${tag}: ${stand._tag.verbraucht} von ${tagesBudget} Einheiten verbraucht${rest < KOSTEN_SCHREIBEN ? ' · TAGESBUDGET ERSCHÖPFT, morgen weiter' : ''}`);
  } else console.log('Probelauf — nichts geschrieben.');
  if (fertig === plan.length) console.log('ALLES KOPIERT.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
