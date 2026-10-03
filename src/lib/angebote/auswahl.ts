/**
 * Angebots-Register — Auswahl: Welche Angebote passen zu dieser Seite?
 *
 * Reine Logik, ohne Dateizugriff und ohne Zufall. Dieselbe Seite bekommt bei
 * jedem Build denselben Hinweis (stabil für Cache, Tests und den Leser, der
 * zurückkommt); verschiedene Seiten verteilen sich nach `gewicht` auf die
 * passenden Angebote. So wirbt nicht jedes der 78 Fleisch-Rezepte für dasselbe.
 *
 * KEIN 'use client' in dieser Datei (CLAUDE.md A, 06.09.2026): Server-Bausteine
 * rufen diese Funktionen direkt auf.
 */

import type { Angebot, Anlass, Hinweis, Seitenkontext } from './typen';

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function norm(v: string): string {
  return v.trim().toLowerCase().replace(/^"|"$/g, '');
}

function trifftZu(anlass: Anlass, kontext: Seitenkontext): boolean {
  if (anlass.typ !== kontext.typ) return false;
  for (const [feld, erwartet] of Object.entries(anlass.wenn ?? {})) {
    const ist = kontext.felder?.[feld];
    if (typeof ist !== 'string' || !ist.trim()) return false;
    const liste = Array.isArray(erwartet) ? erwartet : [erwartet];
    if (!liste.some((w) => norm(w) === norm(ist))) return false;
  }
  return true;
}

/** „ab 1. November" — das Jahr nur, wenn es nicht das laufende ist. */
export function abText(iso: string, heute: Date = new Date()): string {
  const [jahr, monat, tag] = iso.split('-').map(Number);
  const basis = `ab ${tag}. ${MONATE[monat - 1]}`;
  return jahr === heute.getFullYear() ? basis : `${basis} ${jahr}`;
}

export function markeVon(a: Angebot, heute: Date = new Date()): string {
  if (a.status === 'ab_datum' && a.ab) return abText(a.ab, heute);
  if (a.status === 'warteliste') return 'Warteliste';
  if (a.art === 'gratis') return 'Kostenlos';
  return a.preis_text;
}

/** FNV-1a — klein, stabil, ohne Abhängigkeit. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Alle Angebote, die zu dieser Seite passen — in fester, seitenabhängiger
 * Reihenfolge. Der erste Eintrag ist der Hinweis im Text, die folgenden füllen
 * das Regal am Seitenende.
 */
export function passendeHinweise(angebote: Angebot[], kontext: Seitenkontext, heute: Date = new Date()): Hinweis[] {
  const treffer: { angebot: Angebot; satz: string }[] = [];
  for (const angebot of angebote) {
    if (angebot.status === 'pausiert') continue;
    const anlass = angebot.anlaesse.find((a) => trifftZu(a, kontext));
    if (anlass) treffer.push({ angebot, satz: anlass.satz });
  }

  // Gewichtete, feste Reihenfolge: je Angebot ein Rang aus Seite + Angebot,
  // geteilt durchs Gewicht — höheres Gewicht landet öfter vorn.
  const mitRang = treffer.map((t) => ({
    ...t,
    rang: (hash(`${kontext.typ}:${kontext.slug}:${t.angebot.id}`) / 0xffffffff) / t.angebot.gewicht,
  }));
  mitRang.sort((a, b) => a.rang - b.rang || a.angebot.id.localeCompare(b.angebot.id));

  return mitRang.map(({ angebot, satz }) => ({
    id: angebot.id,
    name: angebot.name,
    url: angebot.url,
    satz,
    knopf: angebot.knopf,
    marke: markeVon(angebot, heute),
    art: angebot.art,
  }));
}

/** Der eine Hinweis im Text — oder null, wenn kein Anlass zutrifft. */
export function hinweisImText(angebote: Angebot[], kontext: Seitenkontext, heute?: Date): Hinweis | null {
  return passendeHinweise(angebote, kontext, heute)[0] ?? null;
}

/**
 * Das Regal am Seitenende: höchstens drei, ohne das Angebot, das auf derselben
 * Seite schon im Text steht.
 */
export function regal(angebote: Angebot[], kontext: Seitenkontext, opts: { ohne?: string | null; max?: number } = {}, heute?: Date): Hinweis[] {
  return passendeHinweise(angebote, kontext, heute)
    .filter((h) => h.id !== opts.ohne)
    .slice(0, opts.max ?? 3);
}
