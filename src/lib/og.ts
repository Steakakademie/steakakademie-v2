/**
 * OG-Bilder für die Metadaten einer Seite.
 *
 * Hintergrund (Plan C5, og:image-Sweep): Next.js merged `metadata` nur flach.
 * Definiert eine Seite ein eigenes `openGraph`-Objekt, ERSETZT das den Eintrag
 * aus dem Root-Layout komplett — samt dessen `images`. 32 Seiten hatten deshalb
 * gar kein og:image, im Live-Test etwa /glossar und /methoden.
 *
 * `ogImages()` liefert denselben Eintrag wie das Root-Layout, optional mit
 * seitenspezifischem Titel für /api/og. Ohne Argument ist das Ergebnis mit dem
 * Root-Default identisch.
 */

export const OG_BREITE = 1200;
export const OG_HOEHE = 630;

/**
 * @param titel  Überschrift im Bild. Ohne Angabe: „Deutschlands BBQ-Wissensplattform".
 * @param sub    Unterzeile. Ohne Angabe: die Rubriken-Zeile der Startseite.
 */
export function ogImages(titel?: string, sub?: string) {
  const query = new URLSearchParams();
  if (titel) query.set('title', titel);
  if (sub) query.set('sub', sub);
  const suffix = query.toString();

  return [
    {
      url: suffix ? `/api/og?${suffix}` : '/api/og',
      width: OG_BREITE,
      height: OG_HOEHE,
      alt: titel ? `${titel} — Steakakademie` : 'Steakakademie — BBQ Wissen auf Deutsch',
    },
  ];
}
