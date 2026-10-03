#!/usr/bin/env node
/**
 * Legal-Guard — statischer Regressions-Check gegen typische Abmahn-Gründe.
 *
 * Verankert die maschinell prüfbaren Punkte des Abmahn-Checks (13.06.2026) als
 * CI-Gate, damit niemand sie versehentlich wieder einbaut. Begründung/Quelle je
 * Regel: compliance/website-rechtscheck.yaml.
 *
 * Prüft NUR Text-Dateien (keine Binär-/Bild-Dateien → keine Fehl-Treffer).
 * Scannt bewusst NICHT compliance/ und docs/ (dort stehen die Regeln als Text).
 *
 * Exit 0 = sauber · Exit 1 = mindestens ein Verstoß.
 *
 * Dependencies: js-yaml (seit Regel 6 — liest data/bildregister.yaml). Bis
 * dahin lief der Guard dependency-frei; die Ausnahme ist bewusst, weil ein
 * handgeschriebener YAML-Parser bei einem Beweismittel die falsche Sparsamkeit
 * waere.
 *
 * ACHTUNG bei weiteren Abhaengigkeiten: .github/workflows/legal-guard.yml laeuft
 * ohne `npm ci` und installiert nur js-yaml einzeln. Ein neuer Import ohne
 * Ergaenzung dort laesst den Job mit ERR_MODULE_NOT_FOUND abbrechen — der Guard
 * ist dann rot, ohne je eine Regel geprueft zu haben (passiert am 31.08.2026,
 * zehn Laeufe lang unbemerkt).
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, dirname, relative, sep } from 'path';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'out', 'dist']);

function walk(dir, exts, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const e of entries) {
    const p = join(dir, e);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(e)) walk(p, exts, acc);
    } else if (exts.includes(extname(p))) {
      acc.push(p);
    }
  }
  return acc;
}

const rel = (p) => relative(ROOT, p);

const CODE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css'];
const WEB_EXTS = ['.html', '.js', '.css'];
const CONTENT_EXTS = ['.md', '.mdx'];

const srcFiles = walk(join(ROOT, 'src'), CODE_EXTS);
const publicFiles = walk(join(ROOT, 'public'), WEB_EXTS);
const contentFiles = walk(join(ROOT, 'content'), CONTENT_EXTS);
const affiliateFiles = walk(join(ROOT, 'src', 'components', 'affiliate'), ['.tsx']);

const violations = [];
const add = (rule, file, detail) => violations.push({ rule, file: rel(file), detail });

// ── 1) Toter EU-OS-Plattform-Link ────────────────────────────────────────────
// Die EU-Plattform zur Online-Streitbeilegung wurde zum 20.07.2025 eingestellt.
// Ein verbleibender Link ist selbst ein Abmahnrisiko (Quelle: impressum-ddg).
for (const f of [...srcFiles, ...contentFiles]) {
  if (/consumers\/odr/.test(readFileSync(f, 'utf8'))) {
    add('OS-Plattform-Link', f, 'Verweis auf die eingestellte EU-OS-Plattform (ec.europa.eu/consumers/odr) entfernen');
  }
}

// ── 2) Extern nachladende Google Fonts ───────────────────────────────────────
// Müssen self-hosted sein (next/font). Quelle: google-fonts-selfhosted.
for (const f of [...srcFiles, ...publicFiles]) {
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(readFileSync(f, 'utf8'))) {
    add('Externe Google Fonts', f, 'fonts.googleapis.com/gstatic.com extern nachgeladen — stattdessen self-hosted via next/font');
  }
}

// ── 3) Einwilligungspflichtige Tracker ohne Consent ──────────────────────────
// Standard ist cookieless (nur Plausible). Wer GA4/Meta-Pixel/Hotjar/Clarity
// einbaut, braucht ein Consent-Banner. Quelle: tracking-skripte-ohne-consent.
// Ausnahme: Tracker, die NACHWEISLICH erst nach aktiver Einwilligung laden
// (Consent-Framework `@/lib/consent` + ConsentBanner), sind zulässig (§ 25 Abs. 1
// TDDDG) und werden NICHT geflaggt — erkannt am Consent-Bezug in derselben Datei.
const TRACKERS = [
  ['Google Analytics / GTM', /googletagmanager\.com|google-analytics\.com|\bgtag\s*\(/],
  ['Meta-Pixel', /connect\.facebook\.net|fbevents\.js|\bfbq\s*\(/],
  ['Hotjar', /static\.hotjar\.com/],
  ['Microsoft Clarity', /clarity\.ms/],
];
const CONSENT_GATED = /@\/lib\/consent|hasStatisticsConsent|hasMarketingConsent|CONSENT_CHANGE_EVENT/;
for (const f of [...srcFiles, ...publicFiles]) {
  const txt = readFileSync(f, 'utf8');
  if (CONSENT_GATED.test(txt)) continue; // consent-gated → zulässig, kein Verstoß
  for (const [name, re] of TRACKERS) {
    if (re.test(txt)) {
      add('Tracker ohne Consent', f, `${name} gefunden — ohne gleichwertiges Consent-Banner unzulässig (§ 25 TDDDG)`);
    }
  }
}

// ── 4) Affiliate-Komponenten: Werbekennzeichnung + rel="sponsored" ───────────
// Quelle: werbekennzeichnung-affiliate-uwg (§ 5a Abs. 4 UWG).
for (const f of affiliateFiles) {
  const txt = readFileSync(f, 'utf8');
  const isAffiliateLinkComponent = /\/go\/|affiliateHref/.test(txt);

  // Jeder rel="…" in einer Affiliate-Komponente muss 'sponsored' enthalten.
  for (const m of txt.match(/rel="([^"]*)"/g) || []) {
    if (!/sponsored/.test(m)) {
      add('Affiliate rel', f, `${m} ohne 'sponsored' — Affiliate-Links als bezahlt auszeichnen`);
    }
  }

  // Seit 03.10.2026 kommt rel nicht mehr als Literal, sondern aus einer Quelle
  // (produkt-anzeige.ts → produktLink()). Ein dynamisches rel muss von dort stammen,
  // sonst greift die Literal-Prüfung oben ins Leere.
  if (/rel=\{/.test(txt) && !/produktLink\(|REL_PARTNERLINK|REL_EXTERN/.test(txt)) {
    add('Affiliate rel', f, 'dynamisches rel={…} ohne produktLink()/REL_PARTNERLINK — rel nur aus produkt-anzeige.ts beziehen');
  }

  // Komponenten, die einen Affiliate-Link rendern, brauchen ein sichtbares Label.
  if (isAffiliateLinkComponent && !/Anzeige|Werbung/.test(txt)) {
    add('Werbekennzeichnung', f, "kein sichtbares 'Anzeige'-/'Werbung'-Label in der Komponente");
  }
}

// Die eine Quelle selbst: Der Partnerlink-rel muss 'sponsored' tragen.
{
  const quelle = join(ROOT, 'src', 'components', 'affiliate', 'produkt-anzeige.ts');
  const txt = existsSync(quelle) ? readFileSync(quelle, 'utf8') : '';
  const m = txt.match(/REL_PARTNERLINK\s*=\s*['"]([^'"]*)['"]/);
  if (!m) {
    add('Affiliate rel', quelle, 'REL_PARTNERLINK nicht gefunden — die Quelle für rel der Partnerlinks fehlt');
  } else if (!/sponsored/.test(m[1])) {
    add('Affiliate rel', quelle, `REL_PARTNERLINK = '${m[1]}' ohne 'sponsored' — Partnerlinks als bezahlt auszeichnen`);
  }
}

// ── 5) Externe Bild-URLs in MDX-Frontmatter ─────────────────────────────────
// Ein image:/heroImage: auf fremdem Host laedt beim Seitenaufruf ungefragt von
// dort — derselbe Mechanismus, der bei den Amazon-Bildpfaden geschlossen wurde
// (KAN-71): Drittanbieter-Request ohne Einwilligung, dazu IP-Uebermittlung.
// Bilder gehoeren nach public/ und werden ueber einen lokalen Pfad referenziert.
//
// Diese Regel fehlte bisher: der Guard hat src/ und public/ gelesen, aber nie
// die Frontmatter der Inhalte. Aufgefallen ist es, weil vier neue Artikel das
// Muster aus dem Altbestand uebernommen haben.
//
// ALTBESTAND: 13 Dateien tragen den Fehler seit Mai/Juni und wuerden den Build
// ab der ersten Minute rot setzen. Sie stehen namentlich in BILD_ALTBESTAND —
// bewusst als Liste und nicht als Muster, damit sie sichtbar bleibt, sich beim
// Abarbeiten verkleinert und nicht versehentlich waechst. Fuer alles Neue ist
// die Regel hart.
const BILD_ALTBESTAND = new Set([
  'content/cuts/brisket.mdx',
  'content/cuts/pulled-pork.mdx',
  'content/methoden/direktes-grillen.mdx',
  'content/methoden/searing-perfekte-kruste.mdx',
  'content/methoden/smoken-low-and-slow.mdx',
  'content/methoden/sous-vide.mdx',
  'content/usa/carolinas.mdx',
  'content/usa/kansas-city.mdx',
  'content/usa/memphis.mdx',
  'content/usa/texas-style.mdx',
  'content/vergleich/fleischthermometer.mdx',
  'content/vergleich/grills.mdx',
  'content/vergleich/messer.mdx',
]);

const BILD_FELDER = /^(image|heroImage|ogImage|thumbnail):\s*["']?(https?:\/\/[^"'\s]+)/gm;

let altbestandTreffer = 0;
for (const f of contentFiles) {
  const relPfad = rel(f).split(sep).join('/');
  const txt = readFileSync(f, 'utf8');
  // Nur die Frontmatter betrachten, nicht den Fliesstext: ein Link im Text ist
  // etwas anderes als eine Bildquelle, die der Browser automatisch laedt.
  const fmEnde = txt.indexOf('\n---', 3);
  const fm = txt.startsWith('---') && fmEnde > 0 ? txt.slice(0, fmEnde + 1) : '';
  if (!fm) continue;
  for (const m of fm.matchAll(BILD_FELDER)) {
    if (BILD_ALTBESTAND.has(relPfad)) { altbestandTreffer++; continue; }
    const host = m[2].replace(/^https?:\/\//, '').split('/')[0];
    add('Externes Bild in Frontmatter', f, `${m[1]}: laedt von ${host} — Bild nach public/ legen und lokal referenzieren`);
  }
}

// ── 6) Bilder ohne Eintrag im Bildregister ──────────────────────────────────
// Im Streitfall liegt die Beweislast fuer die Lizenz bei uns. "War doch von
// Unsplash" ist kein Nachweis — Lizenzbedingungen aendern sich, und es gilt die
// Fassung zum Zeitpunkt des Downloads. Deshalb fuehrt data/bildregister.yaml
// jedes Bild unter public/ mit seiner Herkunft.
//
// Absichtlich hart fuer NEUE Bilder: ein Bild ohne Eintrag setzt den Build rot.
// Die Reibung ist der Zweck — sie erzwingt die Dokumentation im Moment des
// Hinzufuegens, nicht Monate spaeter, wenn niemand mehr weiss, woher es kam.
//
// Der Altbestand steht mit `status: offen` im Register und wird nur gezaehlt,
// nicht als Verstoss gewertet — gleiche Logik wie BILD_ALTBESTAND oben: sichtbar
// halten, abarbeiten, nicht wachsen lassen.
const BILD_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const REGISTER_PFAD = join(ROOT, 'data', 'bildregister.yaml');

let registerOffen = 0;
let registerNamensnennung = [];
if (existsSync(REGISTER_PFAD)) {
  const register = load(readFileSync(REGISTER_PFAD, 'utf8')) ?? {};
  const eintraege = register.bilder ?? {};

  for (const bild of walk(join(ROOT, 'public'), BILD_EXTS)) {
    const pfad = relative(join(ROOT, 'public'), bild).split(sep).join('/');
    const eintrag = eintraege[pfad];

    if (!eintrag) {
      add(
        'Bild ohne Registereintrag',
        bild,
        `kein Eintrag in data/bildregister.yaml — Herkunft und Lizenz dort eintragen (status: eigen | ki | lizenz)`,
      );
      continue;
    }
    if (eintrag.status === 'offen') { registerOffen++; continue; }

    // Fremdbild muss belegbar sein, sonst ist der Eintrag wertlos.
    if (eintrag.status === 'lizenz' && !(eintrag.quelle && eintrag.lizenz && eintrag.erworben_am)) {
      add(
        'Bildregister unvollstaendig',
        bild,
        'status: lizenz verlangt quelle, lizenz und erworben_am — ohne die drei ist der Eintrag kein Nachweis',
      );
    }
    // CC BY und CC BY-SA verlangen die Nennung AM Bild. In E-Mails kaum
    // umsetzbar, deshalb hier sichtbar machen statt still durchlaufen lassen.
    if (eintrag.namensnennung === true) registerNamensnennung.push(pfad);
  }
} else {
  add('Bildregister fehlt', REGISTER_PFAD, 'data/bildregister.yaml nicht gefunden — Regel 6 kann nicht pruefen');
}

// ── Report ───────────────────────────────────────────────────────────────────
const scanned = srcFiles.length + publicFiles.length + contentFiles.length;
if (violations.length === 0) {
  console.log(`✅ Legal-Guard: keine Abmahn-Regressionen (${scanned} Dateien geprüft).`);
  if (altbestandTreffer) {
    console.log(`   Hinweis: ${altbestandTreffer} externe Bild-URL(n) im Altbestand (BILD_ALTBESTAND, ${BILD_ALTBESTAND.size} Dateien) — geduldet, nicht geloest.`);
  }
  if (registerOffen) {
    console.log(`   Hinweis: ${registerOffen} Bild(er) im Bildregister mit "status: offen" — Herkunft noch nicht geklaert. Ziel ist null.`);
  }
  if (registerNamensnennung.length) {
    console.log(`   Hinweis: ${registerNamensnennung.length} Bild(er) mit Pflicht zur Namensnennung — in E-Mails meiden:`);
    for (const p of registerNamensnennung) console.log(`     · ${p}`);
  }
  process.exit(0);
}

console.error(`\n❌ Legal-Guard: ${violations.length} Verstoß/Verstöße gefunden:\n`);
const byRule = {};
for (const v of violations) (byRule[v.rule] ??= []).push(v);
for (const [rule, list] of Object.entries(byRule)) {
  console.error(`▸ ${rule}`);
  for (const v of list) console.error(`    ${v.file}\n      → ${v.detail}`);
  console.error('');
}
console.error('Begründung je Regel: compliance/website-rechtscheck.yaml');
process.exit(1);
