import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
// Benannter Import, NICHT der Default. Beide Einstiegspunkte des Pakets
// koennen `parse`; einen Default hat nur einer von beiden. Details in
// src/types/opentype.d.ts.
import { parse as parseSchrift, type Font } from 'opentype.js';
import sharp from 'sharp';
import boxenJson from './vorlagen/boxen.json';

/**
 * Rendert eine druckfertige Urkunde — ohne Browser.
 *
 * Warum ohne Browser: Auf Vercel laeuft kein Chromium. Die frueheren
 * Renderings entstanden lokal mit Playwright; das ist fuer eine Bestellung,
 * die automatisch beim Druckdienst landen soll, kein gangbarer Weg.
 *
 * Wie es stattdessen geht: Das fertige Design liegt als 300-dpi-Vorlage bereit
 * (scripts/urkunden-vorlagen.mjs erzeugt sie mit Playwright). In der Vorlage
 * fehlen genau drei Dinge — Name, Datum, Urkunden-Nummer. Die setzt diese
 * Datei als SVG-Pfade (opentype.js) an die Stellen, die beim Erzeugen der
 * Vorlage im Browser vermessen wurden, und rastert mit sharp.
 *
 * Nachgeprueft am 10.09.2026: Gegen einen echten Browser-Render derselben
 * Daten weicht das Ergebnis um hoechstens einen Pixel bei 300 dpi ab
 * (0,085 mm) — deutlich unter dem, was im Druck sichtbar waere.
 *
 * Zwei Vorlagen je Stufe: Die Textspalte ist ein Flex-Layout mit
 * justify-content:space-between. Ein zweizeiliger Name verschiebt damit alles
 * darunter. Welche Vorlage passt, entscheidet die gemessene Textbreite.
 */

// ── Vorlagen-Vermessung ──────────────────────────────────────────────────────

type Feld = {
  grundlinie: number;
  grundlinieLetzte: number;
  zeilenabstand: number;
  textLinks: number;
  textBreite: number;
  kastenLinks: number;
  kastenRechts: number;
  schriftgroesse: number;
  schriftfamilie: string;
  schriftschnitt: string;
  laufweite: number;
  ausrichtung: string;
  farbe: string;
};

type Variante = { seite: { breite: number; hoehe: number }; felder: Record<'name' | 'datum' | 'nr', Feld> };
type Vermessung = { dpi: number; skalierung: number; stufen: Record<string, Record<'1z' | '2z', Variante>> };

const boxen = boxenJson as unknown as Vermessung;

const VORLAGEN_ORDNER = path.join(process.cwd(), 'src', 'lib', 'urkunde', 'vorlagen');
const SCHRIFTEN_ORDNER = path.join(process.cwd(), 'src', 'lib', 'urkunde', 'schriften');

// ── Schriften ────────────────────────────────────────────────────────────────
// Einmal je Lambda-Instanz geladen. Die Dateien sind ueber
// outputFileTracingIncludes (next.config.mjs) im Deploy enthalten.

const schriftCache = new Map<string, Promise<Font>>();

function schrift(datei: string): Promise<Font> {
  let p = schriftCache.get(datei);
  if (!p) {
    p = fs.readFile(path.join(SCHRIFTEN_ORDNER, datei)).then((buf) =>
      parseSchrift(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer),
    );
    schriftCache.set(datei, p);
  }
  return p;
}

const SCHRIFT_NAME = 'PlayfairDisplay-SemiBold.ttf';
const SCHRIFT_TEXT = 'DMSans-Regular.ttf';

// ── Textmessung und Pfade ────────────────────────────────────────────────────

/**
 * Breite eines Textes inklusive Kerning und CSS-Laufweite. Die Laufweite sitzt
 * — wie im Browser — auch hinter dem letzten Zeichen; nur so stimmt die Breite
 * mit der ueberein, die beim Vermessen der Vorlage herauskam.
 */
