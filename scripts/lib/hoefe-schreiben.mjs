/**
 * Hofladen-Radar — Schreiben nach Supabase, ohne dass EINE abgelehnte Zeile den
 * ganzen Wochenlauf kostet (03.10.2026).
 *
 * Anlass: hoefe_import_upsert verarbeitet 500 Zeilen in einer Transaktion. Lehnt die
 * Datenbank eine davon ab, rollt der ganze Block zurueck — und das Skript brach beim
 * ersten solchen Block ab. Am 21.09. und 28.09.2026 war das Block 1 (Constraint
 * "hoefe_lng_check"): 8591 bzw. 8602 brauchbare Hoefe gelesen, 0 geschrieben, Bestand
 * eingefroren auf dem 15.09.
 *
 * Regel jetzt: Scheitert ein Block an einem ZEILEN-Fehler, wird er Zeile fuer Zeile
 * nachgefahren. Abgelehnte Zeilen werden gezaehlt und benannt, der Rest kommt an.
 * Jeder andere Fehler (Rechte, Netz, Funktion fehlt) betrifft alle Zeilen gleich —
 * der bricht weiterhin sofort ab.
 *
 * Kein I/O in dieser Datei: `upsert` wird hereingereicht, damit vitest die Regel
 * ohne Datenbank prueft (scripts/lib/hoefe-schreiben.test.mjs).
 */

/**
 * Haengt der Fehler an einer einzelnen Zeile?
 * SQLSTATE-Klasse 22 = Datenfehler (Wert passt nicht zum Typ), 23 = Integritaets-
 * verletzung (CHECK, NOT NULL, UNIQUE). PostgREST reicht den Code unveraendert durch.
 */
export function istZeilenFehler(error) {
  return /^(22|23)/.test(String(error?.code ?? ''));
}

/** Kurzer Grund fuer die Bilanz: der Constraint-Name, sonst der Anfang der Meldung. */
export function ablehnungsGrund(error) {
  const text = String(error?.message ?? 'unbekannt');
  const m = /constraint "([^"]+)"/.exec(text);
  return m ? m[1] : text.slice(0, 80);
}

function zaehle(summe, data) {
  const r = Array.isArray(data) ? data[0] : data;
  summe.eingefuegt += r?.eingefuegt ?? 0;
  summe.aktualisiert += r?.aktualisiert ?? 0;
  summe.uebersprungen += r?.uebersprungen ?? 0;
}

/**
 * @param {object[]} hoefe   Zeilen aus hoefeMitBilanz()
 * @param {(zeilen: object[]) => Promise<{data: any, error: any}>} upsert  wie supabase.rpc()
 * @param {{chunk?: number, parallel?: number}} [o]
 * @returns {Promise<{eingefuegt: number, aktualisiert: number, uebersprungen: number,
 *                    abgelehnt: {osm_id: string, name: string, grund: string}[],
 *                    nachgefahreneBloecke: number}>}
 */
export async function schreibeHoefe(hoefe, upsert, { chunk = 500, parallel = 8 } = {}) {
  const summe = { eingefuegt: 0, aktualisiert: 0, uebersprungen: 0, abgelehnt: [], nachgefahreneBloecke: 0 };

  for (let i = 0; i < hoefe.length; i += chunk) {
    const teil = hoefe.slice(i, i + chunk);
    const { data, error } = await upsert(teil);
    if (!error) { zaehle(summe, data); continue; }
    if (!istZeilenFehler(error)) throw new Error(`Upsert Block ${i / chunk + 1}: ${error.message}`);

    // Zeilen-Fehler: der Block ist zurueckgerollt, also jede Zeile einzeln. `parallel`
    // haelt die Laufzeit im Rahmen, falls viele Bloecke betroffen sind.
    summe.nachgefahreneBloecke++;
    for (let j = 0; j < teil.length; j += parallel) {
      const antworten = await Promise.all(teil.slice(j, j + parallel).map(async (zeile) => ({ zeile, ...(await upsert([zeile])) })));
      for (const a of antworten) {
        if (!a.error) { zaehle(summe, a.data); continue; }
        if (!istZeilenFehler(a.error)) throw new Error(`Upsert ${a.zeile.osm_id}: ${a.error.message}`);
        summe.abgelehnt.push({ osm_id: a.zeile.osm_id, name: a.zeile.name, grund: ablehnungsGrund(a.error) });
      }
    }
  }
  return summe;
}

/** Abgelehnte Zeilen nach Grund gezaehlt, haeufigster zuerst — fuer Log und Job-Summary. */
export function ablehnungenNachGrund(abgelehnt) {
  const zahl = new Map();
  for (const a of abgelehnt) zahl.set(a.grund, (zahl.get(a.grund) ?? 0) + 1);
  return [...zahl.entries()].sort((a, b) => b[1] - a[1]);
}
