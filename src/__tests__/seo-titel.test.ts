import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seoTitel, SEO_TITEL_ZUSATZ, SEO_TITEL_MAX } from '@/lib/seo-titel';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('seoTitel', () => {
  it('laesst kurze Titel unangetastet (Marke kommt aus dem Template)', () => {
    expect(seoTitel('Picanha — BBQ-Glossar')).toBe('Picanha — BBQ-Glossar');
  });

  it('nimmt langen Titeln den Markenzusatz, statt sie abschneiden zu lassen', () => {
    const lang = 'Kerntemperatur richtig messen — und warum das Deckelthermometer lügt';
    expect(lang.length + SEO_TITEL_ZUSATZ.length).toBeGreaterThan(SEO_TITEL_MAX);
    expect(seoTitel(lang)).toEqual({ absolute: lang });
  });

  it('Grenzfall: genau an der Grenze bleibt der Zusatz', () => {
    const genau = 'x'.repeat(SEO_TITEL_MAX - SEO_TITEL_ZUSATZ.length);
    expect(seoTitel(genau)).toBe(genau);
    expect(seoTitel(genau + 'x')).toEqual({ absolute: genau + 'x' });
  });

  it('kennt denselben Zusatz wie das Root-Layout', () => {
    const layout = readFileSync(join(ROOT, 'src', 'app', 'layout.tsx'), 'utf-8');
    const m = layout.match(/template:\s*'%s([^']*)'/);
    expect(m, 'title.template im Root-Layout nicht gefunden').not.toBeNull();
    expect(m![1]).toBe(SEO_TITEL_ZUSATZ);
  });
});
