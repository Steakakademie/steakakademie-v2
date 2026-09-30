/**
 * Bild-ID aus dem Dateinamen — ausgelagert aus scripts/bild-ingest.mjs, damit
 * sie ohne dessen Seiteneffekte (Fundgrube lesen, Netz) testbar ist.
 *
 * Pexels benennt nach dem Muster `pexels-<fotograf>-<fotografID>-<fotoID>.jpg`.
 * Die erste Zahl ist dort die Fotografen-ID, nicht die des Bildes — wer sie
 * nimmt, schreibt eine Herkunft ins Manifest, die auf ein fremdes Bild zeigt.
 * Bei Pexels gilt deshalb die LETZTE Zahlengruppe, sonst die fuehrende —
 * auch wenn vor `pexels-` noch eine eigene Beschreibung steht.
 *
 * Unsplash vergibt alphanumerische IDs aus genau 11 Zeichen (z. B.
 * "TDwxg8i8lfE"), die auch `-` und `_` enthalten koennen ("W-M0h1FJD0M").
 * Zwei Formen kommen vor:
 *   - `--hole` speichert unter der nackten ID          → `TDwxg8i8lfE.jpg`
 *   - der Download-Button auf unsplash.com liefert     → `<fotograf>-<ID>-unsplash.jpg`
 *     oft mit vorangestellter eigener Beschreibung     → `Leberspieß - janet-ganbold-xlf1tNGcBH0-unsplash.jpg`
 * Weil die ID selbst Bindestriche enthalten darf, wird sie nicht am Bindestrich
 * zerlegt, sondern als die 11 Zeichen direkt vor `-unsplash` gelesen.
 *
 * @param {string} name  Dateiname OHNE Endung
 * @param {string} quelle Ordnerschluessel (pexels, unsplash, pixabay, ...)
 * @returns {string|null}
 */
export function leseId(name, quelle) {
  if (quelle === 'unsplash') {
    const download = name.match(/(?:^|-)([A-Za-z0-9_-]{11})-unsplash$/i)
    if (download) return download[1]
    return /^[A-Za-z0-9_-]{6,}$/.test(name) ? name : null
  }
  // Nicht nur am Namensanfang: eine vorangestellte eigene Beschreibung
  // ("short ribs - pexels-<fotograf>-<fotografID>-<fotoID>") liess die Regel
  // frueher ins Leere laufen, und der Fallback las die Fotografen-ID.
  if (quelle === 'pexels' || /pexels[-_]/i.test(name)) {
    const zahlen = name.match(/\d{4,}/g)
    return zahlen ? zahlen[zahlen.length - 1] : null
  }
  const vorn = name.match(/^(\d{4,})/)
  if (vorn) return vorn[1]
  const irgendwo = name.match(/(\d{6,})/)
  return irgendwo ? irgendwo[1] : null
}
