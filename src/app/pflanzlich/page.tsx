import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Leaf, Sprout, Flame, Salad } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getApprovedDrafts } from '@/lib/content-feed';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Pflanzlich und vegan grillen mit Methode',
  description:
    'Vegetarisch und vegan grillen mit Methode: Portobello, Halloumi, Blumenkohl-Steak, Tofu und Gemüse — mit präziser Technik zum perfekten Ergebnis.',
  alternates: { canonical: 'https://steakakademie.de/pflanzlich' },
  openGraph: {
    title: 'Pflanzlich & Vegan grillen — mit Methode',
    description:
      'Vegetarisch und vegan vom Grill: Portobello, Halloumi, Blumenkohl-Steak, Tofu & Gemüse — präzise erklärt.',
    url: 'https://steakakademie.de/pflanzlich',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', creator: '@steakakademie' },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://steakakademie.de' },
    { '@type': 'ListItem', position: 2, name: 'Pflanzlich & Vegan', item: 'https://steakakademie.de/pflanzlich' },
  ],
};

const GREEN = '#7BA05B';
const GREEN_DEEP = '#5C7A42';

interface Dish {
  name: string;
  meta: string;
  text: string;
  vegan: boolean;
}

const VEGGIE: Dish[] = [
  {
    name: 'Portobello vom Rost',
    meta: 'Hauptgang · indirekte Hitze',
    text: 'Der fleischige Pilz mit Umami-Tiefe. Mariniert, langsam gegart und kurz scharf — die vegetarische Antwort auf das Steak-Erlebnis.',
    vegan: true,
  },
  {
    name: 'Gegrillter Halloumi',
    meta: 'Vorspeise · direkte Hitze',
    text: 'Außen knusprig-goldbraun, innen quietschig-zart. Der Grillkäse, der nicht schmilzt — mit Honig-Chili oder Zitrone.',
    vegan: false,
  },
  {
    name: 'Blumenkohl-Steak',
    meta: 'Hauptgang · Reverse Sear',
    text: 'Eine dicke Scheibe Blumenkohl, langsam gegart und karamellisiert. Nussig, saftig, überraschend sättigend.',
    vegan: true,
  },
  {
    name: 'Spargel & Zucchini vom Grill',
    meta: 'Beilage · direkte Hitze',
    text: 'Röstaromen statt Wasser. Mit gutem Olivenöl, Salz und einem Spritzer Zitrone — pur und perfekt.',
    vegan: true,
  },
];

const VEGAN_DISHES: Dish[] = [
  {
    name: 'Marinierter Tofu-Spieß',
    meta: 'Hauptgang · direkte Hitze',
    text: 'Fester Tofu, gepresst und mariniert, nimmt Rauch und Würze auf wie ein Schwamm. Knusprige Kanten garantiert.',
    vegan: true,
  },
  {
    name: 'Geräucherte Jackfruit „Pulled"',
    meta: 'Low & Slow',
    text: 'Junge Jackfruit zerfasert beim Garen wie Pulled Pork. Mit BBQ-Sauce die vegane Sensation vom Smoker.',
    vegan: true,
  },
  {
    name: 'Maiskolben mit Räucherbutter (vegan)',
    meta: 'Beilage · direkte Hitze',
    text: 'Im Blatt gegart, dann über der Glut geröstet. Vegane Kräuterbutter und geräuchertes Paprikapulver machen es perfekt.',
    vegan: true,
  },
];

function DishCard({ d }: { d: Dish }) {
  return (
    <article className="h-full flex flex-col bg-surface-card border border-border-subtle p-6 transition-colors duration-200 hover:border-brand-gold/40">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-sans font-bold tracking-wider uppercase text-text-muted">{d.meta}</span>
        {d.vegan && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-sans font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(123,160,91,0.15)', color: GREEN }}
          >
            <Leaf size={10} /> Vegan
          </span>
        )}
      </div>
      <h3 className="font-serif text-xl font-bold text-text-light mb-3 leading-snug">{d.name}</h3>
      <p className="font-body text-sm text-text-secondary leading-relaxed flex-1">{d.text}</p>
    </article>
  );
}

