import type { Ast, Einsatzform, FormInfo, Mutterrezept } from './typen';

/**
 * Mutterrezept Limetten-Cashewcreme (21.10.2026).
 *
 * Grundrezept aus einem Kurzvideo von Uwe abgeleitet (nur Zutaten und Ablauf,
 * Text eigenständig). Einsatzideen per Web-Recherche: jede Idee mit Quelle,
 * Rezepttexte nicht übernommen. `ableitung: true` heißt: Das Original nutzt
 * gehackte oder ganze Cashews bzw. wurde neu kombiniert — die Übertragung auf
 * die Creme stammt von der Steakakademie.
 *
 * Grammangaben der Abwandlungen und der Konsistenz-Regler sind Richtwerte und
 * NICHT probegekocht (Uwe hat bis zum Launch keine Zeit zum Probekochen,
 * 18.09.2026). Die Seite sagt das ausdrücklich.
 *
 * Fachliche Leitplanken (belegt, Recherche 21.10.2026):
 * - Cashewcreme dickt beim Erhitzen an → warm dünner ansetzen, zum Schluss einrühren.
 * - Einfrieren trennt sie → nicht als Vorrat empfehlen.
 * - Haltbarkeitsangaben der Quellen widersprechen sich → konservativ drei Tage.
 * - Cashew ist ein häufiges, oft schweres Allergen → immer kennzeichnen.
 */

const FORMEN: Record<Einsatzform, FormInfo> = {
  dip: { label: 'Dip', kuerzel: 'D', wasserGramm: 80, ergebnis: 'hält am Gemüse, tropft nicht' },
  klecks: { label: 'Klecks', kuerzel: 'K', wasserGramm: 95, ergebnis: 'bleibt als Tupfer stehen' },
  spiegel: { label: 'Spiegel', kuerzel: 'S', wasserGramm: 110, ergebnis: 'läuft langsam, hält den Rand' },
  dressing: { label: 'Dressing', kuerzel: 'Dr', wasserGramm: 160, ergebnis: 'gießfähig' },
  aufstrich: { label: 'Aufstrich', kuerzel: 'A', wasserGramm: 60, ergebnis: 'streichfest' },
  marinade: { label: 'Marinade', kuerzel: 'M', wasserGramm: 120, ergebnis: 'haftet am Fleisch' },
  warm: { label: 'Warme Sauce', kuerzel: 'W', wasserGramm: 180, ergebnis: 'dickt beim Erhitzen nach — zum Schluss einrühren' },
};

const AESTE: Ast[] = [
  { id: 'gemuese', kurz: 'Gemüse', name: 'Gemüse' },
  { id: 'rind', kurz: 'Rind', name: 'Rind' },
  { id: 'lamm', kurz: 'Lamm', name: 'Lamm' },
  { id: 'schwein', kurz: 'Schwein', name: 'Schwein' },
  { id: 'gefluegel', kurz: 'Geflügel', name: 'Geflügel' },
  { id: 'fisch', kurz: 'Fisch', name: 'Fisch' },
  { id: 'meer', kurz: 'Meeresfrüchte', name: 'Meeresfrüchte' },
  { id: 'beilagen', kurz: 'Beilagen', name: 'Beilagen & Brot' },
  { id: 'suess', kurz: 'Obst & Süßes', name: 'Obst & Süßes' },
];

const CHIMI =
  '+ 10 g Petersilie, 2 g Oregano, 4 g Knoblauch, 1 g Chiliflocken; Limettensaft durch 12 g Rotweinessig ersetzen';
const SATAY = 'Wasser durch 110 g Kokosmilch ersetzen, + 10 g Fischsauce, 5 g Sojasauce, Salz weglassen';
const RANCH = '+ 3 g Dill, 4 g Schnittlauch, 1 g Oregano, 8 g Reisessig';

const q = (name: string, url: string) => ({ name, url });

