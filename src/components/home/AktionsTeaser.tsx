import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';
import { aktiveAktionen } from '@/lib/aktionen';
import { aktionUrl } from '@/lib/aktionen/nav';

/**
 * Aktions-Teaser der Startseite (Uwe, 11.10.2026: „bau den Teaser und den Menüpunkt").
 *
 * Steht unter dem Gutschein-Teaser (Startseiten-Hierarchie: Angebote nie oben,
 * CLAUDE.md Regel 8, Marker AKTIONS-TEASER) und erscheint nur, solange mindestens
 * eine Aktionsseite in ihrem Saisonfenster ist (data/aktionen/*.yaml). Die Startseite
 * wird stündlich neu gerendert (revalidate 3600), das Fenster greift also ohne Deploy.
 * Keine Preise, kein Countdown — nur Thema und Weg dorthin.
 */
export default function AktionsTeaser() {
  const aktionen = aktiveAktionen();
  if (aktionen.length === 0) return null;

  return (
    <section className="max-w-editorial mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-label="Aktuelle Themen">
      <div className="flex items-center gap-3 mb-5">
        <Sparkles size={22} className="text-brand-gold" aria-hidden="true" />
        <h2 className="font-serif text-2xl font-bold text-text-primary">Gerade passend</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {aktionen.map((a) => (
          <Link
            key={a.slug}
            href={aktionUrl(a.slug)}
            className="group border border-border-subtle bg-surface-card p-6 hover:border-brand-gold/50 transition-colors"
          >
            <h3 className="font-serif text-xl font-bold text-text-primary mb-2 group-hover:text-brand-gold transition-colors">
              {a.titel}
            </h3>
            <p className="font-body text-sm text-text-secondary leading-relaxed mb-4">{a.untertitel}</p>
            <span className="inline-flex items-center gap-1 font-sans text-sm font-bold text-brand-gold">
              Ansehen <ChevronRight size={14} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
