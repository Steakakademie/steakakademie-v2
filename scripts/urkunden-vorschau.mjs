/**
 * Erzeugt die Web-Vorschau der gedruckten Urkunde.
 *
 * Liest src/lib/urkunde/vorlagen/stufe-N-1z.png (300 dpi, ~1,5 MB je Datei —
 * das Druckbild, aus dem render.ts die echte Urkunde setzt) und schreibt
 * public/images/urkunde/vorschau-stufe-N.webp (1600 px breit, ~150 KB).
 *
 * Warum: Bis 17.10.2026 zeigte /diplome/urkunde eine CSS-Attrappe (Eckrahmen,
 * Emoji, „MMXXVI"), die mit der gedruckten Urkunde nichts gemein hatte (Uwe:
 * „grafisch eine andere als die, die der User bekommt"). Die Vorschau zeigt
 * jetzt dasselbe Bild wie der Druck; Name und Datum legt
 * src/components/diplome/UrkundeVorschau.tsx an den vermessenen Stellen darueber.
 *
 * Nach jedem Lauf von scripts/urkunden-vorlagen.mjs erneut ausfuehren:
 *   node scripts/urkunden-vorschau.mjs
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = path.join(WURZEL, 'src', 'lib', 'urkunde', 'vorlagen');
const ZIEL = path.join(WURZEL, 'public', 'images', 'urkunde');
export const VORSCHAU_BREITE = 1600;

await fs.mkdir(ZIEL, { recursive: true });
for (const stufe of [1, 2, 3, 4, 5]) {
  const von = path.join(QUELLE, `stufe-${stufe}-1z.png`);
  const nach = path.join(ZIEL, `vorschau-stufe-${stufe}.webp`);
  const info = await sharp(von)
    .resize({ width: VORSCHAU_BREITE, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(nach);
  console.log(`Stufe ${stufe}: ${path.relative(WURZEL, nach)} ${info.width}x${info.height}, ${(info.size / 1024).toFixed(0)} KB`);
}
