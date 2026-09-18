/**
 * Lernkarten je Stufe — bewusst getrennt von der Fragenbank (fragen.ts, server-only):
 * Karten duerfen in den Browser, Pruefungsloesungen nicht. Ausgelagert am 08.09.2026.
 * Temperaturen folgen data/kerntemperatur-referenz.yaml (Regel 8c).
 */
import type { StufeKey } from './stufen';

export type Flashcard = { front: string; back: string };

export const FLASHCARDS: Record<StufeKey, readonly Flashcard[]> = {
  bronze: [
    { front: 'Direkte Hitze',          back: '230–290 °C · Kruste, schnelles Anbraten' },
    { front: 'Indirekte Hitze',        back: '150–180 °C · schonend durchgaren, große Stücke & Geflügel' },
    { front: 'Aschefilm',              back: 'Grauer Belag = Kohle ist bereit, gleichmäßige Glut' },
    { front: 'Maillard-Reaktion',      back: 'Bräunung & Aromen · startet ab ~140 °C' },
    { front: 'Reverse Sear',           back: 'Erst niedrig garen, dann kurz scharf für Kruste' },
    { front: 'Deckel zu',              back: 'Erstickt Aufflackern, hält Temperatur konstant' },
    { front: 'Abstand Rost zu Kohle',  back: '10–15 cm · Standard für gleichmäßiges Garen' },
    { front: 'Salz-Timing',            back: 'Direkt vor dem Grillen oder ≥ 40 Min davor' },
  ],
  anatomie: [
    { front: 'Ribeye',       back: 'Hohe Rippe · direkt grillen, medium rare' },
    { front: 'Brisket',      back: 'Rinderbrust · Low & Slow, 12–16 h smoken' },
    { front: 'Onglet',       back: 'Zwerchfellpfeiler · scharf anbraten, rare bis medium rare' },
    { front: 'Tomahawk',     back: 'Ribeye mit langem Knochen · Reverse Sear, ~600 g pro Person' },
    { front: 'Picanha',      back: 'Tafelspitz (Sirloin Cap) · BR-BBQ, mit Fettkappe' },
    { front: 'Flank Steak',  back: 'Bauchlappen · marinieren, quer zur Faser schneiden' },
    { front: 'Hanger Steak', back: 'Onglet-Verwandter · hängt am Zwerchfell, intensiv im Geschmack' },
    { front: 'Wagyu A5',     back: 'Japan-Top · BMS 8–12, sehr dünn aufgeschnitten kurz braten' },
  ],
  thermometer: [
    { front: 'Rind rare',         back: '45–49 °C · roter Kern, weich' },
    { front: 'Rind medium rare',  back: '52–55 °C · rosa Kern, saftig — Standard 54 °C (bei 50–51 °C ziehen)' },
    { front: 'Rind medium',       back: '55–60 °C · rosa-grau, fester' },
    { front: 'Rind well done',    back: '70+ °C · durch, deutlicher Saftverlust' },
    { front: 'Schwein Filet',     back: '63–65 °C · zart, saftig — 63 °C ist das Minimum' },
    { front: 'Hähnchen Brust',    back: '72–75 °C · weiß, sicher, noch saftig' },
    { front: 'Lachs',             back: '48–52 °C · glasig, mi-cuit' },
    { front: 'Lamm Rücken',       back: '54–57 °C · medium rare, rosé' },
  ],
  holz: [
    { front: 'Hickory',  back: 'Stark würzig · Brisket, Pulled Pork, Ribs' },
    { front: 'Apfel',    back: 'Mild, leicht süß · Geflügel, Schwein, Fisch' },
    { front: 'Kirsche',  back: 'Süßlich, färbt rot · Geflügel, Lamm' },
    { front: 'Mesquite', back: 'Sehr intensiv, erdig · Beef, kurze Sessions' },
    { front: 'Buche',    back: 'Mittel, neutral · Allrounder, Fisch' },
    { front: 'Walnuss',  back: 'Stark, kann bitter werden · Wild, Rind sparsam' },
    { front: 'Ahorn',    back: 'Süß, mild · Geflügel, Schinken' },
    { front: 'Pekan',    back: 'Süßlich-nussig · Schwein, Geflügel' },
  ],
  kcbs: [
    { front: 'Chicken',     back: '6 gleiche Stücke · Turn-In 12:00' },
    { front: 'Pork Ribs',   back: 'St. Louis oder Baby Back · Turn-In 12:30' },
    { front: 'Pork',        back: 'Schulter/Butt 4–6 kg · Turn-In 13:00' },
    { front: 'Brisket',     back: 'Flat oder Point, 6–7 kg · Turn-In 13:30' },
    { front: 'Appearance',  back: 'Score 6–9 · Box-Layout, Farbe, Glanz' },
    { front: 'Taste',       back: 'Score 6–9 · der wichtigste Faktor' },
    { front: 'Tenderness',  back: 'Score 6–9 · zart, aber nicht zerfallend' },
    { front: 'DQ-Gründe',   back: 'Falsche Garnitur, Box-Sticker fehlt, Sauce-Pool' },
  ],
};
