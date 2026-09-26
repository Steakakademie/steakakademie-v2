import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KONFIG: k, istBuchbar, zuBlockendeTage, rhythmusWoche, feiertageNRW, datum } = require('./rotation-blocker.cjs');
const tage = (liste) => liste.map((s) => istBuchbar(datum(s), k));

describe('Rotations-Blocker Terminbuchung (Rhythmus Uwe, 26.09.2026)', () => {
  it('Woche 1–4 ab 05.10.2026: Mo Mi Fr · Di Mi Do · Mo–Fr · Mo Di Do Fr', () => {
    expect(tage(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'])).toEqual([true, false, true, false, true]);
    expect(tage(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'])).toEqual([false, true, true, true, false]);
    expect(tage(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'])).toEqual([true, true, true, true, true]);
    expect(tage(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'])).toEqual([true, true, false, true, true]);
    expect(rhythmusWoche(datum('2026-11-02'), k.anker)).toBe(1);
  });

  it('vor dem ersten Tag, am Wochenende und an NRW-Feiertagen nichts buchbar', () => {
    expect(tage(['2026-09-28', '2026-10-10', '2026-10-11'])).toEqual([false, false, false]);
    const f = feiertageNRW(2026);
    for (const s of ['2026-04-03', '2026-04-06', '2026-05-14', '2026-05-25', '2026-06-04', '2026-12-25']) expect(f).toContain(s);
    expect(f).not.toContain('2026-12-24');
    expect(istBuchbar(datum('2027-05-27'), k)).toBe(false); // Fronleichnam 2027
  });

  it('Blockliste enthält nur Werktage außerhalb des Rhythmus', () => {
    const bl = zuBlockendeTage(datum('2026-09-27'), k);
    expect(bl).toContain('2026-09-28');
    expect(bl).toContain('2026-10-06');
    expect(bl).not.toContain('2026-10-05');
    expect(bl.every((s) => { const w = datum(s).getDay(); return w > 0 && w < 6; })).toBe(true);
  });
});
