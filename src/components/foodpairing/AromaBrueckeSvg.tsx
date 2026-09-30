/**
 * Aroma-Brücke — zwei Zutaten, dazwischen ihre gemeinsamen Schlüssel-Aromen als
 * Bögen. Eigenes Motiv der Steakakademie (Glutlicht-Palette), rein darstellend,
 * ohne Hooks: nutzbar in Server- und Client-Komponenten.
 */

type Bruecke = { note: string; stoff: string };

export default function AromaBrueckeSvg({
  a,
  b,
  subA,
  subB,
  bruecken,
  className,
  titel,
  idSuffix = 'x',
}: {
  a: string;
  b: string;
  subA?: string;
  subB?: string;
  bruecken: readonly Bruecke[];
  className?: string;
  titel: string;
  /** Eindeutiger Suffix für Gradient-IDs, falls die Grafik mehrfach auf einer Seite steht. */
  idSuffix?: string;
}) {
  const W = 480;
  const H = 270;
  const xa = 88;
  const xb = W - 88;
  const cy = 142;
  const rr = 58;
  const n = bruecken.length;
  const abstand = n > 1 ? Math.min(62, 150 / (n - 1)) : 0;
  const glut = `glut-${idSuffix}`;
  const linie = `linie-${idSuffix}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={titel}>
      <title>{titel}</title>
      <defs>
        <radialGradient id={glut} cx="50%" cy="95%" r="75%">
          <stop offset="0%" stopColor="#E85018" stopOpacity={0.4} />
          <stop offset="55%" stopColor="#2D2218" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#0F0A06" stopOpacity={0} />
        </radialGradient>
        {/* userSpaceOnUse: bei der geraden Mittelbrücke ist die Bounding-Box 0 hoch — objectBoundingBox würde sie unsichtbar machen. */}
        <linearGradient id={linie} gradientUnits="userSpaceOnUse" x1={xa} x2={xb} y1={0} y2={0}>
          <stop offset="0%" stopColor="#E85018" />
          <stop offset="100%" stopColor="#C8882A" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="#140D08" />
      <rect width={W} height={H} fill={`url(#${glut})`} />

      {bruecken.map((br, i) => {
        const y = cy + (i - (n - 1) / 2) * abstand;
        // Endpunkte auf dem Kreisrand, Kurve läuft mittig genau durch die Pille.
        const ye = cy + (y - cy) * 0.55;
        const dx = Math.sqrt(Math.max(rr * rr - (ye - cy) * (ye - cy), 0));
        const x1 = xa + dx;
        const x2 = xb - dx;
        const yc = (y - 0.25 * ye) / 0.75;
        return (
          <g key={br.note}>
            <path
              d={`M ${x1} ${ye} C ${x1 + 60} ${yc}, ${x2 - 60} ${yc}, ${x2} ${ye}`}
              fill="none"
              stroke={`url(#${linie})`}
              strokeWidth={2.5}
              strokeOpacity={0.85}
            />
            <rect x={W / 2 - 58} y={y - 14} width={116} height={24} rx={12} fill="#1E1410" stroke="#C8882A" strokeOpacity={0.7} />
            <text x={W / 2} y={y - 2} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill="#F0E8D8">
              {br.note}
            </text>
            <text x={W / 2} y={y + 19} textAnchor="middle" fontSize={10.5} fill="#947D6C">
              {br.stoff}
            </text>
          </g>
        );
      })}

      {[
        { x: xa, name: a, sub: subA, farbe: '#E85018' },
        { x: xb, name: b, sub: subB, farbe: '#C8882A' },
      ].map((k) => (
        <g key={k.name}>
          <circle cx={k.x} cy={cy} r={rr + 8} fill={k.farbe} fillOpacity={0.12} />
          <circle cx={k.x} cy={cy} r={rr} fill="#2D2218" stroke={k.farbe} strokeWidth={3} />
          <text
            x={k.x}
            y={k.sub ? cy - 6 : cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={k.name.length > 7 ? 15.5 : 19}
            fontWeight={700}
            fill="#F0E8D8"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            {k.name}
          </text>
          {k.sub && (
            <text x={k.x} y={cy + 16} textAnchor="middle" fontSize={10.5} fill="#C4A882">
              {k.sub}
            </text>
          )}
        </g>
      ))}

      <text x={W / 2} y={26} textAnchor="middle" fontSize={11} fontWeight={700} letterSpacing={2.5} fill="#C8882A">
        {n === 1 ? '1 GEMEINSAMES SCHLÜSSEL-AROMA' : `${n} GEMEINSAME SCHLÜSSEL-AROMEN`}
      </text>
    </svg>
  );
}
