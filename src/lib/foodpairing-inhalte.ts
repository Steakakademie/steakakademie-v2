// ═══════════════════════════════════════════════════════════════════════════
// Foodpairing — redaktionelle Inhalte der Seite /foodpairing und der Kachel.
// Client-sicher (kein node:fs). Jede Aroma-Aussage in den Texten ist durch
// src/lib/foodpairing-inhalte.test.ts gegen data/foodpairing abgesichert:
// Ändern sich die Belege, schlägt der Test an, bevor ein Text falsch wird.
// ═══════════════════════════════════════════════════════════════════════════

/** Zutaten, die das Aroma-Rad als Mitte anbietet (Namen wie in ingr_info.tsv). */
export const RAEDER: readonly { zutat: string; label: string; sub?: string }[] = [
  { zutat: 'Rind', label: 'Steak', sub: 'Rind, gebraten' },
  { zutat: 'Schwein', label: 'Schwein' },
  { zutat: 'Lamm', label: 'Lamm' },
  { zutat: 'Hähnchen', label: 'Hähnchen' },
  { zutat: 'Garnele', label: 'Garnele' },
  { zutat: 'Kakao', label: 'Kakao', sub: 'Schokolade' },
  { zutat: 'Kaffee', label: 'Kaffee' },
  { zutat: 'Erdbeere', label: 'Erdbeere' },
];

export type UeberraschungsPaar = {
  titel: string;
  a: string;
  b: string;
  katA: string;
  /** Stoffe, die der Text beim Namen nennt — der Test prüft, dass beide Zutaten sie teilen. */
  belegt: string[];
  text: string;
  grill: string;
  auftrag: string;
};

