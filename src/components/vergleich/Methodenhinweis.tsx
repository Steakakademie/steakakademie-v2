import { ClipboardList } from 'lucide-react';
import { METHODENSATZ, METHODEN_ERLAEUTERUNG } from '@/lib/vergleich-seite';

/**
 * Der offene Methodensatz — sichtbar oben auf jeder Vergleichsseite
 * (03.10.2026). Er ersetzt die Karte „Getestet: N Modelle · Testdauer: …“:
 * Die Seiten sind eine Marktübersicht nach Herstellerangaben, kein Gerätetest.
 * `modelle` wird gezählt (vergleichsProdukte), nicht aus dem Frontmatter gelesen.
 */
export default function Methodenhinweis({ modelle }: { modelle?: number }) {
  return (
    <div
      className="mb-6 p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(200,136,42,0.09) 0%, rgba(232,80,24,0.03) 100%)',
        border: '1px solid rgba(200,136,42,0.22)',
      }}
      data-methodenhinweis
    >
      <div className="flex items-start gap-3">
        <ClipboardList size={18} className="text-brand-gold mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-sans font-bold text-sm text-text-light leading-snug">{METHODENSATZ}</p>
          <p className="font-sans text-xs text-text-light/60 leading-relaxed mt-1.5">{METHODEN_ERLAEUTERUNG}</p>
          {typeof modelle === 'number' && modelle > 0 && (
            <p className="font-sans text-xs text-text-light/50 tracking-wide mt-2">
              {modelle} {modelle === 1 ? 'Modell' : 'Modelle'} in dieser Übersicht
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
