/**
 * Admin-Erkennung — EINE Stelle für alles, was mit ADMIN_PASSWORD zu tun hat.
 *
 * Haertung 05.09.2026: Bis dahin stand an sechs Stellen
 * `cookie === process.env.ADMIN_PASSWORD`. Ist die Variable in einer Umgebung
 * nicht gesetzt (Preview-Deployment ohne Scope, lokale Kopie, Build-Gate),
 * vergleicht das `undefined === undefined` — und JEDER Besucher ist Admin:
 * /admin, /api/admin/*, /api/pm-agent/* und die Volltexte der Bezahl-Lektionen
 * stehen dann offen. Ohne gesetztes Passwort gibt es ab jetzt keinen Admin.
 *
 * Haertung 02.10.2026: Bis dahin WAR der Cookie-Wert das Passwort. Es lag damit
 * sieben Tage im Klartext im Browser und ging mit jeder Anfrage ueber die
 * Leitung — wer den Cookie einmal sah (Browser-Profil, Proxy-Log, Support-
 * Screenshot), hatte das Passwort selbst. Jetzt traegt der Cookie ein
 * signiertes Sitzungs-Token mit Ablaufzeit:
 *
 *     v1.<ablauf in Sekunden>.<HMAC-SHA256 hex>
 *
 * Schluessel der Signatur ist ADMIN_PASSWORD. Daraus folgt ohne weiteren
 * Zustand: Passwort aendern = alle Sitzungen beenden. Das Passwort selbst
 * verlaesst den Server nicht mehr.
 *
 * Zwei Funktionen, zwei Zwecke — nicht verwechseln:
 *   istAdminPasswort(eingabe)  NUR im Login (POST /api/admin/auth)
 *   istAdminCookie(cookieWert) ueberall sonst
 *
 * Web Crypto (globalThis.crypto.subtle) statt node:crypto, weil guard.ts auch
 * in Edge-Routen laeuft (/api/chat). Deshalb sind Token-Funktionen asynchron.
 */

/** Name des Sitzungs-Cookies. Nirgends sonst als Zeichenkette tippen. */
export const ADMIN_COOKIE = 'admin_auth';

/** Lebensdauer einer Admin-Sitzung in Sekunden (7 Tage, wie bisher). */
export const ADMIN_SITZUNG_SEKUNDEN = 60 * 60 * 24 * 7;

const VERSION = 'v1';

function passwort(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return typeof pw === 'string' && pw.length > 0 ? pw : null;
}

/** Vergleich ohne vorzeitigen Abbruch — die Laufzeit verraet keine Trefferlaenge. */
function gleich(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

async function signatur(ablauf: number, pw: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(pw),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(`admin-sitzung.${VERSION}.${ablauf}`));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Passwort-Eingabe pruefen — ausschliesslich fuer den Login-Endpunkt.
 * Ein Cookie-Wert wird hiermit NICHT mehr geprueft (siehe istAdminCookie).
 */
export function istAdminPasswort(value: string | null | undefined): boolean {
  const pw = passwort();
  return pw !== null && typeof value === 'string' && gleich(value, pw);
}

/**
 * Sitzungs-Token fuer den Cookie erzeugen. `null`, wenn kein Passwort gesetzt
 * ist — dann gibt es keinen Admin und auch kein Token.
 */
export async function erzeugeAdminToken(jetztMs: number = Date.now()): Promise<string | null> {
  const pw = passwort();
  if (pw === null) return null;
  const ablauf = Math.floor(jetztMs / 1000) + ADMIN_SITZUNG_SEKUNDEN;
  return `${VERSION}.${ablauf}.${await signatur(ablauf, pw)}`;
}

/**
 * Cookie-Wert pruefen: richtige Version, nicht abgelaufen, Signatur passt zum
 * aktuellen ADMIN_PASSWORD. Das rohe Passwort als Cookie-Wert gilt NICHT mehr.
 */
export async function istAdminCookie(
  value: string | null | undefined,
  jetztMs: number = Date.now(),
): Promise<boolean> {
  const pw = passwort();
  if (pw === null || typeof value !== 'string') return false;

  const teile = value.split('.');
  if (teile.length !== 3 || teile[0] !== VERSION) return false;

  const ablauf = Number(teile[1]);
  if (!Number.isInteger(ablauf) || !/^\d{1,12}$/.test(teile[1])) return false;
  if (ablauf <= Math.floor(jetztMs / 1000)) return false;

  try {
    return gleich(teile[2], await signatur(ablauf, pw));
  } catch {
    return false;
  }
}
