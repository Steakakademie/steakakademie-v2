import { useMDXComponent } from 'next-contentlayer2/hooks';
import Image from 'next/image';
import Link from 'next/link';
import AutorHinweis from '@/components/AutorHinweis';
import { Clock, Flame, Users, Calendar, ChevronRight, Zap, Timer, Sparkles } from 'lucide-react';
import PortionCalculator from './recipe/PortionCalculator';
import AromaPairing from './recipe/AromaPairing';
import CookCoach from './recipe/CookCoach';
import CutBestellen from './recipe/CutBestellen';
import BBQPairing from './article/BBQPairing';
import ProductCard from './affiliate/ProductCard';
import type { Product } from '@/types';
import { authorSchemaRef } from '@/lib/schema';
import type { RecipeIngredient } from './recipe/PortionCalculator';
import type { RecipeStep } from './recipe/CookCoach';
import RecipeSubmitModal from './recipe/RecipeSubmitModal';
import HofladenHinweis from './hoefe/HofladenHinweis';
import Angebotshinweis from '@/components/angebote/Angebotshinweis';
import AngebotsRegal from '@/components/angebote/AngebotsRegal';
import { hinweiseFuer } from '@/lib/angebote/register';

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

// Schema.org recipeCategory aus dem Frontmatter-Feld `kategorie` ableiten
const RECIPE_CATEGORY: Record<string, string> = {
  beilagen: 'Beilage',
  desserts: 'Dessert',
  'saucen-rubs': 'Sauce',
};

function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  let h   = parseInt(m[1] || '0');
  let min = parseInt(m[2] || '0');
  // Minuten-only-Dauern normalisieren (identisch zu src/lib/rezept/card-data.ts —
  // die Funktion liegt doppelt vor; beide Stellen muessen gleich bleiben).
  if (min >= 60) { h += Math.floor(min / 60); min = min % 60; }
  if (h && min) return `${h} Std. ${min} Min.`;
  if (h) return `${h} Std.`;
  return `${min} Min.`;
}

const DIFFICULTY_STYLE: Record<string, string> = {
  Einfach:       'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  Mittel:        'text-brand-gold  border-brand-gold/30  bg-brand-gold/5',
  Fortgeschritten:'text-brand-fire border-brand-fire/30  bg-brand-fire/5',
  Profi:         'text-red-400     border-red-500/30     bg-red-500/5',
};

// ── MDX-Komponenten ───────────────────────────────────────────────────────────

