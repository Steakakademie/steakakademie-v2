import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { allRecipes } from 'contentlayer/generated';
import { breadcrumbSchema } from '@/lib/schema';
import RecipeExplorer from '@/components/recipe/RecipeExplorer';
import RecipeIndex from '@/components/recipe/RecipeIndex';
import { toCardData } from '@/lib/rezept/card-data';

// ─── Kategorie-Definitionen ──────────────────────────────────────────────────

const KATEGORIEN: Record<string, {
  label: string; subtitle: string; description: string; seoDescription?: string;
  heroImage: string; heroAlt: string;
}> = {
  fleisch: {
    label:       'Fleisch-Rezepte',
    subtitle:    'Master-Cuts',
    description: 'Präzise Rezepte für Premium-Cuts — Ribeye, Brisket, Tomahawk und mehr. Jedes Rezept mehrfach am Grill getestet, mit exakten Gramm- und Temperaturangaben.',
    heroImage:   '/images/rezepte/dry-aged-ribeye-hero.jpg',
    heroAlt:     'Dry-Aged Ribeye über Flammen auf dem Grill — dramatischer Eyecatcher',
  },
  fisch: {
    label:       'Fisch & Meeresfrüchte',
    subtitle:    'Vom Rost ins Meer',
    description: 'Lachs auf der Zedernholzplanke, blutrotes Thunfisch-Steak, die ganze Dorade über der Glut — Fisch und Meeresfrüchte vom Grill, präzise gegart mit exakten Kerntemperaturen. Der feine Unterschied zwischen saftig und übergart.',
    seoDescription: 'Lachs auf der Zedernholzplanke, Thunfisch-Steak, ganze Dorade über der Glut: Fisch und Meeresfrüchte vom Grill, präzise gegart mit exakten Kerntemperaturen.',
    heroImage:   '/images/rezepte/cedar-plank-lachs-hero.jpg',
    heroAlt:     'Cedar-Plank-Lachs über Flammen auf dem Grill — dramatischer Eyecatcher',
  },
  beilagen: {
    label:       'Beilagen & Salate',
    subtitle:    'Das BBQ-Büfett',
    description: 'Das Büfett macht das Grillen vollständig. Von der knusprigen Grillkartoffel bis zum rauchigen Coleslaw — Beilagen, die eigenständig brillieren.',
    heroImage:   '/images/beilagen-salate-hero.jpg',
    heroAlt:     'BBQ-Beilagen-Büfett: Mac and Cheese in der Gusspfanne, Grillmais, Röstkartoffeln, Coleslaw und frische Salate',
  },
  'saucen-rubs': {
    label:       'Saucen, Rubs & Injektionen',
    subtitle:    'Die geheimen Waffen',
    description: 'Kansas City BBQ Sauce, Texas Dry Rub, Buttermilch-Injektionen — die Elemente, die ein gutes Gericht zur Legende machen. Laborprotokolle statt Schätzwerte.',
    heroImage:   '/images/articles/brisket-texas-smoked.webp',
    heroAlt:     'Texas Brisket mit Rub-Kruste frisch vom Smoker',
  },
  desserts: {
    label:       'Fire-Desserts',
    subtitle:    'Das süße Finale',
    description: 'Vom karamellisierten Pfirsich bis zur Flammen-Ananas — Desserts, die das offene Feuer als Instrument nutzen und die Glut bis zur letzten Kohle ausreizen.',
    heroImage:   '/images/tomahawk-hero.jpg',
    heroAlt:     'Offenes Feuer am Grill — Glut für Fire-Desserts',
  },
  'wine-spirits': {
    label:       'Wine, Spirits & Cocktails',
    subtitle:    'Die vierte Dimension des Grillens',
    description: 'Bordeaux zum Brisket, Islay Single Malt zum Ribeye, Smoked Old Fashioned am Grill. Pairing-Protokolle, Cocktail-Rezepte und die Wissenschaft dahinter — warum manche Kombinationen auf molekularer Ebene funktionieren.',
    seoDescription: 'Bordeaux zum Brisket, Islay Single Malt zum Ribeye, Smoked Old Fashioned am Grill: Pairing-Protokolle, Cocktail-Rezepte und die Wissenschaft dahinter.',
    heroImage:   '/images/wine-spirits-hero.webp',
    heroAlt:     'Whisky-Gläser auf dunklem Holz — warmes Amberlicht, rauchige Atmosphäre',
  },
};

