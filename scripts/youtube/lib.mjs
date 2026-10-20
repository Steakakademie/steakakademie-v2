/**
 * YouTube-Anbindung der Steakakademie — gemeinsame Bausteine (20.10.2026).
 *
 * ZUGANG (einmalig eingerichtet am 20.10.2026, Anleitung: docs/youtube-anbindung.md):
 *   Google-Cloud-Projekt „steakakademie“ (steakakademie@gmail.com), OAuth-Client
 *   „Claude YouTube Connector“ (Desktop), App-Status „In Produktion“ (Token läuft nicht nach 7 Tagen ab).
 *   Autorisiert hat u.yendell@gmail.com — dem Konto gehört der Kanal @master_of_steak.
 *
 *   .env.local (gitignored, nie committen, nie loggen):
 *     YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN, YOUTUBE_CHANNEL_ID
 *
 * Kontingent (Stand Google-Doku 20.10.2026): 10.000 Einheiten/Tag im allgemeinen Topf
 * (Lesen kostet 1 Einheit je Aufruf, Schreiben 50), Uploads laufen über einen eigenen Topf.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const DATA_API = 'https://www.googleapis.com/youtube/v3';
export const ANALYTICS_API = 'https://youtubeanalytics.googleapis.com/v2/reports';
export const WEBSITE = 'https://steakakademie.de';
/** YouTube-Kategorie „Howto & Style“ — passt für Lerninhalte rund ums Grillen. */
export const KATEGORIE_HOWTO = '26';
export const SPRACHE = 'de';

/** Repo-Wurzel: SA_WURZEL (für Läufe außerhalb des Repos) oder zwei Ebenen über diesem Skript. */
export function wurzel() {
  return process.env.SA_WURZEL || join(dirname(fileURLToPath(import.meta.url)), '..', '..');
}

/** Wert aus der Umgebung oder aus .env.local (wie scripts/gsc-abruf.mjs). */
export function wert(name, basis = wurzel()) {
  if (process.env[name]) return process.env[name].trim();
  const datei = join(basis, '.env.local');
  if (!existsSync(datei)) return undefined;
  const zeile = readFileSync(datei, 'utf8').split(/\r?\n/).find((z) => z.startsWith(`${name}=`));
  return zeile ? zeile.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') || undefined : undefined;
}

export function zugang(basis = wurzel()) {
  const z = {
    clientId: wert('YOUTUBE_CLIENT_ID', basis),
    clientSecret: wert('YOUTUBE_CLIENT_SECRET', basis),
    refreshToken: wert('YOUTUBE_REFRESH_TOKEN', basis),
    kanalId: wert('YOUTUBE_CHANNEL_ID', basis),
  };
  const fehlt = Object.entries(z).filter(([, v]) => !v).map(([k]) => k);
  if (fehlt.length) throw new Error(`YouTube-Zugang unvollständig in .env.local: ${fehlt.join(', ')} (docs/youtube-anbindung.md)`);
  return z;
}

