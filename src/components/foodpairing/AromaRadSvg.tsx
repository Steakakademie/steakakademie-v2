/**
 * Aroma-Rad — radiale Pairing-Grafik (eigenes Design, Daten aus data/foodpairing).
 * Mitte: Ausgangszutat. Speichen: Partner mit geteilten Schlüssel-Aromastoffen.
 * Punktgröße und Linienstärke wachsen mit der Zahl geteilter Stoffe; die Farbe
 * zeigt die Zutatengruppe. Rein darstellend — Auswahl steuert der Aufrufer.
 */

export type RadPunkt = { name: string; kategorie: string; anzahl: number };

export const GRUPPEN = [
  { label: 'Fleisch & Meer', farbe: '#E85018', kategorien: ['Fleisch', 'Geflügel', 'Fisch', 'Meeresfrüchte'] },
  { label: 'Röstiges & Nüsse', farbe: '#C8882A', kategorien: ['Geröstetes', 'Nüsse', 'Getreide', 'Backwaren'] },
  { label: 'Frucht', farbe: '#E0607E', kategorien: ['Obst'] },
  { label: 'Gemüse, Kräuter & Pilze', farbe: '#8DB86B', kategorien: ['Gemüse', 'Kräuter', 'Pilze'] },
  { label: 'Gewürze & Würzen', farbe: '#5FB8B0', kategorien: ['Gewürze', 'Würzen'] },
  { label: 'Milch, Öl & Süßes', farbe: '#E6D5C3', kategorien: ['Milchprodukte', 'Öle', 'Süßes'] },
  { label: 'Getränke', farbe: '#A98BD6', kategorien: ['Getränke'] },
] as const;

export function gruppenFarbe(kategorie: string): string {
  return GRUPPEN.find((g) => (g.kategorien as readonly string[]).includes(kategorie))?.farbe ?? '#947D6C';
}

type Props = {
  zentrum: string;
  zentrumSub?: string;
  punkte: RadPunkt[];
  aktiv?: string | null;
  onWaehlen?: (name: string) => void;
  /** Kachel-Variante: kleinere Schrift, keine Zahlen in den Punkten. */
  kompakt?: boolean;
  className?: string;
  titel: string;
};

export default function AromaRadSvg({ zentrum, zentrumSub, punkte, aktiv, onWaehlen, kompakt, className, titel }: Props) {
  const R = kompakt ? 118 : 140;
  const max = punkte.reduce((m, p) => Math.max(m, p.anzahl), 1);
  const n = Math.max(punkte.length, 1);
  const fs = kompakt ? 15 : 14.5;
  const vb = kompakt ? '-235 -168 470 336' : '-250 -205 500 410';

  return (
    <svg viewBox={vb} className={className} role="img" aria-label={titel}>
      <title>{titel}</title>
      <circle r={R} fill="none" stroke="#C8882A" strokeOpacity={0.18} strokeDasharray="3 5" />
      <circle r={R * 0.62} fill="none" stroke="#C8882A" strokeOpacity={0.1} />

      {punkte.map((p, i) => {
        const w = ((-90 + (i * 360) / n) * Math.PI) / 180;
        const cos = Math.cos(w);
        const sin = Math.sin(w);
        const staerke = p.anzahl / max;
        const pr = (kompakt ? 7 : 8) + staerke * (kompakt ? 5 : 7);
        const farbe = gruppenFarbe(p.kategorie);
        const istAktiv = aktiv === p.name;
        const gedimmt = !!aktiv && !istAktiv;
        const lx = cos * (R + pr + 7);
        const ly = sin * (R + pr + 7);
        const anchor = cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle';
        const dy = Math.abs(cos) <= 0.25 ? (sin < 0 ? -4 : 12) : 4;
        const interaktiv = !!onWaehlen;

        return (
          <g
            key={p.name}
            opacity={gedimmt ? 0.6 : 1}
            className={interaktiv ? 'cursor-pointer outline-none [&:focus-visible>circle]:stroke-[#F0E8D8]' : undefined}
            role={interaktiv ? 'button' : undefined}
            tabIndex={interaktiv ? 0 : undefined}
            aria-pressed={interaktiv ? istAktiv : undefined}
            aria-label={interaktiv ? `${p.name}: ${p.anzahl} gemeinsame Schlüssel-Aromen` : undefined}
            onClick={interaktiv ? () => onWaehlen(p.name) : undefined}
            onKeyDown={
              interaktiv
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onWaehlen(p.name);
                    }
                  }
                : undefined
            }
          >
            <line
              x1={cos * 50}
              y1={sin * 50}
              x2={cos * (R - pr)}
              y2={sin * (R - pr)}
              stroke={farbe}
              strokeOpacity={istAktiv ? 0.95 : 0.35 + staerke * 0.4}
              strokeWidth={(istAktiv ? 1.5 : 0.8) + staerke * 2.4}
              strokeLinecap="round"
            />
            <circle
              cx={cos * R}
              cy={sin * R}
              r={pr}
              fill={farbe}
              fillOpacity={istAktiv ? 1 : 0.9}
              stroke={istAktiv ? '#F0E8D8' : '#17100B'}
              strokeWidth={istAktiv ? 2.5 : 1.5}
            />
            {!kompakt && (
              <text
                x={cos * R}
                y={sin * R}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11.5}
                fontWeight={700}
                fill="#17100B"
              >
                {p.anzahl}
              </text>
            )}
            <text
              x={lx}
              y={ly + dy}
              textAnchor={anchor}
              fontSize={fs}
              fontWeight={istAktiv ? 700 : 500}
              fill={istAktiv ? '#F0E8D8' : '#C4A882'}
            >
              {p.name}
            </text>
          </g>
        );
      })}

      <circle r={48} fill="#2D2218" stroke="#C8882A" strokeWidth={2.5} />
      <text
        y={zentrumSub ? -4 : 0}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={kompakt ? 19 : 16}
        fontWeight={700}
        fill="#F0E8D8"
        style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
      >
        {zentrum}
      </text>
      {zentrumSub && (
        <text y={15} textAnchor="middle" fontSize={kompakt ? 11 : 9.5} fill="#C4A882">
          {zentrumSub}
        </text>
      )}
    </svg>
  );
}
