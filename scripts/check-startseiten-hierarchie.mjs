#!/usr/bin/env node
/**
 * check-startseiten-hierarchie.mjs — Build-Gate für die Reihenfolge der Startseite
 *
 * WARUM ES DIESES SKRIPT GIBT (Uwe, 20.08.2026):
 * Das Ausbildungsangebot (Diplome / Mitgliedschaft) ist wiederholt von selbst an den
 * Anfang der Startseite gewandert. Ursache war keine Nachlässigkeit, sondern die
 * Doktrin: CLAUDE.md Abschnitt 5 heißt „Kritische Blocker (Umsatz zuerst)" und nennt
 * „Diplom Bronze live" — eine Gegenregel zur Startseiten-Hierarchie gab es nicht.
 * Jeder Agent hat also folgerichtig das Angebot nach oben gezogen.
 *
 * Prosa allein hat das nicht verhindert. Deshalb bricht ab jetzt der Build.
 *
 * SOLL-HIERARCHIE (Entscheidung Uwe, 20.08.2026): INHALT ZUERST.
 * Der erste Bildschirm gehört dem Thema, nicht dem Angebot. Das Diplom erscheint
 * als Teaser weiter unten. Das entspricht der Strategie „Reichweite zuerst,
 * dann aktivieren".
 *
 * POSITION 1 IST ENDGUELTIG (Uwe, 27.08.2026): Der Magazin-Aufmacher (HERO)
 * steht an erster Stelle. Diese Entscheidung wurde bereits einmal getroffen und
 * spaeter ueber den "Soll-Liste bewusst anpassen"-Weg wieder umgestossen —
 * genau dieser Ausweg ist damit fuer Position 1 GESCHLOSSEN. Das Skript unten
 * erzwingt HERO an Position 1 unabhaengig vom Inhalt der Soll-Liste; wer das
 * aendern will, braucht ein woertliches Uwe-Zitat mit Datum in CLAUDE.md
 * Regel 8 UND muss diesen Riegel hier ausbauen. Ein Agent tut das nicht.
 *
 * Fuer die Abschnitte AB Position 3 bleibt der alte Weg: Soll-Liste anpassen
 * und in CLAUDE.md vermerken. Wer nur page.tsx umbaut, bekommt einen roten
 * Build. Genau das ist der Zweck.
 *
 * KOPFBEREICH NEU (Uwe, 02.09.2026) — hebt die 27.08.-Entscheidung auf, auf dem
 * dafuer vorgesehenen Weg (woertliches Uwe-Zitat mit Datum in CLAUDE.md Regel 8):
 *   "Folgendes tauschen. Bild 1 an die Stelle von Bild 2 verschieben. Den
 *    grossen Quadratischen Button nach unten setzen. Bild 1 war die eigentliche
 *    Headbereich-Website. Was mich aber stoert ist der grosse Button auf den
 *    ersten Blick."  (Bild 1 = VALUE-PROP-BAND, Bild 2 = HERO)
 * Neue Reihenfolge, per Riegel erzwungen: VALUE-PROP-BAND (H1 + Rubriken, OHNE
 * Button) → HERO → SECONDARY ARTICLES → MITGLIEDER-CTA (der Gold-Button). Und:
 * oberhalb des HERO darf KEIN Mitglieder-CTA (/auth/login) stehen — der Button
 * gehoert nicht auf den ersten Bildschirm. Aendern kann das wieder nur Uwe
 * selbst, mit Zitat und Datum in CLAUDE.md Regel 8 UND Umbau des Riegels.
 */

import { readFileSync } from 'node:fs';

const DATEI = 'src/app/page.tsx';