export const UEBERRASCHUNGEN: { gruppe: string; paare: UeberraschungsPaar[] }[] = [
  {
    gruppe: 'Süß trifft herzhaft',
    paare: [
      {
        titel: 'Steak & Schokolade',
        a: 'Rind',
        b: 'Kakao',
        katA: 'Fleisch',
        belegt: ['2-Ethyl-3,5-dimethylpyrazin', 'Furaneol', 'Guaiacol'],
        text: 'Die Röstnote der Kruste, Karamell und Rauch stecken auch im Kakao. Deshalb schmeckt dunkle Schokolade zu Rind nicht nach Dessert, sondern wie eine Verlängerung der Kruste.',
        grill: 'Ein Löffel Kakao im Rub für Ribeye oder Brisket.',
        auftrag: 'Ribeye mit Kakao-Rub',
      },
      {
        titel: 'Schokolade & Parmesan',
        a: 'Kakao',
        b: 'Parmesan',
        katA: 'Geröstetes',
        belegt: ['3-Methylbutanal', 'Phenylacetaldehyd'],
        text: 'Malzige und honigartige Noten verbinden die beiden — gereifter Käse und Kakao sprechen mehr gemeinsame Sprache, als man denkt.',
        grill: 'Zum Abschluss des Grillabends: Parmesanbrocken mit Zartbitter-Splittern statt Dessert.',
        auftrag: 'Grill-Dessert mit Parmesan und Zartbitterschokolade',
      },
      {
        titel: 'Schokolade & Röstknoblauch',
        a: 'Kakao',
        b: 'Röstknoblauch',
        katA: 'Geröstetes',
        belegt: ['Furaneol', 'Guaiacol', 'Vanillin'],
        text: 'Karamell, Rauch und sogar Vanille: Geröstete Knoblauchzehen tragen genau die Noten, die auch Kakao prägen.',
        grill: 'Röstknoblauch und Kakao in eine dunkle BBQ-Sauce für Rippchen.',
        auftrag: 'Dunkle BBQ-Sauce mit Kakao und Röstknoblauch für Spareribs',
      },
    ],
  },
  {
    gruppe: 'Frucht trifft herzhaft',
    paare: [
      {
        titel: 'Erdbeere & Parmesan',
        a: 'Erdbeere',
        b: 'Parmesan',
        katA: 'Obst',
        belegt: ['2,3-Butandion', 'Buttersäure', 'Ethylbutanoat'],
        text: 'Butterig, käsig, fruchtig — alle drei Noten stecken in beiden. Ein paar Tropfen Balsamico machen ein Trio daraus: Er teilt mit beiden die Butter- und die Käsenote.',
        grill: 'Gegrillte Erdbeeren mit Parmesanspänen und Balsamico als Vorspeise.',
        auftrag: 'Gegrillte Erdbeeren mit Parmesan und Balsamico',
      },
      {
        titel: 'Schwein & Himbeere',
        a: 'Schwein',
        b: 'Himbeere',
        katA: 'Fleisch',
        belegt: ['Furaneol', 'Hexanal', 'Methional'],
        text: 'Karamell, frisches Grün und die Brühe-Note: Himbeere und Schweinefleisch teilen mehr, als die Farbe vermuten lässt.',
        grill: 'Himbeer-Glaze auf Spareribs — erst in den letzten Minuten auftragen.',
        auftrag: 'Spareribs mit Himbeer-Glaze',
      },
      {
        titel: 'Schwein & Pfirsich',
        a: 'Schwein',
        b: 'Pfirsich',
        katA: 'Fleisch',
        belegt: ['δ-Decalacton', '(E,E)-2,4-Decadienal', 'Hexanal'],
        text: 'Eine sahnig-fruchtige Lacton-Note verbindet die beiden, dazu teilen sie Frittier- und Grünnoten.',
        grill: 'Pfirsichhälften kurz auf den Rost, dazu Schweinenacken.',
        auftrag: 'Schweinenacken mit gegrilltem Pfirsich',
      },
    ],
  },
  {
    gruppe: 'Fleisch, Meer & Röstaromen',
    paare: [
      {
        titel: 'Steak & Kaffee',
        a: 'Rind',
        b: 'Kaffee',
        katA: 'Fleisch',
        belegt: ['Furaneol', 'Guaiacol', 'Methional'],
        text: 'Karamell, Rauch und die Brühe-Note: Kaffee greift genau die Aromen auf, die beim Braten von Rind entstehen.',
        grill: 'Kaffee-Rub für Ribeye oder Tri-Tip.',
        auftrag: 'Ribeye mit Kaffee-Rub',
      },
      {
        titel: 'Garnele & Kaffee',
        a: 'Garnele',
        b: 'Kaffee',
        katA: 'Meeresfrüchte',
        belegt: ['3-Methylbutanal', 'Furaneol', 'Methional', 'Sotolon'],
        text: 'Malzig, karamellig, würzig und die Brühe-Note — vier Brücken zwischen Meer und Röstkaffee.',
        grill: 'Garnelen vom Grill mit einer Prise Espresso-Salz.',
        auftrag: 'Gegrillte Garnelen mit Espresso-Salz',
      },
      {
        titel: 'Hähnchen & Erdnuss',
        a: 'Hähnchen',
        b: 'Erdnuss',
        katA: 'Geflügel',
        belegt: ['2-Methyl-3-furanthiol', '(E,E)-2,4-Decadienal', 'Methional'],
        text: 'Fleischig, frittiert und die Brühe-Note — die Daten bestätigen, was Satay-Fans längst wissen.',
        grill: 'Hähnchen-Satay mit Erdnusssauce.',
        auftrag: 'Hähnchen-Satay vom Grill mit Erdnusssauce',
      },
    ],
  },
];

export type FaktencheckEintrag = {
  titel: string;
  a?: string;
  b?: string;
  art?: 'kontrast';
  /** Anzahl geteilter Stoffe, die der Text voraussetzt (Test prüft Gleichheit). */
  erwartet?: number;
  text: string;
  besser?: { a: string; b: string; label: string };
};