export function textBreite(font: Font, text: string, groesse: number, laufweite: number): number {
  // Array.from statt Spread: Das Projekt legt kein target fest, und
  // unter ES5 laesst sich ein String nicht ohne downlevelIteration spreaden.
  const zeichen = Array.from(text);
  let breite = 0;
  for (let i = 0; i < zeichen.length; i++) {
    const g = font.charToGlyph(zeichen[i]);
    breite += (g.advanceWidth / font.unitsPerEm) * groesse;
    if (i > 0) breite += (font.getKerningValue(font.charToGlyph(zeichen[i - 1]), g) / font.unitsPerEm) * groesse;
    breite += laufweite;
  }
  return breite;
}

/** Eine Textzeile als SVG-Pfad. y ist die Grundlinie, x der linke Rand. */
function zeilePfad(
  font: Font, text: string, x: number, y: number,
  groesse: number, laufweite: number, farbe: string,
): string {
  // Array.from statt Spread: Das Projekt legt kein target fest, und
  // unter ES5 laesst sich ein String nicht ohne downlevelIteration spreaden.
  const zeichen = Array.from(text);
  const teile: string[] = [];
  let cx = x;
  for (let i = 0; i < zeichen.length; i++) {
    const g = font.charToGlyph(zeichen[i]);
    if (i > 0) cx += (font.getKerningValue(font.charToGlyph(zeichen[i - 1]), g) / font.unitsPerEm) * groesse;
    const d = g.getPath(cx, y, groesse).toPathData(2);
    if (d) teile.push(d);
    cx += (g.advanceWidth / font.unitsPerEm) * groesse + laufweite;
  }
  return teile.length ? `<path fill="${farbe}" d="${teile.join(' ')}"/>` : '';
}

/**
 * Umbruch wie text-wrap:balance im Original-Design: an der Wortluecke, die die
 * breitere der beiden Zeilen so schmal wie moeglich macht.
 */
function ausgewogenerUmbruch(font: Font, text: string, groesse: number, laufweite: number) {
  const woerter = text.split(/\s+/).filter(Boolean);
  if (woerter.length < 2) return null;
  let beste: { zeilen: [string, string]; max: number } | null = null;
  for (let i = 1; i < woerter.length; i++) {
    const a = woerter.slice(0, i).join(' ');
    const b = woerter.slice(i).join(' ');
    const max = Math.max(textBreite(font, a, groesse, laufweite), textBreite(font, b, groesse, laufweite));
    if (!beste || max < beste.max) beste = { zeilen: [a, b], max };
  }
  return beste;
}

export type NamensLayout = { variante: '1z' | '2z'; zeilen: string[]; groesse: number; verkleinert: boolean };

/**
 * Zeilenaufteilung und Schriftgroesse fuer den Namen: erst einzeilig in
 * Originalgroesse, dann zweizeilig, erst zuletzt verkleinern. Verkleinert wird
 * in Ein-Prozent-Schritten, damit ein sehr langer Name die Spalte nicht
 * sprengt — auf einer Urkunde ist ein etwas kleinerer Name allemal besser als
 * ein abgeschnittener.
 */
export function namensLayout(font: Font, text: string, maxBreite: number, groesse: number, laufweite: number): NamensLayout {
  if (textBreite(font, text, groesse, laufweite) <= maxBreite) {
    return { variante: '1z', zeilen: [text], groesse, verkleinert: false };
  }
  const umbruch = ausgewogenerUmbruch(font, text, groesse, laufweite);
  if (umbruch && umbruch.max <= maxBreite) {
    return { variante: '2z', zeilen: umbruch.zeilen, groesse, verkleinert: false };
  }
  for (let f = 0.99; f >= 0.5; f -= 0.01) {
    const g = groesse * f;
    const u = ausgewogenerUmbruch(font, text, g, laufweite);
    if (u && u.max <= maxBreite) return { variante: '2z', zeilen: u.zeilen, groesse: g, verkleinert: true };
    if (!u && textBreite(font, text, g, laufweite) <= maxBreite) {
      return { variante: '1z', zeilen: [text], groesse: g, verkleinert: true };
    }
  }
  return { variante: '2z', zeilen: umbruch ? umbruch.zeilen : [text], groesse: groesse * 0.5, verkleinert: true };
}