/** Marker-Kommentare in src/app/page.tsx, in der verbindlichen Reihenfolge. */
// GEAENDERT (Uwe, 27.08.2026): HERO an Position 1 (Magazin-Aufmacher zuerst).
// GEAENDERT (Uwe, 02.09.2026): VALUE-PROP-BAND (H1 + Rubriken) ist wieder der
// Kopfbereich, HERO folgt direkt danach; der Mitglieder-Button wurde aus dem
// Kopfbereich in einen eigenen Abschnitt MITGLIEDER-CTA unterhalb der
// Artikel-Reihe verschoben. Vermerkt in CLAUDE.md Regel 8 (woertliches Zitat).
const SOLL_REIHENFOLGE = [
  'VALUE-PROP-BAND',
  'HERO',
  'SECONDARY ARTICLES',
  'MITGLIEDER-CTA',
  'WERKZEUGE',
  'LEADMAGNET',
  'PLATTFORM-PULS',
  'FRISCH & SAISONAL',
  'MANIFESTO',
  'DIPLOM-TEASER',
  // GEAENDERT (09.10.2026, Gutschein-Konzept T8, freigegeben von Uwe im Chat):
  // saisonaler Gutschein-Teaser direkt unter dem Diplom-Teaser — Angebot, also
  // weit unten. Vermerkt in CLAUDE.md Regel 8.
  'GUTSCHEIN-TEASER',
  'BBQ-NEWS TEASER',
  'KATEGORIE-SEKTIONEN',
  'TOP-PRODUKTE',
  'NEUESTE ARTIKEL',
  'TRUST-BAR',
];

// ── RIEGEL (Uwe, 02.09.2026): VALUE-PROP-BAND an Position 1, HERO an 2,
// Artikel-Reihe an 3, MITGLIEDER-CTA an 4. Faengt auch den Fall, dass eine
// kuenftige Session die Soll-Liste selbst "regelkonform" umsortiert — dieser
// Fehler ist genau so schon einmal passiert (27.08. → davor ebenso).
const RIEGEL = ['VALUE-PROP-BAND', 'HERO', 'SECONDARY ARTICLES', 'MITGLIEDER-CTA'];
if (RIEGEL.some((m, i) => SOLL_REIHENFOLGE[i] !== m)) {
  console.error('❌ RIEGEL: Positionen 1–4 muessen lauten: ' + RIEGEL.join(' → '));
  console.error('   Diese Reihenfolge ist eine Uwe-Entscheidung (02.09.2026) — auch eine');
  console.error('   Aenderung der Soll-Liste hebt sie nicht auf. Siehe Kopfkommentar.');
  process.exit(1);
}

/**
 * Abschnitte, die NICHT über einer bestimmten Grenze stehen dürfen.
 * Der Diplom-Teaser darf nie vor den redaktionellen Einstieg rutschen.
 */
const NICHT_VOR = [
  { abschnitt: 'DIPLOM-TEASER', darf_nicht_vor: 'KATEGORIE-SEKTIONEN', ausnahme: 'MANIFESTO' },];

/** Höchstzahl an Links auf /diplome oberhalb des HERO-Abschnitts. */
const MAX_DIPLOM_LINKS_OBEN = 1;
/** Höchstzahl an Mitglieder-CTAs (/auth/login) oberhalb des HERO-Abschnitts (Uwe, 02.09.2026). */
const MAX_CTA_LINKS_OBEN = 0;

const quelle = readFileSync(DATEI, 'utf8');
const zeilen = quelle.split('\n');
const fehler = [];

// ── 1) Reihenfolge der Marker ───────────────────────────────────────────────
const gefunden = [];
zeilen.forEach((zeile, i) => {
  for (const marker of SOLL_REIHENFOLGE) {
    if (zeile.includes('──') && zeile.includes(marker) && !gefunden.some((g) => g.marker === marker)) {
      gefunden.push({ marker, zeile: i + 1 });
    }
  }
});

const fehlend = SOLL_REIHENFOLGE.filter((m) => !gefunden.some((g) => g.marker === m));
if (fehlend.length) {
  fehler.push(
    `Abschnitte fehlen oder wurden umbenannt: ${fehlend.join(', ')}\n` +
      `   → Wenn das gewollt ist, SOLL_REIHENFOLGE in diesem Skript anpassen.`,
  );
}

