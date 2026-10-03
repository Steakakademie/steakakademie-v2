import { use } from "react";
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allVergleiches } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import { anzahlDiplomLektionen } from '@/lib/plattform-puls';
import { articleSchema, breadcrumbSchema, faqSchema, produktIdsImVergleichstext } from '@/lib/schema';
import { METHODENSATZ, vergleichsProdukte } from '@/lib/vergleich-seite';
import { amazonBewertung, preisAnzeige, produktLink, PREIS_OHNE_STAND } from '@/components/affiliate/produkt-anzeige';
import { skMdx, Crumbs, Faq } from '@/components/relaunch/Prose';

/**
 * Werkzeug / Vergleich (Handoff, Ansicht 6): Breite 1100px, Titel auf 16ch,
 * Lead auf 64ch, darunter die Modelle der Seite als Karten (die redaktionelle
 * Auswahl dunkel mit Akzentrahmen), dann der Text.
 *
 * Produkte kommen aus products/registry.yaml — dieselbe Zuordnung wie live
 * (vergleichsProdukte in src/lib/vergleich-seite.ts). Eine Karte mit
 * Partnerlink trägt „Anzeige" sichtbar VOR dem Klick (LG Köln 12.05.2026,
 * CLAUDE.md § 2 Regel 1) und läuft über /go/[id] mit rel="sponsored nofollow
 * noopener". Führt der Link ohne Partner-Parameter zum Anbieter, ist er ein
 * gewöhnlicher externer Link — ohne „Anzeige" (produktLink).
 *
 * 03.10.2026: Die Seite ist eine Marktübersicht nach Herstellerangaben, kein
 * Gerätetest. Der Methodensatz steht sichtbar unter dem Kicker. Der Prototyp
 * sah drei Infokästen „So haben wir getestet / Was zählt / Transparenz" vor —
 * sie entfallen, weil es keinen Test gibt, über den sie berichten könnten.
 */
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allVergleiches.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const v = allVergleiches.find((x) => x.slug === params.slug);
  if (!v) return {};
  return { title: v.seoTitle ?? v.title, description: v.seoDescription ?? v.excerpt };
}

