/**
 * Inhaltsverzeichnis aus den h2-Ueberschriften eines MDX-Dokuments (03.10.2026).
 *
 * Anlass: Die Seitenleiste „Inhalt" auf /cuts/[slug] war fest auf Ribeye
 * verdrahtet und stand so auch auf Brisket und Pulled Pork; die Ueberschriften
 * trugen keine `id`, alle sechs Sprunglinks liefen ins Leere.
 *
 * Eine Slug-Funktion fuer beide Seiten: Das Verzeichnis liest die `## `-Zeilen
 * aus dem Rohtext, die h2-Komponente der Seite bildet ihre `id` aus dem
 * gerenderten Text — beide ueber ueberschriftSlug(). Satzzeichen fallen dabei
 * weg, kleine Unterschiede zwischen Roh- und Rendertext also auch.
 *
 * Reine Funktionen, keine React-Abhaengigkeit.
 */

export type Abschnitt = {
  /** Anker ohne `#` — zugleich die `id` der Ueberschrift */
  id: string;
  /** Ueberschrift als Klartext */
  titel: string;
};

/** „Kerntemperaturen für Ribeye" → „kerntemperaturen-fuer-ribeye" */
export function ueberschriftSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' und ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Markdown-Auszeichnung einer Ueberschrift entfernen: Links, Betonung, Code, Tags. */
function klartext(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*`]|__/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Text eines gerenderten Ueberschrift-Knotens (React-children) — fuer die `id`
 * der h2-Komponente. Bewusst ohne React-Import: geprueft wird nur die Form.
 */
export function knotenText(knoten: unknown): string {
  if (typeof knoten === 'string' || typeof knoten === 'number') return String(knoten);
  if (Array.isArray(knoten)) return knoten.map(knotenText).join('');
  if (knoten && typeof knoten === 'object' && 'props' in knoten) {
    return knotenText((knoten as { props?: { children?: unknown } }).props?.children);
  }
  return '';
}

/**
 * Die h2-Ueberschriften („## ") eines MDX-Rohtexts in Dokumentreihenfolge.
 * Codebloecke werden uebersprungen. Eine zweite Ueberschrift mit demselben Slug
 * faellt heraus: Die h2-Komponente kennt keine Zaehlung, ein „-2"-Anker haette
 * kein Ziel.
 */
export function inhaltsverzeichnis(raw: string): Abschnitt[] {
  const abschnitte: Abschnitt[] = [];
  const gesehen = new Set<string>();
  let imCodeblock = false;

  for (const zeile of raw.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(zeile)) {
      imCodeblock = !imCodeblock;
      continue;
    }
    if (imCodeblock) continue;

    const treffer = /^##[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(zeile);
    if (!treffer) continue;

    const titel = klartext(treffer[1]);
    const id = ueberschriftSlug(titel);
    if (!id || gesehen.has(id)) continue;

    gesehen.add(id);
    abschnitte.push({ id, titel });
  }

  return abschnitte;
}