// ─── Pairing-Daten (nur wine-spirits) ────────────────────────────────────────

const WEIN_PAIRING = [
  { cut: 'Ribeye (stark marmoriert)', wein: 'Cabernet Sauvignon', region: 'Napa / Bordeaux',    warum: 'Tannine binden Fett und resetzen die Textur nach jedem Bissen. Kirschnoten betonen die Maillard-Kruste.' },
  { cut: 'Brisket (Low & Slow)',       wein: 'Rioja Reserva',      region: 'Spanien, Tempranillo', warum: 'Erdig-würzige Noten treffen auf den Rauch. Tabak-Aromen des Fasses ergänzen die Smoker-Arbeit.' },
  { cut: 'Tomahawk',                   wein: 'Barolo DOCG',        region: 'Piemont, Nebbiolo',   warum: 'König zum König. Die harten Tannine des Nebbiolo brauchen die extreme Marmorierung — perfekte Balance.' },
  { cut: 'Pulled Pork',                wein: 'Zinfandel',          region: 'Sonoma / Primitivo',  warum: 'Üppige Beerenfrucht und dezente Würze harmonieren mit süß-würziger BBQ-Sauce.' },
  { cut: 'Asado / Short Ribs',         wein: 'Malbec',             region: 'Mendoza, Argentinien', warum: 'Südamerikanisches Erbe trifft Feuer. Dunkle Pflaume, Schokolade, cremige Tannine.' },
  { cut: 'Geräucherter Lachs',         wein: 'Albariño',           region: 'Rías Baixas, Spanien', warum: 'Salzige Mineralität und straffe Säure schneiden durch Fett und Rauch.' },
] as const;

const SPIRITS_PAIRING = [
  { destillat: 'Bourbon (Buffalo Trace)',     cut: 'Texas Brisket',      warum: 'Vanille und Karamell aus dem Eichenfass spiegeln die Rauch-Süße des 12-Stunden-Smokings.' },
  { destillat: 'Islay Single Malt (Laphroaig)', cut: 'Dry-Aged Ribeye',  warum: 'Torf trifft Maillard-Röstaromen. Die rauchige Intensität des Malts kalibriert sich exakt am Dry-Age-Umami.' },
  { destillat: 'Mezcal joven',                cut: 'Carne Asada / Asado', warum: 'Rauch²: Agave-Feuer und Holzkohle-Grill sind Referenz-Pairing. Beide arbeiten mit demselben Spektrum.' },
  { destillat: 'Rye Whiskey',                 cut: 'Short Ribs',         warum: 'Würze und Pfeffernoten schneiden durch Kollagen-Fett und ergänzen die langen Garungsaromen.' },
  { destillat: 'Irish Whiskey (Redbreast)',   cut: 'Pulled Pork',        warum: 'Fruchtig-cremig, nie dominant. Der irische Charakter unterstreicht ohne zu überlagern.' },
  { destillat: 'Cognac VSOP',                 cut: 'Entrecôte',          warum: 'Getrocknete Frucht, Vanille und Wärme ergänzen das klassische Bistro-Steak.' },
] as const;