export default function VergleichSeite(props: Props) {
  const params = use(props.params);
  const v = allVergleiches.find((x) => x.slug === params.slug);
  if (!v) notFound();
  const MDXContent = useMDXComponent(v.body.code);
  const produkte = vergleichsProdukte(v.slug, v.body.raw).slice(0, 3);
  // Gezählt aus den Produkt-Bausteinen des Textes — nicht aus dem Frontmatter.
  const modelleImText = produktIdsImVergleichstext(v.body.raw).length;
  const faq = (v.faq as Array<{ question: string; answer: string }> | undefined) ?? [];
  const schemas = [
    articleSchema({
      headline: v.title, description: v.excerpt, image: v.image,
      datePublished: v.publishedAt, dateModified: v.updatedAt ?? v.publishedAt,
      authorName: v.author, authorSlug: v.authorSlug, url: v.url,
    }),
    breadcrumbSchema([{ name: 'Vergleiche', url: '/vergleich' }, { name: v.title, url: v.url }]),
    ...(faq.length ? [faqSchema(faq)] : []),
  ];
  const hatPartnerkarte = produkte.some((p) => produktLink(p).partner);

  return (
    <div className="sk-mid">
      {schemas.map((s, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />)}
      <Crumbs items={[{ label: 'Start', href: '/relaunch' }, { label: 'Ausrüstung', href: '/vergleich' }, { label: 'Vergleiche' }]} />
      <div className="sk-kicker sk-kicker--accent" style={{ marginBottom: 14 }}>
        Vergleich · Marktübersicht{modelleImText > 0 ? ` · ${modelleImText} Modelle` : ''}
      </div>
      <h1 className="sk-h sk-h--page" style={{ maxWidth: '16ch' }}>{v.title}</h1>
      <p className="sk-lead" style={{ marginTop: 20, maxWidth: '64ch' }}>
        {v.excerpt}
      </p>
      <p className="sk-meta sk-meta--14" style={{ marginTop: 12, maxWidth: '64ch' }} data-methodenhinweis>
        {METHODENSATZ}
        {hatPartnerkarte ? ' Affiliate-Links sind mit „Anzeige“ gekennzeichnet, Preis für dich unverändert.' : ''}
      </p>

      {produkte.length > 0 && (
        <div className="sk-produkte">
          {produkte.map((p) => {
            // Hervorgehoben ist die redaktionelle Auswahl (`recommended`) —
            // nicht mehr schlicht die erste Karte, und nicht als Testurteil.
            const auswahl = p.recommended === true;
            const bild = p.imageUrl || p.image;
            const link = produktLink(p);
            const { preis, stand } = preisAnzeige(p);
            // Sterne nur bei Amazon-Link und immer mit Quelle (produkt-anzeige.ts).
            const bewertung = amazonBewertung(p);
            return (
              <article key={p.id} className={`sk-produkt${auswahl ? ' sk-produkt--sieger' : ''}`}>
                <div className="sk-produkt__top">
                  <span className={auswahl ? 'sk-kicker--warm' : 'sk-kicker--accent'}>{p.badge ?? (auswahl ? 'Unsere Auswahl' : 'Im Vergleich')}</span>
                  {link.partner && <span className="sk-produkt__anzeige">Anzeige</span>}
                </div>
                <div className="sk-produkt__bild">
                  {bild ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bild} alt={p.imageAlt ?? p.name} loading="lazy" />
                  ) : (
                    <span>Produktfoto folgt</span>
                  )}
                  {p.imageType === 'symbolic' && <span className="sk-produkt__symbol">Symbolbild</span>}
                </div>
                <div className="sk-h sk-h--sub">{p.name}</div>
                <div className="sk-meta sk-meta--14">
                  {bewertung
                    ? `${bewertung.rating.toFixed(1).replace('.', ',')} (Ø Amazon)${bewertung.ratingCount ? ` · ${bewertung.ratingCount.toLocaleString('de-DE')} Amazon-Bewertungen` : ''}`
                    : 'Modell aus dieser Übersicht'}
                </div>
                {p.pros?.length ? <ul className="sk-produkt__pros">{p.pros.slice(0, 3).map((x) => <li key={x}>{x}</li>)}</ul> : null}
                <div className="sk-produkt__foot">
                  <span className="sk-produkt__preis">
                    {preis && stand ? (
                      <>
                        {preis}{' '}
                        <span className="sk-meta sk-meta--14" style={{ display: 'inline' }}>{stand}</span>
                      </>
                    ) : (
                      <span className="sk-meta sk-meta--14" style={{ display: 'inline' }}>{PREIS_OHNE_STAND}</span>
                    )}
                  </span>
                  <a href={link.href} rel={link.rel} target="_blank" className={`sk-btn ${auswahl ? 'sk-btn--primary' : 'sk-btn--outline'}`}>
                    {link.partner && p.provider === 'amazon' ? 'Bei Amazon ansehen' : link.partner ? 'Zum Angebot' : 'Zum Anbieter'}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="sk-prose" style={{ marginTop: 48, maxWidth: '66ch' }}>
        <MDXContent components={skMdx} />
      </div>

      <Faq items={faq} />

      <div className="sk-grid" style={{ ['--min' as string]: '280px', marginTop: 56, gap: 14 }}>
        <Link href="/relaunch/rezepte" className="sk-card" style={{ gap: 6 }}>
          <span className="sk-kicker sk-kicker--13 sk-kicker--muted">Zurück ans Feuer</span>
          <span className="sk-h sk-h--card">Rezepte, die eine Methode lehren</span>
          <span className="sk-meta sk-meta--14">Acht Rezepte, acht Techniken — mit Portionsrechner.</span>
        </Link>
        <Link href="/relaunch/diplome" className="sk-card sk-card--dark" style={{ gap: 6, border: 0 }}>
          <span className="sk-kicker sk-kicker--13 sk-kicker--warm">Weiter im Diplom</span>
          <span className="sk-h sk-h--card">Stufe 1 · Der Funke</span>
          <span className="sk-meta sk-meta--14">{anzahlDiplomLektionen(1)} Lektionen, ohne Login.</span>
        </Link>
      </div>
    </div>
  );
}
