import 'server-only';
import { unstable_cache } from 'next/cache';
import { gunzipSync } from 'node:zlib';
import type { AwinAdvertiser } from '@/lib/awin';

/**
 * AWIN-Produktfeed (22.10.2026) — Lagerstand, Bild und Provisionsgruppe je Gerät.
 *
 * Die Feed-URL enthält den persönlichen Feed-Schlüssel des Publishers und
 * kommt NUR aus der Umgebung (`AWIN_FEED_SHARKNINJA`, in Vercel als Secret).
 * Sie steht nie im Repo, nie im Chat, nie in Docs — und wird hier auch nie
 * geloggt. Fehlt die Variable, gibt es keinen Feed: die Aufrufer fallen dann
 * auf den Zustand „unbekannt“ zurück (Link bleibt, aber ohne Lager-Versprechen).
 *
 * Spalten: AWIN liefert, was die URL unter `columns/…` nennt. Wir lesen nach
 * Spaltenname, nicht nach Position — die Reihenfolge darf sich ändern.
 * Geparst wird die Awin-CSV (Komma, Anführungszeichen, gzip oder roh).
 *
 * Cache: einmal täglich (unstable_cache, revalidate 24 h, Tag `awin-feed`).
 * Der Feed selbst wird bei AWIN einmal täglich erneuert.
 */

export interface FeedProdukt {
  /** merchant_product_id — bei SharkNinja die SKU (z. B. CI100EU). */
  sku: string;
  name: string;
  deepLink: string;
  bildUrl: string | null;
  /** `true` lieferbar, `false` nicht, `null` unbekannt (Spalte fehlt/leer). */
  lieferbar: boolean | null;
  provisionsgruppe: string | null;
  zustand: string | null;
}

export type FeedStand =
  | { status: 'ok'; produkte: Map<string, FeedProdukt>; geladen: string }
  | { status: 'fehlt' | 'fehler'; produkte: Map<string, FeedProdukt>; geladen: null };

/** Feed-URL je Advertiser aus der Umgebung — weitere Partner hier ergänzen. */
const ENV: Partial<Record<AwinAdvertiser, string>> = { sharkninja: 'AWIN_FEED_SHARKNINJA' };
export type FeedAdvertiser = AwinAdvertiser;

const REVALIDATE_SEKUNDEN = 24 * 60 * 60;
const MAX_BYTES = 25 * 1024 * 1024;

/** Minimaler CSV-Parser (RFC-4180-nah): Komma, doppelte Anführungszeichen, Zeilenumbrüche in Feldern. */
export function parseCsv(text: string): string[][] {
  const zeilen: string[][] = [];
  let zeile: string[] = [];
  let feld = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') {
        if (text[i + 1] === '"') { feld += '"'; i++; } else inQuote = false;
      } else feld += c;
      continue;
    }
    if (c === '"') inQuote = true;
    else if (c === ',') { zeile.push(feld); feld = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      zeile.push(feld); feld = '';
      if (zeile.some((f) => f.length)) zeilen.push(zeile);
      zeile = [];
    } else feld += c;
  }
  if (feld.length || zeile.length) { zeile.push(feld); if (zeile.some((f) => f.length)) zeilen.push(zeile); }
  return zeilen;
}

function wahrheit(v: string | undefined): boolean | null {
  if (v === undefined) return null;
  const t = v.trim().toLowerCase();
  if (!t) return null;
  if (['1', 'true', 'yes', 'ja', 'in stock', 'instock', 'in_stock', 'available'].includes(t)) return true;
  if (['0', 'false', 'no', 'nein', 'out of stock', 'outofstock', 'out_of_stock', 'unavailable'].includes(t)) return false;
  return null;
}

export function feedAusCsv(text: string): Map<string, FeedProdukt> {
  const rows = parseCsv(text);
  const kopf = rows[0]?.map((h) => h.trim().toLowerCase()) ?? [];
  const idx = (name: string) => kopf.indexOf(name);
  const iSku = idx('merchant_product_id');
  const iName = idx('product_name');
  const iDeep = idx('aw_deep_link');
  const iImg = idx('merchant_image_url');
  const iImg2 = idx('aw_image_url');
  const iStock = idx('in_stock');
  const iStockStatus = idx('stock_status');
  const iGruppe = idx('commission_group');
  const iCond = idx('condition');
  const out = new Map<string, FeedProdukt>();
  if (iSku < 0) return out;
  for (const r of rows.slice(1)) {
    const sku = (r[iSku] ?? '').trim();
    if (!sku) continue;
    const lieferbar = wahrheit(r[iStock]) ?? wahrheit(r[iStockStatus]);
    out.set(sku.toUpperCase(), {
      sku,
      name: r[iName] ?? '',
      deepLink: r[iDeep] ?? '',
      bildUrl: (iImg >= 0 && r[iImg]) || (iImg2 >= 0 && r[iImg2]) || null,
      lieferbar,
      provisionsgruppe: iGruppe >= 0 && r[iGruppe] ? r[iGruppe] : null,
      zustand: iCond >= 0 && r[iCond] ? r[iCond] : null,
    });
  }
  return out;
}

async function ladeRoh(advertiser: FeedAdvertiser): Promise<FeedStand> {
  const name = ENV[advertiser];
  const url = name ? process.env[name] : undefined;
  if (!url) return { status: 'fehlt', produkte: new Map(), geladen: null };
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000), cache: 'no-store' });
    if (!res.ok) return { status: 'fehler', produkte: new Map(), geladen: null };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) return { status: 'fehler', produkte: new Map(), geladen: null };
    const istGzip = buf[0] === 0x1f && buf[1] === 0x8b;
    const text = (istGzip ? gunzipSync(buf) : buf).toString('utf8');
    return { status: 'ok', produkte: feedAusCsv(text), geladen: new Date().toISOString() };
  } catch {
    return { status: 'fehler', produkte: new Map(), geladen: null };
  }
}

const ladeGecacht = unstable_cache(
  async (advertiser: FeedAdvertiser) => {
    const stand = await ladeRoh(advertiser);
    // Map ist nicht serialisierbar — als Einträge ablegen.
    return { status: stand.status, geladen: stand.geladen, eintraege: [...stand.produkte.entries()] };
  },
  ['awin-feed-v1'],
  { revalidate: REVALIDATE_SEKUNDEN, tags: ['awin-feed'] },
);

export async function awinFeed(advertiser: FeedAdvertiser): Promise<FeedStand> {
  const s = await ladeGecacht(advertiser);
  const produkte = new Map<string, FeedProdukt>(s.eintraege);
  return s.status === 'ok'
    ? { status: 'ok', produkte, geladen: s.geladen as string }
    : { status: s.status, produkte, geladen: null };
}

/** SKU aus einer sharkninja.de-Produkt-URL: …/<slug>/<SKU>.html */
export function skuAusUrl(url: string): string | null {
  const m = url.match(/\/([A-Z0-9-]+)\.html(?:[?#].*)?$/i);
  return m ? m[1].toUpperCase() : null;
}
