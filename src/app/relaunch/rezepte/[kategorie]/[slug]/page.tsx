import { use } from "react";
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allRecipes } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import { authorSchemaRef } from '@/lib/schema';
import { ALL_CUTS } from '@/lib/cuts-catalog';
import { getAllProducts } from '@/lib/products';
import type { Product, ProductCategory } from '@/types';
import type { RecipeIngredient } from '@/components/recipe/PortionCalculator';
import type { RecipeStep } from '@/components/recipe/CookCoach';
import CutBestellen from '@/components/recipe/CutBestellen';
import ProductCard from '@/components/affiliate/ProductCard';
import Portionen from '@/components/relaunch/Portionen';
import { skMdx, Crumbs, Weiche } from '@/components/relaunch/Prose';

/**
 * Rezept (Handoff, Ansicht 5): Breite 1100px, zweispaltiger Kopf, Kennzahlen,
 * Zutaten mit Portionsrechner (1–12), Ablauf als nummerierte Schritte im
 * 72px/1fr-Raster mit Trennlinien, am Ende eine Weiche.
 *
 * URL-Struktur wie live: /rezepte/[kategorie]/[slug] — beim Umschalten ändert
 * sich kein Slug. Daten 1:1 aus content/rezepte (ingredients/steps sind
 * strukturiert, kein Parsen nötig).
 *
 * Was der Prototyp nicht zeigt, die Alt-Seite aber trägt und was Umsatz oder
 * Recht betrifft, bleibt drin: Bildkennzeichnung („KI-Symbolbild"/„Symbolbild",
 * Alt-Text-Bedingung wie RecipeTemplate), Recipe-Schema, Cut-Bestellen und
 * Produktkarten mit „Anzeige" — als eigener Abschnitt „Dafür brauchst du",
 * an der Stelle, an der der Prototyp die Werkzeug-Weiche setzt.
 *
 * Nicht übernommen (Entscheidung offen, Handoff schweigt): CookCoach,
 * AromaPairing, BBQPairing, Rezept-Einreichung. Siehe docs/website-relaunch-2026-09.md.
 */
type Params = { kategorie: string; slug: string };
type Props = { params: Promise<Params> };

const EQUIPMENT_CATEGORY: Record<string, ProductCategory> = {
  thermometer: 'thermometer', grill: 'grill', smoker: 'smoker', 'sous-vide': 'sous-vide',
  oberhitzegrill: 'oberhitzegrill', 'dry-ager': 'dry-ager', messer: 'messer', zubehoer: 'zubehoer',
};

function dauer(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  let h = parseInt(m[1] || '0'), min = parseInt(m[2] || '0');
  if (min >= 60) { h += Math.floor(min / 60); min %= 60; }
  if (h && min) return `${h} Std. ${min} Min.`;
  if (h) return `${h} Std.`;
  return `${min} Min.`;
}

function finde(params: Params) {
  return allRecipes.find((r) => r.kategorie === params.kategorie && r.slug === params.slug);
}