const ist = gefunden.map((g) => g.marker);
const sollGefiltert = SOLL_REIHENFOLGE.filter((m) => ist.includes(m));
if (ist.join('|') !== sollGefiltert.join('|')) {
  fehler.push(
    `Reihenfolge weicht ab.\n` +
      `   SOLL: ${sollGefiltert.join(' → ')}\n` +
      `   IST:  ${ist.join(' → ')}`,
  );
}

// ── 2) Diplom-Teaser nicht nach oben gerutscht ──────────────────────────────
for (const regel of NICHT_VOR) {
  const a = gefunden.find((g) => g.marker === regel.abschnitt);
  const b = gefunden.find((g) => g.marker === regel.darf_nicht_vor);
  if (a && b && a.zeile > b.zeile) {
    fehler.push(
      `„${regel.abschnitt}" steht in Zeile ${a.zeile} und damit NACH „${regel.darf_nicht_vor}" (Zeile ${b.zeile}) — erwartet war davor.`,
    );
  }
}

// ── 3) Angebots-Links oberhalb des HERO begrenzen ───────────────────────────
const heroZeile = gefunden.find((g) => g.marker === 'HERO')?.zeile ?? zeilen.length;
const obenDrueber = zeilen.slice(0, heroZeile).join('\n');
const diplomLinks = (obenDrueber.match(/href=["']\/diplome/g) || []).length;
if (diplomLinks > MAX_DIPLOM_LINKS_OBEN) {
  fehler.push(
    `${diplomLinks} Links auf /diplome oberhalb des HERO-Abschnitts — erlaubt ist maximal ${MAX_DIPLOM_LINKS_OBEN}.\n` +
      `   Der erste Bildschirm gehört dem Inhalt, nicht dem Angebot (CLAUDE.md Abschnitt 2).`,
  );
}

// ── 4) Mitglieder-CTA nicht auf dem ersten Bildschirm (Uwe, 02.09.2026) ─────
// "Was mich aber stoert ist der grosse Button auf den ersten Blick."
// Oberhalb des HERO-Abschnitts darf kein Link auf /auth/login stehen.
const ctaLinksOben = (obenDrueber.match(/href=["']\/auth\/login/g) || []).length;
if (ctaLinksOben > MAX_CTA_LINKS_OBEN) {
  fehler.push(
    `${ctaLinksOben} Mitglieder-CTA(s) (/auth/login) oberhalb des HERO-Abschnitts — erlaubt ist ${MAX_CTA_LINKS_OBEN}.\n` +
      `   Der Button gehoert unter den ersten Bildschirm (Uwe, 02.09.2026; Abschnitt MITGLIEDER-CTA).`,
  );
}

// ── Ergebnis ────────────────────────────────────────────────────────────────
if (fehler.length) {
  console.error('\n❌ Startseiten-Hierarchie verletzt (' + DATEI + ')\n');
  fehler.forEach((f) => console.error('   • ' + f + '\n'));
  console.error(
    '   Hintergrund: Das Ausbildungsangebot ist mehrfach unbemerkt nach oben gewandert.\n' +
      '   Die Reihenfolge ist eine Entscheidung von Uwe (20.08.2026), keine Optimierungsfrage.\n' +
      '   Änderung nur bewusst: SOLL_REIHENFOLGE in scripts/check-startseiten-hierarchie.mjs\n' +
      '   anpassen und in CLAUDE.md Abschnitt 2 vermerken.\n',
  );
  process.exit(1);
}

console.log(`✅ Startseiten-Hierarchie unverändert (${ist.length} Abschnitte, ${diplomLinks} Diplom-Link(s), ${ctaLinksOben} Mitglieder-CTA(s) oberhalb HERO)`);
