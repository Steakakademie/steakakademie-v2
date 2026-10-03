'use client';

/**
 * RecipeExplorer — Rezept-Übersicht nach Texas-Monthly-Muster.
 *
 * Aufbau (Referenz: texasmonthly.com/recipes):
 *  0. Optionaler TM-Hero (prop `hero`): Vollbild-Foto, zentrierter Serif-Titel,
 *     Suchfeld mittig ÜBER dem Bild — wie texasmonthly.com/recipes.
 *  1. Horizontale Register-Leiste, mittig zentriert, Kanten weich ausgeblendet
 *     (Kategorien = echte Links → SEO; Zubereitungs-Register = Client-Filter
 *     über das Freitext-Feld `cookingMethod`)
 *  2. Zweite, kleinere Länder-Reihe (Client-Filter über das Frontmatter-Feld `land`)
 *  3. Suchfeld (nur ohne Hero — mit Hero sitzt die Suche im Hero)
 *  4. 3-Spalten-Grid im hellen Editorial-Look (keine Karten-Boxen, wie TM)
 *  5. Newsletter-Lead-Magnet MITTEN im Feed (nach 6 Karten, Seite 1)
 *  6. Nummerierte Pagination
 *
 * Läuft auf hellem Pergament-Grund (.reading-light) — alle Farben hier sind
 * bewusst als Hex gesetzt und auf AA-Kontrast gegen #DCC59C/#D1B785 geprüft.
 */

import { Fragment, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Clock, Flame, Search, Users, X } from 'lucide-react';
import NewsletterSignup from '@/components/ui/NewsletterSignup';

// ── Daten-Shape (vom Server vorbereitet, bewusst schlank) ───────────────────

export interface RecipeCardData {
  slug: string;
  url: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  difficulty: string;
  /** bereits formatiert, z. B. "2 Std. 30 Min." */
  totalTime: string;
  servings: number;
  calories?: number;
  kategorie: string;
  meatType: string;
  cookingMethod: string;
  land?: string;
}

interface Props {
  recipes: RecipeCardData[];
  /** aktiver Kategorie-Slug (auf /rezepte/[slug]); undefined = "Alle Rezepte" */
  activeKategorie?: string;
  /** Kategorie-Leiste ausblenden (z. B. Community-Seite) */
  hideKategorieRow?: boolean;
  /** TM-Hero: Foto hinter zentriertem Titel + Suchfeld (nur /rezepte-Übersicht) */
  hero?: { image: string; imageAlt?: string; title: string; subtitle?: string };
}

// ── Kategorie-Leiste (Navigation, wie das TM-Menü) ──────────────────────────

const KATEGORIE_TABS: { slug: string | null; label: string }[] = [
  { slug: null,           label: 'Alle Rezepte' },
  { slug: 'fleisch',      label: 'Fleisch' },
  { slug: 'fisch',        label: 'Fisch & Meer' },
  { slug: 'beilagen',     label: 'Beilagen' },
  { slug: 'saucen-rubs',  label: 'Saucen & Rubs' },
  { slug: 'desserts',     label: 'Desserts' },
  { slug: 'wine-spirits', label: 'Wine & Spirits' },
];

// Zubereitungs-Register (Client-Filter): matchen gegen das Freitext-Feld
// `cookingMethod` der Rezepte (Schreibweisen dort variieren, daher Muster).
const METHODEN_TABS: { key: string; label: string; pattern: RegExp }[] = [
  { key: 'wok-dutch-oven', label: 'Wok/Dutch Oven',      pattern: /dutch\s*oven|wok|topf|geschmort|einkochen/i },
  { key: 'spiess',         label: 'Am Spieß',            pattern: /spie(ss|ß)|rotisserie/i },
  { key: 'plancha',        label: 'Grillplatte/Plancha', pattern: /plancha|grillplatte|platte/i },
  { key: 'pizzastein',     label: 'Pizzastein',          pattern: /pizzastein/i },
  { key: 'raeuchern',      label: 'Räuchern',            pattern: /smoker|rauch|r(ä|ae)ucher|3-2-1|low\s*(and|&)\s*slow/i },
  { key: 'grillkorb',      label: 'Grillkorb',           pattern: /grillkorb|fischzange|grillpfanne/i },
  { key: 'elektrogrill',   label: 'Elektrogrill',        pattern: /elektro|tischgrill|kontaktgrill/i },
];

const PAGE_SIZE = 12;

// Weiches Ausblenden der Register-/Länder-Reihen zu den Rändern hin (TM-Look).
const EDGE_FADE = 'linear-gradient(to right, transparent 0, black 28px, black calc(100% - 28px), transparent 100%)';

/** "USA · Texas" → "USA" — Primärland fürs Filter-Pill. */
function primaryLand(land?: string): string | null {
  if (!land) return null;
  return land.split('·')[0].trim() || null;
}

