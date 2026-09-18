import { use } from "react";
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { allStreitfalls } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import { sichtbareArtikel } from '@/lib/redaktion';
import { getAuthorBySlug } from '@/lib/authors';
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import StreitfallUmfrage from '@/components/streitfaelle/StreitfallUmfrage';
import { skMdx, Crumbs, Weiche, Faq, lesezeit } from '@/components/relaunch/Prose';
import AutorHinweis from '@/components/AutorHinweis';
import { KATALOGE } from '@/lib/relaunch/katalog';

/**
 * Streitfall — redaktioneller Artikel (Handoff, Ansicht 3): Lesebreite 760px,
 * helle Ebene, Kicker mit Nummer, Titel, Lead, Metazeile zwischen zwei Linien,
 * Bild, Text, Pull-Quote, am Ende genau eine Weiche.
 *
 * Inhalt kommt 1:1 aus content/streitfaelle (Redaktionsvorbehalt über
 * sichtbareArtikel). Was die Alt-Seite an Substanz trägt, bleibt erhalten:
 * Entscheidung (mit Qualifikation aus dem Autorendatensatz — nie fest
 * verdrahtet), Merksatz als Pull-Quote, FAQ, Umfrage, Schema.org.
 *
 * Der Frageblock des Prototyps (zwei Antworten) hat in den Inhalten keine
 * Datenbasis; an seiner Stelle steht die bestehende Umfrage (dunkler Block auf
 * hellem Grund — dieselbe Anmutung).
 */
type Props = { params: Promise<{ slug: string }> };
const sichtbare = () => sichtbareArtikel(allStreitfalls);

export function generateStaticParams() {
  return sichtbare().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const doc = sichtbare().find((s) => s.slug === params.slug);
  if (!doc) return {};
  return { title: doc.seoTitle ?? doc.title, description: doc.seoDescription ?? doc.excerpt };
}

export default function StreitfallSeite(props: Props) {
  const params = use(props.params);
  const doc = sichtbare().find((s) => s.slug === params.slug);
  if (!doc) notFound();
  // Die redaktionelle Nummer („Nr. 5") kommt aus dem Katalog des Handoffs, wenn
  // der Streitfall dort verzeichnet ist — sonst gibt es keine, und es wird keine erfunden.
  const nr = KATALOGE.streitfaelle.eintraege.find((e) => e.href === doc.url)?.meta1;
  const MDXContent = useMDXComponent(doc.body.code);
  const autor = getAuthorBySlug(doc.authorSlug);
  const minuten = lesezeit(doc.body.raw);

  const faqItems = [
    ...(doc.entscheidung ? [{ question: doc.streitfrage, answer: doc.entscheidung }] : []),
    ...((doc.faq as Array<{ question: string; answer: string }> | undefined) ?? []),
  ];
  const schemas = [
    articleSchema({
      headline: doc.title, description: doc.excerpt, image: doc.image,
      datePublished: doc.publishedAt, dateModified: doc.updatedAt ?? doc.publishedAt,
      authorName: doc.author, authorSlug: doc.authorSlug, url: doc.url,
    }),
    breadcrumbSchema([{ name: 'Streitfälle', url: '/streitfaelle' }, { name: doc.streitfrage, url: doc.url }]),
    ...(faqItems.length ? [faqSchema(faqItems)] : []),
  ];
  const umfrage = doc.umfrage as { frage: string; optionen: { key: string; label: string }[] } | undefined;
  // Die Umfrage braucht den Supabase-Browser-Client; ohne die beiden Public-Env-
  // Variablen wirft er im Browser und nimmt die ganze Seite mit. Gleiche Regel
  // wie in content-feed.ts: auf ANWESENHEIT verzweigen (Build-Gate baut ohne Env).
  const umfrageMoeglich = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <article className="sk-read">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <Crumbs items={[{ label: 'Start', href: '/relaunch' }, { label: 'Streitfälle am Grill', href: '/relaunch/streitfaelle' }]} />
      <div className="sk-kicker sk-kicker--accent" style={{ marginBottom: 14 }}>
        Streitfall{nr ? ` ${nr}` : ''} · {doc.istMythos ? 'Mythos' : 'Wissen & Wissenschaft'}
      </div>
      <h1 className="sk-h sk-read__h1">{doc.title}</h1>
      <p className="sk-read__lead">{doc.excerpt}</p>
      <div className="sk-read__meta">
        <span>{doc.author}</span>
        <span>{doc.formattedDate}</span>
        <span>{minuten} Min. Lesezeit</span>
      </div>
      <Image
        src={doc.image}
        alt={`${doc.imageAlt}${doc.imageAI ? ' — KI-generiertes Symbolbild' : ''}`}
        width={1200}
        height={675}
        priority
        sizes="(min-width: 800px) 760px, 100vw"
        className="sk-read__img"
      />
      {doc.imageAI && <p className="sk-meta" style={{ marginTop: 8 }}>KI-Symbolbild · <a href="/ki-disclaimer">Warum wir das kennzeichnen</a></p>}

      <div className="sk-prose">
        <MDXContent components={skMdx} />
      </div>

      <div className="sk-pull">{doc.merksatz}</div>

      <section className="sk-entscheidung" aria-labelledby="sk-ent-h">
        <div id="sk-ent-h" className="sk-kicker sk-kicker--13 sk-kicker--accent">Die Entscheidung</div>
        {doc.entscheidung ? (
          <>
            <p className="sk-entscheidung__text">{doc.entscheidung}</p>
            <p className="sk-meta sk-meta--14">{doc.author}{autor?.statsLabel ? ` — ${autor.statsLabel}` : ''}</p>
          </>
        ) : (
          <p className="sk-text sk-text--16">Dieser Streitfall ist recherchiert, aber noch nicht entschieden. Die Einordnung aus der Praxis wird nachgetragen.</p>
        )}
      </section>

      {umfrage && umfrageMoeglich && (
        <div className="sk-dunkelblock">
          <StreitfallUmfrage slug={doc.slug} frage={umfrage.frage} optionen={umfrage.optionen} />
        </div>
      )}

      <Faq items={faqItems} />

      {/* KI-Kennzeichnung (Art. 50 KI-VO). Bis 06.09.2026 trugen die Streitfaelle
          Uwe als Autor, seither eine Redaktionspersona — ohne diesen Satz stuende
          hier nur ein Vorname ohne Herkunft. Die Entscheidungs-Box zeigt das
          statsLabel nur, wenn eine Entscheidung gefaellt ist; bei den offenen
          Streitfaellen fehlte die Kennzeichnung damit ganz. */}
      <AutorHinweis
        authorSlug={doc.authorSlug}
        className="sk-meta sk-meta--14"
        linkClassName="sk-more"
      />

      <Weiche
        kicker="Nächster Schritt · Akademie Stufe 1"
        titel="Der Funke — sieben Lektionen, ohne Login"
        text="Grillarten, Zonen, Temperatur statt Farbe: die Grundlagen, auf denen jeder Streitfall hier aufbaut."
        href="/relaunch/diplome"
      />
    </article>
  );
}
