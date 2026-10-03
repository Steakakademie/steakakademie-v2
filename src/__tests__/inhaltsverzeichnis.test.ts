import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { inhaltsverzeichnis, knotenText, ueberschriftSlug } from '@/lib/inhaltsverzeichnis';

/**
 * Inhaltsverzeichnis der Cut-Seiten (03.10.2026).
 *
 * WARUM ES DIESEN TEST GIBT: Die Seitenleiste „Inhalt" auf /cuts/[slug] war fest
 * auf Ribeye verdrahtet und stand so auch auf Brisket und Pulled Pork; keine
 * Ueberschrift trug eine `id`, alle sechs Sprunglinks waren tot. Verzeichnis und
 * `id` kommen jetzt aus derselben Slug-Funktion — der Test haelt fest, dass
 * beide Seiten dasselbe Ergebnis liefern und dass jeder Cut sein eigenes
 * Verzeichnis bekommt.
 */

describe('ueberschriftSlug', () => {
  it('schreibt Umlaute aus und wirft Satzzeichen weg', () => {
    expect(ueberschriftSlug('Kerntemperaturen für Ribeye')).toBe('kerntemperaturen-fuer-ribeye');
    expect(ueberschriftSlug('Was ist ein Ribeye überhaupt?')).toBe('was-ist-ein-ribeye-ueberhaupt');
    expect(ueberschriftSlug('Einkauf — worauf kommt es an?')).toBe('einkauf-worauf-kommt-es-an');
    expect(ueberschriftSlug('Servieren & Aufbewahren')).toBe('servieren-und-aufbewahren');
    expect(ueberschriftSlug('Maß & Größe')).toBe('mass-und-groesse');
  });

  it('liefert fuer reine Satzzeichen einen leeren Slug', () => {
    expect(ueberschriftSlug('— ? —')).toBe('');
  });
});

describe('inhaltsverzeichnis', () => {
  it('liest nur h2 und haelt die Reihenfolge', () => {
    const raw = ['# Titel', '', '## Erstens', 'Text', '### Unterpunkt', '## Zweitens', '#### tiefer'].join('\n');
    expect(inhaltsverzeichnis(raw)).toEqual([
      { id: 'erstens', titel: 'Erstens' },
      { id: 'zweitens', titel: 'Zweitens' },
    ]);
  });

  it('ueberspringt Codebloecke', () => {
    const raw = ['## Echt', '```md', '## Nur Beispiel', '```', '## Auch echt'].join('\n');
    expect(inhaltsverzeichnis(raw).map((a) => a.id)).toEqual(['echt', 'auch-echt']);
  });

  it('entfernt Markdown-Auszeichnung aus dem Titel', () => {
    const raw = '## Die **Bark** — das [schwarze Gold](/glossar/bark) `kurz`';
    expect(inhaltsverzeichnis(raw)).toEqual([
      { id: 'die-bark-das-schwarze-gold-kurz', titel: 'Die Bark — das schwarze Gold kurz' },
    ]);
  });

  it('fuehrt eine doppelte Ueberschrift nur einmal — ein zweiter Anker haette kein Ziel', () => {
    const raw = ['## FAQ', '## Fazit', '## FAQ'].join('\n');
    expect(inhaltsverzeichnis(raw).map((a) => a.id)).toEqual(['faq', 'fazit']);
  });

  it('laesst Ueberschriften ohne verwertbaren Text weg', () => {
    expect(inhaltsverzeichnis('## ???')).toEqual([]);
  });
});

describe('knotenText — die id der h2-Komponente', () => {
  it('liest Text aus verschachtelten React-Knoten', () => {
    const kinder = ['Die ', { props: { children: 'Bark' } }, ' — das ', { props: { children: ['schwarze', ' Gold'] } }];
    expect(knotenText(kinder)).toBe('Die Bark — das schwarze Gold');
  });

  it('ergibt denselben Slug wie das Verzeichnis aus dem Rohtext', () => {
    const raw = '## Die **Bark** — das schwarze Gold';
    const gerendert = ['Die ', { props: { children: 'Bark' } }, ' — das schwarze Gold'];
    expect(ueberschriftSlug(knotenText(gerendert))).toBe(inhaltsverzeichnis(raw)[0].id);
  });
});

describe('Bestand content/cuts', () => {
  const ordner = join(process.cwd(), 'content', 'cuts');
  const dateien = readdirSync(ordner).filter((f) => f.endsWith('.mdx'));

  it('findet Cut-Dokumente', () => {
    expect(dateien.length).toBeGreaterThan(0);
  });

  it.each(dateien)('%s: hat ein Verzeichnis aus den eigenen h2-Ueberschriften, Anker eindeutig', (datei) => {
    const raw = readFileSync(join(ordner, datei), 'utf8');
    const h2 = raw.split(/\r?\n/).filter((z) => /^##[ \t]+\S/.test(z));
    const verzeichnis = inhaltsverzeichnis(raw);

    // Nicht „gleich": eine doppelte Ueberschrift faellt bewusst heraus.
    expect(verzeichnis.length).toBeGreaterThan(0);
    expect(verzeichnis.length).toBeLessThanOrEqual(h2.length);
    expect(new Set(verzeichnis.map((a) => a.id)).size).toBe(verzeichnis.length);
    for (const a of verzeichnis) expect(a.id).not.toBe('');
  });

  it('Brisket und Pulled Pork tragen kein Ribeye-Verzeichnis mehr', () => {
    for (const datei of dateien.filter((f) => f !== 'ribeye.mdx')) {
      const ids = inhaltsverzeichnis(readFileSync(join(ordner, datei), 'utf8')).map((a) => a.id);
      expect(ids.some((id) => id.includes('ribeye'))).toBe(false);
    }
  });
});