// Schwierigkeit auf dunklem Foto-Chip (unverändert zur Marken-DNA)
const DIFFICULTY_STYLE: Record<string, string> = {
  Einfach:         'text-emerald-400',
  Mittel:          'text-brand-gold',
  Fortgeschritten: 'text-brand-fire',
  Profi:           'text-red-400',
};

// ── Farb-Töne der hellen Zone ───────────────────────────────────────────────
const INK      = '#241A12'; // Titel
const RUST     = '#9C3A0E'; // Kicker/Akzent (TM-Rot, markenwarm)
const RUST_TEXT = '#7E2B08'; // RUST als Fliesstext/Label: 4.84:1 auf #D1B785 (AA)
                            // RUST bleibt fuer Flaechen/Borders/Icons (6.03:1 bzw. >3:1)
const BODY     = '#4A3C2E'; // Fließtext
const MUTED    = '#5A4936'; // Meta
const LINE     = '#C3AB80'; // Linien/Borders

export default function RecipeExplorer({ recipes, activeKategorie, hideKategorieRow, hero }: Props) {
  const [land, setLand] = useState<string>('alle');
  const [methode, setMethode] = useState<string>('alle');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const landRowRef = useRef<HTMLDivElement>(null);
  const registerRowRef = useRef<HTMLDivElement>(null);

  const activeMethode = METHODEN_TABS.find((m) => m.key === methode);

  // Länder mit Häufigkeit, absteigend — nur zeigen, wenn es mind. 2 gibt.
  const laender = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of recipes) {
      const p = primaryLand(r.land);
      if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    // Array.from statt Spread: das tsconfig-Target liegt unter ES2015, dort laesst
    // sich ein Map-Iterator nicht spreaden (TS2802).
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      if (land !== 'alle' && primaryLand(r.land) !== land) return false;
      if (activeMethode && !activeMethode.pattern.test(`${r.cookingMethod} ${r.title}`)) return false;
      if (q) {
        const hay = `${r.title} ${r.description} ${r.meatType} ${r.cookingMethod} ${r.land ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [recipes, land, query, activeMethode]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetPage() { setPage(1); }

  function goToPage(p: number) {
    setPage(p);
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollLandRow(dir: -1 | 1) {
    landRowRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  }

  function scrollRegisterRow(dir: -1 | 1) {
    registerRowRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  }

  // Newsletter nach der 6. Karte — nur Seite 1 und nur wenn genug Inhalt da ist.
  const newsletterAfter = safePage === 1 && visible.length > 6 ? 6 : -1;

  return (
    <div>
      {/* ══ TM-HERO — Foto, zentrierter Titel, Suche über dem Bild ════════ */}
      {hero && (
        <section className="relative">
          <div className="relative h-[400px] sm:h-[480px]">
            <Image
              src={hero.image}
              alt={hero.imageAlt ?? ''}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            {/* Abdunkelung für Lesbarkeit von Titel + Suchfeld */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, rgba(14,9,4,0.55) 0%, rgba(14,9,4,0.32) 45%, rgba(14,9,4,0.55) 100%)' }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <span className="font-sans text-[11px] font-bold tracking-[0.22em] uppercase text-white/85 mb-3">
                Steakakademie
              </span>
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-none mb-4">
                {hero.title}
              </h1>
              {hero.subtitle && (
                <p className="font-body text-base sm:text-lg text-white/90 max-w-2xl mb-8">
                  {hero.subtitle}
                </p>
              )}
              {/* Suche — mittig über dem Bild, wie bei Texas Monthly */}
              <form role="search" onSubmit={(e) => e.preventDefault()} className="w-full max-w-2xl flex shadow-lg">
                <div className="relative flex-1">
                  <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); resetPage(); }}
                    placeholder="Rezepte der Steakakademie durchsuchen …"
                    aria-label="Rezepte durchsuchen"
                    className="w-full font-body text-[15px] pl-11 pr-4 py-3.5 bg-white/95"
                    style={{ color: INK }}
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 sm:px-9 font-sans text-xs font-bold tracking-[0.16em] uppercase text-white transition-opacity hover:opacity-90"
                  style={{ background: RUST }}
                >
                  Suchen
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* ══ FILTER-LEISTE (Texas-Monthly-Muster) ══════════════════════════ */}
      <div className="border-b" style={{ borderColor: LINE }}>
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-5">

          {/* Reihe 1 — Register: Kategorien (Links) + Zubereitung (Filter),
              mittig zentriert, Kanten weich ausblendend (TM-Muster) */}
          {!hideKategorieRow && (
            <nav aria-label="Rezept-Register" className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => scrollRegisterRow(-1)}
                aria-label="Register nach links scrollen"
                className="hidden sm:flex shrink-0 w-7 h-7 items-center justify-center border transition-colors hover:bg-black/5"
                style={{ borderColor: LINE, color: MUTED }}
              >
                <ChevronLeft size={14} />
              </button>

              <div
                ref={registerRowRef}
                className="flex-1 overflow-x-auto scrollbar-none"
                style={{ scrollbarWidth: 'none', WebkitMaskImage: EDGE_FADE, maskImage: EDGE_FADE }}
              >
                <div className="flex w-max mx-auto gap-2 px-6">
                  {KATEGORIE_TABS.map((tab) => {
                    const active = (tab.slug ?? undefined) === activeKategorie;
                    return (
                      <Link
                        key={tab.label}
                        href={tab.slug ? `/rezepte/${tab.slug}` : '/rezepte'}
                        aria-current={active ? 'page' : undefined}
                        className="shrink-0 whitespace-nowrap font-sans text-[11px] font-bold tracking-[0.14em] uppercase px-4 py-2 border transition-colors"
                        style={active
                          ? { background: INK, color: '#F0E8D8', borderColor: INK }
                          : { color: BODY, borderColor: LINE }}
                      >
                        {tab.label}
                      </Link>
                    );
                  })}

                  {/* Trenner zwischen Kategorien und Zubereitungs-Registern */}
                  <span aria-hidden className="self-stretch w-px shrink-0 mx-1" style={{ background: LINE }} />

                  {METHODEN_TABS.map((m) => {
                    const active = methode === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => { setMethode(active ? 'alle' : m.key); resetPage(); }}
                        aria-pressed={active}
                        className="shrink-0 whitespace-nowrap font-sans text-[11px] font-bold tracking-[0.14em] uppercase px-4 py-2 border transition-colors"
                        style={active
                          ? { background: RUST, color: '#F7EEDD', borderColor: RUST }
                          : { color: BODY, borderColor: LINE }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => scrollRegisterRow(1)}
                aria-label="Register nach rechts scrollen"
                className="hidden sm:flex shrink-0 w-7 h-7 items-center justify-center border transition-colors hover:bg-black/5"
                style={{ borderColor: LINE, color: MUTED }}
              >
                <ChevronRight size={14} />
              </button>
            </nav>
          )}

          {/* Reihe 2 — Länder (Client-Filter) mit Scroll-Pfeilen wie bei TM */}
          {laender.length >= 2 && (
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => scrollLandRow(-1)}
                aria-label="Länder nach links scrollen"
                className="hidden sm:flex shrink-0 w-7 h-7 items-center justify-center border transition-colors hover:bg-black/5"
                style={{ borderColor: LINE, color: MUTED }}
              >
                <ChevronLeft size={14} />
              </button>

              <div
                ref={landRowRef}
                className="flex gap-2 overflow-x-auto scrollbar-none flex-1"
                style={{ scrollbarWidth: 'none', WebkitMaskImage: EDGE_FADE, maskImage: EDGE_FADE }}
              >
                <span aria-hidden className="shrink-0 mr-auto" />
                <button
                  type="button"
                  onClick={() => { setLand('alle'); resetPage(); }}
                  className="shrink-0 font-sans text-[10px] font-bold tracking-[0.12em] uppercase px-3 py-1.5 border transition-colors"
                  style={land === 'alle'
                    ? { background: RUST, color: '#F7EEDD', borderColor: RUST }
                    : { color: MUTED, borderColor: LINE }}
                >
                  Alle Länder
                </button>
                {laender.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => { setLand(l); resetPage(); }}
                    className="shrink-0 font-sans text-[10px] font-bold tracking-[0.12em] uppercase px-3 py-1.5 border transition-colors"
                    style={land === l
                      ? { background: RUST, color: '#F7EEDD', borderColor: RUST }
                      : { color: MUTED, borderColor: LINE }}
                  >
                    {l}
                  </button>
                ))}
                <span aria-hidden className="shrink-0 ml-auto" />
              </div>

              <button
                type="button"
                onClick={() => scrollLandRow(1)}
                aria-label="Länder nach rechts scrollen"
                className="hidden sm:flex shrink-0 w-7 h-7 items-center justify-center border transition-colors hover:bg-black/5"
                style={{ borderColor: LINE, color: MUTED }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Reihe 3 — Suche (nur ohne Hero — mit Hero sitzt die Suche dort) */}
          {!hero && (
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); resetPage(); }}
              placeholder="Rezept, Cut oder Methode suchen …"
              aria-label="Rezepte durchsuchen"
              className="w-full font-body text-sm pl-9 pr-9 py-2.5 border bg-transparent transition-colors"
              style={{ borderColor: LINE, color: INK }}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); resetPage(); }}
                aria-label="Suche zurücksetzen"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                style={{ color: MUTED }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          )}

          {/* Ergebnis-Zeile */}
          <p className="font-sans text-xs mt-3 text-center" style={{ color: MUTED }} aria-live="polite">
            {filtered.length === recipes.length
              ? `${recipes.length} Rezepte`
              : `${filtered.length} von ${recipes.length} Rezepten`}
            {land !== 'alle' && ` · ${land}`}
            {activeMethode && ` · ${activeMethode.label}`}
            {hero && query.trim() && ` · Suche: „${query.trim()}"`}
          </p>
        </div>
      </div>

      {/* ══ GRID ══════════════════════════════════════════════════════════ */}
      <div ref={gridTopRef} className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24">
        {visible.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-2xl mb-2" style={{ color: INK }}>Kein Treffer.</p>
            <p className="font-body text-sm mb-6" style={{ color: BODY }}>
              Kombination aus Land und Suchbegriff liefert nichts — Filter lockern?
            </p>
            <button
              type="button"
              onClick={() => { setLand('alle'); setMethode('alle'); setQuery(''); resetPage(); }}
              className="font-sans text-xs font-bold tracking-[0.12em] uppercase px-5 py-2.5 border transition-colors"
              style={{ borderColor: RUST_TEXT, color: RUST_TEXT }}
            >
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
            {visible.map((recipe, i) => (
              <Fragment key={recipe.slug}>
                <article className="group flex flex-col">
                  <Link href={recipe.url} className="flex flex-col">
                    {/* Bild — TM-Look: randlos, dezenter Rahmen */}
                    <div className="relative aspect-[16/10] overflow-hidden mb-4" style={{ background: '#CFB98C' }}>
                      <Image
                        src={recipe.image}
                        alt={recipe.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <span className={`absolute top-3 right-3 text-[10px] font-sans font-bold tracking-[0.12em] uppercase px-2 py-1 bg-surface-dark/90 backdrop-blur-sm ${DIFFICULTY_STYLE[recipe.difficulty] ?? 'text-brand-gold'}`}>
                        {recipe.difficulty}
                      </span>
                    </div>

                    {/* Kicker — Land · Kategorie-Detail (TM: roter Tag) */}
                    <span className="font-sans text-[10px] font-bold tracking-[0.16em] uppercase mb-2" style={{ color: RUST_TEXT }}>
                      {primaryLand(recipe.land) ?? recipe.meatType} · {recipe.cookingMethod}
                    </span>

                    {/* Titel — große Serif wie TM */}
                    <h2
                      className="font-serif text-[22px] font-bold leading-snug mb-2 transition-colors group-hover:underline underline-offset-4 decoration-2"
                      style={{ color: INK, textDecorationColor: RUST }}
                    >
                      {recipe.title}
                    </h2>

                    {/* Teaser — 1-2 Zeilen, kein Langtext */}
                    <p className="font-body text-[15px] leading-relaxed line-clamp-2 mb-3" style={{ color: BODY }}>
                      {recipe.description}
                    </p>
                  </Link>

                  {/* Meta-Zeile */}
                  <div className="flex items-center gap-4 font-sans text-[11px] mt-auto" style={{ color: MUTED }}>
                    <span className="flex items-center gap-1"><Clock size={11} />{recipe.totalTime}</span>
                    <span className="flex items-center gap-1"><Users size={11} />{recipe.servings} Port.</span>
                    {recipe.calories && (
                      <span className="flex items-center gap-1"><Flame size={11} style={{ color: RUST }} />{recipe.calories} kcal</span>
                    )}
                  </div>
                </article>

                {/* Newsletter-Lead-Magnet mitten im Feed (TM-Muster) */}
                {i === newsletterAfter - 1 && (
                  <div className="col-span-full my-2">
                    <NewsletterSignup source="rezepte-feed" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        )}

        {/* ══ PAGINATION (nummeriert, TM-Muster) ══════════════════════════ */}
        {pageCount > 1 && (
          <nav aria-label="Seiten" className="flex items-center justify-center gap-2 mt-14">
            <button
              type="button"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              aria-label="Vorherige Seite"
              className="w-9 h-9 flex items-center justify-center border transition-colors disabled:opacity-35"
              style={{ borderColor: LINE, color: BODY }}
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => goToPage(p)}
                aria-current={p === safePage ? 'page' : undefined}
                className="w-9 h-9 font-sans text-xs font-bold border transition-colors"
                style={p === safePage
                  ? { background: INK, color: '#F0E8D8', borderColor: INK }
                  : { color: BODY, borderColor: LINE }}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === pageCount}
              aria-label="Nächste Seite"
              className="w-9 h-9 flex items-center justify-center border transition-colors disabled:opacity-35"
              style={{ borderColor: LINE, color: BODY }}
            >
              <ChevronRight size={15} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
