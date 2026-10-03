import Link from 'next/link';
import { getAuthorBySlug } from '@/lib/authors';
import { pruefsatz, verantwortungsangabe, type Pruefbar } from '@/lib/pruefnachweis';

/**
 * Der Satz unter der Autorenzeile — eine Quelle für Cut-, Methoden- und
 * Rezeptseiten.
 *
 * ANLASS (06.09.2026): Dort stand fest verdrahtet „Steakakademie-Autor. Jeder
 * Artikel basiert auf eigener Praxiserfahrung …". Das stimmt für Uwe. Für die
 * KI-Redaktionspersonas Marco, Jonas und Elena ist es sachlich falsch und
 * rechtlich heikel: Art. 50 KI-VO verlangt, dass KI-Herkunft erkennbar ist —
 * hier wurde das Gegenteil behauptet. Der Satz stand so bereits unter 136
 * Persona-Artikeln; aufgefallen ist es, als Uwe die Autorenstimme abgab und
 * 32 weitere Artikel auf Personas umzogen.
 *
 * Regel 6 (Rechtssicherheit → autonom fixen) greift hier.
 *
 * 03.10.2026 — „geprüft“ nur mit Prüfdatum: Bis dahin stand unter JEDEM
 * Persona-Text „werden fachlich geprüft und verantwortet“, auch wenn das
 * Dokument kein `reviewedAt` trug. Der Satz nennt jetzt immer die KI-Herkunft
 * und den fachlich Verantwortlichen; die Prüfung steht nur dabei, wenn
 * `dokument` ein gültiges Prüfdatum hat — dann mit Datum. Wortlaut und Regel
 * kommen aus src/lib/pruefnachweis.ts.
 */
export default function AutorHinweis({
  authorSlug,
  variante = 'artikel',
  className = 'text-xs font-sans text-text-muted mt-1 leading-relaxed',
  linkClassName = 'underline hover:text-brand-fire',
  dokument,
}: {
  authorSlug: string;
  /** „rezept" nennt den Grilltest, „artikel" die methodische Grundlage. */
  variante?: 'artikel' | 'rezept';
  className?: string;
  linkClassName?: string;
  /**
   * Das Dokument, unter dem der Hinweis steht (`reviewedAt`/`reviewed`). Fehlt
   * es — etwa auf einer Seite ohne eigenes Dokument —, gibt es keine Prüf-Aussage.
   */
  dokument?: Pruefbar | null;
}) {
  const autor = getAuthorBySlug(authorSlug);

  // Unbekannter Slug: lieber die vorsichtige Persona-Formulierung als eine
  // Behauptung über einen Menschen, den es im Autorenregister nicht gibt.
  if (autor?.realPerson) {
    return (
      <p className={className}>
        {variante === 'rezept'
          ? 'Steakakademie-Autor. Alle Rezepte basieren auf eigener Praxiserfahrung.'
          : 'Steakakademie-Autor. Jeder Artikel basiert auf eigener Praxiserfahrung und methodisch belegten Angaben.'}
      </p>
    );
  }

  const geprueft = pruefsatz(dokument, variante === 'rezept' ? 'Dieses Rezept' : 'Dieser Beitrag');

  return (
    <p className={className}>
      KI-Redaktionspersona der Steakakademie. {variante === 'rezept' ? 'Rezepte' : 'Inhalte'}{' '}
      entstehen KI-unterstützt auf Grundlage der kanonischen Temperatur- und Cut-Referenz und
      werden {verantwortungsangabe({ gruender: true })}.{' '}
      {geprueft && <>{geprueft}{' '}</>}
      <Link href="/ki-disclaimer" className={linkClassName}>Mehr im KI-Disclaimer</Link>.
    </p>
  );
}
