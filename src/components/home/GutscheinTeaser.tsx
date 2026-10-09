import Link from 'next/link';
import { Gift, ChevronRight } from 'lucide-react';
import { istGeschenkSaison, kaufbareGutscheine } from '@/lib/gutschein-products';

/**
 * Gutschein-Teaser der Startseite (Gutschein-Konzept T8, 09.10.2026).
 *
 * Steht unter dem Diplom-Teaser (Startseiten-Hierarchie: Angebote nie oben,
 * CLAUDE.md Regel 8) und erscheint nur vom 01.11. bis 24.12. — und nur, wenn
 * mindestens ein Gutschein kaufbar ist. Die Startseite wird stündlich neu
 * gerendert (revalidate 3600), das Datum greift also ohne Deploy.
 */
export default function GutscheinTeaser() {
  if (!istGeschenkSaison()) return null;
  const gutscheine = kaufbareGutscheine();
  if (gutscheine.length === 0) return null;

  return (
    <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border border-brand-gold/25 bg-surface-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-3">
          <Gift size={22} className="text-brand-gold" aria-hidden="true" />
          <h2 className="font-serif text-2xl font-bold text-text-primary">Grillkönnen verschenken</h2>
        </div>
        <p className="font-body text-text-secondary leading-relaxed mb-5 max-w-2xl">
          Digitale Geschenkgutscheine der Steakakademie — der Code kommt per E-Mail, zum Weiterleiten
          oder Ausdrucken.
        </p>
        <ul className="flex flex-wrap gap-2 mb-6">
          {gutscheine.map((g) => (
            <li key={g.key} className="border border-border-subtle px-3 py-1.5 text-sm font-sans text-text-secondary">
              {g.title}
              {g.priceLabel && <span className="text-brand-gold font-bold"> · {g.priceLabel}</span>}
            </li>
          ))}
        </ul>
        <Link href="/gutschein" className="inline-flex items-center gap-1 font-sans text-sm font-bold text-brand-gold hover:text-text-primary transition-colors">
          Alle Gutscheine <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