const COCKTAILS = [
  {
    name:    'Smoked Old Fashioned',
    typ:     'Digestif',
    basis:   'Bourbon',
    rezept:  '6 cl Bourbon, 1 TL Demerara-Sirup, 2 Dash Angostura. Glas mit Kirschholz-Rauch befüllen, Stürzen. Rühren, über Eis servieren. Orange zeste.',
    tipp:    'Das Glas räuchern während das Steak rastet — der Rauch kühlt ab und setzt sich ab.',
  },
  {
    name:    'Bourbon Sour',
    typ:     'Aperitif',
    basis:   'Bourbon',
    rezept:  '5 cl Bourbon, 3 cl Zitronensaft, 2 cl einfacher Sirup, 1 Eiweiß. Shake dry, dann mit Eis. Doppelt abseihen, Angostura-Dot.',
    tipp:    'Säure und Protein öffnen die Geschmacksknospen — ideal 20 Min. vor dem ersten Cut.',
  },
  {
    name:    'Mezcal Negroni',
    typ:     'Pre-Dinner',
    basis:   'Mezcal',
    rezept:  '3 cl Mezcal, 3 cl Campari, 3 cl roter Vermouth. Rühren, Eis, Orangenscheibe.',
    tipp:    'Mezcal statt Gin verdoppelt die Rauch-Dimension. Wer es milder will, 50/50 Mezcal-Gin.',
  },
  {
    name:    'BBQ Bloody Mary',
    typ:     'Brunch-Grill',
    basis:   'Vodka',
    rezept:  '5 cl Vodka, 10 cl Tomatensaft, 1 cl Zitrone, Worcestershire, Tabasco, Salz, Pfeffer, geräuchertes Paprikapulver. Selleriesalz-Rand.',
    tipp:    'Mit einem geräucherten Rinderknochen als Rührer servieren — Spektakel inklusive.',
  },
  {
    name:    'Grill-Shrub Cooler',
    typ:     'Alkoholfrei',
    basis:   'Apfelessig-Shrub',
    rezept:  '3 cl Apfelessig-Himbeer-Shrub, 2 cl Limettensaft, 15 cl Mineralwasser, frische Minze, Gurke.',
    tipp:    'Shrub 3 Tage vorher ansetzen: 1:1:1 Früchte, Zucker, Essig kalt ziehen lassen.',
  },
] as const;

const SERVICE_REGELN = [
  { titel: 'Temperatur ist alles',      text: 'Rotwein bei 16–18 °C — im Sommer 25–30 Min. in den Weinkühler. Zu warm verliert er Struktur, zu kalt verbirgt er alle Aromen.' },
  { titel: 'Das richtige Glas',         text: 'Bordeaux-Glas für Cabernets und Malbecs: das große Volumen lässt Tannine sich entfalten. Universalglas verhindert 30 % der Aromaentfaltung.' },
  { titel: 'Reihenfolge beachten',      text: 'Aperitif → Wein zum Hauptgang → Digestif. Nie umgekehrt — Tannine nach Süßem schmecken bitter.' },
  { titel: 'Dekantieren: wann lohnt es',text: 'Junger Rotwein (< 5 Jahre): 45–60 Min. dekantieren. Alter Wein: maximal 20 Min. Spirituosen brauchen kein Dekantieren — aber Geduld beim Einschenken.' },
] as const;

