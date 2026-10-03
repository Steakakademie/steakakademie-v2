import { alsSatzanfang, pruefangabe, pruefdatumIso, type Pruefbar } from '@/lib/pruefnachweis';

/**
 * Sichtbarer Prüfvermerk an einem einzelnen Dokument (03.10.2026).
 *
 * Rendert NICHTS, solange das Dokument kein gültiges `reviewedAt` trägt — es
 * gibt keine Fassung ohne Datum. Damit steht auf der Seite dasselbe wie im
 * strukturierten Teil (`pruefvermerkSchema` in src/lib/schema.ts): Bis hierher
 * trugen Artikel und Fleischwissen den Vermerk nur im JSON-LD, sichtbar fehlte er.
 *
 * Wortlaut und Regel: src/lib/pruefnachweis.ts.
 */
export default function Pruefvermerk({
  dokument,
  className = 'text-xs font-sans text-text-muted leading-relaxed',
}: {
  dokument?: Pruefbar | null;
  className?: string;
}) {
  const text = pruefangabe(dokument);
  const iso = pruefdatumIso(dokument);
  if (!text || !iso) return null;
  return (
    <p className={className} data-pruefdatum={iso}>
      {alsSatzanfang(text)}.
    </p>
  );
}
