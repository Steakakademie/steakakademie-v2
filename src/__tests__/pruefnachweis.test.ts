import { afterEach, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  alsSatzanfang,
  FACHLICH_VERANTWORTLICH,
  hatPruefnachweis,
  pruefangabe,
  pruefdatum,
  pruefdatumIso,
  pruefdatumText,
  pruefhinweis,
  pruefsatz,
  verantwortungsangabe,
} from '@/lib/pruefnachweis';
import { articleSchema, pruefvermerkSchema } from '@/lib/schema';

/**
 * „Geprüft“ nur mit Prüfdatum (Entscheidung Uwe, 03.10.2026).
 *
 * Drei Dinge hält dieser Test fest:
 *   1. Ein Prüfnachweis ist allein ein gültiges `reviewedAt` — der Vorgabewert
 *      `reviewed: true` aus contentlayer.config.ts genügt nicht.
 *   2. Ohne Nachweis sagt kein Hinweistext und kein JSON-LD „geprüft“; die
 *      Nennung des fachlich Verantwortlichen bleibt in beiden Fällen stehen.
 *   3. Keine Seite behauptet die Prüfung wieder pauschal (Quelltext-Wächter unten).
 */

const JETZT = new Date('2026-10-03T12:00:00Z');
const o = { jetzt: JETZT };

describe('pruefdatum — was als Prüfnachweis zählt', () => {
  it('ein ISO-Datum, wie Contentlayer es liefert, zählt', () => {
    const doc = { reviewedAt: '2026-09-03T00:00:00.000Z' };
    expect(hatPruefnachweis(doc, JETZT)).toBe(true);
    expect(pruefdatumIso(doc, JETZT)).toBe('2026-09-03');
    expect(pruefdatumText(doc, JETZT)).toBe('03.09.2026');
  });

  it('ein reines Tagesdatum zählt ebenso', () => {
    expect(pruefdatumIso({ reviewedAt: '2026-09-09' }, JETZT)).toBe('2026-09-09');
  });

  it('ohne reviewedAt gibt es keinen Nachweis — auch nicht mit reviewed: true', () => {
    for (const doc of [undefined, null, {}, { reviewedAt: null }, { reviewedAt: '' }, { reviewed: true }, { reviewed: true, reviewedAt: undefined }]) {
      expect(hatPruefnachweis(doc, JETZT)).toBe(false);
      expect(pruefdatum(doc, JETZT)).toBeNull();
    }
  });

  it('ein ungültiges Datum zählt nicht', () => {
    for (const reviewedAt of ['kein-datum', 'true', '2026', '2026-9-3', '2026-13-01', '2026-02-31', '0000-00-00']) {
      expect(hatPruefnachweis({ reviewedAt }, JETZT), reviewedAt).toBe(false);
    }
  });

  it('ein deutsch getipptes Datum zählt nicht — new Date() läse daraus den 9. März', () => {
    expect(new Date('03.09.2026').getMonth()).toBe(2); // der Grund für die Strenge
    expect(hatPruefnachweis({ reviewedAt: '03.09.2026' }, JETZT)).toBe(false);
  });

  it('ein Datum in der Zukunft zählt nicht, das heutige schon', () => {
    expect(hatPruefnachweis({ reviewedAt: '2026-10-04' }, JETZT)).toBe(false);
    expect(hatPruefnachweis({ reviewedAt: '2026-10-03' }, JETZT)).toBe(true);
  });

  it('„heute“ ist der Kalendertag in Deutschland, nicht in UTC', () => {
    // 03.10.2026 00:30 in Berlin ist noch der 02.10. in UTC.
    const kurzNachMitternacht = new Date('2026-10-02T22:30:00Z');
    expect(hatPruefnachweis({ reviewedAt: '2026-10-03' }, kurzNachMitternacht)).toBe(true);
    expect(hatPruefnachweis({ reviewedAt: '2026-10-04' }, kurzNachMitternacht)).toBe(false);
  });

  it('reviewed: false schlägt jedes Datum', () => {
    expect(hatPruefnachweis({ reviewed: false, reviewedAt: '2026-09-03' }, JETZT)).toBe(false);
  });
});

