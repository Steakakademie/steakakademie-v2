/**
 * Fragenbank der Stufenpruefungen. Seit 08.09.2026 (Rahmenlehrplan §8) zieht der
 * Server aus dem Pool (zieheFragen), gibt dem Browser Fragen OHNE Loesung
 * (fragenFuerClient) und bewertet nach ids (bewerte). Die Loesungen verlassen
 * diese Datei nur ueber die Bewertung — nie als Bundle im Browser.
 *
 * Jede Frage traegt `lektionSlug`: die Lektion, in der die Antwort steht.
 * Damit hat jede Pruefungsfrage einen Bezug zum Lernstoff (Regel 8b, Punkt e)
 * und bei einer falschen Antwort kann direkt dorthin verwiesen werden.
 *
 * Temperaturen folgen data/kerntemperatur-referenz.yaml (Regel 8c). Korrigiert
 * am 06.09.2026: Schweinefilet 63–65 °C (vorher 58–62, unter dem
 * Sicherheits-Minimum 63 °C), Lachs 48–52 °C, Lamm 54–57 °C. Die fruehere
 * Formulierung „seit 2011 lebensmittelrechtlich okay" ist entfernt — Regel 10,
 * keine juristischen Aussagen. Am 07.09.2026 die komplette Rind-Garstufen-Skala
 * auf die von Uwe bestaetigte Referenztabelle umgestellt: rare 45–49, medium
 * rare 52–55 (Standard 54, oberer Rand — vorher 54–58), medium 55–60 (vorher
 * 58–63), well done 70+ (vorher 68+).
 */

import 'server-only';
import { QUIZ_FRAGEN_PRO_PRUEFUNG, bestehensgrenze, type StufeKey } from './stufen';

export type QuizFrage = {
  /** Stabile Kennung — die Pruefung zieht nach id und bewertet nach id. Nie umnummerieren. */
  id: string;
  q: string;
  options: readonly string[];
  /** Index der richtigen Option */
  correct: number;
  explain: string;
  /** Lektion (lektionSlug), in der die Antwort steht */
  lektionSlug: string;
};


