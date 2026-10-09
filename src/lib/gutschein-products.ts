// Verschenkbare Produkte (produktspezifische Geschenkgutscheine).
// Nur Produkte, die über redeem_voucher einlösbar sind: Kurs-Zugang
// (grant_course_access) oder Diagnose-Guthaben (grant_diagnose_credits).
// checkoutUrl = Digistore24-Checkout der "Geschenkgutschein"-Produktvariante;
// fehlt sie (env nicht gesetzt) → CTA zeigt „In Vorbereitung".
//
// Uwe-Schritte je Produkt: docs/weihnachts-gutschein-checkliste.md —
// (1) Digistore24-Gutscheinprodukt an der IPN-Anbindung 352984 anlegen,
// (2) NEXT_PUBLIC_DS_VOUCHER_* env setzen, (3) in digistore_products mappen
// (ds_product_id → course_id, is_voucher=true, bei Credits voucher_credit_amount).
//
// Steak-Beichte = Credit-Gutschein (kind='credit'): das Digistore-Produkt mappt
// auf den steak-beichte-Course mit voucher_credit_amount=N → redeem_voucher ruft
// grant_diagnose_credits statt grant_course_access. Der 5er hat ein eigenes
// Digistore-Produkt mit voucher_credit_amount=5 (Sortiment Uwe, 09.10.2026).
//
// Grillmeister-Diplom (Sortiment Uwe, 09.10.2026): erscheint erst, wenn
// Checkout UND Preis gesetzt sind (`nurMitCheckout`). Ein Gutschein auf ein
// Produkt, das man selbst noch nicht kaufen kann, gehört nicht ins Regal —
// und ein geratener Preis auch nicht.
//
// ENTFERNT 09.09.2026: BBQ-Grundkurs (79 €). Der Kurs ist eingestellt — Stufe 1
// des Diploms deckt seinen Stoff seit dem neuen Rahmenlehrplan kostenlos ab.
// Ein Geschenkgutschein auf ein Produkt, das es nicht mehr gibt, wäre der
// schlimmste Fall dieser Liste: Der Schenkende zahlt, der Beschenkte kann nichts
// einlösen.
//
// Freie Wertgutscheine (25/50/75/100 €) stehen bewusst NICHT hier: Sie brauchen
// ein Guthaben-Modell und die Antwort der Kanzlei zur Umsatzsteuer
// (docs/gutschein-konzept-weihnachten-2026.md, T9).

export interface GiftableProduct {
  /** Eindeutiger Schlüssel der Karte — ein Kurs kann mehrere Gutscheine haben. */
  key: string;
  courseSlug: string;
  title: string;
  priceLabel?: string;
  blurb: string;
  checkoutUrl?: string;
  /** Karte nur zeigen, wenn Checkout und Preis gesetzt sind (nicht als „In Vorbereitung"). */
  nurMitCheckout?: boolean;
}

export const GIFTABLE_PRODUCTS: GiftableProduct[] = [
  {
    key: 'mein-protokoll',
    courseSlug: 'mein-protokoll',
    title: 'Mein Protokoll',
    priceLabel: '19 €',
    blurb: 'Ein persönlicher 8-Wochen-Grillplan — Cuts, Techniken und Progression, abgestimmt auf Setup und Ziel.',
    checkoutUrl: process.env.NEXT_PUBLIC_DS_VOUCHER_MEIN_PROTOKOLL,
  },
  {
    key: 'steak-beichte',
    courseSlug: 'steak-beichte',
    title: 'Steak-Beichte',
    priceLabel: '7 €',
    blurb: 'Die KI-Diagnose fürs misslungene Steak: Ergebnis beschreiben oder fotografieren, Analyse + Korrektur-Protokoll erhalten.',
    checkoutUrl: process.env.NEXT_PUBLIC_DS_VOUCHER_STEAK_BEICHTE,
  },
  {
    key: 'steak-beichte-5er',
    courseSlug: 'steak-beichte',
    title: 'Steak-Beichte 5er',
    priceLabel: '25 €',
    blurb: 'Fünf Diagnosen zum Verschenken — für alle, die öfter grillen, als ihnen jedes Steak gelingt.',
    checkoutUrl: process.env.NEXT_PUBLIC_DS_VOUCHER_STEAK_BEICHTE_5ER,
  },
  {
    key: 'grillmeister-diplom',
    courseSlug: 'grillmeister-diplom',
    title: 'Grillmeister-Diplom',
    priceLabel: process.env.NEXT_PUBLIC_DS_VOUCHER_DIPLOM_PREIS,
    blurb: 'Stufe 2 bis 5 der Grillmeister-Ausbildung — Lektionen und Prüfungen bis zur Meisterklasse.',
    checkoutUrl: process.env.NEXT_PUBLIC_DS_VOUCHER_DIPLOM,
    nurMitCheckout: true,
  },
];

/**
 * Gutschein-Code in der Form, in der er in `vouchers.code` steht — dieselbe
 * Normalisierung wie redeem_voucher (trim, Leerzeichen raus, Großbuchstaben).
 * Dient auch als Referenz der Mein-Protokoll-Gutschrift.
 */
export function kanonischerCode(code: string): string {
  return code.trim().replace(/ /g, '').toUpperCase();
}

/** Karten für /gutschein: alles außer Einträgen, die erst mit Checkout erscheinen dürfen. */
export function sichtbareGutscheine(liste: GiftableProduct[] = GIFTABLE_PRODUCTS): GiftableProduct[] {
  return liste.filter((p) => !p.nurMitCheckout || (p.checkoutUrl && p.priceLabel));
}

/** Gutscheine, die gerade wirklich gekauft werden können. */
export function kaufbareGutscheine(liste: GiftableProduct[] = GIFTABLE_PRODUCTS): GiftableProduct[] {
  return sichtbareGutscheine(liste).filter((p) => Boolean(p.checkoutUrl));
}

/** Gibt es für diesen Kurs mindestens einen kaufbaren Gutschein? */
export function gutscheinKaufbar(courseSlug: string, liste: GiftableProduct[] = GIFTABLE_PRODUCTS): boolean {
  return kaufbareGutscheine(liste).some((p) => p.courseSlug === courseSlug);
}

/**
 * Geschenk-Saison: 1. November bis einschließlich 24. Dezember (Verkaufsstart
 * mit der Gewerbeanmeldung am 01.11.2026). Gerechnet in deutscher Zeit, damit
 * der Hinweis nicht um Mitternacht UTC kippt.
 */
export function istGeschenkSaison(jetzt: Date = new Date()): boolean {
  const teile = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', month: 'numeric', day: 'numeric' })
    .formatToParts(jetzt);
  const monat = Number(teile.find((t) => t.type === 'month')?.value);
  const tag = Number(teile.find((t) => t.type === 'day')?.value);
  return monat === 11 || (monat === 12 && tag <= 24);
}
