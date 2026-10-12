import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { pruefeMdx, zaehleWoerter } from './check-snippet-antworten.mjs';

describe('zaehleWoerter', () => {
  it('zaehlt freistehende Gedankenstriche nicht mit', () => {
    expect(zaehleWoerter('Salz – direkt davor')).toBe(3);
    expect(zaehleWoerter('52–55 °C, Standard 54 °C.')).toBe(5);
  });
});

describe('pruefeMdx', () => {
  const datei = (antwort, ueberschrift = '### Wie lange ruhen?') =>
    `---\ntitle: "x"\nfaq:\n  - question: "Wie lange ruhen?"\n    answer: "${antwort}"\n---\n\n${ueberschrift}\n\n${antwort}\n`;

  it('meldet zu kurze Antworten', () => {
    const [e] = pruefeMdx(datei('Fünf Minuten.'));
    expect(e.laengeOk).toBe(false);
    expect(e.alsUeberschrift).toBe(true);
  });

  it('meldet eine Frage, die nur fett statt als Ueberschrift steht', () => {
    const [e] = pruefeMdx(datei('Fünf Minuten.', '**Wie lange ruhen?**'));
    expect(e.alsUeberschrift).toBe(false);
  });

  it('akzeptiert die Frage ohne MDX-Ueberschrift, wenn die Vorlage sie rendert', () => {
    const [e] = pruefeMdx(datei('Fünf Minuten.', 'Kein Kopf.'), { vorlageRendertFaq: true });
    expect(e.alsUeberschrift).toBe(true);
  });

  it('ignoriert Dateien ohne faq', () => {
    expect(pruefeMdx('---\ntitle: "x"\n---\n\nText\n')).toBeNull();
  });

  it('Ribeye-Seite erfuellt die Regel vollstaendig', () => {
    const ergebnis = pruefeMdx(readFileSync(new URL('../content/cuts/ribeye.mdx', import.meta.url), 'utf8'));
    expect(ergebnis.length).toBeGreaterThanOrEqual(8);
    expect(ergebnis.filter((e) => !e.laengeOk || !e.alsUeberschrift)).toEqual([]);
  });
});