export const FAKTENCHECK: FaktencheckEintrag[] = [
  {
    titel: 'Steak & Popcorn',
    a: 'Rind',
    b: 'Popcorn',
    erwartet: 1,
    text: 'Wird oft mit gemeinsamen Röstaromen begründet. In unseren Belegen teilen die beiden nur die Frittiernote. Die typische Popcorn-Röstnote passt besser zu Haselnuss.',
    besser: { a: 'Rind', b: 'Kaffee', label: 'Steak & Kaffee' },
  },
  {
    titel: 'Schokoladenmousse & Röstzwiebeln',
    a: 'Kakao',
    b: 'Röstzwiebel',
    erwartet: 0,
    text: 'In unseren Belegen keine gemeinsame Schlüsselnote. Wer Schokolade mit Zwiebelgewächsen verbinden will, nimmt Röstknoblauch.',
    besser: { a: 'Kakao', b: 'Röstknoblauch', label: 'Schokolade & Röstknoblauch' },
  },
  {
    titel: 'Ananas & Blauschimmelkäse',
    a: 'Ananas',
    b: 'Blauschimmelkäse',
    erwartet: 0,
    text: 'Keine geteilte Schlüsselnote — das Paar lebt vom Kontrast: Fruchtsäure und Süße gegen Salz und Fett. Funktioniert, aber nicht wegen Foodpairing.',
  },
  {
    titel: 'Garnelen & Vanille',
    a: 'Garnele',
    b: 'Vanille',
    erwartet: 1,
    text: 'Eine einzige Brücke: die würzige Sotolon-Note. Ein Versuch wert, aber kein Selbstläufer.',
    besser: { a: 'Garnele', b: 'Kaffee', label: 'Garnele & Kaffee' },
  },
  {
    titel: 'Thunfisch & Zimt',
    a: 'Thunfisch',
    b: 'Zimt',
    erwartet: 1,
    text: 'Eine Brücke: die wachsig-zitrusartige Nonanal-Note. Dezent eingesetzt spannend, mehr nicht.',
  },
  {
    titel: 'Lamm & Erdbeere',
    a: 'Lamm',
    b: 'Erdbeere',
    erwartet: 1,
    text: 'Eine Brücke über Karamell. Mit Kaffee teilt Lamm mehr — Karamell und Vanille.',
    besser: { a: 'Lamm', b: 'Kaffee', label: 'Lamm & Kaffee' },
  },
  {
    titel: 'Weiße Schokolade & Kaviar',
    text: 'Das berühmteste Paar der Szene, bekannt geworden durch den britischen Koch Heston Blumenthal. Beide Zutaten fehlen (noch) in unseren belegten Daten — deshalb von uns kein Urteil.',
  },
  {
    titel: 'Wassermelone & Senf · Essiggurke & Erdnussbutter',
    art: 'kontrast',
    text: 'Keine Aroma-Brücke, sondern Kontrast: Süße puffert Schärfe, Säure schneidet durch Fett. Gutes Prinzip — aber ein anderes.',
  },
];

/**
 * Kachel „Foodpairing" (Startseite): Aufhänger Steak & Schokolade.
 * Werte = paarung('Rind','Kakao') aus data/foodpairing — Test prüft Gleichheit.
 */
export const KACHEL_TEASER = {
  a: 'Steak',
  b: 'Schokolade',
  zutatA: 'Rind',
  zutatB: 'Kakao',
  bruecken: [
    { note: 'röstig', stoff: 'Pyrazin', stoffVoll: '2-Ethyl-3,5-dimethylpyrazin' },
    { note: 'karamellig', stoff: 'Furaneol', stoffVoll: 'Furaneol' },
    { note: 'rauchig', stoff: 'Guaiacol', stoffVoll: 'Guaiacol' },
  ],
} as const;

// Start-Zutaten der Foodpairing-Kachel. Uwe, 30.09.2026: Platzhalter „Ribeye" plus
// Chip „Ribeye" wirkte doppelt und machte nicht neugierig. Das Steak steckt jetzt im
// Aufhänger (Aroma-Brücke Steak & Schokolade), die Chips zeigen überraschende Starter.
// Alle fünf liefern im v2-Datensatz Partner (Test: foodpairing-inhalte.test.ts).
export const FOODPAIRING_BEISPIELE = ['Kakao', 'Erdbeere', 'Kaffee', 'Garnele', 'Lamm'] as const;
