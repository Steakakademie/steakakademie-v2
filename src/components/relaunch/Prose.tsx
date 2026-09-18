import Link from 'next/link';
import AffiliateBox from '@/components/mdx/AffiliateBox';
import MDXProductCard from '@/components/mdx/MDXProductCard';
import MDXComparisonTable from '@/components/mdx/MDXComparisonTable';
import MDXBuyingGuideBlock from '@/components/mdx/MDXBuyingGuideBlock';
import BBQPairing from '@/components/article/BBQPairing';
import { Schnelluebersicht, Achtung, ProTipp, TempBox, Leitfrage, Handgriff } from '@/components/mdx/Callouts';

/**
 * MDX-Komponenten für Lesetext auf der hellen Ebene des Relaunches.
 * Zuordnung analog zu den Alt-Seiten (Streitfall, Rezept, Vergleich, Lektion) —
 * derselbe Satz an Namen, damit kein Inhalt beim Umschalten ins Leere läuft
 * (MDX-Komponenten-Gate, scripts/check-mdx-komponenten.mjs).
 *
 * Die Callouts (Schnelluebersicht, Achtung, ProTipp, TempBox) und die
 * Affiliate-Bausteine werden unverändert übernommen: Sie tragen Kennzeichnung
 * („Anzeige") und Fachlogik, die hier nicht neu erfunden wird. Ihr dunkles
 * Styling entspricht dem dunklen Frageblock des Prototyps auf hellem Grund.
 */
export const skMdx = {
  AffiliateBox,
  MDXProductCard,
  MDXComparisonTable,
  MDXBuyingGuideBlock,
  BBQPairing,
  Schnelluebersicht,
  Achtung,
  ProTipp,
  TempBox,
  Leitfrage,
  Handgriff,
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className="sk-h sk-prose__h2" {...p} />,
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className="sk-h sk-prose__h3" {...p} />,
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => <p className="sk-prose__p" {...p} />,
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => <ul className="sk-prose__ul" {...p} />,
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => <ol className="sk-prose__ol" {...p} />,
  blockquote: (p: React.HTMLAttributes<HTMLQuoteElement>) => <blockquote className="sk-prose__quote" {...p} />,
  strong: (p: React.HTMLAttributes<HTMLElement>) => <strong className="sk-prose__strong" {...p} />,
  hr: () => <hr className="sk-prose__hr" />,
  table: (p: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="sk-prose__tablewrap"><table className="sk-prose__table" {...p} /></div>
  ),
  th: (p: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className="sk-prose__th" {...p} />,
  td: (p: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className="sk-prose__td" {...p} />,
  a: ({ href = '', ...p }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    href.startsWith('/') ? <Link href={href} className="sk-prose__a" {...p} /> : <a href={href} className="sk-prose__a" rel="noopener" {...p} />,
  img: ({ src = '', alt = '', title }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <figure className="sk-prose__figure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="sk-prose__img" />
      {title && <figcaption className="sk-meta sk-meta--14 sk-prose__caption">{title}</figcaption>}
    </figure>
  ),
};

/** Brotkrümel, hell oder dunkel je nach Umgebung */
export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="sk-crumbs" aria-label="Brotkrümel">
      {items.map((it, i) => (
        <span key={it.label} style={{ display: 'contents' }}>
          {i > 0 && <span aria-hidden="true">/</span>}
          {it.href ? <Link href={it.href}>{it.label}</Link> : <strong aria-current="page">{it.label}</strong>}
        </span>
      ))}
    </nav>
  );
}

/**
 * Die Weiche — „genau ein nächster Schritt" am Ende jeder Detailseite
 * (Prototyp: Streitfall → Lektion → Rezept → Werkzeug → Diplome).
 */
export function Weiche({ kicker, titel, text, href }: { kicker: string; titel: string; text: string; href: string }) {
  return (
    <Link href={href} className="sk-weiche">
      <span className="sk-weiche__body">
        <span className="sk-kicker sk-kicker--13 sk-kicker--warm">{kicker}</span>
        <span className="sk-h sk-weiche__title">{titel}</span>
        <span className="sk-weiche__text">{text}</span>
      </span>
      <span className="sk-weiche__arrow" aria-hidden="true">→</span>
    </Link>
  );
}

/** FAQ-Block (aus dem `faq`-Feld der Inhalte) */
export function Faq({ items }: { items: { question: string; answer: string }[] }) {
  if (!items.length) return null;
  return (
    <section className="sk-faq" aria-labelledby="sk-faq-h">
      <h2 id="sk-faq-h" className="sk-h sk-h--sub">Häufige Fragen</h2>
      <dl>
        {items.map((it) => (
          <div key={it.question} className="sk-faq__item">
            <dt className="sk-faq__q">{it.question}</dt>
            <dd className="sk-faq__a">{it.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Lesezeit aus dem Rohtext — 200 Wörter/Minute, mindestens 1 */
export function lesezeit(raw: string): number {
  const words = raw.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
