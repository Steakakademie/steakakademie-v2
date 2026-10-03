import { describe, expect, it } from 'vitest';
import { generateAllNLPages } from './pageGenerator';

/**
 * Wächter (03.10.2026): Die niederländischen Nischen-Seiten liegen unter
 * steakakademie.de/zzp-niche/<slug>. Ihr Canonical zeigte auf steakakademie.nl —
 * er nennt jetzt die Adresse, unter der die Seite tatsächlich liegt.
 */
describe('pageGenerator: Canonical der ZZP-Nischen-Seiten', () => {
  const seiten = generateAllNLPages();

  it('es gibt Seiten zu prüfen', () => {
    expect(seiten.length).toBeGreaterThan(0);
  });

  it('jeder Canonical ist die eigene URL der Seite', () => {
    for (const seite of seiten) {
      expect(seite.meta.canonical, seite.slug).toBe(`https://steakakademie.de/zzp-niche/${seite.slug}`);
    }
  });
});
