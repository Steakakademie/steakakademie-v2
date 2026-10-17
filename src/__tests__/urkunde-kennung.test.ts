import { describe, it, expect } from 'vitest';
import { zerlegeKennung, kennungAus, pruefPfad, urkundenZeile } from '@/lib/urkunde/kennung';

describe('Urkunden-Kennung (Nummer + Prüfcode, 17.10.2026)', () => {
  it('setzt Nummer und Code zusammen und wieder auseinander', () => {
    const k = kennungAus('SA-2026-0001', 'K7Q2XM');
    expect(k).toBe('SA-2026-0001-K7Q2XM');
    expect(zerlegeKennung(k)).toEqual({ nr: 'SA-2026-0001', code: 'K7Q2XM' });
    expect(pruefPfad('SA-2026-0001', 'K7Q2XM')).toBe('/urkunde/SA-2026-0001-K7Q2XM');
    expect(urkundenZeile('SA-2026-0001', 'K7Q2XM')).toBe('Urkunden-Nr. SA-2026-0001-K7Q2XM');
  });

  it('verzeiht Kleinschreibung und Leerzeichen beim Abtippen', () => {
    expect(zerlegeKennung('  sa-2026-0001-k7q2xm ')).toEqual({ nr: 'SA-2026-0001', code: 'K7Q2XM' });
    expect(zerlegeKennung('SA-2026-0001 - K7Q2XM')).toEqual({ nr: 'SA-2026-0001', code: 'K7Q2XM' });
  });

  it('ohne Prüfcode keine Kennung — die Nummer allein reicht nicht', () => {
    expect(zerlegeKennung('SA-2026-0001')).toBeNull();
    expect(zerlegeKennung('SA-2026-0001-K7Q2X')).toBeNull();
    // 0, O, 1, I kommen im Code nicht vor (Verwechslungsgefahr) — Datenbank-CHECK ^[A-Z2-9]{6}$
    expect(zerlegeKennung('SA-2026-0001-K7Q2X0')).toBeNull();
    expect(zerlegeKennung('')).toBeNull();
    expect(zerlegeKennung(null)).toBeNull();
  });
});
