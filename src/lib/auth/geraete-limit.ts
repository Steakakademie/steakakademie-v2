import * as Sentry from '@sentry/nextjs';

/**
 * Geräte-Limit für bezahlte Kursinhalte (Entscheidung Uwe, 17.10.2026).
 *
 * Ein Kauf = eine Person. Kursinhalte sieht nur, wer auf einem der
 * MAX_GERAETE zuletzt angemeldeten Geräte des Kontos sitzt. Grundlage ist die
 * Datenbankfunktion sitzung_zugelassen() (Migration
 * 20261017094922_urkunden_schutz_geraete_limit.sql): Sie vergleicht die
 * session_id des Zugriffstokens mit den neuesten Einträgen in auth.sessions.
 *
 * Ein älteres Gerät bleibt angemeldet, bekommt aber keine Kursinhalte mehr —
 * es landet auf /auth/geraete und kann dort die anderen Geräte abmelden.
 *
 * Fail-open: Antwortet die Datenbank nicht oder fehlt die Funktion (frische
 * Vorschau vor der Migration), entscheidet die Buchung allein. Ein zahlender
 * Kunde soll nie wegen einer Störung hier vor einer Sperre stehen.
 */

import { MAX_GERAETE, GERAETE_PFAD } from './geraete-konstanten';

export { MAX_GERAETE, GERAETE_PFAD };

/** Ab so vielen NEUEN Anmeldungen in 7 Tagen gilt ein Konto als auffällig. */
export const AUFFAELLIG_AB_ANMELDUNGEN_7D = 6;


type RpcFaehig = {
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

export type GeraetePruefung = { zugelassen: boolean; anmeldungen7d: number };

/**
 * Prüft die aktuelle Sitzung. `supabase` muss ein NUTZER-Client sein (Cookies
 * bzw. Nutzer-Token) — mit dem Service-Client gibt es keine session_id, die
 * Funktion meldet dann „zugelassen".
 */
export async function pruefeGeraet(supabase: unknown, userId?: string | null): Promise<GeraetePruefung> {
  const client = supabase as Partial<RpcFaehig> | null;
  if (!client || typeof client.rpc !== 'function') return { zugelassen: true, anmeldungen7d: 0 };
  try {
    const { data, error } = await client.rpc('sitzung_zugelassen', { p_max: MAX_GERAETE });
    if (error) {
      console.warn('[geraete-limit] Prüfung nicht möglich, Zugang bleibt:', error.message);
      return { zugelassen: true, anmeldungen7d: 0 };
    }
    const zeile = (Array.isArray(data) ? data[0] : data) as { zugelassen?: boolean; sitzungen_7d?: number } | null;
    const ergebnis = {
      zugelassen: zeile?.zugelassen !== false,
      anmeldungen7d: typeof zeile?.sitzungen_7d === 'number' ? zeile.sitzungen_7d : 0,
    };
    if (ergebnis.anmeldungen7d >= AUFFAELLIG_AB_ANMELDUNGEN_7D) meldeAuffaellig(userId ?? null, ergebnis.anmeldungen7d);
    return ergebnis;
  } catch (err) {
    console.warn('[geraete-limit] Prüfung fehlgeschlagen, Zugang bleibt:', err instanceof Error ? err.message : err);
    return { zugelassen: true, anmeldungen7d: 0 };
  }
}

/**
 * Hinweis an Uwe (Sentry legt ein Issue an und mailt). Ein Issue pro Konto
 * (Fingerprint), damit Seitenaufrufe desselben Kontos nicht als Rauschen
 * einzeln auflaufen. Keine E-Mail-Adresse — nur die Konto-ID.
 */
function meldeAuffaellig(userId: string | null, anzahl: number) {
  try {
    Sentry.captureMessage('Geräte-Limit: auffällig viele neue Anmeldungen auf einem Konto (Weitergabe?)', {
      level: 'warning',
      fingerprint: ['geraete-auffaellig', userId ?? 'unbekannt'],
      tags: { bereich: 'geraete-limit' },
      extra: { userId, neueAnmeldungen7Tage: anzahl, schwelle: AUFFAELLIG_AB_ANMELDUNGEN_7D },
    });
  } catch {
    // Melden darf den Zugriff nie stören.
  }
}

/** Ziel für die Weiterleitung eines gesperrten Geräts — nur interne Pfade. */
export function geraeteZiel(zurueck: string): string {
  const sicher = zurueck.startsWith('/') && !zurueck.startsWith('//') ? zurueck : '/meine-kurse';
  return `${GERAETE_PFAD}?redirectTo=${encodeURIComponent(sicher)}`;
}