let cache = null;
/** Frisches Zugriffstoken über den Refresh-Token. Fehlertexte enthalten nie Geheimnisse. */
export async function token(z = zugang(), f = fetch) {
  if (cache && cache.bis > Date.now() + 60_000) return cache.wert;
  const r = await f(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: z.clientId,
      client_secret: z.clientSecret,
      refresh_token: z.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) {
    const grund = j.error === 'invalid_grant'
      ? 'Refresh-Token ungültig oder widerrufen — Anmeldung neu durchführen (docs/youtube-anbindung.md)'
      : `Token-Abruf fehlgeschlagen (HTTP ${r.status}${j.error ? `, ${j.error}` : ''})`;
    throw new Error(grund);
  }
  cache = { wert: j.access_token, bis: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return cache.wert;
}

/** Aufruf der Data API. Bei Fehlern nur Status + API-Grund, nie der Token. */
export async function api(pfad, { params = {}, method = 'GET', body, f = fetch, basis = DATA_API } = {}) {
  const url = new URL(`${basis}/${pfad}`.replace(/\/+$/, ''));
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  const r = await f(url, {
    method,
    headers: { authorization: `Bearer ${await token(undefined, f)}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const grund = j.error?.errors?.[0]?.reason || j.error?.status || '';
    throw new Error(`${method} ${pfad}: HTTP ${r.status} ${grund} ${j.error?.message ?? ''}`.trim());
  }
  return j;
}

/** Alle Seiten einer list-Methode einsammeln. */
export async function alle(pfad, params, { max = 5000, f } = {}) {
  const items = [];
  let pageToken;
  do {
    const j = await api(pfad, { params: { ...params, pageToken }, f });
    items.push(...(j.items ?? []));
    pageToken = j.nextPageToken;
  } while (pageToken && items.length < max);
  return items;
}

/** Analytics-Bericht (Zeilen als Objekte mit Spaltennamen). */
export async function bericht(params, { f } = {}) {
  const j = await api('', { params: { ids: 'channel==MINE', ...params }, basis: ANALYTICS_API, f });
  const spalten = (j.columnHeaders ?? []).map((c) => c.name);
  return (j.rows ?? []).map((zeile) => Object.fromEntries(zeile.map((w, i) => [spalten[i], w])));
}

/** ISO-8601-Dauer (PT1H2M3S) → Sekunden. */
export function sekunden(iso = '') {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso);
  if (!m) return 0;
  const [, d = 0, h = 0, mi = 0, s = 0] = m.map((x) => Number(x ?? 0));
  return d * 86400 + h * 3600 + mi * 60 + s;
}

/** Kapitelmarken: YouTube verlangt mind. 3 Zeitstempel, der erste bei 0:00, je mind. 10 s Abstand. */
export function hatKapitel(beschreibung = '') {
  const marken = [...beschreibung.matchAll(/^\s*\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?\s+\S/gm)].map((m) => m[1]);
  if (marken.length < 3) return false;
  const sek = marken.map((t) => t.split(':').map(Number).reduce((a, b) => a * 60 + b, 0));
  if (sek[0] !== 0) return false;
  return sek.every((s, i) => i === 0 || s - sek[i - 1] >= 10);
}

/** Kurzvideo? YouTube zählt seit Okt. 2024 Hochformat-Videos bis 3 Minuten als Shorts. */
export const istShort = (dauerSek) => dauerSek > 0 && dauerSek <= 180;

/**
 * Prüft ein Video (Ressource mit snippet, contentDetails, status, statistics) und liefert Befunde.
 * schwere: 'hoch' = kostet messbar Reichweite, 'mittel' = verschenktes Potenzial, 'info'.
 */
export function pruefeVideo(v) {
  const b = [];
  const s = v.snippet ?? {};
  const st = v.status ?? {};
  const dauer = sekunden(v.contentDetails?.duration);
  const short = istShort(dauer);
  const titel = s.title ?? '';
  const text = s.description ?? '';
  const add = (schwere, code, text) => b.push({ schwere, code, text });

  if (st.privacyStatus !== 'public') add('info', 'nicht-oeffentlich', `Status: ${st.privacyStatus}`);
  if (titel.length < 25) add('mittel', 'titel-kurz', `Titel nur ${titel.length} Zeichen — Suchbegriff + Nutzen fehlen vermutlich`);
  if (titel.length > 70) add('mittel', 'titel-lang', `Titel ${titel.length} Zeichen — wird in Suche/Empfehlungen abgeschnitten (Kern in die ersten 50–60)`);
  if (/^[A-ZÄÖÜ0-9\s!?.,:-]{12,}$/.test(titel)) add('mittel', 'titel-versal', 'Titel komplett in Großbuchstaben');
  if (text.trim().length < 150) add('hoch', 'beschreibung-duenn', `Beschreibung nur ${text.trim().length} Zeichen — YouTube und Google verstehen das Thema kaum`);
  if (!/steakakademie\.de/i.test(text)) add('hoch', 'kein-website-link', 'Kein Link zu steakakademie.de — kein Traffic auf Website/Diplom/Newsletter');
  if (!short && dauer >= 120 && !hatKapitel(text)) add('mittel', 'keine-kapitel', 'Keine Kapitelmarken (ab 2 Min. sinnvoll; Kapitel erscheinen in der Google-Suche)');
  if (!(s.tags?.length)) add('mittel', 'keine-tags', 'Keine Tags (Rechtschreibvarianten/Synonyme fehlen)');
  if (s.categoryId && s.categoryId !== KATEGORIE_HOWTO) add('mittel', 'kategorie', `Kategorie ${s.categoryId} statt 26 „Howto & Style“`);
  if (!s.defaultLanguage) add('mittel', 'keine-sprache', 'Titel-/Beschreibungssprache nicht gesetzt');
  if (!s.defaultAudioLanguage) add('mittel', 'keine-audiosprache', 'Audiosprache nicht gesetzt (wichtig für Untertitel/Auto-Dubbing)');
  if (!/#\w/.test(text) && !/#\w/.test(titel)) add('info', 'keine-hashtags', 'Keine Hashtags');
  if (st.selfDeclaredMadeForKids || st.madeForKids) add('hoch', 'kinder', 'Als „speziell für Kinder“ markiert — Kommentare/Empfehlungen eingeschränkt');
  if (st.embeddable === false) add('mittel', 'nicht-einbettbar', 'Einbetten deaktiviert');
  // status.containsSyntheticMedia liefert videos.list nicht zurück (Stand 20.10.2026) — nur schreibbar, nicht prüfbar.
  if (!/mit KI erzeugt|KI-generiert/i.test(text)) add('info', 'kein-ki-hinweis', 'Kein KI-Hinweis in der Beschreibung — bei KI-Bild/-Stimme Pflicht (Art. 50 KI-VO, YouTube-Richtlinie)');
  return { id: v.id, titel, dauer, short, aufrufe: Number(v.statistics?.viewCount ?? 0), befunde: b };
}

/** Kanal-Prüfung (brandingSettings, snippet, status). */
export function pruefeKanal(k) {
  const b = [];
  const add = (schwere, code, text) => b.push({ schwere, code, text });
  const besch = k.brandingSettings?.channel?.description ?? k.snippet?.description ?? '';
  const kw = k.brandingSettings?.channel?.keywords ?? '';
  if (besch.length < 300) add('hoch', 'kanal-beschreibung-kurz', `Kanalbeschreibung ${besch.length} Zeichen — Ziel 600–1.000 mit Suchbegriffen in den ersten 150`);
  if (!/steakakademie\.de/i.test(besch)) add('hoch', 'kanal-kein-link', 'Kanalbeschreibung ohne steakakademie.de');
  if (/\b(erste|einzige|beste|größte|führende|tiefste)\b/i.test(besch)) add('hoch', 'kanal-superlativ', 'Alleinstellungs-/Superlativ-Behauptung in der Kanalbeschreibung (Abmahnrisiko § 5 UWG)');
  if (!kw.trim()) add('mittel', 'kanal-keine-keywords', 'Keine Kanal-Keywords');
  if (!k.brandingSettings?.channel?.defaultLanguage && !k.snippet?.defaultLanguage) add('mittel', 'kanal-keine-sprache', 'Kanalsprache nicht gesetzt');
  if (!k.brandingSettings?.channel?.country && !k.snippet?.country) add('mittel', 'kanal-kein-land', 'Land nicht gesetzt');
  if (!k.brandingSettings?.channel?.unsubscribedTrailer) add('info', 'kanal-kein-trailer', 'Kein Trailer für Nicht-Abonnenten');
  if (k.status?.madeForKids) add('hoch', 'kanal-kinder', 'Kanal als „für Kinder“ markiert');
  return b;
}

/**
 * Snippet für videos.update: YouTube überschreibt das GANZE snippet — fehlende Felder gehen verloren.
 * Deshalb immer vom Ist-Stand ausgehen und nur geänderte Felder ersetzen.
 */
export function neuesSnippet(alt, aenderung) {
  const s = {
    title: alt.title,
    description: alt.description ?? '',
    categoryId: alt.categoryId ?? KATEGORIE_HOWTO,
    tags: alt.tags ?? [],
    defaultLanguage: alt.defaultLanguage,
    defaultAudioLanguage: alt.defaultAudioLanguage,
    ...aenderung,
  };
  for (const k of Object.keys(s)) if (s[k] === undefined) delete s[k];
  if (!s.title || s.title.length > 100) throw new Error(`Titel fehlt oder > 100 Zeichen: ${s.title}`);
  if (s.description.length > 5000) throw new Error('Beschreibung > 5.000 Zeichen');
  if (/[<>]/.test(s.title) || /[<>]/.test(s.description)) throw new Error('< und > sind in Titel/Beschreibung nicht erlaubt');
  const tagLaenge = (s.tags ?? []).reduce((n, t) => n + t.length + (t.includes(' ') ? 2 : 0) + 1, 0);
  if (tagLaenge > 500) throw new Error(`Tags zusammen ${tagLaenge} > 500 Zeichen`);
  return s;
}

/** Argumente im Stil --name wert / --schalter. */
export function argumente(argv, schalter = []) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) throw new Error(`Unerwartetes Argument: ${k}`);
    const name = k.slice(2);
    if (schalter.includes(name)) a[name] = true;
    else a[name] = argv[++i];
  }
  return a;
}

export const heute = () => new Date().toISOString().slice(0, 10);
