import Link from 'next/link';
import { Gift } from 'lucide-react';
import { gutscheinKaufbar } from '@/lib/gutschein-products';

/**
 * „Auch als Gutschein" auf einer Produktseite (Gutschein-Konzept T8, 09.10.2026).
 *
 * Erscheint nur, wenn es für diesen Kurs einen kaufbaren Gutschein gibt
 * (Checkout-Variable gesetzt). Ohne das wäre der Hinweis eine Zusage, die auf
 * /gutschein bei „In Vorbereitung" endet.
 */
export default function GutscheinHinweis({ courseSlug, titel }: { courseSlug: string; titel: string }) {
  if (!gutscheinKaufbar(courseSlug)) return null;

  return (
    <section className="border-b border-border-subtle">
      <div className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-content mx-auto flex flex-col sm:flex-row sm:items-center gap-4 border border-brand-gold/25 bg-brand-gold/5 p-5">
          <Gift size={28} className="text-brand-gold shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-serif text-lg font-bold text-text-primary">{titel} verschenken</p>
            <p className="font-body text-sm text-text-secondary leading-relaxed">
              Gibt es auch als Geschenkgutschein: Du bekommst einen Code per E-Mail, die beschenkte
              Person löst ihn mit eigenem Konto ein.
            </p>
          </div>
          <Link href="/gutschein" className="btn-affiliate justify-center shrink-0">
            <Gift size={15} aria-hidden="true" /> Zu den Gutscheinen
          </Link>
        </div>
      </div>
    </section>
  );
}
