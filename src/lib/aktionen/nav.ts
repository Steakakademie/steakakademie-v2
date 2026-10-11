/**
 * Aktionsseiten im Menü und im Startseiten-Teaser (Uwe, 11.10.2026: „bau den Teaser und
 * den Menüpunkt").
 *
 * Der Header ist ein Client-Baustein und kann data/aktionen/*.yaml nicht lesen. Deshalb
 * steht hier eine kleine, client-sichere Liste: Slug, Adresse, Menüname und Fenster.
 * Sie MUSS zu den YAML-Dateien passen — der Test src/__tests__/aktionen.test.ts
 * vergleicht beide und wird rot, wenn eine Seite hier fehlt oder ein Fenster abweicht.
 * Neue Aktionsseite = YAML anlegen UND hier eine Zeile ergänzen.
 */
import { heuteMMTT, imFenster, type Fenster } from './fenster';

export interface AktionNav {
  slug: string;
  /** Adresse der Seite — kurze Adresse, wo es eine gibt. */
  url: string;
  /** Menüname, kurz. */
  label: string;
  fenster: Fenster;
}

/** Kurze Adressen: /aktionen/<slug> leitet dauerhaft dorthin (src/app/aktionen/[slug]/page.tsx). */
export const KURZE_ADRESSE: Record<string, string> = { geschenke: '/geschenke' };

export function aktionUrl(slug: string): string {
  return KURZE_ADRESSE[slug] ?? `/aktionen/${slug}`;
}

export const AKTIONEN_NAV: readonly AktionNav[] = [
  { slug: 'geschenke', url: aktionUrl('geschenke'), label: 'Geschenke', fenster: { von: '11-02', bis: '12-24' } },
  { slug: 'weihnachtsmenue', url: aktionUrl('weihnachtsmenue'), label: 'Weihnachtsmenü', fenster: { von: '11-15', bis: '12-24' } },
];

/** Aktionsseiten, deren Fenster gerade läuft — in der Reihenfolge der Liste. */
export function aktiveAktionenNav(jetzt: Date = new Date(), liste: readonly AktionNav[] = AKTIONEN_NAV): AktionNav[] {
  const heute = heuteMMTT(jetzt);
  return liste.filter((a) => imFenster(a.fenster, heute));
}
