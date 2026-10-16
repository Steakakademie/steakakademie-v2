/**
 * Grillmeister-Diplom — Kaufweg (vorbereitet 16.10.2026, CLAUDE.md §5 Blocker 3).
 *
 * Stand: Es gibt noch KEIN Digistore-Produkt fuer das Diplom. Der Kurs
 * `grillmeister-diplom` existiert in der DB (unveroeffentlicht), der Webhook kennt
 * die Weiterleitung nach /diplome/roadmap, die Lektionsseiten pruefen die Buchung —
 * nur der Weg vom Besucher zur Kasse fehlte.
 *
 * Diese Datei ist die EINE Stelle dafuer. Sie liest zwei Variablen:
 *   NEXT_PUBLIC_DS_DIPLOM_PRODUCT_ID   Digistore-Produkt-ID (nur Ziffern)
 *   NEXT_PUBLIC_DS_DIPLOM_PREIS        Preis, wie er auf der Seite stehen soll
 * Fehlt eine, ist das Diplom NICHT kaufbar und keine Seite zeigt Preis oder
 * Kauf-Button (Entscheidung 03.10.2026: kein Datum, kein Preis, bis beides steht).
 * Variablen setzen = Vercel-Projekt (Production + Preview) + Redeploy; dieselbe
 * Mechanik wie bei den Gutscheinen (src/lib/gutschein-products.ts).
 *
 * Die Freischaltung nach dem Kauf laeuft NICHT ueber diese Datei, sondern ueber
 * den Webhook und die Tabelle digistore_products. Beides zusammen beschreibt
 * docs/digistore-diplom-anbindung.md.
 *
 * Reine Daten, keine Server-Abhaengigkeit — auch aus Client-Komponenten importierbar.
 */

/** Ziel der Dankeseiten-URL im Digistore-Produkt. */
export const DIPLOM_DANKE_PFAD = '/danke/diplom';

export type DiplomAngebot =
  | { kaufbar: true; produktId: string; checkoutUrl: string; preisLabel: string }
  | { kaufbar: false; grund: 'kein-produkt' | 'kein-preis' };

/** Produkt-IDs bei Digistore sind reine Ziffernfolgen (z. B. 695900, 746579). */
const PRODUKT_ID = /^\d{5,8}$/;

export function checkoutUrlFuer(produktId: string): string {
  return `https://www.checkout-ds24.com/product/${produktId}`;
}

/** „99" oder „99,00" → „99 €"; alles andere (z. B. „99 € statt 149 €") bleibt, wie es ist. */
export function preisLabelAus(preis: string): string {
  const p = preis.trim();
  const zahl = p.match(/^(\d+)(?:[.,](\d{1,2}))?$/);
  if (!zahl) return p;
  const cents = zahl[2] ? zahl[2].padEnd(2, '0') : '';
  return cents && cents !== '00' ? `${zahl[1]},${cents} €` : `${zahl[1]} €`;
}

export function diplomAngebotAus(env: { produktId?: string | null; preis?: string | null }): DiplomAngebot {
  const id = env.produktId?.trim() ?? '';
  if (!PRODUKT_ID.test(id)) return { kaufbar: false, grund: 'kein-produkt' };
  const preis = env.preis?.trim() ?? '';
  if (!preis) return { kaufbar: false, grund: 'kein-preis' };
  return { kaufbar: true, produktId: id, checkoutUrl: checkoutUrlFuer(id), preisLabel: preisLabelAus(preis) };
}

/** Angebot aus der Build-Umgebung — NEXT_PUBLIC_* wird zur Bauzeit eingesetzt. */
export function diplomAngebot(): DiplomAngebot {
  return diplomAngebotAus({
    produktId: process.env.NEXT_PUBLIC_DS_DIPLOM_PRODUCT_ID,
    preis: process.env.NEXT_PUBLIC_DS_DIPLOM_PREIS,
  });
}
