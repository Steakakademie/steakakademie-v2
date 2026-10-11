import { aktiveAktionen } from '@/lib/aktionen';
import { aktionUrl } from '@/lib/aktionen/nav';
import AktionsTeaserKarten from './AktionsTeaserKarten';
import AktionsTeaserVorschau from './AktionsTeaserVorschau';

/**
 * Aktions-Teaser der Startseite (Uwe, 11.10.2026: „bau den Teaser und den Menüpunkt").
 *
 * Steht unter dem Gutschein-Teaser (Startseiten-Hierarchie: Angebote nie oben,
 * CLAUDE.md Regel 8, Marker AKTIONS-TEASER) und erscheint nur, solange mindestens
 * eine Aktionsseite in ihrem Saisonfenster ist (data/aktionen/*.yaml). Die Startseite
 * wird stündlich neu gerendert (revalidate 3600), das Fenster greift also ohne Deploy.
 * Keine Preise, kein Countdown — nur Thema und Weg dorthin.
 *
 * Außerhalb des Fensters rendert der Server nichts; stattdessen sitzt hier die
 * Client-Vorschau, die nur mit dem Schalter `?vorschau=1` etwas zeigt.
 */
export default function AktionsTeaser() {
  const aktionen = aktiveAktionen();
  if (aktionen.length === 0) return <AktionsTeaserVorschau />;
  return (
    <AktionsTeaserKarten
      eintraege={aktionen.map((a) => ({ slug: a.slug, href: aktionUrl(a.slug), titel: a.titel, untertitel: a.untertitel }))}
    />
  );
}
