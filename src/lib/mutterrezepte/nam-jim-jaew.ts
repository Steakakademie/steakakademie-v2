import type { Ast, Einsatzform, FormInfo, Mutterrezept } from './typen';

/**
 * Mutterrezept Nam Jim Jaew (23.10.2026, C4).
 *
 * Grundrezept: die Isaan-Dipsauce aus Nordost-Thailand — Fischsauce, Limette,
 * Palmzucker, geröstete Chiliflocken, Tamarinde, geröstetes Klebreispulver
 * (Khao Khua), Schalotte, Koriander, Frühlingszwiebel. Die Mengen schwanken je
 * Quelle (hungryinthailand.com, tablejourney.com, cookingwithnart.com); gemeinsam
 * ist: Fischsauce, Limette und Chili etwa gleichauf, Zucker klein.
 *
 * Der Konsistenz-Regler ist das Khao Khua: Es zieht Flüssigkeit und dickt die
 * Sauce an (hungryinthailand.com), deshalb kommt es erst kurz vor dem Servieren
 * hinein (stickyricethaikitchen.com, cookingwithnart.com). Wenig Pulver → dünn
 * zum Anmachen, viel Pulver → bleibt auf dem Fleisch liegen; in einer Marinade
 * bleibt es weg, weil es am Rost verbrennt.
 *
 * Einsatzideen per Web-Recherche (23.10.2026): jede fremde Idee mit abgerufener
 * Quelle, Rezepttexte nicht übernommen. `ableitung: true` heißt: Das Original
 * nutzt Nam Jim Seafood, eine laotische Jeow-Variante, eine andere Garmethode
 * oder ein anderes Grillgut — die Übertragung stammt von der Steakakademie.
 *
 * Grammangaben der Abwandlungen und des Reglers sind Richtwerte und NICHT
 * probegekocht. Die Seite sagt das ausdrücklich.
 *
 * Nicht belegt und deshalb nicht im Baum: Jaew zu Obst, Mais, Burger, Jakobs-
 * muscheln, als Aufstrich. hot-thai-kitchen.com war nicht abrufbar (HTTP 402).
 */

const FORMEN: Partial<Record<Einsatzform, FormInfo>> = {
  dressing: { label: 'Dressing', kuerzel: 'Dr', reglerGramm: 4, ergebnis: 'dünn, zum Anmachen von Fleischsalat oder Gemüse' },
  spiegel: { label: 'Spiegel', kuerzel: 'S', reglerGramm: 6, ergebnis: 'läuft, dunkler Spiegel unter dem Fleisch' },
  dip: { label: 'Dip', kuerzel: 'D', reglerGramm: 10, ergebnis: 'die klassische Schale neben Klebreis' },
  klecks: { label: 'Klecks', kuerzel: 'K', reglerGramm: 18, ergebnis: 'bleibt auf dem Fleisch liegen' },
  marinade: { label: 'Marinade', kuerzel: 'M', reglerGramm: 0, ergebnis: 'ohne Reispulver — es verbrennt am Rost; Basis mit 20 g Öl' },
  warm: { label: 'Warme Sauce', kuerzel: 'W', reglerGramm: 8, ergebnis: 'Basis lauwarm, Pulver und Kräuter erst vom Feuer einrühren' },
};

const AESTE: Ast[] = [
  { id: 'rind', kurz: 'Rind', name: 'Rind' },
  { id: 'schwein', kurz: 'Schwein', name: 'Schwein' },
  { id: 'gefluegel', kurz: 'Geflügel', name: 'Geflügel' },
  { id: 'lamm', kurz: 'Lamm', name: 'Lamm' },
  { id: 'fisch', kurz: 'Fisch', name: 'Fisch' },
  { id: 'meer', kurz: 'Meeresfrüchte', name: 'Meeresfrüchte' },
  { id: 'gemuese', kurz: 'Gemüse', name: 'Gemüse' },
  { id: 'beilagen', kurz: 'Beilagen', name: 'Beilagen & Reis' },
];

const OHNE_PULVER = 'Khao Khua weglassen';
const TOMATE = 'Chiliflocken auf 4 g senken, + 120 g über der Glut geflämmte Tomaten und 30 g geröstete Schalotte, alles grob zerstoßen; Khao Khua weglassen';

const q = (name: string, url: string) => ({ name, url });

