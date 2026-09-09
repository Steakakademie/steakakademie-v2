/**
 * lektions-fragen.ts — Verstaendnis-Check am Ende einer Lektion.
 *
 * ABGRENZUNG ZU fragen.ts — bitte vor jeder Aenderung lesen:
 *
 * Es gibt zwei Fragensaetze mit zwei verschiedenen Aufgaben, und sie duerfen
 * sich NICHT vermischen:
 *
 *   fragen.ts          Stufenpruefung. Zieht 10 aus dem Pool, 80 % zum
 *                      Bestehen, serverseitig bewertet, traegt `server-only`,
 *                      Loesungen erreichen den Browser nie. Fragt ANWENDUNG ab:
 *                      eine Lage, die man uebertragen muss.
 *
 *   lektions-fragen.ts (diese Datei) Lern-Check direkt unter der Lektion. Kein
 *                      Nachweis, kein Datenbankeintrag, beliebig wiederholbar,
 *                      Fortschritt nur im localStorage des Lesers. Fragt
 *                      WIEDERGABE ab — im Idealfall die Leitfrage, mit der die
 *                      Lektion oben eroeffnet.
 *
 * Deshalb darf diese Datei clientseitig bewertet werden: Es gibt nichts zu
 * erschleichen, weil an ihr nichts haengt.
 *
 * WARUM DIE TRENNUNG EXISTIERT (08./09.09.2026): Wuerde der Check dieselben
 * Fragen stellen wie die Pruefung, kennt jeder nach elf Lektionen jede Antwort
 * — die 80-%-Huerde waere dann eine Erinnerungsuebung, keine Pruefung. Der
 * Test in src/__tests__/lektions-check.test.ts haelt die beiden Saetze
 * auseinander und schlaegt an, sobald ein Fragentext in beiden vorkommt.
 *
 * KEIN RIEGEL: Eine falsche Antwort blockiert den Weg zur naechsten Lektion
 * nicht. Ein Riegel produziert Abbrecher, keine Grillmeister — wer trotzdem
 * weitergeht, laeuft spaeter in der Stufenpruefung auf und weiss dann, warum.
 *
 * `hinweis` nennt den Abschnitt im Klartext statt per Sprungmarke: Die
 * Lektionen laufen ohne rehype-slug, ihre Ueberschriften haben also keine IDs.
 * Ein Anker-Plugin nachzuruesten wuerde alle 398 Dokumente betreffen — dafuer
 * ist der Nutzen hier zu klein, der Text steht direkt darueber auf derselben
 * Seite.
 *
 * Fachwerte stammen aus der jeweiligen Lektion; Temperaturen dort wiederum aus
 * data/kerntemperatur-referenz.yaml (Regel 8c). Nie hier frei eintragen.
 */

export interface CheckFrage {
  /** Eindeutig ueber alle Lektionen, Praefix `c-`. */
  id: string;
  q: string;
  options: string[];
  /** Index in `options`. */
  correct: number;
  explain: string;
  /** Abschnitt der Lektion, auf den bei falscher Antwort verwiesen wird. */
  hinweis?: string;
}

