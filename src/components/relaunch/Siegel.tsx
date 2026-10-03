/**
 * Siegel der fünf Diplom-Stufen (Handoff, Startseite „Kursprogramm").
 * Ringfarbe, Umlaufschrift und gefüllter Anteil (n/5) je Stufe wie im Prototyp;
 * Stufe 5 trägt zusätzlich den weichen Schein.
 *
 * Titel, Grad und „frei" kommen aus der Diplom-Bibliothek (03.10.2026). Vorher
 * standen sie hier getippt, und die Grade hießen „Basis-Zertifikat · 7 Lektionen"
 * bis „Offizielles Akademie-Diplom" — so heißt kein Abschluss der Ausbildung, und
 * Stufe 1 hat nicht sieben Lektionen. Hier bleibt nur, was zum Siegel gehört:
 * die Ringfarbe. Wächter: Siegel.test.ts.
 */
import { ERSTE_BEZAHLSTUFE, STUFEN as DIPLOM_STUFEN } from '@/lib/diplome/stufen';

const RINGE = [
  { nr: 1, ring: '#b8703a' },
  { nr: 2, ring: '#b9b3a8' },
  { nr: 3, ring: '#d9a441' },
  { nr: 4, ring: '#cfd6d8' },
  { nr: 5, ring: '#e2531f' },
] as const;

export const STUFEN = RINGE.map(({ nr, ring }) => {
  const stufe = DIPLOM_STUFEN[nr - 1];
  return {
    nr,
    ring,
    /** Stufentitel, z. B. „Der Funke" */
    name: stufe.title,
    umlauf: `STEAKAKADEMIE · STUFE ${nr} · ${stufe.title.toLocaleUpperCase('de-DE')} ·`,
    /** Grad der Stufe, z. B. „Grillmeister Bronze" */
    unter: stufe.cert,
    frei: nr < ERSTE_BEZAHLSTUFE,
  };
});

const UMFANG = 216.8; // 2π · 34.5

export default function Siegel({ nr, size = 80 }: { nr: 1 | 2 | 3 | 4 | 5; size?: number }) {
  const s = STUFEN[nr - 1];
  const id = `sk-siegel-${nr}`;
  const voll = (UMFANG / 5) * nr;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ color: '#f4ede3', flex: 'none' }} aria-hidden="true" focusable="false">
      <defs>
        <path id={`${id}-p`} d="M50 50m-42 0a42 42 0 1 1 84 0a42 42 0 1 1-84 0" />
        {nr === 5 && (
          <filter id={`${id}-g`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        )}
      </defs>
      <circle cx="50" cy="50" r="48.5" fill="none" stroke={s.ring} strokeWidth="1.6" />
      <text fontFamily="var(--sk-display)" fontWeight="800" fontSize="6.6" letterSpacing="1.1" fill={s.ring}>
        <textPath href={`#${id}-p`}>{s.umlauf}</textPath>
      </text>
      <circle cx="50" cy="50" r="34.5" fill="none" stroke={s.ring} strokeWidth="1" opacity=".3" />
      {nr === 5 && <circle cx="50" cy="50" r="34.5" fill="none" stroke={s.ring} strokeWidth="4" opacity=".7" filter={`url(#${id}-g)`} />}
      <circle cx="50" cy="50" r="34.5" fill="none" stroke={s.ring} strokeWidth="3" strokeDasharray={`${voll.toFixed(1)} ${UMFANG}`} transform="rotate(-90 50 50)" />
      <g transform="translate(50 50) scale(.44) translate(-50 -51)">
        <path d="M18 34C24 18 46 12 64 16C82 20 92 36 88 54C84 72 68 86 48 86C28 86 12 74 12 56C12 48 14 42 18 34Z" fill="currentColor" />
        <path d="M26 38C31 26 47 21 62 24C76 27 84 40 80 54C77 67 65 78 49 78C33 78 21 69 21 56C21 49 23 44 26 38Z" fill="#e2531f" />
        <path d="M34 42C38 34 49 30 60 32C70 34 76 44 73 54C71 63 62 70 50 70C39 70 30 64 30 56C30 51 32 47 34 42Z" fill="#201b17" />
      </g>
    </svg>
  );
}
