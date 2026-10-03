/**
 * Kontaktadressen: Auf der Seite steht nur ein Postfach, das nachweislich
 * empfängt (03.10.2026).
 *
 * Anlass: Auf /kontakt, /ueber-uns, der Dankeseite, beim Gutschein-Einlösen und
 * an weiteren Stellen standen drei Adressen, für die der eigene Quelltext keinen
 * Zustellnachweis kennt (Kopfkommentar von /api/kontakt). Sie sind durch
 * KONTAKT_EMPFAENGER ersetzt.
 *
 * Zwei Dinge hält dieser Test fest:
 *   1. In src/ und content/ kommt keine andere @steakakademie.de-Adresse vor.
 *      Eine neue Adresse gehört erst in ERLAUBT, wenn ihr Empfang belegt ist.
 *   2. Die Zustellung ist nicht schlechter geworden: Das Formular sortiert weiter
 *      über das Betreff-Präfix, und die Mail-Links der Seiten tragen dasselbe
 *      Präfix an dieselbe Adresse (vorher: drei Adressen ohne Sortierung).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KONTAKT_EMPFAENGER, betreffTag, kontaktMailto } from '@/lib/kontakt';

const WURZEL = join(__dirname, '..', '..');
const ERLAUBT = new Set([KONTAKT_EMPFAENGER]);
const ADRESSE = /[A-Za-z0-9._%+-]+@steakakademie\.de/g;
const TEXTDATEI = /\.(ts|tsx|js|jsx|mjs|cjs|mdx|md|json|ya?ml|txt|html|css)$/;

function dateien(ordner: string): string[] {
  const liste: string[] = [];
  for (const name of readdirSync(ordner)) {
    const pfad = join(ordner, name);
    if (statSync(pfad).isDirectory()) liste.push(...dateien(pfad));
    else if (TEXTDATEI.test(name)) liste.push(pfad);
  }
  return liste;
}

/** Alle fremden Adressen als „pfad: adresse" — leer heißt sauber. */
function fremdeAdressen(ordner: string): string[] {
  const funde: string[] = [];
  for (const pfad of dateien(join(WURZEL, ordner))) {
    for (const adresse of readFileSync(pfad, 'utf8').match(ADRESSE) ?? []) {
      if (!ERLAUBT.has(adresse.toLowerCase())) funde.push(`${relative(WURZEL, pfad)}: ${adresse}`);
    }
  }
  return funde;
}

describe('Kontaktadressen in src/ und content/', () => {
  it('src/ nennt nur das Postfach, das nachweislich empfängt', () => {
    expect(fremdeAdressen('src')).toEqual([]);
  });

  it('content/ nennt nur das Postfach, das nachweislich empfängt', () => {
    expect(fremdeAdressen('content')).toEqual([]);
  });

  it('der Scanner findet eine fremde Adresse, wenn eine da ist (Gegenprobe am Muster)', () => {
    // Zusammengesetzt, damit dieser Test sich nicht selbst als Fund meldet.
    const fremde = ['info', 'steakakademie.de'].join('@');
    const text = `Schreib an ${fremde} oder ${KONTAKT_EMPFAENGER}.`;
    const fremd = (text.match(ADRESSE) ?? []).filter((a) => !ERLAUBT.has(a));
    expect(fremd).toEqual([fremde]);
  });
});

describe('Betreff-Weiche: Formular und Mail-Links sortieren gleich', () => {
  it('jedes Anliegen des Formulars behält sein Präfix', () => {
    expect(betreffTag('presse')).toBe('[Presse]');
    expect(betreffTag('kooperation')).toBe('[Kooperation]');
    expect(betreffTag('rezept')).toBe('[Rezept-Idee]');
    expect(betreffTag('urkunde')).toBe('[Urkunde]');
    expect(betreffTag('hofladen')).toBe('[Hofladen]');
    expect(betreffTag('baukasten')).toBe('[Baukasten]');
    for (const rest of ['diplom', 'feedback', 'sonstiges', '', 'unbekannt']) {
      expect(betreffTag(rest)).toBe('[Allgemein]');
    }
  });

  it('der Mail-Link geht an das Postfach und trägt das Präfix des Anliegens', () => {
    const link = new URL(kontaktMailto('rezept'));
    expect(link.protocol).toBe('mailto:');
    expect(link.pathname).toBe(KONTAKT_EMPFAENGER);
    expect(link.searchParams.get('subject')).toBe('[Rezept-Idee]');
  });

  it('ein Zusatz steht hinter dem Präfix, ohne Anliegen gilt [Allgemein]', () => {
    expect(new URL(kontaktMailto('diplom', ' Frage zum Diplom-System ')).searchParams.get('subject'))
      .toBe('[Allgemein] Frage zum Diplom-System');
    expect(new URL(kontaktMailto()).searchParams.get('subject')).toBe('[Allgemein]');
  });

  it('die drei Kacheln auf /kontakt nutzen den Mail-Link, keine eigene Adresse', () => {
    const seite = readFileSync(join(WURZEL, 'src/app/kontakt/page.tsx'), 'utf8');
    expect(seite.match(/kontaktMailto\(/g)?.length).toBe(3);
    expect(seite).not.toMatch(/mailto:\s*['"`]?[a-z]+@/i);
  });
});
