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
  /** Das Original nutzt eine andere Form der Basis oder wurde neu kombiniert — die Übertragung auf das Grundrezept ist eigene Ableitung. */
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
  /** Menge des Konsistenz-Reglers (`Mutterrezept.regler`) in Gramm auf die Grundmenge (VIP). */
  reglerGramm: number;
  ergebnis: string;
}

/**
 * Der Konsistenz-Regler: die eine Zutat, deren Menge aus dem Grundrezept
 * Dip, Klecks, Dressing oder Marinade macht — Wasser bei der Cashewcreme,
 * Öl beim Chimichurri. `basis` ist die feste Grundmenge, auf die sich
 * `FormInfo.reglerGramm` bezieht.
 */
export interface Regler {
  /** z. B. „150 g Cashews“ */
  basis: string;
  /** z. B. „Wasser“ */
  name: string;
  /** Grundmenge, auf die sich die Abwandlungen der Blätter beziehen, z. B. „ca. 300 g“ */
  grundmenge: string;
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
  /**
   * Schritttext. Ein Gerät aus dem Produktregister wird als `[[produkt-id|Wort]]`
   * eingebettet und von der Seite als GeraeteLink gerendert (nur im freien Grundrezept —
   * der VIP-Bereich bleibt werbefrei, Uwe 21.10.2026).
   */
  text: string;
}

export interface Mutterrezept {
  slug: string;
  titel: string;
  /** Name im Baum-Zentrum (mit weichem Trennstrich). */
  zentrum: string;
  beschreibung: string;
  /** Hero-Absatz der Seite: was die Sauce ist und warum sie als Mutterrezept taugt. */
  einleitung: string;
  /** Rubrik hinter dem Autor, z. B. „Saucen & Rubs“. */
  rubrik: string;
  /** Keywords für das Recipe-JSON-LD, kommagetrennt. */
  keywords: string;
  /** Satz im Kasten „So entsteht der Baum“, der erklärt, wann ein Blatt „Eigene Ableitung“ heißt. */
  ableitungHinweis: string;
  autorSlug: string;
  veroeffentlicht: string;
  /** Prüfdatum durch den fachlich Verantwortlichen (wie Frontmatter `reviewedAt`). Fehlt es, gibt es keine Prüf-Aussage. */
  reviewedAt?: string | null;
  /** Hauptbild unter /public (16:9). Genau EIN Bild je Mutterrezept, die Blätter bleiben unbebildert (Uwe, 22.10.2026). */
  bild: { src: string; alt: string; ki: boolean; quelle: string };
  ergibt: string;
  zeit: string;
  zutatenGramm: ZutatGramm[];
  zutatenLoeffel: ZutatLoeffel[];
  schritte: Schritt[];
  profiTipp: string;
  lagerung: string;
  allergene: string;
  regler: Regler;
  /** Nur die Einsatzformen, die es für dieses Grundrezept gibt; jedes Blatt braucht eine davon. */
  formen: Partial<Record<Einsatzform, FormInfo>>;
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
  /** Reglermenge für die Einsatzform dieses Blatts — nur bei offenen Blättern. */
  reglerGramm?: number;
}

export interface FormOeffentlich {
  label: string;
  kuerzel: string;
  ergebnis: string;
  reglerGramm: number | null;
}

export interface MutterrezeptSicht {
  slug: string;
  zentrum: string;
  vollzugriff: boolean;
  regler: Regler;
  zutatenGramm: ZutatGramm[] | null;
  formen: Partial<Record<Einsatzform, FormOeffentlich>>;
  aeste: Ast[];
  blaetter: BlattOeffentlich[];
}
