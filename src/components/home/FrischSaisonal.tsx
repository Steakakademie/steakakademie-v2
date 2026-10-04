'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, m as motion } from 'framer-motion';
import { Flame, Leaf, ArrowUpRight, ChefHat } from 'lucide-react';
import type { FrischSaisonalData, FrischSaisonalSlide } from '@/lib/frisch-saisonal';

const ROTATE_MS = 5200;

const BADGE_STYLE: Record<FrischSaisonalSlide['badge'], { color: string; bg: string; icon: typeof Flame }> = {
  Frisch: { color: '#E85018', bg: 'rgba(232,80,24,0.16)', icon: Flame },
  Saisonal: { color: '#5E8A2E', bg: 'rgba(124,179,66,0.18)', icon: Leaf },
};

const KIND_LABEL: Record<FrischSaisonalSlide['kind'], string> = {
  Rezept: 'Rezept',
  Technik: 'Grilltechnik',
  Bericht: 'Bericht',
};

export default function FrischSaisonal({ data }: { data: FrischSaisonalData }) {
  const slides = data.slides;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;

  const go = useCallback((n: number) => setIdx(((n % total) + total) % total), [total]);
  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setTimeout(next, ROTATE_MS);
    return () => clearTimeout(t);
  }, [idx, paused, next, total]);

  if (total === 0) return null;
  const slide = slides[idx];
  const badge = BADGE_STYLE[slide.badge];
  const BadgeIcon = badge.icon;

  return (
    <section className="reading-light border-y border-brand-gold/25">
      <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ── Linke Seite: Einordnung ─────────────────────────────── */}
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-fire mb-3">
              <Flame size={12} /> Im Feuer — frisch &amp; saisonal
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-[1.1] mb-4 text-[#1C140D]">
              Frisch aus dem Feuer.<br className="hidden sm:block" />{' '}
              <span style={{ color: '#A8701C' }}>Was jetzt Saison hat.</span>
            </h2>
            <p className="font-body leading-relaxed max-w-xl mb-6 text-[#5C4A3A]">
              Die Steakakademie steht nie still. Hier rotiert, was gerade dazugekommen ist —
              neue Techniken, Berichte und die Rezepte, die genau jetzt im{' '}
              <span className="text-[#1C140D] font-semibold">{data.seasonLabel}</span> auf den Rost gehören.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/rezepte"
                className="inline-flex items-center gap-1.5 text-sm font-sans font-semibold text-[#A8701C] hover:text-brand-fire transition-colors"
              >
                Alle Rezepte <ArrowUpRight size={15} />
              </Link>
              <span className="text-[#C9B79A]">·</span>
              <Link
                href="/methoden"
                className="inline-flex items-center gap-1.5 text-sm font-sans font-semibold text-[#A8701C] hover:text-brand-fire transition-colors"
              >
                Alle Grilltechniken <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          {/* ── Rechte Seite: rotierendes Spotlight (~1/3) ──────────── */}
          <div
            className="lg:col-span-5"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ background: '#E4D2AC', border: '1px solid #C3AB80', boxShadow: '0 16px 38px -18px rgba(40,28,12,0.5)' }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={slide.url}
                  initial={{ y: 12 }}
                  animate={{ y: 0 }}
                  exit={{ y: -12 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <Link href={slide.url} className="group block">
                    {/* Bild */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.image}
                        alt={slide.imageAlt}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
                      />
                      {/* Badge oben links */}
                      <span
                        className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider rounded-full px-2.5 py-1"
                        style={{ color: badge.color, background: badge.bg, backdropFilter: 'blur(4px)' }}
                      >
                        <BadgeIcon size={11} /> {slide.badge}
                      </span>
                    </div>

                    {/* Text */}
                    <div className="p-5">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-[0.16em] text-[#8A7256]">
                        {KIND_LABEL[slide.kind]}
                      </span>
                      <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug mt-1 mb-2 text-[#1C140D] group-hover:text-[#A8701C] transition-colors">
                        {slide.title}
                      </h3>
                      <p className="text-[13px] font-body leading-relaxed line-clamp-2 text-[#5C4A3A]">
                        {slide.excerpt}
                      </p>
                    </div>
                  </Link>

                  {/* Gepaartes Rezept */}
                  {slide.pairing && (
                    <Link
                      href={slide.pairing.url}
                      className="group/p mx-5 mb-5 flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
                      style={{ background: 'rgba(232,80,24,0.07)', border: '1px solid rgba(232,80,24,0.22)' }}
                    >
                      <ChefHat size={14} className="text-brand-fire shrink-0" />
                      <span className="text-[11px] font-sans text-[#8A7256] shrink-0">{slide.pairing.label}:</span>
                      <span className="text-[12px] font-sans font-semibold text-[#1C140D] truncate group-hover/p:text-brand-fire transition-colors">
                        {slide.pairing.title}
                      </span>
                      <ArrowUpRight size={12} className="text-brand-fire/60 ml-auto shrink-0" />
                    </Link>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Fortschrittsbalken */}
              {total > 1 && (
                <div className="h-0.5 w-full bg-black/5">
                  <motion.div
                    key={`${slide.url}-bar`}
                    className="h-full w-full"
                    style={{ background: '#C8882A', transformOrigin: 'left' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: paused ? 0 : 1 }}
                    transition={{ duration: paused ? 0 : ROTATE_MS / 1000, ease: 'linear' }}
                  />
                </div>
              )}
            </div>

            {/* Navigation (Dots) */}
            {total > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {slides.map((s, i) => (
                  <button
                    key={s.url}
                    onClick={() => go(i)}
                    aria-label={`Zu Folie ${i + 1}: ${s.title}`}
                    className="flex h-6 min-w-6 items-center justify-center"
                  >
                    {/* Der Punkt bleibt klein; die Trefferfläche des Buttons ist 24 px (WCAG 2.5.8). */}
                    <span
                      aria-hidden="true"
                      className="block h-1.5 rounded-full transition-[width,background-color] duration-300"
                      style={{
                        width: i === idx ? 22 : 6,
                        background: i === idx ? '#C8882A' : 'rgba(0,0,0,0.18)',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
