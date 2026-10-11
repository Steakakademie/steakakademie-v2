/**
 * Aktionsseiten — Form der Einträge in data/aktionen/*.yaml (11.10.2026).
 *
 * Konzept: docs/affiliate-aktionen-bundles-konzept-2026.md, Abschnitt 8. Eine Aktionsseite
 * ist eine Themenseite für ein Saisonfenster (Geschenke, Weihnachtsmenü, Neujahr …) mit
 * „Setups": kuratierte Zusammenstellungen aus Registry-Produkten — je Artikel ein eigener
 * Link in seinen Shop, kein Paketpreis, kein Warenkorb. Ohne Dateizugriff, damit Tests und
 * die Sitemap-Konfiguration die Form teilen können.
 */
import { z } from 'zod';

const MMTT = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const FensterSchema = z.object({
  /** erster Tag, MM-TT, deutscher Jahreslauf */
  von: z.string().regex(MMTT),
  /** letzter Tag (einschließlich), MM-TT; darf vor `von` liegen (Jahreswechsel) */
  bis: z.string().regex(MMTT),
}).strict();

export const SetupProduktSchema = z.object({
  /** id aus products/registry.yaml */
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  /** Warum dieses Teil in dieses Setup gehört — unser Wissen, kein Händlertext. */
  warum: z.string().min(20).max(400),
}).strict();

export const SetupSchema = z.object({
  titel: z.string().min(3).max(80),
  /** Für wen das Setup ist, in einem oder zwei Sätzen. */
  fuer: z.string().min(10).max(300),
  produkte: z.array(SetupProduktSchema).min(2).max(6),
}).strict();

export const EigenerTeilSchema = z.object({
  titel: z.string().min(3).max(80),
  text: z.string().min(20).max(400),
  /** interne Adresse, z. B. /gutschein */
  url: z.string().regex(/^\/[a-z0-9/-]*$/),
  knopf: z.string().min(2).max(40),
}).strict();

export const FaqSchema = z.object({
  frage: z.string().min(5).max(160),
  antwort: z.string().min(20).max(600),
}).strict();

export const AktionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  titel: z.string().min(5).max(90),
  untertitel: z.string().min(10).max(220),
  seoTitle: z.string().min(10).max(70),
  seoDescription: z.string().min(50).max(160),
  fenster: FensterSchema,
  /** Absätze der Einleitung — kein Markdown, nur Text. */
  einleitung: z.array(z.string().min(20)).min(1).max(5),
  setups: z.array(SetupSchema).min(1).max(8),
  /** Was wir selbst anbieten (Gutschein, Guide, Spickzettel) — steht nach den Setups. */
  eigener_teil: z.array(EigenerTeilSchema).max(4).default([]),
  faq: z.array(FaqSchema).max(8).default([]),
  /**
   * Pflichthinweis am Seitenende, z. B. zu Alkohol („für Erwachsene ab 18"). Der
   * Kennzeichnungsblock (Partnerlinks, Amazon-Satz) steht immer, unabhängig davon.
   */
  hinweis: z.string().max(300).optional(),
}).strict();

export type Aktion = z.infer<typeof AktionSchema>;
export type Setup = z.infer<typeof SetupSchema>;

/** Tag im Jahr als „MM-TT" in deutscher Zeit — damit das Fenster nicht um Mitternacht UTC kippt. */
export function heuteMMTT(jetzt: Date = new Date()): string {
  const teile = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', month: '2-digit', day: '2-digit' })
    .formatToParts(jetzt);
  const m = teile.find((t) => t.type === 'month')?.value;
  const t = teile.find((t) => t.type === 'day')?.value;
  return `${m}-${t}`;
}

/** Liegt der Tag im Fenster? Fenster über den Jahreswechsel (von > bis) eingeschlossen. */
export function imFenster(fenster: { von: string; bis: string }, mmtt: string): boolean {
  if (fenster.von <= fenster.bis) return mmtt >= fenster.von && mmtt <= fenster.bis;
  return mmtt >= fenster.von || mmtt <= fenster.bis;
}

/** Tage bis zum Beginn des Fensters (0 = heute drin oder beginnt heute), höchstens 365. */
export function tageBisBeginn(fenster: { von: string; bis: string }, jetzt: Date = new Date()): number {
  const heute = heuteMMTT(jetzt);
  if (imFenster(fenster, heute)) return 0;
  const jahr = Number(new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', year: 'numeric' }).format(jetzt));
  const [m, t] = fenster.von.split('-').map(Number);
  const [hm, ht] = heute.split('-').map(Number);
  const beginn = Date.UTC(fenster.von > heute ? jahr : jahr + 1, m - 1, t);
  const heuteUtc = Date.UTC(jahr, hm - 1, ht);
  return Math.round((beginn - heuteUtc) / 86_400_000);
}