export const FRAGEN: Record<StufeKey, readonly QuizFrage[]> = {
  // ── Stufe 1 · Grillmeister Bronze ───────────────────────────────────────
  // Pool 33 Fragen = 3 je Lektion (Rahmenlehrplan §8, 08.09.2026). Die
  // Pruefung zieht 10, hoechstens eine je Lektion, bestanden ab 8.
  // Fakten: Lektionstexte Stufe 1 + kerntemperatur-referenz.yaml.
  bronze: [
    // 1.1 grillarten
    { id: 'b-grillarten-1', q: 'Was verändert der geschlossene Deckel am Grill physikalisch?', options: ['Nichts — er hält nur Regen ab', 'Die Hitze erreicht das Grillgut nur noch von unten', 'Heiße Luft zirkuliert um das Grillgut, es gart von allen Seiten', 'Die Glut wird heißer'], correct: 2, explain: 'Geschlossen ist der Grill ein Ofen: Umluft statt reiner Strahlung von unten. Erst der Deckel macht indirektes Grillen und Räuchern möglich.', lektionSlug: 'grillarten' },
    { id: 'b-grillarten-2', q: 'Welcher Grilltyp hält eine eingestellte Temperatur über Stunden elektronisch geregelt?', options: ['Kugelgrill', 'Pellet-Grill', 'Elektrogrill', 'Kamado'], correct: 1, explain: 'Pellet-Grills fördern Holzpellets über eine Steuerung nach — gebaut für Low & Slow.', lektionSlug: 'grillarten' },
    { id: 'b-grillarten-3', q: 'Was braucht ein Anfänger am dringendsten, unabhängig vom Grilltyp?', options: ['Einen zweiten Grill', 'Ein Kerntemperatur-Thermometer', 'Einen Drehspieß', 'Eine Räucherbox'], correct: 1, explain: 'Das Thermometer macht aus jedem Grill ein präzises Werkzeug — wichtiger als jede Markenwahl.', lektionSlug: 'grillarten' },
    // 1.2 brennstoffkunde
    { id: 'b-brennstoff-1', q: 'Wann sind Briketts die bessere Wahl als Holzkohle?', options: ['Für ein schnelles Steak', 'Für lange, gleichmäßige Hitze über Stunden', 'Wenn es besonders heiß werden soll', 'Nie — Holzkohle ist immer besser'], correct: 1, explain: 'Briketts starten langsamer, halten aber über Stunden gleichmäßig — für Braten und Low & Slow. Holzkohle ist schnell heiß und schnell wieder schwach.', lektionSlug: 'brennstoffkunde' },
    { id: 'b-brennstoff-2', q: 'Woher kommt der typische „Grillgeschmack" hauptsächlich?', options: ['Aus der Holzkohle selbst', 'Aus verdampfendem Fett und Fleischsaft auf der heißen Oberfläche', 'Aus dem Anzünder', 'Aus dem Rost'], correct: 1, explain: 'Fett und Saft tropfen auf Glut oder Aromaschienen, verdampfen und steigen als Aroma auf — bei Kohle wie bei Gas. Echter Rauchgeschmack kommt aus Holz.', lektionSlug: 'brennstoffkunde' },
    { id: 'b-brennstoff-3', q: 'Was ist der häufigste Fehler beim Brennstoff?', options: ['Zu wenig Kohle', 'Den ganzen Rost mit Kohle bedecken', 'Briketts und Holzkohle mischen', 'Gas statt Kohle nutzen'], correct: 1, explain: 'Wer alles bedeckt, hat keine kühle Zone mehr und kann nichts retten. Weniger Kohle, klug verteilt.', lektionSlug: 'brennstoffkunde' },
    // 1.3 sicherheit-brandschutz
    { id: 'b-sicherheit-1', q: 'Was verhindert ein gefährliches Aufflackern?', options: ['Mehr Holzkohle nachlegen', 'Deckel schließen', 'Wasser drauf spritzen', 'Fett vom Fleisch schneiden'], correct: 1, explain: 'Sauerstoffmangel durch geschlossenen Deckel erstickt Flammen.', lektionSlug: 'sicherheit-brandschutz' },
    { id: 'b-sicherheit-2', q: 'Wie prüfst du einen Gasgrill auf Lecks?', options: ['Mit einem Feuerzeug an den Anschlüssen', 'Mit Seifenwasser auf Schläuchen und Ventilen — Blasen zeigen austretendes Gas', 'Am Geruch', 'Gar nicht, Gasgrills sind dicht'], correct: 1, explain: 'Seifenwasser auf die Verbindungen: Bildet sich Blasen, entweicht Gas. Vor der Saison und nach jedem Flaschenwechsel.', lektionSlug: 'sicherheit-brandschutz' },
    { id: 'b-sicherheit-3', q: 'Warum niemals Wasser auf einen Fettbrand?', options: ['Es verschmutzt den Grill', 'Verdampfendes Wasser reißt brennendes Fett mit — Stichflamme', 'Es löscht zu langsam', 'Es macht die Kohle unbrauchbar'], correct: 1, explain: 'Fett brennt weiter, Wasser verdampft explosionsartig und verteilt es. Sauerstoff entziehen: Deckel und Lüftung zu.', lektionSlug: 'sicherheit-brandschutz' },
    // 1.4 anzuenden-startroutine
    { id: 'b-anzuenden-1', q: 'Wann ist Holzkohle bereit zum Grillen?', options: ['Sobald die Flammen lodern', 'Wenn schwarze Kohlen glühen', 'Sobald ein hellgrauer Aschefilm sichtbar ist', 'Nach genau 5 Minuten'], correct: 2, explain: 'Grauer Aschefilm zeigt: gleichmäßige Glut, ideale Temperatur.', lektionSlug: 'anzuenden-startroutine' },
    { id: 'b-anzuenden-2', q: 'In welcher Reihenfolge bereitest du den Rost vor?', options: ['Einölen → bürsten → aufheizen', 'Bürsten → einölen → aufheizen', 'Aufheizen → bürsten → einölen', 'Aufheizen → einölen → bürsten'], correct: 2, explain: 'Heiß wird der Schmutz spröde und lässt sich bürsten; erst auf den sauberen, heißen Rost kommt dünn Öl. Andersherum brätst du den alten Schmutz fest.', lektionSlug: 'anzuenden-startroutine' },
    { id: 'b-anzuenden-3', q: 'Warum keine flüssigen Anzünder wie Spiritus?', options: ['Sie sind zu teuer', 'Stichflammengefahr — und Rückstände, die du im Fleisch schmeckst', 'Sie brennen zu kurz', 'Sie sind nur für Gasgrills'], correct: 1, explain: 'Flüssige Brennstoffe verbrennen nie restlos und sind unberechenbar. Anzündkamin mit festen Anzündern.', lektionSlug: 'anzuenden-startroutine' },
    // 1.5 direkte-indirekte-hitze
    { id: 'b-direkt-1', q: 'Welche Temperatur hat die direkte Hitze-Zone?', options: ['100–150 °C', '160–200 °C', '230–290 °C', '300–400 °C'], correct: 2, explain: '230–290 °C ist die Zone fürs scharfe Angrillen und die Kruste.', lektionSlug: 'direkte-indirekte-hitze' },
    { id: 'b-direkt-2', q: 'Wofür nutzt man indirekte Hitze (150–180 °C)?', options: ['Schnelles Anbraten', 'Große Stücke schonend durchgaren', 'Maillard-Reaktion', 'Scharfes Angrillen'], correct: 1, explain: 'Indirekt = schonend fertig garen (Geflügel, Gemüse, Braten). Echtes Low & Slow für Brisket läuft noch kühler: 100–130 °C.', lektionSlug: 'direkte-indirekte-hitze' },
    { id: 'b-direkt-3', q: 'Was ist der Profi-Trick bei direkter und indirekter Hitze?', options: ['Nur eine der beiden nutzen', 'Beide Zonen anlegen: erst direkt anrösten, dann indirekt fertig ziehen', 'Immer indirekt beginnen', 'Den Deckel offen lassen'], correct: 1, explain: 'Kruste aus der direkten Zone, Garung aus der indirekten — deshalb brauchst du fast immer beide.', lektionSlug: 'direkte-indirekte-hitze' },
    // 1.6 temperaturzonen
    { id: 'b-zonen-1', q: 'Mindest-Abstand Kohle zu Rost?', options: ['2–5 cm', '5–8 cm', '10–15 cm', '20–25 cm'], correct: 2, explain: '10–15 cm — sonst verbrennt das Fleisch außen, bevor es innen gar ist.', lektionSlug: 'temperaturzonen' },
    { id: 'b-zonen-2', q: 'Dein Kugelgrill ist zu klein für eine freie indirekte Zone. Was tust du?', options: ['Direkt grillen und hoffen', 'Pizzastein oder Hitzeschild zwischen Glut und Grillgut', 'Weniger Kohle, dafür überall', 'Deckel offen lassen'], correct: 1, explain: 'Pizzastein oder Tropfschale als Hitzeschild fangen die Strahlung ab — das Grillgut bekommt nur noch Umluft.', lektionSlug: 'temperaturzonen' },
    { id: 'b-zonen-3', q: 'Welche Kohle-Anordnung gart die Mitte von allen Seiten gleichmäßig indirekt?', options: ['Pyramide', '50/50', 'Ring', 'Alles gleichmäßig verteilt'], correct: 2, explain: 'Beim Ring liegt die Glut am Rand, die Mitte bleibt frei — ideal für Braten und ganzes Geflügel.', lektionSlug: 'temperaturzonen' },
    // 1.7 temperatur-messen
    { id: 'b-messen-1', q: 'Was misst das Thermometer im Deckel?', options: ['Die Temperatur auf Rosthöhe', 'Die Kerntemperatur', 'Die Temperatur im Deckel — oben, wo sich heiße Luft sammelt', 'Die Temperatur der Glut'], correct: 2, explain: 'Es zeigt den Trend, nicht den Wert auf dem Rost. Für Rosthöhe brauchst du einen Fühler dort.', lektionSlug: 'temperatur-messen' },
    { id: 'b-messen-2', q: 'Wo setzt du den Kerntemperaturfühler?', options: ['Am Knochen, der leitet gut', 'In die dickste Stelle, mittig, nicht am Knochen und nicht im Fett', 'Knapp unter die Oberfläche', 'Egal — Hauptsache drin'], correct: 1, explain: 'Die dickste Stelle ist am spätesten gar. Knochen zeigt zu hoch, Fett zu niedrig.', lektionSlug: 'temperatur-messen' },
    { id: 'b-messen-3', q: 'Wonach richtest du dich beim Garen?', options: ['Nach der Zeit im Rezept', 'Nach der Farbe außen', 'Nach der Kerntemperatur', 'Nach dem Geräusch'], correct: 2, explain: 'Ein Steak kennt keine Uhr. Dicke, Wetter und Grill verändern jede Zeitangabe — die Kerntemperatur nicht.', lektionSlug: 'temperatur-messen' },
    // 1.8 salzen
    { id: 'b-salzen-1', q: 'Wann salzt du ein Steak?', options: ['5–30 Minuten vorher', 'Direkt vor dem Grillen oder mindestens 40 Minuten davor', 'Nur nach dem Grillen', 'Nie — Salz trocknet aus'], correct: 1, explain: 'Dazwischen liegt Saft auf der Oberfläche und verhindert die Kruste. Sofort oder ≥ 40 Minuten vorher.', lektionSlug: 'salzen' },
    { id: 'b-salzen-2', q: 'Was passiert, wenn du 15 Minuten vor dem Grillen salzt?', options: ['Beste Kruste', 'Das Salz zieht Saft an die Oberfläche — nasse Oberfläche, keine Kruste', 'Das Fleisch wird zäh', 'Nichts'], correct: 1, explain: 'In der Zwischenzeit liegt der gelöste Saft obenauf und dampft statt zu bräunen.', lektionSlug: 'salzen' },
    { id: 'b-salzen-3', q: 'Wie salzt du richtig?', options: ['Feines Salz dünn', 'Grobes Salz sichtbar gleichmäßig, aus etwas Höhe gestreut', 'Nur eine Seite', 'Salz in die Marinade'], correct: 1, explain: 'Grob und aus Höhe verteilt sich das Salz gleichmäßig und ist sichtbar — so dosierst du verlässlich.', lektionSlug: 'salzen' },
    // 1.9 das-erste-steak
    { id: 'b-steak-1', q: 'Ziel 54 °C medium rare. Wann nimmst du das Steak vom Grill?', options: ['Bei 54 °C', 'Bei 51–52 °C — es zieht beim Ruhen nach', 'Bei 58 °C', 'Bei 48 °C'], correct: 1, explain: 'Die Kerntemperatur steigt nach dem Abnehmen weiter (Carry-over). 2–3 °C vor dem Ziel runter.', lektionSlug: 'das-erste-steak' },
    { id: 'b-steak-2', q: 'Wohin legst du das Steak zum Ruhen?', options: ['Auf einen kalten Teller', 'In Alufolie', 'Auf einen temperierten Stein oder ein Holzbrett (rund 85 °C)', 'Zurück auf den heißen Rost'], correct: 2, explain: 'Der kalte Teller stoppt das Nachziehen, Folie weicht die Kruste auf, der Rost gart weiter. Temperiert hält das Steak und verteilt den Saft.', lektionSlug: 'das-erste-steak' },
    { id: 'b-steak-3', q: 'Wie lange ruht ein Steak von 2–3 cm Dicke?', options: ['Gar nicht', '3–5 Minuten', '15 Minuten', '30 Minuten'], correct: 1, explain: 'Steaks 3–5 Minuten; große Braten brauchen deutlich länger. Ruhezeit skaliert mit der Größe.', lektionSlug: 'das-erste-steak' },
    // 1.10 dry-rubs-marinaden (zusammengelegt mit Wuerz-Timing)
    { id: 'b-rubs-1', q: 'In welche Zone gehört mariniertes Fleisch?', options: ['Direkt — für die Kruste', 'Indirekt — die Marinade verbrennt sonst', 'Egal', 'Auf den Pizzastein'], correct: 1, explain: 'Öl flackert auf, Zucker und Aromen verkohlen in der direkten Zone. Indirekt trocknet die Marinade an und glasiert.', lektionSlug: 'dry-rubs-marinaden' },
    { id: 'b-rubs-2', q: 'Wie tief wirken Rub und Marinade ins Fleisch?', options: ['Bis zum Kern', 'Etwa zur Hälfte', 'Nur wenige Millimeter', 'Gar nicht'], correct: 2, explain: 'Geschmack entsteht an der Oberfläche. „Über Nacht zieht es durch" ist ein Mythos — saure Marinaden machen die Oberfläche eher mehlig.', lektionSlug: 'dry-rubs-marinaden' },
    { id: 'b-rubs-3', q: 'Wann kommt zuckerhaltige BBQ-Sauce aufs Fleisch?', options: ['Von Anfang an', 'In den letzten Minuten, indirekt, in dünnen Schichten', 'Vor dem Salzen', 'Nur roh dazu'], correct: 1, explain: 'Zucker karamellisiert ab etwa 150 °C und verbrennt bei direkter Hitze. Ans Ende, indirekt, lackieren.', lektionSlug: 'dry-rubs-marinaden' },
    // 1.11 rauch-reinigung-pflege
    { id: 'b-pflege-1', q: 'Welche Garraumtemperatur beim Räuchern nicht überschreiten?', options: ['100 °C', '160 °C', '200 °C', '250 °C'], correct: 1, explain: 'Über 160 °C verbrennt das Holz statt zu schwelen — der Rauch wird beißend. Ideal 80–110 °C.', lektionSlug: 'rauch-reinigung-pflege' },
    { id: 'b-pflege-2', q: 'Was ist der schwarze, abblätternde Belag im Deckel?', options: ['Farbe, die sich löst', 'Fett- und Rauchrückstände (Fettkohle)', 'Rost', 'Normale Beschichtung'], correct: 1, explain: 'Keine Farbe: verhärtetes Fett und Rauch. Bei warmem Grill abbürsten oder abschaben, bevor es aufs Essen fällt.', lektionSlug: 'rauch-reinigung-pflege' },
    { id: 'b-pflege-3', q: 'Wann reinigst du den Rost am einfachsten?', options: ['Kalt, am nächsten Tag', 'Solange der Grill noch heiß ist — Rückstände verkohlen und lösen sich', 'Nur einmal im Jahr', 'Nie — Patina ist gut'], correct: 1, explain: 'Nach dem Grillen kurz voll aufheizen und bürsten. Kalt eingetrocknetes Fett ist die schlechteste Ausgangslage.', lektionSlug: 'rauch-reinigung-pflege' },
  ],
  anatomie: [
    { id: 's-1', q: 'Aus welchem Teilstück ist ein Ribeye?', options: ['Bauch', 'Hohe Rippe', 'Hüfte', 'Schulter'], correct: 1, explain: 'Ribeye = Kern der hohen Rippe, stark marmoriert.', lektionSlug: 'rinder-cuts' },
    { id: 's-2', q: 'Wie heißt der Brustkern auf Englisch?', options: ['Sirloin', 'Brisket', 'Chuck', 'Flank'], correct: 1, explain: 'Brisket = Rinderbrust, der König der Low-&-Slow-Cuts.', lektionSlug: 'rinder-cuts' },
    { id: 's-3', q: 'Welcher Cut ist besonders stark marmoriert?', options: ['Filet', 'Onglet', 'Ribeye', 'Hüfte'], correct: 2, explain: 'Ribeye trägt das meiste intramuskuläre Fett — Geschmacks-Champion.', lektionSlug: 'marmorierung' },
    { id: 's-4', q: 'Dry-Aging-Dauer minimal für spürbaren Effekt?', options: ['3 Tage', '7 Tage', '21 Tage', '60 Tage'], correct: 2, explain: 'Ab 21 Tagen entstehen die typischen nussigen Aromen.', lektionSlug: 'dry-wet-aging' },
    { id: 's-5', q: 'Optimale Fleisch-Lagertemperatur?', options: ['−2 bis 0 °C', '0 bis 2 °C', '2 bis 4 °C', '4 bis 6 °C'], correct: 1, explain: '0–2 °C maximiert Haltbarkeit ohne Gewebeschaden.', lektionSlug: 'fleisch-lagern' },
  ],
  thermometer: [
    { id: 'g-1', q: 'Kerntemperatur medium rare beim Rind (serviert)?', options: ['45–49 °C', '52–55 °C', '60–64 °C', '66–70 °C'], correct: 1, explain: '52–55 °C serviert: rosa Kern, warm, saftig — Steakakademie-Standard 54 °C, oberer Rand. Bei 50–51 °C vom Grill nehmen — das Nachziehen macht den Rest.', lektionSlug: 'kerntemperaturen' },
    { id: 'g-2', q: 'Hähnchenbrust sichere Endtemperatur?', options: ['62 °C', '68 °C', '72–75 °C', '85 °C'], correct: 2, explain: 'Ab 72 °C ist Geflügel sicher — und bei 72–75 °C noch saftig.', lektionSlug: 'kerntemperaturen' },
    { id: 'g-3', q: 'Schweinefilet saftig und sicher?', options: ['54 °C', '63–65 °C', '70 °C', '78 °C'], correct: 1, explain: '63 °C ist das Sicherheits-Minimum für Schwein — darüber bleibt das Filet saftig, darunter geht es nicht.', lektionSlug: 'kerntemperaturen' },
    { id: 'g-4', q: 'Was passiert ab 140 °C an der Fleischoberfläche?', options: ['Saftverlust', 'Maillard-Reaktion', 'Kollagenabbau', 'Verkohlung'], correct: 1, explain: 'Maillard = die Bräunungs-Reaktion, Aromen-Explosion.', lektionSlug: 'maillard-kruste' },
    { id: 'g-5', q: 'Reverse Sear: Welche Reihenfolge?', options: ['Sear → Niedrig garen', 'Niedrig garen → Sear', 'Nur Sear', 'Nur niedrig garen'], correct: 1, explain: 'Erst sanft auf Kerntemperatur, dann scharf für die Kruste.', lektionSlug: 'reverse-sear' },
  ],
  holz: [
    { id: 'p-1', q: 'Hickory passt am besten zu?', options: ['Lachs', 'Geflügel zart', 'Brisket', 'Käse'], correct: 2, explain: 'Hickory ist robust — perfekt für Brisket und Pulled Pork.', lektionSlug: 'holz-rauch-mopping' },
    { id: 'p-2', q: 'Apfelholz-Aroma?', options: ['Stark, würzig', 'Mild, leicht süß', 'Bitter, scharf', 'Erdig, kräftig'], correct: 1, explain: 'Apfel ist sanft — ideal für Geflügel und Schwein.', lektionSlug: 'holz-rauch-mopping' },
    { id: 'p-3', q: 'Was ist ein Smoke Ring?', options: ['Werbe-Logo', 'Rosa Ring unter der Kruste', 'Rauch-Tornado im Smoker', 'Werkzeug'], correct: 1, explain: 'Stickstoff-Reaktion: rosa Verfärbung unter der Kruste, Zeichen guten Smokes.', lektionSlug: 'holz-rauch-mopping' },
    { id: 'p-4', q: 'Die Stall-Phase tritt typisch auf bei?', options: ['65–75 °C', '50–60 °C', '85–95 °C', '40–50 °C'], correct: 0, explain: 'Bei 65–75 °C verdunstet Wasser und kühlt die Oberfläche — Geduld!', lektionSlug: 'bbq-wissenschaft' },
    { id: 'p-5', q: 'Optimale Holz-Feuchtigkeit zum Räuchern?', options: ['0–5 %', '15–20 %', '30–35 %', '50–60 %'], correct: 1, explain: '15–20 % gibt sauberen Rauch ohne Bitterkeit.', lektionSlug: 'holz-rauch-mopping' },
  ],
  kcbs: [
    { id: 'm-1', q: 'Wie viele Hähnchenstücke kommen in die KCBS-Box?', options: ['1 ganzes Tier', '4 Brüste', '6 gleiche Stücke', '8 Schenkel'], correct: 2, explain: '6 einheitliche Stücke — Optik zählt.', lektionSlug: 'wettbewerbsgrillen' },
    { id: 'm-2', q: 'KCBS-Brisket-Wettkampfgewicht typisch?', options: ['1–2 kg', '3–4 kg', '6–7 kg', '12–15 kg'], correct: 2, explain: 'Packer-Brisket mit Flat + Point, 6–7 kg sind Standard.', lektionSlug: 'wettbewerbsgrillen' },
    { id: 'm-3', q: 'KCBS-Bewertungsskala pro Kriterium?', options: ['1–5', '1–10', '2–9', '6–9 + Disqualifikation'], correct: 3, explain: '6 = durchschnittlich, 9 = exzellent. Unter 6 = Disqualifikation.', lektionSlug: 'wettbewerbsgrillen' },
    { id: 'm-4', q: 'Was zählt zum „Appearance"-Score?', options: ['Geschmack', 'Konsistenz', 'Optik in der Turn-In-Box', 'Geruch'], correct: 2, explain: 'Box-Layout, Farbe, Glanz — der erste Eindruck zählt.', lektionSlug: 'praesentation-anrichten' },
    { id: 'm-5', q: 'Standard-KCBS-Turn-In-Box?', options: ['Eigene Box', 'Styropor, weiß, 9×9 inch', 'Holzkiste', 'Glasdose'], correct: 1, explain: 'Weiße Styropor-Box, einheitlich 9×9 inch.', lektionSlug: 'wettbewerbsgrillen' },
  ],
};

