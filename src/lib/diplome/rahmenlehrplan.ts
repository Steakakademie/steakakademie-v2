/**
 * Rahmenlehrplan des Grillmeister-Diploms — die oeffentliche Fassung.
 *
 * Quelle: Rahmenlehrplan-Grillmeister-Diplom.md (Uwe, freigegeben 08.09.2026),
 * destilliert aus sieben Kurs-Produktionsbuechern und Uwes Praxis als Kursleiter.
 * Hier stehen NUR Lernziele — was der Absolvent danach kann — und der Stand
 * je Lektion. Keine Lektionsinhalte: die liegen in content/diplom-lektionen/.
 *
 * Warum oeffentlich: „Grillmeister" hat keine Ausbildungsordnung und keinen
 * Rahmenlehrplan. Wer aufschreibt, was ein Grillmeister koennen muss, setzt den
 * Massstab — und liefert die Seite, die verlinkt und von KI-Suchen als
 * Definitionsquelle gezogen wird.
 *
 * `lektionSlug` verknuepft ein Lernziel mit der Lektion im Repo; fehlt er, ist
 * die Lektion geplant und die Seite sagt das auch so (Regel 7 — kein „fertig",
 * wo nichts liegt).
 */

export type Lernziel = {
  /** Kurzname des Blocks */
  block: string;
  /** „Der Absolvent kann …" — als beobachtbare Faehigkeit */
  kann: string;
  /** lektionSlug im Repo, wenn die Lektion existiert */
  lektionSlug?: string;
  /** Verzweigt nach Geraet (Kohle/Gas) */
  geraetespur?: boolean;
};

export type StufenPlan = {
  nr: number;
  /** Ein Satz: was die Stufe als Ganzes leistet */
  stufenziel: string;
  /** Praktischer Nachweis — der Teil, den kein Quiz ersetzt */
  handgriff: string;
  lernziele: Lernziel[];
};

