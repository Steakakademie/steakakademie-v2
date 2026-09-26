/**
 * Website-Baukasten — Projekt-Anamnese (KONZEPT-Website-Baukasten-2026-09-25, Abschnitt 13).
 *
 * Wie ein Anamnesebogen: erst verstehen, dann empfehlen. Reiner Entscheidungsbaum —
 * keine KI, keine laufenden Kosten, gleiche Antworten ergeben immer dasselbe Ergebnis.
 * Preise kommen ausschließlich aus ./preise. Muster: src/lib/eigenregie/diagnose.ts.
 */

import {
  type Land, type Waehrung, type PreisSchluessel,
  waehrungFuer, preis, mietkaufRate, formatBetrag, LAUFEND_BEIM_KUNDEN, ARTIKELTEXT_WOERTER,
} from './preise';

// ─── Antworten ────────────────────────────────────────────────────────────────

export type Vorhaben = 'neu' | 'modernisieren' | 'zurueckholen' | 'unklar';
export type Zugaenge = 'ja' | 'teilweise' | 'nein' | 'unklar';
export type Branche = 'handwerk' | 'dienstleistung' | 'handel' | 'gesundheit' | 'gastro' | 'industrie' | 'sonstiges';
export type Groesse = '1' | '2-9' | '10-49' | '50+';
export type Ziel = 'anfragen' | 'mitarbeiter' | 'verkaufen' | 'termine' | 'blog' | 'eindruck' | 'portal';
export type Leistungen = '1-3' | '4-8' | '9-15' | 'mehr';
export type Artikel = 'bis-50' | '51-500' | 'mehr';
export type ArtikelMaterial = 'beides' | 'fotos' | 'texte' | 'nichts';
export type Stellen = '1' | '2-5' | 'mehr';
export type Sprachen = 'de' | 'de-en' | 'weitere';
export type Vorhanden = 'logo' | 'fotos' | 'texte';
export type Betrieb = 'selbst-pflegen' | 'ihr-pflegt' | 'selbst-bauen';
export type Sichtbarkeit = 'lokal' | 'ueberregional' | 'wachsen';
export type Termin = '4-wochen' | '3-monate' | 'flexibel';
export type Zahlung = 'einmalig' | 'monatlich' | 'offen';
export type Rahmen = 'bis-1000' | 'bis-3000' | 'bis-10000' | 'darueber' | 'unklar';

export type Antworten = {
  vorhaben: Vorhaben;
  url?: string;
  zugaenge?: Zugaenge;
  branche: Branche;
  land: Land;
  groesse: Groesse;
  ziele: Ziel[];
  leistungen: Leistungen;
  artikel?: Artikel;
  artikelMaterial?: ArtikelMaterial;
  stellen?: Stellen;
  sprachen: Sprachen;
  vorhanden: Vorhanden[];
  betrieb: Betrieb;
  sichtbarkeit: Sichtbarkeit;
  termin: Termin;
  zahlung: Zahlung;
  rahmen: Rahmen;
  freitext?: string;
};

// ─── Fragenkatalog (Daten, nicht Code — die Oberfläche rendert nur) ───────────

type Opt = { wert: string; label: string; hinweis?: string };
export type Frage = {
  key: keyof Antworten;
  block: 'Ausgangslage' | 'Ziele' | 'Umfang' | 'Material' | 'Nach dem Livegang' | 'Rahmen' | 'Deine Wünsche';
  frage: string;
  erklaerung?: string;
  art: 'eins' | 'mehrere' | 'url' | 'text';
  optionen?: Opt[];
  optional?: boolean;
  /** Frage erscheint nur, wenn die Bedingung erfüllt ist (Verzweigung). */
  nurWenn?: (a: Partial<Antworten>) => boolean;
};

const hatZiel = (a: Partial<Antworten>, z: Ziel) => Boolean(a.ziele?.includes(z));

