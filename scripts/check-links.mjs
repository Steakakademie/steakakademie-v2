#!/usr/bin/env node
/**
 * Konsistenzprüfung der internen Verlinkung.
 *
 * Hintergrund: Am 17.08.2026 fiel auf, dass im Header-Untermenü „Grilltechniken"
 * drei Einträge wie eigene Seiten aussahen, aber alle auf die Übersicht zeigten —
 * während neun echte Methodenseiten nirgends verlinkt waren. Solche Lücken entstehen
 * still und fallen erst auf, wenn jemand sucht. Diese Prüfung macht sie sichtbar.
 *
 * Was geprüft wird:
 *   1. Tote Links  — ein interner Link zeigt auf eine Route, die es nicht gibt.
 *   2. Waisen      — eine Route existiert, aber kein einziger Link führt dorthin.
 *
 * Quelle der Wahrheit für Routen sind zwei Dinge, die unabhängig vom Build-Zustand
 * verfügbar sind: die Ordnerstruktur unter src/app für feste Seiten, und die von
 * Contentlayer erzeugten `url`-Felder für alle Inhaltsseiten. Bewusst nicht .next —
 * das wird vom Dev-Server überschrieben und wäre nur nach einem Produktionsbuild
 * aussagekräftig.
 *
 * Aufruf:  node scripts/check-links.mjs [--strict]
 *          --strict beendet mit Code 1, wenn tote Links gefunden werden.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'src', 'app');
const CL_DIR = path.join(ROOT, '.contentlayer', 'generated');
const STRICT = process.argv.includes('--strict');

// TOTE LINKS BRECHEN DEN BUILD — IMMER (Uwe, 27.08.2026).
// Vorher hing der Abbruch an --strict, und der postbuild-Lauf in package.json
// ruft das Skript OHNE dieses Flag auf. Das Gate hat also gemeldet und nie
// gebissen: ein toter interner Link ging gruen durch bis auf die Live-Seite.
// Ein kaputter Link ist ein Defekt, keine Anmerkung.
// --strict eskaliert seither zusaetzlich die WARNUNGEN (Waisen, Mehrfachziele)
// zu Fehlern; die sind Hinweise und duerfen den Build allein nicht kippen.

// Routen, die absichtlich nicht verlinkt sind (Landeseiten, rechtliche Seiten,
// Kampagnenziele). Waisenmeldungen dazu sind Rauschen, keine Befunde.
const WAISEN_ERLAUBT = [
  /^\/$/,
  /^\/(impressum|datenschutz|agb|widerruf|cookies)/,
  /^\/auth\//,
  /^\/admin/,
  /^\/api\//,
  /^\/_/,
  /^\/404|^\/500/,
  // Ziele nach einer Conversion — sollen ausdruecklich nicht auffindbar sein.
  /^\/danke\//,
  // Nur fuer angemeldete Nutzer.
  /^\/profil$/,
  /^\/mein-protokoll\//,
  // Premium und Corporate, bewusst nicht indexiert (robots: noindex).
  // Bewusste Geschaeftsentscheidung, nachgeprueft am 17.08.2026.
  /^\/prive$/,
  // A/B-Variante der Startseite: wird nur per Rewrite aus der Middleware
  // erreicht, hat noindex und Canonical auf "/". Sie wird NIE verlinkt werden —
  // das ist kein Versaeumnis, sondern die Bauart.
  /^\/home-b$/,
];

// BEWUSST NICHT auf der Liste: /challenge-teilnahmebedingungen.
// Fertig gebaut, aber noch nicht gestartet — die Warnung soll stehen bleiben,
// damit die Seite beim Start nicht vergessen wird. Eine Liste, die alles
// stillstellt, damit am Ende null steht, ist keine Pruefung mehr.
//   /challenge-teilnahmebedingungen — wartet auf Community und Rechtsfreigabe.
//
// ENTFALLEN (Uwe, 09.09.2026): /bbq-grundkurs stand hier als offene Baustelle.
// Der Kurs ist eingestellt — Stufe 1 des Diploms deckt seinen Stoff seit dem
// neuen Rahmenlehrplan kostenlos ab. Die URL leitet dauerhaft auf /diplome
// (next.config.mjs), es gibt also keine Seite mehr, die verlinkt werden muesste.

// Routen mit dynamischem Segment, z. B. /rezepte/[slug] oder /autoren/[slug].
// Deren konkrete Werte stehen in generateStaticParams und lassen sich statisch
// nicht sicher aufloesen. Links dorthin werden getrennt ausgewiesen — als
// „nicht pruefbar", nicht als „tot". Ein falscher Alarm ist schaedlicher als
// eine ehrliche Luecke.
const dynamischeMuster = new Set();

/** Feste Seiten aus der Ordnerstruktur von src/app. */
function sammleStatischeRouten(dir, prefix = '') {
  const routen = new Set();
  if (!fs.existsSync(dir)) return routen;
  for (const eintrag of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!eintrag.isDirectory()) {
      if (/^page\.(tsx|ts|jsx|js)$/.test(eintrag.name)) routen.add(prefix || '/');
      continue;
    }
    // Dynamische Segmente werden nicht aus dem Ordnernamen aufgeloest, sondern
    // ueber die Contentlayer-URLs. Routengruppen (klammern) erzeugen kein Segment.
    if (eintrag.name.startsWith('[')) {
      dynamischeMuster.add(`${prefix}/${eintrag.name}`);
      // Auch tiefere Ebenen unterhalb eines dynamischen Segments erfassen
      for (const t of sammleStatischeRouten(
        path.join(dir, eintrag.name),
        `${prefix}/${eintrag.name}`,
      )) {
        dynamischeMuster.add(t);
      }
      continue;
    }
    const segment = eintrag.name.startsWith('(') ? '' : `/${eintrag.name}`;
    for (const r of sammleStatischeRouten(path.join(dir, eintrag.name), prefix + segment)) {
      routen.add(r);
    }
  }
  return routen;
}

