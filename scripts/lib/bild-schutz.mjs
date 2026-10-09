// Schutz handgewaehlter Rezeptbilder vor `recipe-images.mjs --force`.
//
// WARUM: --force erzeugt jedes Hero-Bild neu. Ein Bild, das Uwe von Hand gewaehlt hat
// (Stockfoto, eigenes Foto, Bild aus einem anderen KI-Werkzeug), waere danach weg —
// ohne Rueckfrage. Anlass: Nuea Yang Nam Tok (Pexels) und Canadian Back Bacon
// (fremdes KI-Werkzeug), beide 07.10.2026.
//
// REGEL: Neu erzeugt wird nur, was dieses Skript selbst erzeugt hat oder dessen
// Herkunft nie geklaert wurde. Alles andere bleibt.

const frontmatterWert = (raw, feld) => {
  const m = raw.match(new RegExp(`^${feld}:\\s*(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''
}

/** true, wenn das Hero-Bild des Rezepts von Hand gewaehlt wurde und nicht ueberschrieben werden darf. */
export function istHandgewaehlt(raw) {
  // Ausdruecklich kein KI-Bild: echtes Foto (Bildregister: eigen oder lizenz).
  if (/^imageAI:\s*false\s*$/m.test(raw)) return true
  const quelle = frontmatterWert(raw, 'imageSource')
  if (!quelle) return false
  // Eigene Erzeugnisse (fal.ai) und der Altbestand ohne geklaerte Herkunft duerfen neu.
  if (/fal\.ai/i.test(quelle) || /visuell klassifiziert/i.test(quelle)) return false
  return true
}
