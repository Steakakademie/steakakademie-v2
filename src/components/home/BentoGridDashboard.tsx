'use client';

/**
 * Bento-Grid der Werkzeuge-Sektion auf der Startseite (Uwe, 02.11.2026, Entwurf
 * aus dem Paket „steakakademie_tools_package": Typen, JSON-Datenbasis, Komponente).
 *
 * Was gegenueber dem Entwurf angepasst wurde — und warum:
 * - Farben auf die Tailwind-Token der Marken-DNA (brand-fire/brand-gold/surface-*,
 *   CLAUDE.md § 2 Regel 3 und § A2) statt #FF5A00/#121212/zinc; Ueberschriften in
 *   der Serifen-Schrift der Seite.
 * - `class=` → `className=` (fuenf Stellen; waren TSX-Typfehler), `transition-all`
 *   → benannte Properties (§ A2).
 * - Kacheln sind echte Links auf die bestehenden Werkzeuge (/aroma-matcher, /cuts,
 *   /hoefe, #rezept-schmiede). Der E2E-Test tests/e2e/hoefe.spec.ts erwartet auf der
 *   Startseite einen Link „Hofladen-Radar … Höfe finden" → /hoefe.
 * - Der Regler steuert nicht nur ein Wort, sondern die Dosierung aus der Datenbasis
 *   (mild → kraeftig interpoliert, src/lib/werkzeuge/logik.ts); die Warnliste zeigt
 *   die als ungeeignet markierten Hoelzer. Der Räucherholz-Finder selbst ist weiter
 *   GEPLANT (VIP) — die Kachel ist eine Vorschau mit echten Daten, kein Werkzeug.
 * - „Belegt aus über 100 Fachstudien" ist die im Zusagen-Register gedeckte Fassung
 *   (data/zusagen.yaml, foodpairing-ueber-hundert-studien); die Zahl
 *   `totalStudiesReferenced` aus der JSON wird nicht angezeigt, weil sie keinen Beleg
 *   hat (Regel 12).
 * - Der Cut-Wechsel-Knopf ist nur aktiv, wenn die Datenbasis mehr als einen Cut hat.
 *
 * Reine Logik liegt in src/lib/werkzeuge/logik.ts, die Datenbasis kommt als Prop
 * (Server-Bauteil → hier), damit das JSON nicht im Client-Bundle landet.
 */

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Flame, FlaskConical, Radar, RefreshCw, Trees, TriangleAlert, Wine } from 'lucide-react';
import type { CutAromaProfile, SteakakademieToolsDatabase, WoodProfile } from '@/lib/werkzeuge/typen';
import { dosierungFuer, intensitaetsStufe, naechsterCut, ungeeigneteHoelzer } from '@/lib/werkzeuge/logik';

interface BentoGridDashboardProps {
  database: SteakakademieToolsDatabase;
  /** Freikontingent des Aroma-Matchers (src/lib/aroma-matcher/data.ts, FREE_LIMIT). */
  freeLimit?: number;
}

const KACHEL =
  'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-surface-card p-6 sm:p-8 shadow-xl hover:border-brand-gold focus-within:border-brand-gold transition-colors';

const CTA = 'inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-brand-gold group-hover:gap-2 transition-[gap]';

