/**
 * Wächter: Die KI-Vorprüfung veröffentlicht kein Community-Rezept.
 *
 * Anlass (03.10.2026): /api/rezept-einreichen setzte bei einer KI-Bewertung
 * ab 65 sofort `approved` + `published_at`, während die Datenschutzerklärung
 * (Abschnitt 10a) eine Freigabe durch einen Menschen zusagt und CLAUDE.md § 2
 * Regel 4 „Kein Auto-Posting" verlangt. Fällt jemand auf die alte Schwelle
 * zurück, wird dieser Test rot.
 *
 * Zwei Ebenen, weil eine allein nicht reicht:
 *  1. die Statusableitung selbst (reine Funktion),
 *  2. die Verdrahtung — die Route muss die Funktion benutzen und darf kein
 *     Veröffentlichungsdatum setzen. Die Route ist in Vitest nicht ladbar
 *     (Next, Supabase, Anthropic), deshalb wird ihr Quelltext gelesen.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  einreichungsStatus,
  MELDUNG_ABGELEHNT,
  MELDUNG_IN_PRUEFUNG,
  SCHWELLE_HANDPRUEFUNG,
  SCHWELLE_TOP_SIEGEL,
} from '@/lib/rezept/einreichung-status';

const quelle = (relativ: string) =>
  readFileSync(fileURLToPath(new URL(relativ, import.meta.url)), 'utf8');

/** Quelltext ohne Block- und Zeilenkommentare — sonst träfe die Prüfung die Erklärungen. */
const ohneKommentare = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('einreichungsStatus — die KI sortiert vor, sie gibt nicht frei', () => {
  it('schickt auch die bestmögliche Bewertung in die Handprüfung', () => {
    expect(einreichungsStatus({ safe: true, is_recipe: true, quality_score: 100 })).toBe('needs_review');
  });

  it('schickt die frühere Auto-Freigabe-Schwelle (65) in die Handprüfung', () => {
    expect(einreichungsStatus({ safe: true, is_recipe: true, quality_score: 65 })).toBe('needs_review');
    expect(einreichungsStatus({ safe: true, is_recipe: true, quality_score: 85 })).toBe('needs_review');
  });

  it('zieht die Grenze zur Handprüfung bei 45', () => {
    expect(SCHWELLE_HANDPRUEFUNG).toBe(45);
    expect(einreichungsStatus({ safe: true, is_recipe: true, quality_score: 45 })).toBe('needs_review');
    expect(einreichungsStatus({ safe: true, is_recipe: true, quality_score: 44 })).toBe('rejected');
    expect(einreichungsStatus({ safe: true, is_recipe: true, quality_score: 0 })).toBe('rejected');
  });

  it('lehnt Unsicheres und Nicht-Rezepte ab — unabhängig von der Bewertung', () => {
    expect(einreichungsStatus({ safe: false, is_recipe: true, quality_score: 100 })).toBe('rejected');
    expect(einreichungsStatus({ safe: true, is_recipe: false, quality_score: 100 })).toBe('rejected');
    expect(einreichungsStatus({ safe: false, is_recipe: false, quality_score: 100 })).toBe('rejected');
  });

  it('lehnt eine nicht auswertbare Bewertung ab, statt sie durchzulassen', () => {
    expect(einreichungsStatus({ safe: true, is_recipe: true, quality_score: Number.NaN })).toBe('rejected');
  });

  it('liefert für keine denkbare Eingabe „approved"', () => {
    const gesehen = new Set<string>();
    for (const safe of [true, false]) {
      for (const is_recipe of [true, false]) {
        for (let quality_score = 0; quality_score <= 100; quality_score++) {
          gesehen.add(einreichungsStatus({ safe, is_recipe, quality_score }));
        }
      }
    }
    expect([...gesehen].sort()).toEqual(['needs_review', 'rejected']);
  });

  it('hält das Siegel „Top bewertet" oberhalb der Handprüfungs-Schwelle', () => {
    expect(SCHWELLE_TOP_SIEGEL).toBe(85);
    expect(SCHWELLE_TOP_SIEGEL).toBeGreaterThan(SCHWELLE_HANDPRUEFUNG);
  });
});

describe('Meldungen an den Einreicher', () => {
  it('sagt bei der Handprüfung, dass geprüft wird — und nicht, dass etwas live ist', () => {
    expect(MELDUNG_IN_PRUEFUNG).toMatch(/eingegangen/);
    expect(MELDUNG_IN_PRUEFUNG).toMatch(/geprüft/);
    expect(MELDUNG_IN_PRUEFUNG).toMatch(/erst nach unserer Freigabe/);
    expect(MELDUNG_IN_PRUEFUNG).not.toMatch(/\blive\b|ist freigegeben|ist veröffentlicht|in Kürze/i);
  });

  it('verspricht bei einer Ablehnung keine Veröffentlichung', () => {
    expect(MELDUNG_ABGELEHNT).not.toMatch(/\blive\b|freigegeben/i);
  });
});

describe('Verdrahtung: /api/rezept-einreichen', () => {
  const route = ohneKommentare(quelle('../app/api/rezept-einreichen/route.ts'));

  it('leitet den Status über einreichungsStatus() ab', () => {
    expect(route).toMatch(/const status = einreichungsStatus\(verdict\)/);
  });

  it('setzt weder „approved" noch ein Veröffentlichungsdatum', () => {
    expect(route).not.toMatch(/['"`]approved['"`]/);
    // published_at darf ausschliesslich `null` sein.
    const zuweisungen = route.match(/published_at\s*:\s*[^,\n]+/g) ?? [];
    expect(zuweisungen.length).toBeGreaterThan(0);
    for (const z of zuweisungen) expect(z).toMatch(/^published_at\s*:\s*null$/);
  });

  it('antwortet in der Handprüfung mit dem festen Text, nicht mit dem des Modells', () => {
    expect(route).toMatch(/message:\s*MELDUNG_IN_PRUEFUNG/);
  });
});

describe('Gegenstück: Freigabe nur in der Admin-Moderation', () => {
  const admin = ohneKommentare(quelle('../app/api/admin/rezepte/route.ts'));

  it('listet die Handprüfung (needs_review) zur Freigabe', () => {
    expect(admin).toMatch(/\.in\('status',\s*\['needs_review',\s*'pending'\]\)/);
  });

  it('setzt published_at erst beim Freigeben', () => {
    expect(admin).toMatch(/if \(status === 'approved'\) patch\.published_at = /);
  });

  it('verlangt die Admin-Sitzung', () => {
    expect(admin).toMatch(/istAdminCookie/);
  });
});

describe('Öffentliche Seiten zeigen nur Freigegebenes', () => {
  it.each([
    '../app/rezepte/community/page.tsx',
    '../app/rezepte/community/[slug]/page.tsx',
  ])('%s filtert auf status approved', (pfad) => {
    expect(ohneKommentare(quelle(pfad))).toMatch(/\.eq\('status',\s*'approved'\)/);
  });

  it.each([
    '../app/rezepte/community/page.tsx',
    '../app/rezepte/community/[slug]/page.tsx',
  ])('%s behauptet keine Prüfung durch einen Pitmaster', (pfad) => {
    // Kommentare ausgenommen: dort steht, wie das Siegel früher hieß.
    expect(ohneKommentare(quelle(pfad))).not.toMatch(/Pitmaster-geprüft|PITMASTER_SEAL/);
  });
});
