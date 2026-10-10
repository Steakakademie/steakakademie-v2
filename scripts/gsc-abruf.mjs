#!/usr/bin/env node
/**
 * Search-Console-Abruf — holt die Leistungsdaten per API statt per Handexport
 * (SEO/GEO-Team, 10.10.2026; Abteilung Wachstum, Mechanik in Systems & Ops).
 *
 * ANLASS: Die GSC-Daten kamen bisher als ZIP-Export von Hand. Für die Messung am
 * 30.10. und jede weitere braucht es denselben Abruf, reproduzierbar und ohne Klickstrecke.
 *
 * ZUGANG (Uwe richtet ihn einmal ein, Anleitung: docs/gsc-abruf.md):
 *   - Dienstkonto in einem Google-Cloud-Projekt mit aktivierter „Search Console API",
 *     dieses Dienstkonto in der GSC als Nutzer (nur Lesen) hinzugefügt.
 *   - GSC_DIENSTKONTO_PFAD = Pfad zur JSON-Schlüsseldatei (auch aus .env.local).
 *     Die Datei liegt AUSSERHALB des Repos oder unter privat/ (gitignored); das Skript
 *     verweigert jeden anderen Ort. Der Schlüssel wird nie ausgegeben oder geloggt.
 *   - GSC_PROPERTY = Property, Standard „sc-domain:steakakademie.de".
 *
 * AUSGABE: privat/gsc/<abrufdatum>/<dimension>.csv — privat/ ist gitignored.
 * Rohdaten der Search Console gehören nicht ins öffentliche Repo (Entscheidung 09.10.2026).
 *
 * AUFRUF:  node scripts/gsc-abruf.mjs [--tage 90] [--suchtyp web|discover|news|image|video]
 *          node scripts/gsc-abruf.mjs --von 2026-09-10 --bis 2026-10-09
 *          node scripts/gsc-abruf.mjs --probelauf     (zeigt Zeitraum und Anfragen, ruft nichts ab)
 */
import { createSign } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const STANDARD_PROPERTY = 'sc-domain:steakakademie.de';
// Die Search Console liefert Daten mit rund zwei Tagen Verzug; der jüngste Tag ist unvollständig.
export const VERZUG_TAGE = 3;
export const ZEILEN_JE_SEITE = 25_000;

/** Jede Dimension, die als eigene CSV landet. */
export const ABRUFE = [
  { datei: 'suchanfragen', dimensionen: ['query'] },
  { datei: 'seiten', dimensionen: ['page'] },
  { datei: 'suchanfrage-seite', dimensionen: ['query', 'page'] },
  { datei: 'laender', dimensionen: ['country'] },
  { datei: 'geraete', dimensionen: ['device'] },
  { datei: 'verlauf', dimensionen: ['date'] },
];

const base64url = (buf) => Buffer.from(buf).toString('base64url');

/** Signiertes JWT (RS256) für den OAuth-Austausch eines Dienstkontos. */
export function jwt({ clientEmail, privateKey, jetzt = Date.now() }) {
  const iat = Math.floor(jetzt / 1000);
  const kopf = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const anspruch = base64url(
    JSON.stringify({ iss: clientEmail, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }),
  );
  const signatur = createSign('RSA-SHA256').update(`${kopf}.${anspruch}`).sign(privateKey);
  return `${kopf}.${anspruch}.${base64url(signatur)}`;
}

const tag = (d) => d.toISOString().slice(0, 10);

