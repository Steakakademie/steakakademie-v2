import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ChefHat, Clock, Scale } from 'lucide-react';
import { allRecipes } from 'contentlayer/generated';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AutorHinweis from '@/components/AutorHinweis';
import MutterrezeptBaum from '@/components/mutterrezepte/MutterrezeptBaum';
import { MUTTERREZEPTE, anzahlFrei, mutterrezept, sicht } from '@/lib/mutterrezepte';
import { nurVeroeffentlicht } from '@/lib/redaktion';
import { authorSchemaRef, breadcrumbSchema } from '@/lib/schema';
import { ogImages } from '@/lib/og';

/**
 * /mutterrezepte/[slug] — Mutterrezept mit Pairing-Baum (Konzept vom 21.10.2026,
 * von Uwe freigegeben).
 *
 * Statisch: Die Seite rendert nur die öffentliche Sicht (`sicht(m, false)`).
 * Gesperrte Blätter und Grammangaben stehen weder im HTML noch im JS-Payload;
 * die Vollansicht holt sich die Komponente über /api/mutterrezepte/[slug].
 * Kein cookies() hier — das würde die Seite dynamisch machen und sie aus dem
 * statischen Manifest (und damit aus der Sitemap) nehmen.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return MUTTERREZEPTE.map((m) => ({ slug: m.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const BASIS = 'https://steakakademie.de';

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const m = mutterrezept(slug);
  if (!m) return {};
  const titel = `${m.titel}: Grundrezept und ${m.blaetter.length} Einsätze`;
  const url = `${BASIS}/mutterrezepte/${m.slug}`;
  return {
    title: titel,
    description: m.beschreibung,
    alternates: { canonical: url },
    openGraph: {
      title: titel,
      description: m.beschreibung,
      url,
      type: 'article',
      images: ogImages(m.titel, `Mutterrezept · ${m.blaetter.length} Einsätze`),
    },
  };
}

export default async function MutterrezeptSeite(props: Props) {
  const { slug } = await props.params;
  const m = mutterrezept(slug);
  if (!m) notFound();

  const verlinkt = new Set(m.blaetter.map((b) => b.rezeptSlug).filter(Boolean));
  // Ziel-URL kommt aus Contentlayer (/rezepte/<kategorie>/<slug>) — nie selbst bauen.
  const rezepte: Record<string, { titel: string; url: string }> = {};
  for (const r of nurVeroeffentlicht(allRecipes)) {
    if (verlinkt.has(r.slug)) rezepte[r.slug] = { titel: r.title, url: r.url };
  }

  const url = `/mutterrezepte/${m.slug}`;
  const frei = anzahlFrei(m);

  const recipeLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: m.titel,
    description: m.beschreibung,
    image: `${BASIS}${ogImages(m.titel, 'Mutterrezept')[0].url}`,
    author: authorSchemaRef(m.autorSlug),
    datePublished: m.veroeffentlicht,
    prepTime: 'PT20M',
    totalTime: 'PT20M',
    recipeYield: m.ergibt,
    recipeCategory: 'Sauce',
    keywords: 'Cashewcreme, Cashew-Dip, Cashewsauce, vegane Grillsauce, Sauce zum Grillen',
    recipeIngredient: m.zutatenLoeffel.map((z) => `${z.menge} ${z.name}`),
    recipeInstructions: m.schritte.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.titel,
      text: s.text,
    })),
  };
  const breadcrumbLd = breadcrumbSchema([
    { name: 'Rezepte', url: '/rezepte' },
    { name: m.titel, url },
  ]);

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <main className="min-h-screen bg-surface-base">
        <div className="mx-auto max-w-editorial px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <nav className="mb-6 flex items-center gap-1.5 font-sans text-xs text-text-muted" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-brand-fire">Start</Link>
            <ChevronRight size={12} />
            <Link href="/rezepte" className="transition-colors hover:text-brand-fire">Rezepte</Link>
            <ChevronRight size={12} />
            <span className="text-text-secondary">{m.titel}</span>
          </nav>

          {/* ── Hero ── */}
          <header className="max-w-3xl">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-brand-fire">
              Mutterrezept · Saucen
            </span>
            <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-text-light sm:text-4xl lg:text-5xl">
              {m.titel}: ein Grundrezept, {m.blaetter.length} Einsätze
            </h1>
            <p className="mt-4 font-body text-[1.08rem] leading-relaxed text-text-secondary">
              Cremig wie Mayonnaise, frisch durch Limette, ohne Ei und ohne Milch. Wie bei den Muttersaucen der
              klassischen Küche steht ein Grundrezept in der Mitte — und daraus werden Dip, Spiegel, Dressing,
              Marinade oder warme Sauce. Die Ideen stammen aus Küchen rund um die Welt, von Brasilien bis Japan — jede mit Quelle.
            </p>
            <p className="mt-5 font-sans text-xs text-text-muted">Von Jonas · Saucen &amp; Rubs</p>
            <AutorHinweis authorSlug={m.autorSlug} variante="rezept" dokument={m} />
          </header>

          {/* ── Grundrezept ── */}
          <section className="mt-12 grid gap-8 lg:grid-cols-12" aria-labelledby="grundrezept">
            <div className="lg:col-span-5">
              <h2 id="grundrezept" className="font-serif text-2xl font-bold text-text-light">
                Das Grundrezept
              </h2>
              <ul className="mt-3 flex flex-wrap gap-4 font-sans text-xs text-text-muted">
                <li className="inline-flex items-center gap-1.5"><ChefHat size={14} aria-hidden="true" /> {m.ergibt}</li>
                <li className="inline-flex items-center gap-1.5"><Clock size={14} aria-hidden="true" /> {m.zeit}</li>
              </ul>
              <ul className="mt-5 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-card">
                {m.zutatenLoeffel.map((z) => (
                  <li key={z.name} className="flex gap-4 px-4 py-3 font-body text-sm">
                    <span className="w-40 shrink-0 font-semibold text-text-light">{z.menge}</span>
                    <span className="text-text-primary">{z.name}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-start gap-2 font-sans text-xs leading-relaxed text-text-muted">
                <Scale size={14} className="mt-0.5 shrink-0 text-brand-gold" aria-hidden="true" />
                <span>
                  Grammgenau — samt Wassermenge für jede Einsatzform — im{' '}
                  <Link href="/vip" className="underline hover:text-brand-fire">VIP-Pass</Link>.
                </span>
              </p>
              <p className="mt-3 font-sans text-xs font-semibold text-brand-gold">{m.allergene}</p>
            </div>
            <div className="lg:col-span-7">
              <ol className="space-y-4">
                {m.schritte.map((s, i) => (
                  <li key={s.titel} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-gold font-sans text-sm font-bold text-brand-gold">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-sans text-sm font-bold uppercase tracking-wide text-text-light">{s.titel}</h3>
                      <p className="mt-1 font-body leading-relaxed text-text-primary">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6 rounded-xl border border-brand-gold/40 bg-surface-elevated p-5">
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold">Profi-Tipp</p>
                <p className="mt-1 font-body leading-relaxed text-text-primary">{m.profiTipp}</p>
              </div>
              <p className="mt-4 font-body text-sm leading-relaxed text-text-secondary">
                <strong className="text-text-light">Aufbewahren:</strong> {m.lagerung}
              </p>
            </div>
          </section>

          {/* ── Baum ── */}
          <section className="mt-16" aria-labelledby="baum">
            <h2 id="baum" className="font-serif text-2xl font-bold text-text-light sm:text-3xl">
              Der Baum: {m.blaetter.length} Einsätze für die Creme
            </h2>
            <p className="mt-2 max-w-3xl font-body text-text-secondary">
              Wähle einen Ast, dann ein Blatt. Der Buchstabe im Punkt zeigt die Einsatzform. {frei} Einsätze sind
              hier frei — mit Abwandlung in Gramm, Wassermenge und Link zum Rezept. Alle übrigen gehören zum VIP-Pass.
            </p>
            <div className="mt-6">
              <MutterrezeptBaum start={sicht(m, false)} rezepte={rezepte} />
            </div>
          </section>

          <section className="mt-14 max-w-3xl rounded-xl border border-border-subtle bg-surface-card p-5 font-sans text-sm leading-relaxed text-text-secondary">
            <p>
              <strong className="text-text-light">So entsteht der Baum:</strong> Jede Einsatzidee stammt aus einer
              öffentlich zugänglichen Quelle und ist am Blatt verlinkt; Rezepttexte haben wir nicht übernommen. Wo das
              Original ganze oder gehackte Cashews nutzt und wir es auf die Creme übertragen, steht „Eigene Ableitung“.
              Die Grammangaben der Abwandlungen sind Richtwerte und nicht probegekocht — schmeck immer ab.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
