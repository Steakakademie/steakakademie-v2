'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface CutImageProps {
  src: string;
  alt: string;
  /** Fallback-Initiale/Label, falls das Foto (noch) fehlt */
  label: string;
  className?: string;
  /** Akzentfarbe für den Platzhalter-Verlauf */
  accent?: string;
  /** Skalierung: 'contain' zeigt den Cut komplett (Default), 'cover' füllt/beschneidet */
  fit?: 'cover' | 'contain';
  /**
   * true = generativ erzeugtes oder wesentlich verändertes Bild (Cut.imageAI).
   * Zeigt ein Badge direkt am Bild. Bewusst KEIN Link auf /ki-disclaimer: die
   * Kacheln im Atlas sind selbst ein <button>, ein Link darin wäre ungültiges
   * HTML. Der Verweis steht in der Detailansicht unter dem Foto (BildCredit).
   */
  ai?: boolean;
}

/**
 * Cut-Foto mit elegantem Platzhalter. Solange die KI-Cut-Fotos (fal.ai) noch
 * nicht generiert sind, zeigt die Komponente einen markenkonformen Verlauf mit
 * Cut-Namen statt eines kaputten Bild-Icons. Sobald das Foto existiert,
 * überlagert es den Platzhalter automatisch.
 */
export default function CutImage({ src, alt, label, className = '', accent = '#C8882A', fit = 'contain', ai = false }: CutImageProps) {
  const [failed, setFailed] = useState(false);
  /** Seitenverhaeltnis des geladenen Fotos (Breite/Hoehe), erst nach onLoad bekannt. */
  const [ratio, setRatio] = useState<number | null>(null);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(circle at 50% 35%, ${accent}22, #0D0A06 70%)`,
      }}
    >
      {!failed ? (
        /* Bei 'contain' ist das gerenderte Bild kleiner als der Rahmen — ein Badge
           am Rahmenrand stuende dann neben dem Foto statt darauf. Der Wrapper
           uebernimmt deshalb das Seitenverhaeltnis des geladenen Bildes (aus
           naturalWidth/Height beim onLoad) und deckt sich damit exakt mit dem
           Foto; das Badge haengt an ihm. `height: 100%` plus `aspectRatio` und
           `maxWidth: 100%` decken beide Faelle ab: ist das Bild breiter als der
           Rahmen, greift maxWidth und die Hoehe folgt dem Seitenverhaeltnis.
           Vor dem Laden (und bei 'cover') fuellt der Wrapper den Rahmen. */
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative"
            style={
              fit === 'contain' && ratio
                ? { height: '100%', aspectRatio: String(ratio), maxWidth: '100%' }
                : { width: '100%', height: '100%' }
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              loading="lazy"
              onError={() => setFailed(true)}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
              }}
              className={`block w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
            />
            {ai && (
              <span className="absolute bottom-2 right-2 z-20 inline-flex items-center gap-1 bg-black/65 px-1.5 py-0.5 text-[9px] font-sans font-bold uppercase tracking-[0.1em] text-zinc-200 backdrop-blur-sm border border-white/15">
                <Sparkles size={9} /> KI-Bild
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          <span
            className="font-serif font-bold leading-none"
            style={{ color: accent, fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}
          >
            {label.charAt(0)}
          </span>
          <span className="mt-1 text-[9px] font-sans uppercase tracking-[0.12em] text-text-light/40">
            Foto folgt
          </span>
        </div>
      )}
    </div>
  );
}
