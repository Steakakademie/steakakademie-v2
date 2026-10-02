import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Download, Sparkles } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CutAtlasClient from '@/components/cuts/CutAtlasClient';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import { getCutsBySpecies, getPrimalsBySpecies, ALL_CUTS } from '@/lib/cuts-catalog';
import { buildCutRecipeMap } from '@/lib/cut-recipes';

/**
 * Schwein ist vorübergehend ausgeblendet — die Schwein-Cut-Fotos stammen aus
 * Händler-Produktbildern und sind nach der Rechts-Doktrin
 * (public/images/cuts/CREDITS.md) nicht verwendbar.
 *
 * EIN Schalter für die ganze Seite (03.10.2026): Tabs im Atlas (Prop `showPork`),
 * Titel, Beschreibung, H1, Einleitung und ItemList-Schema hängen an dieser
 * Konstante. Vorher stand sie nur in CutAtlasClient.tsx — der Atlas zeigte Rind,
 * während Titel, Text und Schema „Rind & Schwein“ und 64 Cuts auswiesen.
 *
 * Warum hier und nicht als Export aus CutAtlasClient.tsx: Das ist ein
 * 'use client'-Modul. Ein Server-Bauteil bekommt von dort keinen Wert, sondern
 * einen Client-Verweis — eine Funktion, also immer „wahr“ (CLAUDE.md Abschnitt A,
 * 06.09.2026). Die Seite würde dann dauerhaft Schwein bewerben, bei grünem Build.
 *
 * Sobald lizenzsaubere Fotos vorliegen: hier und in CutGenerator.tsx auf `true`
 * setzen (dort und in src/lib/plattform-puls.ts wird Schwein getrennt geführt).
 */
const SHOW_PORK: boolean = false;