export const NAM_JIM_JAEW: Mutterrezept = {
  slug: 'nam-jim-jaew',
  titel: 'Nam Jim Jaew',
  zentrum: 'Nam Jim Jaew',
  beschreibung:
    'Die Isaan-Dipsauce aus Thailand als Mutterrezept: Fischsauce, Limette, Palmzucker, geröstete Chili, Tamarinde und geröstetes Klebreispulver — mit Einsätzen als Dip, Klecks, Spiegel, Dressing, Marinade und warme Sauce für Rind, Schwein, Geflügel, Fisch, Meeresfrüchte und Gemüse vom Grill.',
  einleitung:
    'Salzig, sauer, scharf, nussig: Nam Jim Jaew ist die Sauce, die in Isaan neben jedem Grillhähnchen und jeder Schale Klebreis steht. Wie bei den Muttersaucen der klassischen Küche steht ein Grundrezept in der Mitte — und über das geröstete Reispulver wird daraus Dressing, Spiegel, Dip oder Klecks. Die Einsatzideen stammen aus Thailand, Laos und aus Küchen, die Jaew längst zu Steak und Lachs stellen — jede mit Quelle.',
  rubrik: 'Saucen & Rubs',
  keywords: 'Nam Jim Jaew, Jaew Sauce, Thai Dipsauce, Isaan, Sauce zu Gai Yang, Sauce zu Moo Ping, Khao Khua',
  ableitungHinweis:
    'Wo das Original Nam Jim Seafood, eine laotische Jeow-Variante, eine andere Garmethode oder ein anderes Grillgut nutzt und wir es auf das Grundrezept übertragen, steht „Eigene Ableitung“.',
  autorSlug: 'jonas',
  veroeffentlicht: '2026-10-23',
  // Ein KI-Bild je Mutterrezept (Uwe, 22.10.2026): Nano Banana Pro via fal.ai, Text-zu-Bild,
  // zulässig, weil kein Fleisch im Motiv. Provenienz in public/images/mutterrezepte/CREDITS.md.
  bild: {
    src: '/images/mutterrezepte/nam-jim-jaew.jpg',
    alt: 'Kleine Keramikschale mit dunkelroter Nam-Jim-Jaew-Sauce, darauf Chiliflocken, geröstetes Reispulver, Koriander und Frühlingszwiebel; daneben Limettenhälften, getrocknete Chilis, ein Schälchen Reispulver und ein Bambuskörbchen für Klebreis auf dunklem Holz',
    ki: true,
    quelle: 'KI-generiert (Nano Banana Pro via fal.ai), 23.10.2026',
  },
  ergibt: 'ca. 190 g, vier Portionen als Dip',
  zeit: '15 Min. aktiv, davon 10 Min. Reis rösten',
  zutatenGramm: [
    { name: 'Thai-Klebreis, roh', gramm: 15, hinweis: 'ergibt gut 10 g Khao Khua — mehr rösten, es hält Wochen' },
    { name: 'Fischsauce', gramm: 45 },
    { name: 'Limettensaft, frisch', gramm: 40, hinweis: 'etwa anderthalb Limetten' },
    { name: 'Palmzucker', gramm: 15, hinweis: 'oder brauner Zucker' },
    { name: 'Tamarindenpaste', gramm: 15, hinweis: 'für die Isaan-Tiefe; ohne sie Limettensaft auf 50 g' },
    { name: 'Chiliflocken, geröstet', gramm: 8, hinweis: 'Thai-Chili oder Prik Bon; mild: 4 g' },
    { name: 'Khao Khua (geröstetes Klebreispulver)', gramm: 10, hinweis: 'das ist die Dip-Menge; andere Einsätze siehe Regler' },
    { name: 'Schalotte', gramm: 20, hinweis: 'in feinen Ringen' },
    { name: 'Koriander', gramm: 8, hinweis: 'grob geschnitten' },
    { name: 'Frühlingszwiebel', gramm: 10, hinweis: 'in Ringen' },
    { name: 'Wasser', gramm: 20, hinweis: 'zum Lösen des Zuckers' },
  ],
  zutatenLoeffel: [
    { menge: '1 EL, gehäuft', name: 'Thai-Klebreis, roh' },
    { menge: '3 EL', name: 'Fischsauce' },
    { menge: '3 EL', name: 'Limettensaft' },
    { menge: '1 EL', name: 'Palmzucker' },
    { menge: '1 EL', name: 'Tamarindenpaste' },
    { menge: '1 EL', name: 'geröstete Chiliflocken' },
    { menge: '1 kleine', name: 'Schalotte, in Ringen' },
    { menge: '2 Stängel', name: 'Koriander' },
    { menge: '1', name: 'Frühlingszwiebel' },
    { menge: '1½ EL', name: 'Wasser' },
  ],
  schritte: [
    {
      titel: 'Khao Khua rösten',
      text: 'Rohen Klebreis ohne Öl in einer trockenen Pfanne bei kleiner Hitze fünf bis zehn Minuten rösten und dabei schwenken, bis er goldgelb ist und nussig riecht. Ganz abkühlen lassen, dann im Mörser oder kurz im [[ninja-detect-power-mixer-pro-tb301|Standmixer]] grob mahlen — leicht rau, kein Mehl.',
    },
    {
      titel: 'Chili rösten',
      text: 'Chiliflocken in derselben Pfanne eine halbe Minute schwenken, bis sie dunkler werden und duften. Sofort herausnehmen, sie werden sonst bitter.',
    },
    {
      titel: 'Basis anrühren',
      text: 'Palmzucker und Tamarindenpaste im Wasser glattrühren, Fischsauce und Limettensaft dazu, Chiliflocken einrühren. Die Basis hält sich — sie ist der Teil, den du vorbereiten kannst.',
    },
    {
      titel: 'Frisches dazu',
      text: 'Schalotte, Koriander und Frühlingszwiebel erst kurz vor dem Servieren unterrühren, sonst welken sie in der Säure.',
    },
    {
      titel: 'Khao Khua zuletzt',
      text: 'Das Reispulver ganz zum Schluss einrühren, in der Menge aus dem Konsistenz-Regler. Es quillt binnen Minuten: wird die Sauce zu dick, einen Schluck Limettensaft oder Wasser nachgeben.',
    },
  ],
  profiTipp:
    'Khao Khua auf Vorrat rösten und luftdicht lagern — es hält Wochen. Mit einem Blatt Pandan oder einem Stück Zitronengras im Röstgut bekommt das Pulver den Duft, den die Isaan-Küche meint.',
  lagerung:
    'Die Basis ohne Reispulver, Schalotte, Koriander und Frühlingszwiebel hält luftdicht im Kühlschrank drei Tage. Frisches und Khao Khua erst beim Servieren dazu — sonst quillt das Pulver, die Sauce wird dick und verliert das Nussige. Fertig angemacht am selben Tag verbrauchen.',
  allergene: 'Enthält Fisch (Fischsauce). Abwandlungen mit Austernsauce (Weichtiere), Soja oder Erdnüssen bitte am Blatt beachten.',
  regler: { basis: '45 g Fischsauce mit Limette, Zucker, Tamarinde und Chili', name: 'Khao Khua', grundmenge: 'ca. 190 g' },
  formen: FORMEN,
  aeste: AESTE,
  blaetter: [
    // ── Rind ──
    { id: 'r1', ast: 'rind', name: 'Nuea Yang Nam Tok — Isaan-Rindersalat', form: 'dressing', typ: 'rezept', land: 'Thailand, Isaan', warum: 'Das Nam-Tok-Dressing ist der dünne Bruder des Jaew: Limette, Fischsauce, Chili und Reispulver über warme Steakscheiben, dazu Minze und Schalotte.', abwandlung: 'Tamarinde und Palmzucker weglassen (nur 3 g Zucker), Limettensaft auf 50 g, + 15 g Minze; Khao Khua 4 g', rezeptSlug: 'nuea-yang-nam-tok', quelle: q('whattocooktoday.com', 'https://whattocooktoday.com/grilled-beef-salad-from-isan-naam-tok-nuea.html'), ableitung: true },
    { id: 'r2', ast: 'rind', name: 'Crying Tiger — Entrecôte mit Jaew', form: 'dip', typ: 'rezept', land: 'Thailand', warum: 'Suea Rong Hai: kurz und heiß gegrilltes Rind, dünn gegen die Faser geschnitten, jede Scheibe in die Sauce getunkt.', abwandlung: 'Grundrezept; Schalotte in Spalten statt Ringen', rezeptSlug: 'entrecote-grillen', quelle: q('iankewks.com', 'https://iankewks.com/thai-crying-tiger-steak/'), ableitung: true, frei: true },
    { id: 'r3', ast: 'rind', name: 'Bavette, dünn aufgeschnitten', form: 'dip', typ: 'rezept', land: 'Thailand und USA', warum: 'Flap Steak in Zitronengras und Austernsauce mariniert — die Quelle sagt: ohne Reispulver verliert die Sauce ihre Textur.', abwandlung: 'Grundrezept mit 15 g Tamarinde; Chiliflocken durch 6 g Thai-Chilipulver ersetzen', rezeptSlug: 'bavette-skirt-steak', quelle: q('tastingtable.com', 'https://www.tastingtable.com/2250332/thai-style-grilled-steak-recipe/') },
    { id: 'r4', ast: 'rind', name: 'Flank Steak medium-rare, mit Minze', form: 'dip', typ: 'rezept', land: 'Thailand und USA', warum: 'Ein fingerdickes Steak, rosa, gegen die Faser — die Sauce mit Minze statt Koriander wird kühler und grüner.', abwandlung: 'Koriander durch 8 g Minze ersetzen, Palmzucker durch 15 g Rohrzucker, Schalotte optional', rezeptSlug: 'flank-steak-grillen', quelle: q('norecipes.com', 'https://norecipes.com/wprm_print/crying-tiger-beef'), ableitung: true },
    { id: 'r5', ast: 'rind', name: 'Thai Surf and Turf — Steak und Garnelen', form: 'dip', typ: 'pairing', land: 'USA', warum: 'Eine Schale Jaew für beides: Strip Steak und Riesengarnelen, dazu Tomate — die Säure passt zu Fleisch und Meer.', abwandlung: '+ 5 g Ingwer und 5 g Knoblauch fein gerieben, frische und getrocknete Chili gemischt', quelle: q('sweetsandsavory.com', 'https://www.sweetsandsavory.com/?p=1626') },
    // ── Schwein ──
    { id: 's1', ast: 'schwein', name: 'Moo Ping — Schweinespieße', form: 'dip', typ: 'rezept', land: 'Thailand', warum: 'Süß-salzige Spieße vom Straßengrill, dazu Klebreis und eine Schale Jaew — das Original dieser Kombination.', abwandlung: `${OHNE_PULVER}, Tamarinde auf 25 g, + 10 g frische rote Chili statt der Flocken`, rezeptSlug: 'moo-ping', quelle: q('graceandthorn.com', 'https://graceandthorn.com/blogs/the-cut/moo-ping-skewers-with-nam-jim-jaew'), frei: true },
    { id: 's2', ast: 'schwein', name: 'Kor Moo Yang — Schweinenacken vom Rost', form: 'dip', typ: 'pairing', land: 'Thailand, Isaan', warum: 'Nackenscheiben in Austernsauce und weißem Pfeffer, gegrillt, in Streifen geschnitten — mit Reis, Jaew und rohem Gemüse.', abwandlung: 'Grundrezept, keine Abwandlung.', quelle: q('cookingwithnart.com', 'https://www.cookingwithnart.com/wprm_print/thai-grilled-pork-neck-kor-moo-yang-recipe') },
    { id: 's3', ast: 'schwein', name: 'Muu Yang mit schwarzem Reispulver', form: 'klecks', typ: 'pairing', land: 'Thailand und Australien', warum: 'Khao Khua aus schwarzem Klebreis macht die Sauce dunkler und erdiger — als dicker Klecks auf den Nackenscheiben.', abwandlung: 'Khao Khua aus schwarzem Klebreis, 18 g; + 5 g Knoblauch, frische Vogelaugen- und lange Chili statt der Flocken', quelle: q('gourmettraveller.com.au', 'https://www.gourmettraveller.com.au/recipe/mains/muu-yang-with-nahm-jim-jaew-barbecued-pork-with-chilli-dipping-sauce-11111/') },
    { id: 's4', ast: 'schwein', name: 'Thai-Rippchen mit Jaew statt BBQ-Sauce', form: 'dip', typ: 'rezept', land: 'Thailand', warum: 'Rippchen in Korianderwurzel-Knoblauch-Pfeffer mariniert — die Quelle nennt Jaew den klassischen Dip dazu. Bei uns: die 3-2-1-Ribs ohne süße Glasur, Jaew daneben.', abwandlung: 'Grundrezept; Glasur der Rippchen weglassen', rezeptSlug: 'spareribs-3-2-1', quelle: q('hungryinthailand.com', 'https://hungryinthailand.com/thai-ribs/'), ableitung: true },
    // ── Geflügel ──
    { id: 'h1', ast: 'gefluegel', name: 'Gai Yang — Isaan-Grillhähnchen', form: 'dip', typ: 'rezept', land: 'Thailand, Isaan', warum: 'Die Kombination, aus der dieses Mutterrezept stammt: flach gegrilltes Hähnchen, Klebreis, Jaew. Die Quelle nennt das Reispulver „nicht verhandelbar“.', abwandlung: 'Grundrezept, keine Abwandlung.', rezeptSlug: 'gai-yang-isaan', quelle: q('tablejourney.com', 'https://tablejourney.com/dish/gai-yang/'), frei: true },
    { id: 'h2', ast: 'gefluegel', name: 'Hähnchenflügel im Gai-Yang-Stil', form: 'dip', typ: 'pairing', land: 'USA', warum: 'Flügel in Zitronengras-Paste, 45 Minuten indirekt — Jaew mit Tamarindenkonzentrat zum Eintunken.', abwandlung: 'Tamarinde auf 20 g, Chiliflocken durch 6 g Thai-Chilipulver ersetzen', quelle: q('meatwave.com', 'https://meatwave.com/recipes/grilled-thai-influenced-gai-yang-chicken-wings-recipe') },
    { id: 'h3', ast: 'gefluegel', name: 'Kurkuma-Kokos-Flügel mit Tomaten-Jaew', form: 'klecks', typ: 'pairing', land: 'Thailand und Australien', warum: 'Geröstete Tomate und Schalotte machen aus dem Jaew eine dickere, mildere Sauce, die auf dem Flügel liegen bleibt.', abwandlung: `${TOMATE}; + 10 g Austernsauce`, quelle: q('sbs.com.au', 'https://www.sbs.com.au/food/recipes/turmeric-coconut-chicken-nahm-jim-jaew') },
    { id: 'h4', ast: 'gefluegel', name: 'Spatchcock-Hähnchen in Jaew-Basis mariniert', form: 'marinade', typ: 'rezept', land: 'Thailand', warum: 'Die Zitronengras-Fischsauce-Marinade des Originals mit der Jaew-Basis angesetzt: Fischsauce, Limette, Zucker und Chili ziehen über Nacht ein, das Reispulver kommt erst in den Dip.', abwandlung: `${OHNE_PULVER}; + 20 g Öl, + 20 g Zitronengras fein gehackt, + 10 g Knoblauch; die Hälfte als Marinade, der Rest mit 10 g Khao Khua als Dip`, rezeptSlug: 'spatchcock-haehnchen', quelle: q('pholfoodmafia.com', 'https://www.pholfoodmafia.com/?p=46062'), ableitung: true },
    // ── Lamm ──
    { id: 'l1', ast: 'lamm', name: 'Lammkoteletts mit warmem Jaew', form: 'warm', typ: 'rezept', land: 'USA', warum: 'Jaew aus trocken geröstetem Gemüse, warm serviert — die Schärfe trägt das kräftige Lammfett.', abwandlung: `${TOMATE}; Fischsauce zur Hälfte durch 20 g Sojasauce ersetzen; Basis lauwarm, Kräuter erst vom Feuer`, rezeptSlug: 'lamb-chops-braai-sa', quelle: q('kikkomanusa.com', 'https://kikkomanusa.com/foodservice/recipes/grilled-black-pepper-lamb-with-jaew-sauce-gae-yaang-jim-jaew/'), ableitung: true },
    // ── Fisch ──
    { id: 'f1', ast: 'fisch', name: 'Pla Pao — Fisch in Salzkruste mit Jaew', form: 'dip', typ: 'rezept', land: 'Thailand', warum: 'Zum Salzkrusten-Fisch gehört meist Nam Jim Seafood — das Rezept auf der Seite nennt Jaew als erdigere, nussigere Alternative.', abwandlung: 'Grundrezept, keine Abwandlung.', rezeptSlug: 'pla-pao-salzkruste', herkunft: 'Rezept der Steakakademie, nennt Nam Jim Jaew als Variante zum Nam Jim Seafood.' },
    { id: 'f2', ast: 'fisch', name: 'Planken-Lachs auf Rauchtomaten-Jaew', form: 'spiegel', typ: 'rezept', land: 'Australien', warum: 'Jaew aus geflämmten Tomaten statt Trockenchili als Spiegel unter knusprigem Lachs, ein Löffel Kokoscreme obenauf.', abwandlung: `${TOMATE}; Khao Khua 6 g statt weglassen, + 30 g Kokoscreme als Tupfer`, rezeptSlug: 'cedar-plank-lachs', quelle: q('farmtofork.com.au', 'https://www.farmtofork.com.au/recipe-index/crispy-salmon-with-smoked-tomato-jaew'), ableitung: true },
    { id: 'f3', ast: 'fisch', name: 'Ganze Makrele mit Jaew-Dressing', form: 'dressing', typ: 'rezept', land: 'Australien', warum: 'Jaew dünn als Dressing über gegrillten Fisch gelöffelt — die Quelle nennt es ausdrücklich für Hähnchen und Fisch.', abwandlung: `${OHNE_PULVER}; + 10 g frische rote Chili, Tamarinde auf 20 g; Khao Khua 4 g`, rezeptSlug: 'ganze-makrele-grill', quelle: q('recipetineats.com', 'https://recipetineats.com/thai-dipping-sauce-nam-jim-jaew'), ableitung: true },
    // ── Meeresfrüchte ──
    { id: 'm1', ast: 'meer', name: 'Pla Muek Yang — Tintenfisch vom Rost', form: 'dip', typ: 'pairing', land: 'Thailand und Laos', warum: 'Gegrillter Calamari mit einer Jeow-Variante: Zitronengras und Galgant statt Reispulver und Schalotte.', abwandlung: 'Khao Khua und Schalotte weglassen, + 15 g Zitronengras und 8 g Galgant fein gehackt, Tamarinde auf 20 g', quelle: q('sbs.com.au', 'https://www.sbs.com.au/food/recipes/grilled-squid-nahm-jim-jeaw'), ableitung: true },
    { id: 'm2', ast: 'meer', name: 'Riesengarnelen in der Schale, Jaew statt Nam Jim Seafood', form: 'dip', typ: 'rezept', land: 'Thailand und USA', warum: 'Garnelen aus der Schale in die dunkle, nussige Sauce statt in die grüne Knoblauch-Limette — erdiger, weniger scharf.', abwandlung: '+ 5 g Ingwer und 5 g Knoblauch fein gerieben', rezeptSlug: 'goong-pao-thai', quelle: q('sweetsandsavory.com', 'https://www.sweetsandsavory.com/?p=1626'), ableitung: true },
    // ── Gemüse ──
    { id: 'g1', ast: 'gemuese', name: 'Gegrillte Pilze mit warmem Jaew', form: 'warm', typ: 'pairing', land: 'Australien', warum: 'Shiitake, Kräuterseitling und Austernpilz in der Gusseisenpfanne gebräunt, warmer Jaew darüber — die „universelle Chilisauce“.', abwandlung: `${TOMATE}; Khao Khua 8 g, mit Pandan oder Zitronengras geröstet; + 10 g Austernsauce`, quelle: q('carriageworks.com.au', 'https://carriageworks.com.au/journal/palisa-anderson-nahm-jim-jaew-aka-universal-chilli-sauce-with-mushrooms/') },
    { id: 'g2', ast: 'gemuese', name: 'Aubergine vom Grill mit veganem Jaew', form: 'dressing', typ: 'pairing', land: 'USA', warum: 'Weiches, rauchiges Fruchtfleisch mit Thai-Basilikum, darüber ein dünner Jaew ohne Fischsauce.', abwandlung: 'Fischsauce durch 40 g Sojasauce ersetzen, Tamarinde auf 20 g; Khao Khua 4 g; + 8 g Thai-Basilikum', quelle: q('cinnamonsnail.com', 'https://cinnamonsnail.com/nam-jim-jaew/'), ableitung: true },
    // ── Beilagen & Reis ──
    { id: 'b1', ast: 'beilagen', name: 'Klebreis zum Eintunken', form: 'dip', typ: 'pairing', land: 'Thailand', warum: 'Ein Küchenchef aus Bangkok nennt Jaew besonders gut, um gedämpften Klebreis hineinzutunken — Kirschtomate in der Sauce bringt Frische.', abwandlung: `${OHNE_PULVER}; + 60 g Kirschtomaten geviertelt, Tamarinde auf 25 g`, quelle: q('guide.michelin.com', 'https://guide.michelin.com/vn/en/article/dining-in/how-to-make-nam-jim-jaew-thai-bbq-sauce-phed-phed') },
    { id: 'b2', ast: 'beilagen', name: 'Isaan-Teller: Som Tam, Klebreis, Jaew', form: 'dip', typ: 'pairing', land: 'Thailand, Isaan', warum: 'So wird Gai Yang im Isaan gegessen: Papayasalat, Klebreis und die Jaew-Schale auf einem Teller.', abwandlung: 'Grundrezept, keine Abwandlung.', quelle: q('nationalgeographic.com', 'https://www.nationalgeographic.com/travel/article/northeast-thailand-food-isaan-dishes') },
  ],
};
