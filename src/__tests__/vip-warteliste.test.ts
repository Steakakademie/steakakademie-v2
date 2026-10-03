/**
 * Eine VIP-Warteliste, nicht zwei (03.10.2026).
 *
 * Anlass: Das Sperr-Modal des Aroma-Matchers trug per Knopf in eine eigene Liste
 * ein (Tabelle aroma_matrix_warteliste), an die nichts verschickt wird, und
 * versprach trotzdem eine Nachricht. Die Warteliste, an die eine Start-Mail
 * gehen kann, ist die von /vip: Anmeldung über den Wissens-Brief (Double-Opt-in)
 * mit der Quelle `vip-warteliste` → Loops-Gruppe `vip_warteliste`.
 *
 * Der Test liest die Quelltexte — die Seiten selbst sind in Vitest nicht ladbar.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const lies = (pfad: string) => readFileSync(join(__dirname, '..', pfad), 'utf8');
/** Ohne Kommentare — geprüft wird, was läuft und was der Besucher liest. */
const ohneKommentare = (quelle: string) => quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('VIP-Warteliste: ein Einstieg, eine Gruppe', () => {
  it('/vip meldet über den Wissens-Brief mit der Quelle vip-warteliste an', () => {
    const vip = lies('app/vip/page.tsx');
    expect(vip).toContain('id="warteliste"');
    expect(vip).toContain('source="vip-warteliste"');
  });

  it('die Quelle vip-warteliste führt in die Loops-Gruppe vip_warteliste', () => {
    expect(lies('app/api/newsletter/route.ts')).toMatch(/'vip-warteliste':\s*\{\s*userGroup:\s*'vip_warteliste'\s*\}/);
  });

  it('das Sperr-Modal des Aroma-Matchers verweist auf diese Warteliste und trägt nirgends selbst ein', () => {
    const matcher = ohneKommentare(lies('components/aroma-matcher/AromaMatcher.tsx'));
    expect(matcher).toContain('href="/vip#warteliste"');
    expect(matcher).not.toMatch(/warteliste:\s*true/);
    expect(matcher).not.toMatch(/Wir melden uns/);
  });
});

describe('/vip: kein Startdatum, nicht Gebautes heißt „geplant“', () => {
  const vip = ohneKommentare(lies('app/vip/page.tsx'));

  it('nennt kein Startdatum', () => {
    expect(vip).not.toMatch(/Ende 2026|startet (im|am|ab|Ende)/);
  });

  it('kein Baustein steht auf „bald“ oder uneingeschränkt auf „live“', () => {
    expect(vip).not.toMatch(/status: '(bald|live)'/);
    expect(vip).not.toMatch(/>\s*Bald\s*</);
    expect(vip.match(/status: 'geplant'/g)?.length).toBe(3);
  });

  it('der Preis ist der des Digistore-Jahresplans, eine Monatszahl steht nicht da', () => {
    expect(vip).toContain('49 € im Jahr');
    expect(vip).not.toMatch(/\d,\d\d\s*€/);
  });
});
