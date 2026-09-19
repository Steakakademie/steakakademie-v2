/**
 * Eigenregie — Diagnose „Dein Weg“ (KONZEPT Abschnitt 4 + 7).
 * Reiner Entscheidungsbaum: keine KI, keine laufenden Kosten, keine Datenübertragung.
 * Die Antworten bleiben im Browser des Nutzers.
 */

export type Ziel = 'kunden' | 'verkaufen' | 'wissen' | 'referenz';
export type Heute = 'nichts' | 'wordpress' | 'baukasten' | 'ohne-zugriff';
export type Zugaenge = 'ja' | 'teilweise' | 'nein' | 'unklar';
export type Zeit = 'unter-2' | '2-5' | '5-10' | 'vollzeit';
export type Technik = 'keine' | 'office' | 'html' | 'entwickler';
export type Gewerbe = 'ja' | 'nein' | 'in-arbeit';

export type Antworten = {
  ziel: Ziel;
  heute: Heute;
  zugaenge: Zugaenge;
  zeit: Zeit;
  technik: Technik;
  gewerbe: Gewerbe;
  /** heutige monatliche Kosten für Website, Wartung, Hosting in € */
  kostenHeute: number;
  idee: string;
};

export type Schritt = { modul: number; titel: string; stunden: number; hinweis?: string };
export type Weiche = { art: 'gruendung' | 'begleitung' | 'rueckholung' | 'shop' | 'fertig'; text: string; href?: string };

export type Weg = {
  schritte: Schritt[];
  stundenGesamt: number;
  wochen: number;
  stundenProWoche: number;
  werkzeuge: { name: string; kosten: string; hinweis: string }[];
  neueKostenMonat: { min: number; max: number };
  amortisation: { monate: number | null; text: string };
  weichen: Weiche[];
};

export const MODUL_TITEL: Record<number, string> = {
  1: 'Ownership: Konten, Domain, Repository',
  2: 'Migration in ein eigenes Projekt',
  3: 'Live gehen ohne Ausfall',
  4: 'Claude Code als dauerhaftes Werkzeug',
  5: 'Rechtssichere Basis',
  6: 'Übergabe an dich selbst',
};

const STUNDEN_PRO_WOCHE: Record<Zeit, number> = { 'unter-2': 1.5, '2-5': 3.5, '5-10': 7.5, vollzeit: 20 };
const TECHNIK_FAKTOR: Record<Technik, number> = { keine: 1.5, office: 1.2, html: 1.0, entwickler: 0.7 };

/** Grundaufwand je Modul in Stunden für einen typischen Auftritt (5–15 Seiten). */
function grundaufwand(m: number, a: Antworten): number {
  switch (m) {
    case 1: return a.zugaenge === 'ja' ? 1.5 : 3;
    case 2: return a.heute === 'nichts' ? 3 : a.heute === 'ohne-zugriff' ? 7 : 5;
    case 3: return 3;
    case 4: return 3;
    case 5: return a.ziel === 'verkaufen' ? 4 : 2;
    case 6: return 2;
    default: return 0;
  }
}

function reihenfolge(a: Antworten): number[] {
  // Wer verkauft, klärt die Rechtspflichten vor dem Livegang.
  return a.ziel === 'verkaufen' ? [1, 2, 5, 3, 4, 6] : [1, 2, 3, 4, 5, 6];
}

function hinweis(m: number, a: Antworten): string | undefined {
  if (m === 1 && (a.zugaenge === 'nein' || a.zugaenge === 'unklar'))
    return 'Zuerst: Zugänge zurückholen. Plane Wartezeit ein — eine Agentur hat für Antworten oft mehrere Tage.';
  if (m === 2 && a.heute === 'nichts') return 'Bei dir ist das ein Neuaufbau statt einer Migration — die Inventur fällt kurz aus.';
  if (m === 2 && a.heute === 'baukasten') return 'Baukästen exportieren oft keinen Code. Du übernimmst Texte, Bilder und die URL-Liste.';
  if (m === 2 && a.heute === 'ohne-zugriff') return 'Ohne Zugriff übernimmst du die Inhalte von der sichtbaren Seite — das dauert länger.';
  if (m === 5 && a.ziel === 'verkaufen') return 'Du verkaufst über die Seite: Widerruf, Preisangaben und Zahlungsdienst gehören vor den Livegang.';
  return undefined;
}

/** Neue laufende Kosten in €/Monat (Stand 09/2026, Preise der Anbieter in US-Dollar, gerundet). */
export const KOSTEN = {
  claudePro: 20,
  hostingMin: 0, // Netlify Free (gewerblich erlaubt, Kontingent begrenzt)
  hostingMax: 20, // Vercel Pro (Hobby ist nur für private, nicht gewerbliche Nutzung)
};

