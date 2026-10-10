/**
 * Methoden-FAQ: strukturierte Daten und sichtbarer Text bleiben deckungsgleich (10.10.2026).
 *
 * Eine Methode kann `faq` im Frontmatter tragen; daraus entsteht das FAQPage-Markup.
 * Der sichtbare Abschnitt „## FAQ" steht weiter im Text. Zwei Fassungen derselben
 * Antwort laufen auseinander, sobald jemand nur eine ändert — Google wertet das als
 * Täuschung, und die Leser sehen etwas anderes als die Suchmaschine. Dieser Test
 * bindet beide aneinander.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

const DIR = join(process.cwd(), 'content', 'methoden');

type FaqEintrag = { question: string; answer: string };

function lese(datei: string) {
  const roh = readFileSync(join(DIR, datei), 'utf8').replace(/\r\n/g, '\n');
  const m = roh.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${datei}: kein Frontmatter`);
  const kopf = yaml.load(m[1]) as { faq?: FaqEintrag[] };
  return { faq: kopf.faq, text: m[2] };
}

// Markdown-Link → nur der Linktext, **fett** → fett: so liest es Google aus dem sichtbaren Text.
const klartext = (s: string) =>
  s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\s+/g, ' ').trim();

const mitFaq = readdirSync(DIR)
  .filter((d) => d.endsWith('.mdx'))
  .map((d) => ({ datei: d, ...lese(d) }))
  .filter((d) => Array.isArray(d.faq) && d.faq.length > 0);

describe('Methoden-FAQ ↔ sichtbarer Text', () => {
  it('mindestens die Smoken-Seite trägt FAQ-Markup', () => {
    expect(mitFaq.map((d) => d.datei)).toContain('smoken-low-and-slow.mdx');
  });

  for (const { datei, faq, text } of mitFaq) {
    describe(datei, () => {
      for (const { question, answer } of faq!) {
        it(`„${question}" steht mit derselben Antwort im Text`, () => {
          const frage = `**${question}**`;
          const stelle = text.indexOf(frage);
          expect(stelle, `Frage fehlt im Text: ${question}`).toBeGreaterThan(-1);
          const rest = text.slice(stelle + frage.length);
          const ende = rest.search(/\n\s*\n|\n\*\*|\n#/);
          const sichtbar = klartext(ende === -1 ? rest : rest.slice(0, ende));
          expect(sichtbar).toBe(klartext(answer));
        });
      }
    });
  }
});
