import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Flame, Menu, Search, Newspaper, Award } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/affiliate/ProductCard';
import DiplomaProgressSection from '@/components/home/DiplomaProgressSection';
import PlattformPuls from '@/components/home/PlattformPuls';
import FrischSaisonal from '@/components/home/FrischSaisonal';
import ToolBoxes from '@/components/home/ToolBoxes';
import { SecondaryFeature, CompactItem } from '@/components/news/NewsLayout';
import { getRecommendedProducts } from '@/lib/products';
import { getPlattformPuls, anzahlDiplomLektionen } from '@/lib/plattform-puls';
import { getFrischSaisonal } from '@/lib/frisch-saisonal';
import { getNewsItems } from '@/lib/bbq-news';
import { STARTSEITEN_ARTIKEL } from '@/lib/startseiten-artikel';
import type { ArticleMeta } from '@/types';

export const revalidate = 3600; // wie / und /bbq-news (28.09.2026)

// ─────────────────────────────────────────────────────────────────────────────
// Startseiten-Variante B — "Editorial Ember" (A/B-Test)
//
// NEU AUFGEBAUT 26.08.2026 (Uwe): Die erste Fassung war nur ein CSS-Layer
// (.theme-ember) über der dunklen Seite und sah entsprechend kaputt aus.
// Diese Fassung ist das ECHTE Editorial-Layout nach der Texas-Monthly-
// Referenz (C:\Dev\texasmonthly-ref, ideas.md "Editorial Ember"):
//   · Cremeweiß #FAFAF7, Tinte #1C1512, Glut-Orange #C2440F als Akzent
//   · zentrierte Serif-Wortmarke, dünne Haarlinien, Versalien-Kategorielabels
//   · asymmetrisches 3-Spalten-Hero-Grid (55/25/20) wie Texas Monthly
// Datenquelle: dieselben Artikel wie Variante A (Export aus ../page).
//
// DOKTRIN (CLAUDE.md Regel 8) gilt auch hier: Inhalt zuerst — das Hero-Grid
// und die Rubriken stehen VOR dem Mitglieder-CTA, der Diplom-Teaser weiter
// unten. Besucher erreichen diese Route nur über den Middleware-Rewrite
// (Cookie sa_ab_home=b, Schalter AB_HOME_ENABLED=1); direkt aufgerufen ist
// sie noindex mit Canonical auf "/".
// ─────────────────────────────────────────────────────────────────────────────

// 'only light' ist der dokumentierte Opt-out gegen erzwungenes Auto-Darkening
// (Chrome Android "Automatisches dunkles Design", Samsung Internet): ohne ihn
// faerbt der Browser Creme #FAFAF7 + Ember in Brauntoene um (Uwe-Befund
// 28.08.2026, Handy). Gilt nur fuer diese Route; Variante A (dunkel) bleibt
// unangetastet.
export const viewport: Viewport = {
  colorScheme: 'only light',
};

export const metadata: Metadata = {
  // `absolute` verhindert das Root-Template ' | Steakakademie' — unter der
  // Adresse '/' stand sonst ein doppelter Markenname im Tab.
  title: { absolute: 'Steakakademie — BBQ Wissen, Cuts & Grillmeister-Diplome' },
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://steakakademie.de/' },
};

// Editorial-Ember-Palette (ideas.md, Idee 1).
// EMBER: #C2440F statt Referenz-#D4521A — Original misst nur 4,00:1 auf Creme
// und 4,18:1 unter Weiß (WCAG-AA-Fail für Kleintext). #C2440F: 4,87 / 5,09.
const INK = '#1C1512';
const PAPER = '#FAFAF7';
const EMBER = '#C2440F';
const HAIR = '#E3DCCE';
const MUT = '#5D554B';

