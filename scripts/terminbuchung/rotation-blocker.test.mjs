import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KONFIG: k, istBuchbar, zuBlockendeTage, rhythmusWoche, feiertageNRW, datum, sollBlocker, plusTage, ymd } = require('./rotation-blocker.cjs');
// Rhythmus-Tests ab dem Anker 05.10.; live gilt ersterTag 02.11. (eigener Test unten)
const kr = { ...k, ersterTag: '2026-10-05' };
const tage = (liste) => liste.map((s) => istBuchbar(datum(s), kr));

describe('Rotations-Blocker Terminbuchung (Rhythmus Uwe, 26.09.2026)', () => {
  it('Woche 1–4 ab 05.10.2026: Mo Mi Fr · Di Mi Do · Mo–Fr · Mo Di Do Fr', () => {
    expect(tage(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'])).toEqual([true, false, true, false, true]);
    expect(tage(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'])).toEqual([false, true, true, true, false]);
    expect(tage(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'])).toEqual([true, true, true, true, true]);
    expect(tage(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'])).toEqual([true, true, false, true, true]);
    expect(rhythmusWoche(datum('2026-11-02'), k.anker)).toBe(1);
  });

  it('live: vor dem 02.11.2026 nichts buchbar, danach im Rhythmus', () => {
    expect(k.ersterTag).toBe('2026-11-02');
    expect(istBuchbar(datum('2026-10-30'), k)).toBe(false);
    expect(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-06'].map((s) => istBuchbar(datum(s), k))).toEqual([true, false, true, true]);
  });

  it('vor dem ersten Tag, am Wochenende und an NRW-Feiertagen nichts buchbar', () => {
    expect(tage(['2026-09-28', '2026-10-10', '2026-10-11'])).toEqual([false, false, false]);
    const f = feiertageNRW(2026);
    for (const s of ['2026-04-03', '2026-04-06', '2026-05-14', '2026-05-25', '2026-06-04', '2026-12-25']) expect(f).toContain(s);
    expect(f).not.toContain('2026-12-24');
    expect(istBuchbar(datum('2027-05-27'), k)).toBe(false); // Fronleichnam 2027
  });

  it('Rotations-Blocker decken den ganzen Tag 09:00–17:00', () => {
    const tage = Object.entries(sollBlocker(datum('2026-10-05'), { ...kr, zufall: { ...k.zufall, aktiv: false } })).map(([key]) => key);
    expect(tage).toContain('2026-10-06@09:00-17:00');
  });

  it('Blockliste enthält nur Werktage außerhalb des Rhythmus', () => {
    const bl = zuBlockendeTage(datum('2026-09-27'), kr);
    expect(bl).toContain('2026-09-28');
    expect(bl).toContain('2026-10-06');
    expect(bl).not.toContain('2026-10-05');
    expect(bl.every((s) => { const w = datum(s).getDay(); return w > 0 && w < 6; })).toBe(true);
  });

  describe('Zufallsblocker (Belegt-Optik)', () => {
    const heute = datum('2026-10-05');
    const zufall = (belegt) => Object.entries(sollBlocker(heute, kr, belegt)).filter(([key, t]) => {
      if (t !== k.zufall.titel) return false;
      const [tag, zeit] = key.split('@');
      return !(belegt ? belegt(tag) : []).includes(zeit.split('-')[0]); // Raster-Blocker echter Termine nicht mitzählen
    }).map(([key]) => key);
    const proTag = (keys) => keys.reduce((m, key) => { const t = key.split('@')[0]; m[t] = (m[t] || 0) + 1; return m; }, {});

    it('nur an buchbaren Tagen, vom Terminbeginn bis zum nächsten (60 + 30 Min), stabil bei jedem Lauf', () => {
      const a = zufall();
      expect(a).toEqual(zufall());
      const erlaubt = ['09:00-10:30', '10:30-12:00', '13:00-14:30', '14:30-16:00', '16:00-17:30'];
      for (const key of a) {
        const [tag, zeit] = key.split('@');
        expect(istBuchbar(datum(tag), kr)).toBe(true);
        expect(erlaubt).toContain(zeit);
      }
    });

    it('vorne voller als hinten, und nicht jeder Tag gleich', () => {
      const n = proTag(zufall());
      const tage = Object.keys(n).sort();
      const nah = tage.filter((t) => t <= ymd(plusTage(heute, 14))).map((t) => n[t]);
      nah.forEach((x) => { expect(x).toBeGreaterThanOrEqual(1); expect(x).toBeLessThanOrEqual(3); });
      const fern = Array.from({ length: 63 }, (_, i) => plusTage(heute, i)).filter((d) => istBuchbar(d, kr) && ymd(d) > ymd(plusTage(heute, 35))).map((d) => n[ymd(d)] || 0);
      fern.forEach((x) => expect(x).toBeLessThanOrEqual(1));
      expect(new Set(nah).size).toBeGreaterThan(1);
      const stundenMuster = new Set(tage.map((t) => zufall().filter((key) => key.startsWith(t)).map((key) => key.split('@')[1]).sort().join()));
      expect(stundenMuster.size).toBeGreaterThan(4);
    });

    it('echte Termine werden angerechnet und nie doppelt geblockt', () => {
      const ohne = proTag(zufall())['2026-10-05'];
      const mit = zufall((tag) => (tag === '2026-10-05' ? ['09:00'] : []));
      expect(mit.filter((key) => key.startsWith('2026-10-05')).length).toBe(Math.max(0, ohne - 1));
      expect(mit.some((key) => key === '2026-10-05@09:00-10:30')).toBe(false);
      expect(zufall((tag) => (tag === '2026-10-05' ? ['09:00', '10:30', '13:00'] : [])).some((key) => key.startsWith('2026-10-05'))).toBe(false);
    });

    it('echte Termine werden ins Raster gezogen (Blocker bis zum nächsten Terminbeginn)', () => {
      const s = sollBlocker(heute, kr, (tag) => (tag === '2026-10-05' ? ['13:00'] : []));
      expect(s['2026-10-05@13:00-14:30']).toBe(k.zufall.titel);
    });

    it('abschaltbar', () => {
      expect(Object.values(sollBlocker(heute, { ...kr, zufall: { ...k.zufall, aktiv: false } })).every((t) => t === k.titel)).toBe(true);
    });
  });
});
