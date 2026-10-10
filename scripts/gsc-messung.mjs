#!/usr/bin/env node
/**
 * Messung — wertet einen Abruf von scripts/gsc-abruf.mjs nach Themen-Gruppen aus
 * (SEO/GEO-Team, 10.10.2026; Messplan docs/seo-messplan-2026-10-30.md).
 *
 * Warum ein Skript: Die Gruppen sind Muster über Suchanfragen. Von Hand neu getippt
 * driften sie zwischen dem Ausgangswert und der Messung auseinander, und dann
 * vergleicht man zwei verschiedene Mengen.
 *
 * Gruppen werden der Reihe nach vergeben: eine Anfrage zählt nur in der ersten Gruppe,
 * die auf sie passt. „Steak" ist deshalb ohne Hack, Chateaubriand, Schnitzel,
 * Spanferkel und Schwein.
 *
 * AUFRUF:  node scripts/gsc-messung.mjs privat/gsc/2026-10-10_28-tage-vorher
 * Liest suchanfrage-seite.csv, seiten.csv und abruf.json aus dem Ordner (Rohdaten
 * bleiben unter privat/, ausgegeben werden nur Summen).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Reihenfolge ist Teil der Definition. */
export const GRUPPEN = [
  ['Hackfleisch / Frikadellen / Burger', /(hack|frikadell|bulett|burger|gehackt|faschiert|fleischk|hacksteak|fleischpflanz|patty)/],
  ['Chateaubriand', /chateaubriand/],
  ['Schnitzel', /schnitzel/],
  ['Spanferkel', /spanferkel/],
  ['Schwein allgemein', /schwein(?!e?hack)/],
  ['Steak / Rind / Ribeye / Filet', /(steak|rind|ribeye|rib eye|filet|entrec|tomahawk|flat iron|t.?bone)/],
  ['Geflügel / BfR', /(gefl|hähn|haehn|huhn|pute|ente|bfr|drumstick)/],
  ['Kerntemperatur allgemein', /(kerntemp|garpunkt|gartemp|temperatur)/],
];

export const SEITEN = ['/kerntemperatur-hackfleisch', '/kerntemperatur-steak', '/temperatur-guide', '/cuts/ribeye', '/rezepte/fleisch/chateaubriand-filet'];

function teile(zeile) {
  const t = zeile.split(',');
  const position = Number(t.pop());
  t.pop(); // CTR als Text — wird aus Klicks/Impressionen neu gerechnet
  const impressionen = Number(t.pop());
  const klicks = Number(t.pop());
  return { schluessel: t, klicks, impressionen, position };
}

/** CSV-Text → Zeilen mit Schlüsselspalten (Anfrage [, Seite]). */
export function leseCsv(text) {
  return text.split(/\r?\n/).slice(1).filter(Boolean).map((z) => {
    const r = teile(z);
    return { ...r, schluessel: r.schluessel.map((s) => s.replace(/^"|"$/g, '').replace(/^'/, '')) };
  });
}

const kurz = (url) => (url ?? '').replace('https://steakakademie.de', '') || '/';

/** Zeilen (Anfrage × Seite) → je Gruppe Summen. */
export function gruppiere(zeilen) {
  const vergeben = new Set();
  return GRUPPEN.map(([name, re]) => {
    const treffer = zeilen.filter((z, i) => {
      if (vergeben.has(i) || !re.test(z.schluessel[0])) return false;
      vergeben.add(i);
      return true;
    });
    const impressionen = treffer.reduce((a, z) => a + z.impressionen, 0);
    const klicks = treffer.reduce((a, z) => a + z.klicks, 0);
    const position = impressionen ? treffer.reduce((a, z) => a + z.impressionen * z.position, 0) / impressionen : null;
    const nachSeite = {};
    for (const z of treffer) nachSeite[kurz(z.schluessel[1])] = (nachSeite[kurz(z.schluessel[1])] ?? 0) + z.impressionen;
    const seiten = Object.entries(nachSeite).sort((a, b) => b[1] - a[1]).slice(0, 2)
      .map(([s, i]) => `${s} ${Math.round((100 * i) / impressionen)} %`).join(', ');
    return { name, anfragen: new Set(treffer.map((z) => z.schluessel[0])).size, impressionen, klicks, position, seiten };
  });
}

/** Seiten-CSV → Kennzahlen der beobachteten Seiten. */
export function seitenWerte(zeilen) {
  return SEITEN.map((s) => {
    const z = zeilen.find((r) => kurz(r.schluessel[0]) === s);
    return { seite: s, impressionen: z?.impressionen ?? 0, klicks: z?.klicks ?? 0, position: z?.position ?? null };
  });
}

export function tage(von, bis) {
  return Math.round((Date.parse(bis) - Date.parse(von)) / 86_400_000) + 1;
}

const f1 = (n) => (n == null ? '—' : n.toFixed(1).replace('.', ','));
const pro = (n, t) => (t ? (n / t).toFixed(1).replace('.', ',') : '—');

function main() {
  const ordner = process.argv[2];
  if (!ordner) throw new Error('Aufruf: node scripts/gsc-messung.mjs <Ordner mit dem Abruf, z. B. privat/gsc/2026-10-10_28-tage-vorher>');
  for (const d of ['suchanfrage-seite.csv', 'seiten.csv', 'abruf.json']) {
    if (!existsSync(join(ordner, d))) throw new Error(`${join(ordner, d)} fehlt — erst scripts/gsc-abruf.mjs ausführen`);
  }
  const { von, bis, suchtyp } = JSON.parse(readFileSync(join(ordner, 'abruf.json'), 'utf8'));
  const n = tage(von, bis);
  console.log(`Messung ${von} bis ${bis} (${n} Tage, ${suchtyp})\n`);
  console.log('| Gruppe | Anfragen | Impressionen | je Tag | Klicks | Ø Position | rankende Seite(n) |');
  console.log('|---|---|---|---|---|---|---|');
  for (const g of gruppiere(leseCsv(readFileSync(join(ordner, 'suchanfrage-seite.csv'), 'utf8')))) {
    console.log(`| ${g.name} | ${g.anfragen} | ${g.impressionen} | ${pro(g.impressionen, n)} | ${g.klicks} | ${f1(g.position)} | ${g.seiten || '—'} |`);
  }
  console.log('\n| Seite | Impressionen | je Tag | Klicks | CTR | Position |');
  console.log('|---|---|---|---|---|---|');
  for (const s of seitenWerte(leseCsv(readFileSync(join(ordner, 'seiten.csv'), 'utf8')))) {
    const ctr = s.impressionen ? `${((100 * s.klicks) / s.impressionen).toFixed(2).replace('.', ',')} %` : '—';
    console.log(`| ${s.seite} | ${s.impressionen} | ${pro(s.impressionen, n)} | ${s.klicks} | ${ctr} | ${f1(s.position)} |`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
