'use client';

import Image from 'next/image';
import { STUFEN } from '@/lib/diplome/stufen';
import ScrollBereich from '@/components/ui/ScrollBereich';

// ── Parchment scroll (Stufe 5 only) ──────────────────────────────────────────
function ParchmentScroll() {
  return (
    <div className="flex flex-col items-center justify-end mb-1" style={{ height: '160px' }}>
      <div className="relative" style={{ width: '52px' }}>
        {/* Warm ambient glow — localized, not an orb */}
        <div style={{
          position: 'absolute', inset: '-8px',
          background: 'radial-gradient(ellipse 80% 60% at 50% 60%, rgba(200,140,30,0.18) 0%, transparent 75%)',
          pointerEvents: 'none',
        }} />
        {/* Top roll end */}
        <div style={{
          width: '52px', height: '14px',
          background: 'linear-gradient(180deg, #F5E8C0 0%, #C8A850 40%, #A88030 60%, #C8A850 100%)',
          borderRadius: '50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }} />
        {/* Scroll body */}
        <div style={{
          width: '52px', height: '90px',
          background: [
            'linear-gradient(90deg, rgba(0,0,0,0.25) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.25) 100%)',
            'linear-gradient(180deg, #EDD99A 0%, #D4B86A 30%, #C8A850 60%, #D4B86A 85%, #EDD99A 100%)',
          ].join(', '),
          boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.2), inset -2px 0 4px rgba(0,0,0,0.2)',
          position: 'relative',
        }}>
          {/* Script lines suggestion */}
          {[18, 30, 42, 54, 66].map(y => (
            <div key={y} style={{
              position: 'absolute', left: '10px', right: '10px', top: `${y}px`,
              height: '1px',
              background: 'rgba(100,60,10,0.2)',
            }} />
          ))}
        </div>
        {/* Bottom roll end */}
        <div style={{
          width: '52px', height: '14px',
          background: 'linear-gradient(180deg, #C8A850 0%, #A88030 40%, #C8A850 80%, #F5E8C0 100%)',
          borderRadius: '50%',
          boxShadow: '0 3px 6px rgba(0,0,0,0.5)',
        }} />
        {/* Wax seal */}
        <div style={{
          position: 'absolute', left: '50%', top: '52%',
          transform: 'translate(-50%, -50%)',
          width: '20px', height: '20px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 35%, #C84040 0%, #8B1010 55%, #600808 100%)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,160,160,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '12px', height: '12px',
            border: '1px solid rgba(255,200,180,0.3)',
            borderRadius: '50%',
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Forged iron stand with velvet cushion ────────────────────────────────────
function ForgedStand({ medalSize }: { medalSize: number }) {
  const cushionW = Math.round(medalSize * 0.62);
  return (
    <div className="flex flex-col items-center" style={{ marginTop: '-2px' }}>
      {/* Velvet cushion */}
      <div style={{
        width: `${cushionW}px`,
        height: '18px',
        background: 'linear-gradient(180deg, #2E1840 0%, #1C0F28 60%, #150B20 100%)',
        borderRadius: '5px 5px 0 0',
        boxShadow: 'inset 0 3px 5px rgba(0,0,0,0.45), 0 -1px 0 rgba(120,70,160,0.18)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Velvet sheen highlight */}
        <div style={{
          position: 'absolute', top: '2px', left: '18%', right: '18%', height: '2px',
          background: 'rgba(180,130,220,0.1)',
          borderRadius: '50%',
        }} />
        {/* Depression where medal sits */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 65% 50% at 50% 30%, rgba(0,0,0,0.35) 0%, transparent 80%)',
        }} />
      </div>
      {/* Iron post — tapered, forged */}
      <div style={{
        width: '13px',
        height: '38px',
        background: [
          'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
          'linear-gradient(90deg, #222222 0%, #484848 30%, #3C3C3C 55%, #262626 80%, #1E1E1E 100%)',
        ].join(', '),
        boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.05), inset -1px 0 2px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        {/* Forge marks — horizontal faint grooves */}
        {[10, 20, 30].map(y => (
          <div key={y} style={{
            position: 'absolute', left: 0, right: 0, top: `${y}px`, height: '1px',
            background: 'rgba(0,0,0,0.25)',
          }} />
        ))}
      </div>
      {/* Base plate */}
      <div style={{
        width: `${Math.round(cushionW * 0.85)}px`,
        height: '10px',
        background: 'linear-gradient(180deg, #484848 0%, #2A2A2A 55%, #1A1A1A 100%)',
        borderRadius: '2px',
        boxShadow: '0 5px 14px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)',
      }} />
    </div>
  );
}

// ── Badge definitions ─────────────────────────────────────────────────────────
interface BadgeDef {
  id: number; stufe: string; name: string; cert: string;
  size: number; labelColor: string; certColor: string;
  isMaster?: boolean;
}

// Name und Zertifikat kommen aus der einen Taxonomie-Quelle (stufen.ts);
// Groessen und Farben sind Gestaltung dieses Schaustuecks und bleiben hier.
// Vorher stand hier „Basis-Zertifikat" (Roadmap: „Bronze-Zertifikat") und
// „Die Flamme Bezähmen" (anderswo klein geschrieben) — Audit R11.
const BADGE_STYLE: Record<number, Pick<BadgeDef, 'size' | 'labelColor' | 'certColor' | 'isMaster'>> = {
  1: { size: 122, labelColor: '#B87030', certColor: 'rgba(150,80,25,0.55)' },
  2: { size: 132, labelColor: '#BCBCC8', certColor: 'rgba(150,150,165,0.55)' },
  3: { size: 142, labelColor: '#D4A800', certColor: 'rgba(180,130,20,0.55)' },
  4: { size: 152, labelColor: '#B8C0D8', certColor: 'rgba(150,158,185,0.55)' },
  5: { size: 172, labelColor: '#E8B820', certColor: 'rgba(200,140,20,0.6)', isMaster: true },
};

const BADGES: BadgeDef[] = STUFEN.map((st) => ({
  id: st.nr,
  stufe: `Stufe ${st.nr}`,
  name: st.title,
  cert: st.cert,
  ...BADGE_STYLE[st.nr],
}));

// Echte Münz-Renders (Bullenkopf-Design) statt der gezeichneten Gradient-Münzen.
const TIER_FILE: Record<number, string> = {
  1: 'bronze', 2: 'silber', 3: 'gold', 4: 'platin', 5: 'master',
};

function Medal({ b }: { b: BadgeDef }) {
  const outer = b.size;
  const file = TIER_FILE[b.id] ?? 'bronze';

  return (
    <div style={{ position: 'relative', width: outer, height: outer, flexShrink: 0 }}>
      <Image
        src={`/images/diplome/medal-${file}.png`}
        alt={`${b.cert} — ${b.name}`}
        width={outer}
        height={outer}
        sizes={`${outer}px`}
        style={{
          width: outer, height: outer, objectFit: 'contain',
          filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.85))',
        }}
      />
    </div>
  );
}

export default function BadgeProgression() {
  return (
    <section
      className="py-16 px-4"
      style={{
        background: [
          'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(80,40,10,0.35) 0%, transparent 70%)',
          'linear-gradient(180deg, #0A0706 0%, #100C08 50%, #0A0706 100%)',
        ].join(', '),
      }}
    >
      <div className="max-w-editorial mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-fire mb-3">
            Steakakademie · Zertifizierungsstufen
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-light">
            Fünf Stufen zur Meisterschaft
          </h2>
        </div>

        {/* Badge row — horizontal scroll on mobile */}
        <ScrollBereich label="Die fünf Diplom-Stufen, horizontal scrollbar" className="pb-4">
          <div
            className="flex items-end justify-center gap-6 lg:gap-10"
            style={{ minWidth: 'max-content', margin: '0 auto', padding: '0 16px' }}
          >
            {BADGES.map((badge) => (
              <div key={badge.id} className="flex flex-col items-center">
                {/* For master badge: medal + parchment side by side */}
                {badge.isMaster ? (
                  <div className="flex items-end gap-3">
                    <Medal b={badge} />
                    <ParchmentScroll />
                  </div>
                ) : (
                  <Medal b={badge} />
                )}

                <ForgedStand medalSize={badge.size} />

                {/* Labels */}
                <div className="text-center mt-5 space-y-1.5">
                  <p style={{
                    fontSize: '9px', fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700, letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: badge.labelColor + '99',
                  }}>
                    {badge.stufe}
                  </p>
                  <p style={{
                    fontFamily: 'Playfair Display, Georgia, serif',
                    fontWeight: 700,
                    fontSize: badge.isMaster ? '13px' : '11px',
                    color: badge.labelColor,
                    maxWidth: badge.isMaster ? '148px' : '118px',
                    lineHeight: 1.3,
                    textAlign: 'center',
                  }}>
                    {badge.name}
                  </p>
                  <p style={{
                    fontSize: '9px', fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700, letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: badge.certColor as string,
                  }}>
                    {badge.cert}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollBereich>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <div className="h-px w-24"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(200,136,42,0.3))' }} />
          <div style={{ width: 5, height: 5, background: 'rgba(200,136,42,0.4)', transform: 'rotate(45deg)' }} />
          <div className="h-px w-24"
            style={{ background: 'linear-gradient(90deg, rgba(200,136,42,0.3), transparent)' }} />
        </div>
      </div>
    </section>
  );
}
