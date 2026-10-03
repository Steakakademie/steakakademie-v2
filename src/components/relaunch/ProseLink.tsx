import type { AnchorHTMLAttributes } from 'react';
import Link from 'next/link';
import MdxTextLink, { istPartnerlink } from '@/components/affiliate/MdxTextLink';

/**
 * Link-Renderer für Markdown-Links im Lesetext des Relaunches (`a` in skMdx).
 *
 * Partnerlinks (03.10.2026): Ein `/go/<id>`-Link beginnt mit „/" und lief deshalb
 * als gewöhnlicher interner Link durch `next/link` — ohne `rel`, ohne das Wort
 * „Anzeige", und mit Prefetch auf eine Weiterleitung. Er geht jetzt an denselben
 * Baustein wie auf den Alt-Seiten (MdxTextLink): eine Stelle für `rel` und
 * Kennzeichnung, hier nichts davon kopiert. Die Hülle `sk-prose__partner` sorgt
 * nur dafür, dass das Etikett auf der hellen Ebene lesbar ist (relaunch.css) —
 * MdxTextLink färbt es für dunklen Grund.
 *
 * Eigene Datei statt Inline-Funktion in Prose.tsx, damit Vitest sie prüfen kann.
 */
export default function ProseLink({ href = '', ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (istPartnerlink(href)) {
    return (
      <span className="sk-prose__partner">
        <MdxTextLink href={href} {...props} className="sk-prose__a" />
      </span>
    );
  }
  return href.startsWith('/')
    ? <Link href={href} className="sk-prose__a" {...props} />
    : <a href={href} className="sk-prose__a" rel="noopener" {...props} />;
}
