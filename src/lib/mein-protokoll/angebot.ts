/**
 * Mein Protokoll — Verkaufsschalter und Checkout-Ziel.
 *
 * Verkauf erst ab Gewerbeanmeldung und Jobcenter-Zustimmung (Uwe, 27.09.2026);
 * geplant ist der 01.11.2026. Der Start hängt an einem Bescheid, nicht am
 * Kalender — deshalb ein ausdrücklicher Schalter statt eines Datumsvergleichs:
 *
 *   Vercel-Env NEXT_PUBLIC_MEIN_PROTOKOLL_VERKAUF=an (alle Umgebungen) + Redeploy.
 *
 * Ohne den Schalter zeigt die Verkaufsseite Preise und Leistung, aber keinen
 * Link in den Checkout. Gleiches Muster wie NEXT_PUBLIC_EIGENREGIE_VERKAUF.
 *
 * Ein Digistore-Produkt (696396) mit zwei Preisplänen (19 € / 29 €). Der Link
 * führt auf das Bestellformular; die Paketwahl trifft der Käufer dort. Ob sich
 * ein Preisplan per URL vorwählen lässt, ist nicht geprüft — deshalb EIN Link.
 */
export const DS_PRODUCT_ID = '696396';
export const CHECKOUT_URL = `https://www.checkout-ds24.com/product/${DS_PRODUCT_ID}`;
export const VERKAUF_AN = process.env.NEXT_PUBLIC_MEIN_PROTOKOLL_VERKAUF === 'an';
export const VERKAUFSSTART_TEXT = '1. November 2026';