export const RAHMENLEHRPLAN: readonly StufenPlan[] = [
  {
    nr: 1,
    stufenziel:
      'Den eigenen Grill beherrschen: drei Setups einrichten, ein Steak nach Kerntemperatur auf den Punkt grillen, die Sicherheitsregeln kennen, die nie verhandelbar sind, und den Grill so pflegen, dass er hält.',
    handgriff:
      'Ein Steak von 2–3 cm mit Fühler grillen, drei Werte notieren (beim Abnehmen, nach dem Ruhen, Ruhezeit) — gleichmäßige Farbe von Rand zu Rand, kein grauer Ring.',
    lernziele: [
      { block: 'Grillarten und Deckel-Prinzip', kann: 'die fünf Bauarten unterscheiden und erklären, warum ein Grill ohne geschlossenen Deckel nur ein Rost über Feuer ist', lektionSlug: 'grillarten' },
      { block: 'Brennstoffkunde', kann: 'Holzkohle, Briketts, Gas und Elektro nach Brenndauer, Temperaturverlauf und Einsatz einordnen — und die Frage nach dem Holzkohlegeschmack fachlich beantworten', lektionSlug: 'brennstoffkunde' },
      { block: 'Sicherheit und Set-up', kann: 'die fünf Regeln nennen (Standort, Fettbrand, Anzündmittel, Gas-Lecktest, Asche) und den Arbeitsplatz vor dem Grillen herrichten', lektionSlug: 'sicherheit-brandschutz', geraetespur: true },
      { block: 'Anzünden und Startroutine', kann: 'Kohle bis zur Ascheschicht bringen bzw. Gas korrekt vorheizen und danach aufheizen → bürsten → einölen in dieser Reihenfolge ausführen', lektionSlug: 'anzuenden-startroutine', geraetespur: true },
      { block: 'Direkt und indirekt', kann: 'die beiden Grundmethoden zuordnen: was schnell und heiß, was langsam und geschützt gart', lektionSlug: 'direkte-indirekte-hitze' },
      { block: 'Zonen erzeugen', kann: 'auf dem eigenen Gerät Zwei- und Dreizonen anlegen — über Schüttung bei Kohle, über Brennerschaltung und Hitzeschild bei Gas — und weiß, was er tut, wenn der Grill keine indirekte Zone hergibt', lektionSlug: 'temperaturzonen', geraetespur: true },
      { block: 'Temperatur messen', kann: 'Luft- von Kerntemperatur unterscheiden, erklären, warum das Deckelthermometer lügt, und einen Fühler korrekt setzen', lektionSlug: 'temperatur-messen' },
      { block: 'Salzen', kann: 'Zeitpunkt und Menge begründen — sofort oder mindestens 40 Minuten vorher, nie dazwischen', lektionSlug: 'salzen' },
      { block: 'Das erste Steak', kann: 'ein Steak searen, 2–3 °C vor der Zielkerntemperatur abnehmen und auf einer temperierten Unterlage ruhen lassen', lektionSlug: 'das-erste-steak' },
      { block: 'Rubs, Marinaden und Timing', kann: 'einen Rub aufbauen, eine Marinade einsetzen und weiß, dass mariniertes Fleisch nie direkt gegrillt wird', lektionSlug: 'dry-rubs-marinaden' },
      { block: 'Rauch in einem Satz — und Reinigung', kann: 'die drei Räucherwege benennen und die 160-°C-Regel; den Grill während und nach dem Grillen reinigen, den Deckel inklusive, und einwintern', lektionSlug: 'rauch-reinigung-pflege' },
    ],
  },
  {
    nr: 2,
    stufenziel:
      'Fleisch verstehen: das richtige Stück für den richtigen Zweck kaufen, Qualität am Objekt erkennen, korrekt lagern und wissen, was Reifung tut.',
    handgriff: 'Ein Einkauf mit Protokoll — Cut, Herkunft, Marmorierung, Farbe, Fett — und Foto.',
    lernziele: [
      { block: 'Fleischanatomie', kann: 'Muskel, Bindegewebe und Fett unterscheiden und daraus ableiten, welche Zubereitung ein Stück braucht', lektionSlug: 'fleischanatomie' },
      { block: 'Rinder-Cuts', kann: 'die wichtigsten Cuts am Tier verorten und ein ganzes Stück gedanklich zerlegen', lektionSlug: 'rinder-cuts' },
      { block: 'Schweine-Zuschnitte', kann: 'die BBQ-Zuschnitte vom Schwein benennen und ihrem Garweg zuordnen', lektionSlug: 'schweine-cuts' },
      { block: 'Marmorierung', kann: 'intramuskuläres Fett beurteilen, BMS und USDA einordnen — und weiß, warum gelbes Fett ein Warnsignal ist', lektionSlug: 'marmorierung' },
      { block: 'Dry und Wet Aging', kann: 'beide Reifungswege erklären und am Produkt erkennen', lektionSlug: 'dry-wet-aging' },
      { block: 'Lagern', kann: 'Fleisch nach Temperatur, Bedingungen und Haltbarkeit korrekt lagern', lektionSlug: 'fleisch-lagern' },
      { block: 'Einkauf', kann: 'Qualität beim Kauf beurteilen und die richtigen Fragen stellen', lektionSlug: 'fleisch-einkauf' },
      { block: 'Pökeln', kann: 'ein Stück 24–48 Stunden pökeln und einmal wenden — als Vorbereitung fürs Räuchern' },
    ],
  },
  {
    nr: 3,
    stufenziel:
      'Auf den Punkt garen: jedes Stück auf die gewünschte Garstufe bringen, Reverse Sear vollständig beherrschen — inklusive aktiver Temperaturabsenkung — und ein Menü synchronisieren.',
    handgriff: 'Ein dickes Steak (≥ 4 cm) im Reverse Sear, protokolliert mit drei Messpunkten: nach dem Sear, vor dem Abnehmen, nach dem Ruhen.',
    lernziele: [
      { block: 'Kerntemperaturen', kann: 'die Tabelle für jedes Fleisch anwenden und Carry-over und Ruhezeit nach Größe einplanen', lektionSlug: 'kerntemperaturen' },
      { block: 'Reverse Sear', kann: 'erst sanft auf Temperatur ziehen, dann scharf searen — und die Temperatur zwischen beiden Phasen aktiv absenken (Gas: Deckel öffnen, Kohle: Kohle entnehmen)', lektionSlug: 'reverse-sear', geraetespur: true },
      { block: 'Maillard-Reaktion', kann: 'erklären, was eine Kruste chemisch ist und welche Bedingungen sie braucht', lektionSlug: 'maillard-kruste' },
      { block: 'Sous-Vide-Grillen', kann: 'die Hybridmethode einsetzen, wo Präzision vor Aufwand geht', lektionSlug: 'sous-vide-grillen' },
      { block: 'Zeitmanagement', kann: 'ein ganzes Menü synchron fertigstellen', lektionSlug: 'zeitmanagement' },
      { block: 'Internationale Cuts', kann: 'Wagyu, Angus und Iberico einordnen und anders behandeln', lektionSlug: 'internationale-cuts' },
      { block: 'Herkunft und Qualität', kann: 'Rasse, Fütterung und Haltung im Geschmack wiedererkennen', lektionSlug: 'herkunft-qualitaet' },
      { block: 'Der Grill als Ofen', kann: 'Dutch Oven, Auflaufform, keramische Platte, Drehspieß und Pizzastein als Zubereitungsarten einsetzen — und Fisch stehend garen' },
    ],
  },
  {
    nr: 4,
    stufenziel:
      'Rauch und Zeit führen: einen Low-&-Slow-Lauf über Stunden mit stabiler Temperatur fahren, Holz und Räucherweg zum Produkt wählen und die Physik dahinter verstehen.',
    handgriff: 'Ein Lauf über mindestens drei Stunden mit Temperaturprotokoll im 15-Minuten-Takt — Abweichung unter ±15 °C.',
    lernziele: [
      { block: 'Smoker-Typen', kann: 'Offset, Kettle, Pellet und Keramik bedienen und das Minion-Prinzip mit Wasserpfanne aufbauen', lektionSlug: 'smoker-typen' },
      { block: 'Gerätekunde Gas', kann: 'Brenner, Aromaschienen und Druckminderer verstehen und warten', lektionSlug: 'geraetekunde-gas' },
      { block: 'Pellet-Steuerung', kann: 'Förderschnecke und Fühler kalibrieren', lektionSlug: 'smart-grilling-pellet' },
      { block: 'Holz, Rauch und Mopping', kann: 'Holz zum Produkt wählen, Chips und Chunks richtig wässern, Rauch dosieren und nach halber Garzeit führen', lektionSlug: 'holz-rauch-mopping' },
      { block: 'BBQ-Wissenschaft', kann: 'Kollagenabbau, Stall-Phase und Saftigkeit erklären und in Entscheidungen übersetzen', lektionSlug: 'bbq-wissenschaft' },
      { block: 'HACCP und Hygiene', kann: 'sicher grillen vom Kühlschrank bis zum Teller', lektionSlug: 'haccp-hygiene' },
      { block: 'Event-Planung', kann: 'Großmengen sicher planen und ausführen', lektionSlug: 'event-planung-logistik' },
      { block: 'Die fünf Räucherwege', kann: 'Chips auf der Glut, Räucherbox, Zedernholzplanke, Wood Wrap und Wasser-Smoker mit Gerät, Temperaturfenster und Handhabung unterscheiden', geraetespur: true },
    ],
  },
  {
    nr: 5,
    stufenziel:
      'Weitergeben und bestehen: auf Sommelier-Niveau verkosten, ein Gericht statt ein Stück komponieren, Wettbewerbsregeln kennen, präsentieren, Fehler vor Gästen retten — und anderen beibringen, was man kann.',
    handgriff: 'Eine Person durch Stufe 1 führen, dokumentiert mit deren Ergebnis.',
    lernziele: [
      { block: 'Wagyu-Sensorik', kann: 'Marmorierung verkosten und BMS einordnen', lektionSlug: 'wagyu-sensorik' },
      { block: 'Foodpairing', kann: 'ein Gericht vollenden statt ein Stück zu grillen', lektionSlug: 'foodpairing' },
      { block: 'Getränkebegleitung', kann: 'Wein, Bier und Alkoholfreies zum BBQ wählen', lektionSlug: 'getraenkebegleitung' },
      { block: 'Wettbewerbsgrillen', kann: 'KCBS, SCA und GBA verstehen und danach arbeiten', lektionSlug: 'wettbewerbsgrillen' },
      { block: 'Präsentation', kann: 'auf Profiniveau anrichten — und weiß, was im Stehen und was am Tisch serviert wird', lektionSlug: 'praesentation-anrichten' },
      { block: 'Didaktik', kann: 'jeden auf seinem Niveau abholen und einen Kurs choreografieren', lektionSlug: 'didaktik-wissensvermittlung' },
      { block: 'Krisenmanagement', kann: 'Fehler und Gerichte vor den Gästen retten', lektionSlug: 'krisenmanagement' },
    ],
  },
];

/** Die didaktische Doktrin, in der jede Lektion gebaut ist. */
export const DOKTRIN: readonly { titel: string; text: string }[] = [
  { titel: 'Leitfrage zuerst', text: 'Jede Lektion beginnt mit einer Frage, die der Lernende am Ende selbst beantworten kann. Erst die Erwartung, dann der Stoff.' },
  { titel: 'Nie reiner Fließtext', text: 'Nach jedem Kernschritt eine Handlung oder eine Frage. Wer nur liest, lernt nicht grillen.' },
  { titel: 'Handgriff am eigenen Grill', text: 'Jede Lektion endet mit einer Aufgabe am Gerät — mit Selbstkontrolle: „Wenn X passiert, hast du es richtig gemacht."' },
  { titel: 'Kerntemperatur statt Uhr', text: 'Alle Temperaturwerte folgen einer einzigen Referenz. Kein Wert wird geschätzt.' },
  { titel: 'Gerätespur', text: 'Wo Kohle und Gas sich unterscheiden, verzweigt die Lektion. Der Lernende wählt am Anfang seinen Grill.' },
  { titel: 'Der Kurs endet mit dem Saubermachen', text: 'Reinigung ist Teil des Handwerks, nicht Nacharbeit.' },
];