function Chip({ children, ton = 'neutral' }: { children: React.ReactNode; ton?: 'neutral' | 'fire' | 'gold' }) {
  const farbe =
    ton === 'fire'
      ? 'border-brand-fire/30 bg-brand-fire/10 text-brand-fire'
      : ton === 'gold'
        ? 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold'
        : 'border-border-subtle bg-surface-elevated text-text-muted';
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-[0.18em] ${farbe}`}>
      {children}
    </span>
  );
}

export default function BentoGridDashboard({ database, freeLimit = 5 }: BentoGridDashboardProps) {
  const cuts = database.aromaMatcher.cuts;
  const woods = database.woodFinder.woods;
  const [selectedCut, setSelectedCut] = useState<CutAromaProfile>(cuts[0]);
  const [selectedWood] = useState<WoodProfile>(woods[0]);
  const [smokeIntensity, setSmokeIntensity] = useState<number>(50);

  const mehrereCuts = cuts.length > 1;
  const dosierung = dosierungFuer(selectedWood, smokeIntensity);
  const warnliste = ungeeigneteHoelzer(woods);

  return (
    <div>
      {/* Sektions-Kopf */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-fire">
          <Flame size={12} /> Werkzeuge
        </span>
        <h2 className="mt-2 font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-text-light">
          Spiel mit Aromen, Cuts &amp; Rezepten
        </h2>
        <p className="mt-4 max-w-2xl text-base md:text-lg text-text-secondary">
          Nutze unsere datengestützten Werkzeuge, um dein Grillgut abzustimmen. Das Foodpairing dahinter ist
          belegt aus über 100 Fachstudien.
        </p>
      </div>

      {/* Bento-Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Kachel 1: Aroma-Matcher (2 Spalten) — Vorschau aus der Datenbasis, Link ins Werkzeug */}
        <div className={`${KACHEL} md:col-span-2`}>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-fire/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Chip ton="fire">Neu</Chip>
                <Chip ton="gold">VIP geplant</Chip>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCut(naechsterCut(cuts, selectedCut.id))}
                disabled={!mehrereCuts}
                title={mehrereCuts ? 'Zum nächsten Cut wechseln' : 'Weitere Cuts folgen — bisher ein Cut in der Datenbasis'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-base px-3 py-1 text-xs text-text-muted hover:border-brand-gold hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={12} aria-hidden /> Nächster Cut
              </button>
            </div>
            <div className="mb-3 flex items-center gap-2 text-brand-fire">
              <Wine size={20} aria-hidden />
              <h3 className="font-serif text-2xl font-bold tracking-tight text-text-light">Aroma-Matcher</h3>
            </div>
            <p className="mb-2 max-w-md text-sm text-text-secondary">
              Was passt zu deinem Cut? Rub, Holz und das passende Glas — mit einem Satz, warum. Grundlage sind
              die Aromaprofile der Cuts, nicht Geschmacksmeinungen.
            </p>
            <p className="mb-6 text-[11px] text-text-muted">
              {freeLimit} Cuts gratis · ohne Limit: für den VIP-Pass geplant
            </p>
          </div>

          {/* Vorschau — dynamisch aus der JSON-Datenbasis */}
          <div className="mt-4 flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-base p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-elevated text-brand-fire">
                <Flame size={22} aria-hidden />
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted">Ausgewählter Cut</p>
                <p className="text-base font-bold text-text-light">{selectedCut.name}</p>
              </div>
            </div>

            <ul className="flex flex-wrap gap-2" aria-label={`Schlüssel-Aromen und Holz für ${selectedCut.name}`}>
              {selectedCut.keyAromas.slice(0, 2).map((aroma) => (
                <li
                  key={aroma.name}
                  className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-card px-3 py-1.5 text-xs text-text-primary"
                  title={aroma.chemicalCompound}
                >
                  <FlaskConical size={12} aria-hidden /> {aroma.name}
                </li>
              ))}
              <li className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-medium text-brand-gold">
                <Trees size={12} aria-hidden /> {selectedCut.recommendedWoods.join(', ')}
              </li>
            </ul>
          </div>

          <Link href="/aroma-matcher" className={`${CTA} mt-5`}>
            Cut wählen <ChevronRight size={14} />
          </Link>
        </div>

        {/* Kachel 2: Räucherholz-Finder — GEPLANT (VIP); Vorschau mit echten Dosierungsdaten */}
        <div className={KACHEL} aria-label="Räucherholz-Finder — geplant, Vorschau">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div>
            <div className="mb-6 flex gap-2">
              <Chip>Geplant</Chip>
              <Chip ton="gold">VIP</Chip>
            </div>
            <div className="mb-3 flex items-center gap-2 text-brand-fire">
              <Trees size={20} aria-hidden />
              <h3 className="font-serif text-2xl font-bold tracking-tight text-text-light">Räucherholz-Finder</h3>
            </div>
            <p className="mb-6 text-sm text-text-secondary">
              Welches Holz zu welchem Grillgut — mit Dosierung und Warnliste der ungeeigneten Hölzer.
            </p>
          </div>

          {/* Intensitäts-Regler → Dosierung aus der Datenbasis */}
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-text-muted">
                Vorschau: <strong className="text-text-light">{selectedWood.name}</strong> im Smoker
              </span>
              <span className="font-bold text-brand-gold">{intensitaetsStufe(smokeIntensity)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={smokeIntensity}
              onChange={(e) => setSmokeIntensity(Number(e.target.value))}
              aria-label={`Rauchintensität für ${selectedWood.name}`}
              aria-valuetext={`${intensitaetsStufe(smokeIntensity)}${dosierung ? `, ${dosierung.menge} ${dosierung.einheit}` : ''}`}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-elevated accent-brand-fire"
            />
            {dosierung ? (
              <p className="text-xs text-text-secondary" aria-live="polite">
                <strong className="text-text-light">
                  {dosierung.menge} {dosierung.einheit === 'chunks' ? 'Chunks' : dosierung.einheit === 'chips' ? 'Handvoll Chips' : 'Scheite'}
                </strong>{' '}
                — {dosierung.hinweis}
              </p>
            ) : (
              <p className="text-xs text-text-muted">Für dieses Holz gibt es keine Dosierung.</p>
            )}
            {warnliste.length > 0 && (
              <p className="flex items-start gap-1.5 text-[11px] text-text-muted">
                <TriangleAlert size={12} className="mt-0.5 shrink-0 text-brand-fire" aria-hidden />
                <span>
                  <strong className="text-text-secondary">Ungeeignet:</strong>{' '}
                  {warnliste.map((w) => `${w.name} — ${w.safety.reason}`).join(' · ')}
                </span>
              </p>
            )}
            <p className="text-[11px] text-text-muted">Geplant als Baustein des VIP-Passes.</p>
          </div>
        </div>

        {/* Kachel 3: Cut-Atlas */}
        <Link href="/cuts" className={KACHEL}>
          <div>
            <div className="mb-6 flex">
              <Chip>Enzyklopädie</Chip>
            </div>
            <div className="mb-3 flex items-center gap-2 text-brand-fire">
              <Flame size={20} aria-hidden />
              <h3 className="font-serif text-2xl font-bold tracking-tight text-text-light">Cut-Atlas</h3>
            </div>
            <p className="mb-6 text-sm text-text-secondary">
              Jeder Cut im Detail erklärt: anatomische Lage, Muskelstruktur, Marmorierung und der passende
              Garpunkt.
            </p>
          </div>
          <span className={`${CTA} mt-4`}>
            Cuts entdecken <ChevronRight size={14} />
          </span>
        </Link>

        {/* Kachel 4: Rezept-Schmiede → live Werkzeug direkt unter dem Grid (#rezept-schmiede) */}
        <Link href="#rezept-schmiede" className={KACHEL}>
          <div>
            <div className="mb-6 flex">
              <Chip>Mitglieder</Chip>
            </div>
            <div className="mb-3 flex items-center gap-2 text-brand-fire">
              <FlaskConical size={20} aria-hidden />
              <h3 className="font-serif text-2xl font-bold tracking-tight text-text-light">Rezept-Schmiede</h3>
            </div>
            <p className="mb-6 text-sm text-text-secondary">
              Individuelle Rezepte aus dem Fachwissen der Akademie — angepasst an dein Niveau und deine
              Personenzahl.
            </p>
          </div>
          <span className={`${CTA} mt-4`}>
            Rezept schmieden <ChevronRight size={14} />
          </span>
        </Link>

        {/* Kachel 5: Hofladen-Radar → /hoefe (Testanker: Linkname „Hofladen-Radar … Höfe finden") */}
        <Link href="/hoefe" className={KACHEL}>
          <div>
            <div className="mb-6 flex">
              <Chip>Lokal · DACH</Chip>
            </div>
            <div className="mb-3 flex items-center gap-2 text-brand-fire">
              <Radar size={20} aria-hidden />
              <h3 className="font-serif text-2xl font-bold tracking-tight text-text-light">Hofladen-Radar</h3>
            </div>
            <p className="mb-6 text-sm text-text-secondary">
              Fleischkauf ist Vertrauenssache. Fleisch direkt vom Erzeuger — Höfe in deiner Nähe, Fleischangebot
              und Bio auf einen Blick. Deutschland, Österreich und die Schweiz.
            </p>
          </div>
          <span className={`${CTA} mt-4`}>
            Höfe finden <ChevronRight size={14} />
          </span>
        </Link>
      </div>
    </div>
  );
}
