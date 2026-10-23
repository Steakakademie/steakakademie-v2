import type { Ast, Einsatzform, FormInfo, Mutterrezept } from './typen';

/**
 * Mutterrezept Chimichurri (23.10.2026, C4).
 *
 * Grundrezept: argentinisches Chimichurri verde, von Hand gehackt, nicht püriert.
 * Mengenverhältnis aus zwei unabhängigen Quellen abgeleitet (Öl zu Essig zwischen
 * 2:1 und 4:1 — natashaskitchen.com, clovegarden.com; hier 3:1). Der Konsistenz-
 * Regler ist das Öl: wenig Öl gibt eine streichfeste Paste, viel Öl eine Marinade.
 *
 * Einsatzideen per Web-Recherche (23.10.2026): jede Idee mit abgerufener Quelle,
 * Rezepttexte nicht übernommen. `ableitung: true` heißt: Das Original nutzt ein
 * anderes Kraut, einen anderen Essig, Butter statt Öl oder ein anderes Grillgut —
 * die Übertragung auf dieses Grundrezept stammt von der Steakakademie.
 *
 * Grammangaben der Abwandlungen und des Reglers sind Richtwerte und NICHT
 * probegekocht (wie bei der Cashewcreme; Uwe hat bis zum Launch keine Zeit zum
 * Probekochen). Die Seite sagt das ausdrücklich.
 *
 * Fachliche Leitplanken (belegt, Recherche 23.10.2026):
 * - Von Hand hacken: Mörser oder Messer sind die traditionellen Wege, eine
 *   Küchenmaschine macht Brei (laylita.com, clovegarden.com).
 * - Das Öl wird im Kühlschrank fest → vor dem Servieren temperieren und rühren
 *   (natashaskitchen.com). Haltbarkeit der Quellen 2 Tage bis 3 Wochen → konservativ
 *   drei Tage. Einfrieren in Portionen ist üblich (natashaskitchen.com, laylita.com).
 * - „Chimichurri rojo“ mit gerösteter Paprika und Räucherpaprika ist in US-Quellen
 *   belegt (foreignfork.com), als argentinische Tradition NICHT — deshalb heißt es
 *   hier nur „rote Variante“.
 */

const FORMEN: Partial<Record<Einsatzform, FormInfo>> = {
  aufstrich: { label: 'Aufstrich', kuerzel: 'A', reglerGramm: 60, ergebnis: 'streichfest, fast eine Paste' },
  klecks: { label: 'Klecks', kuerzel: 'K', reglerGramm: 100, ergebnis: 'bleibt auf dem Fleisch liegen' },
  dip: { label: 'Dip', kuerzel: 'D', reglerGramm: 120, ergebnis: 'löffelbar, Brot nimmt es mit' },
  spiegel: { label: 'Spiegel', kuerzel: 'S', reglerGramm: 140, ergebnis: 'läuft langsam, grüner Spiegel unter dem Fleisch' },
  dressing: { label: 'Dressing', kuerzel: 'Dr', reglerGramm: 160, ergebnis: 'gießfähig; Essig auf 55 g anheben' },
  marinade: { label: 'Marinade', kuerzel: 'M', reglerGramm: 180, ergebnis: 'benetzt das Fleisch rundum' },
  warm: { label: 'Warme Sauce', kuerzel: 'W', reglerGramm: 120, ergebnis: 'Öl mit Knoblauch und Chili lauwarm, Kräuter und Essig erst zum Schluss' },
};

const AESTE: Ast[] = [
  { id: 'rind', kurz: 'Rind', name: 'Rind' },
  { id: 'lamm', kurz: 'Lamm', name: 'Lamm' },
  { id: 'schwein', kurz: 'Schwein', name: 'Schwein' },
  { id: 'gefluegel', kurz: 'Geflügel', name: 'Geflügel' },
  { id: 'fisch', kurz: 'Fisch', name: 'Fisch' },
  { id: 'meer', kurz: 'Meeresfrüchte', name: 'Meeresfrüchte' },
  { id: 'gemuese', kurz: 'Gemüse', name: 'Gemüse' },
  { id: 'beilagen', kurz: 'Beilagen', name: 'Beilagen & Brot' },
];