// ── Hauptfunktion ────────────────────────────────────────────────────────────

export type UrkundenDaten = {
  /** 1–5 */
  stufe: number;
  /** Name, wie er auf der Urkunde stehen soll */
  name: string;
  /** Ausgeschriebenes Datum, z. B. „10. September 2026" */
  datum: string;
  /** Vollstaendige Zeile, z. B. „Urkunden-Nr. SA-2026-0001" */
  nr: string;
};

export type Urkunde = { png: Buffer; layout: NamensLayout; breite: number; hoehe: number };

export async function rendereUrkunde({ stufe, name, datum, nr }: UrkundenDaten): Promise<Urkunde> {
  const stufenBoxen = boxen.stufen[String(stufe)];
  if (!stufenBoxen) throw new Error(`Keine Urkunden-Vorlage fuer Stufe ${stufe}`);

  const skala = boxen.skalierung;
  const [fontName, fontText] = await Promise.all([schrift(SCHRIFT_NAME), schrift(SCHRIFT_TEXT)]);

  // Der Namenskasten ist in beiden Varianten gleich breit — die Aufteilung
  // laesst sich also vor der Wahl der Vorlage bestimmen.
  const nBasis = stufenBoxen['1z'].felder.name;
  const maxBreite = (nBasis.kastenRechts - nBasis.kastenLinks) * 0.99;
  const layout = namensLayout(fontName, name.trim(), maxBreite, nBasis.schriftgroesse, nBasis.laufweite);

  const variante = stufenBoxen[layout.variante];
  const vorlage = path.join(VORLAGEN_ORDNER, `stufe-${stufe}-${layout.variante}.png`);
  const basis = sharp(await fs.readFile(vorlage));
  const meta = await basis.metadata();
  const breite = meta.width ?? 0;
  const hoehe = meta.height ?? 0;

  const teile: string[] = [];

  // Name — zentriert ueber der Textspalte, Grundlinien aus der Vorlage
  const nb = variante.felder.name;
  const grundlinien = layout.zeilen.length === 1 ? [nb.grundlinie] : [nb.grundlinie, nb.grundlinieLetzte];
  const mitte = (nb.kastenLinks + nb.kastenRechts) / 2;
  layout.zeilen.forEach((zeile, i) => {
    const b = textBreite(fontName, zeile, layout.groesse, nb.laufweite);
    teile.push(zeilePfad(
      fontName, zeile,
      (mitte - b / 2) * skala, grundlinien[i] * skala,
      layout.groesse * skala, nb.laufweite * skala, nb.farbe,
    ));
  });

  // Datum — zentriert im eigenen Kasten
  const db = variante.felder.datum;
  const dBreite = textBreite(fontText, datum, db.schriftgroesse, db.laufweite);
  teile.push(zeilePfad(
    fontText, datum,
    ((db.kastenLinks + db.kastenRechts) / 2 - dBreite / 2) * skala, db.grundlinie * skala,
    db.schriftgroesse * skala, db.laufweite * skala, db.farbe,
  ));

  // Urkunden-Nummer — linksbuendig
  const rb = variante.felder.nr;
  teile.push(zeilePfad(
    fontText, nr,
    rb.kastenLinks * skala, rb.grundlinie * skala,
    rb.schriftgroesse * skala, rb.laufweite * skala, rb.farbe,
  ));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${breite}" height="${hoehe}" viewBox="0 0 ${breite} ${hoehe}">${teile.join('')}</svg>`;

  const png = await basis
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .withMetadata({ density: boxen.dpi })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return { png, layout, breite, hoehe };
}

// Seit 17.10.2026 in ./datum.ts (ohne 'server-only'), weil die Web-Vorschau dasselbe Format braucht.
export { urkundenDatum } from './datum';
