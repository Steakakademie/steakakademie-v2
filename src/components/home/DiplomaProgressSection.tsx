'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

// Echte Münz-Renders (Bullenkopf-Design) — füllen den Badge-Slot im Pedestal.
function RenderBadge({ tier, alt }: { tier: string; alt: string }) {
  return (
    <Image
      src={`/images/diplome/medal-${tier}.png`}
      alt={alt}
      fill
      sizes="(max-width: 640px) 112px, 144px"
      className="object-contain"
      style={{ filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.75))' }}
    />
  );
}

// ─── Badge Pedestal ───────────────────────────────────────────────────────────

function BadgePedestal({
  badge,
  stufe,
  name,
  zertifikat,
  glowColor,
  glowIntensity,
  large = false,
}: {
  badge: React.ReactNode;
  stufe: string;
  name: string;
  zertifikat: string;
  glowColor: string;
  glowIntensity: number;
  large?: boolean;
}) {
  const size = large ? 'w-28 h-28 sm:w-36 sm:h-36' : 'w-20 h-20 sm:w-28 sm:h-28';

  return (
    <div className="flex flex-col items-center gap-0 group">
      {/* Glow halo */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-110"
          style={{
            background: glowColor,
            opacity: glowIntensity,
            transform: 'scale(1.3)',
          }}
        />
        {/* Badge */}
        <div className={`relative ${size} drop-shadow-2xl transition-transform duration-500 group-hover:-translate-y-2`}>
          {large && (
            // A4 Border-Beam: nur Stufe 5 — Exklusivität durch Seltenheit
            <span
              aria-hidden
              className="absolute -inset-1.5 rounded-full"
              style={{ boxShadow: '0 0 60px 6px rgba(245,200,66,0.18)' }}
            >
              <span className="sa-beam" style={{ ['--sa-beam-dauer' as string]: '5s' }}>
                <span className="sa-beam__rot" />
              </span>
            </span>
          )}
          {badge}
        </div>
      </div>

      {/* Velvet cushion */}
      <div
        className="w-16 sm:w-20 h-2 rounded-b-full mt-1"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #3a1a2e 0%, #1a0a18 100%)',
          boxShadow: `0 4px 12px rgba(0,0,0,0.5), inset 0 -1px 3px rgba(255,255,255,0.05)`,
        }}
      />
      {/* Iron stand */}
      <div
        className="w-3 sm:w-4 h-6 sm:h-8"
        style={{
          background: 'linear-gradient(to bottom, #3a3a3a 0%, #1a1a1a 50%, #2a2a2a 100%)',
          boxShadow: 'inset -1px 0 2px rgba(255,255,255,0.1), inset 1px 0 2px rgba(0,0,0,0.5)',
        }}
      />
      <div
        className="w-12 sm:w-16 h-2"
        style={{
          background: 'linear-gradient(to right, #1a1a1a 0%, #3a3a3a 50%, #1a1a1a 100%)',
          borderRadius: '0 0 4px 4px',
        }}
      />

      {/* Labels */}
      <div className="mt-4 text-center px-1">
        <p className="font-sans text-[9px] sm:text-[10px] font-bold tracking-[0.15em] uppercase text-amber-400/70 mb-0.5">
          {stufe}
        </p>
        <p className="font-serif text-xs sm:text-sm font-bold text-amber-100/90 leading-tight">
          {name}
        </p>
        <p className="font-sans text-[8px] sm:text-[9px] tracking-wider uppercase text-amber-400/50 mt-0.5">
          {zertifikat}
        </p>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

const STUFEN = [
  {
    badge: <RenderBadge tier="bronze" alt="Bronze-Medaille" />,
    stufe: 'Stufe 1',
    name: 'Der Funke',
    zertifikat: 'Basis-Zertifikat',
    glowColor: 'radial-gradient(circle, #c47c3a80, transparent)',
    glowIntensity: 0.6,
  },
  {
    badge: <RenderBadge tier="silber" alt="Silber-Medaille" />,
    stufe: 'Stufe 2',
    name: 'Die Flamme bezähmen',
    zertifikat: 'Fortgeschrittenes Zertifikat',
    glowColor: 'radial-gradient(circle, #c0d0e080, transparent)',
    glowIntensity: 0.6,
  },
  {
    badge: <RenderBadge tier="gold" alt="Gold-Medaille" />,
    stufe: 'Stufe 3',
    name: 'Hitzekontrolle',
    zertifikat: 'Profi-Zertifikat',
    glowColor: 'radial-gradient(circle, #f5c84280, transparent)',
    glowIntensity: 0.7,
  },
  {
    badge: <RenderBadge tier="platin" alt="Platin-Medaille" />,
    stufe: 'Stufe 4',
    name: 'Präzision & Geschmack',
    zertifikat: 'Experten-Zertifikat',
    glowColor: 'radial-gradient(circle, #a8d0f090, transparent)',
    glowIntensity: 0.7,
  },
  {
    badge: <RenderBadge tier="master" alt="Meister-Medaille" />,
    stufe: 'Stufe 5',
    name: 'Der vollendete Pitmaster',
    zertifikat: 'Offizielles Akademie-Diplom',
    glowColor: 'radial-gradient(circle, #f5c842cc, transparent)',
    glowIntensity: 1.0,
    large: true,
  },
];

// A2 Glut-Partikel: feste Werte (links %, Drift px, Dauer s, Verzögerung s, Größe px)
const FUNKEN: [number, number, number, number, number][] = [
  [6, 30, 9, -2, 2.5], [12, -40, 12, -7, 2], [19, 20, 8, -4, 3.5], [25, -25, 13, -10, 1.5],
  [31, 45, 10, -1, 2.5], [37, -15, 14, -6, 2], [43, 35, 9, -11, 3], [49, -50, 11, -3, 1.5],
  [54, 10, 12, -8, 3.5], [60, -30, 8, -5, 2], [66, 50, 13, -12, 2.5], [71, -20, 10, -2, 1.5],
  [77, 25, 14, -9, 3], [83, -45, 9, -6, 2], [88, 15, 11, -1, 2.5], [94, -35, 12, -10, 2],
  [16, 55, 15, -13, 1.5], [46, -55, 15, -14, 2], [74, 40, 15, -11, 1.5], [58, -10, 7, -3, 3],
];

export default function DiplomaProgressSection() {
  return (
    <section className="relative w-full overflow-hidden py-20 sm:py-28">
      {/* ── Leather background ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 0%, #3a1a08 0%, #1a0c05 45%, #0c0603 100%)
          `,
        }}
      />
      {/* Leather grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '300px 300px',
        }}
      />
      {/* Fire-forge ember glow — left */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 40% 60% at 0% 100%, rgba(180,60,0,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 100% 100%, rgba(180,60,0,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 10%, rgba(245,168,40,0.06) 0%, transparent 60%)
          `,
        }}
      />
      {/* A1 Bühnenlicht — Lichtkegel von oben, Schein unter den Medaillen */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 34% 70% at 50% -8%, rgba(255,214,140,0.22), transparent 70%),
            radial-gradient(ellipse 45% 30% at 50% 88%, rgba(245,168,40,0.16), transparent 70%),
            conic-gradient(from 180deg at 50% -10%, transparent 160deg, rgba(255,220,150,0.07) 172deg, rgba(255,220,150,0.10) 180deg, rgba(255,220,150,0.07) 188deg, transparent 200deg)
          `,
        }}
      />
      {/* A2 Glut-Partikel */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {FUNKEN.map(([links, dx, dauer, verz, groesse], i) => (
          <i
            key={i}
            className="sa-glutfunke"
            style={{
              left: `${links}%`,
              width: groesse,
              height: groesse,
              animationDuration: `${dauer}s`,
              animationDelay: `${verz}s`,
              ['--sa-dx' as string]: `${dx}px`,
            }}
          />
        ))}
      </div>
      {/* Subtle horizontal rule at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/20 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header text ── */}
        <div className="text-center mb-14 sm:mb-20">
          <p className="font-sans text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-amber-500/80 mb-4">
            Deine Reise zum Grillmeister
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: '#f0e0a0', textShadow: '0 2px 20px rgba(245,168,40,0.2)' }}
          >
            Vom Grillen zur Kunst —<br className="hidden sm:block" />{' '}
            <span className="sa-goldglanz" style={{ textShadow: 'none' }}>Erwerbe dein Meisterdiplom</span>
          </h2>
          <p className="font-serif italic text-sm sm:text-base max-w-2xl mx-auto leading-relaxed"
            style={{ color: '#c8a850' }}
          >
            Belege dein Fachwissen, bestehe exklusive Prüfungen und werde Teil unserer Elite.<br className="hidden sm:block" />{' '}
            Eine Ausbildung in 5 präzisen Stufen.
          </p>
        </div>

        {/* ── Badge progression ── */}
        <div className="flex items-end justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-16 overflow-x-auto md:overflow-visible pb-4">
          {STUFEN.map((stufe, i) => (
            <BadgePedestal key={i} {...stufe} />
          ))}
        </div>

        {/* ── Connector line between badges (decorative) ── */}
        <div className="hidden md:block relative -mt-12 mb-12 max-w-3xl mx-auto overflow-hidden py-1">
          <div
            className="h-px"
            style={{
              background: 'linear-gradient(to right, transparent, #c89820 20%, #f5d060 50%, #c89820 80%, transparent)',
              opacity: 0.25,
            }}
          />
          {/* A5 Lichtimpuls wandert von Stufe 1 zu Stufe 5 */}
          <span aria-hidden className="sa-linienimpuls" style={{ top: '3px' }} />
        </div>

        {/* ── CTA ── */}
        <div className="flex justify-center">
          <Link
            href="/diplome"
            className="group relative flex items-center gap-3 rounded-[2px] font-sans font-bold tracking-[0.16em] uppercase text-xs sm:text-sm px-10 py-4 transition-transform duration-300 active:scale-[0.98] motion-reduce:active:scale-100"
            style={{
              background: 'linear-gradient(135deg, #2a1a0a 0%, #1a0e06 100%)',
              border: '1px solid rgba(200,152,32,0.4)',
              color: '#f0d060',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(245,200,66,0.1)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(245,200,66,0.7)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 32px rgba(245,168,40,0.2), inset 0 1px 0 rgba(245,200,66,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(200,152,32,0.4)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(245,200,66,0.1)';
            }}
          >
            {/* A6 Border-Beam + Puls */}
            <span aria-hidden className="sa-cta-puls" />
            <span aria-hidden className="sa-beam" style={{ ['--sa-beam-dauer' as string]: '4s' }}>
              <span className="sa-beam__rot" />
            </span>
            Deinen Meisterpfad starten
            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" style={{ color: '#c89820' }} />
          </Link>
        </div>
      </div>
    </section>
  );
}
