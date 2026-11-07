/**
 * Typsicherheits-Definitionen für die Steakakademie-Werkzeuge (Bento-Grid der
 * Startseite, 02.11.2026). Passend zur Datenstruktur von
 * data/werkzeuge/steakakademie-tools.json — geladen über ./daten.ts.
 */

// --- Gemeinsame Typen ---
export type DrinkCategory = 'wine' | 'beer' | 'cocktail' | 'non-alcoholic';

export interface RecommendationText {
  recommendation: string;
  explanation: string;
}

// --- Aroma-Matcher Schnittstellen ---
export interface KeyAroma {
  name: string;
  chemicalCompound: string; // z.B. "Pyrazin", "Guaiacol"
}

export interface SommelierRecommendation extends RecommendationText {
  category: DrinkCategory;
  pairingNote: string;
}

export interface AromaPairing {
  item: string;
  sharedAromasCount: number;
  sharedAromas: string[];
  scientificSource: string; // Verweis auf die Fachstudie
}

export interface CutAromaProfile {
  id: string;
  name: string;
  keyAromas: KeyAroma[];
  recommendedRubs: string[];
  recommendedWoods: string[];
  pairings: {
    food: AromaPairing[];
    drinks: SommelierRecommendation[];
  };
}

// --- Räucherholz-Finder Schnittstellen ---
export interface WoodDosage {
  grillSystem: 'smoker' | 'kugelgrill' | 'oberhitze' | 'plancha';
  mildChunksCount: number;
  strongChunksCount: number;
  unit: 'chunks' | 'chips' | 'logs';
  applicationNote: string;
}

export interface SafetyWarning {
  isUnsuitable: boolean;
  dangerLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export interface WoodProfile {
  id: string;
  name: string;
  flavorProfile: 'mild' | 'sweet' | 'fruity' | 'medium' | 'strong' | 'heavy';
  bestForCuts: string[]; // IDs oder Namen der passenden Cuts
  dosages: WoodDosage[];
  safety: SafetyWarning;
}

// --- Gesamtstruktur der JSON-Datenbasis ---
export interface SteakakademieToolsDatabase {
  version: string;
  lastUpdated: string; // ISO Date-String
  aromaMatcher: {
    totalStudiesReferenced: number;
    cuts: CutAromaProfile[];
  };
  woodFinder: {
    woods: WoodProfile[];
  };
}
