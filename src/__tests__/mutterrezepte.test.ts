/**
 * Mutterrezepte (21.10.2026): Datenintegrität und Zugangsschranke.
 *
 * Wächter für zwei Dinge:
 * 1. Jeder Rezept-Link zeigt auf ein veröffentlichtes Rezept, jede fremde Idee
 *    hat eine Quelle — sonst steht ein toter Link oder eine unbelegte Idee im Baum.
 * 2. Gesperrte Inhalte (Grammangaben, Abwandlungen, Links) stehen NICHT in der
 *    öffentlichen Sicht, die die statische Seite ausliefert. Die Vollansicht
 *    gibt nur die API, und die nur mit Vollzugriff.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MUTTERREZEPTE, anzahlFrei, sicht } from '@/lib/mutterrezepte';

const admin = vi.hoisted(() => ({ ja: false }));
vi.mock('@/lib/api/guard', async (original) => ({
  ...(await original<typeof import('@/lib/api/guard')>()),
  isAdminRequest: async () => admin.ja,
}));

const FORMEN = ['dip', 'klecks', 'spiegel', 'dressing', 'aufstrich', 'marinade', 'warm'];
const REZEPTE = join(__dirname, '..', '..', 'content', 'rezepte');

describe.each(MUTTERREZEPTE.map((m) => [m.slug, m] as const))('Mutterrezept %s', (_slug, m) => {
  it('hat eindeutige Blatt-IDs, gültige Äste und Einsatzformen', () => {
    const ids = m.blaetter.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    const aeste = new Set(m.aeste.map((a) => a.id));
    for (const b of m.blaetter) {
      expect(aeste.has(b.ast), `${b.id}: Ast ${b.ast}`).toBe(true);
      expect(FORMEN, `${b.id}: Form ${b.form}`).toContain(b.form);
    }
    for (const a of m.aeste) {
      expect(m.blaetter.some((b) => b.ast === a.id), `Ast ${a.id} ohne Blatt`).toBe(true);
    }
  });

  it('verlinkt nur veröffentlichte Rezepte', () => {
    for (const b of m.blaetter.filter((x) => x.typ === 'rezept')) {
      expect(b.rezeptSlug, `${b.id} ohne rezeptSlug`).toBeTruthy();
      const datei = join(REZEPTE, `${b.rezeptSlug}.mdx`);
      expect(existsSync(datei), `${b.id}: ${b.rezeptSlug}.mdx fehlt`).toBe(true);
      expect(readFileSync(datei, 'utf8'), `${b.id}: ${b.rezeptSlug} ist Entwurf`).not.toMatch(/^status:\s*["']?draft/m);
    }
  });

  it('gibt jedem Schmiede-Blatt einen Auftrag und jeder fremden Idee eine Quelle', () => {
    for (const b of m.blaetter) {
      if (b.typ === 'schmiede') expect(b.schmiedeAuftrag, b.id).toBeTruthy();
      if (!b.ableitung) expect(b.quelle?.url ?? b.herkunft, `${b.id} ohne Quelle oder Herkunft`).toBeTruthy();
      if (b.quelle) expect(b.quelle.url, b.id).toMatch(/^https:\/\//);
    }
  });

  it('hat freie Blätter als Probe, aber nicht alle', () => {
    const frei = anzahlFrei(m);
    expect(frei).toBeGreaterThan(0);
    expect(frei).toBeLessThan(m.blaetter.length);
  });

  it('nennt die Allergene', () => {
    expect(m.allergene).toMatch(/Cashew|Schalenfrücht/);
  });

  it('öffentliche Sicht verrät keine gesperrten Inhalte', () => {
    const s = sicht(m, false);
    expect(s.vollzugriff).toBe(false);
    expect(s.zutatenGramm).toBeNull();
    for (const f of Object.values(s.formen)) expect(f.wasserGramm).toBeNull();

    const json = JSON.stringify(s);
    for (const b of m.blaetter.filter((x) => !x.frei)) {
      const o = s.blaetter.find((x) => x.id === b.id)!;
      expect(o.gesperrt).toBe(true);
      expect(o.warum).toBeUndefined();
      expect(o.abwandlung).toBeUndefined();
      expect(o.rezeptSlug).toBeUndefined();
      expect(o.schmiedeAuftrag).toBeUndefined();
      expect(o.quelle).toBeUndefined();
      expect(o.herkunft).toBeUndefined();
      expect(o.wasserGramm).toBeUndefined();
      expect(json).not.toContain(b.warum);
    }
    for (const b of m.blaetter.filter((x) => x.frei)) {
      const o = s.blaetter.find((x) => x.id === b.id)!;
      expect(o.gesperrt).toBe(false);
      expect(o.abwandlung).toBe(b.abwandlung);
      expect(o.wasserGramm).toBe(m.formen[b.form].wasserGramm);
    }
  });

  it('volle Sicht öffnet alles', () => {
    const s = sicht(m, true);
    expect(s.zutatenGramm).toEqual(m.zutatenGramm);
    expect(s.blaetter.every((b) => !b.gesperrt)).toBe(true);
  });
});

describe('API /api/mutterrezepte/[slug]', () => {
  beforeEach(() => {
    admin.ja = false;
  });

  const aufruf = async (slug: string, ip: string) => {
    const { GET } = await import('@/app/api/mutterrezepte/[slug]/route');
    const req = new Request(`https://steakakademie.de/api/mutterrezepte/${slug}`, {
      headers: { 'x-forwarded-for': ip },
    });
    return GET(req, { params: Promise.resolve({ slug }) });
  };

  it('verweigert die Vollansicht ohne Vollzugriff (403)', async () => {
    const res = await aufruf('limetten-cashewcreme', '203.0.113.10');
    expect(res.status).toBe(403);
    expect(await res.text()).not.toContain('wasserGramm');
  });

  it('liefert die Vollansicht mit Vollzugriff, nie aus dem Cache', async () => {
    admin.ja = true;
    const res = await aufruf('limetten-cashewcreme', '203.0.113.11');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
    const body = await res.json();
    expect(body.vollzugriff).toBe(true);
    expect(body.zutatenGramm.length).toBeGreaterThan(0);
  });

  it('kennt unbekannte Slugs nicht (404)', async () => {
    const res = await aufruf('gibt-es-nicht', '203.0.113.12');
    expect(res.status).toBe(404);
  });
});