export function generateStaticParams() {
  return allRecipes.map((r) => ({ kategorie: r.kategorie, slug: r.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const r = finde(params);
  if (!r) return {};
  return { title: r.seoTitle ?? r.title, description: r.seoDescription ?? r.description };
}

export default function RezeptSeite(props: Props) {
  const params = use(props.params);
  const r = finde(params);
  if (!r) notFound();
  const MDXContent = useMDXComponent(r.body.code);
  const zutaten = r.ingredients as RecipeIngredient[];
  const schritte = r.steps as RecipeStep[];

  // Cut-Atlas-Hinweis: der Cut, dessen meatTypeMatch auf das Rezept passt — nichts erraten
  const meat = (r.meatType ?? '').toLowerCase();
  const cut = ALL_CUTS.find((c) => c.meatTypeMatch.some((m) => meat.includes(m.toLowerCase())));
  const hinweis = cut ? `${cut.nameDE} = ${cut.origin}. ${cut.blurb}` : undefined;

  const kategorien = Array.from(new Set([
    ...(r.equipment ?? []).map((t: string) => EQUIPMENT_CATEGORY[t]).filter(Boolean),
    'thermometer' as ProductCategory,
  ]));
  const produkte: Product[] = getAllProducts()
    .filter((p) => kategorien.includes(p.category))
    .sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0))
    .slice(0, 3);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.title,
    description: r.description,
    image: r.image.startsWith('http') ? r.image : `https://steakakademie.de${r.image}`,
    author: authorSchemaRef(r.authorSlug),
    datePublished: r.publishedAt,
    ...(r.updatedAt && { dateModified: r.updatedAt }),
    prepTime: r.prepTime, cookTime: r.cookTime, totalTime: r.totalTime,
    recipeYield: `${r.servings} Portionen`,
    recipeCategory: ({ beilagen: 'Beilage', desserts: 'Dessert', 'saucen-rubs': 'Sauce' } as Record<string, string>)[r.kategorie] ?? 'Hauptgericht',
    recipeCuisine: r.land || 'BBQ',
    keywords: r.keywords?.join(', '),
    recipeIngredient: zutaten.map((i) => (['Prise', 'n.B.', 'etwas'].includes(i.unit) ? i.name : `${i.amount} ${i.unit} ${i.name}${i.note ? ` (${i.note})` : ''}`)),
    recipeInstructions: schritte.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.description })),
    ...(r.calories && { nutrition: { '@type': 'NutritionInformation', calories: `${r.calories} kcal` } }),
  };

  return (
    <div className="sk-mid">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Crumbs items={[{ label: 'Start', href: '/relaunch' }, { label: 'Rezepte', href: '/relaunch/rezepte' }, { label: r.meatType }]} />

      <Portionen
        basis={r.servings}
        zutaten={zutaten}
        hinweis={hinweis}
        kopf={
          <>
            <div className="sk-kicker sk-kicker--accent" style={{ marginBottom: 14 }}>
              Rezept · {r.meatType} · {r.cookingMethod}{r.land ? ` · ${r.land}` : ''}
            </div>
            <h1 className="sk-h sk-rezept__h1">{r.title}</h1>
            <p className="sk-lead" style={{ marginTop: 20 }}>{r.description}</p>
          </>
        }
        kennzahlen={
          <>
            <div><div className="sk-kicker sk-kicker--13 sk-kicker--muted">Schwierigkeit</div><div className="sk-kennzahl">{r.difficulty}</div></div>
            <div><div className="sk-kicker sk-kicker--13 sk-kicker--muted">Gesamt</div><div className="sk-kennzahl">{dauer(r.totalTime)}</div></div>
            <div><div className="sk-kicker sk-kicker--13 sk-kicker--muted">Am Feuer</div><div className="sk-kennzahl sk-kennzahl--accent">{dauer(r.cookTime)}</div></div>
          </>
        }
      />

      <figure className="sk-rezept__bild">
        <Image
          src={r.heroImage || r.image}
          alt={`${r.imageAlt} — ${r.imageAI ? 'KI-generiertes Symbolbild' : 'Symbolbild'}`}
          width={1100}
          height={620}
          priority
          sizes="(min-width: 1140px) 1100px, 100vw"
          className="sk-read__img"
        />
        <figcaption className="sk-meta">
          <Link href="/ki-disclaimer">{r.imageAI ? 'KI-Symbolbild' : 'Symbolbild'}</Link> · {r.author} · {r.formattedDate}
        </figcaption>
      </figure>

      <h2 className="sk-h sk-h--sub" style={{ margin: '56px 0 20px' }}>Ablauf</h2>
      <ol className="sk-ablauf">
        {schritte.map((s, i) => (
          <li key={i} className="sk-ablauf__step">
            <span className="sk-ablauf__nr" aria-hidden="true">{i + 1}</span>
            <div>
              <div className="sk-h sk-h--24" style={{ marginBottom: 8 }}>{s.title}</div>
              <p className="sk-prose__p" style={{ margin: 0 }}>{s.description}</p>
              {(s.duration || s.tip) && (
                <p className="sk-meta sk-meta--14" style={{ marginTop: 8 }}>
                  {s.duration && <span>{dauer(s.duration)}</span>}
                  {s.duration && s.tip && ' · '}
                  {s.tip && <span>{s.tip}</span>}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {r.body.raw.trim().length > 0 && (
        <div className="sk-prose" style={{ marginTop: 40 }}>
          <MDXContent components={skMdx} />
        </div>
      )}

      {(r.equipment?.length ?? 0) > 0 && (
        <section style={{ marginTop: 48 }}>
          <h2 className="sk-h sk-h--24" style={{ marginBottom: 12 }}>Ausrüstung</h2>
          <ul className="sk-prose__ul">{r.equipment!.map((e: string) => <li key={e}>{e}</li>)}</ul>
        </section>
      )}

      {/* Umsatz-Bausteine der Alt-Seite, Kennzeichnung liegt in den Komponenten */}
      <section className="sk-dunkelblock" style={{ marginTop: 48 }}>
        <CutBestellen cut={r.meatType} kategorie={r.kategorie} />
        {produkte.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="sk-kicker sk-kicker--warm" style={{ marginBottom: 12 }}>Dafür brauchst du</div>
            <div className="sk-grid" style={{ ['--min' as string]: '240px' }}>
              {produkte.map((p) => <ProductCard key={p.id} product={p} variant="compact" />)}
            </div>
          </div>
        )}
      </section>

      <Weiche
        kicker="Dafür brauchst du · Test"
        titel="Fleischthermometer im Vergleich 2026"
        text="Drei Modelle, selbst getestet — kabellos vs. Kabel, Genauigkeit, App. Affiliate-Links gekennzeichnet."
        href="/relaunch/vergleich/fleischthermometer"
      />
    </div>
  );
}