/** Inhaltsseiten aus den von Contentlayer erzeugten url-Feldern. */
function sammleInhaltsRouten() {
  const routen = new Set();
  if (!fs.existsSync(CL_DIR)) return routen;
  for (const eintrag of fs.readdirSync(CL_DIR, { withFileTypes: true })) {
    if (!eintrag.isDirectory()) continue;
    const index = path.join(CL_DIR, eintrag.name, '_index.json');
    if (!fs.existsSync(index)) continue;
    try {
      for (const doc of JSON.parse(fs.readFileSync(index, 'utf8'))) {
        if (typeof doc?.url === 'string') routen.add(doc.url.replace(/\/$/, '') || '/');
      }
    } catch {
      // Ein unlesbarer Index bedeutet: Contentlayer schreibt gerade neu. Wuerden
      // wir den Typ einfach ueberspringen, fehlten seine Routen — und jeder Link
      // dorthin waere faelschlich ein toter Link. Lieber abbrechen als luegen.
      console.error(
        `\nAbbruch: ${eintrag.name}/_index.json ist gerade nicht lesbar.\n` +
        `Contentlayer schreibt vermutlich neu. In ein paar Sekunden erneut ausfuehren.\n`
      );
      process.exit(2);
    }
  }
  return routen;
}

function* dateien(dir, endungen) {
  if (!fs.existsSync(dir)) return;
  for (const eintrag of fs.readdirSync(dir, { withFileTypes: true })) {
    if (eintrag.name === 'node_modules' || eintrag.name.startsWith('.')) continue;
    const p = path.join(dir, eintrag.name);
    if (eintrag.isDirectory()) yield* dateien(p, endungen);
    else if (endungen.some((e) => eintrag.name.endsWith(e))) yield p;
  }
}

