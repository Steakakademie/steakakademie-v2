import { Beef, ExternalLink } from 'lucide-react';

/**
 * „Cut → bestellen“-Hinweis für Rezeptseiten.
 * Verlinkt den Haupt-Cut in die Shop-Suche zweier Fleischversender
 * (Otto Gourmet, Albers).
 *
 * Wortwahl (03.10.2026): Bis dahin stand hier „bei unseren Partnern“ und
 * „Unabhängige Partner-Empfehlung. Affiliate-Tracking folgt nach Anmeldung.“
 * Die Links tragen aber keine Partner-Kennung, es fließt keine Provision —
 * „Partner“ war eine Behauptung ohne Deckung. Der Text sagt jetzt nur, was am
 * Link belegbar ist. Lieferung, Kühlung und Qualität sind Sache des Händlers
 * und werden hier nicht zugesagt.
 * Wird ein Link später zum Partnerlink: über /go/ führen, rel="sponsored",
 * sichtbar „Anzeige“ an die Karte (CLAUDE.md §2 Regel 1) — und diesen Text ändern.
 */
const HAENDLER = (cut: string) => [
  { name: 'Otto Gourmet', url: `https://www.otto-gourmet.de/catalogsearch/result/?q=${encodeURIComponent(cut)}` },
  { name: 'Albers Food',  url: `https://www.albersfoodshop.de/search?search=${encodeURIComponent(cut)}` },
];

export default function CutBestellen({ cut, kategorie }: { cut?: string; kategorie?: string }) {
  if (kategorie !== 'fleisch' || !cut || cut.trim() === '' || cut.trim() === '—') return null;

  return (
    <aside className="not-prose my-8 border border-brand-gold/25 bg-surface-elevated p-6" aria-label="Cut online finden">
      <div className="flex items-start gap-3">
        <Beef size={20} className="text-brand-gold shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-sans font-bold tracking-[0.16em] uppercase text-brand-gold mb-1">
            Diesen Cut online finden
          </p>
          <p className="font-body text-sm text-text-secondary leading-relaxed mb-4">
            Du suchst <strong className="text-text-primary">{cut}</strong>? Diese Links führen dich direkt
            in die Shop-Suche zweier Fleischversender:
          </p>
          <div className="flex flex-wrap gap-3">
            {HAENDLER(cut).map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border text-sm font-sans font-bold transition-colors hover:bg-brand-gold/10"
                style={{ borderColor: 'rgba(200,136,42,0.5)', color: '#C8882A' }}
              >
                {p.name} <ExternalLink size={13} />
              </a>
            ))}
          </div>
          <p className="text-[10px] font-sans text-text-muted/70 mt-3">
            Einfache Suchlinks, keine Affiliate-Links — wir bekommen dafür keine Provision. Sortiment,
            Preis und Versand liegen beim jeweiligen Händler.
          </p>
        </div>
      </div>
    </aside>
  );
}