/** Zeitraum aus --tage (Ende = heute − Verzug) oder --von/--bis. */
export function zeitraum({ heute = new Date(), tage = 90, von, bis } = {}) {
  if (von || bis) {
    if (!von || !bis) throw new Error('--von und --bis immer zusammen angeben');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(von) || !/^\d{4}-\d{2}-\d{2}$/.test(bis)) {
      throw new Error('--von/--bis im Format JJJJ-MM-TT');
    }
    if (von > bis) throw new Error('--von liegt nach --bis');
    return { von, bis };
  }
  if (!Number.isInteger(tage) || tage < 1 || tage > 480) throw new Error('--tage: ganze Zahl von 1 bis 480');
  const ende = new Date(Date.UTC(heute.getUTCFullYear(), heute.getUTCMonth(), heute.getUTCDate() - VERZUG_TAGE));
  const start = new Date(ende.getTime() - (tage - 1) * 86_400_000);
  return { von: tag(start), bis: tag(ende) };
}

/** Request-Body der searchAnalytics.query-Methode. */
export function anfrage({ von, bis, dimensionen, suchtyp = 'web', startRow = 0 }) {
  return {
    startDate: von,
    endDate: bis,
    dimensions: dimensionen,
    type: suchtyp,
    rowLimit: ZEILEN_JE_SEITE,
    startRow,
    dataState: 'final',
  };
}

