/**
 * Geräte-Marker in Schritttexten: `[[produkt-id|Wort]]` (siehe typen.ts, Schritt.text).
 * Die Seite rendert daraus einen GeraeteLink; für JSON-LD, Suche und Druck bleibt
 * nur das Wort.
 */
export type SchrittTeil = { typ: 'text'; text: string } | { typ: 'geraet'; id: string; wort: string };

const MARKER = /\[\[([a-z0-9-]+)\|([^\]|]+)\]\]/g;

export function schrittTeile(text: string): SchrittTeil[] {
  const teile: SchrittTeil[] = [];
  let pos = 0;
  for (const m of text.matchAll(MARKER)) {
    const start = m.index ?? 0;
    if (start > pos) teile.push({ typ: 'text', text: text.slice(pos, start) });
    teile.push({ typ: 'geraet', id: m[1], wort: m[2] });
    pos = start + m[0].length;
  }
  if (pos < text.length) teile.push({ typ: 'text', text: text.slice(pos) });
  return teile;
}

export function ohneGeraete(text: string): string {
  return text.replace(MARKER, '$2');
}