export const FRAGEN: Frage[] = [
  // A — Ausgangslage
  { key: 'vorhaben', block: 'Ausgangslage', art: 'eins', frage: 'Was beschreibt dein Vorhaben am besten?', optionen: [
    { wert: 'neu', label: 'Eine neue Website' },
    { wert: 'modernisieren', label: 'Meine bestehende Website modernisieren' },
    { wert: 'zurueckholen', label: 'Meine Website von Agentur oder Dienstleister zurückholen' },
    { wert: 'unklar', label: 'Weiß ich noch nicht' },
  ] },
  { key: 'url', block: 'Ausgangslage', art: 'url', optional: true,
    frage: 'Unter welcher Adresse ist deine bisherige Website erreichbar?',
    erklaerung: 'Damit wir im Angebot sehen, was übernommen werden muss.',
    nurWenn: (a) => a.vorhaben === 'modernisieren' || a.vorhaben === 'zurueckholen' },
  { key: 'zugaenge', block: 'Ausgangslage', art: 'eins', frage: 'Liegen Domain und Zugänge bei dir?',
    erklaerung: 'Also: Ist die Domain auf deinen Namen registriert, und kommst du selbst an Hosting und Inhalte?',
    nurWenn: (a) => a.vorhaben !== undefined && a.vorhaben !== 'neu', optionen: [
      { wert: 'ja', label: 'Ja, alles' }, { wert: 'teilweise', label: 'Teilweise' },
      { wert: 'nein', label: 'Nein' }, { wert: 'unklar', label: 'Weiß ich nicht' },
    ] },
  { key: 'branche', block: 'Ausgangslage', art: 'eins', frage: 'In welcher Branche bist du unterwegs?', optionen: [
    { wert: 'handwerk', label: 'Handwerk' },
    { wert: 'dienstleistung', label: 'Dienstleistung, Beratung, Selbstständige' },
    { wert: 'handel', label: 'Handel, Onlineshop' },
    { wert: 'gesundheit', label: 'Gesundheit, Praxis, Therapie' },
    { wert: 'gastro', label: 'Gastronomie, Lebensmittel' },
    { wert: 'industrie', label: 'Industrie, Mittelstand' },
    { wert: 'sonstiges', label: 'Etwas anderes' },
  ] },
  { key: 'land', block: 'Ausgangslage', art: 'eins', frage: 'Wo sitzt dein Betrieb?', optionen: [
    { wert: 'DE', label: 'Deutschland' }, { wert: 'AT', label: 'Österreich' }, { wert: 'CH', label: 'Schweiz' },
  ] },
  { key: 'groesse', block: 'Ausgangslage', art: 'eins', frage: 'Wie viele Menschen arbeiten im Betrieb?', optionen: [
    { wert: '1', label: 'Nur ich' }, { wert: '2-9', label: '2–9' }, { wert: '10-49', label: '10–49' }, { wert: '50+', label: '50 oder mehr' },
  ] },
  // B — Ziele
  { key: 'ziele', block: 'Ziele', art: 'mehrere', frage: 'Was soll die Website für dich leisten?', erklaerung: 'Mehrere Antworten möglich.', optionen: [
    { wert: 'anfragen', label: 'Anfragen und Kunden gewinnen' },
    { wert: 'mitarbeiter', label: 'Mitarbeiter und Azubis gewinnen' },
    { wert: 'verkaufen', label: 'Produkte online verkaufen' },
    { wert: 'termine', label: 'Termine online buchen lassen' },
    { wert: 'blog', label: 'Fachwissen zeigen (Blog, Ratgeber)' },
    { wert: 'eindruck', label: 'Eindruck machen — ein Auftritt mit Aha-Effekt' },
    { wert: 'portal', label: 'Kundenbereich oder Portal mit Login' },
  ] },
  // C — Umfang
  { key: 'leistungen', block: 'Umfang', art: 'eins', frage: 'Wie viele Leistungen oder Angebote willst du zeigen?',
    erklaerung: 'Jede Leistung bekommt in der Regel eine eigene Seite — so wirst du genau dafür gefunden.', optionen: [
      { wert: '1-3', label: '1–3' }, { wert: '4-8', label: '4–8' }, { wert: '9-15', label: '9–15' }, { wert: 'mehr', label: 'Mehr als 15' },
    ] },
  { key: 'artikel', block: 'Umfang', art: 'eins', frage: 'Wie viele Artikel sollen online verkauft werden?',
    nurWenn: (a) => hatZiel(a, 'verkaufen'), optionen: [
      { wert: 'bis-50', label: 'Bis 50' }, { wert: '51-500', label: '51–500' }, { wert: 'mehr', label: 'Mehr als 500' },
    ] },
  { key: 'artikelMaterial', block: 'Umfang', art: 'eins', frage: 'Gibt es Artikelbeschreibungen und Produktfotos?',
    nurWenn: (a) => hatZiel(a, 'verkaufen'), optionen: [
      { wert: 'beides', label: 'Ja, beides' }, { wert: 'fotos', label: 'Nur Fotos' },
      { wert: 'texte', label: 'Nur Texte' }, { wert: 'nichts', label: 'Noch nichts davon' },
    ] },
  { key: 'stellen', block: 'Umfang', art: 'eins', frage: 'Wie viele Stellen sind bei dir typischerweise gleichzeitig offen?',
    nurWenn: (a) => hatZiel(a, 'mitarbeiter'), optionen: [
      { wert: '1', label: 'Eine' }, { wert: '2-5', label: '2–5' }, { wert: 'mehr', label: 'Mehr als 5' },
    ] },
  { key: 'sprachen', block: 'Umfang', art: 'eins', frage: 'In welchen Sprachen soll die Website erscheinen?', optionen: [
    { wert: 'de', label: 'Deutsch' }, { wert: 'de-en', label: 'Deutsch und Englisch' }, { wert: 'weitere', label: 'Deutsch und weitere Sprachen' },
  ] },
  // D — Material
  { key: 'vorhanden', block: 'Material', art: 'mehrere', optional: true, frage: 'Was ist schon vorhanden?',
    erklaerung: 'Mehrere Antworten möglich. Nichts davon? Einfach weiter.', optionen: [
      { wert: 'logo', label: 'Logo' }, { wert: 'fotos', label: 'Eigene Fotos von Betrieb, Team oder Arbeit' }, { wert: 'texte', label: 'Texte' },
    ] },
  // E — Nach dem Livegang
  { key: 'betrieb', block: 'Nach dem Livegang', art: 'eins', frage: 'Wie soll es nach dem Livegang laufen?', optionen: [
    { wert: 'ihr-pflegt', label: 'Ihr baut, ihr kümmert euch auch danach' },
    { wert: 'selbst-pflegen', label: 'Ihr baut, Inhalte pflege ich selbst' },
    { wert: 'selbst-bauen', label: 'Ich würde am liebsten selbst bauen — mit Anleitung' },
  ] },
  { key: 'sichtbarkeit', block: 'Nach dem Livegang', art: 'eins', frage: 'Wie wichtig ist es dir, gefunden zu werden?',
    erklaerung: 'Bei Google und in KI-Antworten wie ChatGPT oder Perplexity.', optionen: [
      { wert: 'lokal', label: 'Vor allem in meiner Region' },
      { wert: 'ueberregional', label: 'Überregional' },
      { wert: 'wachsen', label: 'Die Sichtbarkeit soll laufend wachsen' },
    ] },
  // F — Rahmen
  { key: 'termin', block: 'Rahmen', art: 'eins', frage: 'Bis wann soll die Seite live sein?', optionen: [
    { wert: '4-wochen', label: 'In etwa 4 Wochen' }, { wert: '3-monate', label: 'In den nächsten 3 Monaten' }, { wert: 'flexibel', label: 'Flexibel' },
  ] },
  { key: 'zahlung', block: 'Rahmen', art: 'eins', frage: 'Wie möchtest du zahlen?', optionen: [
    { wert: 'einmalig', label: 'Einmalig' },
    { wert: 'monatlich', label: 'Als Monatsrate (Mietkauf)', hinweis: '0 € Anzahlung, die Website gehört trotzdem ab Tag 1 dir.' },
    { wert: 'offen', label: 'Noch offen' },
  ] },
  { key: 'rahmen', block: 'Rahmen', art: 'eins', frage: 'Welcher Rahmen ist für die Website eingeplant?',
    erklaerung: 'Hilft uns, dir einen ehrlichen Weg zu zeigen — auch wenn er kleiner anfängt.', optionen: [
      { wert: 'bis-1000', label: 'Bis 1.000 €' }, { wert: 'bis-3000', label: 'Bis 3.000 €' }, { wert: 'bis-10000', label: 'Bis 10.000 €' },
      { wert: 'darueber', label: 'Mehr als 10.000 €' }, { wert: 'unklar', label: 'Weiß ich noch nicht' },
    ] },
  // G — Deine Wünsche (eigener letzter Schritt, Uwe 25.09.2026: Platz für eigene Bemerkungen am Ende)
  { key: 'freitext', block: 'Deine Wünsche', art: 'text', optional: true,
    frage: 'Bemerkungen, Wünsche, weitere Angaben',
    erklaerung: 'Alles, was dir wichtig ist und oben nicht vorkam: Websites, die dir gefallen, besondere Funktionen, feste Termine, Bedenken oder Fragen. Wird mit deiner Anfrage an Uwe übergeben.' },
];