const NAV = [
  { label: 'Grilltechniken', href: '/methoden' },
  { label: 'Cuts & Fleischkunde', href: '/cuts' },
  { label: 'Wissen', href: '/wissen' },
  { label: 'Rezepte', href: '/rezepte' },
  { label: 'Ausrüstung', href: '/kategorie/ausruestung' },
  { label: 'Community', href: '/rezepte/community' },
  { label: 'USA-Expedition', href: '/usa-expedition' },
  // Uwe, 30.08.2026: ausgebaut, wie in Header.tsx und Footer.tsx — Begruendung
  // steht dort. /home-b fuehrt eine EIGENE Navigationsliste; ohne diese Zeile
  // haette Variante B den Eintrag behalten, waehrend Variante A ihn verliert.
  // WIEDEREINSETZEN: hier UND in Header.tsx/Footer.tsx gemeinsam.
  // { label: 'Ehrliches System', href: '/ehrliches-system' },
];

function CategoryLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-sans text-[0.7rem] font-bold uppercase"
      style={{ color: EMBER, letterSpacing: '0.12em' }}
    >
      {children}
    </span>
  );
}

function Byline({ a, className = '' }: { a: ArticleMeta; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-sans ${className}`} style={{ color: MUT }}>
      <span>{a.formattedDate}</span>
      <span>—</span>
      <span>{a.author}</span>
    </div>
  );
}

function HeroCard({ a }: { a: ArticleMeta }) {
  return (
    <article className="group">
      <Link href={a.url}>
        <div className="overflow-hidden mb-4">
          <Image
            src={a.image} alt={a.imageAlt ?? a.title} width={880} height={550} priority
            className="w-full aspect-[16/10] object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
        <CategoryLabel>{a.category}</CategoryLabel>
        <h2
          className="font-serif text-3xl sm:text-4xl font-bold mt-2 mb-3 leading-tight transition-colors duration-150 group-hover:text-[#C2440F]"
          style={{ color: INK }}
        >
          {a.title}
        </h2>
        <p className="font-sans text-sm leading-relaxed mb-3 line-clamp-3" style={{ color: '#443D34' }}>
          {a.excerpt}
        </p>
        <Byline a={a} />
      </Link>
    </article>
  );
}

function SmallCard({ a }: { a: ArticleMeta }) {
  return (
    <article className="group flex gap-3 items-start">
      <Link href={a.url} className="shrink-0">
        <div className="overflow-hidden w-20 h-20">
          <Image
            src={a.image} alt={a.imageAlt ?? a.title} width={160} height={160}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <CategoryLabel>{a.category}</CategoryLabel>
        <Link href={a.url}>
          <h4
            className="font-serif text-sm font-bold mt-0.5 leading-snug line-clamp-3 transition-colors duration-150 group-hover:text-[#C2440F]"
            style={{ color: INK }}
          >
            {a.title}
          </h4>
        </Link>
        <p className="text-xs font-sans mt-1" style={{ color: MUT }}>{a.author}</p>
      </div>
    </article>
  );
}

function MediumCard({ a }: { a: ArticleMeta }) {
  return (
    <article className="group">
      <Link href={a.url}>
        <div className="overflow-hidden mb-3">
          <Image
            src={a.image} alt={a.imageAlt ?? a.title} width={560} height={420}
            className="w-full aspect-[4/3] object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
        <CategoryLabel>{a.category}</CategoryLabel>
        <h3
          className="font-serif text-xl font-bold mt-1 mb-2 leading-snug transition-colors duration-150 group-hover:text-[#C2440F]"
          style={{ color: INK }}
        >
          {a.title}
        </h3>
        <p className="font-sans text-sm leading-relaxed mb-2 line-clamp-2" style={{ color: '#443D34' }}>
          {a.excerpt}
        </p>
        <Byline a={a} />
      </Link>
    </article>
  );
}

// Dunkles Vollbreiten-Band. Die interaktiven Bloecke (Werkzeuge, Plattform-Puls,
// Diplom-Stufen, BBQ-News) sind fuer den dunklen Grund gebaut. Sie hier in Creme
// zu duplizieren hiesse, jede kuenftige Aenderung zweimal zu machen — und genau
// dieses Nachfaerben liess die erste Ember-Fassung kaputt aussehen. Ein
// Editorial-Layout vertraegt dunkle Einschuebe; sie sind Absicht, kein Ausrutscher.
function DarkBand({ children }: { children: React.ReactNode }) {
  return <div style={{ background: INK }}>{children}</div>;
}

export default async function HomeVariantB() {
  const recommendedProducts = getRecommendedProducts(3);
  const puls = getPlattformPuls();
  const frischSaisonal = getFrischSaisonal();
  const news = await getNewsItems({
    ausschliessen: [
      ...STARTSEITEN_ARTIKEL.slice(0, 5).map((a) => a.url),
      ...puls.latest.map((p) => p.url),
    ],
  });
  const newsLead = news[0];
  const newsCompact = news.slice(1, 4);

  const hero = STARTSEITEN_ARTIKEL[0];
  const side = STARTSEITEN_ARTIKEL.slice(1, 4);
  const feature = STARTSEITEN_ARTIKEL[4];
  const sections = [
    { title: 'Cuts & Fleischkunde', href: '/cuts', items: STARTSEITEN_ARTIKEL.filter((a) => a.categorySlug === 'cuts') },
    { title: 'Grilltechniken', href: '/methoden', items: STARTSEITEN_ARTIKEL.filter((a) => a.categorySlug === 'grilltechniken') },
    { title: 'Wissen & Wissenschaft', href: '/wissen', items: STARTSEITEN_ARTIKEL.filter((a) => a.categorySlug === 'wissen') },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: PAPER }}>

      {/* Der globale Grund gehoert Variante A: globals.css legt einen dunkel-
          braunen Radial-Gradient auf <html> (#3E2D1C -> #120C07), <body> ist
          transparent und body::before legt einen Ember-Glow darueber. Dieser
          Grund scheint auf /home-b ueberall dort durch, wo das Editorial-Layout
          nicht selbst malt — am Desktop kaum sichtbar, am Handy als deutlicher
          Braunstich (Uwe-Befund 28.08.2026; gemessen: body-BG rgb(23,16,11)
          trotz color-scheme 'only light'). Diese Route setzt den Grund deshalb
          explizit auf Creme und schaltet den Glow ab. Scoped auf /home-b —
          Variante A bleibt unberuehrt. */}
      <style>{`
        html { background: ${PAPER} !important; }
        body { background: ${PAPER} !important; color: ${INK}; }
        body::before { display: none !important; }
      `}</style>


      {/* ── KOPF: zentrierte Wortmarke, Haarlinie, Versalien-Navigation ── */}
      <header className="border-b sticky top-0 z-50" style={{ background: '#FFFFFF', borderColor: HAIR }}>
        <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/menue"
              aria-label="Menü öffnen"
              className="w-8 h-8 flex items-center justify-center text-white transition-colors"
              style={{ background: EMBER }}
            >
              <Menu size={16} />
            </Link>
            <div className="flex-1 flex justify-center">
              <Link
                href="/"
                className="font-serif font-black text-3xl sm:text-4xl select-none transition-colors hover:text-[#C2440F]"
                style={{ color: INK, letterSpacing: '-0.02em' }}
              >
                Steakakademie
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/suche" aria-label="Suche" className="p-2 transition-colors hover:text-[#C2440F]" style={{ color: INK }}>
                <Search size={18} />
              </Link>
              <Link
                href="/diplome"
                className="font-sans text-xs font-bold tracking-widest uppercase px-3 py-2 text-white transition-opacity hover:opacity-90"
                style={{ background: EMBER }}
              >
                Diplome
              </Link>
            </div>
          </div>
        </div>
        <nav className="border-t" style={{ borderColor: HAIR }} aria-label="Rubriken">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex items-center lg:justify-center gap-6 overflow-x-auto h-11 whitespace-nowrap">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase transition-colors hover:text-[#C2440F]"
                    style={{ color: '#443D34' }}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* SEO-H1 — unsichtbar fuers Auge, das Layout selbst ist die Bühne */}
        <h1 className="sr-only">Steakakademie — BBQ Wissen, Cuts &amp; Grillmeister-Diplome</h1>

        {/* ── HERO: asymmetrisches 3-Spalten-Grid (55/25/20) ── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[55%_25%_20%] gap-6 lg:gap-8">
            <div className="lg:border-r lg:pr-8" style={{ borderColor: HAIR }}>
              <HeroCard a={hero} />
            </div>
            <div className="lg:border-r lg:pr-8" style={{ borderColor: HAIR }}>
              <div className="space-y-5">
                {side.map((a, i) => (
                  <div key={a.slug}>
                    <SmallCard a={a} />
                    {i < side.length - 1 && <div className="border-b mt-5" style={{ borderColor: HAIR }} />}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <article className="group">
                <Link href={feature.url}>
                  <div className="overflow-hidden mb-3">
                    <Image
                      src={feature.image} alt={feature.imageAlt ?? feature.title} width={320} height={240}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                  <CategoryLabel>{feature.category}</CategoryLabel>
                  <h3
                    className="font-serif text-lg font-bold mt-1 mb-2 leading-snug transition-colors group-hover:text-[#C2440F]"
                    style={{ color: INK }}
                  >
                    {feature.title}
                  </h3>
                  <Byline a={feature} className="mb-2" />
                  <p className="font-body text-sm leading-relaxed line-clamp-5" style={{ color: '#443D34' }}>
                    {feature.excerpt}
                  </p>
                  <span className="inline-block mt-3 text-xs font-sans font-semibold hover:underline" style={{ color: EMBER }}>
                    Weiterlesen →
                  </span>
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* ── RUBRIKEN-SEKTIONEN: fette schwarze Linie, 3er-Grid ── */}
        {sections.map((s) => s.items.length > 0 && (
          <section key={s.href} className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <Link href={s.href}>
                <h2 className="font-serif text-2xl font-bold transition-colors hover:text-[#C2440F]" style={{ color: INK }}>
                  {s.title}
                </h2>
              </Link>
              <Link
                href={s.href}
                className="flex items-center gap-1 text-xs font-sans font-semibold tracking-wide uppercase hover:underline"
                style={{ color: EMBER }}
              >
                Alle ansehen <ChevronRight size={14} />
              </Link>
            </div>
            <div className="border-t-2 mb-6 mt-2" style={{ borderColor: INK }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {s.items.slice(0, 3).map((a) => <MediumCard key={a.slug} a={a} />)}
            </div>
          </section>
        ))}

        {/* ── WERKZEUGE — Cut-Generator · Foodpairing · Rezept-Schmiede ── */}
        <DarkBand>
          <ToolBoxes />
        </DarkBand>

        {/* ── LEADMAGNET: Spickzettel (Inhalt vor Angebot — Regel 8) ── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5" style={{ borderColor: HAIR, background: '#FFFFFF' }}>
            <div>
              <CategoryLabel>Gratis-Download</CategoryLabel>
              <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1 mb-1" style={{ color: INK }}>
                Der Kerntemperatur-Spickzettel
              </h2>
              <p className="font-sans text-sm" style={{ color: '#443D34' }}>
                Alle Garstufen für Rind, Schwein, Geflügel &amp; Fisch auf einer Seite — fürs Grill-Regal.
              </p>
            </div>
            <Link
              href="/newsletter"
              className="shrink-0 font-sans text-xs font-bold tracking-widest uppercase px-6 py-3 text-white transition-opacity hover:opacity-90"
              style={{ background: EMBER }}
            >
              Jetzt sichern
            </Link>
          </div>
        </section>

        {/* ── PLATTFORM-PULS — echte, wachsende Inhaltszahlen ── */}
        <DarkBand>
          <PlattformPuls data={puls} />
        </DarkBand>

        {/* ── FRISCH & SAISONAL — rotierendes Spotlight.
            Bringt seinen eigenen hellen Grund mit (.reading-light) und passt
            damit ohne Zutun in das Editorial-Layout. ── */}
        <FrischSaisonal data={frischSaisonal} />

        {/* ── MANIFEST — Auszeichnungszitat, echt in Ember gesetzt ── */}
        <section className="max-w-[820px] mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-center gap-5 mb-8">
            <div className="h-px flex-1" style={{ background: HAIR }} />
            <span className="font-sans text-[10px] tracking-[0.35em] uppercase" style={{ color: MUT }}>Manifest</span>
            <div className="h-px flex-1" style={{ background: HAIR }} />
          </div>
          <blockquote
            className="font-serif text-2xl sm:text-3xl lg:text-[2rem] font-bold italic leading-[1.4] text-center"
            style={{ color: INK }}
          >
            Feuer ist Geduld. Rauch ist Zeit.
            <br />
            Das perfekte Steak ist keine Technik —
            <br />
            es ist ein Standpunkt.
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-5">
            <div className="h-px w-16" style={{ background: EMBER }} />
            <cite className="font-sans text-xs tracking-[0.22em] uppercase not-italic" style={{ color: MUT }}>
              Marco, der Pitmaster
            </cite>
          </div>
        </section>

        {/* ── DIPLOM-TEASER — bewusst weit unten (Regel 8: Inhalt vor Angebot).
            Nutzt dieselbe Komponente wie Variante A: echte Medaillen-Bilder
            statt der Emoji-Reihe, die hier vorher stand. ── */}
        <DarkBand>
          <DiplomaProgressSection />
        </DarkBand>

        {/* ── BBQ-NEWS ── */}
        <DarkBand>
          <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between">
              <Link href="/bbq-news" className="flex items-center gap-3 group">
                <Newspaper size={20} style={{ color: '#E8A34C' }} />
                <h2 className="font-serif text-2xl font-bold text-white transition-colors group-hover:text-[#E8A34C]">
                  BBQ-News
                </h2>
              </Link>
              <Link
                href="/bbq-news"
                className="flex items-center gap-1 text-xs font-sans font-bold tracking-widest uppercase hover:underline"
                style={{ color: '#E8A34C' }}
              >
                Alle News <ChevronRight size={14} />
              </Link>
            </div>
            <div className="border-t-2 mt-2 mb-3" style={{ borderColor: 'rgba(255,255,255,0.22)' }} />
            <p className="text-sm font-sans text-white/55 mb-8">
              Aus der Grillszene USA &amp; Deutschland — kuratiert, nicht kopiert.
            </p>
            {newsLead && (
              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12">
                <SecondaryFeature item={newsLead} />
                {newsCompact.length > 0 && (
                  <div>
                    {newsCompact.map((it) => <CompactItem key={it.id} item={it} />)}
                  </div>
                )}
              </div>
            )}
          </section>
        </DarkBand>

        {/* ── AUSWAHL — weisse Insel im Creme-Grund ── */}
        {recommendedProducts.length > 0 && (
          <section className="py-12 my-4" style={{ background: '#FFFFFF', borderTop: `1px solid ${HAIR}`, borderBottom: `1px solid ${HAIR}` }}>
            <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award size={20} style={{ color: EMBER }} />
                  <h2 className="font-serif text-2xl font-bold" style={{ color: INK }}>Unsere Auswahl</h2>
                </div>
                <Link
                  href="/kategorie/ausruestung"
                  className="flex items-center gap-1 text-xs font-sans font-bold tracking-widest uppercase hover:underline"
                  style={{ color: EMBER }}
                >
                  Alle Vergleiche <ChevronRight size={14} />
                </Link>
              </div>
              <div className="border-t-2 mt-2 mb-3" style={{ borderColor: INK }} />
              <p className="text-sm font-sans mb-8" style={{ color: MUT }}>
                Redaktionelle Auswahl nach Herstellerangaben — kein eigener Gerätetest. Affiliate-Links sind als Anzeige gekennzeichnet.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="default" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── NEUESTE ARTIKEL + SEITENLEISTE ── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="font-serif text-2xl font-bold" style={{ color: INK }}>Neueste Artikel</h2>
          <div className="border-t-2 mb-6 mt-2" style={{ borderColor: INK }} />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            <div>
              {/* slice(5): Position 0–4 stehen bereits im Hero-Grid — sonst
                  doppelt die Liste sichtbar dieselben Artikel (Referenz: latest[4..10]) */}
              {STARTSEITEN_ARTIKEL.slice(5).map((a) => (
                <article key={a.slug} className="group flex gap-4 items-start py-4 border-b last:border-0" style={{ borderColor: HAIR }}>
                  <Link href={a.url} className="shrink-0">
                    <div className="overflow-hidden w-28 h-20">
                      <Image
                        src={a.image} alt={a.imageAlt ?? a.title} width={224} height={160}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <CategoryLabel>{a.category}</CategoryLabel>
                    <Link href={a.url}>
                      <h4 className="font-serif text-base font-bold mt-0.5 leading-snug line-clamp-2 transition-colors group-hover:text-[#C2440F]" style={{ color: INK }}>
                        {a.title}
                      </h4>
                    </Link>
                    <Byline a={a} className="mt-1" />
                  </div>
                </article>
              ))}
            </div>
            <aside className="space-y-6">
              <div>
                <div className="border-t-2" style={{ borderColor: INK }}>
                  <h3 className="font-serif text-lg font-bold pt-3 mb-3" style={{ color: INK }}>Rubriken</h3>
                </div>
                <ul>
                  {NAV.slice(0, 5).map((n) => (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        className="flex items-center justify-between py-2 border-b text-sm font-sans transition-colors hover:text-[#C2440F] group"
                        style={{ borderColor: HAIR, color: '#443D34' }}
                      >
                        {n.label}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: EMBER }} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5" style={{ background: '#F4F0E8' }}>
                <div className="border-t-2" style={{ borderColor: EMBER }}>
                  <h3 className="font-serif text-lg font-bold pt-3 mb-2" style={{ color: INK }}>Mitglied werden</h3>
                </div>
                <p className="text-xs font-sans mb-3" style={{ color: '#443D34' }}>
                  Kostenloser Zugang — dein Diplom-Fortschritt wird gespeichert. Kein Abo, keine Kreditkarte.
                </p>
                <Link
                  href="/auth/login"
                  className="block text-center text-white text-xs font-bold tracking-widest uppercase font-sans py-2.5 transition-opacity hover:opacity-90"
                  style={{ background: EMBER }}
                >
                  Werde SteakAdemiker →
                </Link>
              </div>
            </aside>
          </div>
        </section>
        {/* ── ZAHLEN-BAND ── */}
        <section className="py-12" style={{ borderTop: `1px solid ${HAIR}` }}>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { stat: String(anzahlDiplomLektionen()), label: 'Diplom-Lektionen — Bronze bis Meister' },
                { stat: '30',   label: 'Jahre Lehrerfahrung hinter der Methodik' },
                { stat: '100%', label: 'Affiliate-transparent' },
                { stat: '2026', label: 'Inhalte aktuell' },
              ].map(({ stat, label }) => (
                <div key={label}>
                  <p className="font-serif text-4xl sm:text-5xl font-black" style={{ color: EMBER }}>{stat}</p>
                  <p className="text-xs font-sans mt-2 tracking-wide" style={{ color: MUT }}>{label}</p>
                </div>
              ))}
            </div>
            <p className="text-center mt-8">
              <Link
                href="/ueber-uns"
                className="text-xs font-sans font-bold tracking-widest uppercase hover:underline"
                style={{ color: EMBER }}
              >
                Wer hinter der Akademie steht →
              </Link>
            </p>
          </div>
        </section>

        {/* ── SCHLUSS-CTA — Wiederholung der EINEN Haupt-Aktion ── */}
        <section style={{ background: INK }}>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <div className="flex items-center gap-2 justify-center mb-3">
              <Flame size={16} style={{ color: '#E8A34C' }} />
              <span className="font-sans text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: '#E8A34C' }}>
                Grillmeister-Ausbildung
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">
              Bereit für dein erstes Diplom?
            </h2>
            <p className="font-sans text-base text-white/60 max-w-xl mx-auto mb-7">
              Kostenlos registrieren, Fortschritt speichern — von Bronze bis Meister.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 font-sans font-bold text-sm uppercase tracking-wide text-white transition-opacity hover:opacity-90"
              style={{ background: EMBER }}
            >
              Werde SteakAdemiker — kostenlos <ChevronRight size={16} />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
