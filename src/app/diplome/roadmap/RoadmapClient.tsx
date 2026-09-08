'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import MedalCeremony, { type CeremonyData } from '@/components/diplome/MedalCeremony';
import KontextRail from '@/components/diplome/KontextRail';
import { createClient } from '@/lib/supabase/client';
import {
  STUFEN,
  STUFEN_ORDER,
  ERSTE_BEZAHLSTUFE,
  levelsOfStufe,
  pruefungsText,
  type StufeKey,
} from '@/lib/diplome/stufen';
import { FLASHCARDS, type Flashcard } from '@/lib/diplome/flashcards';

// Das Pruefungsergebnis stellt seit dem Audit vom 06.09.2026 ausschliesslich
// der Server fest (/api/diplome/pruefung) und schreibt es mit service_role.
// Vorher bewertete diese Datei selbst und schrieb per supabase-js
// `status: 'bestanden'` — unabhaengig vom Ergebnis, und die RLS liess jedes
// Konto beliebige Zeilen eintragen. Lesen des eigenen Fortschritts (Merge
// beim Laden) bleibt clientseitig erlaubt.

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Lernmethode = { icon: string; label: string; desc: string; vorhanden: boolean };

type Stage = {
  id: number;
  cert: string;
  metall: string;
  title: string;
  emoji: string;
  color: string;
  glow: string;
  levels: number[];
  levelNames: string[];
  tagline: string;
  kompetenzen: string[];
  lernmethoden: Lernmethode[];
  pruefung: string;
  badge: string;
};

type ModuleKey = StufeKey;
type ViewKey   = 'roadmap' | ModuleKey;
type TabKey    = 'lerninhalte' | 'quiz' | 'flashcards';
type ExpandKey = 'komp' | 'learn' | 'pruef' | null;
type ZoneKey   = 'direkte' | 'indirekte' | 'ruhe' | 'abdeck';

type ModuleMeta = {
  title: string;
  emoji: string;
  color: string;
  glow: string;
  stage: number;
  badge: string;
  description: string;
  requires?: ModuleKey;
};

/** Frage, wie sie der Browser bekommt — ohne Loesung (Rahmenlehrplan §8). */
type QuizQuestion = { id: string; q: string; options: readonly string[]; lektionSlug: string };

type FeuerzoneItem = {
  id: string;
  label: string;
  emoji: string;
  correctZone: ZoneKey;
  explain: string;
};

/** Minimaler, serialisierbarer Ausschnitt aus contentlayer — wird von page.tsx (Server) geliefert. */
export type LektionLink = {
  lektionSlug: string;
  title: string;
  order: number;
  url: string;
};

/** Lektionen je Stufe (1–5), bereits sortiert. */
export type LektionenByStufe = Readonly<Record<number, readonly LektionLink[]>>;

type Progress = {
  bestandene_module: ModuleKey[];
  quiz_scores: Partial<Record<ModuleKey, number>>;
  badges: string[];
  streak_count: number;
};

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKEN T
// ═══════════════════════════════════════════════════════════════════════════

