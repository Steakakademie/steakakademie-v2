'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, X } from 'lucide-react';
import { ProductImagePlaceholder } from './ProductCard';
import { REL_EXTERN, REL_PARTNERLINK } from './produkt-anzeige';

/**
 * Geräte-Link im Rezeptschritt (22.10.2026): Textlink mit „Anzeige“, dazu eine
 * Produktkarte — am Desktop beim Überfahren, am Telefon beim Antippen des
 * Info-Knopfs (Hover gibt es dort nicht). Der Link selbst bleibt ein normaler
 * Link: ein Klick geht direkt zum Händler, ohne Zwischenschritt.
 *
 * Kein Produktfoto: externe Produktbilder sind im Projekt bewusst gesperrt
 * (next.config, Datenschutz/Lizenz) — die Karte nutzt den gepflegten Platzhalter.
 *
 * Datenschutz: kein Prefetch (KAN-75), kein Laden vom Händler vor dem Klick.
 */
export interface GeraeteKarteDaten {
  name: string;
  beschreibung?: string;
  pros: string[];
  brand: string;
  category: string;
  href: string;
  klassen: string;
  /** Bezahlter Link (Partnernetzwerk oder Amazon mit Tag) → rel="sponsored …" und sichtbare Kennzeichnung. */
  partner: boolean;
  /** Sichtbare Kennzeichnung des Partnerlinks — vom Server festgelegt (Werbekennzeichnung, § 5a Abs. 4 UWG). */
  kennzeichnung: string;
  /** Händlername für den Button — „Bei SharkNinja ansehen“. */
  haendler: string;
  /** Lagerstand laut Partner-Feed; `null` = unbekannt. */
  lieferbar: boolean | null;
}

export default function GeraeteLinkKarte({ daten, children }: { daten: GeraeteKarteDaten; children: React.ReactNode }) {
  const [offen, setOffen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const id = useId();
  // rel nur aus produkt-anzeige.ts — derselbe Maßstab wie produktLink().
  const rel = daten.partner ? REL_PARTNERLINK : REL_EXTERN;

  useEffect(() => {
    if (!offen) return;
    const zu = (e: MouseEvent | TouchEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOffen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOffen(false); };
    document.addEventListener('mousedown', zu);
    document.addEventListener('touchstart', zu);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', zu);
      document.removeEventListener('touchstart', zu);
      document.removeEventListener('keydown', esc);
    };
  }, [offen]);

  return (
    <span
      ref={wrap}
      className="relative inline"
      onMouseEnter={() => setOffen(true)}
      onMouseLeave={() => setOffen(false)}
    >
      <Link
        href={daten.href}
        prefetch={false}
        rel={rel}
        target="_blank"
        className={`text-brand-fire underline decoration-brand-fire/40 underline-offset-2 transition-colors hover:decoration-brand-fire ${daten.klassen}`}
        aria-describedby={offen ? id : undefined}
      >
        {children}
        {daten.partner && (
          <span className="ml-0.5 align-super font-sans text-[9px] font-bold uppercase tracking-wide text-text-muted">
            {daten.kennzeichnung}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={() => setOffen(true)}
        onTouchEnd={(e) => { e.preventDefault(); setOffen(true); }}
        aria-expanded={offen}
        aria-controls={id}
        aria-label={`Details zu ${daten.name}`}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-brand-gold/50 align-middle font-sans text-[10px] font-bold text-brand-gold transition-colors hover:bg-brand-gold hover:text-surface-dark lg:hidden"
      >
        i
      </button>

      {offen && (
        <span
          id={id}
          role="dialog"
          aria-label={daten.name}
          className="absolute left-0 top-full z-[60] mt-2 block w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-brand-gold/40 bg-surface-card p-4 text-left shadow-2xl"
        >
          <button
            type="button"
            onClick={() => setOffen(false)}
            aria-label="Schließen"
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-surface-elevated lg:hidden"
          >
            <X size={14} />
          </button>
          <span className="flex gap-3">
            <ProductImagePlaceholder brand={daten.brand} category={daten.category} size="sm" />
            <span className="min-w-0 flex-1">
              {daten.partner && (
                <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-text-muted">{daten.kennzeichnung}</span>
              )}
              <span className="block font-serif text-sm font-bold leading-snug text-text-light">{daten.name}</span>
              {daten.beschreibung && (
                <span className="mt-1 block font-sans text-xs leading-snug text-text-secondary">{daten.beschreibung}</span>
              )}
            </span>
          </span>
          {daten.pros.length > 0 && (
            <ul className="mt-3 space-y-1 font-sans text-xs text-text-primary">
              {daten.pros.slice(0, 3).map((p) => (
                <li key={p} className="flex gap-2">
                  <span aria-hidden="true" className="text-brand-gold">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
          {daten.lieferbar === false && (
            <span className="mt-3 block font-sans text-xs text-text-muted">Beim Händler derzeit nicht lieferbar.</span>
          )}
          <Link
            href={daten.href}
            prefetch={false}
            rel={rel}
            target="_blank"
            className={`mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-brand-fire px-3 font-sans text-xs font-bold text-surface-dark transition-colors hover:bg-brand-gold ${daten.klassen}`}
          >
            Bei {daten.haendler} ansehen <ExternalLink size={12} aria-hidden="true" />
          </Link>
          <span className="mt-2 block font-sans text-[10px] leading-snug text-text-muted">
            Herstellerangaben, Stand laut Produktregister. Kein Test der Steakakademie.
          </span>
        </span>
      )}
    </span>
  );
}
