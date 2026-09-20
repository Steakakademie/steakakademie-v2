import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Flame, BookOpen, Thermometer, Award, Newspaper } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ArticleCard from '@/components/article/ArticleCard';
import ProductCard from '@/components/affiliate/ProductCard';
import DiplomaProgressSection from '@/components/home/DiplomaProgressSection';
import PlattformPuls from '@/components/home/PlattformPuls';
import FrischSaisonal from '@/components/home/FrischSaisonal';
import ToolBoxes from '@/components/home/ToolBoxes';
import { FREE_LIMIT as AROMA_FREE_LIMIT } from '@/lib/aroma-matcher/data';
import NewsletterSignup from '@/components/ui/NewsletterSignup';
import { SecondaryFeature, CompactItem } from '@/components/news/NewsLayout';
import { getRecommendedProducts } from '@/lib/products';
import { getPlattformPuls } from '@/lib/plattform-puls';
import { getFrischSaisonal } from '@/lib/frisch-saisonal';
import { getNewsItems } from '@/lib/bbq-news';
import { STARTSEITEN_ARTIKEL } from '@/lib/startseiten-artikel';

export const revalidate = 86400;

export const metadata: Metadata = {
  // `absolute` wie in /home-b: der Markenname ist der Titel. Ohne das haengt
  // das Root-Template ein zweites " | Steakakademie" an die wichtigste
  // Seite der Domain.
  title: { absolute: 'Steakakademie — BBQ Wissen, Cuts & Grillmeister-Diplome' },
  description:
    'Die methodisch tiefste BBQ-Wissensplattform auf Deutsch. Cuts, Grilltechniken, Thermometer-Tests und Grillmeister-Diplome für ernsthafte Hobbygriller.',
  alternates: { canonical: '/' },
};

const CATEGORY_SECTIONS = [
  { title: 'Grilltechniken',      slug: 'grilltechniken', articles: STARTSEITEN_ARTIKEL.filter((a) => a.categorySlug === 'grilltechniken') },
  { title: 'Cuts & Fleischkunde', slug: 'cuts',           articles: STARTSEITEN_ARTIKEL.filter((a) => a.categorySlug === 'cuts') },
  { title: 'Wissen & Wissenschaft', slug: 'wissen',       articles: STARTSEITEN_ARTIKEL.filter((a) => a.categorySlug === 'wissen') },
];