// href="/..." als JSX-Attribut
const RE_HREF = /href=["'](\/[^"'#?]*)["']/g;
// href: '/...' als Objekt-Eigenschaft. Navigationsleisten werden fast immer als
// Datenarray gepflegt und erst danach gerendert — ohne diesen Fall meldet die
// Pruefung jede Seite aus dem Hauptmenue faelschlich als nicht verlinkt.
const RE_HREF_PROP = /href:\s*["'](\/[^"'#?]*)["']/g;
// ](/...) in MDX
const RE_MD = /\]\((\/[^)\s#?]*)\)/g;

function sammleLinks() {
  const links = new Map(); // route -> Set(quelldateien)
  const quellen = [
    ...dateien(path.join(ROOT, 'src'), ['.tsx', '.ts']),
    ...dateien(path.join(ROOT, 'content'), ['.mdx']),
  ];
  for (const datei of quellen) {
    const text = fs.readFileSync(datei, 'utf8');
    for (const re of [RE_HREF, RE_HREF_PROP, RE_MD]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        let ziel = m[1].replace(/\/$/, '') || '/';
        // Template-Literale und dynamische Segmente lassen sich statisch nicht
        // aufloesen — die werden uebersprungen, nicht falsch gemeldet.
        if (ziel.includes('${') || ziel.includes('[')) continue;
        if (!links.has(ziel)) links.set(ziel, new Set());
        links.get(ziel).add(path.relative(ROOT, datei));
      }
    }
  }
  return links;
}

/**
 * Sammelverlinkung erkennen.
 *
 * Übersichtsseiten verlinken ihre Einträge dynamisch — `href={entry.url}` statt
 * eines festen Pfads. Eine reine Textsuche sieht davon nichts und würde jede
 * Glossarseite als „nicht verlinkt" melden, obwohl `/glossar` sie alle auflistet.
 * Genau dieser Fehlalarm ist beim ersten Lauf am 17.08.2026 passiert.
 *
 * Deshalb: Importiert eine Seite eine Contentlayer-Sammlung und rendert daraus
 * Links, gelten alle Dokumente dieses Typs als verlinkt.
 */
function sammleTypZuordnung() {
  const zuordnung = new Map(); // allXxx -> Typname
  const idx = path.join(CL_DIR, 'index.mjs');
  if (!fs.existsSync(idx)) return zuordnung;
  const text = fs.readFileSync(idx, 'utf8');
  // Contentlayer schreibt diese Datei je nach Modus unterschiedlich:
  //   Entwicklung:  import { allCuts } from './Cut/_index.mjs'
  //   Produktion:   import allCuts from './Cut/_index.json' with { type: 'json' }
  // Beide Formen muessen erkannt werden. Wurde nur die erste beruecksichtigt,
  // meldete die Pruefung nach einem Produktionsbuild 274 Seiten faelschlich als
  // nicht verlinkt (17.08.2026).
  const re = /import\s*(?:\{\s*(all\w+)\s*\}|(all\w+))\s*from\s*'\.\/(\w+)\/_index/g;
  let m;
  while ((m = re.exec(text))) zuordnung.set(m[1] ?? m[2], m[3]);
  return zuordnung;
}

function sammleTypRouten(typ) {
  const routen = new Set();
  const index = path.join(CL_DIR, typ, '_index.json');
  if (!fs.existsSync(index)) return routen;
  try {
    for (const doc of JSON.parse(fs.readFileSync(index, 'utf8'))) {
      if (typeof doc?.url === 'string') routen.add(doc.url.replace(/\/$/, '') || '/');
    }
  } catch { /* oben bereits behandelt */ }
  return routen;
}

function sammleSammelLinks() {
  const zuordnung = sammleTypZuordnung();
  const treffer = new Map(); // route -> Set(quelldateien)
  for (const datei of dateien(path.join(ROOT, 'src'), ['.tsx'])) {
    const text = fs.readFileSync(datei, 'utf8');
    // Rendert die Datei ueberhaupt dynamische Links?
    if (!/href=\{/.test(text)) continue;
    for (const [name, typ] of zuordnung) {
      if (!new RegExp(`\\b${name}\\b`).test(text)) continue;
      for (const r of sammleTypRouten(typ)) {
        if (!treffer.has(r)) treffer.set(r, new Set());
        treffer.get(r).add(path.relative(ROOT, datei));
      }
    }
  }
  return treffer;
}


/**
 * Mehrfachziele in Navigationsdaten.
 *
 * Am 17.08.2026 zeigten im Untermenue „Grilltechniken" drei Eintraege auf dieselbe
 * Uebersichtsseite, obwohl neun echte Unterseiten existierten — und im Footer taten
 * es drei Autorennamen ebenso. Beides sind gueltige Links, die Linkpruefung sah also
 * nichts. Fuer den Nutzer ist es dennoch ein Fehler: Das Menue verspricht
 * unterschiedliche Ziele und liefert dasselbe.
 *
 * Erkannt werden Paare aus `label` und `href`, wie sie in Navigationsarrays stehen.
 * Zwei verschiedene Beschriftungen auf dasselbe Ziel innerhalb einer Datei gelten
 * als Befund.
 */
function pruefeMehrfachziele() {
  const RE_PAAR = /label:\s*["']([^"']+)["']\s*,\s*href:\s*["'](\/[^"']*)["']/g;
  const befunde = [];
  for (const datei of dateien(path.join(ROOT, 'src'), ['.tsx', '.ts'])) {
    const text = fs.readFileSync(datei, 'utf8');
    const nachZiel = new Map(); // href -> [labels]
    RE_PAAR.lastIndex = 0;
    let m;
    while ((m = RE_PAAR.exec(text))) {
      const [, label, ziel] = m;
      const key = ziel.replace(/\/$/, '') || '/';
      if (!nachZiel.has(key)) nachZiel.set(key, []);
      nachZiel.get(key).push(label);
    }
    for (const [ziel, labels] of nachZiel) {
      if (labels.length > 1) {
        befunde.push({ datei: path.relative(ROOT, datei), ziel, labels });
      }
    }
  }
  return befunde;
}

const statisch = sammleStatischeRouten(APP_DIR);
const ausInhalten = sammleInhaltsRouten();
const routen = new Set([...statisch, ...ausInhalten]);

if (routen.size === 0) {
  console.error('Keine Routen gefunden — stimmt das Arbeitsverzeichnis?');
  // Immer 1: eine Pruefung, die gar nicht laufen konnte, ist keine bestandene
  // Pruefung. Vorher meldete ein Lauf im falschen Verzeichnis "erfolgreich".
  process.exit(1);
}

const links = sammleLinks();

// Segmentnamen duerfen Bindestriche enthalten ([product-slug]), deshalb wird
// segmentweise umgewandelt statt per Zeichenklasse. Alles ausserhalb der
// Klammern wird escaped, damit Sonderzeichen im Pfad nicht als Regex wirken.
function musterZuRegex(muster) {
  const teile = muster.split('/').map((segment) => {
    if (/^\[\.\.\..+\]$/.test(segment)) return '.+';
    if (/^\[.+\]$/.test(segment)) return '[^/]+';
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  return new RegExp('^' + teile.join('/') + '$');
}

const musterRegex = [...dynamischeMuster].map(musterZuRegex);

// Ein href kann auf eine Datei unter public/ zeigen statt auf eine Route —
// ein Poster zum Oeffnen, ein PDF zum Herunterladen. Die Datei existiert, der
// Link ist gueltig; ohne diese Pruefung meldet das Gate sie als tot, weil es
// nur Routen kennt (aufgefallen 30.08.2026 am Cut-Atlas-Poster auf /cuts).
// Bewusst existsSync auf den konkreten Pfad: geraten wird hier nichts.
function istOeffentlicheDatei(ziel) {
  const p = path.join(ROOT, 'public', decodeURIComponent(ziel));
  // Kein Verzeichnis-Treffer: /images ist keine gueltige Verlinkung.
  return fs.existsSync(p) && fs.statSync(p).isFile();
}

const tote = [];
const ungeprueft = [];
for (const [ziel, quellen] of links) {
  if (routen.has(ziel)) continue;
  if (istOeffentlicheDatei(ziel)) continue;
  const eintrag = { ziel, quellen: [...quellen] };
  if (musterRegex.some((re) => re.test(ziel))) ungeprueft.push(eintrag);
  else tote.push(eintrag);
}

const sammelLinks = sammleSammelLinks();
if (sammelLinks.size === 0 && ausInhalten.size > 0) {
  console.error(
    '\nAbbruch: Keine einzige Sammelverlinkung erkannt, obwohl Inhaltsseiten existieren.\n' +
    'Das ist praktisch ausgeschlossen — vermutlich hat sich das Format von\n' +
    '.contentlayer/generated/index.mjs geaendert. Ohne diese Erkennung wuerde jede\n' +
    'Inhaltsseite faelschlich als nicht verlinkt gemeldet.\n'
  );
  process.exit(2);
}
const verlinkt = new Set([...links.keys(), ...sammelLinks.keys()]);
const waisen = [...routen]
  .filter((r) => !verlinkt.has(r))
  .filter((r) => !WAISEN_ERLAUBT.some((re) => re.test(r)))
  .sort();

console.log(`\nRouten gesamt: ${routen.size}  (${statisch.size} feste Seiten, ${ausInhalten.size} Inhaltsseiten)`);
console.log(`Interne Linkziele: ${links.size} fest, ${sammelLinks.size} ueber Uebersichtsseiten`);

if (tote.length) {
  console.log(`\n✗ Tote Links: ${tote.length}`);
  for (const { ziel, quellen } of tote.sort((a, b) => a.ziel.localeCompare(b.ziel))) {
    console.log(`  ${ziel}`);
    for (const q of quellen.slice(0, 3)) console.log(`      ← ${q}`);
    if (quellen.length > 3) console.log(`      ← … und ${quellen.length - 3} weitere`);
  }
} else {
  console.log('\n✓ Keine toten Links.');
}

if (ungeprueft.length) {
  console.log(`\n· Nicht pruefbar (dynamische Route): ${ungeprueft.length}`);
  for (const { ziel, quellen } of ungeprueft.sort((a, b) => a.ziel.localeCompare(b.ziel))) {
    console.log(`  ${ziel}   ← ${quellen[0]}${quellen.length > 1 ? ` (+${quellen.length - 1})` : ''}`);
  }
  console.log('  Diese Ziele liegen hinter einem [slug]. Ob der konkrete Wert existiert,');
  console.log('  entscheidet generateStaticParams — das kann diese Pruefung nicht sehen.');
}

const mehrfach = pruefeMehrfachziele();
if (mehrfach.length) {
  console.log(`\n⚠ Mehrfachziele in Navigationsdaten: ${mehrfach.length}`);
  for (const { datei, ziel, labels } of mehrfach) {
    console.log(`  ${ziel}`);
    console.log(`      ${labels.map((l) => `„${l}"`).join(', ')}`);
    console.log(`      in ${datei}`);
  }
  console.log('  Mehrere Beschriftungen auf dasselbe Ziel. Der Nutzer erwartet');
  console.log('  verschiedene Seiten und landet zweimal an derselben Stelle.');
} else {
  console.log('\n✓ Keine Mehrfachziele in Navigationsdaten.');
}

if (waisen.length) {
  console.log(`\n⚠ Nicht verlinkte Seiten: ${waisen.length}`);
  const nachBereich = new Map();
  for (const w of waisen) {
    const bereich = '/' + (w.split('/')[1] || '');
    if (!nachBereich.has(bereich)) nachBereich.set(bereich, []);
    nachBereich.get(bereich).push(w);
  }
  for (const [bereich, liste] of [...nachBereich].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${bereich}  (${liste.length})`);
    for (const w of liste.slice(0, 8)) console.log(`      ${w}`);
    if (liste.length > 8) console.log(`      … und ${liste.length - 8} weitere`);
  }
  console.log('\n  Eine nicht verlinkte Seite ist nicht automatisch ein Fehler —');
  console.log('  aber sie bekommt keinen internen Linkfluss und wird selten gefunden.');
} else {
  console.log('\n✓ Jede Seite ist mindestens einmal verlinkt.');
}

console.log('');
if (tote.length) {
  console.log(`❌ ${tote.length} tote${tote.length === 1 ? 'r' : ''} interne${tote.length === 1 ? 'r' : ''} Link — Build gestoppt.`);
  process.exit(1);
}
if (STRICT && (waisen.length || mehrfach.length)) {
  console.log('❌ --strict: Warnungen gelten als Fehler — Build gestoppt.');
  process.exit(1);
}
console.log('✓ Link-Gate bestanden.');
