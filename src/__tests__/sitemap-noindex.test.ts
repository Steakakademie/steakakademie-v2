/**
 * Sitemap und noindex duerfen sich nicht widersprechen (03.10.2026).
 *
 * Eine Seite, die `robots: { index: false }` traegt und trotzdem in der Sitemap
 * steht, sendet zwei Signale gleichzeitig. Das ist zweimal passiert: am
 * 01.10.2026 standen 163 noindex-Seiten in der Sitemap, am 03.10.2026 kam mit
 * /newsletter/bestaetigt die naechste dazu. next-sitemap nimmt jede statische
 * Route aus dem Build-Manifest — der Ausschluss muss von Hand in
 * next-sitemap.config.js stehen, und genau das wird vergessen.
 *
 * Geprueft wird der Quelltext: jede page.tsx, die in ihrem statischen
 * `export const metadata` noindex setzt (oder unter einem Layout liegt, das es
 * tut), muss von der Ausschlussliste erfasst sein. Seiten, die noindex nur
 * bedingt setzen (generateMetadata, z. B. /artikel und /hoefe/[slug]), sind
 * bewusst nicht erfasst — dort entscheidet die Datenlage zur Laufzeit.
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = join(ROOT, 'src', 'app');
const require_ = createRequire(import.meta.url);
const config = require_(join(ROOT, 'next-sitemap.config.js')) as { exclude: string[] };

/** Wie next-sitemap: `*` steht fuer beliebig viele Zeichen, auch Schraegstriche. */
function ausgeschlossen(route: string): boolean {
  return config.exclude.some((muster) => {
    if (!muster.includes('*')) return muster === route;
    const re = new RegExp('^' + muster.split('*').map((t) => t.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    return re.test(route);
  });
}

function seiten(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const voll = join(dir, e.name);
    if (e.isDirectory()) seiten(voll, out);
    else if (e.name === 'page.tsx') out.push(voll);
  }
  return out;
}

/** Route einer Datei unter src/app — Routengruppen `(name)` fallen weg. */
function routeVon(datei: string): string {
  const teile = relative(APP, dirname(datei)).split(sep).filter((t) => t && !/^\(.*\)$/.test(t));
  return '/' + teile.join('/');
}

/** Setzt das STATISCHE Metadata-Objekt der Datei noindex? */
function statischNoindex(datei: string): boolean {
  if (!existsSync(datei)) return false;
  const text = readFileSync(datei, 'utf-8');
  const start = text.search(/export const metadata\b/);
  if (start < 0) return false;
  // Bis zur naechsten Export-Anweisung reicht als Ausschnitt.
  const rest = text.slice(start + 1);
  const ende = rest.search(/\nexport /);
  const block = ende < 0 ? rest : rest.slice(0, ende);
  return /robots:\s*\{[^}]*index:\s*false/.test(block);
}

/** noindex durch die Seite selbst oder durch ein Layout darueber. */
function istNoindex(seite: string): boolean {
  if (statischNoindex(seite)) return true;
  let dir = dirname(seite);
  while (dir.startsWith(APP) && dir !== APP) {
    if (statischNoindex(join(dir, 'layout.tsx'))) return true;
    dir = dirname(dir);
  }
  return false;
}

describe('next-sitemap.config.js — noindex-Seiten stehen nicht in der Sitemap', () => {
  const alle = seiten(APP);
  const noindex = alle.filter(istNoindex).map(routeVon).sort();

  it('der Scan findet die bekannten noindex-Seiten', () => {
    expect(alle.length).toBeGreaterThan(100);
    expect(noindex).toContain('/newsletter/bestaetigt');
    expect(noindex).toContain('/suche');
    expect(noindex).toContain('/home-b');
  });

  it('die Bestaetigungsseite des Newsletters ist ausgeschlossen', () => {
    expect(ausgeschlossen('/newsletter/bestaetigt')).toBe(true);
  });

  it('jede statisch als noindex markierte Seite ist von der Ausschlussliste erfasst', () => {
    const offen = noindex.filter((route) => !ausgeschlossen(route));
    expect(offen).toEqual([]);
  });

  it('der Ausschluss trifft nicht mehr als gewollt', () => {
    // Indexierte Nachbarn der neu ausgeschlossenen Routen bleiben drin.
    for (const route of ['/newsletter', '/gutschein', '/', '/rezepte', '/diplome', '/hoefe']) {
      expect(ausgeschlossen(route), route).toBe(false);
    }
  });
});
