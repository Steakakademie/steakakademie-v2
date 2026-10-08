#!/usr/bin/env node
/**
 * Kursinhalte holen — bezahlte Inhalte liegen im privaten Repo
 * Steakakademie/Steakakademie-kursinhalte, nicht in diesem öffentlichen (Uwe, 08.10.2026).
 *
 * ANLASS: Das Repo steakakademie-v2 ist öffentlich. Bis 08.10.2026 lagen die
 * Eigenregie-Module, die Gründer-Schmiede und Diplom-Stufe 2 hier im Klartext —
 * jeder konnte bezahlte Inhalte auf GitHub lesen. Stufe 1 ist kostenlos und
 * bleibt hier.
 *
 * QUELLEN (die erste, die greift):
 *   1. KURSINHALTE_PFAD  — lokaler Klon des privaten Repos (Uwes Rechner).
 *      Kurstexte werden DORT bearbeitet und committet, nicht in content/.
 *   2. KURSINHALTE_TOKEN — Fine-grained Token, nur Lesen, nur dieses Repo
 *      (Vercel Production + Preview, GitHub-Actions-Secret). Flacher Klon nach
 *      .kursinhalte/, danach Kopie in die Zielordner.
 * Beide Werte dürfen auch in .env.local stehen.
 *
 * FEHLT BEIDES: auf Vercel und in CI ist das ein Fehler (Exit 1). Ein Build
 * ohne Kursinhalte wäre grün und würde Käufern leere Kurse ausliefern —
 * CLAUDE.md §2 Regel 10: grün ist kein Ergebnis. Lokal nur eine Warnung.
 *
 * In beiden Fällen wird KOPIERT, nicht verknüpft: die Gates (check-zusagen u. a.)
 * folgen keinen Verknüpfungen und hätten bezahlte Inhalte still übersprungen
 * (am 08.10.2026 so beobachtet: 32 statt 39 Diplom-Lektionen gezählt).
 *
 * SCHUTZ (Regel 9): Ein Zielordner wird nie überschrieben, wenn er ein echter
 * Ordner ohne Markierungsdatei ist oder wenn die Kopie Änderungen enthält, die
 * in der Quelle fehlen — dann wurde in content/ statt im privaten Repo gearbeitet.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = process.cwd();
const REPO = 'Steakakademie/Steakakademie-kursinhalte';
const KLON = path.join(WURZEL, '.kursinhalte');
const MARKE = '.aus-kursinhalte';

/** Quelle im privaten Repo → Ziel hier, mit Mindestzahl an Dateien. */
export const ZUORDNUNG = [
  { quelle: 'eigenregie', ziel: 'content/eigenregie', mindestens: 7 },
  { quelle: 'gruender-schmiede', ziel: 'content/gruender-schmiede', mindestens: 1 },
  { quelle: 'diplom-lektionen/stufe-2', ziel: 'content/diplom-lektionen/stufe-2', mindestens: 1 },
  { quelle: 'dateien', ziel: 'privat/kursdateien', mindestens: 2 },
];

function ausEnvLocal(name) {
  const datei = path.join(WURZEL, '.env.local');
  if (!fs.existsSync(datei)) return undefined;
  const zeile = fs.readFileSync(datei, 'utf8').split(/\r?\n/).find((z) => z.startsWith(`${name}=`));
  return zeile ? zeile.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : undefined;
}

const wert = (name) => process.env[name] || ausEnvLocal(name);
const istStreng = () => Boolean(process.env.CI || process.env.VERCEL);

function zaehleDateien(ordner) {
  if (!fs.existsSync(ordner)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    n += e.isDirectory() ? zaehleDateien(path.join(ordner, e.name)) : 1;
  }
  return n;
}

/** Darf das Ziel ersetzt werden? Nein bei echtem Ordner ohne Marke. */
export function zielErsetzbar(ziel) {
  const st = fs.lstatSync(ziel, { throwIfNoEntry: false });
  if (!st || st.isSymbolicLink()) return true;
  return fs.existsSync(path.join(ziel, MARKE));
}

