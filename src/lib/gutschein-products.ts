// Verschenkbare Produkte (produktspezifische Geschenkgutscheine).
// Nur kurs-basierte Produkte, die über grant_course_access einlösbar sind.
// checkoutUrl = Digistore24-Checkout der "Geschenkgutschein"-Produktvariante;
// fehlt sie (env nicht gesetzt) → CTA zeigt „In Vorbereitung".
//
// Uwe-Schritte je Produkt: (1) Digistore24 Gutschein-Produkt anlegen,
// (2) NEXT_PUBLIC_DS_VOUCHER_* env setzen, (3) in digistore_products mappen
// (ds_product_id → course_id, is_voucher=true).
//
// Steak-Beichte = Credit-Gutschein (kind='credit'): das Digistore-Produkt mappt
// auf den steak-beichte-Course mit voucher_credit_amount=N → redeem_voucher ruft
// grant_diagnose_credits statt grant_course_access.
//
// NICHT enthalten (Nachzügler): Diplom (noch nicht monetarisiert).
//
// ENTFERNT 09.09.2026: BBQ-Grundkurs (79 €). Der Kurs ist eingestellt — Stufe 1
// des Diploms deckt seinen Stoff seit dem neuen Rahmenlehrplan kostenlos ab.
// Ein Geschenkgutschein auf ein Produkt, das es nicht mehr gibt, wäre der
// schlimmste Fall dieser Liste: Der Schenkende zahlt, der Beschenkte kann nichts
// einlösen. Deshalb raus, bevor die Gutscheine live gehen.
//
// Was dadurch offen bleibt: Das Weihnachtsgeschäft hat jetzt nur noch 19 € und
// 7 € im Regal. Der Ersatz ist ein Gutschein auf das Diplom — der gehört hier
// hinein, sobald das Diplom monetarisiert ist.

export interface GiftableProduct {
  courseSlug: string;
  title: string;
  priceLabel: string;
  blurb: string;
  checkoutUrl?: string;
}

export const GIFTABLE_PRODUCTS: GiftableProduct[] = [
  {
    courseSlug: 'mein-protokoll',
    title: 'Mein Protokoll',
    priceLabel: '19 €',
    blurb: 'Ein persönlicher 8-Wochen-Grillplan — Cuts, Techniken und Progression, abgestimmt auf Setup und Ziel.',
    checkoutUrl: process.env.NEXT_PUBLIC_DS_VOUCHER_MEIN_PROTOKOLL,
  },
  {
    courseSlug: 'steak-beichte',
    title: 'Steak-Beichte',
    priceLabel: '7 €',
    blurb: 'Die KI-Diagnose fürs misslungene Steak: Ergebnis beschreiben oder fotografieren, Analyse + Korrektur-Protokoll erhalten.',
    checkoutUrl: process.env.NEXT_PUBLIC_DS_VOUCHER_STEAK_BEICHTE,
  },
];