const csvFeld = (w) => {
  const s = String(w);
  // Zellen, die eine Tabellenkalkulation als Formel läse, entschärfen.
  const sicher = /^[=+\-@]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
  return /[",\n\r]/.test(sicher) ? `"${sicher.replace(/"/g, '""')}"` : sicher;
};

/** API-Zeilen → CSV (Schlüssel je Dimension, dann Klicks, Impressionen, CTR in %, Position). */
export function zeilenZuCsv(dimensionen, zeilen) {
  const kopf = [...dimensionen, 'Klicks', 'Impressionen', 'CTR', 'Position'];
  const rest = zeilen.map((z) =>
    [
      ...z.keys,
      z.clicks,
      z.impressions,
      `${(z.ctr * 100).toFixed(2)}%`,
      Number(z.position.toFixed(2)),
    ]
      .map(csvFeld)
      .join(','),
  );
  return [kopf.map(csvFeld).join(','), ...rest].join('\n') + '\n';
}

/** Der Schlüssel darf nur außerhalb des Repos oder unter privat/ liegen — nie committbar. */
export function schluesselOrtErlaubt(pfad, wurzel = process.cwd()) {
  const abs = resolve(pfad);
  const rel = relative(resolve(wurzel), abs);
  const ausserhalb = rel.startsWith('..') || resolve(rel) === rel;
  return ausserhalb || rel === 'privat' || rel.startsWith(`privat${sep}`);
}

export function leseDienstkonto(pfad, wurzel = process.cwd()) {
  if (!pfad) throw new Error('GSC_DIENSTKONTO_PFAD ist nicht gesetzt (Anleitung: docs/gsc-abruf.md)');
  if (!schluesselOrtErlaubt(pfad, wurzel)) {
    throw new Error('Die Schlüsseldatei liegt im Repo. Außerhalb des Repos oder unter privat/ ablegen.');
  }
  if (!existsSync(pfad)) throw new Error(`Schlüsseldatei nicht gefunden: ${pfad}`);
  let j;
  try {
    j = JSON.parse(readFileSync(pfad, 'utf8'));
  } catch {
    throw new Error('Schlüsseldatei ist kein gültiges JSON');
  }
  if (j.type !== 'service_account' || !j.client_email || !j.private_key) {
    throw new Error('Schlüsseldatei ist kein Dienstkonto-Schlüssel (type, client_email, private_key erwartet)');
  }
  return { clientEmail: j.client_email, privateKey: j.private_key };
}

/** Zugriffstoken per JWT-Austausch. Fehlertexte enthalten nie den Schlüssel. */
export async function holeToken({ clientEmail, privateKey }, fetchFn = fetch) {
  const res = await fetchFn(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt({ clientEmail, privateKey }),
    }),
  });
  if (!res.ok) throw new Error(`Token-Abruf fehlgeschlagen (HTTP ${res.status})`);
  const j = await res.json();
  if (!j.access_token) throw new Error('Token-Antwort ohne access_token');
  return j.access_token;
}

/** Alle Seiten einer Dimensionskombination abrufen (je 25.000 Zeilen). */
export async function holeZeilen({ token, property, von, bis, dimensionen, suchtyp }, fetchFn = fetch) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;
  const alle = [];
  for (let startRow = 0; ; startRow += ZEILEN_JE_SEITE) {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(anfrage({ von, bis, dimensionen, suchtyp, startRow })),
    });
    if (res.status === 403) {
      // Google nennt die Ursache selbst (z. B. „API has not been used in project … or it is disabled",
      // 10.10.2026: genau das war es, nicht der Nutzereintrag). Die Meldung enthält keine Zugangsdaten.
      const grund = (await res.json().catch(() => ({})))?.error?.message;
      throw new Error(
        `Kein Zugriff auf ${property} (HTTP 403)` +
          (grund ? `: ${String(grund).slice(0, 300)}` : '') +
          ' — Prüfen: Search Console API im Cloud-Projekt aktiviert? Dienstkonto in der Search Console als Nutzer eingetragen?',
      );
    }
    if (!res.ok) throw new Error(`Search-Console-Abruf fehlgeschlagen (HTTP ${res.status})`);
    const { rows = [] } = await res.json();
    alle.push(...rows);
    if (rows.length < ZEILEN_JE_SEITE) return alle;
  }
}

// Wert aus der Umgebung oder aus .env.local (wie scripts/kursinhalte-holen.mjs).
function wert(name, wurzel) {
  if (process.env[name]) return process.env[name].trim();
  const datei = join(wurzel, '.env.local');
  if (!existsSync(datei)) return undefined;
  const zeile = readFileSync(datei, 'utf8').split(/\r?\n/).find((z) => z.startsWith(`${name}=`));
  return zeile ? zeile.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') || undefined : undefined;
}

function argumente(argv) {
  const a = { probelauf: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--probelauf') a.probelauf = true;
    else if (['--tage', '--von', '--bis', '--suchtyp'].includes(k)) a[k.slice(2)] = argv[++i];
    else throw new Error(`Unbekanntes Argument: ${k}`);
  }
  return a;
}

async function main() {
  const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
  const a = argumente(process.argv.slice(2));
  const suchtyp = a.suchtyp ?? 'web';
  if (!['web', 'discover', 'news', 'image', 'video', 'googleNews'].includes(suchtyp)) {
    throw new Error(`--suchtyp: ${suchtyp} unbekannt`);
  }
  const { von, bis } = zeitraum({ tage: a.tage ? Number(a.tage) : 90, von: a.von, bis: a.bis });
  const property = wert('GSC_PROPERTY', wurzel) || STANDARD_PROPERTY;
  const ziel = join(wurzel, 'privat', 'gsc', tag(new Date()));

  console.log(`Property ${property} · ${suchtyp} · ${von} bis ${bis}`);
  console.log(`Ziel: ${relative(wurzel, ziel)}`);
  if (a.probelauf) {
    for (const { datei, dimensionen } of ABRUFE) console.log(`  ${datei}.csv ← ${dimensionen.join(' + ')}`);
    console.log('Probelauf — nichts abgerufen.');
    return;
  }

  const token = await holeToken(leseDienstkonto(wert('GSC_DIENSTKONTO_PFAD', wurzel), wurzel));
  mkdirSync(ziel, { recursive: true });
  for (const { datei, dimensionen } of ABRUFE) {
    const zeilen = await holeZeilen({ token, property, von, bis, dimensionen, suchtyp });
    writeFileSync(join(ziel, `${datei}.csv`), zeilenZuCsv(dimensionen, zeilen));
    console.log(`  ${datei}.csv: ${zeilen.length} Zeilen`);
  }
  writeFileSync(join(ziel, 'abruf.json'), JSON.stringify({ property, suchtyp, von, bis, abgerufenAm: new Date().toISOString() }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
