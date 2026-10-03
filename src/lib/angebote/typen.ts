/**
 * Angebots-Register — Form der Einträge und der Auswahl.
 * Ohne Dateizugriff, damit Client-Bausteine die Typen nutzen können.
 */

import { z } from 'zod';

export const SEITENTYPEN = ['rezept', 'glossar', 'temperatur-guide'] as const;
export type Seitentyp = (typeof SEITENTYPEN)[number];

const Wert = z.union([z.string(), z.array(z.string()).min(1)]);

export const AnlassSchema = z.object({
  typ: z.enum(SEITENTYPEN),
  wenn: z.record(Wert).optional(),
  satz: z.string().min(10),
}).strict();

export const AngebotSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(2),
  url: z.string().regex(/^\/[a-z0-9/-]*$/),
  art: z.enum(['gratis', 'bezahlt', 'warteliste']),
  status: z.enum(['live', 'ab_datum', 'warteliste', 'pausiert']),
  // js-yaml liest ein nacktes 2026-11-01 als Datum — beides zulassen, als Text führen.
  ab: z.union([z.string(), z.date()]).optional()
    .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  grund: z.string().optional(),
  preis_text: z.string(),
  knopf: z.string().min(2),
  gewicht: z.number().int().min(1).max(5).default(1),
  anlaesse: z.array(AnlassSchema),
}).strict().superRefine((a, ctx) => {
  if (a.status === 'ab_datum' && !a.ab) {
    ctx.addIssue({ code: 'custom', message: `${a.id}: status ab_datum verlangt das Feld „ab"` });
  }
  if (a.status === 'pausiert' && !a.grund) {
    ctx.addIssue({ code: 'custom', message: `${a.id}: status pausiert verlangt das Feld „grund"` });
  }
  if (a.status === 'pausiert' && a.anlaesse.length > 0) {
    ctx.addIssue({ code: 'custom', message: `${a.id}: pausierte Angebote haben keine Anlässe` });
  }
});

export const RegisterSchema = z.object({ angebote: z.array(AngebotSchema).min(1) }).strict()
  .superRefine((r, ctx) => {
    const ids = r.angebote.map((a) => a.id);
    const doppelt = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (doppelt.length) ctx.addIssue({ code: 'custom', message: `doppelte id: ${[...new Set(doppelt)].join(', ')}` });
  });

export type Angebot = z.infer<typeof AngebotSchema>;
export type Anlass = z.infer<typeof AnlassSchema>;

/** Was die Seite über sich weiß — Frontmatter-Felder, alle optional. */
export interface Seitenkontext {
  typ: Seitentyp;
  /** Stabiler Schlüssel der Seite (Slug). Bestimmt die Auswahl bei mehreren passenden Angeboten. */
  slug: string;
  felder?: Record<string, string | null | undefined>;
}

/** Ein Angebot, fertig für die Anzeige an einer bestimmten Seite. */
export interface Hinweis {
  id: string;
  name: string;
  url: string;
  satz: string;
  knopf: string;
  /** „Kostenlos" · „ab 1. November" · „Warteliste" · Preis */
  marke: string;
  art: Angebot['art'];
}