export default async function HomePage() {
  const recommendedProducts = getRecommendedProducts(3);
  const heroArticle    = STARTSEITEN_ARTIKEL[0];
  const sideArticles   = STARTSEITEN_ARTIKEL.slice(1, 4);
  const latestArticles = STARTSEITEN_ARTIKEL.slice(2);

  // Plattform-Puls: echte, automatisch wachsende Content-Zahlen + frisch dazugekommene Inhalte
  const puls = getPlattformPuls();
  const frischSaisonal = getFrischSaisonal();

  // BBQ-News-Teaser aus derselben Quelle wie /bbq-news (kein hardcoded Drift)
  const news        = await getNewsItems();
  const newsLead    = news[0];
  const newsCompact = news.slice(1, 4);

  return (
    <>
      <Header />

      <main>

        {/* ── VALUE-PROP-BAND — Kopfbereich der Startseite (Uwe, 02.09.2026):
            H1 + Rubriken-Einstieg, OHNE Mitglieder-Button. Der Button steht
            bewusst weiter unten (MITGLIEDER-CTA) — „nicht auf den ersten Blick".
            Reihenfolge ist Doktrin, siehe CLAUDE.md Regel 8 + Build-Gate. ── */}
        <section
          className="border-b border-brand-gold/15"
          style={{
            background:
              'radial-gradient(125% 105% at 50% 118%, rgba(232,80,24,0.34) 0%, rgba(232,80,24,0.10) 38%, rgba(200,136,42,0.05) 58%, transparent 72%), linear-gradient(180deg, #20130A 0%, #130C07 100%)',
          }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-brand-fire mb-4">
              <Flame size={12} /> Die methodisch tiefste BBQ-Plattform auf Deutsch
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-light leading-[1.1] mb-4 max-w-3xl mx-auto">
              Wer das perfekte Steak will, wird hier zum{' '}
              <span className="text-brand-gold">SteakAdemiker</span>.
            </h1>
            <p className="font-body text-base sm:text-lg text-text-light/65 leading-relaxed max-w-2xl mx-auto mb-7">
              In 5 Rubriken vom Anfänger zum Pitmaster — Fleischkunde, Grilltechniken, Wissen,
              Rezepte, Ausrüstung. Methodisch, geprüft, ohne Bullshit.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {[
                { label: 'Cuts & Fleischkunde', href: '/cuts' },
                { label: 'Grilltechniken',      href: '/methoden' },
                { label: 'Wissen',              href: '/wissen' },
                { label: 'Rezepte',             href: '/rezepte' },
                { label: 'Ausrüstung',          href: '/kategorie/ausruestung' },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/30 px-4 py-2 text-xs font-sans font-bold tracking-wide uppercase text-text-light/80 hover:text-ink hover:bg-brand-gold hover:border-brand-gold transition-colors"
                >
                  {label} <ChevronRight size={12} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── HERO — Full-Bleed 70vh ────────────────────────────────────── */}
        <section className="hero-fullbleed" style={{ height: '70vh', minHeight: '520px' }}>
          <Image
            src={heroArticle.image}
            alt={heroArticle.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover hero-fullbleed-image"
          />
          <div className="hero-fullbleed-overlay" />
          <div className="hero-fullbleed-content">
            <div className="max-w-editorial mx-auto w-full px-4 sm:px-6 lg:px-8 pb-14 lg:pb-20">
              <Link href={heroArticle.url} className="group block max-w-3xl">
                <span className="category-label mb-4 block">{heroArticle.category}</span>
                <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-text-light leading-[1.08] mb-5 group-hover:text-brand-gold transition-colors duration-300">
                  {heroArticle.title}
                </h2>
                <p className="font-body text-lg text-text-light/65 leading-relaxed mb-7 max-w-2xl">
                  {heroArticle.excerpt}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-sans text-text-light/60">
                  <span>{heroArticle.author}</span>
                  {heroArticle.readingTime ? (
                    <>
                      <span className="text-brand-gold/40">·</span>
                      <span>{heroArticle.readingTime} min Lesezeit</span>
                    </>
                  ) : null}
                  <span className="text-brand-gold/40">·</span>
                  <span>{heroArticle.formattedDate}</span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ── SECONDARY ARTICLES — unter dem Hero ──────────────────────── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {sideArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="medium" />
            ))}
          </div>
        </section>

        {/* ── MITGLIEDER-CTA — EINE Haupt-Aktion pro Seite, unterhalb des ersten Bildschirms ──

            REIHENFOLGE IST DOKTRIN (Uwe, 20.08.2026 / 02.09.2026): Rubriken und
            Aufmacher stehen VOR dieser Aktion — Inhalt zuerst, Angebot danach. Am
            02.09.2026 hat Uwe den Button ausdrücklich aus dem Kopfbereich nach unten
            gesetzt („stört auf den ersten Blick"). Das Ausbildungsangebot ist mehrfach
            von selbst nach oben gewandert; abgesichert durch CLAUDE.md Abschnitt 2
            Regel 8 + scripts/check-startseiten-hierarchie.mjs (Build-Gate: oberhalb
            des HERO darf kein /auth/login-CTA stehen). Wer hier umsortiert, bekommt
            einen roten Build. */}
        <section
          className="border-y border-brand-gold/15"
          style={{
            background:
              'radial-gradient(120% 140% at 50% 130%, rgba(232,80,24,0.22) 0%, rgba(232,80,24,0.06) 45%, transparent 70%), linear-gradient(180deg, #17100B 0%, #1B110A 100%)',
          }}
          aria-labelledby="mitglieder-cta-heading"
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12 text-center">
            <h2 id="mitglieder-cta-heading" className="font-serif text-xl sm:text-2xl font-bold text-text-light mb-5">
              Vom Leser zum <span className="text-brand-gold">SteakAdemiker</span>.
            </h2>
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 font-sans font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
                style={{ background: '#C8882A', color: '#0D0A06' }}
              >
                Werde SteakAdemiker — kostenlos <ChevronRight size={16} />
              </Link>
              <p className="text-xs font-sans text-text-light/60">
                Kostenloser Mitglieder-Zugang — dein Diplom-Fortschritt wird gespeichert. Kein Abo, keine Kreditkarte.
              </p>
            </div>
          </div>
        </section>

        {/* ── WERKZEUGE — 6 Kacheln (Aroma-Matcher zuerst) · Marco-Band · VIP-Zeile ── */}
        <ToolBoxes freeLimit={AROMA_FREE_LIMIT} />

        {/* ── LEADMAGNET — nach dem redaktionellen Einstieg (Uwe, 16.08.2026) ──
            Entscheidung: erst Inhalt beweisen, dann Geschenk anbieten (Reziprozitaet,
            Texas-Monthly-DNA). Stand vorher in Sektion 9 im Sidebar-<aside> (mobil
            ~80 % Seitentiefe), kurz an Position 3 vor dem Hero — beides verworfen.
            Jetzt: direkt hinter Hero + Artikel-Reihe, vor dem Plattform-Puls. */}
        <section
          className="border-y border-brand-gold/15 bg-surface-card"
          aria-labelledby="leadmagnet-heading"
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10 items-center">
              <div>
                <span className="inline-block text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-fire mb-3">
                  Kostenloses Geschenk
                </span>
                <h2
                  id="leadmagnet-heading"
                  className="font-serif text-2xl sm:text-3xl font-bold text-text-primary leading-snug mb-3"
                >
                  Alle Kerntemperaturen auf einer Seite — druckfertig für die Grillstation.
                </h2>
                <p className="font-body text-base text-text-secondary leading-relaxed mb-5">
                  Rind, Schwein, Lamm, Geflügel, Fisch. Keine Faustregeln aus dem Internet,
                  sondern die Werte der Pitmaster-Doktrin — dieselbe Referenz, aus der auch
                  unsere Rezepte und der Temperatur-Guide rechnen.
                </p>
                <Link
                  href="/kerntemperatur-spickzettel"
                  className="inline-flex items-center gap-2 text-sm font-sans font-bold text-brand-fire hover:text-brand-gold transition-colors"
                >
                  Spickzettel ansehen
                  <ChevronRight size={14} />
                </Link>
              </div>

              <NewsletterSignup source="homepage-leadmagnet" />
            </div>
          </div>
        </section>

        {/* ── PLATTFORM-PULS — lebendige, wachsende Wissensbasis ───────────── */}
        <PlattformPuls data={puls} />

        {/* ── FRISCH & SAISONAL — rotierendes Spotlight (Bewegung/Leben) ────── */}
        <FrischSaisonal data={frischSaisonal} />

        {/* ── MANIFESTO — Dunkle Ember-Karte ──────────────────────────────── */}
        <section className="py-8 sm:py-12">
          <div className="max-w-[820px] mx-auto px-4 sm:px-6">
            <div
              className="px-10 sm:px-16 py-12 sm:py-16 relative"
              style={{
                background: 'radial-gradient(ellipse 110% 140% at 50% 35%, #2D2218 0%, #17100B 100%)',
                borderRadius: '4px',
                border: '1px solid rgba(200,136,42,0.12)',
              }}
            >
              {/* Dekorative Gold-Linien */}
              <div className="flex items-center gap-5 mb-10">
                <div className="h-px flex-1 bg-brand-gold/20" />
                <span className="font-sans text-[10px] tracking-[0.35em] uppercase text-text-muted">Manifest</span>
                <div className="h-px flex-1 bg-brand-gold/20" />
              </div>

              {/* Großes dekoratives Anführungszeichen */}
              <div className="relative">
                <span
                  aria-hidden
                  className="absolute -top-8 -left-4 font-serif select-none pointer-events-none"
                  style={{ fontSize: '8rem', lineHeight: 1, color: 'rgba(200,136,42,0.10)', fontStyle: 'italic' }}
                >
                  &ldquo;
                </span>
                <blockquote className="relative font-serif text-2xl sm:text-3xl lg:text-[2rem] font-bold italic text-text-light leading-[1.4]">
                  Feuer ist Geduld. Rauch ist Zeit.
                  <br />
                  Das perfekte Steak ist keine Technik —
                  <br />
                  es ist ein Standpunkt.
                </blockquote>
              </div>

              {/* Attributierung */}
              <div className="mt-10 flex items-center gap-5">
                <div className="h-px w-16 bg-brand-gold/25" />
                <cite className="font-sans text-xs tracking-[0.22em] uppercase text-text-muted not-italic">
                  Marco, der Pitmaster
                </cite>
              </div>
            </div>
          </div>
        </section>

        {/* ── DIPLOM-TEASER ─────────────────────────────────────────────────── */}
        <DiplomaProgressSection />

        {/* ── BBQ-NEWS TEASER ──────────────────────────────────────────────── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-3">
            <Link href="/bbq-news" className="flex items-center gap-3 group">
              <Newspaper size={20} className="text-brand-gold" />
              <h2 className="font-serif text-2xl font-bold text-text-light group-hover:text-brand-gold transition-colors">
                BBQ-News
              </h2>
            </Link>
            <Link
              href="/bbq-news"
              className="flex items-center gap-1 text-xs font-sans font-bold tracking-widest uppercase text-brand-fire hover:text-brand-gold transition-colors"
            >
              Alle News <ChevronRight size={14} />
            </Link>
          </div>
          <div className="section-divider" />
          <p className="text-sm font-sans text-text-muted mb-8 -mt-3">
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

        {/* ── KATEGORIE-SEKTIONEN ─────────────────────────────────────────────── */}
        {CATEGORY_SECTIONS.filter((s) => s.articles.length > 0).map((section) => (
          <section key={section.slug} className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-3">
              <Link href={`/kategorie/${section.slug}`}>
                <h2 className="font-serif text-2xl font-bold text-text-light hover:text-brand-gold transition-colors">
                  {section.title}
                </h2>
              </Link>
              <Link
                href={`/kategorie/${section.slug}`}
                className="flex items-center gap-1 text-xs font-sans font-bold tracking-widest uppercase text-brand-fire hover:text-brand-gold transition-colors"
              >
                Alle <ChevronRight size={14} />
              </Link>
            </div>
            <div className="section-divider" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {section.articles.slice(0, 3).map((article) => (
                <ArticleCard key={article.slug} article={article} variant="medium" />
              ))}
            </div>
          </section>
        ))}

        {/* ── TOP-PRODUKTE — Redaktionelle Weiß-Insel ─────────────────────── */}
        {recommendedProducts.length > 0 && (
          <section className="bg-surface-card py-14 my-4" style={{ borderTop: '1px solid rgba(200,136,42,0.15)', borderBottom: '1px solid rgba(200,136,42,0.15)' }}>
            <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Award size={20} className="text-brand-gold" />
                  <h2 className="font-serif text-2xl font-bold text-text-primary">
                    Unsere Testsieger
                  </h2>
                </div>
                <Link
                  href="/kategorie/ausruestung"
                  className="flex items-center gap-1 text-xs font-sans font-bold tracking-widest uppercase text-brand-fire hover:text-brand-gold transition-colors"
                >
                  Alle Tests <ChevronRight size={14} />
                </Link>
              </div>
              <div className="section-divider" />
              <p className="text-sm font-sans text-text-muted mb-8 -mt-3">
                Selbst getestet, methodisch bewertet. Affiliate-Links gekennzeichnet.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="default" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── NEUESTE ARTIKEL + SIDEBAR ────────────────────────────────────── */}
        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-serif text-2xl font-bold text-text-light mb-3">
            Neueste Artikel
          </h2>
          <div className="section-divider" />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
            <div>
              {latestArticles.slice(0, 5).map((article) => (
                <ArticleCard key={article.slug} article={article} variant="horizontal" />
              ))}
            </div>

            <aside className="space-y-6">

              {/* Newsletter-Box — redaktionelle Karte, Zweitkontakt.
                  Audit 15.08.2026: Die eigene Copy hier versprach „2× im Monat"
                  gegen „jeden Freitag" auf /newsletter und im Exit-Intent, und
                  erwähnte als einzige das Geschenk nicht. Sie nutzt jetzt die
                  einheitlichen Defaults der Komponente. */}
              <NewsletterSignup source="homepage-sidebar" />

              {/* Beliebte Themen */}
              <div className="bg-surface-card border border-border-subtle p-5">
                <div className="border-t-2 border-brand-gold -mt-5 mb-4 pt-4">
                  <h3 className="font-serif text-lg font-bold text-text-primary">
                    Beliebte Themen
                  </h3>
                </div>
                <ul>
                  {[
                    { label: 'Kerntemperaturen', href: '/temperatur-guide', icon: Thermometer },
                    { label: 'Reverse Sear Methode', href: '/methoden/reverse-sear', icon: Flame },
                    { label: 'Ribeye Guide', href: '/cuts/ribeye', icon: BookOpen },
                    { label: 'Thermometer Test', href: '/vergleich/fleischthermometer', icon: Thermometer },
                    { label: 'Brisket komplett', href: '/cuts/brisket', icon: BookOpen },
                  ].map(({ label, href, icon: Icon }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="flex items-center justify-between py-3 border-b border-border-subtle text-sm font-sans text-text-secondary hover:text-brand-fire transition-colors group"
                      >
                        <span className="flex items-center gap-2">
                          <Icon size={14} className="text-text-muted group-hover:text-brand-gold transition-colors" />
                          {label}
                        </span>
                        <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-fire" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {recommendedProducts[0] && (
                <ProductCard product={recommendedProducts[0]} variant="sidebar" />
              )}
            </aside>
          </div>
        </section>

        {/* ── TRUST-BAR — Redaktionelle Weiß-Insel ────────────────────────── */}
        <section className="bg-surface-base py-14" style={{ borderTop: '1px solid rgba(200,136,42,0.15)' }}>
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { stat: '35',   label: 'Diplom-Lektionen — Bronze bis Meister' },
                { stat: '30',   label: 'Jahre Lehrerfahrung hinter der Methodik' },
                { stat: '100%', label: 'Affiliate-transparent' },
                { stat: '2026', label: 'Inhalte aktuell' },
              ].map(({ stat, label }) => (
                <div key={label}>
                  <p className="stat-number">{stat}</p>
                  <p className="text-xs font-sans text-text-muted mt-2 tracking-wide">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-center mt-8">
              <Link
                href="/ueber-uns"
                className="text-xs font-sans font-bold tracking-widest uppercase text-brand-fire hover:text-brand-gold transition-colors"
              >
                Wer hinter der Akademie steht →
              </Link>
            </p>
          </div>
        </section>

        {/* ── FINAL CTA — Wiederholung der einen Haupt-Aktion ─────────────── */}
        <section
          className="border-t border-brand-gold/15"
          style={{
            background:
              'radial-gradient(120% 120% at 50% 120%, rgba(232,80,24,0.25) 0%, rgba(232,80,24,0.06) 45%, transparent 70%), linear-gradient(180deg, #130C07 0%, #1B110A 100%)',
          }}
        >
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-light mb-3">
              Bereit für dein erstes Diplom?
            </h2>
            <p className="font-body text-base text-text-light/60 max-w-xl mx-auto mb-7">
              Kostenlos registrieren, Fortschritt speichern — von Bronze bis Meister.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 font-sans font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
              style={{ background: '#C8882A', color: '#0D0A06' }}
            >
              Werde SteakAdemiker — kostenlos <ChevronRight size={16} />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}