describe('Hinweistexte — Prüfung nur mit Datum, Verantwortung immer', () => {
  const MIT = { reviewedAt: '2026-09-03T00:00:00.000Z' };
  const OHNE = { reviewed: true };

  it('mit Prüfdatum: Prüf-Aussage mit Datum und Namen', () => {
    expect(pruefangabe(MIT, o)).toBe('fachlich geprüft am 03.09.2026 von Uwe Yendell');
    expect(pruefhinweis(MIT, o)).toBe('fachlich geprüft am 03.09.2026 und verantwortet von Uwe Yendell');
    expect(pruefsatz(MIT, 'Dieses Rezept', o)).toBe('Dieses Rezept wurde am 03.09.2026 von Uwe Yendell fachlich geprüft.');
  });

  it('ohne Prüfdatum: keine Prüf-Aussage, sondern die Verantwortungs-Angabe', () => {
    expect(pruefangabe(OHNE, o)).toBeNull();
    expect(pruefsatz(OHNE, 'Dieses Rezept', o)).toBeNull();
    expect(pruefhinweis(OHNE, o)).toBe('fachlich verantwortet von Uwe Yendell');
    expect(pruefhinweis(undefined, o)).toBe('fachlich verantwortet von Uwe Yendell');
    expect(pruefhinweis(OHNE, o)).not.toMatch(/geprüft/i);
  });

  it('ungültiges Datum: wie ohne', () => {
    const kaputt = { reviewedAt: '03.09.2026' };
    expect(pruefangabe(kaputt, o)).toBeNull();
    expect(pruefhinweis(kaputt, o)).not.toMatch(/geprüft/i);
  });

  it('der fachlich Verantwortliche steht in jedem Hinweis — mit und ohne Datum', () => {
    for (const doc of [MIT, OHNE, undefined, { reviewedAt: 'kein-datum' }]) {
      expect(pruefhinweis(doc, o)).toContain(`verantwortet von ${FACHLICH_VERANTWORTLICH}`);
    }
    expect(verantwortungsangabe()).toBe('fachlich verantwortet von Uwe Yendell');
    expect(verantwortungsangabe({ gruender: true })).toBe('fachlich verantwortet von Gründer Uwe Yendell');
  });

  it('eine Prüf-Aussage ohne Datum gibt es in keiner Funktion', () => {
    for (const text of [pruefangabe(MIT, o), pruefhinweis(MIT, o), pruefsatz(MIT, 'Dieser Beitrag', o)]) {
      expect(text).toMatch(/geprüft/);
      expect(text).toMatch(/03\.09\.2026/);
    }
  });

  it('alsSatzanfang setzt nur den ersten Buchstaben groß', () => {
    expect(alsSatzanfang('fachlich verantwortet von Uwe Yendell')).toBe('Fachlich verantwortet von Uwe Yendell');
  });
});

describe('JSON-LD — reviewedBy/lastReviewed nur mit Prüfdatum', () => {
  afterEach(() => vi.useRealTimers());

  const BASIS = {
    headline: 'Titel',
    description: 'Beschreibung',
    image: '/bild.jpg',
    datePublished: '2026-09-01',
    authorName: 'Marco',
    authorSlug: 'marco',
    url: '/fleischwissen/test',
  };

  it('ohne reviewedAt: kein reviewedBy, kein lastReviewed', () => {
    const s = articleSchema(BASIS);
    expect(s.mainEntityOfPage).not.toHaveProperty('reviewedBy');
    expect(s.mainEntityOfPage).not.toHaveProperty('lastReviewed');
    expect(JSON.stringify(s)).not.toMatch(/reviewedBy|lastReviewed/);
  });

  it('mit reviewedAt: beide Felder, Datum ohne Uhrzeit', () => {
    const s = articleSchema({ ...BASIS, reviewedAt: '2026-09-03T00:00:00.000Z' });
    expect(s.mainEntityOfPage).toMatchObject({
      lastReviewed: '2026-09-03',
      reviewedBy: { '@type': 'Person', name: 'Uwe Yendell' },
    });
  });

  it('ungültiges Datum: kein Prüfvermerk — auch nicht als falsch gelesener Tag', () => {
    // Vor dem 03.10.2026 wurde „03.09.2026“ hier zu lastReviewed 2026-03-09.
    expect(pruefvermerkSchema('03.09.2026')).toEqual({});
    expect(pruefvermerkSchema('2026-02-31')).toEqual({});
    expect(pruefvermerkSchema('kein-datum')).toEqual({});
  });

  it('Datum in der Zukunft: kein Prüfvermerk', () => {
    vi.useFakeTimers();
    vi.setSystemTime(JETZT);
    expect(pruefvermerkSchema('2026-10-04')).toEqual({});
    expect(pruefvermerkSchema('2026-10-03')).toMatchObject({ lastReviewed: '2026-10-03' });
  });
});

