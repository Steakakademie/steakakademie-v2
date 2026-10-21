/**
 * Mutterrezepte — ein Grundrezept in der Mitte, Äste nach Grillgut, Blätter als
 * Einsätze (Konzept „Pairing-Baum", von Uwe freigegeben am 21.10.2026).
 *
 * Das Prinzip ist Escoffiers Muttersauce: eine Basis, viele Ableitungen. Jedes
 * Blatt sagt, WIE die Basis eingesetzt wird (Einsatzform), WOMIT (Ast/Gericht)
 * und WAS sich an der Basis ändert (Abwandlung in Gramm).
 *
 * Zugang: Die Grammangaben sind VIP-Inhalt. Was öffentlich ausgeliefert wird,
 * baut `oeffentlicheSicht()` — gesperrte Blätter verlieren dort Begründung,
 * Abwandlung, Quelle und Ziel-Link, damit sie nicht im HTML stehen.
 */

export type Einsatzform = 'dip' | 'klecks' | 'spiegel' | 'dressing' | 'aufstrich' | 'marinade' | 'warm';

export type AstId =
  | 'gemuese'
  | 'rind'
  | 'lamm'
  | 'schwein'
  | 'gefluegel'
  | 'fisch'
  | 'meer'
  | 'beilagen'
  | 'suess';

/**
 * rezept   → es gibt ein passendes Rezept auf der Seite (`rezeptSlug`)
 * schmiede → Auftrag an die Rezept-Schmiede (`schmiedeAuftrag`)
 * pairing  → reiner Kombinations-Tipp, kein eigenes Rezept
 */
export type BlattTyp = 'rezept' | 'schmiede' | 'pairing';

export interface Quelle {
  name: string;
  url: string;
}

export interface Blatt {
  id: string;
  ast: AstId;
  name: string;
  form: Einsatzform;
  typ: BlattTyp;
  /** Herkunft der Idee bzw. Küche, aus der sie stammt. */
  land: string;
  /** Ein Satz: warum die Kombination funktioniert. */
  warum: string;
  /** Was sich an der Grundmenge ändert — in Gramm. Richtwerte, nicht probegekocht. */
  abwandlung: string;
  rezeptSlug?: string;
  schmiedeAuftrag?: string;
  /** Wo die Idee gefunden wurde. Fehlt sie, ist das Blatt eine eigene Kombination. */
  quelle?: Quelle;
  /** Herkunft ohne verlinkbare Quelle (z. B. die Ausgangsidee des Mutterrezepts). */
  herkunft?: string;
  /** Original nutzt gehackte/ganze Cashews o. Ä. — die Übertragung auf die Creme ist eigene Ableitung. */
  ableitung?: boolean;
  /** Öffentlich vollständig sichtbar (Probe für den VIP-Pass). */
  frei?: boolean;
}

export interface Ast {
  id: AstId;
  /** Kurzname für den Knoten im Baum. */
  kurz: string;
  name: string;
}

export interface FormInfo {
  label: string;
  /** Kürzel im Baum-Knoten. */
  kuerzel: string;
  /** Wasser in Gramm auf 150 g Cashews (VIP). */
  wasserGramm: number;
  ergebnis: string;
}

export interface ZutatGramm {
  name: string;
  gramm: number;
  hinweis?: string;
}

export interface ZutatLoeffel {
  menge: string;
  name: string;
}

export interface Schritt {
  titel: string;
  text: string;
}

export interface Mutterrezept {
  slug: string;
  titel: string;
  /** Name im Baum-Zentrum (mit weichem Trennstrich). */
  zentrum: string;
  beschreibung: string;
  autorSlug: string;
  veroeffentlicht: string;
  /** Prüfdatum durch den fachlich Verantwortlichen (wie Frontmatter `reviewedAt`). Fehlt es, gibt es keine Prüf-Aussage. */
  reviewedAt?: string | null;
  ergibt: string;
  zeit: string;
  zutatenGramm: ZutatGramm[];
  zutatenLoeffel: ZutatLoeffel[];
  schritte: Schritt[];
  profiTipp: string;
  lagerung: string;
  allergene: string;
  formen: Record<Einsatzform, FormInfo>;
  aeste: Ast[];
  blaetter: Blatt[];
}

/** Was der Browser über ein Blatt erfährt, solange es gesperrt ist. */
export interface BlattOeffentlich {
  id: string;
  ast: AstId;
  name: string;
  form: Einsatzform;
  typ: BlattTyp;
  land: string;
  gesperrt: boolean;
  warum?: string;
  abwandlung?: string;
  rezeptSlug?: string;
  schmiedeAuftrag?: string;
  quelle?: Quelle;
  herkunft?: string;
  ableitung?: boolean;
  /** Wasser für die Einsatzform dieses Blatts — nur bei offenen Blättern. */
  wasserGramm?: number;
}

export interface FormOeffentlich {
  label: string;
  kuerzel: string;
  ergebnis: string;
  wasserGramm: number | null;
}

export interface MutterrezeptSicht {
  slug: string;
  zentrum: string;
  vollzugriff: boolean;
  zutatenGramm: ZutatGramm[] | null;
  formen: Record<Einsatzform, FormOeffentlich>;
  aeste: Ast[];
  blaetter: BlattOeffentlich[];
}