export const BLOECKE = ['Ausgangslage', 'Ziele', 'Umfang', 'Material', 'Nach dem Livegang', 'Rahmen', 'Deine Wünsche'] as const;

/** Obergrenze für das Freitextfeld — hält die Projektakte unter dem Limit von /api/kontakt. */
export const FREITEXT_MAX = 2000;

/** Die Fragen, die bei diesen Antworten tatsächlich gestellt werden. */
export function aktiveFragen(a: Partial<Antworten>): Frage[] {
  return FRAGEN.filter((f) => !f.nurWenn || f.nurWenn(a));
}

export function istBeantwortet(f: Frage, a: Partial<Antworten>): boolean {
  if (f.optional) return true;
  const v = a[f.key];
  if (f.art === 'mehrere') return Array.isArray(v) && v.length > 0;
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Antworten auf verzweigte Fragen entfernen, die nicht mehr gestellt werden
 * (z. B. Artikelzahl, nachdem „verkaufen" wieder abgewählt wurde). Sonst würden
 * verwaiste Antworten das Ergebnis beeinflussen.
 */
export function bereinige(a: Partial<Antworten>): Partial<Antworten> {
  const aktiv = new Set(aktiveFragen(a).map((f) => f.key));
  const b: Partial<Antworten> = { ...a };
  for (const f of FRAGEN) if (!aktiv.has(f.key)) delete b[f.key];
  return b;
}

export function vollstaendig(a: Partial<Antworten>): a is Antworten {
  return aktiveFragen(a).every((f) => istBeantwortet(f, a));
}

// ─── Ergebnis ─────────────────────────────────────────────────────────────────

export type Stufe = 'S' | 'M' | 'L' | 'XL';

export type Position = {
  label: string;
  /** null = Preis im Angebot (noch nicht festgelegt oder vom Umfang abhängig) */
  betrag: number | null;
  ab?: boolean;
  /** enthalten = im Paketpreis enthalten bzw. angerechnet, zählt nicht zur Summe */
  enthalten?: boolean;
  art: 'einmalig' | 'monatlich' | 'stueck';
  stueckBis?: number;
  hinweis?: string;
};

export type Weiche = { art: 'eigenregie' | 'coaching' | 'budget' | 'ehrlich'; text: string; href?: string };

export type Ergebnis = {
  stufe: Stufe;
  stufeName: string;
  paket: string;
  waehrung: Waehrung;
  positionen: Position[];
  laufend: Position[];
  einmalig: { betrag: number; ab: boolean; offenePositionen: boolean };
  mietkauf: { rate: number; monate: number } | null;
  laufendBeimKunden: string;
  zeitrahmen: string;
  kundenaufwand: string;
  hinweise: string[];
  weichen: Weiche[];
  naechsterSchritt: 'angebot' | 'wertgespraech';
  /** Markierungen für Uwe (Projektakte) — nicht für den Kunden */
  markierungen: string[];
};

export const STUFEN_NAME: Record<Stufe, string> = {
  S: 'Statisch — schnell, sicher, fast wartungsfrei',
  M: 'Statisch plus — mit Redaktion, Blog oder Shop',
  L: 'Plattform — Kundenbereich, großer Shop, eigene Funktionen',
  XL: 'Showcase — Auftritt mit Aha-Effekt',
};

export const EIGENREGIE_DIAGNOSE_URL = 'https://steakakademie.de/eigenregie/diagnose';

const RUND_UM_DIE_UHR = /24\s*\/\s*7|rund um die uhr|24 stunden|jederzeit erreichbar/i;

export function ermittleStufe(a: Antworten): Stufe {
  const ziel = (z: Ziel) => a.ziele.includes(z);
  const grosserShop = ziel('verkaufen') && (a.artikel === '51-500' || a.artikel === 'mehr');
  if (ziel('eindruck') && a.rahmen === 'darueber') return 'XL';
  if (ziel('portal') || grosserShop) return 'L';
  if (ziel('blog') || ziel('verkaufen') || ziel('termine') || a.betrieb === 'selbst-pflegen') return 'M';
  return 'S';
}

export function werteAus(a: Antworten): Ergebnis {
  const w = waehrungFuer(a.land);
  const p = (k: PreisSchluessel) => preis(k, w);
  const ziel = (z: Ziel) => a.ziele.includes(z);
  const stufe = ermittleStufe(a);
  const massanfertigung = stufe === 'L' || stufe === 'XL';

  const positionen: Position[] = [];
  const hinweise: string[] = [];
  const weichen: Weiche[] = [];
  const markierungen: string[] = [];

  // Paket
  let paket: string;
  let paketBetrag: number;
  if (stufe === 'XL') {
    paket = 'Showcase (Maßanfertigung)';
    paketBetrag = p('showcaseAb');
    positionen.push({ label: paket, betrag: paketBetrag, ab: true, art: 'einmalig', hinweis: 'Preis nach dem Wertgespräch — orientiert an dem, was die Website für dich leisten soll.' });
  } else if (stufe === 'L') {
    paket = 'Plattform (Maßanfertigung)';
    paketBetrag = p('plattformAb');
    positionen.push({ label: paket, betrag: paketBetrag, ab: true, art: 'einmalig', hinweis: 'Preis nach dem Wertgespräch — orientiert an dem, was die Website für dich leisten soll.' });
  } else if (stufe === 'M' && a.sichtbarkeit !== 'lokal') {
    paket = 'Schlüsselfertig mit SEO-Ausbau';
    paketBetrag = p('schluesselfertigSeo');
    positionen.push({ label: paket, betrag: paketBetrag, art: 'einmalig', hinweis: 'Schlüsselfertig + Wettbewerbsanalyse, 6 statt 3 Startartikel, Search Console und Bing eingerichtet, Google-Unternehmensprofil optimiert, 3 Monate Ranking-Bericht.' });
  } else if (stufe === 'M') {
    paket = 'Schlüsselfertig';
    paketBetrag = p('schluesselfertig');
    positionen.push({ label: 'Schlüsselfertig', betrag: paketBetrag, art: 'einmalig', hinweis: 'Bis 12 Seiten, Blog mit Selbstpflege, 3 Startartikel, 1 Baustein nach Wahl, SEO/GEO-Standard.' });
  } else if (a.leistungen === '1-3') {
    paket = 'Fundament';
    paketBetrag = p('fundament');
    positionen.push({ label: 'Fundament', betrag: paketBetrag, art: 'einmalig', hinweis: '1–5 Seiten, Kontakt, Anfahrt, Öffnungszeiten, SEO/GEO-Standard.' });
  } else {
    paket = 'Rohbau';
    paketBetrag = p('rohbau');
    positionen.push({ label: 'Rohbau', betrag: paketBetrag, art: 'einmalig', hinweis: 'Bis 12 Seiten, eigene Seite je Leistung, Galerie, Anfrageformular, SEO/GEO-Standard.' });
  }
  if (a.leistungen === 'mehr' && !massanfertigung) {
    positionen.push({ label: 'Zusätzliche Leistungsseiten (über 12 Seiten)', betrag: null, art: 'einmalig', hinweis: 'Umfang klären wir im Angebot.' });
  }

  // Bausteine — in L/XL Teil der Maßanfertigung, in M ist einer im Paket enthalten
  let bausteinFrei = stufe === 'M';
  const baustein = (label: string, k: PreisSchluessel, hinweis?: string) => {
    if (massanfertigung) { positionen.push({ label, betrag: null, enthalten: true, art: 'einmalig', hinweis: 'Teil der Maßanfertigung.' }); return; }
    if (bausteinFrei) { bausteinFrei = false; positionen.push({ label, betrag: p(k), ab: true, enthalten: true, art: 'einmalig', hinweis: 'Im Paket Schlüsselfertig enthalten (1 Baustein nach Wahl).' }); return; }
    positionen.push({ label, betrag: p(k), ab: true, art: 'einmalig', hinweis });
  };
  // teuerster Baustein zuerst, damit der enthaltene den größten Wert hat
  if (ziel('verkaufen') && a.artikel === 'bis-50') baustein('Webshop-Einbindung (bis ~50 Artikel)', 'shopEinbindungAb', 'Produktdaten in deinem Repository, Zahlung über dein eigenes Konto beim Zahlungsdienst.');
  if (ziel('mitarbeiter')) baustein('Karriere-Website mit Stellenanzeigen', 'karriereAb', 'Stellen erscheinen kostenlos in Google for Jobs.');

  if (a.vorhaben === 'modernisieren') {
    if (massanfertigung) positionen.push({ label: 'Übernahme der bestehenden Website', betrag: null, enthalten: true, art: 'einmalig', hinweis: 'Teil der Maßanfertigung.' });
    else positionen.push({ label: 'Modernisierung: Inhalte übernehmen + Weiterleitungsplan', betrag: p('modernisierung'), art: 'einmalig', hinweis: 'Bis 30 Seiten. Alte Adressen werden umgeleitet, damit deine Google-Platzierungen erhalten bleiben.' });
    markierungen.push('Modernisierung');
  }
  const befreiung = a.vorhaben === 'zurueckholen' || a.zugaenge === 'nein' || a.zugaenge === 'unklar';
  if (befreiung) {
    positionen.push({ label: 'Befreiungs-Paket: Domain und Zugänge zurückholen', betrag: p('befreiungAb'), ab: true, enthalten: true, art: 'einmalig', hinweis: `Normalfall. Blockiert die bisherige Agentur, rechnen wir Mehraufwand mit ${formatBetrag(p('mehraufwandStunde'), w)} pro Stunde ab — rechtliche Durchsetzung übernimmt ein Anwalt, nicht wir. Wird bei Buchung eines Pakets angerechnet.` });
    markierungen.push('Befreiung nötig');
  }
  if (ziel('termine') && !massanfertigung) positionen.push({ label: 'Terminbuchung einrichten', betrag: null, art: 'einmalig', hinweis: 'Wir führen einen vorhandenen Buchungsdienst ein — Preis im Angebot.' });
  if (a.sprachen !== 'de') positionen.push({ label: a.sprachen === 'de-en' ? 'Zweite Sprache: Englisch' : 'Weitere Sprachen', betrag: null, enthalten: massanfertigung, art: 'einmalig', hinweis: massanfertigung ? 'Teil der Maßanfertigung.' : 'Preis je Sprache im Angebot.' });

  // Stückpreise (nicht in der Summe)
  if (ziel('verkaufen') && (a.artikelMaterial === 'fotos' || a.artikelMaterial === 'nichts')) {
    const wort = p('artikeltextWort');
    positionen.push({ label: 'Artikelbeschreibungen, SEO/GEO-optimiert', betrag: Math.round(wort * ARTIKELTEXT_WOERTER.min), stueckBis: Math.round(wort * ARTIKELTEXT_WOERTER.max), art: 'stueck', hinweis: `Je Artikel bei ${ARTIKELTEXT_WOERTER.min}–${ARTIKELTEXT_WOERTER.max} Wörtern (${formatBetrag(wort, w)} je Wort). KI-gestützt geschrieben, von einem Menschen geprüft.` });
  }
  if (ziel('verkaufen') && (a.artikelMaterial === 'texte' || a.artikelMaterial === 'nichts')) {
    hinweise.push('Produktfotos brauchst du selbst — wir bearbeiten echte Fotos (freistellen, Hintergrund, Größen), erfinden aber keine Produktbilder. Das wäre irreführend.');
    positionen.push({ label: 'Produktfotos bearbeiten', betrag: p('produktbildMin'), stueckBis: p('produktbildMax'), art: 'stueck', hinweis: 'Je Bild.' });
  }

  // Laufend
  const laufend: Position[] = [];
  let wartungMonat: number;
  if (a.betrieb === 'ihr-pflegt') {
    const plus = ziel('mitarbeiter') && a.stellen === 'mehr';
    wartungMonat = plus ? p('wartungPlus') : p('wartungStandard');
    laufend.push({ label: `Wartungsvertrag ${plus ? 'Plus' : 'Standard'}`, betrag: wartungMonat, art: 'monatlich',
      hinweis: plus ? 'Inkl. Google-Unternehmensprofil und 3 Inhaltsänderungen im Monat — passt zu vielen offenen Stellen.' : 'Inkl. Rechtstexte-Aktualisierung, Cookie-Scan, 1 Inhaltsänderung im Monat. Monatlich kündbar.' });
  } else {
    wartungMonat = p('wartungBasis');
    laufend.push({ label: 'Wartungsvertrag Basis (optional)', betrag: wartungMonat, art: 'monatlich', hinweis: 'Überwachung, Sicherheits-Updates, Monatsbericht. Monatlich kündbar.' });
  }
  if (a.sichtbarkeit === 'wachsen') {
    const gross = massanfertigung;
    laufend.push({ label: `Wachstums-Retainer ${gross ? '(4 Artikel/Monat)' : '(2 Artikel/Monat)'}`, betrag: gross ? p('wachstumGross') : p('wachstumKlein'), art: 'monatlich', hinweis: 'Laufend neue Inhalte + Bericht, ob KI-Antworten dich nennen. Keine Ranking-Garantie — die gibt seriös niemand.' });
  }

  // Summe einmalig
  const zaehlt = positionen.filter((x) => x.art === 'einmalig' && !x.enthalten);
  const summe = zaehlt.reduce((s, x) => s + (x.betrag ?? 0), 0);
  const ab = zaehlt.some((x) => x.ab);
  const offen = zaehlt.some((x) => x.betrag === null);

  // Mietkauf nur S/M (Konzept Abschnitt 5)
  const mietkauf = !massanfertigung && a.zahlung !== 'einmalig'
    ? { rate: mietkaufRate(summe, wartungMonat), monate: 24 }
    : null;

  // Zeitrahmen (Richtwert, ab vollständigen Unterlagen)
  const zeitrahmen = massanfertigung
    ? 'Nach dem Wertgespräch. Wir nehmen höchstens eine Maßanfertigung gleichzeitig an — ggf. mit Warteliste.'
    : stufe === 'M' ? 'In der Regel 3–6 Wochen ab vollständigen Unterlagen.' : 'In der Regel 2–4 Wochen ab vollständigen Unterlagen.';
  if (a.termin === '4-wochen' && (massanfertigung || (stufe === 'M' && a.vorhaben === 'modernisieren'))) {
    hinweise.push('4 Wochen sind für diesen Umfang knapp. Wir sagen dir im Angebot ehrlich, was bis dahin realistisch ist.');
  }

  const kundenaufwand = massanfertigung
    ? 'Wertgespräch (ca. 45 Min.), danach Abstimmungen je nach Umfang.'
    : 'Ca. 30 Minuten für das Onboarding-Formular, danach Abnahme mit höchstens zwei Korrekturschleifen.';

  // Hinweise
  if (!a.vorhanden.includes('fotos')) hinweise.push('Echte Fotos von dir, deinem Team und deiner Arbeit wirken stärker als jedes Stockfoto. Wenn du keine hast: Das klären wir vor dem Start.');
  if (!a.vorhanden.includes('texte')) hinweise.push('Keine Texte? Kein Problem — wir schreiben sie, SEO- und GEO-optimiert. Du lieferst nur die Fakten.');
  if (ziel('eindruck') && stufe !== 'XL') hinweise.push('Ein Aha-Effekt geht auch im kleineren Rahmen: Einzelne Showcase-Elemente sprechen wir im Angebot an.');
  if ((a.groesse === '10-49' || a.groesse === '50+') && a.land !== 'CH' && (ziel('verkaufen') || ziel('termine') || ziel('portal'))) {
    hinweise.push(`Verkaufst du über die Website an Verbraucher oder vergibst dort Termine, gelten für Betriebe ab 10 Beschäftigten voraussichtlich die Barrierefreiheitsanforderungen (${a.land === 'AT' ? 'BaFG' : 'BFSG'}). Wir planen das ein — die Einordnung deines Einzelfalls ist keine Rechtsberatung.`);
  }
  if (a.land !== 'DE') {
    hinweise.push(`Für ${a.land === 'AT' ? 'Österreich' : 'die Schweiz'} setzen wir die Rechtstexte nach Landesrecht auf. Den Starttermin nennen wir dir im Angebot.`);
    markierungen.push(`Land ${a.land}`);
  }
  if (a.branche === 'gastro') {
    hinweise.push('Speisekarte mit Allergenkennzeichnung bieten wir noch nicht als fertigen Baustein an. Sag uns im Angebot, was du brauchst.');
    markierungen.push('Gastro (Ideenkiste)');
  }
  if (a.branche === 'gesundheit') {
    hinweise.push('Für Gesundheitsberufe gelten besondere Werberegeln (z. B. Heilmittelwerbegesetz). Das berücksichtigen wir im Angebot.');
    markierungen.push('Gesundheit: Werberecht prüfen');
  }

  // Ehrliche Weichen
  if (a.betrieb === 'selbst-bauen') {
    weichen.push({ art: 'eigenregie', text: 'Du willst selbst bauen? Dann ist Eigenregie wahrscheinlich dein Weg: der Selbstlern-Kurs für deine eigene Website — mit denselben Werkzeugen, die wir nutzen. Die Diagnose zeigt dir in 3 Minuten, ob er zu dir passt.', href: EIGENREGIE_DIAGNOSE_URL });
  }
  if (a.betrieb === 'selbst-pflegen') {
    weichen.push({ art: 'coaching', text: `Du willst Inhalte selbst pflegen: Nach der Übergabe zeigen wir dir das im Personal-Coaching (Einheit ${formatBetrag(p('coachingEinheit'), w)}, einzeln buchbar).` });
  }
  const rahmenGrenze: Record<Rahmen, number> = { 'bis-1000': 1000, 'bis-3000': 3000, 'bis-10000': 10000, darueber: Infinity, unklar: Infinity };
  const grenze = rahmenGrenze[a.rahmen] * (w === 'CHF' ? 1.2 : 1);
  if (summe > grenze) {
    markierungen.push('Budget knapp');
    weichen.push({ art: 'budget', text: massanfertigung
      ? 'Dein Rahmen liegt unter dem Einstieg für eine Maßanfertigung. Ehrliche Alternative: mit einem Festangebot starten und später ausbauen — die Website gehört dir, nichts geht verloren.'
      : `Dein Rahmen ist knapper als der Umfang. Ehrliche Optionen: klein starten (Fundament) und später erweitern${mietkauf ? `, als Mietkauf ab ${formatBetrag(mietkauf.rate, w)} im Monat` : ''} — oder selbst bauen mit Eigenregie.`,
      href: massanfertigung ? undefined : EIGENREGIE_DIAGNOSE_URL });
  }
  if (a.freitext && RUND_UM_DIE_UHR.test(a.freitext)) {
    markierungen.push('Sonderwunsch: Erreichbarkeit');
    weichen.push({ art: 'ehrlich', text: 'Bereitschaft rund um die Uhr können wir als kleiner Betrieb nicht seriös zusagen. Kurze Wege und feste Antwortzeiten dagegen schon.' });
  }
  if (a.freitext?.trim()) markierungen.push('Freitext lesen');

  return {
    stufe,
    stufeName: STUFEN_NAME[stufe],
    paket,
    waehrung: w,
    positionen,
    laufend,
    einmalig: { betrag: summe, ab, offenePositionen: offen },
    mietkauf,
    laufendBeimKunden: massanfertigung ? LAUFEND_BEIM_KUNDEN.plattform : LAUFEND_BEIM_KUNDEN.statisch,
    zeitrahmen,
    kundenaufwand,
    hinweise,
    weichen,
    naechsterSchritt: massanfertigung ? 'wertgespraech' : 'angebot',
    markierungen,
  };
}

// ─── Projektakte für Uwe (Text für /api/kontakt, max. 5000 Zeichen) ──────────

const label = (key: keyof Antworten, wert: string): string =>
  FRAGEN.find((f) => f.key === key)?.optionen?.find((o) => o.wert === wert)?.label ?? wert;

export function projektakte(a: Antworten, e: Ergebnis, fmt: (n: number) => string): string {
  const z: string[] = [];
  z.push(`PROJEKT-ANAMNESE — Stufe ${e.stufe} (${e.paket})`);
  z.push(`Richtpreis einmalig: ${e.einmalig.ab ? 'ab ' : ''}${fmt(e.einmalig.betrag)}${e.einmalig.offenePositionen ? ' + Positionen im Angebot' : ''}`);
  if (e.mietkauf) z.push(`Mietkauf: ${fmt(e.mietkauf.rate)}/Monat × ${e.mietkauf.monate}`);
  z.push(`Nächster Schritt: ${e.naechsterSchritt === 'wertgespraech' ? 'Wertgespräch' : 'Angebot zum Festpreis'}`);
  if (e.markierungen.length) z.push(`Markierungen: ${e.markierungen.join(' · ')}`);
  const bemerkung = a.freitext?.trim();
  if (bemerkung) {
    z.push('');
    z.push('BEMERKUNGEN / WÜNSCHE DES KUNDEN');
    z.push(bemerkung.slice(0, FREITEXT_MAX));
  }
  z.push('');
  z.push('ANTWORTEN');
  for (const f of aktiveFragen(a)) {
    if (f.key === 'freitext') continue;
    const v = a[f.key];
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    const text = Array.isArray(v) ? v.map((x) => label(f.key, x)).join(', ') : f.art === 'eins' ? label(f.key, v) : String(v);
    z.push(`- ${f.frage} → ${text}`);
  }
  z.push('');
  z.push('POSITIONEN');
  for (const x of [...e.positionen, ...e.laufend]) {
    const b = x.betrag === null ? 'im Angebot' : x.art === 'stueck' ? `${fmt(x.betrag)}–${fmt(x.stueckBis ?? x.betrag)} je Stück` : `${x.ab ? 'ab ' : ''}${fmt(x.betrag)}${x.art === 'monatlich' ? '/Monat' : ''}`;
    z.push(`- ${x.label}: ${b}${x.enthalten ? ' (enthalten/angerechnet)' : ''}`);
  }
  return z.join('\n').slice(0, 4800);
}