const T = {
  bg:           '#0a0a0a',
  bgGradient:   'linear-gradient(180deg, #1a0a00 0%, #0a0a0a 100%)',
  panel:        '#111',
  panelAlt:     '#161616',
  border:       '#222',
  borderMuted:  '#2a2a2a',
  borderSubtle: '#1a1a1a',
  text:         '#e8e0d0',
  textGold:     '#e8c88a',
  textMuted:    '#8a7a6a',
  textDim:      '#666',
  textFaint:    '#444',
  card:         '#c8b898',
  success:      '#7CB342',
  successBg:    'rgba(124,179,66,0.15)',
  error:        '#E53935',
  errorBg:      'rgba(229,57,53,0.15)',
  gold:         '#C8882A',
  fire:         '#FF6B35',
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA — Stages (Roadmap)
// Identitaet (Nummer, Name, Zertifikat, Farbe, Badge, Level) kommt aus
// src/lib/diplome/stufen.ts — der einen Quelle. Hier steht nur der Inhalt,
// den ausschliesslich die Roadmap braucht: Tagline, Kompetenzen, Lernmethoden.
// ═══════════════════════════════════════════════════════════════════════════

type StageContent = { tagline: string; kompetenzen: string[]; lernmethoden: Lernmethode[] };

// `vorhanden` sagt ehrlich, ob die Methode heute existiert. Vorher standen
// zwanzig Formate als Versprechen nebeneinander, von denen drei gebaut waren
// (Quiz, Flashcards, Feuerzonen-Spiel). Audit 06.09.2026, R8.
const STAGE_CONTENT: Record<StufeKey, StageContent> = {
  bronze: {
    tagline: 'Feuer machen kann jeder. Feuer beherrschen ist die Kunst.',
    kompetenzen: [
      'Grillarten verstehen: Holzkohle, Gas, Pellet, Keramik',
      'Direkte vs. indirekte Hitze einsetzen',
      'Die 50/50-Methode (Kombi-Zone) anwenden',
      'Temperaturzonen auf dem Rost einteilen',
      'Holzkohle steuern: Anzündkamin, Glutkörbe, Minion-Ring, Lüftungsschieber',
      'Grill-Aufsätze nutzen: Wok, Dutch Oven, Pizzastein, Plancha',
      'Sicherheitsregeln & Brandschutz',
      'Grundlagen Dry Rubs & Marinaden',
      'Salzen: Wann, wie viel, warum?',
      'Timing beim Würzen verstehen',
    ],
    lernmethoden: [
      { icon: '🎮', label: 'Feuerzonen-Spiel', desc: 'Grillgut den richtigen Zonen auf dem Rost zuordnen', vorhanden: true },
      { icon: '🃏', label: 'Flashcards',       desc: 'Die Kernbegriffe der Stufe in 60 Sekunden', vorhanden: true },
      { icon: '⏱️', label: 'Timer-Challenge',  desc: 'Wie lange darf ein Rub einziehen? Raten & testen', vorhanden: false },
      { icon: '📹', label: 'Marco erklärt',    desc: '2-Min-Video: Kohle richtig anzünden', vorhanden: false },
    ],
  },
  anatomie: {
    tagline: 'Du weißt, was auf den Grill kommt — und warum.',
    kompetenzen: [
      'Fleischanatomie: Muskelgruppen & Schnitte',
      'Cuts erkennen: Ribeye, Brisket, Onglet, Tomahawk, T-Bone & Co.',
      'BBQ-Schweine-Zuschnitte: Boston Butt & St. Louis Cut Ribs',
      'Marmorierung beurteilen',
      'Wet Aging vs. Dry Aging: Unterschiede & Anwendung',
      'Optimale Lagertemperaturen & Bedingungen',
      'Fleischqualität beim Einkauf beurteilen',
    ],
    lernmethoden: [
      { icon: '🃏', label: 'Flashcards',        desc: 'Cut-Name → Charakteristik → Garmethode in 60 Sek.', vorhanden: true },
      { icon: '🗺️', label: 'Anatomie-Map',      desc: 'Klick auf das Rind: Welcher Cut kommt woher?', vorhanden: false },
      { icon: '🔬', label: 'Zoom-Karte',        desc: 'Marmorierung mikroskopisch erkennen — gut vs. schlecht', vorhanden: false },
      { icon: '📊', label: 'Vergleichs-Slider', desc: 'Wet Aged vs. Dry Aged: Textur, Geschmack, Preis', vorhanden: false },
    ],
  },
  thermometer: {
    tagline: 'Präzision trennt den Hobbykoch vom Profi.',
    kompetenzen: [
      'Kerntemperaturen für alle Fleischarten beherrschen',
      'Reverse Sear Methode anwenden',
      'Die perfekte Kruste erzeugen (Maillard-Reaktion)',
      'Sous-Vide-Grillen als Hybridmethode',
      'Zeitmanagement: Garzeiten koordinieren — ein Menü synchron fertigstellen',
      'Internationale Cuts: Wagyu, Angus, Iberico',
      'Herkunftsländer & Qualitätsstandards kennen',
      'Rasse, Fütterung & Haltung als Qualitätsfaktoren',
    ],
    lernmethoden: [
      { icon: '🃏', label: 'Flashcards',            desc: 'Die Kerntemperaturen aller Fleischarten', vorhanden: true },
      { icon: '🌡️', label: 'Thermometer-Simulator', desc: 'Virtuelle Sonde: Richtige Einstichstelle wählen', vorhanden: false },
      { icon: '🌍', label: 'World-Tour Quiz',       desc: 'Cut aus Herkunftsland und Rasse identifizieren', vorhanden: false },
      { icon: '⚗️', label: 'Reaktions-Labor',        desc: 'Maillard-Animation: Was passiert bei 140 °C?', vorhanden: false },
    ],
  },
  holz: {
    tagline: 'Low & Slow ist eine Philosophie, kein Rezept.',
    kompetenzen: [
      'Smoker bedienen: Offset, Kettle, Pellet, Keramik',
      'Gerätekunde Gas: Brennersysteme, Aroma-/Flammschienen, Druckminderer',
      'Smart Grilling: digitale Pellet-Steuerung, Förderschnecke, Fühler-Kalibrierung',
      'Holzarten & Raucharomen gezielt einsetzen — Mopping & Smoke Ring',
      'Bitterstoffe vermeiden: sauberer Rauch statt Creosote',
      'BBQ-Wissenschaft: Kollagenabbau, Stall-Phase',
      'Proteinstruktur & Saftigkeit verstehen',
      'Lebensmittelhygiene & HACCP-Grundlagen',
      'Planung, Kühlketten-Logistik & Großmengen bei Events',
    ],
    lernmethoden: [
      { icon: '🃏', label: 'Flashcards',  desc: 'Acht Holzarten und ihre Aromen', vorhanden: true },
      { icon: '🌲', label: 'Holz-Wheel',  desc: 'Spin & Match: Welches Holz für welches Fleisch?', vorhanden: false },
      { icon: '📈', label: 'Stall-Kurve', desc: 'Interaktives Diagramm: Temperatur über Zeit tracken', vorhanden: false },
      { icon: '📋', label: 'Event-Planer', desc: 'Simuliere: Catering für 50 Personen kalkulieren', vorhanden: false },
    ],
  },
  kcbs: {
    tagline: 'Du kennst das Steak von der Weide bis zum Teller.',
    kompetenzen: [
      'Wagyu-Sensorik: BMS-Score, Marmorierung verkosten',
      'Foodpairing & Foodcompleting meistern',
      'Weinbegleitung & Getränkeempfehlungen',
      'Wettbewerbsgrillen (KCBS, SCA, GBA-Standards)',
      'Präsentation & Anrichten auf Profiniveau',
      'Kundenberatung & Wissensvermittlung',
      'Didaktik: Anfänger und „Grill-Nerds" im selben Kurs abholen',
      'Krisenmanagement: Fehler & Gerichte vor den Gästen retten',
      'Eigene Kurse & Events konzipieren und leiten',
    ],
    lernmethoden: [
      { icon: '🃏', label: 'Flashcards',     desc: 'KCBS-Kategorien, Turn-In-Zeiten, Bewertung', vorhanden: true },
      { icon: '👁️', label: 'Wagyu-Loupe',    desc: 'Marmorierungs-Stufen im Detail per Zoom erkennen', vorhanden: false },
      { icon: '🍷', label: 'Pairing-Lab',    desc: 'Interaktives Matching: Steak + Wein + Beilage', vorhanden: false },
      { icon: '🏅', label: 'KCBS-Simulator', desc: 'Bewerte 5 virtuelle Briskets nach Wettbewerbsregeln', vorhanden: false },
    ],
  },
};

const stages: Stage[] = STUFEN.map((s) => ({
  id: s.nr,
  cert: s.cert,
  metall: s.metall,
  title: s.title,
  emoji: s.emoji,
  color: s.color,
  glow: s.glow,
  levels: [...s.levels],
  levelNames: levelsOfStufe(s.nr).map((l) => l.name),
  badge: s.nr === 5 ? `${s.cert} (postfähige Urkunde)` : `${s.cert} · ${s.badge}`,
  // Der Pruefungssatz kommt aus den Konstanten — vorher versprach er
  // 10/15/20/25/30 Fragen, Fallstudien und eine Videopruefung, die es nicht gab.
  pruefung: pruefungsText(),
  ...STAGE_CONTENT[s.key],
}));

// ═══════════════════════════════════════════════════════════════════════════
// DATA — Module Meta (aus stufen.ts abgeleitet, inkl. Freischaltkette)
// ═══════════════════════════════════════════════════════════════════════════

const moduleMeta: Record<ModuleKey, ModuleMeta> = Object.fromEntries(
  STUFEN.map((s) => [
    s.key,
    {
      title:       s.modulTitle,
      emoji:       s.modulEmoji,
      color:       s.color,
      glow:        s.glow,
      stage:       s.nr,
      badge:       s.badge,
      description: s.modulDescription,
      // Vorher fehlte `requires` bei Stufe 2 — sie war nicht hinter Stufe 1 gesperrt.
      requires:    s.requires ?? undefined,
    } satisfies ModuleMeta,
  ]),
) as Record<ModuleKey, ModuleMeta>;

const moduleOrder: readonly ModuleKey[] = STUFEN_ORDER;

// ═══════════════════════════════════════════════════════════════════════════
// DATA — Flashcards: src/lib/diplome/flashcards.ts. Die Pruefungsfragen liegen
// server-only in fragen.ts und kommen per /api/diplome/pruefung/ziehung.
// ═══════════════════════════════════════════════════════════════════════════

const flashcards: Record<ModuleKey, readonly Flashcard[]> = FLASHCARDS;
// ═══════════════════════════════════════════════════════════════════════════
// DATA — Feuerzonen-Spiel
// ═══════════════════════════════════════════════════════════════════════════

const feuerzoneItems: FeuerzoneItem[] = [
  { id: 'steak',   label: 'Steak',    emoji: '🥩', correctZone: 'direkte',   explain: 'Direkte Hitze für die perfekte Kruste (Maillard-Reaktion).' },
  { id: 'wurst',   label: 'Wurst',    emoji: '🌭', correctZone: 'direkte',   explain: 'Schnelles Bräunen, direkt servieren.' },
  { id: 'haehn',   label: 'Hähnchen', emoji: '🍗', correctZone: 'indirekte', explain: 'Indirekt durchgaren — innen 75 °C, sicher und saftig.' },
  { id: 'brisket', label: 'Brisket',  emoji: '🐂', correctZone: 'ruhe',      explain: 'Low & Slow: 100–130 °C über viele Stunden — so wird die zähe Brust butterzart.' },
  { id: 'gemuese', label: 'Gemüse',   emoji: '🥦', correctZone: 'indirekte', explain: 'Indirekte Hitze: gleichmäßig garen ohne Verkohlen.' },
  { id: 'fisch',   label: 'Fisch',    emoji: '🐟', correctZone: 'abdeck',    explain: 'Abdeckzone mit Deckel: schonend, gleichmäßig.' },
];

const zoneMeta: Record<ZoneKey, { label: string; temp: string; color: string }> = {
  direkte:   { label: 'Direkte Hitze',   temp: '230-290 °C', color: '#E53935' },
  indirekte: { label: 'Indirekte Hitze', temp: '150-180 °C', color: '#FB8C00' },
  ruhe:      { label: 'Low & Slow',      temp: '100-130 °C', color: '#FBC02D' },
  abdeck:    { label: 'Abdeckzone',      temp: '90-110 °C',  color: '#43A047' },
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK — useProgress (localStorage, SSR-safe)
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'steakakademie_progress';
const defaultProgress: Progress = {
  bestandene_module: [],
  quiz_scores:       {},
  badges:            [],
  streak_count:      0,
};

function useProgress() {
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Progress>;
        setProgress({ ...defaultProgress, ...parsed });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: Progress) => {
    setProgress(next);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  // Server-Fortschritt (Supabase) in den lokalen Stand mergen — cross-device.
  const mergeServer = useCallback(
    (rows: { modul: string; quiz_score: number | null; badge: string | null }[]) => {
      setProgress((prev) => {
        const modules = new Set(prev.bestandene_module);
        const scores = { ...prev.quiz_scores };
        const badges = new Set(prev.badges);
        for (const r of rows) {
          modules.add(r.modul as ModuleKey);
          if (r.quiz_score != null) {
            scores[r.modul as ModuleKey] = Math.max(scores[r.modul as ModuleKey] ?? 0, r.quiz_score);
          }
          if (r.badge) badges.add(r.badge);
        }
        const next: Progress = {
          ...prev,
          bestandene_module: Array.from(modules),
          quiz_scores: scores,
          badges: Array.from(badges),
        };
        if (typeof window !== 'undefined') {
          try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        }
        return next;
      });
    },
    [],
  );

  const completeModule = useCallback(
    (key: ModuleKey, score: number): string => {
      const badge = moduleMeta[key].badge;
      setProgress((prev) => {
        const next: Progress = {
          ...prev,
          bestandene_module: prev.bestandene_module.includes(key)
            ? prev.bestandene_module
            : [...prev.bestandene_module, key],
          quiz_scores: {
            ...prev.quiz_scores,
            [key]: Math.max(score, prev.quiz_scores[key] ?? 0),
          },
          badges: prev.badges.includes(badge)
            ? prev.badges
            : [...prev.badges, badge],
        };
        if (typeof window !== 'undefined') {
          try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        }
        return next;
      });
      return badge;
    },
    [],
  );

  const bumpStreak = useCallback(() => {
    setProgress((prev) => {
      const next: Progress = { ...prev, streak_count: prev.streak_count + 1 };
      if (typeof window !== 'undefined') {
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  }, []);

  const resetStreak = useCallback(() => {
    setProgress((prev) => {
      if (prev.streak_count === 0) return prev;
      const next: Progress = { ...prev, streak_count: 0 };
      if (typeof window !== 'undefined') {
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    persist(defaultProgress);
  }, [persist]);

  const isUnlocked = useCallback(
    (key: ModuleKey): boolean => {
      const meta = moduleMeta[key];
      if (!meta.requires) return true;
      // Bestanden ist, was der Server als bestanden eingetragen hat — die
      // Punktzahl allein taugt nicht mehr, seit die Fragenzahl je Pruefung
      // variiert (5 bei kleinem Pool, 10 bei Stufe 1).
      return progress.bestandene_module.includes(meta.requires);
    },
    [progress.bestandene_module],
  );

  return { progress, hydrated, completeModule, bumpStreak, resetStreak, resetAll, isUnlocked, mergeServer };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK — useBanner (3-Sekunden-Auto-Dismiss)
// ═══════════════════════════════════════════════════════════════════════════

type BannerMsg = { text: string; color: string } | null;

function useBanner(): [BannerMsg, (msg: BannerMsg) => void] {
  const [banner, setBanner] = useState<BannerMsg>(null);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 3000);
    return () => window.clearTimeout(t);
  }, [banner]);

  return [banner, setBanner];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/** Serverseitig festgestelltes Pruefungsergebnis (siehe /api/diplome/pruefung). */
export type PruefungsErgebnis = {
  score: number;
  gesamt: number;
  grenze: number;
  bestanden: boolean;
  badge: string | null;
  ergebnisse: { id: string; richtig: boolean; explain: string; lektionSlug: string }[];
  gespeichert: boolean;
  hinweis?: string;
};

export default function RoadmapClient({
  lektionen,
  eingeloggt,
  hatDiplom,
}: {
  lektionen: LektionenByStufe;
  /** Vom Server ermittelt — steuert nur Hinweise, nicht die Sicherheit. */
  eingeloggt: boolean;
  /** Admin oder aktive Diplom-Buchung — der Server prueft das bei jeder Pruefung erneut. */
  hatDiplom: boolean;
}) {
  const [view, setView] = useState<ViewKey>('roadmap');
  const prog = useProgress();
  const [banner, setBanner] = useBanner();
  const [ceremony, setCeremony] = useState<CeremonyData | null>(null);

  // Beim Laden: Server-Fortschritt holen (falls eingeloggt) und mergen.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from('course_progress')
          .select('modul, quiz_score, badge')
          .eq('user_id', user.id);
        if (data && !cancelled) prog.mergeServer(data);
      } catch { /* localStorage bleibt Fallback */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tryOpenModule(key: ModuleKey) {
    if (!prog.isUnlocked(key)) {
      const reqKey = moduleMeta[key].requires!;
      setBanner({
        text: `🔒 Schließe zuerst Stufe ${moduleMeta[reqKey].stage} (${moduleMeta[reqKey].title}) ab`,
        color: T.gold,
      });
      return;
    }
    setView(key);
  }

  // Bestanden wird nur, was der Server als bestanden festgestellt hat.
  // Vorher wurde hier jedes Ergebnis verbucht — auch 0 von 5 (Audit R1).
  function handleQuizComplete(key: ModuleKey, ergebnis: PruefungsErgebnis) {
    if (!ergebnis.bestanden) return;
    const badge = prog.completeModule(key, ergebnis.score);
    const meta = moduleMeta[key];
    const stage = stages[meta.stage - 1];
    setCeremony({ tier: STUFEN[meta.stage - 1].tier, badge, name: stage?.title ?? meta.title, color: meta.color, stufe: meta.stage });
    if (!ergebnis.gespeichert && ergebnis.hinweis) {
      setBanner({ text: `ℹ️ ${ergebnis.hinweis}`, color: T.gold });
    }
  }

  function handleStreakHit() {
    prog.bumpStreak();
  }

  // Streak-Banner ab 5
  useEffect(() => {
    if (prog.progress.streak_count > 0 && prog.progress.streak_count % 5 === 0) {
      setBanner({ text: `🔥 Streak! ${prog.progress.streak_count} richtige in Folge`, color: T.fire });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prog.progress.streak_count]);

  function handleReset() {
    if (typeof window === 'undefined') return;
    if (window.confirm('Fortschritt komplett zurücksetzen? Dies kann nicht rückgängig gemacht werden.')) {
      prog.resetAll();
      setBanner({ text: '✓ Fortschritt zurückgesetzt', color: T.textMuted });
    }
  }

  return (
    <main className="bg-surface-base min-h-screen relative">

        {banner && <Banner text={banner.text} color={banner.color} />}
        <MedalCeremony data={ceremony} onClose={() => setCeremony(null)} />

        {/* Breadcrumb */}
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="flex items-center justify-between gap-4" aria-label="Breadcrumb">
            <div className="flex items-center gap-1.5 text-xs font-sans text-text-light/30">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/diplome" className="hover:text-brand-gold transition-colors">Diplom-System</Link>
              <ChevronRight size={12} />
              {view === 'roadmap' ? (
                <span className="text-text-light/50">Roadmap</span>
              ) : (
                <>
                  <button
                    onClick={() => setView('roadmap')}
                    className="hover:text-brand-gold transition-colors"
                  >Roadmap</button>
                  <ChevronRight size={12} />
                  <span className="text-text-light/50">{moduleMeta[view].title}</span>
                </>
              )}
            </div>
            {prog.hydrated && (prog.progress.bestandene_module.length > 0 || prog.progress.streak_count > 0) && (
              <button
                onClick={handleReset}
                className="text-[10px] font-sans text-text-light/20 hover:text-text-light/50 transition-colors"
                title="Fortschritt zurücksetzen"
              >Fortschritt zurücksetzen</button>
            )}
          </nav>
          {/* Ohne Konto bleibt der Fortschritt auf diesem Geraet — das wurde vorher nirgends gesagt (Audit R9). */}
          {!eingeloggt && (
            <p className="mt-4 text-xs font-sans text-text-light/50 leading-relaxed">
              Du bist nicht angemeldet: Dein Fortschritt bleibt auf diesem Gerät und wird nicht als
              bestanden eingetragen.{' '}
              <Link href="/auth/login?redirectTo=/diplome/roadmap" className="underline hover:text-brand-gold transition-colors">
                Anmelden
              </Link>
              , damit er mitkommt.
            </p>
          )}
        </div>

        {view === 'roadmap' ? (
          <RoadmapView
            isUnlocked={prog.isUnlocked}
            completedModules={prog.progress.bestandene_module}
            onOpenModule={tryOpenModule}
          />
        ) : (
          <ModuleView
            moduleKey={view}
            lektionen={lektionen[moduleMeta[view].stage] ?? []}
            hatDiplom={hatDiplom}
            onBack={() => setView('roadmap')}
            onQuizComplete={(ergebnis) => handleQuizComplete(view, ergebnis)}
            onStreakHit={handleStreakHit}
            onStreakBreak={prog.resetStreak}
            streakCount={prog.progress.streak_count}
            bestScore={prog.progress.quiz_scores[view] ?? 0}
            completed={prog.progress.bestandene_module.includes(view)}
          />
        )}
      </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT — Banner
// ═══════════════════════════════════════════════════════════════════════════

function Banner({ text, color }: { text: string; color: string }) {
  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-xl px-6 py-3 font-sans text-sm font-bold shadow-2xl pointer-events-none"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        color: '#0a0a0a',
        boxShadow: `0 8px 32px ${color}66`,
        animation: 'sk-banner-in 0.25s ease-out',
      }}
      role="status"
    >
      {text}
      <style>{`
        @keyframes sk-banner-in {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT — RoadmapView (5 Stufen Overview)
// ═══════════════════════════════════════════════════════════════════════════

function RoadmapView({
  isUnlocked,
  completedModules,
  onOpenModule,
}: {
  isUnlocked: (key: ModuleKey) => boolean;
  completedModules: ModuleKey[];
  onOpenModule: (key: ModuleKey) => void;
}) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<ExpandKey>(null);
  const s = stages[active];
  const stageModuleKey = moduleOrder[active];
  const unlocked = isUnlocked(stageModuleKey);
  const completed = completedModules.includes(stageModuleKey);

  return (
    <>
      {/* Header strip */}
      <div className="border-b border-brand-gold/10 mt-4" style={{ background: T.bgGradient }}>
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <div className="text-3xl">🥩</div>
          <div>
            <div className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-1">
              Steakakademie · Diplom-System
            </div>
            <div className="font-serif text-xl font-bold" style={{ color: T.textGold }}>
              Grillmeister-Ausbildung in 5 Stufen
            </div>
          </div>
        </div>
      </div>

      {/* Stage Navigator */}
      <div className="bg-surface-dark border-b border-border-subtle">
        <div
          className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-5 flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {stages.map((st, i) => {
            const mKey = moduleOrder[i];
            const stageUnlocked = isUnlocked(mKey);
            const stageDone = completedModules.includes(mKey);
            return (
              <button
                key={i}
                onClick={() => { setActive(i); setExpanded(null); }}
                className="flex-none rounded-xl p-3 text-center min-w-[110px] transition-[background,border-color,box-shadow] relative"
                style={{
                  background: active === i ? `linear-gradient(135deg, ${st.color}22, ${st.color}44)` : T.panelAlt,
                  border: active === i ? `1px solid ${st.color}` : `1px solid ${T.borderMuted}`,
                  boxShadow: active === i ? `0 0 16px ${st.glow}` : 'none',
                }}
              >
                <div className="text-xl mb-1">{stageDone ? '✓' : (stageUnlocked ? st.emoji : '🔒')}</div>
                <div className="text-[10px] font-sans tracking-[0.12em] uppercase" style={{ color: active === i ? st.color : T.textDim }}>
                  Stufe {st.id}
                </div>
                <div className="text-[11px] font-sans mt-0.5" style={{ color: active === i ? T.text : T.textFaint }}>
                  {st.metall}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main */}
      <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-10">
          <div className="max-w-3xl w-full mx-auto lg:mx-0">

        {/* Stage Hero */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 mb-7"
          style={{
            background: `linear-gradient(135deg, ${s.color}15 0%, ${T.bg} 60%)`,
            border: `1px solid ${s.color}40`,
            boxShadow: `0 0 40px ${s.glow}`,
          }}
        >
          <div className="absolute -top-5 -right-5 leading-none pointer-events-none" style={{ fontSize: '100px', opacity: 0.06 }} aria-hidden>
            {s.emoji}
          </div>
          <div className="text-[11px] font-sans tracking-[0.18em] uppercase mb-2" style={{ color: s.color }}>
            Stufe {s.id} · {s.cert}
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-text-primary mb-2">
            {s.emoji} {s.title}
          </h1>
          <div className="font-serif italic text-text-secondary mb-4 text-sm sm:text-base">
            „{s.tagline}&quot;
          </div>
          <div className="flex gap-2 flex-wrap mb-5">
            {s.levels.map((lv, i) => (
              <span
                key={i}
                className="rounded-full px-3 py-1 text-[11px] font-sans"
                style={{ background: `${s.color}20`, border: `1px solid ${s.color}50`, color: s.color }}
              >
                Level {lv}: {s.levelNames[i]}
              </span>
            ))}
          </div>

          {/* Module-CTA */}
          <button
            onClick={() => onOpenModule(stageModuleKey)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-sans font-bold text-[12px] tracking-wider uppercase transition-[background,color,border-color,box-shadow]"
            style={{
              background: unlocked
                ? `linear-gradient(135deg, ${s.color}, ${s.color}cc)`
                : T.panel,
              color: unlocked ? T.bg : T.textDim,
              border: unlocked ? 'none' : `1px solid ${T.borderMuted}`,
              boxShadow: unlocked ? `0 4px 16px ${s.glow}` : 'none',
              cursor: 'pointer',
            }}
          >
            {!unlocked && '🔒 '}
            {completed ? '✓ ' : ''}
            {moduleMeta[stageModuleKey].emoji} Modul öffnen: {moduleMeta[stageModuleKey].title} →
          </button>
        </div>

        {/* Expand sections */}
        <div className="flex flex-col gap-4">
          <ExpandSection
            expanded={expanded === 'komp'}
            onToggle={() => setExpanded(expanded === 'komp' ? null : 'komp')}
            icon="📚"
            title="Lernziele & Kompetenzen"
            subtitle={`${s.kompetenzen.length} Kernthemen dieser Stufe`}
            color={s.color}
          >
            <div className="flex flex-col gap-2 pt-4">
              {s.kompetenzen.map((k, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px] font-sans" style={{ color: T.card }}>
                  <span style={{ color: s.color, marginTop: '1px' }}>✦</span>
                  {k}
                </div>
              ))}
            </div>
          </ExpandSection>

          <ExpandSection
            expanded={expanded === 'learn'}
            onToggle={() => setExpanded(expanded === 'learn' ? null : 'learn')}
            icon="🎮"
            title="Spielerische Lernmethoden"
            subtitle={`${s.lernmethoden.filter((m) => m.vorhanden).length} verfügbar · ${s.lernmethoden.filter((m) => !m.vorhanden).length} geplant`}
            color={s.color}
          >
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {s.lernmethoden.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3"
                  style={{ background: `${s.color}10`, border: `1px solid ${s.color}25`, opacity: m.vorhanden ? 1 : 0.55 }}
                >
                  <div className="text-xl mb-1.5">{m.icon}</div>
                  <div className="text-xs font-sans font-bold mb-1" style={{ color: s.color }}>
                    {m.label}
                    {!m.vorhanden && <span className="ml-2 text-[9px] uppercase tracking-wider" style={{ color: T.textDim }}>geplant</span>}
                  </div>
                  <div className="text-[11px] font-sans leading-snug" style={{ color: T.textMuted }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </ExpandSection>

          <ExpandSection
            expanded={expanded === 'pruef'}
            onToggle={() => setExpanded(expanded === 'pruef' ? null : 'pruef')}
            icon="🏅"
            title="Prüfung & Abschluss"
            subtitle={s.badge}
            color={s.color}
          >
            <div className="pt-4">
              <div
                className="rounded-xl p-4 text-[13px] font-sans leading-relaxed mb-3"
                style={{ background: `${s.color}15`, border: `1px solid ${s.color}30`, color: T.card }}
              >
                📋 {s.pruefung}
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: T.bg }}>
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-[11px] font-sans text-text-muted mb-0.5">Bei Bestehen erhältst du</div>
                  <div className="text-[13px] font-sans font-bold" style={{ color: s.color }}>{s.badge}</div>
                </div>
                {s.id === 5 && (
                  <div
                    className="ml-auto rounded-lg px-2.5 py-1 text-[10px] font-sans tracking-wider"
                    style={{ background: `${s.color}20`, border: `1px solid ${s.color}`, color: s.color }}
                  >
                    ✉️ Urkunde per Post
                  </div>
                )}
              </div>
            </div>
          </ExpandSection>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 p-5 rounded-2xl border border-border-subtle bg-surface-dark">
          <div className="text-[11px] font-sans tracking-[0.18em] uppercase text-text-muted mb-3">
            Gesamtpfad zur Meisterschaft
          </div>
          <div className="flex gap-1.5 items-center">
            {stages.map((st, i) => {
              const mKey = moduleOrder[i];
              const done = completedModules.includes(mKey);
              return (
                <div key={i} className="flex items-center flex-1">
                  <button
                    onClick={() => { setActive(i); setExpanded(null); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-[background,border-color,box-shadow] flex-none"
                    style={{
                      background: done || i <= active ? `linear-gradient(135deg, ${st.color}, ${st.color}88)` : T.borderSubtle,
                      border: i === active ? `2px solid ${st.color}` : `2px solid ${T.borderMuted}`,
                      boxShadow: i === active ? `0 0 12px ${st.glow}` : 'none',
                    }}
                    aria-label={`Springe zu Stufe ${st.id}`}
                  >
                    {done ? '✓' : st.emoji}
                  </button>
                  {i < stages.length - 1 && (
                    <div
                      className="flex-1 h-px"
                      style={{
                        background:
                          done || i < active
                            ? `linear-gradient(90deg, ${st.color}, ${stages[i + 1].color})`
                            : T.borderSubtle,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {stages.map((st, i) => (
              <div
                key={i}
                className="text-[9px] font-sans uppercase tracking-wider text-center flex-1"
                style={{ color: i === active ? st.color : T.textFaint }}
              >
                {st.metall}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-7 pb-4">
          <Link
            href="/diplome"
            className="inline-block uppercase font-sans font-bold text-[13px] tracking-wider px-7 py-3 rounded-full text-ink"
            style={{
              background: `linear-gradient(135deg, ${s.color}, ${s.color}99)`,
              boxShadow: `0 4px 20px ${s.glow}`,
            }}
          >
            Zurück zum Diplom-System →
          </Link>
          <div className="mt-2.5 text-[11px] font-sans" style={{ color: T.textFaint }}>
            steakakademie.de/diplome · Kostenlos starten
          </div>
        </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <KontextRail text={`${s.kompetenzen.join(' ')} ${s.title}`} color={s.color} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT — ModuleView (Lerninhalte / Quiz / Flashcards Tabs)
// ═══════════════════════════════════════════════════════════════════════════

function ModuleView({
  moduleKey,
  lektionen,
  hatDiplom,
  onBack,
  onQuizComplete,
  onStreakHit,
  onStreakBreak,
  streakCount,
  bestScore,
  completed,
}: {
  moduleKey: ModuleKey;
  lektionen: readonly LektionLink[];
  hatDiplom: boolean;
  onBack: () => void;
  onQuizComplete: (ergebnis: PruefungsErgebnis) => void;
  onStreakHit: () => void;
  onStreakBreak: () => void;
  streakCount: number;
  bestScore: number;
  completed: boolean;
}) {
  const meta = moduleMeta[moduleKey];
  const stage = stages[meta.stage - 1];
  const [tab, setTab] = useState<TabKey>('lerninhalte');

  return (
    <>
      {/* Module Header */}
      <div
        className="border-b mt-4"
        style={{
          background: `linear-gradient(135deg, ${meta.color}18 0%, ${T.bg} 80%)`,
          borderColor: `${meta.color}30`,
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[11px] font-sans uppercase tracking-wider mb-4 hover:opacity-80 transition-opacity"
            style={{ color: meta.color }}
          >
            <ArrowLeft size={14} /> Zurück zur Roadmap
          </button>
          <div className="text-[11px] font-sans tracking-[0.18em] uppercase mb-2" style={{ color: meta.color }}>
            Stufe {meta.stage} · {stage.cert}
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-text-primary mb-2">
            {meta.emoji} {meta.title}
          </h1>
          <div className="text-sm font-sans mb-4" style={{ color: T.textMuted }}>
            {meta.description}
          </div>
          <div className="flex gap-3 flex-wrap text-[11px] font-sans">
            {completed && (
              <span className="rounded-full px-3 py-1" style={{ background: T.successBg, border: `1px solid ${T.success}40`, color: T.success }}>
                ✓ Abgeschlossen
              </span>
            )}
            {bestScore > 0 && (
              <span className="rounded-full px-3 py-1" style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}40`, color: meta.color }}>
                Beste Quiz-Punktzahl: {bestScore}
              </span>
            )}
            {streakCount > 0 && (
              <span className="rounded-full px-3 py-1" style={{ background: `${T.fire}15`, border: `1px solid ${T.fire}40`, color: T.fire }}>
                🔥 Streak: {streakCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-surface-dark border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {(
            [
              { key: 'lerninhalte', label: '📚 Lerninhalte' },
              { key: 'quiz',        label: '🎯 Quiz' },
              { key: 'flashcards',  label: '🃏 Flashcards' },
            ] as { key: TabKey; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="rounded-lg px-4 py-2 text-[12px] font-sans font-semibold transition-[background-color,color,border-color]"
              style={{
                background: tab === t.key ? `${meta.color}25` : 'transparent',
                color:      tab === t.key ? meta.color : T.textMuted,
                border:     tab === t.key ? `1px solid ${meta.color}60` : `1px solid transparent`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tab === 'lerninhalte' && <LerninhalteTab moduleKey={moduleKey} stage={stage} lektionen={lektionen} />}
        {tab === 'quiz' && (
          meta.stage >= ERSTE_BEZAHLSTUFE && !hatDiplom ? (
            // Die Pruefungen der Bezahlstufen gehoeren zum Diplom — vorher waren
            // sie frei, waehrend der Lernstoff gesperrt war (Audit R4). Der
            // Server lehnt den Versuch ohnehin ab; das hier erspart den Umweg.
            <div className="rounded-2xl p-8 text-center" style={{ background: T.panel, border: `1px solid ${meta.color}40` }}>
              <div className="text-4xl mb-3">🔒</div>
              <div className="font-serif text-xl font-bold text-text-primary mb-2">
                Prüfung gehört zum Grillmeister-Diplom
              </div>
              <p className="text-sm font-sans mb-5 max-w-md mx-auto" style={{ color: T.textMuted }}>
                Stufe {meta.stage} ({stage.cert}) ist Teil der kostenpflichtigen Ausbildung.
                Stufe 1 mit Prüfung ist frei — dort kannst du sofort anfangen.
              </p>
              <Link
                href="/diplome"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-sans font-bold text-[12px] tracking-wider uppercase"
                style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`, color: T.bg }}
              >
                Zur Ausbildung <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <Quiz
              moduleKey={moduleKey}
              lektionen={lektionen}
              onComplete={onQuizComplete}
              onStreakHit={onStreakHit}
              onStreakBreak={onStreakBreak}
            />
          )
        )}
        {tab === 'flashcards' && <Flashcards moduleKey={moduleKey} />}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT — LerninhalteTab
// ═══════════════════════════════════════════════════════════════════════════

function LerninhalteTab({
  moduleKey,
  stage,
  lektionen,
}: {
  moduleKey: ModuleKey;
  stage: Stage;
  lektionen: readonly LektionLink[];
}) {
  const meta = moduleMeta[moduleKey];

  return (
    <div className="flex flex-col gap-6">
      {lektionen.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: T.panel, border: `1px solid ${meta.color}40` }}>
          <div className="text-[11px] font-sans tracking-[0.18em] uppercase mb-3" style={{ color: meta.color }}>
            📚 Lektionen lesen
          </div>
          <ol className="flex flex-col gap-1.5">
            {lektionen.map((l) => (
              <li key={l.lektionSlug}>
                <Link
                  href={l.url}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                  style={{ background: `${meta.color}0C` }}
                >
                  <span className="text-xs font-bold w-5 shrink-0 text-center" style={{ color: meta.color }}>{l.order}</span>
                  <span className="flex-1 text-[13px] font-sans font-semibold" style={{ color: T.text }}>{l.title}</span>
                  <ChevronRight size={14} style={{ color: meta.color }} />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {moduleKey === 'bronze' && (
        <FeuerzoneSpiel color={meta.color} />
      )}

      <div className="rounded-2xl p-6" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
        <div className="text-[11px] font-sans tracking-[0.18em] uppercase mb-3" style={{ color: meta.color }}>
          Was du in diesem Modul lernst
        </div>
        <div className="flex flex-col gap-2.5">
          {stage.kompetenzen.map((k, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[14px] font-sans" style={{ color: T.card }}>
              <span style={{ color: meta.color, marginTop: '2px' }}>✦</span>
              {k}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
        <div className="text-[11px] font-sans tracking-[0.18em] uppercase mb-3" style={{ color: meta.color }}>
          So lernst du
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stage.lernmethoden.map((m, i) => (
            <div
              key={i}
              className="rounded-xl p-3"
              style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}25`, opacity: m.vorhanden ? 1 : 0.55 }}
            >
              <div className="text-xl mb-1.5">{m.icon}</div>
              <div className="text-xs font-sans font-bold mb-1" style={{ color: meta.color }}>
                {m.label}
                {!m.vorhanden && <span className="ml-2 text-[9px] uppercase tracking-wider" style={{ color: T.textDim }}>geplant</span>}
              </div>
              <div className="text-[11px] font-sans leading-snug" style={{ color: T.textMuted }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT — FeuerzoneSpiel (Stufe 1 Bronze Spezial)
// ═══════════════════════════════════════════════════════════════════════════

function FeuerzoneSpiel({ color }: { color: string }) {
  const [placements, setPlacements] = useState<Partial<Record<string, ZoneKey>>>({});
  const [selected, setSelected]     = useState<string | null>(null);
  const [feedback, setFeedback]     = useState<{ id: string; correct: boolean; explain: string } | null>(null);

  function place(itemId: string, zone: ZoneKey) {
    const item = feuerzoneItems.find(i => i.id === itemId);
    if (!item) return;
    const correct = item.correctZone === zone;
    setPlacements(prev => ({ ...prev, [itemId]: zone }));
    setFeedback({ id: itemId, correct, explain: item.explain });
    setSelected(null);
  }

  function reset() {
    setPlacements({});
    setSelected(null);
    setFeedback(null);
  }

  const placedCount  = Object.keys(placements).length;
  const correctCount = feuerzoneItems.filter(i => placements[i.id] === i.correctZone).length;
  const allPlaced    = placedCount === feuerzoneItems.length;

  return (
    <div className="rounded-2xl p-6" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-[11px] font-sans tracking-[0.18em] uppercase mb-1" style={{ color }}>
            🎮 Feuerzonen-Spiel
          </div>
          <div className="font-serif text-lg font-bold text-text-primary mb-1">
            Wo gehört welches Fleisch hin?
          </div>
          <div className="text-[12px] font-sans" style={{ color: T.textMuted }}>
            Wähle ein Item, dann klick auf die richtige Zone.
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-sans uppercase tracking-wider" style={{ color: T.textDim }}>Stand</div>
          <div className="font-serif text-2xl font-bold" style={{ color: allPlaced && correctCount === feuerzoneItems.length ? T.success : color }}>
            {correctCount}/{feuerzoneItems.length}
          </div>
        </div>
      </div>

      {/* Grill SVG */}
      <div className="relative mb-4 rounded-xl overflow-hidden" style={{ background: '#1c1410', border: `1px solid ${T.borderMuted}` }}>
        <svg viewBox="0 0 400 280" className="w-full block" aria-label="Grill mit 4 Hitze-Zonen">
          <defs>
            <radialGradient id="sk-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#FF6B35" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sk-ember" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#FF7A1A" stopOpacity="0.6" />
              <stop offset="55%"  stopColor="#C2410C" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#C2410C" stopOpacity="0" />
            </radialGradient>
            <clipPath id="sk-bowl">
              <ellipse cx="200" cy="140" rx="170" ry="112" />
            </clipPath>
          </defs>
          {/* Grill body */}
          <ellipse cx="200" cy="140" rx="180" ry="120" fill="#0a0a0a" stroke={T.borderMuted} strokeWidth="2" />

          {/* Glut-Bett unter dem Rost */}
          <g clipPath="url(#sk-bowl)" style={{ pointerEvents: 'none' }}>
            <rect x="30" y="28" width="340" height="224" fill="#160f0a" />
            <ellipse cx="200" cy="140" rx="150" ry="100" fill="url(#sk-ember)" />
            {[[140,176,2.6,'#FF8A33'],[168,196,2,'#FFB066'],[205,165,2.3,'#FF7A1A'],
              [243,188,1.8,'#FFA050'],[120,150,1.8,'#E8531C'],[270,150,2.2,'#FF8A33'],
              [190,205,1.6,'#FFB066'],[225,118,2,'#FF7A1A']].map(([cx,cy,r,c],i) => (
              <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={c as string} opacity="0.7" />
            ))}
          </g>

          {/* 4 Zonen — füllen die Schale als Quadranten (klickbar) */}
          {(['direkte', 'indirekte', 'ruhe', 'abdeck'] as ZoneKey[]).map((zone, idx) => {
            const q = [
              { x: 28,  y: 26,  w: 172, h: 114 },  // direkte   (oben-links)
              { x: 200, y: 26,  w: 172, h: 114 },  // indirekte (oben-rechts)
              { x: 28,  y: 140, w: 172, h: 114 },  // ruhe      (unten-links)
              { x: 200, y: 140, w: 172, h: 114 },  // abdeck    (unten-rechts)
            ][idx];
            const baseOpacity = [0.34, 0.28, 0.22, 0.18][idx];
            const zm = zoneMeta[zone];
            return (
              <g key={zone}
                 clipPath="url(#sk-bowl)"
                 onClick={() => selected && place(selected, zone)}
                 style={{ cursor: selected ? 'pointer' : 'default' }}>
                <rect x={q.x} y={q.y} width={q.w} height={q.h}
                  fill={zm.color} fillOpacity={selected ? baseOpacity + 0.14 : baseOpacity} />
              </g>
            );
          })}

          {/* Trenn-Kreuz zwischen den Zonen */}
          <g clipPath="url(#sk-bowl)" style={{ pointerEvents: 'none' }}>
            <line x1="200" y1="28" x2="200" y2="252" stroke="#0d0906" strokeWidth="2.5" opacity="0.55" />
            <line x1="30" y1="140" x2="370" y2="140" stroke="#0d0906" strokeWidth="2.5" opacity="0.55" />
          </g>

          {/* Rost-Gitter ÜBER den Zonen (geschmiedete Eisenstäbe) */}
          <g clipPath="url(#sk-bowl)" style={{ pointerEvents: 'none' }}>
            {[44,72,100,128,156,184,212,240].map((y) => (
              <g key={y}>
                <line x1="32" y1={y} x2="368" y2={y} stroke="#241811" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
                <line x1="32" y1={y - 1.1} x2="368" y2={y - 1.1} stroke="#8a6940" strokeWidth="0.9" strokeLinecap="round" opacity="0.45" />
              </g>
            ))}
            {[120, 280].map((x) => (
              <line key={x} x1={x} y1="32" x2={x} y2="248" stroke="#1c130d" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
            ))}
          </g>

          {/* zentraler Glut-Glow */}
          <ellipse cx="200" cy="140" rx="170" ry="112" fill="url(#sk-glow)" opacity="0.3" style={{ pointerEvents: 'none' }} />

          {/* Labels + Temperatur + platzierte Items (über dem Rost) */}
          {(['direkte', 'indirekte', 'ruhe', 'abdeck'] as ZoneKey[]).map((zone, idx) => {
            const L = [
              { lx: 116, ly: 74,  ex: 92,  ey: 100 },  // direkte
              { lx: 284, ly: 74,  ex: 256, ey: 100 },  // indirekte
              { lx: 116, ly: 210, ex: 92,  ey: 158 },  // ruhe
              { lx: 284, ly: 210, ex: 256, ey: 158 },  // abdeck
            ][idx];
            const zm = zoneMeta[zone];
            const itemsInZone = feuerzoneItems.filter(i => placements[i.id] === zone);
            return (
              <g key={`${zone}-lbl`}
                 onClick={() => selected && place(selected, zone)}
                 style={{ cursor: selected ? 'pointer' : 'default' }}>
                <text x={L.lx} y={L.ly} textAnchor="middle" fontSize="9.5" fontWeight="700"
                  fill={zm.color} fontFamily="sans-serif"
                  style={{ paintOrder: 'stroke', stroke: '#0d0906', strokeWidth: 2.5 }}>
                  {zm.label.toUpperCase()}
                </text>
                <text x={L.lx} y={L.ly + 12} textAnchor="middle" fontSize="8"
                  fill="#d8c7a8" fontFamily="sans-serif"
                  style={{ paintOrder: 'stroke', stroke: '#0d0906', strokeWidth: 2.5 }}>
                  {zm.temp}
                </text>
                {itemsInZone.map((it, i) => (
                  <text key={it.id} x={L.ex + (i % 3) * 24} y={L.ey + Math.floor(i / 3) * 22} fontSize="18">
                    {it.emoji}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Items */}
      <div className="flex flex-wrap gap-2 mb-3">
        {feuerzoneItems.map(item => {
          const placed = placements[item.id];
          const isSelected = selected === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (placed) {
                  // Platziertes Item wieder aufnehmen → neu setzen
                  setPlacements(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                  setFeedback(null);
                  setSelected(item.id);
                  return;
                }
                setSelected(isSelected ? null : item.id);
              }}
              title={placed ? 'Klicken, um neu zu platzieren' : 'Item auswählen'}
              className="rounded-lg px-3 py-2 flex items-center gap-2 text-[13px] font-sans transition-[background-color,border-color,color]"
              style={{
                background: isSelected ? `${color}30` : (placed ? T.borderSubtle : T.panelAlt),
                border:     isSelected ? `1px solid ${color}` : `1px solid ${T.borderMuted}`,
                color:      placed ? T.textDim : T.text,
                opacity:    placed ? 0.7 : 1,
                cursor:     'pointer',
              }}
            >
              <span className="text-base">{item.emoji}</span>
              {item.label}
              {placed && <span className="text-[10px]" style={{ color: T.textDim }}>· platziert ↺</span>}
            </button>
          );
        })}
      </div>

      {/* Hinweis + Reset (jederzeit verfügbar) */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] font-sans" style={{ color: T.textDim }}>
          Falsch gelegt? Klick das Item erneut, um es zu verschieben.
        </span>
        {placedCount > 0 && !allPlaced && (
          <button onClick={reset} className="text-[11px] font-sans font-bold uppercase tracking-wider underline" style={{ color: T.textDim }}>
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className="rounded-lg p-3 text-[13px] font-sans mb-3"
          style={{
            background: feedback.correct ? T.successBg : T.errorBg,
            border:     `1px solid ${feedback.correct ? T.success : T.error}40`,
            color:      feedback.correct ? T.success : T.error,
          }}
        >
          {feedback.correct ? '✓ Richtig! ' : '✗ Nicht ganz. '}
          <span style={{ color: T.text }}>{feedback.explain}</span>
        </div>
      )}

      {/* Done */}
      {allPlaced && (
        <div className="flex items-center justify-between gap-3 rounded-xl p-3" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
          <div className="text-[13px] font-sans">
            {correctCount === feuerzoneItems.length
              ? `🎉 Alles korrekt! Jetzt das Quiz starten.`
              : `${correctCount}/${feuerzoneItems.length} richtig — kann besser, oder?`}
          </div>
          <button
            onClick={reset}
            className="rounded-md px-3 py-1.5 text-[11px] font-sans font-bold uppercase tracking-wider"
            style={{ background: T.panelAlt, color: T.text, border: `1px solid ${T.borderMuted}` }}
          >
            Neu starten
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT — Quiz
// ═══════════════════════════════════════════════════════════════════════════

function Quiz({
  moduleKey,
  lektionen,
  onComplete,
  onStreakHit,
  onStreakBreak,
}: {
  moduleKey: ModuleKey;
  lektionen: readonly LektionLink[];
  onComplete: (ergebnis: PruefungsErgebnis) => void;
  onStreakHit: () => void;
  onStreakBreak: () => void;
}) {
  const meta  = moduleMeta[moduleKey];
  const color = meta.color;

  // Ziehung kommt vom Server (Rahmenlehrplan §8, 08.09.2026): Fragen OHNE
  // Loesung plus signiertes Token. Der Browser sieht `correct` und `explain`
  // erst im Ergebnis — vorher lag die komplette Fragenbank im Bundle.
  const [laden, setLaden]         = useState<'laeuft' | 'fertig' | 'fehler'>('laeuft');
  const [ladeFehler, setLadeFehler] = useState('');
  const [questions, setQuestions] = useState<readonly QuizQuestion[]>([]);
  const [token, setToken]         = useState('');

  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState<number | null>(null);
  const [answers, setAnswers]     = useState<number[]>([]);
  const [finished, setFinished]   = useState(false);
  const [einreichen, setEinreichen] = useState<'idle' | 'laeuft' | 'fertig' | 'fehler'>('idle');
  const [ergebnis, setErgebnis]   = useState<PruefungsErgebnis | null>(null);
  const [fehlerText, setFehlerText] = useState<string>('');

  const lektionTitel = (slug: string) => lektionen.find((l) => l.lektionSlug === slug)?.title ?? 'Lektion';
  const lektionUrl   = (slug: string) => lektionen.find((l) => l.lektionSlug === slug)?.url ?? `/diplome/lernen/stufe-${meta.stage}/${slug}`;

  const ziehen = useCallback(async () => {
    setLaden('laeuft');
    setLadeFehler('');
    try {
      const res = await fetch('/api/diplome/pruefung/ziehung', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ modul: moduleKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data?.fragen) || typeof data?.token !== 'string') {
        setLadeFehler(typeof data?.error === 'string' ? data.error : 'Die Prüfung konnte nicht geladen werden.');
        setLaden('fehler');
        return;
      }
      setQuestions(data.fragen as QuizQuestion[]);
      setToken(data.token);
      setLaden('fertig');
    } catch {
      setLadeFehler('Keine Verbindung — die Prüfung konnte nicht geladen werden.');
      setLaden('fehler');
    }
  }, [moduleKey]);

  useEffect(() => { void ziehen(); }, [ziehen]);

  function choose(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
  }

  // Das Ergebnis stellt der Server fest — fuer genau die gezogenen Fragen
  // (Token). Der Browser zeigt nur an, was zurueckkommt.
  async function einreichenAnServer(antworten: number[]) {
    setEinreichen('laeuft');
    setFehlerText('');
    try {
      const res = await fetch('/api/diplome/pruefung', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ modul: moduleKey, token, antworten }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = typeof data?.error === 'string' ? data.error : '';
        setFehlerText(
          err === 'diplom_erforderlich'
            ? 'Diese Prüfung gehört zum Grillmeister-Diplom.'
            : err || 'Die Prüfung konnte nicht ausgewertet werden. Bitte später erneut versuchen.',
        );
        setEinreichen('fehler');
        return;
      }
      const e: PruefungsErgebnis = {
        score: Number(data.score) || 0,
        gesamt: Number(data.gesamt) || antworten.length,
        grenze: Number(data.grenze) || 0,
        bestanden: Boolean(data.bestanden),
        badge: typeof data.badge === 'string' ? data.badge : null,
        ergebnisse: Array.isArray(data.ergebnisse)
          ? (data.ergebnisse as PruefungsErgebnis['ergebnisse']).map((r) => ({
              id: String(r.id ?? ''),
              richtig: Boolean(r.richtig),
              explain: typeof r.explain === 'string' ? r.explain : '',
              lektionSlug: typeof r.lektionSlug === 'string' ? r.lektionSlug : '',
            }))
          : [],
        gespeichert: Boolean(data.gespeichert),
        hinweis: typeof data.hinweis === 'string' ? data.hinweis : undefined,
      };
      setErgebnis(e);
      setEinreichen('fertig');
      if (e.bestanden) onStreakHit(); else onStreakBreak();
      onComplete(e);
    } catch {
      setFehlerText('Keine Verbindung — die Prüfung wurde nicht ausgewertet.');
      setEinreichen('fehler');
    }
  }

  function next() {
    if (selected === null) return;
    const neu = [...answers, selected];
    setAnswers(neu);
    if (current + 1 >= questions.length) {
      setFinished(true);
      void einreichenAnServer(neu);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }

  function restart() {
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);
    setEinreichen('idle');
    setErgebnis(null);
    setFehlerText('');
    void ziehen(); // neue Ziehung — nicht dieselben zehn Fragen
  }

  if (laden === 'laeuft') {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: T.panel, border: `1px solid ${color}40` }}>
        <div className="text-4xl mb-3">🎲</div>
        <div className="font-serif text-xl font-bold text-text-primary mb-2">Prüfung wird gestellt …</div>
        <div className="text-sm font-sans" style={{ color: T.textMuted }}>Der Server zieht deine Fragen aus dem Pool.</div>
      </div>
    );
  }

  if (laden === 'fehler' || questions.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: T.panel, border: `1px solid ${T.error}40` }}>
        <div className="text-4xl mb-3">⚠️</div>
        <div className="font-serif text-xl font-bold text-text-primary mb-2">Prüfung nicht verfügbar</div>
        <p className="text-sm font-sans mb-5 max-w-md mx-auto" style={{ color: T.textMuted }}>{ladeFehler || 'Keine Fragen erhalten.'}</p>
        <button
          onClick={() => { void ziehen(); }}
          className="rounded-full px-5 py-2.5 font-sans font-bold text-[12px] tracking-wider uppercase"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: T.bg }}
        >
          Erneut laden
        </button>
      </div>
    );
  }

  if (finished) {
    if (einreichen === 'laeuft' || einreichen === 'idle') {
      return (
        <div className="rounded-2xl p-8 text-center" style={{ background: T.panel, border: `1px solid ${color}40` }}>
          <div className="text-4xl mb-3">⏳</div>
          <div className="font-serif text-xl font-bold text-text-primary mb-2">Prüfung wird ausgewertet …</div>
          <div className="text-sm font-sans" style={{ color: T.textMuted }}>{questions.length} Antworten abgegeben — der Server hat das letzte Wort.</div>
        </div>
      );
    }

    if (einreichen === 'fehler' || !ergebnis) {
      return (
        <div className="rounded-2xl p-8 text-center" style={{ background: T.panel, border: `1px solid ${T.error}40` }}>
          <div className="text-4xl mb-3">⚠️</div>
          <div className="font-serif text-xl font-bold text-text-primary mb-2">Nicht ausgewertet</div>
          <p className="text-sm font-sans mb-5 max-w-md mx-auto" style={{ color: T.textMuted }}>{fehlerText}</p>
          <button
            onClick={() => { void einreichenAnServer(answers); }}
            className="rounded-full px-5 py-2.5 font-sans font-bold text-[12px] tracking-wider uppercase mr-3"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: T.bg }}
          >
            Erneut senden
          </button>
          <button
            onClick={restart}
            className="rounded-full px-5 py-2.5 font-sans font-bold text-[12px] tracking-wider uppercase"
            style={{ background: T.panelAlt, color: T.text, border: `1px solid ${T.borderMuted}` }}
          >
            Von vorn
          </button>
        </div>
      );
    }

    const passed = ergebnis.bestanden;
    const falsch = ergebnis.ergebnisse
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r.richtig);

    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: T.panel, border: `1px solid ${color}40` }}>
        <div className="text-5xl mb-3">{passed ? '🏅' : '📚'}</div>
        <div className="font-serif text-2xl font-bold text-text-primary mb-2">
          {passed ? 'Modul bestanden!' : 'Noch nicht bestanden'}
        </div>
        <div className="text-sm font-sans mb-2" style={{ color: T.textMuted }}>
          {ergebnis.score} von {ergebnis.gesamt} richtig{passed ? '' : ` — du brauchst mindestens ${ergebnis.grenze}`}.
        </div>
        {ergebnis.hinweis && (
          <div className="text-[12px] font-sans mb-4" style={{ color: T.textDim }}>{ergebnis.hinweis}</div>
        )}

        {/* Nachlesen: jede falsche Frage zeigt Erklaerung und die Lektion, in der die Antwort steht (Audit R12). */}
        {falsch.length > 0 && (
          <div className="text-left rounded-xl p-4 mb-5" style={{ background: T.panelAlt, border: `1px solid ${T.borderMuted}` }}>
            <div className="text-[11px] font-sans uppercase tracking-wider mb-2" style={{ color }}>
              Nachlesen
            </div>
            <ul className="flex flex-col gap-2.5">
              {falsch.map(({ r, i }) => (
                <li key={r.id || i} className="text-[13px] font-sans" style={{ color: T.textMuted }}>
                  <div>
                    <span style={{ color: T.text }}>Frage {i + 1}</span>
                    {' · '}
                    <span>{questions[i]?.q}</span>
                  </div>
                  {r.explain && <div className="mt-0.5" style={{ color: T.textDim }}>💡 {r.explain}</div>}
                  {r.lektionSlug && (
                    <Link href={lektionUrl(r.lektionSlug)} className="underline hover:opacity-80" style={{ color }}>
                      → {lektionTitel(r.lektionSlug)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={restart}
            className="rounded-full px-5 py-2.5 font-sans font-bold text-[12px] tracking-wider uppercase"
            style={{
              background: passed ? T.panelAlt : `linear-gradient(135deg, ${color}, ${color}cc)`,
              color:      passed ? T.text : T.bg,
              border:     passed ? `1px solid ${T.borderMuted}` : 'none',
            }}
          >
            {passed ? 'Nochmal (neue Fragen)' : 'Erneut versuchen (neue Fragen)'}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="rounded-2xl p-6" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] font-sans uppercase tracking-wider" style={{ color }}>
          Frage {current + 1} / {questions.length}
        </div>
        <div className="flex gap-1">
          {questions.map((frage, i) => (
            <span
              key={frage.id}
              className="w-2 h-2 rounded-full"
              style={{ background: i < current ? color : i === current ? `${color}aa` : T.borderMuted }}
            />
          ))}
        </div>
      </div>

      <div className="font-serif text-lg font-bold text-text-primary mb-5">
        {q.q}
      </div>

      <div className="flex flex-col gap-2.5 mb-4">
        {q.options.map((opt, i) => {
          const isChosen = selected === i;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className="text-left rounded-lg px-4 py-3 text-[13px] font-sans transition-[background-color,border-color,color]"
              style={{
                background: isChosen ? `${color}22` : T.panelAlt,
                border:     `1px solid ${isChosen ? color : T.borderMuted}`,
                color:      isChosen ? color : T.text,
                cursor:     'pointer',
              }}
            >
              <span style={{ color: T.textDim, marginRight: '8px' }}>{String.fromCharCode(65 + i)}.</span>
              {opt}
              {isChosen && <span className="float-right">●</span>}
            </button>
          );
        })}
      </div>

      <div className="text-[11px] font-sans mb-3" style={{ color: T.textDim }}>
        Die Auswertung kommt am Ende — mit Erklärung zu jeder Frage, die nicht gestimmt hat.
      </div>

      {selected !== null && (
        <button
          onClick={next}
          className="w-full rounded-full px-5 py-2.5 font-sans font-bold text-[12px] tracking-wider uppercase"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: T.bg }}
        >
          {current + 1 >= questions.length ? 'Abgeben und Ergebnis sehen →' : 'Nächste Frage →'}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT — Flashcards (CSS-Flip, Gewusst/Nochmal)
// ═══════════════════════════════════════════════════════════════════════════

function Flashcards({ moduleKey }: { moduleKey: ModuleKey }) {
  const all   = flashcards[moduleKey];
  const color = moduleMeta[moduleKey].color;

  // Stapel verwaltet als Indexe (FIFO mit Re-Insertion)
  const [stack, setStack]     = useState<number[]>(() => all.map((_, i) => i));
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown]     = useState<number[]>([]);

  // localStorage-Persistenz für Fortschritt (separate Key pro Modul)
  const lsKey = `steakakademie_flashcards_${moduleKey}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(lsKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { known: number[] };
      if (Array.isArray(parsed.known)) {
        setKnown(parsed.known);
        setStack(all.map((_, i) => i).filter(i => !parsed.known.includes(i)));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey]);

  function persistKnown(next: number[]) {
    setKnown(next);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(lsKey, JSON.stringify({ known: next }));
    } catch {
      /* ignore */
    }
  }

  function markKnown() {
    const [head, ...rest] = stack;
    setStack(rest);
    setFlipped(false);
    if (head !== undefined && !known.includes(head)) {
      persistKnown([...known, head]);
    }
  }

  function markAgain() {
    const [head, ...rest] = stack;
    setStack([...rest, head!]);
    setFlipped(false);
  }

  function reset() {
    setStack(all.map((_, i) => i));
    setFlipped(false);
    persistKnown([]);
  }

  if (stack.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: T.panel, border: `1px solid ${color}40` }}>
        <div className="text-5xl mb-3">🎓</div>
        <div className="font-serif text-2xl font-bold text-text-primary mb-2">
          Alle {all.length} Karten gewusst!
        </div>
        <div className="text-sm font-sans mb-4" style={{ color: T.textMuted }}>
          Fortschritt gespeichert — du kannst neu starten oder zur Quiz wechseln.
        </div>
        <button
          onClick={reset}
          className="rounded-full px-5 py-2.5 font-sans font-bold text-[12px] tracking-wider uppercase"
          style={{ background: T.panelAlt, color: T.text, border: `1px solid ${T.borderMuted}` }}
        >
          Stapel zurücksetzen
        </button>
      </div>
    );
  }

  const currentIdx = stack[0];
  const card       = all[currentIdx];

  return (
    <div className="flex flex-col gap-4">

      {/* Progress */}
      <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-wider">
        <span style={{ color }}>Karte {known.length + 1} / {all.length}</span>
        <span style={{ color: T.textDim }}>Stapel: {stack.length}</span>
      </div>

      {/* Card */}
      <div
        className="w-full [perspective:1200px] cursor-pointer"
        style={{ minHeight: '240px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
          style={{
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '240px',
          }}
        >
          {/* Vorderseite */}
          <div
            className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center [backface-visibility:hidden]"
            style={{
              background: `linear-gradient(135deg, ${color}10 0%, ${T.panel} 70%)`,
              border:     `1px solid ${color}40`,
              boxShadow:  `0 8px 24px ${color}22`,
            }}
          >
            <div className="text-[11px] font-sans uppercase tracking-wider mb-3" style={{ color }}>
              Begriff
            </div>
            <div className="font-serif text-3xl font-bold text-text-primary text-center">
              {card.front}
            </div>
            <div className="text-[11px] font-sans mt-4" style={{ color: T.textDim }}>
              Klicken zum Umdrehen
            </div>
          </div>

          {/* Rückseite */}
          <div
            className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={{
              background: `linear-gradient(135deg, ${color}25 0%, ${T.panel} 70%)`,
              border:     `1px solid ${color}60`,
              boxShadow:  `0 8px 24px ${color}33`,
            }}
          >
            <div className="text-[11px] font-sans uppercase tracking-wider mb-3" style={{ color }}>
              Erklärung
            </div>
            <div className="font-serif text-lg text-text-primary text-center leading-relaxed">
              {card.back}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={markAgain}
          className="flex-1 rounded-lg px-4 py-3 font-sans font-bold text-[12px] tracking-wider uppercase"
          style={{ background: T.panelAlt, color: T.text, border: `1px solid ${T.borderMuted}` }}
        >
          ↻ Nochmal
        </button>
        <button
          onClick={markKnown}
          className="flex-1 rounded-lg px-4 py-3 font-sans font-bold text-[12px] tracking-wider uppercase"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: T.bg }}
        >
          ✓ Gewusst
        </button>
      </div>

      {known.length > 0 && (
        <button
          onClick={reset}
          className="text-[10px] font-sans uppercase tracking-wider self-center"
          style={{ color: T.textDim }}
        >
          Stapel zurücksetzen
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT — ExpandSection (Roadmap)
// ═══════════════════════════════════════════════════════════════════════════

function ExpandSection({
  expanded,
  onToggle,
  icon,
  title,
  subtitle,
  color,
  children,
}: {
  expanded: boolean;
  onToggle: () => void;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-colors"
      style={{
        background: T.panel,
        border:     expanded ? `1px solid ${color}60` : `1px solid ${T.border}`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex justify-between items-center cursor-pointer text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl" aria-hidden>{icon}</span>
          <div>
            <div className="text-[13px] font-sans font-semibold text-text-primary">
              {title}
            </div>
            <div className="text-[11px] font-sans text-text-muted">
              {subtitle}
            </div>
          </div>
        </div>
        <span
          className="text-lg transition-transform inline-block"
          style={{ color, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t" style={{ borderTopColor: T.borderSubtle }}>
          {children}
        </div>
      )}
    </div>
  );
}
