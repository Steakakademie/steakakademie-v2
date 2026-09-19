import { describe, it, expect } from 'vitest';
import { adresseZeile, entfernungLabel, fleischStatus, sichereUrl, hostAusUrl, zahlAusParam } from '@/lib/hoefe/format';
import { plzSuche } from '@/lib/hoefe/geocode';
// .mjs ohne eigene Typen — tsc erlaubt den Import (allowJs), vitest laedt es direkt
import { fleischAusTags, slugAusName, hofAusElement, hoefeAusElementen, OVERPASS_QUERY } from '../../scripts/lib/hoefe-osm.mjs';

describe('hoefe/format', () => {
  it('entfernungLabel: Meter unter 1 km, eine Nachkommastelle unter 10 km, sonst ganz', () => {
    expect(entfernungLabel(0.42)).toBe('420 m');
    expect(entfernungLabel(3.86)).toBe('3,9 km');
    expect(entfernungLabel(27.5)).toBe('28 km');
  });
  it('adresseZeile laesst Luecken weg', () => {
    expect(adresseZeile({ strasse: 'Kleegasse 1', plz: '38126', ort: 'Braunschweig' })).toBe('Kleegasse 1, 38126 Braunschweig');
    expect(adresseZeile({ strasse: null, plz: null, ort: 'Wuppertal' })).toBe('Wuppertal');
    expect(adresseZeile({ strasse: null, plz: null, ort: null })).toBe('');
  });
  it('fleischStatus: null ist "nicht bestaetigt", nie "kein Fleisch"', () => {
    expect(fleischStatus(null)).toEqual({ text: 'Angebot nicht bestätigt', belegt: false });
    expect(fleischStatus(true).belegt).toBe(true);
    expect(fleischStatus(false).text).toBe('Kein Fleisch');
  });
  it('sichereUrl verlinkt nur http(s)', () => {
    expect(sichereUrl('https://hof.de/laden')).toBe('https://hof.de/laden');
    expect(sichereUrl('javascript:alert(1)')).toBeNull();
    expect(sichereUrl('mailto:x@y.de')).toBeNull();
    expect(sichereUrl(null)).toBeNull();
    expect(hostAusUrl('https://www.hofladen-bosse.de/')).toBe('hofladen-bosse.de');
  });
  it('zahlAusParam klemmt auf den Bereich und faellt sauber zurueck', () => {
    expect(zahlAusParam('30', 25, 5, 100)).toBe(30);
    expect(zahlAusParam('999', 25, 5, 100)).toBe(100);
    expect(zahlAusParam('abc', 25, 5, 100)).toBe(25);
    expect(zahlAusParam(null, 25, 5, 100)).toBe(25);
  });
});