const mdxComponents = {
  h2: ({ children, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary mt-10 mb-4 leading-tight border-b border-border-subtle pb-3" {...p}>
      {children}
    </h2>
  ),
  h3: ({ children, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-serif text-xl font-bold text-text-primary mt-8 mb-3" {...p}>{children}</h3>
  ),
  p: ({ children, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="font-body text-[1.0625rem] leading-[1.8] text-text-primary mb-5" {...p}>{children}</p>
  ),
  ul: ({ children, ...p }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem]" {...p}>{children}</ul>
  ),
  ol: ({ children, ...p }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-outside ml-5 space-y-2 mb-5 font-body text-[1.0625rem]" {...p}>{children}</ol>
  ),
  blockquote: ({ children, ...p }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-brand-gold pl-5 my-6 font-body text-lg italic text-text-secondary" {...p}>
      {children}
    </blockquote>
  ),
  strong: ({ children, ...p }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-text-primary" {...p}>{children}</strong>
  ),
  hr: () => <hr className="border-border-subtle my-10" />,
  // Bilder im Fliesstext (Schrittbilder). Der `title` des Markdown-Bildes wird
  // zur Bildunterschrift: ![Alt](/pfad.jpg "Unterschrift").
  //
  // ACHTUNG Kennzeichnung: Das Hero-Badge leitet "KI-Symbolbild" aus
  // recipe.imageAI ab — fuer Bilder HIER greift das nicht. Wer ein KI-Bild in
  // den Fliesstext setzt, muss die Kennzeichnung selbst in die Unterschrift
  // schreiben (Art. 50 KI-VO, siehe compliance/ai-act-einstufung.md).
  img: ({ src, alt, title }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <figure className="my-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ''}
        loading="lazy"
        className="w-full border border-border-subtle"
      />
      {title && (
        <figcaption className="mt-2 font-sans text-xs leading-relaxed text-text-muted">
          {title}
        </figcaption>
      )}
    </figure>
  ),
};

// ── Typen ─────────────────────────────────────────────────────────────────────

interface RecipeTemplateProps {
  recipe: any; // Contentlayer-generierter Typ (nach Build verfügbar)
  hardwareProducts: Product[];
}

// ── Komponente ────────────────────────────────────────────────────────────────

export default function RecipeTemplate({ recipe, hardwareProducts }: RecipeTemplateProps) {
  const MDXContent  = useMDXComponent(recipe.body.code);

  // Eigene Angebote, die zu diesem Rezept passen (data/angebote.yaml).
  const angebote = hinweiseFuer({
    typ: 'rezept',
    slug: recipe.slug ?? recipe._raw?.flattenedPath ?? recipe.title,
    felder: { kategorie: recipe.kategorie, difficulty: recipe.difficulty, meatType: recipe.meatType },
  });
  const ingredients = recipe.ingredients as RecipeIngredient[];
  const steps       = recipe.steps       as RecipeStep[];
  const hasPairing  = !!(recipe.whiskeyName && recipe.wineName);

  // ── Schema.org/Recipe LD+JSON ──────────────────────────────────────────────
  const recipeSchema = {
    '@context': 'https://schema.org',
    '@type':    'Recipe',
    name:        recipe.title,
    description: recipe.description,
    image:       recipe.image.startsWith('http') ? recipe.image : `https://steakakademie.de${recipe.image}`,
    author:      authorSchemaRef(recipe.authorSlug),
    datePublished: recipe.publishedAt,
    ...(recipe.updatedAt && { dateModified: recipe.updatedAt }),
    prepTime:    recipe.prepTime,
    cookTime:    recipe.cookTime,
    totalTime:   recipe.totalTime,
    recipeYield: `${recipe.servings} Portionen`,
    recipeCategory: RECIPE_CATEGORY[recipe.kategorie as string] ?? 'Hauptgericht',
    recipeCuisine:  recipe.land || 'BBQ',
    keywords:       recipe.keywords?.join(', '),
    recipeIngredient: ingredients.map((i) =>
      ['Prise', 'n.B.', 'etwas'].includes(i.unit)
        ? i.name
        : `${i.amount} ${i.unit} ${i.name}${i.note ? ` (${i.note})` : ''}`
    ),
    recipeInstructions: steps.map((s, idx) => ({
      '@type':    'HowToStep',
      position:   idx + 1,
      name:       s.title,
      text:       s.description,
    })),
    ...(recipe.calories && {
      nutrition: {
        '@type':   'NutritionInformation',
        calories:  `${recipe.calories} kcal`,
      },
    }),
  };

  const difficultyClass =
    DIFFICULTY_STYLE[recipe.difficulty as string] ?? DIFFICULTY_STYLE['Mittel'];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeSchema) }}
      />

      {/* ── Hero ── */}
      <div className="hero-fullbleed" style={{ height: '65vh', minHeight: '480px' }}>
        {/* Der Alt-Text folgt derselben Bedingung wie das Badge unten rechts:
            Wer die Seite sieht, liest die Kennzeichnung — wer sie sich vorlesen
            lässt, muss dasselbe hören. Sonst ist die Kennzeichnung für
            Screenreader-Nutzer schwächer als für Sehende.

            Bitte beim Bearbeiten mitnehmen: Diese Bedingung ging am 19.08.2026
            beim Überschreiben der Datei schon einmal verloren, während das
            Badge darunter bedingt blieb. */}
        <Image
          src={recipe.heroImage || recipe.image}
          alt={`${recipe.imageAlt} — ${recipe.imageAI ? 'KI-generiertes Symbolbild' : 'Symbolbild'}`}
          fill
          priority
          sizes="100vw"
          className="object-cover hero-fullbleed-image"
        />
        <div className="hero-fullbleed-overlay" />

        {/* Bildhinweis nach § 5 UWG: Das Bild darf nicht suggerieren, so sehe das
            nachgekochte Gericht aus. „Symbolbild" ist die etablierte deutsche Formel
            dafuer und trifft den rechtlichen Kern ohne Warnhinweis-Ton.

            Bewusst unbedingt gerendert und bewusst ohne das Wort „KI": „Symbolbild"
            stimmt fuer Echtfotos wie fuer generierte Bilder, deshalb braucht der
            Hinweis keine Fallunterscheidung. Die KI-Herkunft steht zentral unter
            /ki-disclaimer statt wiederholt auf ~115 Seiten.

            EU AI Act Art. 50 verlangt hier nichts: Abs. 2 adressiert den Anbieter
            des KI-Systems, Abs. 4 den Betreiber nur bei Deepfakes — ein generisches
            Gericht ist keiner. Analyse: docs/bildprogramm.md.

            Update 19.08.2026 (KAN-66): Fachliche Auswertung (e-recht24 zu Art. 50
            KI-VO) — "Ein pauschaler Disclaimer reicht nicht", die Kennzeichnung
            muss am Inhalt selbst eindeutig sein. Fotorealistische KI-Food-Bilder
            liegen in der Grauzone der Deepfake-Definition; sichere Linie:
            bei imageAI wird "KI-Symbolbild" gerendert, bei Echtfotos "Symbolbild".
            Der Link auf /ki-disclaimer bleibt fuer die Erklaertiefe. */}
        <Link
          href="/ki-disclaimer"
          className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.1em] uppercase px-2 py-1 bg-black/65 backdrop-blur-sm border border-white/15 text-zinc-200 hover:text-white hover:border-white/30 transition-colors"
        >
          <Sparkles size={10} /> {recipe.imageAI ? 'KI-Symbolbild' : 'Symbolbild'}
        </Link>

        <div className="hero-fullbleed-content">
          {/* Breadcrumb */}
          <div className="absolute top-0 left-0 right-0">
            <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6">
              <nav
                className="flex items-center gap-1.5 text-xs font-sans text-text-light/40"
                aria-label="Breadcrumb"
              >
                <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
                <ChevronRight size={12} />
                <Link href="/rezepte" className="hover:text-brand-gold transition-colors">Rezepte</Link>
                <ChevronRight size={12} />
                <span className="text-text-light/60">{recipe.meatType}</span>
              </nav>
            </div>
          </div>

          {/* Titel-Block */}
          <div className="max-w-editorial mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 lg:pb-16">
            <span className="category-label mb-3 block">
              Rezept · {recipe.meatType}{recipe.land ? ` · Herkunft: ${recipe.land}` : ''}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-text-light leading-[1.1] mb-4 max-w-3xl">
              {recipe.title}
            </h1>
            <p className="font-body text-lg text-text-light/60 leading-relaxed mb-5 max-w-2xl">
              {recipe.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-text-light/40">
              <Link
                href={`/autoren/${recipe.authorSlug}`}
                className="hover:text-brand-gold transition-colors"
              >
                {recipe.author}
              </Link>
              <span className="text-brand-gold/30">·</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {recipe.formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Meta-Leiste ── */}
      <div className="border-b border-border-subtle bg-surface-dark">
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-sans">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-text-muted shrink-0" />
              <span className="text-text-muted">Vorbereitung:</span>
              <span className="font-bold text-text-secondary">{parseDuration(recipe.prepTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-brand-fire shrink-0" />
              <span className="text-text-muted">Zubereitung:</span>
              <span className="font-bold text-text-secondary">{parseDuration(recipe.cookTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-brand-gold shrink-0" />
              <span className="text-text-muted">Gesamt:</span>
              <span className="font-bold text-brand-gold">{parseDuration(recipe.totalTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-text-muted shrink-0" />
              <span className="font-bold text-text-secondary">{recipe.servings} Portionen</span>
            </div>
            {recipe.calories && (
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-text-muted shrink-0" />
                <span className="text-text-muted">ca.</span>
                <span className="font-bold text-text-secondary">{recipe.calories}&thinsp;kcal</span>
              </div>
            )}
            <span className={`text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 border ${difficultyClass}`}>
              {recipe.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* ── Haupt-Layout: Content + Sidebar ── */}
      <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">

          {/* ── Main Content ── */}
          <div>
            {/* Interaktiver Zutaten-Rechner */}
            <PortionCalculator
              basePortions={recipe.servings}
              ingredients={ingredients}
            />

            {/* Cut → Premium-Fleisch bestellen (Otto Gourmet / Albers) */}
            <CutBestellen cut={recipe.meatType} kategorie={recipe.kategorie} />

            {/* Hofladen-Radar: regionale Direktvermarkter (kein Affiliate, keine Kennzeichnung noetig) */}
            {recipe.kategorie === 'fleisch' && <HofladenHinweis cut={recipe.meatType} variante="inline" />}

            {/* MDX-Artikel (Einleitung, Wissenschaft, Tipps) */}
            <article className="max-w-content">
              <MDXContent components={mdxComponents} />
            </article>

            {/* Interaktiver Koch-Coach */}
            <CookCoach steps={steps} />

            {/* Eigenes Angebot — der eine Hinweis im Text, nach dem Kochen (Wissens-Höhepunkt) */}
            <Angebotshinweis hinweis={angebote.imText} seite="rezept" />

            {/* Aroma-Foodpairing (geteilte Moleküle) → Deeplink in die Rezept-Schmiede */}
            <AromaPairing meatType={recipe.meatType} />

            {/* BBQ-Pairing */}
            {hasPairing && (
              <BBQPairing
                meatType={recipe.meatType}
                whiskeyName={recipe.whiskeyName}
                whiskeyType={recipe.whiskeyType ?? 'Whiskey'}
                whiskeyProfile={recipe.whiskeyProfile}
                affiliateLinkWhiskey={recipe.whiskeyLink}
                wineName={recipe.wineName}
                wineType={recipe.wineType ?? 'Rotwein'}
                wineProfile={recipe.wineProfile}
                affiliateLinkWine={recipe.wineLink}
              />
            )}

            {/* Eigene Angebote — Regal am Ende der Hauptspalte, höchstens drei */}
            <AngebotsRegal hinweise={angebote.regal} seite="rezept" />

            {/* Autor-Box */}
            <div className="mt-10 p-5 bg-surface-base border border-border-subtle flex gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-fire/10 border border-border-subtle flex items-center justify-center shrink-0">
                <span className="font-serif text-xl font-bold text-brand-gold">
                  {recipe.author[0]}
                </span>
              </div>
              <div>
                <Link
                  href={`/autoren/${recipe.authorSlug}`}
                  className="font-sans font-bold text-sm text-text-primary hover:text-brand-fire transition-colors"
                >
                  {recipe.author}
                </Link>
                <AutorHinweis authorSlug={recipe.authorSlug} variante="rezept" dokument={recipe} />
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            {/* Equipment aus Registry */}
            {hardwareProducts.length > 0 && (
              <div className="bg-surface-elevated border border-border-subtle overflow-hidden sticky top-24">
                <div className="border-t-2 border-brand-gold px-5 pt-5 pb-3">
                  <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-brand-fire block mb-1">
                    Equipment für dieses Rezept
                  </span>
                  <p className="text-xs font-sans text-text-muted">
                    Automatisch aus {recipe.equipment?.join(', ')} ausgewählt
                  </p>
                </div>
                <div className="divide-y divide-border-subtle">
                  {hardwareProducts.map((p) => (
                    <div key={p.id} className="px-4 py-3">
                      <ProductCard product={p} variant="compact" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Methoden & Guides */}
            <div className="bg-surface-elevated border border-border-subtle p-5">
              <div className="border-t-2 border-brand-gold -mt-5 mb-4 pt-4">
                <h3 className="font-sans font-bold text-sm text-text-primary">Weiterlernen</h3>
              </div>
              <ul className="space-y-1">
                {[
                  { label: 'Reverse Sear Methode', href: '/methoden/reverse-sear' },
                  { label: 'Ribeye — Der ultimative Guide', href: '/cuts/ribeye' },
                  { label: 'Kerntemperaturen Guide', href: '/temperatur-guide' },
                  { label: 'Fleischthermometer Vergleich', href: '/vergleich/fleischthermometer' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center justify-between text-sm font-sans text-text-secondary hover:text-brand-fire transition-colors group py-1.5 border-b border-border-subtle/50"
                    >
                      {label}
                      <ChevronRight
                        size={13}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-fire shrink-0"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rezept einreichen — Teaser + Modal */}
            <RecipeSubmitModal />
          </aside>
        </div>
      </div>
    </>
  );
}
