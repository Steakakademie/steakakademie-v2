/**
 * Website-Baukasten — die EINE Preisliste (KONZEPT-Website-Baukasten-2026-09-25, Abschnitte 5–7).
 * Von Uwe freigegeben am 25.09.2026, nach dem Marktpreis-Check NRW angepasst am 26.09.2026
 * (claude/marktpreise_nrw_baukasten_2026-09-26.md). Regel für L/XL: höchstens 15 % unter
 * der Markt-Untergrenze — abgesichert im Test.
 *
 * Anamnese, später Konfigurator, Angebotsseiten und Anfrage-Assistent lesen
 * ausschließlich von hier. Eine zweite Preistabelle irgendwo im Code wäre der
 * Anfang von zwei Wahrheiten.
 *
 * Alle Preise sind Richtpreise für Unternehmer (B2B). Umsatzsteuer-Angaben
 * stehen im verbindlichen Angebot (Status mit der Steuerberaterin offen).
 */

export type Land = 'DE' | 'AT' | 'CH';
export type Waehrung = 'EUR' | 'CHF';

export const waehrungFuer = (land: Land): Waehrung => (land === 'CH' ? 'CHF' : 'EUR');

/** Verhältnis der festgelegten CHF-Preise zu den EUR-Preisen (Konzept Abschnitt 7). */
export const CHF_FAKTOR = 1.2;

type Preis = { eur: number; chf?: number };

/** CHF: fest hinterlegt, sonst EUR × 1,2 auf volle 10 gerundet (Stückpreise auf volle Franken, Wortpreise auf Rappen). */
export function betrag(p: Preis, w: Waehrung): number {
  if (w === 'EUR') return p.eur;
  if (p.chf !== undefined) return p.chf;
  const roh = p.eur * CHF_FAKTOR;
  if (p.eur < 1) return Math.round(roh * 100) / 100;
  return p.eur < 50 ? Math.round(roh) : Math.round(roh / 10) * 10;
}

export const PREISE = {
  // Pakete (Festangebote S/M)
  fundament: { eur: 990, chf: 1190 },
  rohbau: { eur: 1990, chf: 2390 },
  schluesselfertig: { eur: 3490, chf: 4190 },
  /** Schlüsselfertig + SEO-Ausbau (SEO/GEO-Grundstufe bleibt in jedem Paket enthalten). */
  schluesselfertigSeo: { eur: 4250, chf: 5100 },
  // Maßanfertigung (L/XL) — Untergrenzen, Preis wertbasiert
  plattformAb: { eur: 9900, chf: 11900 },
  showcaseAb: { eur: 17000, chf: 20400 },
  // Bausteine
  modernisierung: { eur: 390 },
  befreiungAb: { eur: 490 },
  /** Mehraufwand über den Normalfall hinaus (z. B. Befreiung, wenn die Altagentur blockiert). */
  mehraufwandStunde: { eur: 95 },
  karriereAb: { eur: 790 },
  shopEinbindungAb: { eur: 1650 },
  /** Artikelbeschreibung: Preis je Wort, KI-gestützt mit menschlicher Endkontrolle. */
  artikeltextWort: { eur: 0.27 },
  produktbildMin: { eur: 3 },
  produktbildMax: { eur: 6 },
  // Laufend
  wartungBasis: { eur: 49, chf: 59 },
  wartungStandard: { eur: 79, chf: 95 },
  wartungPlus: { eur: 129, chf: 155 },
  wachstumKlein: { eur: 490 },
  wachstumGross: { eur: 890 },
  // Personal-Coaching (Eigenregie-Konzept 2b, freigegeben 09.09.2026)
  coachingEinheit: { eur: 129 },
} as const satisfies Record<string, Preis>;

export type PreisSchluessel = keyof typeof PREISE;

/** Übliche Länge einer Artikelbeschreibung — Grundlage der Stückpreis-Spanne in der Anamnese. */
export const ARTIKELTEXT_WOERTER = { min: 100, max: 200 } as const;

export const preis = (k: PreisSchluessel, w: Waehrung): number => betrag(PREISE[k], w);

/** Mietkauf (Konzept Abschnitt 5): (Einmalbetrag × 1,08) ÷ 24 + Wartungsvertrag. Nur B2B, nur S/M. */
export const MIETKAUF = { aufschlag: 0.08, monate: 24 } as const;

export function mietkaufRate(einmalig: number, wartungMonat: number): number {
  return Math.round((einmalig * (1 + MIETKAUF.aufschlag)) / MIETKAUF.monate) + wartungMonat;
}

/** Laufende Kosten im eigenen Konto des Kunden (geprüft 25.09.2026, Anbieterpreise in US-Dollar). */
export const LAUFEND_BEIM_KUNDEN = {
  statisch: '0 € Hosting (nur die Domain, bei deinem Registrar)',
  plattform: 'ca. 30–45 US-$ im Monat (Datenbank + Hosting in deinen eigenen Konten)',
} as const;

export function formatBetrag(n: number, w: Waehrung): string {
  if (w === 'CHF') {
    // Schweizer Schreibweise: Apostroph als Tausendertrenner
    return `CHF ${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '’')}`;
  }
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: n % 1 ? 2 : 0 })} €`;
}
