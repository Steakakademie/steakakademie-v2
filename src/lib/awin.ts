/**
 * AWIN-Deeplinks — aus Advertiser-ID und Ziel-URL den Trackinglink bauen
 * (docs/affiliate-strategie-2026.md, „Technik", Schritt 2; 10.10.2026).
 *
 * Damit braucht nicht jeder Link einen Gang ins AWIN-Backend: eine Zeile im Code
 * oder Register genügt. Der Klick läuft danach wie alle Partnerlinks über unsere
 * eigene Weiterleitung (/go/…, /go-fleisch/…) — dort wird gezählt und gekennzeichnet.
 *
 * Die Publisher-ID steht in jedem AWIN-Link im Klartext; sie ist keine Zugangsdaten.
 *
 * Reiner Code ohne Dateizugriff und ohne 'use client' (CLAUDE.md A, 06.09.2026).
 */

export const AWIN_PUBLISHER_ID = '3102406';

/**
 * Zugelassene Advertiser (Postfach, Stand 09.10.2026). `domain` ist die Händlerseite,
 * auf die Deeplinks zeigen dürfen — AWIN lehnt Ziele auf fremden Domains ab, und ein
 * Tippfehler würde sonst still einen Link ohne Provision erzeugen.
 */
export const AWIN_ADVERTISER = {
  santosgrills: { id: 32287, name: 'Santos Grills DE', domain: 'santosgrills.de' },
  'bos-food': { id: 19712, name: 'BOS FOOD DE', domain: 'bosfood.de' },
  sharkninja: { id: 19810, name: 'SharkNinja DE', domain: 'sharkninja.de' },
  burghardt: { id: 115505, name: 'Burghardt Delicious', domain: 'burghardt-delicious.com' },
} as const;

export type AwinAdvertiser = keyof typeof AWIN_ADVERTISER;

/** clickref: kurzer Platz-Schlüssel für die AWIN-Auswertung (nur a–z, 0–9, Bindestrich, Unterstrich). */
const CLICKREF = /^[a-z0-9_-]{1,50}$/;

function hostGehoertZu(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/**
 * Trackinglink: https://www.awin1.com/cread.php?awinmid=<ID>&awinaffid=<Publisher>&clickref=<Platz>&ued=<Ziel>
 * Wirft bei einem Ziel, das nicht https ist oder nicht zur Domain des Advertisers gehört.
 */
export function awinLink(advertiser: AwinAdvertiser, ziel: string, clickref?: string): string {
  const a = AWIN_ADVERTISER[advertiser];
  let url: URL;
  try {
    url = new URL(ziel);
  } catch {
    throw new Error(`AWIN: Ziel ist keine URL: ${ziel}`);
  }
  if (url.protocol !== 'https:') throw new Error(`AWIN: Ziel muss https sein: ${ziel}`);
  if (!hostGehoertZu(url.hostname, a.domain)) {
    throw new Error(`AWIN: ${url.hostname} gehört nicht zu ${a.name} (${a.domain})`);
  }
  if (clickref !== undefined && !CLICKREF.test(clickref)) {
    throw new Error(`AWIN: clickref ungültig: ${clickref}`);
  }

  const q = new URLSearchParams({ awinmid: String(a.id), awinaffid: AWIN_PUBLISHER_ID });
  if (clickref) q.set('clickref', clickref);
  q.set('ued', url.toString());
  return `https://www.awin1.com/cread.php?${q.toString()}`;
}
