import type { CSSProperties } from 'react';
import Image from 'next/image';
import { vorschauBild, vorschauLayout, type VorschauFeld } from '@/lib/urkunde/vorschau-layout';
import { urkundenDatum } from '@/lib/urkunde/datum';

/**
 * Vorschau der gedruckten Urkunde — dasselbe Bild, das in den Druck geht.
 *
 * Hintergrund ist die 300-dpi-Vorlage der Stufe, verkleinert auf 1600 px
 * (scripts/urkunden-vorschau.mjs). Name und Datum liegen als HTML-Text an den
 * Stellen, die scripts/urkunden-vorlagen.mjs im Browser vermessen hat — mit
 * denselben Schriften (Playfair Display, DM Sans), die die Seite ohnehin laedt.
 *
 * Was die Vorschau NICHT exakt zeigt: Bei sehr langen Namen setzt render.ts
 * eine zweizeilige Vorlage (2z) und rueckt Datum und Nummer nach; hier bricht
 * der Name nur um. Die Urkunden-Nummer entsteht erst bei der Ausstellung und
 * bleibt deshalb leer. Beides steht in der Bildunterschrift der Seite.
 */

type Props = {
  stufe: number;
  name: string;
  /** Text, solange kein Name eingegeben ist. */
  platzhalter?: string;
  datum?: Date;
};

/**
 * Anteil der Zeilenhoehe (line-height: 1) ueber der Grundlinie. Playfair Display
 * und DM Sans liegen bei rund 0,78 — die Abweichung zum Druck bleibt damit unter
 * einem Zehntel der Schrifthoehe, fuer eine Vorschau ausreichend.
 */
const GRUNDLINIEN_ANTEIL = 0.78;

function feldStil(f: VorschauFeld, schrift: string): CSSProperties {
  return {
    position: 'absolute',
    left: `${f.left * 100}%`,
    width: `${f.width * 100}%`,
    top: `${f.baseline * 100}%`,
    transform: `translateY(-${GRUNDLINIEN_ANTEIL * 100}%)`,
    fontSize: `${f.fontSize * 100}cqw`,
    letterSpacing: `${f.letterSpacing}em`,
    lineHeight: 1,
    textAlign: f.align,
    color: f.color,
    fontFamily: schrift,
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    margin: 0,
  };
}

const SCHRIFT_NAME = '"Playfair Display", Georgia, serif';
const SCHRIFT_TEXT = '"DM Sans", system-ui, sans-serif';

export default function UrkundeVorschau({ stufe, name, platzhalter = 'Dein Name', datum = new Date() }: Props) {
  const layout = vorschauLayout(stufe);
  const datumText = urkundenDatum(datum);
  const nameText = name.trim();

  return (
    <div
      className="relative w-full overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
      style={{ aspectRatio: String(layout.seitenverhaeltnis), containerType: 'inline-size' }}
      data-testid="urkunde-vorschau"
    >
      <Image
        src={vorschauBild(stufe)}
        alt={`Vorschau der gedruckten Urkunde, Stufe ${stufe}`}
        fill
        sizes="(min-width: 1024px) 896px, 100vw"
        priority
        className="object-cover"
      />
      <p
        aria-live="polite"
        style={{
          ...feldStil(layout.name, SCHRIFT_NAME),
          fontWeight: 600,
          fontStyle: nameText ? 'normal' : 'italic',
          opacity: nameText ? 1 : 0.45,
        }}
      >
        {nameText || platzhalter}
      </p>
      <p style={feldStil(layout.datum, SCHRIFT_TEXT)}>{datumText}</p>
    </div>
  );
}
