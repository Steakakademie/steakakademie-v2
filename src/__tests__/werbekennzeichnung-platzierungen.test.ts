/**
 * Werbekennzeichnung an ALLEN Platzierungen (C14, 22.10.2026).
 *
 * § 5a Abs. 4 UWG und LG Köln 12.05.2026 (CLAUDE.md § 2 Regel 1): „Anzeige"
 * sichtbar VOR dem ersten Klick, an jeder Stelle, die einen Partnerlink
 * ausspielt. Die Regel selbst lebt in produkt-anzeige.ts (produktLink,
 * REL_PARTNERLINK); dieser Test prüft, dass keine Platzierung sie umgeht:
 *
 *   1. Jede Komponente unter src/components/affiliate/, die einen Partnerlink
 *      rendert (produktLink/klickKlassen/partner-Prop), trägt das Wort „Anzeige"
 *      im Quelltext — und zwar als sichtbaren Text, nicht nur im Kommentar.
 *   2. Kein Partnerlink wird an produkt-anzeige.ts vorbei gebaut: kein
 *      `rel="sponsored"` von Hand, kein hart kodiertes `tag=steakakademie-21`
 *      in einer Komponente.
 *   3. Der Weg /go/<id> ist die einzige Weiterleitung; die Route trägt die
 *      Plausible-Zählung und keine Kennzeichnung (sie rendert nichts).
 *
 * Textprüfung, kein Rendern — bewusst: der Test soll ohne DOM laufen und bei
 * jeder neuen Platzierung sofort anschlagen (Regel: ein neuer Schutztest wird
 * gegen die abgeschaltete Prüfung probiert — mit entferntem „Anzeige" in
 * GeraeteLinkKarte.tsx wird er rot).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = path.join(process.cwd(), 'src', 'components', 'affiliate');
const dateien = fs
  .readdirSync(DIR)
  .filter((n) => n.endsWith('.tsx'))
  .map((n) => ({ name: n, text: fs.readFileSync(path.join(DIR, n), 'utf-8') }));

/** Quelltext ohne Kommentare — „Anzeige" in einem Kommentar zählt nicht. */
function ohneKommentare(t: string): string {
  return t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const rendertPartnerlink = (t: string) =>
  /produktLink\(|klickKlassen\(|partner:\s*true|\bpartner\b.*\?\s*/.test(t) || /REL_PARTNERLINK/.test(t);

describe('Werbekennzeichnung an allen Platzierungen', () => {
  it('es gibt Platzierungen zu prüfen', () => {
    expect(dateien.length).toBeGreaterThan(5);
  });

  it.each(dateien.map((d) => d.name))('%s: wer einen Partnerlink rendert, zeigt „Anzeige" als Text', (name) => {
    const d = dateien.find((x) => x.name === name)!;
    const code = ohneKommentare(d.text);
    if (!rendertPartnerlink(code)) return; // reine Darstellung ohne Link (z. B. Preisstand)
    // Entweder das Wort selbst — oder die Karte bekommt es als `kennzeichnung`
    // vom Server-Teil (GeraeteLink → GeraeteLinkKarte); dann muss sie es rendern.
    expect(code, `${name} rendert einen Partnerlink ohne sichtbares „Anzeige"`).toMatch(/Anzeige|\{[^}]*kennzeichnung\}/);
  });

  it('GeraeteLink reicht das Wort „Anzeige" als kennzeichnung an die Karte, die Karte rendert es', () => {
    const server = ohneKommentare(dateien.find((d) => d.name === 'GeraeteLink.tsx')!.text);
    const karte = ohneKommentare(dateien.find((d) => d.name === 'GeraeteLinkKarte.tsx')!.text);
    expect(server).toMatch(/kennzeichnung:\s*'Anzeige'/);
    expect(karte).toMatch(/\{[^}]*kennzeichnung\}/);
  });

  it.each(dateien.map((d) => d.name))('%s: kein Partnerlink an produkt-anzeige.ts vorbei', (name) => {
    const code = ohneKommentare(dateien.find((x) => x.name === name)!.text);
    expect(code, `${name}: tag=steakakademie-21 hart kodiert`).not.toMatch(/tag=steakakademie-21/);
    expect(code, `${name}: rel="sponsored" von Hand statt REL_PARTNERLINK`).not.toMatch(/rel=["']sponsored/);
  });

  it('die Regel-Datei definiert REL_PARTNERLINK mit sponsored und das Wort Anzeige nirgends selbst (sie ist JSX-frei)', () => {
    const regel = ohneKommentare(fs.readFileSync(path.join(DIR, 'produkt-anzeige.ts'), 'utf-8'));
    expect(regel).toMatch(/REL_PARTNERLINK\s*=\s*['"][^'"]*sponsored/);
    // Keine JSX-Tags (Generics wie Pick<Product, …> sind erlaubt)
    expect(regel).not.toMatch(/<\/?[a-z]+[\s>/]/);
    expect(regel).not.toMatch(/<[A-Z][A-Za-z]*[\s>/]/);
  });
});
