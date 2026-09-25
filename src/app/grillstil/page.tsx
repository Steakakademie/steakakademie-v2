import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Flame, Thermometer, BookOpen, Beef, Wine } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getApprovedDrafts } from '@/lib/content-feed';
import { allRecipes, allPersoenlichkeits } from 'contentlayer/generated';
import { nurVeroeffentlicht } from '@/lib/redaktion';
import { parseDuration } from '@/lib/rezept/card-data';

export const revalidate = 86400;

/*
 * Grillstil — die Seite für Frauen am Feuer.
 *
 * Neu aufgebaut am 25.09.2026 (Konzept: claude/konzept_grillstil_optimierung_2026-09-25.md).
 * Leitlinie: Grillkompetenz zuerst, Gastgeben & Genuss als zweite Ebene.
 * Markenfarben statt eigener Pastell-Welt, nur verlinkte, real existierende Inhalte.
 */

export const metadata: Metadata = {
  title: 'Grillen für Frauen — Technik, Steak und Genuss',
  description:
    'Grillen für Frauen mit echter Technik: vom ersten Steak über Kerntemperaturen bis zum Grillmeister-Diplom. Dazu Rezepte, Vorbilder und Ideen fürs Gastgeben.',
  alternates: { canonical: 'https://steakakademie.de/grillstil' },
  openGraph: {
    title: 'Grillstil — Grillen für Frauen, mit Technik und Genuss',
    description:
      'Vom ersten Steak bis zum Grillmeister-Diplom: Technik, Rezepte und Vorbilder für Frauen am Feuer.',
    url: 'https://steakakademie.de/grillstil',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', creator: '@steakakademie' },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://steakakademie.de' },
    { '@type': 'ListItem', position: 2, name: 'Grillstil', item: 'https://steakakademie.de/grillstil' },
  ],
};

/* Rezept-Auswahl: zwei Steaks, ein Fisch, ein Dessert — Slugs müssen in content/rezepte existieren. */
const REZEPT_SLUGS = ['flank-steak-grillen', 'picanha-churrasco', 'cedar-plank-lachs', 'gegrillter-pfirsich-bourbon'];
const ERSTES_STEAK_SLUG = 'entrecote-grillen';
const VORBILD_SLUGS = ['jess-pryles'];

const TISCH_IDEEN: { label: string; note: string }[] = [
  { label: 'Das Brett als Bühne', note: 'Steak ruhen lassen, quer zur Faser aufschneiden und direkt auf dem Holzbrett servieren.' },
  { label: 'Beilagen vom selben Feuer', note: 'Gemüse, Brot und Obst nutzen die Resthitze, während das Fleisch ruht.' },
  { label: 'Licht in Etagen', note: 'Kerzen in verschiedenen Höhen machen aus dem Grillabend einen Abend, an den man sich erinnert.' },
  { label: 'Kräuter am Gedeck', note: 'Rosmarin und Thymian sehen gut aus und landen am Ende auf dem Teller.' },
];

