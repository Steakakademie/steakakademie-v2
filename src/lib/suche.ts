import {
  allArtikels, allCuts, allMethodes, allVergleiches, allGlossars,
  allRecipes, allUsaBbqStyles, allStreitfalls, allPersoenlichkeits,
} from 'contentlayer/generated';
import { nurVeroeffentlicht } from '@/lib/redaktion';

// ─────────────────────────────────────────────────────────────────────────────
// Volltextsuche — EINE Quelle fuer /suche (Alt-Design) und /relaunch/suche.
//
// Am 05.09.2026 aus src/app/suche/page.tsx herausgeloest, unveraendert. Zwei
// Suchen mit je eigener Sammel- und Bewertungslogik waeren zwei Wahrheiten
// darueber, was auffindbar ist — und der Redaktionsvorbehalt unten ist genau
// die Sorte Regel, die man nicht zweimal pflegen will.
// ─────────────────────────────────────────────────────────────────────────────

export type Hit = { url: string; title: string; snippet: string; kind: string };

function norm(s: string) {
  // Kombinierende Diakritika (U+0300–U+036F) — genau das, was normalize('NFD')
  // abspaltet. Bewusst nicht /\p{Diacritic}/gu: das braucht ein ES6-Ziel, das
  // die tsconfig nicht setzt, und hat den Vercel-Build rot gemacht.
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function collect(): Hit[] {
  // Redaktionsvorbehalt (AI Act Art. 50 Abs. 4): Entwuerfe duerfen nicht
  // auffindbar sein. Bewusst nurVeroeffentlicht() statt sichtbareArtikel() —
  // letzteres zeigt Entwuerfe in der Entwicklung, und genau so wird eine
  // Entwurfs-URL versehentlich weitergegeben. Eine Suche darf nie auf etwas
  // zeigen, das noch niemand freigegeben hat.
  const of = (docs: any[], kind: string, snippetKey: string): Hit[] =>
    nurVeroeffentlicht(docs).map((d) => ({
      url: d.url as string,
      title: d.title as string,
      snippet: (d[snippetKey] ?? d.excerpt ?? d.shortDefinition ?? '') as string,
      kind,
    }));
  return [
    ...of(allCuts, 'Cut', 'excerpt'),
    ...of(allMethodes, 'Grilltechnik', 'excerpt'),
    ...of(allArtikels, 'Artikel', 'excerpt'),
    // Hiess bis 03.10.2026 „Test & Vergleich“ — die Seiten sind Marktübersichten,
    // kein Gerätetest. Dieselbe Bezeichnung steht in TYP_REIHENFOLGE der
    // Relaunch-Suche (src/app/relaunch/suche/page.tsx).
    ...of(allVergleiches, 'Vergleich', 'excerpt'),
    ...of(allRecipes, 'Rezept', 'excerpt'),
    ...of(allGlossars, 'Glossar', 'shortDefinition'),
    ...of(allUsaBbqStyles, 'USA-Expedition', 'excerpt'),
    ...of(allStreitfalls, 'Streitfall', 'excerpt'),
    ...of(allPersoenlichkeits, 'Persönlichkeit', 'excerpt'),
  ];
}

export function search(q: string): Hit[] {
  const nq = norm(q);
  if (nq.length < 2) return [];
  const scored = collect().flatMap((h) => {
    const t = norm(h.title);
    const s = norm(h.snippet);
    let score = 0;
    if (t.startsWith(nq)) score = 3;
    else if (t.includes(nq)) score = 2;
    else if (s.includes(nq)) score = 1;
    return score ? [{ h, score }] : [];
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 50).map((x) => x.h);
}