export default async function PflanzlichPage() {
  const feed = await getApprovedDrafts('/pflanzlich', 6);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Header />

      <main>
        {/* ── HERO ───────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{ background: `radial-gradient(ellipse 120% 130% at 70% 10%, #243018 0%, #17100B 70%)` }}
        >
          <div aria-hidden className="absolute -left-12 bottom-0 select-none pointer-events-none" style={{ opacity: 0.1 }}>
            <Sprout size={240} style={{ color: GREEN }} strokeWidth={0.8} />
          </div>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 relative">
            <span className="inline-flex items-center gap-2 text-xs font-sans font-bold tracking-[0.25em] uppercase mb-5" style={{ color: GREEN }}>
              <Leaf size={13} /> Pflanzlich & Vegan
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-text-light leading-[1.08] mb-6 max-w-3xl">
              Der Grillmeister kennt auch das Andere.
            </h1>
            <p className="font-body text-lg sm:text-xl text-text-secondary leading-relaxed max-w-2xl">
              Pflanzlich grillen ist kein Kompromiss — es ist Können. Wer Hitze, Timing und
              Röstaromen beherrscht, holt aus Gemüse, Pilzen und Tofu genauso viel heraus wie aus
              einem Steak. Mit Methode statt Beilagen-Denken.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#vegetarisch" className="inline-flex items-center gap-2 font-sans font-bold text-sm tracking-wide px-6 py-3" style={{ background: GREEN, color: '#120C07', borderRadius: '2px' }}>
                Vegetarisch <ChevronRight size={15} />
              </a>
              <a href="#vegan" className="inline-flex items-center gap-2 font-sans font-bold text-sm tracking-wide px-6 py-3" style={{ border: `1.5px solid ${GREEN}`, color: '#fff', borderRadius: '2px' }}>
                Rein vegan
              </a>
            </div>
          </div>
        </section>

        {/* ── VEGETARISCH ────────────────────────────────────────────── */}
        <section id="vegetarisch" className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-2">
            <Salad size={22} style={{ color: GREEN }} />
            <h2 className="font-serif text-3xl font-bold text-text-light">Vegetarisch vom Grill</h2>
          </div>
          <div className="section-divider" />
          <p className="font-body text-text-secondary max-w-2xl mb-8 leading-relaxed">
            Pilze, Käse und Gemüse mit echtem Hauptrollen-Anspruch. Jedes Gericht mit präziser
            Technik — damit aus „auch noch was Grünes&ldquo; ein eigenständiges Highlight wird.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VEGGIE.map((d) => <DishCard key={d.name} d={d} />)}
          </div>
        </section>

        {/* ── VEGAN — eigener, hervorgehobener Block ─────────────────── */}
        <section id="vegan" className="py-16" style={{ background: `linear-gradient(180deg, #1A2110 0%, #17100B 100%)`, borderTop: `2px solid ${GREEN}`, borderBottom: `1px solid rgba(123,160,91,0.2)` }}>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-2">
              <Leaf size={22} style={{ color: GREEN }} />
              <h2 className="font-serif text-3xl font-bold text-text-light">100 % Vegan</h2>
              <span className="text-[10px] font-sans font-bold tracking-wider uppercase px-2.5 py-1 rounded-full" style={{ background: 'rgba(123,160,91,0.2)', color: GREEN }}>
                Ohne tierische Produkte
              </span>
            </div>
            <div className="section-divider" style={{ borderColor: 'rgba(123,160,91,0.3)' }} />
            <p className="font-body text-text-secondary max-w-2xl mb-8 leading-relaxed">
              Rein pflanzlich und kompromisslos im Geschmack. Tofu, Jackfruit und Gemüse zeigen,
              dass Rauch und Röstaromen keine tierischen Produkte brauchen — nur die richtige Technik.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {VEGAN_DISHES.map((d) => <DishCard key={d.name} d={d} />)}
            </div>
          </div>
        </section>

        {/* ── LIVE-FEED — frisch aus der Redaktion (Pflanzlich) ──────── */}
        {feed.length > 0 && (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center gap-3 mb-2">
              <Sprout size={22} style={{ color: GREEN }} />
              <h2 className="font-serif text-3xl font-bold text-text-light">Neu im Pflanzlich-Magazin</h2>
            </div>
            <p className="text-xs font-sans text-text-muted mb-2">
              Hinweis: Diese Beiträge werden KI-gestützt erstellt und redaktionell vor Veröffentlichung geprüft.
            </p>
            <div className="section-divider" style={{ borderColor: 'rgba(123,160,91,0.3)' }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {feed.map((a) => (
                <article
                  key={a.id}
                  className="h-full flex flex-col bg-surface-card border border-border-subtle p-6 transition-colors duration-200 hover:border-brand-gold/40"
                >
                  <time className="text-[11px] font-sans font-bold tracking-wider uppercase text-text-muted" dateTime={a.isoDate}>
                    {a.date}
                  </time>
                  <h3 className="font-serif text-xl font-bold text-text-light mt-2 mb-3 leading-snug">{a.title}</h3>
                  <p className="font-body text-sm text-text-secondary leading-relaxed flex-1">{a.summary}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── TECHNIK-HINWEIS ────────────────────────────────────────── */}
        <section className="max-w-content mx-auto px-4 sm:px-6 py-14 text-center">
          <Flame size={22} className="text-brand-gold mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-text-light mb-3">Technik bleibt Technik</h2>
          <p className="font-body text-text-secondary leading-relaxed mb-6">
            Direkte vs. indirekte Hitze, Reverse Sear, Kerntemperatur — die Prinzipien gelten für
            Gemüse genauso wie für Fleisch. Wer die Grundlagen kennt, grillt alles auf den Punkt.
          </p>
          <Link href="/methoden/reverse-sear" className="btn-gold text-xs font-bold tracking-widest uppercase">
            Grilltechniken lernen <ChevronRight size={14} />
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}