// ─── Typen & generateStaticParams ────────────────────────────────────────────

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return Object.keys(KATEGORIEN).map((k) => ({ slug: k }));
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const kat = KATEGORIEN[params.slug];
  if (!kat) return {};
  const metaDescription = kat.seoDescription ?? kat.description;
  return {
    title: `${kat.label} — BBQ-Rezepte`,
    description: metaDescription,
    alternates: { canonical: `https://steakakademie.de/rezepte/${params.slug}` },
    openGraph: {
      title: `${kat.label}`,
      description: metaDescription,
      url: `https://steakakademie.de/rezepte/${params.slug}`,
      type: 'website',
      images: [
        {
          url: `https://steakakademie.de${kat.heroImage}`,
          width: 1200,
          height: 630,
          alt: kat.heroAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${kat.label}`,
      description: metaDescription,
      images: [`https://steakakademie.de${kat.heroImage}`],
    },
  };
}

// ─── Seite ────────────────────────────────────────────────────────────────────

export default async function RezeptKategoriePage(props: Props) {
  const params = await props.params;
  const kat = KATEGORIEN[params.slug];
  if (!kat) notFound();

  const isWine = params.slug === 'wine-spirits';

  const recipes = allRecipes
    .filter((r) => r.kategorie === params.slug)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .map(toCardData);

  const breadcrumbSch = breadcrumbSchema([
    { name: 'Rezepte', url: '/rezepte' },
    { name: kat.label, url: `/rezepte/${params.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSch) }} />
      <Header />

      <main>

        {/* ── Hero-Bild ──────────────────────────────────────────── */}
        <div className="relative w-full aspect-[3/1] overflow-hidden bg-surface-dark">
          <Image
            src={kat.heroImage}
            alt={kat.heroAlt}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(13,10,6,0.25) 0%, rgba(13,10,6,0.7) 100%)' }}
          />
        </div>

        {/* ── Hero-Text ──────────────────────────────────────────── */}
        <section className="border-b border-border-subtle">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-14">
            <nav className="flex items-center gap-1.5 text-xs font-sans text-text-muted mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-brand-gold transition-colors">Start</Link>
              <ChevronRight size={12} />
              <Link href="/rezepte" className="hover:text-brand-gold transition-colors">Rezepte</Link>
              <ChevronRight size={12} />
              <span className="text-text-secondary">{kat.label}</span>
            </nav>
            <span className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire block mb-3">
              {kat.subtitle}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-text-light leading-tight mb-4">
              {kat.label}
            </h1>
            <p className="font-body text-lg text-text-secondary leading-relaxed max-w-2xl">
              {kat.description}
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            WINE, SPIRITS & COCKTAILS — Editorial-Content
            Rendert nur für slug === 'wine-spirits'
        ══════════════════════════════════════════════════════════ */}
        {isWine && (
          <>

            {/* ── Philosophie ──────────────────────────────────── */}
            <section className="border-b border-border-subtle">
              <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="max-w-2xl">
                  <span
                    className="inline-block font-sans text-[10px] font-bold tracking-[0.16em] uppercase px-3 py-1 mb-5"
                    style={{ background: 'rgba(200,136,42,0.12)', color: '#C8882A', border: '1px solid rgba(200,136,42,0.25)' }}
                  >
                    Die Grundidee
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-text-light mb-5">
                    Das Getränk als vierte Dimension
                  </h2>
                  <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
                    Grillen hat drei Dimensionen: Fleisch, Hitze, Rauch. Die meisten hören hier auf.
                    Das ist ein Fehler — denn das Getränk in der Hand entscheidet, ob ein gutes Steak
                    zu einem unvergesslichen Erlebnis wird.
                  </p>
                  <p className="font-body text-base text-text-secondary leading-relaxed mb-4">
                    Tannine in einem Cabernet Sauvignon binden buchstäblich die Fettmoleküle im Ribeye —
                    das Glas resettet die Textur nach jedem Bissen, als wäre es der erste. Ein Islay Single
                    Malt spiegelt die Maillard-Röstaromen des Dry-Aged-Steaks, weil Torf und Karamellisierung
                    denselben chemischen Verbindungsklassen entstammen. Das ist keine Kulinarik-Romantik.
                    Das ist Chemie.
                  </p>
                  <p className="font-body text-base text-text-secondary leading-relaxed">
                    Diese Sektion erklärt, warum welche Kombination funktioniert — und gibt konkrete
                    Pairing-Protokolle für Wein, Spirits und Cocktails, die am Grill ihre volle Wirkung entfalten.
                  </p>
                </div>
              </div>
            </section>

            {/* ── Wein-Pairing ─────────────────────────────────── */}
            <section className="border-b border-border-subtle">
              <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <h2 className="font-serif text-2xl font-bold text-text-light mb-2">
                  Wein-Pairing: Cut für Cut
                </h2>
                <p className="font-body text-sm text-text-secondary mb-8 max-w-2xl">
                  Keine Pauschalaussagen — jeder Cut hat eine andere Fett- und Proteinstruktur,
                  die spezifische Tanninlevels und Säurewerte verlangt.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(200,136,42,0.25)' }}>
                        {['Cut', 'Wein', 'Herkunft', 'Warum es funktioniert'].map((h) => (
                          <th
                            key={h}
                            className="text-left font-sans text-[10px] font-bold tracking-[0.14em] uppercase pb-3 pr-6"
                            style={{ color: '#C8882A' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {WEIN_PAIRING.map((row, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: '1px solid rgba(200,136,42,0.08)' }}
                        >
                          <td className="font-sans text-xs font-bold text-text-light py-3 pr-6 whitespace-nowrap">
                            {row.cut}
                          </td>
                          <td className="font-serif text-sm text-brand-gold py-3 pr-6 whitespace-nowrap">
                            {row.wein}
                          </td>
                          <td className="font-sans text-xs text-text-muted py-3 pr-6 whitespace-nowrap">
                            {row.region}
                          </td>
                          <td className="font-body text-sm text-text-secondary py-3 leading-relaxed">
                            {row.warum}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ── Spirits-Pairing ──────────────────────────────── */}
            <section className="border-b border-border-subtle">
              <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <h2 className="font-serif text-2xl font-bold text-text-light mb-2">
                  Whisky, Mezcal & Co.: Spirits am Grill
                </h2>
                <p className="font-body text-sm text-text-secondary mb-8 max-w-2xl">
                  Destillate haben eine andere Aufgabe als Wein — sie ergänzen durch Aromatik,
                  nicht durch Struktur. Die Faustregel: Rauch zu Rauch, Süße zu Karamell, Würze zu Fett.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(200,136,42,0.25)' }}>
                        {['Destillat', 'Cut / Gericht', 'Warum es funktioniert'].map((h) => (
                          <th
                            key={h}
                            className="text-left font-sans text-[10px] font-bold tracking-[0.14em] uppercase pb-3 pr-6"
                            style={{ color: '#C8882A' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SPIRITS_PAIRING.map((row, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: '1px solid rgba(200,136,42,0.08)' }}
                        >
                          <td className="font-sans text-xs font-bold text-text-light py-3 pr-6 whitespace-nowrap">
                            {row.destillat}
                          </td>
                          <td className="font-sans text-xs text-brand-gold py-3 pr-6 whitespace-nowrap">
                            {row.cut}
                          </td>
                          <td className="font-body text-sm text-text-secondary py-3 leading-relaxed">
                            {row.warum}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ── Cocktails ────────────────────────────────────── */}
            <section className="border-b border-border-subtle">
              <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <h2 className="font-serif text-2xl font-bold text-text-light mb-2">
                  5 Cocktails, die am Grill ihren Sinn ergeben
                </h2>
                <p className="font-body text-sm text-text-secondary mb-10 max-w-2xl">
                  Kein Umbrella-Drink, kein Zucker-Wasser. Diese Cocktails wurden für den
                  Grillkontext entwickelt — Timing, Aromatik und Alkohollevel passen zum Ablauf eines BBQ-Abends.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {COCKTAILS.map((c) => (
                    <div
                      key={c.name}
                      className="border flex flex-col"
                      style={{ borderColor: 'rgba(200,136,42,0.18)', background: '#1A1209' }}
                    >
                      <div
                        className="px-5 py-3 border-b flex items-center justify-between"
                        style={{ borderColor: 'rgba(200,136,42,0.12)' }}
                      >
                        <h3 className="font-serif text-base font-bold text-text-light">{c.name}</h3>
                        <span
                          className="font-sans text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-0.5"
                          style={{ background: 'rgba(200,136,42,0.12)', color: '#C8882A', border: '1px solid rgba(200,136,42,0.25)' }}
                        >
                          {c.typ}
                        </span>
                      </div>
                      <div className="px-5 py-4 flex flex-col flex-1 gap-3">
                        <p className="font-sans text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: '#C8882A' }}>
                          Basis: {c.basis}
                        </p>
                        <p className="font-body text-sm text-text-secondary leading-relaxed">{c.rezept}</p>
                        <p
                          className="font-sans text-xs text-text-muted border-t pt-3 leading-relaxed"
                          style={{ borderColor: 'rgba(200,136,42,0.1)' }}
                        >
                          <strong className="text-text-light">Grill-Tipp:</strong> {c.tipp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Service-Grundregeln ──────────────────────────── */}
            <section className="border-b border-border-subtle">
              <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <h2 className="font-serif text-2xl font-bold text-text-light mb-8">
                  4 Service-Grundregeln, die niemand erklärt
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {SERVICE_REGELN.map((r, i) => (
                    <div
                      key={i}
                      className="border px-5 py-5"
                      style={{ borderColor: 'rgba(200,136,42,0.18)', background: '#1A1209' }}
                    >
                      <h3 className="font-sans text-xs font-bold tracking-[0.12em] uppercase mb-2" style={{ color: '#C8882A' }}>
                        {String(i + 1).padStart(2, '0')} — {r.titel}
                      </h3>
                      <p className="font-body text-sm text-text-secondary leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </>
        )}

        {/* ── Rezept-Grid — helle Editorial-Zone (Texas-Monthly) ─── */}
        {recipes.length === 0 ? (
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14">
            {isWine ? (
              /* wine-spirits: kleinerer Hinweis, da die Seite bereits Content hat */
              <div
                className="border px-6 py-8 flex items-start gap-4"
                style={{ borderColor: 'rgba(200,136,42,0.2)', background: 'rgba(200,136,42,0.04)' }}
              >
                <div>
                  <p className="font-serif text-lg text-text-light mb-1">Rezepte & Pairing-Protokolle in Arbeit</p>
                  <p className="font-body text-sm text-text-muted leading-relaxed">
                    Die ersten detaillierten Cocktail-Rezepte und Wein-Pairing-Protokolle werden gerade
                    geschrieben und am Grill getestet. Der theoretische Rahmen oben gilt bereits heute.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 border border-border-subtle">
                <p className="font-serif text-2xl text-text-light mb-3">Rezepte in Arbeit</p>
                <p className="font-body text-sm text-text-muted max-w-md mx-auto">
                  Diese Kategorie wird gerade mit Feldtest-Protokollen gefüllt. Alle Rezepte werden vor
                  Veröffentlichung mehrfach getestet.
                </p>
                <Link
                  href="/rezepte"
                  className="inline-flex items-center gap-1 mt-6 text-xs font-sans font-bold tracking-[0.12em] uppercase text-brand-gold hover:text-brand-fire transition-colors"
                >
                  Alle Rezepte ansehen <ChevronRight size={13} />
                </Link>
              </div>
            )}
          </section>
        ) : (
          <div className="reading-light">
            {isWine && (
              <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-12 -mb-4">
                <h2 className="font-serif text-xl font-bold" style={{ color: '#241A12' }}>
                  Rezepte & Pairing-Protokolle
                </h2>
              </div>
            )}
            <RecipeExplorer recipes={recipes} activeKategorie={params.slug} />
          </div>
        )}

        {/* ── Vollstaendiges Linkverzeichnis (serverseitig, crawlbar) ────── */}
        <RecipeIndex kategorie={params.slug} />

      </main>

      <Footer />
    </>
  );
}
