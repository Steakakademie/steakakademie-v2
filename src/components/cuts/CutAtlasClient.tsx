'use client';

import { useMemo, useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Flame, Thermometer, BookOpen, ShoppingCart, MousePointerClick } from 'lucide-react';
import AnimalDiagram from './AnimalDiagram';
import BullButcherMap from './BullButcherMap';
import CutDnaRadar from './CutDnaRadar';
import CutImage from './CutImage';
import BildCredit from '@/components/BildCredit';
import { METHOD_LABEL, type Cut, type Primal, type Species } from '@/lib/cuts-catalog';
import { getMeatOffer } from '@/lib/cut-affiliate';
import type { CutRecipeRef } from '@/lib/cut-recipes';
import { trackEvent } from '@/components/analytics/PlausibleScript';

interface CutAtlasClientProps {
  bySpecies: Record<Species, { cuts: Cut[]; primals: Primal[] }>;
  recipeMap: Record<string, CutRecipeRef[]>;
}

/**
 * Schwein ist vorübergehend ausgeblendet — analog zum Cut-Generator. Grund: die
 * Schwein-Cut-Fotos stammen aus Händler-Produktbildern und sind nach der
 * Rechts-Doktrin (public/images/cuts/CREDITS.md) nicht verwendbar. Sobald
 * lizenzsaubere Fotos vorliegen, hier und in CutGenerator.tsx auf `true` setzen.
 */
const SHOW_PORK = false;

const ALL_SPECIES_TABS: { id: Species; label: string }[] = [
  { id: 'rind', label: '🐄 Rind' },
  { id: 'schwein', label: '🐖 Schwein' },
];

// Erst typisieren, dann filtern: .filter() direkt auf dem Array-Literal laesst
// TypeScript 'id' zu string verbreitern statt zu Species -> TS2322 im Build.
const SPECIES_TABS = ALL_SPECIES_TABS.filter((t) => SHOW_PORK || t.id !== 'schwein');

// Zerlegekarte (BullButcherMap) → Katalog. Zonen mit exakt passendem Cut öffnen
// dessen Detail (Raster filtert auf sein Teilstück); Regions-Zonen filtern nur.
// kopf/zunge haben keinen Katalog-Cut → reine Info, keine Aktion.
const ZONE_TO_CUT: Record<string, string> = {
  'backe': 'ochsenbacke',
  'nacken': 'nacken',
  'rib-eye': 'ribeye',
  'falsches-filet': 'falsches-filet',
  'metzgerstueck': 'onglet', // Metzgerstück = Onglet / Nierenzapfen
  'roastbeef': 'rumpsteak',
  'porterhouse': 'porterhouse',
  'filet': 'filet',
  't-bone': 't-bone',
  'skirt-steak': 'skirt',
  'lappen': 'bavette', // Bauchlappen = Bavette (Flap Steak)
  'flank-steak': 'flank',
  'tafelspitz': 'tafelspitz',
  'buergermeisterstueck': 'tri-tip', // Bürgermeisterstück = Tri-Tip
  'kugel': 'kugel',
  'oberschale': 'oberschale',
  'unterschale': 'unterschale',
};
const ZONE_TO_PRIMAL: Record<string, string> = {
  'hals': 'nacken',
  'schulter': 'bug',
  'hohe-rippe': 'hochrippe',
  'querrippe': 'hochrippe',
  'brust': 'brust',
  'huefte': 'huefte',
};

function PriceLevel({ level }: { level: number }) {
  return (
    <span className="font-mono tracking-tight text-base">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= level ? '#C8882A' : '#3a2818' }}>€</span>
      ))}
    </span>
  );
}

function LevelDots({ level }: { level: number }) {
  return (
    <span className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: i <= level ? '#E85018' : '#3a2818' }}
        />
      ))}
    </span>
  );
}

// Marmorierungs-Balken für die Rasterkarte (Marken-Gold).
function MarblingBars({ level }: { level: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="h-1 w-3" style={{ background: i <= level ? '#C8882A' : '#3a2818' }} />
      ))}
    </span>
  );
}