export type Bewertung = {
  score: number;
  /** Anzahl bewerteter Fragen — 10 bei vollem Pool, weniger bei kleinen Pools. */
  gesamt: number;
  grenze: number;
  bestanden: boolean;
  ergebnisse: { id: string; richtig: boolean; explain: string; lektionSlug: string }[];
};

function frageById(modul: StufeKey, id: string): QuizFrage | undefined {
  return FRAGEN[modul].find((f) => f.id === id);
}

/**
 * Ziehung (Rahmenlehrplan §8, 08.09.2026): bis zu QUIZ_FRAGEN_PRO_PRUEFUNG
 * Fragen, **hoechstens eine je Lektion**, solange genug Lektionen im Pool sind;
 * danach wird aus dem Rest aufgefuellt. Kleine Pools (Stufen 2–5, je 5
 * Fragen) liefern alles — dort bleibt die Pruefung damit unveraendert, bis
 * der Pool waechst.
 *
 * Laeuft auf dem Server (GET /api/diplome/pruefung), der die gezogenen ids
 * signiert zurueckgibt. Der Browser kann sich die Fragen also nicht aussuchen.
 */
export function zieheFragen(modul: StufeKey, anzahl = QUIZ_FRAGEN_PRO_PRUEFUNG): string[] {
  const pool = [...FRAGEN[modul]];
  // Fisher–Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const gewaehlt: QuizFrage[] = [];
  const belegteLektionen = new Set<string>();
  for (const f of pool) {
    if (gewaehlt.length >= anzahl) break;
    if (belegteLektionen.has(f.lektionSlug)) continue;
    belegteLektionen.add(f.lektionSlug);
    gewaehlt.push(f);
  }
  for (const f of pool) {
    if (gewaehlt.length >= anzahl) break;
    if (!gewaehlt.includes(f)) gewaehlt.push(f);
  }
  return gewaehlt.map((f) => f.id);
}

