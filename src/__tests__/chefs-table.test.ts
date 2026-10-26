import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { allePartner, OEFFENTLICH, partnerBySlug, sichtbarePartner } from '@/lib/chefs-table';
import { PartnerSchema, istFreigegeben, rezeptAnzahl } from '@/lib/chefs-table/typen';
import { REL_PARTNER } from '@/components/chefs-table/PartnerPortraet';

/**
 * Chefs' Table (25.10.2026): Jede YAML ist gültig, ein Platzhalter wird nie öffentlich,
 * ein Porträt braucht beide Freigaben, externe Partnerlinks tragen rel="sponsored",
 * und solange der Bereich versteckt ist, steht er in der Sitemap-Ausschlussliste.
 */
describe('data/chefs-table', () => {
  const partner = allePartner();

  it('enthält den Platzhalter zum Gegenlesen des Layouts', () => {
    expect(partner.map((p) => p.slug)).toContain('beispiel-kueche');
  });

  it('jeder Eintrag ist gültig, Slug = Dateiname', () => {
    for (const p of partner) {
      expect(PartnerSchema.safeParse(p).success, p.slug).toBe(true);
    }
  });

  it('ein Platzhalter ist nie freigegeben', () => {
    for (const p of partner.filter((x) => x.platzhalter)) {
      expect(istFreigegeben(p), p.slug).toBe(false);
    }
  });

  it('freigegeben heißt: Partner UND Uwe haben ein Datum gesetzt', () => {
    const basis = partner[0];
    expect(istFreigegeben({ ...basis, platzhalter: false, freigabe: {} })).toBe(false);
    expect(istFreigegeben({ ...basis, platzhalter: false, freigabe: { partner: '2026-11-10' } })).toBe(false);
    expect(istFreigegeben({ ...basis, platzhalter: false, freigabe: { partner: '2026-11-10', uwe: '2026-11-11' } })).toBe(true);
  });

  it('zählt Signature-Rezept und Liste zusammen', () => {
    const p = partnerBySlug('beispiel-kueche')!;
    expect(rezeptAnzahl(p)).toBe(p.rezepte.length + 1);
  });
});

describe('Sichtbarkeit', () => {
  it('versteckt: Platzhalter sichtbar, öffentlich: nur freigegebene Porträte', () => {
    const sichtbar = sichtbarePartner();
    if (OEFFENTLICH) {
      expect(sichtbar.every(istFreigegeben)).toBe(true);
    } else {
      expect(sichtbar.map((p) => p.slug)).toContain('beispiel-kueche');
    }
  });

  it('solange versteckt: beide Routen stehen in der Sitemap-Ausschlussliste', () => {
    const cfg = readFileSync(join(process.cwd(), 'next-sitemap.config.js'), 'utf-8');
    const drin = cfg.includes("'/chefs-table',") && cfg.includes("'/chefs-table/*',");
    expect(drin).toBe(!OEFFENTLICH);
  });

  it('externe Partnerlinks sind als sponsored gekennzeichnet (Konzept 7.1)', () => {
    expect(REL_PARTNER.split(' ')).toContain('sponsored');
    expect(REL_PARTNER.split(' ')).toContain('noopener');
  });

  it('die Porträtseite setzt keine Bewertungen oder Sterne (Markenregel)', () => {
    const quelle = readFileSync(join(process.cwd(), 'src/components/chefs-table/PartnerPortraet.tsx'), 'utf-8');
    expect(quelle).not.toMatch(/Sterne|Bewertung|★|Testsieger/);
  });
});