function dateienUnter(ordner, basis = ordner) {
  const liste = [];
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    if (e.name === MARKE) continue;
    const voll = path.join(ordner, e.name);
    if (e.isDirectory()) liste.push(...dateienUnter(voll, basis));
    else liste.push(path.relative(basis, voll));
  }
  return liste;
}

/** Dateien der Kopie, die in der Quelle fehlen oder anders lauten. */
export function lokaleAenderungen(kopie, quelle) {
  const st = fs.lstatSync(kopie, { throwIfNoEntry: false });
  if (!st || st.isSymbolicLink()) return [];
  return dateienUnter(kopie).filter((rel) => {
    const q = path.join(quelle, rel);
    return !fs.existsSync(q) || !fs.readFileSync(q).equals(fs.readFileSync(path.join(kopie, rel)));
  });
}

function entferne(ziel) {
  const st = fs.lstatSync(ziel);
  if (st.isSymbolicLink()) fs.unlinkSync(ziel);
  else fs.rmSync(ziel, { recursive: true, force: true });
}

function klone(token) {
  if (fs.existsSync(KLON)) fs.rmSync(KLON, { recursive: true, force: true });
  const url = `https://x-access-token:${token}@github.com/${REPO}.git`;
  const r = spawnSync('git', ['clone', '--depth', '1', '--quiet', url, KLON], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) {
    // Die Fehlermeldung von git kann die URL samt Token enthalten.
    const meldung = String(r.stderr || '').replaceAll(token, '***');
    throw new Error(`Klonen von ${REPO} fehlgeschlagen (Exit ${r.status}): ${meldung.trim()}`);
  }
  return KLON;
}

function main() {
  const pfad = wert('KURSINHALTE_PFAD');
  const token = wert('KURSINHALTE_TOKEN');

  if (!pfad && !token) {
    const text = `Kursinhalte fehlen: weder KURSINHALTE_PFAD noch KURSINHALTE_TOKEN gesetzt (privates Repo ${REPO}).`;
    if (istStreng()) {
      console.error(`✗ ${text}`);
      process.exit(1);
    }
    console.warn(`⚠ ${text} Bezahlte Kurse bleiben lokal leer.`);
    return;
  }

  const quelle = pfad ? path.resolve(pfad) : klone(token);
  const fehler = [];

  for (const { quelle: q, ziel: z, mindestens } of ZUORDNUNG) {
    const von = path.join(quelle, q);
    const nach = path.join(WURZEL, z);
    const anzahl = zaehleDateien(von);
    if (anzahl < mindestens) {
      fehler.push(`${q}: ${anzahl} Dateien im privaten Repo, erwartet mindestens ${mindestens}`);
      continue;
    }
    if (!zielErsetzbar(nach)) {
      fehler.push(`${z} ist ein echter Ordner ohne ${MARKE} — nicht überschrieben (ungesicherte Arbeit?). Inhalt prüfen, ins private Repo übernehmen, Ordner entfernen.`);
      continue;
    }
    const geaendert = lokaleAenderungen(nach, von);
    if (geaendert.length) {
      fehler.push(`${z} enthält Änderungen, die im privaten Repo fehlen: ${geaendert.slice(0, 5).join(', ')}${geaendert.length > 5 ? ' …' : ''}. Erst dort übernehmen und committen.`);
      continue;
    }
    // lstat statt existsSync: eine verwaiste Verknüpfung meldet existsSync als „fehlt“.
    if (fs.lstatSync(nach, { throwIfNoEntry: false })) entferne(nach);
    fs.mkdirSync(path.dirname(nach), { recursive: true });
    fs.cpSync(von, nach, { recursive: true, filter: (f) => !f.split(path.sep).includes('.git') });
    fs.writeFileSync(path.join(nach, MARKE), `Kopie aus ${REPO}. Nicht hier bearbeiten.\n`);
    console.log(`✓ ${z} ← ${q} (${anzahl} Dateien)`);
  }

  if (fehler.length) {
    for (const f of fehler) console.error(`✗ ${f}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