/** Fragen ohne Loesung — das, was der Browser zu sehen bekommt. */
export type FrageOhneLoesung = Omit<QuizFrage, 'correct' | 'explain'>;
export function fragenFuerClient(modul: StufeKey, ids: readonly string[]): FrageOhneLoesung[] {
  return ids
    .map((id) => frageById(modul, id))
    .filter((f): f is QuizFrage => Boolean(f))
    .map(({ id, q, options, lektionSlug }) => ({ id, q, options, lektionSlug }));
}

/**
 * Reine Bewertungsfunktion — laeuft auf dem Server (verbindlich). Bewertet
 * genau die per `ids` gezogenen Fragen in dieser Reihenfolge. Ungueltige
 * Eingaben (unbekannte id, Index ausserhalb der Optionen) werden als falsch
 * gewertet, nicht als Fehler geworfen.
 *
 * Bestehensgrenze haengt von der Anzahl ab (80 %): 10 Fragen → 8, 5 → 4.
 */
export function bewerte(modul: StufeKey, ids: readonly string[], antworten: readonly number[]): Bewertung {
  const ergebnisse = ids.map((id, i) => {
    const f = frageById(modul, id);
    const a = antworten[i];
    const richtig = Boolean(f) && Number.isInteger(a) && a === f!.correct;
    return { id, richtig, explain: f?.explain ?? '', lektionSlug: f?.lektionSlug ?? '' };
  });
  const score = ergebnisse.filter((e) => e.richtig).length;
  const gesamt = ids.length;
  const grenze = bestehensgrenze(gesamt);
  return { score, gesamt, grenze, bestanden: gesamt > 0 && score >= grenze, ergebnisse };
}