describe('scripts/lib/hoefe-osm', () => {
  it('Overpass-Query nutzt kein (?i) — das ist dort ein statischer Fehler', () => {
    expect(OVERPASS_QUERY).not.toContain('(?i)');
    expect(OVERPASS_QUERY).toContain('["shop"="farm"]');
  });

  it('fleischAusTags: Fleischarten aus produce/description, null ohne Hinweis', () => {
    expect(fleischAusTags({ produce: 'beef;pork;eggs' })).toEqual({ verkauft_fleisch: true, fleischarten: ['rind', 'schwein'] });
    expect(fleischAusTags({ description: 'Wurst und Käse, Lamm, Gänse' })).toEqual({ verkauft_fleisch: true, fleischarten: ['lamm', 'gefluegel', 'wurst'] });
    expect(fleischAusTags({ produce: 'vegetables;fruit' })).toEqual({ verkauft_fleisch: null, fleischarten: [] });
    expect(fleischAusTags({})).toEqual({ verkauft_fleisch: null, fleischarten: [] });
    expect(fleischAusTags({ description: 'vegan farm shop' })).toEqual({ verkauft_fleisch: false, fleischarten: [] });
  });

  it('fleischAusTags: "Wild" als Nachname im Namen zaehlt nicht als Wildfleisch', () => {
    expect(fleischAusTags({ name: 'Hofladen Wild' })).toEqual({ verkauft_fleisch: null, fleischarten: [] });
    expect(fleischAusTags({ name: 'Hofladen Wild', produce: 'Wildfleisch' }).fleischarten).toEqual(['wild']);
  });

  it('slugAusName: Umlaute, Sonderzeichen, OSM-ID als Suffix', () => {
    expect(slugAusName('Hofladen Müller & Söhne', 'n123')).toBe('hofladen-mueller-soehne-123');
    expect(slugAusName('Gut Schiff — Erlebnisbauernhof', 'w45')).toBe('gut-schiff-erlebnisbauernhof-45');
    expect(slugAusName('!!!', 'n9')).toBe('hofladen-9');
  });

  it('hofAusElement: Node mit Tags → Zeile; ohne Name oder ausserhalb DACH → null', () => {
    const el = {
      type: 'node', id: 248215031, lat: 52.24, lon: 10.588,
      tags: { name: 'Hofladen Bosse', produce: 'beef', organic: 'yes', 'addr:street': 'Kleegasse', 'addr:housenumber': '1', 'addr:postcode': '38126', 'addr:city': 'Braunschweig', website: 'hofladen-bosse.de', phone: '+49 531 62557' },
    };
    const h = hofAusElement(el);
    expect(h).toMatchObject({ osm_id: 'n248215031', slug: 'hofladen-bosse-248215031', bio: true, verkauft_fleisch: true, strasse: 'Kleegasse 1', plz: '38126', website: 'https://hofladen-bosse.de' });
    expect(hofAusElement({ type: 'node', id: 1, lat: 52, lon: 10, tags: {} })).toBeNull();
    expect(hofAusElement({ type: 'node', id: 1, lat: 40, lon: 10, tags: { name: 'X' } })).toBeNull();
  });

  it('hofAusElement: Hoefe in Oesterreich und der Schweiz werden uebernommen', () => {
    // Burgenland (Ostrand AT), Wallis (Suedrand CH), Vorarlberg
    expect(hofAusElement({ type: 'node', id: 11, lat: 47.85, lon: 16.95, tags: { name: 'Hof Pannonia' } })).not.toBeNull();
    expect(hofAusElement({ type: 'node', id: 12, lat: 46.05, lon: 7.4, tags: { name: 'Alp Hof' } })).not.toBeNull();
    expect(hofAusElement({ type: 'node', id: 13, lat: 47.4, lon: 9.75, tags: { name: 'Hof am See' } })).not.toBeNull();
    // Budapest liegt ausserhalb
    expect(hofAusElement({ type: 'node', id: 14, lat: 47.5, lon: 19.04, tags: { name: 'X' } })).toBeNull();
  });

  it('OVERPASS_QUERY fragt DE, AT und CH ab', () => {
    expect(OVERPASS_QUERY).toContain('^(DE|AT|CH)$');
  });

  it('plzSuche: 5-stellig = DE, 4-stellig = AT/CH, Ortsname = DACH', () => {
    expect(plzSuche('42279')).toEqual({ text: '42279 Deutschland', laender: 'de' });
    expect(plzSuche('8001')).toEqual({ text: '8001', laender: 'at,ch' });
    expect(plzSuche('Graz')).toEqual({ text: 'Graz', laender: 'de,at,ch' });
  });

  it('hofAusElement: Way nutzt center', () => {
    const h = hofAusElement({ type: 'way', id: 7, center: { lat: 50.1, lon: 8.2 }, tags: { name: 'Hof' } });
    expect(h).toMatchObject({ osm_id: 'w7', lat: 50.1, lng: 8.2 });
  });

  it('hoefeAusElementen entdoppelt Slugs', () => {
    const a = { type: 'node', id: 1, lat: 50, lon: 8, tags: { name: 'Hof' } };
    expect(hoefeAusElementen([a, a, { type: 'node', id: 2, lat: 50, lon: 8, tags: {} }])).toHaveLength(1);
  });
});