export default function CutAtlasClient({ bySpecies, recipeMap }: CutAtlasClientProps) {
  const [species, setSpecies] = useState<Species>('rind');
  const [selectedPrimal, setSelectedPrimal] = useState<string | null>(null);
  const [selectedCutId, setSelectedCutId] = useState<string | null>(null);

  const { cuts, primals } = bySpecies[species];
  const primalById = useMemo(() => Object.fromEntries(primals.map((p) => [p.id, p])), [primals]);

  // Grid zeigt ALLE Cuts der Spezies; ein gewähltes Teilstück filtert auf dessen Cuts.
  const filteredCuts = useMemo(
    () => (selectedPrimal ? cuts.filter((c) => c.primal === selectedPrimal) : cuts),
    [cuts, selectedPrimal]
  );

  // Aktive Zone der Zerlegekarte (hält Karte + Panel/Raster synchron)
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const switchSpecies = (s: Species) => {
    setSpecies(s);
    setSelectedPrimal(null);
    setSelectedCutId(null);
    setActiveZone(null);
  };
  const handlePrimal = (id: string) => {
    const next = selectedPrimal === id ? null : id;
    // Nur Aktivierungen tracken (Werbe-Reporting), Toggle-Off nicht.
    if (next) trackEvent('CutAtlas_Zone', { zone: id, ziel: id, art: 'primal', tier: species });
    setSelectedPrimal(next);
    setSelectedCutId(null);
    setActiveZone(null);
  };
  const resetPrimal = () => {
    setSelectedPrimal(null);
    setSelectedCutId(null);
    setActiveZone(null);
  };

  // Klick auf der Zerlegekarte: Cut-Zone → Detail öffnen + Raster aufs Teilstück
  // filtern; Regions-Zone → nur filtern (Toggle); Info-Zone (kopf/zunge) → nichts.
  const handleZoneClick = (zone: { id: string }) => {
    const cutId = ZONE_TO_CUT[zone.id];
    if (cutId) {
      const cut = cuts.find((c) => c.id === cutId);
      if (cut) {
        if (activeZone === zone.id) {
          resetPrimal();
        } else {
          setActiveZone(zone.id);
          setSelectedPrimal(cut.primal);
          setSelectedCutId(cut.id);
          trackEvent('CutAtlas_Zone', { zone: zone.id, ziel: cut.slug, art: 'cut', tier: species });
        }
        return;
      }
    }
    const primalId = ZONE_TO_PRIMAL[zone.id];
    if (primalId) {
      if (activeZone === zone.id) {
        resetPrimal();
      } else {
        setActiveZone(zone.id);
        setSelectedPrimal(primalId);
        setSelectedCutId(null);
        trackEvent('CutAtlas_Zone', { zone: zone.id, ziel: primalId, art: 'primal', tier: species });
      }
    }
  };

  const selectedCut = selectedCutId ? cuts.find((c) => c.id === selectedCutId) ?? null : null;
  const activePrimal = selectedPrimal ? primalById[selectedPrimal] ?? null : null;

  return (
    <div>
      {/* ── Spezies-Umschalter — entfällt bei nur einer Tierart ────────────── */}
      <div className={`flex items-center gap-2 mb-6 ${SPECIES_TABS.length < 2 ? 'hidden' : ''}`}>
        {SPECIES_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchSpecies(t.id)}
            className={`px-4 py-2 text-sm font-sans font-bold border transition-colors ${
              species === t.id
                ? 'bg-brand-gold/15 border-brand-gold/50 text-brand-gold'
                : 'border-border-subtle text-text-light/45 hover:border-brand-gold/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Oben: interaktives Tier + kompakte Info-Karte ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Links (2/3): interaktives Tier */}
        <div className="lg:col-span-2">
          {species === 'rind' ? (
            <div className="overflow-hidden rounded-lg border border-brand-gold/15 bg-[#0D0A06]">
              <BullButcherMap activeZoneId={activeZone} onZoneClick={handleZoneClick} />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-brand-gold/15 bg-[#0D0A06]">
              <AnimalDiagram
                species={species}
                primals={primals}
                selectedPrimal={selectedPrimal}
                onSelectPrimal={handlePrimal}
              />
            </div>
          )}

          <p className="mt-3 flex items-center gap-2 text-xs font-sans uppercase tracking-[0.14em] text-brand-gold/60">
            <MousePointerClick size={14} />
            {species === 'rind'
              ? 'Klicke eine Muskelgruppe auf dem Stier'
              : 'Klicke ein Teilstück auf dem Tier'}
          </p>

          {/* Mobile-Fallback: kompakte Teilstück-Chips (Desktop nutzt das Tier) */}
          <div className="mt-3 flex flex-wrap gap-1.5 lg:hidden">
            {primals.map((p) => {
              const active = selectedPrimal === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePrimal(p.id)}
                  className={`px-2.5 py-1 text-[11px] font-sans font-bold uppercase tracking-[0.06em] border transition-colors ${
                    active
                      ? 'bg-brand-gold/15 border-brand-gold/50 text-brand-gold'
                      : 'border-border-subtle text-text-light/55 hover:border-brand-gold/30'
                  }`}
                >
                  {p.nameDE}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rechts (1/3): kompakte Info-Karte zum gewählten Teilstück */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 min-h-[280px] rounded-lg border border-brand-gold/15 bg-surface-dark p-5">
            <AnimatePresence mode="wait" initial={false}>
              {activePrimal ? (
                <motion.div
                  key={activePrimal.id}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-brand-gold/10 pb-3">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-text-light leading-tight">
                        {activePrimal.nameDE}
                      </h3>
                      <p className="mt-0.5 text-brand-gold/60 text-xs font-sans uppercase tracking-[0.12em]">
                        {activePrimal.nameEN} · {filteredCuts.length}{' '}
                        {filteredCuts.length === 1 ? 'Cut' : 'Cuts'}
                      </p>
                    </div>
                    <button
                      onClick={resetPrimal}
                      aria-label="Auswahl zurücksetzen"
                      className="p-1.5 text-text-light/50 hover:text-brand-gold transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <p className="mt-4 font-body text-sm leading-relaxed text-text-light/70">
                    {activePrimal.blurb}
                  </p>

                  <p className="mt-4 flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-[0.12em] text-brand-fire">
                    <Flame size={13} />
                    {filteredCuts.length} {filteredCuts.length === 1 ? 'Cut' : 'Cuts'} im Raster unten
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full min-h-[240px] flex-col items-center justify-center px-4 text-center"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-brand-gold/25 text-brand-gold">
                    <MousePointerClick size={24} />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-text-light">Wähle eine Muskelgruppe</h3>
                  <p className="mt-2 max-w-xs font-body text-sm text-text-light/50">
                    Klicke {species === 'rind' ? 'auf dem Stier' : 'auf dem Tier'} auf ein Teilstück —
                    das Raster unten filtert dann auf die passenden Cuts.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Darunter: volles Cut-Raster (filtert bei Teilstück-Wahl) ────────── */}
      <div className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-brand-gold/10 pb-3">
          <h2 className="font-serif text-xl font-bold text-text-light">
            {activePrimal ? (
              <>
                {activePrimal.nameDE}{' '}
                <span className="text-text-light/40 text-base font-normal italic">
                  · {activePrimal.nameEN}
                </span>
              </>
            ) : (
              <>Alle Cuts</>
            )}
            <span className="ml-2 text-brand-gold/60 text-sm font-sans font-bold">
              {filteredCuts.length}
            </span>
          </h2>
          {selectedPrimal && (
            <button
              onClick={resetPrimal}
              className="inline-flex items-center gap-1.5 rounded border border-brand-fire/50 px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-[0.08em] text-brand-fire transition-colors hover:bg-brand-fire/10"
            >
              Filter: {activePrimal?.nameDE}
              <X size={13} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredCuts.map((cut) => (
              <button
                key={cut.id}
                id={cut.id}
                onClick={() => setSelectedCutId(cut.id)}
                className="group scroll-mt-24 overflow-hidden rounded-md border border-border-subtle bg-surface-card text-left transition-colors hover:border-brand-gold/40"
              >
                <CutImage
                  src={cut.image}
                  alt={`${cut.nameDE} (${cut.nameEN})`}
                  label={cut.nameDE}
                  accent={primalById[cut.primal]?.color ?? '#C8882A'}
                  className="aspect-[4/3]"
                  ai={cut.imageAI}
                />
                <div className="p-3">
                  <h3 className="font-serif font-bold text-text-light text-sm leading-tight">{cut.nameDE}</h3>
                  <p className="mt-0.5 text-text-light/40 text-xs font-sans italic">{cut.nameEN}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <MarblingBars level={cut.dna.marbling} />
                    <PriceLevel level={cut.price} />
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* ── Detail-Overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCut && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCutId(null)}
          >
            <motion.div
              className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-surface-dark border border-brand-gold/25"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedCutId(null)}
                aria-label="Schließen"
                className="absolute top-3 right-3 z-10 p-2 bg-surface-dark/80 border border-brand-gold/20 text-text-light/70 hover:text-brand-gold transition-colors"
              >
                <X size={18} />
              </button>

              <CutDetail
                cut={selectedCut}
                primal={primalById[selectedCut.primal]}
                recipes={recipeMap[selectedCut.id] ?? []}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CutDetail({ cut, primal, recipes }: { cut: Cut; primal?: Primal; recipes: CutRecipeRef[] }) {
  const offer = getMeatOffer(cut);
  const accent = primal?.color ?? '#C8882A';

  return (
    <div>
      {/* Foto-Header */}
      <CutImage
        src={cut.image}
        alt={`${cut.nameDE} (${cut.nameEN})`}
        label={cut.nameDE}
        accent={accent}
        className="w-full aspect-[16/9]"
        ai={cut.imageAI}
      />
      {/* Kennzeichnung mit Verweis auf /ki-disclaimer — hier moeglich, weil die
          Detailansicht (anders als die Atlas-Kachel) kein <button> ist. */}
      {(cut.imageAI || cut.imageSource) && (
        <div className="px-6 sm:px-8">
          <BildCredit source={cut.imageSource} ai={cut.imageAI} variant="inline" />
        </div>
      )}

      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-light">{cut.nameDE}</h2>
          <span className="text-text-light/40 text-sm italic">{cut.nameEN}</span>
        </div>
        {primal && (
          <p className="text-brand-gold/70 text-xs font-sans uppercase tracking-[0.12em] mt-1">
            {primal.nameDE} · {cut.origin}
          </p>
        )}

        <p className="font-body text-text-light/75 text-base leading-relaxed mt-4">{cut.blurb}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-7">
          {/* DNA-Radar */}
          <div className="border border-brand-gold/15 bg-surface-base p-4">
            <h3 className="text-[10px] font-sans font-bold text-brand-fire uppercase tracking-[0.18em] mb-2 text-center">
              Cut-DNA
            </h3>
            <CutDnaRadar dna={cut.dna} color={accent} />
          </div>

          {/* Fakten */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Flame size={16} className="text-brand-fire mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-sans font-bold text-text-light/40 uppercase tracking-[0.12em]">Garstufe</p>
                <p className="text-text-light text-sm font-body">{cut.doneness}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Thermometer size={16} className="text-brand-fire mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-sans font-bold text-text-light/40 uppercase tracking-[0.12em]">Kerntemperatur</p>
                <p className="text-text-light text-sm font-body">{cut.coreTemp}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-sans font-bold text-text-light/40 uppercase tracking-[0.12em] mb-1.5">Preis · Schwierigkeit</p>
              <div className="flex items-center gap-4">
                <PriceLevel level={cut.price} />
                <LevelDots level={cut.level} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-sans font-bold text-text-light/40 uppercase tracking-[0.12em] mb-2">Methoden</p>
              <div className="flex flex-wrap gap-1.5">
                {cut.methods.map((m) => (
                  <span key={m} className="px-2 py-0.5 text-xs font-sans bg-surface-elevated border border-brand-gold/15 text-text-light/70">
                    {METHOD_LABEL[m]}
                  </span>
                ))}
              </div>
            </div>
            {cut.facts && (
              <p className="text-text-light/50 text-xs font-body leading-relaxed pt-1">{cut.facts}</p>
            )}
          </div>
        </div>

        {/* Rezepte */}
        {recipes.length > 0 && (
          <div className="mt-8">
            <h3 className="text-[10px] font-sans font-bold text-brand-fire uppercase tracking-[0.18em] mb-3">
              Rezepte mit {cut.nameDE}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recipes.map((r) => (
                <Link
                  key={r.slug}
                  href={r.url}
                  className="flex items-center gap-3 border border-border-subtle bg-surface-base hover:border-brand-gold/40 transition-colors group"
                >
                  <CutImage src={r.image} alt={r.title} label={r.title} className="w-16 h-16 shrink-0" />
                  <span className="font-serif text-sm text-text-light leading-tight py-2 pr-2 group-hover:text-brand-gold transition-colors">
                    {r.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            href={offer.href}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-fire text-white font-sans font-bold text-sm tracking-[0.04em] uppercase hover:brightness-110 transition"
          >
            <ShoppingCart size={16} />
            {cut.nameDE} kaufen
          </a>
          {cut.hasGuide && (
            <Link
              href={`/cuts/${cut.slug}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 border border-brand-gold/50 text-brand-gold font-sans font-bold text-sm tracking-[0.04em] uppercase hover:bg-brand-gold/10 transition"
            >
              <BookOpen size={16} />
              Großer Guide
            </Link>
          )}
        </div>
        <p className="text-text-light/30 text-[11px] font-sans mt-2 leading-relaxed">{offer.disclosure}</p>
      </div>
    </div>
  );
}