const KORIANDER = 'Petersilie zur Hälfte durch 30 g Koriander ersetzen';
const MINZE = '+ 20 g Minze, + 8 g Schalotte, Essig auf 25 g senken und 15 g Limettensaft dazu';
const BUTTER = 'Öl durch 120 g Butter ersetzen: schmelzen, Knoblauch und Chili eine Minute darin ziehen lassen, Kräuter und Essig erst vom Feuer einrühren';

const q = (name: string, url: string) => ({ name, url });

export const CHIMICHURRI: Mutterrezept = {
  slug: 'chimichurri',
  titel: 'Chimichurri',
  zentrum: 'Chimi­churri',
  beschreibung:
    'Die grüne Kräutersauce der argentinischen Parrilla als Mutterrezept: Petersilie, Oregano, Knoblauch, Chili, Rotweinessig und Öl, von Hand gehackt — mit Einsätzen als Klecks, Dip, Spiegel, Dressing, Aufstrich, Marinade und warme Butter für Rind, Lamm, Schwein, Geflügel, Fisch, Gemüse und Brot vom Grill.',
  einleitung:
    'Roh, grün, säuerlich, mit Biss: Chimichurri ist keine Sauce zum Kochen, sondern zum Hacken. Wie bei den Muttersaucen der klassischen Küche steht ein Grundrezept in der Mitte — und über die Ölmenge wird daraus Aufstrich, Klecks, Dip, Dressing oder Marinade. Die Einsatzideen stammen von der Parrilla und aus Küchen rund um die Welt — jede mit Quelle.',
  rubrik: 'Saucen & Rubs',
  keywords: 'Chimichurri, Chimichurri Rezept, argentinische Kräutersauce, Sauce zum Steak, Grillsauce, Parrilla',
  ableitungHinweis:
    'Wo das Original ein anderes Kraut, einen anderen Essig, Butter statt Öl oder ein anderes Grillgut nutzt und wir es auf das Grundrezept übertragen, steht „Eigene Ableitung“.',
  autorSlug: 'jonas',
  veroeffentlicht: '2026-10-23',
  // Ein KI-Bild je Mutterrezept (Uwe, 22.10.2026): Nano Banana Pro via fal.ai, Text-zu-Bild,
  // zulässig, weil kein Fleisch im Motiv. Provenienz in public/images/mutterrezepte/CREDITS.md.
  bild: {
    src: '/images/mutterrezepte/chimichurri.jpg',
    alt: 'Dunkle Steingutschale mit grob gehacktem grünem Chimichurri in Olivenöl, ein Holzlöffel darin; daneben ein Bund glatte Petersilie, eine halbierte Knoblauchknolle und eine kleine Flasche Rotweinessig auf einem Holzbrett',
    ki: true,
    quelle: 'KI-generiert (Nano Banana Pro via fal.ai), 23.10.2026',
  },
  ergibt: 'ca. 250 g, sechs Portionen als Klecks',
  zeit: '15 Min. aktiv, plus 1 Std. Ziehen (empfohlen)',
  zutatenGramm: [
    { name: 'Glatte Petersilie, nur Blätter und zarte Stiele', gramm: 60, hinweis: 'ein großer Bund' },
    { name: 'Olivenöl, mild', gramm: 120, hinweis: 'das ist die Klecks-Menge; andere Einsätze siehe Regler' },
    { name: 'Rotweinessig', gramm: 40 },
    { name: 'Knoblauch', gramm: 12, hinweis: 'drei Zehen, sehr fein gehackt' },
    { name: 'Oregano, getrocknet', gramm: 3, hinweis: 'oder 8 g frisch' },
    { name: 'Chiliflocken', gramm: 2, hinweis: 'in Argentinien Ají molido' },
    { name: 'Salz, fein', gramm: 5 },
    { name: 'Schwarzer Pfeffer, frisch gemahlen', gramm: 1 },
  ],
  zutatenLoeffel: [
    { menge: '1 großer Bund', name: 'glatte Petersilie' },
    { menge: '8 EL', name: 'mildes Olivenöl' },
    { menge: '3 EL', name: 'Rotweinessig' },
    { menge: '3 Zehen', name: 'Knoblauch' },
    { menge: '1 EL', name: 'getrockneter Oregano' },
    { menge: '1 TL', name: 'Chiliflocken' },
    { menge: '1 TL', name: 'feines Salz' },
    { menge: '½ TL', name: 'schwarzer Pfeffer' },
  ],
  schritte: [
    {
      titel: 'Hacken, nicht pürieren',
      text: 'Petersilie waschen, trocken schleudern und mit dem Messer fein hacken. Knoblauch sehr fein würfeln. Ein Mixer macht Brei und zieht Bitterstoffe aus den Stielen — das Messer lässt die Blätter ganz.',
    },
    {
      titel: 'Trocken würzen',
      text: 'Petersilie, Knoblauch, Oregano, Chiliflocken, Salz und Pfeffer in einer Schüssel mischen.',
    },
    {
      titel: 'Essig zuerst',
      text: 'Rotweinessig unterrühren und zwei Minuten stehen lassen. Die Säure zieht in die Kräuter, bevor das Öl sie umhüllt.',
    },
    {
      titel: 'Öl einrühren',
      text: 'Olivenöl zugeben und nur so lange rühren, bis alles benetzt ist. Für Aufstrich, Dip, Dressing oder Marinade die Ölmenge aus dem Konsistenz-Regler nehmen.',
    },
    {
      titel: 'Ziehen lassen',
      text: 'Mindestens eine Stunde abgedeckt bei Raumtemperatur ziehen lassen, dann Salz und Säure prüfen. Erst jetzt nachwürzen.',
    },
  ],
  profiTipp:
    'Chimichurri schmeckt am Tag danach besser als frisch — ansetzen, über Nacht in den Kühlschrank, eine halbe Stunde vor dem Grillen herausnehmen und umrühren, sonst ist das Öl fest.',
  lagerung:
    'Abgedeckt im Kühlschrank innerhalb von drei Tagen verbrauchen. Das Öl wird kalt fest: vor dem Servieren temperieren und umrühren. In Portionen eingefroren (Eiswürfelform) hält es sich etwa drei Monate, verliert aber an Frische.',
  allergene: 'Enthält keine der 14 kennzeichnungspflichtigen Allergene. Abwandlungen mit Butter, Joghurt oder Kapern bitte am Blatt beachten.',
  regler: { basis: '60 g Petersilie mit Würzung', name: 'Öl', grundmenge: 'ca. 250 g' },
  formen: FORMEN,
  aeste: AESTE,
  blaetter: [
    // ── Rind ──
    { id: 'r1', ast: 'rind', name: 'Entraña von der Parrilla', form: 'klecks', typ: 'rezept', land: 'Argentinien', warum: 'Die klassische Kombination: grüne Säure und Knoblauch gegen die Röstkruste des dünnen, kräftigen Stücks.', abwandlung: 'Grundrezept, keine Abwandlung.', rezeptSlug: 'entrana-asado-argentino', herkunft: 'Klassische Kombination der argentinischen Parrilla, Ausgangspunkt dieses Mutterrezepts.' },
    { id: 'r2', ast: 'rind', name: 'Picanha vom Spieß mit schnellem Chimichurri', form: 'spiegel', typ: 'rezept', land: 'Brasilien', warum: 'Fettkappe und Salzkruste brauchen Säure — der Spiegel unter den Scheiben nimmt den Saft auf.', abwandlung: 'Knoblauch auf 6 g senken, + 20 g Frühlingszwiebel fein geschnitten, + 2 g Zucker; nur eine Stunde ziehen lassen', rezeptSlug: 'picanha-churrasco', quelle: q('sbs.com.au', 'https://www.sbs.com.au/food/the-cook-up-with-adam-liaw/recipe/rump-cap-with-quick-chimichurri-and-salardaise-potatoes/1472mnf24'), frei: true },
    { id: 'r3', ast: 'rind', name: 'Asado de Tira, mit Chimichurri bestrichen', form: 'klecks', typ: 'rezept', land: 'Argentinien', warum: 'Beim Asado wird die Sauce direkt auf das heiße Fleisch gestrichen — Rippen mit viel Fett vertragen die kräftigere, dunklere Variante.', abwandlung: 'Rotweinessig durch 25 g Balsamico und 15 g Weinessig ersetzen, + 3 g geräuchertes Paprikapulver, + 1 g Chilipulver', rezeptSlug: 'asado-de-tira', quelle: q('sbs.com.au', 'https://www.sbs.com.au/food/recipes/asado-and-chimichurri') },
    { id: 'r4', ast: 'rind', name: 'Tri-Tip mit Chimichurri', form: 'klecks', typ: 'rezept', land: 'USA', warum: 'Reverse Sear gibt eine dünne Kruste und viel rosa Fleisch — die Säure hält das große Stück frisch.', abwandlung: 'Grob im Mixer gehackt statt mit dem Messer, Öl auf 110 g, Essig auf 30 g', rezeptSlug: 'tri-tip-santa-maria', quelle: q('traeger.com', 'https://www.traeger.com/recipes/grilled-tri-tip-chimichurri-sauce') },
    { id: 'r5', ast: 'rind', name: 'Steak-Sandwich mit Chimichurri-Aufstrich', form: 'aufstrich', typ: 'pairing', land: 'USA', warum: 'Als streichfeste Schicht ersetzt Chimichurri Mayo und Senf im Sandwich und hält das Brot trotzdem trocken.', abwandlung: `${KORIANDER}; Öl auf 60 g; im Mixer fein püriert, damit es streichbar wird`, quelle: q('thewanderlustkitchen.com', 'https://thewanderlustkitchen.com/chimichurri-steak-sandwich/') },
    { id: 'r6', ast: 'rind', name: 'Porterhouse mit warmer Chimichurri-Butter', form: 'warm', typ: 'rezept', land: 'Australien', warum: 'Warme Butter mit Knoblauch und Chili legt sich über die Kruste, die Kräuter kommen erst vom Feuer dazu und bleiben grün.', abwandlung: BUTTER, rezeptSlug: 'porterhouse-grill', quelle: q('recipetineats.com', 'https://www.recipetineats.com/chimichurri-butter'), ableitung: true },
    // ── Lamm ──
    { id: 'l1', ast: 'lamm', name: 'Lammkoteletts mit Minz-Chimichurri', form: 'klecks', typ: 'rezept', land: 'USA', warum: 'Minze und Lamm sind ein altes Paar — hier mit Essig und Chili statt Zucker.', abwandlung: MINZE, rezeptSlug: 'lammkoteletts-mediterran', quelle: q('kitchen-concoctions.com', 'https://www.kitchen-concoctions.com/2015/05/grilled-lamb-shoulder-chops-with-min/') },
    { id: 'l2', ast: 'lamm', name: 'Lammkeule al asador, rundum bestrichen', form: 'marinade', typ: 'rezept', land: 'Argentinien und Uruguay', warum: 'Die Keule wird vor dem Garen mit Chimichurri vom Vortag eingerieben; die Säure zieht in das Fleisch, der Rest kommt frisch dazu.', abwandlung: 'Öl auf 180 g, Rotweinessig durch 30 g Sherryessig und 20 g Zitronensaft ersetzen, + 4 g süßes Räucherpaprika', rezeptSlug: 'aussie-lamb-leg-butterflied', quelle: q('greatbritishchefs.com', 'https://greatbritishchefs.com/recipes/lamb-al-asador-recipe'), ableitung: true },
    { id: 'l3', ast: 'lamm', name: 'Lammkoteletts vom Braai, beim Garen begossen', form: 'klecks', typ: 'rezept', land: 'USA und Südafrika', warum: 'Chimichurri schon beim Garen auf die Koteletts löffeln — das Öl brät die Kräuter kurz an, der Rest kommt roh obenauf.', abwandlung: 'Chiliflocken durch 10 g frische rote Chili ersetzen, Oregano weglassen, Essig durch 30 g Zitronensaft ersetzen', rezeptSlug: 'lamb-chops-braai-sa', quelle: q('divinelydelish.com', 'https://divinelydelish.com/2020/07/19/lamb-loin-chops-with-chimichurri/'), ableitung: true },
    // ── Schwein ──
    { id: 's1', ast: 'schwein', name: 'Choripán mit Chimichurri', form: 'aufstrich', typ: 'rezept', land: 'Argentinien', warum: 'Die Wurst ist fett und salzig, das Brot trocken — Chimichurri ist die Brücke und gehört auf beide Hälften.', abwandlung: `${KORIANDER}; Essig auf 15 g senken, Öl auf 100 g`, rezeptSlug: 'chorizo-argentino-choripan', quelle: q('millcityfarmersmarket.org', 'https://www.millcityfarmersmarket.org/recipes/choripan-argentinian-sausage-sandwiches-chimichurri/'), frei: true },
    { id: 's2', ast: 'schwein', name: 'Schweinekotelett mit mildem Chimichurri', form: 'klecks', typ: 'pairing', land: 'USA', warum: 'Mageres Schwein verträgt weniger Öl und mehr Wasser — das Chimichurri wird leichter und schärfer.', abwandlung: `${KORIANDER}; Öl auf 45 g, + 40 g Wasser, + 15 g weiße Zwiebel fein gewürfelt`, quelle: q('nimanranch.com', 'https://nimanranch.com/recipes/grilled-pork-chops-with-chimichurri/') },
    { id: 's3', ast: 'schwein', name: 'Schweinefilet in Chimichurri mariniert', form: 'marinade', typ: 'pairing', land: 'USA', warum: 'Drei bis sechs Stunden in der Sauce, die Hälfte zurückbehalten und über das aufgeschnittene Filet geben.', abwandlung: 'Öl auf 180 g, Rotweinessig durch 40 g Weißweinessig ersetzen, + 40 g Schalotte fein gewürfelt', quelle: q('foodyschmoodyblog.com', 'https://foodyschmoodyblog.com/wprm_print/chimichurri-pork-tenderloin') },
    { id: 's4', ast: 'schwein', name: 'Iberico Secreto mit roter Variante', form: 'klecks', typ: 'rezept', land: 'Spanien und USA', warum: 'Das marmorierte Secreto mag Rauch und Süße — die rote Variante mit gerösteter Paprika und Räucherpaprika liefert beides.', abwandlung: '+ 80 g geröstete rote Paprika fein gehackt, + 4 g geräuchertes Paprikapulver, Petersilie auf 30 g senken, Öl auf 100 g', rezeptSlug: 'iberico-secreto', quelle: q('foreignfork.com', 'https://foreignfork.com/red-chimichurri/'), ableitung: true },
    // ── Geflügel ──
    { id: 'h1', ast: 'gefluegel', name: 'Spatchcock-Hähnchen mit Hühnerfett-Chimichurri', form: 'warm', typ: 'rezept', land: 'USA', warum: 'Das ausgelassene Fett des Hähnchens ersetzt einen Teil des Öls — die Sauce schmeckt nach dem Vogel selbst.', abwandlung: 'Öl auf 60 g, + 60 g ausgelassenes Hühnerfett warm eingerührt, + 15 g Minze, Essig auf 30 g', rezeptSlug: 'spatchcock-haehnchen', quelle: q('americastestkitchen.com', 'https://www.americastestkitchen.com/recipes/15360-spatchcocked-chicken-with-chicken-fat-chimichurri-and-tangy-aioli') },
    { id: 'h2', ast: 'gefluegel', name: 'Hähnchen: halb Marinade, halb Topping', form: 'klecks', typ: 'pairing', land: 'USA', warum: 'Eine Portion Chimichurri, zwei Aufgaben: eine Viertelstunde als Marinade, der Rest roh über das gegrillte Fleisch.', abwandlung: 'Grundrezept; die Hälfte vor dem Grillen auf das Hähnchen, die andere Hälfte danach', quelle: q('natashaskitchen.com', 'https://natashaskitchen.com/chimichurri-chicken-recipe/') },
    { id: 'h3', ast: 'gefluegel', name: 'Hähnchenspieße in Chimichurri-Öl', form: 'marinade', typ: 'pairing', land: 'USA', warum: 'Brustwürfel trocknen am Spieß schnell aus — die Ölmarinade schützt sie, die Säure hält sie zart.', abwandlung: `${KORIANDER}; Öl auf 180 g, + 30 g rote Zwiebel fein gewürfelt`, quelle: q('ediblesarasota.ediblecommunities.com', 'https://ediblesarasota.ediblecommunities.com/recipes/chimichurri-chicken-skewers') },
    // ── Fisch ──
    { id: 'f1', ast: 'fisch', name: 'Planken-Lachs, mit Chimichurri bestrichen', form: 'marinade', typ: 'rezept', land: 'USA', warum: 'Das Öl schützt den Lachs auf der Planke, die Säure schneidet das Fett — der Rest kommt roh obenauf.', abwandlung: `${KORIANDER}; Essig auf 50 g anheben, Chiliflocken auf 1 g`, rezeptSlug: 'cedar-plank-lachs', quelle: q('averiecooks.com', 'https://averiecooks.com/grilled-chimichurri-salmon'), ableitung: true },
    { id: 'f2', ast: 'fisch', name: 'Schwertfisch mit Rosinen-Chimichurri', form: 'klecks', typ: 'rezept', land: 'USA', warum: 'Süße Rosinen und Sherryessig gegen den festen, fast fleischigen Fisch — eine Steven-Raichlen-Idee.', abwandlung: '+ 40 g goldene Rosinen (eingeweicht, gehackt), Rotweinessig durch 40 g Sherryessig ersetzen, + 2 g Thymian, + 1 g Zitronenabrieb', rezeptSlug: 'schwertfisch-steak-grill', quelle: q('barbecuebible.com', 'https://barbecuebible.com/recipe/grilled-swordfish-steaks-with-golden-raisin-chimichurri/') },
    // ── Meeresfrüchte ──
    { id: 'm1', ast: 'meer', name: 'Riesengarnelen in Basilikum-Chimichurri', form: 'marinade', typ: 'rezept', land: 'USA, Louisiana', warum: 'Garnelen brauchen nur Minuten auf dem Rost — eine kurze Ölmarinade mit Basilikum und Limette reicht.', abwandlung: 'Petersilie durch 30 g Koriander und 30 g Basilikum ersetzen, + 1 g Kreuzkümmel, Essig durch 25 g Sherryessig und 15 g Limettensaft ersetzen, Öl auf 180 g', rezeptSlug: 'australische-riesengarnelen-barbie', quelle: q('louisianaseafood.com', 'https://www.louisianaseafood.com/recipe/basil-chimichurri-grilled-louisiana-shrimp-skewers'), ableitung: true },
    { id: 'm2', ast: 'meer', name: 'Garnelen mit Koriander-Chimichurri auf Reis', form: 'dressing', typ: 'pairing', land: 'USA', warum: 'Die Hälfte der Sauce kommt in den heißen Reis, die Garnelen obenauf, der Rest darüber — ein Gericht aus einer Sauce.', abwandlung: 'Petersilie durch 60 g Koriander ersetzen, Oregano weglassen, + 15 g rote Jalapeño, Öl auf 160 g', quelle: q('usarice.com', 'https://www.usarice.com/thinkrice/recipes/cilantro-chimichurri-shrimp-and-rice') },
    { id: 'm3', ast: 'meer', name: 'Jakobsmuscheln mit Zitronen-Kräuter-Chimichurri', form: 'klecks', typ: 'rezept', land: 'USA', warum: 'Ohne Knoblauch und Essig, dafür Zitrone, Schnittlauch und Kapern — mild genug für die süße Muschel.', abwandlung: 'Knoblauch und Essig weglassen, + 15 g Schnittlauch, + 15 g Kapern gehackt, + 30 g Zitronensaft, Öl auf 100 g', rezeptSlug: 'hotate-robatayaki', quelle: q('mosthungry.com', 'https://mosthungry.com/grilled-scallops'), ableitung: true },
    // ── Gemüse ──
    { id: 'g1', ast: 'gemuese', name: 'Gemüsespieße mit Chimichurri', form: 'klecks', typ: 'rezept', land: 'Argentinien', warum: 'Röstaromen von Paprika, Zucchini und Zwiebel, dazu rohe Säure — das Rezept dazu steht schon auf der Seite.', abwandlung: 'Grundrezept, keine Abwandlung.', rezeptSlug: 'gemuese-spiesse-grill', herkunft: 'Rezept der Steakakademie, Chimichurri nach dem Grundrezept.', frei: true },
    { id: 'g2', ast: 'gemuese', name: 'Blumenkohl-Steaks mit Chimichurri', form: 'klecks', typ: 'pairing', land: 'Südafrika', warum: 'Dicke Blumenkohlscheiben nehmen Röstaromen an wie Fleisch — und brauchen genauso Säure.', abwandlung: 'Chiliflocken durch 10 g frische rote Chili ersetzen, Oregano auf 6 g verdoppeln, Essig auf 50 g', quelle: q('simply-delicious-food.com', 'https://simply-delicious-food.com/grilled-cauliflower-with-chimichurri/') },
    { id: 'g3', ast: 'gemuese', name: 'Maiskolben in Folie, mit Chimichurri bestrichen', form: 'marinade', typ: 'rezept', land: 'USA', warum: 'Vor dem Grillen bestrichen, in Folie gegart, danach noch einmal bestrichen — der Mais dünstet im Kräuteröl.', abwandlung: 'Rotweinessig durch 40 g Apfelessig ersetzen, Oregano auf 6 g, Öl auf 180 g', rezeptSlug: 'maiskolben-elote', quelle: q('thehealthymaven.com', 'https://www.thehealthymaven.com/chimichurri-grilled-corn/'), ableitung: true },
    { id: 'g4', ast: 'gemuese', name: 'Portobello-Pilze in Chimichurri mariniert', form: 'marinade', typ: 'pairing', land: 'USA', warum: 'Pilze saugen die Marinade auf wie ein Schwamm — nach 15 bis 30 Minuten sind sie durchgewürzt.', abwandlung: 'Petersilie durch 60 g Koriander ersetzen, Chiliflocken durch 10 g roten Serrano ersetzen, Öl auf 180 g', quelle: q('pinchofyum.com', 'https://pinchofyum.com/grilled-chimichurri-portobellos-with-goat-cheese-mashed-potatoes') },
    // ── Beilagen & Brot ──
    { id: 'b1', ast: 'beilagen', name: 'Provoleta mit Oliven-Chimichurri', form: 'dip', typ: 'rezept', land: 'Argentinien', warum: 'Der geschmolzene Käse ist fett und salzig — Oliven und Säure im Chimichurri schneiden durch.', abwandlung: '+ 50 g grüne Oliven fein gehackt, Oregano auf 6 g, Salz auf 2 g senken, + 30 g Wasser', rezeptSlug: 'provoleta-parrilla', quelle: q('splendidtable.org', 'https://www.splendidtable.org/story/2026/08/26/grilled-provolone-with-olive-chimichurri') },
    { id: 'b2', ast: 'beilagen', name: 'Kartoffelsalat mit Chimichurri', form: 'dressing', typ: 'rezept', land: 'USA', warum: 'Warme Kartoffelwürfel in die Sauce gehoben — kein Mayo, dafür Kräuter, Essig und Öl.', abwandlung: `${KORIANDER}; Essig auf 60 g, Öl auf 160 g`, rezeptSlug: 'kuerbis-kartoffel-salat-grill', quelle: q('americastestkitchen.com', 'https://www.americastestkitchen.com/recipes/17005-chimichurri-potato-salad'), ableitung: true },
    { id: 'b3', ast: 'beilagen', name: 'Grillbrot in Chimichurri-Butter', form: 'aufstrich', typ: 'rezept', land: 'USA', warum: 'Chimichurri in weiche Butter gerührt, auf angegrilltes Brot gestrichen — Knoblauchbrot von der Parrilla.', abwandlung: `${BUTTER}; Öl-Anteil ganz weglassen`, rezeptSlug: 'damper-brot-grill', quelle: q('twocloveskitchen.com', 'https://twocloveskitchen.com/chimichurri-butter/'), ableitung: true },
    { id: 'b4', ast: 'beilagen', name: 'Chimichurri-Joghurt-Dip', form: 'dip', typ: 'pairing', land: 'USA', warum: 'In griechischen Joghurt gefaltet wird aus der scharfen Sauce ein kühler Dip für Gemüse und Brot.', abwandlung: `${KORIANDER}; + 15 g Kapern gehackt; die fertige Sauce in 400 g griechischen Joghurt falten`, quelle: q('oceanmist.com', 'https://www.oceanmist.com/recipes/chimichurri-yogurt-dip/') },
    { id: 'b5', ast: 'beilagen', name: 'Romana-Herzen mit Chimichurri-Vinaigrette', form: 'dressing', typ: 'rezept', land: 'USA', warum: 'Als Vinaigrette gedacht: mehr Essig, etwas Kreuzkümmel, ein Hauch Schärfe über rauchig-bittere Blätter.', abwandlung: `${KORIANDER}; Essig auf 60 g, Öl auf 160 g, + 1 g Kreuzkümmel, + 5 g Sriracha`, rezeptSlug: 'romana-salatherzen-grill', quelle: q('news.northeastern.edu', 'https://news.northeastern.edu/2016/07/15/summer-recipes-chimichurri-vinaigrette'), ableitung: true },
  ],
};
