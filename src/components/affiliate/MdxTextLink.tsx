import type { AnchorHTMLAttributes } from 'react';

/** Ein Markdown-Link auf `/go/<id>` ist ein Partnerlink (Tracking-Redirect zum Händler). */
export function istPartnerlink(href?: string | null): boolean {
  return typeof href === 'string' && href.startsWith('/go/');
}

/**
 * Link-Renderer für Markdown-Links im Fließtext der Vergleichsseiten
 * (`a` in den mdxComponents von src/app/vergleich/[slug]/page.tsx).
 *
 * Werbekennzeichnung (03.10.2026): Ein `/go/`-Link trug bis dahin nur
 * `rel="sponsored noopener"` — das sieht kein Mensch. „Anzeige“ muss als
 * lesbares Wort direkt am Link stehen, VOR dem Klick (CLAUDE.md §2 Regel 1);
 * ein `title`, ein Sternchen oder der Hinweis am Seitenende reichen nicht.
 * Eigene Datei statt Inline-Funktion in der Seite, damit Vitest sie prüfen kann
 * (die Seite selbst importiert contentlayer/generated).
 */
export default function MdxTextLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const partnerlink = istPartnerlink(href);
  return (
    <>
      <a
        href={href}
        rel={partnerlink ? 'sponsored nofollow noopener' : undefined}
        className="text-brand-fire font-medium hover:text-brand-gold transition-colors"
        {...props}
      >
        {children}
      </a>
      {partnerlink && (
        <span className="ml-1 text-[10px] font-sans font-bold tracking-[0.12em] uppercase text-text-light/65 whitespace-nowrap">
          Anzeige
        </span>
      )}
    </>
  );
}
