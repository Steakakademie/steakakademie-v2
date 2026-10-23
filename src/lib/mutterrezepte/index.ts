import { LIMETTEN_CASHEWCREME } from './limetten-cashewcreme';
import { CHIMICHURRI } from './chimichurri';
import { NAM_JIM_JAEW } from './nam-jim-jaew';
import type { Einsatzform, FormOeffentlich, Mutterrezept, MutterrezeptSicht } from './typen';

export type * from './typen';

/** Alle Mutterrezepte. Neue Bäume hier eintragen. */
export const MUTTERREZEPTE: readonly Mutterrezept[] = [LIMETTEN_CASHEWCREME, CHIMICHURRI, NAM_JIM_JAEW];

export function mutterrezept(slug: string): Mutterrezept | undefined {
  return MUTTERREZEPTE.find((m) => m.slug === slug);
}

/**
 * Was der Browser bekommt. Ohne Vollzugriff: gesperrte Blätter nur mit Name,
 * Ast, Einsatzform, Typ und Land; Grammangaben der Grundmenge und des
 * Konsistenz-Reglers fehlen. Nichts davon steht dann im HTML oder im JS-Payload.
 */
export function sicht(m: Mutterrezept, vollzugriff: boolean): MutterrezeptSicht {
  const formen = Object.fromEntries(
    (Object.keys(m.formen) as Einsatzform[]).map((k) => {
      const f = m.formen[k]!;
      const oeffentlich: FormOeffentlich = {
        label: f.label,
        kuerzel: f.kuerzel,
        ergebnis: f.ergebnis,
        reglerGramm: vollzugriff ? f.reglerGramm : null,
      };
      return [k, oeffentlich];
    }),
  ) as Partial<Record<Einsatzform, FormOeffentlich>>;

  return {
    slug: m.slug,
    zentrum: m.zentrum,
    vollzugriff,
    regler: m.regler,
    zutatenGramm: vollzugriff ? m.zutatenGramm : null,
    formen,
    aeste: m.aeste,
    blaetter: m.blaetter.map((b) => {
      const offen = vollzugriff || !!b.frei;
      const basis = { id: b.id, ast: b.ast, name: b.name, form: b.form, typ: b.typ, land: b.land };
      if (!offen) return { ...basis, gesperrt: true };
      return {
        ...basis,
        gesperrt: false,
        warum: b.warum,
        abwandlung: b.abwandlung,
        rezeptSlug: b.rezeptSlug,
        schmiedeAuftrag: b.schmiedeAuftrag,
        quelle: b.quelle,
        herkunft: b.herkunft,
        ableitung: b.ableitung,
        reglerGramm: m.formen[b.form]?.reglerGramm,
      };
    }),
  };
}

export function anzahlFrei(m: Mutterrezept): number {
  return m.blaetter.filter((b) => b.frei).length;
}
