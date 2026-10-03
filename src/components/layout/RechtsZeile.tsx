import Link from 'next/link';

/**
 * Schlichte Rechts-Zeile fuer Seiten ohne Footer (03.10.2026).
 *
 * Die vier Dankeseiten direkt nach dem Kauf hatten weder „Vertrag widerrufen"
 * noch Impressum, Datenschutz und AGB — die AGB sagen die Widerrufs-Schaltflaeche
 * aber „im Footer jeder Seite" zu. Bewusst nur Links, kein zweiter Footer.
 */
const LINKS = [
  { href: '/widerruf', label: 'Vertrag widerrufen' },
  { href: '/impressum', label: 'Impressum' },
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/agb', label: 'AGB' },
] as const;

export default function RechtsZeile() {
  return (
    <nav
      aria-label="Rechtliches"
      className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/40"
    >
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="underline underline-offset-4 hover:text-white/70 transition-colors"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