export default async function GrillstilPage() {
  const feed = await getApprovedDrafts('/grillstil', 6);

  const sichtbareRezepte = nurVeroeffentlicht(allRecipes);
  const rezepte = REZEPT_SLUGS
    .map((slug) => sichtbareRezepte.find((r) => r.slug === slug))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  const erstesSteak = sichtbareRezepte.find((r) => r.slug === ERSTES_STEAK_SLUG);
  const vorbilder = VORBILD_SLUGS
    .map((slug) => allPersoenlichkeits.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const schritte = [
    {
      icon: BookOpen,
      nr: '01',
      title: 'Grundlagen verstehen',
      text: 'Direkte und indirekte Hitze, Zonen, Deckel auf oder zu: das System hinter jedem guten Grillabend.',
      href: '/bbq-grundkurs',
      cta: 'Zum BBQ-Grundkurs',
    },
    {
      icon: Beef,
      nr: '02',
      title: 'Dein erstes Steak',
      text: 'Ein Entrecôte, rosa mit Kruste. Das Rezept führt dich Schritt für Schritt durch Hitze, Wenden und Ruhezeit.',
      href: erstesSteak?.url ?? '/rezepte',
      cta: 'Zum Rezept',
    },
    {
      icon: Thermometer,
      nr: '03',
      title: 'Kerntemperatur im Griff',
      text: 'Nicht raten, messen. Der Spickzettel zum Ausdrucken zeigt dir auf einen Blick, wann dein Steak fertig ist.',
      href: '/kerntemperatur-spickzettel',
      cta: 'Zum Spickzettel',
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Header />

      <main className="bg-surface-base">
        {/* ── HERO — Kompetenz zuerst ─────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(232,80,24,0.22) 0%, rgba(23,16,11,0) 55%), #0F0A06' }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
            <span className="inline-flex items-center gap-2 text-xs font-sans font-bold tracking-[0.25em] uppercase mb-5 text-brand-gold">
              <Flame size={13} /> Grillstil · Für Frauen am Feuer
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] mb-6 max-w-3xl text-text-light">
              Feuer gehört allen.
            </h1>
            <p className="font-body text-lg sm:text-xl leading-relaxed max-w-2xl text-text-primary">
              Grillen ist kein Männerthema, sondern ein Handwerk. Hier lernst du es richtig: Hitze lesen,
              Kerntemperatur treffen, das Steak auf den Punkt bringen. Und danach einen Abend gestalten,
              an den sich deine Gäste erinnern.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/diplome"
                className="inline-flex items-center gap-2 font-sans font-bold text-sm tracking-wide px-6 py-3 bg-brand-gold text-ink hover:bg-[#b07020] transition-colors"
              >
                <Flame size={15} /> Grillmeister-Diplom kostenlos starten
              </Link>
              <a
                href="#rezepte"
                className="inline-flex items-center gap-2 font-sans font-bold text-sm tracking-wide px-6 py-3 border border-brand-gold/60 text-text-light hover:border-brand-gold transition-colors"
              >
                Rezepte ansehen <ChevronRight size={15} />
              </a>
            </div>
          </div>
        </section>

        {/* ── STATEMENT ───────────────────────────────────────────── */}
        <section className="py-14 bg-surface-card border-y border-brand-gold/10">
          <div className="max-w-content mx-auto px-4 sm:px-6 text-center">
            <p className="font-serif text-2xl sm:text-3xl italic font-bold leading-[1.4] text-brand-gold">
              „Der Grill gehört allen, die Genuss lieben.
              <br className="hidden sm:block" /> Es geht nicht ums Beweisen, es geht ums Können.“
            </p>
          </div>
        </section>

        {/* ── EINSTIEG IN 3 SCHRITTEN ─────────────────────────────── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10">
            <span className="text-xs font-sans font-bold tracking-[0.25em] uppercase text-brand-fire">Einstieg</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-2 text-text-light">
              In drei Schritten zum sicheren Grillen
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {schritte.map(({ icon: Icon, nr, title, text, href, cta }) => (
              <Link
                key={nr}
                href={href}
                className="group h-full flex flex-col p-7 bg-surface-card border border-brand-gold/15 hover:border-brand-gold/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-5">
                  <Icon size={24} className="text-brand-gold" />
                  <span className="font-serif text-3xl font-bold text-brand-gold/30">{nr}</span>
                </div>
                <h3 className="font-serif text-xl font-bold mb-3 text-text-light">{title}</h3>
                <p className="font-body leading-relaxed flex-1 text-text-secondary">{text}</p>
                <span className="inline-flex items-center gap-1 mt-5 text-sm font-sans font-bold text-brand-fire group-hover:gap-2 transition-all">
                  {cta} <ChevronRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── REZEPTE ─────────────────────────────────────────────── */}
        {rezepte.length > 0 && (
          <section id="rezepte" className="py-16 bg-surface-card border-y border-brand-gold/10">
            <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-10">
                <span className="text-xs font-sans font-bold tracking-[0.25em] uppercase text-brand-fire">Vom Grill</span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-2 text-text-light">
                  Vom Steak bis zum Dessert
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {rezepte.map((r) => (
                  <Link key={r.slug} href={r.url} className="group flex flex-col bg-surface-base border border-brand-gold/15 hover:border-brand-gold/50 transition-colors">
                    <div className="overflow-hidden">
                      <Image
                        src={r.image}
                        alt={r.imageAlt}
                        width={640}
                        height={400}
                        className="w-full aspect-[16/10] object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-[11px] font-sans font-bold tracking-wider uppercase text-brand-gold">
                        {r.difficulty} · {parseDuration(r.totalTime)}
                      </span>
                      <h3 className="font-serif text-lg font-bold mt-2 leading-snug text-text-light">{r.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-9">
                <Link
                  href="/rezepte"
                  className="inline-flex items-center gap-2 font-sans font-bold text-sm tracking-wide px-6 py-3 border border-brand-gold/60 text-text-light hover:border-brand-gold transition-colors"
                >
                  Alle Rezepte <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── VORBILDER ───────────────────────────────────────────── */}
        {vorbilder.length > 0 && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-8">
              <span className="text-xs font-sans font-bold tracking-[0.25em] uppercase text-brand-fire">Vorbilder</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-2 text-text-light">
                Frauen, die das Feuer prägen
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vorbilder.map((p) => (
                <Link
                  key={p.slug}
                  href={p.url}
                  className="group block p-7 bg-surface-card border border-brand-gold/15 hover:border-brand-gold/50 transition-colors"
                >
                  <span className="text-[11px] font-sans font-bold tracking-wider uppercase text-brand-gold">
                    {p.category} · {p.nationality}
                  </span>
                  <h3 className="font-serif text-2xl font-bold mt-2 mb-3 text-text-light">{p.title}</h3>
                  <p className="font-body leading-relaxed text-text-secondary">{p.excerpt}</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-sm font-sans font-bold text-brand-fire">
                    Porträt lesen <ChevronRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── DIPLOM-CTA — nach dem Wissensteil ───────────────────── */}
        <section className="py-16 bg-surface-dark border-y border-brand-gold/15">
          <div className="max-w-content mx-auto px-4 sm:px-6 text-center">
            <p className="text-[11px] font-sans font-bold tracking-[0.2em] uppercase text-brand-fire mb-3">
              Vom Lesen zum Können
            </p>
            <h2 className="font-serif text-3xl font-bold text-text-light mb-4 leading-tight">
              Werde Steakakademikerin.
            </h2>
            <p className="font-body text-text-secondary leading-relaxed mb-8 max-w-xl mx-auto">
              Das Grillmeister-Diplom führt dich Stufe für Stufe von den Grundlagen bis zur Meisterklasse.
              Stufe 1 (Bronze) ist kostenlos und ohne Konto lesbar.
            </p>
            <Link
              href="/diplome"
              className="inline-flex items-center gap-2 bg-brand-gold text-ink font-sans font-bold text-sm tracking-[0.1em] uppercase px-8 py-4 hover:bg-[#b07020] transition-colors"
            >
              <Flame size={14} /> Jetzt mit Bronze starten
            </Link>
          </div>
        </section>

        {/* ── GASTGEBEN AM FEUER ──────────────────────────────────── */}
        {/* Hinweis: Partner-Empfehlungen (Wein, Olivenöl, Bio-Zutaten) folgen hier, sobald die
            Affiliate-Programme freigegeben sind — immer als Werbung gekennzeichnet. */}
        <section id="tisch" className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
            <div>
              <span className="text-xs font-sans font-bold tracking-[0.25em] uppercase text-brand-fire">Gastgeben</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-2 mb-4 text-text-light">
                Der Abend am Feuer
              </h2>
              <p className="font-body text-lg text-text-secondary leading-relaxed mb-6">
                Ein gelungener Grillabend endet nicht am Rost. Wer das Timing beherrscht, hat den Kopf frei
                für Gäste, Tisch und die richtige Begleitung im Glas.
              </p>
              <ul className="space-y-3">
                {TISCH_IDEEN.map((t) => (
                  <li key={t.label} className="flex gap-3">
                    <span className="mt-2 w-2 h-2 shrink-0 bg-brand-gold" />
                    <span>
                      <span className="font-sans font-bold text-text-light">{t.label}</span>
                      <span className="font-body text-text-secondary"> — {t.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/rezepte/wine-spirits"
              className="group block p-8 bg-surface-card border border-brand-gold/15 hover:border-brand-gold/50 transition-colors"
            >
              <Wine size={26} className="text-brand-gold mb-4" />
              <h3 className="font-serif text-2xl font-bold mb-3 text-text-light">Wein & Spirits zum Steak</h3>
              <p className="font-body leading-relaxed text-text-secondary">
                Welcher Wein zum Brisket, welcher Whisky zum Ribeye: Pairing-Empfehlungen mit Begründung,
                nicht nach Etikett.
              </p>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-sans font-bold text-brand-fire">
                Zu den Pairings <ChevronRight size={14} />
              </span>
            </Link>
          </div>
        </section>

        {/* ── LIVE-FEED — frisch aus der Redaktion (Queen of Fire) ── */}
        {feed.length > 0 && (
          <section className="py-16 bg-surface-card border-y border-brand-gold/10">
            <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-10">
                <span className="text-xs font-sans font-bold tracking-[0.25em] uppercase text-brand-fire">Frisch kuratiert</span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-2 text-text-light">Neu im Grillstil-Magazin</h2>
                <p className="text-xs font-sans mt-3 text-text-muted">
                  Hinweis: Diese Beiträge werden KI-gestützt erstellt und redaktionell vor Veröffentlichung geprüft.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {feed.map((a) => (
                  <article key={a.id} className="h-full flex flex-col p-7 bg-surface-base border border-brand-gold/15">
                    <time className="text-[11px] font-sans font-bold tracking-wider uppercase text-brand-gold" dateTime={a.isoDate}>
                      {a.date}
                    </time>
                    <h3 className="font-serif text-xl font-bold mt-2 mb-3 leading-snug text-text-light">{a.title}</h3>
                    <p className="font-body text-sm leading-relaxed flex-1 text-text-secondary">{a.summary}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>

      <Footer />
    </>
  );
}