export const LEKTIONS_CHECK: Record<string, CheckFrage[]> = {
  // ── Stufe 1 ───────────────────────────────────────────────────────────────

  grillarten: [
    {
      id: 'c-grillarten-1',
      q: 'Womit regelst du die Temperatur an einem Holzkohlegrill?',
      options: [
        'Über einen Drehknopf',
        'Über Kohlemenge und Luftzufuhr',
        'Über den Abstand des Rosts zur Glut',
        'Gar nicht — Holzkohle brennt, wie sie will',
      ],
      correct: 1,
      explain:
        'Holzkohle wird über die Menge der Glut und die Lüftungsschieber gesteuert. Das ist direkter als ein Drehknopf, verlangt aber Erfahrung — genau die baust du in dieser Stufe auf.',
      hinweis: 'Der Absatz über die fünf Grilltypen, gleich zu Beginn.',
    },
    {
      id: 'c-grillarten-2',
      q: 'Welcher Grilltyp ist die Lösung, wo offenes Feuer nicht erlaubt ist?',
      options: ['Kamado', 'Pellet-Grill', 'Elektrogrill', 'Kugelgrill'],
      correct: 2,
      explain:
        'Elektro ist kein schlechter Grill, sondern einer mit klaren Grenzen: begrenzte Hitze, schwierigere Kruste — dafür auf Balkon und Innenhof erlaubt.',
      hinweis: 'Der Absatz über die fünf Grilltypen.',
    },
    {
      id: 'c-grillarten-3',
      q: 'Vervollständige den Kernsatz der Lektion: Ein Grill ohne geschlossenen Deckel ist …',
      options: [
        '… ein Rost über Feuer',
        '… ein Smoker',
        '… trotzdem ein vollwertiger Grill',
        '… nur für Würstchen geeignet',
      ],
      correct: 0,
      explain:
        'Offen erreicht die Hitze das Grillgut nur von unten. Erst der geschlossene Deckel macht ihn zum Ofen — und damit indirektes Grillen und Räuchern überhaupt möglich.',
      hinweis: 'Abschnitt „Das Deckel-Prinzip".',
    },
  ],

  brennstoffkunde: [
    {
      id: 'c-brennstoff-1',
      q: 'Du zündest gleichzeitig Holzkohle und Briketts an. Was ist zuerst grillbereit?',
      options: [
        'Die Briketts',
        'Die Holzkohle',
        'Beide gleichzeitig',
        'Das hängt nur vom Anzünder ab',
      ],
      correct: 1,
      explain:
        'Holzkohle ist porös und leicht, zündet schnell und wird sehr heiß — brennt dafür schneller herunter. Briketts sind dichter: später bereit, dafür stundenlang gleichmäßig.',
      hinweis: 'Die Absätze zu Holzkohle und Briketts.',
    },
    {
      id: 'c-brennstoff-2',
      q: 'Was liefert ein Gasgrill von sich aus nicht?',
      options: ['Hohe Hitze', 'Konstante Temperatur', 'Holzrauch', 'Eine indirekte Zone'],
      correct: 2,
      explain:
        'Gas gibt dir Kontrolle, aber keinen Holzrauch. Den holst du dir mit Chips in einer Räucherbox — das ist Lektion 11.',
      hinweis: 'Der Absatz über Gas.',
    },
    {
      id: 'c-brennstoff-3',
      q: 'Wie kombinierst du Holzkohle und Briketts sinnvoll?',
      options: [
        'Gut durchmischen, damit alles gleichmäßig brennt',
        'Briketts unten als Basis, Holzkohle obenauf',
        'Holzkohle unten, Briketts obenauf',
        'Gar nicht — die beiden verträgt kein Grill',
      ],
      correct: 1,
      explain:
        'Die Holzkohle obenauf bringt den schnellen, heißen Start, die Briketts darunter übernehmen danach die lange, ruhige Hitze.',
      hinweis: 'Der Profi-Tipp am Ende der Lektion.',
    },
  ],

  'sicherheit-brandschutz': [
    {
      id: 'c-sicherheit-1',
      q: 'Wo darf ein Grill unter keinen Umständen stehen?',
      options: [
        'Auf einer Terrasse',
        'In geschlossenen Räumen oder Zelten',
        'Auf Rasen',
        'In der Nähe eines Baumes',
      ],
      correct: 1,
      explain:
        'Kohlenmonoxid ist geruchlos und tödlich. Auch ein fast erloschener Grill gibt es weiter ab — deshalb gilt das ohne Ausnahme, auch für Garagen und Partyzelte.',
      hinweis: 'Der Absatz „Standort".',
    },
    {
      id: 'c-sicherheit-2',
      q: 'Wie lange kann Asche nach dem Grillen noch heiß genug für einen Brand sein?',
      options: ['Etwa eine Stunde', 'Etwa vier Stunden', 'Bis zu 24 Stunden', 'Nur bis sie grau ist'],
      correct: 2,
      explain:
        'Deshalb gehört Asche nie in die Mülltonne oder in Plastik. Vollständig auskühlen lassen oder mit Sand oder Wasser löschen, dann in ein feuerfestes Metallgefäß.',
      hinweis: 'Der Absatz „Asche-Entsorgung".',
    },
    {
      id: 'c-sicherheit-3',
      q: 'Warum arbeitest du mit einer Grillzange statt mit einer Gabel?',
      options: [
        'Die Zange ist leichter zu reinigen',
        'Damit kein Fleischsaft in die Glut tropft',
        'Weil die Gabel schneller heiß wird',
        'Reine Gewohnheit, es macht keinen Unterschied',
      ],
      correct: 1,
      explain:
        'Jeder Einstich lässt Saft in die Glut laufen — das ist genau der Auslöser für ein Aufflackern. Die Zange hebt, ohne zu verletzen.',
      hinweis: 'Der Absatz „Kleidung & Werkzeug".',
    },
  ],

  'anzuenden-startroutine': [
    {
      id: 'c-anzuenden-1',
      q: 'Wie lange braucht ein Anzündkamin ungefähr, bis die Kohle gleichmäßig durchgeglüht ist?',
      options: ['3–5 Minuten', '15–20 Minuten', '35–40 Minuten', 'Über eine Stunde'],
      correct: 1,
      explain:
        'Der Kamineffekt zieht Luft von unten durch die Kohle — ohne Pusten, ohne Fächeln, ohne Chemie. Plane diese Zeit ein, dann brauchst du keine Abkürzung.',
      hinweis: 'Abschnitt „Kohle: bis zur Ascheschicht".',
    },
    {
      id: 'c-anzuenden-2',
      q: 'Wie zündest du einen Gasgrill?',
      options: [
        'Mit geschlossenem Deckel, damit die Hitze bleibt',
        'Mit offenem Deckel',
        'Erst alle Brenner an, dann den Deckel schließen und zünden',
        'Deckel offen oder zu — das ist egal',
      ],
      correct: 1,
      explain:
        'Bei geschlossenem Deckel kann sich Gas im Garraum sammeln und beim Funken verpuffen. Zünden immer offen — Deckel erst danach schließen.',
      hinweis: 'Abschnitt „Gas: Deckel offen zünden, dann Deckel zu".',
    },
    {
      id: 'c-anzuenden-3',
      q: 'Wie lange heizt du einen Gasgrill nach dem Zünden vor, bevor du herunterregelst?',
      options: ['1–2 Minuten', '5 Minuten', '10–15 Minuten', 'Vorheizen ist bei Gas nicht nötig'],
      correct: 2,
      explain:
        'Gas ist sofort heiß, der Rost aber nicht. Zehn bis fünfzehn Minuten bei voller Leistung mit geschlossenem Deckel — erst dann ist der Rost so heiß, dass nichts klebt.',
      hinweis: 'Abschnitt „Gas: Deckel offen zünden, dann Deckel zu".',
    },
  ],

  'direkte-indirekte-hitze': [
    {
      id: 'c-direkt-1',
      q: 'Welche Temperatur herrscht in der indirekten Zone?',
      options: ['80–110 °C', '150–180 °C', '200–230 °C', '230–290 °C'],
      correct: 1,
      explain:
        'Bei geschlossenem Deckel wird der Grill zum Umluftofen mit rund 150–180 °C. Echtes Low & Slow für Brisket läuft noch kühler, das ist Lektion 6.',
      hinweis: 'Der Absatz über indirekte Hitze.',
    },
    {
      id: 'c-direkt-2',
      q: 'Ab welcher Dicke gehört ein Steak nach dem Anrösten immer in die indirekte Zone?',
      options: ['Ab 1 cm', 'Ab 2 cm', 'Ab etwa 3 cm', 'Steaks gehören nie in die indirekte Zone'],
      correct: 2,
      explain:
        'Dicke Steaks nur direkt zu grillen ist der häufigste Anfängerfehler: außen verkohlt, innen kalt. Ab rund 3 cm gehört das Stück nach der Kruste in die schonende Zone.',
      hinweis: 'Der Achtung-Kasten am Ende.',
    },
    {
      id: 'c-direkt-3',
      q: 'Für welches Grillgut ist die direkte Zone gedacht?',
      options: [
        'Ganze Hähnchen und Braten',
        'Dünne, kleine Stücke, die schnell gar sind',
        'Brisket und Pulled Pork',
        'Empfindlichen Fisch',
      ],
      correct: 1,
      explain:
        'Steaks, Würste, Gemüsescheiben — alles, was in wenigen Minuten fertig ist. Was Zeit braucht, gehört daneben statt darüber.',
      hinweis: 'Der Absatz über direkte Hitze.',
    },
  ],

  temperaturzonen: [
    {
      id: 'c-zonen-1',
      q: 'Du hältst die Hand etwa 12 cm über den Rost. Nach wie vielen Sekunden musst du sie in der direkten Zone wegziehen?',
      options: ['Nach 2–3 Sekunden', 'Nach 5–7 Sekunden', 'Nach 10 Sekunden', 'Gar nicht'],
      correct: 0,
      explain:
        'Der Handtest schätzt Hitze ohne Thermometer: 2–3 Sekunden heißt direkte Zone, 5–7 Sekunden indirekte. Ein grober, aber überall verfügbarer Maßstab.',
      hinweis: 'Der Profi-Tipp zum Handtest.',
    },
    {
      id: 'c-zonen-2',
      q: 'Welche Temperatur hat die Low-&-Slow-Zone?',
      options: ['60–80 °C', '100–130 °C', '150–180 °C', '200–230 °C'],
      correct: 1,
      explain:
        'Die Smoker-Stufe: Hier werden zähe Cuts wie Brisket oder Pulled Pork über viele Stunden butterzart — und hier hältst du Fertiges warm.',
      hinweis: 'Der Absatz über die vier Zonen.',
    },
    {
      id: 'c-zonen-3',
      q: 'Wie viel der Rostfläche solltest du mindestens frei von direkter Hitze halten?',
      options: ['Nichts — nutze die ganze Fläche', 'Ein Zehntel', 'Ein Drittel', 'Die Hälfte, immer'],
      correct: 2,
      explain:
        'Ohne kühlere Zone hast du bei einem Aufflackern oder zu schneller Bräunung keinen sicheren Platz. Mindestens ein Drittel bleibt frei — egal ob Kohle oder Gas.',
      hinweis: 'Der Achtung-Kasten am Ende.',
    },
  ],

  'temperatur-messen': [
    {
      id: 'c-messen-1',
      q: 'Wie prüfst du, ob dein Thermometer noch richtig anzeigt?',
      options: [
        'Im Kühlschrank — es muss 7 °C zeigen',
        'In kochendem Wasser 100 °C, in Eiswasser 0 °C',
        'Mit der Handfläche vergleichen',
        'Gar nicht — Thermometer gehen nicht kaputt',
      ],
      correct: 1,
      explain:
        'Einmal im Jahr genügt. Weicht es ab, weißt du, um wie viel du gedanklich korrigieren musst — statt dich auf eine falsche Zahl zu verlassen.',
      hinweis: 'Der Profi-Tipp am Ende.',
    },
    {
      id: 'c-messen-2',
      q: 'Du öffnest bei einem Kohlegrill die untere Lüftung weiter. Was passiert?',
      options: [
        'Die Glut wird sofort heißer',
        'Die Glut wird heißer — aber mit Verzögerung von einigen Minuten',
        'Die Glut wird kühler',
        'Nur der Rauchabzug ändert sich',
      ],
      correct: 1,
      explain:
        'Mehr Luft von unten heißt mehr Hitze, aber nicht sofort. Wer nachregelt, bevor die letzte Änderung angekommen ist, schwingt zwischen zu heiß und zu kalt hin und her.',
      hinweis: 'Abschnitt „Regeln statt Uhr".',
    },
    {
      id: 'c-messen-3',
      q: 'Was kostet dich jedes Öffnen des Deckels?',
      options: [
        'Nichts, solange es schnell geht',
        'Hitze — und damit Garzeit',
        'Nur etwas Rauch',
        'Die Kruste',
      ],
      correct: 1,
      explain:
        '„Wer guckt, grillt nicht" ist kein Spruch, sondern Physik. Mit einem Fühler im Fleisch musst du gar nicht gucken.',
      hinweis: 'Der Achtung-Kasten am Ende.',
    },
  ],

  salzen: [
    {
      id: 'c-salzen-1',
      q: 'Durch welchen Vorgang zieht Salz Feuchtigkeit aus dem Fleisch an die Oberfläche?',
      options: ['Verdunstung', 'Osmose', 'Maillard-Reaktion', 'Karamellisierung'],
      correct: 1,
      explain:
        'Osmose zieht den Saft nach außen. Ob das hilft oder schadet, entscheidet allein die Zeit: sofort auf den Rost oder mindestens 40 Minuten warten, bis er wieder eingezogen ist.',
      hinweis: 'Der zweite Absatz der Lektion.',
    },
    {
      id: 'c-salzen-2',
      q: 'Was gehört zur Stunde-vorher-Methode („Trockensalzen")?',
      options: [
        'Salzen und sofort grillen',
        'Salzen, unbedeckt im Kühlschrank ruhen lassen, vor dem Grillen temperieren',
        'Salzen und in Folie wickeln',
        'In Salzwasser einlegen',
      ],
      correct: 1,
      explain:
        'Unbedeckt trocknet die Oberfläche, während das Salz einzieht. Genau diese trockene, gewürzte Oberfläche bildet die beste Kruste.',
      hinweis: 'Der Profi-Tipp zur Stunde-vorher-Methode.',
    },
    {
      id: 'c-salzen-3',
      q: 'Womit würzt du nach dem Grillen nach, wenn du zusätzlich Textur willst?',
      options: ['Feinem Tafelsalz', 'Flockensalz', 'Nochmals grobem Steinsalz', 'Salzlake'],
      correct: 1,
      explain:
        'Flockensalz bleibt spürbar auf der Zunge und knirscht leicht — ein Effekt, den eingezogenes Salz nicht liefern kann.',
      hinweis: 'Der Absatz zur Menge.',
    },
  ],

  'das-erste-steak': [
    {
      id: 'c-steak-1',
      q: 'Woran erkennst du, dass das Steak zum Wenden bereit ist?',
      options: [
        'Nach genau 90 Sekunden',
        'Wenn es sich von selbst vom Rost löst',
        'Wenn Saft oben austritt',
        'Wenn es zu rauchen beginnt',
      ],
      correct: 1,
      explain:
        'Solange es klebt, ist die Kruste nicht fertig. Nach etwa zwei Minuten löst es sich von allein — das ist das Signal, nicht die Uhr.',
      hinweis: 'Abschnitt „Erste Entscheidung: heiß anrösten".',
    },
    {
      id: 'c-steak-2',
      q: 'Warum tupfst du das Steak vor dem Auflegen trocken?',
      options: [
        'Damit das Salz besser haftet',
        'Weil nasses Fleisch dampft, statt zu bräunen',
        'Damit es nicht spritzt',
        'Damit es schneller gar wird',
      ],
      correct: 1,
      explain:
        'Feuchtigkeit muss erst verdampfen, bevor Bräunung einsetzt — in dieser Zeit gart das Steak weiter, ohne Kruste zu bilden.',
      hinweis: 'Abschnitt „Erste Entscheidung: heiß anrösten".',
    },
    {
      id: 'c-steak-3',
      q: 'Wie heißt es, wenn die Kerntemperatur nach dem Abnehmen vom Grill weitersteigt?',
      options: ['Nachziehen (Carry-over)', 'Nachgaren im Ofen', 'Reverse Sear', 'Maillard-Reaktion'],
      correct: 0,
      explain:
        'Die heiße Oberfläche gibt ihre Wärme nach innen ab. Deshalb kommt das Steak 2–3 °C vor dem Ziel vom Rost — wer auf die Zielzahl wartet, bekommt sie nie.',
      hinweis: 'Abschnitt „Zweite Entscheidung: früher runter, als du denkst".',
    },
  ],

  'dry-rubs-marinaden': [
    {
      id: 'c-rubs-1',
      q: 'Woraus besteht eine Marinade typischerweise?',
      options: [
        'Nur aus Öl und Kräutern',
        'Aus Öl, einer Säure und Aromen',
        'Aus Salz, Zucker und Pfeffer',
        'Aus Wasser und Salz',
      ],
      correct: 1,
      explain:
        'Das Öl trägt fettlösliche Aromen und schützt vor dem Austrocknen, die Säure würzt und lockert die äußerste Schicht. Tiefer als wenige Millimeter kommt beides nicht.',
      hinweis: 'Abschnitt „Was Rubs und Marinaden tun".',
    },
    {
      id: 'c-rubs-2',
      q: 'Wann kommen frische Kräuter aufs Grillgut?',
      options: [
        'Vor dem Grillen, damit sie einziehen',
        'In der Mitte der Garzeit',
        'Nach dem Grillen, aufs fertige Stück',
        'Gar nicht — sie gehören nicht an den Grill',
      ],
      correct: 2,
      explain:
        'Über dem Feuer verlieren sie ihr Aroma und werden schwarz. Faustregel: je hitzeempfindlicher, desto später.',
      hinweis: 'Abschnitt „Timing: Hitze entscheidet über den Zeitpunkt".',
    },
    {
      id: 'c-rubs-3',
      q: 'Ab welcher Temperatur beginnt Zucker zu karamellisieren — und wird bei direkter Hitze schnell bitter?',
      options: ['Ab etwa 80 °C', 'Ab etwa 150 °C', 'Ab etwa 230 °C', 'Zucker verbrennt gar nicht'],
      correct: 1,
      explain:
        'Deshalb kommt zuckerhaltige BBQ-Sauce erst in den letzten Minuten aufs Fleisch, indirekt und in dünnen Schichten — sonst ist sie schwarz, bevor das Fleisch gar ist.',
      hinweis: 'Abschnitt „Timing: Hitze entscheidet über den Zeitpunkt".',
    },
  ],

  'rauch-reinigung-pflege': [
    {
      id: 'c-pflege-1',
      q: 'In welchem Bereich liegt die ideale Temperatur zum Räuchern?',
      options: ['50–70 °C', '80–110 °C', '130–160 °C', '180–200 °C'],
      correct: 1,
      explain:
        'In diesem Bereich schwelt das Holz, statt zu verbrennen. Die Obergrenze liegt bei 160 °C — darüber wird der Rauch beißend.',
      hinweis: 'Abschnitt „Rauch — der erste Blick".',
    },
    {
      id: 'c-pflege-2',
      q: 'Warum wässerst du Holzchips vor dem Räuchern etwa 30 Minuten?',
      options: [
        'Damit sie sauber werden',
        'Damit sie glimmen statt zu brennen',
        'Damit sie länger halten und weniger kosten',
        'Damit sie mehr Hitze abgeben',
      ],
      correct: 1,
      explain:
        'Trockene Chips fangen Feuer und sind in Minuten weg. Gewässert schwelen sie und geben über längere Zeit Rauch ab.',
      hinweis: 'Abschnitt „Rauch — der erste Blick".',
    },
    {
      id: 'c-pflege-3',
      q: 'Wohin gehört die Gasflasche, wenn du den Grill einwinterst?',
      options: [
        'In den Keller, dort ist es frostfrei',
        'Ins Freie oder in einen belüfteten Raum',
        'Unter die Abdeckhaube, am Grill angeschlossen',
        'In die Wohnung, damit sie nicht einfriert',
      ],
      correct: 1,
      explain:
        'Gas ist schwerer als Luft und sammelt sich in tiefliegenden, geschlossenen Räumen. Deshalb: abschrauben und nach draußen — nie in den Keller, nie in die Wohnung.',
      hinweis: 'Abschnitt „Pflege und Einwintern".',
    },
  ],
};

/** Fragen einer Lektion; leeres Array, wenn fuer den Slug noch keine da sind. */
export function checkFragen(lektionSlug: string): CheckFrage[] {
  return LEKTIONS_CHECK[lektionSlug] ?? [];
}

/** Alle Fragen ueber alle Lektionen — fuer den Abgrenzungstest. */
export function alleCheckFragen(): CheckFrage[] {
  return Object.values(LEKTIONS_CHECK).flat();
}
