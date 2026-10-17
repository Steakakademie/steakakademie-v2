import boxenJson from './vorlagen/boxen.json';

/**
 * Geometrie der Web-Vorschau — abgeleitet aus derselben Vermessung, mit der
 * render.ts die gedruckte Urkunde setzt (vorlagen/boxen.json, Variante 1z).
 *
 * Alle Werte sind Anteile an Seitenbreite bzw. -hoehe (0–1), damit die
 * Vorschau in jeder Breite passt: `left`/`width` relativ zur Breite,
 * `baseline` relativ zur Hoehe, `fontSize` relativ zur Breite (CSS `cqw`),
 * `letterSpacing` in em. Kein 'server-only': die Bestellseite ist ein
 * Client-Bauteil und braucht die Zahlen im Browser; das JSON ist 18 KB.
 */

type Feld = {
  grundlinie: number;
  kastenLinks: number;
  kastenRechts: number;
  schriftgroesse: number;
  laufweite: number;
  ausrichtung: string;
  farbe: string;
};
type Variante = { seite: { breite: number; hoehe: number }; felder: Record<'name' | 'datum' | 'nr', Feld> };
type Vermessung = { stufen: Record<string, Record<'1z' | '2z', Variante>> };

const boxen = boxenJson as unknown as Vermessung;

export type VorschauFeld = {
  left: number;
  width: number;
  baseline: number;
  fontSize: number;
  letterSpacing: number;
  color: string;
  align: 'left' | 'center';
};

export type VorschauLayout = {
  /** Breite / Hoehe der Seite — fuer `aspect-ratio`. */
  seitenverhaeltnis: number;
  name: VorschauFeld;
  datum: VorschauFeld;
};

export const VORSCHAU_STUFEN = [1, 2, 3, 4, 5] as const;

export function vorschauBild(stufe: number): string {
  return `/images/urkunde/vorschau-stufe-${stufe}.webp`;
}

function feld(f: Feld, seite: Variante['seite']): VorschauFeld {
  return {
    left: f.kastenLinks / seite.breite,
    width: (f.kastenRechts - f.kastenLinks) / seite.breite,
    baseline: f.grundlinie / seite.hoehe,
    fontSize: f.schriftgroesse / seite.breite,
    letterSpacing: f.laufweite / f.schriftgroesse,
    color: f.farbe,
    align: f.ausrichtung === 'left' ? 'left' : 'center',
  };
}

export function vorschauLayout(stufe: number): VorschauLayout {
  const v = boxen.stufen[String(stufe)]?.['1z'];
  if (!v) throw new Error(`Keine Urkunden-Vorlage fuer Stufe ${stufe}`);
  return {
    seitenverhaeltnis: v.seite.breite / v.seite.hoehe,
    name: feld(v.felder.name, v.seite),
    datum: feld(v.felder.datum, v.seite),
  };
}
