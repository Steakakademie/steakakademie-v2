import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ZUORDNUNG, zielErsetzbar } from './kursinhalte-holen.mjs';

describe('kursinhalte-holen', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kursinhalte-'));

  it('ersetzt fehlende Ziele, Verknüpfungen und markierte Kopien', () => {
    expect(zielErsetzbar(path.join(tmp, 'fehlt'))).toBe(true);
    const kopie = path.join(tmp, 'kopie');
    fs.mkdirSync(kopie);
    fs.writeFileSync(path.join(kopie, '.aus-kursinhalte'), '');
    expect(zielErsetzbar(kopie)).toBe(true);
    const link = path.join(tmp, 'link');
    fs.symlinkSync(kopie, link, 'dir');
    expect(zielErsetzbar(link)).toBe(true);
  });

  it('überschreibt nie einen echten Ordner ohne Marke (ungesicherte Arbeit)', () => {
    const echt = path.join(tmp, 'echt');
    fs.mkdirSync(echt);
    fs.writeFileSync(path.join(echt, 'lektion.mdx'), 'x');
    expect(zielErsetzbar(echt)).toBe(false);
  });

  it('hält bezahlte Ordner aus dem öffentlichen Repo heraus (.gitignore)', () => {
    for (const { ziel } of ZUORDNUNG) {
      const r = spawnSync('git', ['check-ignore', '-q', '--no-index', `${ziel}/x.mdx`], { cwd: process.cwd() });
      expect(r.status, `${ziel} fehlt in .gitignore`).toBe(0);
    }
  });
});

describe('lokaleAenderungen', () => {
  it('meldet geänderte und zusätzliche Dateien der Kopie', async () => {
    const { lokaleAenderungen } = await import('./kursinhalte-holen.mjs');
    const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'kursinhalte-diff-'));
    const quelle = path.join(basis, 'q');
    const kopie = path.join(basis, 'k');
    fs.mkdirSync(quelle); fs.mkdirSync(kopie);
    fs.writeFileSync(path.join(quelle, 'a.mdx'), 'gleich');
    fs.writeFileSync(path.join(kopie, 'a.mdx'), 'gleich');
    fs.writeFileSync(path.join(kopie, '.aus-kursinhalte'), '');
    expect(lokaleAenderungen(kopie, quelle)).toEqual([]);
    fs.writeFileSync(path.join(kopie, 'a.mdx'), 'geändert');
    fs.writeFileSync(path.join(kopie, 'neu.mdx'), 'neu');
    expect(lokaleAenderungen(kopie, quelle).sort()).toEqual(['a.mdx', 'neu.mdx']);
  });
});
