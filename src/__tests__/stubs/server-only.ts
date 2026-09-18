// Leerer Ersatz fuer das Paket `server-only` unter Vitest.
//
// Next liefert `server-only` als eingebauten Alias (next/dist/compiled), der im
// Client-Bundle einen Build-Fehler wirft — genau der Riegel, den fragen.ts seit
// 08.09.2026 braucht (Pruefungsloesungen nie im Browser). Vitest kennt diesen
// Alias nicht und wuerde den Import als fehlendes Paket melden. Hier passiert
// nichts; der Schutz gilt weiter dort, wo er zaehlt: im Next-Build.
export {};
