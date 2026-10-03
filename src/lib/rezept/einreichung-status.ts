/**
 * Status einer Rezept-Einreichung aus dem KI-Urteil ableiten.
 *
 * Regel (03.10.2026): Die KI veröffentlicht NICHTS. Sie sortiert nur vor —
 *   bestanden (sicher, echtes Rezept, Bewertung ab 45) → `needs_review`:
 *     Das Rezept liegt in der Handprüfung unter /admin/rezepte und erscheint
 *     erst, wenn dort ein Mensch freigibt (PATCH /api/admin/rezepte setzt
 *     `approved` + `published_at`).
 *   nicht bestanden (unsicher, kein Rezept oder Bewertung unter 45) → `rejected`.
 *
 * Warum: Bis zum 03.10.2026 setzte /api/rezept-einreichen bei einer Bewertung
 * ab 65 sofort `approved` + `published_at` („jetzt live"). Das widersprach der
 * Datenschutzerklärung (Abschnitt 10a: Freigabe durch einen Menschen) und
 * CLAUDE.md § 2 Regel 4 („Kein Auto-Posting"). `approved` kommt deshalb in
 * diesem Typ gar nicht vor — der Compiler hält die Route davon ab, es zu setzen.
 *
 * Eigene Datei, weil die Route selbst (Next, Supabase, Anthropic) in Vitest
 * nicht ladbar ist. Wächter: src/__tests__/rezept-einreichung-status.test.ts.
 */

import type { RezeptVerdict } from './moderation';

/** Ab dieser KI-Bewertung geht eine sichere Einreichung in die Handprüfung. */
export const SCHWELLE_HANDPRUEFUNG = 45;

/**
 * Ab dieser KI-Bewertung trägt ein freigegebenes Rezept das Siegel „Top bewertet".
 * Das Siegel sagt nur das: hohe Punktzahl in der KI-Vorprüfung. Es behauptet
 * keine Prüfung durch einen Pitmaster — deshalb heißt es nicht mehr so.
 */
export const SCHWELLE_TOP_SIEGEL = 85;

/** `approved` fehlt mit Absicht: Freigeben kann nur die Admin-Moderation. */
export type EinreichungsStatus = 'needs_review' | 'rejected';

export function einreichungsStatus(
  verdict: Pick<RezeptVerdict, 'safe' | 'is_recipe' | 'quality_score'>,
): EinreichungsStatus {
  if (!verdict.safe || !verdict.is_recipe) return 'rejected';
  return verdict.quality_score >= SCHWELLE_HANDPRUEFUNG ? 'needs_review' : 'rejected';
}

/**
 * Antwort an den Einreicher, wenn das Rezept in die Handprüfung geht.
 *
 * Bewusst ein fester Text und NICHT `verdict.user_message`: Das Modell kennt den
 * Status nicht und formuliert bei guter Bewertung „einen anerkennenden Satz"
 * (src/lib/rezept/moderation.ts) — der kann nach Freigabe klingen, die es nicht gab.
 */
export const MELDUNG_IN_PRUEFUNG =
  'Dein Rezept ist eingegangen und wird von uns geprüft. Veröffentlicht wird es erst nach unserer Freigabe — den Stand siehst du in deinem Profil unter „Meine Rezept-Einreichungen“.';

/** Rückfall, falls das Modell bei einer Ablehnung keine eigene Nachricht liefert. */
export const MELDUNG_ABGELEHNT =
  'Diese Einreichung entspricht noch nicht unseren Standards. Schau dir gerne veröffentlichte Rezepte als Orientierung an.';