// ─── Quelltext-Wächter ────────────────────────────────────────────────────────
// Die Regel oben hilft nichts, wenn eine Seite den Satz wieder fest verdrahtet.
// Geprüft wird der sichtbare Teil: Kommentare zählen nicht (dort steht die
// Geschichte des Fehlers), Rechtstexte haben einen eigenen Pflegeweg.

const WURZEL = process.cwd();

const RECHTSTEXTE = ['agb', 'datenschutz', 'impressum', 'ki-disclaimer', 'nutzungsbedingungen', 'widerruf'].map(
  (ordner) => `src/app/${ordner}/`,
);

function quelldateien(verzeichnis: string, treffer: string[] = []): string[] {
  for (const name of readdirSync(verzeichnis)) {
    const pfad = join(verzeichnis, name);
    if (statSync(pfad).isDirectory()) quelldateien(pfad, treffer);
    else if (/\.(tsx|ts)$/.test(name) && !/\.test\.ts$/.test(name)) treffer.push(pfad);
  }
  return treffer;
}

const ohneKommentare = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Pauschale Prüf-Aussagen, wie sie bis 03.10.2026 fest im Quelltext standen. */
const PAUSCHAL: [RegExp, string][] = [
  [/geprüft und verantwortet/i, '„geprüft und verantwortet“ — pruefhinweis() aus src/lib/pruefnachweis.ts nutzen'],
  [/fachlich geprüft/i, '„fachlich geprüft“ steht nur in src/lib/pruefnachweis.ts — und dort nur mit Datum'],
  [/auf Richtigkeit geprüft/i, 'pauschale Richtigkeits-Prüfung'],
  [/Methodisch[\s,·]+geprüft/i, '„geprüft“ als Markenversprechen ohne Dokumentbezug'],
  [/geprüftem Wissen/i, '„geprüftes Wissen“ ohne Nachweis'],
];

describe('Quelltext — keine pauschale Prüf-Aussage mehr', () => {
  const dateien = [...quelldateien(join(WURZEL, 'src', 'app')), ...quelldateien(join(WURZEL, 'src', 'components'))]
    .map((pfad) => ({ pfad, rel: relative(WURZEL, pfad).split(sep).join('/') }))
    .filter(({ rel }) => !RECHTSTEXTE.some((r) => rel.startsWith(r)));

  it('findet die Seiten überhaupt (sonst wäre der Wächter blind)', () => {
    expect(dateien.length).toBeGreaterThan(200);
    expect(dateien.some((d) => d.rel === 'src/components/AutorHinweis.tsx')).toBe(true);
  });

  it('src/app und src/components behaupten keine Prüfung ohne Dokument und Datum', () => {
    const funde: string[] = [];
    for (const { pfad, rel } of dateien) {
      const text = ohneKommentare(readFileSync(pfad, 'utf8'));
      for (const [muster, warum] of PAUSCHAL) {
        if (muster.test(text)) funde.push(`${rel}: ${warum}`);
      }
    }
    expect(funde).toEqual([]);
  });

  it('der Hinweis unter den Persona-Texten kommt aus der Bibliothek', () => {
    const text = ohneKommentare(readFileSync(join(WURZEL, 'src/components/AutorHinweis.tsx'), 'utf8'));
    expect(text).toMatch(/verantwortungsangabe\(/);
    expect(text).toMatch(/pruefsatz\(dokument/);
    expect(text).toMatch(/KI-Redaktionspersona/);
    expect(text).toMatch(/ki-disclaimer/);
  });

  it('jede Seite mit AutorHinweis unter einem Dokument reicht das Dokument durch', () => {
    const ohneDokument = dateien
      .filter(({ rel }) => rel !== 'src/components/AutorHinweis.tsx')
      .map(({ pfad, rel }) => ({ rel, text: ohneKommentare(readFileSync(pfad, 'utf8')) }))
      .flatMap(({ rel, text }) =>
        [...text.matchAll(/<AutorHinweis\b[^>]*>/g)]
          .filter(([tag]) => !/authorSlug="/.test(tag)) // fester Slug = Seite ohne eigenes Dokument
          .filter(([tag]) => !/\bdokument=\{/.test(tag))
          .map(() => rel),
      );
    expect(ohneDokument).toEqual([]);
  });

  it('public/llms.txt behauptet keine Prüfung und nennt den Verantwortlichen', () => {
    const text = readFileSync(join(WURZEL, 'public', 'llms.txt'), 'utf8');
    expect(text).not.toMatch(/geprüft/i);
    expect(text).toMatch(/fachlich verantwortet[\s>]+von Uwe Yendell/);
  });
});
