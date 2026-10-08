import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { KURSDATEIEN, istKursdatei, kursdateiPfad } from '@/lib/eigenregie/kursdateien';

describe('Kursdateien (nur Whitelist erreicht das Dateisystem)', () => {
  it('liefert für jede erlaubte Datei einen Pfad unter privat/kursdateien', () => {
    for (const name of Object.keys(KURSDATEIEN)) {
      expect(kursdateiPfad(name, '/w')).toBe(path.join('/w', 'privat', 'kursdateien', name));
    }
  });

  it.each(['../package.json', '..%2Fpackage.json', 'eigenregie-blueprint.md/../x', '', 'constructor', 'toString'])(
    'lehnt %j ab',
    (name) => {
      expect(istKursdatei(name)).toBe(false);
      expect(kursdateiPfad(name)).toBeNull();
    },
  );

  it('enthält nur schlichte Dateinamen', () => {
    for (const name of Object.keys(KURSDATEIEN)) expect(name).toMatch(/^[a-z0-9-]+\.md$/);
  });
});
