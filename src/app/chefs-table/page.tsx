import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { OEFFENTLICH, sichtbarePartner } from '@/lib/chefs-table';
import { LAENDER, PARTNER_ARTEN, rezeptAnzahl } from '@/lib/chefs-table/typen';

/**
 * Übersicht /chefs-table (25.10.2026) — die Küchenpartner der Steakakademie.
 *
 * Versteckt, bis der erste Partner zugesagt hat (src/lib/chefs-table/index.ts,
 * OEFFENTLICH): noindex, nicht im Menü, nicht in der Sitemap
 * (next-sitemap.config.js). Layout nach dem freigegebenen Design-Canvas.
 * Filter nach Land und Art kommen mit der Datenbank ab ~10 Partnern (Konzept
 * Abschnitt 8) — hier bewusst statische Gruppierung, kein Client-Code.
 */
export const metadata: Metadata = {
  title: 'Chefs’ Table — die Küchenpartner der Steakakademie',
  description:
    'Echte Köche, echtes Feuer: Restaurants, Kochschulen und Eventküchen stellen ihre Rezepte vor und zeigen, wo man sie findet. Nur auf Einladung.',
  alternates: { canonical: 'https://steakakademie.de/chefs-table' },
  robots: OEFFENTLICH ? undefined : { index: false, follow: false },
};

export default function ChefsTablePage() {
  const partner = sichtbarePartner();

  return (
    <>
      <Header />
      <main className="bg-surface-base min-h-screen">
        {!OEFFENTLICH && (
          <div className="bg-brand-fire/10 border-b border-brand-fire/30 text-center text-xs font-sans text-text-secondary py-2 px-4">
            Vorschau — dieser Bereich ist noch nicht öffentlich.
          </div>
        )}

        <section className="bg-surface-card border-b border-border-subtle" aria-label="Chefs’ Table">
          <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center flex flex-col items-center gap-5">
            <span className="font-sans text-xs font-bold tracking-[0.18em] text-brand-fire">DIE KÜCHENPARTNER DER STEAKAKADEMIE</span>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold leading-[1.05] text-text-light">Chefs’ Table</h1>
            <p className="font-body text-lg sm:text-xl leading-relaxed text-text-primary">
              Echte Köche, echtes Feuer. Hier stellen Restaurants, Kochschulen und Eventküchen ihre Rezepte vor — und zeigen, wo man sie findet.
            </p>
            <span className="border border-brand-gold text-brand-gold font-sans text-[11px] font-bold tracking-widest px-3 py-2">✦ NUR AUF EINLADUNG</span>
          </div>
        </section>

        <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16" aria-label="Alle Küchenpartner">
          {partner.length === 0 ? (
            <p className="font-body text-text-secondary">Die ersten Küchenpartner werden gerade eingeladen.</p>
          ) : (
            <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
              {partner.map((p) => (
                <li key={p.slug}>
                  <Link href={`/chefs-table/${p.slug}`} className="flex flex-col gap-3 no-underline group">
                    {p.bilder.kueche ? (
                      <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
                        <Image src={p.bilder.kueche} alt={p.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] border border-dashed border-border-subtle bg-surface-elevated flex items-center justify-center font-sans text-xs tracking-widest uppercase text-text-muted" aria-hidden="true">
                        Foto Partner
                      </div>
                    )}
                    <span className="font-sans text-[11px] font-bold tracking-widest uppercase text-brand-fire">
                      {PARTNER_ARTEN[p.art]} · {p.ort}, {LAENDER[p.land]}
                    </span>
                    <span className="font-serif text-2xl leading-snug text-text-light group-hover:text-brand-gold transition-colors">{p.name}</span>
                    <span className="font-body text-text-secondary leading-relaxed">{p.kurz}</span>
                    <span className="font-sans text-xs text-text-muted">
                      {rezeptAnzahl(p)} Rezepte · Signature: {p.signature.titel}
                    </span>
                    <span className="font-sans text-xs font-bold tracking-widest text-brand-gold">PORTRÄT ANSEHEN →</span>
                  </Link>
                </li>
              ))}
              <li className="border border-brand-gold p-8 flex flex-col gap-3 justify-center">
                <span className="font-sans text-[11px] font-bold tracking-widest text-brand-gold">AN DEN TISCH KOMMEN</span>
                <span className="font-serif text-2xl leading-snug text-text-light">Der Tisch ist klein. Mit Absicht.</span>
                <span className="font-body text-text-secondary leading-relaxed">
                  Küchenpartner werden eingeladen — nicht ausgeschrieben. Wer regelmäßig Premium-Rezepte einreicht, fällt uns auf.
                </span>
                <a href="#weg" className="font-sans text-xs font-bold tracking-widest text-brand-gold no-underline py-2 hover:text-text-light transition-colors">SO KOMMT MAN AN DEN TISCH →</a>
              </li>
            </ul>
          )}
        </section>

        <section id="weg" className="bg-[#D8BE90] text-ink scroll-mt-24" aria-label="Der Weg an den Tisch">
          <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-22 flex flex-col gap-10">
            <div className="flex flex-col gap-2 max-w-3xl">
              <span className="font-sans text-xs font-bold tracking-[0.18em] text-[#7A2A0B]">DER WEG AN DEN TISCH</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">Vom Mitglied zum Küchenpartner</h2>
            </div>
            <ol className="grid gap-8 md:grid-cols-3 list-none p-0 m-0">
              <li className="flex flex-col gap-2 border-t-2 border-ink pt-5">
                <span className="font-serif text-4xl leading-none text-[#7A2A0B]">1</span>
                <span className="font-serif text-xl">Kostenloses Konto anlegen</span>
                <span className="font-body text-[#3A2C20] leading-relaxed">Mit dem Konto öffnen sich die Mitglieder-Bereiche der Steakakademie.</span>
              </li>
              <li className="flex flex-col gap-2 border-t-2 border-ink pt-5">
                <span className="font-serif text-4xl leading-none text-[#7A2A0B]">2</span>
                <span className="font-serif text-xl">Premium-Rezepte einreichen</span>
                <span className="font-body text-[#3A2C20] leading-relaxed">Grammgenau, eigenes Foto, eigene Technik — mit deinem Namen am Rezept.</span>
              </li>
              <li className="flex flex-col gap-2 border-t-2 border-ink pt-5">
                <span className="font-serif text-4xl leading-none text-[#7A2A0B]">3</span>
                <span className="font-serif text-xl">Eingeladen werden</span>
                <span className="font-body text-[#3A2C20] leading-relaxed">Profis mit eigener Küche können als Küchenpartner an den Chefs’ Table eingeladen werden.</span>
              </li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/login" className="bg-ink text-text-light font-sans text-sm font-bold tracking-widest px-5 py-4 no-underline hover:bg-[#2A1D14] transition-colors">KOSTENLOS ANMELDEN</Link>
              <Link href="/rezepte/community" className="border border-ink text-ink font-sans text-sm font-bold tracking-widest px-5 py-4 no-underline hover:bg-ink/5 transition-colors">REZEPT EINREICHEN</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
