import { describe, expect, it } from 'vitest';
import { gueltigBisText } from './gutschein-gueltigkeit';

describe('gueltigBisText', () => {
  it('zeigt valid_until aus der Datenbank in Berliner Zeit', () => {
    // 31.12.2029 23:59:59 Berlin (Winterzeit) = 22:59:59 UTC
    expect(gueltigBisText('2029-12-31T22:59:59+00:00')).toBe('31.12.2029');
  });

  it('rechnet ohne valid_until die AGB-Regel nach: 31.12. des dritten Folgejahres', () => {
    expect(gueltigBisText(null, new Date('2026-11-15T10:00:00Z'))).toBe('31.12.2029');
  });

  it('Silvesterabend in Berlin zählt noch zum alten Jahr', () => {
    // 31.12.2026 23:30 Berlin = 22:30 UTC
    expect(gueltigBisText(null, new Date('2026-12-31T22:30:00Z'))).toBe('31.12.2029');
  });

  it('Neujahr nach Mitternacht Berlin zählt zum neuen Jahr', () => {
    // 01.01.2027 00:30 Berlin = 31.12.2026 23:30 UTC
    expect(gueltigBisText(null, new Date('2026-12-31T23:30:00Z'))).toBe('31.12.2030');
  });

  it('ungültiger Wert fällt auf die Ersatzrechnung zurück', () => {
    expect(gueltigBisText('kein-datum', new Date('2027-03-01T12:00:00Z'))).toBe('31.12.2030');
  });
});