export const LIMETTEN_CASHEWCREME: Mutterrezept = {
  slug: 'limetten-cashewcreme',
  titel: 'Limetten-Cashewcreme',
  zentrum: 'Cashew­creme',
  beschreibung:
    'Cremig wie Mayonnaise, frisch durch Limette, ohne Ei und ohne Milch: die Limetten-Cashewcreme als Mutterrezept — mit Einsätzen als Dip, Spiegel, Klecks, Dressing, Marinade und warme Sauce für Gemüse, Fleisch, Fisch und Beilagen vom Grill.',
  autorSlug: 'jonas',
  veroeffentlicht: '2026-10-21',
  ergibt: 'ca. 300 g, vier Portionen',
  zeit: '5 Min. aktiv, plus 15 Min. Einweichen (empfohlen)',
  zutatenGramm: [
    { name: 'Cashewkerne, ungesalzen', gramm: 150, hinweis: 'naturbelassen oder geröstet' },
    { name: 'Wasser, kalt', gramm: 110, hinweis: 'erst 90 g, dann nach Konsistenz' },
    { name: 'Limettensaft, frisch', gramm: 12 },
    { name: 'Mildes Olivenöl oder Rapsöl', gramm: 20 },
    { name: 'Salz, fein', gramm: 2.5 },
    { name: 'Schwarzer Pfeffer, frisch gemahlen', gramm: 0.5 },
  ],
  zutatenLoeffel: [
    { menge: '1 Becher (250 ml), gehäuft', name: 'Cashewkerne, ungesalzen' },
    { menge: '7 EL', name: 'Wasser, kalt' },
    { menge: '2½ TL', name: 'Limettensaft (etwa ¼ Limette)' },
    { menge: '1½ EL', name: 'mildes Olivenöl oder Rapsöl' },
    { menge: '½ TL', name: 'feines Salz' },
    { menge: '1 Prise', name: 'schwarzer Pfeffer' },
  ],
  schritte: [
    {
      titel: 'Einweichen',
      text: 'Cashews mit kochend heißem Wasser übergießen, eine Viertelstunde ziehen lassen, abgießen. Das Einweichwasser wird nicht weiterverwendet.',
    },
    {
      titel: 'Einfüllen',
      text: 'Cashews in ein hohes, schmales Gefäß geben. Gut drei Viertel des Wassers, Limettensaft, Öl, Salz und Pfeffer dazu.',
    },
    {
      titel: 'Pürieren',
      text: 'Stabmixer bis auf den Boden setzen und auf höchster Stufe pürieren, dabei langsam auf und ab ziehen, bis die Masse glatt ist.',
    },
    {
      titel: 'Konsistenz einstellen',
      text: 'Restliches Wasser schluckweise zugeben, bis die Creme vom Mixerfuß fällt wie Mayonnaise.',
    },
    {
      titel: 'Abschmecken',
      text: 'Salz und Säure prüfen und erst jetzt nachwürzen.',
    },
  ],
  profiTipp:
    'Ohne Einweichen und ohne Hochleistungsmixer bleibt die Creme leicht körnig. Heißes Wasser löst das Problem — oder du weichst die Kerne am Vorabend kalt ein.',
  lagerung:
    'Luftdicht im Kühlschrank aufbewahren und innerhalb von drei Tagen verbrauchen. Sie dickt nach: vor dem Servieren mit einem Schluck Wasser glattrühren. Zum Einfrieren eignet sie sich nicht — sie trennt sich und wird körnig.',
  allergene: 'Enthält Cashewkerne (Schalenfrüchte).',
  formen: FORMEN,
  aeste: AESTE,
  blaetter: [
    // ── Gemüse ──
    { id: 'g1', ast: 'gemuese', name: 'Tandoori-Blumenkohl vom Grill', form: 'klecks', typ: 'schmiede', land: 'Indien', warum: 'Der Ursprung dieser Creme: kühle, säuerliche Nuss gegen Tandoori-Schärfe und Röstaromen.', abwandlung: 'Grundrezept, keine Abwandlung.', schmiedeAuftrag: 'Tandoori-Blumenkohl vom Grill mit Limetten-Cashewcreme', herkunft: 'Ausgangsidee dieses Mutterrezepts, aus einem Kochvideo.' },
    { id: 'g2', ast: 'gemuese', name: 'Blumenkohlsteak auf Miso-Spiegel', form: 'spiegel', typ: 'schmiede', land: 'Japanisch inspiriert', warum: 'Salziges Umami unter Röstaromen, Granatapfelkerne obenauf bringen Frische.', abwandlung: '+ 15 g helles Miso, + 5 g Ahornsirup, Salz auf 1 g senken', schmiedeAuftrag: 'Blumenkohlsteak vom Grill auf Miso-Cashew-Spiegel', quelle: q('knuspr.de', 'https://www.knuspr.de/en-DE/chef/3062-blumenkohl-steak-miso-cashew-creme-granatapfel-gremolata') },
    { id: 'g3', ast: 'gemuese', name: 'Blumenkohlsteak mit Chipotle-Creme', form: 'klecks', typ: 'pairing', land: 'USA', warum: 'Rauchige Schärfe trifft angerösteten Blumenkohl, gehackte Kerne bringen Biss.', abwandlung: '+ 10 g Chipotle in Adobo, 15 g geröstete Cashews grob gehackt obenauf', quelle: q('177milkstreet.com', 'https://www.177milkstreet.com/recipes/chipotle-cashew-cauliflower-steaks'), ableitung: true },
    { id: 'g4', ast: 'gemuese', name: 'Elote — Mais vom Grill', form: 'klecks', typ: 'rezept', land: 'Mexiko', warum: 'Süßer, verkohlter Mais, säuerliche Creme, Chili obenauf.', abwandlung: '+ 2 g Ancho-Chili oder Tajín zum Bestreuen', rezeptSlug: 'maiskolben-elote', quelle: q('brokebankvegan.com', 'https://brokebankvegan.com/mexican-street-corn/'), frei: true },
    { id: 'g5', ast: 'gemuese', name: 'Romana-Herzen mit Cashew-Dressing', form: 'dressing', typ: 'rezept', land: 'USA', warum: 'Rauchig-bittere Blätter gegen kühles, säuerliches Dressing.', abwandlung: '+ 3 g Knoblauch, 6 g Koriander oder Petersilie', rezeptSlug: 'romana-salatherzen-grill', quelle: q('rainbowplantlife.com', 'https://rainbowplantlife.com/wprm_print/grilled-romaine-salad-with-creamy-cashew-dressing') },
    { id: 'g6', ast: 'gemuese', name: 'Grüner Spargel mit Cashew-Hollandaise', form: 'klecks', typ: 'rezept', land: 'USA', warum: 'Hollandaise-Optik und -Säure ohne Ei — hält auf dem heißen Spargel.', abwandlung: '+ 10 g Schalotte, 1 g Kurkuma, 1 g Zitronenabrieb', rezeptSlug: 'gruener-spargel-grill', quelle: q('hopetv.org', 'https://hopetv.org/shows/go-healthy-for-good/recipes/roasted-asparagus-with-cashew-hollandaise') },
    { id: 'g7', ast: 'gemuese', name: 'Aubergine vom Grill', form: 'klecks', typ: 'pairing', land: 'USA', warum: 'Weiches, rauchiges Fruchtfleisch, säuerliche Creme, Granatapfel als Frische.', abwandlung: '+ 3 g Knoblauch, Limettensaft durch 12 g Zitronensaft ersetzen', quelle: q('sophia.smith.edu', 'https://sophia.smith.edu/blog/sefardi-cook/2019/04/08/grilled-eggplant-with-cashew-crema/') },
    { id: 'g8', ast: 'gemuese', name: 'Gemüsespieße mit Röstknoblauch-Dip', form: 'dip', typ: 'rezept', land: 'Türkei', warum: 'Süßlicher Röstknoblauch passt zu allem, was vom Rost kommt.', abwandlung: '+ 20 g Röstknoblauch, Limettensaft durch 12 g Zitronensaft ersetzen', rezeptSlug: 'gemuese-spiesse-grill', quelle: q('yemek.com', 'https://yemek.com/tarif/sarimsakli-kaju-sos/') },
    { id: 'g9', ast: 'gemuese', name: 'Süßkartoffel aus der Glut', form: 'klecks', typ: 'pairing', land: 'USA', warum: 'Säure und Kräuter schneiden die Karamellsüße.', abwandlung: '+ 8 g Koriander, Limettensaft auf 18 g, nach Wunsch 10 g Jalapeño', quelle: q('thegardengrazer.com', 'https://www.thegardengrazer.com/wprm_print/5882') },
    { id: 'g10', ast: 'gemuese', name: 'Paneer-Tikka vom Spieß', form: 'warm', typ: 'schmiede', land: 'Indien', warum: 'Die Creme macht die Tomaten-Masala-Sauce rund und sämig.', abwandlung: 'Creme erst zum Schluss in die heiße Sauce rühren, nicht mehr kochen', schmiedeAuftrag: 'Paneer-Tikka vom Grillspieß mit Cashew-Masala-Sauce', quelle: q('indianhealthyrecipes.com', 'https://www.indianhealthyrecipes.com/paneer-tikka-masala-recipe/') },
    // ── Rind ──
    { id: 'r1', ast: 'rind', name: 'Entraña mit Cashew-Chimichurri', form: 'klecks', typ: 'rezept', land: 'Argentinisch inspiriert', warum: 'Grüne Säure gegen die Röstkruste, die Creme bindet das ölige Chimichurri.', abwandlung: CHIMI, rezeptSlug: 'entrana-asado-argentino', quelle: q('foodfaithfitness.com', 'https://www.foodfaithfitness.com/creamy-chimichurri-sauce') },
    { id: 'r2', ast: 'rind', name: 'Flank Steak, scharf mariniert', form: 'marinade', typ: 'rezept', land: 'USA, asiatisch inspiriert', warum: 'Ein Ansatz, zwei Einsätze: Die Hälfte mariniert, der Rest wird Dip.', abwandlung: '+ 15 g Sojasauce, 10 g Hoisin, 5 g Ingwer, 5 g Sriracha, Salz weglassen', rezeptSlug: 'flank-steak-grillen', quelle: q('kalejunkie.com', 'https://kalejunkie.com/steak-lettuce-wraps-with-spicy-cashew-sauce/') },
    { id: 'r3', ast: 'rind', name: 'Rind mit Ingwer-Chili und Cashewcreme', form: 'dip', typ: 'pairing', land: 'Südafrika', warum: 'Die milde Creme fängt scharf gewürztes Rind ab.', abwandlung: 'Wasser durch warme Gemüsebrühe ersetzen, Salz auf 1 g', quelle: q('taste.co.za', 'https://taste.co.za/recipes/steak-with-cashew-nut-cream/') },
    { id: 'r4', ast: 'rind', name: 'Rinder-Tacos mit Chipotle-Crema', form: 'klecks', typ: 'rezept', land: 'Mexiko', warum: 'Rauchige Schärfe auf milder Creme — der klassische Crema-Ersatz.', abwandlung: '+ 10 g Chipotle in Adobo, 1 g Knoblauchpulver', rezeptSlug: 'rinder-tacos-guenstiger-cut', quelle: q('alecooks.com', 'https://www.alecooks.com/cashew-chipotle-crema') },
    { id: 'r5', ast: 'rind', name: 'Adana Kebab mit Tandoori-Creme', form: 'dip', typ: 'rezept', land: 'Türkei', warum: 'Scharfes Hack vom Spieß, kühle Creme mit Tandoori-Würze.', abwandlung: '+ 4 g Tandoori-Masala, 6 g Koriander', rezeptSlug: 'adana-kebab', ableitung: true },
    // ── Lamm ──
    { id: 'l1', ast: 'lamm', name: 'Lammlachse auf Zitrus-Minz-Spiegel', form: 'spiegel', typ: 'rezept', land: 'USA', warum: 'Lamm und Minze als milder, säuerlicher Spiegel unter rosa Fleisch.', abwandlung: 'Limettensaft durch 15 g Orangensaft und 8 g Zitronensaft ersetzen, + 6 g Minze', rezeptSlug: 'lammkarree-grillen', quelle: q('marxfood.com', 'https://marxfood.com/?p=39877') },
    { id: 'l2', ast: 'lamm', name: 'Lammkoteletts mit Cashew-Chimichurri', form: 'klecks', typ: 'rezept', land: 'Kanada', warum: 'Nussiger Biss und grüne Säure gegen kräftiges Lammfett.', abwandlung: `${CHIMI}; + 15 g gehackte Cashews`, rezeptSlug: 'lammkoteletts-mediterran', quelle: q('lcbo.com', 'https://www.lcbo.com/en/recipe/grilled-lamb-chops-tomatoes-with-cashew-chimichurri/F202003020'), ableitung: true },
    { id: 'l3', ast: 'lamm', name: 'Lammkarree mit Wasabi-Dill-Creme', form: 'klecks', typ: 'pairing', land: 'Schweiz', warum: 'Wasabi-Schärfe gegen nussige Süße — ungewöhnlich und stimmig.', abwandlung: '+ 4 g Wasabipaste, 3 g Dill, 1 g Zitronenabrieb', quelle: q('fooby.ch', 'https://fooby.ch/en/recipes/amp.id-26324.html'), ableitung: true },
    { id: 'l4', ast: 'lamm', name: 'Lamm-Cashew-Curry aus dem Dutch Oven', form: 'warm', typ: 'schmiede', land: 'Neuseeland', warum: 'Nussige Bindung rundet die Schmorsauce ab.', abwandlung: 'Creme in die Gewürzpaste mixen, 20 g gehackte Cashews obenauf', schmiedeAuftrag: 'Lamm-Curry aus dem Dutch Oven mit Cashewcreme', quelle: q('dish.co.nz', 'https://www.dish.co.nz/recipes/slow-cooked-lamb-and-cashew-curry') },
    // ── Schwein ──
    { id: 's1', ast: 'schwein', name: 'Bánh mì mit Cashew-Aufstrich', form: 'aufstrich', typ: 'rezept', land: 'Vietnam', warum: 'Die nussige Schicht übernimmt die Rolle der Leberpastete unter gegrilltem Schwein.', abwandlung: 'Wasser auf 60 g senken, + 5 g Sojasauce', rezeptSlug: 'thit-nuong-vietnam', quelle: q('sungetawaystravel.com', 'https://sungetawaystravel.com/cashews-in-vietnamese-cuisine/') },
    { id: 's2', ast: 'schwein', name: 'Pulled Pork mit Cashew-Coleslaw', form: 'dressing', typ: 'rezept', land: 'USA', warum: 'Cremiger Krautsalat ist die Standardbeilage — hier ohne Ei.', abwandlung: '+ 8 g mittelscharfer Senf, 10 g Apfelessig', rezeptSlug: 'pulled-pork-boston-butt', quelle: q('kathysvegankitchen.com', 'https://www.kathysvegankitchen.com/wprm_print/bbq-coleslaw') },
    { id: 's3', ast: 'schwein', name: 'Schweinekotelett mit Cashew-Chimichurri', form: 'klecks', typ: 'pairing', land: 'USA', warum: 'Kräutersäure hebt mildes Schweinefleisch.', abwandlung: CHIMI, quelle: q('foodfaithfitness.com', 'https://www.foodfaithfitness.com/creamy-chimichurri-sauce') },
    { id: 's4', ast: 'schwein', name: 'Moo Ping mit Cashew-Satay', form: 'dip', typ: 'rezept', land: 'Thailand', warum: 'Süß-salzige Spieße, milder Satay-Dip aus Cashew statt Erdnuss.', abwandlung: SATAY, rezeptSlug: 'moo-ping', quelle: q('foodnetwork.com', 'https://www.foodnetwork.com/recipes/chicken-satay-with-cashew-sauce-and-mango-salad-12342931'), ableitung: true },
    // ── Geflügel ──
    { id: 'h1', ast: 'gefluegel', name: 'Hähnchen-Satay mit Cashew-Dip', form: 'dip', typ: 'rezept', land: 'Singapur', warum: 'Cashew statt Erdnuss: ein milder, runder Dip zu Grillspießen.', abwandlung: SATAY, rezeptSlug: 'singapore-satay', quelle: q('foodnetwork.com', 'https://www.foodnetwork.com/recipes/chicken-satay-with-cashew-sauce-and-mango-salad-12342931'), frei: true },
    { id: 'h2', ast: 'gefluegel', name: 'Murgh Malai Tikka', form: 'marinade', typ: 'schmiede', land: 'Indien', warum: 'Die Cashewpaste macht die Marinade sämig und hält das Hähnchen am Grill saftig.', abwandlung: '+ 6 g Ingwer-Knoblauch-Paste, 0,5 g Kardamom, 1 g Kasuri Methi', schmiedeAuftrag: 'Murgh Malai Tikka vom Grill mit Cashew-Marinade', quelle: q('ranveerbrar.com', 'https://ranveerbrar.com/recipes/murgh-malai-tikka/') },
    { id: 'h3', ast: 'gefluegel', name: 'Xinxim de galinha', form: 'warm', typ: 'schmiede', land: 'Brasilien', warum: 'Nussige Bindung und Meeres-Umami zu Hähnchen.', abwandlung: 'Wasser durch 110 g Kokosmilch ersetzen, + 10 g getrocknete Garnelen, 8 g Koriander', schmiedeAuftrag: 'Xinxim de galinha: Grillhähnchen in Cashew-Kokos-Sauce', quelle: q('sbs.com.au', 'https://www.sbs.com.au/food/recipe/xinxim-de-galinha/5ucbq7204') },
    { id: 'h4', ast: 'gefluegel', name: 'Spatchcock-Hähnchen mit Cashew-Ranch', form: 'dressing', typ: 'rezept', land: 'USA', warum: 'Milchfreies Ranch bindet Hähnchen und Grillgemüse.', abwandlung: RANCH, rezeptSlug: 'spatchcock-haehnchen', quelle: q('godairyfree.org', 'https://www.godairyfree.org/easyrecipe-print/216945-0/') },
    { id: 'h5', ast: 'gefluegel', name: 'Chicken Wings mit Ranch-Dip', form: 'dip', typ: 'rezept', land: 'USA', warum: 'Kühler Dip gegen scharfe, krosse Wings.', abwandlung: `${RANCH}; Wasser auf 80 g`, rezeptSlug: 'chicken-wings-bier-injection', quelle: q('godairyfree.org', 'https://www.godairyfree.org/easyrecipe-print/216945-0/'), ableitung: true },
    { id: 'h6', ast: 'gefluegel', name: 'Hähnchen mit Nussdressing', form: 'dressing', typ: 'pairing', land: 'Japan', warum: 'Cremige Nussnote über Hähnchen ist in Japan eine eingeführte Kombination.', abwandlung: '+ 5 g helle Sojasauce, 3 g geröstetes Sesamöl', quelle: q('macaro-ni.jp', 'https://macaro-ni.jp/71397') },
    // ── Fisch ──
    { id: 'f1', ast: 'fisch', name: 'Fisch-Tacos mit Orangen-Creme', form: 'klecks', typ: 'rezept', land: 'USA', warum: 'Fruchtige Säure fängt mageren, rauchigen Fisch ab.', abwandlung: 'Limettensaft durch 25 g Orangensaft ersetzen, + 3 g Knoblauch', rezeptSlug: 'mahi-mahi-grill', quelle: q('heatherchristo.com', 'https://heatherchristo.com/2016/05/03/citrusy-grilled-fish-tacos-with-citrus-slaw-and-orange-cashew-sauce/') },
    { id: 'f2', ast: 'fisch', name: 'Planken-Lachs mit Cashew-Chimichurri', form: 'klecks', typ: 'rezept', land: 'USA', warum: 'Kräutersäure schneidet das Lachsfett.', abwandlung: `${CHIMI}; Essig auf 8 g senken`, rezeptSlug: 'cedar-plank-lachs', quelle: q('foodfaithfitness.com', 'https://www.foodfaithfitness.com/creamy-chimichurri-sauce') },
    { id: 'f3', ast: 'fisch', name: 'Kabeljau mit Kokos-Limetten-Topping', form: 'klecks', typ: 'pairing', land: 'USA', warum: 'Kokos und Limette tragen weißen Fisch, ohne ihn zu überdecken.', abwandlung: 'Die Hälfte des Wassers durch Kokosmilch ersetzen, + 1 g Limettenabrieb, 15 g gehackte Cashews', quelle: q('foodnetwork.com', 'https://www.foodnetwork.com/recipes/valerie-bertinelli/roasted-cod-with-cashew-coconut-lime-topping-8640170.amp'), ableitung: true },
    // ── Meeresfrüchte ──
    { id: 'm1', ast: 'meer', name: 'Riesengarnelen mit Cashew-Satay', form: 'dip', typ: 'rezept', land: 'Australien', warum: 'Süß-nussiger Dip zu rauchig-salzigen Garnelen.', abwandlung: SATAY, rezeptSlug: 'australische-riesengarnelen-barbie', quelle: q('gourmettraveller.com.au', 'https://www.gourmettraveller.com.au/recipe/chefs-recipes/prawn-satay-8201/') },
    { id: 'm2', ast: 'meer', name: 'Jakobsmuscheln auf Kokos-Cashew-Spiegel', form: 'spiegel', typ: 'rezept', land: 'Thailand', warum: 'Süße Muschel auf nussig-salzigem Umami-Spiegel.', abwandlung: 'Wasser durch 110 g Kokosmilch ersetzen, + 5 g Fischsauce, Salz weglassen', rezeptSlug: 'hotate-robatayaki', quelle: q('tastelife.tv', 'https://www.tastelife.tv/recipe/scallop-cashew-nut-sauce-jerusalem-artichoke-avocado-mousse_13923.html') },
    { id: 'm3', ast: 'meer', name: 'Vatapá', form: 'warm', typ: 'schmiede', land: 'Brasilien', warum: 'Cashew gibt der Kokos-Garnelen-Creme Körper.', abwandlung: '+ 20 g Erdnüsse, 15 g getrocknete Garnelen, 10 g Dendê-Öl, Wasser durch Kokosmilch ersetzen', schmiedeAuftrag: 'Vatapá mit gegrillten Garnelen und Cashewcreme', quelle: q('saveur.com', 'https://www.saveur.com/article/Recipes/Classic-Brazilian-Shrimp-Stew') },
    { id: 'm4', ast: 'meer', name: 'Garnelen-Tacos mit Jalapeño-Creme', form: 'klecks', typ: 'pairing', land: 'USA', warum: 'Grüne Schärfe und Säure zu süßen Garnelen.', abwandlung: '+ 15 g Jalapeño, 6 g Koriander', quelle: q('hummusapien.com', 'https://www.hummusapien.com/shrimp-tacos/') },
    { id: 'm5', ast: 'meer', name: 'Garnelen-Kokos-Curry', form: 'warm', typ: 'schmiede', land: 'Singapur', warum: 'Tamarinde und Creme balancieren süße Garnelen.', abwandlung: '+ 10 g Tamarindenpaste, Wasser durch Kokosmilch ersetzen', schmiedeAuftrag: 'Garnelen-Kokos-Curry mit gegrillten Garnelen und Cashewcreme', quelle: q('womensweekly.com.sg', 'https://www.womensweekly.com.sg/food/prawn-coconut-cashew-curry'), ableitung: true },
    // ── Beilagen & Brot ──
    { id: 'b1', ast: 'beilagen', name: 'Kartoffelsalat mit Senf-Cashew-Dressing', form: 'dressing', typ: 'rezept', land: 'Kanada', warum: 'Ei- und milchfreier Ersatz für den Mayo-Kartoffelsalat.', abwandlung: '+ 8 g Senf, 10 g Apfelessig, 3 g Dill', rezeptSlug: 'kuerbis-kartoffel-salat-grill', quelle: q('ayoubs.ca', 'https://ayoubs.ca/blogs/news/potato-salad-with-creamy-cashew-dressing') },
    { id: 'b2', ast: 'beilagen', name: 'Texas Coleslaw, cremig', form: 'dressing', typ: 'rezept', land: 'USA', warum: 'Cashew-Mayo statt Mayo — gleiche Rolle, kein Ei.', abwandlung: 'Wasser auf 120 g, + 10 g Apfelessig', rezeptSlug: 'texas-coleslaw', quelle: q('kathysvegankitchen.com', 'https://www.kathysvegankitchen.com/wprm_print/bbq-coleslaw') },
    { id: 'b3', ast: 'beilagen', name: 'Drillinge à la Huancaína', form: 'warm', typ: 'rezept', land: 'Peru', warum: 'Fruchtig-scharfe gelbe Sauce mit Cashew-Körper statt Frischkäse.', abwandlung: '+ 25 g Ají-amarillo-Paste, 5 g Hefeflocken', rezeptSlug: 'drillinge-salzkruste', quelle: q('theveggietable.com', 'https://www.theveggietable.com/vegetarian-recipes/sauces/salsa-a-la-huancaina/') },
    { id: 'b4', ast: 'beilagen', name: 'Rauch-Cashew-Salsa aus dem Smoker', form: 'dip', typ: 'schmiede', land: 'USA und Mexiko', warum: 'Ein Dip direkt aus dem Smoker — der Rauch ist hier Zutat.', abwandlung: 'Cashews vorher eine halbe Stunde bei 90–100 °C über Apfelholz räuchern, + 8 g Chipotle, 2 g Zucker', schmiedeAuftrag: 'Rauch-Cashew-Salsa aus dem Smoker mit Chipotle', quelle: q('andrewzimmern.com', 'https://andrewzimmern.com/recipes/guacamole-pistachios-smoked-cashew-salsa/') },
    { id: 'b5', ast: 'beilagen', name: 'Grillbrot mit Röstknoblauch-Aufstrich', form: 'aufstrich', typ: 'rezept', land: 'USA', warum: 'Süßliche Knoblauchtiefe auf heißem Brot.', abwandlung: 'Wasser auf 60 g, + 20 g Röstknoblauch', rezeptSlug: 'damper-brot-grill', quelle: q('salon.com', 'https://salon.com/2011/03/08/cashew_roasted_garlic_spread_recipe') },
    { id: 'b6', ast: 'beilagen', name: 'Choripán mit Merkén-Creme', form: 'dip', typ: 'rezept', land: 'Argentinien', warum: 'Ersetzt die Mayo, Merkén bringt Rauch-Chili.', abwandlung: '+ 3 g Merkén, 1 g Zwiebelpulver', rezeptSlug: 'chorizo-argentino-choripan', quelle: q('mdzol.com', 'https://www.mdzol.com/estilo/2022/6/29/castanas-de-caju-como-usarlas-en-recetas-dulces-saladas-254448.html') },
    { id: 'b7', ast: 'beilagen', name: 'Nachos mit rauchigem Cashew-Queso', form: 'warm', typ: 'pairing', land: 'USA', warum: 'Käsesaucen-Optik ohne Milch, mit Raucharoma.', abwandlung: '+ 3 g geräuchertes Paprikapulver, 10 g Hefeflocken, 5 g Chipotle', quelle: q('dishingupthedirt.com', 'https://dishingupthedirt.com/recipes/hippie-nachos-with-smokey-cashew-queso-sauce') },
    { id: 'b8', ast: 'beilagen', name: 'Cashew-Käse vom Grill', form: 'aufstrich', typ: 'schmiede', land: 'Brasilien', warum: 'Fest gekocht bekommt die Creme am Rost eine Kruste — das vegetarische Gegenstück zur Provoleta.', abwandlung: '+ 15 g Stärke, 5 g Senf, 5 g Hefeflocken; aufkochen, formen, kühlen, grillen', schmiedeAuftrag: 'Grillbarer Cashew-Käse nach brasilianischer Art', quelle: q('catracalivre.com.br', 'https://catracalivre.com.br/gastronomia/queijo-vegano-de-castanha-de-caju-facil-e-rapido-de-fazer/') },
    // ── Obst & Süßes ──
    { id: 'o1', ast: 'suess', name: 'Grillpfirsich mit Vanille-Cashewcreme', form: 'klecks', typ: 'rezept', land: 'USA', warum: 'Karamellisierte Frucht, kühle Nusscreme — ein Dessert ohne Sahne.', abwandlung: 'Salz und Pfeffer weglassen, + 15 g Ahornsirup, das Mark einer halben Vanilleschote', rezeptSlug: 'gegrillter-pfirsich-bourbon', quelle: q('vitacost.com', 'https://www.vitacost.com/blog/grilled-peaches-with-vanilla-cashew-cream-mint/'), frei: true },
    { id: 'o2', ast: 'suess', name: 'Pfirsichsalat mit Kräuter-Cashew', form: 'klecks', typ: 'pairing', land: 'USA', warum: 'Süß-rauchiger Pfirsich trifft herzhafte Kräutercreme.', abwandlung: 'Wasser auf 70 g, + 4 g Basilikum, 1 g Oregano, 1 g Thymian', quelle: q('makingthymeforhealth.com', 'https://www.makingthymeforhealth.com/wprm_print/grilled-peach-salad-with-cashew-herb-cheese') },
    { id: 'o3', ast: 'suess', name: 'Crostini mit Balsamico-Pfirsich', form: 'aufstrich', typ: 'pairing', land: 'USA', warum: 'Die Creme als Fettschicht trägt Frucht und Säure.', abwandlung: 'Wasser auf 60 g, + 3 g Basilikum', quelle: q('dishingupthedirt.com', 'https://dishingupthedirt.com/recipes/balsamic-roasted-peach-crostini-cashew-cheese-basil/') },
  ],
};