export function berechneWeg(a: Antworten, kurspreis: number): Weg {
  const faktor = TECHNIK_FAKTOR[a.technik];
  const schritte: Schritt[] = reihenfolge(a).map((m) => ({
    modul: m,
    titel: MODUL_TITEL[m],
    stunden: Math.round(grundaufwand(m, a) * faktor * 2) / 2,
    hinweis: hinweis(m, a),
  }));
  const stundenGesamt = schritte.reduce((s, x) => s + x.stunden, 0);
  const stundenProWoche = STUNDEN_PRO_WOCHE[a.zeit];
  const wochen = Math.max(1, Math.ceil(stundenGesamt / stundenProWoche));

  const neueKostenMonat = { min: KOSTEN.claudePro + KOSTEN.hostingMin, max: KOSTEN.claudePro + KOSTEN.hostingMax };
  const ersparnis = Math.round(a.kostenHeute) - neueKostenMonat.max;
  let amortisation: Weg['amortisation'];
  if (!Number.isFinite(a.kostenHeute) || a.kostenHeute <= 0) {
    amortisation = { monate: null, text: 'Du zahlst heute nichts Laufendes — Eigenregie lohnt sich für dich über Kontrolle und Tempo, nicht über gesparte Gebühren.' };
  } else if (ersparnis <= 0) {
    amortisation = { monate: null, text: `Deine heutigen ${Math.round(a.kostenHeute)} €/Monat liegen im Bereich der neuen Werkzeugkosten. Der Gewinn ist Kontrolle, nicht Ersparnis.` };
  } else {
    const monate = Math.ceil(kurspreis / ersparnis);
    amortisation = {
      monate,
      text: `Du zahlst heute ${Math.round(a.kostenHeute)} €/Monat. Abzüglich der neuen Werkzeugkosten (bis ${neueKostenMonat.max} €) sparst du rund ${ersparnis} € im Monat — der Kurs hat sich nach etwa ${monate} Monat${monate === 1 ? '' : 'en'} getragen.`,
    };
  }

  const weichen: Weiche[] = [];
  if (a.gewerbe === 'nein')
    weichen.push({ art: 'gruendung', text: 'Du hast noch kein Gewerbe angemeldet. Kläre zuerst die Gründung — eine Website ohne Gewerbe kann rechtlich nicht sauber betrieben werden.', href: '/gruender-schmiede' });
  if (a.zugaenge === 'nein' || a.zugaenge === 'unklar')
    weichen.push({ art: 'rueckholung', text: 'Deine Zugänge liegen nicht (sicher) bei dir. Modul 1 zuerst und vollständig — alles Weitere baut darauf auf.' });
  if (a.zeit === 'unter-2' && (a.technik === 'keine' || a.technik === 'office'))
    weichen.push({ art: 'begleitung', text: `Mit unter 2 Stunden pro Woche und wenig Technik-Erfahrung brauchst du rund ${wochen} Wochen. Ehrlich: Mit punktueller Begleitung kommst du deutlich schneller ans Ziel — oder du startest, wenn mehr Zeit frei ist.` });
  if (a.ziel === 'verkaufen')
    weichen.push({ art: 'shop', text: 'Eigenregie deckt Unternehmensseiten mit einfachem Verkauf über einen Zahlungsdienst (z. B. Digistore24, Stripe-Link). Ein vollwertiger Shop mit Warenwirtschaft ist nicht Teil des Kurses.' });
  if (weichen.length === 0) weichen.push({ art: 'fertig', text: 'Deine Ausgangslage passt gut zu Eigenregie. Du kannst direkt mit Modul 1 starten.' });

  return {
    schritte,
    stundenGesamt,
    wochen,
    stundenProWoche,
    werkzeuge: [
      { name: 'GitHub', kosten: '0 €', hinweis: 'Code-Ablage in deinem Besitz (Free-Tarif reicht).' },
      { name: 'Node.js + Editor (VS Code)', kosten: '0 €', hinweis: 'Werkzeuge auf deinem Rechner.' },
      { name: 'Claude Pro (für Claude Code)', kosten: `ca. ${KOSTEN.claudePro} €/Monat`, hinweis: 'Pflicht — der Gratis-Tarif enthält Claude Code nicht. Preis in US-Dollar, Stand 09/2026.' },
      { name: 'Hosting: Netlify Free oder Vercel Pro', kosten: `0–${KOSTEN.hostingMax} €/Monat`, hinweis: 'Vercel Hobby ist nur für private Seiten erlaubt. Netlify Free ist gewerblich nutzbar, aber im Kontingent begrenzt.' },
      { name: 'Cloudflare (DNS)', kosten: '0 €', hinweis: 'Free-Tarif.' },
      { name: 'Bitwarden (Passwörter)', kosten: '0 €', hinweis: 'Free-Tarif.' },
    ],
    neueKostenMonat,
    amortisation,
    weichen,
  };
}
