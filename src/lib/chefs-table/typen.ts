/**
 * Chefs' Table — Form der Küchenpartner-Einträge in data/chefs-table/*.yaml (25.10.2026).
 *
 * Konzept: Projekt-Dokument „konzept_portraitseite_kuechenpartner_2026-10-24"
 * (Abschnitte 2, 4, 5). Ein Küchenpartner ist ein geprüfter Profi (Restaurant,
 * Kochschule, Eventküche, Koch), der nur auf Einladung aufgenommen wird und eine
 * eigene Porträtseite unter /chefs-table/<slug> bekommt. Ohne Dateizugriff, damit
 * Tests und die Sitemap-Konfiguration die Form teilen können.
 *
 * Bewusst KEINE Bewertungen, Sterne, Preise oder Vergleiche zwischen Partnern
 * (Markenregel: nichts Abwertendes). Externe Links tragen rel="sponsored".
 */
import { z } from 'zod';

export const PARTNER_ARTEN = {
  restaurant: 'Restaurant',
  kochschule: 'Kochschule',
  eventkueche: 'Eventküche',
  koch: 'Koch',
} as const;
export type PartnerArt = keyof typeof PARTNER_ARTEN;

export const LAENDER = { DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz' } as const;
export type Land = keyof typeof LAENDER;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HTTPS = /^https:\/\/[^\s]+$/;

export const PartnerRezeptSchema = z.object({
  titel: z.string().min(3).max(120),
  /** interne Adresse des Rezepts, z. B. /rezepte/usa/brisket — fehlt sie, ist das Rezept angekündigt */
  url: z.string().regex(/^\/[a-z0-9/-]*$/).optional(),
  /** VIP-Rezept (gesperrt) oder frei */
  vip: z.boolean().default(false),
  /** Land/Kategorie und Technik als Kicker, z. B. „USA · Reverse Sear" */
  kicker: z.string().min(2).max(80),
  zeit: z.string().min(2).max(40).optional(),
  portionen: z.string().min(1).max(40).optional(),
}).strict();

export const FaktenSchema = z.object({
  /** Name exakt wie im Google-Unternehmensprofil */
  name: z.string().min(2).max(120),
  adresse: z.string().min(5).max(200),
  telefon: z.string().min(5).max(40).optional(),
  website: z.string().regex(HTTPS).optional(),
  reservierung: z.string().regex(HTTPS).optional(),
  instagram: z.string().regex(HTTPS).optional(),
  /** Link „Route planen" (kein eingebettetes Google Maps, 0 €, kein Consent-Problem) */
  route: z.string().regex(HTTPS).optional(),
}).strict();

export const FaqSchema = z.object({
  frage: z.string().min(5).max(160),
  antwort: z.string().min(20).max(600),
}).strict();

export const PartnerSchema = z.object({
  slug: z.string().regex(SLUG),
  /** Name des Restaurants / der Küche / des Kochs */
  name: z.string().min(2).max(90),
  art: z.enum(['restaurant', 'kochschule', 'eventkueche', 'koch']),
  ort: z.string().min(2).max(80),
  land: z.enum(['DE', 'AT', 'CH']),
  /** Küchenpartner seit (Jahr) */
  seit: z.number().int().min(2026).max(2100),
  /** Partner, der keine 8 Rezepte im Jahr mehr liefert: Porträt bleibt, Abzeichen zeigt „bis" (E10a) */
  bis: z.number().int().min(2026).max(2100).optional(),
  /** Restaurant geschlossen: Seite bleibt mit Hinweis (Konzept Abschnitt 5) */
  geschlossen: z.boolean().default(false),
  koch: z.object({
    name: z.string().min(2).max(90),
    rolle: z.string().min(2).max(80),
  }).strict(),
  /** Ein Satz, wofür diese Küche steht (Fragebogen, Frage 2) */
  kurz: z.string().min(20).max(240),
  /** Die Feuer-Geschichte: 4–6 Sätze als Absätze (Fragen 1 + 2), vom Partner freigegeben */
  geschichte: z.array(z.string().min(20)).min(1).max(4),
  /** Wörtliches Zitat des Kochs aus dem Fragebogen */
  zitat: z.string().min(10).max(300).optional(),
  signature: z.object({
    titel: z.string().min(3).max(120),
    /** Warum gerade dieses Gericht (Frage 3) */
    warum: z.string().min(20).max(600),
    rezept: PartnerRezeptSchema.optional(),
  }).strict(),
  /** Bester Tipp für Grill-Anfänger (Frage 4) */
  tipp: z.string().min(20).max(400),
  rezepte: z.array(PartnerRezeptSchema).max(40).default([]),
  fakten: FaktenSchema,
  faq: z.array(FaqSchema).max(6).default([]),
  bilder: z.object({
    /** /images/chefs-table/<slug>/kueche.jpg — Foto von Küche oder Team, Rechte beim Partner bestätigt */
    kueche: z.string().regex(/^\/images\/chefs-table\/[a-z0-9/-]+\.(jpg|jpeg|png|webp)$/).optional(),
    signature: z.string().regex(/^\/images\/chefs-table\/[a-z0-9/-]+\.(jpg|jpeg|png|webp)$/).optional(),
  }).strict().default({}),
  /** Freigaben — beide müssen gesetzt sein, bevor ein Porträt öffentlich wird (Konzept Abschnitt 4) */
  freigabe: z.object({
    /** Datum, an dem der Partner die Vorschau freigegeben hat (ISO) */
    partner: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    /** Datum, an dem Uwe final freigegeben hat (ISO) */
    uwe: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).strict().default({}),
  /** Platzhalter-Eintrag zum Gegenlesen des Layouts — wird nie öffentlich */
  platzhalter: z.boolean().default(false),
}).strict();

export type Partner = z.infer<typeof PartnerSchema>;
export type PartnerRezept = z.infer<typeof PartnerRezeptSchema>;

/** Ein Porträt darf nur öffentlich werden, wenn Partner und Uwe freigegeben haben und es kein Platzhalter ist. */
export function istFreigegeben(p: Partner): boolean {
  return !p.platzhalter && Boolean(p.freigabe.partner) && Boolean(p.freigabe.uwe);
}

/** Anzahl der Rezepte, die am Porträt gezählt werden (Signature zählt mit, wenn es ein Rezept hat). */
export function rezeptAnzahl(p: Partner): number {
  return p.rezepte.length + (p.signature.rezept ? 1 : 0);
}