export const metadata: Metadata = {
  title: SHOW_PORK ? 'Cut-Atlas — Alle Rinder- und Schweine-Cuts' : 'Cut-Atlas — Alle Rinder-Cuts',
  description: SHOW_PORK
    ? 'Der interaktive Cut-Atlas: alle Rinder- und Schweine-Teilstücke von Ribeye und Tomahawk bis Secreto und Schäufele — mit Cut-DNA, Garstufe und Rezepten.'
    : 'Der interaktive Cut-Atlas: alle Rinder-Teilstücke von Ribeye und Tomahawk bis Tafelspitz und Ochsenbacke — mit Cut-DNA, Garstufe und Rezepten.',
  alternates: { canonical: 'https://steakakademie.de/cuts' },
  openGraph: {
    title: SHOW_PORK ? 'Cut-Atlas — Alle Rinder- & Schweine-Cuts interaktiv' : 'Cut-Atlas — Alle Rinder-Cuts interaktiv',
    description: SHOW_PORK
      ? 'Wo sitzt welcher Cut? Interaktiver Atlas für alle Rinder- und Schweine-Teilstücke — mit Cut-DNA, Garstufe, Rezepten und Bezugsquelle.'
      : 'Wo sitzt welcher Cut? Interaktiver Atlas für alle Rinder-Teilstücke — mit Cut-DNA, Garstufe, Rezepten und Bezugsquelle.',
    url: 'https://steakakademie.de/cuts',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', creator: '@steakakademie' },
};

export default function CutsPage() {
  const bySpecies = {
    rind: { cuts: getCutsBySpecies('rind'), primals: getPrimalsBySpecies('rind') },
    schwein: { cuts: getCutsBySpecies('schwein'), primals: getPrimalsBySpecies('schwein') },
  };
  const recipeMap = buildCutRecipeMap(ALL_CUTS);

  // ItemList-Schema für die Cut-Sammlung (GEO/Rich Results) — nur, was der
  // Besucher im Atlas auch anklicken kann. Bis 03.10.2026 standen hier alle 64
  // Katalog-Einträge inklusive der 24 ausgeblendeten Schwein-Cuts.
  const sichtbareCuts = SHOW_PORK ? ALL_CUTS : bySpecies.rind.cuts;
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: SHOW_PORK
      ? 'Rinder- & Schweine-Cuts — Steakakademie Cut-Atlas'
      : 'Rinder-Cuts — Steakakademie Cut-Atlas',
    numberOfItems: sichtbareCuts.length,
    itemListElement: sichtbareCuts.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.nameDE,
    })),
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <main className="min-h-screen bg-surface-base">
        {/* Hero */}
        <section className="bg-surface-dark border-b border-brand-gold/15">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-light/40 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <span className="text-text-light/65">Cut-Atlas</span>
            </nav>
            <div className="max-w-2xl">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Steakakademie · Cut-Atlas
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-text-light leading-tight mb-4">
                {SHOW_PORK ? 'Rind & Schwein, Cut für Cut' : 'Rind, Cut für Cut'}
              </h1>
              <p className="font-body text-lg text-text-light/70 leading-relaxed">
                {SHOW_PORK
                  ? 'Wechsle zwischen Rind und Schwein, wähle ein Teilstück oder klicke direkt auf einen Cut.'
                  : 'Wähle ein Teilstück oder klicke direkt auf einen Cut.'}{' '}
                Du erfährst die Lage am Tier, die Cut-DNA, die ideale Garstufe und Kerntemperatur
                — plus passende Rezepte und wo du ihn bekommst.
              </p>
            </div>

            {/* Generator-Teaser */}
            <Link
              href="/cut-generator"
              className="mt-8 inline-flex items-center gap-3 px-6 py-4 border border-brand-gold/40 bg-brand-gold/5 hover:bg-brand-gold/10 transition-colors group"
            >
              <Sparkles size={18} className="text-brand-gold" />
              <span className="text-left">
                <span className="block font-serif font-bold text-text-light">Welcher Cut passt zu dir?</span>
                <span className="block text-text-light/50 text-xs font-sans">In 4 Fragen zum perfekten Cut — Cut-Generator starten</span>
              </span>
              <ChevronRight size={18} className="text-brand-gold ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Atlas */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <CutAtlasClient bySpecies={bySpecies} recipeMap={recipeMap} showPork={SHOW_PORK} />
        </section>

        {/* ── ÜBERSICHTSPOSTER (Uwe abgenommen, 30.08.2026) ────────────────
            Der Atlas zeigt immer eine Tierart und ein Teilstück. Das Poster
            zeigt alles auf einmal — der Blick, den der interaktive Atlas
            bauartbedingt nicht liefert.

            Bewusst <img> statt next/image: die Datei ist ein 17-KB-SVG, der
            Optimizer hat daran nichts zu gewinnen, und ohne
            dangerouslyAllowSVG in next.config.mjs weist er SVG ohnehin ab.

            Die kleinsten Beschriftungen liegen bei 8–10 px auf 1600 px
            Breite; auf dem Telefon sind das rund 2 px. Darum ist "in voller
            Größe öffnen" hier kein Zierrat, sondern der eigentliche Weg zum
            Lesen — und der Download der Weg zum Ausdrucken. */}
        <section className="border-t border-brand-gold/15" style={{ background: '#0D0A06' }}>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
            <div className="max-w-2xl mb-8">
              <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-4">
                Alle Rinder-Cuts auf einen Blick
              </span>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-text-light leading-tight mb-4">
                Die große Übersicht
              </h2>
              {/* Die 40 ist bewusst fest verdrahtet und NICHT ALL_CUTS.length:
                  das Poster ist eine statische Datei und zeigt ausschliesslich
                  Rind. ALL_CUTS zaehlt 64 (40 Rind + 24 Schwein) — die Zahl
                  waere hier schlicht falsch. Wer das Poster neu setzt, zieht
                  diese Zahl mit. */}
              <p className="font-body text-lg text-text-light/70 leading-relaxed">
                Alle 40 Rinder-Cuts auf einem Blatt — inklusive Ochsenbacke und
                Ochsenschwanz. Als Vektorgrafik angelegt: beliebig vergrößerbar,
                ohne dass die Beschriftung ausfranst.
              </p>
            </div>

            {/* Das Poster selbst — Klick öffnet die Datei in voller Größe.
                Der eigene Untergrund des SVG ist #0D0A06, deshalb sitzt es
                hier randlos auf demselben Ton. */}
            <a
              href="/images/cut-atlas-poster.svg"
              target="_blank"
              rel="noopener noreferrer"
              className="group block border border-brand-gold/25 hover:border-brand-gold/60 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cut-atlas-poster.svg"
                alt="Übersichtsposter des Cut-Atlas: Rind in Seitenansicht mit allen 40 Teilstücken und ihren Bezeichnungen, dazu Ochsenbacke und Ochsenschwanz."
                width={1600}
                height={900}
                loading="lazy"
                className="w-full h-auto block"
              />
            </a>

            {/* Download-Hinweis */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <a
                href="/images/cut-atlas-poster.svg"
                download="steakakademie-cut-atlas-poster.svg"
                className="inline-flex items-center gap-2 px-6 py-3 border border-brand-gold/60 text-brand-gold font-sans font-bold tracking-[0.1em] uppercase text-sm hover:bg-brand-gold/10 transition-colors"
              >
                <Download size={15} />
                Poster herunterladen
              </a>
              <p className="font-sans text-xs text-text-light/45 leading-relaxed">
                SVG, 16:9 — auf dem Telefon am besten antippen und in voller Größe öffnen.
                Für die Küchenwand in jeder gewünschten Größe ausdruckbar.
              </p>
            </div>
          </div>
        </section>

        {/* ── LEADMAGNET (Audit 15.08.2026) ───────────────────────────────
            Der Atlas endete bisher ausschließlich im Diplom-CTA, also ohne
            jeden Anmeldepunkt. Zu jedem Cut gehört eine Kerntemperatur — der
            Spickzettel ist hier die naheliegende Mitnahme. */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="max-w-content mx-auto">
            <NewsletterSignup
              source="cuts-atlas"
              eyebrow="Kostenloses Geschenk"
              headline="Zu jedem Cut gehört eine Kerntemperatur."
              subline="Wir schicken dir den Link zum druckfertigen Spickzettel mit allen Garstufen. Dazu der Wissens-Brief: BBQ-Wissen, das bleibt — ohne festen Takt, ohne Spam. Jederzeit abbestellbar."
              cta="Spickzettel sichern"
            />
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border-subtle py-14 px-4 text-center bg-surface-dark">
          <p className="text-text-light/40 text-sm font-sans mb-2">Wissen allein reicht nicht.</p>
          <h3 className="font-serif text-2xl font-bold text-text-light mb-6">Werde zum Master of Steak.</h3>
          <Link
            href="/diplome"
            className="inline-flex items-center gap-2 px-8 py-4 border border-brand-gold/60 text-brand-gold font-sans font-bold tracking-[0.1em] uppercase text-sm hover:bg-brand-gold/10 transition-colors"
          >
            Zum Diplom-System
            <ChevronRight size={14} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
